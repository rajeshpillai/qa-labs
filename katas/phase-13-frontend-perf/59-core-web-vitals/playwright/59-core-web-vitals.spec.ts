// Kata 59 — Core Web Vitals Deep Dive
//
// Measures Web Vitals + Long Tasks on a deliberately broken page. Asserts
// the failures (LCP slow, CLS present, long task on click). The exercise
// in the readme is to FIX the page and watch these tests start failing —
// at which point you flip the assertions to require the metrics be GOOD.

import { test, expect } from '@playwright/test';

const PLAYGROUND_PATH = '/phase-13-frontend-perf/59-core-web-vitals/playground/';

interface Metrics {
  fcp: number;
  lcp: number;
  cls: number;
  longestTaskMs: number;
}

async function measure(page: import('@playwright/test').Page): Promise<Metrics> {
  await page.goto(PLAYGROUND_PATH);

  return page.evaluate<Metrics>(() => new Promise((resolve) => {
    const result: Metrics = { fcp: -1, lcp: -1, cls: 0, longestTaskMs: 0 };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') result.fcp = entry.startTime;
      }
    }).observe({ type: 'paint', buffered: true });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      result.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ls = entry as any;
        if (!ls.hadRecentInput) result.cls += ls.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // long-task entries appear when the main thread blocks for >50ms
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > result.longestTaskMs) result.longestTaskMs = entry.duration;
      }
    }).observe({ type: 'longtask', buffered: true });

    // Wait long enough for the slow image to arrive (1500ms server delay).
    setTimeout(() => resolve(result), 2500);
  }));
}

test.describe('Kata 59: Web Vitals on a deliberately broken page', () => {
  test('LCP is bad (>1500ms) — slow image is the cause', async ({ page }) => {
    const m = await measure(page);
    console.log('Broken-page metrics:', m);
    // Hero is fetched from /lab/slow?ms=1500. LCP will be at least 1500ms.
    // Once you fix the page (replace with inline SVG), this assertion
    // SHOULD START FAILING — invert it to lcp < 1500 to lock in the fix.
    expect(m.lcp).toBeGreaterThan(1500);
  });

  test('CLS is bad (>0.05) — image pushes content', async ({ page }) => {
    const m = await measure(page);
    // Image without width/height pushes the cards below when it loads.
    // After fixing (add width/height attributes), CLS should drop near 0.
    expect(m.cls).toBeGreaterThan(0.05);
  });

  test('Click on slow button produces a long task (>500ms)', async ({ page }) => {
    await page.goto(PLAYGROUND_PATH);

    // Set up observer BEFORE the click so we capture the long task.
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__longTasks = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).__longTasks.push(entry.duration);
        }
      }).observe({ type: 'longtask', buffered: true });
    });

    // Suppress the alert so the click doesn't block the test.
    page.on('dialog', (dialog) => dialog.dismiss());

    await page.getByTestId('slow-button').click();
    // Give the longtask observer a tick to record.
    await page.waitForTimeout(200);

    const tasks = await page.evaluate<number[]>(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (window as any).__longTasks ?? [];
    });
    const longest = Math.max(0, ...tasks);
    console.log('Long tasks observed:', tasks);
    expect(longest).toBeGreaterThan(500);
  });

  test('All three intentionally-broken elements are present', async ({ page }) => {
    await page.goto(PLAYGROUND_PATH);
    await expect(page.getByTestId('hero')).toBeAttached();
    await expect(page.getByTestId('card-1')).toBeVisible();
    await expect(page.getByTestId('slow-button')).toBeVisible();
  });
});
