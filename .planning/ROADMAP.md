# Roadmap: Syntra Next.js Migration

## Overview
This roadmap details the systematic migration of the Syntra hackathon management system from Django/DRF to a full-stack Next.js (App Router, TypeScript, Prisma, Auth.js) application.

---

## Phases

- [ ] **Phase 1: Environment Setup & Prisma Introspection**
- [ ] **Phase 2: Authentication & Custom Password Hashing**
- [ ] **Phase 3: Seating Service & Razorpay Port**
- [ ] **Phase 4: Profile Management**
- [ ] **Phase 5: Hackathons, Problem Statements & Categories**
- [ ] **Phase 6: Team Registration, QR Code & Scanner UI**
- [ ] **Phase 7: Custom Admin Interface & Middleware**
- [ ] **Phase 8: Verification & Cleanup**

---

## Phase Details

### Phase 1: Environment Setup & Prisma Introspection
*   **Goal**: Initialize the Next.js project and map the database schema from the existing Django database using Prisma ORM.
*   **Depends on**: None
*   **Requirements**: Initial configuration
*   **Success Criteria**:
    1. Next.js app created with TypeScript and TailwindCSS at the root.
    2. Prisma ORM initialized.
    3. Database introspection successfully reads existing tables (`accounts_user`, `organizer_hackathon`, etc.) and generates a clean `schema.prisma`.
    4. Prisma Client generated and connected to database.

### Phase 2: Authentication & Custom Password Hashing
*   **Goal**: Rebuild the authentication system using Auth.js (NextAuth), supporting both Google/GitHub OAuth and email/password login.
*   **Depends on**: Phase 1
*   **Requirements**: AUTH-01, AUTH-02, AUTH-03
*   **Success Criteria**:
    1. Auth.js configured with Google & GitHub providers.
    2. Custom Credentials provider verifies passwords using Django's PBKDF2/MD5 hashing.
    3. User session stores roles (`organizer`, `participant`, `super_admin`) and profile IDs.

### Phase 3: Seating Service & Razorpay Port
*   **Goal**: Port the backend services (seating allocation algorithm and Razorpay integration) to Node.js / TypeScript.
*   **Depends on**: Phase 1, Phase 2
*   **Requirements**: SEAT-01, PAY-01, PAY-02
*   **Success Criteria**:
    1. Seating allocation algorithm ported line-by-line from Python to TS, verified with unit tests.
    2. Razorpay service instantiated and payment verification/webhook endpoint `/api/payment/webhook` functional.

### Phase 4: Profile Management
*   **Goal**: Rebuild profile creation and editing forms for organizers and participants.
*   **Depends on**: Phase 2
*   **Requirements**: PROF-01, PROF-02, PROF-03
*   **Success Criteria**:
    1. Organizer profile page `/organizer/profile` lets users update organization name, website, and logo.
    2. Participant profile page `/participant/profile` lets users update college, semester, skills, bio, and toggle visibility.

### Phase 5: Hackathons, Problem Statements & Categories
*   **Goal**: Rebuild the core organizer management views.
*   **Depends on**: Phase 3, Phase 4
*   **Requirements**: HACK-01, HACK-02, HACK-03, QR-02
*   **Success Criteria**:
    1. Organizers can CRUD hackathons via server actions.
    2. Organizers can CRUD Problem Statements with PDF attachment uploads (saved to Cloudinary).
    3. Organizers can configure Scan Categories and Room Layout configurations.

### Phase 6: Team Registration, QR Code & Scanner UI
*   **Goal**: Rebuild participant team registration, QR display, and scanner check-ins.
*   **Depends on**: Phase 5
*   **Requirements**: TEAM-01, TEAM-02, TEAM-03, QR-01, QR-03, QR-04
*   **Success Criteria**:
    1. Participants can register for a hackathon, create a team, and fill out teammate guest records.
    2. Registered teams see their unique QR code displayed on `/participant/dashboard`.
    3. Organizers/Coordinators can access the camera-based QR scanner page `/organizer/scan` to scan codes.
    4. Successful scans mark participants as checked in and record logs.

### Phase 7: Custom Admin Interface & Middleware
*   **Goal**: Secure routes and build the system administration views.
*   **Depends on**: Phase 6
*   **Requirements**: AUTH-03, AUTH-04
*   **Success Criteria**:
    1. Route middleware protects `/admin/*`, `/organizer/*`, and `/participant/*` based on user session roles.
    2. Super admins can manage users, assign coordinators, and view logs via `/admin`.

### Phase 8: Verification & Cleanup
*   **Goal**: Thoroughly test the entire Next.js system and decommission the Django code.
*   **Depends on**: Phase 7
*   **Requirements**: Final Verification
*   **Success Criteria**:
    1. End-to-end user flows validated (signup -> login -> profile setup -> register team -> pay Razorpay -> allocate seating -> scan QR).
    2. Django directories (`backend/`, `requirements.txt`, etc.) decommissioned.
