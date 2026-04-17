# Architecture — Syntra

## Pattern

**Monolithic Django application** with role-based app separation.

The architecture follows a traditional Django monolith pattern where apps are organized by **user role** rather than **domain/feature**. Each role (participant, organizer, judge, volunteer, super_admin) has its own Django app, but all apps are essentially empty shells — only the `accounts` app contains real logic.

## Layers

### 1. URL Routing Layer
- `backend/syntra/urls.py` — Primary URL config (allauth + template views)
- `backend/project/urls.py` — Extended URL config (adds `api` app routes)
- Each role app has its own `urls.py` with a single dashboard route

### 2. View Layer (Mixed)
- **Template views:** `backend/accounts/views.py` — Full auth flow (login, signup, role selection, profile completion, social auth)
- **API views:** `backend/accounts/api_views.py` — DRF-based register, login, me endpoints
- **Role dashboards:** Each role app has one `home()` view rendering a template

### 3. Model Layer
- **Only one real model:** `backend/accounts/models.py` → `User` (custom, email-based)
- All other apps have empty `models.py` files (`# Create your models here.`)
- No hackathon, team, submission, or judging models exist yet

### 4. Middleware Layer
- `backend/accounts/middleware.py` → `UserFlowMiddleware`
  - Enforces role selection and profile completion flow
  - Bypasses admin, API, and OAuth routes
  - Superusers skip all flow checks

### 5. Serialization Layer
- `backend/accounts/api_serializers.py` — Register, Login serializers
- `backend/api/serializers.py` — Re-exports from accounts (proxy)

## Authentication Architecture

### Dual Auth Strategy
1. **Session-based auth** — For template views (Django default + allauth)
2. **JWT auth** — For API endpoints (djangorestframework-simplejwt)

### User Flow (Template-based)
```
Signup → Role Selection → Profile Completion → Role Dashboard
                ↑                    ↑
        Social Login ────────────────┘
```

### User Flow (API-based)
```
POST /api/auth/register/ → JWT tokens
POST /api/auth/login/    → JWT tokens
GET  /api/auth/me/       → User profile (requires JWT)
POST /api/auth/refresh/  → New access token
```

## Role System

- **Global role** on `User.role` — Single role per user
- Available roles: `participant`, `organizer`, `judge`, `volunteer`, `super_admin`
- **No per-hackathon roles** — Current architecture assigns one global role
- Role-based access via `@role_required()` decorator in `backend/accounts/decorators.py`
- Dashboard routing via `ROLE_DASHBOARD_MAP` dict in `backend/accounts/views.py`

## Data Flow

```
Browser → Django URL Router → Middleware (flow checks) → View → Template → Response
                                                           ↓
                                                       User Model
```

For API:
```
Client → /api/ → DRF View → Serializer → User Model → JSON Response
```

## Entry Points

| Entry Point | File | Purpose |
|-------------|------|---------|
| `/` | `backend/core/views.py` → `home()` | Landing page |
| `/accounts/login/` | `backend/accounts/views.py` → `login_view()` | User login |
| `/accounts/signup/` | `backend/accounts/views.py` → `signup_view()` | User registration |
| `/api/auth/register/` | `backend/accounts/api_views.py` → `RegisterAPIView` | API registration |
| `/api/auth/login/` | `backend/accounts/api_views.py` → `LoginAPIView` | API login |
| `/admin/` | Django admin | Admin panel |
| `/{role}/dashboard` | Each role app's `views.py` | Role-specific dashboard |

## Key Abstractions

- `CustomUserManager` — Email-based user creation
- `SyntraSocialAccountAdapter` — Social auth preference + user merging
- `UserFlowMiddleware` — Enforces signup completion flow
- `role_required()` — Role-based access control decorator

## Current Limitations

- **No domain models** — No hackathon, team, submission, or judging models
- **Role-per-user** — Cannot be a participant in one hackathon and judge in another
- **Empty apps** — participant, organizer, judge, volunteers, super_admin have no models
- **No API beyond auth** — Only auth endpoints exist in REST API
- **SQLite-only** — No production database support
