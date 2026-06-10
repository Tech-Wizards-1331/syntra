# Quick Task Summary: Implement registered teams capacity limit

## Problem & Findings
For any hackathon, we need a mechanism to limit the total number of registered (and paid) teams allowed, preventing over-registration. Since we cannot modify the Prisma schema or alter the live legacy Django database schema, we must store this configuration inside the existing `room_configuration` JSON field of `organizer_hackathon`. This is perfectly backwards-compatible since the Django seating allocation service ignores JSON array entries that lack `columns` or do not match the expected room formats.

## Solutions Implemented
1. **Capacity Limit Configuration**:
   - Added a "Registration Capacity" toggle and numeric stepper to the Organizer's seating page (`app/organizer/dashboard/seating/page.tsx`).
   - Enabled configuring `maxTeams` limit, which serializes into `room_configuration` as an object `{ room_no: "METADATA", type: "metadata", max_teams }`.
   - Updated JSON parsing (`parseJsonToRooms`) to extract the capacity metadata and populate the local state.
2. **API & Server Action Validation**:
   - Updated team registration checkout logic in `app/api/payment/checkout/route.ts` to fetch the registered teams count and reject checkout with an error if the capacity limit is exceeded.
   - Updated `submitTeamRegistration` in `app/actions/teams.ts` to similarly check the limit and block free hackathon registrations.
   - Updated `saveSeatingAllocation` in `app/actions/seating.ts` to persist `room_configuration` together with the allocation results.
3. **UI Warnings & Disabling**:
   - Updated participant workspace loading (`app/participant/dashboard/register/[teamId]/page.tsx`) to query registered teams and compute if the hackathon is full.
   - Updated `TeamDashboardClient.tsx` to display a visual warnings banner ("Registration Limit Reached") and disable checkout/registration submit buttons once the limit is hit.
4. **Unit Tests**:
   - Added a unit test in `tests/teams.test.ts` mocking `prisma.participant_team.count` and asserting that registration is blocked when the capacity limit is reached.
