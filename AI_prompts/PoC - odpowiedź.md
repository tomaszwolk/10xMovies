# Prompt dla Generatora Proof of Concept (PoC) - Aplikacja MyVOD

## Kontekst i Cel PoC

**Kim jesteś:** Jesteś generatorem kodu tworzącym Proof of Concept (PoC). Twoim zadaniem jest stworzenie minimalnej, działającej aplikacji webowej na podstawie poniższych wytycznych, aby zweryfikować kluczową funkcjonalność produktu.

**Nazwa aplikacji:** MyVOD

**Główna idea:** Aplikacja ma pomagać użytkownikom w zarządzaniu listą filmów do obejrzenia (watchlist) i sprawdzaniu ich dostępności na platformach VOD.

**Cel tego PoC:** Zweryfikowanie podstawowego przepływu użytkownika: wyświetlenie listy filmów, dodanie kilku z nich do osobistej watchlisty oraz zweryfikowanie, czy ich status dostępności w serwisach VOD jest poprawnie i czytelnie wyświetlany. PoC będzie bazować wyłącznie na danych-zaślepkach (dummy data) i uproszczonym stosie technologicznym.

---

## Wymagania Funkcjonalne dla PoC

Twoim zadaniem jest stworzenie aplikacji składającej się z dwóch głównych części:

1.  **Główna lista filmów:**
    *   Wyświetl predefiniowaną, sztywno zakodowaną listę 10 filmów.
    *   Przy każdym filmie umieść przycisk "Dodaj do watchlisty".

2.  **Sekcja "Moja watchlista":**
    *   Wyświetlaj filmy, które użytkownik dodał z głównej listy.
    *   Każdy film na watchliście musi wyraźnie pokazywać swój status dostępności VOD (np. za pomocą kolorowej ikony, etykiety "Dostępny" / "Niedostępny").

---

## Wymagania Dotyczące Danych (Dummy Data)

Aplikacja nie będzie łączyć się z prawdziwą bazą danych ani zewnętrznym API. Zamiast tego:

*   **Backend:** Stwórz sztywno zakodowaną listę 10 filmów.
*   **Struktura danych:** Każdy film powinien mieć co najmniej `id`, `tytuł`, `rok_produkcji` oraz `status_dostepnosci_vod`.
*   **Status dostępności:**
    *   **5 filmów** musi mieć status "Dostępny".
    *   **5 filmów** musi mieć status "Niedostępny".

---

## Uproszczony Stos Technologiczny

Bazując na dokumencie `tech-stack.md`, użyj następującego, uproszczonego stosu:

*   **Backend:**
    *   **Framework:** Django + Django REST Framework.
    *   **Baza danych:** Użyj wbudowanej w Django bazy `SQLite`. Nie konfiguruj PostgreSQLa ani Supabase.
    *   **API:** Stwórz jeden prosty endpoint, np. `/api/movies/`, który będzie zwracał całą, sztywno zakodowaną listę 10 filmów w formacie JSON.

*   **Frontend:**
    *   **Framework:** React + Vite.
    *   **Komunikacja z API:** Użyj wbudowanego w przeglądarkę `fetch` API do pobrania listy filmów z backendu.
    *   **Zarządzanie stanem:** Użyj podstawowych hooków Reacta, takich jak `useState`, do zarządzania listą filmów i watchlistą.
    *   **Stylizacja:** Użyj Tailwind CSS do podstawowej stylizacji interfejsu, aby był czytelny i estetyczny.

---

## Funkcje Wykluczone z PoC

Aby maksymalnie uprościć PoC, **wyklucz** następujące funkcjonalności:

*   System rejestracji, logowania i autentykacji użytkowników.
*   Integracje z jakimikolwiek zewnętrznymi API (Watchmode, TMDB, Gemini AI).
*   Prawdziwa baza danych filmów z IMDb.
*   Wyszukiwarka filmów, sortowanie, filtrowanie.
*   Oznaczanie filmów jako obejrzane.
*   Sugestie AI.
*   Onboarding dla nowych użytkowników.
*   Złożone narzędzia deweloperskie i DevOps (Docker, Celery, Redis, CI/CD, Nginx, Gunicorn).

---

## **Kluczowy Wymóg: Plan Działania**

**Zanim napiszesz jakikolwiek kod, musisz przedstawić mi do akceptacji szczegółowy plan działania.**

Plan powinien zawierać:

1.  **Strukturę plików:** Proponowany układ katalogów i plików zarówno dla backendu (Django), jak i frontendu (React).
2.  **Definicję API:** Opis endpointu, który stworzysz, wraz z przykładem odpowiedzi JSON.
3.  **Komponenty Frontendowe:** Listę komponentów React, które zamierzasz utworzyć (np. `MovieList`, `Watchlist`, `MovieItem`) i krótki opis odpowiedzialności każdego z nich.

**Poczekaj na moją wyraźną akceptację planu, zanim przejdziesz do jego implementacji.**
