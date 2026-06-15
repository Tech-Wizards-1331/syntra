# Quick Task 260615-ric: Fix Prisma P2028 Transaction Timeout

## Root Cause

`saveParticipantProfile` in `app/actions/profile.ts` uses `Promise.all()` to resolve skills
concurrently inside a Prisma interactive transaction (`tx`). Prisma interactive transactions
run on a single database connection and do NOT support concurrent queries — this causes the
transaction to time out with error `P2028: Transaction not found`.

The same pattern exists in `saveOrganizerProfile` with its `$transaction` but that one doesn't
use `Promise.all` inside the transaction, so it's not affected.

Additionally, the middleware intercepts Server Action requests during profile completion redirects,
which can corrupt the RSC payload and produce the generic "An unexpected response was received
from the server" error on the client side.

## Tasks

### Task 1: Replace `Promise.all` with sequential `for...of` loop in `saveParticipantProfile`

**File:** `app/actions/profile.ts` (lines 155-170)
**Action:** Replace `Promise.all(data.skills.map(...))` with a sequential `for...of` loop
**Verify:** `npx vitest run tests/profile.test.ts` passes
**Done:** Skills are resolved sequentially within the transaction

### Task 2: Add Server Action bypass in middleware

**File:** `middleware.ts`
**Action:** Add early return for `next-action` header requests to prevent middleware from
intercepting Server Action responses
**Verify:** `npm run dev` starts without errors
**Done:** Middleware no longer intercepts Server Action requests
