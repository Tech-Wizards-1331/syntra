# Syntra

## What This Is

Syntra is a hackathon management system designed to streamline the lifecycle of hackathon events. It serves Organizers in setting up and managing events, and Participants (both Team Leaders and Solo Participants) in forming teams and managing their hackathon experience. The system includes physical-world utility features like QR-based attendance and food token management.

## Core Value

Streamlined hackathon management with robust role scoping and integrated physical-world utility (QR attendance) to enhance the organizer and participant experience.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Role-Based Access Control**: Implement Super Admin, Organizer, and Participant (Team Leader/Solo) roles with strictly separate identities.
- [ ] **Profile Management**: Separate profile tables for Organizers (company info, etc.) and Participants (email, skills, college name, semester, degree, resume, etc.).
- [ ] **Hackathon Management**: Organizers can create hackathons and set distinct phases (topic selection, registration, active, etc.).
- [ ] **Team Management**: Team Leaders can create teams and add teammates as "Guest Records" with their info (email, skills, college name, semester, degree).
- [ ] **Solo Participant Visibility**: Solo participants can set skills and apply to be visible to Team Leaders for recruitment.
- [ ] **Team Search**: Feature for Team Leaders/Solo Participants to find each other.
- [ ] **QR Utility**: Generation of team-based QR codes for attendance and food token management.

### Out of Scope

- **Coordinator Role** — Deferred to a later phase to focus on core MVP roles.
- **Judge Role** — Deferred to a later phase; judging will be handled by Organizers/Admins in v1.
- **Project Submissions** — Deferred to a later phase to prioritize registration and on-site utility.
- **Judging System** — Deferred to a later phase.

## Context

- Building on an existing Django/DRF codebase (Syntra Backend).
- The user prefers a shared `User` model for authentication with separate `Profile` tables for specific role data.
- Teammates are handled as "guest records" within a team to simplify registration, with QR codes being team-based rather than individual-based.

## Constraints

- **Auth Model**: Must continue using the existing custom `User` model pattern (email-based, AbstractUser).
- **Tech Stack**: Python and Django 6.0.3 must be used.
- **Identity**: Strictly separate identities for roles (a user cannot be both an Organizer and a Participant).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Shared User + Profiles | Balances Django best practices with the need for distinct role-specific data fields. | — Pending |
| Strictly Separate Identities | Simplifies permission logic and aligns with the user's business model for v1. | — Pending |
| Team-based QR Codes | Simplifies on-site management by treating the team as the unit of attendance. | — Pending |
| Guest Record Teammates | Reduces friction for team registration as only the Team Leader needs a full account. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-28 after initialization*
