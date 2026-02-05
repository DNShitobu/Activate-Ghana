import os
from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import api_view, permission_classes, action, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.core.files.storage import default_storage
from django.utils import timezone
from django.shortcuts import redirect
import requests

from .models import (
    Job,
    Proposal,
    Milestone,
    Review,
    Notification,
    Payout,
    UserProfile,
    NotificationPreference,
    Product,
    QuoteRequest,
    ChatThread,
    ChatMessage,
)
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    EmailLoginSerializer,
    JobSerializer,
    ProposalSerializer,
    ProposalUpdateSerializer,
    MilestoneSerializer,
    MilestoneUpdateSerializer,
    ReviewSerializer,
    NotificationSerializer,
    PayoutSerializer,
    UserProfileSerializer,
    NotificationPreferenceSerializer,
    UserAdminSerializer,
    ProductSerializer,
    QuoteRequestSerializer,
    QuoteRequestUpdateSerializer,
    ChatThreadSerializer,
    ChatMessageSerializer,
)
from .throttles import LoginThrottle, SignupThrottle, PasswordResetThrottle, OAuthThrottle

User = get_user_model()
token_signer = TimestampSigner()
reset_token_generator = PasswordResetTokenGenerator()

def get_user_role(user):
    return getattr(getattr(user, "profile", None), "role", None) or user.first_name or "client"

class IsAdmin(BasePermission):
    """Simple permission to restrict to staff users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return getattr(obj, "user_id", None) == getattr(request.user, "id", None)


class IsParticipant(BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, ChatThread):
            return obj.participants.filter(id=request.user.id).exists()
        if isinstance(obj, ChatMessage):
            return obj.thread.participants.filter(id=request.user.id).exists()
        return False


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "version": "0.3.0"})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SignupThrottle])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    role = serializer.validated_data.get("role", "client")
    if role not in ["client", "expert"]:
        role = "client"
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": request.data.get("role", "client")})
    profile.email_verified = False
    profile.save()
    send_verification_email(user)
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": role,
            "username": user.username,
            "email": user.email,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    if not is_email_verified(user) and not user.is_staff:
        return Response({"detail": "Email not verified."}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    role = getattr(getattr(user, "profile", None), "role", None) or user.first_name or "client"
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "role": role, "username": user.username, "email": user.email}
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def admin_login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    if not user.is_staff:
        return Response({"detail": "Not admin"}, status=status.HTTP_403_FORBIDDEN)
    if not is_email_verified(user):
        return Response({"detail": "Email not verified."}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "role": "admin", "username": user.username, "email": user.email}
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def admin_login_email(request):
    serializer = EmailLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    if not user.is_staff:
        return Response({"detail": "Not admin"}, status=status.HTTP_403_FORBIDDEN)
    if not is_email_verified(user):
        return Response({"detail": "Email not verified."}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "role": "admin", "username": user.username, "email": user.email}
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_email(request):
    serializer = EmailLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    if not is_email_verified(user) and not user.is_staff:
        return Response({"detail": "Email not verified."}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    role = getattr(getattr(user, "profile", None), "role", None) or user.first_name or "client"
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "role": role, "username": user.username, "email": user.email}
    )

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def password_reset(request):
    email = request.data.get("email")
    if not email:
        return Response({"detail": "email required"}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({"detail": "If the email exists, a reset link was sent."})
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = reset_token_generator.make_token(user)
    reset_link = build_frontend_link("password-reset.html", {"uid": uid, "token": token})
    send_mail(
        "Reset your ACTIVATE password",
        f"Use this link to reset your password: {reset_link}",
        None,
        [user.email],
        fail_silently=True,
    )
    return Response({"detail": "Reset email sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def password_reset_confirm(request):
    uid = request.data.get("uid")
    token = request.data.get("token")
    password = request.data.get("password")
    if not uid or not token or not password:
        return Response({"detail": "uid, token, and password required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except Exception:
        return Response({"detail": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)
    if not reset_token_generator.check_token(user, token):
        return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(password)
    user.save()
    return Response({"detail": "Password updated."})


def is_email_verified(user):
    profile = getattr(user, "profile", None)
    return bool(profile and profile.email_verified)


def build_frontend_link(path, params=None):
    base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    if not base:
        base = "http://127.0.0.1:8000"
    query = ""
    if params:
        query = "?" + "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{base}/{path}{query}"


def build_backend_link(path):
    base = os.environ.get("BACKEND_URL", "").rstrip("/")
    if not base:
        base = "http://127.0.0.1:8001"
    return f"{base}/api/{path}"


def send_verification_email(user):
    token = token_signer.sign(f"{user.id}:{user.email}")
    verify_link = build_frontend_link("verify-email.html", {"token": token})
    send_mail(
        "Verify your ACTIVATE email",
        f"Verify your email: {verify_link}",
        None,
        [user.email],
        fail_silently=True,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def verify_email_request(request):
    email = request.data.get("email")
    if not email:
        return Response({"detail": "email required"}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({"detail": "If the email exists, a verification email was sent."})
    send_verification_email(user)
    return Response({"detail": "Verification email sent."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def verify_email_confirm(request):
    token = request.data.get("token")
    if not token:
        return Response({"detail": "token required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        value = token_signer.unsign(token, max_age=60 * 60 * 24)
        user_id, email = value.split(":", 1)
        user = User.objects.get(pk=user_id, email__iexact=email)
    except (BadSignature, SignatureExpired, ValueError, User.DoesNotExist):
        return Response({"detail": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": "client"})
    profile.email_verified = True
    profile.save()
    return Response({"detail": "Email verified."})


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([OAuthThrottle])
def oauth_start(request, provider):
    return Response({"redirect": f"https://auth.example.com/{provider}/start"})


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([OAuthThrottle])
def google_oauth_start(request):
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI") or build_backend_link("auth/oauth/google/callback")
    if not client_id:
        return Response({"detail": "Google OAuth not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    state = token_signer.sign("google-oauth")
    scope = "openid email profile"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&state={state}"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return redirect(auth_url)


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([OAuthThrottle])
def google_oauth_callback(request):
    error = request.query_params.get("error")
    if error:
        return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not code or not state:
        return Response({"detail": "Invalid callback"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token_signer.unsign(state, max_age=600)
    except (BadSignature, SignatureExpired):
        return Response({"detail": "Invalid state"}, status=status.HTTP_400_BAD_REQUEST)

    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI") or build_backend_link("auth/oauth/google/callback")
    if not client_id or not client_secret:
        return Response({"detail": "Google OAuth not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    if token_res.status_code != 200:
        return Response({"detail": "Token exchange failed."}, status=status.HTTP_400_BAD_REQUEST)
    token_data = token_res.json()
    access_token = token_data.get("access_token")
    if not access_token:
        return Response({"detail": "Missing access token."}, status=status.HTTP_400_BAD_REQUEST)

    userinfo_res = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if userinfo_res.status_code != 200:
        return Response({"detail": "Failed to fetch user info."}, status=status.HTTP_400_BAD_REQUEST)
    info = userinfo_res.json()
    email = info.get("email")
    if not email:
        return Response({"detail": "Email not available from Google."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        base = email.split("@")[0]
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base}{suffix}"
        user = User.objects.create_user(username=username, email=email)
        user.set_unusable_password()
        user.save()
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": "client"})
    profile.email_verified = bool(info.get("email_verified", True))
    profile.save()

    refresh = RefreshToken.for_user(user)
    role = get_user_role(user)
    redirect_url = build_frontend_link(
        "oauth-callback.html",
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": role,
            "username": user.username,
            "email": user.email,
        },
    )
    return redirect(redirect_url)


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([OAuthThrottle])
def linkedin_oauth_start(request):
    client_id = os.environ.get("LINKEDIN_CLIENT_ID")
    redirect_uri = os.environ.get("LINKEDIN_REDIRECT_URI") or build_backend_link("auth/oauth/linkedin/callback")
    if not client_id:
        return Response({"detail": "LinkedIn OAuth not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    state = token_signer.sign("linkedin-oauth")
    scope = "openid profile email"
    auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
        f"&scope={scope}"
    )
    return redirect(auth_url)


@api_view(["GET"])
@permission_classes([AllowAny])
@throttle_classes([OAuthThrottle])
def linkedin_oauth_callback(request):
    error = request.query_params.get("error")
    if error:
        return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    if not code or not state:
        return Response({"detail": "Invalid callback"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token_signer.unsign(state, max_age=600)
    except (BadSignature, SignatureExpired):
        return Response({"detail": "Invalid state"}, status=status.HTTP_400_BAD_REQUEST)

    client_id = os.environ.get("LINKEDIN_CLIENT_ID")
    client_secret = os.environ.get("LINKEDIN_CLIENT_SECRET")
    redirect_uri = os.environ.get("LINKEDIN_REDIRECT_URI") or build_backend_link("auth/oauth/linkedin/callback")
    if not client_id or not client_secret:
        return Response({"detail": "LinkedIn OAuth not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    token_res = requests.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
        },
        timeout=10,
    )
    if token_res.status_code != 200:
        return Response({"detail": "Token exchange failed."}, status=status.HTTP_400_BAD_REQUEST)
    token_data = token_res.json()
    access_token = token_data.get("access_token")
    if not access_token:
        return Response({"detail": "Missing access token."}, status=status.HTTP_400_BAD_REQUEST)

    userinfo_res = requests.get(
        "https://api.linkedin.com/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if userinfo_res.status_code != 200:
        return Response({"detail": "Failed to fetch user info."}, status=status.HTTP_400_BAD_REQUEST)
    info = userinfo_res.json()
    email = info.get("email")
    if not email:
        return Response({"detail": "Email not available from LinkedIn."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        base = email.split("@")[0]
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base}{suffix}"
        user = User.objects.create_user(username=username, email=email)
        user.set_unusable_password()
        user.save()
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={"role": "client"})
    profile.email_verified = True
    profile.save()

    refresh = RefreshToken.for_user(user)
    role = get_user_role(user)
    redirect_url = build_frontend_link(
        "oauth-callback.html",
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": role,
            "username": user.username,
            "email": user.email,
        },
    )
    return redirect(redirect_url)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    prof = getattr(request.user, "profile", None)
    return Response(
        {
            "username": request.user.username,
            "email": request.user.email,
            "role": getattr(prof, "role", request.user.first_name or "client"),
            "is_staff": request.user.is_staff,
        }
    )


class JobViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Job.objects.all().order_by("-created_at")
    serializer_class = JobSerializer

    def get_queryset(self):
        qs = Job.objects.all().order_by("-created_at")
        params = self.request.query_params
        q = params.get("q")
        location = params.get("location")
        status_param = params.get("status")
        min_budget = params.get("min_budget")
        max_budget = params.get("max_budget")
        if q:
            qs = qs.filter(models.Q(title__icontains=q) | models.Q(description__icontains=q))
        if location:
            qs = qs.filter(location__icontains=location)
        if status_param:
            qs = qs.filter(status=status_param)
        if min_budget:
            qs = qs.filter(budget__gte=min_budget)
        if max_budget:
            qs = qs.filter(budget__lte=max_budget)
        return qs

    def perform_create(self, serializer):
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            if get_user_role(self.request.user) != "client":
                raise PermissionDenied("Only clients can post jobs.")
        serializer.save(posted_by=self.request.user if self.request.user.is_authenticated else None)

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        if self.action == "destroy":
            return [IsAuthenticated()]
        return [AllowAny()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_staff and instance.posted_by != request.user:
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ProposalViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = Proposal.objects.all().select_related("job", "expert")
    serializer_class = ProposalSerializer

    def get_permissions(self):
        if self.action in ["update", "partial_update"]:
            return [IsAdmin()]
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Proposal.objects.none()
        if user.is_staff:
            return Proposal.objects.all().select_related("job", "expert")
        return Proposal.objects.filter(models.Q(expert=user) | models.Q(job__posted_by=user)).select_related("job", "expert")

    def perform_create(self, serializer):
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            if get_user_role(self.request.user) != "expert":
                raise PermissionDenied("Only experts can submit proposals.")
        serializer.save(expert=self.request.user)

    def get_serializer_class(self):
        if self.action in ["partial_update", "update"]:
            return ProposalUpdateSerializer
        return super().get_serializer_class()


class MilestoneViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = Milestone.objects.all().select_related("proposal")
    serializer_class = MilestoneSerializer

    def get_permissions(self):
        if self.action in ["partial_update", "update", "list"]:
            return [IsAdmin()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action in ["partial_update", "update"]:
            return MilestoneUpdateSerializer
        return super().get_serializer_class()


class ReviewViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Review.objects.all().select_related("author", "target")
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        if serializer.validated_data.get("target") == self.request.user:
            raise PermissionDenied("You cannot review yourself.")
        serializer.save(author=self.request.user)


class NotificationViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Notification.objects.filter(user=self.request.user).order_by("-created_at")
        return Notification.objects.none()

    def get_permissions(self):
        if self.action in ["list", "partial_update"]:
            return [IsAuthenticated()]
        return [AllowAny()]


class PayoutViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = PayoutSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Payout.objects.filter(user=self.request.user).order_by("-created_at")
        return Payout.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.is_staff and get_user_role(self.request.user) != "expert":
            raise PermissionDenied("Only experts can request payouts.")
        serializer.save(user=self.request.user)

    def get_permissions(self):
        if self.action in ["create", "list"]:
            return [IsAuthenticated()]
        return [AllowAny()]


class NotificationPreferenceViewSet(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationPreferenceSerializer

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj

    def get_permissions(self):
        return [IsAuthenticated()]


class UserProfileViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = UserProfileSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = UserProfile.objects.select_related("user").all()
        params = self.request.query_params
        role = params.get("role")
        q = params.get("q")
        verified_id = params.get("verified_id")
        verified_trade = params.get("verified_trade")
        verified_background = params.get("verified_background")
        min_rate = params.get("min_rate")
        max_rate = params.get("max_rate")
        location = params.get("location")
        if role:
            qs = qs.filter(role=role)
        if q:
            qs = qs.filter(user__username__icontains=q)
        if location:
            qs = qs.filter(location__icontains=location)
        if verified_id in ["true", "1", "yes"]:
            qs = qs.filter(verified_id=True)
        if verified_trade in ["true", "1", "yes"]:
            qs = qs.filter(verified_trade=True)
        if verified_background in ["true", "1", "yes"]:
            qs = qs.filter(verified_background=True)
        if min_rate:
            qs = qs.filter(rate_min__gte=min_rate)
        if max_rate:
            qs = qs.filter(rate_max__lte=max_rate)
        return qs

    def get_permissions(self):
        if self.action in ["partial_update", "update", "retrieve"]:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [AllowAny()]

    @action(detail=False, methods=["get", "patch"], permission_classes=[IsAuthenticated])
    def me(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user, defaults={"role": "client"})
        if request.method == "PATCH":
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
class UserViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.all().select_related("profile")
    serializer_class = UserAdminSerializer

    def get_permissions(self):
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        role = request.data.get("role", "client")
        password = request.data.get("password") or "changeme123"
        user = User.objects.create_user(
            username=request.data.get("username"),
            email=request.data.get("email", ""),
            password=password,
        )
        is_staff_flag = str(request.data.get("is_staff", "false")).lower() in ["true", "1", "yes", "on"]
        user.is_staff = is_staff_flag
        user.save()
        profile_role = role if role in ["client", "expert"] else "client"
        UserProfile.objects.get_or_create(user=user, defaults={"role": profile_role})
        serializer = self.get_serializer(user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        if not self.request.user.is_staff and get_user_role(self.request.user) not in ["client", "expert"]:
            raise PermissionDenied("Not allowed.")
        serializer.save(seller=self.request.user)

    def get_queryset(self):
        qs = Product.objects.all().order_by("-created_at")
        params = self.request.query_params
        q = params.get("q")
        category = params.get("category")
        location = params.get("location")
        min_price = params.get("min_price")
        max_price = params.get("max_price")
        seller = params.get("seller")
        if q:
            qs = qs.filter(models.Q(name__icontains=q) | models.Q(description__icontains=q))
        if category:
            qs = qs.filter(category__icontains=category)
        if location:
            qs = qs.filter(location__icontains=location)
        if seller:
            qs = qs.filter(seller__username__icontains=seller)
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not request.user.is_staff and instance.seller != request.user:
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class QuoteRequestViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = QuoteRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return QuoteRequest.objects.none()
        return QuoteRequest.objects.filter(models.Q(buyer=user) | models.Q(product__seller=user)).select_related("product", "buyer")

    def get_permissions(self):
        if self.action in ["list", "create", "partial_update", "update"]:
            return [IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

    def get_serializer_class(self):
        if self.action in ["partial_update", "update"]:
            return QuoteRequestUpdateSerializer
        return super().get_serializer_class()

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not (request.user.is_staff or instance.product.seller == request.user):
            return Response({"detail": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)


class ChatThreadViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = ChatThreadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatThread.objects.filter(participants=self.request.user).prefetch_related("participants")

    def create(self, request, *args, **kwargs):
        participant_ids = request.data.get("participant_ids", []) or []
        participant_usernames = request.data.get("participant_usernames", []) or []
        if participant_usernames:
            participant_ids = list(User.objects.filter(username__in=participant_usernames).values_list("id", flat=True)) + participant_ids
        if request.user.id not in participant_ids:
            participant_ids.append(request.user.id)
        thread = ChatThread.objects.create()
        thread.participants.set(User.objects.filter(id__in=participant_ids))
        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatMessageViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        thread_id = self.request.query_params.get("thread")
        if not thread_id:
            return ChatMessage.objects.none()
        thread = ChatThread.objects.filter(id=thread_id, participants=self.request.user).first()
        if not thread:
            return ChatMessage.objects.none()
        return ChatMessage.objects.filter(thread=thread).select_related("sender", "thread")

    def perform_create(self, serializer):
        thread_id = self.request.data.get("thread")
        thread = ChatThread.objects.filter(id=thread_id, participants=self.request.user).first()
        if not thread:
            raise PermissionDenied("Not allowed")
        serializer.save(thread=thread, sender=self.request.user)


class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > 5 * 1024 * 1024:
            return Response({"detail": "File too large (max 5MB)."}, status=status.HTTP_400_BAD_REQUEST)
        allowed = {"image/jpeg", "image/png", "application/pdf"}
        if upload.content_type not in allowed:
            return Response({"detail": "Unsupported file type."}, status=status.HTTP_400_BAD_REQUEST)
        timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
        filename = f"uploads/{request.user.id}_{timestamp}_{upload.name}"
        saved_path = default_storage.save(filename, upload)
        file_url = default_storage.url(saved_path)
        return Response({"url": request.build_absolute_uri(file_url), "path": saved_path})


# Simple seed data fallback for experts/disputes if DB empty
SEED_EXPERTS = [
    {"name": "Ama Boateng", "role": "Licensed Electrician", "location": "Accra - Madina", "rating": 4.8, "jobs": 126, "verified": True},
    {"name": "Kofi Mensah", "role": "Plumber", "location": "Kumasi - Asokwa", "rating": 4.6, "jobs": 88, "verified": True},
    {"name": "Esi Quaye", "role": "Carpenter & Joiner", "location": "Accra - Spintex", "rating": 4.9, "jobs": 140, "verified": True},
]

SEED_DISPUTES = [
    {"id": "#D-1042", "topic": "Tile quality vs spec", "status": "Under review", "action": "freeze_wallet", "amount": "GHS 3,200", "timer": "2d 4h"},
    {"id": "#D-1038", "topic": "Delayed rewiring", "status": "Split funds proposed", "action": "split_funds", "amount": "GHS 2,450", "timer": "paused"},
]

SEED_NOTIFICATIONS = [
    {"id": "n1", "type": "proposal", "text": "New proposal received", "unread": True},
    {"id": "n2", "type": "payout", "text": "Payout processed GHS 1,200", "unread": False},
    {"id": "n3", "type": "dispute", "text": "Dispute #D-1042 status updated", "unread": True},
]


@api_view(["GET"])
@permission_classes([AllowAny])
def list_experts_seed(request):
    qs = UserProfile.objects.filter(role="expert").select_related("user")
    if qs.exists():
        return Response({"data": UserProfileSerializer(qs, many=True, context={"request": request}).data})
    return Response({"data": SEED_EXPERTS})


@api_view(["GET"])
@permission_classes([AllowAny])
def list_disputes_seed(request):
    return Response({"data": SEED_DISPUTES})


@api_view(["GET"])
@permission_classes([AllowAny])
def list_notifications(request):
    return Response({"data": SEED_NOTIFICATIONS})
