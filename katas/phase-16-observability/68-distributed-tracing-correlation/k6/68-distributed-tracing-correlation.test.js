// Kata 68 — Distributed Tracing Correlation
//
// Generates a fresh W3C traceparent per request, sends it to /lab/headers
// (which echoes it back so we can verify propagation), and logs slow
// trace IDs so they can be looked up in an APM.

import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

const slowTraces = new Counter('slow_trace_ids_logged');
const propagationOk = new Counter('trace_propagation_verified');
const traceLatency = new Trend('trace_endpoint_latency_ms', true);

export const options = {
  scenarios: {
    traced: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '15s',
      preAllocatedVUs: 20,
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'trace_propagation_verified': ['count>50'],
    // Aligned with the lab endpoint's configured jitter (p95=400ms)
    // plus modest network overhead. Setting tighter would be aspiration,
    // not measurement.
    'trace_endpoint_latency_ms': ['p(95)<600'],
  },
};

// Build a W3C traceparent: version=00, trace_id=16 bytes hex, span_id=8 bytes hex, flags=01 (sampled)
function newTraceparent() {
  const hex = (n) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const traceId = hex(32);
  const spanId = hex(16);
  return {
    header: `00-${traceId}-${spanId}-01`,
    traceId,
    spanId,
  };
}

export default function () {
  const tp = newTraceparent();

  // Hit a slow-ish endpoint for some realistic latency variance.
  // Use /lab/jitter so some requests cross the "slow" threshold.
  const start = Date.now();
  const res = http.get(`${BASE_URL}/lab/jitter?p50=50&p95=400`, {
    headers: {
      traceparent: tp.header,
      'x-trace-id': tp.traceId,  // legacy fallback
    },
    // NOTE: deliberately NOT tagging metric by trace_id — that's the
    // cardinality-explosion antipattern. Log slow ones to stdout instead.
  });
  const duration = Date.now() - start;
  traceLatency.add(duration);

  if (duration > 700) {
    // Log slow trace IDs — these are your APM jump-off points.
    console.warn(`slow: trace_id=${tp.traceId} duration=${duration}ms`);
    slowTraces.add(1);
  }

  // Verify propagation by hitting /lab/headers (which echoes back).
  // Real production code wouldn't hit two endpoints — this is just to
  // demonstrate the propagation pattern works end-to-end.
  const verify = http.get(`${BASE_URL}/lab/headers`, {
    headers: { traceparent: tp.header, 'x-trace-id': tp.traceId },
  });

  const echoed = verify.json('receivedHeaders');
  // The lab server lowercases header names (Express convention).
  if (echoed?.['traceparent'] === tp.header) {
    propagationOk.add(1);
  }

  check(res, { 'status is 200': (r) => r.status === 200 });
  check(verify, { 'verify status is 200': (r) => r.status === 200 });
}
