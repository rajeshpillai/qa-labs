# Kata 56: Spike Test

## What You Will Learn

- What a **spike** is and why it's a different beast from gradual load
- The two spike scenarios real systems face: **single sharp spike** and **repeated burst**
- What an autoscaler can and can't catch (cold starts are the killer)
- How to set thresholds that allow short-burst degradation but require recovery
- Why a system that handles steady 1000 RPS can fall over at a 30-second spike to 500 RPS

## Prerequisites

- Completed [Kata 54 (Load)](../54-load-test/) and [Kata 55 (Stress)](../55-stress-and-breakpoint-test/)
- The QA Labs server running

## Concepts Explained

### Spikes are not just "more load, faster"

A gradual ramp gives the system time to:
- Warm caches
- Scale out (autoscaler reacts in seconds–minutes)
- Stretch connection pools
- JIT-compile hot paths

A spike does **none** of that. Traffic appears, the system scrambles, and you find out fast whether it had headroom or whether it was running on fumes.

### Real-world spike scenarios

| Scenario | Profile |
|----------|---------|
| **Black Friday opening minute** | 1× → 10× in 60s |
| **Marketing email send** | 0 → N over 30 seconds |
| **Viral social post** | 1× → 50× in 2 minutes |
| **Failover from another region** | 0 → full prod load instantly |
| **Bot scrape detected and blocked, then retry storm** | Sharp burst followed by sharp drop |

Each has its own profile, but the common signature is: **rate-of-change is high, autoscaler can't catch up**.

### The single-spike pattern

```
RPS
1000 │              ┌──┐
     │              │  │
     │              │  │
 100 │──────────────┘  └─────────────────
     └────────────────────────────────────────►
        steady     spike     recovery
```

- 30s steady at baseline (warm-up)
- Sharp ramp to 10× over 30s
- Hold at peak for 60s
- Sharp ramp back to baseline
- Hold for recovery observation

The recovery period is where bugs live: did pending requests drain? Are connection counts back to normal? Are queues empty?

### What thresholds make sense for a spike?

You can't assert `p(95)<300` during a spike — even healthy systems degrade for the few seconds it takes the autoscaler to catch up. Instead:

```javascript
thresholds: {
  // Recovery period must be back at SLO
  'http_req_duration{phase:recovery}': ['p(95)<300'],
  // During spike, allow up to 1s p95 — anything more means the system is
  // genuinely struggling, not just rate-of-change pain
  'http_req_duration{phase:spike}': ['p(95)<1000'],
  // Errors during spike: allow up to 5% — but recovery should be clean
  'http_req_failed{phase:spike}': ['rate<0.05'],
  'http_req_failed{phase:recovery}': ['rate<0.005'],
},
```

The pattern: **strict thresholds during steady-state, loose during spike, strict again during recovery**.

### What you find with a spike test

1. **Autoscale lag.** How long after RPS jumps does the system recover its SLO?
2. **Connection pool exhaustion.** Sudden burst of new connections may exceed pool size. Latency spikes, then errors.
3. **Cache cold start.** New instances have empty caches. First requests to them are slow.
4. **Queue depth.** Did a queue build up that's still draining minutes after the spike? That's a backpressure bug.
5. **Retry amplification.** A spike that causes some failures triggers client retries, amplifying the spike.

### Repeated bursts (sawtooth)

Some systems face **repeated** spikes — e.g., a cron-driven job that fires every 5 minutes and bursts traffic. The pattern:

```
RPS
500 │  ┌──┐    ┌──┐    ┌──┐    ┌──┐
    │  │  │    │  │    │  │    │  │
100 │──┘  └────┘  └────┘  └────┘  └─
    └─────────────────────────────────►
```

These find leaks: each burst should leave the system in the same state as the previous. If queue depth, memory, or open connections grow burst-over-burst, you have a leak that a single spike test won't catch.

## Exercises

1. **Build a single 10× spike** against `/lab/echo`: 30s steady at 50 RPS, sharp ramp to 500 RPS over 5s, hold for 30s, sharp drop to 50 RPS, recover for 30s. Compare p95 across the three tagged phases.
2. **Sawtooth.** Repeat 4 cycles of: 30s at 50 RPS, 15s at 500 RPS, back to 50. Are the p95 values stable burst-over-burst? If they grow, you found a leak.
3. **Spike against a slow endpoint.** Spike 5× against `/lab/slow?ms=200`. Why does this fail more dramatically than spiking `/lab/echo`? (Hint: Little's Law — required concurrency.)
4. **Add a retry storm.** When a request fails during the spike, retry it once. Does this make the recovery period worse? By how much?

## Common Mistakes

- **Treating spike as load with a ramp.** A 60-second ramp is **not** a spike. Spikes are 0–30s.
- **Asserting steady-state SLO during the spike itself.** Even healthy autoscaling systems briefly miss SLO during the scale-up window. Use phase-tagged thresholds.
- **No recovery observation.** A spike test that ends right after the peak misses the queue drain, the cache thrash, the connection clean-up.
- **One spike, one run.** Spike behavior is variable. Run 5+ times and report the worst-case (not average) — your customers experience the worst run.

## Cheat Sheet

| Phase | Goal | Threshold style |
|-------|------|-----------------|
| Steady (pre-spike) | Verify baseline | Strict (SLO) |
| Spike | Survive the burst | Loose (degraded but no errors) |
| Peak | Hold the new level | Moderate (SLO+50% latency) |
| Recovery | Return to baseline | Strict (SLO) |

| Common pre-spike check | Why |
|-------------------------|-----|
| Autoscale rule firing? | Without it, spike will overload |
| Connection pool sized for peak × 2? | Spikes need headroom |
| Circuit breakers tested? | Failures should fail fast, not pile up |
| Retry budget capped? | Retry storms amplify spikes |
