# Phase 10 Context: Migrate token storage to HttpOnly Cookies with JWT

## Decisions
- **Cookie Configuration & CSRF**: Use `SameSite=Lax` for the HttpOnly auth cookies. Rely on Django's default `csrftoken` cookie to attach the `X-CSRFToken` header in API calls to maintain security while allowing OAuth redirects.
- **Token Refresh Mechanism**: Implement a Fetch/Axios interceptor that catches `401 Unauthorized` responses, calls the backend refresh endpoint (using the HttpOnly refresh cookie), and retries the original request.
- **Logout Flow**: The frontend will call a new backend `/api/auth/logout/` endpoint to instruct the browser to delete the HttpOnly cookies, followed by a hard page redirect to `/accounts/login/` to wipe all local JS state.

## Specifics
- No specific visual UX patterns were defined, as this is primarily an architectural migration under the hood.
- Ensure the existing `auth_api.js` is thoroughly refactored to remove all `localStorage` access for tokens.

## Canonical References
- .planning/ROADMAP.md
- C:\Users\ansh\.gemini\antigravity\brain\eaea25af-8325-4678-bb4a-ecafba1d68a7\migration_impact_analysis.md

## Deferred
- None identified during this discussion.
