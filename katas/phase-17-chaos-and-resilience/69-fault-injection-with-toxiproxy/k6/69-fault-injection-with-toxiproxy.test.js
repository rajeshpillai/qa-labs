// Kata 69 — Fault Injection (k6 solution)
//
// Two scenarios run sequentially: a "clean" baseline against /lab/echo,
// then a "chaos" phase against /lab/slow + /lab/flaky. Per-phase tagged
// thresholds let us require strict SLO during clean and looser SLO
// during chaos — but assert that error rate during chaos is bounded.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    clean: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '10s',
      preAllocatedVUs: 30,
      exec: 'cleanRequest',
      tags: { phase: 'clean' },
      startTime: '0s',
    },
    chaos: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '15s',
      preAllocatedVUs: 30,
      exec: 'chaosRequest',
      tags: { phase: 'chaos' },
      startTime: '12s',
    },
  },
  thresholds: {
    // Clean phase: tight SLO
    'http_req_duration{phase:clean}': ['p(95)<200'],
    'http_req_failed{phase:clean}': ['rate<0.01'],
    // Chaos phase: looser latency, bounded error rate
    'http_req_duration{phase:chaos}': ['p(95)<800'],
    'http_req_failed{phase:chaos}': ['rate<0.20'],   // <20% failures expected from /lab/flaky
  },
};

export function cleanRequest() {
  const res = http.get(`${BASE_URL}/lab/echo`, { tags: { phase: 'clean' } });
  check(res, { 'clean status is 200': (r) => r.status === 200 });
}

export function chaosRequest() {
  // 50/50 split: slow endpoint (latency) and flaky endpoint (errors).
  // Real Toxiproxy would inject these via toxics on a single endpoint;
  // we simulate via the lab server's built-in chaos endpoints.
  const slowMode = Math.random() < 0.5;
  const url = slowMode
    ? `${BASE_URL}/lab/slow?ms=300`
    : `${BASE_URL}/lab/flaky?errorRate=0.15`;

  const res = http.get(url, {
    tags: { phase: 'chaos', mode: slowMode ? 'latency' : 'errors' },
  });
  check(res, {
    'chaos status acceptable': (r) => r.status === 200 || r.status === 500,
  });
}
