// Kata 48 — Smoke Test (k6 solution)
//
// The simplest possible perf test: one VU, 30 seconds, tight thresholds,
// hits a representative endpoint to verify the perf pipeline is alive.
// This kata's solution covers two flows the readme exercise asks for:
// 1. A bare-minimum smoke test against /lab/echo
// 2. An auth flow smoke test (login → /me) — see the second scenario

import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    // Scenario 1: trivial GET smoke
    echo_smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      exec: 'echoSmoke',
    },
    // Scenario 2: auth flow smoke
    auth_smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      exec: 'authSmoke',
      startTime: '0s', // run in parallel — that's fine for a smoke
    },
  },
  thresholds: {
    // Tighter than a load test: this is 1 VU on an unloaded system,
    // anything beyond these numbers means something is fundamentally broken.
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<500'],
    // Per-scenario assertion: every login + /me call must succeed
    'checks{scenario:auth_smoke}': ['rate>0.99'],
  },
};

export function echoSmoke() {
  const res = http.get(`${BASE_URL}/lab/echo`);
  check(res, {
    'echo status is 200': (r) => r.status === 200,
    'echo body has ok=true': (r) => r.json('ok') === true,
  });
}

export function authSmoke() {
  let token;

  group('login', () => {
    const loginRes = http.post(
      `${BASE_URL}/lab/auth/login`,
      JSON.stringify({ username: 'smoke-user', password: 'anything-works' }),
      { headers: { 'Content-Type': 'application/json' }, tags: { scenario: 'auth_smoke' } }
    );
    check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login returns a token': (r) => typeof r.json('token') === 'string',
    });
    token = loginRes.json('token');
  });

  group('me', () => {
    const meRes = http.get(`${BASE_URL}/lab/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { scenario: 'auth_smoke' },
    });
    check(meRes, {
      'me status is 200': (r) => r.status === 200,
      'me returns the user': (r) => r.json('user') === 'smoke-user',
    });
  });
}
