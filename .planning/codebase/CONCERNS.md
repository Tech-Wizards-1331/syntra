# Concerns — Syntra

## Critical Security Issues

### 1. Hardcoded Secret Key
- **File:** `backend/syntra/settings.py` (line 27)
- **Issue:** `SECRET_KEY = 'django-insecure-qb&_!-xcp+2t)2oy((=_1olwzy3!z0&nunou2n-@wf_wjdhv)d'`
- **Risk:** HIGH — Anyone with codebase access can forge sessions/tokens
- **Fix:** Move to `.env` and generate a cryptographically random key

### 2. OAuth Credentials in .env (Checked Into History?)
- **File:** `.env`
- **Issue:** Contains real Google and GitHub OAuth client IDs and secrets
- **Risk:** HIGH if `.env` was ever committed to git (even if now gitignored)
- **Fix:** Verify git history, rotate credentials if exposed

### 3. DEBUG = True Hardcoded
- **File:** `backend/syntra/settings.py` (line 30)
- **Issue:** No environment-based toggle for production mode
- **Risk:** MEDIUM — Stack traces, detailed errors exposed in production
- **Fix:** `DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'`

### 4. No CORS Configuration
- **Issue:** REST API has no CORS headers configured
- **Risk:** MEDIUM — API will reject cross-origin requests from separate frontend
- **Fix:** Install `django-cors-headers`, configure allowed origins

## Technical Debt

### 1. Role-Per-User Architecture (Global Role)
- **Issue:** `User.role` is a single CharField — users can only have one role globally
- **Impact:** Cannot be participant in one hackathon and judge in another
- **Schema design** already fixes this with `user_roles` (per-hackathon roles)
- **Migration:** Will require careful data migration from global to per-hackathon roles

### 2. Empty Django Apps
- **Apps:** `participant`, `organizer`, `judge`, `volunteers`, `super_admin`, `core`
- **Issue:** All have empty `models.py`, single-view `views.py`
- **Impact:** Unnecessary code, confusing app boundaries
- **Plan:** User's schema redesign will restructure into domain apps

### 3. Dual Settings Modules
- **Issue:** `syntra/settings.py` + `project/settings.py` — confusing inheritance
- `manage.py` points to `project.settings` but `syntra/settings.py` has all the real config
- `project/settings.py` imports everything from syntra and just adds `api` app
- **Fix:** Consolidate into single settings module or use clear base/local pattern

### 4. Duplicate STATIC_URL
- **File:** `backend/syntra/settings.py` (lines 148 and 198)
- **Issue:** `STATIC_URL = 'static/'` declared twice
- **Impact:** LOW — second declaration overwrites first, same value

### 5. Legacy Social Auth Comments
- **File:** `backend/syntra/settings.py` (lines 200-219)
- **Issue:** Large commented-out block for `social-auth-app-django` (not used — using `allauth` instead)
- **Impact:** LOW — Confusing, suggests an abandoned integration path

### 6. Inconsistent Tab/Space Usage
- **Files:** `super_admin/views.py`, `organizer/views.py`, `participant/views.py`, `judge/views.py`
- **Issue:** These files use tabs instead of 4-space indentation
- **Impact:** LOW — May cause formatting issues with linters

## Fragile Areas

### 1. UserFlowMiddleware
- **File:** `backend/accounts/middleware.py`
- **Risk:** Every request goes through flow checks — any bug here blocks all users
- Hardcoded `allowed_paths` set could miss new routes
- No tests to catch regressions

### 2. Social Auth Adapter
- **File:** `backend/accounts/adapters.py`
- **Risk:** `pre_social_login()` auto-connects accounts by email — could merge unrelated accounts if email is shared across providers
- Complex `list_apps()` override with settings-vs-DB preference logic

### 3. Profile Data in Session
- **File:** `backend/accounts/views.py` (lines 151-155)
- **Risk:** Phone, organisation, github URL, experience, skills stored in `request.session` but never persisted to a model
- Data loss on session expiry

## Performance Concerns

### 1. SQLite for Production
- **Issue:** SQLite cannot handle concurrent writes, limited scalability
- **Fix:** Switch to PostgreSQL (already planned in user's schema)

### 2. No Database Indexes
- **Issue:** No custom indexes on User model
- **Impact:** LOW at current scale, but will matter with growth

### 3. No Caching
- **Issue:** No caching layer (Redis/Memcached)
- **Impact:** LOW now, needed for production scale

## Missing Production Infrastructure

- No database migration strategy documented
- No deployment configuration (Docker, Gunicorn, etc.)
- No logging configuration beyond Django defaults
- No rate limiting on auth endpoints
- No health check endpoint (beyond `hello_api`)
- No HTTPS enforcement settings
- No `ALLOWED_HOSTS` for production domains
