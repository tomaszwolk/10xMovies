# QA Checklist - Onboarding Watched View

## Przegląd
Widok trzeciego kroku onboardingu (`/onboarding/watched`), umożliwiający oznaczenie 0-3 filmów jako obejrzanych.

**Data utworzenia:** 29 października 2025  
**Status:** ✅ READY FOR TESTING

---

## ✅ Funkcjonalności podstawowe

### 1. Wyszukiwanie filmów

- [ ] **Wyszukiwarka jest widoczna i aktywna**
  - Input z placeholderem "Szukaj filmów..."
  - Możliwość wpisywania tekstu

- [ ] **Debounce działa poprawnie**
  - Po wpisaniu 2 znaków NIE pojawia się natychmiast request
  - Request wysyłany jest po ~250ms bez dalszych zmian

- [ ] **Minimalna długość query**
  - Przy 0-1 znakach: dropdown NIE otwiera się
  - Przy 2+ znakach: dropdown otwiera się z wynikami lub komunikatem

- [ ] **Wyniki wyszukiwania wyświetlają się poprawnie**
  - Wyświetla plakat (lub placeholder "No image")
  - Wyświetla tytuł filmu
  - Wyświetla rok produkcji
  - Wyświetla rating (⭐ X.X) jeśli dostępny
  - Przycisk "Oznacz" jest widoczny

- [ ] **Loader podczas wyszukiwania**
  - Spinner pojawia się podczas ładowania
  - Spinner znika gdy wyniki są gotowe

### 2. Oznaczanie filmów jako obejrzane

- [ ] **Kliknięcie "Oznacz" dodaje film do listy**
  - Film pojawia się w sekcji "Oznaczone filmy"
  - Pokazuje status "Oznaczanie..." (loading)
  - Po chwili status zmienia się na "Obejrzany" (success) z zielonym checkmarkiem

- [ ] **Toast z sukcesem**
  - Pojawia się komunikat: `"Nazwa filmu" oznaczono jako obejrzany`

- [ ] **Film dodaje się do bazy**
  - Backend zapisuje film jako watched (watched_at != null)
  - Film trafia do listy obejrzanych (GET /api/user-movies?status=watched)

- [ ] **Licznik postępu**
  - Badge "Oznaczone: 0/3" aktualizuje się po każdym dodaniu
  - Pokazuje: 0/3, 1/3, 2/3, 3/3

### 3. Limit 3 filmów

- [ ] **Blokada po osiągnięciu limitu**
  - Po dodaniu 3 filmów input staje się disabled
  - Placeholder zmienia się na "Osiągnięto limit 3 filmów"
  - Nie można wpisać nowego query

- [ ] **Toast informacyjny przy próbie dodania 4. filmu**
  - Komunikat: "Możesz oznaczyć maksymalnie 3 filmy"
  - (To się nie powinno zdarzyć dzięki disabled state)

### 4. Duplikaty

- [ ] **Nie można dodać tego samego filmu dwa razy**
  - Film dodany w tej sesji ma opacity 50% w wynikach
  - Przycisk "Oznacz" jest ukryty dla dodanych filmów
  - Kliknięcie w dodany film NIE wywołuje akcji

- [ ] **Toast informacyjny przy próbie duplikatu**
  - Komunikat: "Ten film został już wybrany"

### 5. Cofanie (Undo)

- [ ] **Przycisk "X" przy każdym filmie**
  - Ikona X jest widoczna
  - Przycisk jest disabled podczas loading

- [ ] **Cofnięcie nowo dodanego filmu (newly_created)**
  - Kliknięcie X usuwa film z listy
  - Film usuwa się z bazy (DELETE /api/user-movies/:id)
  - Toast: "Anulowano oznaczenie filmu"
  - Licznik się zmniejsza (np. 2/3 → 1/3)

- [ ] **Cofnięcie filmu już istniejącego (preexisting_watchlist)**
  - Film wraca do watchlisty (PATCH restore_to_watchlist)
  - Toast: "Film przywrócono do watchlisty"
  - Film znika z listy oznaczonych

- [ ] **Cofnięcie filmu już obejrzanego (preexisting_watched)**
  - Film wraca do watchlisty
  - Toast: "Film przywrócono do watchlisty"

### 6. Nawigacja

- [ ] **Przycisk "Skip" zawsze aktywny**
  - Można kliknąć w dowolnym momencie (0, 1, 2, 3 filmy)
  - Przenosi do strony głównej (/)
  - Ustawia `localStorage.setItem("onboardingComplete", "true")`

- [ ] **Przycisk "Dalej" zawsze aktywny**
  - Można kliknąć w dowolnym momencie
  - Przenosi do strony głównej (/)
  - Ustawia `onboardingComplete = true`
  - Toast: "Onboarding zakończony!"

- [ ] **Po zakończeniu nie można wrócić do onboardingu**
  - Wejście na `/onboarding/*` przekierowuje do `/`

---

## ✅ Przypadki brzegowe

### 1. Brak wyników wyszukiwania

- [ ] **Komunikat "Nie znaleziono filmów"**
  - Wyświetla się gdy backend zwraca []
  - Nie ma errora, tylko pusty stan

### 2. Film już na watchliście (409 Conflict)

- [ ] **Obsługa 409 z backendu**
  - POST /api/user-movies zwraca 409
  - Frontend robi lookup: GET /api/user-movies?status=watchlist
  - Znajduje userMovieId
  - PATCH mark_as_watched działa
  - Film kończy ze statusem "success" i source "preexisting_watchlist"

### 3. Film już obejrzany (400 Bad Request)

- [ ] **Obsługa 400 "already watched"**
  - PATCH mark_as_watched zwraca 400
  - Frontend robi lookup: GET /api/user-movies?status=watched
  - Znajduje userMovieId
  - Toast: `"Nazwa filmu" był już oznaczony jako obejrzany`
  - Film kończy ze statusem "success" i source "preexisting_watched"

### 4. Brak ID filmu (edge case)

- [ ] **Obsługa braku userMovieId**
  - Jeśli POST i lookup nie zwrócą ID
  - Film usuwa się z listy
  - Toast error: komunikat o błędzie

### 5. Błędy sieciowe

- [ ] **Błąd 500+ z backendu**
  - Film usuwa się z listy (rollback)
  - Toast error: "Wystąpił błąd serwera. Spróbuj ponownie później"

- [ ] **Błąd 400 (inny niż "already watched")**
  - Film usuwa się z listy
  - Toast error: "Nie udało się oznaczyć filmu"

- [ ] **Brak sieci**
  - Film usuwa się z listy
  - Toast error: "Wystąpił błąd podczas oznaczania filmu"

### 6. Wyszukiwarka - błędy

- [ ] **Błąd wyszukiwania**
  - Dropdown pokazuje: "Nie udało się pobrać wyników wyszukiwania. Spróbuj ponownie"
  - Kolor destructive (czerwony)

---

## ✅ UX i UI

### 1. Layout i responsywność

- [ ] **Nagłówek**
  - Tytuł: "Oznacz 3 filmy które już widziałeś"
  - Hint: "Wyszukaj i oznacz filmy które oglądałeś, aby dostosować rekomendacje"

- [ ] **Progress bar**
  - Pokazuje "Krok 3/3"
  - Wizualna reprezentacja postępu

- [ ] **Centrowanie**
  - Wyszukiwarka: max-w-md mx-auto
  - Lista oznaczonych: max-w-lg mx-auto

- [ ] **Mobile**
  - Layout działa na małych ekranach (375px+)
  - Przyciski Skip/Dalej są w kolumnie na mobile

### 2. Status indicators

- [ ] **Loading state**
  - Spinner przy filmie
  - Tekst "Oznaczanie..."
  - Przycisk X jest disabled

- [ ] **Success state**
  - Zielony checkmark (CheckCircle2)
  - Tekst "Obejrzany" w kolorze zielonym
  - Przycisk X jest aktywny

- [ ] **Error state**
  - Czerwona ikona alertu (AlertCircle)
  - Komunikat błędu
  - Border czerwony wokół karty

### 3. Empty states

- [ ] **Brak oznaczonych filmów**
  - Komunikat: "Brak oznaczonych filmów"
  - Subtext: "Wyszukaj i oznacz filmy które już widziałeś"

- [ ] **Brak wyników wyszukiwania**
  - Komunikat: "Nie znaleziono filmów"

### 4. Plakaty filmów

- [ ] **Wyświetlanie plakatów**
  - Plakaty ładują się lazy (loading="lazy")
  - Proporcje 50x75px w wynikach, w liście również 50x75px

- [ ] **Placeholder dla brakujących plakatów**
  - Szare tło (bg-muted)
  - Tekst "No image" wycentrowany

---

## ✅ Accessibility (A11Y)

### 1. ARIA attributes

- [ ] **Input wyszukiwania**
  - `role="combobox"`
  - `aria-expanded={isOpen}`
  - `aria-haspopup="listbox"`
  - `aria-autocomplete="list"`
  - `aria-activedescendant` ustawiony na aktywny element

- [ ] **Lista wyników**
  - `role="listbox"`
  - `aria-label="Movie search results"`

- [ ] **Elementy listy wyników**
  - `role="option"`
  - `aria-selected` dla aktywnego elementu
  - `aria-disabled` dla dodanych filmów

### 2. Keyboard navigation

- [ ] **Arrow Down**
  - Zaznacza następny element w liście
  - Cyklicznie (ostatni → pierwszy)

- [ ] **Arrow Up**
  - Zaznacza poprzedni element
  - Cyklicznie (pierwszy → ostatni)

- [ ] **Enter**
  - Wybiera zaznaczony element
  - Dodaje film do listy

- [ ] **Escape**
  - Zamyka dropdown
  - Zdejmuje focus z inputa

- [ ] **Tab**
  - Normalny tab order

### 3. Focus management

- [ ] **Focus visible**
  - Widoczny outline na elementach
  - Focus nie ginie podczas nawigacji

- [ ] **Disabled elements**
  - `tabIndex={-1}` dla disabled items
  - Nie można na nie nawigować

---

## ✅ Performance

### 1. Optymalizacja requestów

- [ ] **Debounce działa**
  - Szybkie wpisywanie NIE generuje wielu requestów
  - Request dopiero po 250ms pauzy

- [ ] **Limit wyników**
  - Backend zwraca max 10 wyników (lub frontend ogranicza)

### 2. React Query caching

- [ ] **StaleTime 30s**
  - Ponowne wyszukiwanie tego samego query nie odpytuje backendu

- [ ] **Query invalidation**
  - Po dodaniu filmu cache `user-movies` jest invalidowany

### 3. Lazy loading images

- [ ] **Plakaty lazy load**
  - `loading="lazy"` na obrazach

---

## ✅ Integracja z backend

### 1. Endpointy używane

- [ ] **GET /api/movies?search={query}**
  - Zwraca MovieSearchResultDto[]
  - Publiczny (bez JWT)

- [ ] **POST /api/user-movies**
  - Body: { tconst }
  - Wymaga JWT
  - 201 → UserMovieDto z id
  - 409 → już na watchliście

- [ ] **PATCH /api/user-movies/:id**
  - Body: { action: "mark_as_watched" }
  - Wymaga JWT
  - 200 → UserMovieDto
  - 400 → już obejrzany

- [ ] **GET /api/user-movies?status=watchlist**
  - Zwraca UserMovieDto[]
  - Używane do lookupu po 409

- [ ] **GET /api/user-movies?status=watched**
  - Zwraca UserMovieDto[]
  - Używane do lookupu po 400

- [ ] **DELETE /api/user-movies/:id**
  - Soft delete
  - 204 No Content

### 2. Autoryzacja

- [ ] **JWT w headerze**
  - Wszystkie `/api/user-movies/*` wysyłają JWT
  - Interceptor Axios dodaje token

- [ ] **401 Unauthorized**
  - Przekierowanie do /auth/login
  - (Opcjonalnie: zachowanie location.state.from)

---

## ✅ Flow testowy - krok po kroku

### Scenariusz 1: Szczęśliwa ścieżka (0 filmów → 3 filmy → Zakończ)

1. [ ] Wejdź na `/onboarding/watched`
2. [ ] Sprawdź że Progress Bar pokazuje "3/3"
3. [ ] Wpisz "Inter" w wyszukiwarkę
4. [ ] Sprawdź że po 250ms dropdown otwiera się z wynikami
5. [ ] Kliknij pierwszy wynik (np. "Interstellar")
6. [ ] Sprawdź że film pojawia się w sekcji "Oznaczone: 1/3"
7. [ ] Sprawdź status "Oznaczanie..." → "Obejrzany"
8. [ ] Wyszukaj i dodaj drugi film
9. [ ] Sprawdź "Oznaczone: 2/3"
10. [ ] Wyszukaj i dodaj trzeci film
11. [ ] Sprawdź "Oznaczone: 3/3"
12. [ ] Sprawdź że input jest disabled z tekstem "Osiągnięto limit 3 filmów"
13. [ ] Kliknij "Zakończ"
14. [ ] Sprawdź toast "Onboarding zakończony!"
15. [ ] Sprawdź że zostałeś przeniesiony do "/"
16. [ ] Sprawdź że `localStorage.getItem("onboardingComplete") === "true"`

### Scenariusz 2: Skip bez dodawania filmów

1. [ ] Wejdź na `/onboarding/watched`
2. [ ] Kliknij "Skip" bez dodawania filmów
3. [ ] Sprawdź że zostałeś przeniesiony do "/"
4. [ ] Sprawdź że `onboardingComplete = true`

### Scenariusz 3: Cofnięcie (Undo) filmu

1. [ ] Dodaj 2 filmy
2. [ ] Kliknij X przy pierwszym filmie
3. [ ] Sprawdź toast "Anulowano oznaczenie filmu"
4. [ ] Sprawdź że licznik zmienia się z 2/3 → 1/3
5. [ ] Sprawdź że film zniknął z listy

### Scenariusz 4: Film już na watchliście (409)

1. [ ] Przygotuj film który JUŻ JEST na watchliście (dodaj wcześniej)
2. [ ] Wyszukaj ten film i kliknij "Oznacz"
3. [ ] Sprawdź w Network: POST zwraca 409
4. [ ] Sprawdź że frontend robi GET ?status=watchlist
5. [ ] Sprawdź że PATCH mark_as_watched działa
6. [ ] Sprawdź że film kończy ze statusem "Obejrzany"

### Scenariusz 5: Film już obejrzany (400)

1. [ ] Przygotuj film który JUŻ JEST obejrzany
2. [ ] Wyszukaj ten film i kliknij "Oznacz"
3. [ ] Sprawdź w Network: PATCH zwraca 400
4. [ ] Sprawdź że frontend robi GET ?status=watched
5. [ ] Sprawdź toast: `"Film" był już oznaczony jako obejrzany`
6. [ ] Sprawdź że film kończy ze statusem "Obejrzany"

---

## ✅ Regresja

### Sprawdź że poprzednie kroki onboardingu działają

- [ ] `/onboarding/platforms` - wybór platform działa
- [ ] `/onboarding/add` - dodawanie do watchlisty działa
- [ ] Nawigacja między krokami działa (Skip/Dalej)

---

## 📝 Znane problemy i ograniczenia

### Brak w MVP:
- Brak możliwości edycji po zakończeniu onboardingu
- Brak persystencji draftu w localStorage (odświeżenie = utrata danych)
- Brak animacji przy dodawaniu/usuwaniu filmów
- Brak konfetti/celebration po zakończeniu

### Do rozważenia w przyszłości:
- Infinite scroll w wynikach wyszukiwania
- Sugestie filmów na podstawie popularności
- "Pomijaj filmy które już oznaczyłem" filter

---

## ✅ Podsumowanie

**Status:** ✅ READY FOR TESTING  
**Data:** 29 października 2025  
**Implementacja:** Kompletna zgodnie z planem

### Wszystkie funkcjonalności z PRD:
✅ Wyszukiwanie z autocomplete i debounce  
✅ Oznaczanie 0-3 filmów jako obejrzane  
✅ Licznik "X/3"  
✅ Lista oznaczonych z statusami  
✅ Cofanie (Undo)  
✅ Skip i Zakończ zawsze aktywne  
✅ Obsługa 409 (już na watchliście)  
✅ Obsługa 400 (już obejrzany)  
✅ Error handling i toasty  
✅ Accessibility (ARIA, keyboard nav)  
✅ Responsive design  

**Gotowe do produkcji po przejściu QA! 🚀**

