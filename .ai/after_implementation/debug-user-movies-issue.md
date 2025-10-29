# Debug: Problem z dodawaniem filmów (409 Conflict)

## Objawy
- Film dodaje się optymistycznie do UI
- Po chwili wyskakuje błąd 409 "Ten film jest już na Twojej watchliście"
- W bazie Supabase **NIE MA** żadnych rekordów w tabeli `user_movie`

## Możliwe przyczyny

### 1. Problem z `user_id` - Różne UUID w różnych miejscach
Backend używa niestandardowego systemu auth:
- Django User ma UUID `id`
- JWT zawiera `user_id` claim
- Serwis user_movies używa `_resolve_user_uuid(user)` do pobrania UUID

**Pytanie:** Czy UUID z JWT pasuje do UUID w zapytaniu do Supabase?

### 2. Zapytanie sprawdza innego użytkownika
Kod backendu (lines 147-155 w `user_movies_service.py`):
```python
existing_active = UserMovie.objects.filter(
    user_id=supabase_user_uuid,
    tconst=tconst,
    watchlisted_at__isnull=False,
    watchlist_deleted_at__isnull=True
).first()

if existing_active:
    raise ValueError("Movie is already on the watchlist")
```

### 3. Brakująca tabela `user_movie` w Supabase
Model Django ma `managed = False` - Django nie tworzy tabeli.

**Pytanie:** Czy tabela `user_movie` istnieje w Supabase?

### 4. Problem z połączeniem do Supabase
Być może Django łączy się do lokalnej bazy zamiast Supabase?

## Plan debugowania

### Krok 1: Sprawdź czy tabela istnieje
```sql
-- W Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_movie';
```

### Krok 2: Sprawdź czy są jakiekolwiek rekordy
```sql
SELECT * FROM user_movie LIMIT 10;
```

### Krok 3: Sprawdź user_id z JWT
Dodaj dodatkowy logging w `user_movies_service.py`:
```python
# W funkcji add_movie_to_watchlist, po linii 140:
supabase_user_uuid = _resolve_user_uuid(user)
logger.info(f"🔍 DEBUG: user_id from token: {supabase_user_uuid}")
logger.info(f"🔍 DEBUG: Adding movie tconst: {tconst}")

# Po linii 152:
logger.info(f"🔍 DEBUG: Checking for existing_active with user_id={supabase_user_uuid}, tconst={tconst}")
logger.info(f"🔍 DEBUG: Found existing_active: {existing_active}")
```

### Krok 4: Sprawdź czy CREATE faktycznie wykonuje się
```python
# Po linii 172 (przed create):
logger.info(f"🔍 DEBUG: Creating NEW user_movie: user_id={supabase_user_uuid}, tconst={tconst}")

# Po linii 179 (po create):
logger.info(f"🔍 DEBUG: Created user_movie with id={user_movie.id}")
```

### Krok 5: Sprawdź raw SQL query
Dodaj w settings.py logging dla SQL:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',  # Pokaże wszystkie SQL queries
            'propagate': False,
        },
    },
}
```

## Co zrobić teraz?

**Proszę wykonaj:**
1. Sprawdź w Supabase czy tabela `user_movie` istnieje
2. Jeśli istnieje - sprawdź czy są jakieś rekordy
3. Uruchom Django backend z loggingiem DEBUG
4. Spróbuj dodać film z frontendu
5. Skopiuj logi z terminala gdzie działa Django

**Poszukaj w logach:**
- `🔍 DEBUG:` - jeśli dodam logging
- `IntegrityError` lub `ValueError`
- SQL queries z `INSERT INTO user_movie`
- UUID użytkownika

Dopiero po zobaczeniu logów będę mógł dokładnie zdiagnozować problem.

