# API Endpoints - Cyfrowe Archiwum Spolecznosciowe

Base URL: `/api`

Legenda dostepu:
- **Publiczny** — bez logowania
- **Tworca** — zalogowany uzytkownik
- **Admin** — administrator systemu

---

## Auth

| Metoda | Endpoint | Dostep | Opis |
|--------|----------|--------|------|
| POST | `/api/auth/google` | Publiczny | Logowanie/rejestracja przez Google OAuth |
| POST | `/api/auth/facebook` | Publiczny | Logowanie/rejestracja przez Facebook OAuth |
| GET | `/api/auth/me` | Tworca | Pobranie danych zalogowanego uzytkownika |

---

## Zdjecia (Photos) — API Publiczne

Wyszukiwanie i przegladanie — dostepne bez logowania.

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/photos` | Lista/wyszukiwanie zdjec |
| GET | `/api/photos/{id}` | Szczegoly zdjecia (metadane + opis) |
| GET | `/api/photos/{id}/image` | Pobranie pliku obrazu (full size) |
| GET | `/api/photos/{id}/thumbnail` | Pobranie miniatury |

### Parametry wyszukiwania `GET /api/photos`

| Parametr | Typ | Opis |
|----------|-----|------|
| `q` | string | Wyszukiwanie pelnotekstowe (po opisie, tytule) |
| `categoryId` | int | Filtrowanie po kategorii (uwzglednia podkategorie) |
| `lat` | double | Szerokosc geograficzna (srodek wyszukiwania) |
| `lng` | double | Dlugosc geograficzna (srodek wyszukiwania) |
| `radius` | double | Promien wyszukiwania w km (domyslnie 10) |
| `dateFrom` | string | Poczatek zakresu dat (format: YYYY, YYYY-MM lub YYYY-MM-DD) |
| `dateTo` | string | Koniec zakresu dat (format: YYYY, YYYY-MM lub YYYY-MM-DD) |
| `sortBy` | string | Sortowanie: `date`, `createdAt`, `relevance` (domyslnie `relevance`) |
| `sortDir` | string | Kierunek: `asc`, `desc` (domyslnie `desc`) |
| `page` | int | Numer strony (domyslnie 1) |
| `pageSize` | int | Ilosc na strone (domyslnie 20, max 100) |

### Odpowiedz `GET /api/photos` (stronicowana)

```json
{
  "items": [
    {
      "id": 1,
      "title": "Rynek Glowny 1965",
      "description": "Widok na Rynek...",
      "thumbnailUrl": "/api/photos/1/thumbnail",
      "location": { "lat": 50.0614, "lng": 19.9372, "label": "Krakow, Rynek" },
      "date": "1965",
      "datePrecision": "year",
      "category": { "id": 3, "name": "Krakow" },
      "author": { "id": 5, "displayName": "Jan Kowalski" },
      "createdAt": "2026-03-20T10:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 142,
  "totalPages": 8
}
```

---

## Zdjecia — API Prywatne (Tworca)

Zarzadzanie wlasnymi materialami.

| Metoda | Endpoint | Dostep | Opis |
|--------|----------|--------|------|
| POST | `/api/photos` | Tworca | Przeslanie nowego zdjecia |
| PUT | `/api/photos/{id}` | Tworca | Edycja metadanych wlasnego zdjecia |
| DELETE | `/api/photos/{id}` | Tworca | Usuniecie wlasnego zdjecia |
| GET | `/api/photos/my` | Tworca | Lista wlasnych zdjec |

### Body `POST /api/photos` (multipart/form-data)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| `file` | file | tak | Plik obrazu (jpg, png, webp; max 20MB) |
| `title` | string | tak | Tytul zdjecia |
| `description` | string | nie | Opis tekstowy |
| `categoryId` | int | tak | Przypisanie do kategorii hierarchicznej |
| `lat` | double | tak | Szerokosc geograficzna |
| `lng` | double | tak | Dlugosc geograficzna |
| `locationLabel` | string | nie | Tekstowy opis lokalizacji (np. "Krakow, ul. Florianska") |
| `date` | string | tak | Data zdjecia (YYYY, YYYY-MM lub YYYY-MM-DD) |

### Body `PUT /api/photos/{id}` (application/json)

Takie same pola jak POST, ale bez `file` i wszystkie opcjonalne (PATCH semantics).

---

## Kategorie (Categories) — Hierarchiczna struktura

Publiczne przegladanie hierarchii. Zarzadzanie — admin.

| Metoda | Endpoint | Dostep | Opis |
|--------|----------|--------|------|
| GET | `/api/categories` | Publiczny | Pelne drzewo kategorii |
| GET | `/api/categories/{id}` | Publiczny | Kategoria z podkategoriami |
| GET | `/api/categories/{id}/photos` | Publiczny | Zdjecia w danej kategorii |
| POST | `/api/categories` | Admin | Utworzenie kategorii |
| PUT | `/api/categories/{id}` | Admin | Edycja kategorii |
| DELETE | `/api/categories/{id}` | Admin | Usuniecie kategorii |

### Przykladowa hierarchia kategorii

```
Malopolska (region)
  └── Krakow (miasto)
        ├── Stare Miasto (dzielnica)
        │     ├── Rynek Glowny
        │     └── ul. Florianska
        └── Kazimierz
```

### Body `POST /api/categories` (application/json)

```json
{
  "name": "Stare Miasto",
  "parentId": 2,
  "description": "Historyczne centrum Krakowa"
}
```

---

## Administracja

| Metoda | Endpoint | Dostep | Opis |
|--------|----------|--------|------|
| GET | `/api/admin/users` | Admin | Lista uzytkownikow |
| GET | `/api/admin/users/{id}` | Admin | Szczegoly uzytkownika |
| POST | `/api/admin/users/{id}/block` | Admin | Zablokowanie uzytkownika |
| DELETE | `/api/admin/users/{id}/block` | Admin | Odblokowanie uzytkownika |
| PUT | `/api/admin/photos/{id}` | Admin | Edycja metadanych dowolnego zdjecia |
| DELETE | `/api/admin/photos/{id}` | Admin | Usuniecie dowolnego zdjecia |

### Body `POST /api/admin/users/{id}/block` (application/json)

```json
{
  "reason": "Publikowanie nieodpowiednich tresci"
}
```

---

## Podsumowanie endpointow

| Zasob | Publiczne | Tworca | Admin | Razem |
|-------|-----------|--------|-------|-------|
| Auth | 2 | 1 | — | 3 |
| Photos | 4 | 4 | 2 | 10 |
| Categories | 3 | — | 3 | 6 |
| Users | — | — | 4 | 4 |
| **Razem** | **9** | **5** | **9** | **23** |

---

## Uwagi techniczne

- **Autoryzacja**: JWT Bearer token w headerze `Authorization`
- **Walidacja dat**: Obsluga zmiennej precyzji (rok / rok-miesiac / pelna data)
- **Lokalizacja**: Przechowywana jako wspolrzedne (lat/lng), wyszukiwanie w promieniu
- **Pliki**: Osobny storage (Azure Blob / dysk), w bazie tylko sciezka
- **Miniaturki**: Generowane automatycznie przy uploadzie (np. 300x300)
- **Stronicowanie**: Cursor-based lub offset — offset prostszy na start
- **CORS**: Skonfigurowany dla domeny frontendu