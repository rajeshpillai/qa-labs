import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-02-forms/13-form-validation/playground/';

// --------------------------------------------------------------------------
// Helper: Fill every field with valid data.
// --------------------------------------------------------------------------
// This helper fills all six required fields with data that passes validation.
// Individual tests can then override a single field to test that one rule.
//
// Parameters:
//   page — the Playwright Page object from the test fixture.
async function fillValidData(page: import('@playwright/test').Page) {
  // fill(value) clears the input and types the new value in one step.
  await page.getByTestId('input-full-name').fill('Aisha Patel');

  await page.getByTestId('input-email').fill('aisha@example.com');

  await page.getByTestId('input-phone').fill('+1-555-123-4567');

  // For date inputs, fill() accepts an ISO date string (YYYY-MM-DD).
  await page.getByTestId('input-dob').fill('1990-05-15');

  // selectOption(value) picks the <option> whose value attribute matches.
  await page.getByTestId('input-nationality').selectOption('IN');

  await page.getByTestId('input-id-number').fill('A12345678');
}

// --------------------------------------------------------------------------
// Exercise 1: Submit Empty Form and Verify All Errors Appear
// --------------------------------------------------------------------------
// Clicking submit without filling anything should show all six error messages.
test('exercise 1: submit empty form and verify all errors appear', async ({ page }) => {
  // Navigate to the playground.
  await page.goto(PLAYGROUND);

  // Click the submit button without entering any data.
  // click() simulates a left-click on the element's center point.
  await page.getByTestId('btn-submit').click();

  // Verify every error message is now visible.
  // toBeVisible() checks that the element is rendered and has non-zero size.
  await expect(page.getByTestId('error-full-name')).toBeVisible();
  await expect(page.getByTestId('error-email')).toBeVisible();
  await expect(page.getByTestId('error-phone')).toBeVisible();
  await expect(page.getByTestId('error-dob')).toBeVisible();
  await expect(page.getByTestId('error-nationality')).toBeVisible();
  await expect(page.getByTestId('error-id-number')).toBeVisible();

  // Verify the form-level error banner is also shown.
  await expect(page.getByTestId('form-status')).toBeVisible();
  await expect(page.getByTestId('form-status')).toContainText('Please fix the errors');
});

// --------------------------------------------------------------------------
// Exercise 2: Fill Valid Data and Verify Success Message
// --------------------------------------------------------------------------
// When all fields pass validation, a success banner should appear.
test('exercise 2: fill valid data and verify success message', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Fill all fields with valid data using our helper.
  await fillValidData(page);

  // Submit the form.
  await page.getByTestId('btn-submit').click();

  // Verify the success banner is shown.
  // toHaveClass(regex) checks the element's className matches the pattern.
  await expect(page.getByTestId('form-status')).toHaveClass(/success/);
  await expect(page.getByTestId('form-status')).toContainText('submitted successfully');

  // Verify NO error messages are visible.
  await expect(page.getByTestId('error-full-name')).toBeHidden();
  await expect(page.getByTestId('error-email')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 3: Enter Invalid Email and Verify Error
// --------------------------------------------------------------------------
// An invalid email (missing @ or domain) should trigger the email error only.
test('exercise 3: invalid email triggers email error', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Fill valid data first, then override email with an invalid value.
  await fillValidData(page);
  // fill() replaces the entire input content. "notanemail" has no @ symbol
  // so it fails the email regex check.
  await page.getByTestId('input-email').fill('notanemail');

  await page.getByTestId('btn-submit').click();

  // Only the email error should be visible.
  await expect(page.getByTestId('error-email')).toBeVisible();

  // Other errors should NOT be visible since their fields have valid data.
  await expect(page.getByTestId('error-full-name')).toBeHidden();
  await expect(page.getByTestId('error-phone')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 4: Enter Invalid Phone and Verify Error
// --------------------------------------------------------------------------
// A phone number with too few digits should trigger the phone error only.
test('exercise 4: invalid phone triggers phone error', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await fillValidData(page);
  // "123" is only 3 digits, well below the 10-digit minimum.
  await page.getByTestId('input-phone').fill('123');

  await page.getByTestId('btn-submit').click();

  // Only the phone error should be visible.
  await expect(page.getByTestId('error-phone')).toBeVisible();

  // Other errors should remain hidden.
  await expect(page.getByTestId('error-email')).toBeHidden();
  await expect(page.getByTestId('error-full-name')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 5: Enter Name Below Minimum Length
// --------------------------------------------------------------------------
// The name field requires at least 3 characters. "AB" is only 2.
test('exercise 5: name below minimum length triggers error', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await fillValidData(page);
  // "AB" is 2 characters — below the 3-character minimum.
  await page.getByTestId('input-full-name').fill('AB');

  await page.getByTestId('btn-submit').click();

  // The name error should appear.
  await expect(page.getByTestId('error-full-name')).toBeVisible();

  // Other fields should still be valid.
  await expect(page.getByTestId('error-email')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Exact Error Message Text
// --------------------------------------------------------------------------
// Each error message must contain the exact expected text.
test('exercise 6: verify exact error message text', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Submit empty form to trigger all errors.
  await page.getByTestId('btn-submit').click();

  // toHaveText(expected) checks that textContent exactly matches.
  await expect(page.getByTestId('error-full-name')).toHaveText(
    'Full name is required (3-50 characters).'
  );
  await expect(page.getByTestId('error-email')).toHaveText(
    'Please enter a valid email address.'
  );
  await expect(page.getByTestId('error-phone')).toHaveText(
    'Phone must be 10-15 digits (may start with +).'
  );
  await expect(page.getByTestId('error-dob')).toHaveText(
    'Date of birth is required.'
  );
  await expect(page.getByTestId('error-nationality')).toHaveText(
    'Please select your nationality.'
  );
  await expect(page.getByTestId('error-id-number')).toHaveText(
    'ID number must be 5-20 characters.'
  );
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Error Styling (Red Border)
// --------------------------------------------------------------------------
// When validation fails, each input should have the "input-error" CSS class
// which applies a red border.
test('exercise 7: verify error styling on invalid inputs', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Submit empty form.
  await page.getByTestId('btn-submit').click();

  // toHaveClass(regex) checks if the element's className contains the pattern.
  // /input-error/ is a regex that matches if "input-error" appears anywhere
  // in the class string.
  await expect(page.getByTestId('input-full-name')).toHaveClass(/input-error/);
  await expect(page.getByTestId('input-email')).toHaveClass(/input-error/);
  await expect(page.getByTestId('input-phone')).toHaveClass(/input-error/);
  await expect(page.getByTestId('input-dob')).toHaveClass(/input-error/);
  await expect(page.getByTestId('input-nationality')).toHaveClass(/input-error/);
  await expect(page.getByTestId('input-id-number')).toHaveClass(/input-error/);
});

// --------------------------------------------------------------------------
// Exercise 8: Successful Submission Clears Errors
// --------------------------------------------------------------------------
// First trigger errors by submitting empty, then fill valid data and submit
// again. All errors should disappear and the success banner should show.
test('exercise 8: successful submission clears previous errors', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Step 1: Submit the empty form to trigger all error messages.
  await page.getByTestId('btn-submit').click();

  // Confirm errors are visible.
  await expect(page.getByTestId('error-full-name')).toBeVisible();
  await expect(page.getByTestId('form-status')).toHaveClass(/error/);

  // Step 2: Fill all fields with valid data.
  await fillValidData(page);

  // Step 3: Submit again.
  await page.getByTestId('btn-submit').click();

  // All error messages should now be hidden.
  await expect(page.getByTestId('error-full-name')).toBeHidden();
  await expect(page.getByTestId('error-email')).toBeHidden();
  await expect(page.getByTestId('error-phone')).toBeHidden();
  await expect(page.getByTestId('error-dob')).toBeHidden();
  await expect(page.getByTestId('error-nationality')).toBeHidden();
  await expect(page.getByTestId('error-id-number')).toBeHidden();

  // All inputs should no longer have the error class.
  await expect(page.getByTestId('input-full-name')).not.toHaveClass(/input-error/);

  // The success banner should be shown.
  await expect(page.getByTestId('form-status')).toHaveClass(/success/);
  await expect(page.getByTestId('form-status')).toContainText('submitted successfully');
});
