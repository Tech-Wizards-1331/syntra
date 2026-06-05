# Quick Task Summary: Fix team size and capacity calculations

## Problem & Findings
For legacy Django teams in Draft state, the team leader record is not present in the `participant_teammember` table (the leader ForeignKey resides on the `Team` object, and a teammate record is only created when registration is finalized). This caused major bugs:
1. **Exceeding Max Team Size**: Next.js allowed teams to exceed capacity by not counting the leader.
2. **Failing Min Team Size**: Teams with 1 leader and 1 member were blocked from registering because Next.js thought they only had 1 person (failing a minimum team size check of 2).

## Solutions Implemented
1. **Dynamic Capacity Counting**: Modified server actions (`addTeamMember`, `submitTeamRegistration`, `sendTeamInvite`, `acceptTeamInvite`) and checkout APIs to verify capacity using a check for leader email presence in the `teammember` table. If missing, it adds `1` to the member count (mimicking Django's dynamic `occupied_slots` property).
2. **Atomic Leader Auto-Registration**: Updated team registration completion server actions and payment verification routes to insert the team leader into the `teammember` table under a database transaction, keeping database parity for registered teams.
3. **UI Prepends**: Prepend the virtual team leader dynamically to the teammate arrays in UI layout query handlers (dashboard page, team register workspace page, and hackathon hub page) if missing, so the leader correctly displays at index 0 (as "LEADER").
4. **Mock Alignments**: Updated `tests/teams.test.ts` to mock the newly introduced database calls.

## Commits & Verification
- Ran vitest and verified all 71 tests pass successfully!
