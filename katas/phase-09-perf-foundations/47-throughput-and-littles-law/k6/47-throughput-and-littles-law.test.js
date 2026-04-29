// Kata 47 — Throughput and Little's Law (k6 solution)
//
// Demonstrates open-model load using `constant-arrival-rate`. We TARGET
// 200 RPS against a 100ms endpoint. Little's Law says we'll need
// L = λ × W = 200 × 0.1 = 20 in-flight requests on average — so 40
// preAllocatedVUs gives us 2× headroom for jitter.
//
// Try changing the URL to /lab/slow?ms=600 and watch the test struggle to
// hit the 200 RPS target — that's queueing, exactly as Little's Law predicts.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    steady_rps: {
      executor: 'constant-arrival-rate',
      rate: 200,                  // 200 requests per second...
      timeUnit: '1s',             // ...per second
      duration: '15s',
      preAllocatedVUs: 40,        // worker pool: enough for L=20 + headroom
      maxVUs: 80,
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'],
    // The test should hit at least 95% of the target throughput.
    // (200 RPS × 15s = 3000 expected; allow some slack for ramp.)
    'http_reqs': ['count>2700'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/lab/slow?ms=100`);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
