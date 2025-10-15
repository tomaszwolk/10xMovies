"""
Custom serializers for myVOD project.
"""

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that uses email instead of username for authentication.

    This overrides the default TokenObtainPairSerializer to accept 'email'
    field instead of 'username' field, matching the PRD specification.
    """

    username_field = User.EMAIL_FIELD

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Replace 'username' field with 'email' field
        self.fields[self.username_field] = self.fields.pop('username')

