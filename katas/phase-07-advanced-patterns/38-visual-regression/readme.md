# Kata 38: Visual Regression Testing

## What You Will Learn

- What visual regression testing is and when to use it
- How to capture baseline screenshots and compare against future runs
- How to use Playwright's built-in `toHaveScreenshot()` matcher
- How to use Cypress's `cy.screenshot()` and image-snapshot plugins
- How to tune comparison thresholds to avoid false positives
- How to handle dynamic content (timestamps, animations) in screenshots

## Prerequisites

- Completed Katas 01-37
- Understanding of assertions and test structure
- A visual sense of what "looks right" (the test does the pixel comparison)

## Concepts Explained

### What Is Visual Regression Testing?

```
Visual regression testing catches UNINTENDED visual changes in your UI.

Functional tests verify behavior — "does clicking Submit show a success message?"
Visual tests verify appearance — "does the page LOOK the same as last time?"

The workflow:
  1. Run tests the first time → screenshots are saved as BASELINES
  2. Run tests again → new screenshots are compared pixel-by-pixel
  3. If pixels differ beyond a threshold → the test FAILS
  4. You review the diff and either:
     a. Accept the change (update the baseline)
     b. Fix the regression (a CSS bug, layout shift, etc.)
```

### When to Use Visual Regression Testing

```
GOOD use cases:
  - Component libraries (buttons, cards, modals look consistent)
  - Dashboard layouts (tables, charts maintain structure)
  - Brand-critical pages (landing pages, login screens)
  - Cross-browser consistency (same page in Chrome vs Firefox)

POOR use cases:
  - Pages with lots of dynamic data (timestamps, live feeds)
  - Content that changes frequently (news feeds, user-generated)
  - Animations that are hard to freeze

Rule of thumb: if the page has a stable, predictable layout, visual
regression testing adds value. If the page changes every second, skip it.
```

### Playwright: toHaveScreenshot()

```typescript
// PLAYWRIGHT — built-in visual comparison, no plugins needed.
//
// toHaveScreenshot(name?, options?) captures a screenshot and compares it
// to a stored baseline image.
//
// First run:  saves the screenshot as the baseline in a __snapshots__ folder
// Next runs:  compares the new screenshot against the baseline
//
// Key options:
//   maxDiffPixels      — max number of pixels allowed to differ (default: 0)
//   maxDiffPixelRatio  — max ratio of different pixels (0.0 to 1.0)
//   threshold          — per-pixel color difference threshold (0.0 to 1.0)
//   mask               — array of locators to mask (hide dynamic content)
//   fullPage           — capture the full scrollable page (default: false)
//   animations         — 'disabled' freezes CSS animations (recommended)

await expect(page).toHaveScreenshot('dashboard.png', {
  maxDiffPixelRatio: 0.01,   // allow 1% pixel difference
  animations: 'disabled',    // freeze animations before capture
});
```

### Cypress: cy.screenshot() + Plugins

```typescript
// CYPRESS — cy.screenshot() captures images but does NOT compare them.
// For comparison, you need a plugin:
//
// Option 1: cypress-image-snapshot (open source)
//   npm install --save-dev @simonsmith/cypress-image-snapshot
//   Adds cy.matchImageSnapshot() command
//
// Option 2: Percy (cloud service by BrowserStack)
//   npm install --save-dev @percy/cypress
//   Adds cy.percySnapshot() command — uploads to Percy for comparison
//
// Option 3: Manual comparison
//   cy.screenshot('name') saves to cypress/screenshots/
//   You compare manually or with a CI script

// Basic screenshot capture:
cy.screenshot('dashboard-baseline');

// With cypress-image-snapshot:
cy.matchImageSnapshot('dashboard', {
  failureThreshold: 0.01,       // 1% threshold
  failureThresholdType: 'percent'
});
```

### Handling Dynamic Content

```
Dynamic content (dates, random IDs, live data) causes false failures.
Strategies to handle it:

1. MASK ELEMENTS — hide them with a colored box before capture
   Playwright: mask: [page.locator('.timestamp')]
   Cypress: hide the element with cy.get('.timestamp').invoke('css', 'visibility', 'hidden')

2. FREEZE TIME — set a fixed date/time in the test
   Playwright: page.clock.install({ time: new Date('2025-01-01') })
   Cypress: cy.clock(new Date('2025-01-01').getTime())

3. REPLACE CONTENT — replace dynamic text with static text before capture
   await page.locator('.timestamp').evaluate(el => el.textContent = '2025-01-01');

4. INCREASE THRESHOLD — allow more pixel difference (last resort)
   maxDiffPixelRatio: 0.05  // allow 5% difference
```

## Exercises

### Exercise 1: Full-Page Screenshot Baseline
Capture a full-page screenshot of the KYC dashboard and establish a baseline.

### Exercise 2: Element-Level Screenshot
Capture a screenshot of a single component (a card or table) and compare it.

### Exercise 3: Mask Dynamic Content
Mask a timestamp element before capturing, so the test is stable.

### Exercise 4: Threshold Tuning
Experiment with different threshold values and see what passes/fails.

### Exercise 5: Cross-Browser Visual Test
Capture the same page in different viewport sizes and compare.

### Exercise 6: Cypress Screenshot Capture
Use cy.screenshot() to capture and organize screenshots for manual review.

## Key Takeaways

```
- Visual regression catches CSS/layout bugs that functional tests miss
- Playwright has built-in toHaveScreenshot() — no plugins needed
- Cypress needs a plugin (cypress-image-snapshot) for automated comparison
- Always mask or freeze dynamic content to avoid flaky tests
- Set reasonable thresholds — 0% difference is too strict for most UIs
- Update baselines intentionally when the design changes
```
