import http from 'k6/http';
import { check, sleep } from 'k6';

// Read seeded mappings from stress-ids.json
const testData = JSON.parse(open('./stress-ids.json'));

export const options = {
  scenarios: {
    rush_hour: {
      executor: 'per-vu-iterations',
      vus: 250,        // 250 virtual users (one for each seeded team leader)
      iterations: 1,   // Each user performs the action exactly once
      maxDuration: '30s',
    },
  },
};

// Use environment variable or fallback to localhost
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USE_SAFE = __ENV.USE_SAFE || 'false'; // Set USE_SAFE=true to test the transaction-safe mode

export default function () {
  // __VU ranges from 1 to 250
  const userIndex = __VU - 1;
  const mapping = testData.teams[userIndex];

  if (!mapping) {
    return;
  }

  const url = `${BASE_URL}/api/test/stress-select`;
  const payload = JSON.stringify({
    teamId: mapping.teamId,
    userId: mapping.leaderId,
    problemStatementId: testData.problemStatementId,
    useSafeTransaction: USE_SAFE === 'true',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-Stress-Select-Agent',
    },
  };

  // Simulate all 250 team leaders clicking "Select" at the same time
  const res = http.post(url, payload, params);

  // We check response statuses:
  // - 200: Success
  // - 400: Handled capacity limit exceeded or team leader error
  // - 500: Database lock or query error
  check(res, {
    'Success (200) or Handled Capacity Error (400)': (r) => r.status === 200 || r.status === 400,
    'Server Error (500)': (r) => r.status === 500,
  });
}
