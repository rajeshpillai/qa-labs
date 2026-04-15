# Kata 05: Keyboard and Mouse

## What You Will Learn

- How to press individual keyboard keys (Enter, Tab, Escape, Arrow keys)
- How to use keyboard shortcuts with modifier keys (Ctrl+B, Ctrl+I)
- How to simulate mouse hover to reveal tooltips
- How to click at specific positions within an element
- How to manage focus — move it, verify it, type into focused elements
- Tab navigation through form fields
- Single-key shortcuts for application actions
- Arrow key reordering of list items
- Mouse events: mousedown, mousemove, mouseup for drag simulation

## Prerequisites

- Completed Kata 01-04

## Concepts Explained

### Pressing Keyboard Keys

```typescript
// PLAYWRIGHT
// page.keyboard.press(key) dispatches keydown, keypress, and keyup events.
// Key names follow the W3C KeyboardEvent.key spec.
//
// Signature:
//   page.keyboard.press(key: string, options?: { delay?: number }): Promise<void>
//
// Parameters:
//   key   — Key name (e.g., 'Enter', 'Tab', 'Escape', 'ArrowUp', 'a', 'A')
//   delay — Time in ms to wait between keydown and keyup (default: 0)
await page.keyboard.press('Escape');
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');
await page.keyboard.press('ArrowUp');
await page.keyboard.press('ArrowDown');

// CYPRESS
// In Cypress, special keys are sent via type() using curly-brace sequences.
//
// Signature:
//   .type(text: string, options?: TypeOptions): Chainable
//
// Special key sequences:
//   {enter}, {esc}, {tab}, {backspace}, {del}
//   {uparrow}, {downarrow}, {leftarrow}, {rightarrow}
//   {home}, {end}, {pageup}, {pagedown}
//   {selectall}, {movetostart}, {movetoend}
cy.get('body').type('{esc}');
cy.get(sel).type('{enter}');
cy.get(sel).type('{uparrow}');
cy.get(sel).type('{downarrow}');
```

### Keyboard Shortcuts with Modifiers

```typescript
// PLAYWRIGHT
// Combine modifier keys using '+' syntax.
//
// Signature:
//   page.keyboard.press(key: string): Promise<void>
//
// Modifier names: 'Control', 'Shift', 'Alt', 'Meta'
// Examples:
await page.keyboard.press('Control+b');     // Ctrl+B
await page.keyboard.press('Control+i');     // Ctrl+I
await page.keyboard.press('Control+Shift+s'); // Ctrl+Shift+S
await page.keyboard.press('Meta+c');        // Cmd+C (Mac)

// CYPRESS
// Use modifier names inside curly braces with '+' syntax.
//
// Modifier names: ctrl, alt, shift, meta
// Examples:
cy.get(sel).type('{ctrl+b}');       // Ctrl+B
cy.get(sel).type('{ctrl+i}');       // Ctrl+I
cy.get(sel).type('{ctrl+shift+s}'); // Ctrl+Shift+S
cy.get(sel).type('{meta+c}');       // Cmd+C (Mac)
```

### Hover (Mouse Over)

```typescript
// PLAYWRIGHT
// hover() moves the mouse to the center of the element.
// Triggers CSS :hover pseudo-class and mouseenter/mouseover events.
//
// Signature:
//   locator.hover(options?: {
//     force?: boolean,
//     modifiers?: ('Alt'|'Control'|'Meta'|'Shift')[],
//     position?: { x: number, y: number },
//     timeout?: number
//   }): Promise<void>
await page.getByTestId('card-aml').hover();

// CYPRESS
// Cypress has NO built-in hover() command because it cannot trigger
// CSS :hover pseudo-class. Workarounds:
//
// 1. trigger('mouseover') — fires the JS event but NOT CSS :hover
cy.get(sel).trigger('mouseover');
//
// 2. invoke('show') — force-display a hidden tooltip for testing
cy.get('[data-testid="tooltip"]').invoke('css', 'display', 'block');
//
// 3. cypress-real-events plugin — triggers real browser hover
//    npm install cypress-real-events
cy.get(sel).realHover();  // requires cypress-real-events
```

### Focus Management

```typescript
// PLAYWRIGHT
// focus() sets focus on the element without clicking.
//
// Signature:
//   locator.focus(options?: { timeout?: number }): Promise<void>
await page.getByTestId('field-email').focus();

// toBeFocused() asserts the element is document.activeElement.
await expect(page.getByTestId('field-email')).toBeFocused();

// CYPRESS
// focus() sets focus on the element.
//
// Signature:
//   .focus(options?: Partial<Loggable & Timeoutable>): Chainable
cy.get('[data-testid="field-email"]').focus();

// 'have.focus' asserts the element is document.activeElement.
cy.get('[data-testid="field-email"]').should('have.focus');
```

### Tab Navigation

```typescript
// PLAYWRIGHT
// Press Tab to move focus through the tab order.
await page.keyboard.press('Tab');         // move forward
await page.keyboard.press('Shift+Tab');   // move backward

// CYPRESS
// Cypress type('{tab}') does NOT actually move browser focus.
// Workaround: use focus() to move focus directly, or install cypress-real-events.
cy.get(sel).focus();  // direct focus as workaround
// or with cypress-real-events:
cy.realPress('Tab');
```

### Typing Text (Character by Character)

```typescript
// PLAYWRIGHT
// page.keyboard.type(text) types character by character, firing
// keydown/keypress/keyup for each character.
//
// Signature:
//   page.keyboard.type(text: string, options?: { delay?: number }): Promise<void>
await page.keyboard.type('Hello world');
await page.keyboard.type('slow typing', { delay: 100 }); // 100ms between chars

// pressSequentially() is an alias on Locator that works the same way:
await page.getByTestId('input').pressSequentially('Hello');

// CYPRESS
// type(text) already types character by character.
cy.get(sel).type('Hello world');
cy.get(sel).type('slow typing', { delay: 100 }); // 100ms between chars
```

### Mouse Click at Position

```typescript
// PLAYWRIGHT
// click({ position }) clicks at a specific offset from the element's top-left.
//
// Signature:
//   locator.click(options?: {
//     button?: 'left' | 'right' | 'middle',
//     clickCount?: number,
//     delay?: number,
//     force?: boolean,
//     modifiers?: ('Alt'|'Control'|'Meta'|'Shift')[],
//     position?: { x: number, y: number },
//     timeout?: number
//   }): Promise<void>
await page.getByTestId('canvas').click({ position: { x: 100, y: 50 } });

// CYPRESS
// click(x, y) clicks at the specified offset from the element's top-left.
//
// Signature:
//   .click(x: number, y: number, options?: ClickOptions): Chainable
cy.get(sel).click(100, 50);
```

## Playground

The playground is a "Risk Tier Sorter" themed as a fintech compliance tool. It contains:

1. **Sortable Risk Tiers** — a list of risk levels (Critical, High, Medium, Low) that can be reordered using arrow keys after selecting an item with a click
2. **Notes Editor** — a textarea with Ctrl+B (bold) and Ctrl+I (italic) keyboard shortcut simulation that updates a format status indicator
3. **Risk Assessment Cards** — three cards (AML, KYC, PEP) with hover-triggered tooltips showing detailed descriptions
4. **Client Onboarding Form** — five tab-navigable fields (first name, last name, email, notes, submit) with a focus tracker displaying the currently focused field
5. **Quick Actions Panel** — a focusable panel where pressing 'A' approves, 'R' rejects, and 'E' escalates, with a color-coded status badge
6. **Risk Zone Mapper** — a drag simulation area with a draggable box, mouse coordinate tracking, and drag status display
7. **Alert Dialog** — a modal that opens via button click and closes with Escape key or a close button

## Exercises

### Exercise 1: Press Escape to Close Modal
Open the modal by clicking the "Open Alert" button. Verify it's visible. Press Escape to close it. Verify the modal is hidden and the state text reads "Closed".

### Exercise 2: Keyboard Shortcuts (Ctrl+B, Ctrl+I)
Focus the textarea, type some text, then press Ctrl+B. Verify the format status shows "Bold". Press Ctrl+I and verify it shows "Italic".

### Exercise 3: Tab Navigation
Click the first form field, then Tab through all fields. Verify the focus indicator updates at each step: first-name, last-name, email, notes, submit.

### Exercise 4: Hover to Show Tooltip
Hover over the AML card and verify its tooltip appears with text containing "OFAC". Hover over the KYC card and verify the AML tooltip hides while the KYC tooltip appears.

### Exercise 5: Click at Specific Position
Click at position (100, 50) within the drag area. Verify the mouse coordinates display shows non-zero values.

### Exercise 6: Keyboard Shortcut Actions
Focus the shortcut panel. Press 'A' and verify status is "Approved". Press 'R' for "Rejected". Press 'E' for "Escalated".

### Exercise 7: Arrow Key Reordering
Click "High" to select it. Press ArrowUp to move it above "Critical". Press ArrowDown twice to move it below "Medium". Verify the order at each step using the order display. Press Enter to confirm.

### Exercise 8: Focus Management
Focus the email field programmatically (without clicking). Verify it is focused. Move focus to the notes field, type text, and verify the input value.

## Solutions

### Playwright Solution

See `playwright/keyboard-and-mouse.spec.ts`

### Cypress Solution

See `cypress/keyboard-and-mouse.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Pressing keys without focusing the target element first | Key events go to whichever element has focus — if you haven't focused the right element, the shortcut won't work | Click or focus() the target element before pressing keys |
| Using `page.keyboard.press('ctrl+b')` with lowercase 'ctrl' | Playwright requires proper casing: `'Control'`, not `'ctrl'` | Use `'Control+b'`, `'Shift+a'`, `'Meta+c'` |
| Expecting Cypress `type('{tab}')` to move browser focus | Cypress's `{tab}` key sequence does not actually change `document.activeElement` | Use `cy.get(sel).focus()` or install cypress-real-events plugin |
| Trying to test CSS `:hover` tooltips with Cypress `trigger('mouseover')` | `trigger('mouseover')` fires the JS event but does NOT activate CSS `:hover` pseudo-class | Use `invoke('css', 'display', 'block')` to force-show, or use cypress-real-events `realHover()` |
| Forgetting to verify focus before typing | If focus is on the wrong element, `page.keyboard.type()` sends text elsewhere | Always assert focus with `toBeFocused()` / `should('have.focus')` before typing |
| Using `page.keyboard.press('Up')` instead of `'ArrowUp'` | The W3C key name is `'ArrowUp'`, not `'Up'` | Use `'ArrowUp'`, `'ArrowDown'`, `'ArrowLeft'`, `'ArrowRight'` |
| Not waiting for modal to be visible before pressing Escape | If the modal animation hasn't finished, Escape may not register | Assert `toBeVisible()` before pressing Escape |

## Quick Reference

### Playwright Keyboard & Mouse

| Action | Method | Example |
|--------|--------|---------|
| Press key | `page.keyboard.press(key)` | `await page.keyboard.press('Enter')` |
| Key with modifier | `page.keyboard.press(combo)` | `await page.keyboard.press('Control+b')` |
| Type text | `page.keyboard.type(text)` | `await page.keyboard.type('hello')` |
| Type on locator | `locator.pressSequentially(text)` | `await el.pressSequentially('hello')` |
| Focus element | `locator.focus()` | `await el.focus()` |
| Hover | `locator.hover()` | `await el.hover()` |
| Click at position | `locator.click({ position })` | `await el.click({ position: { x: 10, y: 20 } })` |
| Assert focused | `expect(locator).toBeFocused()` | `await expect(el).toBeFocused()` |
| Assert visible | `expect(locator).toBeVisible()` | `await expect(el).toBeVisible()` |
| Assert hidden | `expect(locator).toBeHidden()` | `await expect(el).toBeHidden()` |

### Cypress Keyboard & Mouse

| Action | Method | Example |
|--------|--------|---------|
| Press special key | `.type('{key}')` | `cy.get(sel).type('{enter}')` |
| Key with modifier | `.type('{ctrl+key}')` | `cy.get(sel).type('{ctrl+b}')` |
| Type text | `.type(text)` | `cy.get(sel).type('hello')` |
| Focus element | `.focus()` | `cy.get(sel).focus()` |
| Trigger mouse event | `.trigger(event)` | `cy.get(sel).trigger('mouseover')` |
| Click at position | `.click(x, y)` | `cy.get(sel).click(10, 20)` |
| Assert focused | `.should('have.focus')` | `cy.get(sel).should('have.focus')` |
| Assert visible | `.should('be.visible')` | `cy.get(sel).should('be.visible')` |
| Assert hidden | `.should('not.be.visible')` | `cy.get(sel).should('not.be.visible')` |
