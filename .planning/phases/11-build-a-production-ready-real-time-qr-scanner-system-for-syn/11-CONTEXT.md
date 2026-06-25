# Phase 11: Build a production-ready real-time QR scanner system for Syntra hackathons using a “One QR per Team” architecture - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning
**Source:** User request

<domain>
## Phase Boundary
This phase implements a real-time QR scanner system for organizers and authorized volunteers to scan team QR codes and instantly mark selected members as scanned/present.
</domain>

<decisions>
## Implementation Decisions

### QR Token & Team Model
- Each team has a unique `qr_token` UUID stored in the Team model.
- One QR code per team, which contains only the `qr_token` (no JWT).
- Generate the QR code containing only the `qr_token` upon team registration.

### Permissions & Scoped Roles
- Reusable custom permission class `IsScannerAuthorized` allowing only organizers (owners of the hackathon) and authorized coordinators/volunteers per hackathon.
- Participants and normal users are denied access (returns 403).
- Create a `HackathonCoordinator` model to support per-hackathon association of coordinators/volunteers without breaking the global user role.
  - Fields: `hackathon` (ForeignKey), `user` (ForeignKey), `is_active` (BooleanField), `created_at` (DateTimeField).

### ScanCategory Model
- Create `ScanCategory` model to dynamically manage scan categories.
- Fields:
  - `hackathon` (ForeignKey to Hackathon)
  - `name` (CharField)
  - `is_active` (BooleanField, default True)
  - `display_order` (IntegerField, default 0)
  - `created_at` (DateTimeField, auto_now_add=True)
- Organizer can dynamically manage categories like: "Day 1 Attendance", "Lunch", "Dinner", "Swag", "Check-in", "Check-out".

### ScanRecord Model
- Create `ScanRecord` model to log individual member scans.
- Fields:
  - `team_member` (ForeignKey to TeamMember)
  - `scan_category` (ForeignKey to ScanCategory)
  - `scanned_by` (ForeignKey to User)
  - `created_at` (DateTimeField, auto_now_add=True)
- Prevent duplicate scans (`unique_together = ('team_member', 'scan_category')`).

### APIs
1. POST `/api/organizer/scanner/scan/`
   - Purpose: Validate QR token, fetch team and member data, and return their scan status for the given category.
   - Request format:
     ```json
     {
       "qr_token": "team_uuid",
       "scan_category_id": 2
     }
     ```
   - Response format:
     ```json
     {
       "team_name": "CodeStorm",
       "members": [
         {
           "id": 1,
           "name": "Rahul",
           "already_scanned": false
         }
       ]
     }
     ```
2. POST `/api/organizer/scanner/submit/`
   - Purpose: Save selected member scans instantly (create `ScanRecord`s).
   - Request format:
     ```json
     {
       "scan_category_id": 2,
       "qr_token": "team_uuid",
       "member_ids": [1, 2]
     }
     ```
   - Response format:
     ```json
     {
       "status": "success",
       "message": "Scanned 2 members successfully"
     }
     ```
   - Response validation: Ensure members belong to the team associated with the QR token and prevent double-scanning by raising validation error if they are already scanned.
   - Keep API responses lightweight and secure.

### UI/UX Expectations
- Fast scanning flow, one-hand operation, instant success/error feedback, green success flash, yellow already-scanned warning, red invalid QR warning, auto resume scanning.

</decisions>

<canonical_refs>
## Canonical References
- `backend/participant/models.py`
- `backend/organizer/models.py`
- `backend/accounts/models.py`
</canonical_refs>

<specifics>
## Specific Ideas
- Generate QR codes dynamically when a team registers or a token is assigned.
- Custom permission checking: verify that the user is either the hackathon organizer or a coordinator/volunteer assigned to the hackathon.
</specifics>

<deferred>
## Deferred Ideas
- Offline mode, local caching, bulk sync logic.
</deferred>
