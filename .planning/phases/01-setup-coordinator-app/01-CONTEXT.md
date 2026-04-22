# Phase 1: Setup Coordinator App - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the `coordinator` Django app with its own profile model, task-oriented dashboard API, three-layer permission system, and responsibility-scoped endpoints. The coordinator app provides the coordinator-facing interface — assignment logic stays in the `organizer` app.

</domain>

<decisions>
## Implementation Decisions

### App Structure
- **D-01:** `HackathonCoordinator` model stays in `organizer/models.py` — it represents an assignment made BY organizers. Do not move it.
- **D-02:** New `coordinator` app gets a minimal `CoordinatorProfile` model: `user` (OneToOneField to AUTH_USER_MODEL) + `created_at`. Keep lean, extend later.
- **D-03:** All coordinator-facing views, serializers, permissions, and API URLs live in the `coordinator` app. Follow the existing pattern: `api_views.py`, `api_urls.py`, `api_serializers.py`.

### Dashboard API
- **D-04:** Dashboard is **task-oriented and role-based** — answers "What is my responsibility and what should I focus on?"
- **D-05:** Dashboard endpoint returns: hackathon info (id, title, status) + coordinator's assigned responsibilities + lightweight role-specific summary counts.
- **D-06:** Add a `responsibilities` field to `HackathonCoordinator` (JSON array) to track assigned tasks. Example: `["problem_statements", "teams", "analytics"]`.
- **D-07:** Phase 1 responsibility types: `problem_statements`, `teams`, `analytics`. Extend later as needed.

### Permission Model
- **D-08:** Three-layer permission enforcement:
  1. **Global role check** — `IsCoordinator` permission class verifies `user.role == COORDINATOR`
  2. **Object-level scoping** — `has_object_permission()` verifies a `HackathonCoordinator` assignment exists for the specific hackathon
  3. **Responsibility-aware access** — Check that the coordinator's `responsibilities` includes the relevant area before granting access (e.g., `"problem_statements"` required to hit problem statement endpoints)
- **D-09:** A coordinator assigned to Hackathon A must NOT be able to access or mutate data for Hackathon B.

### Coordinator Capabilities
- **D-10:** Coordinators get **read + limited write** within their responsibility scope:
  - **Problem Manager** (`problem_statements`): Can add/edit problem statements, toggle `is_active`. Cannot delete.
  - **Team Manager** (`teams`): Can view teams and participants. Can remove a participant from a team (moderation). Cannot create/delete teams.
  - **Analytics** (`analytics`): Read-only. View submission counts, team stats, hackathon summary data.

### Agent's Discretion
- Internal implementation details (serializer field choices, URL path naming conventions)
- Exact response format of the dashboard API (JSON structure)
- Whether to use `JSONField` or `ArrayField` for `responsibilities` on `HackathonCoordinator`
- Test structure and organization within the coordinator app

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### User & Role Model
- `backend/accounts/models.py` — Defines the custom `User` model with `Role.COORDINATOR` already present in `TextChoices`

### Organizer Domain (Assignment Model)
- `backend/organizer/models.py` — Contains `HackathonCoordinator` bridge model (user↔hackathon), `Hackathon` model, `OrganizerProfile`, `ProblemStatement`
- `backend/organizer/api_views.py` — Contains `IsOrganizer` permission pattern, `assign_coordinator` action, `HackathonViewSet`, `ProblemStatementViewSet` patterns to follow
- `backend/organizer/api_urls.py` — Router registration and nested URL pattern to replicate
- `backend/organizer/api_serializers.py` — Serializer patterns to follow

### Project Configuration
- `backend/syntra/settings.py` — `INSTALLED_APPS` list, `AUTH_USER_MODEL`, `REST_FRAMEWORK` config, JWT authentication setup
- `backend/syntra/urls.py` — Top-level URL routing where `coordinator` app must be registered
- `backend/api/urls.py` — API URL routing where coordinator API endpoints should be included

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `User.Role.COORDINATOR` — Already defined in `accounts/models.py` TextChoices. No migration needed for the role itself.
- `HackathonCoordinator` model — Already exists in `organizer/models.py` with `user` FK, `hackathon` FK, `unique_together`, and `created_at`. Needs `responsibilities` field added.
- `IsOrganizer` permission class — Template for building `IsCoordinator`. Located in `organizer/api_views.py`.
- `assign_coordinator` action — Already exists on `HackathonViewSet` in `organizer/api_views.py`. Will need updating to support `responsibilities` field.

### Established Patterns
- **App structure:** Each role has its own Django app (`organizer`, `judge`, `participant`, `volunteers`)
- **API file naming:** `api_views.py`, `api_urls.py`, `api_serializers.py` per app
- **Authentication:** JWT via `rest_framework_simplejwt.authentication.JWTAuthentication`
- **URL routing:** DRF `DefaultRouter` for ViewSets, nested routers for sub-resources
- **Profile models:** `OrganizerProfile` pattern — OneToOneField to `AUTH_USER_MODEL`

### Integration Points
- `backend/syntra/settings.py` — Add `'coordinator'` to `INSTALLED_APPS`
- `backend/syntra/urls.py` — Add coordinator URL include
- `backend/api/urls.py` — Add `path('coordinator/', include('coordinator.api_urls'))`
- `backend/organizer/models.py` — Add `responsibilities` JSONField to `HackathonCoordinator`

</code_context>

<specifics>
## Specific Ideas

- Dashboard should answer: "What is my responsibility and what should I focus on?" — not just list hackathons
- Responsibility types map directly to what the coordinator can see and do — they are both a data label AND a permission gate
- Problem Manager example: if coordinator has `"problem_statements"` responsibility, they can add/edit problem statements and toggle `is_active`, but NOT delete
- Team Manager example: can view teams, remove a participant (moderation), but not create/delete teams
- Analytics is inherently read-only — view counts and stats only

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-setup-coordinator-app*
*Context gathered: 2026-04-22*
