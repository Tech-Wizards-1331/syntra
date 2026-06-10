# Research: Phase 1 (Environment Setup & Prisma Introspection)

## Environment Requirements

To initialize a production-ready full-stack Next.js project with TypeScript, TailwindCSS, and Prisma ORM, we need the following dependencies:

### Core Dependencies:
*   `next` (v15+)
*   `react` (v19+)
*   `react-dom` (v19+)
*   `@prisma/client`
*   `lucide-react` (icons)

### Dev Dependencies:
*   `typescript`
*   `tailwindcss`
*   `postcss`
*   `autoprefixer`
*   `prisma`
*   `@types/node`
*   `@types/react`
*   `@types/react-dom`

---

## Existing Database Assessment

The original Django project utilizes a SQLite database locally (`db.sqlite3`) and connects to Supabase PostgreSQL in production via the `DATABASE_URL` environment variable.
We can check the database settings in [settings.py](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/backend/syntra/settings.py#L220-L236).

### Database Configuration:
*   **Database type**: SQLite (dev) / PostgreSQL (prod).
*   For Prisma to introspect the database successfully, we will configure the Prisma datasource to point to our active database engine (PostgreSQL or SQLite). Since we are running locally and have a SQLite database file `backend/db.sqlite3`, we can first run introspection against this local SQLite database, or connect to the live PostgreSQL database if `DATABASE_URL` is set in `.env`.
*   Let's check if `backend/db.sqlite3` is accessible and contains tables.
