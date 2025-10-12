# API Endpoint Implementation Plan: GET /api/user-movies/

## <analysis>

### 1. Kluczowe punkty specyfikacji API
- **Endpoint**: `GET /api/user-movies/`
- **Cel**: Pobranie watchlisty lub watched history zalogowanego użytkownika
- **Autentykacja**: Wymagana (JWT Bearer token)
- **Query parameters**:
  - `status` (required): 'watchlist' lub 'watched'
  - `ordering` (optional): pole do sortowania (np. `-watchlisted_at`, `-movie__avg_rating`)
  - `is_available` (optional): filtr boolean dla filmów dostępnych na platformach użytkownika
- **Response**: Lista obiektów UserMovie z nested Movie i availability info

### 2. Wymagane i opcjonalne parametry
**Wymagane**:
- Query param: `status` (watchlist | watched)

**Opcjonalne**:
- Query param: `ordering` (domyślnie: `-watchlisted_at` dla watchlist, `-watched_at` dla watched)
- Query param: `is_available` (boolean, domyślnie: None - pokazuje wszystkie)

### 3. Typy DTO i Command Modele
- **UserMovieListSerializer** (response DTO) - zawiera nested MovieSerializer i AvailabilitySerializer
- **MovieSerializer** (nested, read-only)
- **AvailabilitySerializer** (nested array, read-only)

### 4. Service Layer
- **WatchlistService.get_user_watchlist()** - pobiera aktywną watchlistę
- **WatchlistService.get_user_watched_history()** - pobiera watched history
- **AvailabilityService.get_availability_for_movies()** - pobiera info o dostępności na platformach użytkownika

### 5. Walidacja
- Walidacja `status`: musi być 'watchlist' lub 'watched' (400 Bad Request jeśli inny)
- Walidacja `ordering`: tylko dozwolone pola (whitelist), inaczej 400 Bad Request
- Walidacja `is_available`: musi być boolean ('true', 'false', '1', '0') lub brak

### 6. Błędy
- Nie ma specjalnych błędów do logowania w tabeli `integration_error_log` (to tylko read operation)
- Standardowe błędy API (401, 400)

### 7. Bezpieczeństwo
- JWT authentication required
- RLS (Row Level Security) - queryset zawsze filtrowany po `request.user`
- Brak możliwości dostępu do danych innych użytkowników

### 8. Scenariusze błędów
- **401 Unauthorized**: Brak/nieprawidłowy JWT token
- **400 Bad Request**: 
  - Brak parametru `status`
  - Nieprawidłowa wartość `status`
  - Nieprawidłowa wartość `ordering`
  - Nieprawidłowa wartość `is_available`
- **200 OK**: Sukces (nawet jeśli lista pusta - zwraca `[]`)

</analysis>

---

## 1. Przegląd punktu końcowego

**Cel**: Endpoint `GET /api/user-movies/` umożliwia zalogowanemu użytkownikowi pobranie listy filmów z jego watchlisty lub historii obejrzanych filmów. Dla każdego filmu zwracane są szczegóły filmu (tytuł, rok, rating, poster) oraz informacja o dostępności na platformach VOD subskrybowanych przez użytkownika.

**Kluczowa funkcjonalność**:
- Filtrowanie po statusie (watchlist vs watched)
- Sortowanie według różnych kryteriów (data dodania, rating filmu)
- Opcjonalne filtrowanie tylko filmów dostępnych na platformach użytkownika
- Efektywne ładowanie danych z optymalizacją N+1 queries

Ten endpoint jest **najważniejszy** w całej aplikacji MyVOD, ponieważ realizuje główną wartość biznesową - pozwala użytkownikowi zobaczyć swoją watchlistę wraz z informacją o dostępności filmów na jego platformach VOD.

## 2. Szczegóły żądania

**Metoda HTTP**: `GET`

**Struktura URL**: `/api/user-movies/`

**Headers**:
- `Authorization: Bearer <access_token>` (wymagany)
- `Content-Type: application/json`

**Query Parameters**:

| Parametr | Typ | Wymagany | Opis | Przykład |
|----------|-----|----------|------|----------|
| `status` | string | **TAK** | Status filmów do pobrania: `watchlist` lub `watched` | `?status=watchlist` |
| `ordering` | string | NIE | Pole do sortowania (prefiks `-` dla DESC). Dozwolone: `watchlisted_at`, `watched_at`, `movie__avg_rating`, `movie__start_year` | `?ordering=-movie__avg_rating` |
| `is_available` | boolean | NIE | Filtruj tylko filmy dostępne na platformach użytkownika | `?is_available=true` |

**Przykładowe requesty**:
```http
GET /api/user-movies/?status=watchlist
GET /api/user-movies/?status=watchlist&ordering=-movie__avg_rating
GET /api/user-movies/?status=watchlist&is_available=true
GET /api/user-movies/?status=watched&ordering=-watched_at
```

## 3. Wykorzystywane typy

### UserMovieListSerializer (Response DTO)
```python
{
  "id": int,
  "movie": MovieSerializer,
  "availability": [AvailabilitySerializer],
  "watchlisted_at": datetime | null,
  "watched_at": datetime | null
}
```

### MovieSerializer (Nested)
```python
{
  "tconst": string,
  "primary_title": string,
  "start_year": int | null,
  "genres": [string],
  "avg_rating": string | null,  # Decimal as string
  "poster_path": string | null
}
```

### AvailabilitySerializer (Nested Array)
```python
{
  "platform_id": int,
  "platform_name": string,
  "is_available": boolean
}
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)
```json
[
  {
    "id": 101,
    "movie": {
      "tconst": "tt0816692",
      "primary_title": "Interstellar",
      "start_year": 2014,
      "genres": ["Adventure", "Drama", "Sci-Fi"],
      "avg_rating": "8.6",
      "poster_path": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    },
    "availability": [
      {"platform_id": 1, "platform_name": "Netflix", "is_available": true},
      {"platform_id": 2, "platform_name": "HBO Max", "is_available": false}
    ],
    "watchlisted_at": "2025-10-12T10:00:00Z",
    "watched_at": null
  }
]
```

**Pusta lista** (użytkownik nie ma żadnych filmów):
```json
[]
```

### Error Responses

**401 Unauthorized** (brak/nieprawidłowy token):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**400 Bad Request** (brak parametru `status`):
```json
{
  "detail": "Query parameter 'status' is required. Must be 'watchlist' or 'watched'."
}
```

**400 Bad Request** (nieprawidłowa wartość `status`):
```json
{
  "detail": "Invalid status value. Must be 'watchlist' or 'watched'."
}
```

**400 Bad Request** (nieprawidłowe pole sortowania):
```json
{
  "detail": "Invalid ordering field. Allowed: watchlisted_at, watched_at, movie__avg_rating, movie__start_year"
}
```

## 5. Przepływ danych

### 5.1. Request Flow

```
Client
  ↓ GET /api/user-movies/?status=watchlist&is_available=true
  ↓ Header: Authorization: Bearer <token>
Django Middleware (JWT Authentication)
  ↓ Walidacja tokena → user_id
UserMovieViewSet.list()
  ↓ Walidacja query params
  ↓ Pobranie user platforms: user.platforms.all()
WatchlistService.get_user_watchlist(user, ordering)
  ↓ Query: UserMovie WHERE user_id=X AND watchlisted_at IS NOT NULL 
  ↓        AND watchlist_deleted_at IS NULL
  ↓ Optimization: .select_related('movie')
  ↓ Filtr is_available (jeśli podany)
AvailabilityService.get_availability_for_movies(tconsts, user_platforms)
  ↓ Query: MovieAvailability WHERE tconst IN (...) AND platform_id IN (...)
  ↓ Group by tconst
UserMovieListSerializer.serialize(user_movies + availability)
  ↓ Nested serialization
Response (200 OK, JSON)
```

### 5.2. Database Queries

**Query 1**: Pobierz user platforms
```sql
SELECT platform_id 
FROM user_platform 
WHERE user_id = %user_id%;
```

**Query 2**: Pobierz watchlist z movie details (optimized)
```sql
SELECT 
  um.id, um.watchlisted_at, um.watched_at,
  m.tconst, m.primary_title, m.start_year, m.genres, m.avg_rating, m.poster_path
FROM user_movie um
INNER JOIN movie m ON um.tconst = m.tconst
WHERE um.user_id = %user_id%
  AND um.watchlisted_at IS NOT NULL
  AND um.watchlist_deleted_at IS NULL
ORDER BY um.watchlisted_at DESC;
```

**Query 3**: Pobierz availability (batch)
```sql
SELECT 
  ma.movie_tconst, ma.platform_id, 
  p.platform_name, ma.is_available
FROM movie_availability ma
INNER JOIN platform p ON ma.platform_id = p.id
WHERE ma.movie_tconst IN ('tt0816692', 'tt0133093', ...)
  AND ma.platform_id IN (1, 2, 3);
```

**Total queries**: 3 (niezależnie od liczby filmów na watchliście)

### 5.3. Filtrowanie `is_available`

Jeśli `is_available=true`, dodatkowa logika filtruje tylko filmy, które mają `is_available=True` dla **przynajmniej jednej** platformy użytkownika:

```python
# Po pobraniu availability_dict
if is_available_filter:
    filtered_user_movies = []
    for um in user_movies:
        availability = availability_dict.get(um.movie.tconst, [])
        if any(item['is_available'] for item in availability):
            filtered_user_movies.append(um)
    user_movies = filtered_user_movies
```

## 6. Względy bezpieczeństwa

### 6.1. Authentication
- **JWT Token**: Endpoint wymaga ważnego JWT access token w header `Authorization: Bearer <token>`
- **Middleware**: `rest_framework_simplejwt.authentication.JWTAuthentication`
- **Expiration**: Access token ważny 1 godzinę (konfiguracja w settings.py)

### 6.2. Authorization
- **Implicit User Scoping**: Queryset zawsze filtrowany po `request.user` → użytkownik widzi tylko swoje dane
- **Row Level Security (RLS)**: Supabase/PostgreSQL RLS policies zapewniają dodatkową warstwę ochrony
- **No Direct ID Access**: Endpoint nie przyjmuje `user_id` jako parametru - zawsze używa zalogowanego użytkownika

### 6.3. Input Validation
- **Status**: Whitelist (`watchlist`, `watched`) - inne wartości → 400 Bad Request
- **Ordering**: Whitelist dozwolonych pól - zapobiega SQL injection przez ORDER BY
- **is_available**: Parsowanie boolean z walidacją typu

### 6.4. Rate Limiting
- **Recommendation**: Dodaj throttling (np. 100 requests/minute/user) przez `rest_framework.throttling.UserRateThrottle`
- **Configuration** (opcjonalne dla MVP):
```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/minute'
    }
}
```

### 6.5. Data Exposure
- **Only Necessary Fields**: Serializer zwraca tylko potrzebne pola (bez internal IDs, timestamps)
- **No Sensitive Data**: Brak danych osobowych innych użytkowników w response

## 7. Obsługa błędów

| Kod | Scenariusz | Response Body | Handling |
|-----|-----------|---------------|----------|
| **200** | Sukces (nawet pusta lista) | `[]` lub `[...]` | N/A |
| **400** | Brak parametru `status` | `{"detail": "..."}` | Walidacja w `list()` |
| **400** | Nieprawidłowy `status` | `{"detail": "..."}` | Walidacja w `list()` |
| **400** | Nieprawidłowy `ordering` | `{"detail": "..."}` | Walidacja w `list()` |
| **400** | Nieprawidłowy `is_available` | `{"detail": "..."}` | Walidacja w `list()` |
| **401** | Brak/nieprawidłowy token | `{"detail": "Authentication credentials were not provided."}` | DRF middleware |
| **500** | Database error | `{"detail": "Internal server error"}` | Try-except w view + logging |

### Error Logging

**Nie logujemy do `integration_error_log`** (to tylko read operation, brak external API calls).

**Logujemy do standardowego Django logger**:
```python
import logging

logger = logging.getLogger(__name__)

try:
    # ... query logic
except Exception as e:
    logger.error(f"Error fetching user movies: {e}", exc_info=True)
    return Response(
        {"detail": "Internal server error"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
```

## 8. Rozważania dotyczące wydajności

### 8.1. Database Optimization
- ✅ **select_related('movie')**: JOIN w jednym query (unika N+1 problem)
- ✅ **Batch availability query**: Jeden query dla wszystkich filmów
- ✅ **Indexy**: Użycie partial index `idx_active_watchlist` dla watchlist queries
- ⚠️ **Pagination**: Dla użytkowników z >100 filmami, dodaj paginację (PageNumberPagination)

### 8.2. Caching Strategy (optional)
**Cache availability data** (zmienia się rzadko):
```python
from django.core.cache import cache

cache_key = f"availability:{tconst}:{platform_ids}"
availability = cache.get(cache_key)
if not availability:
    availability = AvailabilityService.get_availability_for_movies(...)
    cache.set(cache_key, availability, timeout=3600)  # 1 hour
```

### 8.3. Response Size
- **Limit**: Domyślnie brak limitu na liczbę filmów w response
- **Recommendation**: Dodaj paginację dla watchlist >50 filmów:
```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
```

### 8.4. Query Complexity
- **Sortowanie po movie fields** (np. `movie__avg_rating`): Wymaga JOIN, ale już używamy select_related
- **Filtrowanie `is_available`**: Dodatkowa operacja in-memory (aplikacyjna), nie SQL

### 8.5. Potencjalne Bottleneck
- **Duża watchlista** (>200 filmów) + availability dla 5 platform = duży JSON response
- **Mitigation**: Paginacja + frontend infinite scroll

## 9. Etapy wdrożenia

### Faza 1: Modele i Migracje (jeśli nie istnieją)
1. **Weryfikuj modele**: `UserMovie`, `Movie`, `Platform`, `MovieAvailability`
2. **Sprawdź migracje**: `python manage.py showmigrations`
3. **Zastosuj migracje**: `python manage.py migrate`

### Faza 2: Service Layer
4. **Utwórz `backend/services/watchlist_service.py`**
   - Implementuj `WatchlistService.get_user_watchlist()`
   - Implementuj `WatchlistService.get_user_watched_history()`
   - Użyj `.select_related('movie')` dla optymalizacji

5. **Utwórz `backend/services/availability_service.py`**
   - Implementuj `AvailabilityService.get_availability_for_movies()`
   - Zwróć dict `{tconst: [availability_data]}`

### Faza 3: Serializery
6. **Utwórz `backend/apps/movies/serializers.py`** (jeśli nie istnieje)
   - Implementuj `MovieSerializer` (read-only)

7. **Utwórz `backend/apps/watchlist/serializers.py`**
   - Implementuj `AvailabilitySerializer` (Serializer, nie ModelSerializer)
   - Implementuj `UserMovieListSerializer` z nested serializers
   - Dodaj `SerializerMethodField` dla `availability`:
     ```python
     availability = serializers.SerializerMethodField()
     
     def get_availability(self, obj):
         # Użyj context['availability_dict'] przekazanego z view
         availability_dict = self.context.get('availability_dict', {})
         return availability_dict.get(obj.movie.tconst, [])
     ```

### Faza 4: Permissions
8. **Utwórz `backend/apps/watchlist/permissions.py`**
   - Implementuj `IsOwner` permission class
   - Override `has_object_permission()`

### Faza 5: ViewSet
9. **Utwórz `backend/apps/watchlist/views.py`**
   - Implementuj `UserMovieViewSet(viewsets.ModelViewSet)`
   - Override `get_queryset()` - zawsze filtruj po `request.user`
   - Override `get_serializer_class()` - różne serializery dla różnych actions
   - Implementuj `list()` method:
     ```python
     def list(self, request):
         # 1. Waliduj parametry
         status = request.query_params.get('status')
         if not status or status not in ['watchlist', 'watched']:
             return Response({"detail": "..."}, status=400)
         
         ordering = request.query_params.get('ordering', default_ordering)
         # Waliduj ordering (whitelist)
         
         is_available = request.query_params.get('is_available')
         # Parse boolean
         
         # 2. Pobierz user platforms
         user_platforms = list(request.user.userplatform_set.values_list('platform_id', flat=True))
         
         # 3. Wywołaj service
         if status == 'watchlist':
             user_movies = WatchlistService.get_user_watchlist(request.user, ordering)
         else:
             user_movies = WatchlistService.get_user_watched_history(request.user, ordering)
         
         # 4. Pobierz availability
         tconsts = [um.movie.tconst for um in user_movies]
         availability_dict = AvailabilityService.get_availability_for_movies(tconsts, user_platforms)
         
         # 5. Filtruj is_available (jeśli podane)
         if is_available is not None:
             # ... logika filtrowania
         
         # 6. Serialize
         serializer = self.get_serializer(
             user_movies, 
             many=True, 
             context={'availability_dict': availability_dict}
         )
         return Response(serializer.data)
     ```

### Faza 6: URL Routing
10. **Zarejestruj ViewSet w `backend/apps/watchlist/urls.py`**
    ```python
    from django.urls import path, include
    from rest_framework.routers import DefaultRouter
    from .views import UserMovieViewSet
    
    router = DefaultRouter()
    router.register(r'user-movies', UserMovieViewSet, basename='user-movie')
    
    urlpatterns = [
        path('', include(router.urls)),
    ]
    ```

11. **Include w `backend/myVOD/urls.py`**
    ```python
    urlpatterns = [
        path('api/', include('apps.watchlist.urls')),
        # ...
    ]
    ```

### Faza 7: Testing
12. **Unit Tests dla Services** (`backend/services/tests/test_watchlist_service.py`)
    - Test `get_user_watchlist()` z różnymi ordering
    - Test `get_user_watched_history()`
    - Test że soft-deleted items nie są zwracane

13. **Unit Tests dla Services** (`backend/services/tests/test_availability_service.py`)
    - Test `get_availability_for_movies()` grouping logic

14. **Integration Tests dla API** (`backend/apps/watchlist/tests/test_api.py`)
    - Test `GET /api/user-movies/?status=watchlist` (200 OK)
    - Test `GET /api/user-movies/?status=watched` (200 OK)
    - Test brak parametru `status` (400 Bad Request)
    - Test nieprawidłowy `status` (400 Bad Request)
    - Test nieprawidłowy `ordering` (400 Bad Request)
    - Test `is_available=true` filtruje poprawnie
    - Test brak JWT tokena (401 Unauthorized)
    - Test użytkownik widzi tylko swoje dane (not other users')
    - Test pusta watchlista zwraca `[]`

### Faza 8: Manual Testing & Documentation
15. **Test w Postman/Insomnia**
    - Utwórz kolekcję requestów
    - Test różne kombinacje query params
    - Sprawdź response times

16. **Update API Documentation** (drf-spectacular)
    - Dodaj docstringi do ViewSet methods
    - Dodaj schema annotations:
      ```python
      from drf_spectacular.utils import extend_schema, OpenApiParameter
      
      @extend_schema(
          parameters=[
              OpenApiParameter('status', str, description='watchlist or watched'),
              OpenApiParameter('ordering', str, description='Sort field'),
              OpenApiParameter('is_available', bool, description='Filter available'),
          ],
          responses={200: UserMovieListSerializer(many=True)}
      )
      def list(self, request):
          ...
      ```

### Faza 9: Code Review & Deployment
17. **Code Review**
    - Sprawdź error handling
    - Sprawdź security (RLS, JWT)
    - Sprawdź query optimization

18. **Deploy to staging**
    - Test z production-like data
    - Monitor query performance

19. **Deploy to production**
    - Monitor errors w Sentry/logging
    - Monitor response times

## 10. Uwagi dotyczące pozostałych metod

Po zaimplementowaniu `GET /api/user-movies/`, następne metody (POST, PATCH, DELETE) będą wykorzystywać:
- Ten sam ViewSet (`UserMovieViewSet`)
- Te same permissions (`IsAuthenticated`, `IsOwner`)
- Te same modele i część service layer
- Podobną strukturę error handling

Kolejność implementacji:
1. ✅ **GET** (ten dokument) - core functionality
2. 🔜 **POST** - user może dodawać filmy
3. 🔜 **PATCH** - user może zmieniać status
4. 🔜 **DELETE** - nice to have (soft delete)

## 11. Checklist przed merge do main

- [ ] Wszystkie testy przechodzą (unit + integration)
- [ ] Code coverage ≥80% dla nowego kodu
- [ ] Ruff linting bez błędów
- [ ] Type hints dla wszystkich funkcji
- [ ] Docstringi dla wszystkich public methods
- [ ] API documentation (drf-spectacular) zaktualizowana
- [ ] Manual testing w Postman zakończone sukcesem
- [ ] Code review approved przez co najmniej 1 osobę
- [ ] Brak N+1 queries (sprawdzone przez django-debug-toolbar)
- [ ] Error handling przetestowany dla wszystkich edge cases
- [ ] Security audit: JWT, RLS, input validation

