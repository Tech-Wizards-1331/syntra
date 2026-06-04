# Phase 3: Seating Service & Razorpay Port - Context

**Gathered:** 2026-06-03  
**Status:** Ready for research and planning  

<domain>
## Phase Boundary

Port the legacy Django seating allocation algorithm and Razorpay checkouts to Next.js. Create API endpoints for creating orders, verifying client-side payments, and processing signature-verified webhooks. Implement an interactive seating preview for organizers and serialize allocations to the existing database schema.
</domain>

<decisions>
## Implementation Decisions

### Razorpay Integration
- **D-01 (API Routes)**: Order creation and frontend client-side checkout verification will be handled via dedicated API routes:
  - `POST /api/payment/checkout` - Create Razorpay orders and pending database payment logs.
  - `POST /api/payment/verify` - Perform immediate verification of payment signatures returned by the frontend.
- **D-02 (Signature-Verified Webhook)**: Implement a POST handler at `/api/payment/webhook` to handle asynchronous events from Razorpay (such as `payment.captured`). Verify webhook signatures using the raw request body, the `x-razorpay-signature` header, and the configured webhook secret via HMAC-SHA256.

### Seating Service
- **D-03 (Interactive Preview)**: Provide an interactive preview page/modal for organizers under `/organizer/dashboard/seating` (or similar routing) that runs the ported seating allocation in-memory, displays the bench layouts on screen, and allows saving or re-running.
- **D-04 (Database Parity)**: The finalized seating allocation layouts will be serialized as JSON strings and written directly to the existing `organizer_hackathon.seating_allocation` column. No new tables or schema alterations will be made to preserve database compatibility.
</domain>

<specifics>
## Specific Guidelines

- **Porting Seating Logic**: Port `backend/organizer/services/seating.py` line-by-line to a TypeScript service class or library (`lib/services/seating.ts`). Retain all priority levels (Perfect Fit, Empty Row, Column Adjacent, Back-to-Back) and mixed-bench penalties exactly.
- **Paise Conversion**: Razorpay expects order amounts in paise (INR * 100). Multiply amounts by 100 on order creation, and verify matching parameters on webhooks.
- **Prisma Transactions**: When marking a payment as paid, ensure we update both the `participant_payment` status and mark the team `is_registered = true` within a database transaction.
</specifics>

<canonical_refs>
## Canonical References

- **Legacy Seating Service**: [seating.py](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/backend/organizer/services/seating.py) - Original Python seating allocation logic.
- **Legacy Payment Service**: [payment_services.py](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/backend/participant/payment_services.py) - Original Python Razorpay order creation and signature verification logic.
- **Database Schema**: [schema.prisma](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/prisma/schema.prisma) - Prisma schema representing existing participant and organizer database models.
</canonical_refs>

<deferred>
## Deferred Ideas
- Camera scanner views, Scan Categories CRUD, and check-in logs are deferred to **Phase 5** and **Phase 6**.
- Full customizable room layout design dashboards are deferred. The system will load room configurations from the JSON structure in `organizer_hackathon.room_configuration` directly.
</deferred>

---
*Phase: 03-seating-service-and-razorpay-port*  
*Context gathered: 2026-06-03*  
