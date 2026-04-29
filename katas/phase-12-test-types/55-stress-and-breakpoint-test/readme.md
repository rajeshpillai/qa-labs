# Kata 55: Stress and Breakpoint Test

## What You Will Learn

- The difference between **stress test** (find the SLO breaking point) and **breakpoint test** (find the actual failure point)
- The standard staircase pattern: incremental RPS steps with stable plateaus
- How to detect "knee of the curve" — the RPS where latency starts climbing nonlinearly
- Reading a stress-test result: capacity, breakpoint, recovery
- When to **abort early** vs when to keep pushing

## Prerequisites

- Completed [Kata 54 (Load Test)](../54-load-test/)
- The QA Labs server running

## Concepts Explained

### Two related but distinct tests

| | Stress test | Breakpoint test |
|---|---|---|
| **Question** | What's the highest RPS we can handle while still meeting SLOs? | What RPS does the system actually fail at? |
| **What you change** | Slowly ramp RPS upward | Aggressively ramp RPS until something breaks |
| **What you measure** | RPS at which p95 exceeds SLO | RPS at which errors spike or service crashes |
| **End state** | System still alive, just over-SLO | System genuinely degraded — timeouts, 5xx flood, OOM |

The two often run together: a stress test finds the **soft limit** (SLO breach), a breakpoint test continues past it to find the **hard limit** (failure).

### The staircase pattern

```
RPS
1000 │                                       ┌────
     │                                  ┌────┘
 800 │                             ┌────┘
     │                        ┌────┘
 600 │                   ┌────┘
     │              ┌────┘
 400 │         ┌────┘
     │    ┌────┘
 200 │────┘
     └─────────────────────────────────────────────►
        time
```

Each step holds for ~1 minute. Why hold? You need enough samples to compute a stable p95 *at this RPS level* before moving on. Otherwise you can't tell whether p95 climbed because the system is struggling or because the sample size was small.

### Reading the result

After a stress test, your output looks like this (idealized):

```
RPS:    100  200  300  400  500  600  700  800   900  1000
p95:    50   55   60   65   80   140  280  450  9999  9999  ← timeouts
errors:  0    0    0    0    0    0    1%   3%   45%   ~100%
```

Three regions:
- **100–500 RPS**: latency flat, errors ~0. **Capacity headroom.**
- **600–800 RPS**: latency climbing, occasional errors. **Knee of the curve** — system is struggling.
- **900+ RPS**: cascading failure. **Breakpoint.**

### When to abort early

A k6 threshold like `'http_req_failed': ['rate<0.5']` with `abortOnFail: true` will stop the test once half the requests are failing. This is good etiquette — there's no point pushing a system that's already broken.

```javascript
thresholds: {
  'http_req_failed': [{ threshold: 'rate<0.50', abortOnFail: true, delayAbortEval: '30s' }],
},
```

`delayAbortEval` gives a grace period at startup so initial cold-start failures don't trigger the abort.

### What you actually do with the result

Three numbers come out:

1. **Capacity ceiling** — highest RPS where SLO held (e.g., 500 RPS).
2. **Knee** — RPS where p95 starts climbing (e.g., 600 RPS).
3. **Breakpoint** — RPS where the system fails outright (e.g., 900 RPS).

Use them to:
- Set autoscaling thresholds (scale before knee, target capacity ceiling).
- Set rate limits (block traffic above breakpoint, accept above capacity).
- Estimate Black-Friday headroom (capacity ÷ peak production RPS).

### The QA Labs server is too small for a real breakpoint

A Node Express server on a laptop will tap out around a few thousand RPS. The kata uses modest numbers (50 → 500 RPS) — in production, your numbers will be much bigger. The pattern is the same.

## Exercises

1. **Build the staircase.** 8 steps, 50 RPS each, 30s per step, hitting `/lab/jitter?p50=50&p95=200`. At which step does p95 cross 500ms?
2. **Add abort-on-fail.** Set `'http_req_failed': [{ threshold: 'rate<0.10', abortOnFail: true }]`. Does it kick in before you reach the top step?
3. **Find the knee in a slow endpoint.** Repeat with `/lab/slow?ms=300` (already slow at 1 RPS). The knee should appear earlier — why?
4. **Difference between stress and load.** Compare your kata 54 load test result and the same RPS step from this stress test. Same throughput, same endpoint — should produce same p95. Did it?

## Common Mistakes

- **No plateau between steps.** Without holding RPS steady at each step for at least 30s, you can't tell capacity from noise.
- **No abort on fail.** Test runs for 30 minutes against a system that crashed at minute 3. Wastes resources.
- **Reporting only the breakpoint.** "We can handle 900 RPS!" is misleading if SLO breaks at 600. Report capacity (500), knee (600), and breakpoint (900) separately.
- **Comparing stress-test results across different infra sizes.** Doubling the box doesn't necessarily double capacity — depends on bottleneck (CPU, IO, locks).

## Cheat Sheet

| Stage | What you observe | Action |
|-------|------------------|--------|
| Below capacity | Flat p95, 0 errors | "Headroom" — fine for production |
| At capacity | p95 starts to creep | This is your **autoscale-up** signal |
| Knee | p95 climbing, scattered errors | Production should never be here |
| Past knee | Cascading errors | Add rate limit / circuit breaker |
| Breakpoint | Service unusable | Document; test recovery (kata 70) |
