# Phase 6 Plan Reviews

This document aggregates peer reviews for the Phase 6 implementation plan (`06-01-PLAN.md`).

---

## Reviewer 1: Architect (Next.js & Prisma Design)
**Verdict: APPROVED WITH RECOMMENDATIONS**

### Strengths
- **Clean Action Segregation**: Separation of team registration actions (`teams.ts`) and scanner utility actions (`scans.ts`) matches domain separation guidelines.
- **Transactional Consistency**: Database check-ins inside `submitMemberScans` are wrapped in a Prisma `$transaction` to ensure atomic insertion.

### Concerns & Recommendations
- **Concurrency in Registration**: When joining a team, the capacity limit (`1 + team.members.count() >= team.hackathon.max_team_size`) must be checked under a row lock or transactional state to prevent race conditions when multiple users join simultaneously.
  - *Mitigation*: Wrap the join logic inside a serializable `$transaction` and query counts directly under the transactional client.
- **Teammember email uniqueness check**: SQLite does not support deferred constraints. When a TeamRequest is accepted or a guest is added, we must verify that the user's email is not already active in another team for that hackathon. The action should check this check explicitly before insertion to return a user-friendly error.

---

## Reviewer 2: Security Auditor (Authorization & Cryptography)
**Verdict: APPROVED**

### Strengths
- **UUID payload security**: Restricting QR visual codes to contain only the random UUID `qr_token` and performing all profile resolution server-side prevents information leakage.
- **Strict Role Boundaries**: Enforcing that only organizers or coordinators associated with that specific hackathon can query scanned lists or post check-in logs.

### Concerns & Recommendations
- **Device ID and Scanned By Logging**: In `submitMemberScans`, log `scanned_by_id` as the authenticated user's ID, and log `device_id` (IP or browser user-agent header if available) to provide clear logs for audit trails.
- **Invite link validation**: Validate that invite tokens expire once `registration_deadline` has passed. This is correctly planned.

---

## Reviewer 3: QA & Product Lead (Requirement Traceability)
**Verdict: APPROVED**

### Tracing Verification
- **TEAM-01 (Create Team)**: Fully addressed. Leader automatically synced as member.
- **TEAM-02 (Guest Records)**: Fully addressed. Guest records created without accounts.
- **TEAM-03 (Recruit & Invites)**: Fully addressed. Search solo visible users and accept/decline requests actions mapped.
- **QR-01 (QR Render)**: Fully addressed. dynamic `qrcode.react` integration.
- **QR-03 (Camera Scanner)**: Fully addressed. `html5-qrcode` handles browser media stream.
- **QR-04 (Double scan prevention)**: Fully addressed. Uniqueness of `[team_member_id, scan_category_id]` is enforced both in action validation and at database constraints level.
