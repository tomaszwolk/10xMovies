```markdown
# Dokument wymagań produktu (PRD) - MyVOD

Wersja: 1.0 MVP
Data: Październik 2025
Status: Draft

## 1. Przegląd produktu

MyVOD to aplikacja webowa umożliwiająca użytkownikom zarządzanie listą filmów do obejrzenia (watchlist) z automatycznym śledzeniem dostępności tytułów na platformach VOD[web:1][web:2]. Produkt rozwiązuje problem czasochłonnego przeszukiwania wielu platform streamingowych w poszukiwaniu konkretnych filmów, które użytkownik chce obejrzeć[web:9].

### Główne funkcjonalności MVP

Aplikacja umożliwia tworzenie spersonalizowanej watchlisty do 10 filmów, z automatycznym sprawdzaniem dostępności na wybranych platformach VOD: Netflix, HBO Max, Disney+, Prime Video i Apple TV+[web:1][web:2]. System wykorzystuje bazę danych IMDb dla podstawowych informacji o filmach oraz API Watchmode.com dla weryfikacji dostępności w czasie rzeczywistym[web:1][web:9]. Użytkownicy mogą oznaczać obejrzane tytuły, które są następnie wykorzystywane przez system rekomendacji oparty na AI (Gemini 2.0 Flash-Lite) do sugerowania kolejnych filmów do obejrzenia[web:7][web:10].

### Grupa docelowa

Entuzjaści kina w wieku 25-40 lat posiadający subskrypcje wielu platform VOD, nastolatkowie interesujący się klasyką i nowościami filmowymi oraz mężczyźni preferujący gatunki akcji, sci-fi i anime[web:9]. Użytkownicy docelowi charakteryzują się posiadaniem co najmniej dwóch aktywnych subskrypcji streamingowych i regularnym oglądaniem filmów.

### Wartość dla użytkownika

Redukcja czasu spędzonego na przeszukiwaniu platform VOD z średnio 15-20 minut do mniej niż 1 minuty, centralizacja watchlisty w jednym miejscu zamiast rozsianej po wielu serwisach oraz proaktywne powiadomienia o dostępności filmów z osobistej watchlisty[web:1][web:2]. System AI dostarcza spersonalizowane rekomendacje bazujące na historii oglądania, eliminując problem wyboru bezpiecznych, ale niekoniecznie interesujących rekomendacji z algorytmów platform VOD[web:10].

## 2. Problem użytkownika

### Opis problemu

Użytkownicy posiadający subskrypcje wielu platform VOD (Netflix, HBO Max, Disney+, Prime Video, Apple TV+) tracą znaczące ilości czasu na przeszukiwanie każdej platformy osobno w poszukiwaniu konkretnych filmów[web:1][web:2]. Problem nasila się, gdy użytkownik prowadzi watchlistę w jednym miejscu (np. IMDb.com), a sprawdzanie dostępności wymaga manualnego wyszukiwania każdego tytułu na wszystkich posiadanych platformach[web:9].

### Konsekwencje problemu

Frustracja związana z czasochłonnym procesem wyszukiwania prowadzi do wybierania pierwszych dostępnych opcji sugerowanych przez algorytmy platform zamiast świadomego wyboru z osobistej watchlisty. Użytkownicy nie dowiadują się, że film który chcieliby obejrzeć jest aktualnie dostępny na jednej z ich platform, co skutkuje niewykorzystaniem potencjału posiadanych subskrypcji[web:1][web:2]. Dodatkowo, brak centralnego systemu śledzenia obejrzanych filmów uniemożliwia otrzymywanie spersonalizowanych rekomendacji bazujących na rzeczywistych preferencjach użytkownika[web:10].

### Istniejące rozwiązania i ich ograniczenia

Watchlisty oferowane przez IMDb.com nie zawierają informacji o dostępności na platformach VOD w czasie rzeczywistym[web:9]. Wbudowane systemy rekomendacji platform streamingowych są ograniczone do katalogu danej platformy i nie uwzględniają historii oglądania na konkurencyjnych serwisach[web:1][web:2]. Aplikacje agregujące platformy VOD często wymagają płatnych subskrypcji lub nie oferują funkcji watchlisty z AI-powered rekomendacjami[web:11].

## 3. Wymagania funkcjonalne

### 3.1 Baza danych filmów z IMDb

System importuje jednorazowo dane z plików IMDb w formacie .tsv podczas wstępnej konfiguracji[web:9]. Importowane pola obejmują: tconst (unikalny identyfikator), primaryTitle (tytuł oryginalny), startYear (rok produkcji), genres (gatunki), averageRating (średnia ocena) oraz numVotes (liczba głosów)[web:9]. Zakres danych ogranicza się wyłącznie do filmów (titleType = 'movie'), wykluczając seriale, które zostaną dodane w wersji 1.1[web:9]. System przechowuje reminder o konieczności aktualizacji bazy co 3 miesiące w dokumentacji administratora, ale nie wykonuje automatycznych aktualizacji w MVP[web:9].

### 3.2 System kont użytkowników

Rejestracja wymaga podania adresu email oraz hasła spełniającego minimalne wymogi bezpieczeństwa. Hasła są haszowane przy użyciu algorytmu bcrypt z salt i minimum 10 rounds[web:6]. Weryfikacja adresu email nie jest wymagana w MVP, ale architektura bazy danych zawiera pole email_verified dla przyszłej implementacji[web:6]. Funkcja odzyskiwania hasła (forgot password) nie jest dostępna w MVP i zostanie dodana w wersji 1.1[web:6]. System zapewnia zgodność z RODO poprzez możliwość całkowitego usunięcia konta i wszystkich powiązanych danych (hard delete) po potwierdzeniu przez użytkownika[web:6].

### 3.3 Profil użytkownika i preferencje platform

Każdy użytkownik konfiguruje swój profil wybierając posiadane platformy VOD z listy 5 dostępnych opcji: Netflix, HBO Max, Disney+, Prime Video, Apple TV+[web:1][web:2]. Wybór platform jest realizowany poprzez checkboxy i może być modyfikowany w każdej chwili w ustawieniach profilu. Informacja o wybranych platformach jest wykorzystywana do filtrowania wyników wyszukiwania, priorytetyzacji wyświetlania dostępności oraz personalizacji sugestii AI[web:10].

### 3.4 Wyszukiwarka filmów

Wyszukiwarka z funkcją autocomplete wyświetla maksymalnie 10 wyników pasujących do wprowadzonej frazy[web:9]. Każdy wynik zawiera miniaturkę plakatu filmu o wymiarach 50x75 pikseli, tytuł, rok produkcji w nawiasie oraz ocenę IMDb[web:9][web:12]. Plakaty filmów są pobierane z TMDB API (The Movie Database), które oferuje darmowy dostęp dla zastosowań non-commercial z wymogiem atrybuci[web:12][web:15]. System przechowuje wyłącznie URL do plakatu w bazie danych, wykorzystując CDN TMDB do faktycznego wyświetlania obrazków użytkownikom[web:12][web:15]. W przypadku braku plakatu dla danego filmu wyświetlany jest placeholder. Funkcje nice-to-have obejmują przeglądanie filmów po gatunkach oraz listę top-rated filmów z IMDb, ale nie są krytyczne dla MVP[web:9].

### 3.5 Watchlista użytkownika

Każdy użytkownik może dodać maksymalnie 10 filmów do swojej watchlisty w MVP[web:9]. Limit ten ma na celu zachęcenie do konsumpcji treści zamiast gromadzenia oraz kontrolę kosztów API Watchmode.com[web:1][web:11]. System oferuje dwa widoki watchlisty: kafelkowy (domyślny) oraz listowy[web:9]. Widok kafelkowy wyświetla poster filmu, tytuł, rok produkcji, ocenę IMDb, gatunki oraz kolorowe ikony platform VOD na których film jest dostępny[web:9][web:12]. Użytkownik może przełączać między widokami za pomocą przycisku toggle. Każdy film na liście posiada przycisk "Usuń z watchlisty" który wykonuje soft delete z flagą deleted_at dla celów analytics[web:9]. Przed usunięciem wyświetlany jest dialog potwierdzenia. System umożliwia sortowanie watchlisty według: daty dodania (domyślnie), oceny IMDb (malejąco) oraz roku produkcji[web:9]. Dostępny jest filtr "tylko dostępne na moich platformach" który ukrywa filmy niedostępne na wybranych przez użytkownika platformach VOD[web:1][web:2].

### 3.6 Integracja z Watchmode.com API

System łączy się z Watchmode.com API dla pobierania informacji o dostępności filmów na platformach VOD[web:1][web:2]. Aktualizacja danych dostępności odbywa się raz w tygodniu w każdy piątek o godzinie 18:00 czasu lokalnego serwera[web:1][web:11]. Dla każdego filmu w watchliście zapisywany jest stan "last_checked" z timestampem ostatniego sprawdzenia dostępności[web:1]. W przypadku błędu API lub timeout, system wyświetla ostatnią znaną dostępność z informacją "Stan z: [data ostatniego sprawdzenia]"[web:1][web:2]. Filmy niedostępne na żadnej z wybranych przez użytkownika platform są oznaczane szarym badge'm "Niedostępne na Twoich platformach"[web:1][web:2]. Użytkownik ma możliwość ukrycia takich filmów za pomocą przycisku filtra "Ukryj niedostępne". Dane z API mogą być cache'owane przez maksymalnie 30 dni zgodnie z warunkami użytkowania Watchmode.com[web:1].

### 3.7 Oznaczanie obejrzanych filmów

Każdy film na watchliście posiada checkbox lub przycisk umożliwiający oznaczenie go jako obejrzany. Po zaznaczeniu film jest automatycznie przenoszony do oddzielnej zakładki "Obejrzane" z zachowaniem wszystkich metadanych[web:9]. System automatycznie zapisuje datę zaznaczenia filmu jako obejrzany dla celów analytics i przyszłych funkcjonalności[web:9]. Lista obejrzanych filmów nie ma limitu liczby pozycji w MVP. Filmy obejrzane są wykorzystywane jako input dla systemu rekomendacji AI[web:10]. Funkcje nice-to-have w wersji 1.1 obejmują możliwość edycji daty obejrzenia oraz dodanie osobistej oceny w skali 1-10[web:9].

### 3.8 Sugestie AI (Gemini 2.0 Flash-Lite)

System rekomendacji wykorzystuje model Gemini 2.0 Flash-Lite od Google, który oferuje korzystny stosunek ceny do wydajności dla zadań generowania rekomendacji[web:7][web:10][web:16]. Koszt wynosi 0.075 USD za milion input tokens oraz 0.30 USD za milion output tokens w warstwie płatnej[web:10][web:16]. Użytkownik aktywuje system klikając przycisk "Zasugeruj filmy" dostępny w głównym widoku aplikacji. Funkcja jest ograniczona do jednego zapytania dziennie na użytkownika dla kontroli kosztów operacyjnych[web:10][web:16]. Wygenerowane sugestie są cache'owane przez 24 godziny, po czym użytkownik może ponownie poprosić o rekomendacje[web:10]. Prompt wysyłany do API zawiera: listę obejrzanych filmów użytkownika z gatunkami, obecną watchlistę oraz informację o platformach VOD wybranych przez użytkownika[web:10]. Pełny prompt: "Na podstawie obejrzanych filmów: [lista z gatunkami] i obecnej watchlisty: [lista], zasugeruj 5 filmów dostępnych na: [platformy użytkownika]. Dla każdego podaj tytuł, rok i 1-2 zdaniowe uzasadnienie."[web:10]. System zwraca 5 sugestii filmowych, każda z krótkim uzasadnieniem (1-2 zdania) wyjaśniającym dlaczego film może zainteresować użytkownika. Przykładowe uzasadnienie: "Ponieważ podobał Ci się Inception i Interstellar, polecamy Tenet - sci-fi o manipulacji czasem od Christophera Nolana"[web:10]. Użytkownik może bezpośrednio dodać sugerowane filmy do swojej watchlisty, a system śledzi ile sugestii AI zostało faktycznie dodanych dla metrics sukcesu[web:10].

### 3.9 Onboarding nowych użytkowników

Po pierwszej rejestracji użytkownik przechodzi przez 3-stopniowy proces onboardingu. Krok 1: "Wybierz swoje platformy VOD" - prezentacja checkboxów dla 5 dostępnych platform z możliwością wyboru wielu opcji jednocześnie[web:1][web:2]. Krok 2: "Dodaj pierwsze 3 filmy do watchlisty" - wprowadzenie do funkcji wyszukiwarki i dodawania filmów. Krok 3: "Oznacz 3 filmy które już widziałeś" - demonstracja funkcji oznaczania obejrzanych dla przyszłych rekomendacji AI[web:10]. Każdy krok posiada przycisk "Skip" umożliwiający pominięcie bez wymuszania completion, redukując friction dla użytkowników którzy preferują samodzielną eksplorację aplikacji. Po zakończeniu lub pominięciu onboardingu użytkownik ląduje na głównej stronie z pustą lub częściowo wypełnioną watchlistą.

### 3.10 Analytics i metryki

System śledzi następujące metryki per użytkownik: liczba filmów na watchliście, liczba filmów oznaczonych jako obejrzane, liczba sugestii AI które zostały dodane do watchlisty[web:10]. Na poziomie globalnym mierzone są wskaźniki retention: 7-day (użytkownicy logujący się ponownie po 7 dniach od rejestracji) oraz 30-day (użytkownicy logujący się po 30 dniach)[web:9]. Dane analytics są zapisywane w prostej formie logów do bazy danych. Dostęp do danych odbywa się przez dashboard w panelu administratora, który wyświetla kluczowe metryki w formie tabel i podstawowych wykresów. Soft delete filmów z watchlisty (z flagą deleted_at) umożliwia analizę zachowań użytkowników przy zachowaniu możliwości przywrócenia danych w razie potrzeby[web:9].

## 4. Granice produktu

### 4.1 Funkcjonalności wyłączone z MVP

Zaawansowany system rekomendacji bazujący na machine learning wykraczający poza proste prompty do Gemini API nie jest częścią MVP. Automatyczny import bazy danych IMDb oraz scheduled updates nie są implementowane - wymagany jest jednorazowy manualny import z przypomnieniem o aktualizacji co 3 miesiące[web:9]. Funkcja współdzielenia watchlisty z innymi użytkownikami nie jest dostępna w MVP. Aplikacje mobilne (iOS, Android) nie są częścią zakresu - MVP obejmuje wyłącznie wersję webową responsywną dla urządzeń mobilnych. Automatyczny import watchlisty z IMDb.com oraz import historii obejrzanych filmów z IMDb.com nie są implementowane - użytkownik musi manualnie dodać filmy[web:9]. Wybór kraju dla dostępności VOD nie jest możliwy w MVP, system zakłada jeden domyślny region. Weryfikacja adresu email oraz funkcja odzyskiwania hasła (forgot password) są wyłączone z MVP i zaplanowane na wersję 1.1[web:6].

### 4.2 Ograniczenia techniczne MVP

Limit 10 filmów na watchliście dla pojedynczego użytkownika[web:9]. Limit 1 zapytanie do AI dziennie na użytkownika z 24-godzinnym cache'em wyników[web:10][web:16]. Tylko filmy (titleType = 'movie') są wspierane, seriale zostaną dodane w wersji 1.1[web:9]. Tylko tytuły oryginalne (primaryTitle) z IMDb są wyświetlane, bez lokalizowanych wersji tytułów[web:9]. Cache danych z Watchmode.com API maksymalnie przez 30 dni zgodnie z terms of service[web:1]. Aktualizacja dostępności VOD tylko raz w tygodniu (piątki, 18:00)[web:1][web:11]. Brak automatycznych powiadomień email lub push o zmianach dostępności filmów na watchliście.

### 4.3 Założenia biznesowe

Produkt w wersji MVP jest projektowany bez określonego budżetu, który zostanie ustalony po wstępnych testach z rzeczywistymi użytkownikami. Timeline projektu nie jest jeszcze ustalony i zostanie dodany w późniejszym etapie planowania. Brak planu monetyzacji w MVP - aplikacja będzie dostępna za darmo w fazie testowej. Model biznesowy oraz potencjalna wersja premium zostaną określone w przyszłości na podstawie danych o użytkowaniu i kosztach operacyjnych[web:1][web:10][web:11]. Target rynek to prawdopodobnie Polska i Europa ze względu na wymóg zgodności z RODO[web:6]. Stack technologiczny nie został jeszcze określony i wymaga osobnego dokumentu z wyborem technologii dla frontend, backend i bazy danych.

### 4.4 Zależności zewnętrzne

Watchmode.com API - wymaga rejestracji, uzyskania API key oraz weryfikacji limitów rate limit i kosztów[web:1][web:11]. Free tier może nie być dostępny, a płatne plany zaczynają się od 249 USD miesięcznie według niektórych źródeł[web:11]. TMDB API - wymaga rejestracji, API key oraz akceptacji terms of service[web:12][web:15]. Darmowe dla non-commercial use z wymogiem atrybuci TMDB jako źródła danych[web:12][web:15]. Google Gemini 2.0 Flash-Lite API - wymaga Google Cloud account i API key[web:10][web:16]. Free tier oferuje ograniczone limity (5 requests per minute, 25 requests per day), paid tier wymaga konfiguracji billing[web:10][web:16]. Dostępność i stabilność tych zewnętrznych serwisów jest krytyczna dla funkcjonowania aplikacji.

## 5. Historyjki użytkowników

### 5.1 Rejestracja i Autoryzacja

US-001: Rejestracja nowego konta
Jako nowy użytkownik chcę zarejestrować konto używając adresu email i hasła, aby uzyskać dostęp do aplikacji MyVOD.

Kryteria akceptacji:
- Formularz rejestracji zawiera pola: email, hasło, powtórz hasło
- Email musi być w poprawnym formacie (walidacja regex)
- Hasło musi mieć minimum 8 znaków, zawierać co najmniej jedną wielką literę, jedną małą literę i jedną cyfrę
- Pole "powtórz hasło" musi być identyczne z polem "hasło"
- System sprawdza czy email nie jest już zarejestrowany w bazie
- Po poprawnej walidacji hasło jest haszowane przez bcrypt z minimum 10 rounds
- Użytkownik otrzymuje komunikat o sukcesie i jest automatycznie zalogowany
- W przypadku błędu wyświetlany jest odpowiedni komunikat (np. "Email już istnieje", "Hasła nie są identyczne")

US-002: Logowanie do istniejącego konta
Jako zarejestrowany użytkownik chcę zalogować się używając swojego emaila i hasła, aby uzyskać dostęp do mojej watchlisty.

Kryteria akceptacji:
- Formularz logowania zawiera pola: email, hasło
- System weryfikuje czy email istnieje w bazie danych
- System porównuje wprowadzone hasło z zahaszowanym hasłem w bazie używając bcrypt
- Po poprawnym zalogowaniu użytkownik jest przekierowany na główną stronę z watchlistą
- Sesja użytkownika jest zapisywana (cookie/token) dla utrzymania stanu zalogowania
- W przypadku błędnych danych wyświetlany jest komunikat "Nieprawidłowy email lub hasło"
- Po 5 nieudanych próbach logowania konto jest tymczasowo blokowane na 15 minut

US-003: Wylogowanie z konta
Jako zalogowany użytkownik chcę móc się wylogować, aby zabezpieczyć moje konto na współdzielonym urządzeniu.

Kryteria akceptacji:
- Przycisk "Wyloguj" jest widoczny w nawigacji aplikacji
- Po kliknięciu "Wyloguj" sesja użytkownika jest natychmiast usuwana
- Użytkownik jest przekierowany na stronę logowania
- Po wylogowaniu próba dostępu do chronionych stron przekierowuje na stronę logowania
- Cookie/token sesji jest usuwany z przeglądarki

US-004: Usunięcie konta (RODO compliance)
Jako użytkownik chcę móc całkowicie usunąć moje konto wraz ze wszystkimi danymi, aby skorzystać z prawa do bycia zapomnianym zgodnie z RODO.

Kryteria akceptacji:
- Opcja "Usuń konto" jest dostępna w ustawieniach profilu
- Po kliknięciu "Usuń konto" wyświetlany jest dialog potwierdzenia z ostrzeżeniem "Ta akcja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte."
- Dialog zawiera checkbox "Rozumiem, że ta akcja jest nieodwracalna"
- Przycisk "Potwierdź usunięcie" jest aktywny tylko gdy checkbox jest zaznaczony
- Po potwierdzeniu wykonywane jest hard delete wszystkich danych użytkownika: konto, watchlista, obejrzane filmy, sugestie AI, logi
- Użytkownik jest wylogowany i przekierowany na stronę główną z komunikatem "Konto zostało pomyślnie usunięte"

### 5.2 Onboarding

US-005: Onboarding krok 1 - Wybór platform VOD
Jako nowy użytkownik chcę wybrać platformy VOD które posiadam podczas pierwszego logowania, aby aplikacja pokazywała mi tylko relevantne informacje o dostępności.

Kryteria akceptacji:
- Po pierwszym zalogowaniu użytkownik widzi ekran "Wybierz swoje platformy VOD"
- Wyświetlanych jest 5 checkboxów z logo platform: Netflix, HBO Max, Disney+, Prime Video, Apple TV+
- Użytkownik może wybrać dowolną liczbę platform (minimum 1)
- Przycisk "Dalej" jest aktywny tylko gdy wybrano co najmniej jedną platformę
- Przycisk "Skip" pozwala pominąć ten krok bez wybierania platform
- Po kliknięciu "Dalej" wybór jest zapisywany i użytkownik przechodzi do kroku 2
- Po kliknięciu "Skip" użytkownik przechodzi do kroku 2 bez zapisywania wyboru

US-006: Onboarding krok 2 - Dodanie pierwszych filmów
Jako nowy użytkownik chcę dodać pierwsze 3 filmy do watchlisty podczas onboardingu, aby nauczyć się jak działa wyszukiwarka.

Kryteria akceptacji:
- Ekran wyświetla tekst "Dodaj pierwsze 3 filmy do watchlisty"
- Widoczna jest wyszukiwarka z autocomplete
- Licznik pokazuje "Dodano X/3 filmów"
- Po dodaniu 3 filmów przycisk "Dalej" staje się aktywny
- Przycisk "Skip" pozwala pominąć ten krok w każdej chwili
- Dodane filmy są automatycznie zapisywane do watchlisty użytkownika
- Po kliknięciu "Dalej" lub "Skip" użytkownik przechodzi do kroku 3

US-007: Onboarding krok 3 - Oznaczenie obejrzanych filmów
Jako nowy użytkownik chcę oznaczyć 3 filmy jako obejrzane podczas onboardingu, aby system AI miał dane do generowania rekomendacji.

Kryteria akceptacji:
- Ekran wyświetla tekst "Oznacz 3 filmy które już widziałeś"
- Widoczna jest wyszukiwarka z autocomplete
- Licznik pokazuje "Oznaczono X/3 filmów"
- Po oznaczeniu 3 filmów przycisk "Zakończ" staje się aktywny
- Przycisk "Skip" pozwala pominąć ten krok w każdej chwili
- Oznaczone filmy są zapisywane w zakładce "Obejrzane" z datą zaznaczenia
- Po kliknięciu "Zakończ" lub "Skip" użytkownik jest przekierowany na główną stronę aplikacji
- Onboarding nie wyświetla się ponownie dla tego użytkownika

### 5.3 Profil użytkownika

US-008: Edycja wybranych platform VOD
Jako użytkownik chcę móc zmienić wybrane platformy VOD w ustawieniach profilu, aby aktualizować system zgodnie z moimi aktywnymi subskrypcjami.

Kryteria akceptacji:
- W ustawieniach profilu dostępna jest sekcja "Moje platformy VOD"
- Wyświetlanych jest 5 checkboxów z aktualnymi wyborami użytkownika zaznaczonymi
- Użytkownik może zaznaczyć/odznaczyć dowolne platformy
- Minimum jedna platforma musi pozostać wybrana
- Przycisk "Zapisz zmiany" aktualizuje wybór w bazie danych
- Po zapisaniu wyświetlany jest komunikat "Zmiany zostały zapisane"
- Watchlista automatycznie odświeża informacje o dostępności zgodnie z nowymi wyborami

US-009: Wyświetlanie statystyk profilu
Jako użytkownik chcę widzieć podstawowe statystyki mojego profilu, aby śledzić swoją aktywność.

Kryteria akceptacji:
- Profil wyświetla liczbę filmów na watchliście
- Profil wyświetla liczbę filmów obejrzanych
- Profil wyświetla liczbę sugestii AI które zostały dodane do watchlisty
- Profil wyświetla datę rejestracji
- Statystyki są aktualizowane w czasie rzeczywistym po każdej akcji użytkownika

### 5.4 Wyszukiwarka filmów

US-010: Wyszukiwanie filmu z autocomplete
Jako użytkownik chcę wyszukać film używając autocomplete, aby szybko znaleźć interesujący mnie tytuł.

Kryteria akceptacji:
- Po wpisaniu minimum 3 znaków w pole wyszukiwania aktywuje się autocomplete
- Wyświetlanych jest maksymalnie 10 wyników pasujących do frazy
- Każdy wynik zawiera: miniaturkę plakatu (50x75px), tytuł, rok w nawiasie, ocenę IMDb
- Wyniki są sortowane według relevantności (dokładne dopasowanie, popularity)
- Plakaty są pobierane z TMDB API z wykorzystaniem CDN
- W przypadku braku plakatu wyświetlany jest placeholder
- Kliknięcie na wynik otwiera szczegóły filmu
- Kliknięcie przycisku "Dodaj do watchlisty" dodaje film bez otwierania szczegółów
- Wyszukiwanie działa tylko dla filmów (titleType = 'movie'), bez seriali

US-011: Obsługa błędu braku wyników wyszukiwania
Jako użytkownik chcę otrzymać jasny komunikat gdy wyszukiwanie nie zwróciło wyników, aby wiedzieć że film nie istnieje w bazie.

Kryteria akceptacji:
- Gdy wyszukiwanie nie zwraca żadnych wyników, wyświetlany jest komunikat "Nie znaleziono filmów pasujących do frazy"
- Komunikat zawiera sugestię "Spróbuj wyszukać po tytule oryginalnym"
- Pole wyszukiwania pozostaje aktywne dla wprowadzenia nowej frazy

US-012: Wyświetlanie szczegółów filmu
Jako użytkownik chcę zobaczyć szczegółowe informacje o filmie, aby podjąć świadomą decyzję o dodaniu do watchlisty.

Kryteria akceptacji:
- Widok szczegółów zawiera: pełnowymiarowy plakat (jeśli dostępny), tytuł oryginalny, rok produkcji, gatunki, ocenę IMDb, liczbę głosów
- Wyświetlana jest informacja o dostępności na platformach VOD użytkownika (kolorowe ikony dostępnych, szare niedostępnych)
- Jeśli film nie jest dostępny na żadnej platformie użytkownika, wyświetlany jest szary badge "Niedostępne na Twoich platformach"
- Widoczny jest przycisk "Dodaj do watchlisty" (lub "Usuń z watchlisty" jeśli już dodany)
- Przycisk "Powrót" wraca do poprzedniego widoku

### 5.5 Zarządzanie watchlistą

US-013: Dodanie filmu do watchlisty
Jako użytkownik chcę dodać film do mojej watchlisty, aby zapamiętać że chcę go obejrzeć.

Kryteria akceptacji:
- Po znalezieniu filmu w wyszukiwarce użytkownik klika przycisk "Dodaj do watchlisty"
- Jeśli użytkownik ma już 10 filmów na watchliście, wyświetlany jest komunikat "Osiągnięto limit 10 filmów. Usuń film z watchlisty aby dodać nowy."
- Jeśli limit nie jest osiągnięty, film jest dodawany z datą dodania (current timestamp)
- Wyświetlany jest komunikat "Film został dodany do watchlisty"
- Film pojawia się na watchliście w domyślnym sortowaniu (według daty dodania, najnowsze pierwsze)
- Przycisk zmienia się na "Usuń z watchlisty"

US-014: Usunięcie filmu z watchlisty
Jako użytkownik chcę usunąć film z watchlisty, aby zrobić miejsce dla innych tytułów lub usunąć filmy które już mnie nie interesują.

Kryteria akceptacji:
- Każdy film na watchliście ma przycisk "Usuń z watchlisty" (ikona kosza)
- Po kliknięciu wyświetlany jest dialog potwierdzenia "Czy na pewno chcesz usunąć ten film z watchlisty?"
- Dialog zawiera przyciski "Anuluj" i "Usuń"
- Po kliknięciu "Usuń" film jest usuwany z watchlisty (soft delete z flagą deleted_at)
- Wyświetlany jest komunikat "Film został usunięty z watchlisty"
- Licznik filmów na watchliście jest aktualizowany
- Film przestaje być widoczny na watchliście

US-015: Wyświetlanie watchlisty w widoku kafelkowym
Jako użytkownik chcę przeglądać watchlistę w widoku kafelkowym, aby wizualnie ocenić filmy które chcę obejrzeć.

Kryteria akceptacji:
- Widok kafelkowy jest domyślnym widokiem watchlisty
- Każdy kafelek zawiera: poster filmu, tytuł, rok, ocenę IMDb, gatunki (maksymalnie 3), kolorowe ikony platform VOD
- Kafelki są wyświetlane w grid layout (3 kolumny na desktop, 2 na tablet, 1 na mobile)
- Ikony platform VOD są kolorowe dla dostępnych platform, szare dla niedostępnych
- Filmy niedostępne na platformach użytkownika mają dodatkowo szary badge "Niedostępne na Twoich platformach"
- Hover na kafelku wyświetla dodatkowe opcje: "Obejrzane", "Usuń", "Szczegóły"

US-016: Wyświetlanie watchlisty w widoku listowym
Jako użytkownik chcę przełączyć watchlistę na widok listowy, aby zobaczyć więcej filmów jednocześnie.

Kryteria akceptacji:
- Przycisk toggle pozwala przełączyć między widokiem kafelkowym a listowym
- Widok listowy wyświetla filmy w formie tabeli z kolumnami: Miniaturka, Tytuł, Rok, Ocena, Gatunki, Dostępność, Akcje
- Kolumna "Dostępność" zawiera ikony platform VOD (kolorowe/szare)
- Kolumna "Akcje" zawiera przyciski: "Obejrzane", "Usuń"
- Tabela pokazuje więcej filmów jednocześnie niż widok kafelkowy (bez przewijania)
- Wybór widoku jest zapisywany w preferencjach użytkownika

US-017: Sortowanie watchlisty
Jako użytkownik chcę sortować watchlistę według różnych kryteriów, aby łatwiej znaleźć film który chcę obejrzeć.

Kryteria akceptacji:
- Dropdown "Sortuj według" zawiera opcje: "Data dodania (najnowsze)", "Ocena IMDb (najwyższe)", "Rok produkcji (najnowsze)"
- Domyślne sortowanie to "Data dodania (najnowsze)"
- Po wybraniu opcji sortowania watchlista jest natychmiast prze sortowana
- Wybór sortowania jest zapisywany w sesji użytkownika
- Sortowanie działa zarówno w widoku kafelkowym jak i listowym

US-018: Filtrowanie watchlisty - tylko dostępne filmy
Jako użytkownik chcę filtrować watchlistę aby zobaczyć tylko filmy dostępne na moich platformach, aby szybko wybrać co mogę obejrzeć teraz.

Kryteria akceptacji:
- Checkbox "Tylko dostępne na moich platformach" jest widoczny nad watchlistą
- Po zaznaczeniu checkboxa wyświetlane są tylko filmy dostępne na co najmniej jednej z wybranych platform użytkownika
- Filmy niedostępne są ukryte
- Licznik pokazuje "Wyświetlanie X z Y filmów"
- Stan filtra jest zapisywany w sesji użytkownika
- Odznaczenie checkboxa przywraca wszystkie filmy

US-019: Przycisk "Ukryj niedostępne"
Jako użytkownik chcę móc jednym kliknięciem ukryć wszystkie filmy niedostępne na moich platformach, aby skupić się tylko na tym co mogę teraz obejrzeć.

Kryteria akceptacji:
- Przycisk "Ukryj niedostępne" jest widoczny nad watchlistą
- Po kliknięciu działa identycznie jak zaznaczenie checkboxa "Tylko dostępne na moich platformach"
- Przycisk zmienia się na "Pokaż wszystkie"
- Kliknięcie "Pokaż wszystkie" przywraca widoczność wszystkich filmów
- Stan jest synchronizowany z checkboxem filtrowania

### 5.6 Oznaczanie obejrzanych filmów

US-020: Oznaczenie filmu jako obejrzany z watchlisty
Jako użytkownik chcę oznaczyć film z watchlisty jako obejrzany, aby przenieść go do zakładki obejrzanych i wykorzystać w rekomendacjach AI.

Kryteria akceptacji:
- Każdy film na watchliście ma checkbox lub przycisk "Oznacz jako obejrzany"
- Po kliknięciu film jest natychmiast usuwany z watchlisty
- Film pojawia się w zakładce "Obejrzane"
- Data oznaczenia (current timestamp) jest zapisywana automatycznie
- Licznik filmów na watchliście zmniejsza się o 1
- Licznik filmów obejrzanych zwiększa się o 1
- Wyświetlany jest komunikat "Film został oznaczony jako obejrzany"

US-021: Wyświetlanie zakładki obejrzanych filmów
Jako użytkownik chcę przeglądać listę filmów które oznaczyłem jako obejrzane, aby pamiętać co już widziałem.

Kryteria akceptacji:
- Zakładka "Obejrzane" jest dostępna w głównej nawigacji
- Lista obejrzanych filmów wyświetla: poster, tytuł, rok, ocena IMDb, data obejrzenia
- Domyślne sortowanie: według daty obejrzenia (najnowsze pierwsze)
- Dostępne są opcje sortowania: data obejrzenia, ocena IMDb, rok produkcji
- Lista obejrzanych nie ma limitu liczby filmów
- Każdy film ma przycisk "Usuń z obejrzanych" (powoduje całkowite usunięcie z systemu, nie powrót do watchlisty)

US-022: Dodanie filmu bezpośrednio jako obejrzany
Jako użytkownik chcę móc dodać film bezpośrednio do zakładki obejrzanych bez dodawania go najpierw do watchlisty, aby szybko budować historię oglądania.

Kryteria akceptacji:
- W widoku szczegółów filmu dostępny jest przycisk "Dodaj do obejrzanych"
- Po kliknięciu film jest dodawany bezpośrednio do zakładki "Obejrzane" z datą zaznaczenia
- Film NIE pojawia się na watchliście
- Wyświetlany jest komunikat "Film został dodany do obejrzanych"
- Licznik obejrzanych filmów zwiększa się o 1

### 5.7 Integracja z Watchmode.com API

US-023: Automatyczna aktualizacja dostępności VOD
Jako użytkownik chcę aby dostępność filmów na platformach VOD była automatycznie aktualizowana, aby zawsze widzieć aktualne informacje.

Kryteria akceptacji:
- System automatycznie aktualizuje dostępność każdego piątku o 18:00
- Dla każdego filmu na watchliście wykonywane jest zapytanie do Watchmode.com API
- Wynik zapytania (dostępne platformy) jest zapisywany w bazie danych
- Timestamp "last_checked" jest aktualizowany dla każdego sprawdzonego filmu
- Proces działa w tle, nie blokując użytkowania aplikacji
- Po zakończeniu aktualizacji watchlista użytkowników pokazuje nowe dane o dostępności

US-024: Wyświetlanie ostatniego stanu dostępności przy błędzie API
Jako użytkownik chcę widzieć ostatnią znaną dostępność filmu gdy API nie działa, aby mieć jakąkolwiek informację o tym gdzie mogę znaleźć film.

Kryteria akceptacji:
- Gdy zapytanie do Watchmode.com API kończy się błędem (timeout, 500, 503), system używa ostatnich zapisanych danych
- Przy każdym filmie wyświetlany jest timestamp "Stan z: [data ostatniego sprawdzenia]"
- Ikony platform są lekko przyciemnione dla wskazania że dane mogą być nieaktualne
- W nagłówku watchlisty wyświetlany jest info banner "Nie udało się zaktualizować dostępności. Wyświetlane dane z: [data]"
- Banner znika po pomyślnej aktualizacji

US-025: Inicjalne sprawdzenie dostępności nowo dodanego filmu
Jako użytkownik chcę natychmiast zobaczyć dostępność filmu który właśnie dodałem do watchlisty, bez czekania na cotygodniową aktualizację.

Kryteria akceptacji:
- Po dodaniu filmu do watchlisty system natychmiast wykonuje zapytanie do Watchmode.com API
- Podczas sprawdzania wyświetlany jest loader "Sprawdzanie dostępności..."
- Po otrzymaniu odpowiedzi ikony platform są aktualizowane
- Timestamp "last_checked" jest zapisywany
- Jeśli zapytanie nie powiedzie się, wyświetlany jest komunikat "Nie udało się sprawdzić dostępności. Spróbuj później."
- Film jest dodawany do watchlisty niezależnie od wyniku sprawdzenia dostępności

### 5.8 Sugestie AI

US-026: Wygenerowanie sugestii filmowych przez AI
Jako użytkownik chcę otrzymać spersonalizowane sugestie filmowe od AI, aby odkryć nowe filmy które mogą mi się spodobać.

Kryteria akceptacji:
- Przycisk "Zasugeruj filmy" jest widoczny w głównym widoku aplikacji
- Funkcja jest dostępna tylko dla użytkowników z co najmniej 1 obejrzanym filmem
- Po kliknięciu wyświetlany jest loader "Generuję sugestie..."
- System tworzy prompt zawierający: listę obejrzanych filmów z gatunkami, obecną watchlistę, wybrane platformy VOD
- Prompt jest wysyłany do Gemini 2.0 Flash-Lite API
- AI zwraca 5 sugestii filmowych, każda z tytułem, rokiem i 1-2 zdaniowym uzasadnieniem
- Sugestie są wyświetlane w formie kart z posterami (jeśli dostępne w TMDB)
- Każda sugestia ma przycisk "Dodaj do watchlisty"
- Po wygenerowaniu sugestii funkcja jest blokowana na 24 godziny

US-027: Limit dziennego użycia sugestii AI
Jako użytkownik chcę być poinformowany o limicie dziennym sugestii AI, aby zrozumieć dlaczego nie mogę wygenerować nowych rekomendacji.

Kryteria akceptacji:
- Jeśli użytkownik kliknął "Zasugeruj filmy" w ciągu ostatnich 24 godzin, przycisk jest nieaktywny
- Wyświetlany jest komunikat "Możesz poprosić o nowe sugestie za: [pozostały czas]"
- Timer odlicza godziny i minuty do momentu gdy funkcja będzie ponownie dostępna
- Po upływie 24 godzin przycisk staje się aktywny automatycznie
- Cache poprzednich sugestii jest usuwany po upływie 24 godzin

US-028: Dodanie sugerowanego filmu do watchlisty
Jako użytkownik chcę dodać sugerowany przez AI film do watchlisty, aby obejrzeć go później.

Kryteria akceptacji:
- Każda sugestia AI ma przycisk "Dodaj do watchlisty"
- Po kliknięciu system sprawdza czy użytkownik nie osiągnął limitu 10 filmów
- Jeśli limit nie jest osiągnięty, film jest dodawany z flagą "added_from_ai_suggestion = true"
- Wyświetlany jest komunikat "Film został dodany do watchlisty"
- System śledzi metrykę "liczba sugestii AI dodanych do watchlisty" dla analytics
- Przycisk zmienia się na "Już na watchliście" lub "Usuń z watchlisty"

US-029: Obsługa błędu AI API
Jako użytkownik chcę otrzymać jasny komunikat gdy generowanie sugestii AI nie powiodło się, aby zrozumieć co się stało.

Kryteria akceptacji:
- Gdy zapytanie do Gemini API kończy się błędem (timeout, 500, limit exceeded), wyświetlany jest komunikat błędu
- Komunikat: "Nie udało się wygenerować sugestii. Spróbuj ponownie później."
- Użytkownik NIE jest obciążany dziennym limitem gdy wystąpił błąd
- Przycisk "Zasugeruj filmy" pozostaje aktywny dla ponownej próby
- Jeśli błąd powtarza się 3 razy, wyświetlany jest komunikat "Serwis sugestii jest chwilowo niedostępny"

US-030: Cold start - brak obejrzanych filmów
Jako nowy użytkownik bez obejrzanych filmów chcę otrzymać informację dlaczego nie mogę użyć sugestii AI, aby zrozumieć co powinienem zrobić.

Kryteria akceptacji:
- Gdy użytkownik ma 0 obejrzanych filmów, przycisk "Zasugeruj filmy" jest nieaktywny
- Wyświetlany jest komunikat "Oznacz co najmniej 3 filmy jako obejrzane, aby otrzymać spersonalizowane sugestie"
- Link "Dodaj obejrzane filmy" przekierowuje do wyszukiwarki z opcją dodawania do zakładki obejrzanych
- Po oznaczeniu 3 filmów przycisk staje się aktywny automatycznie

### 5.9 Integracja z TMDB API

US-031: Pobieranie plakatów filmów z TMDB
Jako użytkownik chcę widzieć plakaty filmów na watchliście, aby wizualnie identyfikować tytuły.

Kryteria akceptacji:
- Dla każdego filmu w bazie system wykonuje zapytanie do TMDB API dla pobrania URL plakatu
- URL jest zapisywany w bazie danych (nie sam obraz)
- Plakaty są wyświetlane z wykorzystaniem TMDB CDN
- W stopce aplikacji widoczna jest atrybucja "Plakaty filmów: The Movie Database (TMDB)"
- System cache'uje URL plakatów aby minimalizować zapytania do TMDB API

US-032: Fallback dla brakujących plakatów
Jako użytkownik chcę widzieć placeholder gdy plakat filmu nie jest dostępny, aby interfejs pozostał spójny.

Kryteria akceptacji:
- Gdy TMDB API nie zwraca plakatu dla filmu, wyświetlany jest placeholder
- Placeholder zawiera: ikona filmu, tytuł filmu, rok produkcji
- Placeholder ma te same wymiary co standardowe plakaty
- Placeholder jest wizualnie spójny z resztą interfejsu (kolory, font)

### 5.10 Analytics i Admin Panel

US-033: Śledzenie metryki "liczba filmów na watchliście"
Jako administrator chcę śledzić ile filmów mają użytkownicy na watchliście, aby mierzyć zaangażowanie.

Kryteria akceptacji:
- System loguje każdą operację dodania/usunięcia filmu z watchlisty
- Dashboard administratora wyświetla metrykę: średnia liczba filmów na watchliście per użytkownik
- Wykres pokazuje rozkład użytkowników według liczby filmów (0, 1-3, 4-6, 7-9, 10)
- Metryka jest aktualizowana codziennie o 00:00
- Kryterium sukcesu: 80% użytkowników z ≥10 filmami (watchlist + obejrzane łącznie) jest widoczne

US-034: Śledzenie metryki "liczba obejrzanych filmów"
Jako administrator chcę śledzić ile filmów użytkownicy oznaczyli jako obejrzane, aby mierzyć faktyczne wykorzystanie aplikacji.

Kryteria akceptacji:
- System loguje każdą operację oznaczenia filmu jako obejrzany
- Dashboard wyświetla: średnia liczba obejrzanych filmów per użytkownik
- Metryka: średnia liczba filmów oznaczonych jako obejrzane per użytkownik miesięcznie
- Wykres trendu pokazuje jak metryka zmienia się w czasie
- Target: średnio 2 filmy obejrzane per użytkownik miesięcznie

US-035: Śledzenie metryki "skuteczność sugestii AI"
Jako administrator chcę śledzić ile sugestii AI zostało dodanych do watchlisty, aby mierzyć wartość funkcji AI.

Kryteria akceptacji:
- System loguje flagę "added_from_ai_suggestion" przy dodawaniu filmu
- Dashboard wyświetla: % użytkowników którzy dodali co najmniej 1 film z sugestii AI
- Metryka: liczba filmów dodanych z AI / liczba wygenerowanych sugestii (conversion rate)
- Kryterium sukcesu: 25% użytkowników dodaje filmy z sugestii AI
- Wykres pokazuje trend w czasie

US-036: Śledzenie retention 7-day i 30-day
Jako administrator chcę śledzić retention użytkowników, aby mierzyć długoterminową wartość produktu.

Kryteria akceptacji:
- System zapisuje datę rejestracji każdego użytkownika
- System loguje każde logowanie użytkownika z timestampem
- Dashboard wyświetla retention cohort analysis: tabela pokazująca % użytkowników z każdego tygodnia rejestracji którzy wrócili po 7 i 30 dniach
- Metryka 7-day retention: % użytkowników logujących się między 7-8 dniem od rejestracji
- Metryka 30-day retention: % użytkowników logujących się między 30-31 dniem od rejestracji
- Target retention: 7-day ≥ 40%, 30-day ≥ 20%
- Wykresy pokazują trendy retention w czasie

US-037: Dashboard administratora
Jako administrator chcę mieć dostęp do dashboardu z kluczowymi metrykami, aby monitorować zdrowie produktu.

Kryteria akceptacji:
- Dashboard jest dostępny pod osobnym URL /admin (wymaga autoryzacji admin)
- Sekcje dashboardu: Overview (liczba użytkowników, aktywnych użytkowników dzisiaj), Watchlist Metrics, Watched Movies, AI Suggestions, Retention
- Każda metryka ma przypisany target i wskaźnik czy target jest osiągnięty (zielony/czerwony)
- Możliwość wyboru zakresu dat dla większości metryk
- Przycisk "Export to CSV" dla każdej sekcji
- Dashboard jest responsywny i działa na urządzeniach mobilnych

### 5.11 Edge Cases i Błędy

US-038: Obsługa limitu watchlisty
Jako użytkownik próbujący dodać 11. film do watchlisty chcę otrzymać jasny komunikat o limicie, aby zrozumieć dlaczego nie mogę dodać filmu.

Kryteria akceptacji:
- Gdy użytkownik ma już 10 filmów na watchliście i próbuje dodać kolejny, wyświetlany jest modal
- Modal zawiera komunikat: "Osiągnięto limit 10 filmów na watchliście. Usuń film lub oznacz jako obejrzany aby dodać nowy."
- Modal ma przyciski: "Przejdź do watchlisty" i "Anuluj"
- Po kliknięciu "Przejdź do watchlisty" użytkownik jest przekierowany do swojej watchlisty
- Film który próbowano dodać NIE jest dodawany

US-039: Obsługa duplikatów na watchliście
Jako użytkownik próbujący dodać film który już jest na mojej watchliście chcę być poinformowany o duplikacie, aby uniknąć pomyłki.

Kryteria akceptacji:
- System sprawdza czy film (tconst) już istnieje na watchliście użytkownika
- Jeśli film już istnieje, wyświetlany jest komunikat "Ten film jest już na Twojej watchliście"
- Film NIE jest dodawany ponownie
- Przycisk "Dodaj do watchlisty" zmienia się na "Już na watchliście" (nieaktywny)

US-040: Obsługa braku danych w bazie IMDb
Jako użytkownik wyszukujący film którego nie ma w bazie IMDb chcę otrzymać jasny komunikat, aby wiedzieć że film nie jest dostępny w systemie.

Kryteria akceptacji:
- Gdy wyszukiwanie nie zwraca żadnych wyników, wyświetlany jest komunikat "Nie znaleziono filmów. Aplikacja zawiera tylko filmy z bazy IMDb."
- Komunikat zawiera link "Dowiedz się więcej o bazie danych"
- Link otwiera help page wyjaśniającą zakres danych (tylko filmy, aktualizacja co 3 miesiące)

US-041: Obsługa sesji wygasłej
Jako użytkownik którego sesja wygasła chcę być automatycznie wylogowany i przekierowany na stronę logowania, aby zalogować się ponownie.

Kryteria akceptacji:
- Sesja użytkownika wygasa po 7 dniach nieaktywności lub po zamknięciu przeglądarki (w zależności od wyboru "Zapamiętaj mnie")
- Gdy użytkownik próbuje wykonać akcję z wygasłą sesją, wyświetlany jest komunikat "Sesja wygasła. Zaloguj się ponownie."
- Użytkownik jest automatycznie przekierowany na stronę logowania
- Po ponownym zalogowaniu użytkownik jest przekierowany na stronę którą próbował otworzyć (redirect URL)

US-042: Obsługa zbyt długiego czasu odpowiedzi API
Jako użytkownik chcę otrzymać feedback gdy operacja trwa dłużej niż zwykle, aby wiedzieć że system pracuje.

Kryteria akceptacji:
- Dla operacji trwających dłużej niż 3 sekundy wyświetlany jest loader z animacją
- Loader zawiera tekst opisujący co się dzieje: "Sprawdzanie dostępności...", "Generuję sugestie...", "Wyszukuję filmy..."
- Po 30 sekundach wyświetlany jest komunikat "Operacja trwa dłużej niż zwykle. Proszę czekać..."
- Po 60 sekundach operacja kończy się timeout z komunikatem "Przekroczono limit czasu. Spróbuj ponownie później."

US-043: Obsługa braku połączenia internetowego
Jako użytkownik który stracił połączenie internetowe chcę otrzymać jasny komunikat o problemie, aby wiedzieć że to nie jest wina aplikacji.

Kryteria akceptacji:
- Gdy aplikacja wykryje brak połączenia (navigator.onLine = false), wyświetlany jest banner u góry strony
- Banner zawiera komunikat "Brak połączenia z internetem. Niektóre funkcje mogą nie działać."
- Banner jest czerwony i nie znika automatycznie
- Po przywróceniu połączenia banner zmienia kolor na zielony z tekstem "Połączenie przywrócone" i znika po 3 sekundach
- Dane załadowane przed utratą połączenia pozostają widoczne (offline-first dla watchlisty)

## 6. Metryki sukcesu

### 6.1 Kryteria sukcesu zdefiniowane w project description

Kryterium 1: 80% użytkowników posiada minimum 10 filmów łącznie (watchlist + obejrzane)

Metoda pomiaru: Zapytanie SQL zliczające użytkowników z (liczba_filmów_watchlist + liczba_filmów_obejrzanych) ≥ 10, podzielone przez wszystkich zarejestrowanych użytkowników i pomnożone przez 100%[web:9]. Metryka jest aktualizowana codziennie o północy i wyświetlana w dashboardzie administratora jako procent z kolorowym wskaźnikiem (zielony jeśli ≥80%, żółty 60-79%, czerwony <60%). Uwaga: Oryginalny limit 10 filmów na watchlist może wpłynąć na możliwość osiągnięcia tego kryterium - w MVP liczymy łącznie watchlist + obejrzane aby umożliwić osiągnięcie celu[web:9].

Kryterium 2: 25% użytkowników dodaje do watchlisty filmy rekomendowane przez AI

Metoda pomiaru: Tracking flagi "added_from_ai_suggestion = true" przy dodawaniu filmu do watchlisty[web:10]. Licznik zlicza unikalnych użytkowników którzy dodali przynajmniej jeden film z sugestii AI, dzieli przez liczbę użytkowników którzy kiedykolwiek użyli funkcji "Zasugeruj filmy" i mnoży przez 100%[web:10]. Metryka pośrednia: procent użytkowników klikających przycisk "Zasugeruj filmy" (engagement z funkcją AI). Metryka zaawansowana: conversion rate = liczba filmów dodanych z AI / liczba wszystkich wygenerowanych sugestii[web:10].

### 6.2 Dodatkowe kluczowe metryki

Retention 7-day: 40% użytkowników

Definicja: Procent użytkowników którzy zalogowali się ponownie między 7-8 dniem od rejestracji. Metoda pomiaru: Cohort analysis - dla każdego tygodnia rejestracji sprawdzane jest ilu użytkowników wróciło w okresie 7-8 dni[web:9]. Formula: (liczba_użytkowników_którzy_wrócili_dzień_7_8 / liczba_użytkowników_zarejestrowanych_w_kohorcie) * 100%. Wskaźnik ten mierzy czy użytkownicy znajdują wartość w produkcie wystarczającą aby wrócić po tygodniu.

Retention 30-day: 20% użytkowników

Definicja: Procent użytkowników którzy zalogowali się ponownie między 30-31 dniem od rejestracji. Metoda pomiaru: Analogiczna do 7-day retention, ale sprawdzana w dłuższym okresie[web:9]. Ten wskaźnik mierzy długoterminowe zaangażowanie i czy produkt stał się częścią habits użytkowników.

Średnio 2 filmy oznaczone jako obejrzane per użytkownik miesięcznie

Definicja: Średnia liczba filmów oznaczonych jako "obejrzane" przez aktywnych użytkowników w danym miesiącu. Metoda pomiaru: Suma wszystkich filmów oznaczonych jako obejrzane w miesiącu, podzielona przez liczbę użytkowników którzy zalogowali się przynajmniej raz w tym miesiącu[web:9]. Ten wskaźnik mierzy czy użytkownicy faktycznie oglądają filmy z watchlisty (wartość aplikacji) czy tylko gromadzą tytuły bez konsumpcji.

### 6.3 Dodatkowe metryki operacyjne

Completion rate onboardingu: Procent użytkowników którzy ukończyli wszystkie 3 kroki onboardingu vs użyli przycisku Skip. Target: ≥60% completion. Liczba zapytań do Watchmode.com API tygodniowo: Monitoring kosztów i rate limits[web:1][web:11]. Alert jeśli zbliżamy się do limitu płatnego planu. Liczba zapytań do Gemini API dziennie: Monitoring kosztów AI[web:10][web:16]. Formula: liczba_użytkowników_używających_AI * 1 request/dzień. Przy cenie 0.075 USD input + 0.30 USD output za milion tokenów możemy estymować miesięcz

[1](https://api.watchmode.com/tc)
[2](https://api.watchmode.com)
[3](https://publicapi.dev/watchmode-api)
[4](https://apidog.com/blog/free-movie-apis/)
[5](https://www.cursor-ide.com/blog/gemini-2-5-pro-free-api-limits-guide)
[6](https://www.reddit.com/r/TMDb/comments/19bxsed/what_is_considered_commercial_use_to_tmdb_and_how/)
[7](https://hostbor.com/gemini-25-api-gets-pricieris/)
[8](https://www.reddit.com/r/learnprogramming/comments/zst0vp/api_for_getting_movies_actors_tv_shows_etc/)
[9](https://zuplo.com/learning-center/best-movie-api-imdb-vs-omdb-vs-tmdb)
[10](https://ai.google.dev/gemini-api/docs/pricing)
[11](https://rapidapi.com/meteoric-llc-meteoric-llc-default/api/watchmode/pricing)
[12](https://developer.themoviedb.org/docs/faq)
[13](https://cloud.google.com/vertex-ai/generative-ai/pricing)
[14](https://openai.com/index/introducing-chatgpt-agent/)
[15](https://zerobytecode.com/docs/sceneflix/get-tmdb-api-key/)
[16](https://www.cloudzero.com/blog/gemini-pricing/)
[17](https://docs.docker.com/compose/how-tos/file-watch/)
[18](https://launchschool.com/books/working_with_apis/read/tmdb_api)
[19](https://www.helicone.ai/llm-cost/provider/google/model/gemini-2.0-flash-lite)
[20](https://virtuslab.com/blog/frontend/cloud-headless-content-distribution/)