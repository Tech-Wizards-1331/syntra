# Quick Task Plan: Implement Serializable Retry Loop for Problem Statement Selection

Modify the `selectProblemStatement` action to prevent race conditions during concurrent selection spikes (rush hour) using PostgreSQL Serializable transactions and a client-side retry mechanism.

## Proposed Changes

### Participant Actions
#### [MODIFY] [participantProblemStatements.ts](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/app/actions/participantProblemStatements.ts)
- Update `selectProblemStatement` to wrap the checks and update in a `prisma.$transaction` with `{ isolationLevel: 'Serializable' }`.
- Wrap the transaction in a retry loop (maximum 5 attempts) using exponential backoff with a random jitter (delay) when encountering `P2034` (write conflict/serialization failure) errors.

## Verification
- Verify that the code compiles successfully (`npm run build`).
- Verify that standard vitest tests still pass.
