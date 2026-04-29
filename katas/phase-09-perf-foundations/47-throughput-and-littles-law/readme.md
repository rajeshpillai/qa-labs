# Kata 47: Throughput and Little's Law

## What You Will Learn

- The relationship between **virtual users (VUs)**, **response time**, and **throughput** — and why it's NOT just `VUs × RPS`
- **Little's Law:** the equation that ties them together: `L = λ × W`
- Why doubling VUs doesn't always double throughput
- The difference between **closed** and **open** workload models — and why most real traffic is open
- How to choose `vus` vs `arrivalRate` in k6 / Artillery

## Prerequisites

- Completed [Kata 45](../45-http-and-latency-basics/) and [Kata 46](../46-percentiles-and-distribution/)
- The QA Labs server running locally (`/lab/slow` and `/lab/jitter`)

## Concepts Explained

### Little's Law

A simple but powerful equation from queueing theory:

```
L = λ × W
```

Where:
- **L** = average concurrency (requests in flight at any moment)
- **λ** (lambda) = throughput (requests per second)
- **W** = average response time (seconds per request)

Solve for any one when you know the other two. For example:
- If **W = 200ms** and you want **λ = 500 RPS**, then **L = 500 × 0.2 = 100** concurrent in-flight requests.
- If you have **100 VUs** holding the line and **W = 200ms**, you'll get **λ = 100 / 0.2 = 500 RPS**.

This is why "100 VUs" doesn't directly translate to a throughput number — it depends on how long each request takes.

### Closed vs open workload

This trips up most beginners.

#### Closed model — fixed concurrency

Each VU does: send request → wait for response → think → repeat. The number of in-flight requests is **at most** the VU count. If the system slows down, throughput drops because VUs are stuck waiting.

```javascript
// k6 closed model — the default
export const options = {
  vus: 100,           // 100 simultaneous "users"
  duration: '30s',
};
```

Real users behave more like the closed model **per session** — but real *traffic* is open: new users keep arriving regardless of how slow the system is.

#### Open model — fixed arrival rate

New requests start at a steady rate, regardless of whether previous ones finished. If the system slows down, requests pile up. This better simulates real traffic — and it's how production overload looks.

```javascript
// k6 open model
export const options = {
  scenarios: {
    steady: {
      executor: 'constant-arrival-rate',
      rate: 500,           // 500 requests per second
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 100, // worker pool — must be enough
      maxVUs: 200,
    },
  },
};
```

Artillery's `arrivalRate` in `phases` is also open-model.

> **Why this matters:** if you load-test in closed mode at "100 VUs" and the system slows down, your test artificially backs off. You'll never observe overload. Open mode is what real traffic looks like — and what causes real outages.

### What VU count to pick (closed model)

If you're using closed mode (k6 default), pick VUs roughly equal to expected concurrency:

```
VUs needed ≈ target_RPS × expected_response_time_seconds
```

For 500 RPS at 200ms response time: ~100 VUs. If the system slows to 500ms response time, you'd need 250 VUs to maintain 500 RPS. With 100 VUs, you'd only achieve `100 / 0.5 = 200 RPS`.

## Exercises

1. **Closed mode warm-up.** Run the k6 test against `/lab/slow?ms=100` with 10 VUs for 10 seconds. What throughput do you observe? Apply Little's Law: does it match `10 / 0.1 = 100 RPS`?
2. **Increase VUs.** Same endpoint, 20 VUs. Does throughput double? It should, until the server can't keep up.
3. **Increase server-side delay.** Hit `/lab/slow?ms=500` with 10 VUs. Throughput should be ~`10 / 0.5 = 20 RPS`.
4. **Open mode.** Switch to `constant-arrival-rate` at 200 RPS against `/lab/slow?ms=100`. Does it sustain 200 RPS? Now point it at `/lab/slow?ms=600` — what happens? (You'll see queueing.)
5. **Calculate VUs needed.** You want 1000 RPS sustained against an endpoint with p95 = 250ms. How many `preAllocatedVUs` should you start with?

## Common Mistakes

- **Reporting throughput from a closed-mode test as your system's capacity.** It's bounded by your VU count — not the system's actual limit.
- **Forgetting `preAllocatedVUs` is a pool, not a target.** k6 will warn if your `rate` requires more VUs than allocated; bump `preAllocatedVUs` and `maxVUs` accordingly.
- **Comparing closed-mode results across different systems.** If response times differ, throughput differs even at the same VU count — it's apples to oranges.

## Cheat Sheet

| You want to test... | Use this model | k6 executor |
|---------------------|----------------|-------------|
| Steady traffic at known RPS | Open | `constant-arrival-rate` |
| User-session load (think time) | Closed | default `vus` + `duration` |
| Ramp from 0 → N RPS | Open | `ramping-arrival-rate` |
| Ramp from 0 → N concurrent | Closed | `ramping-vus` |
| Spike test | Open | `ramping-arrival-rate` with sharp ramp |

| Symptom | Likely cause |
|---------|--------------|
| Throughput plateaus while VUs increase | System saturated |
| Throughput < target rate in open mode | Server can't keep up; queue is growing |
| `preAllocatedVUs` warning in k6 | Bump the pool size |
