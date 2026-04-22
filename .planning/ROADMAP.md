# Roadmap

## Phase 1: Setup Coordinator App
**Goal:** Initialize the new coordinator Django app with its basic models, views, and routing.
**Requirements:** [COORD-01, COORD-02, COORD-03]
**Success Criteria:**
1. `coordinator` app is listed in `INSTALLED_APPS` and builds successfully.
2. The system correctly identifies Coordinator role models and permissions.
3. A basic coordinator dashboard endpoint returns an HTTP 200 response when authenticated as a Coordinator.

## Phase 2: Organizer Scoped Assignments
**Goal:** Enable Sub-Admins in the organizer app to securely scope and assign coordinators to specific hackathons.
**Requirements:** [ORG-01, ORG-02, ORG-03]
**UI hint:** yes
**Success Criteria:**
1. The database layer reflects a structural relationship mapping users as Coordinators to specific hackathons.
2. An API endpoint exists where a Sub-Admin can query, assign, or remove a Coordinator from a specific hackathon.
3. Access controls explicitly block a Coordinator of Hackathon A from accessing or mutating data for Hackathon B.
