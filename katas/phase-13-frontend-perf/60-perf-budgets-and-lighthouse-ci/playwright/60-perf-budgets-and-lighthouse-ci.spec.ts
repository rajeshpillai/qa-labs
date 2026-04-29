// Kata 60 — Performance Budgets via Resource Timing API
//
// We use Playwright + Resource Timing API as a "poor man's Lighthouse CI"
// to demonstrate budget concepts. Real CI would use @lhci/cli — see the
// readme for the full lighthouserc.json + GitHub Actions setup.
//
// The assertions encode example resource budgets. Beyond the threshold,
// the spec fails — same as a real perf-budget breach.

import { test, expect } from '@playwright/test';

const PLAYGROUND_PATH = '/phase-13-frontend-perf/60-perf-budgets-and-lighthouse-ci/playground/';

interface ResourceStats {
  count: number;
  totalBytes: number;
  largestBytes: number;
  largestName: string;
  byType: Record<string, { count: number; bytes: number }>;
}

async function gatherResources(page: import('@playwright/test').Page): Promise<ResourceStats> {
  await page.goto(PLAYGROUND_PATH, { waitUntil: 'networkidle' });

  return page.evaluate<ResourceStats>(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const result: ResourceStats = {
      count: entries.length,
      totalBytes: 0,
      largestBytes: 0,
      largestName: '',
      byType: {},
    };

    for (const e of entries) {
      const size = e.transferSize || e.encodedBodySize || 0;
      result.totalBytes += size;

      if (size > result.largestBytes) {
        result.largestBytes = size;
        result.largestName = e.name.split('/').pop() || e.name;
      }

      const type = e.initiatorType || 'other';
      if (!result.byType[type]) result.byType[type] = { count: 0, bytes: 0 };
      result.byType[type].count += 1;
      result.byType[type].bytes += size;
    }

    return result;
  });
}

test.describe('Kata 60: Performance budgets', () => {
  test('Total request count under budget (<= 20)', async ({ page }) => {
    const stats = await gatherResources(page);
    console.log('Resource stats:', stats);
    // Budget: no more than 20 requests for a simple page.
    expect(stats.count).toBeLessThanOrEqual(20);
  });

  test('Total transferred bytes under budget (<= 50KB)', async ({ page }) => {
    const stats = await gatherResources(page);
    // Budget: 50KB total. The playground triggers 8 small /lab/echo requests
    // — should fit under this even with the page itself.
    expect(stats.totalBytes).toBeLessThanOrEqual(50 * 1024);
  });

  test('No single resource exceeds 20KB', async ({ page }) => {
    const stats = await gatherResources(page);
    // Budget: largest single resource <= 20KB. Catches accidentally-shipped
    // large images or unminified JS.
    expect(stats.largestBytes).toBeLessThanOrEqual(20 * 1024);
  });

  test('No more than 10 fetch/xhr requests (third-party budget proxy)', async ({ page }) => {
    const stats = await gatherResources(page);
    const fetches = (stats.byType.fetch?.count ?? 0) + (stats.byType.xmlhttprequest?.count ?? 0);
    // Budget: 10 fetch/XHR calls max. A real LHCI budget would target
    // `resourceCounts: third-party` — same idea, different mechanism.
    expect(fetches).toBeLessThanOrEqual(10);
  });

  test('Page basics still render (smoke)', async ({ page }) => {
    await page.goto(PLAYGROUND_PATH);
    await expect(page.getByTestId('title')).toBeVisible();
    await expect(page.getByTestId('stats')).toBeVisible();
  });
});
