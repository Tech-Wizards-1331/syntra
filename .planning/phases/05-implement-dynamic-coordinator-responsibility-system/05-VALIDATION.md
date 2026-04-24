---
phase: 05
slug: implement-dynamic-coordinator-responsibility-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (via Django manage.py test) |
| **Config file** | none — using standard Django tests |
| **Quick run command** | `python manage.py test organizer.tests` |
| **Full suite command** | `python manage.py test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `python manage.py test organizer.tests`
- **After every plan wave:** Run `python manage.py test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | N/A | — | Valid enum values required | unit | `python manage.py test organizer.tests.HackathonCoordinatorTests` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | N/A | — | Permissions strictly enforced | unit | `python manage.py test organizer.tests.CoordinatorPermissionTests` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 2 | N/A | — | Data isolation per hackathon | integration | `python manage.py test organizer.tests.CoordinatorAPITests` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 2 | N/A | — | Dashboard stats accurate | integration | `python manage.py test organizer.tests.CoordinatorDashboardTests` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `organizer/tests/test_coordinators.py` — Stubs for testing dynamic responsibilities and permissions
- [ ] Model fixtures or factories for setting up organizers, coordinators, and problem statements

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| API interactions via frontend | N/A | API testing doesn't verify UI state binding | Manually login as coordinator and view dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
