---
phase: 3
slug: 03-seating-service-and-razorpay-port
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-03
---

# Phase 3 — Validation Strategy

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
| 03-01-01 | 01 | 1 | SEAT-01 | — | Seating allocation greedily selects benches and assigns contiguous seats. | unit | `npx vitest run tests/seating.test.ts` | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | PAY-01 | — | Direct API integration maps order properties and uses timing-safe checks. | unit | `npx vitest run tests/razorpay.test.ts` | ✅ | ✅ green |
| 03-01-03 | 01 | 1 | PAY-02 | T-03-01 / T-03-03 | Validates webhook signatures via HMAC and updates DB inside transaction. | unit | `npx vitest run tests/razorpay.test.ts` | ✅ | ✅ green |
| 03-01-04 | 01 | 1 | SEAT-01 | — | Seating dashboard renders visual grids and highlights fragmented benches. | manual | — | — | ✅ green |
| 03-01-05 | 01 | 1 | PAY-01 | T-03-02 | Payment card display is restricted per-user and triggers Razorpay overlay. | manual | — | — | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Vitest is configured to resolve the Next.js path alias `@/` to the root folder via `vitest.config.ts`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Seating preview visual grid & fragmented highlight | SEAT-01 | Requires browser UI interaction to inspect room configuration grid and multi-team bench borders. | Open `/organizer/dashboard/seating`, click "Run Seating Allocation", check that benches containing different teams show an `amber-500` border warning. |
| Razorpay sandbox checkout overlay | PAY-01 | Relies on third-party Razorpay modal scripts loaded dynamically on client action. | Log in as participant user `13`, click "Pay & Register Team", verify the Razorpay checkout overlay pops up with correct order details. |
| Webhook payment update | PAY-02 | Involves direct Razorpay checkout sandbox success calls that notify the local server. | Complete a payment transaction on the participant checkout modal, verify the page updates to "Paid & Verified" state. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-03
