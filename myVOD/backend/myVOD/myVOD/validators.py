"""
Custom validators for myVOD project.
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
import re


class LettersAndNumbersValidator:
    """
    Validate that the password contains both letters and numbers.

    This validator enforces the business rule that passwords must contain
    at least one letter AND at least one number.
    """

    def validate(self, password, user=None):
        """
        Validate that password contains both letters and numbers.

        Args:
            password: The password to validate
            user: The user object (optional, not used in this validator)

        Raises:
            ValidationError: If password doesn't contain both letters and numbers
        """
        has_letter = bool(re.search(r'[a-zA-Z]', password))
        has_number = bool(re.search(r'\d', password))

        if not has_letter or not has_number:
            raise ValidationError(
                _("This password must contain both letters and numbers."),
                code='password_no_letters_or_numbers',
            )

    def get_help_text(self):
        """Return help text for this validator."""
        return _("Your password must contain both letters and numbers.")

