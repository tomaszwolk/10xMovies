"""
Custom serializers for myVOD project.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from movies.models import Platform

User = get_user_model()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that uses email instead of username for authentication.

    This overrides the default TokenObtainPairSerializer to accept 'email'
    field instead of 'username' field, matching the PRD specification.
    """

    email = serializers.CharField(required=True)
    password = serializers.CharField(required=True)
    username_field = User.EMAIL_FIELD if hasattr(User, 'EMAIL_FIELD') else 'username'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove the default 'username' field
        if 'username' in self.fields:
            del self.fields['username']

    def validate(self, attrs):
        """
        Authenticate using email instead of username.
        """
        email = attrs.get('email')
        password = attrs.get('password')

        # Authenticate using email; fallback to username if needed
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=email)
            except User.DoesNotExist:
                raise serializers.ValidationError('No active account found with the given credentials')

        if not user.check_password(password):
            raise serializers.ValidationError('No active account found with the given credentials')

        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError(
                'User account is disabled'
            )

        # Get tokens
        refresh = self.get_token(user)

        data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }

        return data


class PlatformSerializer(serializers.ModelSerializer):
    """
    Serializer for Platform model.

    This maps to PlatformDto on the frontend.
    Returns all platform information for public display.

    Fields:
        - id: Platform unique identifier
        - platform_slug: URL-friendly slug (e.g., "netflix")
        - platform_name: User-friendly name (e.g., "Netflix")
    """

    class Meta:
        model = Platform
        fields = ['id', 'platform_slug', 'platform_name']


class UserProfileSerializer(serializers.Serializer):
    """
    Serializer for user profile response.

    This maps to UserProfileDto on the frontend.
    Returns authenticated user's email and their selected VOD platforms.

    Response for GET /api/me/
    """
    email = serializers.EmailField()
    platforms = PlatformSerializer(many=True, read_only=True)


class UpdateUserProfileSerializer(serializers.Serializer):
    """
    Serializer for updating user profile.

    This maps to UpdateUserProfileCommand on the frontend.
    Validates the platform IDs provided in the request body.

    Request body for PATCH /api/me/
    """
    platforms = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=True,
        allow_empty=True,
        help_text="List of platform IDs to associate with the user"
    )

    def validate_platforms(self, value):
        """
        Validate that all platform IDs exist in the database.

        Args:
            value: List of platform IDs

        Returns:
            List of validated platform IDs

        Raises:
            ValidationError: If any platform ID doesn't exist
        """
        if not value:
            # Empty list is valid - user wants to remove all platforms
            return value

        # Check for duplicates
        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                "Platform IDs must be unique"
            )

        # Verify all platform IDs exist
        existing_platform_ids = set(
            Platform.objects.filter(id__in=value).values_list('id', flat=True)
        )

        invalid_ids = set(value) - existing_platform_ids
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid platform IDs: {sorted(invalid_ids)}"
            )

        return value


class RegisterUserSerializer(serializers.Serializer):
    """
    Serializer for user registration request.

    This maps to RegisterUserCommand on the frontend.
    Validates email format and password strength requirements.

    Request body for POST /api/register/

    Password Requirements:
        - Minimum 8 characters
        - Must contain both letters and numbers
        - Must not be too similar to user attributes
        - Must not be a commonly used password
    """
    email = serializers.EmailField(
        required=True,
        help_text="User's email address (must be unique)"
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text="Password (minimum 8 characters, must contain letters and numbers)"
    )

    def validate_email(self, value):
        """
        Validate that email is unique.

        Args:
            value: Email address to validate

        Returns:
            Validated email address (normalized to lowercase)

        Raises:
            ValidationError: If email already exists
        """
        # Normalize email to lowercase for consistency
        email = value.lower()

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                "A user with this email already exists"
            )

        return email

    def validate_password(self, value):
        """
        Validate password meets security requirements.

        Uses Django's password validation framework to enforce:
        - Minimum length (8 characters)
        - Contains letters and numbers
        - Not too similar to user attributes
        - Not a commonly used password

        Args:
            value: Password to validate

        Returns:
            Validated password

        Raises:
            ValidationError: If password doesn't meet requirements
        """
        try:
            # Use Django's password validators
            # Note: We pass None for user since user doesn't exist yet
            validate_password(value, user=None)
        except DjangoValidationError as e:
            # Convert Django ValidationError to DRF ValidationError
            raise serializers.ValidationError(list(e.messages))

        return value


class RegisteredUserSerializer(serializers.Serializer):
    """
    Serializer for user registration response.

    This maps to RegisteredUserDto on the frontend.
    Returns only non-sensitive user information after successful registration.

    Response for POST /api/register/
    """
    email = serializers.EmailField(
        read_only=True,
        help_text="Registered user's email address"
    )


class MovieAvailabilitySerializer(serializers.Serializer):
    """
    Serializer for movie availability on a specific platform.

    This maps to MovieAvailabilityDto on the frontend.
    Used in AI suggestions and user movie responses.

    Fields:
        - platform_id: Platform unique identifier
        - platform_name: User-friendly platform name
        - is_available: Boolean indicating if movie is available on this platform
    """
    platform_id = serializers.IntegerField()
    platform_name = serializers.CharField()
    is_available = serializers.BooleanField()


class SuggestionItemSerializer(serializers.Serializer):
    """
    Serializer for a single AI-generated movie suggestion.

    This maps to SuggestionItemDto on the frontend.
    Nested within AISuggestionsSerializer.

    Fields:
        - tconst: IMDb movie identifier
        - primary_title: Movie title
        - start_year: Release year
        - justification: AI-generated reason for the suggestion
        - availability: List of platform availability information
    """
    tconst = serializers.CharField()
    primary_title = serializers.CharField()
    start_year = serializers.IntegerField(allow_null=True)
    justification = serializers.CharField()
    availability = MovieAvailabilitySerializer(many=True)


class AISuggestionsSerializer(serializers.Serializer):
    """
    Serializer for AI movie suggestions response.

    This maps to AISuggestionsDto on the frontend.
    Returns a batch of AI-generated movie suggestions with expiration time.

    Response for GET /api/suggestions/

    Fields:
        - expires_at: ISO 8601 timestamp when suggestions expire (end of day)
        - suggestions: List of suggested movies with justifications and availability
    """
    expires_at = serializers.DateTimeField()
    suggestions = SuggestionItemSerializer(many=True)
