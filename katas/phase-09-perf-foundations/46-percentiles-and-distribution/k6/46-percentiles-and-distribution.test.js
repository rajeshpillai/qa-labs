// Kata 46 — Percentiles and Distribution (k6 solution)
//
// Hits /lab/jitter which simulates a real-world distribution: 95% of requests
// land between p50 and p95, but 5% are tail events well past p95. The
// thresholds below assert on multiple percentiles — try changing the URL
// query string to see which threshold breaks first.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// Server-side latency distribution. The lab server samples from this when
// responding. We want our thresholds to be slightly tighter than what the
// server promises so a real regression breaks them.
const LAB_P50_MS = 50;
const LAB_P95_MS = 400;

export const options = {
  vus: 5,
  duration: '15s',  // longer = more samples = stabler tail percentiles
  thresholds: {
    'http_req_duration': [
      'p(50)<100',   // typical user: under 100ms
      'p(95)<600',   // 95% of users: under 600ms (LAB_P95_MS plus headroom)
      'p(99)<1500',  // tail: under 1.5s
    ],
    'http_req_failed': ['rate<0.01'],
    // Custom threshold: max latency observed should not exceed 2s,
    // otherwise something is *really* wrong.
    'http_req_duration{kind:max}': ['max<2000'],
  },
};

export default function () {
  const res = http.get(
    `${BASE_URL}/lab/jitter?p50=${LAB_P50_MS}&p95=${LAB_P95_MS}`,
    { tags: { kind: 'max' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has latencyMs field': (r) => typeof r.json('latencyMs') === 'number',
  });
}
