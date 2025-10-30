# Onboarding Guard - Flow Explanation

## 🎯 Cel
OnboardingGuard to "soft guard" który:
1. **Przy pierwszym zalogowaniu**: sprawdza status onboardingu i przekierowuje do pierwszego niekompletnego kroku
2. **Po tym jednym sprawdzeniu**: pozwala na dowolną nawigację (user może wchodzić wszędzie)

## 📁 Pliki zaangażowane

### 1. `src/router.tsx`
**Rola**: Definiuje strukturę routingu
**Kluczowe elementy**:
- `ProtectedLayout()` - komponent który owija wszystkie protected routes
- Zapewnia że `OnboardingGuard` jest mountowany **tylko raz**

```tsx
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        <Outlet />  {/* Tu renderują się child routes */}
      </OnboardingGuard>
    </ProtectedRoute>
  );
}
```

**Struktura routów**:
```
/ (ProtectedLayout - JEDNA instancja OnboardingGuard)
  ├─ / (AppRoot)
  ├─ /watchlist
  └─ /onboarding
      ├─ /platforms
      ├─ /add
      └─ /watched
```

### 2. `src/components/OnboardingGuard.tsx`
**Rola**: Sprawdza onboarding status i przekierowuje TYLKO RAZ

**Kluczowe zmienne**:
- `hasCheckedRef` (useRef) - persystowana między renderami, resetowana przy unmount
- `sessionStorage['onboarding_initial_check_done']` - persystowana między renderami, resetowana przy logout/login

**Logika**:
```tsx
useEffect(() => {
  if (isLoading) return;
  
  const hasCheckedThisSession = sessionStorage.getItem(ONBOARDING_CHECKED_KEY) === "true";
  
  // JUŻ SPRAWDZILIŚMY? → return (nie przekierowuj)
  if (hasCheckedThisSession || hasCheckedRef.current) {
    return;
  }
  
  // PIERWSZY RAZ? → ustaw flagi
  hasCheckedRef.current = true;
  sessionStorage.setItem(ONBOARDING_CHECKED_KEY, "true");
  
  // Jeśli onboarding niekompletny → przekieruj
  if (!isOnboardingComplete && requiredStep) {
    navigate(requiredStep, { replace: true });
  }
}, [isLoading, isOnboardingComplete, requiredStep, location.pathname, navigate]);
```

**Dependencies w useEffect**:
- `isLoading` - czeka aż dane się załadują
- `isOnboardingComplete` - zmienia się gdy user ukończy krok
- `requiredStep` - zmienia się gdy user ukończy krok
- `location.pathname` - **URUCHAMIA EFFECT PO KAŻDEJ NAWIGACJI**
- `navigate` - funkcja (nie zmienia się)

### 3. `src/hooks/useOnboardingStatus.ts`
**Rola**: Pobiera dane i oblicza status onboardingu

**Wykonuje 3 queries**:
1. `useQuery(['user-profile'])` → pobiera profil (platformy)
2. `useQuery(['user-movies', 'watchlist'])` → pobiera watchlist
3. `useQuery(['user-movies', 'watched'])` → pobiera watched

**Zwraca**:
- `isLoading` - czy jeszcze ładuje
- `isOnboardingComplete` - czy wszystkie 3 kroki ukończone
- `requiredStep` - pierwsza niekompletna strona lub null
- `progress` - szczegóły (hasPlatforms, hasWatchlistMovies, hasWatchedMovies)

### 4. `src/contexts/AuthContext.tsx`
**Rola**: Zarządza tokenami JWT i czyszczeniem flag

**Kluczowe funkcje**:
```tsx
const login = (tokens) => {
  // ... zapisuje tokeny ...
  sessionStorage.removeItem(ONBOARDING_CHECKED_KEY);  // ← RESET flagi
};

const logout = () => {
  // ... usuwa tokeny ...
  sessionStorage.removeItem(ONBOARDING_CHECKED_KEY);  // ← RESET flagi
};
```

### 5. `src/pages/onboarding/OnboardingPlatformsPage.tsx` (i inne)
**Rola**: Strony onboardingu z przyciskiem Skip

```tsx
const handleSkip = () => {
  navigate('/');  // Prosta nawigacja, Guard pozwala
};
```

## 🔄 Flow krok po kroku

### Scenariusz 1: Nowy użytkownik loguje się

1. **User klika Login**
   ```
   [AuthContext.login()] → Zapisuje tokeny
                         → sessionStorage.removeItem('onboarding_initial_check_done')
   ```

2. **React Router przekierowuje do `/`**
   ```
   [ProtectedLayout] → renderuje
   [OnboardingGuard] → MOUNT (pierwszy raz)
                    → hasCheckedRef.current = false (init)
                    → sessionStorage = null (bo usunęliśmy)
   ```

3. **OnboardingGuard useEffect uruchamia się**
   ```
   [useOnboardingStatus] → Fetchuje dane
                        → hasPlatforms = false
                        → hasWatchlistMovies = false  
                        → hasWatchedMovies = false
                        → requiredStep = '/onboarding/platforms'
                        → isOnboardingComplete = false
   
   [OnboardingGuard useEffect] → isLoading = false
                               → hasCheckedThisSession = false
                               → hasCheckedRef.current = false
                               → NIE JUŻ SPRAWDZILIŚMY!
                               → hasCheckedRef.current = true ✅
                               → sessionStorage.setItem(..., 'true') ✅
                               → !isOnboardingComplete && requiredStep? TAK!
                               → navigate('/onboarding/platforms') 🔀
   ```

4. **React Router nawiguje do `/onboarding/platforms`**
   ```
   [ProtectedLayout] → RE-RENDER (bo zmiana route)
   [OnboardingGuard] → RE-RENDER (ale NIE unmount! Ta sama instancja!)
                    → hasCheckedRef.current = true (zachowane!)
   ```

5. **OnboardingGuard useEffect uruchamia się ZNOWU (bo location.pathname się zmienił)**
   ```
   [OnboardingGuard useEffect] → isLoading = false
                               → hasCheckedThisSession = true ✅
                               → hasCheckedRef.current = true ✅
                               → JUŻ SPRAWDZILIŚMY! → return ✅
                               → NIE MA PRZEKIEROWANIA!
   ```

6. **User widzi `/onboarding/platforms`** ✅

### Scenariusz 2: User klika Skip na platforms

1. **User klika przycisk Skip**
   ```
   [OnboardingPlatforms.handleSkip()] → navigate('/')
   ```

2. **React Router nawiguje do `/`**
   ```
   [ProtectedLayout] → RE-RENDER
   [OnboardingGuard] → RE-RENDER (ta sama instancja!)
                    → hasCheckedRef.current = true (zachowane!)
   ```

3. **OnboardingGuard useEffect uruchamia się**
   ```
   [OnboardingGuard useEffect] → isLoading = false
                               → hasCheckedThisSession = true ✅
                               → hasCheckedRef.current = true ✅
                               → JUŻ SPRAWDZILIŚMY! → return ✅
                               → NIE MA PRZEKIEROWANIA!
   ```

4. **User widzi `/`** ✅

### Scenariusz 3: User odświeża stronę (F5)

1. **Przeglądarka ładuje stronę od nowa**
   ```
   [React] → Wszystkie komponenty unmount
          → Wszystkie useRef resetują się
   [hasCheckedRef.current] → false (bo nowa instancja)
   [sessionStorage] → 'true' (zachowane!)
   ```

2. **OnboardingGuard mountuje się**
   ```
   [OnboardingGuard useEffect] → hasCheckedThisSession = true ✅ (z sessionStorage)
                               → hasCheckedRef.current = false
                               → JUŻ SPRAWDZILIŚMY! → return ✅
   ```

3. **User zostaje tam gdzie był** ✅

### Scenariusz 4: User wylogowuje się i loguje ponownie

1. **User klika Logout**
   ```
   [AuthContext.logout()] → sessionStorage.removeItem('onboarding_initial_check_done')
   ```

2. **User loguje się ponownie**
   ```
   [AuthContext.login()] → sessionStorage.removeItem('onboarding_initial_check_done')
   ```

3. **Guard sprawdza onboarding** → Ten sam flow jak Scenariusz 1

## 🐛 Potencjalne problemy

### Problem 1: Guard unmountuje się przy każdej nawigacji
**Objaw**: W konsoli widzisz "Component UNMOUNTED" przy każdej zmianie strony
**Przyczyna**: `OnboardingGuard` jest używany osobno dla każdego route zamiast w `ProtectedLayout`
**Rozwiązanie**: Sprawdź strukturę routera - `OnboardingGuard` powinien być w `ProtectedLayout`

### Problem 2: hasCheckedRef nie jest persystowany
**Objaw**: `hasCheckedRef.current` jest zawsze `false`
**Przyczyna**: Komponent unmountuje się (patrz Problem 1)
**Rozwiązanie**: Jak wyżej

### Problem 3: sessionStorage nie działa
**Objaw**: `hasCheckedThisSession` zawsze `false`
**Przyczyna**: Klucz się różni lub jest czyszczony w złym momencie
**Rozwiązanie**: Sprawdź czy `ONBOARDING_CHECKED_KEY` jest ten sam wszędzie

### Problem 4: useEffect uruchamia się za wcześnie
**Objaw**: Przekierowanie następuje mimo flag
**Przyczyna**: `isLoading` nie blokuje poprawnie
**Rozwiązanie**: Sprawdź czy `useOnboardingStatus` zwraca `isLoading = true` podczas ładowania

## 📊 Co powinieneś zobaczyć w konsoli

### Przy pierwszym zalogowaniu:
```
[ProtectedLayout] 🏗️ Rendering
[OnboardingGuard] 🎨 Component RENDER { path: '/' }
[OnboardingGuard] 🟢 Component MOUNTED
[OnboardingGuard] 🔄 useEffect START { isLoading: true, ... }
[OnboardingGuard] ⏸️ Still loading, returning early

... (queries się ładują) ...

[OnboardingGuard] 🔄 useEffect START { isLoading: false, ... }
[OnboardingGuard] 📊 State check: { hasCheckedRef: false, hasCheckedThisSession: false, ... }
[OnboardingGuard] 🎯 First check - setting flags
[OnboardingGuard] 🏁 Initial check - marked as checked
[OnboardingGuard] 🔀 Redirecting to first incomplete step: /onboarding/platforms

[ProtectedLayout] 🏗️ Rendering
[OnboardingGuard] 🎨 Component RENDER { path: '/onboarding/platforms' }
[OnboardingGuard] 🔄 useEffect START { isLoading: false, ... }
[OnboardingGuard] 📊 State check: { hasCheckedRef: true, hasCheckedThisSession: true, ... }
[OnboardingGuard] ✅ Already checked, skipping redirect
```

### Przy kliknięciu Skip:
```
[OnboardingPlatforms] 🏃 Skip button clicked - navigating to /
[OnboardingPlatforms] ✅ navigate() called

[ProtectedLayout] 🏗️ Rendering
[OnboardingGuard] 🎨 Component RENDER { path: '/' }
[OnboardingGuard] 🔄 useEffect START { isLoading: false, ... }
[OnboardingGuard] 📊 State check: { hasCheckedRef: true, hasCheckedThisSession: true, ... }
[OnboardingGuard] ✅ Already checked, skipping redirect
```

**NIE POWINNO BYĆ:**
- `🔴 Component UNMOUNTED` przy zmianie strony (oznacza że Guard się unmountuje)
- `🔀 Redirecting` po kliknięciu Skip (oznacza że flagi nie działają)

## 🔍 Debugging checklist

1. [ ] Czy widzisz `🔴 Component UNMOUNTED` przy zmianie strony?
2. [ ] Czy `hasCheckedRef.current` jest `true` po pierwszym sprawdzeniu?
3. [ ] Czy `guardInstanceId` (obiekt useRef) jest ten sam przy kolejnych renderach?
4. [ ] Czy w sessionStorage jest klucz `onboarding_initial_check_done`?
5. [ ] Czy guard mówi "Already checked, skipping redirect" przy Skip?
6. [ ] Czy pomimo "skipping redirect" następuje przekierowanie?

