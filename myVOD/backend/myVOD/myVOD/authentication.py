from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
import uuid


class MockUser:
    """
    Mock user object for JWT authentication with UUID.

    Since we use Supabase Auth with UUID primary keys,
    we don't use Django's auth_user table.
    """
    def __init__(self, user_id, email=None):
        self.id = user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(user_id)
        self.email = email or f"user-{user_id}@example.com"
        self.is_authenticated = True
        self.is_active = True
        self.is_staff = False
        self.is_superuser = False

    def __str__(self):
        return f"MockUser({self.id})"

    def __repr__(self):
        return self.__str__()


class UUIDJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that works with UUID user IDs.

    This bypasses Django's auth_user table and creates a mock user
    with the UUID from the token.
    """

    def get_user(self, validated_token):
        """
        Get user from validated token.

        Instead of querying Django's auth_user table,
        we create a mock user with UUID from token.
        """
        try:
            user_id = validated_token.get('user_id')
            email = validated_token.get('email')

            if not user_id:
                raise InvalidToken('Token contained no recognizable user identification')

            # Create mock user with UUID
            return MockUser(user_id, email)

        except Exception as e:
            raise InvalidToken(f'Token is invalid or expired: {str(e)}')
