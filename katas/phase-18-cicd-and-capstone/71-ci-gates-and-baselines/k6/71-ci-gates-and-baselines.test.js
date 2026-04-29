// Kata 71 — CI Gates and Baselines (k6 solution)
//
// A canonical "PR smoke" perf test: 30 seconds, absolute thresholds tied
// to a stated SLO. Designed to run in CI and either pass cleanly or
// fail with a clear threshold-name in the output (the bit your script
// will grep for).
//
// Also writes summary stats that scripts/compare-baseline.js can consume.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// SLO contract: p95 < 250ms, p99 < 500ms, error rate < 0.1%
// CI threshold: 80% of SLO budget for headroom
const SLO_P95_MS = 250;
const SLO_P99_MS = 500;
const SLO_ERROR_RATE = 0.001;

const CI_P95_MS = Math.floor(SLO_P95_MS * 0.8);
const CI_P99_MS = Math.floor(SLO_P99_MS * 0.8);
const CI_ERROR_RATE = SLO_ERROR_RATE;

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 30,
      maxVUs: 60,
    },
  },
  thresholds: {
    // Each named threshold appears in summary.metrics — scripts can grep them.
    'http_req_duration': [
      { threshold: `p(95)<${CI_P95_MS}`, abortOnFail: false },
      { threshold: `p(99)<${CI_P99_MS}`, abortOnFail: false },
    ],
    'http_req_failed': [`rate<${CI_ERROR_RATE}`],
    // Self-documenting: encode the SLO numbers in metric names.
    [`http_req_duration{slo:p95}`]: [`p(95)<${SLO_P95_MS}`],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/lab/echo`, {
    tags: { slo: 'p95', endpoint: 'echo' },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
