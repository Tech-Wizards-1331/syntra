---
wave: 1
depends_on: []
files_modified:
  - backend/syntra/settings.py
  - backend/syntra/urls.py
  - backend/accounts/views.py
  - backend/accounts/urls.py
  - backend/accounts/authentication.py
  - frontend/static/js/auth_api.js
  - frontend/static/js/api_client.js
autonomous: true
---

# Phase 10: Migrate token storage to HttpOnly Cookies with JWT

## Verification Criteria
- [ ] Login returns `Set-Cookie` for `access` and `refresh` instead of a JSON token payload.
- [ ] Protected endpoints accept the `access` cookie.
- [ ] Mutating endpoints (POST/PUT/DELETE) require a valid `X-CSRFToken` header.
- [ ] Logout endpoint clears cookies.
- [ ] Frontend code no longer references `localStorage.setItem('access_token', ...)` for authentication.
- [ ] Frontend successfully handles a 401 Unauthorized by calling the refresh endpoint and retrying the request.

## must_haves
- Custom JWTAuthentication class to read from cookies.
- Custom login/refresh/logout views setting/deleting HttpOnly cookies.
- Frontend API client capable of CSRF token extraction and 401 interceptor logic.

---

## Task 1: Create Custom JWT Authentication Class
<task>
<read_first>
- backend/syntra/settings.py
</read_first>
<action>
Create a new file `backend/accounts/authentication.py`.
Implement a class `CookieJWTAuthentication` that inherits from `rest_framework_simplejwt.authentication.JWTAuthentication`.
Override the `authenticate(self, request)` method to extract the access token from `request.COOKIES.get('access')`. If found, process it. Otherwise, fallback to the default header-based check (or simply return None if missing).

Update `backend/syntra/settings.py` `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES` to use `accounts.authentication.CookieJWTAuthentication` instead of `rest_framework_simplejwt.authentication.JWTAuthentication`.
</action>
<acceptance_criteria>
- `backend/accounts/authentication.py` contains `class CookieJWTAuthentication(JWTAuthentication):`
- `settings.py` references `accounts.authentication.CookieJWTAuthentication`
</acceptance_criteria>
</task>

---

## Task 2: Create Cookie-Based Auth Views
<task>
<read_first>
- backend/accounts/views.py
- backend/accounts/urls.py
- backend/syntra/urls.py
</read_first>
<action>
In `backend/accounts/views.py`:
1. Create `CookieTokenObtainPairView` inheriting from `TokenObtainPairView`. Override `post()` to call `super().post()`, then extract the `access` and `refresh` tokens from the response data. Set them as HttpOnly cookies (`samesite='Lax'`, `secure=not settings.DEBUG`, `httponly=True`). Remove the tokens from the JSON response body.
2. Create `CookieTokenRefreshView` inheriting from `TokenRefreshView`. Override `post()` to extract the `refresh` token from `request.COOKIES.get('refresh')`, inject it into the request data, call `super().post()`, and set the new `access` token as an HttpOnly cookie.
3. Create `LogoutView` (APIView) that returns a 200 OK but calls `response.delete_cookie('access')` and `response.delete_cookie('refresh')`.

In `backend/accounts/urls.py` (or create if missing, and wire in `syntra/urls.py`):
Add routes for `/api/auth/login/`, `/api/auth/refresh/`, and `/api/auth/logout/` pointing to these new views.
</action>
<acceptance_criteria>
- `backend/accounts/views.py` contains `CookieTokenObtainPairView`, `CookieTokenRefreshView`, and `LogoutView`.
- These views call `response.set_cookie` and `response.delete_cookie` with `httponly=True`.
</acceptance_criteria>
</task>

---

## Task 3: Refactor Frontend Auth API and CSRF Handling
<task>
<read_first>
- frontend/static/js/auth_api.js
</read_first>
<action>
Modify `frontend/static/js/auth_api.js`:
1. Remove the `storeTokens(payload)` function and any calls to `localStorage.setItem('access_token', ...)` or `localStorage.getItem`.
2. Ensure `handleLoginSuccess` still works with the new JSON payload (which will no longer contain tokens).
3. Create a new utility script `frontend/static/js/api_client.js` (or add to `auth_api.js`) that provides a generic `fetchWithAuth(url, options)` function.
4. In `fetchWithAuth`:
   - Extract the CSRF token from the `csrftoken` cookie using `document.cookie`.
   - Attach `X-CSRFToken` to the request headers.
   - Execute the fetch.
   - If the response is `401 Unauthorized`:
     - Pause, call `/api/auth/refresh/` via POST.
     - If successful, retry the original fetch.
     - If the refresh fails, redirect the user to `/accounts/login/`.
5. Update the logout logic in the UI to call `/api/auth/logout/` instead of just clearing `localStorage`, then redirect to login.
</action>
<acceptance_criteria>
- `frontend/static/js/auth_api.js` does NOT contain `localStorage.setItem('access_token'`.
- Frontend code includes logic to read `csrftoken` from `document.cookie` and pass it as `X-CSRFToken`.
</acceptance_criteria>
</task>
