# Kata 50: Custom Metrics

## What You Will Learn

- The four built-in metric types in k6: **Counter**, **Gauge**, **Rate**, **Trend** — and when to use each
- How to define and record a custom metric from inside test code
- How custom metrics interact with **thresholds** (you can assert on your own metrics)
- Tagging metrics for slice-and-dice analysis
- How Artillery's `expect`/`capture` differs (it doesn't have user-defined metrics in the same way)

## Prerequisites

- Completed [Kata 48 (Smoke Test)](../48-smoke-test/) and [Kata 49 (Ramping)](../49-ramping-vus-and-stages/)
- The QA Labs server running

## Concepts Explained

### Why custom metrics?

The built-in metrics (`http_req_duration`, `http_reqs`, etc.) tell you *what k6 saw at the HTTP layer*. Custom metrics tell you *what your test logic measured*. Examples:

- "Time from login click to dashboard render" — spans multiple requests
- "Cart-abandonment ratio" — derived from your scenario logic
- "Bytes processed per request" — extracted from response body
- "How many users hit the rate limit" — counter incremented when you see a 429

Without custom metrics, you'd have to post-process logs. With them, k6 streams the values into the same threshold/summary machinery as the built-ins.

### The four metric types

#### `Counter` — monotonically increasing total

```javascript
import { Counter } from 'k6/metrics';
const rateLimitHits = new Counter('rate_limit_hits');

// inside test:
if (res.status === 429) rateLimitHits.add(1);
```

Summary shows `count` and `rate`. Use for **counting events**: errors, retries, cache misses.

#### `Gauge` — last value wins

```javascript
import { Gauge } from 'k6/metrics';
const queueDepth = new Gauge('queue_depth');

queueDepth.add(res.json('queue_depth')); // overwrites
```

Summary shows `min`, `max`, last `value`. Use for **point-in-time snapshots**: queue size, active sessions.

#### `Rate` — boolean true/false ratio

```javascript
import { Rate } from 'k6/metrics';
const successRate = new Rate('successful_logins');

successRate.add(res.status === 200);  // boolean
```

Summary shows `rate` (0.0–1.0). Use for **success ratios**: "X% of logins succeeded."

#### `Trend` — full distribution

```javascript
import { Trend } from 'k6/metrics';
const loginDuration = new Trend('login_duration_ms', true); // true = time

loginDuration.add(res.timings.duration);
```

Summary shows `min`, `max`, `avg`, `med`, `p(90)`, `p(95)`, `p(99)`. Use for **measurements that have a distribution**: custom timings, byte sizes.

### Thresholds on custom metrics

The killer feature: thresholds work on custom metrics same as built-ins.

```javascript
export const options = {
  thresholds: {
    'login_duration_ms': ['p(95)<300'],
    'successful_logins': ['rate>0.99'],
    'rate_limit_hits': ['count<5'],
  },
};
```

This means you can write business-meaningful assertions: "p95 of the login flow must be under 300ms" or "fewer than 5 rate-limit hits in the whole test."

### Tagging custom metrics

Tags let you slice metrics by dimension. Useful when one metric is recorded across multiple paths:

```javascript
loginDuration.add(res.timings.duration, { provider: 'oauth' });
loginDuration.add(res.timings.duration, { provider: 'password' });

// threshold can target a specific tag:
'login_duration_ms{provider:oauth}': ['p(95)<200'],
```

### Artillery doesn't have this

Artillery 2.x has plugins (`metrics-by-endpoint`) and `capture`/`expect`, but not the same first-class custom-metric system. For Artillery, the equivalent is:

```yaml
- get:
    url: "/api/login"
    capture:
      - json: "$.duration_ms"
        as: "loginMs"
    expect:
      - statusCode: 200
```

You can use `capture` to extract values, but they're per-request snapshots, not aggregated metrics. For meaningful custom-metric workflows, **k6 wins** — this is a common reason teams pick k6 over Artillery.

## Exercises

1. **Track auth-flow latency end-to-end.** Make a request to `/lab/auth/login` then `/lab/auth/me`. Record a `Trend` named `auth_flow_total_ms` that captures the *sum* of both request durations. Set a threshold of `p(95)<400`.
2. **Count rate-limit hits.** Hit `/lab/limit` at 50 RPS for 10 seconds. Define a `Counter` for 429 responses and assert `count<400` (you'll exceed it because the limit is 5/sec).
3. **Compute a success rate.** Hit `/lab/flaky?errorRate=0.1` 100 times. Track success rate via a `Rate` metric. Assert `rate>0.85`.
4. **Tag by status code class.** Record a `Trend` of response sizes tagged with `class:2xx` / `class:4xx` / `class:5xx`. Threshold only on the 2xx class.

## Common Mistakes

- **Counter when you want Trend.** `Counter` only counts events; it can't tell you the latency distribution. If you want percentiles, use `Trend`.
- **Forgetting `true` flag on Trend for time values.** `new Trend('foo')` shows raw numbers; `new Trend('foo', true)` formats as ms in the summary.
- **Defining metrics inside the default function.** Create them at module scope. Otherwise k6 creates a new metric each iteration and nothing aggregates.
- **Asserting before the metric has data.** A threshold on a custom metric that's never recorded will show `no data`; some test runners treat that as a failure, others as a pass.

## Cheat Sheet

| Want to track... | Type | Why |
|------------------|------|-----|
| "How many times X happened" | `Counter` | Just a tally |
| "What's the current value of Y" | `Gauge` | Point-in-time |
| "What % of Z events were successful" | `Rate` | Boolean ratio |
| "How long does op W take" | `Trend(name, true)` | Distribution |

| Threshold syntax | Meaning |
|------------------|---------|
| `'metric_name': ['p(95)<300']` | 95th percentile under 300 |
| `'metric_name': ['rate>0.99']` | Rate (success) over 99% |
| `'metric_name': ['count<10']` | Counter total under 10 |
| `'metric_name{tag:value}': [...]` | Threshold on tagged subset only |
