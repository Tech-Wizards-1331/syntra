# Integrations — Syntra

## Authentication Providers

### Google OAuth
- **Library:** django-allauth (`allauth.socialaccount.providers.google`)
- **Config:** `SOCIALACCOUNT_PROVIDERS.google` in `backend/syntra/settings.py`
- **Env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Scope:** `['profile', 'email']`
- **Entry point:** `backend/accounts/views.py` → `google_login_entry()`
- **Callback:** Handled by allauth at `/accounts/google/login/callback/`

### GitHub OAuth
- **Library:** django-allauth (`allauth.socialaccount.providers.github`)
- **Config:** `SOCIALACCOUNT_PROVIDERS.github` in `backend/syntra/settings.py`
- **Env vars:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- **Scope:** `['user:email']`
- **Entry point:** `backend/accounts/views.py` → `github_login_entry()`
- **Callback:** Handled by allauth at `/accounts/github/login/callback/`

### Social Auth Configuration
- **Custom adapter:** `backend/accounts/adapters.py` → `SyntraSocialAccountAdapter`
  - Handles settings-based vs DB-based SocialApp preference
  - Auto-populates `full_name` from social profile
  - Connects existing users by email match on first social login
- Auto signup enabled (`SOCIALACCOUNT_AUTO_SIGNUP = True`)
- Login on GET enabled (`SOCIALACCOUNT_LOGIN_ON_GET = True`)

## JWT Authentication (REST API)

- **Library:** `djangorestframework-simplejwt`
- **Config:** `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES` → `JWTAuthentication`
- **Token endpoints:**
  - Register: `/api/auth/register/`
  - Login: `/api/auth/login/`
  - Refresh: `/api/auth/refresh/`
  - Me: `/api/auth/me/`
- JWT tokens returned in login/register responses

## Database

- **SQLite3** — Development database at `backend/db.sqlite3`
- No external database service configured (no PostgreSQL, no cloud DB)

## External APIs

- None configured beyond OAuth providers

## Email

- No email backend configured (default Django console backend)
- `ACCOUNT_EMAIL_VERIFICATION = 'none'` — Email verification disabled

## Webhooks

- None configured

## Missing Integrations (for Production)

- No PostgreSQL/production database
- No email service (SendGrid, Mailgun, etc.)
- No file storage (S3, GCS)
- No caching (Redis, Memcached)
- No task queue (Celery)
- No monitoring/logging service
- No CORS configuration for API
