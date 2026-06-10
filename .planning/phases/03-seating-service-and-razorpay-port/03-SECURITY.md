---
phase: 3
slug: 03-seating-service-and-razorpay-port
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-03
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Razorpay Webhook Gateway | Direct HTTP payload notifications sent from Razorpay to `/api/payment/webhook`. | Event type, order details, signature headers (high sensitivity). |
| Session Boundaries | NextAuth session contexts restricting actions on dashboard pages and client APIs. | User ID, email, roles (high sensitivity). |
| Local Environment Variables | Secure configuration variables loaded from `.env` (e.g. `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`). | API keys and signing secrets (highest sensitivity). |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Spoofing | Webhook endpoint | mitigate | Verify raw request body with SHA256 HMAC inside `verifyWebhookSignature` (in [razorpay.ts](file:///lib/services/razorpay.ts)) against `x-razorpay-signature` header. | closed |
| T-03-02 | Information Disclosure | Checkout / Payment logs | mitigate | Validate inputs and restrict payment/checkout creation (in [route.ts](file:///app/api/payment/checkout/route.ts)) strictly to verified team members in the authenticated user session. | closed |
| T-03-03 | Tampering | Team registration status | mitigate | Atomically update payment status and team registration status in a Prisma `$transaction` inside direct verification (in [route.ts](file:///app/api/payment/verify/route.ts)) and webhook endpoints (in [route.ts](file:///app/api/payment/webhook/route.ts)). | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-03 | 3 | 3 | 0 | Antigravity |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-03
