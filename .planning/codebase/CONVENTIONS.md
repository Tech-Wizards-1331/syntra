# Coding Conventions: Next.js & TypeScript

## Code Style & Language
*   **TypeScript:** Strict typing must be enforced. Do not use `any` unless absolutely necessary, and prefer explicit return types for service functions.
*   **Next.js App Router:** Follow folder-based routing standards in `/app` (e.g. `layout.tsx`, `page.tsx`, `error.tsx`).
*   **React Components:** Functional components using TailwindCSS for styling. Maintain high responsiveness and clean UI patterns.

## Application Boundaries
*   Keep business and domain logic inside `/lib/services/` (e.g., seating, payments, user services).
*   Enforce a clear separation of routing layouts:
    *   `/app/admin/*` (Super Admins)
    *   `/app/organizer/*` (Organizers and Coordinators)
    *   `/app/participant/*` (Participants and Team Leaders)

## Database & Models
*   Do not perform manual migrations that modify database structure. The schema is defined by Prisma introspection from the live database.
*   Use Prisma Client singleton pattern (`/lib/db.ts`) to avoid establishing too many concurrent connections to the database.

## Security
*   Strict role access control via Next.js Middleware.
*   Secure cookies for session storage via Auth.js.
*   Proper sanitization of all user-uploaded files and secure verification of payment webhooks.

