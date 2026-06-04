---
phase: 2
reviewers: [gemini, antigravity]
reviewed_at: 2026-06-02T20:53:00Z
plans_reviewed: ["02-01-PLAN.md"]
---

# Cross-AI Plan Review — Phase 2 (Cycle 2)

## Gemini Review

### 1. Summary
The revised plan is exceptionally well-thought-out, resolving all major architectural and edge-case concerns highlighted in the previous review cycle. It introduces the split-configuration pattern for Edge compatibility, implements verification for both PBKDF2 and MD5 legacy hashes, and guarantees atomic creation of participant profiles during OAuth login. These additions lower the implementation risk significantly, making the plan complete, robust, and highly production-ready.

### 2. Strengths
*   **Edge Compatibility Resolution:** The separation of `auth.config.ts` and `auth.ts` is the standard and correct approach to prevent Prisma Client loads in Next.js Middleware.
*   **Comprehensive Hashing:** Supporting both `pbkdf2_sha256` and `md5` algorithms guarantees legacy user parity and prevents lockouts.
*   **Transaction Safety:** Automating profile creation inside a Prisma transaction callback (`$transaction`) in NextAuth's `signIn` ensures data integrity for new social sign-ups.
*   **Form Validation:** Adding Zod validation to login/registration forms secures user inputs on the server.

### 3. Concerns
*   **Prisma Client Instance in auth.config.ts (LOW):** Task 3 says: "Query user from accounts_user via Prisma" in `auth.config.ts`. If `auth.config.ts` imports the Prisma client, and `middleware.ts` imports `auth.config.ts`, this could still trigger Edge runtime errors on Prisma loading.
*   **OAuth Transaction Scope (LOW):** In the transaction, `accounts_user.update` updates `role` to `participant`, but does not verify if the user already has a role (e.g. `organizer` or `super_admin`) assigned in the legacy database. We should verify we don't overwrite existing non-null roles.

### 4. Suggestions
*   **Deferred Credentials Lookup:** To guarantee Edge runtime safety, define the Credentials provider credentials verification logic entirely in `auth.ts` rather than `auth.config.ts`. `auth.config.ts` should only contain callbacks/routing checks and empty or OAuth provider configs.
*   **Role Protection in Transaction:** In the `signIn` callback, only assign `role: "participant"` and create a profile if `dbUser.role` is null or empty. Avoid overriding existing roles.

---

## Antigravity Review

### 1. Summary
The plan quality has improved drastically. Splitting `auth.config.ts` and `auth.ts` will keep the middleware edge runtime error-free. Adding MD5 support guarantees compatibility for all legacy accounts.

### 2. Strengths
- The plan explicitly addresses edge runtime limitations and outlines the split-configuration file layout.
- Unit tests and verifications are clearly specified.

### 3. Concerns
- **Credentials Provider location in Split Config (LOW):** NextAuth v5 recommends keeping providers that access databases (like Credentials) out of `auth.config.ts` entirely. Moving the Credentials configuration to `auth.ts` is safer.

### 4. Suggestions
- Place the `Credentials` provider configuration block in `auth.ts` alongside the Prisma database adapter to keep `auth.config.ts` 100% lightweight and Edge-safe.

---

## Consensus Summary

### Agreed Strengths
- **Edge Architecture:** Using the split configuration pattern (`auth.config.ts` and `auth.ts`) satisfies Next.js Edge Middleware compatibility.
- **Data Parity:** Password hashes are verified for both PBKDF2-SHA256 and MD5, and new registrations conform to Django formatting.
- **Transaction Safety:** Auto-profile creation for Google/GitHub sign-ups is handled inside a safe Prisma transaction.

### Agreed Concerns
- **Credentials Provider Separation (LOW):** The Credentials provider performs database lookups and imports crypto/prisma, so it should reside in `auth.ts` rather than `auth.config.ts` to ensure edge safety.
- **OAuth Role Overwrites (LOW):** In the transaction callback, only write the default `participant` role if the user doesn't already have an assigned role in the database.

### Risk Assessment: LOW
**Justification:** The plan now covers all major technical blockers and edge cases. By placing the Credentials provider block in `auth.ts` and ensuring no role overwrite happens during OAuth callback checks, implementation risks are minimized.
