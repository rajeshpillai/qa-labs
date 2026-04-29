# Kata 54: Load Test

## What You Will Learn

- What a **load test** actually measures (as opposed to stress, spike, or soak)
- How to pick the right RPS target — production traffic × headroom factor
- The "warm-up + plateau + drain" pattern as the standard load shape
- Setting **realistic SLO-based thresholds** instead of arbitrary numbers
- Why a passing load test still tells you nothing about your **breakpoint** (that's kata 55)

## Prerequisites

- Completed phase 11 (realistic scenarios, parameterization, auth)
- The QA Labs server running

## Concepts Explained

### Five test types in one phase

This phase has four katas covering five distinct test types. They use similar tooling but answer **different questions**:

| Test type | Question it answers | Kata |
|-----------|---------------------|------|
| **Load** | Does the system meet its SLOs at expected production load? | **54 (this one)** |
| **Stress** | What's the maximum sustainable load before SLOs break? | 55 |
| **Breakpoint** | Where does the system actually fail (crash, timeout)? | 55 |
| **Spike** | What happens when traffic jumps 10× in 30 seconds? | 56 |
| **Soak** | Are there memory leaks / connection leaks under steady load for hours? | 57 |

People run "load tests" without thinking and call any of the above a load test. Each one finds different bugs.

### What a load test is

> **A load test verifies that the system meets its SLOs under expected production traffic.**

It's an **affirmative** test: "Yes, we can handle 500 RPS with p95 < 300ms and < 1% errors." Pass = ship. Fail = either the system regressed or the SLO needs revisiting.

### Picking the load target

Three numbers you need:

1. **Peak production RPS.** From your monitoring (e.g., Grafana, Datadog). Look at the busiest hour of the busiest day in the last 30 days.
2. **Headroom factor.** Usually 1.2–1.5×. You want to handle today's peak *plus* unexpected growth.
3. **Duration.** Long enough to flush warm-up effects and gather statistically meaningful percentiles. **15–30 minutes** is typical; **5 minutes minimum** for a CI variant.

Example: peak is 800 RPS, factor 1.25 → load test at **1000 RPS for 15 minutes**.

### The standard load shape

```
RPS
1000 │              ┌────────────────┐
     │             ╱                  ╲
 800 │            ╱                    ╲
     │           ╱                      ╲
   0 │__________╱                        ╲__________
     └────────────────────────────────────────────►
        warm-up      plateau (assert here)   drain
        ~1 min       ~13 min                  ~1 min
```

- **Warm-up** flushes cold caches, JIT compilation, connection pool. Don't assert on this period.
- **Plateau** is where you assert. Tag this slice and write per-tag thresholds.
- **Drain** ensures graceful shutdown — assert connection-close behavior here.

### SLO-based thresholds

Bad threshold:
```javascript
http_req_duration: ['p(95)<500']  // why 500ms? because it sounded round?
```

Good threshold:
```javascript
// SLO: p95 < 300ms (defined in our service contract)
// Test threshold: 80% of SLO budget (gives headroom for noise)
http_req_duration: ['p(95)<240']
```

Tying the threshold to a defined SLO makes the test result actionable: a breach means the SLO is at risk. Without an SLO, the threshold is opinion.

### Common load-test pitfalls

- **Treating max RPS as the load.** Max RPS is what you find with a stress test (kata 55). Production load is *typical* peak, not max.
- **Asserting on whole-test data including warm-up.** Tag the plateau and assert only on the plateau samples.
- **No `sleep()` in user-flow tests.** Real users have think time. See kata 53.
- **Single-region test against multi-region service.** Make sure your load generator's network path resembles real users.

## Exercises

1. **Build the canonical load test.** 100 RPS, 1-minute warm-up to plateau, 3-minute plateau at 100 RPS, 30s drain. Tag the plateau samples. Threshold: `p(95)<300` on plateau only.
2. **Tighten then break.** Drop the plateau threshold to `p(95)<150`. Run again. Did it pass? If yes, your service is faster than the SLO needs — discuss whether to tighten the SLO or save the headroom.
3. **Add a per-endpoint slice.** Hit two endpoints (`/lab/echo` fast, `/lab/slow?ms=200` deliberately slow) at a 70/30 split. Threshold p95 *separately* per endpoint. Why is whole-test p95 misleading here?
4. **What about the median?** Add `p(50)<50` for `/lab/echo`. Why might you assert both p50 and p95? Hint: a system can have great avg latency but a terrible long tail.

## Common Mistakes

- **Confusing load test with stress test.** Load = "can we handle today's traffic?" Stress = "how much can we handle?"
- **One run is not a benchmark.** Latency varies between runs — establish a baseline by averaging 3+ runs before fighting noise.
- **Tightening thresholds to "make the test feel meaningful."** That's a recipe for flaky CI. Anchor to SLOs.
- **Running load tests in production without coordination.** Real-world consequence: you DOS your own users. Use a load environment that mirrors prod, not prod itself.

## Cheat Sheet

```javascript
// k6 load test skeleton
import { tagWithCurrentStageProfile } from 'k6/execution';  // experimental

export const options = {
  scenarios: {
    realistic_load: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 200,
      stages: [
        { duration: '1m', target: 100 },   // warm-up
        { duration: '3m', target: 100 },   // plateau ← assert here
        { duration: '30s', target: 0 },    // drain
      ],
    },
  },
  thresholds: {
    // Use { aborOnFail: true } in CI to fail fast
    'http_req_duration{phase:plateau}': [{ threshold: 'p(95)<300', abortOnFail: false }],
    'http_req_failed': ['rate<0.01'],
  },
};
```

| Step | Why |
|------|-----|
| Use **open model** (`ramping-arrival-rate`) | Closed model bottlenecks on VU count under slowdown |
| Tag the plateau | Assert only on representative data |
| Threshold ties to SLO | Result is actionable, not opinion |
| Multiple runs for baseline | Single-run data is noise |
