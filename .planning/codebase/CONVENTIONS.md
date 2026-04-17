# Conventions — Syntra

## Code Style

- **Python:** Loosely follows PEP 8
  - 4-space indentation (some files use tabs — `super_admin/views.py`, `organizer/views.py`)
  - Single quotes for strings (mostly consistent)
  - Blank line between imports and code
  - Django convention for model definitions

## Naming

- **Models:** PascalCase (`User`, `CustomUserManager`)
- **Views:** snake_case functions (`login_view`, `signup_view`, `select_role_view`)
- **API Views:** PascalCase classes (`RegisterAPIView`, `LoginAPIView`, `MeAPIView`)
- **URLs:** Kebab-case paths (`/select-role/`, `/complete-profile/`, `/social-redirect/`)
- **URL names:** Snake_case (`select_role`, `complete_profile`, `social_login_redirect`)
- **Form classes:** PascalCase (`SignUpForm`, `LoginForm`, `ProfileCompletionForm`)
- **Constants:** UPPER_CASE (`ROLE_DASHBOARD_MAP`, `INPUT_CLASS`, `ROLE_CHOICES`)
- **Prefixes:** API files use `api_` prefix (`api_views.py`, `api_serializers.py`, `api_urls.py`)

## Patterns

### Role-based Access Control
```python
# Decorator pattern in `backend/accounts/decorators.py`
@role_required('participant')
def home(request):
    return render(request, 'participant/home.html')
```

### Dashboard Routing
```python
# Dictionary-based routing in `backend/accounts/views.py`
ROLE_DASHBOARD_MAP = {
    User.Role.PARTICIPANT: '/participant/dashboard',
    User.Role.ORGANIZER: '/organizer/dashboard',
    ...
}
```

### Form Styling
```python
# Shared CSS class constant for form widgets in `backend/accounts/forms.py`
INPUT_CLASS = 'w-full rounded-xl border border-slate-700 ...'
```

### Social Auth Entry Points
```python
# Legacy entry point pattern — redirects to allauth canonical URL
def google_login_entry(request):
    if not _social_provider_configured(request, 'google'):
        messages.error(request, '...')
        return redirect('login')
    return redirect(reverse('google_login'))
```

## Error Handling

- **Form validation:** Django form `clean()` methods with `forms.ValidationError`
- **API validation:** DRF `serializers.ValidationError` with field-level errors
- **Auth errors:** `messages.error()` for template views, DRF exception for API
- **Access control:** `HttpResponseForbidden` via `@role_required()` decorator
- **Social auth errors:** Check if provider configured, redirect with message if not

## Import Organization

Follows Django conventions (roughly):
1. Standard library imports
2. Django and third-party imports
3. Local app imports (relative: `from .models import User`)

## Configuration Patterns

- **Env vars** loaded via `python-dotenv` from `.env` at project root
- **OAuth keys** read via `os.getenv()` with empty string defaults
- **Settings inheritance** via `from syntra.settings import *` in `project/settings.py`

## Comments

- Minimal inline comments
- Some Hindi comments exist (e.g., `# ✅ Superuser ne ignore karo` in middleware)
- Emoji-prefixed comments in middleware for visual scanning (`# ✅`, `# 🔹`)
- Legacy code comments preserved (e.g., `# Uncomment once social-auth-app-django is installed`)
