// Kata 49 — Ramping VUs and Stages (k6 solution)
//
// Demonstrates the classic ramp + plateau + drain shape using
// `ramping-arrival-rate` (open model). Targets /lab/jitter to simulate
// realistic latency variance.
//
// Total duration ~3 minutes. Reduce stages durations if iterating quickly.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    realistic_ramp: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '20s', target: 50 },   // warm-up: 0 → 50 RPS
        { duration: '60s', target: 50 },   // plateau: 50 RPS sustained
        { duration: '20s', target: 100 },  // ramp: 50 → 100 RPS
        { duration: '40s', target: 100 },  // plateau: 100 RPS sustained
        { duration: '20s', target: 0 },    // drain: 100 → 0 RPS
      ],
      tags: { phase: 'unspecified' },
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    // Whole-test threshold — generous to absorb warm-up.
    'http_req_duration': ['p(95)<800'],
    // Tighter threshold on the plateau only — set the `plateau` tag inside
    // the test function during plateau windows.
    'http_req_duration{phase:plateau}': ['p(95)<400'],
  },
};

export default function () {
  // Tag this iteration based on test elapsed time, so we can assert on the
  // plateau separately from warm-up and drain.
  // k6 has no built-in current-time per-iteration tag, so we approximate
  // by using `__ITER` and `__VU`. Cleaner option: use scenario.startTime
  // metadata via `exec.scenario` (k6 v0.42+), but tagging by phase here
  // keeps the example simple.
  const elapsedMs = Date.now() - START_MS;
  const phase =
    elapsedMs < 20_000
      ? 'warm-up'
      : elapsedMs < 80_000
        ? 'plateau'
        : elapsedMs < 100_000
          ? 'ramp'
          : elapsedMs < 140_000
            ? 'plateau'
            : 'drain';

  const res = http.get(`${BASE_URL}/lab/jitter?p50=50&p95=200`, {
    tags: { phase },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

// Captured at module load time — k6 evaluates this once per VU on init.
const START_MS = Date.now();
