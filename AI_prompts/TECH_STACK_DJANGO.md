# Stos Technologiczny - MyVOD (Wariant Django)

## 🎯 Wybór: Django REST Framework

**Rekomendowany dla**: Mało doświadczony deweloper Python  
**Główna zaleta**: Batteries included - admin panel, auth, ORM gotowe z pudełka  
**Czas do MVP**: 100-140 godzin

---

## Backend

### Framework: **Django 5.0**
- **Wersja**: Django 5.0+
- **Uzasadnienie**:
  - "Batteries included" - wszystko gotowe z pudełka
  - Django Admin = darmowy admin panel (RF-011)
  - Authentication system wbudowany (RF-002)
  - ORM prostsze niż SQLAlchemy
  - Migrations wbudowane
  - Największa społeczność Python web framework
  - Świetna dokumentacja z oficjalnym tutorialem
  - Mniej kodu do napisania = szybsze MVP

### REST API: **Django REST Framework (DRF)**
- **Wersja**: 3.14+
- **Uzasadnienie**:
  - Industry standard dla Django APIs
  - Serializers = automatyczna walidacja
  - Browsable API (łatwe testowanie)
  - Authentication out-of-the-box
  - Permissions system
  - Pagination, filtering, searching wbudowane

### API Documentation: **drf-spectacular**
- **Wersja**: 0.27+
- **Uzasadnienie**:
  - Automatyczne generowanie OpenAPI 3.0 schema
  - Swagger UI + ReDoc
  - Type hints support
  - Lepsze niż stary drf-yasg

### ORM: **Django ORM** (built-in)
- **Uzasadnienie**:
  - Wbudowane w Django
  - Prostsze niż SQLAlchemy dla początkujących
  - Migrations automatyczne
  - Świetne wsparcie dla PostgreSQL
  - Aggregate functions dla analytics

### Authentication: **Django Auth + JWT**
- **Komponenty**:
  - Django Authentication System (built-in)
  - `djangorestframework-simplejwt` - JWT tokens dla API
  - `django-cors-headers` - CORS dla frontend
- **Uzasadnienie**:
  - Django User model gotowy z pudełka
  - Bcrypt hashing wbudowane
  - Session management
  - Permissions & groups system
  - JWT dla stateless API authentication

### Task Queue: **Celery + Redis**
- **Wersja**: Celery 5.3+, Redis 7+
- **Uzasadnienie**:
  - Industry standard dla Django
  - RF-006: scheduled job (cotygodniowa aktualizacja VOD)
  - Celery Beat dla cron jobs
  - Redis jako broker (lekki, szybki)
  - Monitoring przez Flower (opcjonalnie)

### Database: **Supabase (PostgreSQL 15)**
- **Komponenty**:
  - PostgreSQL 15+ jako silnik
  - `psycopg2-binary` - PostgreSQL adapter
  - Django migrations dla schema management
  
- **Uzasadnienie**:
  - Zgodne z preferencją użytkownika
  - Managed PostgreSQL - zero maintenance
  - Dashboard do zarządzania
  - Darmowy tier dla MVP
  - Świetna integracja z Django ORM

---

## Frontend

### Framework: **React 18** + **Vite**
- **Wersja**: React 18.2+, Vite 5+
- **Uzasadnienie**:
  - Najpopularniejszy framework - największa społeczność
  - Vite oferuje błyskawiczny dev server
  - Ogromna liczba tutoriali
  - Łatwe do nauczenia

### UI Framework: **Tailwind CSS** + **shadcn/ui**
- **Komponenty**:
  - Tailwind CSS 3.4+
  - shadcn/ui - gotowe komponenty React
  - Lucide React - ikony
- **Uzasadnienie**:
  - Profesjonalny wygląd bez znajomości CSS
  - shadcn/ui - copy-paste komponenty
  - Świetna dokumentacja
  - Responsive by default

### State Management: **TanStack Query** (React Query)
- **Wersja**: 5.0+
- **Uzasadnienie**:
  - Najlepsze do zarządzania API calls
  - Wbudowany caching (RF-009: cache AI suggestions 24h)
  - Automatyczne refetching
  - Proste w użyciu

### Routing: **React Router v6**
- **Uzasadnienie**:
  - Standard dla React SPA
  - Protected routes dla autentykacji
  - Loader functions dla data fetching

### Forms: **React Hook Form** + **Zod**
- **Uzasadnienie**:
  - Najpopularniejsze rozwiązanie
  - Zod - walidacja TypeScript-first
  - Integracja z shadcn/ui
  - Mniej re-renders = lepsza wydajność

### HTTP Client: **Axios**
- **Wersja**: 1.6+
- **Uzasadnienie**:
  - Najpopularniejszy HTTP client dla React
  - Interceptors dla JWT tokens
  - Automatyczne JSON parsing
  - Error handling

---

## External APIs & Services

### AI: **Google Gemini (gemini-1.5-flash)**
- **SDK**: `google-generativeai` (Python)
- **Model**: gemini-1.5-flash
- **Uzasadnienie**:
  - Zgodne z preferencją
  - Oficjalny SDK Python
  - Dobry stosunek cena/jakość
  - RF-009: AI suggestions

### VOD Availability: **Watchmode.com API**
- **Client**: `requests` lub `httpx`
- **Uzasadnienie**:
  - RF-006: sprawdzanie dostępności VOD
  - `requests` - najprostszy, sync
  - `httpx` - jeśli potrzebujesz async

### Movie Posters: **TMDB API**
- **Client**: `requests`
- **Uzasadnienie**:
  - RF-004: plakaty w autocomplete
  - Darmowe dla non-commercial
  - Doskonała dokumentacja

---

## Development Tools

### Language: **Python 3.11+**
- **Uzasadnienie**:
  - Zgodne z preferencją użytkownika
  - Python 3.11 - performance improvements
  - Django 5.0 wymaga Python 3.10+

### Package Manager: **Poetry** lub **pip + requirements.txt**
- **Rekomendacja**: Poetry
- **Uzasadnienie**:
  - Poetry - nowoczesne dependency management
  - Lock file dla reproducible builds
  - Alternatywa: pip + requirements.txt (prostsze dla początkujących)

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

---

## Struktura Projektu

```
myVOD/
├── backend/
│   ├── myVOD/                    # Django project folder
│   │   ├── __init__.py
│   │   ├── settings.py           # Settings (env-based)
│   │   ├── urls.py               # Root URL config
│   │   ├── wsgi.py               # WSGI entry point
│   │   └── asgi.py               # ASGI entry point
│   │
│   ├── apps/
│   │   ├── users/                # RF-002: Authentication
│   │   │   ├── models.py         # User model extensions
│   │   │   ├── serializers.py    # User serializers
│   │   │   ├── views.py          # Auth endpoints
│   │   │   └── urls.py
│   │   │
│   │   ├── movies/               # RF-001, RF-004: Movies & Search
│   │   │   ├── models.py         # Movie model
│   │   │   ├── serializers.py
│   │   │   ├── views.py          # Search, autocomplete
│   │   │   ├── urls.py
│   │   │   └── management/
│   │   │       └── commands/
│   │   │           └── import_imdb.py  # Import .tsv
│   │   │
│   │   ├── watchlist/            # RF-005: Watchlist management
│   │   │   ├── models.py         # WatchlistItem model
│   │   │   ├── serializers.py
│   │   │   ├── views.py          # CRUD operations
│   │   │   └── urls.py
│   │   │
│   │   ├── watched/              # RF-008: Watched movies
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── suggestions/          # RF-009: AI suggestions
│   │   │   ├── views.py
│   │   │   ├── services.py       # Gemini integration
│   │   │   └── urls.py
│   │   │
│   │   └── analytics/            # RF-011: Analytics & admin
│   │       ├── models.py         # Event logging
│   │       ├── admin.py          # Custom admin panel
│   │       └── views.py          # Dashboard API
│   │
│   ├── services/
│   │   ├── watchmode.py          # Watchmode API client
│   │   ├── tmdb.py               # TMDB API client
│   │   └── gemini.py             # Google Gemini client
│   │
│   ├── tasks/                    # Celery tasks
│   │   └── vod_updater.py        # RF-006: Weekly VOD update
│   │
│   ├── manage.py
│   ├── requirements.txt          # or pyproject.toml
│   ├── Dockerfile
│   ├── .env.example
│   └── pytest.ini
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn components
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── watchlist/
│   │   │   │   ├── WatchlistGrid.tsx
│   │   │   │   ├── WatchlistList.tsx
│   │   │   │   ├── MovieCard.tsx
│   │   │   │   └── PlatformIcons.tsx
│   │   │   ├── search/
│   │   │   │   └── MovieSearch.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── OnboardingFlow.tsx
│   │   │   │   ├── Step1Platforms.tsx
│   │   │   │   ├── Step2Watchlist.tsx
│   │   │   │   └── Step3Watched.tsx
│   │   │   └── suggestions/
│   │   │       └── AISuggestions.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Watchlist.tsx
│   │   │   ├── Watched.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Onboarding.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWatchlist.ts
│   │   │   └── useSuggestions.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios client
│   │   │   ├── queryClient.ts    # TanStack Query config
│   │   │   └── utils.ts
│   │   │
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript types
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── nginx/
│   ├── nginx.conf                # Production config
│   └── Dockerfile
│
├── docker-compose.yml            # Local development
├── docker-compose.prod.yml       # Production
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
└── README.md
```

---

## Kluczowe Zależności

### Backend - requirements.txt (lub pyproject.toml)

```txt
# Core
Django==5.0.1
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
drf-spectacular==0.27.0

# Database
psycopg2-binary==2.9.9
dj-database-url==2.1.0

# CORS
django-cors-headers==4.3.1

# Task Queue
celery==5.3.4
redis==5.0.1
django-celery-beat==2.5.0

# External APIs
requests==2.31.0
httpx==0.25.2
google-generativeai==0.3.2

# Data Processing
pandas==2.1.4

# Environment
python-dotenv==1.0.0

# Production Server
gunicorn==21.2.0

# Development
django-extensions==3.2.3
ipython==8.19.0

# Testing
pytest==7.4.3
pytest-django==4.7.0
pytest-cov==4.1.0
factory-boy==3.3.0

# Code Quality
ruff==0.1.9
mypy==1.7.1
django-stubs==4.2.7
```

### Backend - pyproject.toml (Poetry alternative)

```toml
[tool.poetry]
name = "myVOD-backend"
version = "0.1.0"
description = "MyVOD API Backend"
authors = ["Your Name <you@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
Django = "^5.0"
djangorestframework = "^3.14"
djangorestframework-simplejwt = "^5.3"
drf-spectacular = "^0.27"
psycopg2-binary = "^2.9"
django-cors-headers = "^4.3"
celery = "^5.3"
redis = "^5.0"
django-celery-beat = "^2.5"
requests = "^2.31"
httpx = "^0.25"
google-generativeai = "^0.3"
pandas = "^2.1"
python-dotenv = "^1.0"
gunicorn = "^21.2"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4"
pytest-django = "^4.7"
pytest-cov = "^4.1"
factory-boy = "^3.3"
ruff = "^0.1"
mypy = "^1.7"
django-stubs = "^4.2"
django-extensions = "^3.2"
ipython = "^8.19"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "myVOD.settings"
python_files = ["test_*.py", "*_test.py"]
```

### Frontend - package.json

```json
{
  "name": "myvod-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.0",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  }
}
```

---

## Docker Configuration

### docker-compose.yml (Development)

```yaml
version: '3.9'

services:
  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      - redis

  frontend:
    build: ./frontend
    command: npm run dev -- --host
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000

  celery-worker:
    build: ./backend
    command: celery -A myVOD worker -l info
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - redis

  celery-beat:
    build: ./backend
    command: celery -A myVOD beat -l info
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### backend/Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files (production)
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Production command (override in docker-compose)
CMD ["gunicorn", "myVOD.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

### frontend/Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Django Settings Configuration

### backend/myVOD/settings.py (klucowe fragmenty)

```python
import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    'django_celery_beat',
    
    # Local apps
    'apps.users',
    'apps.movies',
    'apps.watchlist',
    'apps.watched',
    'apps.suggestions',
    'apps.analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Database (Supabase PostgreSQL)
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600
    )
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# CORS
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
CORS_ALLOW_CREDENTIALS = True

# Celery Configuration
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://redis:6379/0')
CELERY_TIMEZONE = 'Europe/Warsaw'

# API Keys
WATCHMODE_API_KEY = os.getenv('WATCHMODE_API_KEY')
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

---

## Celery Configuration

### backend/myVOD/celery.py

```python
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myVOD.settings')

app = Celery('myVOD')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    'update-vod-availability': {
        'task': 'apps.watchlist.tasks.update_vod_availability',
        'schedule': crontab(day_of_week=5, hour=18, minute=0),  # Piątki 18:00
    },
}
```

### backend/apps/watchlist/tasks.py

```python
from celery import shared_task
from .models import WatchlistItem
from services.watchmode import WatchmodeClient
import logging

logger = logging.getLogger(__name__)

@shared_task
def update_vod_availability():
    """
    RF-006: Cotygodniowa aktualizacja dostępności VOD
    Uruchamiana: każdy piątek o 18:00
    """
    logger.info("Starting VOD availability update")
    
    watchmode = WatchmodeClient()
    items = WatchlistItem.objects.filter(deleted_at__isnull=True)
    
    updated_count = 0
    error_count = 0
    
    for item in items:
        try:
            availability = watchmode.get_availability(item.movie.imdb_id)
            item.update_availability(availability)
            updated_count += 1
        except Exception as e:
            logger.error(f"Error updating {item.movie.title}: {str(e)}")
            error_count += 1
    
    logger.info(f"VOD update complete: {updated_count} updated, {error_count} errors")
    return {'updated': updated_count, 'errors': error_count}
```

---

## GitHub Actions CI/CD

### .github/workflows/ci.yml

```yaml
name: CI - Lint & Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        working-directory: ./backend
        run: |
          pip install -r requirements.txt
      
      - name: Run Ruff
        working-directory: ./backend
        run: ruff check .
      
      - name: Run tests
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/test_db
          REDIS_URL: redis://localhost:6379/0
        run: |
          pytest --cov=apps --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run ESLint
        working-directory: ./frontend
        run: npm run lint
      
      - name: Run tests
        working-directory: ./frontend
        run: npm run test
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
```

### .github/workflows/deploy.yml

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push Docker images
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker build -t ${{ secrets.DOCKER_USERNAME }}/myvod-backend:latest ./backend
          docker build -t ${{ secrets.DOCKER_USERNAME }}/myvod-frontend:latest ./frontend
          docker push ${{ secrets.DOCKER_USERNAME }}/myvod-backend:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/myvod-frontend:latest
      
      - name: Deploy to DigitalOcean
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USERNAME }}
          key: ${{ secrets.DO_SSH_KEY }}
          script: |
            cd /opt/myvod
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T backend python manage.py migrate
            docker-compose exec -T backend python manage.py collectstatic --noinput
```

---

## Prosty Quick Start Guide

### 1. Setup lokalnego środowiska

```bash
# Clone repository
git clone <repo-url>
cd myVOD

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Stwórz .env file
cp .env.example .env
# Edytuj .env i dodaj klucze API

# Migracje
python manage.py migrate

# Import danych IMDb
python manage.py import_imdb path/to/title.basics.tsv

# Stwórz superusera
python manage.py createsuperuser

# Uruchom serwer
python manage.py runserver

# Frontend setup (nowy terminal)
cd ../frontend
npm install
npm run dev
```

### 2. Docker Compose (zalecane)

```bash
# Stwórz .env files
cp backend/.env.example backend/.env
# Edytuj backend/.env

# Start wszystkich serwisów
docker-compose up -d

# Migracje
docker-compose exec backend python manage.py migrate

# Import IMDb
docker-compose exec backend python manage.py import_imdb /path/to/data.tsv

# Stwórz superusera
docker-compose exec backend python manage.py createsuperuser

# Aplikacja dostępna:
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# Django Admin: http://localhost:8000/admin
# API Docs: http://localhost:8000/api/schema/swagger-ui/
```

---

## Django Admin - RF-011

### Przykład customizacji admin panel

```python
# apps/analytics/admin.py
from django.contrib import admin
from django.db.models import Count, Avg
from apps.watchlist.models import WatchlistItem
from apps.watched.models import WatchedMovie
from apps.users.models import User

@admin.register(WatchlistItem)
class WatchlistItemAdmin(admin.ModelAdmin):
    list_display = ['movie_title', 'user', 'added_at', 'is_available']
    list_filter = ['added_at', 'added_from_ai_suggestion']
    search_fields = ['movie__title', 'user__email']
    date_hierarchy = 'added_at'
    
    def movie_title(self, obj):
        return obj.movie.title
    movie_title.short_description = 'Movie'

# Custom admin dashboard
class AnalyticsDashboard(admin.AdminSite):
    site_header = 'MyVOD Analytics'
    
    def index(self, request):
        # RF-011: Metryki
        context = {
            'total_users': User.objects.count(),
            'active_users_7d': User.objects.filter(
                last_login__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'avg_watchlist_size': WatchlistItem.objects.values('user').annotate(
                count=Count('id')
            ).aggregate(Avg('count'))['count__avg'],
            'ai_adoption_rate': self._calculate_ai_adoption(),
        }
        return render(request, 'admin/analytics_dashboard.html', context)
```

---

## Zalety Django dla MyVOD - Podsumowanie

| Aspekt | Korzyść | Oszczędność czasu |
|--------|---------|-------------------|
| Django Admin | Gotowy admin panel (RF-011) | **20-30h** |
| Auth System | User model + auth (RF-002) | **10-15h** |
| ORM | Prostsze niż SQLAlchemy | **5-10h** |
| Migrations | Wbudowane | **3-5h** |
| Management Commands | Import IMDb (RF-001) | **2-3h** |
| DRF | Browsable API + serializers | **5-8h** |
| **TOTAL** | | **45-71h** |

---

## Estymacja czasu implementacji

| Komponent | Django | FastAPI | Delta |
|-----------|--------|---------|-------|
| Setup projektu | 6h | 8h | **-2h** |
| Auth system | 8h | 15h | **-7h** |
| CRUD API | 25h | 30h | **-5h** |
| Admin panel | 8h | 30h | **-22h** |
| Integracje | 18h | 20h | **-2h** |
| Frontend | 35h | 35h | 0h |
| CI/CD | 16h | 16h | 0h |
| **TOTAL** | **116h** | **154h** | **-38h** |

**Django oszczędza ~38 godzin** dzięki batteries-included approach!

---

## Next Steps

1. ✅ Setup repozytorium GitHub
2. ✅ Utworzenie projektu Supabase
3. ✅ Rejestracja API keys (Watchmode, TMDB, Gemini)
4. ✅ `django-admin startproject myVOD backend/`
5. ✅ Setup apps structure
6. ✅ Docker Compose dla local dev
7. ✅ Implementacja core features
8. ✅ Setup GitHub Actions
9. ✅ Deploy na DigitalOcean

---

**Dokument stworzony**: 2025-10-06  
**Wariant**: Django 5.0 + DRF  
**Dla**: Mało doświadczony deweloper Python  
**Projekt**: MyVOD MVP

