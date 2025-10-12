# API Endpoint Implementation Plan: PATCH /api/user-movies/<id>/

## <analysis>

### 1. Kluczowe punkty specyfikacji API
- **Endpoint**: `PATCH /api/user-movies/<id>/`
- **Cel**: Aktualizacja statusu filmu (mark as watched, restore to watchlist)
- **Autentykacja**: Wymagana (JWT Bearer token)
- **Request Body**: `{"action": "mark_as_watched"}` lub `{"action": "restore_to_watchlist"}`
- **Response**: Zaktualizowany obiekt UserMovie (200 OK)

### 2. Wymagane i opcjonalne parametry
**Wymagane**:
- URL param: `id` (bigint) - ID UserMovie do zaktualizowania
- Request body: `action` (string) - "mark_as_watched" lub "restore_to_watchlist"

**Opcjonalne**:
- Brak

### 3. Typy DTO i Command Modele
- **UserMovieActionSerializer** (request DTO) - przyjmuje `action`
- **UserMovieListSerializer** (response DTO) - zwraca pełny obiekt

### 4. Service Layer
- **WatchlistService.mark_as_watched(user_movie)** - ustawia watched_at
- **WatchlistService.restore_to_watchlist(user_movie)** - czyści watched_at
- **AvailabilityService.get_availability_for_movies([tconst], platforms)** - dla response

### 5. Walidacja
- Walidacja `id`: musi istnieć UserMovie (404 Not Found jeśli nie)
- Walidacja ownership: tylko właściciel może modyfikować (403 Forbidden)
- Walidacja `action`: tylko "mark_as_watched" lub "restore_to_watchlist" (400 Bad Request)
- Business logic: nie można mark_as_watched jeśli już watched

### 6. Błędy
- Nie logujemy do `integration_error_log`
- Standardowe błędy API (400, 403, 404)

### 7. Bezpieczeństwo
- JWT authentication required
- IsOwner permission - user może edytować tylko swoje UserMovies
- Sprawdzenie ownership przed każdą operacją

### 8. Scenariusze błędów
- **401 Unauthorized**: Brak/nieprawidłowy JWT token
- **403 Forbidden**: Użytkownik próbuje edytować cudzy UserMovie
- **404 Not Found**: UserMovie o podanym ID nie istnieje
- **400 Bad Request**: 
  - Brak `action` w body
  - Nieprawidłowa wartość `action`
  - Film już jest watched (przy mark_as_watched)
- **200 OK**: Sukces

</analysis>

---

## 1. Przegląd punktu końcowego

**Cel**: Endpoint `PATCH /api/user-movies/<id>/` umożliwia zalogowanemu użytkownikowi zmianę statusu filmu na swojej watchliście. Główne akcje to:
- **mark_as_watched**: Oznaczenie filmu jako obejrzanego (ustawia `watched_at` timestamp)
- **restore_to_watchlist**: Przywrócenie filmu na watchlistę (usuwa `watched_at` timestamp)

**Kluczowa funkcjonalność**:
- Zmiana statusu filmu między "watchlist" a "watched"
- Action-based API (nie bezpośrednia modyfikacja pól)
- Autoryzacja (IsOwner permission)
- Immutable timestamps (nie nadpisujemy `watchlisted_at`)

**Priorytet**: Trzeci endpoint - po GET i POST. Pozwala użytkownikowi zarządzać cyklem życia filmu na liście.

## 2. Szczegóły żądania

**Metoda HTTP**: `PATCH`

**Struktura URL**: `/api/user-movies/<id>/`

**URL Parameters**:
- `id` (integer, required) - ID obiektu UserMovie

**Headers**:
- `Authorization: Bearer <access_token>` (wymagany)
- `Content-Type: application/json` (wymagany)

**Request Body**:

```json
{
  "action": "mark_as_watched"
}
```

lub

```json
{
  "action": "restore_to_watchlist"
}
```

| Pole | Typ | Wymagany | Dozwolone wartości | Opis |
|------|-----|----------|-------------------|------|
| `action` | string | **TAK** | `mark_as_watched`, `restore_to_watchlist` | Akcja do wykonania |

**Przykładowe requesty**:
```http
PATCH /api/user-movies/101/
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "mark_as_watched"
}
```

```http
PATCH /api/user-movies/101/
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "restore_to_watchlist"
}
```

## 3. Wykorzystywane typy

### UserMovieActionSerializer (Request DTO)
```python
{
  "action": string  # Enum: "mark_as_watched" | "restore_to_watchlist"
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
  "watched_at": datetime | null  # Set lub null depending on action
}
```

## 4. Szczegóły odpowiedzi

### Success Response (200 OK) - mark_as_watched
```json
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
    {"platform_id": 1, "platform_name": "Netflix", "is_available": true}
  ],
  "watchlisted_at": "2025-10-12T10:00:00Z",
  "watched_at": "2025-10-12T18:45:00Z"
}
```

### Success Response (200 OK) - restore_to_watchlist
```json
{
  "id": 101,
  "movie": { ... },
  "availability": [ ... ],
  "watchlisted_at": "2025-10-12T10:00:00Z",
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

**403 Forbidden** (nie właściciel):
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found** (UserMovie nie istnieje):
```json
{
  "detail": "Not found."
}
```

**400 Bad Request** (brak action):
```json
{
  "action": ["This field is required."]
}
```

**400 Bad Request** (nieprawidłowa action):
```json
{
  "action": ["Invalid action. Must be 'mark_as_watched' or 'restore_to_watchlist'."]
}
```

**400 Bad Request** (business logic):
```json
{
  "detail": "Movie is already marked as watched."
}
```

## 5. Przepływ danych

### 5.1. Request Flow

```
Client
  ↓ PATCH /api/user-movies/101/
  ↓ Header: Authorization: Bearer <token>
  ↓ Body: {"action": "mark_as_watched"}
Django Middleware (JWT Authentication)
  ↓ Walidacja tokena → user_id
UserMovieViewSet.partial_update()
  ↓ Pobierz UserMovie object (id=101)
  ↓ Check permissions (IsOwner)
  ↓ Walidacja request body (UserMovieActionSerializer)
  ↓   - Sprawdź obecność action
  ↓   - Sprawdź czy action in allowed_actions
WatchlistService - na podstawie action:
  ├─ mark_as_watched(user_movie)
  │   ↓ user_movie.watched_at = now()
  │   ↓ user_movie.save()
  └─ restore_to_watchlist(user_movie)
      ↓ user_movie.watched_at = None
      ↓ user_movie.save()
Pobierz user platforms
AvailabilityService.get_availability_for_movies([tconst], platforms)
UserMovieListSerializer.serialize(user_movie + availability)
Response (200 OK, JSON)
```

### 5.2. Database Queries

**Query 1**: Pobierz UserMovie z Movie (dla validation i response)
```sql
SELECT 
  um.id, um.user_id, um.tconst, um.watchlisted_at, um.watched_at,
  m.primary_title, m.start_year, m.genres, m.avg_rating, m.poster_path
FROM user_movie um
INNER JOIN movie m ON um.tconst = m.tconst
WHERE um.id = 101;
```

**Query 2**: Update UserMovie
```sql
-- mark_as_watched
UPDATE user_movie
SET watched_at = NOW()
WHERE id = 101;

-- restore_to_watchlist
UPDATE user_movie
SET watched_at = NULL
WHERE id = 101;
```

**Query 3**: Pobierz user platforms
```sql
SELECT platform_id FROM user_platform WHERE user_id = %user_id%;
```

**Query 4**: Pobierz availability
```sql
SELECT 
  ma.movie_tconst, ma.platform_id,
  p.platform_name, ma.is_available
FROM movie_availability ma
INNER JOIN platform p ON ma.platform_id = p.id
WHERE ma.movie_tconst = 'tt0816692'
  AND ma.platform_id IN (1, 2, 3);
```

**Total queries**: 4 queries

### 5.3. Business Logic Rules

**mark_as_watched**:
- ✅ Film na watchlist (watchlisted_at IS NOT NULL, watchlist_deleted_at IS NULL)
- ✅ Film nie jest jeszcze watched (watched_at IS NULL)
- ❌ Film już watched → 400 Bad Request

**restore_to_watchlist**:
- ✅ Film jest watched (watched_at IS NOT NULL)
- ❌ Film nie jest watched → 400 Bad Request (opcjonalnie: zignoruj i zwróć 200)

## 6. Względy bezpieczeństwa

### 6.1. Authentication
- **JWT Token**: Wymagany w header `Authorization: Bearer <token>`
- **Middleware**: `rest_framework_simplejwt.authentication.JWTAuthentication`

### 6.2. Authorization
- **IsOwner Permission**: Custom permission sprawdza `obj.user == request.user`
- **Permission Check**: Wykonywana PRZED jakąkolwiek modyfikacją
- **404 vs 403**: Jeśli UserMovie nie należy do użytkownika → 403 Forbidden (nie 404)

### 6.3. Input Validation
- **action required**: DRF serializer waliduje obecność
- **action whitelist**: Tylko 2 dozwolone wartości
- **ID validation**: Django ORM waliduje czy ID jest integer

### 6.4. IDOR Protection
**Insecure Direct Object Reference** - użytkownik może podać dowolne ID:
```
PATCH /api/user-movies/999/  # ID z cudzej watchlisty
```

**Ochrona**:
1. `get_queryset()` filtruje po `request.user`
2. `IsOwner` permission sprawdza ownership
3. Jeśli ID nie należy do użytkownika → 404 Not Found (nie ujawniamy istnienia)

```python
def get_queryset(self):
    return UserMovie.objects.filter(user=self.request.user)
```

### 6.5. Rate Limiting
- **Recommendation**: Standardowy throttle (100 req/min)
- PATCH nie jest szczególnie podatny na abuse (wymaga istniejącego ID)

## 7. Obsługa błędów

| Kod | Scenariusz | Response Body | Handling |
|-----|-----------|---------------|----------|
| **200** | Sukces | Full UserMovie object | N/A |
| **400** | Brak `action` | `{"action": ["This field is required."]}` | DRF serializer |
| **400** | Nieprawidłowa `action` | `{"action": ["Invalid action..."]}` | Custom validator |
| **400** | Film już watched | `{"detail": "Movie is already marked as watched."}` | Service layer |
| **401** | Brak token | `{"detail": "..."}` | DRF middleware |
| **403** | Nie właściciel | `{"detail": "You do not have permission..."}` | IsOwner permission |
| **404** | UserMovie nie istnieje | `{"detail": "Not found."}` | DRF get_object_or_404 |
| **500** | Database error | `{"detail": "Internal server error"}` | Try-except + logging |

### Error Handling w Service Layer

```python
class WatchlistService:
    @staticmethod
    def mark_as_watched(user_movie: UserMovie) -> UserMovie:
        """Oznacz film jako obejrzany"""
        if user_movie.watched_at is not None:
            raise ValueError("Movie is already marked as watched")
        
        user_movie.watched_at = timezone.now()
        user_movie.save()
        return user_movie
    
    @staticmethod
    def restore_to_watchlist(user_movie: UserMovie) -> UserMovie:
        """Przywróć film na watchlistę (usuń status watched)"""
        if user_movie.watched_at is None:
            # Opcja 1: Rzuć błąd
            raise ValueError("Movie is not marked as watched")
            
            # Opcja 2 (bardziej forgiving): No-op, zwróć success
            # return user_movie
        
        user_movie.watched_at = None
        user_movie.save()
        return user_movie
```

### Error Handling w ViewSet

```python
def partial_update(self, request, pk=None):
    user_movie = self.get_object()  # Auto 404 if not found + permission check
    
    serializer = UserMovieActionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    action = serializer.validated_data['action']
    
    try:
        if action == 'mark_as_watched':
            user_movie = WatchlistService.mark_as_watched(user_movie)
        elif action == 'restore_to_watchlist':
            user_movie = WatchlistService.restore_to_watchlist(user_movie)
    except ValueError as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Build response...
    return Response(response_data, status=status.HTTP_200_OK)
```

## 8. Rozważania dotyczące wydajności

### 8.1. Database Optimization
- ✅ **select_related('movie')**: W get_object() dla jednego query
- ✅ **Single UPDATE**: Modyfikacja tylko jednego pola (watched_at)
- ✅ **Indexed lookups**: Primary key lookup (id) jest bardzo szybki

### 8.2. Avoid Unnecessary Queries
```python
# ❌ BAD - pobiera user_movie dwukrotnie
user_movie = self.get_object()
user_movie = UserMovie.objects.get(id=pk)  # Redundant!

# ✅ GOOD - jedna operacja
user_movie = self.get_object()  # Includes select_related
```

### 8.3. Optimistic Locking (Advanced)
Dla rzadkich przypadków concurrent updates:
```python
from django.db.models import F

# Update tylko jeśli watched_at nie zmienił się
updated = UserMovie.objects.filter(
    id=user_movie.id,
    watched_at__isnull=True  # Original value
).update(watched_at=timezone.now())

if not updated:
    raise ConcurrentModificationError()
```

### 8.4. Response Caching
Availability data można cache'ować (jak w GET):
```python
cache_key = f"availability:{tconst}:{'_'.join(map(str, platform_ids))}"
```

## 9. Etapy wdrożenia

### Faza 1: Walidacja Prerequisites
1. **Sprawdź czy GET i POST są zaimplementowane**
   - Potrzebujemy WatchlistService (partial), ViewSet, serializerów
2. **Sprawdź permissions**
   - IsOwner permission powinna być gotowa

### Faza 2: Service Layer Extension
3. **Rozszerz `backend/services/watchlist_service.py`**
   - Implementuj `WatchlistService.mark_as_watched(user_movie)`:
     ```python
     @staticmethod
     def mark_as_watched(user_movie: UserMovie) -> UserMovie:
         if user_movie.watched_at is not None:
             raise ValueError("Movie is already marked as watched")
         user_movie.watched_at = timezone.now()
         user_movie.save(update_fields=['watched_at'])
         return user_movie
     ```
   
   - Implementuj `WatchlistService.restore_to_watchlist(user_movie)`:
     ```python
     @staticmethod
     def restore_to_watchlist(user_movie: UserMovie) -> UserMovie:
         if user_movie.watched_at is None:
             raise ValueError("Movie is not marked as watched")
         user_movie.watched_at = None
         user_movie.save(update_fields=['watched_at'])
         return user_movie
     ```

### Faza 3: Serializer dla PATCH
4. **Rozszerz `backend/apps/watchlist/serializers.py`**
   - Implementuj `UserMovieActionSerializer`:
     ```python
     class UserMovieActionSerializer(serializers.Serializer):
         """Serializer dla akcji na UserMovie (PATCH)"""
         action = serializers.ChoiceField(
             choices=['mark_as_watched', 'restore_to_watchlist'],
             required=True
         )
     ```

### Faza 4: ViewSet - partial_update() Method
5. **Rozszerz `backend/apps/watchlist/views.py`**
   - Implementuj `partial_update()` method w `UserMovieViewSet`:
     ```python
     def partial_update(self, request, pk=None):
         # 1. Pobierz object (auto permission check)
         user_movie = self.get_object()
         
         # 2. Waliduj action
         action_serializer = UserMovieActionSerializer(data=request.data)
         action_serializer.is_valid(raise_exception=True)
         action = action_serializer.validated_data['action']
         
         # 3. Wykonaj action przez service
         try:
             if action == 'mark_as_watched':
                 user_movie = WatchlistService.mark_as_watched(user_movie)
             elif action == 'restore_to_watchlist':
                 user_movie = WatchlistService.restore_to_watchlist(user_movie)
         except ValueError as e:
             return Response(
                 {"detail": str(e)},
                 status=status.HTTP_400_BAD_REQUEST
             )
         
         # 4. Pobierz user platforms (dla response)
         user_platforms = list(
             request.user.userplatform_set.values_list('platform_id', flat=True)
         )
         
         # 5. Pobierz availability
         availability_dict = AvailabilityService.get_availability_for_movies(
             [user_movie.movie.tconst], user_platforms
         )
         
         # 6. Serialize response
         serializer = UserMovieListSerializer(
             user_movie,
             context={'availability_dict': availability_dict, 'request': request}
         )
         
         return Response(serializer.data, status=status.HTTP_200_OK)
     ```

### Faza 5: Permissions
6. **Sprawdź IsOwner permission** (`backend/apps/watchlist/permissions.py`)
   - Powinna być już zaimplementowana z GET/POST
   - ViewSet powinien mieć `permission_classes = [IsAuthenticated, IsOwner]`

### Faza 6: URL Routing
7. **Sprawdź routing**
   - DefaultRouter automatycznie dodaje PATCH dla ViewSet
   - Nie potrzeba dodatkowej konfiguracji

### Faza 7: Testing
8. **Unit Tests dla Service** (`backend/services/tests/test_watchlist_service.py`)
   - Test `mark_as_watched()` sukces
   - Test `mark_as_watched()` gdy już watched → ValueError
   - Test `restore_to_watchlist()` sukces
   - Test `restore_to_watchlist()` gdy nie watched → ValueError

9. **Integration Tests dla API** (`backend/apps/watchlist/tests/test_api.py`)
   - Test `PATCH /api/user-movies/<id>/` mark_as_watched (200 OK)
   - Test `PATCH /api/user-movies/<id>/` restore_to_watchlist (200 OK)
   - Test mark_as_watched już watched (400 Bad Request)
   - Test restore_to_watchlist nie watched (400 Bad Request)
   - Test brak `action` (400 Bad Request)
   - Test nieprawidłowa `action` (400 Bad Request)
   - Test nie istniejący ID (404 Not Found)
   - Test IDOR - użytkownik A próbuje edytować UserMovie użytkownika B (404/403)
   - Test brak JWT token (401 Unauthorized)
   - Test response zawiera updated watched_at

### Faza 8: Manual Testing
10. **Test w Postman/Insomnia**
    - Dodaj film (POST), potem mark as watched (PATCH)
    - Sprawdź watched_at timestamp w response
    - Restore to watchlist, sprawdź że watched_at=null
    - Test double mark_as_watched (400)
    - Test IDOR z innym user ID
    - Test bez tokena

### Faza 9: Documentation
11. **Update API Documentation** (drf-spectacular)
    - Dodaj schema annotation dla `partial_update()`:
      ```python
      @extend_schema(
          request=UserMovieActionSerializer,
          responses={
              200: UserMovieListSerializer,
              400: OpenApiResponse(description='Invalid action or business rule'),
              403: OpenApiResponse(description='Not owner'),
              404: OpenApiResponse(description='UserMovie not found'),
          }
      )
      def partial_update(self, request, pk=None):
          ...
      ```

### Faza 10: Code Review & Deployment
12. **Code Review**
    - Sprawdź error handling
    - Sprawdź IsOwner permission
    - Sprawdź business logic validation

13. **Deploy to staging + production**
    - Monitor errors
    - Monitor 400/403/404 rates

## 10. Uwagi dotyczące integracji

### Współpraca z GET endpoint:
- PATCH modyfikuje UserMovie, zmiany widoczne w GET
- Filmy "watched" (watched_at != NULL) pojawiają się w `GET ?status=watched`
- Filmy na watchlist (watchlisted_at != NULL, watchlist_deleted_at = NULL, watched_at = NULL) w `GET ?status=watchlist`

### Business Logic Notes:
**Co się dzieje gdy film jest watched?**
- Nadal pozostaje na watchlist (watchlisted_at nie jest czyszczony)
- W GET można pobrać go przez `?status=watched`
- Może być przywrócony na watchlist przez `restore_to_watchlist`

**Czy można mieć film jednocześnie na watchlist i watched?**
- Technicznie TAK (watched_at != NULL AND watchlisted_at != NULL)
- Logicznie: film "watched" nie jest już "to watch", więc GET ?status=watchlist go filtruje
- Przywracanie do watchlist czyści watched_at

### Frontend Integration:
```typescript
const markAsWatched = async (userMovieId: number) => {
  const response = await api.patch(`/api/user-movies/${userMovieId}/`, {
    action: 'mark_as_watched'
  });
  return response.data;
};

const restoreToWatchlist = async (userMovieId: number) => {
  const response = await api.patch(`/api/user-movies/${userMovieId}/`, {
    action: 'restore_to_watchlist'
  });
  return response.data;
};
```

## 11. Checklist przed merge do main

- [ ] Service methods `mark_as_watched()` i `restore_to_watchlist()` zaimplementowane
- [ ] Serializer `UserMovieActionSerializer` z ChoiceField
- [ ] ViewSet `partial_update()` method z action dispatcher
- [ ] IsOwner permission enforcement
- [ ] Unit tests dla service (≥4 test cases)
- [ ] Integration tests dla API (≥8 test cases)
- [ ] Test IDOR protection
- [ ] Test business logic rules (już watched, nie watched)
- [ ] Manual testing w Postman successful
- [ ] Code review approved
- [ ] Documentation (drf-spectacular) updated
- [ ] No regressions w GET/POST endpoints

