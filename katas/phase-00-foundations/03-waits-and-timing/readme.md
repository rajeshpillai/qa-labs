# Kata 03: Waits and Timing

## What You Will Learn

- Why timing issues cause flaky tests (the #1 problem in test automation)
- How Playwright's auto-wait mechanism works
- How Cypress's retry-ability works
- When you need explicit waits vs when auto-wait handles it
- How to handle: delayed elements, loading states, polling, debounce, progress bars, toasts
- Why `sleep()` / `cy.wait(ms)` is almost always wrong
- Configuring timeouts for slow operations

## Prerequisites

- Completed Kata 01 (Selectors) and Kata 02 (Assertions)

## Concepts Explained

### The Timing Problem

Web pages are dynamic. Elements appear, disappear, load, animate, and change state. Your test runs faster than the browser renders. If you try to click a button that hasn't appeared yet, your test fails — not because the app is broken, but because the test was too fast.

### The Wrong Solution: sleep()

```typescript
// BAD - never do this
await page.waitForTimeout(3000); // Playwright
cy.wait(3000);                   // Cypress

// Why it's bad:
// 1. If the element appears in 100ms, you waste 2.9 seconds
// 2. If the element takes 3.5 seconds, your test still fails
// 3. On slow CI servers, timings are unpredictable
// 4. It makes your test suite painfully slow
```

### The Right Solution: Auto-Wait

Both Playwright and Cypress **automatically wait** for elements. Here's how:

### Playwright Auto-Wait

```typescript
// Playwright auto-waits in two places:

// 1. ACTIONS auto-wait for the element to be:
//    - Attached to DOM
//    - Visible
//    - Stable (not animating)
//    - Enabled (not disabled)
//    - Receives events (not blocked by another element)
await page.getByTestId('btn-submit').click();
// ^ Playwright waits up to 30s (default) for the button to be clickable

// 2. ASSERTIONS auto-retry until they pass:
await expect(page.getByTestId('result')).toHaveText('Success');
// ^ Playwright re-checks every 100ms for up to 5s (default)

// You can customize timeouts per-assertion:
await expect(page.getByTestId('result')).toHaveText('Success', { timeout: 10000 });
// ^ Wait up to 10 seconds

// Or per-action:
await page.getByTestId('btn').click({ timeout: 15000 });
```

### Cypress Retry-ability

```typescript
// Cypress automatically retries .should() assertions:
cy.get('[data-testid="result"]').should('have.text', 'Success');
// ^ Cypress retries the entire chain every few ms for up to 4s (default)

// Customize timeout per-command:
cy.get('[data-testid="result"]', { timeout: 10000 })
  .should('have.text', 'Success');

// IMPORTANT: Only the LAST command in a chain retries.
// cy.get retries finding the element.
// .should retries the assertion.
// But .click() does NOT retry — it runs once.
```

### When You DO Need Explicit Waits

Sometimes auto-wait isn't enough. Here are legitimate cases:

```typescript
// PLAYWRIGHT - waiting for a specific condition:

// waitForSelector — wait for an element to appear or disappear
await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });
// ^ Waits for the loading spinner to disappear

// waitForResponse — wait for a network response
const response = await page.waitForResponse('**/api/verify');
// ^ Waits for a specific API call to complete

// waitForFunction — wait for arbitrary JavaScript condition
await page.waitForFunction(() => {
  return document.querySelector('[data-testid="progress"]')?.textContent === '100%';
});

// CYPRESS - explicit waits:

// cy.intercept + cy.wait — wait for a network request
cy.intercept('POST', '/api/verify').as('verify');
cy.get('[data-testid="btn-submit"]').click();
cy.wait('@verify'); // waits for the intercepted request to complete

// Retry with should — Cypress retries the chain
cy.get('[data-testid="loading"]').should('not.exist');
```

### Timeout Configuration

```typescript
// PLAYWRIGHT - playwright.config.ts
export default defineConfig({
  use: {
    actionTimeout: 30000,   // timeout for actions (click, fill, etc.)
  },
  expect: {
    timeout: 5000,          // timeout for assertions
  },
});

// CYPRESS - cypress.config.ts
export default defineConfig({
  e2e: {
    defaultCommandTimeout: 4000,  // timeout for cy.get, .should, etc.
    pageLoadTimeout: 60000,       // timeout for cy.visit
    requestTimeout: 5000,         // timeout for cy.request
    responseTimeout: 30000,       // timeout for cy.wait (network)
  },
});
```

### Anti-Patterns

```typescript
// BAD: Fixed sleep
await page.waitForTimeout(5000);

// BAD: Polling in a loop
while (!(await element.isVisible())) { await page.waitForTimeout(100); }

// BAD: Arbitrary timeout without reason
cy.wait(2000);
cy.get('[data-testid="result"]').should('exist');

// GOOD: Let auto-wait handle it
await expect(page.getByTestId('result')).toBeVisible();

// GOOD: Wait for specific condition
await expect(page.getByTestId('status')).toHaveText('Complete');

// GOOD: Wait for network
cy.intercept('POST', '/api').as('req');
cy.wait('@req');
```

## Playground

The playground simulates common timing scenarios:

1. **Delayed Elements** — buttons that show content after 1s, 3s, and 7s delays
2. **Loading State** — fetch button that shows spinner then data after 2s
3. **Auto-Refreshing Status** — polling that updates every 2s through 5 steps
4. **Debounced Search** — search input with 300ms debounce delay
5. **Document Processing** — progress bar that fills incrementally
6. **Toast Notifications** — appear and auto-dismiss after 3s
7. **Conditional Rendering** — success/error responses after 1.5s delay
8. **Skeleton Loading** — skeleton placeholder then real data after 2.5s

## Exercises

### Exercise 1: Wait for Delayed Element
Click "Show after 1s" and verify the delayed message appears.

### Exercise 2: Wait for Slow Element
Click "Show after 3s" and verify it appears. You may need to increase the assertion timeout.

### Exercise 3: Loading State Transition
Click "Fetch Applicant Data", verify the loading spinner appears, then verify it's replaced by the applicant data.

### Exercise 4: Polling / Auto-Refresh
Click "Start Verification" and wait for the status to reach "Complete" (step 5/5). This takes ~10 seconds.

### Exercise 5: Debounced Search
Type "Priya" in the search box. Verify the searching indicator appears briefly, then the results show.

### Exercise 6: Progress Bar
Click "Upload & Process Document" and wait for the progress to reach 100%.

### Exercise 7: Toast Notification Lifecycle
Click "Success Toast", verify it appears, then verify it auto-dismisses after 3 seconds.

### Exercise 8: Skeleton to Content
Click "Load Profile", verify the skeleton loader appears, then verify the real profile data replaces it.

## Solutions

### Playwright Solution

See `playwright/waits.spec.ts`

### Cypress Solution

See `cypress/waits.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using `page.waitForTimeout(5000)` | Wastes time or isn't enough | Use `expect().toBeVisible()` with auto-wait |
| Not increasing timeout for slow ops | Default 5s may not be enough for 7s delay | Pass `{ timeout: 10000 }` to the assertion |
| Checking for spinner then immediately checking for data | Spinner might disappear between checks | Wait for the final state (data loaded), not intermediate |
| Using `cy.wait(ms)` instead of `cy.wait('@alias')` | Time-based waits are flaky | Intercept the request and wait for it |
| Asserting toast text after it auto-dismisses | Toast may be gone by the time assertion runs | Assert immediately after triggering the toast |

## Quick Reference

### Playwright Wait Methods

| Method | Use case | Example |
|--------|----------|---------|
| Auto-wait (default) | Element actions | `await btn.click()` — waits for clickable |
| `expect().toBeVisible()` | Wait for element to appear | Auto-retries for 5s |
| `expect().toBeHidden()` | Wait for element to disappear | Auto-retries for 5s |
| `{ timeout: N }` | Override assertion timeout | `toHaveText('x', { timeout: 10000 })` |
| `waitForSelector(sel, { state })` | Wait for DOM state | `state: 'hidden'` or `'attached'` |
| `waitForResponse(url)` | Wait for network response | `await page.waitForResponse('**/api')` |
| `waitForFunction(fn)` | Wait for JS condition | `() => document.title === 'Done'` |

### Cypress Wait Methods

| Method | Use case | Example |
|--------|----------|---------|
| Auto-retry (default) | `.should()` chains | Retries for 4s |
| `{ timeout: N }` | Override command timeout | `cy.get(sel, { timeout: 10000 })` |
| `cy.intercept + cy.wait` | Wait for network | `cy.wait('@alias')` |
| `.should('not.exist')` | Wait for removal | Retries until element is gone |
| `.should('be.visible')` | Wait for appearance | Retries until visible |
