# Plan: Phase 1 (Environment Setup & Prisma Introspection)

Goal: Initialize a fully functional Next.js development environment, set up Prisma ORM, and pull the existing database models.

---

## Tasks

- [ ] **Task 1: Install Next.js & TypeScript Dependencies**
  - Update `package.json` at the root with standard Next.js dependencies.
  - Install dependencies via npm.
- [ ] **Task 2: Configure TypeScript, Next.js, and Tailwind**
  - Create/verify `tsconfig.json`, `next.config.ts`, `postcss.config.js`.
  - Create the base layout directories (`src/app/` or `app/`) containing `layout.tsx`, `page.tsx`, `globals.css`.
- [ ] **Task 3: Initialize and Configure Prisma ORM**
  - Initialize Prisma using `npx prisma init`.
  - Configure the provider to connect to the active database (PostgreSQL/SQLite).
- [ ] **Task 4: Run Introspection**
  - Point Prisma to the existing SQLite file (`backend/db.sqlite3`) or live PostgreSQL (via `.env`).
  - Run `npx prisma db pull` to introspect the schema.
  - Run `npx prisma generate` to build the client client classes.
- [ ] **Task 5: Compile Verification**
  - Run `npm run build` to verify there are no TypeScript compile-time errors.
