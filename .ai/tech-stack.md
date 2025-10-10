# Stos Technologiczny - MyVOD (Wariant Django)

## 🎯 Wybór: Django REST Framework

**Rekomendowany dla**: Mało doświadczony deweloper Python  
**Główna zaleta**: Batteries included - admin panel, auth, ORM gotowe z pudełka  
**Czas do MVP**: 100-140 godzin

---

## Backend

### Framework: **Django 5.0**
- **Wersja**: Django 5.0+

### REST API: **Django REST Framework (DRF)**
- **Wersja**: 3.14+

### API Documentation: **drf-spectacular**
- **Wersja**: 0.27+

### ORM: **Django ORM** (built-in)

### Authentication: **Django Auth + JWT**
- **Komponenty**:
  - Django Authentication System (built-in)
  - `djangorestframework-simplejwt` - JWT tokens dla API
  - `django-cors-headers` - CORS dla frontend

### Task Queue: **Celery + Redis**
- **Wersja**: Celery 5.3+, Redis 7+

### Database: **Supabase (PostgreSQL 15)**
- **Komponenty**:
  - PostgreSQL 15+ jako silnik
  - `psycopg2-binary` - PostgreSQL adapter
  - Schemat początkowy zarządzany przez migracje Supabase
  - Migracje Django zarządzają tabelami wbudowanymi (auth, admin, etc.)
  
---

## Frontend

### Framework: **React 18** + **Vite**
- **Wersja**: React 18.2+, Vite 5+

### UI Framework: **Tailwind CSS** + **shadcn/ui**
- **Komponenty**:
  - Tailwind CSS 3.4+
  - shadcn/ui - gotowe komponenty React
  - Lucide React - ikony

### State Management: **TanStack Query** (React Query)
- **Wersja**: 5.0+

### Routing: **React Router v6**

### Forms: **React Hook Form** + **Zod**

### HTTP Client: **Axios**
- **Wersja**: 1.6+

---

## External APIs & Services

### AI: **Google Gemini (gemini-1.5-flash)**
- **SDK**: `google-generativeai` (Python)
- **Model**: gemini-1.5-flash

### VOD Availability: **Watchmode.com API**
- **Client**: `requests` lub `httpx`

### Movie Posters: **TMDB API**
- **Client**: `requests`

---

## Development Tools

### Language: **Python 3.11+**

### Package Manager: **uv**

### Code Quality:
- **Linter**: `ruff` - najszybszy linter Python
- **Formatter**: `ruff format` (zamiennik Black)
- **Type Checking**: `ty`
- **Import sorting**: `ruff` (built-in)

### Testing:
- **Backend**: `pytest` + `pytest-django`
- **Coverage**: `coverage.py` + `pytest-cov`
- **Frontend**: `Vitest` + `React Testing Library`
- **E2E**: `Playwright` (opcjonalnie dla MVP)

---

## DevOps & Infrastructure

### Containerization: **Docker** + **Docker Compose**
- **Komponenty**:
  ```
  - backend (Django + Gunicorn)
  - frontend (Nginx serving static build)
  - celery-worker
  - celery-beat (scheduler)
  - redis (message broker)
  ```

### CI/CD: **GitHub Actions**
- **Workflows**:
  1. **Lint & Test** (`ci.yml`)
     - Ruff linting
     - pytest backend tests
     - Vitest frontend tests
  
  2. **Build & Deploy** (`deploy.yml`)
     - Build Docker images
     - Push to Docker Hub / GitHub Container Registry
     - SSH deploy to DigitalOcean
     - Run migrations
     - Restart services
  
  3. **Security** (Dependabot)
     - Dependency updates
     - Security alerts

### Hosting: **DigitalOcean Droplet**
- **Specyfikacja**:
  - Ubuntu 22.04 LTS
  - Docker + Docker Compose
  - Nginx jako reverse proxy
  - Let's Encrypt SSL (Certbot)
  
- **Architektura**:
  ```
  Internet → Nginx (:80/:443)
            ├─→ Frontend (static files)
            └─→ Backend API (:8000)
                ├─→ Django + Gunicorn
                ├─→ Celery Worker
                ├─→ Celery Beat
                └─→ Redis
  
  External: Supabase (PostgreSQL)
  ```

### Web Server: **Gunicorn** + **Nginx**
- **Gunicorn**: WSGI server dla Django
- **Nginx**: Reverse proxy + static files
- **Uzasadnienie**:
  - Industry standard
  - Gunicorn - production-ready WSGI
  - Nginx - SSL, static files, load balancing