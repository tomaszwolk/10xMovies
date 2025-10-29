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
        # Handle both UUID strings and regular IDs
        if isinstance(user_id, str) and len(user_id) == 36 and '-' in user_id:
            # It's a UUID string, convert to UUID object
            self.id = uuid.UUID(user_id)
        else:
            # It's a regular ID, keep as string but create UUID-like identifier
            # For backward compatibility, we'll create a UUID from string
            self.id = str(user_id)  # Keep as string for now

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

            # Debug: print user_id to see what we're getting
            print(f"UUIDJWTAuthentication: user_id from token: {repr(user_id)}")

            # Create mock user with UUID
            return MockUser(user_id, email)

        except Exception as e:
            raise InvalidToken(f'Token is invalid or expired: {str(e)}')
