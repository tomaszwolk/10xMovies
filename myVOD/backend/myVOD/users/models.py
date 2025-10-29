import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model with UUID primary key.

    - Keeps Django's traditional username field for compatibility
      (we authenticate by email in the token view).
    - Enforces unique email at the DB level for consistency.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, blank=False)

    def __str__(self) -> str:
        return f"{self.email or self.username}"

