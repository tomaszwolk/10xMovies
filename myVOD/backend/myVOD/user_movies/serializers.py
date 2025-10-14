from rest_framework import serializers
from movies.models import Movie, MovieAvailability, UserMovie


class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = [
            "tconst",
            "primary_title",
            "start_year",
            "genres",
            "avg_rating",
            "poster_path",
        ]


class MovieAvailabilitySerializer(serializers.ModelSerializer):
    platform_name = serializers.CharField(source="platform.platform_name")

    class Meta:
        model = MovieAvailability
        fields = ["platform_id", "platform_name", "is_available"]


class UserMovieSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(source="tconst")
    availability = MovieAvailabilitySerializer(many=True, read_only=True, source="availability_filtered")

    class Meta:
        model = UserMovie
        fields = ["id", "movie", "availability", "watchlisted_at", "watched_at"]


class UserMovieQueryParamsSerializer(serializers.Serializer):
    """Validates query parameters for GET /api/user-movies/.

    - status: required, one of ['watchlist', 'watched']
    - ordering: optional, allow-listed fields
    - is_available: optional boolean
    """

    status = serializers.ChoiceField(choices=["watchlist", "watched"], required=True)
    ordering = serializers.ChoiceField(
        choices=["-watchlisted_at", "-tconst__avg_rating"], required=False
    )
    is_available = serializers.BooleanField(required=False)
