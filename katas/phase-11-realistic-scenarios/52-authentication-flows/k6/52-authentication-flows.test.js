// Kata 52 — Authentication Flows (k6 solution)
//
// Compares three auth patterns side-by-side using the QA Labs lab server:
// - per_iter:    login on every iteration (anti-pattern, baseline)
// - per_vu:      login once per VU, reuse token
// - token_pool:  pre-warm a shared pool, every VU pulls from it
//
// Run all three at once and inspect per-scenario http_reqs to see how the
// patterns distort the test's actual focus (calls to /lab/auth/me).

import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const POOL_SIZE = 20;

// Pre-warmed token pool — runs ONCE in init context (before any VU starts).
// Every VU sees the same array; selection is round-robin via __VU.
const tokenPool = new SharedArray('token_pool', function () {
  const arr = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const res = http.post(
      `${BASE_URL}/lab/auth/login`,
      JSON.stringify({ username: `pool-user-${i}`, password: 'pw' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status === 200) arr.push(res.json('token'));
  }
  return arr;
});

export const options = {
  scenarios: {
    per_iter: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'loginEveryIteration',
      tags: { auth_pattern: 'per_iter' },
    },
    per_vu: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'loginOncePerVu',
      tags: { auth_pattern: 'per_vu' },
    },
    token_pool: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'usePool',
      tags: { auth_pattern: 'token_pool' },
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    // Only assert on the protected endpoint — exclude login retries.
    'http_req_duration{endpoint:me}': ['p(95)<200'],
  },
};

// Anti-pattern: login on every iteration. Logs into N times more than needed.
export function loginEveryIteration() {
  const loginRes = http.post(
    `${BASE_URL}/lab/auth/login`,
    JSON.stringify({ username: `per-iter-${__VU}`, password: 'pw' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
  );
  if (loginRes.status !== 200) return;

  hitMe(loginRes.json('token'));
}

// Sensible default: login once per VU, cache the token in module-level state.
// In k6, `vuToken` is per-VU because each VU gets its own JS runtime.
let vuToken = null;
export function loginOncePerVu() {
  if (!vuToken) {
    const res = http.post(
      `${BASE_URL}/lab/auth/login`,
      JSON.stringify({ username: `per-vu-${__VU}`, password: 'pw' }),
      { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
    );
    if (res.status !== 200) return;
    vuToken = res.json('token');
  }
  hitMe(vuToken);
}

// High-RPS pattern: pull from pre-warmed shared pool. Zero login calls
// during the test phase.
export function usePool() {
  if (tokenPool.length === 0) return;
  const token = tokenPool[__VU % tokenPool.length];
  hitMe(token);
}

function hitMe(token) {
  const res = http.get(`${BASE_URL}/lab/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'me' },
  });
  check(res, {
    'me status is 200': (r) => r.status === 200,
  });
}
