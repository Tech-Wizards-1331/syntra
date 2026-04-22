# Requirements

## v1 Requirements

### Coordinator App (COORD)
- [ ] **COORD-01**: User can create the `coordinator` Django application and hook it into the project settings/routing.
- [ ] **COORD-02**: System recognizes a global `coordinator` role or per-hackathon coordinator assignment for the User model.
- [ ] **COORD-03**: Coordinator dashboard exists and can be accessed securely by assigned users.

### Organizer App Extensions (ORG)
- [ ] **ORG-01**: Sub-Admins can assign users as Coordinators for a specific hackathon.
- [ ] **ORG-02**: System enforces scoped permissions preventing a Coordinator assigned to Hackathon A from managing Hackathon B.
- [ ] **ORG-03**: Sub-Admins have a UI to manage/assign Coordinators within the Organizer dashboard.

## v2 Requirements
- Custom analytics and detailed event logs for Coordinator activities
- Email invitations for Coordinator assignments

## Out of Scope
- Modifying the existing primary `User` model auth flow
- Changing the overall web frontend design language (this is an API/backend phase)

## Traceability
*(To be updated by roadmap)*
