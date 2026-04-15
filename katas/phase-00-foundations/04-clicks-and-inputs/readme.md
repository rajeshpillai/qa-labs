# Kata 04: Clicks and Inputs

## What You Will Learn

- How to interact with all common form controls
- `click()`, `dblclick()`, right-click (context menu)
- `fill()` vs `type()` — what each does and when to use which
- `clear()` — emptying input fields
- `check()` / `uncheck()` — checkboxes
- `selectOption()` — dropdown selects (single and multiple)
- Range sliders, color pickers, content-editable divs
- How input events flow: input → change → blur

## Prerequisites

- Completed Kata 01-03

## Concepts Explained

### fill() vs type() — The Critical Difference

```typescript
// PLAYWRIGHT
// fill() — clears the field first, then sets the value instantly
// Use: when you want to replace whatever is in the field
await page.getByTestId('input-name').fill('John Doe');

// type() — DOES NOT exist as a standalone method in latest Playwright
// Use page.keyboard.type() for character-by-character typing
// This fires individual keydown/keypress/keyup events per character
await page.getByTestId('input-name').pressSequentially('John Doe');
// pressSequentially is the modern replacement for the old type() method

// CYPRESS
// type() — appends characters one at a time (does NOT clear first!)
cy.get('[data-testid="input-name"]').type('John Doe');

// To replace existing text, clear first:
cy.get('[data-testid="input-name"]').clear().type('John Doe');
```

### Click Variants

```typescript
// PLAYWRIGHT
await element.click();                    // single left click
await element.dblclick();                 // double click
await element.click({ button: 'right' }); // right click (context menu)
await element.click({ force: true });     // click even if covered by another element
await element.click({ position: { x: 10, y: 20 } }); // click at specific position

// CYPRESS
cy.get(sel).click();                      // single left click
cy.get(sel).dblclick();                   // double click
cy.get(sel).rightclick();                 // right click
cy.get(sel).click({ force: true });       // force click
cy.get(sel).click(10, 20);               // click at position
```

### Checkboxes and Radio Buttons

```typescript
// PLAYWRIGHT
// check() — checks if unchecked, no-op if already checked
await page.getByTestId('check-identity').check();
// uncheck() — unchecks if checked
await page.getByTestId('check-identity').uncheck();
// Verify state
await expect(page.getByTestId('check-identity')).toBeChecked();
await expect(page.getByTestId('check-identity')).not.toBeChecked();

// CYPRESS
cy.get('[data-testid="check-identity"]').check();    // check
cy.get('[data-testid="check-identity"]').uncheck();  // uncheck
cy.get('[data-testid="check-identity"]').should('be.checked');
cy.get('[data-testid="check-identity"]').should('not.be.checked');
```

### Select / Dropdown

```typescript
// PLAYWRIGHT
// selectOption — select by value, label, or index
await page.getByTestId('select-risk').selectOption('high');           // by value
await page.getByTestId('select-risk').selectOption({ label: 'High Risk' }); // by visible text
await page.getByTestId('select-risk').selectOption({ index: 2 });    // by index (0-based)

// Multiple select
await page.getByTestId('select-country').selectOption(['us', 'uk']); // select multiple

// CYPRESS
cy.get('[data-testid="select-risk"]').select('high');           // by value
cy.get('[data-testid="select-risk"]').select('High Risk');      // by visible text
cy.get('[data-testid="select-risk"]').select(2);                // by index

// Multiple
cy.get('[data-testid="select-country"]').select(['us', 'uk']);
```

### Special Inputs

```typescript
// Range slider — PLAYWRIGHT
await page.getByTestId('risk-slider').fill('75');  // fill works for range inputs

// Range slider — CYPRESS
cy.get('[data-testid="risk-slider"]').invoke('val', 75).trigger('input');

// Color picker — PLAYWRIGHT
await page.getByTestId('color-picker').fill('#ff0000');

// Color picker — CYPRESS
cy.get('[data-testid="color-picker"]').invoke('val', '#ff0000').trigger('input');

// Content-editable div — PLAYWRIGHT
await page.getByTestId('editable-div').fill('New content');

// Content-editable div — CYPRESS
cy.get('[data-testid="editable-div"]').clear().type('New content');
```

## Playground

The playground contains:

1. **Risk Score Calculator** — number pad with operators, display, clear button
2. **Text Inputs** — name, email, password, amount, textarea with live summary
3. **Select Dropdowns** — single select (risk level), multi-select (countries)
4. **Checkboxes & Radio Buttons** — verification steps + approval decision
5. **Range Slider & Color Picker** — interactive controls with live preview
6. **Click Variants** — single click, double click, right click with context menu
7. **Content Editable** — div with contenteditable attribute

## Exercises

### Exercise 1: Calculator
Use the calculator to compute 42 + 18. Verify the display shows 60.

### Exercise 2: Fill Text Inputs
Fill in name, email, and amount fields. Verify the live summary updates.

### Exercise 3: Clear and Retype
Fill a field with "wrong value", clear it, then fill with "correct value". Verify.

### Exercise 4: Select Dropdown
Select "High Risk" from the risk dropdown. Verify the selected risk text updates.

### Exercise 5: Multi-Select
Select "United States" and "India" from the country multi-select.

### Exercise 6: Checkboxes
Check "Identity Verified" and "Sanctions Cleared". Verify checked count shows 2. Uncheck one, verify count shows 1.

### Exercise 7: Radio Buttons
Select "Approve", verify decision shows "Approve". Then select "Reject", verify it changes.

### Exercise 8: Double Click
Double-click the "Double Click" button and verify the result text.

### Exercise 9: Right Click (Context Menu)
Right-click the "Right Click" button, verify the context menu appears, click "Approve" in it.

### Exercise 10: Range Slider
Set the risk slider to 75 and verify the displayed value.

## Solutions

### Playwright Solution

See `playwright/clicks-and-inputs.spec.ts`

### Cypress Solution

See `cypress/clicks-and-inputs.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using Cypress `type()` without `clear()` | `type()` appends, doesn't replace | Always `clear().type()` to replace |
| Using `fill()` when you need keyboard events | `fill()` sets value directly, skips keydown/keyup | Use `pressSequentially()` (Playwright) for char-by-char |
| Selecting by index when order might change | Index breaks if options are reordered | Select by value or label text |
| Forgetting to trigger `input` event on range slider (Cypress) | `invoke('val')` doesn't fire events | Chain `.trigger('input')` after |
| Not handling the context menu after right-click | The menu stays open and blocks other clicks | Click a menu item or click elsewhere to dismiss |

## Quick Reference

### Playwright Actions

| Action | Method | Example |
|--------|--------|---------|
| Click | `click()` | `await el.click()` |
| Double click | `dblclick()` | `await el.dblclick()` |
| Right click | `click({ button: 'right' })` | `await el.click({ button: 'right' })` |
| Fill input | `fill(value)` | `await input.fill('text')` |
| Type chars | `pressSequentially(text)` | `await input.pressSequentially('text')` |
| Clear | `clear()` | `await input.clear()` |
| Check | `check()` | `await checkbox.check()` |
| Uncheck | `uncheck()` | `await checkbox.uncheck()` |
| Select option | `selectOption(value)` | `await select.selectOption('high')` |

### Cypress Actions

| Action | Method | Example |
|--------|--------|---------|
| Click | `.click()` | `cy.get(sel).click()` |
| Double click | `.dblclick()` | `cy.get(sel).dblclick()` |
| Right click | `.rightclick()` | `cy.get(sel).rightclick()` |
| Type text | `.type(text)` | `cy.get(sel).type('text')` |
| Clear | `.clear()` | `cy.get(sel).clear()` |
| Check | `.check()` | `cy.get(sel).check()` |
| Uncheck | `.uncheck()` | `cy.get(sel).uncheck()` |
| Select option | `.select(value)` | `cy.get(sel).select('high')` |
