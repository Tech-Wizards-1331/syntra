# Technology Stack: Django to Next.js

## Legacy Django/DRF Stack
*   **Backend Framework:** Django 6.0.3 (Python 3.12.3)
*   **REST APIs:** Django REST Framework 3.16.1
*   **Database:** PostgreSQL (Supabase production), SQLite (local development)
*   **Authentication:** `django-allauth` (Google/GitHub OAuth) & `djangorestframework-simplejwt` (JWT for APIs)
*   **Templating & Serving:** Django Templates with WhiteNoise 6.12.0 for static asset compression.

---

## Target Next.js Stack
*   **Full-Stack Framework:** Next.js 15+ (App Router, TypeScript)
*   **Database Client / ORM:** Prisma ORM (for schema introspection and type-safe query execution)
*   **Authentication:** Auth.js (NextAuth) supporting Google, GitHub, and legacy Credential authentication (PBKDF2/MD5 hashed passwords).
*   **Styling & UI:** TailwindCSS & Vanilla CSS.
*   **Deployment & Infrastructure:** Render.com (via `render.yaml`) / Vercel.

