# Dokumentacja implementacji - Lekcje i nieścisłości

## Przegląd
Ten dokument zawiera wszystkie nieścisłości, pułapki i lekcje wyniesione z implementacji widoku Onboarding Add View. Celem jest uniknięcie tych samych problemów w przyszłych implementacjach.

---

## 1. Django Models z `managed = False`

### Problem
Model Django z `managed = False` i `unique_together` w Meta może powodować mylące błędy.

### Szczegóły
```python
class UserMovie(models.Model):
    # ... fields ...
    
    class Meta:
        managed = False
        db_table = 'user_movie'
        unique_together = (('user_id', 'tconst'),)  # ❌ PROBLEM
```

**Co się działo:**
- Django NIE tworzy tabeli ani constraints (bo `managed = False`)
- ALE `unique_together` może być używane przez Django do walidacji w pamięci
- To może prowadzić do niejasnych błędów gdy constraint jest w bazie ale Django go nie widzi

### Rozwiązanie
```python
class UserMovie(models.Model):
    # ... fields ...
    
    class Meta:
        managed = False
        db_table = 'user_movie'
        # Note: unique constraint on (user_id, tconst) is enforced at database level
        # Don't define unique_together here as it can cause issues with managed=False
```

**Zasada:** Gdy używasz `managed = False`, **NIE definiuj** `unique_together`, `indexes` ani innych Meta opcji związanych ze strukturą bazy. Constraint powinien być tylko w bazie danych.

---

## 2. Foreign Key Constraints po migracji systemu Auth

### Problem
Po migracji z Supabase Auth (`auth.users`) do Django Auth (`public.users_user`), stare foreign key constraints mogą wskazywać na nieistniejące lub niewłaściwe tabele.

### Szczegóły
**Objaw:**
```
IntegrityError: insert or update on table "user_movie" 
violates foreign key constraint "user_movie_user_id_fkey"
DETAIL: Key (user_id)=(xxx) is not present in table "users".
```

**Co się działo:**
- Tabela `user_movie` miała foreign key do `auth.users` (Supabase Auth)
- Po przejściu na Django Auth, użytkownicy są w `public.users_user`
- Foreign key wskazywał na pustą/nieużywaną tabelę

### Rozwiązanie
**1. Sprawdź wszystkie foreign keys w tabeli:**
```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'user_movie';
```

**2. Popraw constraint:**
```sql
-- Usuń stary constraint
ALTER TABLE public.user_movie 
DROP CONSTRAINT IF EXISTS user_movie_user_id_fkey;

-- Dodaj nowy constraint wskazujący na Django User table
ALTER TABLE public.user_movie 
ADD CONSTRAINT user_movie_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users_user(id) 
ON DELETE CASCADE;
```

**Zasada:** Po każdej migracji systemu auth, **ZAWSZE sprawdzaj** foreign key constraints w tabelach domenowych (`user_movie`, `user_platform`, itp.).

---

## 3. Wydajność query - zbędne `.count()`

### Problem
Wykonywanie `.count()` na queryset przed zwróceniem wyników podwaja czas odpowiedzi.

### Szczegóły
**Kod problematyczny:**
```python
queryset = Movie.objects.annotate(
    similarity=TrigramSimilarity(title_expr, query_str)
).filter(
    similarity__gt=0.1
).order_by('-similarity')[:limit]

result_count = queryset.count()  # ❌ Dodatkowe zapytanie!
logger.info(f"Found {result_count} movies")
return queryset
```

**Co się działo:**
- `.count()` wymusza wykonanie całego SQL query
- Potem drugi raz wykonuje się query gdy frontend pobiera dane
- Efekt: ~2x dłuższy czas odpowiedzi

### Rozwiązanie
```python
queryset = Movie.objects.annotate(
    similarity=TrigramSimilarity(title_expr, query_str)
).filter(
    similarity__gt=0.1
).order_by('-similarity')[:limit]

logger.info(f"Searching movies matching query '{query}'")  # ✅ Bez count
return queryset
```

**Zasada:** NIE używaj `.count()` na queryset jeśli nie jest to absolutnie konieczne. Szczególnie przed zwróceniem queryset z funkcji.

---

## 4. Debugowanie IntegrityError w Django

### Problem
`IntegrityError` może mieć różne przyczyny - trudno zdiagnozować bez szczegółowych logów.

### Szczegóły
**Możliwe przyczyny IntegrityError:**
1. **Duplicate key** - constraint UNIQUE/PRIMARY KEY
2. **Foreign key violation** - referenced record nie istnieje
3. **NOT NULL violation** - wymagane pole jest NULL
4. **CHECK constraint** - warunek CHECK nie jest spełniony

### Rozwiązanie
**Dodaj szczegółowe logowanie:**
```python
try:
    user_movie = UserMovie.objects.create(
        user_id=user_uuid,
        tconst_id=tconst,
        # ... inne pola
    )
    logger.info(f"✅ Created user_movie with id={user_movie.id}")
except IntegrityError as e:
    logger.error(f"❌ IntegrityError: {type(e).__name__}: {str(e)}")
    logger.error(f"❌ Details: user_id={user_uuid}, tconst={tconst}")
    raise
```

**Sprawdź dokładny błąd w logu:**
```
❌ IntegrityError: insert or update on table "user_movie" 
violates foreign key constraint "user_movie_user_id_fkey"
DETAIL: Key (user_id)=(xxx) is not present in table "users".
```

**Zasada:** Zawsze loguj szczegóły IntegrityError - typ błędu, constraint name, wartości parametrów.

---

## 5. Race conditions i duplikaty

### Problem
Sprawdzenie czy rekord istnieje + utworzenie rekordu to dwie operacje - może wystąpić race condition.

### Szczegóły
**Kod problematyczny:**
```python
# Sprawdź czy istnieje
existing = UserMovie.objects.filter(user_id=user_id, tconst=tconst).first()

if not existing:
    # Tutaj MOŻE pojawić się inny request który też tworzy rekord!
    UserMovie.objects.create(user_id=user_id, tconst=tconst)
```

### Rozwiązanie
**Opcja 1: Użyj `@transaction.atomic`**
```python
@transaction.atomic
def add_movie_to_watchlist(user, tconst):
    existing = UserMovie.objects.filter(
        user_id=user_id, 
        tconst=tconst
    ).first()
    
    if not existing:
        user_movie = UserMovie.objects.create(...)
    return user_movie
```

**Opcja 2: Obsłuż IntegrityError**
```python
try:
    user_movie = UserMovie.objects.create(
        user_id=user_id,
        tconst=tconst
    )
except IntegrityError:
    # Rekord już istnieje - pobierz go
    user_movie = UserMovie.objects.get(
        user_id=user_id,
        tconst=tconst
    )
```

**Opcja 3: `get_or_create()` (najprostsza)**
```python
user_movie, created = UserMovie.objects.get_or_create(
    user_id=user_id,
    tconst=tconst,
    defaults={
        'watchlisted_at': timezone.now(),
        'watched_at': None,
        # ... inne pola
    }
)
```

**Zasada:** Gdy tworzysz rekordy z unique constraint, używaj `get_or_create()` lub obsługuj `IntegrityError`.

---

## 6. TypeScript i testowanie

### Problem
Testy były w folderze źródłowym i powodowały błędy TypeScript podczas build.

### Szczegóły
**Struktura problematyczna:**
```
src/
  hooks/
    useMovieSearch.ts
    useMovieSearch.test.ts  ❌ W tym samym folderze co kod!
```

**Błąd:**
```
error TS1005: '>' expected.
src/hooks/__tests__/useMovieSearch.test.ts(26,28): error TS1005: '>' expected.
```

### Rozwiązanie
**1. Wyklucz testy z tsconfig.app.json:**
```json
{
  "compilerOptions": { /* ... */ },
  "include": ["src"],
  "exclude": [
    "src/**/__tests__", 
    "src/**/*.test.ts", 
    "src/**/*.test.tsx"
  ]
}
```

**2. LUB przenieś testy do osobnego folderu:**
```
src/
  hooks/
    useMovieSearch.ts
tests/  ← Osobny folder
  hooks/
    useMovieSearch.test.ts
```

**Zasada:** Wyklucz pliki testowe z `tsconfig.app.json` lub trzymaj je w osobnym folderze `tests/`.

---

## 7. Obsługa błędów API w React Query

### Problem
Różne statusy HTTP (400, 409, 5xx) wymagają różnych komunikatów dla użytkownika.

### Szczegóły
Backend może zwrócić:
- **400** - Invalid tconst / movie not found
- **409** - Movie already on watchlist
- **500+** - Server error

### Rozwiązanie
**W komponencie:**
```typescript
try {
  await addUserMovieMutation.mutateAsync({ tconst });
  toast.success(`Film dodany do watchlisty`);
} catch (error: any) {
  // Rollback optimistic update
  setAdded(prev => prev.filter(m => m.tconst !== tconst));
  
  // Handle specific errors
  if (error?.status === 409) {
    toast.info("Ten film jest już na Twojej watchliście");
  } else if (error?.status === 400) {
    toast.error("Nie udało się dodać filmu");
  } else if (error?.status >= 500) {
    toast.error("Wystąpił błąd serwera. Spróbuj ponownie później");
  } else {
    toast.error("Wystąpił błąd podczas dodawania filmu");
  }
}
```

**Zasada:** Zawsze obsługuj różne statusy HTTP i pokazuj odpowiednie komunikaty użytkownikowi.

---

## 8. Optymistyczne aktualizacje UI

### Problem
Optimistic updates wymagają możliwości rollback przy błędzie.

### Szczegóły
**Implementacja:**
```typescript
const handleAddMovie = async (movie: SearchOptionVM) => {
  // 1. Optymistyczna aktualizacja
  const tempMovie: AddedMovieVM = {
    tconst: movie.tconst,
    primaryTitle: movie.primaryTitle,
    // ...
  };
  setAdded(prev => [...prev, tempMovie]);
  setAddedSet(prev => new Set(prev).add(movie.tconst));

  try {
    // 2. Wywołanie API
    await addUserMovieMutation.mutateAsync({ tconst: movie.tconst });
    toast.success("Film dodany!");
  } catch (error) {
    // 3. Rollback przy błędzie
    setAdded(prev => prev.filter(m => m.tconst !== movie.tconst));
    setAddedSet(prev => {
      const newSet = new Set(prev);
      newSet.delete(movie.tconst);
      return newSet;
    });
    toast.error("Błąd dodawania filmu");
  }
};
```

**Zasada:** Przy optimistic updates ZAWSZE implementuj rollback w catch block.

---

## 9. Debouncing w React

### Problem
Wpisywanie w input trigguje zbyt wiele requestów API.

### Szczegóły
Każda litera = nowy request → zbyt duże obciążenie backendu.

### Rozwiązanie
**Custom hook `useDebouncedValue`:**
```typescript
export function useDebouncedValue<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Użycie:**
```typescript
const [query, setQuery] = useState("");
const debouncedQuery = useDebouncedValue(query, 250);

const { data } = useMovieSearch(debouncedQuery); // Query tylko po 250ms
```

**Zasada:** Zawsze debounce search inputs (250-500ms) żeby zmniejszyć liczbę requestów API.

---

## 10. Walidacja po stronie klienta

### Problem
Frontend powinien walidować dane przed wysłaniem do API.

### Szczegóły
**Co walidować:**
- Długość query (min 2 znaki)
- Limity (max 3 filmy)
- Duplikaty w sesji
- Disabled states

### Rozwiązanie
```typescript
const MAX_MOVIES = 3;
const canAddMore = added.length < MAX_MOVIES;

const handleAddMovie = (movie: SearchOptionVM) => {
  // Guard clauses
  if (!canAddMore) return;
  if (addedSet.has(movie.tconst)) return;
  
  // Proceed with adding
  // ...
};
```

**W query:**
```typescript
export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: ["movies", "search", query],
    queryFn: () => searchMovies(query),
    enabled: query.length >= 2,  // ✅ Don't query if too short
    staleTime: 30_000,
  });
}
```

**Zasada:** Waliduj dane po stronie klienta PRZED wysłaniem do API - lepsze UX i mniejsze obciążenie backendu.

---

## 11. Mapowanie DTO → ViewModel

### Problem
Backend zwraca DTO z `snake_case`, frontend używa `camelCase`.

### Szczegóły
**Backend DTO:**
```python
{
  "tconst": "tt0816692",
  "primary_title": "Interstellar",
  "start_year": 2014,
  "avg_rating": "8.6",
  "poster_path": "/path/to/poster.jpg"
}
```

**Frontend potrzebuje:**
```typescript
{
  tconst: "tt0816692",
  primaryTitle: "Interstellar",  // camelCase!
  startYear: 2014,
  avgRating: "8.6",
  posterUrl: "/path/to/poster.jpg"
}
```

### Rozwiązanie
**Dedicated mapping function:**
```typescript
function mapToSearchOptionVM(dto: MovieSearchResultDto): SearchOptionVM {
  return {
    tconst: dto.tconst,
    primaryTitle: dto.primary_title,  // snake_case → camelCase
    startYear: dto.start_year,
    avgRating: dto.avg_rating,
    posterUrl: dto.poster_path,
  };
}

// W hook:
export function useMovieSearch(query: string) {
  return useQuery({
    queryKey: ["movies", "search", query],
    queryFn: async () => {
      const results = await searchMovies(query);
      return results.map(mapToSearchOptionVM);  // ✅ Mapowanie
    },
  });
}
```

**Zasada:** Zawsze mapuj backend DTO na frontend ViewModel w custom hooku, NIE w komponencie.

---

## 12. Accessibility (A11Y) w custom combobox

### Problem
Custom combobox wymaga wielu ARIA attributes żeby działać z keyboard navigation i screen readers.

### Szczegóły
**Wymagane ARIA attributes:**
- `role="combobox"` na input
- `role="listbox"` na listę
- `role="option"` na każdym elemencie listy
- `aria-expanded` - czy lista jest otwarta
- `aria-haspopup="listbox"` - że pokazuje listę
- `aria-autocomplete="list"` - typ autocomplete
- `aria-activedescendant` - aktualnie zaznaczony element

### Rozwiązanie
**Input:**
```tsx
<input
  role="combobox"
  aria-expanded={isOpen}
  aria-haspopup="listbox"
  aria-autocomplete="list"
  aria-activedescendant={activeId}
  onKeyDown={handleKeyDown}  // Arrow keys, Enter, Escape
/>
```

**Lista:**
```tsx
<ul role="listbox" aria-label="Movie search results">
  {items.map((item, index) => (
    <li
      key={item.tconst}
      id={`result-${item.tconst}`}
      role="option"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {/* content */}
    </li>
  ))}
</ul>
```

**Keyboard navigation:**
```typescript
const handleKeyDown = (event: React.KeyboardEvent) => {
  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      setActiveIndex(prev => (prev + 1) % items.length);
      break;
    case "ArrowUp":
      event.preventDefault();
      setActiveIndex(prev => (prev - 1 + items.length) % items.length);
      break;
    case "Enter":
      event.preventDefault();
      if (activeIndex >= 0) handleSelect(items[activeIndex]);
      break;
    case "Escape":
      event.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
      break;
  }
};
```

**Zasada:** Custom interactive components MUSZĄ mieć odpowiednie ARIA attributes i keyboard navigation.

---

## 13. Error boundaries i fallbacks

### Problem
Nieobsłużone błędy w komponentach mogą crashować całą aplikację.

### Szczegóły
**Co może pójść nie tak:**
- API request fails
- Malformed data z backend
- Network offline
- Parsing errors

### Rozwiązanie
**W custom hooku:**
```typescript
export function useMovieSearch(query: string) {
  return useQuery<SearchOptionVM[], Error>({
    queryKey: ["movies", "search", query],
    queryFn: () => searchMovies(query),
    enabled: query.length >= 2,
    retry: 2,  // ✅ Retry na błędzie
    staleTime: 30_000,
  });
}
```

**W komponencie:**
```tsx
const { data: results = [], isLoading, error } = useMovieSearch(debouncedQuery);

// Obsługa błędu
{error ? (
  <div className="p-4 text-center text-destructive text-sm">
    Nie udało się pobrać wyników wyszukiwania. Spróbuj ponownie
  </div>
) : (
  <SearchResultsList items={results} />
)}
```

**Zasada:** Zawsze obsługuj states: loading, error, success. Pokazuj użytkownikowi co się dzieje.

---

## 14. Responsive design i mobile-first

### Problem
Gridy i layouty muszą działać na mobile, tablet i desktop.

### Szczegóły
**Użyj Tailwind responsive classes:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 kolumna mobile, 2 tablet, 3 desktop */}
</div>

<div className="max-w-md mx-auto">
  {/* Max width na większych ekranach, centered */}
</div>
```

**Testuj na różnych rozmiarach:**
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1024px+

**Zasada:** Zawsze projektuj mobile-first, potem dodawaj breakpoints dla większych ekranów.

---

## 15. Placeholder images

### Problem
Nie wszystkie filmy mają plakaty - trzeba pokazać placeholder.

### Szczegóły
**Backend może zwrócić:**
- `poster_path: "/path/to/poster.jpg"` - ✅ OK
- `poster_path: null` - ❌ Brak plakatu

### Rozwiązanie
```tsx
<div className="w-[50px] h-[75px] bg-muted rounded overflow-hidden">
  {item.posterUrl ? (
    <img
      src={item.posterUrl}
      alt={`${item.primaryTitle} poster`}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
      No image
    </div>
  )}
</div>
```

**Zasada:** Zawsze obsługuj `null` values dla opcjonalnych pól (plakaty, zdjęcia, itp.).

---

## Checklist dla przyszłych implementacji

### Przed rozpoczęciem:
- [ ] Sprawdź foreign key constraints w bazie po migracji auth
- [ ] Upewnij się że `managed = False` models NIE mają `unique_together`
- [ ] Zdefiniuj typy DTO i ViewModel na froncie i backendzie

### Podczas implementacji:
- [ ] Dodaj szczegółowe logowanie (INFO dla success, ERROR dla failures)
- [ ] Użyj debounce dla search inputs (250-500ms)
- [ ] Implementuj optimistic updates z rollback
- [ ] Dodaj ARIA attributes dla custom interactive components
- [ ] Waliduj dane po stronie klienta przed API call
- [ ] Obsłuż wszystkie error states (400, 409, 500+)
- [ ] Testuj na mobile, tablet i desktop

### Po implementacji:
- [ ] Usuń `.count()` i inne niepotrzebne queries
- [ ] Sprawdź że transakcje (`@transaction.atomic`) są włączone
- [ ] Wyklucz testy z `tsconfig.app.json`
- [ ] Przetestuj edge cases (0 items, empty results, network errors)
- [ ] Zaktualizuj dokumentację

---

## Przydatne komendy SQL

### Sprawdź foreign keys w tabeli:
```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'YOUR_TABLE';
```

### Sprawdź wszystkie constraints:
```sql
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    tbl.relname AS table_name,
    ARRAY_AGG(att.attname ORDER BY att.attnum) AS columns
FROM pg_constraint con
JOIN pg_class tbl ON con.conrelid = tbl.oid
JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = ANY(con.conkey)
WHERE tbl.relname = 'YOUR_TABLE'
GROUP BY con.conname, con.contype, tbl.relname;
```

### Sprawdź czy tabela istnieje we wszystkich schematach:
```sql
SELECT schemaname, tablename, tableowner
FROM pg_tables 
WHERE tablename = 'YOUR_TABLE'
ORDER BY schemaname;
```

---

## Podsumowanie

**Najważniejsze lekcje:**

1. **Foreign keys po migracji auth** - ZAWSZE sprawdzaj i poprawiaj
2. **`managed = False`** - NIE używaj `unique_together` ani innych Meta constraints
3. **Szczegółowe logowanie** - debug symbole 🔍❌✅ bardzo pomagają
4. **Optimistic updates** - zawsze z rollback
5. **Walidacja na froncie** - lepsza UX, mniej requestów
6. **Accessibility** - ARIA attributes dla custom components
7. **Error handling** - różne statusy = różne komunikaty

**Dokumenty do przeczytania przed implementacją:**
- `.ai/db-plan.md` - struktura bazy danych + Migration Notes
- `.ai/onboarding-add-view-qa-checklist.md` - wszystkie edge cases
- Niniejszy dokument - wszystkie pułapki i rozwiązania

---

**Data utworzenia:** 29 października 2025
**Ostatnia aktualizacja:** 29 października 2025
**Autor:** AI Assistant + Tomasz (debugging session)

