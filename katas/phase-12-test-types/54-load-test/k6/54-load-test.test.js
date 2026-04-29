// Kata 54 — Load Test (k6 solution)
//
// Canonical load shape: ramp → plateau → drain.
// Asserts SLO-aligned thresholds against the plateau slice only,
// excluding warm-up samples that would distort percentiles.
//
// Total runtime ~2.5 min. Increase plateau duration in real CI.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// SLO definitions — tied to a (hypothetical) service contract.
// In a real project, these come from your service's published SLO.
const SLO_P95_MS = 300;
const SLO_ERROR_RATE = 0.01;

// Test thresholds use 80% of SLO budget for headroom.
const TEST_P95_MS = Math.floor(SLO_P95_MS * 0.8);

export const options = {
  scenarios: {
    realistic_load: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: '20s', target: 100 },  // warm-up: 0 → 100 RPS
        { duration: '90s', target: 100 },  // plateau: 100 RPS sustained ← assert here
        { duration: '20s', target: 0 },    // drain
      ],
    },
  },
  thresholds: {
    // Whole-test threshold: more generous, accounts for warm-up and drain.
    'http_req_duration': [`p(95)<${SLO_P95_MS * 1.5}`],
    // Plateau-only threshold: tight, SLO-aligned.
    [`http_req_duration{phase:plateau}`]: [`p(95)<${TEST_P95_MS}`],
    'http_req_failed': [`rate<${SLO_ERROR_RATE}`],
  },
};

const TEST_START_MS = Date.now();
const WARMUP_END_MS = 20_000;
const PLATEAU_END_MS = WARMUP_END_MS + 90_000;

function currentPhase() {
  const elapsed = Date.now() - TEST_START_MS;
  if (elapsed < WARMUP_END_MS) return 'warmup';
  if (elapsed < PLATEAU_END_MS) return 'plateau';
  return 'drain';
}

export default function () {
  const phase = currentPhase();
  // Mix of endpoints: 70% fast (/lab/echo), 30% slow (/lab/jitter)
  // — represents a typical traffic mix, not a single endpoint.
  const url =
    Math.random() < 0.7
      ? `${BASE_URL}/lab/echo`
      : `${BASE_URL}/lab/jitter?p50=80&p95=200`;

  const res = http.get(url, { tags: { phase } });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
