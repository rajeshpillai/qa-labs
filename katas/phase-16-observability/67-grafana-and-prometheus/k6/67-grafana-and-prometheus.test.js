// Kata 67 — Grafana + Prometheus Integration
//
// This script is the same shape as kata 66 — the magic is in HOW you run
// it, not what's in the file. To stream live metrics to your local
// Prometheus + Grafana stack:
//
//   docker compose up -d
//   K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
//   K6_PROMETHEUS_RW_TREND_STATS=p(50),p(95),p(99),avg,min,max \
//   k6 run --out experimental-prometheus-rw 67-grafana-and-prometheus.test.js
//
// Then open http://localhost:3001 (Grafana) and import dashboard 19665.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

const ENDPOINTS = [
  { url: `${BASE_URL}/lab/echo`, name: 'echo' },
  { url: `${BASE_URL}/lab/slow?ms=200`, name: 'slow_200' },
  { url: `${BASE_URL}/lab/jitter?p50=80&p95=300`, name: 'jitter' },
  { url: `${BASE_URL}/lab/limit`, name: 'rate_limited' },
];

export const options = {
  scenarios: {
    realistic_mix: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 30,
      maxVUs: 100,
      stages: [
        { duration: '15s', target: 30 },   // ramp up
        { duration: '30s', target: 30 },   // plateau
        { duration: '10s', target: 0 },    // drain
      ],
    },
  },
  thresholds: {
    'http_req_duration{endpoint:echo}': ['p(95)<200'],
    'http_req_duration{endpoint:slow_200}': ['p(95)<400'],
    'http_req_duration{endpoint:jitter}': ['p(95)<800'],
    // No threshold on rate_limited — we WANT to see 429s in the dashboard.
    'http_req_failed{endpoint:echo}': ['rate<0.01'],
  },
};

export default function () {
  const ep = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const res = http.get(ep.url, {
    tags: {
      endpoint: ep.name,
      // Status class makes for great dashboard splits — query by `status_class:5xx`.
      // We can't tag based on response status before the request, so this stays
      // generic; Prometheus auto-derives from the `status` tag k6 already sets.
    },
  });
  check(res, {
    'status acceptable (200 or 429)': (r) => r.status === 200 || r.status === 429,
  });
}
