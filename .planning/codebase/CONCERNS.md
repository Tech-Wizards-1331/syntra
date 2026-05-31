# Key Migration Concerns & Risks

## Active Transition Challenges
*   **Authentication Parity:** We must verify legacy Django-hashed passwords (using PBKDF2/MD5) directly inside Auth.js (NextAuth) Credentials Provider. Failure to do so will lock out existing users.
*   **Database Schema Preservation:** Since we are using Prisma Introspection to read the Supabase/PostgreSQL schema, we must prevent any accidental schema mutations that would break existing live services.
*   **Algorithm Fidelity:** The greedy seating allocation algorithm must be ported exactly to TypeScript with 100% logic and test parity to prevent errors during live events.
*   **Payment Webhooks:** Razorpay webhooks and state transition signatures must be verified and matched against legacy webhook endpoint handling.

## Deployment Strategy
*   **Co-existence:** During the development phase, Django and Next.js co-exist in the workspace.
*   **Clean Decommissioning:** Decommissioning Django (`backend/`, `frontend/`, `requirements.txt`, etc.) should only occur in the final phase (Phase 8) after end-to-end user testing.

