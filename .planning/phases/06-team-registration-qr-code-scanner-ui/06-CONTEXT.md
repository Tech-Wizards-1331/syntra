# Phase 6 Context: Team Registration, QR Code & Scanner UI

This document outlines the core decisions, routing schemas, and security rules established for Phase 6.

---

## Decided Decisions

### 1. QR Code Scanner Flow & Security Scopes
*   **Access Route**:
    *   **Direct Access**: `/organizer/scan` displays a selector for the Hackathon and Scan Category. Once selected, the camera scanner initializes.
    *   **Contextual Redirect**: Clicking the "Scan" icon next to any scan category in the Hackathon details panel redirects the coordinator directly to `/organizer/scan?hackathonId={id}&categoryId={cat_id}`, bypassing the setup selectors and launching the scanner immediately.
*   **Security Gates**:
    *   Route `/organizer/scan` is guarded by middleware.
    *   Only users with the role `organizer` or active `coordinator` configurations for the target hackathon can fetch scan lists or submit records.
    *   Participants attempting to load the page are redirected with access-denied warnings.

### 2. Team Registration & Building
*   **Registration Trigger**:
    *   Participant dashboard displays a registration form if the user is not registered.
    *   **Option 1: Create Team**: Input team name. Generates `qr_token` and `invite_token` (as UUIDs) and inserts the leader as the first `TeamMember` and team leader.
    *   **Option 2: Join Team**: Input team `invite_token` to register immediately.
*   **Team Building & Recruitment**:
    *   Team Leaders can search for solo participants (where `visibility = true` and `role = 'participant'`) by name/skills.
    *   Send a `TeamRequest` which places a pending invitation on the target user's dashboard.
    *   Solo participants can click *Accept* or *Decline*.
    *   Team Leaders can also manually add teammates as Guest Records (`TeamMember` records without user account associations).

### 3. QR Codes & Scanners Integration
*   **QR Rendering**: SVGs generated dynamically on the client dashboard using `qrcode.react`.
*   **Camera Scanning**: Uses `html5-qrcode` on `/organizer/scan` to handle camera permissions and decode QR codes.
*   **Token Security**: The QR code encodes only the unique `qr_token` UUID. No team details, participant names, or IDs are stored in the QR payload. All parsing and validations run server-side.
