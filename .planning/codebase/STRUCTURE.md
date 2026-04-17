# Structure — Syntra

## Directory Layout

```
syntra/                              # Project root
├── .env                             # Environment variables (OAuth secrets)
├── .gitignore                       # Python + Django ignores
├── LICENSE                          # MIT License
├── backend/                         # Django project root
│   ├── manage.py                    # Django CLI (DJANGO_SETTINGS_MODULE=project.settings)
│   ├── requirements.txt             # Python dependencies
│   ├── db.sqlite3                   # SQLite database
│   │
│   ├── syntra/                      # Primary Django settings package
│   │   ├── __init__.py
│   │   ├── settings.py              # Main settings (apps, auth, middleware, allauth)
│   │   ├── urls.py                  # Primary URL routing (template views)
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── project/                     # Extended settings package (adds api app)
│   │   ├── __init__.py
│   │   ├── settings.py              # Imports syntra.settings, adds api app
│   │   ├── urls.py                  # Extended URL routing
│   │   ├── wsgi.py
│   │   └── asgi.py
│   │
│   ├── accounts/                    # ★ Primary app — User model + auth
│   │   ├── models.py                # Custom User model (AbstractUser, email-based)
│   │   ├── views.py                 # Template auth views (login, signup, role, profile)
│   │   ├── forms.py                 # Django forms (SignUp, Login, Role, Profile)
│   │   ├── urls.py                  # Template URL routes + allauth include
│   │   ├── api_views.py             # DRF auth views (Register, Login, Me)
│   │   ├── api_serializers.py       # DRF serializers
│   │   ├── api_urls.py              # API URL routes
│   │   ├── adapters.py              # Social auth adapter (allauth)
│   │   ├── middleware.py            # UserFlowMiddleware
│   │   ├── decorators.py           # role_required() decorator
│   │   ├── admin.py                 # (default, unmodified)
│   │   ├── apps.py
│   │   ├── tests.py                 # (empty)
│   │   └── migrations/
│   │
│   ├── core/                        # Landing page app
│   │   ├── models.py                # (empty)
│   │   ├── views.py                 # home() → renders home.html
│   │   ├── urls.py
│   │   └── migrations/
│   │
│   ├── api/                         # API stub app
│   │   ├── models.py                # (empty)
│   │   ├── views.py                 # hello_api() health check
│   │   ├── serializers.py           # Re-exports from accounts
│   │   └── urls.py
│   │
│   ├── participant/                 # Role dashboard (stub)
│   │   ├── models.py                # (empty)
│   │   ├── views.py                 # home() with @role_required('participant')
│   │   └── urls.py
│   │
│   ├── organizer/                   # Role dashboard (stub)
│   │   ├── models.py                # (empty)
│   │   ├── views.py                 # home() with @role_required('organizer')
│   │   └── urls.py
│   │
│   ├── judge/                       # Role dashboard (stub)
│   │   ├── models.py                # (empty)
│   │   ├── views.py                 # home() with @role_required('judge')
│   │   └── urls.py
│   │
│   ├── volunteers/                  # Role dashboard (stub)
│   │   ├── models.py                # (empty)
│   │   ├── views.py                 # home() with @role_required('volunteer')
│   │   └── urls.py
│   │
│   └── super_admin/                 # Role dashboard (stub)
│       ├── models.py                # (empty)
│       ├── views.py                 # home() with @role_required('super_admin')
│       └── urls.py
│
└── frontend/                        # Templates + static assets
    ├── templates/
    │   ├── home.html                # Landing page (50KB — full page with inline styles)
    │   ├── accounts/
    │   │   ├── base_auth.html       # Auth layout base
    │   │   ├── login.html           # Login page
    │   │   ├── signup.html          # Signup page
    │   │   ├── select_role.html     # Role selection page
    │   │   └── complete_profile.html # Profile completion page
    │   ├── participant/
    │   ├── organizer/
    │   ├── judge/
    │   ├── super_admin/
    │   └── volunteers/
    │
    └── static/
        ├── css/                     # Stylesheets
        └── js/                      # Client-side JavaScript
```

## Key Locations

| What | Where |
|------|-------|
| Django settings | `backend/syntra/settings.py` |
| URL routing | `backend/syntra/urls.py` |
| Custom User model | `backend/accounts/models.py` |
| Auth views (templates) | `backend/accounts/views.py` |
| Auth views (API) | `backend/accounts/api_views.py` |
| Social auth adapter | `backend/accounts/adapters.py` |
| Flow enforcement | `backend/accounts/middleware.py` |
| Access control | `backend/accounts/decorators.py` |
| OAuth credentials | `.env` |
| Database | `backend/db.sqlite3` |
| Templates | `frontend/templates/` |
| Static assets | `frontend/static/` |

## Naming Conventions

- **Apps:** Lowercase, role-based names (`accounts`, `participant`, `organizer`, `judge`, `volunteers`, `super_admin`)
- **URL patterns:** Kebab-case paths (`/accounts/select-role/`, `/accounts/complete-profile/`)
- **Template names:** Snake_case filenames (`complete_profile.html`, `base_auth.html`)
- **Python:** PEP 8 style (snake_case functions, PascalCase classes)

## Notable Patterns

- **Dual settings:** `syntra/settings.py` → `project/settings.py` inheritance
- **Template serving:** Django templates served from `frontend/templates/` (outside `backend/`)
- **Static serving:** Django static files from `frontend/static/`
- **Frontend separation:** Templates and static assets live under `frontend/`, not inside Django apps
