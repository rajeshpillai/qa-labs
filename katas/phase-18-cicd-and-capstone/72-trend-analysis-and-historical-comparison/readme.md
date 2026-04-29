# Kata 72: Trend Analysis and Historical Comparison

## What You Will Learn

- Why **single-run regressions** are noise but **trends across runs** are real signal
- The **moving baseline** pattern: rolling p95-of-p95s instead of last-run comparison
- How to detect **slow drift** that absolute thresholds miss (e.g., 1% slower per week → 50% slower per year)
- **Run-to-run variance** and how to reason about it statistically
- Storing run history for analysis: artifacts, S3, dedicated DBs (Grafana Cloud Tempo, k6 Cloud)
- The "n-of-m" rule: only flag if the trend has held for several consecutive runs

## Prerequisites

- Completed [Kata 71 (CI Gates and Baselines)](../71-ci-gates-and-baselines/)
- Completed [Kata 67 (Grafana + Prometheus)](../../phase-16-observability/67-grafana-and-prometheus/)
- The QA Labs server running

## Concepts Explained

### Single runs lie

A single perf-test run shows a number. That number is the result of:

- The actual code being tested
- Random scheduling of VUs across CPU cores
- Background processes on the test runner
- Disk I/O contention
- Network jitter
- Whatever else is happening on the machine

**Run-to-run variance is typically 5-15%** even with identical code. A 5% "regression" is noise unless you have multiple runs to confirm.

### The moving baseline

Instead of comparing to last-run, compare to the **rolling median (or p95) of the last N runs**:

```
day 1: 200ms
day 2: 195ms
day 3: 210ms
day 4: 198ms
day 5: 215ms     ← single-run check vs day 4 alone says "+8.5%, ALERT!"
                 ← rolling median over 4 days = 199ms; 215 vs 199 = +8%, but…
                 ← run 6+ would tell us if this is real
```

A moving baseline with N=5 means a one-off spike won't trigger; a sustained shift will.

### N-of-M flagging

The "real signal" rule: only flag a regression if **N out of the last M runs are worse**.

- **N=3, M=5**: 3 of last 5 runs above the baseline = real
- **N=2, M=3**: more aggressive — 2 of last 3 = real
- **N=1, M=1**: every run flags — too noisy

Real teams pick `N=3, M=5` for nightly tests, `N=2, M=3` for hourly tests. PR-level smoke tests use absolute thresholds (kata 71) since each PR run is independent.

### Where you store run history

| Option | Pro | Con |
|--------|-----|-----|
| GitHub Actions artifacts | Free, no infra | 90-day retention, no easy querying |
| Commit summaries to a perf branch | Versioned, full history | Repo bloat over time |
| S3 / GCS bucket | Long retention, cheap | Custom tooling to query |
| k6 Cloud / Grafana Cloud | Hosted, dashboards built-in | Paid (free tier exists) |
| Prometheus long-term store (Mimir, Cortex) | Same stack as production observability | Ops overhead |

**Most pragmatic for small teams**: GitHub artifacts + a simple `scripts/aggregate-history.js` that walks the last N artifacts and produces a trend chart. Keep it dumb until it hurts.

### A simple trend script

```javascript
// scripts/check-trend.js
const fs = require('fs');
const path = require('path');

const HISTORY_DIR = './history';
const N = 5;

const files = fs.readdirSync(HISTORY_DIR)
  .filter(f => f.endsWith('.json'))
  .sort()
  .slice(-N);

const p95s = files.map(f => {
  const summary = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), 'utf-8'));
  return summary.metrics.http_req_duration['p(95)'];
});

const sorted = [...p95s].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
const latest = p95s[p95s.length - 1];

console.log(`Last ${N} p95s: ${p95s.map(p => p.toFixed(0)).join(', ')}`);
console.log(`Rolling median: ${median.toFixed(0)}ms`);
console.log(`Latest: ${latest.toFixed(0)}ms`);

const ratio = latest / median;
if (ratio > 1.10) {
  console.error(`Latest is ${((ratio - 1) * 100).toFixed(1)}% above median — investigate`);
  process.exit(1);
}
```

This catches both single big regressions AND slow drift (median shifts up over time, ratio stays at 1.0 even though absolute numbers grow).

### Detecting slow drift

A 1% regression per week is invisible run-to-run but **52% per year**. To catch:

1. Keep history for at least 90 days
2. Periodically (weekly cron) compare current rolling-median to **30-days-ago** rolling-median
3. If divergence exceeds a threshold (10-20%), alert

```javascript
const todayMedian = rollingMedian(history.last5runs);
const monthAgoMedian = rollingMedian(history.runsAround30DaysAgo);

if (todayMedian / monthAgoMedian > 1.10) {
  console.warn('Slow drift detected: 30-day median worsened by 10%+');
}
```

This is what real perf engineers monitor weekly. Pure run-to-run comparison can't see it.

### Variance reduction tactics

If your runs are too noisy to compare meaningfully:

| Tactic | Effect |
|--------|--------|
| Use dedicated CI runners (not shared) | Less interference |
| Pin OS/kernel, set CPU governor to performance | More deterministic timing |
| Disable HyperThreading | More predictable scheduling |
| Run multiple iterations, take median | Cancels noise |
| Aggregate p95-of-multiple-runs | More stable than single p95 |
| Compare ratios, not absolute numbers | Insulates from runner speed differences |

## Exercises

1. **Generate 5 baseline runs.** Run the kata's k6 spec 5 times, save each summary to `history/run-N.json`. Calculate the rolling median manually.
2. **Inject a "regression."** Switch the test target to `/lab/slow?ms=50` (slightly slower). Run 5 more times. How does the rolling median shift?
3. **Implement N-of-M.** Modify `check-trend.js` to flag only when 3 of last 5 runs are above baseline. Verify with mixed clean/regressed runs.
4. **Detect slow drift.** Save 10 runs, then introduce a small drift (each subsequent run 2% slower). Does the script catch it?
5. **Plot the history.** Use Grafana with a CSV file or Prometheus. Visualize p95 over the last 30 runs.

## Common Mistakes

- **Comparing to last-run only.** That's not a trend — that's noise + 1.
- **Tight thresholds without trend context.** A 5% threshold is too tight given run-to-run variance.
- **Forgetting to refresh baseline.** A perf improvement landing in main means baseline is stale; auto-update or update manually.
- **Cherry-picking runs.** "This run was slow because the build server was busy" — discount it once, fine. Discount it five times, you've stopped doing real perf testing.

## Cheat Sheet

| Comparison | Use |
|------------|-----|
| Latest vs absolute SLO | PR-level smoke |
| Latest vs rolling median | Nightly trend |
| Today's median vs 30-day median | Weekly drift |
| n-of-m flagging | Reduce false positives |

| Storage option | When |
|----------------|------|
| GitHub artifacts | Default for small teams |
| Git commits to perf branch | When you need versioned history |
| S3 / GCS | When artifacts retention isn't enough |
| Prometheus long-term store | When you already use it for prod |
| k6 Cloud / Grafana Cloud | When you want hosted dashboards |
