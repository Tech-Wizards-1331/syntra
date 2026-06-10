---
phase: 5
slug: 05-hackathons-problem-statements-categories
status: completed
created: 2026-06-04
---

# Phase 5 — Context

> Locked decisions, trust boundaries, and canonical references for Hackathons, Problem Statements & Categories.

---

## Canonical References

- [REQUIREMENTS.md:L19-L23](file:///.planning/REQUIREMENTS.md#L19-L23) — HACK-01, HACK-02, HACK-03, and QR-02 specifications.
- [ROADMAP.md:L58-L66](file:///.planning/ROADMAP.md#L58-L66) — Phase 5 success criteria.

---

## Locked Decisions

1. **PDF File Upload Extensions**:
   - We will extend [cloudinary.ts](file:///lib/services/cloudinary.ts) to support both images and PDF documents.
   - The size limit for PDFs will be capped at **10MB** (while maintaining the **5MB** limit for images).
   - Reusable helper will parse and detect `application/pdf` mime type.

2. **Standard Hackathon Status Lifecycle**:
   - Allowed values for `organizer_hackathon.status` are: `draft`, `registration`, `active`, and `completed`.
   - The UI dropdown will offer these explicit selections and validate them in Server Actions.

3. **Simple Scan Categories Management**:
   - Organizers will manage scan categories in a clean tab/section within their dashboard.
   - Categories will support an active toggle (`is_active`).
   - The `display_order` will be automatically assigned based on database creation IDs, keeping the interface clean and avoiding manual re-ordering controls.

4. **UI Styling Continuity**:
   - Form fields, buttons, toggles, and search containers will respect the dark glassmorphic styling system (using the `bg-slate-950` backdrop, thin border overlays, and teal/emerald highlights).

---

## Deferred Ideas

No deferred ideas for this phase.
