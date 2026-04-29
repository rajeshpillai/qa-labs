# Kata 71: CI Gates and Baselines

## What You Will Learn

- Why **a perf test that doesn't gate merges might as well not exist**
- The two CI gating strategies: **absolute thresholds** vs **baseline comparison**
- Building a perf-test workflow in **GitHub Actions**: build → run → assert → report
- How to make perf tests **fast enough to run on every PR** (smoke variant) vs **thorough enough to catch real regressions** (nightly variant)
- The `--summary-export` + threshold pattern that makes k6 fail the CI build cleanly
- **Baseline storage**: where you keep "good" numbers and how you update them

## Prerequisites

- Phases 9–17
- Familiarity with GitHub Actions or your CI tool (examples use Actions; concepts apply to GitLab CI / Jenkins / CircleCI)

## Concepts Explained

### Why gate?

A perf test that just *measures* without failing is decoration. People glance at the dashboard, shrug, ship. **Without a gate, regressions accumulate silently.**

A gated test:
- Fails the CI build when a metric regresses past the threshold
- Forces the PR author to investigate before merge
- Creates a feedback loop: every regression has a name attached

### Two gating strategies

#### 1. Absolute thresholds (simpler, less powerful)

```javascript
thresholds: {
  'http_req_duration': ['p(95)<300'],
}
```

"p95 must be under 300ms." Fails any time it isn't.

| Pro | Con |
|-----|-----|
| Simple, no comparison data needed | Doesn't catch regressions if you're already over the threshold |
| Easy to align with SLOs | Must be re-tuned if your hardware changes |
| Stable across runs | "300ms" is opinion — needs justification |

#### 2. Baseline comparison (harder, more powerful)

"p95 must not be worse than yesterday's p95 by more than 10%."

```bash
# Pseudo-pattern
LATEST=$(jq '.metrics.http_req_duration["p(95)"]' summary.json)
BASELINE=$(jq '.metrics.http_req_duration["p(95)"]' baseline.json)
RATIO=$(echo "$LATEST / $BASELINE" | bc -l)
if (( $(echo "$RATIO > 1.10" | bc -l) )); then exit 1; fi
```

Comparing relative change catches a 50% → 60% degradation that absolute thresholds wouldn't (both pass `p95 < 100`).

| Pro | Con |
|-----|-----|
| Catches gradual drift | Needs baseline storage + update flow |
| Ratio-based — works across hardware | Noisy: small changes flag false positives |
| Adapts to current state | Needs human in the loop to update baselines |

**Use both.** Absolute floor + relative drift detection.

### A complete GitHub Actions workflow

```yaml
# .github/workflows/perf.yml
name: Perf Tests

on:
  pull_request:
    paths:
      - 'src/**'
      - 'katas/**'
  schedule:
    - cron: '0 3 * * *'  # nightly at 3am

jobs:
  perf-smoke:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        uses: grafana/setup-k6-action@v1

      - name: Build website
        run: cd website && npm install && npm run build

      - name: Start server
        run: |
          cd server && npm install
          npm start &
          npx wait-on http://localhost:3000/api/health/

      - name: Run perf smoke test
        run: |
          k6 run \
            --summary-export=summary.json \
            --quiet \
            katas/phase-09-perf-foundations/45-http-and-latency-basics/k6/45-http-and-latency-basics.test.js

      - name: Compare against baseline
        run: |
          node scripts/compare-baseline.js summary.json baselines/main.json

      - name: Upload summary as artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k6-summary
          path: summary.json
```

### The compare-baseline.js script

```javascript
// scripts/compare-baseline.js
const fs = require('fs');
const [_, __, currentPath, baselinePath] = process.argv;
const current = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));

const currentP95 = current.metrics.http_req_duration['p(95)'];
const baselineP95 = baseline.metrics.http_req_duration['p(95)'];
const ratio = currentP95 / baselineP95;

console.log(`Baseline p95: ${baselineP95.toFixed(1)}ms`);
console.log(`Current p95:  ${currentP95.toFixed(1)}ms`);
console.log(`Ratio:        ${ratio.toFixed(2)}x`);

if (ratio > 1.10) {
  console.error('REGRESSION: p95 worsened by more than 10%');
  process.exit(1);
}
console.log('OK: within 10% of baseline');
```

### Where baselines live

Three options:

| Option | Pro | Con |
|--------|-----|-----|
| Git (committed JSON) | Versioned, simple | Updates need a PR — adds friction |
| GitHub Actions cache | Fast, automatic | No history; can be cleared |
| External store (S3, GCS) | Long history | Infra to maintain |

**For most projects: Git.** Commit the baseline as `baselines/main.json`. Update it via PR when you intentionally accept a regression or shipped a perf improvement.

### Two-tier strategy

**Tier 1 — every PR (must be fast):**
- Smoke test only — 1 minute total
- Absolute thresholds (catches obvious failures)
- Runs in <5 minutes total CI time

**Tier 2 — nightly (can be thorough):**
- Full load test — 15-30 minutes
- Baseline comparison
- Triggered via `schedule:` in workflow

This way every PR gets fast feedback, while the slow comprehensive test catches subtler regressions.

### Updating baselines

A perf improvement landing in main means the baseline is now stale (old, slower numbers). Update it:

```yaml
- name: Update baseline (main only)
  if: github.ref == 'refs/heads/main' && success()
  run: |
    cp summary.json baselines/main.json
    git add baselines/main.json
    git -c user.name=ci -c user.email=ci@x commit -m "ci: update perf baseline"
    git push
```

This auto-commits a new baseline on every passing main build. Discuss with the team — some prefer manual updates via PR for visibility.

### Reporting back to the PR

```yaml
- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const summary = JSON.parse(fs.readFileSync('summary.json', 'utf-8'));
      const p95 = summary.metrics.http_req_duration['p(95)'];
      github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        body: `🏃 Perf test results:\np95 latency: ${p95.toFixed(1)}ms`
      });
```

PRs now get a comment with the run results. Author sees impact immediately.

## Exercises

1. **Generate a baseline.** Run the kata's k6 test against the lab server. Capture `--summary-export=summary.json`. Save as your local `baselines/main.json`.
2. **Make a regression.** Modify the test to hit `/lab/slow?ms=300` instead of `/lab/echo`. Run. p95 will be much higher. Run the compare script — it should fail.
3. **Set up the GitHub Action.** Use the workflow above (adjust paths). Push a PR — does the action run? Does it fail when you intentionally regress?
4. **Two-tier strategy.** Add a `perf-full` job triggered only on `schedule:`. Smoke runs on every PR; full runs nightly.
5. **Auto-update baseline on main.** Add the auto-commit step. Verify it only runs on main and only on success.

## Common Mistakes

- **No timeout in CI.** A k6 test that hangs hangs the whole CI run. Always add `timeout-minutes`.
- **Baseline drift without review.** Auto-updating without bounds means slow drift goes uncaught. Periodically diff against an "n weeks ago" baseline.
- **Too-tight thresholds.** A 5% threshold flags every noisy run. 10-20% is more practical for cross-machine comparison.
- **No retry on flaky CI.** Rerun once on failure; if it fails twice, that's a real regression.
- **Hardware-specific baselines.** Your local laptop is faster than the CI runner. Don't generate baselines locally; let CI generate them on its own runners.

## Cheat Sheet

```bash
# Generate summary
k6 run --summary-export=summary.json --quiet test.js

# Extract a metric for shell-based comparison
jq '.metrics.http_req_duration["p(95)"]' summary.json

# Inline ratio check (bash + bc)
LATEST=$(jq -r '.metrics.http_req_duration["p(95)"]' summary.json)
BASELINE=$(jq -r '.metrics.http_req_duration["p(95)"]' baselines/main.json)
awk -v l=$LATEST -v b=$BASELINE 'BEGIN { exit (l/b > 1.10) ? 1 : 0 }'
```

| Strategy | When |
|----------|------|
| Absolute threshold | Aligned with public SLO; new repos with no history |
| Baseline comparison | Mature repos; catches drift |
| Both | Default — absolute floor + relative drift |

| Tier | Cadence | Test |
|------|---------|------|
| Smoke | Every PR | 30-60s test, absolute threshold |
| Load | Nightly | 15-30 min test, baseline comparison |
| Soak | Pre-release | 4+ hours, full assertion suite |
