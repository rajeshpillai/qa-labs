// Kata 61 — Batched HTTP and REST Patterns (k6 solution)
//
// Compares sequential, parallel (batched), and conditional patterns
// against the lab server. Each scenario tagged so per-pattern percentiles
// are visible in the summary.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    sequential: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'sequentialFlow',
    },
    batched: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'batchedFlow',
    },
    realistic: {
      executor: 'constant-vus',
      vus: 3,
      duration: '15s',
      exec: 'realisticDashboard',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    // Same workload, different patterns. Per-pattern p95 makes the
    // sequential vs parallel cost visible.
    'iteration_duration{pattern:sequential}': ['p(95)<1500'],
    'iteration_duration{pattern:batched}': ['p(95)<700'],
  },
};

// Pattern 1: hit three slow endpoints sequentially.
// Total ≈ 3 × 200ms = 600ms minimum.
export function sequentialFlow() {
  http.get(`${BASE_URL}/lab/slow?ms=200`, { tags: { pattern: 'sequential', step: 'a' } });
  http.get(`${BASE_URL}/lab/slow?ms=200`, { tags: { pattern: 'sequential', step: 'b' } });
  http.get(`${BASE_URL}/lab/slow?ms=200`, { tags: { pattern: 'sequential', step: 'c' } });
}

// Pattern 2: same three calls but in parallel via http.batch.
// Total ≈ max(200ms, 200ms, 200ms) = 200ms.
export function batchedFlow() {
  const responses = http.batch([
    ['GET', `${BASE_URL}/lab/slow?ms=200`, null, { tags: { pattern: 'batched', step: 'a' } }],
    ['GET', `${BASE_URL}/lab/slow?ms=200`, null, { tags: { pattern: 'batched', step: 'b' } }],
    ['GET', `${BASE_URL}/lab/slow?ms=200`, null, { tags: { pattern: 'batched', step: 'c' } }],
  ]);
  check(responses[0], { 'a returned 200': (r) => r.status === 200 });
  check(responses[1], { 'b returned 200': (r) => r.status === 200 });
  check(responses[2], { 'c returned 200': (r) => r.status === 200 });
}

// Pattern 3: realistic dashboard — sequential auth, then parallel widgets,
// optional follow-up depending on the response.
export function realisticDashboard() {
  // 1. Sequential: login, must complete first.
  const loginRes = http.post(
    `${BASE_URL}/lab/auth/login`,
    JSON.stringify({ username: `dash-${__VU}`, password: 'pw' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (loginRes.status !== 200) return;
  const token = loginRes.json('token');
  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Parallel: 4 simulated widget loads + 1 notifications poll.
  const responses = http.batch([
    ['GET', `${BASE_URL}/lab/echo?widget=a`, null, { headers: authHeaders, tags: { widget: 'a' } }],
    ['GET', `${BASE_URL}/lab/echo?widget=b`, null, { headers: authHeaders, tags: { widget: 'b' } }],
    ['GET', `${BASE_URL}/lab/echo?widget=c`, null, { headers: authHeaders, tags: { widget: 'c' } }],
    ['GET', `${BASE_URL}/lab/echo?widget=d`, null, { headers: authHeaders, tags: { widget: 'd' } }],
    ['GET', `${BASE_URL}/lab/auth/me`, null, { headers: authHeaders, tags: { widget: 'me' } }],
  ]);

  for (const r of responses) {
    check(r, { 'widget loaded': (res) => res.status === 200 });
  }

  // 3. Conditional: only fetch the extra endpoint if auth confirms it.
  // (Trivial example — in real flows: "fetch alerts if user has admin role".)
  const meRes = responses[4];
  if (meRes.status === 200 && meRes.json('user')) {
    http.get(`${BASE_URL}/lab/health`, { tags: { followup: 'true' } });
  }
}
