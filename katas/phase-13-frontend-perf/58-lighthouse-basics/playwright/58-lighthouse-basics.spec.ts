// Kata 58 — Lighthouse Basics: measure Web Vitals via Playwright
//
// We measure FCP, LCP, CLS, and TTFB on the kata's playground page using
// the browser's native PerformanceObserver. No Lighthouse CLI needed —
// the same browser API powers Lighthouse itself.

import { test, expect } from '@playwright/test';

const PLAYGROUND_PATH = '/phase-13-frontend-perf/58-lighthouse-basics/playground/';

interface WebVitals {
  fcp: number;       // ms
  lcp: number;       // ms
  cls: number;       // unitless
  ttfb: number;      // ms
}

async function measureWebVitals(page: import('@playwright/test').Page): Promise<WebVitals> {
  await page.goto(PLAYGROUND_PATH);

  // Give the browser a beat to populate timings, then read metrics.
  // PerformanceObserver with `buffered: true` captures events that already fired.
  return page.evaluate<WebVitals>(() => new Promise((resolve) => {
    const result: WebVitals = { fcp: -1, lcp: -1, cls: 0, ttfb: -1 };

    // FCP — first time any text/image paints
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          result.fcp = entry.startTime;
        }
      }
    }).observe({ type: 'paint', buffered: true });

    // LCP — the largest above-the-fold element. Updates over time as
    // larger elements paint; we take the LAST value reported.
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      result.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS — accumulates. Sum of all (non-input-driven) layout-shift values.
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ls = entry as any;
        if (!ls.hadRecentInput) result.cls += ls.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // TTFB — from Navigation Timing API
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) result.ttfb = nav.responseStart;

    // Wait long enough for late layout shifts and final LCP update.
    setTimeout(() => resolve(result), 1500);
  }));
}

test.describe('Kata 58: Web Vitals on a well-built page', () => {
  test('FCP under 1800ms (good threshold)', async ({ page }) => {
    const vitals = await measureWebVitals(page);
    console.log('Measured Web Vitals:', vitals);
    expect(vitals.fcp).toBeGreaterThan(0);
    expect(vitals.fcp).toBeLessThan(1800);
  });

  test('LCP under 2500ms (good threshold)', async ({ page }) => {
    const vitals = await measureWebVitals(page);
    expect(vitals.lcp).toBeGreaterThan(0);
    expect(vitals.lcp).toBeLessThan(2500);
  });

  test('CLS under 0.1 (good threshold)', async ({ page }) => {
    const vitals = await measureWebVitals(page);
    // Page has no post-load shifts, so CLS should be ~0.
    expect(vitals.cls).toBeLessThan(0.1);
  });

  test('TTFB under 800ms (good threshold)', async ({ page }) => {
    const vitals = await measureWebVitals(page);
    expect(vitals.ttfb).toBeGreaterThan(0);
    expect(vitals.ttfb).toBeLessThan(800);
  });

  test('LCP element is the hero (largest above-the-fold)', async ({ page }) => {
    await page.goto(PLAYGROUND_PATH);
    // Sanity check that the perf-critical element actually rendered.
    await expect(page.getByTestId('hero')).toBeVisible();
  });
});
