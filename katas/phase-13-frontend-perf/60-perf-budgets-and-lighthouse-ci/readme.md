# Kata 60: Performance Budgets and Lighthouse CI

## What You Will Learn

- What a **performance budget** is and why teams without one drift over time
- The two budget categories: **timing budgets** (LCP < 2.5s) and **resource budgets** (JS < 200KB)
- How to enforce budgets in CI using **Lighthouse CI** (LHCI)
- The LHCI assertion config: `assertions.json` style
- How budget failures show up in PR review (status checks, reports, comments)
- A sample `lighthouserc.json` that gates merges on regression

## Prerequisites

- Completed [Kata 58](../58-lighthouse-basics/) and [Kata 59](../59-core-web-vitals/)
- Familiarity with GitHub Actions / your CI tool (we'll show GitHub Actions snippets)

## Concepts Explained

### Why budgets

Without a perf budget, page weight grows monotonically. Each PR adds "just one library" or "just one image" — and after 6 months your bundle is 4× what it was. Nobody owns the regression because each individual PR was tiny.

A **budget** is a hard limit you assert in CI. Cross it, the build fails. Crossing it requires either: optimize, or get explicit approval to raise the budget.

### Two flavors of budget

#### Timing budgets

Assert on the **measured experience**:

```json
{
  "assertions": {
    "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
    "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
    "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
    "total-blocking-time": ["error", { "maxNumericValue": 200 }],
    "interactive": ["error", { "maxNumericValue": 3500 }]
  }
}
```

#### Resource budgets

Assert on what the **page weighs**:

```json
{
  "budgets": [
    {
      "resourceSizes": [
        { "resourceType": "script", "budget": 200 },
        { "resourceType": "stylesheet", "budget": 100 },
        { "resourceType": "image", "budget": 300 },
        { "resourceType": "total", "budget": 600 }
      ],
      "resourceCounts": [
        { "resourceType": "third-party", "budget": 10 }
      ]
    }
  ]
}
```

Sizes are KB. Resource budgets are **leading indicators** — they regress before timing does, so you catch problems earlier.

### Lighthouse CI in 60 seconds

Three components:

1. **`lhci collect`** — runs Lighthouse N times against your URLs, gathers reports.
2. **`lhci assert`** — applies your budget rules to the reports.
3. **`lhci upload`** — pushes reports to a server (filesystem, GCS, or LHCI's hosted server) so you can compare PR-vs-main.

A `lighthouserc.json` ties them together:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:8080/phase-00-foundations/01-selectors-and-locators/playground/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "categories:performance": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "filesystem",
      "outputDir": "./lighthouse-reports"
    }
  }
}
```

Run with: `npx @lhci/cli@0.13 autorun`.

### Hooking into GitHub Actions

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      - name: Build site
        run: cd website && npm install && npm run build

      - name: Start server
        run: |
          cd server && npm install
          npm start &
          sleep 5

      - name: Lighthouse CI
        run: npx -y @lhci/cli@0.13 autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

PRs that breach the budget get a failed check + a link to the Lighthouse report. The optional `LHCI_GITHUB_APP_TOKEN` adds a status comment on the PR.

### Three-number budgets — `error`, `warn`, `off`

```json
"first-contentful-paint": ["error", { "maxNumericValue": 1800 }]
```

The first element is the severity:
- `error` — fail the CI check
- `warn` — show in report but don't fail
- `off` — disable the assertion

Use `warn` for new metrics during a stabilization period — measure for a week, then flip to `error` once the noise floor is known.

### Asserting per-category vs per-metric

```json
"assertions": {
  "categories:performance": ["error", { "minScore": 0.9 }]
}
```

This asserts the **overall Performance score** ≥ 0.9. Lighthouse scores categories 0.0-1.0. Often easier to stabilize than individual metrics.

But: a 0.9 score can hide a regression in one specific metric if others improve. Best practice: assert **both** category score AND key individual metrics.

### What budgets do NOT catch

Budgets are great at catching regressions in **what's measured**. They miss:

- Network conditions you don't simulate (slow 3G in real users vs cable in CI).
- Devices you don't test (high-end laptop vs mid-range Android).
- Geographic distance (CI runs in us-east, users are in Bangalore).
- Real-user variability (your CI is consistent, real users aren't).

Combine lab-based budgets with **field-based** RUM monitoring for full coverage.

## Exercises

1. **Write a `lighthouserc.json` for kata 58's playground.** Set FCP < 1800, LCP < 2500, score ≥ 0.9. Run with `npx @lhci/cli autorun`. Does it pass?
2. **Run it against kata 59's broken playground.** Does it fail? Read the failure output — what's the worst metric?
3. **Add a resource budget.** Limit total page weight to 100KB. Use `resourceSizes` with `total: 100`.
4. **Tighten the FCP budget.** Drop FCP from 1800 to 500. The kata 58 page might still pass on a fast machine. Why is "tighter than the production target" sometimes a good idea, and sometimes flaky?
5. **Wire it to GitHub Actions.** Use the snippet above. Push a PR that intentionally regresses the page (bigger image, more JS). Did the workflow catch it?

## Common Mistakes

- **Setting budgets too tight.** If your local machine reports LCP = 800ms and you set the budget to 900ms, CI will fail intermittently because CI runners are slower.
- **Running once.** A single Lighthouse run can vary by 20%+. Always use `numberOfRuns: 3` minimum.
- **Asserting on the wrong URL.** Easy to test the homepage but ship a regression on a detail page. Test the URLs your users actually hit.
- **Treating perf score as the only metric.** A 90 perf score can mask a 0.3 CLS. Assert key metrics individually.
- **No feedback loop.** A budget that fires only on red CI is annoying. Wire it to surface the report URL in the PR comment.

## Cheat Sheet

| Common budget targets | Good baseline |
|------------------------|---------------|
| FCP | 1800ms |
| LCP | 2500ms |
| CLS | 0.1 |
| TBT | 200ms |
| Time to Interactive | 3500ms |
| Performance score | ≥ 0.9 |
| Total page weight | ≤ 1MB (mobile-first) |
| JS bundle | ≤ 200KB compressed |
| Third-party requests | ≤ 10 |

| LHCI command | What it does |
|--------------|--------------|
| `lhci collect` | Run Lighthouse, save raw reports |
| `lhci assert` | Check reports against budget |
| `lhci upload` | Push reports to LHCI server |
| `lhci autorun` | All three in sequence |

| Severity levels |
|-----------------|
| `error` — fails the build |
| `warn` — shows in report, doesn't fail |
| `off` — disabled |
