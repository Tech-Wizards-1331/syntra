# Phase 10: Research - Migrate token storage to HttpOnly Cookies with JWT

## Objective
Answer: "What do I need to know to PLAN this phase well?"

## Domain Knowledge & Current Architecture

### Backend (`settings.py` & Auth Setup)
- Currently uses standard `rest_framework_simplejwt.authentication.JWTAuthentication`.
- This authentication class expects tokens in the `Authorization: Bearer <token>` header.
- To use HttpOnly cookies, we need a custom subclass of `JWTAuthentication` that overrides the `authenticate()` method to read the `access` token from the `access_token` cookie.
- We must provide custom endpoints for Login, Refresh, and Logout to set and clear the cookies via `response.set_cookie()` and `response.delete_cookie()`.

### Frontend (`auth_api.js` & Requests)
- `storeTokens()` actively saves tokens to `localStorage`. This must be ripped out.
- The browser will automatically send HttpOnly cookies to the backend.
- However, since we're using DRF and potentially relying on the backend for standard protections, DRF enforces CSRF on session/cookie authenticated endpoints. When we migrate to cookies, we must ensure the frontend extracts the `csrftoken` cookie (which is NOT HttpOnly) and sets it in the `X-CSRFToken` header for all state-changing requests (POST, PUT, DELETE).
- A Fetch interceptor logic must be built to intercept 401s, call the `/api/auth/refresh/` endpoint, and retry the request.

## Security & CSRF Strategy
- `SameSite=Lax` chosen in context decisions: Ensures OAuth flows (Google/GitHub) aren't broken.
- `CSRF_COOKIE_SECURE=True` is already active in production.
- SimpleJWT handles stateless access control. We only use cookies as the transport mechanism, keeping the backend stateless (no Redis lookup per request).

## Architecture Plan
1. **Backend**:
   - Create `syntra/authentication.py` with `CookieJWTAuthentication`.
   - Update `settings.py` to use `syntra.authentication.CookieJWTAuthentication` instead of the default SimpleJWT one.
   - Create custom views `CookieTokenObtainPairView`, `CookieTokenRefreshView`, and `LogoutView`.
   - Wire them up in `urls.py`.

2. **Frontend**:
   - Refactor `auth_api.js` to stop using `localStorage`.
   - Create a central fetch wrapper or generic function to handle attaching the `X-CSRFToken` header and handling the 401 refresh logic.

## Validation Architecture
- **Tests**: Check if logging in returns `Set-Cookie` headers instead of JSON token payload.
- **CSRF**: Ensure `POST` requests without `X-CSRFToken` return `403 Forbidden`.
- **Refresh**: Ensure calling refresh endpoint with a valid refresh cookie returns a new access cookie.

## RESEARCH COMPLETE
