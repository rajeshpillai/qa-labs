// Kata 50 — Custom Metrics (k6 solution)
//
// Demonstrates all four custom-metric types in one test:
// - Trend:   end-to-end auth-flow timing
// - Counter: rate-limit hit count
// - Rate:    flaky-endpoint success ratio
// - Gauge:   server-reported queue depth (synthesized from /lab/health)
//
// The test exercises three endpoints in parallel scenarios so each metric
// has data to populate.

import http from 'k6/http';
import { check } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// Custom metrics — defined ONCE at module scope, not inside default().
const authFlowTotalMs = new Trend('auth_flow_total_ms', true);
const rateLimitHits = new Counter('rate_limit_hits');
const flakySuccess = new Rate('flaky_success');
const labActiveTokens = new Gauge('lab_active_tokens');

export const options = {
  scenarios: {
    auth: { executor: 'constant-vus', vus: 2, duration: '30s', exec: 'authFlow' },
    limited: { executor: 'constant-arrival-rate', rate: 50, timeUnit: '1s', duration: '10s', preAllocatedVUs: 10, exec: 'rateLimited' },
    flaky: { executor: 'per-vu-iterations', vus: 5, iterations: 20, exec: 'flakyCalls' },
    health: { executor: 'constant-vus', vus: 1, duration: '30s', exec: 'sampleHealth' },
  },
  thresholds: {
    // These thresholds operate on the CUSTOM metrics — same syntax as built-ins.
    'auth_flow_total_ms': ['p(95)<400'],
    'rate_limit_hits': ['count<400'],   // we expect MANY 429s; this asserts they don't go wild
    'flaky_success': ['rate>0.85'],     // 10% errorRate → 90% expected, allow slack
    // No threshold on the gauge — gauges are typically informational
    'http_req_failed': ['rate<0.50'],   // we deliberately hit flaky/limited endpoints
  },
};

export function authFlow() {
  const start = Date.now();

  const loginRes = http.post(
    `${BASE_URL}/lab/auth/login`,
    JSON.stringify({ username: `u-${__VU}-${__ITER}`, password: 'pw' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (loginRes.status !== 200) return;

  const token = loginRes.json('token');
  http.get(`${BASE_URL}/lab/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Record total auth-flow time.
  authFlowTotalMs.add(Date.now() - start);
}

export function rateLimited() {
  const res = http.get(`${BASE_URL}/lab/limit`);
  // Counter: tally 429 responses.
  if (res.status === 429) rateLimitHits.add(1);
}

export function flakyCalls() {
  const res = http.get(`${BASE_URL}/lab/flaky?errorRate=0.1`);
  // Rate: boolean — was this call successful?
  flakySuccess.add(res.status === 200);
  check(res, {
    'status is 200 or 500': (r) => r.status === 200 || r.status === 500,
  });
}

export function sampleHealth() {
  const res = http.get(`${BASE_URL}/lab/health`);
  if (res.status === 200) {
    // Gauge: snapshot of server-reported state.
    const tokens = res.json('activeTokens');
    if (typeof tokens === 'number') labActiveTokens.add(tokens);
  }
}
