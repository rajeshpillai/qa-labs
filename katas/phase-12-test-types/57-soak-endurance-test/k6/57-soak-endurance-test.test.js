// Kata 57 — Soak / Endurance Test (k6 solution)
//
// Steady production-baseline RPS for an extended duration. Default is
// short (60s) to keep the kata runnable in a workshop; override with
// SOAK_DURATION env var for a real soak:
//
//   SOAK_DURATION=30m k6 run 57-soak-endurance-test.test.js
//   SOAK_DURATION=4h  k6 run 57-soak-endurance-test.test.js
//
// Tags samples by 10-minute slice so per-period thresholds reveal drift.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';
const SOAK_DURATION = __ENV.SOAK_DURATION || '60s';

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-arrival-rate',
      rate: 50,                   // baseline production RPS — NOT peak
      timeUnit: '1s',
      duration: SOAK_DURATION,
      preAllocatedVUs: 30,
      maxVUs: 60,
    },
  },
  thresholds: {
    // Whole-test threshold — catches average degradation
    'http_req_duration': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'],
    // Per-slice threshold — same numbers must hold across the whole run.
    // If slice0 passes but slice2 fails, you have drift.
    'http_req_duration{slice:0}': ['p(95)<300'],
    'http_req_duration{slice:1}': ['p(95)<300'],
    'http_req_duration{slice:2}': ['p(95)<300'],
  },
};

const TEST_START = Date.now();
const SLICE_DURATION_MS = 10 * 60 * 1000; // 10 minutes per slice
let lastCheckpointMin = -1;

function currentSlice() {
  const elapsed = Date.now() - TEST_START;
  return Math.min(Math.floor(elapsed / SLICE_DURATION_MS), 2);
}

export default function () {
  const slice = currentSlice();
  const minute = Math.floor((Date.now() - TEST_START) / 60_000);

  // Periodic checkpoint log so you can grep the run output and see
  // whether each minute started healthy.
  if (minute > lastCheckpointMin && minute % 5 === 0 && __ITER < 5) {
    console.log(`[soak] minute=${minute} slice=${slice}`);
    lastCheckpointMin = minute;
  }

  const res = http.get(`${BASE_URL}/lab/echo`, {
    tags: { slice: String(slice) },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
