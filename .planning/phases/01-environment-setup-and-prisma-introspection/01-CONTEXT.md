# Context: Phase 1 (Environment Setup & Prisma Introspection)

## Decisions

- **ORM Choice**: Prisma ORM will be used. It is type-safe, widely adopted in the Next.js ecosystem, and provides out-of-the-box introspection.
- **Language**: TypeScript (TS) is locked for the entire migration.
- **Database Strategy**: Introspect and preserve the existing database tables (both SQLite locally and Supabase PostgreSQL in production) rather than starting from a clean slate.
- **Layout**: Next.js App Router structure will be set up at the root level of the workspace.

## Context Details

- We are migrating the project to Next.js in-place inside `c:\Users\ansh\OneDrive\Desktop\Ansh\Sem-4\syntra`.
- The existing Django/DRF backend is located in the `backend/` folder and will be preserved for reference until the migration is completed and validated.
- The Tailwind configuration already exists in the root (`tailwind.config.js`). We will merge it with Next.js styling specifications.
