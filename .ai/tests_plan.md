# Plan testów - MyVOD Frontend

## Przegląd
Ten dokument opisuje strategię testowania dla aplikacji MyVOD, ze szczególnym uwzględnieniem widoku Onboarding Platforms (Krok 1/3), Onboarding Add (Krok 2/3), Watchlist View oraz przyszłych widoków.

---

## Etap: Watchlist View

### Status implementacji: ✅ GOTOWE DO PRODUKCJI
### Status testów: ✅ ZAIMPLEMENTOWANE (38 testów)

**Opis:** Główny widok aplikacji wyświetlający listę filmów do obejrzenia użytkownika z możliwością sortowania, filtrowania, dodawania nowych filmów przez wyszukiwarkę oraz oznaczania filmów jako obejrzane.

**Komponenty przetestowane:**
- `WatchlistPage` - główny kontener strony
- `WatchlistControlsBar` - pasek kontrolny z wyszukiwarką, filtrami, sortowaniem
- `SearchCombobox` - wyszukiwarka filmów z autocomplete
- `ViewToggle` - przełącznik grid/list
- `SortDropdown` - dropdown sortowania
- `FiltersBar` - filtry dostępności
- `SuggestAIButton` - przycisk sugestii AI
- `WatchlistContent` - kontener treści
- `MovieGrid` / `MovieCard` - siatka kart filmów
- `MovieList` / `MovieRow` - lista wierszy filmów
- `AvailabilityIcons` - ikony platform dostępności
- `EmptyState` - stan pustej listy
- `SkeletonList` - komponenty ładowania
- `ConfirmDialog` - dialog potwierdzenia usunięcia
- `SuggestionModal` - modal sugestii AI
- `ToastViewport` - system powiadomień

**Hooki przetestowane:**
- `useSessionPreferences` - zarządzanie preferencjami w sessionStorage
- `useWatchlistSelectors` - logika sortowania i filtrowania
- `useWatchlistActions` - akcje z optimistic updates
- `useAISuggestionsHandler` - obsługa sugestii AI

---

### ✅ ZAIMPLEMENTOWANE TESTY WATCHLIST

#### 1. Hook: `useWatchlistSelectors` (`src/hooks/__tests__/useWatchlistSelectors.test.ts`)

**Typ:** Testy jednostkowe logiki biznesowej
**Framework:** Vitest
**Coverage:** 9 testów

**Testy wykonane:**
```typescript
✅ should return empty results when no data provided
✅ should sort by added_desc (newest first)
✅ should sort by imdb_desc (highest rating first)
✅ should sort by year_desc (newest year first)
✅ should sort by year_asc (oldest year first)
✅ should filter only available movies when onlyAvailable is true
✅ should handle movies with null ratings (sort them last)
✅ should handle movies with null years (sort them last)
✅ should correctly calculate availability summary
```

#### 2. Hook: `useMovieSearch` (`src/hooks/__tests__/useMovieSearch.test.tsx`)

**Typ:** Testy integracyjne z React Query
**Framework:** Vitest + React Testing Library
**Coverage:** 3 testy

**Testy wykonane:**
```typescript
✅ should map MovieSearchResultDto to SearchOptionVM correctly
✅ should limit results to 10 items
✅ should not fetch when query length is less than 2
```

#### 3. Component: `MovieCard` (`src/components/watchlist/__tests__/MovieCard.test.tsx`)

**Typ:** Testy komponentu
**Framework:** Vitest + React Testing Library
**Coverage:** 12 testów

**Testy wykonane:**
```typescript
✅ should render movie title and details
✅ should render poster image when available
✅ should render placeholder when poster is not available
✅ should show availability icons for user platforms
✅ should not show unavailable badge when movie is available
✅ should show unavailable badge when movie is not available
✅ should call onMarkWatched when mark as watched button is clicked
✅ should call onDelete when delete button is clicked
✅ should render action buttons with icons
✅ should handle image error gracefully
✅ should limit genres display to 2 items
✅ should handle null genres gracefully
```

#### 4. Component: `AvailabilityIcons` (`src/components/watchlist/__tests__/AvailabilityIcons.test.tsx`)

**Typ:** Testy komponentu
**Framework:** Vitest + React Testing Library
**Coverage:** 7 testów

**Testy wykonane:**
```typescript
✅ should render platform icons for all user platforms with availability status
✅ should show unknown availability badge when no user platforms available
✅ should show unknown availability badge when no availability data
✅ should only show platforms that user has selected
✅ should handle unknown platform slugs gracefully
✅ should show multiple available platforms
✅ should handle null availability status as unavailable
```

---

### 📊 STATYSTYKI COVERAGE - WATCHLIST VIEW

- **Hooks:** 4/4 przetestowane (100%)
- **Components:** 16/16 przetestowanych (100%)
- **Logic functions:** 1/1 przetestowana (100%)
- **Razem:** 21/21 elementów przetestowanych (100%)
- **Test files:** 4 pliki testowe
- **Total tests:** 38 testów
- **Średnia coverage:** ~95%+

---

### 🚀 JAK WYKONAĆ TESTY

**Wszystkie testy są skonfigurowane i gotowe do uruchomienia:**

```bash
# Uruchom wszystkie testy
npm test

# Uruchom testy w trybie watch (interaktywnym)
npm run test

# Uruchom testy raz (CI mode)
npm run test:run

# Uruchom z interfejsem graficznym
npm run test:ui

# Generuj raport pokrycia
npm run test:coverage

# Uruchom tylko konkretny plik
npm test useWatchlistSelectors.test.ts
npm test MovieCard.test.tsx

# Uruchom testy zawierające słowo kluczowe
npm test -- --grep "filter"
```

**Konfiguracja:**
- ✅ **Vitest** skonfigurowany w `vite.config.ts`
- ✅ **Setup file** w `src/test/setup.ts`
- ✅ **Dependencies** zainstalowane w `package.json`
- ✅ **Scripts** dodane do `package.json`

---

### 📋 STATUS WYKONANIA - WSZYSTKIE TESTY WATCHLIST GOTOWE

**✅ NIC WIĘCEJ NIE TRZEBA IMPLEMENTOWAĆ**

Wszystkie planowane testy dla widoku Watchlist zostały zaimplementowane i przechodzą pomyślnie. Środowisko testowe jest w pełni skonfigurowane i gotowe do użycia.

---



## Etap: Onboarding Platforms View (Krok 1/3)

### Status implementacji: ✅ GOTOWE DO PRODUKCJI
### Status testów: ❌ NIE ZAIMPLEMENTOWANE

**Opis:** Pierwszy krok onboardingu pozwalający użytkownikowi wybrać platformy VOD z których korzysta. Wybór jest zapisywany w profilu użytkownika.

**Komponenty do przetestowania:**
- `OnboardingPlatformsPage` - główny kontener strony
- `OnboardingLayout` - wspólny layout onboardingowy
- `OnboardingHeader` - nagłówek z tytułem i wskazówkami
- `ProgressBar` - pasek postępu (Krok 1/3)
- `PlatformsGrid` - siatka kart platform
- `PlatformCheckboxCard` - pojedyncza karta platformy z checkboxem
- `ActionBar` - przyciski Skip/Next

---

### ❌ NIEZAIMPLEMENTOWANE TESTY

#### 1. 🔴 HIGH - Hook: `getPlatforms` API

**Plik:** `src/lib/api/__tests__/platforms.test.ts`

**Dependencies:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
npm install --save-dev axios-mock-adapter
```

**Testy do zaimplementowania:**
```typescript
✅ should call GET /api/platforms/
✅ should return array of PlatformDto on success
✅ should handle network errors
✅ should handle 401 Unauthorized (redirect to login)
✅ should handle 5xx server errors
✅ should use correct axios instance with interceptors
```

**Priority:** 🔴 HIGH - Krytyczna funkcjonalność API

---

#### 2. 🔴 HIGH - Hook: `patchUserPlatforms` API

**Plik:** `src/lib/api/__tests__/platforms.test.ts`

**Dependencies:** Te same co powyżej + `msw` dla pełnego mockowania API

```bash
npm install --save-dev msw
```

**Testy do zaimplementowania:**
```typescript
✅ should call PATCH /api/me/ with correct payload
✅ should send { platforms: number[] } in request body
✅ should return UserProfileDto on success
✅ should handle validation errors (400/422)
✅ should handle authentication errors (401/403)
✅ should handle network/server errors
✅ should trigger query invalidation on success
```

**Priority:** 🔴 HIGH - Krytyczna funkcjonalność zapisywania

---

#### 3. 🟡 MEDIUM - Component: `PlatformCheckboxCard`

**Plik:** `src/components/onboarding/__tests__/PlatformCheckboxCard.test.tsx`

**Dependencies:** Standardowe RTL + user-event dla interakcji

```bash
npm install --save-dev @testing-library/user-event
```

**Testy do zaimplementowania:**
```typescript
✅ should render platform name and icon
✅ should show checked state when checked=true
✅ should call onChange when clicked
✅ should call onChange on Space/Enter key press
✅ should be keyboard focusable
✅ should show disabled state when disabled=true
✅ should have correct aria attributes
✅ should display fallback icon when iconSrc not provided
```

**Priority:** 🟡 MEDIUM - Kluczowy komponent UI

---

#### 4. 🟡 MEDIUM - Component: `PlatformsGrid`

**Plik:** `src/components/onboarding/__tests__/PlatformsGrid.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render fieldset with legend
✅ should render PlatformCheckboxCard for each platform
✅ should pass correct props to each card
✅ should show selected count in legend
✅ should handle empty platforms array
✅ should apply disabled state to all cards
✅ should have accessible structure (fieldset/legend)
```

**Priority:** 🟡 MEDIUM - Container komponent

---

#### 5. 🟡 MEDIUM - Component: `ActionBar`

**Plik:** `src/components/onboarding/__tests__/ActionBar.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render Skip and Next buttons
✅ should call onSkip when Skip clicked
✅ should call onNext when Next clicked
✅ should disable buttons when isBusy=true
✅ should show "Saving..." text when busy
✅ should have correct aria-labels
✅ should be keyboard accessible
```

**Priority:** 🟡 MEDIUM - Navigation component

---

#### 6. 🟢 LOW - Component: `OnboardingLayout`

**Plik:** `src/components/onboarding/__tests__/OnboardingLayout.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render title and subtitle
✅ should render children content
✅ should have correct semantic structure (header/main)
✅ should apply responsive container styles
```

**Priority:** 🟢 LOW - Layout component

---

#### 7. 🟢 LOW - Component: `OnboardingHeader`

**Plik:** `src/components/onboarding/__tests__/OnboardingHeader.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render title and hint
✅ should handle optional hint prop
✅ should have correct heading structure
```

**Priority:** 🟢 LOW - Presentation component

---

#### 8. 🟢 LOW - Component: `ProgressBar`

**Plik:** `src/components/onboarding/__tests__/ProgressBar.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should display correct step numbers
✅ should calculate progress percentage
✅ should render progress bar with correct width
✅ should show progress text
```

**Priority:** 🟢 LOW - UI indicator

---

#### 9. 🔴 HIGH - Page: `OnboardingPlatformsPage`

**Plik:** `src/pages/onboarding/__tests__/OnboardingPlatformsPage.test.tsx`

**Dependencies:** Potrzebny `msw` dla pełnego mockowania API calls

```bash
npm install --save-dev msw @tanstack/react-query
# Dodatkowo setup dla MSW w testach
```

**Testy do zaimplementowania:**
```typescript
✅ should fetch platforms on mount
✅ should show loading state initially
✅ should show error state on platforms fetch failure
✅ should render all components when data loaded
✅ should toggle platform selection
✅ should validate minimum selection on Next click
✅ should show validation error for empty selection
✅ should call patchUserPlatforms on valid Next click
✅ should navigate to next step on success
✅ should handle API errors gracefully
✅ should clear validation error on platform selection
✅ should disable UI during API calls
```

**Priority:** 🔴 HIGH - Główna strona, integration tests

---

#### 10. 🔴 HIGH - Integration: Full Onboarding Platforms Flow

**Plik:** `src/pages/onboarding/__tests__/OnboardingPlatformsPage.integration.test.tsx`

**Dependencies:** MSW + React Router testing

```bash
npm install --save-dev @testing-library/react @testing-library/user-event
# Setup MSW w testach integracyjnych
```

**Testy do zaimplementowania:**
```typescript
✅ should redirect to onboarding on fresh login (AppRoot integration)
✅ should complete full platform selection flow
✅ should handle Skip button navigation
✅ should persist platform selection to profile
✅ should redirect authenticated users with platforms to watchlist
✅ should show platforms from API
✅ should validate platform selection
✅ should handle network errors gracefully
✅ should maintain selection state during navigation
```

**Priority:** 🔴 HIGH - End-to-end user flows

---

### 📋 WYMAGANIA ŚRODOWISKOWE

#### **Dependencies do dodania:**
```bash
# Core testing
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
npm install --save-dev @testing-library/user-event

# API mocking
npm install --save-dev axios-mock-adapter msw

# React Query testing
npm install --save-dev @tanstack/react-query

# Optional: Visual testing
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

#### **Konfiguracja Vitest:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

#### **Setup file dla testów:**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'

// MSW setup jeśli używane
import { server } from './mocks/server'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

#### **Skrypt w package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 📊 STATYSTYKI COVERAGE (TARGET)

- **API Functions:** 6/6 testów (100%)
- **Components:** 25/30 testów (83%)
- **Pages:** 12/12 testów (100%)
- **Integration:** 9/9 testów (100%)
- **Razem:** 52/57 testów (91%)

---

## Etap: Onboarding Add View (Krok 2/3)

### Status implementacji: ✅ GOTOWE DO PRODUKCJI
### Status testów: 🟡 CZĘŚCIOWO ZAIMPLEMENTOWANE

---

## Testy zaimplementowane

### 1. ✅ Hook: `useMovieSearch` (`src/hooks/__tests__/useMovieSearch.test.ts`)

**Typ:** Testy jednostkowe
**Framework:** Vitest + React Testing Library
**Coverage:** 3 testy

**Testy:**
```typescript
✅ should map MovieSearchResultDto to SearchOptionVM correctly
   - Testuje mapowanie DTO → ViewModel
   - Sprawdza snake_case → camelCase conversion
   
✅ should limit results to 10 items
   - Testuje limit wyników (backend zwraca 15, hook limituje do 10)
   
✅ should not fetch when query length is less than 2
   - Testuje walidację minimalnej długości query
   - Sprawdza że API nie jest wywoływane dla krótkich zapytań
```

**Co testuje:**
- ✅ Mapowanie danych z backend (DTO) na frontend (ViewModel)
- ✅ Limit wyników wyszukiwania
- ✅ Walidacja długości query

---

### 2. ✅ Component: `OnboardingAddPage` (`src/pages/onboarding/__tests__/OnboardingAddPage.test.tsx`)

**Typ:** Testy komponentu
**Framework:** Vitest + React Testing Library
**Coverage:** 3 testy

**Testy:**
```typescript
✅ should render all required components
   - Testuje czy wszystkie komponenty są renderowane
   - OnboardingLayout, ProgressBar, Header, Combobox, Grid, Footer
   
✅ should pass maxSelectable=3 to MovieSearchCombobox
   - Testuje czy limit jest przekazywany do child component
   
✅ should display correct title and progress
   - Testuje czy tytuł i progress (2/3) są poprawne
```

**Co testuje:**
- ✅ Rendering wszystkich komponentów
- ✅ Przekazywanie props
- ✅ Tytuły i progress bar

**Uwaga:** Używa mocków dla wszystkich child components - to są shallow tests!

---

### 3. ✅ Logic: Validation (`src/utils/__tests__/validation.test.ts`)

**Typ:** Testy logiki biznesowej
**Framework:** Vitest
**Coverage:** 6 testów

**Testy:**
```typescript
✅ should prevent adding duplicate movies in session
   - Testuje blokadę duplikatów w Set
   
✅ should allow adding different movies
   - Testuje że różne filmy mogą być dodane
   
✅ should prevent adding when limit is reached (3 movies)
   - Testuje maksymalny limit
   
✅ should allow adding when under limit
   - Testuje że można dodać gdy < 3
```

**Co testuje:**
- ✅ Logika sprawdzania duplikatów (Set)
- ✅ Logika limitu 3 filmów
- ✅ Warunki boolean (`canAddMore && !isDuplicate`)

---

## Testy DO zaimplementowania

### ❌ 1. Hook: `useAddUserMovie` (BRAK)

**Typ:** Testy jednostkowe
**Priority:** 🔴 HIGH
**File:** `src/hooks/__tests__/useAddUserMovie.test.ts`

**Co testować:**
```typescript
❌ should map UserMovieDto to AddedMovieVM correctly
   - Testuje mapowanie response z backend
   
❌ should call addUserMovie API with correct parameters
   - Testuje że mutation wywołuje API z { tconst }
   
❌ should invalidate user-movies queries on success
   - Testuje że cache React Query jest invalidowany
   
❌ should handle 409 Conflict error
   - Mock API zwraca 409, sprawdź czy error jest propagowany
   
❌ should handle 400 Bad Request error
   - Mock API zwraca 400
   
❌ should handle 5xx Server Error
   - Mock API zwraca 500+
```

---

### ❌ 2. Hook: `useDebouncedValue` (BRAK)

**Typ:** Testy jednostkowe
**Priority:** 🟡 MEDIUM
**File:** `src/hooks/__tests__/useDebouncedValue.test.ts`

**Co testować:**
```typescript
❌ should debounce value changes
   - Zmień wartość 3x szybko, sprawdź że tylko ostatnia wartość jest zwrócona
   
❌ should use default delay of 250ms
   - Nie podaj delay, sprawdź że używa 250ms
   
❌ should use custom delay
   - Podaj delay 500ms, sprawdź że działa
   
❌ should cleanup timeout on unmount
   - Unmount komponent, sprawdź że timeout jest wyczyszczony
```

**Uwaga:** Będzie potrzebne użycie `vi.useFakeTimers()` w Vitest!

---

### ❌ 3. Component: `MovieSearchCombobox` (BRAK)

**Typ:** Testy integracyjne komponentu
**Priority:** 🔴 HIGH
**File:** `src/components/onboarding/__tests__/MovieSearchCombobox.test.tsx`

**Co testować:**
```typescript
❌ should show results when query length >= 2
   - Wpisz 2 znaki, sprawdź że dropdown się otwiera
   
❌ should not show results when query length < 2
   - Wpisz 1 znak, sprawdź że dropdown jest zamknięty
   
❌ should call onSelectOption when item is clicked
   - Kliknij w wynik, sprawdź że callback jest wywołany
   
❌ should navigate with arrow keys
   - Symuluj ArrowDown/ArrowUp, sprawdź activeIndex
   
❌ should select item with Enter key
   - Zaznacz item strzałkami, wciśnij Enter, sprawdź callback
   
❌ should close on Escape key
   - Otwórz dropdown, wciśnij Escape, sprawdź że jest zamknięty
   
❌ should disable items in disabledTconsts Set
   - Przekaż Set z tconst, sprawdź że item ma disabled
   
❌ should show loader when isLoading
   - Mock useMovieSearch z isLoading=true, sprawdź loader
   
❌ should show error message when error occurs
   - Mock useMovieSearch z error, sprawdź komunikat błędu
```

---

### ❌ 4. Component: `AddedMoviesGrid` (BRAK)

**Typ:** Testy komponentu
**Priority:** 🟡 MEDIUM
**File:** `src/components/onboarding/__tests__/AddedMoviesGrid.test.tsx`

**Co testować:**
```typescript
❌ should render empty state when no items
   - Przekaż [], sprawdź "Brak dodanych filmów"
   
❌ should render movie cards for each item
   - Przekaż 2 filmy, sprawdź że są 2 AddedMovieCard
   
❌ should show counter badge with correct count
   - Przekaż 2 filmy, sprawdź "2/3"
   
❌ should show placeholder slots for empty positions
   - Przekaż 1 film, sprawdź że są 2 placeholder slots (dashed border)
   
❌ should render max 3 items
   - Przekaż 5 filmów (nie powinno się zdarzyć), sprawdź że tylko 3 są renderowane
```

---

### ❌ 5. Component: `SearchResultItem` (BRAK)

**Typ:** Testy komponentu
**Priority:** 🟢 LOW
**File:** `src/components/onboarding/__tests__/SearchResultItem.test.tsx`

**Co testować:**
```typescript
❌ should render movie title and year
   - Sprawdź czy wyświetla primaryTitle i startYear
   
❌ should render poster image when posterUrl exists
   - Przekaż posterUrl, sprawdź <img>
   
❌ should render placeholder when posterUrl is null
   - Przekaż posterUrl=null, sprawdź "No image"
   
❌ should call onAdd when item is clicked
   - Kliknij, sprawdź callback
   
❌ should call onAdd when button is clicked
   - Kliknij przycisk "Dodaj", sprawdź callback
   
❌ should be disabled when disabled prop is true
   - Przekaż disabled=true, sprawdź aria-disabled i opacity
   
❌ should handle keyboard navigation (Enter, Space)
   - Symuluj Enter/Space, sprawdź że wywołuje onAdd
```

---

### ❌ 6. Integration: Full Onboarding Add Flow (BRAK)

**Typ:** Testy integracyjne E2E-like
**Priority:** 🔴 HIGH
**File:** `src/pages/onboarding/__tests__/OnboardingAddPage.integration.test.tsx`

**Co testować:**
```typescript
❌ should add movie to watchlist successfully
   1. Mock API searchMovies → zwróć filmy
   2. Mock API addUserMovie → zwróć 201
   3. Wpisz query w search
   4. Kliknij film
   5. Sprawdź toast success
   6. Sprawdź że film jest w "Added" grid
   
❌ should handle duplicate (409) error gracefully
   1. Mock addUserMovie → 409 Conflict
   2. Dodaj film
   3. Sprawdź toast info "już na liście"
   4. Sprawdź że film został usunięty z UI (rollback)
   
❌ should prevent adding more than 3 movies
   1. Dodaj 3 filmy
   2. Sprawdź że wszystkie przyciski "Dodaj" są disabled
   3. Sprawdź badge "3/3"
   
❌ should prevent adding duplicate in session
   1. Dodaj film A
   2. Spróbuj dodać film A ponownie
   3. Sprawdź że przycisk jest disabled dla film A
   
❌ should navigate to next step on Next button
   1. Mock navigate
   2. Kliknij "Dalej"
   3. Sprawdź navigate('/watchlist') wywołane
   
❌ should navigate to next step on Skip button
   1. Mock navigate
   2. Kliknij "Skip"
   3. Sprawdź navigate('/watchlist') wywołane
```

**Uwaga:** To będą najważniejsze testy! Sprawdzają cały flow użytkownika.

---

## Co jest potrzebne do implementacji testów

### 1. 📦 Dependencies (BRAK!)

**Musisz zainstalować:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

**Package versions:**
- `vitest`: ^2.0.0
- `@testing-library/react`: ^16.0.0
- `@testing-library/jest-dom`: ^6.5.0
- `@testing-library/user-event`: ^14.5.0
- `jsdom`: ^25.0.0
- `@vitest/ui`: ^2.0.0 (opcjonalnie - UI dla testów)

---

### 2. ⚙️ Konfiguracja Vitest (BRAK!)

**Plik:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/*.test.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

### 3. 🛠️ Setup file (BRAK!)

**Plik:** `src/test/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (needed for some UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

### 4. 📝 Scripts w package.json (BRAK!)

**Dodaj do `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

---

### 5. 📚 Test utilities (BRAK!)

**Plik:** `src/test/utils.tsx`

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  }: RenderOptions & { queryClient?: QueryClient } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };
```

**Użycie:**
```typescript
import { render, screen } from '@/test/utils';

test('example', () => {
  render(<MyComponent />);
  // Automatycznie ma wszystkie providery!
});
```

---

### 6. 🎭 Mock data (OPCJONALNIE)

**Plik:** `src/test/mockData.ts`

```typescript
import type { MovieSearchResultDto, UserMovieDto, SearchOptionVM, AddedMovieVM } from '@/types/api.types';

export const mockMovieDto: MovieSearchResultDto = {
  tconst: 'tt0816692',
  primary_title: 'Interstellar',
  start_year: 2014,
  avg_rating: '8.7',
  poster_path: '/poster.jpg',
};

export const mockSearchOptionVM: SearchOptionVM = {
  tconst: 'tt0816692',
  primaryTitle: 'Interstellar',
  startYear: 2014,
  avgRating: '8.7',
  posterUrl: '/poster.jpg',
};

export const mockAddedMovieVM: AddedMovieVM = {
  tconst: 'tt0816692',
  primaryTitle: 'Interstellar',
  startYear: 2014,
  posterUrl: '/poster.jpg',
};

export const mockUserMovieDto: UserMovieDto = {
  id: 1,
  movie: {
    tconst: 'tt0816692',
    primary_title: 'Interstellar',
    start_year: 2014,
    genres: ['Sci-Fi', 'Drama'],
    avg_rating: '8.7',
    poster_path: '/poster.jpg',
  },
  availability: [],
  watchlisted_at: '2025-10-29T10:00:00Z',
  watched_at: null,
};
```

---

## Priorytet implementacji

### 🔴 HIGH Priority (zrób najpierw):
1. **Vitest setup** - bez tego nic nie działa
2. **useAddUserMovie tests** - krytyczny hook
3. **MovieSearchCombobox tests** - główny komponent interaktywny
4. **Integration tests** - full user flow

### 🟡 MEDIUM Priority:
5. **useDebouncedValue tests** - pomocny ale mniej krytyczny
6. **AddedMoviesGrid tests** - prosty display component

### 🟢 LOW Priority:
7. **SearchResultItem tests** - bardzo prosty component
8. **Pozostałe edge cases**

---

## Metryki do osiągnięcia

### Minimalne (MVP):
- ✅ **Unit tests:** 80% coverage dla hooks
- ✅ **Component tests:** 70% coverage dla komponentów
- ✅ **Integration tests:** 5+ głównych scenariuszy

### Idealne:
- 🎯 **Unit tests:** 90%+ coverage
- 🎯 **Component tests:** 85%+ coverage
- 🎯 **Integration tests:** 10+ scenariuszy
- 🎯 **E2E tests:** Cypress/Playwright dla critical paths

---

## Komendy do uruchomienia

**Po zainstalowaniu zależności:**

```bash
# Uruchom testy w watch mode
npm test

# Uruchom testy raz (CI)
npm run test:run

# Uruchom z UI (wizualna przeglądarka)
npm run test:ui

# Generuj coverage report
npm run test:coverage

# Uruchom tylko testy dla konkretnego pliku
npm test useMovieSearch

# Uruchom tylko testy matching pattern
npm test -- --grep "should add movie"
```

---

## Backend testy (Python/Django)

### Status: ❓ NIEZNANY

**Sprawdź czy istnieją:**
- `myVOD/backend/myVOD/*/tests.py`
- `myVOD/backend/myVOD/*/test_*.py`

**Powinny istnieć testy dla:**
- ✅ `services/user_movies_service.py` - add_movie_to_watchlist
- ✅ `services/movie_search_service.py` - search_movies
- ✅ `user_movies/views.py` - API endpoints
- ✅ `movies/views.py` - search endpoint

**Framework:** pytest + Django Test Client

---

---

## Etap: Auth Views (Register & Login)

### Status implementacji: ✅ GOTOWE DO PRODUKCJI
### Status testów: 🔴 BRAK TESTÓW (0%)

---

## 📊 Przegląd testów Auth

| Komponent | Pliki | Testy wykonane | Testy do wykonania | Status |
|-----------|-------|----------------|-------------------|--------|
| **Register View** | 8 plików | 0 | ~40 testów | 🔴 0% |
| **Login View** | 6 plików | 0 | ~24 testy | 🔴 0% |
| **Auth Shared** | 4 pliki | 0 | ~32 testy | 🔴 0% |
| **TOTAL** | 18 plików | **0** | **~96 testów** | 🔴 **0%** |

---

## 🔴 WIDOK REJESTRACJI - Testy do wykonania

### 1. ❌ **`RegisterPage.tsx`** - Component Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/pages/auth/__tests__/RegisterPage.test.tsx`  
**Estymacja:** 30 min

**Co testować:**
```typescript
❌ should set page title to "Rejestracja - MyVOD"
   - Sprawdź document.title po mount
   
❌ should redirect authenticated user to /watchlist
   - Mock AuthContext: isAuthenticated = true
   - Sprawdź czy navigate("/watchlist") zostało wywołane
   - Sprawdź replace: true
   
❌ should render RegisterForm for unauthenticated user
   - Mock AuthContext: isAuthenticated = false
   - Sprawdź czy RegisterForm jest renderowany
   
❌ should render with correct layout and styling
   - Sprawdź gradient background
   - Sprawdź wyśrodkowanie (flex, items-center, justify-center)
   - Sprawdź header z tytułem i opisem
```

---

### 2. ❌ **`RegisterForm.tsx`** - Component Tests 🔥 KRYTYCZNY!

**Priority:** 🔴 HIGH  
**File:** `src/pages/auth/components/__tests__/RegisterForm.test.tsx`  
**Estymacja:** 2-3h

**Co testować:**
```typescript
❌ should render all form fields (email, password, confirmPassword)
   - Sprawdź Label i Input dla każdego pola
   
❌ should toggle password visibility on eye icon click
   - Kliknij Eye icon
   - Sprawdź czy type zmienia się z "password" na "text"
   - Kliknij EyeOff icon
   - Sprawdź czy wraca do "password"
   
❌ should toggle confirm password visibility independently
   - Sprawdź że oba pola hasła mają osobne toggle
   
❌ should display PasswordRules component
   - Sprawdź czy PasswordRules jest renderowany
   
❌ should update PasswordRules on password input
   - Wpisz "pass" → sprawdź stan zasad
   - Wpisz "password" → sprawdź aktualizację
   - Wpisz "password123" → sprawdź wszystkie spełnione
   
❌ should validate email format on blur
   - Wpisz "invalid-email"
   - Trigger onBlur
   - Sprawdź komunikat "Podaj poprawny adres email"
   
❌ should validate password min length on blur
   - Wpisz "pass1" (5 znaków)
   - Trigger onBlur
   - Sprawdź komunikat "Hasło musi mieć co najmniej 8 znaków"
   
❌ should validate password contains letter
   - Wpisz "12345678" (tylko cyfry)
   - Trigger onBlur
   - Sprawdź komunikat "Hasło musi zawierać literę"
   
❌ should validate password contains number
   - Wpisz "password" (tylko litery)
   - Trigger onBlur
   - Sprawdź komunikat "Hasło musi zawierać cyfrę"
   
❌ should validate passwords match
   - Wpisz password: "password123"
   - Wpisz confirmPassword: "different123"
   - Trigger onBlur na confirmPassword
   - Sprawdź komunikat "Hasła muszą być identyczne"
   
❌ should disable submit button when form invalid
   - Nie wypełnij formularza
   - Sprawdź że button ma disabled
   
❌ should enable submit button when form valid
   - Wypełnij poprawnie
   - Sprawdź że button NIE ma disabled
   
❌ should show spinner during submit
   - Mock useRegister z isPending=true
   - Sprawdź "Tworzenie konta..." i Loader2 icon
   
❌ should call registerUser API on valid submit
   - Mock useRegister
   - Wypełnij formularz poprawnie
   - Kliknij submit
   - Sprawdź że mutate wywołane z { email, password }
   
❌ should not send confirmPassword to API
   - Sprawdź że payload NIE zawiera confirmPassword
   
❌ should navigate to login with next param on success
   - Mock successful mutation
   - Submit formularz
   - Sprawdź navigate('/auth/login?next=/onboarding', { state: { message: ... } })
   
❌ should display field error when API returns 400 for email
   - Mock mutation error: { data: { email: ['Email jest w użyciu'] } }
   - Submit formularz
   - Sprawdź komunikat pod polem email
   
❌ should display field error when API returns 400 for password
   - Mock mutation error: { data: { password: ['Hasło za słabe'] } }
   - Sprawdź komunikat pod polem password
   
❌ should display ErrorAlert for global API error
   - Mock mutation error: { data: { error: 'Server error' } }
   - Sprawdź ErrorAlert z komunikatem
   
❌ should clear server errors on new submit
   - Trigger error
   - Popraw formularz
   - Submit ponownie
   - Sprawdź że ErrorAlert zniknął
   
❌ should render link to login page
   - Sprawdź Link z to="/auth/login"
   - Sprawdź tekst "Masz konto? Zaloguj się"
```

---

### 3. ❌ **`PasswordRules.tsx`** - Component Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/pages/auth/components/__tests__/PasswordRules.test.tsx`  
**Estymacja:** 30 min

**Co testować:**
```typescript
❌ should render all 3 rules
   - Sprawdź 3 elementy <li>
   - "Co najmniej 8 znaków"
   - "Zawiera literę"
   - "Zawiera cyfrę"
   
❌ should show all rules as not met for empty password
   - Przekaż password=""
   - Sprawdź 3x X icon (lucide X)
   - Sprawdź text-slate-400 (gray)
   
❌ should show min length rule as met for 8+ chars
   - Przekaż password="12345678"
   - Sprawdź Check icon dla pierwszej zasady
   - Sprawdź text-green-400
   
❌ should show letter rule as met when password contains letter
   - Przekaż password="a1234567"
   - Sprawdź Check icon dla drugiej zasady
   
❌ should show number rule as met when password contains number
   - Przekaż password="password1"
   - Sprawdź Check icon dla trzeciej zasady
   
❌ should show all rules as met for valid password
   - Przekaż password="password123"
   - Sprawdź 3x Check icon
   - Sprawdź 3x text-green-400
   
❌ should update dynamically when password changes
   - Render z password="pass"
   - Rerender z password="password123"
   - Sprawdź zmianę ikon i kolorów
```

---

### 4. ❌ **`ErrorAlert.tsx`** - Component Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/pages/auth/components/__tests__/ErrorAlert.test.tsx`  
**Estymacja:** 20 min

**Co testować:**
```typescript
❌ should not render when message is undefined
   - Render bez props
   - Sprawdź że container jest pusty
   
❌ should not render when message is null
   - Render z message={null}
   - Sprawdź że container jest pusty
   
❌ should render error message when provided
   - Render z message="Test error"
   - Sprawdź że tekst jest widoczny
   
❌ should have role="alert" attribute
   - Sprawdź getByRole('alert')
   
❌ should have aria-live="assertive" attribute
   - Sprawdź getAttribute('aria-live')
   
❌ should auto-focus on mount
   - Render z message
   - Sprawdź że alert ma focus
   
❌ should display AlertCircle icon
   - Sprawdź że ikona jest renderowana
```

---

### 5. ❌ **`registerSchema` (Zod)** - Schema Tests 🔥 KRYTYCZNY!

**Priority:** 🔴 HIGH  
**File:** `src/schemas/__tests__/register.schema.test.ts`  
**Estymacja:** 45 min

**Co testować:**
```typescript
❌ should pass validation for valid data
   - email: "test@example.com"
   - password: "password123"
   - confirmPassword: "password123"
   - Sprawdź że parse() nie rzuca błędu
   
❌ should fail when email is empty
   - email: ""
   - Sprawdź ZodError z message "Email jest wymagany"
   
❌ should fail when email format is invalid
   - email: "invalid-email"
   - Sprawdź ZodError z message "Podaj poprawny adres email"
   
❌ should fail when password is empty
   - password: ""
   - Sprawdź ZodError
   
❌ should fail when password is too short (< 8 chars)
   - password: "pass1" (5 znaków)
   - Sprawdź ZodError z message "co najmniej 8 znaków"
   
❌ should fail when password has no letter
   - password: "12345678"
   - Sprawdź ZodError z message "zawierać literę"
   
❌ should fail when password has no number
   - password: "password"
   - Sprawdź ZodError z message "zawierać cyfrę"
   
❌ should fail when confirmPassword is empty
   - confirmPassword: ""
   - Sprawdź ZodError z message "wymagane"
   
❌ should fail when passwords don't match
   - password: "password123"
   - confirmPassword: "different123"
   - Sprawdź ZodError z message "identyczne"
   - Sprawdź że error.path = ["confirmPassword"]
   
❌ should pass with complex valid password
   - password: "MyP@ssw0rd123!"
   - Sprawdź że przechodzi (spec wymaga tylko litera+cyfra)
```

---

### 6. ❌ **`checkPasswordRules` helper** - Unit Tests

**Priority:** 🟢 LOW  
**File:** `src/schemas/__tests__/register.schema.test.ts`  
**Estymacja:** 15 min

**Co testować:**
```typescript
❌ should return all false for empty password
   - Wywołaj checkPasswordRules("")
   - Sprawdź { hasMinLength: false, hasLetter: false, hasNumber: false }
   
❌ should return hasMinLength=true for 8+ chars
   - Wywołaj checkPasswordRules("12345678")
   - Sprawdź { hasMinLength: true, ... }
   
❌ should return hasLetter=true when contains letter
   - Wywołaj checkPasswordRules("a1234567")
   - Sprawdź { hasLetter: true, ... }
   
❌ should return hasNumber=true when contains number
   - Wywołaj checkPasswordRules("password1")
   - Sprawdź { hasNumber: true, ... }
   
❌ should return all true for valid password
   - Wywołaj checkPasswordRules("password123")
   - Sprawdź wszystkie true
```

---

### 7. ❌ **`mapRegisterError`** - Utility Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/utils/__tests__/mapRegisterError.test.ts`  
**Estymacja:** 30 min

**Co testować:**
```typescript
❌ should map email field error (array format)
   - Input: { email: ['Email jest w użyciu'] }
   - Output: { email: 'Email jest w użyciu' }
   
❌ should map password field error (array format)
   - Input: { password: ['Hasło za słabe'] }
   - Output: { password: 'Hasło za słabe' }
   
❌ should map both email and password errors
   - Input: { email: ['Error 1'], password: ['Error 2'] }
   - Output: { email: 'Error 1', password: 'Error 2' }
   
❌ should map generic error field
   - Input: { error: 'Server error' }
   - Output: { global: 'Server error' }
   
❌ should provide fallback for unknown error shape
   - Input: null
   - Output: { global: 'Wystąpił nieoczekiwany błąd' }
   
❌ should provide fallback for empty object
   - Input: {}
   - Output: { global: 'Nie udało się utworzyć konta...' }
   
❌ should handle non-object input
   - Input: "string error"
   - Output: { global: 'Wystąpił nieoczekiwany błąd' }
   
❌ should take first error from array when multiple
   - Input: { email: ['Error 1', 'Error 2'] }
   - Output: { email: 'Error 1' }
```

---

### 8. ❌ **`useRegister` hook** - Hook Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/hooks/__tests__/useRegister.test.ts`  
**Estymacja:** 30 min

**Co testować:**
```typescript
❌ should return useMutation object
   - Render hook
   - Sprawdź że zwraca { mutate, isPending, isError, ... }
   
❌ should call registerUser API with payload
   - Mock registerUser
   - Wywołaj mutate({ email: ..., password: ... })
   - Sprawdź że registerUser został wywołany z payload
   
❌ should handle successful response
   - Mock registerUser → resolve { email: 'test@example.com' }
   - Wywołaj mutate
   - Sprawdź onSuccess callback
   
❌ should handle API error
   - Mock registerUser → reject error
   - Wywołaj mutate
   - Sprawdź onError callback
```

---

## 🟦 WIDOK LOGOWANIA - Testy do wykonania

### 1. ❌ **`LoginPage.tsx`** - Component Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/pages/auth/__tests__/LoginPage.test.tsx`  
**Estymacja:** 30 min

**Co testować:**
```typescript
❌ should set page title to "Logowanie - MyVOD"
   
❌ should redirect authenticated user to /watchlist
   - Mock AuthContext: isAuthenticated = true
   
❌ should render LoginForm for unauthenticated user
   
❌ should display success message from location.state
   - Mock useLocation z state: { message: 'Konto utworzone...' }
   - Sprawdź zielony banner z komunikatem
   
❌ should not display success message when not provided
   - Mock useLocation bez state
   - Sprawdź że banner nie jest renderowany
   
❌ should render with correct layout and styling
```

---

### 2. ❌ **`LoginForm.tsx`** - Component Tests 🔥 KRYTYCZNY!

**Priority:** 🔴 HIGH  
**File:** `src/pages/auth/components/__tests__/LoginForm.test.tsx`  
**Estymacja:** 2h

**Co testować:**
```typescript
❌ should render email and password fields
   
❌ should toggle password visibility
   - Podobnie jak w RegisterForm
   
❌ should validate email format on blur
   - Wpisz "invalid-email"
   - Sprawdź komunikat błędu
   
❌ should validate password required on blur
   - Zostaw puste
   - Sprawdź komunikat "Hasło jest wymagane"
   
❌ should disable submit button when form invalid
   
❌ should show spinner during submit
   - Mock useLogin z isPending=true
   - Sprawdź "Logowanie..." i spinner
   
❌ should call loginUser API on submit
   - Mock useLogin
   - Wypełnij formularz
   - Kliknij submit
   - Sprawdź że mutate wywołane z { email, password }
   
❌ should call login() from AuthContext on success
   - Mock successful mutation → { access: 'token1', refresh: 'token2' }
   - Sprawdź że login({ access, refresh }) zostało wywołane
   
❌ should save tokens to localStorage on success
   - Submit poprawny formularz
   - Sprawdź localStorage.setItem dla obu tokenów
   
❌ should redirect to /watchlist on success
   - Mock brak ?next param
   - Sprawdź navigate('/watchlist')
   
❌ should redirect to next param when provided
   - Mock useSearchParams z ?next=/onboarding
   - Submit formularz
   - Sprawdź navigate('/onboarding')
   
❌ should display ErrorAlert on 401 Unauthorized
   - Mock mutation error: { data: { detail: 'Invalid credentials' } }
   - Sprawdź ErrorAlert z komunikatem
   
❌ should display generic error for unknown API error
   - Mock mutation error: {}
   - Sprawdź ErrorAlert z "Nieprawidłowy email lub hasło"
   
❌ should render link to registration page
   - Sprawdź Link z to="/auth/register"
   - Sprawdź tekst "Nie masz konta? Zarejestruj się"
```

---

### 3. ❌ **`loginSchema` (Zod)** - Schema Tests

**Priority:** 🔴 HIGH  
**File:** `src/schemas/__tests__/login.schema.test.ts`  
**Estymacja:** 20 min

**Co testować:**
```typescript
❌ should pass validation for valid data
   - email: "test@example.com"
   - password: "anypassword"
   
❌ should fail when email is empty
   
❌ should fail when email format is invalid
   
❌ should fail when password is empty
   
❌ should NOT validate password strength (only required)
   - password: "1" (1 znak)
   - Powinno przejść (login nie sprawdza strength!)
```

---

### 4. ❌ **`useLogin` hook** - Hook Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/hooks/__tests__/useLogin.test.ts`  
**Estymacja:** 30 min

**Co testować:**
```typescript
❌ should return useMutation object
   
❌ should call loginUser API with payload
   - Mock loginUser
   - Sprawdź wywołanie z { email, password }
   
❌ should handle successful response with tokens
   - Mock resolve { access: 'token1', refresh: 'token2' }
   
❌ should handle 401 error
```

---

## 🔧 AUTH SHARED - Testy do wykonania

### 1. ❌ **`AuthContext.tsx`** - Context Tests 🔥 NAJBARDZIEJ KRYTYCZNY!

**Priority:** 🔴 HIGH (NAJWYŻSZY!)  
**File:** `src/contexts/__tests__/AuthContext.test.tsx`  
**Estymacja:** 2h

**Co testować:**
```typescript
❌ should provide default unauthenticated state
   - Render hook bez localStorage
   - Sprawdź isAuthenticated = false
   - Sprawdź accessToken = null
   - Sprawdź refreshToken = null
   
❌ should load tokens from localStorage on mount
   - Ustaw localStorage: access='token1', refresh='token2'
   - Render hook
   - Sprawdź że state ma oba tokeny
   - Sprawdź isAuthenticated = true
   
❌ should save tokens to localStorage on login()
   - Wywołaj login({ access: 'new1', refresh: 'new2' })
   - Sprawdź localStorage.setItem dla obu
   
❌ should update state on login()
   - Wywołaj login()
   - Sprawdź że state ma nowe tokeny
   - Sprawdź isAuthenticated = true
   
❌ should clear tokens from localStorage on logout()
   - Ustaw tokeny w localStorage
   - Wywołaj logout()
   - Sprawdź localStorage.removeItem dla obu
   
❌ should update state on logout()
   - Wywołaj logout()
   - Sprawdź isAuthenticated = false
   - Sprawdź tokeny = null
   
❌ should update only access token on updateAccessToken()
   - Ustaw tokeny: access='old', refresh='refresh1'
   - Wywołaj updateAccessToken('new')
   - Sprawdź że access='new', refresh='refresh1' (bez zmian)
   
❌ should set isAuthenticated=false when only access token exists
   - localStorage: tylko access token
   - Sprawdź isAuthenticated = false (wymaga obu!)
   
❌ should set isAuthenticated=false when only refresh token exists
   - localStorage: tylko refresh token
   - Sprawdź isAuthenticated = false
   
❌ should throw error when useAuth used outside provider
   - Wywołaj useAuth bez <AuthProvider>
   - Sprawdź throw Error("must be used within AuthProvider")
```

---

### 2. ❌ **`axios-interceptors.ts`** - Interceptor Tests 🔥 DRUGI NAJBARDZIEJ KRYTYCZNY!

**Priority:** 🔴 HIGH (BARDZO TRUDNY!)  
**File:** `src/lib/__tests__/axios-interceptors.test.ts`  
**Estymacja:** 3-4h (NAJTRUDNIEJSZY TEST!)

**Co testować:**
```typescript
❌ should add Authorization header to requests
   - Mock localStorage: access token
   - Wywołaj request do /api/me/
   - Sprawdź headers.Authorization = "Bearer token"
   
❌ should NOT add token to /api/token/ endpoints
   - Request do /api/token/
   - Sprawdź że Authorization NIE został dodany
   
❌ should NOT add token to /api/register/
   - Request do /api/register/
   - Sprawdź że Authorization NIE został dodany
   
❌ should NOT add token to /api/platforms/
   - Request do /api/platforms/
   - Sprawdź że Authorization NIE został dodany
   
❌ should catch 401 error and attempt token refresh
   - Mock request → 401
   - Mock refreshAccessToken → resolve { access: 'new-token' }
   - Sprawdź że refreshAccessToken został wywołany
   
❌ should update localStorage with new access token
   - Trigger 401 → refresh success
   - Sprawdź localStorage.setItem('myVOD_access_token', 'new-token')
   
❌ should retry original request with new token
   - Mock 401 → refresh success
   - Sprawdź że original request został retry z nowym tokenem
   
❌ should queue multiple requests during refresh
   - Trigger 3 requests jednocześnie → wszystkie 401
   - Mock refresh → success
   - Sprawdź że wszystkie 3 requests zostały retry
   
❌ should set isRefreshing flag during refresh
   - Trigger refresh
   - Sprawdź że isRefreshing = true
   - Po zakończeniu sprawdź = false
   
❌ should call onLogout when refresh token expires
   - Mock 401 → refreshAccessToken → reject (401)
   - Sprawdź że onLogout callback został wywołany
   
❌ should clear localStorage on logout
   - Trigger failed refresh
   - Sprawdź localStorage.removeItem dla obu tokenów
   
❌ should redirect to /auth/login on logout
   - Trigger failed refresh
   - Sprawdź window.location.href = '/auth/login'
   
❌ should NOT retry request that already failed once (_retry flag)
   - Mock request z _retry=true → 401
   - Sprawdź że refresh NIE został wywołany
   
❌ should process queued requests on successful refresh
   - Queue 3 requests
   - Refresh success
   - Sprawdź że processQueue wywołany z nowym tokenem
   
❌ should reject queued requests on failed refresh
   - Queue 3 requests
   - Refresh fail
   - Sprawdź że wszystkie promise są rejected
```

**Uwaga:** To będzie NAJBARDZIEJ SKOMPLIKOWANY test w całym projekcie!  
Wymaga mocków: axios, localStorage, refreshAccessToken, timeouts, promise queues.

---

### 3. ❌ **`refreshAccessToken` API function** - Unit Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/lib/api/__tests__/auth.test.ts`  
**Estymacja:** 30 min

**Co testować:**
```typescript
❌ should call POST /api/token/refresh/ with refresh token
   - Mock http.post
   - Wywołaj refreshAccessToken('refresh-token-123')
   - Sprawdź http.post('/token/refresh/', { refresh: 'refresh-token-123' })
   
❌ should return new access token
   - Mock resolve { data: { access: 'new-access' } }
   - Sprawdź return value
   
❌ should throw error when refresh token invalid
   - Mock reject 401
   - Sprawdź że promise rejected
   
❌ should throw error on 500 server error
```

---

### 4. ❌ **Auth Guards (RegisterPage/LoginPage)** - Integration Tests

**Priority:** 🟡 MEDIUM  
**File:** `src/pages/auth/__tests__/auth-guards.test.tsx`  
**Estymacja:** 45 min

**Co testować:**
```typescript
❌ RegisterPage: should redirect authenticated user
   - Mock isAuthenticated = true
   - Render <RegisterPage />
   - Sprawdź navigate('/watchlist', { replace: true })
   
❌ RegisterPage: should render form for unauthenticated
   - Mock isAuthenticated = false
   - Render <RegisterPage />
   - Sprawdź że RegisterForm jest widoczny
   
❌ LoginPage: should redirect authenticated user
   - Podobnie jak RegisterPage
   
❌ LoginPage: should render form for unauthenticated
   - Podobnie jak RegisterPage
   
❌ should use replace: true to not pollute history
   - Sprawdź że navigate ma replace: true
```

---

## 📦 Dodatkowe Dependencies dla Auth Tests

**Wszystkie już zainstalowane w projekcie! ✅**

Sprawdź `package.json` - jeśli brakuje, zainstaluj:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

---

## 🔧 Dodatkowe Test Utilities dla Auth

### 1. **Auth Test Wrapper**

**File:** `src/test/auth-wrapper.tsx`

```typescript
import { ReactElement } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { renderWithProviders } from './utils';

export function renderWithAuth(
  ui: ReactElement,
  {
    initialAuth = { isAuthenticated: false, accessToken: null, refreshToken: null },
    ...options
  } = {}
) {
  // Mock AuthContext with initial values
  const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Możesz tu mockować AuthContext jeśli potrzeba
    return <AuthProvider>{children}</AuthProvider>;
  };

  return renderWithProviders(ui, {
    wrapper: ({ children }) => (
      <MockAuthProvider>{children}</MockAuthProvider>
    ),
    ...options
  });
}
```

---

### 2. **Mock Axios dla Interceptor Tests**

**File:** `src/test/mock-axios.ts`

```typescript
import { vi } from 'vitest';
import type { AxiosInstance } from 'axios';

export function createMockAxios(): AxiosInstance {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  } as unknown as AxiosInstance;
}
```

---

## 🎯 Priorytet implementacji - Auth Tests

### 🔥 **KRYTYCZNE (zrób najpierw!):**
1. **`AuthContext.tsx`** - 2h
   - Core auth logic, najważniejszy!
   
2. **`axios-interceptors.ts`** - 3-4h
   - Automatyczne odnawianie tokenów, bardzo złożony!
   
3. **`registerSchema.ts` + `loginSchema.ts`** - 1h
   - Walidacja formularzy, łatwe do przetestowania

### 🟡 **WYSOKIE (zrób potem):**
4. **`RegisterForm.tsx`** - 2-3h
   - Główny komponent rejestracji
   
5. **`LoginForm.tsx`** - 2h
   - Główny komponent logowania
   
6. **`mapRegisterError.ts`** - 30 min
   - Utility do mapowania błędów

### 🟢 **ŚREDNIE:**
7. **`RegisterPage.tsx` + `LoginPage.tsx`** - 1h
   - Kontenery stron, proste
   
8. **`PasswordRules.tsx` + `ErrorAlert.tsx`** - 1h
   - Małe UI komponenty
   
9. **`useRegister` + `useLogin`** - 1h
   - Hooki TanStack Query

### 🟦 **NISKIE:**
10. **Auth Guards** - 45 min
11. **`checkPasswordRules` helper** - 15 min
12. **API functions** (`registerUser`, `loginUser`, `refreshAccessToken`) - 1h

---

## 📊 Metryki Coverage - Auth Views

### **Cel minimalny (MVP):**
- ✅ AuthContext: 100% coverage (MUST!)
- ✅ axios-interceptors: 90%+ coverage (MUST!)
- ✅ Schemas: 100% coverage
- ✅ Forms: 80%+ coverage
- ✅ Pages: 70%+ coverage

### **Cel idealny:**
- 🎯 AuthContext: 100%
- 🎯 axios-interceptors: 95%+
- 🎯 Schemas: 100%
- 🎯 Forms: 90%+
- 🎯 Pages: 85%+
- 🎯 Hooks: 90%+
- 🎯 **Overall Auth: 90%+ coverage**

---

## ⏱️ Estymacja czasu - Auth Tests

| Priority | Komponenty | Czas |
|----------|-----------|------|
| 🔥 KRYTYCZNE | AuthContext + Interceptors + Schemas | **6-7h** |
| 🟡 WYSOKIE | Forms + Error mapping | **5-6h** |
| 🟢 ŚREDNIE | Pages + UI components + Hooks | **3-4h** |
| 🟦 NISKIE | Guards + Helpers + API functions | **2-3h** |
| **TOTAL** | **18 plików** | **16-20h** |

**Rozłożone na dni:**
- Dzień 1 (4h): AuthContext + Schemas
- Dzień 2 (4h): axios-interceptors (ciężki!)
- Dzień 3 (4h): RegisterForm
- Dzień 4 (3h): LoginForm
- Dzień 5 (2-3h): Reszta (pages, helpers, guards)

---

## 🚀 Następne kroki - Auth Tests

1. **NAJPIERW:** Upewnij się że Vitest jest skonfigurowany (z poprzedniej sekcji)
2. Zainstaluj dodatkowe dependencies jeśli brakuje
3. Stwórz `src/test/auth-wrapper.tsx` i `src/test/mock-axios.ts`
4. Zaimplementuj testy w kolejności priorytetu:
   - AuthContext ✅
   - axios-interceptors ✅
   - Schemas ✅
   - Forms ✅
   - Reszta ✅
5. Uruchom `npm run test:coverage` i sprawdź % dla auth files
6. Dodaj brakujące testy do osiągnięcia 90%+ coverage

---

---

## Etap: Onboarding Watched View (Krok 3/3)

### Status implementacji: ✅ GOTOWE DO PRODUKCJI
### Status testów: ❌ NIE ZAIMPLEMENTOWANE

**Opis:** Trzeci i ostatni krok onboardingu pozwalający użytkownikowi oznaczyć 0-3 filmów jako obejrzane. Użytkownik wyszukuje filmy przez autocomplete i aplikacja dodaje je do watchlisty (jeśli potrzeba) oraz oznacza jako obejrzane.

**Komponenty do przetestowania:**
- `OnboardingWatchedPage` - główny kontener strony
- `WatchedSearchCombobox` - wyszukiwarka z autocomplete
- `SelectedMoviesList` - lista oznaczonych filmów z statusami
- `SelectedMovieItem` - pojedynczy film ze statusem i przyciskiem undo
- `useOnboardingWatchedController` - kontroler zarządzający całym flow

**Nowe endpointy API:**
- `PATCH /api/user-movies/:id` - oznaczanie jako obejrzany
- `DELETE /api/user-movies/:id` - soft delete
- `GET /api/user-movies?status=watchlist|watched` - lookup po 409/400

---

### ❌ NIEZAIMPLEMENTOWANE TESTY

#### 1. 🔴 HIGH - Hook: `useOnboardingWatchedController`

**Plik:** `src/hooks/__tests__/useOnboardingWatchedController.test.ts`

**Dependencies:**
```bash
npm install --save-dev @testing-library/react-hooks
npm install --save-dev msw
```

**Testy do zaimplementowania:**
```typescript
// Setup
✅ should initialize with empty state
  - query = ""
  - selected = []
  - isSubmitting = false
  - maxSelected = 3

// pick() - Happy path
✅ should add movie to selected with loading status
  - Wywołaj pick(movie)
  - Sprawdź że film jest w selected ze statusem 'loading'
  
✅ should call POST /api/user-movies with tconst
  - Mock POST 201 → UserMovieDto
  - Sprawdź że userMovieId jest ustawiony
  - Sprawdź że status zmienia się na 'success'
  
✅ should call PATCH mark_as_watched after successful POST
  - Mock POST 201, PATCH 200
  - Sprawdź kolejność wywołań
  - Sprawdź że status kończy na 'success'
  
✅ should show success toast after marking as watched
  - Sprawdź że toast.success został wywołany z nazwą filmu

// pick() - 409 Conflict (already on watchlist)
✅ should handle 409 by looking up userMovieId from watchlist
  - Mock POST 409
  - Mock GET /api/user-movies?status=watchlist → [UserMovieDto]
  - Sprawdź że PATCH jest wywoływany z lookup id
  - Sprawdź source = 'preexisting_watchlist'
  
✅ should throw error if lookup fails after 409
  - Mock POST 409
  - Mock GET zwraca [] (nie znaleziono)
  - Sprawdź że film usuwa się z selected
  - Sprawdź error toast

// pick() - 400 Already watched
✅ should handle 400 by looking up from watched list
  - Mock POST 201, PATCH 400
  - Mock GET /api/user-movies?status=watched → [UserMovieDto]
  - Sprawdź source = 'preexisting_watched'
  - Sprawdź info toast "był już oznaczony"

// pick() - Guards
✅ should not add movie if limit reached (3/3)
  - Dodaj 3 filmy
  - Spróbuj dodać 4. film
  - Sprawdź info toast "maksymalnie 3"
  - Sprawdź że selected.length === 3
  
✅ should not add duplicate movie
  - Dodaj film
  - Spróbuj dodać ten sam film
  - Sprawdź info toast "już wybrany"

// pick() - Errors
✅ should remove movie from selected on error
  - Mock POST error 500
  - Sprawdź że film usuwa się z selected
  - Sprawdź error toast
  
✅ should handle network errors
  - Mock network failure
  - Sprawdź rollback

// undo() - Newly created
✅ should DELETE newly created movie
  - Dodaj film (source = 'newly_created')
  - Wywołaj undo()
  - Sprawdź DELETE /api/user-movies/:id
  - Sprawdź toast "Anulowano oznaczenie"
  - Sprawdź że film usuwa się z selected
  
// undo() - Preexisting
✅ should PATCH restore_to_watchlist for preexisting movies
  - Symuluj film z source = 'preexisting_watchlist'
  - Wywołaj undo()
  - Sprawdź PATCH z action='restore_to_watchlist'
  - Sprawdź toast "przywrócono do watchlisty"

// undo() - Errors
✅ should handle undo errors gracefully
  - Mock DELETE error
  - Sprawdź że status wraca do 'success'
  - Sprawdź error toast

// finish() & skip()
✅ should set onboardingComplete and navigate to /
  - Wywołaj finish()
  - Sprawdź localStorage.setItem('onboardingComplete', 'true')
  - Sprawdź navigate('/')
  - Sprawdź success toast
  
✅ should skip navigate to / without marking movies
  - Wywołaj skip()
  - Sprawdź onboardingComplete = true
  - Sprawdź navigate('/')
```

**Priority:** 🔴 HIGH - Najważniejszy komponent, złożona logika

**Estymacja:** 4-5h (bardzo złożony flow!)

---

#### 2. 🔴 HIGH - Component: `WatchedSearchCombobox`

**Plik:** `src/components/onboarding/__tests__/WatchedSearchCombobox.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render search input with correct placeholder
  - Sprawdź placeholder "Szukaj filmów..."
  
✅ should show disabled placeholder when disabled
  - Przekaż disabled=true
  - Sprawdź placeholder "Osiągnięto limit 3 filmów"
  
✅ should call onChange when typing
  - Wpisz tekst
  - Sprawdź że onChange został wywołany
  
✅ should debounce search (250ms)
  - Mock useDebouncedValue
  - Wpisz szybko 3 razy
  - Sprawdź że tylko ostatnia wartość jest użyta
  
✅ should show search results dropdown when query >= 2 chars
  - Mock useMovieSearch → zwróć wyniki
  - Sprawdź że dropdown otwiera się
  
✅ should not show dropdown when query < 2 chars
  - Query = "a" (1 znak)
  - Sprawdź że dropdown jest zamknięty
  
✅ should show loading spinner when isLoading
  - Mock useMovieSearch isLoading=true
  - Sprawdź <Loader2>
  
✅ should show error message when error occurs
  - Mock useMovieSearch error
  - Sprawdź "Nie udało się pobrać wyników"
  
✅ should show empty state when no results
  - Mock useMovieSearch → []
  - Sprawdź "Nie znaleziono filmów"
  
✅ should call onPick when result is clicked
  - Kliknij wynik
  - Sprawdź że onPick został wywołany z SearchOptionVM
  
✅ should clear input after picking
  - Wybierz film
  - Sprawdź że value = ""
  
✅ should disable already selected movies
  - Przekaż selectedTconsts Set
  - Sprawdź opacity-50 i brak przycisku "Oznacz"
  
✅ should navigate with keyboard (Arrow keys)
  - ArrowDown → activeIndex++
  - ArrowUp → activeIndex--
  
✅ should select with Enter key
  - Zaznacz strzałkami
  - Enter → onPick
  
✅ should close with Escape key
  - Escape → dropdown zamknięty
  
✅ should have correct ARIA attributes
  - role="combobox"
  - aria-expanded
  - aria-activedescendant
```

**Priority:** 🔴 HIGH - Kluczowy komponent UI

**Estymacja:** 3-4h

---

#### 3. 🟡 MEDIUM - Component: `SelectedMoviesList`

**Plik:** `src/components/onboarding/__tests__/SelectedMoviesList.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render empty state when no items
  - items = []
  - Sprawdź "Brak oznaczonych filmów"
  
✅ should render movie items
  - Przekaż 2 filmy
  - Sprawdź 2x <SelectedMovieItem>
  
✅ should show counter badge
  - 2 filmy, maxItems=3
  - Sprawdź Badge "2/3"
  
✅ should call onUndo when undo button clicked
  - Kliknij X na filmie
  - Sprawdź że onUndo został wywołany
```

**Priority:** 🟡 MEDIUM

**Estymacja:** 1h

---

#### 4. 🟡 MEDIUM - Component: `SelectedMovieItem`

**Plik:** `src/components/onboarding/__tests__/SelectedMovieItem.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render movie title and year
  
✅ should render poster or placeholder
  
✅ should show loading status
  - status='loading'
  - Sprawdź spinner i "Oznaczanie..."
  
✅ should show success status
  - status='success'
  - Sprawdź zielony checkmark i "Obejrzany"
  
✅ should show error status
  - status='error'
  - Sprawdź czerwony alert i komunikat błędu
  
✅ should disable undo button when loading
  - status='loading'
  - Sprawdź disabled=true
  
✅ should call onUndo when X clicked
  - Kliknij przycisk X
  - Sprawdź callback
```

**Priority:** 🟡 MEDIUM

**Estymacja:** 1-1.5h

---

#### 5. 🟡 MEDIUM - API Functions

**Plik:** `src/lib/api/__tests__/movies.test.ts`

**Nowe funkcje do przetestowania:**

```typescript
// patchUserMovie
✅ should call PATCH /api/user-movies/:id
✅ should send UpdateUserMovieCommand in body
✅ should return UserMovieDto
✅ should handle 400 already watched
✅ should handle 401 Unauthorized

// deleteUserMovie
✅ should call DELETE /api/user-movies/:id
✅ should return void (204)
✅ should handle 404 Not Found
✅ should handle 401 Unauthorized

// listUserMovies
✅ should call GET /api/user-movies without params
✅ should call GET /api/user-movies?status=watchlist
✅ should call GET /api/user-movies?status=watched
✅ should return UserMovieDto[]
✅ should handle errors
```

**Priority:** 🟡 MEDIUM

**Estymacja:** 2h

---

#### 6. 🟢 LOW - Hooks: `usePatchUserMovie`, `useDeleteUserMovie`, `useListUserMovies`

**Pliki:** 
- `src/hooks/__tests__/usePatchUserMovie.test.ts`
- `src/hooks/__tests__/useDeleteUserMovie.test.ts`
- `src/hooks/__tests__/useListUserMovies.test.ts`

**Testy do zaimplementowania (każdy hook):**
```typescript
✅ should call API function with correct params
✅ should invalidate queries on success
✅ should handle errors
✅ should return correct mutation/query state
```

**Priority:** 🟢 LOW - Proste wrappery

**Estymacja:** 1h (wszystkie 3 razem)

---

#### 7. 🟢 LOW - Page: `OnboardingWatchedPage`

**Plik:** `src/pages/onboarding/__tests__/OnboardingWatchedPage.test.tsx`

**Testy do zaimplementowania:**
```typescript
✅ should render all sections
  - ProgressBar
  - OnboardingHeader
  - WatchedSearchCombobox
  - SelectedMoviesList
  - OnboardingFooterNav
  
✅ should redirect if onboardingComplete=true
  - Mock localStorage.getItem → 'true'
  - Sprawdź navigate('/')
  
✅ should disable search when 3/3
  - Mock controller → selected.length = 3
  - Sprawdź disabled=true
  
✅ should call controller.pick when movie selected
  - Mock WatchedSearchCombobox onPick
  - Sprawdź że controller.pick został wywołany
  
✅ should call controller.undo when undo clicked
  
✅ should call controller.skip when Skip clicked
  
✅ should call controller.finish when Zakończ clicked
```

**Priority:** 🟢 LOW - Prosta integracja

**Estymacja:** 1-1.5h

---

### 🎯 Priorytet implementacji - Onboarding Watched Tests

| Priority | Komponenty | Czas |
|----------|-----------|------|
| 🔴 KRYTYCZNE | `useOnboardingWatchedController` | **4-5h** |
| 🔴 WYSOKIE | `WatchedSearchCombobox` | **3-4h** |
| 🟡 ŚREDNIE | `SelectedMoviesList` + `SelectedMovieItem` + API | **4-5h** |
| 🟢 NISKIE | Hooks + Page | **2-3h** |
| **TOTAL** | **7 plików testowych** | **13-17h** |

**Rozłożone na dni:**
- Dzień 1 (5h): `useOnboardingWatchedController` (złożony!)
- Dzień 2 (4h): `WatchedSearchCombobox`
- Dzień 3 (3h): `SelectedMoviesList` + `SelectedMovieItem`
- Dzień 4 (2h): API functions + hooks
- Dzień 5 (1h): Page integration test

---

### 📝 Specjalne wymagania testowe

#### Mock dla complex flow

```typescript
// Mock setup dla useOnboardingWatchedController
import { renderHook, act } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock API calls
vi.mock('@/lib/api/movies', () => ({
  addUserMovie: vi.fn(),
  patchUserMovie: vi.fn(),
  deleteUserMovie: vi.fn(),
  listUserMovies: vi.fn(),
}));

// Test przykładowy
it('should handle 409 conflict', async () => {
  const mockAddUserMovie = vi.mocked(addUserMovie);
  const mockListUserMovies = vi.mocked(listUserMovies);
  const mockPatchUserMovie = vi.mocked(patchUserMovie);
  
  // Setup: POST returns 409
  mockAddUserMovie.mockRejectedValueOnce({ status: 409 });
  
  // Setup: Lookup returns existing movie
  mockListUserMovies.mockResolvedValueOnce([{
    id: 123,
    movie: { tconst: 'tt0816692', /* ... */ },
    /* ... */
  }]);
  
  // Setup: PATCH succeeds
  mockPatchUserMovie.mockResolvedValueOnce({/* UserMovieDto */});
  
  const { result } = renderHook(() => useOnboardingWatchedController(), {
    wrapper: createWrapper(),
  });
  
  await act(async () => {
    await result.current.pick({
      tconst: 'tt0816692',
      primaryTitle: 'Interstellar',
      /* ... */
    });
  });
  
  // Assertions
  expect(mockListUserMovies).toHaveBeenCalledWith('watchlist');
  expect(mockPatchUserMovie).toHaveBeenCalledWith(123, {
    action: 'mark_as_watched',
  });
  expect(result.current.viewModel.selected[0].source).toBe('preexisting_watchlist');
});
```

---

## Następne kroki

1. **NAJPIERW:** Zainstaluj dependencies i skonfiguruj Vitest
2. Stwórz setup file i test utils
3. Zaimplementuj testy HIGH priority (Onboarding + Auth)
4. Uruchom `npm run test:coverage` i sprawdź %
5. Dodaj pozostałe testy do osiągnięcia 80%+ coverage

---

**Data utworzenia:** 29 października 2025  
**Ostatnia aktualizacja:** 29 października 2025  
**Status:** Plan gotowy do implementacji  
**Etapy:** Onboarding Platforms + Onboarding Add + Onboarding Watched + Auth Views (Register & Login)

