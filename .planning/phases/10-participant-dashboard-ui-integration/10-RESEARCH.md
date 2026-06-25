# Phase 10: Participant Dashboard UI Integration - Research

## Goal
Integrate the participant frontend templates with the backend APIs to enable hackathon browsing, team management, and problem statement selection.

## Context & Baseline
- The backend APIs are fully implemented in `participant/api_views.py`.
- The frontend templates exist in `frontend/templates/participant/` (`hackathon_hub.html`, `hackathon_list.html`, `hackathon_register.html`).
- The frontend requires wiring up the UI using HTML forms, JS (if dynamic interactions are needed for searching/filtering), and Django views to serve the pages.

## Required Endpoints / Integrations
1. **Browse Hackathons**: Users must be able to see open hackathons.
2. **Team Building API** (`TeamViewSet`, `TeamMemberViewSet`, `JoinTeamAPIView`): 
   - UI for Team Leaders to create teams (`TEAM-01`).
   - UI for adding guest record teammates (`TEAM-02`).
   - UI for joining teams via invite links.
4. **Solo Participant Recruiting & Requests**:
   - UI for Team Leaders to search solo visible participants (`TEAM-04`).
   - Backend requires a new `TeamRequest` model to track invites sent from leaders to solo participants.
   - UI for solo participants to view incoming join requests and accept/decline them.
   - UI for solo participants to toggle their visibility status (`PROF-03`).
5. **QR Code Access**:
   - UI to show the generated QR code (`QR-01`).

## Data Flow & Authentication
- The app uses standard Django session authentication (moving to JWTs in Phase 11).
- The templates are server-rendered. Dynamic data like searching for participants will either require simple page reloads with query params (`?skill=...`) or vanilla JS fetching the API endpoints.

## Implementation Plan Strategy
1. Create the `TeamRequest` backend model and associated API endpoints for sending and responding to requests.
2. Ensure the Django Views properly render the participant templates.
3. Connect `hackathon_list.html` to a view that fetches and lists hackathons.
4. Connect `hackathon_register.html` to the team creation logic.
5. Implement the team hub (`hackathon_hub.html`) with JavaScript to interact with the discovery API for finding solo members and sending requests.
6. Create an inbox/requests UI for solo participants to toggle their visibility and manage invites.

## Validation Architecture
- Verify that `ParticipantDiscoveryAPIView` responds to skill queries from the frontend.
- Verify Team Leaders can successfully create a team and add guest records from the UI.
- Verify the QR code displays properly in the team hub.
