import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress Test Configuration (Breakpoint Testing)
// This test gradually ramps up to 500 concurrent users to find the exact point where Vercel or DB starts failing.
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Stage 1: Warm-up up to 50 users
    { duration: '1m', target: 100 },  // Stage 2: Scale to 100 users (previous limit)
    { duration: '1m', target: 200 },  // Stage 3: Scale to 200 users (stress begins)
    { duration: '1.5m', target: 350 },// Stage 4: Scale to 350 users
    { duration: '1.5m', target: 500 },// Stage 5: Peak stress at 500 users
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  // We remove thresholds so that k6 collects all failure data without stopping early
  thresholds: {},
};

// Use environment variable or fallback to localhost
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'leader1@example.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'password123';

export default function () {
  const params = {
    headers: {
      'User-Agent': 'k6-Stress-Test-Agent',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  // 1. Fetch CSRF token
  const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, {
    headers: { 'User-Agent': 'k6-Stress-Test-Agent' }
  });
  
  const hasCsrf = check(csrfRes, {
    '1. CSRF fetched successfully': (r) => r.status === 200,
  });

  if (!hasCsrf) {
    sleep(1);
    return;
  }

  let csrfToken = '';
  try {
    csrfToken = csrfRes.json().csrfToken;
  } catch (e) {
    sleep(1);
    return;
  }

  // 2. Perform Login (Database look-up + password hashing computation)
  const loginPayload = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    csrfToken: csrfToken,
    json: 'true',
    callbackUrl: `${BASE_URL}/participant/dashboard`
  };

  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    loginPayload,
    params
  );

  const loginCheck = check(loginRes, {
    '2. Login API responsive': (r) => r.status === 200,
  });

  if (!loginCheck) {
    sleep(1);
    return;
  }

  sleep(1);

  // 3. Load Dynamic Authenticated Dashboard
  const dashboardRes = http.get(`${BASE_URL}/participant/dashboard`, {
    headers: { 'User-Agent': 'k6-Stress-Test-Agent' }
  });

  check(dashboardRes, {
    '3. Dashboard loaded successfully': (r) => r.status === 200,
  });

  sleep(1.5);
}
