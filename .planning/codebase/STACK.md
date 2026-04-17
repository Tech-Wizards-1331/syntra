# Stack — Syntra

## Language & Runtime

- **Python** — Primary backend language
- **Django 6.0.3** — Web framework, latest major version
- **HTML/CSS/JS** — Frontend templates (server-side rendered)

## Framework

- **Django 6.0.3** — Full-stack web framework
  - Custom User model via `AbstractUser` (`accounts.User`)
  - Template-based rendering with `frontend/templates/`
  - Django admin enabled
  - Sites framework enabled (`django.contrib.sites`, `SITE_ID = 1`)

## Dependencies (`backend/requirements.txt`)

| Package | Version | Purpose |
|---------|---------|---------|
| Django | 6.0.3 | Web framework |
| django-allauth | 65.13.0 | Social auth (Google, GitHub OAuth) |
| python-dotenv | 1.2.1 | Environment variable management |
| djangorestframework | 3.16.1 | REST API framework |
| djangorestframework-simplejwt | 5.5.1 | JWT authentication for APIs |
| requests | 2.32.5 | HTTP client |
| PyJWT | 2.12.1 | JWT token handling |
| cryptography | 46.0.5 | Cryptographic operations |

## Database

- **SQLite3** — `backend/db.sqlite3` (development only)
- No PostgreSQL or production DB configured yet

## Configuration

- **Settings module:** `backend/syntra/settings.py` (primary), `backend/project/settings.py` (extends syntra settings)
- **Manage.py:** Points to `project.settings` (which imports from `syntra.settings`)
- **Environment:** `.env` file at project root, loaded via `python-dotenv`
- **Auth model:** `AUTH_USER_MODEL = 'accounts.User'`
- **Time zone:** `Asia/Kolkata`
- **Debug mode:** `True` (hardcoded)
- **Secret key:** Hardcoded insecure key (needs rotation for production)

## Frontend

- **Server-side templates** in `frontend/templates/`
- **Static files** in `frontend/static/css/` and `frontend/static/js/`
- **Tailwind CSS** — Used in form widget classes (e.g., `w-full rounded-xl border...`)
- No JavaScript framework — plain HTML templates with Django template language

## Dual Settings Architecture

Two Django settings modules exist:
1. `backend/syntra/settings.py` — Primary settings, all app configs
2. `backend/project/settings.py` — Extends syntra settings, adds `api` app, overrides ROOT_URLCONF to `project.urls`

`manage.py` defaults to `project.settings`, meaning the `api` app module is active by default.
