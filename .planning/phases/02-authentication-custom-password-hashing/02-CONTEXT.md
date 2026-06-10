# Phase 2: Authentication & Custom Password Hashing - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild the authentication system using Auth.js (NextAuth) supporting Google, GitHub, and legacy Credentials login. Custom Credentials provider must verify legacy passwords using Django PBKDF2/MD5 hash formatting. Implement strict role scoping via Next.js Middleware. Profile editing and custom admin dashboards are deferred to later phases.

</domain>

<decisions>
## Implementation Decisions

### Role Assignment for Social Sign-ups
- **D-01:** Default all new social sign-ups to the 'Participant' role immediately. Any Organizer accounts must be created or updated manually by a Super Admin.

### Session & JWT Structure
- **D-02:** Embed user ID, email, role, and the corresponding Profile ID (Participant profile ID or Organizer profile ID) directly into the NextAuth session and JWT token. This avoids redundant database lookups in dashboard routes and Server Actions.

### Middleware & Redirection Behavior
- **D-03:** Redirect unauthenticated users attempting to access protected routes to the `/login` route (with a return URL).
- **D-04:** Redirect authenticated users trying to access unauthorized pages to their respective role's dashboard (e.g., redirect a Participant trying to access `/organizer/*` or `/admin/*` to `/participant/dashboard`).

### Legacy Hashing Compatibility
- **D-05:** Verify credentials login passwords against legacy Django hash format: `pbkdf2_sha256$<iterations>$<salt>$<hash>` (or Django MD5 scheme). The verification must happen in a custom Credentials provider using Node.js standard `crypto` algorithms (PBKDF2 SHA256) matching Django's standard hashing scheme.

### the agent's Discretion
- Exact layout and styling details of the login/register forms, keeping it aligned with the premium glassmorphic theme.
- Session expiry duration (standard Auth.js cookie default, i.e., 30 days).
- Custom error messages for failed login attempts.

</decisions>

<specifics>
## Specific Ideas

- Keep login page UI completely consistent with the main page theme: dark mode canvas (`bg-slate-950`), glowing emerald/teal button gradients, and glassmorphic inputs.
- Ensure that if a user has a legacy password, they are not forced to reset it upon their first Next.js login.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### User Database Mapping
- `prisma/schema.prisma` §accounts_user — User roles, Django PBKDF2 passwords, and social logins schema mapping.

### UI Styling Reference
- `app/page.tsx` — Glassmorphism theme and custom styles reference.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Prisma DB connection setup in `prisma/schema.prisma` (and client package).
- Premium design system and Tailwind config variables in `app/globals.css`.

### Established Patterns
- Clean Next.js 15 routing, layout skeleton structure in `app/layout.tsx`.

### Integration Points
- Route protection middleware (`middleware.ts` in root).
- Auth route endpoint (`app/api/auth/[...nextauth]/route.ts` or `auth.ts`).

</code_context>

<deferred>
## Deferred Ideas

- Custom Admin Dashboard `/admin/*` — Deferred to Phase 7.
- Profile editing form logic for Organizers (`/organizer/profile`) and Participants (`/participant/profile`) — Deferred to Phase 4.

</deferred>

---

*Phase: 02-authentication-custom-password-hashing*
*Context gathered: 2026-06-02*
