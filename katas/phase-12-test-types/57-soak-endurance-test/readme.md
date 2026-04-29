# Kata 57: Soak / Endurance Test

## What You Will Learn

- What a **soak test** finds that a 5-minute load test cannot — leaks, drift, degradation
- The realistic duration spectrum: **CI smoke** (5 min) → **CI soak** (30 min) → **release soak** (4–24 hours)
- Memory leaks, file-descriptor leaks, connection-pool drift, log-rotation issues
- Why p95 over a 4-hour test is more meaningful than p95 over 5 minutes
- How to run a soak in CI without burning hours of CI minutes

## Prerequisites

- Completed all earlier phase 12 katas (load, stress, spike)
- The QA Labs server running

## Concepts Explained

### What soak tests find

Imagine you ran kata 54's load test for 5 minutes and it passed. Production crashes 7 hours after deploy. The 5-minute test missed:

| Bug class | Why short tests miss it |
|-----------|-------------------------|
| **Memory leak** | A few KB/min leak shows as hundreds of MB after hours, but invisible in 5 min |
| **File descriptor leak** | Hits limit (typically 1024 or 65k) only after thousands of operations |
| **Connection pool drift** | Pool slowly fills with stale connections that never get reaped |
| **Log rotation bugs** | Log file fills disk, daemon crashes |
| **Cache eviction storms** | Caches fill up over hours, then thrash on every request |
| **DB index bloat** | Index size grows over time, queries slow proportionally |
| **Time-based bugs** | Cron jobs, daily resets, rate-limit window resets |

A soak test is the only way to find these in pre-production.

### Duration spectrum

| Duration | Use case | What you'll catch |
|----------|----------|-------------------|
| **5 min** (smoke) | Every CI commit | Crashes, immediate regressions |
| **30 min** (load) | Per-PR or pre-merge | Most steady-state regressions, p95 stability |
| **2 hours** (mini-soak) | Nightly | Slow leaks, queue drift |
| **4 hours** | Pre-release | Memory leaks under sustained load |
| **24 hours** | Release validation | Time-of-day bugs, log rotation, full leak realization |
| **7 days** | Major release / capacity planning | Long-tail anomalies, full leak unrolled |

Real teams run a 4-hour soak before every release and a 24-hour soak monthly.

### What to monitor

A soak test isn't just "the load test, but longer." You need to watch dimensions that don't matter in short tests:

- **p95 over time** (not just final p95). A passing final p95 can mask drift if the trend is upward.
- **Memory RSS** (resident set size) over time. Growing? You have a leak.
- **Open file descriptors** over time.
- **Connection counts** to backends.
- **Error rate by hour.** If errors spike at hour 6, you have a time-based bug.

In k6 you can record some of these as custom metrics if your service exposes them. Most observability comes from outside k6 (Prometheus, Grafana, your APM).

### Soak in CI: the cost problem

A 4-hour soak times your concurrent test runs costs significant CI minutes. Tactics:

1. **Tiered cadence.** Smoke on every commit, 30-min soak nightly, 4-hour soak weekly.
2. **Compressed soak.** Run for 30 min but at higher RPS than production peak. Doesn't catch all soak bugs but catches some at lower cost.
3. **Run on dedicated soak hardware.** Don't tie up the main CI fleet.
4. **Background scheduled jobs.** GitHub Actions schedules, cron in your CI.

### Useful k6 patterns for soak

#### Periodic checkpoints

Add a "checkpoint" log every 10 minutes so you can scan the log and see whether p95 was stable:

```javascript
export default function () {
  const minute = Math.floor((Date.now() - START) / 60_000);
  if (minute % 10 === 0 && __ITER === 0) {
    console.log(`Soak checkpoint: minute ${minute}`);
  }
  // ... actual test work ...
}
```

#### Per-hour tagging

Tag samples by hour so you can compare hour 1 vs hour 4:

```javascript
const hour = Math.floor((Date.now() - START) / 3_600_000);
http.get(url, { tags: { hour: `h${hour}` } });
```

Then:
```javascript
'http_req_duration{hour:h0}': ['p(95)<300'],
'http_req_duration{hour:h3}': ['p(95)<300'],  // must hold after 3 hours
```

If `h3` p95 is much worse than `h0` p95, you have drift.

### The QA Labs kata is short by design

The provided solution runs **60 seconds** by default — long enough to demonstrate the pattern, short enough to actually run during a workshop. To do a real soak, set `SOAK_DURATION=30m k6 run ...` (or hours) and run on a long-lived host.

## Exercises

1. **Run the kata as-shipped (60s).** Note p95. Re-run with `SOAK_DURATION=10m`. Did p95 change?
2. **Add per-hour tagging.** Run for 30 min. Compare p95 across the three 10-minute slices. Stable? Drifting?
3. **Find a synthetic leak.** Modify the kata to log requests to an in-memory array (which intentionally never gets cleared). Watch memory grow via `process.memoryUsage()` printed every minute.
4. **Compressed soak.** What's the relationship between RPS multiplier and soak duration? Can a 30-min run at 2× production RPS substitute for a 1-hour run at 1×?

## Common Mistakes

- **Conflating soak with load.** A soak run is at *baseline* production RPS, not peak. The point is duration, not magnitude.
- **No outside observability.** The k6 output alone won't show memory growth — you need APM/Prometheus.
- **Assuming short test = soak.** A 5-minute test at high RPS finds different bugs than a 4-hour test at moderate RPS.
- **Skipping the recovery period.** If your test ends at hour 4 with the system in a degraded state, you don't know whether it would have recovered or crashed.

## Cheat Sheet

| Want to find... | Run for... | At what load |
|-----------------|------------|--------------|
| Crashes | 5 min | Production peak |
| Steady-state regression | 30 min | Production peak |
| Memory leak | 4 hours | Production baseline |
| FD leak | 4 hours | High request count |
| Time-based bug | 24 hours | Production baseline |
| Cache eviction storm | 4-12 hours | Production peak with realistic data variety |

| Soak red flag | Likely cause |
|---------------|--------------|
| p95 climbing | Memory pressure → GC → slow paths |
| RSS climbing | Leak |
| Errors spiking after N hours | Quota / rate limit / disk full |
| Throughput dropping | DB index bloat / cache eviction |
