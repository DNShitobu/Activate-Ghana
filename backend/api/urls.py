from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    health,
    list_experts_seed,
    list_disputes_seed,
    signup,
    login,
    login_email,
    admin_login,
    admin_login_email,
    password_reset,
    password_reset_confirm,
    oauth_start,
    me,
    JobViewSet,
    ProposalViewSet,
    MilestoneViewSet,
    ReviewViewSet,
    NotificationViewSet,
    PayoutViewSet,
    NotificationPreferenceViewSet,
    UserProfileViewSet,
    UserViewSet,
    ProductViewSet,
    QuoteRequestViewSet,
    ChatThreadViewSet,
    ChatMessageViewSet,
    list_notifications,
    FileUploadView,
    verify_email_request,
    verify_email_confirm,
)

router = DefaultRouter()
router.register(r"jobs", JobViewSet, basename="jobs")
router.register(r"proposals", ProposalViewSet, basename="proposals")
router.register(r"milestones", MilestoneViewSet, basename="milestones")
router.register(r"reviews", ReviewViewSet, basename="reviews")
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"payouts", PayoutViewSet, basename="payouts")
router.register(r"notification-prefs", NotificationPreferenceViewSet, basename="notification-prefs")
router.register(r"profiles", UserProfileViewSet, basename="profiles")
router.register(r"users", UserViewSet, basename="users")
router.register(r"products", ProductViewSet, basename="products")
router.register(r"quotes", QuoteRequestViewSet, basename="quotes")
router.register(r"chat-threads", ChatThreadViewSet, basename="chat-threads")
router.register(r"chat-messages", ChatMessageViewSet, basename="chat-messages")

urlpatterns = [
    path("health/", health),
    path("me/", me),
    path("auth/signup/", signup),
    path("auth/login/", login),
    path("auth/login-email/", login_email),
    path("auth/admin/login/", admin_login),
    path("auth/admin/login-email/", admin_login_email),
    path("auth/password/reset/", password_reset),
    path("auth/password/reset/confirm/", password_reset_confirm),
    path("auth/email/verify/", verify_email_request),
    path("auth/email/verify/confirm/", verify_email_confirm),
    path("auth/oauth/<str:provider>/start", oauth_start),
    path("auth/jwt/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("uploads/", FileUploadView.as_view(), name="uploads"),
    path("experts/", list_experts_seed),
    path("disputes/", list_disputes_seed),
    path("notifications/", list_notifications),
] + router.urls
