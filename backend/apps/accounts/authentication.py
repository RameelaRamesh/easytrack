from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .session_store import is_session_valid

class SingleSessionJWTAuthentication(JWTAuthentication):
    """
    Standard JWT Authentication allowing multi-tab and multi-window access.
    """
    def authenticate(self, request):
        auth_result = super().authenticate(request)
        if auth_result is None:
            return None

        user, validated_token = auth_result
        return user, validated_token
