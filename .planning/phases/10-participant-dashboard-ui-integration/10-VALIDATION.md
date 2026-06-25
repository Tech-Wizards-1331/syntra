# Phase 10: Participant Dashboard UI Integration - Validation Strategy

## Definition of Done (Nyquist Criteria)
The UI integration is considered complete when all end-to-end flows for the Participant can be successfully completed purely from the frontend without bypassing the UI or directly hitting the API.

## Core Workflows to Validate

### 1. Hackathon Discovery
- **Setup**: One active hackathon in the database.
- **Action**: Participant visits `/participant/hackathons/`.
- **Expected**: Active hackathon is visible.

### 2. Team Creation (TEAM-01)
- **Setup**: Participant clicks "Register" on the hackathon.
- **Action**: Submits Team Creation form.
- **Expected**: Team is created, Participant is redirected to Team Hub.

### 3. Adding Guest Teammates (TEAM-02)
- **Setup**: Team Leader is on Team Hub.
- **Action**: Submits "Add Teammate" form with mock guest data.
- **Expected**: Guest record is saved and appears in the team roster.

### 4. Searching and Inviting Solo Participants (TEAM-04)
- **Setup**: A solo participant with "React" skill exists and is visible.
- **Action**: Team Leader searches for "React" in the recruiting tab and clicks "Invite".
- **Expected**: Solo participant appears in search results, and clicking invite sends a `TeamRequest`.

### 5. Managing Invites and Visibility (PROF-03)
- **Setup**: Solo participant logs in and navigates to the Inbox.
- **Action 1**: Toggles visibility button.
- **Expected 1**: Visibility state persists in DB.
- **Action 2**: Clicks "Accept" on a pending `TeamRequest`.
- **Expected 2**: Participant is added to the Team, request is marked accepted.

### 6. QR Code Access (QR-01)
- **Setup**: Team is fully registered.
- **Action**: Team views their Hub page.
- **Expected**: QR code image is rendered and accessible.
