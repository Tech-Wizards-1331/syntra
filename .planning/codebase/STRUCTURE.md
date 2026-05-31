# Project Structure: Transition to Next.js

## Directory Layout

### Legacy Django Project (`/backend` & `/frontend`)
- **`backend/`**: Django backend codebase
  - `syntra/`: Django project configuration & entry points.
  - `accounts/`: User model & auth logic.
  - `organizer/`: Organizer services (seating, CRUD).
  - `participant/`: Participant registration & QR services.
- **`frontend/`**: Legacy asset pipeline & Django MVT templates
  - `templates/`: Django HTML templates.
  - `static/`: Frontend assets (CSS, JS).

---

### New Next.js Full-Stack App (Root `/`)
During Phase 1, the new Next.js structure is initialized in the workspace:
- **`app/`**: Next.js App Router folders defining routes, layouts, and pages (e.g., `/admin`, `/organizer`, `/participant`, `/api/auth`).
- **`components/`**: Shared, reusable UI components.
- **`lib/`**: Business logic, database client instance, and ported services (e.g., `seating-service.ts`, `razorpay.ts`).
- **`prisma/`**: Contains `schema.prisma` mapping active database models and migration definitions.
- **`public/`**: Static assets for Next.js.
- **`package.json`**: Node dependencies, scripts (`dev`, `build`, `start`).
- **`.env`**: Combined environment variables for Next.js, Prisma, and external APIs.

