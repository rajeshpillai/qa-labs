# Kata 58: Lighthouse Basics — Web Vitals via Playwright

## What You Will Learn

- The four pillars Lighthouse audits: **Performance**, **Accessibility**, **Best Practices**, **SEO**
- The five **Core Web Vitals** every frontend perf engineer must know: **FCP, LCP, CLS, INP, TTFB**
- How to measure these in **Playwright** without installing the Lighthouse CLI
- The difference between **lab** (synthetic) and **field** (real-user) measurement
- Where Web Vitals come from in browser internals (Navigation Timing, Paint Timing, PerformanceObserver)

## Prerequisites

- Phases 9–12 (you understand percentiles, distributions, thresholds)
- The QA Labs server running OR Playwright running standalone (`cd playwright && npx playwright test phase-13`)

## Concepts Explained

### Why frontend perf is different

Phases 9–12 measured **server-side** load: how fast the API responds. But your user doesn't see API latency directly — they see a page. A 50ms API + 4000ms of JavaScript = a slow page, no matter how fast the backend.

Frontend perf measures **what the user actually experiences**: time to first paint, time until the page is interactive, visible layout stability.

### The five Core Web Vitals

| Metric | Full name | What it measures | "Good" threshold |
|--------|-----------|------------------|------------------|
| **FCP** | First Contentful Paint | Time until *any* content paints (text, image) | < 1.8s |
| **LCP** | Largest Contentful Paint | Time until the **biggest** above-the-fold element paints | < 2.5s |
| **CLS** | Cumulative Layout Shift | How much things jump around during load (unitless score) | < 0.1 |
| **INP** | Interaction to Next Paint | Worst-case responsiveness to user input | < 200ms |
| **TTFB** | Time to First Byte | Server response time before any rendering | < 800ms |

Google's Search ranking signals consider **LCP, INP, CLS** as the primary three. They're the user-visible Big Three.

### Lab vs field

- **Lab** = synthetic. You run Lighthouse / Playwright in a controlled environment. Reproducible, deterministic, but doesn't reflect real-world conditions (your dev laptop is faster than median real-user device).
- **Field** = Real User Monitoring (RUM). Actual page-load metrics from real users, sent to an analytics endpoint. The truth, but noisy.

This kata uses **lab measurement** via Playwright. RUM is out of scope — you'd typically use `web-vitals` npm package or a vendor (DataDog RUM, Sentry, SpeedCurve).

### Measuring Web Vitals in Playwright

Playwright doesn't have built-in Web Vitals — but the browser exposes them via the **PerformanceObserver** API. The pattern:

```typescript
const lcp = await page.evaluate(() => new Promise<number>((resolve) => {
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    resolve(entries[entries.length - 1].startTime);
  }).observe({ type: 'largest-contentful-paint', buffered: true });
}));
```

`{ buffered: true }` is critical — without it, the observer only fires for events *after* you subscribe, so an LCP that already fired would be missed.

### What the kata's playground tests

The playground (`playground/index.html`) is intentionally **fast and well-built**:
- Tiny inline CSS (no render-blocking stylesheet)
- One small inline image (LCP target)
- No layout shifts after first paint
- No JavaScript (TBT/INP near zero)

Running a perf test against this page should produce **excellent** Web Vitals — establishing a baseline for what "good" looks like. Kata 59 introduces a deliberately broken page so you can see what failures look like.

### Lighthouse CLI (for reference)

The standalone Lighthouse CLI works against any URL:

```bash
npx lighthouse http://localhost:8080/phase-13-frontend-perf/58-lighthouse-basics/playground/ \
  --only-categories=performance \
  --output=json \
  --output-path=./report.json \
  --chrome-flags="--headless"
```

It produces a 100-page JSON report with every metric. For CI, you'd pipe it into [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) (kata 60). For day-to-day development inside a perf test, the Playwright approach in this kata is lighter.

## Exercises

1. **Run the kata's spec.** What FCP, LCP, CLS values does it report? Are they all in the "good" range?
2. **Slow the page down.** Edit `playground/index.html` to add `<script src="https://example.com/missing.js"></script>` (a 404 with a long timeout). What happens to FCP? To LCP? To TTFB?
3. **Compare Lighthouse vs Playwright.** Run `npx lighthouse <url>` against the same page. Are LCP values identical? They should be close — Lighthouse uses the same browser API under the hood.
4. **Try a different `device`.** Lighthouse defaults to mobile + 4G throttling. Playwright uses your machine's full speed. Why do mobile-throttled measurements matter for CI gates?

## Common Mistakes

- **Asserting on lab metrics from a fast machine.** Your laptop is much faster than a real user's mid-range Android. Either throttle in Playwright (`page.context().route(...)`) or use Lighthouse's mobile preset.
- **Forgetting `{ buffered: true }`.** PerformanceObserver only fires for events that happen *after* you subscribe — without `buffered`, you miss everything that already happened.
- **Treating one measurement as the truth.** Web Vitals are noisy. Median over 10 runs > single run.
- **Not waiting for LCP to settle.** LCP can update multiple times during page load as larger elements paint. Wait for `load` event + a small buffer before reading.

## Cheat Sheet

```typescript
// Measure FCP, LCP, CLS in Playwright
const fcp = await page.evaluate(() => new Promise<number>((resolve) => {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') resolve(entry.startTime);
    }
  }).observe({ type: 'paint', buffered: true });
}));

const lcp = await page.evaluate(() => new Promise<number>((resolve) => {
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    resolve(entries[entries.length - 1].startTime);
  }).observe({ type: 'largest-contentful-paint', buffered: true });
}));

// CLS accumulates — sum all entries
const cls = await page.evaluate(() => new Promise<number>((resolve) => {
  let total = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // hadRecentInput skips shifts caused by user input
      if (!(entry as any).hadRecentInput) total += (entry as any).value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
  setTimeout(() => resolve(total), 1000);
}));
```

| Threshold | Good | Needs Improvement | Poor |
|-----------|------|-------------------|------|
| LCP | <2.5s | <4s | >4s |
| CLS | <0.1 | <0.25 | >0.25 |
| INP | <200ms | <500ms | >500ms |
| FCP | <1.8s | <3s | >3s |
| TTFB | <800ms | <1.8s | >1.8s |
