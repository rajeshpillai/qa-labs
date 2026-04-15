import { test, expect } from '@playwright/test';

const PLAYGROUND = '/phase-00-foundations/02-assertions/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Text Assertions
// --------------------------------------------------------------------------
test('exercise 1: verify stat card text content', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // toHaveText checks the exact text content of an element.
  // The element's text is trimmed (leading/trailing whitespace removed).
  await expect(page.getByTestId('stat-total-value')).toHaveText('1,247');

  // toContainText checks that the text INCLUDES the expected substring.
  // Useful when you don't want to match the full text.
  await expect(page.getByTestId('stat-total')).toContainText('Total Applications');
});

// --------------------------------------------------------------------------
// Exercise 2: Visibility Assertions
// --------------------------------------------------------------------------
test('exercise 2: verify alerts are visible', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // toBeVisible asserts that the element is rendered and not hidden.
  // An element is "visible" when it has non-zero dimensions and is not
  // hidden by CSS (display:none, visibility:hidden, opacity:0).
  await expect(page.getByTestId('alert-success')).toBeVisible();
  await expect(page.getByTestId('alert-warning')).toBeVisible();
  await expect(page.getByTestId('alert-error')).toBeVisible();

  // Verify the content of each alert using toContainText.
  await expect(page.getByTestId('alert-success')).toContainText('12 applications processed');
  await expect(page.getByTestId('alert-warning')).toContainText('manual review');
  await expect(page.getByTestId('alert-error')).toContainText('experiencing delays');
});

// --------------------------------------------------------------------------
// Exercise 3: Count Assertions
// --------------------------------------------------------------------------
test('exercise 3: verify table row count', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // toHaveCount checks the number of elements matching the locator.
  // We select all <tr> elements inside the table body.
  const rows = page.getByTestId('app-table').locator('tbody tr');
  await expect(rows).toHaveCount(3);
});

// --------------------------------------------------------------------------
// Exercise 4: Attribute Assertions
// --------------------------------------------------------------------------
test('exercise 4: verify input attributes', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // toHaveAttribute(name, value?) checks an HTML attribute.
  // With just the name, it checks the attribute exists (regardless of value).
  const readonlyInput = page.getByTestId('input-readonly');
  await expect(readonlyInput).toHaveAttribute('readonly', '');
  await expect(readonlyInput).toHaveValue('KYC-2024-0001');

  // toBeDisabled is a shorthand for checking the disabled attribute.
  const disabledInput = page.getByTestId('input-disabled');
  await expect(disabledInput).toBeDisabled();
  await expect(disabledInput).toHaveValue('Cannot edit');

  // Check the required attribute exists.
  const requiredInput = page.getByTestId('input-required');
  await expect(requiredInput).toHaveAttribute('required', '');
});

// --------------------------------------------------------------------------
// Exercise 5: CSS Assertions
// --------------------------------------------------------------------------
test('exercise 5: verify and change CSS styles', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const box = page.getByTestId('colored-box');

  // toHaveCSS checks a computed CSS property value.
  // IMPORTANT: browsers compute colors as rgb(), not hex.
  // So even if the CSS says "#3b82f6", the computed value is "rgb(59, 130, 246)".
  await expect(box).toHaveCSS('background-color', 'rgb(59, 130, 246)');
  await expect(box).toHaveCSS('border-radius', '8px');

  // Click the button to change the color.
  await page.getByTestId('btn-change-color').click();

  // Now verify the new color.
  await expect(box).toHaveCSS('background-color', 'rgb(239, 68, 68)');
});

// --------------------------------------------------------------------------
// Exercise 6: Counter Interactions
// --------------------------------------------------------------------------
test('exercise 6: counter increment, decrement, and reset', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const counter = page.getByTestId('counter-value');

  // Initial state should be 0.
  await expect(counter).toHaveText('0');

  // Click +1 three times.
  await page.getByTestId('btn-increment').click();
  await page.getByTestId('btn-increment').click();
  await page.getByTestId('btn-increment').click();
  await expect(counter).toHaveText('3');

  // Click -1 once.
  await page.getByTestId('btn-decrement').click();
  await expect(counter).toHaveText('2');

  // Reset.
  await page.getByTestId('btn-reset-counter').click();
  await expect(counter).toHaveText('0');
});

// --------------------------------------------------------------------------
// Exercise 7: Dynamic Content
// --------------------------------------------------------------------------
test('exercise 7: add and clear dynamic alerts', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const alertsContainer = page.getByTestId('dynamic-alerts');

  // Initially no dynamic alerts.
  await expect(alertsContainer.locator('.alert')).toHaveCount(0);

  // Click "Add Alert" twice.
  await page.getByTestId('btn-add-alert').click();
  await page.getByTestId('btn-add-alert').click();

  // Verify 2 alerts appear.
  await expect(alertsContainer.locator('.alert')).toHaveCount(2);

  // Verify the first dynamic alert has the expected text.
  await expect(page.getByTestId('dynamic-alert-1')).toContainText('Alert #1');

  // Clear all alerts.
  await page.getByTestId('btn-clear-alerts').click();
  await expect(alertsContainer.locator('.alert')).toHaveCount(0);
});

// --------------------------------------------------------------------------
// Exercise 8: Negative Assertions
// --------------------------------------------------------------------------
test('exercise 8: negative assertions', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // .not inverts any assertion.
  // The empty list should NOT contain any list items.
  const emptyList = page.getByTestId('empty-list');
  await expect(emptyList.locator('.list-item')).toHaveCount(0);
  await expect(page.getByTestId('empty-message')).toHaveText('No pending verifications.');

  // The items list should NOT be empty — it has 3 items.
  const itemsList = page.getByTestId('items-list');
  await expect(itemsList.locator('.list-item')).not.toHaveCount(0);
  await expect(itemsList.locator('.list-item')).toHaveCount(3);
});

// --------------------------------------------------------------------------
// Exercise 9: Data Attributes
// --------------------------------------------------------------------------
test('exercise 9: verify custom data attributes', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const el = page.getByTestId('data-attributes');

  // toHaveAttribute checks any HTML attribute, including custom data-* attrs.
  await expect(el).toHaveAttribute('data-status', 'active');
  await expect(el).toHaveAttribute('data-priority', 'high');
  await expect(el).toHaveAttribute('data-count', '42');
  await expect(el).toHaveAttribute('data-user-role', 'admin');
});

// --------------------------------------------------------------------------
// Exercise 10: Multiple Assertions on One Element
// --------------------------------------------------------------------------
test('exercise 10: multiple assertions on a link', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const link = page.getByTestId('link-terms');

  // You can chain multiple await expect() calls on the same locator.
  // Each assertion auto-waits independently.
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://example.com/terms');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveText('Terms of Service');
});

// --------------------------------------------------------------------------
// Bonus: Soft Assertions
// --------------------------------------------------------------------------
test('bonus: soft assertions collect all failures', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // expect.soft() does NOT stop the test on failure.
  // All soft assertion failures are collected and reported at the end.
  // This is useful when you want to check many things in one test.
  await expect.soft(page.getByTestId('stat-total-value')).toHaveText('1,247');
  await expect.soft(page.getByTestId('stat-approved-value')).toHaveText('892');
  await expect.soft(page.getByTestId('stat-rejected-value')).toHaveText('156');
  await expect.soft(page.getByTestId('stat-pending-value')).toHaveText('199');
});
