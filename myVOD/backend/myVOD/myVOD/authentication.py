from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.contrib.auth import get_user_model
import uuid


User = get_user_model()


class UUIDJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that works with UUID user IDs.

    This bypasses Django's auth_user table and creates a mock user
    with the UUID from the token.
    """

    def get_user(self, validated_token):
        """
        Resolve the authenticated Django user from JWT.

        - Expects 'user_id' claim to be a UUID string
        - Loads users.User from DB and validates is_active
        """
        user_id_claim = validated_token.get('user_id')
        if not user_id_claim:
            raise InvalidToken('Token contained no recognizable user identification')

        try:
            user_uuid = uuid.UUID(str(user_id_claim))
        except Exception:
            raise InvalidToken('Token user_id is not a valid UUID')

        try:
            user = User.objects.get(id=user_uuid)
        except User.DoesNotExist:
            raise InvalidToken('User not found')

        if not getattr(user, 'is_active', True):
            raise InvalidToken('User account is disabled')

        return user
