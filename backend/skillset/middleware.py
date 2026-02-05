from django.conf import settings


class ContentSecurityPolicyMiddleware:
    """Attach CSP headers to responses (API + admin)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        policy = getattr(settings, "CSP_POLICY", "")
        if policy:
            response["Content-Security-Policy"] = policy
        return response
