"""
Views for myVOD project root.
"""

from django.shortcuts import redirect
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import EmailTokenObtainPairSerializer


def root_redirect(request):
    """
    Redirect root URL to API documentation.

    Users visiting http://localhost:8000/ will be redirected to
    http://localhost:8000/api/docs/ (Swagger UI).
    """
    return redirect('swagger-ui')


class EmailTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view that uses email instead of username.

    This view uses EmailTokenObtainPairSerializer to accept 'email' field
    for authentication instead of the default 'username' field.
    """
    serializer_class = EmailTokenObtainPairSerializer

