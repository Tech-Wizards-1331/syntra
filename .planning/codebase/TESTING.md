# Testing Strategy: Django to Next.js

## Legacy Django Testing
*   **Framework:** Built-in `django.test` suite.
*   **State:** Minimal coverage primarily focused on functional verification inside individual Django apps (`accounts`, `organizer`, `participant`).

---

## Target Next.js Testing Setup
For the migrated Next.js application, testing is divided into two primary categories:

### 1. Unit Testing (Critical for Services)
*   **Framework:** **Vitest** or **Jest** (configured with TypeScript support).
*   **Focus Area:** Ported services, most notably the greedy seating allocation algorithm (`/lib/services/seating.ts`).
*   **Goal:** Ensure 100% logical parity with the original Python seating algorithm. We will write comprehensive unit tests covering all layout configurations and boundary conditions.

### 2. Manual & Automated UAT (End-to-End Validation)
*   **Focus Area:** Core user flows (user registration $\rightarrow$ team generation $\rightarrow$ payment webhook processing $\rightarrow$ QR generation $\rightarrow$ scan check-in).
*   **Verification:** Verified during Phase 8 using custom test scripts or E2E frameworks (like Playwright/Cypress) to simulate user actions across the custom admin, organizer, and participant interfaces.

