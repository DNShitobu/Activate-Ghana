from rest_framework.throttling import SimpleRateThrottle


class BaseIPThrottle(SimpleRateThrottle):
    """Rate limit by client IP."""

    scope = "default"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return f"throttle_{self.scope}_{ident}"


class LoginThrottle(BaseIPThrottle):
    scope = "login"


class SignupThrottle(BaseIPThrottle):
    scope = "signup"


class PasswordResetThrottle(BaseIPThrottle):
    scope = "password_reset"


class OAuthThrottle(BaseIPThrottle):
    scope = "oauth"
