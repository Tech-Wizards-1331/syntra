# Syntra (Next.js Full-Stack Migration)

## What This Is

Syntra is a hackathon management system designed to streamline the lifecycle of hackathon events. It serves Organizers in setting up and managing events, and Participants (both Team Leaders and Solo Participants) in forming teams and managing their hackathon experience. The system includes physical-world utility features like QR-based attendance and food token management.

This project is a **complete full-stack migration** of the original Django/DRF codebase into **Next.js** using the App Router, Prisma ORM, Auth.js (NextAuth), TypeScript, and TailwindCSS.

## Core Value

Migrate Syntra from Django/DRF to a unified, production-ready, type-safe full-stack Next.js application while maintaining complete database and feature parity.

## Requirements

### Validated
- [ ] Database introspection successfully mapping all original tables to a unified Prisma Schema.

### Active
- [ ] **Auth Parity**: Implement Auth.js with Google, GitHub, and email/password login. Maintain support for original Django password hashing (PBKDF2/MD5) for existing user accounts.
- [ ] **Role Scoping**: Enforce separate layouts and access controls for Super Admins, Organizers, and Participants.
- [ ] **Profile Management**: Complete React form logic for Organizer and Participant profiles.
- [ ] **Hackathon & Registration**: Rebuild hackathon CRUD pages, registration, and team/guest teammate management.
- [ ] **Seating Service Port**: Port the greedy seating allocation search algorithm from [seating.py](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/backend/organizer/services/seating.py) to TypeScript.
- [ ] **Razorpay Checkout**: Port Payment Service and checkout flow to Node.js / Next.js.
- [ ] **QR Check-in & Scanner**: Rebuild team QR generation, Scan Categories, and scanning API with real-time logs.
- [ ] **Admin Dashboard**: Create a custom Next.js admin view to replace Django Admin.

### Out of Scope
- Re-architecting the database tables (we will keep the existing table layout to preserve user data).
- Real-time chat (handled via external services like Discord).

## Context
- Rebuilding the app inside the same workspace by initializing a Next.js application at the root or within subdirectories, then decommissioning the Python backend once verification passes.
- Database tables already exist in PostgreSQL (Supabase) and SQLite local.
- Prisma ORM will be used to generate client code from database schema.

## Constraints
- **Database Engine**: PostgreSQL/SQLite.
- **ORM**: Prisma.
- **Language**: TypeScript.
- **Styling**: TailwindCSS.
- **Auth**: Auth.js (NextAuth) using Cookie sessions.

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Introspect DB | Automatically generates Prisma schemas from existing tables, avoiding manual table-mapping errors. | Active |
| Custom Password Verifier | Necessary to verify Django's custom PBKDF2/MD5 hash formatting in Auth.js Credentials provider. | Active |
| TypeScript Port of Seating Service | Preserves the tested greedy layout-aware seating assignment logic while converting it to a modern TS implementation. | Active |
| Admin Interface | A dedicated admin route `/admin` will be created in Next.js since the Django Admin panel will no longer be available. | Active |

## Evolution
This document is updated at phase boundaries using `/gsd-transition`.
