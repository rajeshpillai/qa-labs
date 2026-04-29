# Kata 68: Distributed Tracing Correlation

## What You Will Learn

- What **distributed tracing** is and how it relates to load testing
- The **W3C Trace Context** standard: `traceparent` and `tracestate` headers
- How to inject **trace IDs from k6** so load-test requests show up alongside production traces
- The "**find the slow request**" workflow: load test fails → grab trace ID from k6 → open trace in your APM
- Difference between **trace propagation** (header passing) and **trace generation** (creating the IDs)
- Patterns for injecting OpenTelemetry-compatible headers in k6 / Artillery

## Prerequisites

- Completed [Kata 67 (Grafana + Prometheus)](../67-grafana-and-prometheus/)
- Familiarity with **distributed tracing concepts** (spans, traces, parent/child relationships)
- The QA Labs server running — exposes `/lab/headers` which echoes back received request headers (for verifying propagation)

## Concepts Explained

### What's distributed tracing?

A **trace** is a record of a single request as it flows through multiple services. Each service contributes a **span** to the trace. The full trace tells you:

- Which services were involved
- How long each took
- Which one was slow
- What errors propagated

Tools: **OpenTelemetry** (the standard), **Jaeger** / **Tempo** (storage), **Grafana** / **Honeycomb** / **Datadog** (UI).

### Why this matters in load testing

When your test reports "p99 was 2 seconds, p50 was 50ms," **the slow requests are different requests from the fast ones**. Aggregated metrics tell you *that* there's a tail; they don't tell you *what's causing it*.

If your k6 test passes a trace ID with each request, you can:

1. Run the load test
2. See which iterations were slow (in the test output or Grafana)
3. Look up those specific trace IDs in your APM (Tempo / Jaeger / Datadog)
4. See the full span tree for that exact request — find the bottleneck

This is the **bridge between load testing and APM**.

### W3C Trace Context

The standard format. Two headers:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  │                                │                │
             │  │                                │                └─ flags (sampled, etc.)
             │  │                                └─ parent span id
             │  └─ trace id (16 bytes hex)
             └─ version

tracestate: rojo=00f067aa0ba902b7,congo=t61rcWkgMzE
            └─ vendor-specific extensions (optional)
```

Most APMs honor this format; many also accept legacy `X-Trace-Id` / `X-B3-TraceId` (Zipkin's B3 format).

### Injecting trace IDs from k6

```javascript
function makeTraceparent() {
  // Generate 16 random bytes for trace id, 8 for parent span id.
  const hex = (n) => Array.from({ length: n }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
  const traceId = hex(32);    // 16 bytes
  const spanId = hex(16);     //  8 bytes
  return { traceparent: `00-${traceId}-${spanId}-01`, traceId };
}

const { traceparent, traceId } = makeTraceparent();
const res = http.get(url, {
  headers: { traceparent },
  tags: { trace_id: traceId },  // also tag the metric so we can find it
});
```

Now every request in your load test:
- Sends a unique `traceparent` header — the server creates a span linked to it
- Tags the k6 metric with `trace_id` — you can find the slow ones in your output

### Pattern: log slow trace IDs

Combine k6 metrics with the trace IDs:

```javascript
const start = Date.now();
const res = http.get(url, { headers: { traceparent }, tags: { trace_id: traceId } });
const duration = Date.now() - start;

if (duration > 1000) {
  // Print the slow trace ID — paste into your APM to see what happened
  console.warn(`slow request: trace_id=${traceId} duration=${duration}ms url=${url}`);
}
```

In CI, scrape these warn lines. The slow trace IDs are your debug starting points.

### The QA Labs `/lab/headers` endpoint

To verify your trace headers actually reach the server, the lab server exposes:

```
GET /lab/headers
→ { receivedHeaders: { ... your headers ... }, serverTraceId: "<id>", ts: <ts> }
```

Send a `traceparent` header → the response includes it back so you can confirm propagation.

### Realistic perf-test + APM workflow

```
1. Run load test                       k6 → server (with trace IDs)
                                            │
                                       (server emits spans)
                                            │
2. Test fails: p99 = 2s                Grafana
                                            │
                                       (you click on slow request)
                                            │
3. Click trace ID → APM                Tempo / Jaeger
                                            │
                                       (you see the slow span)
                                            │
4. "Database query took 1.8s"         You file a bug.
```

Without trace ID propagation in step 1, step 3 isn't possible.

### Sampling

In production APMs, you typically sample only a small fraction of traces (1%, 0.1%) for cost reasons. In load tests, **sample every request** — the whole point is to investigate later. The `traceparent` flags field controls this:

- `00` = not sampled (won't be stored)
- `01` = sampled (will be stored)

For load tests: always send `01`.

### k6 has experimental built-in tracing

k6's experimental `k6/x/tracing` extension can auto-inject W3C trace headers without manual code:

```javascript
import tracing from 'k6/experimental/tracing';

const httpWithTracing = tracing.instrumentHTTP({
  propagator: 'w3c',
});

httpWithTracing.get(url);  // automatically gets traceparent
```

Available in k6 v0.45+. The kata uses manual injection so you understand what's happening; once you do, the `instrumentHTTP` shortcut is fine.

### Artillery tracing

Artillery has the [`artillery-plugin-fake-data`](https://www.artillery.io/docs/reference/plugins/fake-data) and various plugins, plus `engine-http`'s `beforeRequest` hook for header injection. Less first-class than k6's experimental support.

## Exercises

1. **Verify propagation.** Send a `traceparent` header to `/lab/headers`, parse the response. Does `receivedHeaders.traceparent` match what you sent?
2. **Generate unique trace IDs per iteration.** Use the `makeTraceparent()` helper from the cheat sheet. Run a 30s test against `/lab/jitter?p50=50&p95=500`. How many unique trace IDs did you generate?
3. **Find the slow ones.** Add the slow-warning logic from above. After a run, grep stdout for `slow request:`. How many slow trace IDs did you log?
4. **Use `instrumentHTTP` (experimental).** Replace your manual injection with `import tracing from 'k6/experimental/tracing'`. Does the response from `/lab/headers` still show propagation?
5. **Combine with Grafana (kata 67).** Run the test with Prometheus output AND tag-based trace IDs. In Grafana, filter by `trace_id` for slow requests — does the dashboard let you click through to a specific trace?

## Common Mistakes

- **Forgetting the flags byte.** `00-{trace}-{span}-00` (last byte 00) means "not sampled" — your APM won't store it. Use `01`.
- **Reusing trace IDs across iterations.** Each request should have its own. Otherwise you can't disambiguate which iteration was slow.
- **Tagging by trace_id in metric tags.** This is the cardinality explosion warned about in kata 66 — every request has its own trace, every trace creates a series. Don't tag your metric this way; *log* the IDs instead.
- **Sampling at 1% in load tests.** Defeats the purpose. Always sample 100% during load testing.
- **Using B3 in modern stacks.** Most modern APMs prefer W3C `traceparent` over Zipkin's `X-B3-TraceId`. Send both for safety, but lead with W3C.

## Cheat Sheet

```javascript
// Generate W3C traceparent
function newTraceparent() {
  const hex = (n) => Array.from({ length: n }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
  const traceId = hex(32);
  const spanId = hex(16);
  return {
    header: `00-${traceId}-${spanId}-01`,
    traceId,
    spanId,
  };
}

// Apply per-request
const tp = newTraceparent();
const res = http.get(url, {
  headers: { traceparent: tp.header },
});

if (res.timings.duration > 1000) {
  console.warn(`slow: trace_id=${tp.traceId} url=${url}`);
}
```

| Header | Standard | Use |
|--------|----------|-----|
| `traceparent` | W3C | Modern default, OpenTelemetry-native |
| `tracestate` | W3C | Vendor extensions (optional) |
| `X-B3-TraceId` | Zipkin | Legacy services / B3-only systems |
| `X-Request-Id` | Convention | Request-level correlation, not trace-level |

| Pattern | Where it lives |
|---------|----------------|
| Inject `traceparent` | k6 test code |
| Pass through services | Server-side OpenTelemetry SDK |
| Store traces | Tempo / Jaeger / vendor APM |
| Visualize | Grafana / Datadog / Honeycomb |
| Find from k6 output | Log slow trace IDs to stdout / metrics |
