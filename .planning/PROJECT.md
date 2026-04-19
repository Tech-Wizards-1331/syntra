# Syntra Backend

## What This Is

Syntra is a hackathon management system backend built with Django REST Framework. It handles the full lifecycle of hackathon events, serving organizers, participants, judges, and administrators. The platform is currently being extended to support a new `coordinator` role, allowing Sub-Admins to assign Coordinators with scoped permissions per hackathon.

## Core Value

A complete, production-ready Django model layer and API that accurately represents the full hackathon management domain with proper role-based access control and scalable patterns.

## Requirements

### Validated

- ✓ Custom email-based User model
- ✓ Base apps initialized (`accounts`, `organizer`, `judge`, `participant`, `project`, `volunteers`, `super_admin`)
- ✓ Global role assignment for User model
- ✓ API authentication endpoints (Register, Login)

### Active

- [ ] Create `coordinator` Django app
- [ ] Implement Coordinator role models and permissions
- [ ] Extend `organizer` app to support Sub-Admin functionality
- [ ] Implement feature for Sub-Admins to assign Coordinators to specific hackathons
- [ ] Implement scoped permissions for Coordinators per hackathon

### Out of Scope

- Frontend implementation (this is an API-focused backend project)
- Changing the primary custom `User` model auth flow (must keep existing pattern)

## Context

- **Tech Stack:** Django 6.0.3, DRF, Python, SQLite (dev)
- **Architecture:** The project uses a dual settings architecture, modular apps based on domain/role, and a global role system (`participant`, `organizer`, `judge`, `volunteer`, `super_admin`) that needs to be updated or supplemented to handle per-hackathon scoping for coordinators.
- **Constraints:** Strict adherence to the existing `User` model.

## Constraints

- **Auth Model**: Must continue using the existing custom `User` model pattern (email-based, AbstractUser).
- **Tech Stack**: Python and Django 6.0.3 must be used.
- **Role Architecture**: Roles are currently global. Sub-Admin assigning Coordinators implies a need for a per-hackathon association, so the architecture must gracefully handle scoping without breaking the global role setup.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Create separate `coordinator` app | Maintains the existing domain-driven modularity pattern | — Pending |

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
*Last updated: 2026-04-19 after initialization*
