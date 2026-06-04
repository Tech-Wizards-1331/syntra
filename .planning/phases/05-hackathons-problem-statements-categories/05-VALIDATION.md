---
phase: 5
slug: 05-hackathons-problem-statements-categories
status: verified
nyquist_compliant: true
wave_1_complete: true
created: 2026-06-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | [vitest.config.ts](file:///vitest.config.ts) |
| **Quick run command** | `npx vitest run tests/hackathons.test.ts` |
| **Full suite command** | `npm test` or `npx vitest run` |
| **Estimated runtime** | ~1.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/hackathons.test.ts`
- **Before execution finish:** Full suite must be green
- **Max feedback latency:** 1.5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HACK-01 | T-05-02 | Cloudinary helper extracts public IDs and deletes Raw/Image assets properly. | unit | `npx vitest run tests/hackathons.test.ts` | ✅ | ✅ green |
| 05-01-02 | 01 | 1 | HACK-01 / HACK-02 | T-05-01 | Hackathons CRUD action validates dates, fees, and state transitions. | unit | `npx vitest run tests/hackathons.test.ts` | ✅ | ✅ green |
| 05-01-03 | 01 | 1 | HACK-03 | T-05-02 | Problem statements CRUD enforces ownership checks and triggers Cloudinary deletes. | unit | `npx vitest run tests/hackathons.test.ts` | ✅ | ✅ green |
| 05-01-04 | 01 | 1 | QR-02 | T-05-03 | Scan category creation uses Prisma transactions to prevent index order race conditions. | unit | `npx vitest run tests/hackathons.test.ts` | ✅ | ✅ green |
| 05-01-05 | 01 | 1 | HACK-01 / HACK-03 | — | Unit tests created covering all boundaries and direct signature uploads. | unit | `npx vitest run tests/hackathons.test.ts` | ✅ | ✅ green |
| 05-01-06 | 01 | 1 | HACK-01 | — | Organizer dashboard lists events with paginated controls and empty states. | manual | — | — | ✅ green |
| 05-01-07 | 01 | 1 | HACK-01 | — | Form for creating hackathons with validation errors. | manual | — | — | ✅ green |
| 05-01-08 | 01 | 1 | HACK-01 / HACK-02 | — | Form for editing hackathons and transitioning status phases. | manual | — | — | ✅ green |
| 05-01-09 | 01 | 1 | HACK-01 / HACK-03 / QR-02 | T-05-02 | Hackathon details page client panel with PDF magic bytes check and signed uploads. | manual | — | — | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDF magic bytes check client-side | HACK-03 | Involves direct browser upload of file blobs. | Open Hackathon detail page, select a non-PDF file, confirm validation blocks upload. Select a PDF file, verify it uploads to Cloudinary with a progress bar. |
| Page compilation and type-checking | HACK-01 | Verifies Next.js app bundle compiles cleanly. | Run `npm run build` and ensure compilation finishes successfully. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 1 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 1 covers all references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-04
