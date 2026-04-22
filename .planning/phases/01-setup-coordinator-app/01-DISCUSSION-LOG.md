# Phase 1: Setup Coordinator App - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 01-setup-coordinator-app
**Areas discussed:** Coordinator app scope, Dashboard API design, Permission model, Coordinator capabilities

---

## Coordinator App Scope

### Q1: How should we structure the new coordinator app relative to what already exists?

| Option | Description | Selected |
|--------|-------------|----------|
| Move model | Move `HackathonCoordinator` into the new `coordinator` app and import it back in organizer | |
| Keep model in organizer, add profile in coordinator | `HackathonCoordinator` stays in organizer (assignment made BY organizers). New `coordinator` app gets `CoordinatorProfile` and coordinator-facing views/APIs only | ✓ |
| You decide | Let the agent pick the cleanest approach | |

**User's choice:** Keep model in organizer, add profile in coordinator
**Notes:** Follows separation of concerns — organizer owns assignment, coordinator owns its own profile and views.

### Q2: What should CoordinatorProfile contain?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | Just `user` (OneToOne FK) and `created_at`. Keep lean, extend later | ✓ |
| Light metadata | `user`, `phone_number`, `bio/about`, `created_at`. Basic info | |
| You decide | Agent picks based on other profile patterns | |

**User's choice:** Minimal
**Notes:** Extend later as needed.

---

## Dashboard API Design

### Q3: What should the coordinator dashboard endpoint return?

| Option | Description | Selected |
|--------|-------------|----------|
| Just assigned hackathons | List of hackathons with basic info (name, status, dates) | |
| Hackathons + summary stats | Assigned hackathons plus lightweight counts (team count, participant count) | |
| Custom approach | Task-oriented, role-based dashboard | ✓ |

**User's choice:** Custom approach — task-oriented and role-based dashboard
**Notes:** Dashboard should answer "What is my responsibility and what should I focus on?" Returns hackathon info + coordinator's assigned roles/responsibilities + role-specific summary counts. Coordinator is not managing multiple hackathons at a high level but is responsible for specific tasks within a hackathon.

### Q4: How should coordinator responsibilities be stored?

| Option | Description | Selected |
|--------|-------------|----------|
| Choices field on HackathonCoordinator | Add `responsibilities` field (JSON array) to existing `HackathonCoordinator` model | ✓ |
| Separate responsibility model | New `CoordinatorResponsibility` model with FK. More normalized | |
| You decide | Agent picks best fit | |

**User's choice:** Choices field on HackathonCoordinator
**Notes:** JSON array — simpler, keeps it on the existing model.

### Q5: What responsibility types should exist in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Core three | `problem_statements`, `teams`, `analytics` | ✓ |
| Broader set | Add `participants`, `judging`, `volunteers` to the above | |
| You decide | Agent picks based on existing models | |

**User's choice:** Core three — `problem_statements`, `teams`, `analytics`
**Notes:** Can extend later.

---

## Permission Model

### Q6: How should coordinator permissions be enforced?

| Option | Description | Selected |
|--------|-------------|----------|
| Role check + queryset filtering | `IsCoordinator` checks role, ViewSet `get_queryset()` filters by assignment | |
| Role check + object-level permissions | `IsCoordinator` checks role, `has_object_permission()` verifies hackathon assignment | |
| Responsibility-aware permissions | Also check `responsibilities` field for area-specific access | |
| Hybrid (2 + 3) | Three-layer: global role → object-level hackathon scoping → responsibility-aware access | ✓ |

**User's choice:** Hybrid approach combining object-level scoping AND responsibility-aware access control
**Notes:** Three layers: (1) `IsCoordinator` role gate, (2) `has_object_permission()` to ensure hackathon assignment exists, (3) responsibility check to verify coordinator has the relevant area in their `responsibilities`. Ensures hackathon-level isolation + fine-grained access + scalability.

---

## Coordinator Capabilities

### Q7: What actions should coordinators have in Phase 1?

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only | View assigned hackathons and scoped data. No writes | |
| Read + limited write | View everything in scope AND perform basic actions within responsibilities | ✓ |
| Full CRUD within scope | Full create/read/update/delete on resources within responsibilities | |

**User's choice:** Read + limited write
**Notes:** Confirmed per-responsibility breakdown:
- Problem Manager: add/edit problem statements, toggle `is_active`, no delete
- Team Manager: view teams/participants, remove participant (moderation), no create/delete teams
- Analytics: read-only (view counts, stats)

---

## Agent's Discretion

- Internal implementation details (serializer fields, URL path naming)
- Exact JSON response format of the dashboard API
- Whether `JSONField` or `ArrayField` for responsibilities
- Test structure and organization

## Deferred Ideas

None — discussion stayed within phase scope
