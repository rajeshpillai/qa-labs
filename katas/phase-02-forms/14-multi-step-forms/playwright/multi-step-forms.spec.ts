import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-02-forms/14-multi-step-forms/playground/';

// --------------------------------------------------------------------------
// Helper: Fill step 1 (Personal Info) with valid data.
// --------------------------------------------------------------------------
async function fillStep1(page: import('@playwright/test').Page) {
  await page.getByTestId('input-full-name').fill('Aisha Patel');
  await page.getByTestId('input-email').fill('aisha@example.com');
  await page.getByTestId('input-phone').fill('+1-555-123-4567');
}

// --------------------------------------------------------------------------
// Helper: Fill step 2 (Address) with valid data.
// --------------------------------------------------------------------------
async function fillStep2(page: import('@playwright/test').Page) {
  await page.getByTestId('input-street').fill('42 Baker Street');
  await page.getByTestId('input-city').fill('London');
  // selectOption(value) picks the <option> whose value attribute matches.
  await page.getByTestId('input-country').selectOption('GB');
  await page.getByTestId('input-postal').fill('W1U 6PL');
}

// --------------------------------------------------------------------------
// Helper: Fill step 3 (Employment) with valid data.
// --------------------------------------------------------------------------
async function fillStep3(page: import('@playwright/test').Page) {
  await page.getByTestId('input-employment-status').selectOption('employed');
  await page.getByTestId('input-employer').fill('Acme Corp');
  await page.getByTestId('input-income').selectOption('50k-100k');
}

// --------------------------------------------------------------------------
// Helper: Navigate from step 1 to step 4 (review) filling all fields.
// --------------------------------------------------------------------------
async function completeAllSteps(page: import('@playwright/test').Page) {
  // Step 1
  await fillStep1(page);
  await page.getByTestId('btn-next-1').click();

  // Step 2
  await fillStep2(page);
  await page.getByTestId('btn-next-2').click();

  // Step 3
  await fillStep3(page);
  await page.getByTestId('btn-next-3').click();
}

// --------------------------------------------------------------------------
// Exercise 1: Navigate Forward Through Steps
// --------------------------------------------------------------------------
// Fill step 1 and click Next. Verify step 2 is visible and step 1 is hidden.
test('exercise 1: navigate forward from step 1 to step 2', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify step 1 is initially visible.
  await expect(page.getByTestId('step-1')).toBeVisible();

  // Fill step 1 with valid data.
  await fillStep1(page);

  // Click Next to advance to step 2.
  // click() triggers the button's click handler which validates and navigates.
  await page.getByTestId('btn-next-1').click();

  // Verify step 2 is now visible and step 1 is hidden.
  // toBeVisible() checks the element has display:block (the "active" class).
  await expect(page.getByTestId('step-2')).toBeVisible();
  // toBeHidden() checks the element has display:none.
  await expect(page.getByTestId('step-1')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 2: Navigate Back to Previous Step
// --------------------------------------------------------------------------
// From step 2, click Back. Verify step 1 is visible and data persists.
test('exercise 2: navigate back from step 2 to step 1', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Fill step 1 and advance.
  await fillStep1(page);
  await page.getByTestId('btn-next-1').click();
  await expect(page.getByTestId('step-2')).toBeVisible();

  // Click Back to return to step 1.
  await page.getByTestId('btn-back-2').click();

  // Verify step 1 is visible again.
  await expect(page.getByTestId('step-1')).toBeVisible();
  await expect(page.getByTestId('step-2')).toBeHidden();

  // Verify the data we entered is still in the fields.
  // toHaveValue(value) checks the input's current value attribute.
  await expect(page.getByTestId('input-full-name')).toHaveValue('Aisha Patel');
  await expect(page.getByTestId('input-email')).toHaveValue('aisha@example.com');
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Progress Indicator Updates
// --------------------------------------------------------------------------
// Navigate to step 2 and verify indicator states.
test('exercise 3: progress indicator updates on navigation', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initially, indicator 1 should be "active" and others should not.
  await expect(page.getByTestId('indicator-1')).toHaveClass(/active/);
  await expect(page.getByTestId('indicator-2')).not.toHaveClass(/active/);

  // Navigate to step 2.
  await fillStep1(page);
  await page.getByTestId('btn-next-1').click();

  // Indicator 1 should now be "completed" (green) and indicator 2 "active" (blue).
  await expect(page.getByTestId('indicator-1')).toHaveClass(/completed/);
  await expect(page.getByTestId('indicator-2')).toHaveClass(/active/);
  // Indicator 3 and 4 should have neither class.
  await expect(page.getByTestId('indicator-3')).not.toHaveClass(/active/);
  await expect(page.getByTestId('indicator-3')).not.toHaveClass(/completed/);
});

// --------------------------------------------------------------------------
// Exercise 4: Step 1 Validation Prevents Advancing
// --------------------------------------------------------------------------
// Click Next on step 1 without filling any fields.
test('exercise 4: step 1 validation prevents advancing when empty', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click Next without filling anything.
  await page.getByTestId('btn-next-1').click();

  // Verify we are still on step 1 (it remains visible).
  await expect(page.getByTestId('step-1')).toBeVisible();
  await expect(page.getByTestId('step-2')).toBeHidden();

  // Verify error messages appear for empty fields.
  await expect(page.getByTestId('error-full-name')).toBeVisible();
  await expect(page.getByTestId('error-email')).toBeVisible();
  await expect(page.getByTestId('error-phone')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 5: Complete the Full 4-Step Flow
// --------------------------------------------------------------------------
// Fill all steps and navigate to the review page.
test('exercise 5: complete full 4-step flow', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Use our helper to fill and navigate all steps.
  await completeAllSteps(page);

  // Verify we reached step 4 (the review page).
  await expect(page.getByTestId('step-4')).toBeVisible();
  await expect(page.getByTestId('step-3')).toBeHidden();

  // All four indicators should show completed or active.
  await expect(page.getByTestId('indicator-4')).toHaveClass(/active/);
  await expect(page.getByTestId('indicator-1')).toHaveClass(/completed/);
  await expect(page.getByTestId('indicator-2')).toHaveClass(/completed/);
  await expect(page.getByTestId('indicator-3')).toHaveClass(/completed/);
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Review Page Shows All Entered Data
// --------------------------------------------------------------------------
// Check that the review page displays the exact values from each step.
test('exercise 6: review page displays all entered data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await completeAllSteps(page);

  // Verify step 4 is visible.
  await expect(page.getByTestId('step-4')).toBeVisible();

  // Verify personal info.
  // toHaveText(str) checks the element's textContent exactly matches.
  await expect(page.getByTestId('review-fullName')).toHaveText('Aisha Patel');
  await expect(page.getByTestId('review-email')).toHaveText('aisha@example.com');
  await expect(page.getByTestId('review-phone')).toHaveText('+1-555-123-4567');

  // Verify address info.
  await expect(page.getByTestId('review-street')).toHaveText('42 Baker Street');
  await expect(page.getByTestId('review-city')).toHaveText('London');
  // The review shows the option text ("United Kingdom"), not the value ("GB").
  await expect(page.getByTestId('review-country')).toHaveText('United Kingdom');
  await expect(page.getByTestId('review-postal')).toHaveText('W1U 6PL');

  // Verify employment info.
  await expect(page.getByTestId('review-employmentStatus')).toHaveText('Employed');
  await expect(page.getByTestId('review-employer')).toHaveText('Acme Corp');
  await expect(page.getByTestId('review-income')).toHaveText('$50,000 - $100,000');
});

// --------------------------------------------------------------------------
// Exercise 7: Submit from the Review Page
// --------------------------------------------------------------------------
// Complete all steps and click Submit. Verify the success message.
test('exercise 7: submit application from review page', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await completeAllSteps(page);

  // Click the Submit button on the review page.
  await page.getByTestId('btn-submit').click();

  // Verify the success message appears.
  await expect(page.getByTestId('form-status')).toBeVisible();
  await expect(page.getByTestId('form-status')).toHaveClass(/success/);
  await expect(page.getByTestId('form-status')).toContainText('submitted successfully');
});

// --------------------------------------------------------------------------
// Exercise 8: Step 2 Validation Prevents Advancing
// --------------------------------------------------------------------------
// Navigate to step 2, leave fields empty, and click Next.
test('exercise 8: step 2 validation prevents advancing when empty', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Fill and pass step 1.
  await fillStep1(page);
  await page.getByTestId('btn-next-1').click();

  // Now on step 2 — click Next without filling anything.
  await page.getByTestId('btn-next-2').click();

  // Verify we remain on step 2.
  await expect(page.getByTestId('step-2')).toBeVisible();
  await expect(page.getByTestId('step-3')).toBeHidden();

  // Verify error messages appear for step 2 fields.
  await expect(page.getByTestId('error-street')).toBeVisible();
  await expect(page.getByTestId('error-city')).toBeVisible();
  await expect(page.getByTestId('error-country')).toBeVisible();
  await expect(page.getByTestId('error-postal')).toBeVisible();
});
