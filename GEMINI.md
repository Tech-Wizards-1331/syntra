<!-- GSD:project-start source:PROJECT.md -->
## Project

**Syntra (Next.js Full-Stack Migration)**

Syntra is a hackathon management system designed to streamline the lifecycle of hackathon events. It serves Organizers in setting up and managing events, and Participants in forming teams and managing their hackathon experience. The platform includes physical-world utility features like QR-based attendance and food token management.

This project is a **complete full-stack migration** of the original Django/DRF codebase into **Next.js** using the App Router, Prisma ORM, Auth.js (NextAuth), TypeScript, and TailwindCSS.

**Core Value:** Migrate Syntra from Django/DRF to a unified, production-ready, type-safe full-stack Next.js application while maintaining complete database and feature parity.

### Constraints

- **Auth Model**: Auth.js (NextAuth) using Cookie sessions. Custom Credentials provider must verify passwords using legacy Django PBKDF2/MD5 hash formatting.
- **Tech Stack**: Next.js (App Router), TypeScript, Prisma ORM, TailwindCSS.
- **Role Architecture**: Separate layouts and strict middleware access control for Super Admins, Organizers, and Participants.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

*   **Full-Stack Framework:** Next.js 15+ (App Router, TypeScript)
*   **Database Client / ORM:** Prisma ORM (for schema introspection and type-safe query execution)
*   **Authentication:** Auth.js (NextAuth) supporting Google, GitHub, and legacy Credential authentication (PBKDF2/MD5 hashed passwords).
*   **Styling & UI:** TailwindCSS & Vanilla CSS.
*   **Deployment & Infrastructure:** Render.com (via `render.yaml`) / Vercel.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

- **TypeScript:** Strict type safety, clean interface definitions, no implicit `any`.
- **App Router Layouts:** Separate layout structures for `/admin`, `/organizer`, and `/participant`.
- **Database Mapping:** Keep database tables exactly as mapped by Prisma introspection to prevent breaking legacy live systems.
- **Styling:** Use TailwindCSS for consistent responsive utility styling.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- **Routing & Rendering:** Next.js App Router with React Server Components (RSC) for performance and Server Actions for data mutations.
- **Authentication & Security:** Auth.js (NextAuth) replacing the hybrid Django session/JWT system, with a custom Credentials Provider to handle legacy Django password hashing (PBKDF2/MD5).
- **Database Access:** Prisma ORM directly mapping and querying the existing database tables, preserving all live user/hackathon data without structural schema changes.
- **Services Port:** Complete TypeScript port of backend services (e.g. greedy seating allocation algorithm and Razorpay payment integration).
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
