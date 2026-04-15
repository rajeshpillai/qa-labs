import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-00-foundations/05-keyboard-and-mouse/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Press Keyboard Keys (Enter, Tab, Escape)
// --------------------------------------------------------------------------
// This exercise demonstrates how to press individual keyboard keys using
// Playwright's keyboard API. You'll learn to open a modal, close it with
// Escape, and verify state changes driven by key presses.
test('exercise 1: press Escape to close a modal dialog', async ({ page }) => {
  // Navigate to the playground page.
  // page.goto(url) loads the given URL. It waits for the page to reach
  // the 'load' state by default before continuing.
  await page.goto(PLAYGROUND);

  // Click the "Open Alert" button to show the modal dialog.
  // getByTestId(id) finds an element by its data-testid attribute.
  // click() performs a single left-click on the element.
  await page.getByTestId('btn-open-modal').click();

  // Verify the modal overlay is now visible on the page.
  // toBeVisible() asserts that the element is displayed (not hidden via
  // display:none, visibility:hidden, or opacity:0).
  await expect(page.getByTestId('modal-overlay')).toBeVisible();

  // Verify the modal state text changed to "Open".
  // toHaveText(text) asserts that the element's textContent matches exactly.
  await expect(page.getByTestId('modal-state')).toHaveText('Open');

  // Press the Escape key to close the modal.
  // page.keyboard.press(key) dispatches a keydown, keypress (if applicable),
  // and keyup event for the given key. The key names follow the W3C key values
  // spec — e.g., 'Escape', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', etc.
  await page.keyboard.press('Escape');

  // Verify the modal is now hidden.
  // toBeHidden() asserts the element is no longer visible in the viewport.
  await expect(page.getByTestId('modal-overlay')).toBeHidden();

  // Verify the modal state text changed back to "Closed".
  await expect(page.getByTestId('modal-state')).toHaveText('Closed');
});

// --------------------------------------------------------------------------
// Exercise 2: Keyboard Shortcuts (Ctrl+B, Ctrl+I)
// --------------------------------------------------------------------------
// This exercise demonstrates how to press modifier key combinations using
// Playwright. Ctrl+B triggers bold formatting, Ctrl+I triggers italic.
test('exercise 2: use Ctrl+B and Ctrl+I keyboard shortcuts', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First, click the text area to focus it. The keyboard shortcuts only
  // work when the text area has focus, because the keydown listener is
  // attached to that element.
  // click() focuses the element as a side effect — browsers move focus
  // to the element being clicked.
  await page.getByTestId('format-area').click();

  // Type some text into the textarea using fill().
  // fill(value) clears any existing content and sets the value. It triggers
  // 'input' and 'change' events. Unlike pressSequentially(), fill() sets
  // the value instantly without simulating individual keypresses.
  await page.getByTestId('format-area').fill('Compliance notes for review');

  // Press Ctrl+B to trigger the bold shortcut.
  // page.keyboard.press('Control+b') presses Control and 'b' together.
  // The '+' syntax means "hold the first key, press the second, release both."
  // Common modifiers: 'Control', 'Shift', 'Alt', 'Meta' (Cmd on Mac).
  await page.keyboard.press('Control+b');

  // Verify the format status shows "Bold".
  await expect(page.getByTestId('format-status')).toHaveText('Bold');

  // Press Ctrl+I to trigger the italic shortcut.
  await page.keyboard.press('Control+i');

  // Verify the format status changed to "Italic".
  await expect(page.getByTestId('format-status')).toHaveText('Italic');
});

// --------------------------------------------------------------------------
// Exercise 3: Tab Navigation Through Form Fields
// --------------------------------------------------------------------------
// This exercise demonstrates how pressing Tab moves focus between elements
// that have a tabindex or are natively focusable (inputs, buttons, etc.).
test('exercise 3: tab through form fields and verify focus', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the first form field to give it focus. This is our starting point
  // for Tab navigation.
  await page.getByTestId('field-first-name').click();

  // Verify the focus indicator shows which field is currently focused.
  // The playground tracks focus via the 'focus' event listener and displays
  // the field id in the "focused-field" element.
  await expect(page.getByTestId('focused-field')).toHaveText('field-first-name');

  // Press Tab to move focus to the next field (Last Name).
  // page.keyboard.press('Tab') simulates pressing the Tab key, which moves
  // focus to the next element in the tab order (determined by tabindex
  // attribute or DOM order for focusable elements).
  await page.keyboard.press('Tab');

  // Verify focus moved to the last name field.
  await expect(page.getByTestId('focused-field')).toHaveText('field-last-name');

  // Press Tab again to move to the email field.
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('focused-field')).toHaveText('field-email');

  // Press Tab to move to the notes textarea.
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('focused-field')).toHaveText('field-notes');

  // Press Tab to move to the submit button.
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('focused-field')).toHaveText('btn-submit');
});

// --------------------------------------------------------------------------
// Exercise 4: Hover to Show Tooltip
// --------------------------------------------------------------------------
// This exercise demonstrates how to simulate mouse hover to trigger CSS
// :hover rules that show hidden tooltip elements.
test('exercise 4: hover over a card to reveal its tooltip', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First, verify the tooltip is hidden before hovering.
  // The tooltip is hidden by default (display: none in CSS) and only shown
  // when the parent card is hovered (.tooltip-card:hover .tooltip-text).
  await expect(page.getByTestId('tooltip-aml')).toBeHidden();

  // Hover over the AML card to trigger the CSS :hover state.
  // hover() moves the mouse to the center of the element. This triggers
  // CSS :hover pseudo-class, which in our playground shows the tooltip.
  // Unlike click(), hover() doesn't change focus — it only moves the mouse.
  await page.getByTestId('card-aml').hover();

  // Verify the tooltip is now visible.
  await expect(page.getByTestId('tooltip-aml')).toBeVisible();

  // Verify the tooltip contains the expected text.
  // toContainText(substring) checks if the element's textContent contains
  // the given string as a substring (not an exact match).
  await expect(page.getByTestId('tooltip-aml')).toContainText('OFAC');

  // Hover over the KYC card to reveal its tooltip.
  await page.getByTestId('card-kyc').hover();

  // The AML tooltip should now be hidden because we moved the mouse away.
  await expect(page.getByTestId('tooltip-aml')).toBeHidden();

  // The KYC tooltip should now be visible.
  await expect(page.getByTestId('tooltip-kyc')).toBeVisible();
  await expect(page.getByTestId('tooltip-kyc')).toContainText('identity documents');
});

// --------------------------------------------------------------------------
// Exercise 5: Mouse Position-Based Click
// --------------------------------------------------------------------------
// This exercise demonstrates how to click at specific coordinates within
// an element using the position option.
test('exercise 5: click at specific position in the drag area', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click at a specific position within the drag area.
  // click({ position: { x, y } }) clicks at the given offset from the
  // element's top-left corner. x is pixels from the left edge, y is pixels
  // from the top edge. This is useful for canvas, maps, or other position-
  // sensitive elements.
  await page.getByTestId('drag-area').click({ position: { x: 100, y: 50 } });

  // Verify the mouse coordinates display updated. The playground tracks
  // mouse position relative to the drag area via the mousemove event.
  // Note: The exact coordinates may vary slightly depending on timing,
  // so we check that the display contains reasonable values.
  await expect(page.getByTestId('mouse-coords')).not.toHaveText('x: 0, y: 0');
});

// --------------------------------------------------------------------------
// Exercise 6: Keyboard Shortcut Actions (A / R / E)
// --------------------------------------------------------------------------
// This exercise demonstrates pressing single-character keys to trigger
// application-specific shortcuts on a focused panel.
test('exercise 6: press A to approve, R to reject, E to escalate', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First, focus the shortcut panel by clicking it. The keyboard shortcut
  // listener is attached to this specific element, so it must have focus
  // for the key events to reach it.
  await page.getByTestId('shortcut-panel').click();

  // Verify the initial status is "Pending".
  await expect(page.getByTestId('shortcut-status')).toHaveText('Pending');

  // Press 'a' to approve the application.
  // page.keyboard.press(key) sends the key to whatever element currently
  // has focus. For single character keys, you just pass the character.
  await page.keyboard.press('a');

  // Verify the status changed to "Approved".
  await expect(page.getByTestId('shortcut-status')).toHaveText('Approved');

  // Press 'r' to reject the application.
  await page.keyboard.press('r');
  await expect(page.getByTestId('shortcut-status')).toHaveText('Rejected');

  // Press 'e' to escalate the application.
  await page.keyboard.press('e');
  await expect(page.getByTestId('shortcut-status')).toHaveText('Escalated');
});

// --------------------------------------------------------------------------
// Exercise 7: Arrow Keys to Reorder Items
// --------------------------------------------------------------------------
// This exercise demonstrates using arrow keys to reorder items in a list.
// The sortable list uses ArrowUp and ArrowDown to move the selected item.
test('exercise 7: reorder risk tiers using arrow keys', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the initial order of risk tiers.
  await expect(page.getByTestId('tier-order')).toHaveText('critical, high, medium, low');

  // Click the "High" tier item to select it. This adds the 'selected' class
  // and gives it focus, enabling arrow key interaction.
  await page.getByTestId('tier-high').click();

  // Press ArrowUp to move "High" one position up (above "Critical").
  // page.keyboard.press('ArrowUp') dispatches the ArrowUp key event.
  // The sortable list's keydown handler intercepts this and moves the
  // selected element before its previous sibling in the DOM.
  await page.keyboard.press('ArrowUp');

  // Verify the order changed — "High" is now first.
  await expect(page.getByTestId('tier-order')).toHaveText('high, critical, medium, low');

  // Press ArrowDown twice to move "High" back down past "Critical" and "Medium".
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');

  // Verify the new order.
  await expect(page.getByTestId('tier-order')).toHaveText('critical, medium, high, low');

  // Press Enter to confirm the selection (deselects the item).
  // After pressing Enter, the item loses the 'selected' class.
  await page.keyboard.press('Enter');
});

// --------------------------------------------------------------------------
// Exercise 8: Focus Management
// --------------------------------------------------------------------------
// This exercise demonstrates how to programmatically focus elements using
// Playwright's focus() method and verify focus state.
test('exercise 8: focus elements and verify focus state', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // focus() sets focus on the element without clicking it. This is useful
  // when you need to test focus-related behavior (like focus styles or
  // focus event handlers) without the side effects of a click.
  await page.getByTestId('field-email').focus();

  // Verify the focus indicator updated to show the email field.
  await expect(page.getByTestId('focused-field')).toHaveText('field-email');

  // toBeFocused() asserts that the element is the currently focused element
  // in the document (i.e., document.activeElement points to this element).
  await expect(page.getByTestId('field-email')).toBeFocused();

  // Move focus to the notes field programmatically.
  await page.getByTestId('field-notes').focus();
  await expect(page.getByTestId('field-notes')).toBeFocused();
  await expect(page.getByTestId('focused-field')).toHaveText('field-notes');

  // Type into the focused field using the keyboard. Since 'field-notes'
  // has focus, keyboard input goes directly to it.
  // page.keyboard.type(text) types the text character by character,
  // triggering keydown, keypress, and keyup events for each character.
  // This is different from fill() which sets the value directly.
  await page.keyboard.type('Reviewed by compliance team');
  await expect(page.getByTestId('field-notes')).toHaveValue('Reviewed by compliance team');
});
