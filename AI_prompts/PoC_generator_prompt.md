# Prompt dla Generatora Proof of Concept (PoC) - Aplikacja MyVOD

## Kontekst i Cel PoC

**Kim jesteś:** Jesteś generatorem kodu tworzącym Proof of Concept (PoC). Twoim zadaniem jest stworzenie minimalnej, działającej aplikacji webowej na podstawie poniższych wytycznych.

**Cel PoC:** Zweryfikowanie podstawowego przepływu aplikacji "MyVOD". Użytkownik powinien móc zobaczyć listę filmów, dodać wybrane pozycje do swojej "watchlisty" i wyraźnie zobaczyć, które z nich są dostępne w serwisach VOD, a które nie.

---

## Wymagania Funkcjonalne

Stwórz prostą aplikację webową składającą się z dwóch głównych sekcji:

1.  **Główna lista filmów:**
    *   Wyświetl 10 filmów pochodzących z predefiniowanej, sztywno zakodowanej listy.
    *   Przy każdym filmie umieść przycisk "Dodaj do watchlisty".

2.  **"Moja watchlista":**
    *   Wyświetlaj filmy, które użytkownik dodał z głównej listy.
    *   Każdy film na watchliście musi wyraźnie pokazywać status dostępności VOD (np. etykieta "Dostępny" / "Niedostępny").

---

## Wymagania Dotyczące Danych

Aplikacja będzie działać wyłącznie na danych-zaślepkach (dummy data):

*   Stwórz w backendzie sztywno zakodowaną listę 10 filmów.
*   Każdy film musi zawierać pola: `id`, `tytuł`, `rok_produkcji` oraz `status_dostepnosci_vod`.
*   Ustaw status dostępności VOD dla 5 filmów na "Dostępny" i dla pozostałych 5 na "Niedostępny".

---

## Stos Technologiczny

*   **Backend:**
    *   **Framework:** Django + Django REST Framework.
    *   **Baza danych:** Wbudowana w Django baza `SQLite`.
    *   **API:** Utwórz jeden endpoint (`/api/movies/`) zwracający listę 10 filmów w formacie JSON.

*   **Frontend:**
    *   **Framework:** React + Vite.
    *   **Komunikacja z API:** Użyj `fetch` API do pobrania danych z backendu.
    *   **Zarządzanie stanem:** Użyj hooka `useState` do zarządzania watchlistą.
    *   **Stylizacja:** Użyj Tailwind CSS do podstawowej, czytelnej stylizacji.

---

## **Kluczowy Wymóg: Plan Działania**

**Zanim napiszesz jakikolwiek kod, musisz przedstawić mi do akceptacji szczegółowy plan działania.**

Plan powinien zawierać:

1.  **Strukturę plików:** Proponowany układ katalogów dla backendu i frontendu.
2.  **Definicję API:** Opis endpointu wraz z przykładem odpowiedzi JSON.
3.  **Komponenty Frontendowe:** Listę komponentów React (np. `MovieList`, `Watchlist`) i opis ich odpowiedzialności.

**Poczekaj na moją akceptację planu, zanim przejdziesz do implementacji.**
