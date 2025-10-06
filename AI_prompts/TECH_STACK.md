# Stos Technologiczny - MyVOD (Wariant FastAPI)

## ⚡ Wybór: FastAPI

**Rekomendowany dla**: Deweloper potrzebujący async/await i najlepszej automatycznej dokumentacji  
**Główna zaleta**: Auto-generowane API docs, wysoka wydajność, modern Python  
**Czas do MVP**: 116-166 godzin

⚠️ **Uwaga**: Istnieje również [wariant Django](./TECH_STACK_DJANGO.md) który może być lepszy dla początkujących (100-140h). Zobacz [pełne porównanie](./TECH_STACK_COMPARISON.md).

---

## Przegląd

Stos technologiczny zaprojektowany dla mało doświadczonego dewelopera Python, z naciskiem na popularność, dokumentację i prostotę implementacji.

---

## Backend

### Framework: **FastAPI**
- **Wersja**: 0.104+
- **Uzasadnienie**:
  - Nowoczesny framework Python z doskonałą dokumentacją
  - Automatyczna dokumentacja API (Swagger/OpenAPI)
  - Najszybszy framework Python (async/await)
  - Wbudowana walidacja danych (Pydantic)
  - Łatwa integracja z zewnętrznymi API
  - Doskonały dla początkujących - czytelny kod
  
### ORM: **SQLAlchemy 2.0**
- **Uzasadnienie**:
  - Standard w ekosystemie Python
  - Doskonała dokumentacja i community support
  - Pełne wsparcie dla PostgreSQL
  - Async support dla FastAPI
  - Migracje przez Alembic

### Autentykacja: **Supabase Auth + FastAPI Security**
- **Komponenty**:
  - `supabase-py` - klient Python dla Supabase
  - `python-jose` - JWT tokens
  - `passlib[bcrypt]` - haszowanie haseł
- **Uzasadnienie**:
  - Supabase oferuje gotowy system autentykacji
  - Alternatywnie: własna implementacja z bcrypt (zgodnie z PRD)
  - FastAPI ma wbudowane security utilities

---

## Frontend

### Framework: **React 18** + **Vite**
- **Wersja**: React 18.2+, Vite 5+
- **Uzasadnienie**:
  - Najpopularniejszy framework - największa społeczność
  - Vite oferuje błyskawiczny dev server
  - Ogromna liczba tutoriali i przykładów
  - Łatwe do nauczenia dla początkujących

### UI Framework: **Tailwind CSS** + **shadcn/ui**
- **Komponenty**:
  - Tailwind CSS 3.4+
  - shadcn/ui - gotowe komponenty React
  - Lucide React - ikony
- **Uzasadnienie**:
  - Tailwind - utility-first, szybki development
  - shadcn/ui - piękne, gotowe komponenty
  - Łatwe uzyskanie profesjonalnego wyglądu
  - Świetna dokumentacja

### State Management: **TanStack Query** (React Query)
- **Wersja**: 5.0+
- **Uzasadnienie**:
  - Najlepsze rozwiązanie do zarządzania API calls
  - Wbudowany caching (potrzebny dla AI suggestions)
  - Automatyczne refetching
  - Proste w użyciu dla początkujących

### Routing: **React Router v6**
- **Uzasadnienie**:
  - Standard dla React SPA
  - Prosta konfiguracja
  - Doskonała dokumentacja

### Forms: **React Hook Form** + **Zod**
- **Uzasadnienie**:
  - Najpopularniejsze rozwiązanie do formularzy
  - Zod - walidacja TypeScript-first
  - Integracja z shadcn/ui

---

## Baza Danych

### Database: **Supabase (PostgreSQL 15)**
- **Komponenty**:
  - PostgreSQL 15+ jako silnik
  - Supabase SDK dla Python i JavaScript
  - pgvector (opcjonalnie - dla przyszłych funkcji AI)
  
- **Uzasadnienie**:
  - Zgodne z preferencją użytkownika
  - Managed PostgreSQL - brak zarządzania infrastrukturą
  - Wbudowana autentykacja
  - Realtime capabilities (przyszłe funkcje)
  - Dashboard do zarządzania
  - Darmowy tier dla MVP
  - Storage dla przyszłych funkcji (np. user avatars)

### Migracje: **Alembic**
- **Uzasadnienie**:
  - Standard dla SQLAlchemy
  - Łatwe wersjonowanie schematu
  - Integracja z Supabase PostgreSQL

---

## AI & External APIs

### AI: **Google Gemini (gemini-1.5-flash)**
- **SDK**: `google-generativeai` (Python)
- **Model**: gemini-1.5-flash (tańszy niż flash-lite, lepsze wyniki)
- **Uzasadnienie**:
  - Zgodne z preferencją użytkownika
  - Oficjalny SDK Python
  - Dobry stosunek cena/jakość
  - Łatwa integracja

### VOD Availability: **Watchmode.com API**
- **Client**: `httpx` (async HTTP dla Python)
- **Uzasadnienie**:
  - Zgodne z PRD
  - httpx oferuje async calls (lepsze dla FastAPI)

### Movie Posters: **TMDB API**
- **Client**: `httpx`
- **Uzasadnienie**:
  - Zgodne z PRD
  - Darmowe dla non-commercial
  - Doskonała dokumentacja

### HTTP Client: **httpx**
- **Wersja**: 0.25+
- **Uzasadnienie**:
  - Async/await support
  - Kompatybilny z FastAPI
  - Podobny API do `requests`

---

## Task Scheduling

### Scheduler: **APScheduler** + **FastAPI Background Tasks**
- **Komponenty**:
  - APScheduler 3.10+ - scheduled jobs (cotygodniowa aktualizacja VOD)
  - FastAPI BackgroundTasks - krótkie operacje async
  
- **Uzasadnienie**:
  - APScheduler - najpopularniejszy scheduler Python
  - Proste ustawienie cron jobs
  - Działa w kontekście aplikacji FastAPI
  - Alternatywa: zewnętrzny cron w kontenerze Docker

---

## Development Tools

### Language: **Python 3.11+**
- **Uzasadnienie**:
  - Zgodne z preferencją użytkownika
  - Python 3.11 - najszybsza wersja
  - Doskonałe wsparcie dla async/await

### Package Manager: **Poetry**
- **Uzasadnienie**:
  - Nowoczesne zarządzanie zależnościami
  - Łatwe tworzenie reproducible builds
  - Lepsze niż pip + requirements.txt
  - Lock file dla stabilności

### Code Quality:
- **Linter**: `ruff` - najszybszy linter Python
- **Formatter**: `ruff format` (zamiennik Black)
- **Type Checking**: `mypy`
- **Pre-commit hooks**: `pre-commit`

### Testing:
- **Backend**: `pytest` + `pytest-asyncio`
- **Frontend**: `Vitest` + `React Testing Library`
- **E2E**: `Playwright` (opcjonalnie dla MVP)

---

## Frontend Build & Tooling

### Package Manager: **pnpm**
- **Uzasadnienie**:
  - Najszybszy package manager
  - Oszczędność przestrzeni dyskowej
  - Kompatybilny z npm

### TypeScript: **TypeScript 5+**
- **Uzasadnienie**:
  - Type safety
  - Lepsze IDE support
  - Standard w nowoczesnym React

### Build Tool: **Vite 5**
- **Uzasadnienie**:
  - Błyskawiczny dev server
  - Szybkie builds
  - Out-of-the-box config dla React

---

## DevOps & Infrastructure

### Containerization: **Docker** + **Docker Compose**
- **Komponenty**:
  - Multi-stage Dockerfile dla optimized images
  - docker-compose.yml dla local development
  - Oddzielne kontenery: backend, frontend (nginx)
  
### CI/CD: **GitHub Actions**
- **Workflows**:
  1. **Lint & Test** - na każdy push/PR
  2. **Build & Deploy** - na push do main
  3. **Security Scan** - Dependabot
  
- **Pipeline**:
  ```
  Push to main → Tests → Build Docker images → Push to registry → Deploy to DigitalOcean
  ```

### Hosting: **DigitalOcean**
- **Komponenty**:
  - DigitalOcean Droplet (Ubuntu 22.04 LTS)
  - Docker na droplet
  - Nginx jako reverse proxy
  - Let's Encrypt SSL (Certbot)
  
- **Setup**:
  - Backend container (FastAPI)
  - Frontend container (nginx serving static React build)
  - Supabase (external - managed)
  
### Reverse Proxy: **Nginx**
- **Uzasadnienie**:
  - Serving static files frontend
  - Proxy do backend API
  - SSL termination
  - Standard branżowy

---

## File Storage & Processing

### CSV/TSV Parsing: **pandas** lub **csv** (stdlib)
- **Uzasadnienie**:
  - Import danych IMDb (.tsv files)
  - pandas dla dużych plików (>1GB)
  - csv dla prostszych operacji

### Environment Variables: **python-dotenv**
- **Uzasadnienie**:
  - Zarządzanie secrets i config
  - Łatwe przełączanie między environments

---

## Monitoring & Logging (Opcjonalnie dla MVP)

### Logging: **Loguru**
- **Uzasadnienie**:
  - Najprostsza biblioteka logging Python
  - Kolorowe logi
  - Rotation files
  - Lepsze niż stdlib logging

### Error Tracking: **Sentry** (darmowy tier)
- **Uzasadnienie**:
  - Automatyczne tracking błędów
  - Source maps dla React
  - Darmowy dla małych projektów

---

## Pełny Stack - Podsumowanie

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 18 + TypeScript + Vite + Tailwind       │
│  shadcn/ui + TanStack Query + React Router     │
│                   (Port 80/443)                  │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTP/REST API
                 │
┌────────────────▼────────────────────────────────┐
│                   BACKEND                        │
│     FastAPI + SQLAlchemy + Pydantic             │
│         APScheduler (Cron Jobs)                  │
│                   (Port 8000)                    │
└─────┬──────────────────────────────────┬────────┘
      │                                  │
      │                                  │
      ▼                                  ▼
┌─────────────┐              ┌──────────────────────┐
│  Supabase   │              │   External APIs      │
│ PostgreSQL  │              │  - Watchmode         │
│    Auth     │              │  - TMDB              │
│   Storage   │              │  - Google Gemini     │
└─────────────┘              └──────────────────────┘

All running in Docker containers on DigitalOcean
```

---

## Struktura Projektu

```
myVOD/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── movies.py
│   │   │   │   ├── watchlist.py
│   │   │   │   ├── suggestions.py
│   │   │   │   └── admin.py
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── movie.py
│   │   │   └── watchlist.py
│   │   ├── schemas/
│   │   │   └── (Pydantic models)
│   │   ├── services/
│   │   │   ├── watchmode.py
│   │   │   ├── tmdb.py
│   │   │   ├── gemini.py
│   │   │   └── imdb_import.py
│   │   ├── tasks/
│   │   │   └── vod_updater.py
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/ (shadcn components)
│   │   │   ├── watchlist/
│   │   │   ├── search/
│   │   │   └── onboarding/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Watchlist.tsx
│   │   │   ├── Watched.tsx
│   │   │   └── Profile.tsx
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
└── README.md
```

---

## Kluczowe Zależności

### Backend (pyproject.toml)
```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
sqlalchemy = "^2.0.0"
alembic = "^1.12.0"
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"
supabase = "^2.0.0"
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
python-multipart = "^0.0.6"
httpx = "^0.25.0"
google-generativeai = "^0.3.0"
apscheduler = "^3.10.0"
pandas = "^2.1.0"
loguru = "^0.7.0"
python-dotenv = "^1.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.0"
ruff = "^0.1.0"
mypy = "^1.7.0"
pre-commit = "^3.5.0"
```

### Frontend (package.json - główne zależności)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

---

## Uzasadnienie wyboru dla początkującego dewelopera

### ✅ Zalety tego stacku:

1. **FastAPI** - najlepsza dokumentacja w ekosystemie Python, automatyczne API docs
2. **React** - największa społeczność, najwięcej tutoriali
3. **Tailwind + shadcn/ui** - szybkie tworzenie UI bez znajomości CSS
4. **Supabase** - managed database, brak konfiguracji infrastruktury
5. **Docker** - consistency między dev/production
6. **GitHub Actions** - darmowe CI/CD, proste YAML configs
7. **TypeScript** - wyłapywanie błędów przed runtime

### 🎯 Alternatywy (jeśli deweloper woli prostsze rozwiązania):

- **Django** zamiast FastAPI - więcej "batteries included", ale mniejsza elastyczność
- **Bootstrap** zamiast Tailwind - bardziej opinionated
- **JavaScript** zamiast TypeScript - prostsze, ale mniej bezpieczne
- **Flask** zamiast FastAPI - prostsze, ale brak async, brak auto-docs

### 📚 Zasoby do nauki:

- FastAPI: https://fastapi.tiangolo.com/tutorial/
- React: https://react.dev/learn
- Tailwind: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Supabase: https://supabase.com/docs

---

## Estymacja złożoności implementacji

| Komponent | Trudność | Czas (h) |
|-----------|----------|----------|
| Setup projektu + Docker | 🟡 Średnia | 8-12 |
| Backend API (CRUD) | 🟢 Łatwa | 20-30 |
| Autentykacja | 🟡 Średnia | 8-12 |
| Frontend (podstawowy UI) | 🟢 Łatwa | 30-40 |
| Integracje API | 🟡 Średnia | 16-24 |
| AI Sugestie | 🟢 Łatwa | 6-8 |
| Admin Panel | 🟡 Średnia | 12-16 |
| CI/CD + Deployment | 🔴 Trudna | 16-24 |
| **TOTAL** | | **116-166h** |

---

## Następne kroki

1. ✅ Setup repozytorium GitHub
2. ✅ Utworzenie projektu Supabase
3. ✅ Rejestracja API keys (Watchmode, TMDB, Gemini)
4. ✅ Inicjalizacja backend (Poetry + FastAPI)
5. ✅ Inicjalizacja frontend (Vite + React)
6. ✅ Setup Docker Compose dla local dev
7. ✅ Implementacja core features
8. ✅ Setup GitHub Actions
9. ✅ Deploy na DigitalOcean

---

**Dokument stworzony**: 2025-10-06  
**Stack dla**: Mało doświadczony deweloper Python  
**Projekt**: MyVOD MVP

