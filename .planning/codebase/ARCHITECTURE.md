# Architecture: Django to Next.js Migration

## Legacy Django Architecture
The original codebase follows a hybrid Django pattern that is being phased out:
- **Traditional MVT:** Legacy server-rendered templates via `frontend/templates/`.
- **RESTful API:** Django REST Framework APIs used for decoupled features.
- **Key Django Apps:**
  - `accounts`: User authentication, profiles, and roles.
  - `organizer`: Hackathon CRUD, problem statements, seating service, and scanning configuration.
  - `participant`: Team registration, team dashboards, guest records, and QR code generation.

---

## Target Next.js Architecture
The migration moves the platform to a single unified full-stack **Next.js (App Router)** application:
- **Routing & Rendering:** Next.js App Router with React Server Components (RSC) for performance and Server Actions for data mutations.
- **Authentication & Security:** Auth.js (NextAuth) replacing the hybrid Django session/JWT system, with a custom Credentials Provider to handle legacy Django password hashing (PBKDF2/MD5).
- **Database Access:** Prisma ORM directly mapping and querying the existing database tables, preserving all live user/hackathon data without structural schema changes.
- **Services Port:** Complete TypeScript port of backend services (e.g. greedy seating allocation algorithm and Razorpay payment integration).

