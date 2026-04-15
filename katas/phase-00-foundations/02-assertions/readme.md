# Kata 02: Assertions

## What You Will Learn

- What assertions are and why they matter in testing
- Playwright assertions: `expect` with `toBe`, `toHaveText`, `toContainText`, `toBeVisible`, `toBeHidden`, `toHaveAttribute`, `toHaveCSS`, `toHaveCount`, `toHaveValue`
- Cypress assertions: `should` with `have.text`, `contain.text`, `be.visible`, `have.attr`, `have.css`, `have.length`, `have.value`
- Soft assertions (Playwright) vs hard assertions
- Negative assertions: asserting something is NOT true
- Auto-retry behavior: how both frameworks handle timing

## Prerequisites

- Completed Kata 01 (Selectors and Locators)
- Understanding of how to find elements on a page

## Concepts Explained

### What is an assertion?

An **assertion** is a statement that checks whether something on the page matches your expectation. If the check fails, the test fails. Assertions are the "verify" part of any test — without them, you're just clicking around without proving anything works.

```
Find element → Do something → ASSERT the result
```

### How Auto-Retry Works

Both Playwright and Cypress **automatically retry** assertions for a configurable timeout (default 5s in Playwright, 4s in Cypress). This means:

- You type `await expect(element).toHaveText('Hello')` in Playwright
- If the text isn't "Hello" yet (maybe it's loading), Playwright keeps checking
- If it becomes "Hello" within 5 seconds, the test passes
- If 5 seconds pass and it's still not "Hello", the test fails

This is why you almost never need `sleep()` or `wait()` in modern test frameworks.

### Playwright Assertions

```typescript
import { test, expect } from '@playwright/test';

// --- TEXT ASSERTIONS ---

// toHaveText — checks exact text content (trims whitespace)
// Signature: expect(locator).toHaveText(expected: string | RegExp | string[])
await expect(element).toHaveText('Submit Application');
await expect(element).toHaveText(/submit/i);  // regex, case-insensitive

// toContainText — checks that text CONTAINS the expected string
// Use when you don't need an exact match
await expect(element).toContainText('Submit');

// --- VISIBILITY ASSERTIONS ---

// toBeVisible — element is rendered and not hidden
await expect(element).toBeVisible();

// toBeHidden — element is not visible (display:none, hidden attr, etc.)
await expect(element).toBeHidden();

// --- VALUE ASSERTIONS ---

// toHaveValue — checks the value of an input, select, or textarea
await expect(input).toHaveValue('john@example.com');

// --- COUNT ASSERTIONS ---

// toHaveCount — checks the number of matching elements
await expect(page.locator('.card')).toHaveCount(3);

// --- ATTRIBUTE ASSERTIONS ---

// toHaveAttribute — checks an HTML attribute's value
await expect(element).toHaveAttribute('data-status', 'active');
await expect(element).toHaveAttribute('href', /terms/);

// --- CSS ASSERTIONS ---

// toHaveCSS — checks a computed CSS property
await expect(element).toHaveCSS('background-color', 'rgb(59, 130, 246)');
await expect(element).toHaveCSS('font-weight', '700');

// --- STATE ASSERTIONS ---

// toBeEnabled / toBeDisabled — checks disabled attribute
await expect(button).toBeEnabled();
await expect(button).toBeDisabled();

// toBeChecked — checks if checkbox/radio is checked
await expect(checkbox).toBeChecked();
await expect(checkbox).not.toBeChecked();

// --- NEGATIVE ASSERTIONS ---

// .not inverts any assertion
await expect(element).not.toBeVisible();
await expect(element).not.toHaveText('Error');

// --- SOFT ASSERTIONS ---
// Soft assertions don't stop the test on failure — they collect all failures
// and report them at the end. Useful when checking multiple things at once.
await expect.soft(element1).toHaveText('A');
await expect.soft(element2).toHaveText('B');
await expect.soft(element3).toHaveText('C');
// If element2 fails, the test continues and checks element3 too
```

### Cypress Assertions

```typescript
// Cypress uses .should() which auto-retries until the assertion passes
// or the timeout expires. You can chain multiple assertions with .and().

// --- TEXT ASSERTIONS ---

// 'have.text' — exact text content match
cy.get('[data-testid="title"]').should('have.text', 'Dashboard');

// 'contain.text' — partial text match (like toContainText)
cy.get('[data-testid="title"]').should('contain.text', 'Dash');

// 'include.text' — alias for contain.text
cy.get('[data-testid="title"]').should('include.text', 'Dash');

// 'match' — regex match on text
cy.get('[data-testid="title"]').invoke('text').should('match', /dashboard/i);

// --- VISIBILITY ASSERTIONS ---

// 'be.visible' — element is visible on screen
cy.get('[data-testid="panel"]').should('be.visible');

// 'not.be.visible' — element exists in DOM but is hidden
cy.get('[data-testid="panel"]').should('not.be.visible');

// 'exist' / 'not.exist' — element is/isn't in the DOM at all
cy.get('[data-testid="panel"]').should('exist');
cy.get('[data-testid="deleted"]').should('not.exist');

// --- VALUE ASSERTIONS ---

// 'have.value' — checks input value
cy.get('input').should('have.value', 'john@example.com');

// --- COUNT ASSERTIONS ---

// 'have.length' — checks number of matched elements
cy.get('.card').should('have.length', 3);

// --- ATTRIBUTE ASSERTIONS ---

// 'have.attr' — checks an HTML attribute
cy.get('a').should('have.attr', 'href', 'https://example.com');
cy.get('input').should('have.attr', 'readonly');

// --- CSS ASSERTIONS ---

// 'have.css' — checks computed CSS property
cy.get('[data-testid="box"]').should('have.css', 'background-color', 'rgb(59, 130, 246)');

// --- STATE ASSERTIONS ---

// 'be.disabled' / 'be.enabled'
cy.get('button').should('be.disabled');
cy.get('button').should('not.be.disabled');

// 'be.checked'
cy.get('input[type="checkbox"]').should('be.checked');

// --- CHAINING ASSERTIONS ---
// .and() chains multiple assertions on the same element
cy.get('[data-testid="btn"]')
  .should('be.visible')
  .and('be.enabled')
  .and('have.text', 'Submit');

// --- CLASS ASSERTIONS ---

// 'have.class' — checks if element has a CSS class
cy.get('[data-testid="badge"]').should('have.class', 'status-active');
```

### Key Differences Between Playwright and Cypress

| Feature | Playwright | Cypress |
|---------|-----------|---------|
| Syntax | `await expect(locator).toHaveText()` | `cy.get().should('have.text')` |
| Retry | Auto-retries all `expect` assertions | Auto-retries all `.should()` chains |
| Soft assertions | Yes (`expect.soft`) | No built-in equivalent |
| Negation | `.not.toBeVisible()` | `.should('not.be.visible')` |
| Async | Always `await` | No `await` needed (auto-queued) |

## Playground

The playground shows a **KYC Dashboard** with:

1. **Stats cards** — numbers for total, approved, rejected, pending applications
2. **Progress bars** — verification progress with percentages and colors
3. **System alerts** — success, warning, error messages
4. **Dynamic content** — counter with +1/-1/reset, dynamic alert creation
5. **Application table** — rows with names, risk levels, statuses, tags
6. **Element attributes** — inputs with readonly, disabled, required attributes
7. **CSS & styles** — colored box, text styles (uppercase, bold, italic, strikethrough)
8. **Empty/loading states** — empty list message, items with statuses

## Exercises

### Exercise 1: Text Assertions
Verify that the "Total Applications" stat card shows "1,247" and the label says "Total Applications".

### Exercise 2: Visibility
Verify all three system alerts (success, warning, error) are visible.

### Exercise 3: Count
Verify the application table has exactly 3 data rows.

### Exercise 4: Attribute Assertions
Verify the readonly input has the `readonly` attribute and contains "KYC-2024-0001". Verify the disabled input has the `disabled` attribute.

### Exercise 5: CSS Assertions
Verify the colored box has `background-color: rgb(59, 130, 246)`. Click the "Change Color" button and verify it changes to `rgb(239, 68, 68)`.

### Exercise 6: Counter Interactions
Click +1 three times, verify counter shows 3. Click -1 once, verify it shows 2. Click Reset, verify it shows 0.

### Exercise 7: Dynamic Content
Click "Add Alert" twice, verify 2 dynamic alerts appear. Click "Clear Alerts", verify they are removed.

### Exercise 8: Negative Assertions
Verify the empty-list section does NOT contain any item cards. Verify the items list is NOT empty.

### Exercise 9: Data Attributes
Verify the data-attributes element has `data-status="active"`, `data-priority="high"`, and `data-count="42"`.

### Exercise 10: Multiple Assertions on One Element
Verify the link has `href` containing "terms", has `target="_blank"`, and is visible.

## Solutions

### Playwright Solution

See `playwright/assertions.spec.ts`

### Cypress Solution

See `cypress/assertions.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using `toBe` instead of `toHaveText` | `toBe` compares primitive values, not element text | Use `toHaveText` for element text content |
| Forgetting `await` on Playwright assertions | The assertion runs but errors are uncaught | Always `await expect(...)` |
| Checking exact CSS color with hex | Browsers compute colors to `rgb()` | Use `rgb(r, g, b)` format |
| Asserting `.should('have.text', 'foo')` when text has whitespace | `have.text` does exact match including whitespace | Use `contain.text` or trim the text |
| Using `not.exist` when you mean `not.be.visible` | `not.exist` means NOT in the DOM at all | `not.be.visible` means in DOM but hidden |

## Quick Reference

### Playwright expect Methods

| Assertion | Checks | Example |
|-----------|--------|---------|
| `toHaveText(text)` | Exact text (trimmed) | `toHaveText('Hello')` |
| `toContainText(text)` | Text contains substring | `toContainText('Hell')` |
| `toBeVisible()` | Element is visible | |
| `toBeHidden()` | Element is hidden | |
| `toHaveValue(val)` | Input/select value | `toHaveValue('42')` |
| `toHaveCount(n)` | Number of elements | `toHaveCount(3)` |
| `toHaveAttribute(name, val?)` | HTML attribute | `toHaveAttribute('disabled')` |
| `toHaveCSS(prop, val)` | Computed CSS | `toHaveCSS('color', 'rgb(0,0,0)')` |
| `toBeEnabled()` | Not disabled | |
| `toBeDisabled()` | Has disabled attribute | |
| `toBeChecked()` | Checkbox/radio checked | |
| `.not.` | Negates any assertion | `not.toBeVisible()` |
| `expect.soft()` | Non-blocking assertion | Continues on failure |

### Cypress should Assertions

| Assertion | Checks | Example |
|-----------|--------|---------|
| `'have.text'` | Exact text | `.should('have.text', 'x')` |
| `'contain.text'` | Text contains | `.should('contain.text', 'x')` |
| `'be.visible'` | Visible | `.should('be.visible')` |
| `'not.be.visible'` | Hidden | `.should('not.be.visible')` |
| `'exist'` | In DOM | `.should('exist')` |
| `'not.exist'` | Not in DOM | `.should('not.exist')` |
| `'have.value'` | Input value | `.should('have.value', 'x')` |
| `'have.length'` | Element count | `.should('have.length', 3)` |
| `'have.attr'` | HTML attribute | `.should('have.attr', 'href')` |
| `'have.css'` | Computed CSS | `.should('have.css', 'color')` |
| `'be.disabled'` | Disabled | `.should('be.disabled')` |
| `'be.checked'` | Checked | `.should('be.checked')` |
| `'have.class'` | CSS class | `.should('have.class', 'active')` |
| `.and()` | Chain assertions | `.should('x').and('y')` |
