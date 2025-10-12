# UserMovies Resource - Shared Context

Ten dokument zawiera wspólny kontekst dla wszystkich endpointów związanych z zasobem `/api/user-movies/` (GET, POST, PATCH, DELETE).

## 1. Modele Django

### UserMovie Model
**Tabela**: `user_movie`  
**Plik**: `backend/apps/watchlist/models.py`

```python
class UserMovie(models.Model):
    """
    Reprezentuje interakcję użytkownika z filmem (watchlist, watched history).
    """
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        'auth.User',
        on_delete=models.CASCADE,
        related_name='user_movies'
    )
    movie = models.ForeignKey(
        'movies.Movie',
        on_delete=models.CASCADE,
        to_field='tconst',
        related_name='user_interactions'
    )
    watchlisted_at = models.DateTimeField(null=True, blank=True)
    watchlist_deleted_at = models.DateTimeField(null=True, blank=True)
    watched_at = models.DateTimeField(null=True, blank=True)
    added_from_ai_suggestion = models.BooleanField(default=False)

    class Meta:
        db_table = 'user_movie'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'movie'],
                name='unique_user_movie'
            )
        ]
        indexes = [
            models.Index(
                fields=['user'],
                condition=models.Q(
                    watchlisted_at__isnull=False,
                    watchlist_deleted_at__isnull=True
                ),
                name='idx_active_watchlist'
            ),
            models.Index(
                fields=['user'],
                condition=models.Q(watched_at__isnull=False),
                name='idx_watched_history'
            )
        ]
```

### Movie Model
**Tabela**: `movie`  
**Plik**: `backend/apps/movies/models.py`

```python
class Movie(models.Model):
    """
    Film z bazy IMDb, wzbogacony o dane z TMDB.
    """
    tconst = models.CharField(max_length=20, primary_key=True)
    primary_title = models.CharField(max_length=500)
    original_title = models.CharField(max_length=500, null=True, blank=True)
    start_year = models.SmallIntegerField(null=True, blank=True)
    genres = models.JSONField(default=list)  # Array of strings
    avg_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=1, 
        null=True, 
        blank=True
    )
    num_votes = models.IntegerField(null=True, blank=True)
    poster_path = models.CharField(max_length=500, null=True, blank=True)
    poster_last_checked = models.DateTimeField(null=True, blank=True)
    tmdb_id = models.BigIntegerField(null=True, blank=True, unique=True)
    watchmode_id = models.BigIntegerField(null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'movie'
```

### Platform Model
**Tabela**: `platform`  
**Plik**: `backend/apps/platforms/models.py`

```python
class Platform(models.Model):
    """
    Platforma VOD (Netflix, HBO Max, etc.)
    """
    id = models.SmallAutoField(primary_key=True)
    platform_slug = models.CharField(max_length=100, unique=True)
    platform_name = models.CharField(max_length=200)

    class Meta:
        db_table = 'platform'
```

### MovieAvailability Model
**Tabela**: `movie_availability`  
**Plik**: `backend/apps/movies/models.py`

```python
class MovieAvailability(models.Model):
    """
    Dostępność filmu na platformie VOD (region: PL).
    """
    movie = models.ForeignKey(
        'Movie',
        on_delete=models.CASCADE,
        to_field='tconst',
        related_name='availability'
    )
    platform = models.ForeignKey(
        'platforms.Platform',
        on_delete=models.CASCADE,
        related_name='movie_availability'
    )
    is_available = models.BooleanField(null=True)  # Tri-state
    last_checked = models.DateTimeField()
    source = models.CharField(max_length=50)  # e.g., "watchmode"
    details = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'movie_availability'
        constraints = [
            models.UniqueConstraint(
                fields=['movie', 'platform'],
                name='unique_movie_platform'
            )
        ]
```

## 2. Serializery DRF

### MovieSerializer (Read-Only)
**Plik**: `backend/apps/movies/serializers.py`

```python
class MovieSerializer(serializers.ModelSerializer):
    """Serializer dla Movie (read-only)"""
    class Meta:
        model = Movie
        fields = [
            'tconst',
            'primary_title',
            'start_year',
            'genres',
            'avg_rating',
            'poster_path'
        ]
```

### AvailabilitySerializer (Nested)
**Plik**: `backend/apps/watchlist/serializers.py`

```python
class AvailabilitySerializer(serializers.Serializer):
    """Nested serializer dla availability info"""
    platform_id = serializers.IntegerField()
    platform_name = serializers.CharField()
    is_available = serializers.BooleanField()
```

### UserMovieListSerializer (dla GET)
**Plik**: `backend/apps/watchlist/serializers.py`

```python
class UserMovieListSerializer(serializers.ModelSerializer):
    """Serializer dla listowania user-movies (watchlist/watched)"""
    movie = MovieSerializer(read_only=True)
    availability = AvailabilitySerializer(many=True, read_only=True)
    
    class Meta:
        model = UserMovie
        fields = [
            'id',
            'movie',
            'availability',
            'watchlisted_at',
            'watched_at'
        ]
```

### UserMovieCreateSerializer (dla POST)
**Plik**: `backend/apps/watchlist/serializers.py`

```python
class UserMovieCreateSerializer(serializers.ModelSerializer):
    """Serializer dla tworzenia user-movie"""
    tconst = serializers.CharField(max_length=20, write_only=True)
    
    class Meta:
        model = UserMovie
        fields = ['tconst']
    
    def validate_tconst(self, value):
        """Sprawdź czy film istnieje w bazie"""
        if not Movie.objects.filter(tconst=value).exists():
            raise serializers.ValidationError(
                "Movie with this tconst does not exist."
            )
        return value
```

## 3. Permissions

### IsAuthenticated
Wszystkie endpointy `/api/user-movies/` wymagają uwierzytelnienia przez JWT.

**Implementacja**:
```python
from rest_framework.permissions import IsAuthenticated

permission_classes = [IsAuthenticated]
```

### IsOwner (Custom Permission)
**Plik**: `backend/apps/watchlist/permissions.py`

```python
from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    """
    Użytkownik może modyfikować tylko swoje user-movies.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
```

## 4. Service Layer

### WatchlistService
**Plik**: `backend/services/watchlist_service.py`

Centralizuje logikę biznesową dla operacji na watchliście:

```python
from typing import Optional, List
from django.db.models import Q, Prefetch
from django.utils import timezone
from apps.watchlist.models import UserMovie
from apps.movies.models import Movie, MovieAvailability

class WatchlistService:
    """Service dla operacji na watchliście użytkownika"""
    
    @staticmethod
    def get_user_watchlist(user, ordering: str = '-watchlisted_at'):
        """Pobierz aktywną watchlistę użytkownika"""
        return UserMovie.objects.filter(
            user=user,
            watchlisted_at__isnull=False,
            watchlist_deleted_at__isnull=True
        ).select_related('movie').order_by(ordering)
    
    @staticmethod
    def get_user_watched_history(user, ordering: str = '-watched_at'):
        """Pobierz historię obejrzanych filmów użytkownika"""
        return UserMovie.objects.filter(
            user=user,
            watched_at__isnull=False
        ).select_related('movie').order_by(ordering)
    
    @staticmethod
    def add_to_watchlist(user, tconst: str) -> UserMovie:
        """Dodaj film do watchlisty"""
        movie = Movie.objects.get(tconst=tconst)
        user_movie, created = UserMovie.objects.get_or_create(
            user=user,
            movie=movie,
            defaults={'watchlisted_at': timezone.now()}
        )
        
        if not created and user_movie.watchlist_deleted_at:
            # Przywróć usuniętą pozycję
            user_movie.watchlisted_at = timezone.now()
            user_movie.watchlist_deleted_at = None
            user_movie.save()
        elif not created:
            raise ValueError("Movie already on watchlist")
        
        return user_movie
    
    @staticmethod
    def mark_as_watched(user_movie: UserMovie) -> UserMovie:
        """Oznacz film jako obejrzany"""
        user_movie.watched_at = timezone.now()
        user_movie.save()
        return user_movie
    
    @staticmethod
    def restore_to_watchlist(user_movie: UserMovie) -> UserMovie:
        """Przywróć film na watchlistę"""
        user_movie.watched_at = None
        user_movie.save()
        return user_movie
    
    @staticmethod
    def soft_delete(user_movie: UserMovie) -> UserMovie:
        """Soft delete z watchlisty"""
        user_movie.watchlist_deleted_at = timezone.now()
        user_movie.save()
        return user_movie
```

### AvailabilityService
**Plik**: `backend/services/availability_service.py`

```python
class AvailabilityService:
    """Service dla sprawdzania dostępności filmów"""
    
    @staticmethod
    def get_availability_for_movies(tconsts: List[str], user_platforms: List[int]):
        """
        Pobierz dostępność filmów na platformach użytkownika.
        Zwraca dict: {tconst: [AvailabilitySerializer data]}
        """
        availability_data = MovieAvailability.objects.filter(
            movie__tconst__in=tconsts,
            platform_id__in=user_platforms
        ).select_related('platform').values(
            'movie__tconst',
            'platform_id',
            'platform__platform_name',
            'is_available'
        )
        
        # Group by tconst
        result = {}
        for item in availability_data:
            tconst = item['movie__tconst']
            if tconst not in result:
                result[tconst] = []
            result[tconst].append({
                'platform_id': item['platform_id'],
                'platform_name': item['platform__platform_name'],
                'is_available': item['is_available']
            })
        
        return result
```

## 5. Authentication & JWT

### JWT Configuration
**Plik**: `backend/myVOD/settings.py`

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### JWT Middleware
Automatyczna weryfikacja tokena w każdym request do chronionych endpointów przez `rest_framework_simplejwt.authentication.JWTAuthentication`.

## 6. ViewSet Structure

### UserMovieViewSet
**Plik**: `backend/apps/watchlist/views.py`

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class UserMovieViewSet(viewsets.ModelViewSet):
    """
    ViewSet dla zarządzania user-movies.
    
    Endpointy:
    - GET /api/user-movies/ - lista (watchlist lub watched)
    - POST /api/user-movies/ - dodaj do watchlisty
    - PATCH /api/user-movies/<id>/ - zmień status
    - DELETE /api/user-movies/<id>/ - soft delete
    """
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get_queryset(self):
        """Zawsze filtruj po zalogowanym użytkowniku"""
        return UserMovie.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserMovieListSerializer
        elif self.action == 'create':
            return UserMovieCreateSerializer
        return UserMovieSerializer
```

## 7. Database Queries - Performance Tips

### Optimize dla GET (list):
- Użyj `select_related('movie')` - łączy Movie w jednym query
- Użyj `prefetch_related()` dla availability - jeśli potrzebne nested queries
- Dla dużych list: dodaj paginację (PageNumberPagination)

### Avoid N+1 Queries:
```python
# ❌ BAD - N+1 problem
user_movies = UserMovie.objects.filter(user=user)
for um in user_movies:
    print(um.movie.primary_title)  # Każda iteracja = nowy query

# ✅ GOOD - 1 query z JOIN
user_movies = UserMovie.objects.filter(user=user).select_related('movie')
for um in user_movies:
    print(um.movie.primary_title)  # Dane już załadowane
```

## 8. Error Handling Patterns

### Standardowe response dla błędów:
```python
from rest_framework.exceptions import ValidationError, NotFound

# 400 Bad Request
raise ValidationError({"detail": "Invalid input data"})

# 404 Not Found
raise NotFound({"detail": "Movie not found"})

# 409 Conflict (custom)
return Response(
    {"detail": "Movie already on watchlist"},
    status=status.HTTP_409_CONFLICT
)
```

## 9. Testing Strategy

### Unit Tests (models):
- Test unique constraint (user, movie)
- Test soft delete logic

### Unit Tests (services):
- Test WatchlistService methods
- Test AvailabilityService grouping logic

### Integration Tests (API):
- Test GET with different filters
- Test POST duplicate handling
- Test PATCH actions
- Test DELETE (soft delete)
- Test permissions (IsOwner)

## 10. Related Documentation

- **API Plan**: `.ai/api-plan.md` (sekcja 3.3)
- **Database Schema**: `.ai/db-plan.md` (tabele: `user_movie`, `movie`, `movie_availability`)
- **Tech Stack**: `.ai/tech-stack.md`
- **PRD**: `.ai/prd.md` (RF-004: Watchlist Management)

