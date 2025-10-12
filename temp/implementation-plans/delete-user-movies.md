# API Endpoint Implementation Plan: DELETE /api/user-movies/<id>/

## <analysis>

### 1. Kluczowe punkty specyfikacji API
- **Endpoint**: `DELETE /api/user-movies/<id>/`
- **Cel**: Soft-delete filmu z watchlisty użytkownika
- **Autentykacja**: Wymagana (JWT Bearer token)
- **Request Body**: Brak (tylko URL param)
- **Response**: 204 No Content (brak body)

### 2. Wymagane i opcjonalne parametry
**Wymagane**:
- URL param: `id` (bigint) - ID UserMovie do usunięcia

**Opcjonalne**:
- Brak

### 3. Typy DTO i Command Modele
- Brak request DTO (DELETE nie ma body)
- Brak response DTO (204 No Content)

### 4. Service Layer
- **WatchlistService.soft_delete(user_movie)** - ustawia watchlist_deleted_at timestamp

### 5. Walidacja
- Walidacja `id`: musi istnieć UserMovie (404 Not Found jeśli nie)
- Walidacja ownership: tylko właściciel może usuwać (403 Forbidden)
- Business logic: soft delete (nie hard delete)

### 6. Błędy
- Nie logujemy do `integration_error_log`
- Standardowe błędy API (401, 403, 404)

### 7. Bezpieczeństwo
- JWT authentication required
- IsOwner permission - user może usuwać tylko swoje UserMovies
- Soft delete - dane nie są fizycznie usuwane (możliwość przywrócenia)

### 8. Scenariusze błędów
- **401 Unauthorized**: Brak/nieprawidłowy JWT token
- **403 Forbidden**: Użytkownik próbuje usunąć cudzy UserMovie
- **404 Not Found**: UserMovie o podanym ID nie istnieje
- **204 No Content**: Sukces (brak response body)

</analysis>

---

## 1. Przegląd punktu końcowego

**Cel**: Endpoint `DELETE /api/user-movies/<id>/` umożliwia zalogowanemu użytkownikowi usunięcie filmu ze swojej watchlisty. Implementujemy **soft delete** - film nie jest fizycznie usuwany z bazy danych, tylko oznaczany jako usunięty przez ustawienie `watchlist_deleted_at` timestamp.

**Kluczowa funkcjonalność**:
- Soft delete (zachowuje historię)
- Możliwość przywrócenia przez POST (add_to_watchlist wykrywa soft-deleted i przywraca)
- Brak response body (204 No Content)
- Autoryzacja (IsOwner permission)

**Priorytet**: Czwarty endpoint - najmniej krytyczny, ale ważny dla UX (użytkownik może popełnić błąd i chcieć usunąć film).

## 2. Szczegóły żądania

**Metoda HTTP**: `DELETE`

**Struktura URL**: `/api/user-movies/<id>/`

**URL Parameters**:
- `id` (integer, required) - ID obiektu UserMovie do usunięcia

**Headers**:
- `Authorization: Bearer <access_token>` (wymagany)

**Request Body**: Brak (DELETE nie ma body)

**Przykładowe requesty**:
```http
DELETE /api/user-movies/101/
Authorization: Bearer <token>
```

## 3. Wykorzystywane typy

### Request DTO
Brak - DELETE nie przyjmuje request body.

### Response DTO
Brak - zwracamy 204 No Content (standard REST dla DELETE).

## 4. Szczegóły odpowiedzi

### Success Response (204 No Content)
```
HTTP/1.1 204 No Content
(no body)
```

**Uwaga**: Brak response body jest standardem REST dla DELETE. Frontend powinien sprawdzić tylko status code 204.

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

**500 Internal Server Error** (database error):
```json
{
  "detail": "Internal server error"
}
```

## 5. Przepływ danych

### 5.1. Request Flow

```
Client
  ↓ DELETE /api/user-movies/101/
  ↓ Header: Authorization: Bearer <token>
Django Middleware (JWT Authentication)
  ↓ Walidacja tokena → user_id
UserMovieViewSet.destroy()
  ↓ Pobierz UserMovie object (id=101)
  ↓ Check permissions (IsOwner)
  ↓   - user_movie.user == request.user?
WatchlistService.soft_delete(user_movie)
  ↓ user_movie.watchlist_deleted_at = now()
  ↓ user_movie.save()
Response (204 No Content, empty body)
```

### 5.2. Database Queries

**Query 1**: Pobierz UserMovie (dla validation)
```sql
SELECT id, user_id, tconst, watchlist_deleted_at
FROM user_movie
WHERE id = 101;
```

**Query 2**: Soft Delete (UPDATE)
```sql
UPDATE user_movie
SET watchlist_deleted_at = NOW()
WHERE id = 101;
```

**Total queries**: 2 queries (bardzo proste operacje)

### 5.3. Soft Delete vs Hard Delete

**Soft Delete (implemented)**:
```python
user_movie.watchlist_deleted_at = timezone.now()
user_movie.save()
```

**Hard Delete (NOT implemented)**:
```python
user_movie.delete()  # Physically removes from database
```

**Dlaczego Soft Delete?**
1. **Historia**: Zachowujemy informację o tym, że użytkownik kiedyś miał ten film
2. **Analytics**: Możemy analizować, które filmy są usuwane (insights)
3. **Undo**: Użytkownik może przywrócić film przez POST (automatyczne przywracanie)
4. **Data integrity**: Nie niszczymy relacji z innymi tabelami

## 6. Względy bezpieczeństwa

### 6.1. Authentication
- **JWT Token**: Wymagany w header `Authorization: Bearer <token>`
- **Middleware**: `rest_framework_simplejwt.authentication.JWTAuthentication`

### 6.2. Authorization
- **IsOwner Permission**: Sprawdza `obj.user == request.user`
- **Permission Check**: Wykonywana PRZED soft delete
- **IDOR Protection**: Użytkownik nie może usunąć cudzego UserMovie

### 6.3. IDOR (Insecure Direct Object Reference)
Użytkownik może próbować usunąć cudzy film:
```
DELETE /api/user-movies/999/  # ID z cudzej watchlisty
```

**Ochrona**:
1. `get_queryset()` filtruje po `request.user`
2. `IsOwner` permission dodatkowa warstwa
3. Jeśli ID nie należy do użytkownika → 404 Not Found

```python
def get_queryset(self):
    # Zawsze filtruj po zalogowanym użytkowniku
    return UserMovie.objects.filter(user=self.request.user)
```

### 6.4. Idempotency
DELETE powinien być idempotentny:
- Pierwsze wywołanie: 204 No Content (soft delete)
- Drugie wywołanie tego samego ID: 404 Not Found (już soft-deleted, więc nie w queryset)

**Alternatywnie** (bardziej forgiving):
- Drugie wywołanie: 204 No Content (no-op)
- Wymaga modyfikacji `get_queryset()` do include soft-deleted

### 6.5. Rate Limiting
- **Recommendation**: Standardowy throttle (100 req/min)
- DELETE nie jest szczególnie podatny na abuse

## 7. Obsługa błędów

| Kod | Scenariusz | Response Body | Handling |
|-----|-----------|---------------|----------|
| **204** | Sukces | (empty) | N/A |
| **401** | Brak token | `{"detail": "..."}` | DRF middleware |
| **403** | Nie właściciel | `{"detail": "You do not have permission..."}` | IsOwner permission |
| **404** | UserMovie nie istnieje | `{"detail": "Not found."}` | DRF get_object_or_404 |
| **404** | Już soft-deleted | `{"detail": "Not found."}` | Queryset excludes soft-deleted |
| **500** | Database error | `{"detail": "Internal server error"}` | Try-except + logging |

### Error Handling w Service Layer

```python
class WatchlistService:
    @staticmethod
    def soft_delete(user_movie: UserMovie) -> UserMovie:
        """Soft delete filmu z watchlisty"""
        # Sprawdź czy już soft-deleted (optional - dla idempotency)
        if user_movie.watchlist_deleted_at is not None:
            # Opcja 1: No-op, zwróć success
            return user_movie
            
            # Opcja 2: Rzuć błąd
            # raise ValueError("Movie is already deleted")
        
        user_movie.watchlist_deleted_at = timezone.now()
        user_movie.save(update_fields=['watchlist_deleted_at'])
        return user_movie
```

### Error Handling w ViewSet

```python
def destroy(self, request, pk=None):
    # get_object() automatycznie:
    # - Sprawdza czy ID istnieje w queryset (404 if not)
    # - Wykonuje permission check (403 if not owner)
    user_movie = self.get_object()
    
    try:
        WatchlistService.soft_delete(user_movie)
    except Exception as e:
        logger.error(f"Error deleting UserMovie {pk}: {e}", exc_info=True)
        return Response(
            {"detail": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response(status=status.HTTP_204_NO_CONTENT)
```

## 8. Rozważania dotyczące wydajności

### 8.1. Database Optimization
- ✅ **Simple UPDATE**: Modyfikacja jednego pola (watchlist_deleted_at)
- ✅ **Primary Key Lookup**: Bardzo szybkie (indexed)
- ✅ **No CASCADE**: Soft delete nie triggeruje cascade deletes

### 8.2. Query Simplification
DELETE jest najprostszą operacją:
- Tylko 2 queries (SELECT + UPDATE)
- Nie potrzeba availability info (brak response body)
- Nie potrzeba serializacji

### 8.3. Bulk Delete (Future Enhancement)
Dla przyszłości - usuwanie wielu filmów naraz:
```python
# DELETE /api/user-movies/bulk/
# Body: {"ids": [101, 102, 103]}
UserMovie.objects.filter(
    id__in=[101, 102, 103],
    user=request.user
).update(watchlist_deleted_at=timezone.now())
```

### 8.4. Database Index
Jeśli często filtrujemy soft-deleted:
```python
# Dodaj partial index dla NOT deleted
models.Index(
    fields=['user'],
    condition=models.Q(watchlist_deleted_at__isnull=True),
    name='idx_active_user_movies'
)
```

## 9. Etapy wdrożenia

### Faza 1: Walidacja Prerequisites
1. **Sprawdź czy GET, POST, PATCH są zaimplementowane**
   - Potrzebujemy WatchlistService, ViewSet, permissions
2. **Sprawdź model UserMovie**
   - Pole `watchlist_deleted_at` (timestamptz, nullable)

### Faza 2: Service Layer Extension
3. **Rozszerz `backend/services/watchlist_service.py`**
   - Implementuj `WatchlistService.soft_delete(user_movie)`:
     ```python
     @staticmethod
     def soft_delete(user_movie: UserMovie) -> UserMovie:
         """Soft delete filmu z watchlisty"""
         user_movie.watchlist_deleted_at = timezone.now()
         user_movie.save(update_fields=['watchlist_deleted_at'])
         return user_movie
     ```

### Faza 3: ViewSet - destroy() Method
4. **Rozszerz `backend/apps/watchlist/views.py`**
   - Implementuj `destroy()` method w `UserMovieViewSet`:
     ```python
     def destroy(self, request, pk=None):
         """
         Soft delete UserMovie z watchlisty.
         Returns 204 No Content on success.
         """
         # get_object() handles:
         # - 404 if not found in queryset
         # - 403 if IsOwner permission fails
         user_movie = self.get_object()
         
         try:
             WatchlistService.soft_delete(user_movie)
         except Exception as e:
             logger.error(
                 f"Error soft deleting UserMovie {pk}: {e}",
                 exc_info=True
             )
             return Response(
                 {"detail": "Internal server error"},
                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
             )
         
         return Response(status=status.HTTP_204_NO_CONTENT)
     ```

### Faza 4: Permissions
5. **Sprawdź IsOwner permission** (`backend/apps/watchlist/permissions.py`)
   - Powinna być już zaimplementowana z GET/POST/PATCH
   - ViewSet powinien mieć `permission_classes = [IsAuthenticated, IsOwner]`

### Faza 5: QuerySet Configuration
6. **Sprawdź `get_queryset()` w ViewSet**
   - Domyślnie powinien **wykluczać** soft-deleted items:
     ```python
     def get_queryset(self):
         return UserMovie.objects.filter(
             user=self.request.user,
             watchlist_deleted_at__isnull=True  # Exclude soft-deleted
         )
     ```
   - To sprawia, że drugie DELETE tego samego ID → 404 Not Found

### Faza 6: URL Routing
7. **Sprawdź routing**
   - DefaultRouter automatycznie dodaje DELETE dla ViewSet
   - Nie potrzeba dodatkowej konfiguracji

### Faza 7: Testing
8. **Unit Tests dla Service** (`backend/services/tests/test_watchlist_service.py`)
   - Test `soft_delete()` sukces
   - Test że `watchlist_deleted_at` jest ustawiony
   - Test idempotency (opcjonalnie)

9. **Integration Tests dla API** (`backend/apps/watchlist/tests/test_api.py`)
   - Test `DELETE /api/user-movies/<id>/` sukces (204 No Content)
   - Test response nie ma body (lub jest pusty)
   - Test soft-deleted item nie pojawia się w GET watchlist
   - Test soft-deleted item można przywrócić przez POST
   - Test drugie DELETE tego samego ID (404 Not Found)
   - Test nie istniejący ID (404 Not Found)
   - Test IDOR - użytkownik A próbuje usunąć UserMovie użytkownika B (404)
   - Test brak JWT token (401 Unauthorized)

### Faza 8: Integration z POST (Przywracanie)
10. **Sprawdź logikę POST**
    - `WatchlistService.add_to_watchlist()` powinien wykrywać soft-deleted:
      ```python
      if not created and user_movie.watchlist_deleted_at:
          # Przywróć usuniętą pozycję
          user_movie.watchlisted_at = timezone.now()
          user_movie.watchlist_deleted_at = None
          user_movie.save()
      ```

### Faza 9: Manual Testing
11. **Test w Postman/Insomnia**
    - Dodaj film (POST)
    - Usuń film (DELETE) → 204 No Content
    - Sprawdź GET watchlist → film nie powinien się pojawić
    - Sprawdź w bazie → `watchlist_deleted_at` ustawiony
    - Ponownie dodaj ten sam film (POST) → powinno przywrócić (201)
    - Sprawdź GET watchlist → film ponownie widoczny
    - Test IDOR z innym user ID
    - Test bez tokena

### Faza 10: Documentation
12. **Update API Documentation** (drf-spectacular)
    - Dodaj schema annotation dla `destroy()`:
      ```python
      @extend_schema(
          responses={
              204: OpenApiResponse(description='Successfully deleted'),
              403: OpenApiResponse(description='Not owner'),
              404: OpenApiResponse(description='UserMovie not found'),
          }
      )
      def destroy(self, request, pk=None):
          ...
      ```

### Faza 11: Code Review & Deployment
13. **Code Review**
    - Sprawdź soft delete logic
    - Sprawdź IsOwner permission
    - Sprawdź integrację z POST (przywracanie)

14. **Deploy to staging + production**
    - Monitor errors
    - Monitor 404 rate (czy użytkownicy próbują usuwać nieistniejące items?)

## 10. Uwagi dotyczące integracji

### Współpraca z GET endpoint:
- Soft-deleted items **nie pojawiają się** w GET watchlist
- `get_queryset()` filtruje: `watchlist_deleted_at__isnull=True`
- GET watched history: również powinna filtrować soft-deleted (lub nie, zależy od business logic)

### Współpraca z POST endpoint:
- POST wykrywa soft-deleted items i przywraca je:
  ```python
  if user_movie.watchlist_deleted_at:
      user_movie.watchlisted_at = timezone.now()
      user_movie.watchlist_deleted_at = None
      user_movie.save()
  ```
- To daje użytkownikowi "undo" functionality

### Business Logic Flow:
```
1. POST /api/user-movies/ {tconst: "tt0816692"}
   → Created, watchlisted_at=2025-10-12T10:00:00Z

2. GET /api/user-movies/?status=watchlist
   → Returns film

3. DELETE /api/user-movies/101/
   → 204 No Content, watchlist_deleted_at=2025-10-12T12:00:00Z

4. GET /api/user-movies/?status=watchlist
   → Film NIE pojawia się

5. POST /api/user-movies/ {tconst: "tt0816692"}  # Ten sam film
   → 201 Created, watchlisted_at=2025-10-12T14:00:00Z, watchlist_deleted_at=NULL
   → Przywrócony!

6. GET /api/user-movies/?status=watchlist
   → Film ponownie widoczny
```

### Frontend Integration:
```typescript
const deleteFromWatchlist = async (userMovieId: number) => {
  await api.delete(`/api/user-movies/${userMovieId}/`);
  // No response body to parse, just check status 204
};

// With error handling
const deleteFromWatchlist = async (userMovieId: number) => {
  try {
    await api.delete(`/api/user-movies/${userMovieId}/`);
    showNotification('Movie removed from watchlist');
  } catch (error) {
    if (error.response?.status === 404) {
      showNotification('Movie not found');
    } else if (error.response?.status === 403) {
      showNotification('You cannot delete this movie');
    }
  }
};
```

## 11. Advanced: Hard Delete Option (Optional)

Jeśli w przyszłości chcemy dodać **hard delete** (permanent):

### Endpoint
```
DELETE /api/user-movies/<id>/?permanent=true
```

### Implementation
```python
def destroy(self, request, pk=None):
    user_movie = self.get_object()
    
    is_permanent = request.query_params.get('permanent', 'false').lower() == 'true'
    
    if is_permanent:
        # Hard delete - PERMANENT!
        user_movie.delete()
    else:
        # Soft delete - default
        WatchlistService.soft_delete(user_movie)
    
    return Response(status=status.HTTP_204_NO_CONTENT)
```

### Considerations:
- ⚠️ **Data Loss**: Hard delete nie można cofnąć
- ⚠️ **CASCADE**: Jeśli są relacje, mogą zostać usunięte
- ⚠️ **Analytics**: Tracimy informację o historii użytkownika
- 💡 **Use Case**: GDPR compliance (użytkownik chce całkowicie usunąć dane)

## 12. Checklist przed merge do main

- [ ] Service method `soft_delete()` zaimplementowany
- [ ] ViewSet `destroy()` method z soft delete logic
- [ ] `get_queryset()` filtruje soft-deleted items
- [ ] IsOwner permission enforcement
- [ ] Unit tests dla service (≥2 test cases)
- [ ] Integration tests dla API (≥7 test cases)
- [ ] Test IDOR protection
- [ ] Test integracji z POST (przywracanie soft-deleted)
- [ ] Test że soft-deleted nie pojawia się w GET
- [ ] Test idempotency (drugie DELETE → 404)
- [ ] Manual testing w Postman successful
- [ ] Code review approved
- [ ] Documentation (drf-spectacular) updated
- [ ] No regressions w GET/POST/PATCH endpoints

