# Kata 08: CSS Animations and Transitions

## What You Will Learn

- How to detect and verify CSS animations (e.g., spinner rotation)
- How to verify CSS transitions (e.g., opacity fade, width change, transform)
- How to check computed styles during and after transitions
- How to wait for animations/transitions to complete before asserting
- How to test card flip animations, slide-in panels, and accordion components
- How to handle overlays that appear and disappear with CSS transitions

## Prerequisites

- Completed Kata 01-07
- Basic understanding of CSS transitions and animations

## Concepts Explained

### CSS Transitions vs Animations

```
CSS TRANSITIONS
  - Triggered by a property change (e.g., adding a class that changes opacity)
  - Defined with: transition: property duration timing-function
  - Run once per trigger, from start value to end value
  - Example: opacity 0 -> 1 over 0.5s when class "visible" is added

CSS ANIMATIONS
  - Defined with @keyframes rules
  - Can run continuously (infinite) or a set number of times
  - Controlled with: animation: name duration timing-function iteration-count
  - Example: spinner rotating 360 degrees in a loop
```

### Playwright: Checking Computed CSS Styles

```typescript
// PLAYWRIGHT
// To check CSS properties, use locator.evaluate() to access the browser's
// window.getComputedStyle() API, which returns the actual rendered values.
//
// getComputedStyle(element) returns a CSSStyleDeclaration object with
// all CSS properties as they are actually rendered (after all CSS rules,
// transitions, and animations have been applied).

// Check opacity:
const opacity = await page.getByTestId('fade-element').evaluate(
  (el) => window.getComputedStyle(el).opacity
);
// opacity is a string like "0" or "1"

// Check transform:
const transform = await page.getByTestId('sidebar-panel').evaluate(
  (el) => window.getComputedStyle(el).transform
);
// transform is a string like "matrix(1, 0, 0, 1, 0, 0)" for translateX(0)

// Check animation-name:
const animName = await page.getByTestId('spinner').evaluate(
  (el) => window.getComputedStyle(el).animationName
);
// animName is "spin" if the animation is active, "none" if not

// Check a CSS class is present:
await expect(page.getByTestId('flip-card')).toHaveClass(/flipped/);
```

### Cypress: Checking Computed CSS Styles

```typescript
// CYPRESS
// Use .should('have.css', property, value) to check computed CSS properties.
// Cypress automatically calls getComputedStyle() under the hood.
//
// .should('have.css', property) — asserts the property exists
// .should('have.css', property, value) — asserts exact value match
//
// Note: Computed values may be in different formats than what you set.
// For example, "translateX(0)" becomes "matrix(1, 0, 0, 1, 0, 0)".

// Check opacity:
cy.get('[data-testid="fade-element"]').should('have.css', 'opacity', '1');

// Check transform (note: computed value is a matrix string):
cy.get('[data-testid="sidebar-panel"]')
  .should('have.css', 'transform', 'matrix(1, 0, 0, 1, 0, 0)');

// Check animation-name:
cy.get('[data-testid="spinner"]').should('have.css', 'animation-name', 'spin');

// Check a CSS class is present:
cy.get('[data-testid="flip-card"]').should('have.class', 'flipped');
```

### Waiting for Transitions to Complete

```typescript
// PLAYWRIGHT
// Option 1: Wait for a specific CSS state to be reached.
// Playwright's expect() auto-retries until the assertion passes or times out.
await expect(page.getByTestId('fade-element')).toHaveCSS('opacity', '1');

// Option 2: Use page.waitForTimeout() if you need a fixed delay.
// (Not recommended — prefer assertions that auto-retry.)
await page.waitForTimeout(600); // wait for 0.5s transition + buffer

// CYPRESS
// Cypress .should() assertions auto-retry until they pass or timeout.
// So checking a CSS value will naturally wait for transitions to finish.
cy.get('[data-testid="fade-element"]').should('have.css', 'opacity', '1');

// You can also use cy.wait() for a fixed delay (not recommended):
cy.wait(600);
```

### Playwright: toHaveCSS() Assertion

```typescript
// PLAYWRIGHT
// toHaveCSS(property, value) is a built-in assertion that checks the
// computed style of an element. It auto-retries until the value matches
// or the timeout expires.
//
// Signature:
//   expect(locator).toHaveCSS(name: string, value: string | RegExp): Promise<void>
//
// Parameters:
//   name  — CSS property name (e.g., 'opacity', 'transform', 'width')
//   value — expected value as string or regex pattern

await expect(page.getByTestId('progress-fill')).toHaveCSS('width', '200px');
await expect(page.getByTestId('sidebar-panel')).toHaveCSS('transform', /matrix/);
await expect(page.getByTestId('fade-element')).toHaveCSS('opacity', '1');
```

## Playground

The playground is a "Compliance Dashboard" themed as a fintech tool. It contains:

1. **Card Flip** — an applicant card with front (summary) and back (details) faces. Clicking flips the card with a 3D Y-axis rotation transition (0.6s).
2. **Slide-in Sidebar** — a filter panel that slides in from the right using CSS transform transition (0.4s). Toggle with the "Toggle Filters" button.
3. **Loading Spinner** — a circular spinner using CSS @keyframes animation that rotates 360 degrees continuously. Toggle with "Start/Stop Loading".
4. **Fade-in/out Alert** — a notification box that fades in (opacity 0 to 1) and out using a CSS transition (0.5s). Controlled by "Show Alert" and "Hide Alert" buttons.
5. **Progress Bar** — a bar that transitions its width (0.8s ease) to 25%, 50%, 75%, or 100% when buttons are clicked.
6. **Accordion** — three collapsible sections with smooth max-height transitions (0.4s). Click a header to toggle open/close.
7. **Processing Overlay** — a full-screen overlay that fades in (opacity transition), stays for 2 seconds, then automatically fades out.

## Exercises

### Exercise 1: Click Card to Trigger Flip, Verify Back Content Visible
Click the applicant card to flip it. Verify the card has the "flipped" class and the back face content (risk level, country) is accessible.

### Exercise 2: Open Sidebar, Verify It Slides In
Click "Toggle Filters" to open the sidebar panel. Verify the sidebar has the "open" class and its CSS transform changes from translateX(100%) to translateX(0).

### Exercise 3: Verify Spinner is Animating
Click "Start Loading" to activate the spinner. Verify the spinner has the "active" class and its CSS animation-name property is "spin".

### Exercise 4: Trigger Fade-in, Verify Opacity Changes
Click "Show Alert" to fade in the notification. Verify the element's opacity transitions to 1. Then click "Hide Alert" and verify opacity returns to 0.

### Exercise 5: Verify Progress Bar Width Transition
Click the 50% button and verify the progress bar's width transitions to 50%. Click 100% and verify it reaches full width.

### Exercise 6: Open/Close Accordion, Verify Height
Click the first accordion header to open it. Verify the accordion body has the "open" class and its max-height is greater than 0. Click again to close and verify max-height returns to 0.

### Exercise 7: Trigger Processing Overlay, Wait for It to Disappear
Click "Process Application" to show the overlay. Verify it becomes visible (opacity 1). Wait for it to automatically disappear after 2 seconds (opacity returns to 0).

### Exercise 8: Verify Computed Styles During Transitions
Click the 75% progress button and immediately read the progress bar's computed width. Then wait for the transition to complete and verify the final width. This demonstrates reading styles mid-transition.

## Solutions

### Playwright Solution

See `playwright/css-animations-and-transitions.spec.ts`

### Cypress Solution

See `cypress/css-animations-and-transitions.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Asserting styles immediately after triggering a transition | The transition hasn't finished yet, so the computed value is still mid-transition | Use toHaveCSS() or should('have.css') which auto-retry until the final value |
| Checking `element.style.opacity` instead of computed style | Inline style may not be set — the value comes from CSS classes | Always use getComputedStyle() or toHaveCSS() to get the rendered value |
| Expecting `transform: translateX(0)` as the computed value | Browsers return transform as a matrix string, not the shorthand | Check for `matrix(1, 0, 0, 1, 0, 0)` or use a regex pattern |
| Testing animation-name when spinner is hidden (display:none) | Hidden elements may not have active animations | Verify the element is visible first, then check animation properties |
| Using fixed `sleep()` instead of assertion-based waits | Flaky and slow — transitions may be faster or slower depending on system load | Use auto-retrying assertions: toHaveCSS() in Playwright, should('have.css') in Cypress |
| Forgetting that max-height transition doesn't mean actual height | max-height: 200px doesn't mean the content is 200px tall | Check the 'open' class or use the max-height value as a proxy |

## Quick Reference

### Playwright CSS Assertions

| Action | Method | Example |
|--------|--------|---------|
| Check CSS property | `expect(loc).toHaveCSS(prop, val)` | `await expect(el).toHaveCSS('opacity', '1')` |
| Check CSS with regex | `expect(loc).toHaveCSS(prop, regex)` | `await expect(el).toHaveCSS('transform', /matrix/)` |
| Get computed style | `locator.evaluate(fn)` | `await el.evaluate(e => getComputedStyle(e).width)` |
| Check class | `expect(loc).toHaveClass(regex)` | `await expect(el).toHaveClass(/flipped/)` |
| Check visible | `expect(loc).toBeVisible()` | `await expect(el).toBeVisible()` |
| Wait for timeout | `page.waitForTimeout(ms)` | `await page.waitForTimeout(500)` |

### Cypress CSS Assertions

| Action | Method | Example |
|--------|--------|---------|
| Check CSS property | `.should('have.css', prop, val)` | `cy.get(s).should('have.css', 'opacity', '1')` |
| Get computed style | `.invoke('css', prop)` | `cy.get(s).invoke('css', 'opacity')` |
| Check class | `.should('have.class', name)` | `cy.get(s).should('have.class', 'flipped')` |
| Check visible | `.should('be.visible')` | `cy.get(s).should('be.visible')` |
| Fixed wait | `cy.wait(ms)` | `cy.wait(500)` |
