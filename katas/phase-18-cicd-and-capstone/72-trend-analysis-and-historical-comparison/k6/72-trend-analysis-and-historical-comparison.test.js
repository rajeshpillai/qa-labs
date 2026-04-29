// Kata 72 — Trend Analysis (k6 solution)
//
// Same shape as kata 71's smoke test — the analytical work happens
// OUTSIDE k6, in scripts that aggregate multiple summary.json files
// over time. See the readme for check-trend.js + the n-of-m pattern.
//
// To produce trend data: run this 5+ times, saving --summary-export
// each time, and feed the resulting JSONs into check-trend.js.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    trend: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 30,
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/lab/echo`);
  check(res, { 'status is 200': (r) => r.status === 200 });
}
