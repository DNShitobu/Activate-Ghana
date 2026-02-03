from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

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

User = get_user_model()

class IsAdmin(BasePermission):
    """Simple permission to restrict to staff users."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


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
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    role = serializer.validated_data.get("role", "client")
    if role not in ["client", "expert"]:
        role = "client"
    UserProfile.objects.get_or_create(user=user, defaults={"role": request.data.get("role", "client")})
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
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    refresh = RefreshToken.for_user(user)
    role = getattr(getattr(user, "profile", None), "role", None) or user.first_name or "client"
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "role": role, "username": user.username, "email": user.email}
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    if not user.is_staff:
        return Response({"detail": "Not admin"}, status=status.HTTP_403_FORBIDDEN)
    refresh = RefreshToken.for_user(user)
    return Response(
        {"access": str(refresh.access_token), "refresh": str(refresh), "role": "admin", "username": user.username, "email": user.email}
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset(request):
    email = request.data.get("email")
    if not email:
        return Response({"detail": "email required"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({"detail": "Reset email sent (stub)"})


@api_view(["GET"])
@permission_classes([AllowAny])
def oauth_start(request, provider):
    return Response({"redirect": f"https://auth.example.com/{provider}/start"})

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


class JobViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Job.objects.all().order_by("-created_at")
    serializer_class = JobSerializer

    def perform_create(self, serializer):
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


class ProductViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

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
        return Response({"data": UserProfileSerializer(qs, many=True).data})
    return Response({"data": SEED_EXPERTS})


@api_view(["GET"])
@permission_classes([AllowAny])
def list_disputes_seed(request):
    return Response({"data": SEED_DISPUTES})


@api_view(["GET"])
@permission_classes([AllowAny])
def list_notifications(request):
    return Response({"data": SEED_NOTIFICATIONS})
