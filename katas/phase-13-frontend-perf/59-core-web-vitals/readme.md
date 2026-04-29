# Kata 59: Core Web Vitals Deep Dive

## What You Will Learn

- The **causes** behind a bad LCP, CLS, or INP — not just the numbers
- How to identify the **LCP element** in DevTools and in code
- The four sources of layout shift: **late images, async fonts, ad slots, dynamic content**
- Why **TBT (Total Blocking Time)** matters even though Web Vitals replaced it with INP
- How to measure improvements: before/after diffs, threshold-aware assertions
- A guided debugging exercise on a deliberately broken page

## Prerequisites

- Completed [Kata 58 (Lighthouse Basics)](../58-lighthouse-basics/)
- Browser DevTools open + Performance tab familiarity

## Concepts Explained

### Why LCP fails

Common causes ranked by frequency:

1. **The LCP element loads slowly** (large image, lazy-loaded asset, late `srcset`)
2. **Render-blocking CSS** — the browser can't paint until external CSS finishes
3. **Slow server (TTFB)** — every metric downstream is bounded by TTFB
4. **JavaScript hydration** delaying content paint
5. **Wrong LCP element** — biggest visible thing isn't what you think it is

The fix depends on which one. **Fix the cause, not the metric.**

### Identifying the LCP element

Two ways:

```typescript
// In Playwright / browser console:
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lcpEntry = entries[entries.length - 1] as LargestContentfulPaint;
  console.log('LCP element:', lcpEntry.element);
  console.log('LCP url (if image):', (lcpEntry as any).url);
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

Or in **Chrome DevTools → Performance → Timings → LCP marker** — click it and DevTools highlights the element on screen.

### CLS sources

CLS is "stuff jumping around after first paint." The four big offenders:

| Source | Symptom | Fix |
|--------|---------|-----|
| **Images without `width`/`height`** | Image loads, pushes everything below it down | Always set width/height (or aspect-ratio CSS) |
| **Web fonts** | Text reflows when custom font loads (FOIT/FOUT) | Use `font-display: optional`, preload critical fonts |
| **Ads / 3rd-party widgets** | Iframe loads later, pushes content | Reserve space with min-height |
| **Dynamic content insertion** | API response triggers a render that pushes existing content | Insert above the fold or below user's viewport |

Each source has its own debugging signature. Look at **Performance → Layout Shifts** in DevTools to see which DOM nodes shifted.

### INP — Interaction to Next Paint

INP replaced **First Input Delay (FID)** as a Core Web Vital in March 2024. The difference:

| | FID (deprecated) | INP (current) |
|---|---|---|
| What | Delay before processing **first** interaction | **Worst** delay across the whole session |
| Captures | Click handler queueing | Click + keyboard + visual paint |
| Why it changed | FID only looked at the first interaction; INP catches interactions throughout the session |

INP is harder to "fail at" with synthetic tests since you'd need to simulate user interactions. The kata's spec includes a click + measure pattern.

### TBT — Total Blocking Time

TBT isn't a Core Web Vital but appears in Lighthouse reports. It measures **time the main thread was blocked** for >50ms during page load. Closely correlated with INP — fix one, the other usually improves too.

Lighthouse threshold: **TBT < 200ms is good.** Caused by long synchronous JavaScript.

### The deliberately broken playground

Kata 59's `playground/index.html` ships with intentional perf issues:

- **Slow image** — fetched from a 1500ms-delayed `/lab/slow` (LCP target, slow on purpose)
- **Layout shift** — text rendered first, image arrives later and pushes content down
- **Long task** — 800ms of synchronous busy-loop JavaScript on click

Run the kata's spec — it should report **bad** values. Your exercise: fix the page, re-run, watch the numbers go green.

## Exercises

1. **Run the kata as-shipped.** What LCP, CLS, and total task duration do you see? Map each to a cause.
2. **Fix LCP.** Replace the slow image with an inline SVG. Re-run. New LCP?
3. **Fix CLS.** Add `width`/`height` attributes to the `<img>` so it reserves space before loading. Re-run. New CLS?
4. **Fix the long task.** Move the busy-loop into `requestIdleCallback`. Re-run. New TBT?
5. **Compare with Lighthouse.** Run `npx lighthouse http://localhost:8080/phase-13-frontend-perf/59-core-web-vitals/playground/` and compare its Performance score before and after each fix.

## Common Mistakes

- **Fixing the metric, not the cause.** "LCP is bad, let me preload the image" — but the image isn't the LCP element. Always identify the element first.
- **Ignoring CLS because the page looks fine in your browser.** Your browser already cached the font. Test in incognito + slow 3G + cleared cache.
- **Long tasks treated as warnings instead of bugs.** A 500ms synchronous task on click is a bug. INP is the failure mode users feel.
- **Per-page instead of per-flow measurements.** A user navigates many pages — measuring only the landing page misses regressions on detail pages.

## Cheat Sheet

| Bad metric | First place to look |
|------------|---------------------|
| LCP > 2.5s | What's the LCP element? Is it a slow image? Render-blocking CSS? |
| CLS > 0.1 | DevTools → Performance → Layout Shifts |
| INP > 200ms | DevTools → Performance → Long tasks |
| TBT > 200ms | DevTools → Coverage → unused JavaScript |
| TTFB > 800ms | Server-side problem, not frontend |

| Fix toolkit |
|-------------|
| `<link rel="preload" as="image">` for hero image |
| `<img width="X" height="Y">` for every image |
| `font-display: swap` (or `optional`) on `@font-face` |
| `min-height` on ad/iframe placeholders |
| `requestIdleCallback` for non-critical JS |
| Code-split: only ship JS the page actually uses |
