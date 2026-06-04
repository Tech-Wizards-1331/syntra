---
phase: 5
slug: 05-hackathons-problem-statements-categories
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-04
---

# Phase 5 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Server Action Authorization | Session boundaries checking roles and organizer profiles before executing read/write mutations on database records. | User ID, profile ID, session cookie (high sensitivity). |
| Direct Browser Uploads | Client-side file uploading to Cloudinary using signed timestamp and folder parameters generated server-side. | Cloudinary signature, public API keys, file payloads (high sensitivity). |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-05-01 | Information Disclosure | Hackathon Actions | mitigate | Check session user ID / organizer ID ownership on all read/write actions in [hackathons.ts](file:///app/actions/hackathons.ts). | closed |
| T-05-02 | Tampering | Cloudinary Uploads | mitigate | Use server-generated signed upload parameters restricting directory and format; run client-side magic-byte validations in [HackathonDetailPageClient.tsx](file:///app/organizer/dashboard/hackathons/[id]/HackathonDetailPageClient.tsx). | closed |
| T-05-03 | Elevation of Privilege | Scan Categories / Actions | mitigate | Block access to create/toggle/delete category and problem statements unless session owns the target hackathon in [scancategories.ts](file:///app/actions/scancategories.ts) and [problemstatements.ts](file:///app/actions/problemstatements.ts). | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-04 | 3 | 3 | 0 | Antigravity |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-04
