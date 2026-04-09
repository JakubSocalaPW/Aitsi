# Cyfrowe Archiwum Społecznościowe

Aplikacja do gromadzenia, opisywania i udostępniania archiwalnych zdjęć.  
Backend: **ASP.NET Core 8** · Frontend: **Vue 3 + Vite** · Baza: **PostgreSQL**

---

## Wymagania

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) (z npm)
- [PostgreSQL 15+](https://www.postgresql.org/)

---

## Uruchomienie

### 1. Baza danych

Utwórz bazę i użytkownika w PostgreSQL:

```sql
CREATE USER aitsib_admin WITH PASSWORD 'twoje_haslo';
CREATE DATABASE aitsib_db OWNER aitsib_admin;
```

### 2. Backend

```bash
cd backend
```

Utwórz plik `appsettings.Development.json` (jeśli nie istnieje):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=aitsib_db;Username=aitsib_admin;Password=twoje_haslo"
  },
  "Jwt": {
    "Key": "min-32-znakowy-losowy-klucz-sekretny!!"
  },
  "Google": {
    "ClientId": ""
  },
  "Cors": {
    "AllowedOrigins": "https://localhost:3000,http://localhost:3000"
  }
}
```

Zastosuj migracje i uruchom:

```bash
dotnet ef database update
dotnet run
```

API dostępne pod: `http://localhost:5052`  
Swagger UI: `http://localhost:5052/swagger`

> Przy pierwszym uruchomieniu EF automatycznie tworzy konto admina  
> (e-mail i hasło z sekcji `AdminSeed` w konfiguracji).

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacja dostępna pod: `https://localhost:3000`

> Frontend używa self-signed SSL (`@vitejs/plugin-basic-ssl`) — przeglądarka może pokazać ostrzeżenie, kliknij „Kontynuuj mimo to".

---

## Konta testowe

Po uruchomieniu logowanie odbywa się przez **Google** lub **Facebook** OAuth.  
Pierwsze konto z danym e-mailem Google/Facebook automatycznie otrzymuje rolę **Twórcy**.

Konto administratora jest tworzone przez seed w bazie — skontaktuj się z autorem projektu po dane dostępowe.

---

## Skróty developerskie

| Komenda | Opis |
|---------|------|
| `dotnet run` (backend/) | Uruchom API |
| `dotnet ef migrations add <Nazwa>` | Utwórz nową migrację |
| `dotnet ef database update` | Zastosuj migracje |
| `npm run dev` (frontend/) | Uruchom dev server |
| `npm run build` (frontend/) | Zbuduj produkcyjny bundle |
| `npm run type-check` (frontend/) | Sprawdź typy TypeScript |

---

## Struktura projektu

```
├── backend/          # ASP.NET Core Web API
│   ├── Controllers/  # Endpointy REST
│   ├── Models/       # Encje EF Core
│   ├── Data/         # DbContext, seed
│   └── Migrations/   # Historia schematu bazy
├── frontend/         # Vue 3 SPA
│   └── src/
│       ├── pages/    # Widoki (1 plik = 1 trasa)
│       ├── components/
│       ├── stores/   # Pinia
│       ├── api/      # Klienty HTTP
│       └── router/   # Trasy + guardy
└── docs/             # Dokumentacja (md + tex)
```
