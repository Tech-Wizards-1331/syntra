# Testing — Syntra

## Current State

**No tests exist.** Every `tests.py` file across all apps contains only the default Django boilerplate:

```python
from django.test import TestCase
# Create your tests here.
```

## Files Checked

| App | File | Status |
|-----|------|--------|
| accounts | `backend/accounts/tests.py` | Empty (63 bytes) |
| core | `backend/core/tests.py` | Empty (63 bytes) |
| participant | `backend/participant/tests.py` | Empty (63 bytes) |
| organizer | `backend/organizer/tests.py` | Empty (63 bytes — inferred) |
| judge | `backend/judge/tests.py` | Empty (63 bytes) |
| volunteers | `backend/volunteers/tests.py` | Empty (63 bytes — inferred) |
| super_admin | `backend/super_admin/tests.py` | Empty (63 bytes — inferred) |

## Test Infrastructure

- **Framework:** Django's built-in `TestCase` (available, unused)
- **CI/CD:** Not configured — no `.github/workflows/`, no tox.ini, no pytest.ini
- **Coverage tool:** Not installed
- **Fixtures:** None
- **Factories:** None

## Testing Gaps

- No unit tests for `User` model or `CustomUserManager`
- No tests for auth flow (login → role selection → profile completion)
- No tests for API endpoints (register, login, refresh, me)
- No tests for `SyntraSocialAccountAdapter`
- No tests for `UserFlowMiddleware`
- No tests for `@role_required()` decorator
- No integration tests for OAuth flows

## Recommendations

1. Add `pytest` + `pytest-django` for easier test writing
2. Add `factory-boy` for model factories
3. Prioritize testing: User model, auth flow, middleware, API endpoints
4. Add CI pipeline (GitHub Actions) with test + lint steps
