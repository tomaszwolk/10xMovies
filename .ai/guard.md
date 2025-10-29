# 🎯 PLAN: Jak "Soft Guard" ma działać

## Założenia główne

### Cel biznesowy:
- Nowy użytkownik powinien przejść onboarding (wybrać platformy, dodać filmy)
- ALE: jeśli user nie ma czasu teraz, może to pominąć i wrócić później
- User może w każdej chwili wrócić do onboardingu i zmienić/rozszerzyć swoje wybory

### Wymogi techniczne:
1. Guard sprawdza status onboardingu **TYLKO RAZ** po zalogowaniu
2. Jeśli onboarding niekompletny → przekieruj do pierwszego niekompletnego kroku
3. Po tym jednym sprawdzeniu → **NIE BLOKUJ** już niczego, pozwól na dowolną nawigację
4. Przyciski "Skip" po prostu nawigują do `/` - Guard ich nie blokuje
5. Strony onboardingu pokazują już wybrane opcje (jeśli user wraca)

---

## 📝 Szczegółowy plan działania

### Krok 1: Logowanie

```
User → klika "Login"
     → AuthContext.login() zapisuje tokeny
     → AuthContext.login() CZYŚCI flagę sessionStorage['onboarding_initial_check_done']
     → Router przekierowuje do '/'
```

**Dlaczego czyścimy flagę?**
Bo przy każdym nowym logowaniu chcemy ŚWIEŻO sprawdzić status onboardingu.

---

### Krok 2: Pierwsze sprawdzenie (OnboardingGuard)

```
OnboardingGuard montuje się (WAŻNE: tylko RAZ dla całej aplikacji)
     ↓
useEffect uruchamia się
     ↓
Sprawdza: czy już sprawdzaliśmy w tej sesji?
     ├─ TAK (flaga = true)  → RETURN (nic nie rób, pozwól na nawigację)
     └─ NIE (flaga = false) → Sprawdź status onboardingu
                             ↓
                             Fetchuje dane (platformy, watchlist, watched)
                             ↓
                             Oblicza: czy onboarding kompletny?
                             ├─ TAK  → Ustaw flagę, nie przekierowuj
                             └─ NIE  → Ustaw flagę, PRZEKIERUJ do pierwszego niekompletnego kroku
```

**Kluczowe:**
- Flaga `hasCheckedRef.current` = true (persystowana w pamięci, dopóki komponent żyje)
- Flaga `sessionStorage` = 'true' (persystowana między refresh'ami strony)
- **OBE FLAGI** blokują kolejne sprawdzenia

---

### Krok 3: User jest na stronie onboardingu

```
User widzi np. /onboarding/platforms
     ↓
Może:
     ├─ Wybrać platformy i kliknąć "Dalej" → idzie do /onboarding/add
     ├─ Kliknąć "Skip" → navigate('/') → Guard NIE blokuje → user trafia do '/'
     └─ Ręcznie wejść na inną stronę (np. /watchlist) → Guard NIE blokuje
```

**Dlaczego Guard NIE blokuje?**
Bo flaga `hasCheckedRef.current` = true, więc useEffect mówi: "już sprawdziliśmy, return".

---

### Krok 4: User klika "Skip"

```
OnboardingPlatformsPage.handleSkip()
     ↓
navigate('/')
     ↓
React Router zmienia route z '/onboarding/platforms' na '/'
     ↓
OnboardingGuard RE-RENDERUJE SIĘ (ale NIE unmountuje!)
     ↓
useEffect uruchamia się ponownie (bo location.pathname się zmienił)
     ↓
Sprawdza: hasCheckedRef.current === true?
     ├─ TAK → RETURN (nic nie rób)
     └─ NIE → (tego nie powinno być!)
```

**Kluczowe:**
- OnboardingGuard **NIE unmountuje się**, bo jest w `ProtectedLayout` który owija wszystkie routes
- `hasCheckedRef` jest zachowany między renderami
- useEffect uruchamia się przy każdej nawigacji (bo `location.pathname` w dependencies), ale **od razu returnuje** jeśli flaga = true

---

### Krok 5: User odświeża stronę (F5)

```
Przeglądarka ładuje stronę od nowa
     ↓
React unmountuje WSZYSTKIE komponenty
     ↓
OnboardingGuard montuje się OD NOWA
     ↓
hasCheckedRef.current = false (nowa instancja!)
     ↓
useEffect uruchamia się
     ↓
Sprawdza: sessionStorage['onboarding_initial_check_done'] === 'true'?
     ├─ TAK → RETURN (nic nie rób, user już sprawdzał w tej sesji przeglądarki)
     └─ NIE → Sprawdź onboarding (jak w Kroku 2)
```

**Kluczowe:**
- `useRef` resetuje się przy unmount, ALE
- `sessionStorage` przetrwa refresh strony
- Więc user NIE będzie przekierowany po refresh

---

### Krok 6: User wylogowuje się i loguje ponownie

```
User klika "Logout"
     ↓
AuthContext.logout() CZYŚCI sessionStorage['onboarding_initial_check_done']
     ↓
User loguje się ponownie
     ↓
AuthContext.login() CZYŚCI sessionStorage['onboarding_initial_check_done'] (na wszelki wypadek)
     ↓
Guard sprawdza onboarding OD NOWA (jak w Kroku 2)
```

**Dlaczego czyścimy przy logout i login?**
- Przy logout: żeby następny user (na tym samym komputerze) miał czyste sprawdzenie
- Przy login: żeby mieć pewność że flaga jest czysta (safety)

---

## 🔑 Kluczowe elementy systemu

### 1. **Pojedyncza instancja OnboardingGuard**

```tsx
// router.tsx
{
  path: "/",
  element: <ProtectedLayout />,  // ← OnboardingGuard tu w środku
  children: [
    { index: true, element: <AppRoot /> },
    { path: "watchlist", element: <WatchlistPage /> },
    { path: "onboarding/platforms", element: <OnboardingPlatformsPage /> },
    // ... etc
  ]
}
```

**Dlaczego?**
Bo jeśli każdy route ma osobny `<OnboardingGuard>`, to przy zmianie strony:
- Stary Guard unmountuje się
- Nowy Guard mountuje się
- `hasCheckedRef` resetuje się do `false`
- Guard sprawdza onboarding PONOWNIE i przekierowuje!

### 2. **Dwie flagi zabezpieczające**

```tsx
// W pamięci (dopóki komponent żyje)
const hasCheckedRef = useRef(false);

// W sessionStorage (przetrwa refresh)
const hasCheckedThisSession = sessionStorage.getItem(ONBOARDING_CHECKED_KEY) === "true";

// Sprawdzenie:
if (hasCheckedThisSession || hasCheckedRef.current) {
  return; // NIE SPRAWDZAJ PONOWNIE
}
```

**Dlaczego dwie?**
- `useRef` - szybkie, w pamięci, działa dopóki komponent żyje
- `sessionStorage` - przetrwa refresh strony (F5)
- **Razem** = niezawodna ochrona przed wielokrotnym sprawdzaniem

### 3. **useEffect z location.pathname w dependencies**

```tsx
useEffect(() => {
  // ... logika ...
}, [isLoading, isOnboardingComplete, requiredStep, location.pathname, navigate]);
```

**Dlaczego `location.pathname` jest w dependencies?**
Bo chcemy że effect uruchomi się przy każdej nawigacji, ALE:
- Jeśli flaga = true → od razu return
- Jeśli flaga = false → to pierwszy raz, sprawdź i przekieruj

**Dlaczego nie uruchomić tylko raz (`[]` dependencies)?**
Bo wtedy:
1. Guard mountuje się gdy user jest np. na `/auth/login`
2. Effect uruchamia się raz
3. `isLoading = true` → return early
4. Queries się ładują...
5. Effect **NIE URUCHOMI SIĘ PONOWNIE** (bo `[]`)
6. Guard nigdy nie sprawdzi statusu!

---

## ❌ Co może pójść nie tak?

### Scenariusz A: Guard unmountuje się przy każdej nawigacji

**Objaw:** Skip przekierowuje z powrotem do platforms

**Przyczyna:** OnboardingGuard jest używany osobno dla każdego route:
```tsx
// ❌ ŹLE
{ path: "/", element: <ProtectedRoute><OnboardingGuard><AppRoot /></OnboardingGuard></ProtectedRoute> }
{ path: "/watchlist", element: <ProtectedRoute><OnboardingGuard><WatchlistPage /></OnboardingGuard></ProtectedRoute> }
```

**Co się dzieje:**
1. User na `/` → Guard #1 mountuje się, ustawia flagę
2. User klika Skip → navigate('/watchlist')
3. Guard #1 **unmountuje się**, flaga zginie
4. Guard #2 mountuje się, flaga = false → SPRAWDZA ONBOARDING → PRZEKIEROWANIE!

**Rozwiązanie:** Jeden ProtectedLayout

---

### Scenariusz B: Coś nadpisuje sessionStorage

**Objaw:** `hasCheckedThisSession` zawsze false

**Przyczyna:** 
- Klucz jest nieprawidłowy
- Coś czyści sessionStorage w złym momencie
- sessionStorage jest wyłączone w przeglądarce

**Rozwiązanie:** 
- Sprawdź w DevTools → Application → Session Storage
- Upewnij się że klucz `onboarding_initial_check_done` się pojawia

---

### Scenariusz C: Guard uruchamia się przed załadowaniem danych

**Objaw:** Przekierowanie następuje mimo kompletnego onboardingu

**Przyczyna:** `isLoading` nie blokuje poprawnie

**Rozwiązanie:** Sprawdź czy `if (isLoading) return` działa

---

## ✅ Podsumowanie planu

1. **Login** → czyści flagę → przekierowuje do `/`
2. **Guard montuje się** → sprawdza flagę → flaga = false → sprawdza onboarding
3. **Onboarding niekompletny** → ustawia flagę → przekierowuje do pierwszego kroku
4. **User na onboarding page** → może Skip → navigate('/') → **Guard NIE blokuje** (flaga = true)
5. **User na głównej stronie** → może wszędzie → **Guard NIE blokuje** (flaga = true)
6. **User refresh (F5)** → Guard montuje się od nowa → sprawdza sessionStorage → flaga = true → **NIE blokuje**
7. **User logout/login** → czyści flagę → **cykl od początku**

**Wszystko opiera się na:**
- Pojedyncza instancja OnboardingGuard (nie unmountuje się przy nawigacji)
- Dwie flagi (useRef + sessionStorage)
- Sprawdzenie TYLKO RAZ po zalogowaniu

---

## 🔍 Debugging - Co sprawdzić w logach

### Przy pierwszym zalogowaniu (POWINNO BYĆ):
```
[ProtectedLayout] 🏗️ Rendering
[OnboardingGuard] 🎨 Component RENDER { path: '/' }
[OnboardingGuard] 🟢 Component MOUNTED
[OnboardingGuard] 🔄 useEffect START { isLoading: true }
[OnboardingGuard] ⏸️ Still loading, returning early

... queries ładują się ...

[OnboardingGuard] 🔄 useEffect START { isLoading: false }
[OnboardingGuard] 📊 State check: { hasCheckedRef: false, hasCheckedThisSession: false }
[OnboardingGuard] 🎯 First check - setting flags
[OnboardingGuard] 🔀 Redirecting to first incomplete step: /onboarding/platforms

[OnboardingGuard] 🎨 Component RENDER { path: '/onboarding/platforms' }
[OnboardingGuard] 🔄 useEffect START
[OnboardingGuard] 📊 State check: { hasCheckedRef: true, hasCheckedThisSession: true }
[OnboardingGuard] ✅ Already checked, skipping redirect
```

### Przy Skip (POWINNO BYĆ):
```
[OnboardingPlatforms] 🏃 Skip button clicked - navigating to /
[OnboardingPlatforms] ✅ navigate() called

[OnboardingGuard] 🎨 Component RENDER { path: '/' }
[OnboardingGuard] 🔄 useEffect START
[OnboardingGuard] 📊 State check: { hasCheckedRef: true, hasCheckedThisSession: true }
[OnboardingGuard] ✅ Already checked, skipping redirect
```

### RED FLAGS (NIE POWINNO BYĆ):
❌ `🔴 Component UNMOUNTED` przy zmianie strony → Guard unmountuje się!
❌ `hasCheckedRef: false` po pierwszym sprawdzeniu → useRef resetuje się!
❌ `🔀 Redirecting` po Skip → flagi nie działają!
❌ `guardInstanceId` (obiekt) zmienia się → nowa instancja Guarda!

---

## 📂 Pliki zaangażowane

1. **`src/router.tsx`** - Struktura routingu z `ProtectedLayout`
2. **`src/components/OnboardingGuard.tsx`** - Logika guarda
3. **`src/hooks/useOnboardingStatus.ts`** - Fetchowanie danych i obliczanie statusu
4. **`src/contexts/AuthContext.tsx`** - Czyszczenie flagi przy login/logout
5. **`src/pages/onboarding/*.tsx`** - Strony onboardingu z przyciskami Skip

