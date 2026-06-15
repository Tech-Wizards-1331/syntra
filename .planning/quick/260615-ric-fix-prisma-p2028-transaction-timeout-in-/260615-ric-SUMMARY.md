# Quick Task 260615-ric: Fix Prisma P2028 Transaction Timeout — Summary

**Completed:** 2026-06-15
**Commit:** ba9bba3

## Problem

Users completing their participant profile received "An unexpected response was received
from the server" after submitting the profile form. The root cause was two-fold:

1. **Prisma P2028 Transaction Timeout:** `saveParticipantProfile` in `app/actions/profile.ts`
   used `Promise.all()` to resolve skills concurrently inside a Prisma interactive transaction.
   Prisma interactive transactions run on a single database connection and do NOT support
   concurrent queries — this caused the transaction to time out with `P2028: Transaction not found`.

2. **Middleware RSC Payload Corruption:** The middleware intercepted Server Action requests
   (which use the `next-action` header) and issued redirects, corrupting the RSC response
   payload and producing the generic client-side error.

## Changes

### `app/actions/profile.ts`
- Replaced `Promise.all(data.skills.map(...))` with a sequential `for...of` loop inside
  the `prisma.$transaction()` block
- Skills are now resolved one at a time on the same DB connection, avoiding transaction timeouts

### `middleware.ts`
- Added early return for requests with the `next-action` header
- Server Actions now bypass middleware entirely, preventing RSC payload corruption

## Verification

- ✅ All 13 tests in `tests/profile.test.ts` pass
- ✅ Code compiles (pre-existing node_modules type issues are unrelated)
