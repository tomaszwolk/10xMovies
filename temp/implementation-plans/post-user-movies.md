# API Endpoint Implementation Plan: POST /api/user-movies/

## <analysis>

### 1. Kluczowe punkty specyfikacji API
- **Endpoint**: `POST /api/user-movies/`
- **Cel**: Dodanie nowego filmu do watchlisty zalogowanego użytkownika
- **Autentykacja**: Wymagana (JWT Bearer token)
- **Request Body**: `{"tconst": "tt0816692"}`
- **Response**: Nowo utworzony obiekt UserMovie (201 Created)

### 2. Wymagane i opcjonalne parametry
**Wymagane**:
- Request body: `tconst` (string) - IMDb ID filmu

**Opcjonalne**:
- Brak

### 3. Typy DTO i Command Modele
- **UserMovieCreateSerializer** (request DTO) - przyjmuje `tconst`
- **UserMovieListSerializer** (response DTO) - zwraca pełny obiekt z nested Movie i availability

### 4. Service Layer
- **WatchlistService.add_to_watchlist(user, tconst)** - logika dodawania do watchlisty
- **AvailabilityService.get_availability_for_movies([tconst], user_platforms)** - dla response

### 5. Walidacja
- Walidacja `tconst`: musi istnieć w tabeli `movie` (400 Bad Request jeśli nie)
- Walidacja duplikatów: unikalność (user_id, tconst) - 409 Conflict jeśli już istnieje
- Walidacja formatu: `tconst` musi być string, format "ttXXXXXXX"

### 6. Błędy
- Nie logujemy do `integration_error_log` (brak external API calls)
- Standardowe błędy API (400, 409)

### 7. Bezpieczeństwo
- JWT authentication required
- User może dodawać tylko do swojej watchlisty (implicit user scoping)
- Walidacja czy film istnieje w bazie

### 8. Scenariusze błędów
- **401 Unauthorized**: Brak/nieprawidłowy JWT token
- **400 Bad Request**: 
  - Brak `tconst` w body
  - Film nie istnieje w bazie
  - Nieprawidłowy format `tconst`
- **409 Conflict**: Film już jest na watchliście użytkownika
- **201 Created**: Sukces

</analysis>

---

## 1. Przegląd punktu końcowego

**Cel**: Endpoint `POST /api/user-movies/` umożliwia zalogowanemu użytkownikowi dodanie nowego filmu do swojej watchlisty. Film jest identyfikowany przez `tconst` (IMDb ID). Po dodaniu, użytkownik otrzymuje pełny obiekt z informacją o dostępności filmu na jego platformach.

**Kluczowa funkcjonalność**:
- Dodawanie filmu do watchlisty
- Automatyczne ustawienie `watchlisted_at` timestamp
- Obsługa przypadku przywracania soft-deleted filmu
- Zapobieganie duplikatom (unique constraint)
- Zwracanie availability info w response

**Priorytet**: Drugi najważniejszy endpoint (po GET) - bez niego użytkownik nie może budować swojej watchlisty.

## 2. Szczegóły żądania

**Metoda HTTP**: `POST`

**Struktura URL**: `/api/user-movies/`

**Headers**:
- `Authorization: Bearer <access_token>` (wymagany)
- `Content-Type: application/json` (wymagany)

**Request Body**:

```json
{
  "tconst": "tt0816692"
}
```

| Pole | Typ | Wymagany | Opis | Przykład |
|------|-----|----------|------|----------|
| `tconst` | string | **TAK** | IMDb unique identifier dla filmu | `"tt0816692"` |

**Przykładowe requesty**:
```http
POST /api/user-movies/
Content-Type: application/json
Authorization: Bearer <token>

{
  "tconst": "tt0816692"
}
```

## 3. Wykorzystywane typy

### UserMovieCreateSerializer (Request DTO)
```python
{
  "tconst": string  # write_only, max_length=20
}
```

### UserMovieListSerializer (Response DTO)
```python
{
  "id": int,
  "movie": {
    "tconst": string,
    "primary_title": string,
    "start_year": int | null,
    "genres": [string],
    "avg_rating": string | null,
    "poster_path": string | null
  },
  "availability": [
    {
      "platform_id": int,
      "platform_name": string,
      "is_available": boolean
    }
  ],
  "watchlisted_at": datetime,
  "watched_at": null
}
```

## 4. Szczegóły odpowiedzi

### Success Response (201 Created)
```json
{
  "id": 102,
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
  "watchlisted_at": "2025-10-12T14:30:00Z",
  "watched_at": null
}
```

### Error Responses

**401 Unauthorized** (brak/nieprawidłowy token):
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**400 Bad Request** (brak pola `tconst`):
```json
{
  "tconst": ["This field is required."]
}
```

**400 Bad Request** (film nie istnieje w bazie):
```json
{
  "tconst": ["Movie with this tconst does not exist."]
}
```

**400 Bad Request** (nieprawidłowy format):
```json
{
  "tconst": ["Ensure this field has no more than 20 characters."]
}
```

**409 Conflict** (film już na watchliście):
```json
{
  "detail": "Movie is already on your watchlist."
}
```

## 5. Przepływ danych

### 5.1. Request Flow

```
Client
  ↓ POST /api/user-movies/
  ↓ Header: Authorization: Bearer <token>
  ↓ Body: {"tconst": "tt0816692"}
Django Middleware (JWT Authentication)
  ↓ Walidacja tokena → user_id
UserMovieViewSet.create()
  ↓ Walidacja request body (UserMovieCreateSerializer)
  ↓   - Sprawdź czy film istnieje
  ↓   - Sprawdź format tconst
WatchlistService.add_to_watchlist(user, tconst)
  ↓ Sprawdź czy już istnieje (get_or_create)
  ↓ Jeśli istnieje i soft-deleted → przywróć
  ↓ Jeśli istnieje i active → raise ValueError
  ↓ Jeśli nie istnieje → utwórz z watchlisted_at=now()
  ↓ Return: UserMovie object
Pobierz user platforms
AvailabilityService.get_availability_for_movies([tconst], platforms)
UserMovieListSerializer.serialize(user_movie + availability)
Response (201 Created, JSON)
```

### 5.2. Database Queries

**Query 1**: Walidacja - sprawdź czy film istnieje
```sql
SELECT COUNT(*) FROM movie WHERE tconst = 'tt0816692';
```

**Query 2**: Get or Create UserMovie
```sql
-- Django ORM wykonuje to jako transaction:
BEGIN;

-- Próba pobrania
SELECT * FROM user_movie 
WHERE user_id = %user_id% AND tconst = 'tt0816692';

-- Jeśli nie istnieje, INSERT
INSERT INTO user_movie (user_id, tconst, watchlisted_at, added_from_ai_suggestion)
VALUES (%user_id%, 'tt0816692', NOW(), false)
RETURNING *;

COMMIT;
```

**Query 3**: Pobierz movie details (dla response)
```sql
SELECT tconst, primary_title, start_year, genres, avg_rating, poster_path
FROM movie
WHERE tconst = 'tt0816692';
```

**Query 4**: Pobierz user platforms
```sql
SELECT platform_id FROM user_platform WHERE user_id = %user_id%;
```

**Query 5**: Pobierz availability
```sql
SELECT 
  ma.movie_tconst, ma.platform_id,
  p.platform_name, ma.is_available
FROM movie_availability ma
INNER JOIN platform p ON ma.platform_id = p.id
WHERE ma.movie_tconst = 'tt0816692'
  AND ma.platform_id IN (1, 2, 3);
```

**Total queries**: ~5 queries

### 5.3. Edge Case: Przywracanie Soft-Deleted

Jeśli użytkownik wcześniej usunął film z watchlisty (soft delete), a teraz chce go dodać ponownie:

```python
user_movie, created = UserMovie.objects.get_or_create(
    user=user,
    movie=movie,
    defaults={'watchlisted_at': timezone.now()}
)

if not created:
    if user_movie.watchlist_deleted_at:
        # Przywróć usuniętą pozycję
        user_movie.watchlisted_at = timezone.now()
        user_movie.watchlist_deleted_at = None
        user_movie.save()
    else:
        # Już jest na aktywnej watchliście
        raise ValueError("Movie already on watchlist")
```

## 6. Względy bezpieczeństwa

### 6.1. Authentication
- **JWT Token**: Wymagany w header `Authorization: Bearer <token>`
- **Middleware**: `rest_framework_simplejwt.authentication.JWTAuthentication`

### 6.2. Authorization
- **Implicit User Scoping**: Nowy UserMovie zawsze tworzony dla `request.user`
- **No User ID in Body**: Użytkownik nie może dodać filmu do cudzej watchlisty
- **Row Level Security**: RLS policies zapewniają dodatkową ochronę

### 6.3. Input Validation
- **tconst required**: DRF serializer waliduje obecność pola
- **Film exists**: Custom validator sprawdza czy film jest w bazie `movie`
- **Format validation**: CharField z max_length=20
- **SQL Injection**: Django ORM chroni przed SQL injection

### 6.4. Business Logic Validation
- **Unique Constraint**: Database unique constraint na (user_id, tconst)
- **IntegrityError Handling**: Catch i przekształć na 409 Conflict
- **Soft Delete Logic**: Sprawdź czy film był wcześniej usunięty

### 6.5. Rate Limiting
- **Recommendation**: Throttle do 20 POST requests/minute/user (zapobieganie spamowi)
```python
from rest_framework.throttling import UserRateThrottle

class WatchlistPostRateThrottle(UserRateThrottle):
    rate = '20/minute'
```

## 7. Obsługa błędów

| Kod | Scenariusz | Response Body | Handling |
|-----|-----------|---------------|----------|
| **201** | Sukces | Full UserMovie object | N/A |
| **400** | Brak `tconst` | `{"tconst": ["This field is required."]}` | DRF serializer |
| **400** | Film nie istnieje | `{"tconst": ["Movie with this tconst does not exist."]}` | Custom validator |
| **400** | Nieprawidłowy format | `{"tconst": ["..."]}` | DRF serializer |
| **401** | Brak/nieprawidłowy token | `{"detail": "..."}` | DRF middleware |
| **409** | Film już na watchliście | `{"detail": "Movie is already on your watchlist."}` | Service layer ValueError |
| **500** | Database error | `{"detail": "Internal server error"}` | Try-except + logging |

### Error Handling w Service Layer

```python
class WatchlistService:
    @staticmethod
    def add_to_watchlist(user, tconst: str) -> UserMovie:
        try:
            movie = Movie.objects.get(tconst=tconst)
        except Movie.DoesNotExist:
            raise ValueError("Movie not found")
        
        user_movie, created = UserMovie.objects.get_or_create(
            user=user,
            movie=movie,
            defaults={'watchlisted_at': timezone.now()}
        )
        
        if not created:
            if user_movie.watchlist_deleted_at:
                # Przywróć
                user_movie.watchlisted_at = timezone.now()
                user_movie.watchlist_deleted_at = None
                user_movie.save()
                return user_movie
            else:
                # Already active
                raise ValueError("Movie already on watchlist")
        
        return user_movie
```

### Error Handling w ViewSet

```python
def create(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    tconst = serializer.validated_data['tconst']
    
    try:
        user_movie = WatchlistService.add_to_watchlist(request.user, tconst)
    except ValueError as e:
        if "already on watchlist" in str(e):
            return Response(
                {"detail": "Movie is already on your watchlist."},
                status=status.HTTP_409_CONFLICT
            )
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Build response with availability...
    return Response(response_data, status=status.HTTP_201_CREATED)
```

## 8. Rozważania dotyczące wydajności

### 8.1. Database Optimization
- ✅ **Unique constraint**: Zapobiega duplikatom na poziomie bazy (szybkie)
- ✅ **get_or_create**: Atomic operation, jedna transakcja
- ⚠️ **Multiple queries dla response**: 5 queries - możliwe do optymalizacji

### 8.2. Optimization Opportunities
**Cache movie details** (film nie zmienia się często):
```python
from django.core.cache import cache

movie = cache.get(f"movie:{tconst}")
if not movie:
    movie = Movie.objects.get(tconst=tconst)
    cache.set(f"movie:{tconst}", movie, timeout=86400)  # 24h
```

### 8.3. Transaction Safety
Użyj transaction dla consistency:
```python
from django.db import transaction

@transaction.atomic
def add_to_watchlist(user, tconst):
    # All database operations in one transaction
    ...
```

### 8.4. Bulk Operations
Dla przyszłości - jeśli użytkownik chce dodać wiele filmów naraz:
```python
# POST /api/user-movies/bulk/
# Body: {"tconsts": ["tt0816692", "tt0133093", ...]}
UserMovie.objects.bulk_create([...], ignore_conflicts=True)
```

## 9. Etapy wdrożenia

### Faza 1: Walidacja Prerequisites
1. **Sprawdź czy GET jest zaimplementowany**
   - Potrzebujemy WatchlistService, serializerów, ViewSet
2. **Sprawdź modele**
   - UserMovie z unique constraint
   - Soft delete fields (watchlist_deleted_at)

### Faza 2: Service Layer Extension
3. **Rozszerz `backend/services/watchlist_service.py`**
   - Implementuj `WatchlistService.add_to_watchlist(user, tconst)`
   - Obsłuż get_or_create logic
   - Obsłuż przywracanie soft-deleted
   - Obsłuż ValueError dla duplikatów

### Faza 3: Serializer dla POST
4. **Rozszerz `backend/apps/watchlist/serializers.py`**
   - Sprawdź czy `UserMovieCreateSerializer` istnieje (powinien z planu GET)
   - Implementuj custom validator `validate_tconst()`:
     ```python
     def validate_tconst(self, value):
         if not Movie.objects.filter(tconst=value).exists():
             raise serializers.ValidationError(
                 "Movie with this tconst does not exist."
             )
         return value
     ```

### Faza 4: ViewSet - create() Method
5. **Rozszerz `backend/apps/watchlist/views.py`**
   - Implementuj `create()` method w `UserMovieViewSet`:
     ```python
     def create(self, request):
         # 1. Waliduj input
         serializer = UserMovieCreateSerializer(data=request.data)
         serializer.is_valid(raise_exception=True)
         tconst = serializer.validated_data['tconst']
         
         # 2. Wywołaj service
         try:
             user_movie = WatchlistService.add_to_watchlist(request.user, tconst)
         except ValueError as e:
             if "already on watchlist" in str(e).lower():
                 return Response(
                     {"detail": "Movie is already on your watchlist."},
                     status=status.HTTP_409_CONFLICT
                 )
             return Response({"detail": str(e)}, status=400)
         
         # 3. Pobierz user platforms
         user_platforms = list(
             request.user.userplatform_set.values_list('platform_id', flat=True)
         )
         
         # 4. Pobierz availability dla response
         availability_dict = AvailabilityService.get_availability_for_movies(
             [tconst], user_platforms
         )
         
         # 5. Serialize response
         response_serializer = UserMovieListSerializer(
             user_movie,
             context={'availability_dict': availability_dict, 'request': request}
         )
         
         return Response(response_serializer.data, status=status.HTTP_201_CREATED)
     ```

### Faza 5: URL Routing
6. **Sprawdź routing** (powinien być skonfigurowany z GET)
   - DefaultRouter automatycznie dodaje POST dla ViewSet
   - Nie potrzeba dodatkowej konfiguracji

### Faza 6: Testing
7. **Unit Tests dla Service** (`backend/services/tests/test_watchlist_service.py`)
   - Test `add_to_watchlist()` sukces
   - Test duplikat (active watchlist) → ValueError
   - Test przywracanie soft-deleted
   - Test film nie istnieje → Movie.DoesNotExist

8. **Integration Tests dla API** (`backend/apps/watchlist/tests/test_api.py`)
   - Test `POST /api/user-movies/` sukces (201 Created)
   - Test duplikat (409 Conflict)
   - Test przywracanie soft-deleted (201 Created)
   - Test brak `tconst` (400 Bad Request)
   - Test film nie istnieje (400 Bad Request)
   - Test brak JWT token (401 Unauthorized)
   - Test response zawiera availability info
   - Test użytkownik może dodać tylko do swojej watchlisty

### Faza 7: Manual Testing
9. **Test w Postman/Insomnia**
   - Dodaj film do watchlisty
   - Sprawdź 409 przy próbie dodania tego samego filmu
   - Usuń film (DELETE), potem dodaj ponownie (POST) - sprawdź przywracanie
   - Test z nieprawidłowym tconst
   - Test bez tokena

### Faza 8: Documentation
10. **Update API Documentation** (drf-spectacular)
    - Dodaj schema annotation dla `create()`:
      ```python
      @extend_schema(
          request=UserMovieCreateSerializer,
          responses={
              201: UserMovieListSerializer,
              400: OpenApiResponse(description='Invalid input'),
              409: OpenApiResponse(description='Movie already on watchlist'),
          }
      )
      def create(self, request):
          ...
      ```

### Faza 9: Code Review & Deployment
11. **Code Review**
    - Sprawdź error handling (wszystkie edge cases)
    - Sprawdź transaction safety
    - Sprawdź unique constraint handling

12. **Deploy to staging + production**
    - Monitor errors
    - Monitor conflict rate (409)

## 10. Uwagi dotyczące integracji

### Współpraca z GET endpoint:
- POST tworzy nowy UserMovie, który będzie widoczny w GET watchlist
- Używa tych samych serializerów dla response
- Dzieli ten sam ViewSet

### Współpraca z DELETE endpoint:
- DELETE wykonuje soft delete (ustawia `watchlist_deleted_at`)
- POST może przywrócić soft-deleted item
- Business logic: soft-deleted items nie są traktowane jako "active watchlist"

### Frontend Integration:
```typescript
// Example frontend call
const addToWatchlist = async (tconst: string) => {
  try {
    const response = await api.post('/api/user-movies/', { tconst });
    return response.data; // UserMovie with availability
  } catch (error) {
    if (error.response.status === 409) {
      // Already on watchlist
      showNotification('This movie is already on your watchlist');
    }
    throw error;
  }
};
```

## 11. Checklist przed merge do main

- [ ] Service layer `add_to_watchlist()` zaimplementowany i przetestowany
- [ ] Serializer `UserMovieCreateSerializer` z custom validator
- [ ] ViewSet `create()` method z error handling
- [ ] Unit tests dla service (≥4 test cases)
- [ ] Integration tests dla API (≥6 test cases)
- [ ] Test przywracania soft-deleted items
- [ ] Manual testing w Postman successful
- [ ] Obsługa 409 Conflict dla duplikatów
- [ ] Response zawiera availability info
- [ ] Code review approved
- [ ] Documentation (drf-spectacular) updated
- [ ] No regressions w GET endpoint

