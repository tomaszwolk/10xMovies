# Aplikacja - MyVOD (MVP)

## Główny problem
Przeszukiwanie bazy filmów do obejrzenia, które są dostępne na platformach VOD jest czasochłonne, co kończy się wybraniem bezpiecznej rekomendacji z platformy VOD. Powoduje to, że możemy nie wiedzieć, że jest dostępny film, który chcielibyśmy zobaczyć a mamy go zapisanego na watchliście w innym miejscu (np na IMDb.com).

## Najmniejszy zestaw funkcjonalności
- Stworzenie bazy danych na podstawie plików z IMDb.com, które są w formacie .tsv
- Manualne stworzenie watchlist
- Połączenie poprzez API z watchmode.com i pobranie informacji o dostępności filmów w watchlist na platformach VOD
- Prosty system kont do tworzenia watchlist
- Wyświetlanie informacji obok każdego filmu z watchlist o tym na jakiej platformie jest dostępny dany tytuł
- Oznaczenie przez użytkownika filmu który już obejrzał
- Sugerowanie przez AI na podstawie listy obejrzanych filmów i watchlist, co dodać do watchlist

## Co NIE wchodzi w zakres MVP
- Zaawansowany system rekomendacji
- Import bazy danych bezpośrednio z IMDb.com
- Współdzielenie watchlist z innymi użytkownikami
- Aplikacje mobline (na początek tylko web)
- Pobieranie watchlist z portalu IMDb.com
- Pobieranie listy obejrzanych filmów przez użytkownika bezpośrednio z portalu IMDb.com
- Wybór kraju w jaki danych film jest dostępny

## Kryteria sukcesu
- 80% użytkowników posiada minimum 10 filmów na swojej watchlist
- 25% użytkowników dodaje filmy do swojej watchlisty filmy rekomendowane przez AI
