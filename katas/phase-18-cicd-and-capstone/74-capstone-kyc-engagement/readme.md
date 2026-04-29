# Kata 74: Capstone — KYC Performance Engagement

## What You Will Learn

This kata is the **synthesis** of everything you've built across phases 9–17. You're presented with a fictional brief: deliver a complete perf-test engagement on a fintech KYC system. The deliverable is a single repo (this kata's solution) demonstrating you can:

- Translate **business requirements** into perf-test plans
- Combine **HTTP load + browser sample + auth flow + multi-step funnel + chaos + observability** in one coherent test suite
- Author **stakeholder-ready findings** — what passed, what regressed, what to do about it
- Stage tests into **CI tiers** (smoke → load → soak → chaos)
- Build **CI gates** that catch regressions without being flaky

## The Engagement Brief (fictional)

> Acme Bank is launching its KYC onboarding flow. Before launch, leadership wants assurance that the system can handle peak Black Friday traffic (estimated 200 RPS sustained, 1000 RPS spike), with p95 < 300ms server-side and Web Vitals all in the "good" range under load. Authentication, document upload, video verification, and decisioning all need to be exercised end-to-end. Failures should be graceful — partial outages should not cascade. Rate limits must be enforced. We need: a CI smoke test, a nightly load test, a weekly soak test, and a chaos drill.

## Prerequisites

- Phases 9–17 (everything)
- The QA Labs server running (you'll exercise `/lab/auth/*`, `/lab/kyc/*`, `/lab/limit`, `/lab/flaky`, `/lab/headers`)

## Concepts Explained

### Mapping the brief to test types

| Requirement | Test type | Phase |
|-------------|-----------|-------|
| 200 RPS sustained, p95 < 300ms | **Load test** | 12, 14 |
| 1000 RPS spike | **Spike test** | 12 |
| 4-hour stability | **Soak test** | 12 |
| Web Vitals under load | **Hybrid (HTTP + browser)** | 15 |
| Auth + KYC end-to-end | **Realistic scenarios** | 11 |
| Rate limits enforced | **Rate-limit tests** | 14 |
| Graceful failure | **Chaos / fault injection** | 17 |
| Observable | **Trace propagation, Prometheus output** | 16 |
| CI-gated | **CI gates + baselines** | 18 |

The capstone solution wires all of these into one test plan.

### Tier structure

```
Tier 1 (PR smoke)            — every PR, 60 seconds
Tier 2 (load)                — nightly, 15 min
Tier 3 (chaos)               — weekly, 30 min
Tier 4 (soak)                — pre-release, 4 hours
Tier 5 (capacity / spike)    — pre-major-release, 1 hour
```

Each tier has its own k6 file (or scenario block) and CI trigger. Lower tiers run more often with stricter SLO; higher tiers run less often with broader assertions.

### What the capstone test does

The k6 solution is a **single file** that runs five parallel scenarios, modeling realistic Black Friday traffic:

1. **API hammer** at 200 RPS — tests sustained load
2. **KYC funnel** at 30 RPS with realistic drop-off — tests multi-step auth flow
3. **Browser sample** with 2 concurrent Chromium tabs — tests UX during load
4. **Rate-limit probe** at 8 RPS against `/lab/limit` (5 RPS limit) — tests 429 handling
5. **Trace correlation** — every request gets a unique `traceparent` for APM lookup

Thresholds enforce:
- Server-side p95 SLO
- Browser Web Vitals SLO under load
- Funnel completion rate
- Bounded rate-limit hits
- Bounded errors

### What the artillery solution does

A **simpler version** of the same engagement — Artillery doesn't have:
- First-class browser support
- Per-request trace ID generation in YAML
- Custom metrics with the same expressiveness as k6

So the Artillery solution covers the HTTP + KYC + rate-limit pieces; for a complete engagement you'd combine Artillery (HTTP) + Playwright (browser) + Lighthouse CI (Web Vitals) — three tools instead of one.

### The findings document

After running, the **deliverable** isn't the test — it's the document you give stakeholders.

Template:

```
# Acme Bank KYC Performance Engagement Findings

## Summary
- 200 RPS sustained: PASS (p95 = 215ms vs SLO 300ms)
- 1000 RPS spike: PASS with caveats (p95 spiked to 850ms during ramp)
- 4-hour soak: PASS (p95 stable, no memory growth)
- Browser Web Vitals under load: PASS (LCP p95 = 1.8s vs SLO 2.5s)
- Rate limit enforcement: PASS (5 RPS limit honored, 429s returned correctly)
- Chaos resilience: PARTIAL (system recovers from 30s injection, but
  retries amplified load 3× during fault — recommend retry budget)

## Recommendations
1. Add retry budget to client SDK (cap at 10% of successful traffic)
2. Pre-warm caches before traffic spikes (currently cold-start during ramp)
3. Lower rate limit threshold (5 RPS) — consider 10 RPS for paid tier
4. Enable Prometheus output in production for live RUM dashboards

## What we tested
... (1 paragraph per test type)

## What we didn't test
- Multi-region failover
- Mobile devices specifically
- Real third-party document verification API
... (be honest about scope)

## Re-test cadence
- Smoke on every PR
- Load nightly
- Chaos weekly
- Soak monthly
```

A perf engagement that doesn't end with a written brief stays in the perf engineer's head and never changes anything. **Always write the findings.**

### Re-running the capstone

You'd re-run this whole thing **before every major release**. The full suite takes ~5 hours; smoke + load only takes 20 minutes for routine validation.

## Exercises

1. **Run the capstone k6 file.** What's the overall pass/fail? Which scenario was the riskiest?
2. **Write the findings.** Use the template above. Fill in the actual numbers from your run.
3. **Stress the spike scenario.** Bump `spike` rate to 2000 RPS. What breaks first? Document it.
4. **Add a chaos phase.** Layer kata 69's chaos requests into the capstone. How does the system recover?
5. **Wire Tier 1 to CI.** Set up GitHub Actions to run a 60-second variant on every PR.
6. **Define your team's tier cadence.** Smoke / load / chaos / soak — when does each run for your project?

## Common Mistakes

- **Running the test, not writing the findings.** Tests without artifacts are forgotten.
- **One run = the answer.** Run multiple times before declaring a result.
- **No before/after comparison.** A capstone test only tells you "is the system ready?" — running before code changes too gives you "did the changes regress?"
- **Tier creep.** "Just one more scenario in smoke" makes smoke slow → smoke gets skipped → smoke disappears.
- **Forgetting the brief.** If the leadership ask was "Black Friday peak," running at peak/2 doesn't answer the question.

## Cheat Sheet

| Tier | Cadence | Test |
|------|---------|------|
| Smoke | Every PR | 60s, 50 RPS, absolute SLO |
| Load | Nightly | 15min, 200 RPS, baseline comparison |
| Chaos | Weekly | 30min, faults injected mid-load |
| Soak | Monthly | 4h, baseline RPS, drift checking |
| Capacity | Pre-release | 1h, ramp to breakpoint |

| Component | What you call it |
|-----------|------------------|
| The script | Test plan |
| The output | Run summary |
| The git history of summaries | Trend |
| The PR CI check | Gate |
| The post-engagement document | Findings / readout |

| Stakeholder questions to anticipate |
|-------------------------------------|
| "Are we ready for launch?" |
| "What's our real capacity?" |
| "What happens at 2× expected load?" |
| "Can we recover from a slow dependency?" |
| "How fast do users see the page?" |
| "Is the load test representative of real traffic?" |
