# Phase 3: Coordinator Login and Signup - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

The authentication and onboarding flow for the `coordinator` role. This includes handling how coordinators join the platform, their initial registration process, and ensuring they have the correct profile type upon joining.

</domain>

<decisions>
## Implementation Decisions

### Signup Approach
- **Invite-Only Registration:** Coordinators cannot sign up organically. The `Coordinator` role will remain hidden from the public role selection UI (`select_role.html` and `RoleSelectionForm`).
- A user only becomes a Coordinator when an Organizer assigns them to a hackathon.

### Invitation Flow
- **Invite Links:** When an Organizer assigns an email address that does not exist in the system, the system will send an email with a secure, expiring invite link.
- The user must click this link to set their own password and finalize their account creation as a Coordinator.
- Existing users (if assigned) would presumably just get a notification, but new users get the invite registration flow.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### User & Auth Models
- `backend/accounts/models.py` — Defines the custom `User` model, role choices, and `CoordinatorProfile` logic.
- `backend/accounts/forms.py` — Contains existing signup and role selection forms.
- `backend/accounts/urls.py` — Current authentication routing.

### Organizer Assignment
- `backend/organizer/api_views.py` — Contains `assign_coordinator` action where the invite trigger should likely happen.

</canonical_refs>

<code_context>
## Existing Code Insights

- `User.Role.COORDINATOR` is defined in the backend but appropriately omitted from `RoleSelectionForm.ROLE_OPTIONS` in the frontend forms, which aligns with the decision to keep it invite-only.
- The `assign_coordinator` endpoint in Phase 2 currently assumes it can assign an email. If the email doesn't exist, it currently might fail or need an update to handle the creation of the invite token and email dispatch.

</code_context>

<specifics>
## Specific Ideas

- The invite link should contain a secure token (e.g., using Django's `PasswordResetTokenGenerator` or a custom signing token).
- The frontend will need a new view/page (e.g., "Accept Invitation") where the user can enter their name and password to finalize the account.

</specifics>

<deferred>
## Deferred Ideas

- None. Discussion remained strictly within the scope of coordinator onboarding.

</deferred>
