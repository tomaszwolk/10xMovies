"""
Custom serializers for myVOD project.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
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
    username_field = User.EMAIL_FIELD

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

        # Try to get user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                'No active account found with the given credentials'
            )

        # Verify password
        if not user.check_password(password):
            raise serializers.ValidationError(
                'No active account found with the given credentials'
            )

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
