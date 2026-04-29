# Kata 70: Retry Storms and Circuit Breakers

## What You Will Learn

- Why **naive retries make outages worse** — the math of retry amplification
- How a **retry storm** turns 5% errors into 50% load amplification
- The three retry policies: **fixed**, **linear**, **exponential with jitter** (you saw this in kata 63)
- **Circuit breakers**: closed → open → half-open state machine
- The **retry budget** pattern — cap total retries, not per-request
- How to test that your client implements these correctly

## Prerequisites

- Completed [Kata 63 (Rate Limit Handling)](../../phase-14-apis-and-websockets/63-rate-limit-handling/) — backoff fundamentals
- Completed [Kata 69 (Fault Injection)](../69-fault-injection-with-toxiproxy/) — chaos primitives
- The QA Labs server running

## Concepts Explained

### The retry-storm math

Suppose your service has 3 retries on failure (no backoff). Backend is healthy: every request succeeds, no retries fire. Total load = base load.

Backend starts failing 50% of the time. Each request on average takes 2 attempts before succeeding (1 initial + 1 retry). **Total load doubles.**

Backend fails 90%. Average attempts = 4 (1 + 0.9 × (1 + 0.9 × (1 + 0.9 × 1))). **Total load 4×.**

Backend fully down (100% failure). Every request retries 3 times before giving up. **Total load 4×** with zero work done.

This is the **retry-amplification curve**: as failures rise, load rises faster, which causes more failures, which causes more load. Death spiral.

### What stops a retry storm

Three patterns, used together:

#### 1. Exponential backoff with jitter

Already covered in kata 63. Spreads retries over time, breaks synchronization. **Always do this.**

#### 2. Bounded retry budget

Instead of "retry up to 3 times per request," use "retry up to 10% of total request volume":

```
allowedRetries = totalSuccessfulRequests * 0.1
```

Once you hit the budget, **stop retrying for the next window**. Implementations: token bucket on retry side, leaky bucket of "retry quota."

This caps amplification at 1.1× even under 100% backend failure.

#### 3. Circuit breaker

A state machine in front of the dependency:

```
                    ┌─────────────┐
              ┌────►│   CLOSED    │  ← normal: requests pass through
              │     │ (forwarding)│
              │     └──────┬──────┘
              │            │
              │   N consecutive failures
              │            │
              │            ▼
              │     ┌─────────────┐
              │     │    OPEN     │  ← failing fast: short-circuit, no calls
              │     │ (rejecting) │
              │     └──────┬──────┘
              │            │
              │       cooldown timer
              │            │
              │            ▼
              │     ┌─────────────┐
              └─────│  HALF-OPEN  │  ← probing: let one through, see if alive
   one success      │  (probing)  │
                    └─────────────┘
                          │
                     one failure
                          │
                          ▼
                       (back to OPEN)
```

When the breaker is OPEN, your service immediately returns an error (or fallback) **without calling the failing dependency at all**. This:
- Stops amplifying load on the broken backend
- Lets the backend recover without being hammered
- Returns a fast error to the client (better than a 30s timeout)

After a cooldown (typically 5-30s), the breaker goes HALF-OPEN: one probe request goes through. Success → CLOSED. Failure → back to OPEN.

### Testing client-side resilience

You're testing not "does the rate limit work" (kata 63) but "does my client behave well when things break." The pattern:

1. Inject failures (kata 69)
2. Run client-driven load
3. Assert: client doesn't amplify load beyond budget
4. Assert: failures fail fast once breaker opens (latency goes DOWN, not up)

A naive retry implementation will fail #3. A breaker-less implementation will fail #4.

### Implementing a circuit breaker in test code

```javascript
// Module-scope state shared across iterations of one VU
let breakerState = 'closed';   // 'closed' | 'open' | 'half-open'
let consecutiveFailures = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 5000;

function callWithBreaker(url) {
  const now = Date.now();
  if (breakerState === 'open') {
    if (now - lastFailureTime > COOLDOWN_MS) {
      breakerState = 'half-open';  // probe time
    } else {
      return null;  // short-circuit — don't even try
    }
  }
  const res = http.get(url);
  if (res.status === 200) {
    consecutiveFailures = 0;
    breakerState = 'closed';
  } else {
    consecutiveFailures++;
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      breakerState = 'open';
      lastFailureTime = now;
    }
  }
  return res;
}
```

In real apps you'd use a library: **Polly** (.NET), **Resilience4j** (Java), **opossum** (Node.js), **resilient-bench** (Go). Same pattern.

### What metrics tell the story

In a chaos test with retries + breaker, watch:

| Metric | Healthy story | Storm story |
|--------|--------------|-------------|
| Total HTTP requests | Stable | Climbing as backend degrades |
| Retry count | Bounded by budget | Unbounded |
| Breaker state | Cycles closed → half-open | Stuck open |
| p95 of fast-failed (breaker rejects) | Low (< 5ms) | N/A |
| Error rate seen by client | Drops to "fast errors" once open | Times out then errors |

The transition where breaker opens should be **visible**: latency drops sharply (no more waiting for the slow backend), error rate stays high but stable.

## Exercises

1. **Naive retry baseline.** Run a 30s test against `/lab/flaky?errorRate=0.5`. Each iteration retries up to 3 times on failure. What's `http_reqs` count? Compare to a 0% error baseline.
2. **Add backoff.** Same test, but exponential backoff between retries. Did it reduce total request volume? Did p95 increase?
3. **Add a budget.** Allow at most 1 retry per 5 successful requests. Track via Counter. Does the budget kick in?
4. **Implement the breaker.** Module-level state, FAILURE_THRESHOLD=5. After breaker opens, all requests fast-fail. Plot per-second `http_reqs` (in Grafana, kata 67) and watch for the discontinuity.
5. **Compare three implementations** under `/lab/flaky?errorRate=0.7`: (a) naive retries, (b) backoff, (c) breaker. Which preserves the most useful work?

## Common Mistakes

- **Treating retries as "free."** Each retry is a real request. Multiplied across 1000 RPS and 50% errors = a lot of wasted work.
- **No budget.** Even with backoff, infinite retries amplify load.
- **Breaker thresholds too aggressive.** Opening on 1 failure = breaker constantly opens during normal jitter. Use 5+ consecutive failures.
- **Breaker thresholds too lax.** Opening on 100 consecutive failures means amplification has long since happened.
- **No cooldown.** Half-open immediately = breaker opens and closes constantly under flapping backend.
- **Retry on 4xx.** 4xx means client error — retrying won't help. Retry only 5xx and timeouts.

## Cheat Sheet

```javascript
// VU-level circuit breaker
let state = 'closed', fails = 0, openedAt = 0;
const THRESHOLD = 5, COOLDOWN_MS = 5000;

function call(url) {
  if (state === 'open' && Date.now() - openedAt < COOLDOWN_MS) {
    breakerRejects.add(1);
    return { status: 0, fastFail: true };
  }
  if (state === 'open') state = 'half-open';

  const res = http.get(url);
  if (res.status >= 200 && res.status < 300) {
    fails = 0;
    state = 'closed';
  } else {
    fails++;
    if (fails >= THRESHOLD) { state = 'open'; openedAt = Date.now(); }
  }
  return res;
}
```

| Config | Typical |
|--------|---------|
| Retry attempts | 1-3 (per request) |
| Retry budget | 10% of successful traffic |
| Backoff base | 100-500ms |
| Backoff factor | 2× |
| Jitter | ± 25% |
| Breaker threshold | 5 consecutive failures |
| Breaker cooldown | 5-30 seconds |
| Max timeout per attempt | 1-5s |

| Don't retry on | Why |
|----------------|-----|
| 4xx (except 429) | Client error — won't change |
| 200 with payload error | App-level error, not transport |
| Non-idempotent operations | Risk of duplicate side effects |
