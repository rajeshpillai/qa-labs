// Kata 66 — Streaming Metrics (k6 solution)
//
// Demonstrates rich tagging that survives the round-trip to a time-series
// DB. Run with `--out json=run.json` to capture the per-data-point stream.
// Run with `--out experimental-prometheus-rw` to stream to Prometheus.
//
// Three deliberate tag dimensions show how to slice metrics by category
// without exploding cardinality.

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// Simulated traffic mix — three endpoint categories, three "regions",
// three user types. Total cardinality 3 × 3 × 3 = 27 time series.
const ENDPOINTS = [
  { url: `${BASE_URL}/lab/echo`, name: 'echo' },
  { url: `${BASE_URL}/lab/slow?ms=100`, name: 'slow_100' },
  { url: `${BASE_URL}/lab/jitter?p50=50&p95=200`, name: 'jitter' },
];
const REGIONS = ['us-east', 'eu-west', 'ap-south'];
const USER_TYPES = ['guest', 'free', 'paid'];

export const options = {
  scenarios: {
    streaming: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 30,
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    // Per-endpoint thresholds — possible because the `endpoint` tag is set.
    'http_req_duration{endpoint:echo}': ['p(95)<200'],
    'http_req_duration{endpoint:slow_100}': ['p(95)<400'],
    'http_req_duration{endpoint:jitter}': ['p(95)<800'],
  },
};

export default function () {
  // Pick one of each dimension at random — bounded cardinality.
  const ep = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const userType = USER_TYPES[Math.floor(Math.random() * USER_TYPES.length)];

  const res = http.get(ep.url, {
    tags: {
      endpoint: ep.name,
      region,
      user_type: userType,
    },
  });

  // Note: deliberately NOT tagging by request ID. That would create one
  // time series per request — kills Prometheus.
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
