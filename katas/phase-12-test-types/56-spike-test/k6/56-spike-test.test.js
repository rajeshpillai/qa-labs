// Kata 56 — Spike Test (k6 solution)
//
// Single sharp spike: 50 RPS baseline → 500 RPS in 5s → hold 30s → drop
// back to 50 RPS in 5s → recover for 30s. Phase-tagged thresholds let us
// require strict SLO during steady/recovery but allow degradation during
// the spike itself.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// Stage timeline (ms from test start). Used for phase tagging.
const TS = {
  steady_end:    30_000,   // 0–30s: baseline
  ramp_up_end:   35_000,   // 30–35s: sharp ramp
  spike_end:     65_000,   // 35–65s: peak
  ramp_down_end: 70_000,   // 65–70s: drop
  // 70s+ : recovery
};

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '30s', target: 50 },   // steady baseline
        { duration: '5s',  target: 500 },  // sharp ramp up — the spike
        { duration: '30s', target: 500 },  // hold at peak
        { duration: '5s',  target: 50 },   // sharp ramp down
        { duration: '30s', target: 50 },   // recovery
      ],
    },
  },
  thresholds: {
    // Strict during steady — system at baseline must be at SLO
    'http_req_duration{phase:steady}': ['p(95)<300'],
    // Loose during the spike — degradation is expected, errors are not
    'http_req_duration{phase:spike}': ['p(95)<2000'],
    'http_req_failed{phase:spike}': ['rate<0.05'],
    // Recovery: back to baseline SLO. This is the most important threshold —
    // a system that "survives" the spike but never recovers is broken.
    'http_req_duration{phase:recovery}': ['p(95)<300'],
    'http_req_failed{phase:recovery}': ['rate<0.005'],
  },
};

const TEST_START = Date.now();

function currentPhase() {
  const elapsed = Date.now() - TEST_START;
  if (elapsed < TS.steady_end) return 'steady';
  if (elapsed < TS.ramp_up_end) return 'ramp_up';
  if (elapsed < TS.spike_end) return 'spike';
  if (elapsed < TS.ramp_down_end) return 'ramp_down';
  return 'recovery';
}

export default function () {
  const phase = currentPhase();
  const res = http.get(`${BASE_URL}/lab/echo`, { tags: { phase } });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
