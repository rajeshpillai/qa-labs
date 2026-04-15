import { test, expect } from '@playwright/test';

const PLAYGROUND = '/phase-00-foundations/04-clicks-and-inputs/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Calculator
// --------------------------------------------------------------------------
test('exercise 1: calculate 42 + 18 = 60', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click digits 4, 2 to enter "42".
  await page.getByTestId('calc-4').click();
  await page.getByTestId('calc-2').click();
  await expect(page.getByTestId('calc-display')).toHaveText('42');

  // Click the + operator.
  await page.getByTestId('calc-add').click();

  // Click digits 1, 8 to enter "18".
  await page.getByTestId('calc-1').click();
  await page.getByTestId('calc-8').click();

  // Click = to compute the result.
  await page.getByTestId('calc-equals').click();

  // Verify the display shows "60".
  await expect(page.getByTestId('calc-display')).toHaveText('60');
});

// --------------------------------------------------------------------------
// Exercise 2: Fill Text Inputs
// --------------------------------------------------------------------------
test('exercise 2: fill inputs and verify live summary', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // fill() clears the field first, then sets the value.
  // It also triggers 'input' and 'change' events so the live summary updates.
  await page.getByTestId('input-name').fill('Alice Johnson');
  await page.getByTestId('input-email').fill('alice@fintech.com');
  await page.getByTestId('input-amount').fill('2500.50');

  // Verify the live summary reflects the input values.
  await expect(page.getByTestId('summary-name')).toHaveText('Alice Johnson');
  await expect(page.getByTestId('summary-email')).toHaveText('alice@fintech.com');
  await expect(page.getByTestId('summary-amount')).toHaveText('2500.50');

  // Verify the password field can be filled (value is masked but stored).
  await page.getByTestId('input-password').fill('Str0ngP@ss!');
  await expect(page.getByTestId('input-password')).toHaveValue('Str0ngP@ss!');

  // Fill the textarea.
  await page.getByTestId('textarea-reason').fill('Insufficient documentation provided.');
  await expect(page.getByTestId('textarea-reason')).toHaveValue('Insufficient documentation provided.');
});

// --------------------------------------------------------------------------
// Exercise 3: Clear and Retype
// --------------------------------------------------------------------------
test('exercise 3: clear a field and fill with new value', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const nameInput = page.getByTestId('input-name');

  // Fill with wrong value.
  await nameInput.fill('Wrong Name');
  await expect(nameInput).toHaveValue('Wrong Name');

  // clear() empties the field. Same as fill('').
  await nameInput.clear();
  await expect(nameInput).toHaveValue('');

  // Fill with correct value.
  await nameInput.fill('Correct Name');
  await expect(nameInput).toHaveValue('Correct Name');
});

// --------------------------------------------------------------------------
// Exercise 4: Select Dropdown
// --------------------------------------------------------------------------
test('exercise 4: select option from dropdown', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // selectOption selects by value attribute.
  // The <option value="high">High Risk</option> will be selected.
  await page.getByTestId('select-risk').selectOption('high');

  // Verify the input value changed.
  await expect(page.getByTestId('select-risk')).toHaveValue('high');

  // Verify the UI text updated.
  await expect(page.getByTestId('selected-risk')).toHaveText('High Risk');

  // You can also select by label (visible text).
  await page.getByTestId('select-risk').selectOption({ label: 'Critical Risk' });
  await expect(page.getByTestId('select-risk')).toHaveValue('critical');
});

// --------------------------------------------------------------------------
// Exercise 5: Multi-Select
// --------------------------------------------------------------------------
test('exercise 5: select multiple options', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Pass an array of values to select multiple options at once.
  // Only works on <select multiple> elements.
  await page.getByTestId('select-country').selectOption(['us', 'in']);

  // Verify both options are selected.
  // toHaveValues checks all selected values in a multi-select.
  await expect(page.getByTestId('select-country')).toHaveValues(['us', 'in']);
});

// --------------------------------------------------------------------------
// Exercise 6: Checkboxes
// --------------------------------------------------------------------------
test('exercise 6: check and uncheck checkboxes', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // check() checks the checkbox. If already checked, it's a no-op.
  await page.getByTestId('check-identity').check();
  await page.getByTestId('check-sanctions').check();

  // Verify both are checked.
  await expect(page.getByTestId('check-identity')).toBeChecked();
  await expect(page.getByTestId('check-sanctions')).toBeChecked();

  // Verify the checked count updates.
  await expect(page.getByTestId('checked-count')).toHaveText('2');

  // uncheck() unchecks a checkbox.
  await page.getByTestId('check-identity').uncheck();
  await expect(page.getByTestId('check-identity')).not.toBeChecked();
  await expect(page.getByTestId('checked-count')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 7: Radio Buttons
// --------------------------------------------------------------------------
test('exercise 7: select radio buttons', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // check() works for radio buttons too.
  await page.getByTestId('radio-approve').check();
  await expect(page.getByTestId('radio-approve')).toBeChecked();
  await expect(page.getByTestId('decision-value')).toHaveText('Approve');

  // Selecting a different radio unchecks the previous one.
  await page.getByTestId('radio-reject').check();
  await expect(page.getByTestId('radio-reject')).toBeChecked();
  await expect(page.getByTestId('radio-approve')).not.toBeChecked();
  await expect(page.getByTestId('decision-value')).toHaveText('Reject');
});

// --------------------------------------------------------------------------
// Exercise 8: Double Click
// --------------------------------------------------------------------------
test('exercise 8: double click', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // dblclick() performs a double-click on the element.
  await page.getByTestId('btn-double-click').dblclick();

  await expect(page.getByTestId('click-result')).toHaveText('Double click detected!');
});

// --------------------------------------------------------------------------
// Exercise 9: Right Click (Context Menu)
// --------------------------------------------------------------------------
test('exercise 9: right click and context menu', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // click({ button: 'right' }) performs a right-click.
  await page.getByTestId('btn-right-click').click({ button: 'right' });

  // Verify the custom context menu appears.
  await expect(page.getByTestId('context-menu')).toBeVisible();

  // Click "Approve" in the context menu.
  await page.getByTestId('ctx-approve').click();

  // Verify the result.
  await expect(page.getByTestId('click-result')).toHaveText('Context action: Approve');
  await expect(page.getByTestId('context-menu')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 10: Range Slider
// --------------------------------------------------------------------------
test('exercise 10: set range slider value', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // fill() works for range inputs in Playwright.
  // It sets the value and triggers the 'input' event.
  await page.getByTestId('risk-slider').fill('75');

  // Verify the displayed value updated.
  await expect(page.getByTestId('slider-value')).toHaveText('75');
});
