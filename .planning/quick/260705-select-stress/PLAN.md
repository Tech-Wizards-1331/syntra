# Quick Task Plan: 250 Teams Problem Statement Selection Load Test

Establish a testing environment to simulate 250 teams selecting a problem statement concurrently to check for database connection thresholds, load capacity, and race conditions.

## Proposed Changes

### Database Seeding
#### [NEW] [seed_stress_data.js](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/prisma/seed_stress_data.js)
Create a seeding script to inject:
- A special "Stress Test Hackathon" with `release_problems: true`.
- An "Active Problem Statement" with `max_teams_allowed: 50` (so we can check if more than 50 teams are able to select it under parallel load).
- 250 test teams, each with a unique leader user account (`stress_leader_1@example.com` to `stress_leader_250@example.com`).

### Test API Endpoint
#### [NEW] [route.ts](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/app/api/test/stress-select/route.ts)
Create a temporary API route `/api/test/stress-select` that:
- Bypasses OAuth cookie check (for load test speed).
- Accepts `teamId`, `userId`, and `problemStatementId` in the body.
- Performs the *exact* database read, check, and update logic of `selectProblemStatement` from `app/actions/participantProblemStatements.ts` to test for race conditions.

### Load Test Script
#### [NEW] [stress-select-test.js](file:///c:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/syntra/tests/stress-select-test.js)
Create a k6 script that:
- Executes 250 virtual users concurrently.
- Each virtual user is mapped to a unique seeded team leader (`__VU`).
- Each user sends a POST request to `/api/test/stress-select` to select the problem statement at the exact same time.

## Verification
1. Run `node prisma/seed_stress_data.js` to seed the database.
2. Run `k6 run tests/stress-select-test.js` to trigger 250 parallel requests.
3. Check the database to see if `selected_problem_statement_id` count exceeds `50` (which would indicate a race condition).
