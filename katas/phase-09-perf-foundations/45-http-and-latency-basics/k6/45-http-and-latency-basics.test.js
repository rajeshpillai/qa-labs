// Kata 45 — HTTP and Latency Basics (k6 solution)
//
// Run locally:
//   k6 run 45-http-and-latency-basics.test.js
//
// Run against a different host (e.g., the lab server on a different port):
//   K6_BASE_URL=http://localhost:3000 k6 run 45-http-and-latency-basics.test.js
//
// What this test does:
// 1. Makes a single HTTP GET to /lab/echo (a fast baseline endpoint)
// 2. Asserts the response was 200 OK and contained `{ ok: true }`
// 3. Sets a threshold so the test fails if p95 of response time exceeds 200ms
//
// In k6, every test file exports a default function — that's the "iteration".
// k6 calls it repeatedly across virtual users. With `vus: 1, duration: '5s'`
// it runs ~once per millisecond on a fast endpoint. Each iteration's HTTP
// request contributes to the http_req_duration metric.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// `options` configures how k6 runs the test. We're using a tiny smoke test.
export const options = {
  vus: 1,            // 1 virtual user
  duration: '5s',    // for 5 seconds
  thresholds: {
    // p95 of http_req_duration (response time) must be under 200ms.
    // If it's not, k6 exits non-zero — useful for CI.
    http_req_duration: ['p(95)<200'],
    // Less than 1% of requests may fail (HTTP errors)
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Make the request. This counts toward http_reqs and http_req_duration.
  const res = http.get(`${BASE_URL}/lab/echo`);

  // `check()` is k6's per-iteration assertion. Each named check appears in
  // the summary. A check failing does NOT abort the iteration — it just
  // records the failure.
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has ok=true': (r) => r.json('ok') === true,
  });
}
