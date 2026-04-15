# Kata 09: Scroll and Intersection

## What You Will Learn

- How to test infinite scroll powered by `IntersectionObserver`
- Verifying lazy-loaded images swap from placeholder to real source
- Testing "back to top" button visibility and scroll-to-top behaviour
- Checking that a fixed header changes style (compact mode) on scroll
- Validating scroll-spy navigation highlights the correct section
- Asserting whether an element is inside or outside the viewport
- Playwright: `scrollIntoViewIfNeeded()`, `page.evaluate()`, `waitForFunction()`
- Cypress: `scrollIntoView()`, `cy.scrollTo()`, `cy.window().its('scrollY')`

## Prerequisites

- Node.js 18+ installed
- Completed Kata 01-08 or comfortable with selectors, assertions, and waits
- Basic understanding of the browser scroll model (`scrollY`, `getBoundingClientRect`)

## Concepts Explained

### IntersectionObserver

The `IntersectionObserver` API lets JavaScript react when an element enters or leaves the viewport (or any scrollable ancestor). It is the modern way to implement:

- **Infinite scroll** — load more data when a sentinel element becomes visible
- **Lazy loading** — swap a placeholder image for the real source on visibility
- **Scroll-spy** — highlight the nav link whose section is currently visible

```javascript
// Create an observer that fires when the target is 10% visible
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // The element just scrolled into view — do something
    }
  });
}, { threshold: 0.1 });

// Start observing a DOM element
observer.observe(document.getElementById('sentinel'));
```

### Scrolling in Tests

| Goal | Playwright | Cypress |
|------|-----------|---------|
| Scroll element into view | `locator.scrollIntoViewIfNeeded()` | `cy.get(sel).scrollIntoView()` |
| Scroll to coordinates | `page.evaluate(() => window.scrollTo(0, 500))` | `cy.scrollTo(0, 500)` |
| Read scroll position | `page.evaluate(() => window.scrollY)` | `cy.window().its('scrollY')` |
| Wait for scroll position | `page.waitForFunction(() => window.scrollY === 0)` | `cy.window().its('scrollY').should('equal', 0)` |

### Viewport Checks

To verify whether an element is inside the viewport:

```javascript
const rect = element.getBoundingClientRect();
const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
```

## Playground

Open the playground in your browser. It contains a **fintech transaction feed** with:

1. **Fixed header** — shrinks to compact mode when you scroll past 100px
2. **Scroll-spy nav** — right-side nav that highlights the current section
3. **Lazy images** — four cheque image placeholders that load when scrolled into view
4. **Infinite-scroll feed** — starts with 10 transactions, loads 10 more each time you reach the sentinel
5. **Back-to-top button** — appears when scrolled past 300px, smooth-scrolls to top on click
6. **Item count display** — shows how many transactions have been loaded

```bash
# start the playground server
npx serve katas -l 8080

# open in browser
# http://localhost:8080/phase-01-dom-and-browser-apis/09-scroll-and-intersection/playground/
```

## Exercises

### Exercise 1: Scroll to Bottom and Verify New Items Load

Scroll the "load more" sentinel into view and verify the transaction list grows from 10 to 20 items.

**Playwright hint**: `scrollIntoViewIfNeeded()` on the sentinel, then count `[data-testid^="tx-item-"]`
**Cypress hint**: `cy.get(sentinel).scrollIntoView()`, then `.should('have.length', 20)`

### Exercise 2: Lazy Image Loads on Scroll

Scroll a lazy image into view and verify its `src` changes from the SVG placeholder to the real URL.

**Playwright hint**: check `toHaveAttribute('data-loaded', 'true')`
**Cypress hint**: `.should('have.attr', 'data-loaded', 'true')`

### Exercise 3: Back-to-Top Button Appears

Scroll down past 300px and verify the back-to-top button becomes visible.

### Exercise 4: Click Back-to-Top and Verify Scroll Position

Click the button and verify `window.scrollY` returns to 0.

**Playwright hint**: `page.waitForFunction(() => window.scrollY === 0)`
**Cypress hint**: `cy.window().its('scrollY').should('equal', 0)`

### Exercise 5: Fixed Header Compact Mode

Scroll past 100px and verify the header element gains the `compact` class. Scroll back and verify it is removed.

### Exercise 6: Scroll-Spy Navigation

Scroll to the feed section and verify the "Feed" nav link gains the `active` class while "Overview" loses it.

### Exercise 7: Viewport Check

Assert that the overview section is in the viewport on initial load, and the feed section is not.

### Exercise 8: Loaded Item Count

Trigger two rounds of infinite scroll and verify the displayed count reads "30" and 30 items exist in the DOM.

## Solutions

### Playwright Solution

See `playwright/scroll.spec.ts` — every line is commented to explain what it does.

### Cypress Solution

See `cypress/scroll.cy.ts` — every line is commented to explain what it does.

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using `window.scrollTo` without waiting | Smooth scroll is async — the assertion fires before scroll completes | Use `waitForFunction` (Playwright) or `.should()` retry (Cypress) |
| Checking `display: none` with `toBeVisible` | Playwright's `toBeHidden` is the correct negative check | Use `toBeHidden()` or `not.toBeVisible()` |
| Not waiting after `scrollIntoView` | IntersectionObserver callbacks are async | Use assertions with retries or explicit waits |
| Checking class with string equality | The class attribute may contain multiple classes | Use regex (`/compact/`) or `.should('have.class', 'compact')` |

## Quick Reference

### Playwright Scroll Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `scrollIntoViewIfNeeded()` | Scroll element into viewport | `locator.scrollIntoViewIfNeeded()` |
| `page.evaluate(fn)` | Run JS in browser (e.g., `window.scrollBy`) | `page.evaluate(() => window.scrollBy(0, 500))` |
| `page.waitForFunction(fn)` | Wait until browser JS predicate is true | `page.waitForFunction(() => scrollY === 0)` |
| `toHaveClass(/name/)` | Assert class via regex | `expect(el).toHaveClass(/compact/)` |

### Cypress Scroll Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `.scrollIntoView()` | Scroll element into viewport | `cy.get(sel).scrollIntoView()` |
| `cy.scrollTo(x, y)` | Scroll window to coordinates | `cy.scrollTo(0, 500)` |
| `cy.window().its(prop)` | Read window property | `cy.window().its('scrollY').should('eq', 0)` |
| `.should('have.class')` | Assert CSS class | `.should('have.class', 'compact')` |
