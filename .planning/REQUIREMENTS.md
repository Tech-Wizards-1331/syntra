# Requirements: Syntra (Next.js Migration)

**Defined:** 2026-05-30
**Core Value:** Complete functional parity with the original Django/DRF hackathon management system under a unified, production-ready, type-safe Next.js architecture.

## v1 Requirements

### Authentication & Authorization
- [ ] **AUTH-01**: Users can sign up and log in using email and password. Existing accounts using Django's PBKDF2/MD5 hashes must authenticate successfully without resetting.
- [ ] **AUTH-02**: Users can authenticate using Google or GitHub OAuth.
- [ ] **AUTH-03**: Strict role scoping via Next.js Middleware. A participant cannot access `/organizer/*` or `/admin/*`, and an organizer cannot access `/participant/*` or `/admin/*`.
- [ ] **AUTH-04**: Custom Admin Dashboard under `/admin/*` replacing the default Django Admin panel.

### Profile Management
- [ ] **PROF-01**: Organizers can manage their profiles (Organization Name, website, logo, social links).
- [ ] **PROF-02**: Participants can manage their profiles (Skills, College Name, Semester, Degree, Bio, Resume Link).
- [ ] **PROF-03**: Participants can toggle a "Visibility" switch to allow recruitment by Team Leaders.

### Hackathon & Problem Statements
- [ ] **HACK-01**: Organizers can CRUD hackathons (Name, description, start/end dates, max team size, pricing).
- [ ] **HACK-02**: Organizers can define phases for a hackathon (e.g., Registration, Team Building, Active).
- [ ] **HACK-03**: Organizers can CRUD Problem Statements scoped to their hackathons, with PDF attachment uploads (stored in Cloudinary) and an active toggle.

### Team & Registration
- [ ] **TEAM-01**: Participants can register for a hackathon by creating a team (Team Leader role).
- [ ] **TEAM-02**: Team Leaders can add members as "Guest Records" by filling out their details (Name, Email, Skills, College, Semester, Degree).
- [ ] **TEAM-03**: Team Leaders can search for solo visible participants and invite/recruit them.

### Payments
- [ ] **PAY-01**: Integrates Razorpay checkout workflow for hackathon registration fees.
- [ ] **PAY-02**: Implements secure backend payment verification and webhook handling to mark teams as paid.

### Seating & QR Utility
- [ ] **SEAT-01**: Runs layout-aware greedy seating allocation for hackathons using a custom TypeScript service (ported from [seating.py](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/backend/organizer/services/seating.py)).
- [ ] **QR-01**: Generates unique team QR token and renders it on the participant dashboard.
- [ ] **QR-02**: Creates Scan Categories (e.g., Check-in, Dinner Day 1) per hackathon.
- [ ] **QR-03**: Interactive web-based camera QR scanner view for organizers/coordinators to scan team codes.
- [ ] **QR-04**: Records scans per member, enforcing double-scan prevention and authorization scopes.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01     | Phase 2 | Pending |
| AUTH-02     | Phase 2 | Pending |
| AUTH-03     | Phase 2 | Pending |
| AUTH-04     | Phase 7 | Pending |
| PROF-01     | Phase 4 | Pending |
| PROF-02     | Phase 4 | Pending |
| PROF-03     | Phase 4 | Pending |
| HACK-01     | Phase 5 | Pending |
| HACK-02     | Phase 5 | Pending |
| HACK-03     | Phase 5 | Pending |
| TEAM-01     | Phase 6 | Pending |
| TEAM-02     | Phase 6 | Pending |
| TEAM-03     | Phase 6 | Pending |
| PAY-01      | Phase 3 | Pending |
| PAY-02      | Phase 3 | Pending |
| SEAT-01     | Phase 3 | Pending |
| QR-01       | Phase 6 | Pending |
| QR-02       | Phase 5 | Pending |
| QR-03       | Phase 6 | Pending |
| QR-04       | Phase 6 | Pending |
