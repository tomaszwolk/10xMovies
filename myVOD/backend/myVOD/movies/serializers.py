"""
Serializers for movies app.

This module contains serializers for movie-related API endpoints.
"""
from rest_framework import serializers
from .models import Movie, MovieAvailability, Platform


class MovieSearchQueryParamsSerializer(serializers.Serializer):
    """
    Serializer for validating query parameters for movie search endpoint.

    Query Parameters:
        search (str): Search query for movie title (required, min 1 char)
    """
    search = serializers.CharField(
        required=True,
        min_length=1,
        max_length=255,
        error_messages={
            'required': 'Search parameter is required.',
            'blank': 'Search parameter cannot be blank.',
            'min_length': 'Search query must be at least 1 character long.',
            'max_length': 'Search query cannot exceed 255 characters.'
        }
    )


class PlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = Platform
        fields = ['platform_slug', 'platform_name']


class MovieAvailabilitySerializer(serializers.ModelSerializer):
    platform = PlatformSerializer(read_only=True)

    class Meta:
        model = MovieAvailability
        fields = ['platform', 'is_available', 'last_checked', 'source', 'details']


class MovieSearchResultSerializer(serializers.ModelSerializer):
    """
    Serializer for movie search results.

    This maps to MovieSearchResultDto on the frontend.
    Returns a lightweight subset of Movie fields optimized for search suggestions.

    Fields:
        - tconst: IMDb identifier
        - primary_title: Movie title
        - start_year: Release year
        - avg_rating: Average rating (converted to string for API consistency)
        - poster_path: URL to movie poster
    """
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = ['tconst', 'primary_title', 'start_year', 'avg_rating', 'poster_path', 'num_votes']

    def get_avg_rating(self, obj):
        """
        Convert avg_rating to string format for API consistency.

        Returns:
            str | None: Rating as string (e.g., "8.6") or None if not available
        """
        if obj.avg_rating is not None:
            return str(obj.avg_rating)
        return None
