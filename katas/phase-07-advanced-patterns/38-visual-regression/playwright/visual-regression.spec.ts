import { test, expect } from '@playwright/test';

// =============================================================================
// Kata 38: Visual Regression Testing — Playwright Tests
// =============================================================================
// These tests demonstrate Playwright's built-in visual comparison features.
//
// FIRST RUN: Tests will FAIL and create baseline screenshots in:
//   playwright/visual-regression.spec.ts-snapshots/
//
// SECOND RUN: Tests compare new screenshots against the baselines.
// If the UI hasn't changed, tests pass. If pixels differ, tests fail.
//
// To UPDATE baselines after an intentional change:
//   npx playwright test --update-snapshots
// =============================================================================

const PLAYGROUND = '/phase-07-advanced-patterns/38-visual-regression/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Full-Page Screenshot Baseline
// --------------------------------------------------------------------------
// toHaveScreenshot() captures the visible viewport and compares it to a
// stored baseline image. On first run, it saves the baseline.
test('exercise 1: full page screenshot baseline', async ({ page }) => {
  // Navigate to the dashboard playground.
  await page.goto(PLAYGROUND);

  // toHaveScreenshot(name) captures a screenshot and compares to baseline.
  //
  // Parameters:
  //   name (string) — the filename for the baseline image (e.g., 'dashboard.png')
  //
  // Options used here:
  //   fullPage: true — captures the entire scrollable page, not just the viewport
  //   animations: 'disabled' — freezes all CSS animations before capture
  //     This prevents flaky tests from spinner animations or transitions.
  //
  // On FIRST run: saves the screenshot as the baseline and the test passes.
  // On SUBSEQUENT runs: compares the new screenshot to the baseline.
  await expect(page).toHaveScreenshot('dashboard-full.png', {
    fullPage: true,
    animations: 'disabled'
  });
});

// --------------------------------------------------------------------------
// Exercise 2: Element-Level Screenshot
// --------------------------------------------------------------------------
// Instead of the full page, capture just ONE element.
// This is useful for testing specific components (cards, tables, modals).
test('exercise 2: screenshot a single component', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Locate a specific element — the dashboard cards container.
  // getByTestId('dashboard-cards') finds the element with data-testid="dashboard-cards".
  const dashboardCards = page.getByTestId('dashboard-cards');

  // toHaveScreenshot() also works on locators (not just pages).
  // This captures ONLY the element, not the full page.
  await expect(dashboardCards).toHaveScreenshot('dashboard-cards.png', {
    animations: 'disabled'
  });

  // Capture just the table section as well.
  const tableSection = page.getByTestId('applicant-table-section');

  await expect(tableSection).toHaveScreenshot('applicant-table.png', {
    animations: 'disabled'
  });
});

// --------------------------------------------------------------------------
// Exercise 3: Mask Dynamic Content
// --------------------------------------------------------------------------
// The timestamp at the bottom changes every second. Without masking,
// the test would fail every time because the pixels are different.
test('exercise 3: mask dynamic elements before capture', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // The `mask` option takes an array of locators.
  // Each matched element is replaced with a solid-color box (default: magenta)
  // in the screenshot. This prevents dynamic text from causing false failures.
  await expect(page).toHaveScreenshot('dashboard-masked.png', {
    fullPage: true,
    animations: 'disabled',
    // mask — an array of Locator objects to hide in the screenshot.
    // The element is replaced with a colored box so it doesn't affect comparison.
    mask: [
      page.getByTestId('timestamp')  // mask the dynamic timestamp
    ],
    // maskColor — the color of the mask box (default: '#FF00FF' magenta).
    // Using a neutral color makes the screenshot look cleaner.
    maskColor: '#94a3b8'
  });
});

// --------------------------------------------------------------------------
// Exercise 4: Threshold Tuning
// --------------------------------------------------------------------------
// Sometimes tiny rendering differences (anti-aliasing, sub-pixel rendering)
// cause false failures. Thresholds let you allow small differences.
test('exercise 4: tune comparison thresholds', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Option A: maxDiffPixelRatio — allow a percentage of pixels to differ.
  // 0.01 = 1% of pixels can be different and the test still passes.
  // This is the most common threshold setting.
  await expect(page).toHaveScreenshot('dashboard-threshold-ratio.png', {
    fullPage: true,
    animations: 'disabled',
    mask: [page.getByTestId('timestamp')],
    maxDiffPixelRatio: 0.01  // allow 1% pixel difference
  });

  // Option B: maxDiffPixels — allow a fixed number of pixels to differ.
  // Useful when you know the image size and want absolute control.
  await expect(page).toHaveScreenshot('dashboard-threshold-pixels.png', {
    fullPage: true,
    animations: 'disabled',
    mask: [page.getByTestId('timestamp')],
    maxDiffPixels: 100  // allow up to 100 pixels to differ
  });

  // Option C: threshold — per-pixel color sensitivity (0.0 to 1.0).
  // 0.2 means each pixel's color can differ by up to 20% and still match.
  // Higher values = more tolerant. Default is 0.2.
  await expect(page).toHaveScreenshot('dashboard-threshold-color.png', {
    fullPage: true,
    animations: 'disabled',
    mask: [page.getByTestId('timestamp')],
    threshold: 0.3  // allow 30% color difference per pixel
  });
});

// --------------------------------------------------------------------------
// Exercise 5: Different Viewport Sizes
// --------------------------------------------------------------------------
// Test the same page at different viewport sizes to catch responsive layout
// regressions. Each viewport gets its own baseline screenshot.
test('exercise 5: visual test at mobile viewport', async ({ page }) => {
  // setViewportSize(width, height) changes the browser window dimensions.
  // This simulates viewing the page on a mobile device.
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto(PLAYGROUND);

  await expect(page).toHaveScreenshot('dashboard-mobile.png', {
    fullPage: true,
    animations: 'disabled',
    mask: [page.getByTestId('timestamp')]
  });
});

test('exercise 5b: visual test at tablet viewport', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });

  await page.goto(PLAYGROUND);

  await expect(page).toHaveScreenshot('dashboard-tablet.png', {
    fullPage: true,
    animations: 'disabled',
    mask: [page.getByTestId('timestamp')]
  });
});

// --------------------------------------------------------------------------
// Exercise 6: Screenshot After Interaction
// --------------------------------------------------------------------------
// Capture the visual state AFTER a user interaction (hover, click, etc.).
// This tests that hover states, focus rings, and click effects look correct.
test('exercise 6: screenshot after hover interaction', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // hover() moves the mouse over the element, triggering :hover CSS styles.
  // We capture the screenshot while the hover state is active.
  await page.getByTestId('btn-export').hover();

  // Capture just the action buttons area while the hover effect is visible.
  const actionButtons = page.getByTestId('action-buttons');

  await expect(actionButtons).toHaveScreenshot('buttons-hover-state.png', {
    animations: 'disabled'
  });
});
