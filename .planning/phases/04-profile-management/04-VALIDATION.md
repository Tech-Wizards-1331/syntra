---
phase: 4
slug: 04-profile-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | [vitest.config.ts](file:///vitest.config.ts) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | PROF-01 / PROF-02 | — | Session token includes roles and profile IDs, and is updated dynamically. | unit | `npx vitest run tests/profile.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | PROF-01 / PROF-02 | — | Redirects users with incomplete profiles to profile setup forms. | manual | — | — | ⬜ pending |
| 04-01-03 | 01 | 1 | PROF-01 | — | Uploads logos to Cloudinary and returns secure URL. | unit | `npx vitest run tests/profile.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | PROF-01 / PROF-02 | — | Profile changes (college, degree, organization, etc.) saved atomically. | unit | `npx vitest run tests/profile.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | PROF-02 | — | Visual page loaded with interactive skill selectors and tag additions. | manual | — | — | ⬜ pending |
| 04-01-06 | 01 | 1 | PROF-01 | — | Organizer profile form correctly captures name, website, and processes logo. | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- `tests/profile.test.ts` — stubs for profile actions and Cloudinary mocks.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Middleware redirect loop prevention | PROF-01 / PROF-02 | Involves browser routing redirect checks based on cookie session status. | Attempt to navigate to `/participant/dashboard` with an incomplete profile, confirm redirect to `/participant/profile` occurs. Verify that accessing `/participant/profile` does not result in a redirect loop. |
| Drag-and-drop file upload UX | PROF-01 | Requires file picking and browser drop event interactions. | Open `/organizer/profile`, drag an image onto the dropzone, confirm it uploads and displays a preview. |
| Interactive skill tags selector | PROF-02 | Involves direct visual rendering of dynamic tags and keystrokes. | Open `/participant/profile`, click preset skill tags to toggle, type a custom tag name and hit Enter, confirm the new tag is added. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
