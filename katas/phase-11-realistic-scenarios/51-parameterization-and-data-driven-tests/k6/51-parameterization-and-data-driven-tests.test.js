// Kata 51 — Parameterization and Data-Driven Tests (k6 solution)
//
// Demonstrates three selection strategies in one test:
// 1. Random pick from a fixed dataset (loaded via SharedArray)
// 2. Per-VU stickiness (each VU uses the same user across iterations)
// 3. Synthetic generation (unique per iteration, no fixed dataset)

import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// Loaded ONCE in init context, shared across all VUs.
// Without SharedArray, each VU would get its own copy in memory.
const users = new SharedArray('users', function () {
  return JSON.parse(open('./users.json'));
});

export const options = {
  scenarios: {
    random_pick: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '15s',
      preAllocatedVUs: 10,
      exec: 'randomPick',
    },
    per_vu: {
      executor: 'constant-vus',
      vus: 5,
      duration: '15s',
      exec: 'perVuPick',
    },
    synthetic: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '15s',
      preAllocatedVUs: 10,
      exec: 'syntheticUser',
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration': ['p(95)<300'],
  },
};

// Strategy 1: random pick from the fixed dataset.
// Each iteration grabs a random user. Same user may be picked multiple
// times — that's fine, mirrors real traffic patterns.
export function randomPick() {
  const user = users[Math.floor(Math.random() * users.length)];
  login(user.username, user.password, 'random');
}

// Strategy 2: per-VU pick — each VU sticks to its own user.
// Useful when the server keeps per-session state and you want each
// "user" in the test to behave like a real session.
export function perVuPick() {
  const user = users[__VU % users.length];
  login(user.username, user.password, 'per_vu');
}

// Strategy 3: synthetic — generate a fresh username per iteration.
// Use when you don't have a fixed dataset, or when you specifically want
// to force cache misses. Combine __VU + __ITER + Date.now() for uniqueness
// at high RPS — Date.now() alone collides at ms boundaries.
export function syntheticUser() {
  const username = `synthetic-${__VU}-${__ITER}-${Date.now()}`;
  login(username, 'pw', 'synthetic');
}

function login(username, password, strategy) {
  const res = http.post(
    `${BASE_URL}/lab/auth/login`,
    JSON.stringify({ username, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { strategy },
    }
  );
  check(res, {
    'login status is 200': (r) => r.status === 200,
    'response has token': (r) => typeof r.json('token') === 'string',
  });
}
