# Kata 49: Ramping VUs and Stages

## What You Will Learn

- Why a flat constant load misses real-world bugs
- How to use **stages** in k6 (and **phases** in Artillery) to ramp users up and down
- Three classic shapes: **gradual ramp**, **sustained plateau**, **graceful drain**
- The difference between `ramping-vus` (closed model) and `ramping-arrival-rate` (open model) — and when to pick each
- How ramp shape affects what bugs you find

## Prerequisites

- Completed [Kata 47 (Throughput and Little's Law)](../../phase-09-perf-foundations/47-throughput-and-littles-law/) — closed vs open workload
- The QA Labs server running

## Concepts Explained

### Why ramps matter

Real traffic doesn't appear all at once. Customers wake up, marketing emails fire, a viral tweet hits — load builds and recedes. A flat "100 VUs for 5 minutes" test misses two whole categories of bug:

1. **Cold-start bugs** — slow connection-pool warm-up, lazy DB index, JIT warm-up. A flat test with `vus: 100, duration: '5m'` punishes the system harder at the start than at the end. A ramp gives the system a fair chance to settle.

2. **Drain bugs** — what happens when traffic recedes? Stale connections, leaked goroutines, half-closed sockets. A test that ends abruptly never exercises drain. A ramp-down does.

### Stages in k6

A "stage" is `{ duration, target }` — k6 linearly interpolates VUs from the *current* count to `target` over `duration`.

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // ramp 0 → 50 over 30s
    { duration: '2m',  target: 50 },   // hold at 50 for 2m
    { duration: '30s', target: 100 },  // ramp 50 → 100 over 30s
    { duration: '2m',  target: 100 },  // hold at 100 for 2m
    { duration: '30s', target: 0 },    // ramp down 100 → 0 over 30s
  ],
};
```

Total duration: 5min 30s. Three classic patterns visible: **ramp**, **plateau**, **drain**.

### Stages: closed vs open

`stages` defaults to closed model (target VU count). For open model, use `executor: 'ramping-arrival-rate'` with `stages` having `target` as RPS:

```javascript
export const options = {
  scenarios: {
    realistic: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 200,
      stages: [
        { duration: '30s', target: 100 },  // 0 → 100 RPS
        { duration: '2m',  target: 100 },  // hold 100 RPS
        { duration: '30s', target: 0 },    // drain
      ],
    },
  },
};
```

### Phases in Artillery

Artillery's `phases` are similar but use **arrival rate** by default (open model — better for most use cases):

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 30
      arrivalRate: 1
      rampTo: 50
      name: "warm-up"
    - duration: 120
      arrivalRate: 50
      name: "plateau"
    - duration: 30
      arrivalRate: 50
      rampTo: 0
      name: "drain"
```

`arrivalRate` is the start rate, `rampTo` is the end rate. Without `rampTo`, the rate is constant for the phase.

### Pitfalls

**Ramp too steep.** Going from 0 → 1000 VUs in 1 second is a *spike*, not a ramp. Spike tests have their own kata (54 in phase 12); a normal ramp should take at least 30s per 100 VU step.

**No drain.** Ending the test with the system at full load and immediately killing the test misses graceful-shutdown bugs. Always include a drain step.

**Ignoring the warm-up window.** Don't include the first 30s of latency data in your assertions — caches are cold, JITs aren't warm. Either drop those samples or assert only on the plateau period using `tags`.

## Exercises

1. **Build a 5-minute ramp test** against `/lab/jitter?p50=50&p95=200`: 30s ramp 0→50, 3min plateau at 50, 1min ramp to 100, 30s drain. Plot `http_req_duration` vs time mentally — what should it look like?
2. **Add a per-stage assertion.** Tag the plateau stage and assert `p(95)<300` only on samples from that stage (drop the warm-up). Hint: k6 stage tags via custom tags.
3. **Compare closed vs open.** Run the same shape once with `stages` (closed) and once with `ramping-arrival-rate` (open). At what RPS do they diverge?
4. **Find a drain bug.** Hit `/lab/limit` (rate-limited) with a ramp 0→100 over 30s. The bucket gets exhausted partway through. What does the drain phase look like? Are errors recovering?

## Common Mistakes

- **Treating `stages` as cumulative VUs added per stage.** It's the *target*, not the delta. `[{target:50}, {target:50}]` means "ramp to 50, then hold at 50" — not "ramp to 50, then ramp another 50 to 100."
- **Mixing `vus`/`duration` with `stages` in the same options.** k6 will warn — pick one.
- **Asserting on the whole test including warm-up.** Cold cache + JIT + connection pools makes early samples unrepresentative.

## Cheat Sheet

| Shape | When to use |
|-------|-------------|
| Pure ramp (0→N) | Capacity finding — see what RPS the system tops out at |
| Ramp + plateau + drain | Realistic load profile, perf budget verification |
| Sawtooth (ramps up + down repeatedly) | Resource leak hunting |
| Spike (sharp ramp + immediate drain) | See kata 54 — spike tests deserve their own kata |
