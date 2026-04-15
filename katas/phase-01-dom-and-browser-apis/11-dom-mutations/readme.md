# Kata 11: DOM Mutations

## What You Will Learn

- How to test dynamically inserted DOM elements (elements that appear after page load)
- How to verify elements are removed from the DOM
- How to detect text content changes on existing elements
- How to verify CSS class changes and attribute mutations
- How to handle auto-updating UI (timers, live feeds, counters)
- Why Playwright's auto-retry assertions and Cypress's `.should()` are ideal for mutation testing

## Prerequisites

- Completed Phase 00 katas (especially Kata 03: Waits and Timing)
- Basic understanding of how the DOM works (elements, attributes, text nodes)

## Concepts Explained

### What Are DOM Mutations?

A DOM mutation is any change to the page's structure after initial load:

- **Insertion**: A new element is added (e.g., a notification appears)
- **Removal**: An element is deleted (e.g., dismissing a notification)
- **Text change**: An element's text content updates (e.g., a live price ticker)
- **Attribute change**: An element's attribute changes (e.g., `data-priority="normal"` becomes `data-priority="high"`)
- **Class change**: An element gains or loses a CSS class (e.g., `.read` is added)

### Why DOM Mutations Matter for QA

Modern web apps are dynamic. Content loads asynchronously, notifications pop in, prices update in real time, and elements appear/disappear based on user actions. Your tests must handle all of this without flaking.

### Testing Strategy

```typescript
// PLAYWRIGHT — auto-retry assertions handle mutations naturally

// Wait for an element to appear (insertion)
await expect(page.getByTestId('notification-item')).toHaveCount(3);

// Wait for text to change (text mutation)
await expect(page.getByTestId('live-price')).not.toHaveText('22,450.00');

// Wait for an element to disappear (removal)
await expect(page.getByTestId('notification-item')).toHaveCount(0);

// Verify class changes (attribute mutation)
await expect(page.getByTestId('notification-item').first()).toHaveClass(/read/);

// Verify attribute changes
await expect(page.getByTestId('status-message')).toHaveAttribute('data-priority', 'high');
```

```typescript
// CYPRESS — .should() retries automatically

// Wait for element to appear
cy.get('[data-testid="notification-item"]').should('have.length', 3);

// Wait for text to change
cy.get('[data-testid="live-price"]').should('not.have.text', '22,450.00');

// Wait for element to disappear
cy.get('[data-testid="notification-item"]').should('have.length', 0);

// Verify class changes
cy.get('[data-testid="notification-item"]').first().should('have.class', 'read');

// Verify attribute changes
cy.get('[data-testid="status-message"]').should('have.attr', 'data-priority', 'high');
```

### Key Insight: Auto-Retry Is Your Friend

Both Playwright and Cypress re-check assertions automatically until they pass (or timeout). This means you do NOT need to use `MutationObserver` or polling loops in your tests. Just assert the expected state and the framework handles the waiting.

## Playground

The playground simulates a fintech notification center:

1. **Live Notification Feed** — new notifications auto-appear every 3 seconds
2. **Unread Counter** — updates automatically when notifications arrive or are dismissed
3. **Unread Badge** — shows/hides based on whether there are unread notifications
4. **Mark All Read** — changes styling of all notifications (adds `.read` class)
5. **Dismiss Button** — removes individual notifications from the DOM
6. **Live Price Ticker** — text content changes every 2 seconds
7. **Dynamic Status Area** — elements can be added, removed, and modified on demand
8. **Attribute Toggle** — `data-priority` attribute toggles between "normal" and "high"

## Exercises

### Exercise 1: Wait for New Notification (DOM Insertion)
Wait for the first notification to appear in the feed. The feed auto-adds notifications every 3 seconds, so you need to wait for at least one to arrive.

### Exercise 2: Verify Notification Count Increments
Wait for multiple notifications to accumulate and verify the unread counter matches.

### Exercise 3: Dismiss a Notification (DOM Removal)
Wait for a notification to appear, dismiss it, and verify it is removed from the DOM.

### Exercise 4: Mark All as Read (CSS Class Change)
Wait for notifications to appear, click "Mark All Read", and verify every notification gains the `.read` class (which changes its styling).

### Exercise 5: Wait for Price Text to Change (Text Mutation)
Capture the initial price text, then wait for it to change (it updates every 2 seconds).

### Exercise 6: Verify Badge Visibility Based on Count
Verify the unread badge is visible when there are unread notifications, then mark all as read and verify the badge hides.

### Exercise 7: Wait for Multiple Notifications to Accumulate
Wait until at least 3 notifications have appeared in the feed.

### Exercise 8: Verify Element Attribute Changes Dynamically
Click the "Toggle Priority" button and verify the `data-priority` attribute changes from `"normal"` to `"high"`.

## Solutions

### Playwright Solution

See `playwright/dom-mutations.spec.ts`

### Cypress Solution

See `cypress/dom-mutations.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using `page.waitForTimeout(3000)` to wait for notification | Brittle — timing varies | Use `expect().toHaveCount()` with auto-retry |
| Checking count immediately after dismiss | DOM removal may not be instant | Use `expect().toHaveCount(n - 1)` which auto-retries |
| Checking exact price value | Price is random, changes every 2s | Assert it changed from initial value with `not.toHaveText()` |
| Not waiting for element before dismissing | Notification may not exist yet | Wait for it with `.toBeVisible()` first |
| Asserting `.read` class before clicking button | Class hasn't been added yet | Click "Mark All Read" first, then assert |

## Quick Reference

### Playwright DOM Mutation Assertions

| Assertion | Use case |
|-----------|----------|
| `toHaveCount(n)` | Wait for exactly N matching elements |
| `toHaveText(text)` | Wait for element text to match |
| `not.toHaveText(text)` | Wait for element text to change from a known value |
| `toHaveClass(/pattern/)` | Wait for element to have a CSS class |
| `toHaveAttribute(name, value)` | Wait for attribute to have a specific value |
| `toBeVisible()` / `toBeHidden()` | Wait for element to show/hide |

### Cypress DOM Mutation Assertions

| Assertion | Use case |
|-----------|----------|
| `should('have.length', n)` | Wait for exactly N matching elements |
| `should('have.text', text)` | Wait for element text to match |
| `should('not.have.text', text)` | Wait for text to change |
| `should('have.class', cls)` | Wait for CSS class to be added |
| `should('have.attr', name, value)` | Wait for attribute value |
| `should('be.visible')` / `should('not.be.visible')` | Wait for show/hide |
