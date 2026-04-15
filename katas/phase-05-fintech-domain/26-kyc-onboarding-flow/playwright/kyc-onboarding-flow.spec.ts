import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-05-fintech-domain/26-kyc-onboarding-flow/playground/';

// ─── Helper: fillPersonalInfo ────────────────────────────────────────
// Fills the personal info form (step 2) with the given data.
// locator.fill(value) clears the input first, then types the value.
// locator.selectOption(value) selects the <option> with the matching value attribute.
async function fillPersonalInfo(page: any, data: {
  firstName: string; lastName: string; email: string; dob: string; country: string;
}) {
  await page.getByTestId('input-first-name').fill(data.firstName);
  await page.getByTestId('input-last-name').fill(data.lastName);
  await page.getByTestId('input-email').fill(data.email);
  await page.getByTestId('input-dob').fill(data.dob);
  await page.getByTestId('select-country').selectOption(data.country);
}

// ─── Helper: uploadDocument ──────────────────────────────────────────
// Selects a document type and simulates a file upload.
// setInputFiles() accepts an object with name, mimeType, and buffer
// to create a synthetic file without needing a real file on disk.
async function uploadDocument(page: any, docType: string = 'passport', fileName: string = 'passport.pdf') {
  await page.getByTestId('select-doc-type').selectOption(docType);
  await page.getByTestId('file-input').setInputFiles({
    name: fileName,
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake-pdf-content')
  });
}

// Default test data used across exercises.
const DEFAULT_DATA = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  dob: '1990-05-15',
  country: 'US'
};

// --------------------------------------------------------------------------
// Exercise 1: Complete Happy Path End-to-End
// --------------------------------------------------------------------------
// Walk through all 5 steps and verify the success result page appears.
test('exercise 1: complete happy path end-to-end', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Step 1: Welcome — click "Get Started" to begin.
  await expect(page.getByTestId('step-welcome')).toBeVisible();
  await page.getByTestId('btn-start').click();

  // Step 2: Personal Info — fill the form and click "Next".
  await expect(page.getByTestId('step-personal')).toBeVisible();
  await fillPersonalInfo(page, DEFAULT_DATA);
  await page.getByTestId('btn-next-personal').click();

  // Step 3: Document Upload — select type, upload file, click "Next".
  await expect(page.getByTestId('step-document')).toBeVisible();
  await uploadDocument(page);
  await page.getByTestId('btn-next-document').click();

  // Step 4: Review — verify the review step is visible, then submit.
  await expect(page.getByTestId('step-review')).toBeVisible();
  await page.getByTestId('btn-submit').click();

  // Step 5: Result — wait for the result to appear (1s submit delay).
  // toBeVisible() retries until the element is visible or the timeout expires.
  await expect(page.getByTestId('step-result')).toBeVisible({ timeout: 3000 });
  await expect(page.getByTestId('result-title')).toHaveText('Application Submitted');
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Each Step Content
// --------------------------------------------------------------------------
// Navigate through each step and verify its heading and elements.
test('exercise 2: verify each step content', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Step 1: Welcome — should show the welcome heading.
  await expect(page.getByTestId('step-welcome')).toBeVisible();
  await expect(page.getByTestId('step-welcome')).toContainText('Welcome to KYC Onboarding');
  await page.getByTestId('btn-start').click();

  // Step 2: Personal Info — should show form fields.
  await expect(page.getByTestId('step-personal')).toBeVisible();
  await expect(page.getByTestId('input-first-name')).toBeVisible();
  await expect(page.getByTestId('input-email')).toBeVisible();
  await expect(page.getByTestId('select-country')).toBeVisible();

  // Fill and advance so we can check step 3.
  await fillPersonalInfo(page, DEFAULT_DATA);
  await page.getByTestId('btn-next-personal').click();

  // Step 3: Document Upload — should show upload area.
  await expect(page.getByTestId('step-document')).toBeVisible();
  await expect(page.getByTestId('upload-area')).toBeVisible();
  await expect(page.getByTestId('select-doc-type')).toBeVisible();

  // Fill and advance so we can check step 4.
  await uploadDocument(page);
  await page.getByTestId('btn-next-document').click();

  // Step 4: Review — should show the review table.
  await expect(page.getByTestId('step-review')).toBeVisible();
  await expect(page.getByTestId('review-table')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 3: Navigate Back and Forth
// --------------------------------------------------------------------------
// Go forward, then back, and verify entered data is preserved.
test('exercise 3: navigate back and forth', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Go to step 2 and fill data.
  await page.getByTestId('btn-start').click();
  await fillPersonalInfo(page, DEFAULT_DATA);

  // Advance to step 3.
  await page.getByTestId('btn-next-personal').click();
  await expect(page.getByTestId('step-document')).toBeVisible();

  // Navigate back to step 2.
  await page.getByTestId('btn-back-document').click();
  await expect(page.getByTestId('step-personal')).toBeVisible();

  // Verify the data is still present.
  // toHaveValue(value) checks the current value of an input element.
  await expect(page.getByTestId('input-first-name')).toHaveValue('John');
  await expect(page.getByTestId('input-last-name')).toHaveValue('Doe');
  await expect(page.getByTestId('input-email')).toHaveValue('john.doe@example.com');
  await expect(page.getByTestId('select-country')).toHaveValue('US');
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Review Page Data
// --------------------------------------------------------------------------
// Fill in all data, then verify the review page shows every field correctly.
test('exercise 4: verify review page data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Complete steps 1-3.
  await page.getByTestId('btn-start').click();
  await fillPersonalInfo(page, DEFAULT_DATA);
  await page.getByTestId('btn-next-personal').click();
  await uploadDocument(page, 'passport', 'my-passport.pdf');
  await page.getByTestId('btn-next-document').click();

  // Verify each review field matches the entered data.
  // toHaveText(text) checks the element's textContent matches exactly.
  await expect(page.getByTestId('review-first-name')).toHaveText('John');
  await expect(page.getByTestId('review-last-name')).toHaveText('Doe');
  await expect(page.getByTestId('review-email')).toHaveText('john.doe@example.com');
  await expect(page.getByTestId('review-dob')).toHaveText('1990-05-15');
  await expect(page.getByTestId('review-country')).toHaveText('United States');
  await expect(page.getByTestId('review-doc-type')).toHaveText('Passport');
  await expect(page.getByTestId('review-doc-file')).toHaveText('my-passport.pdf');
});

// --------------------------------------------------------------------------
// Exercise 5: Submit and Verify Success
// --------------------------------------------------------------------------
// Complete the flow and verify all elements of the success result page.
test('exercise 5: submit and verify success', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Complete all steps.
  await page.getByTestId('btn-start').click();
  await fillPersonalInfo(page, DEFAULT_DATA);
  await page.getByTestId('btn-next-personal').click();
  await uploadDocument(page);
  await page.getByTestId('btn-next-document').click();
  await page.getByTestId('btn-submit').click();

  // Wait for the result step to appear after the 1s submission delay.
  await expect(page.getByTestId('step-result')).toBeVisible({ timeout: 3000 });

  // Verify the success result elements.
  await expect(page.getByTestId('result-title')).toHaveText('Application Submitted');
  await expect(page.getByTestId('result-message')).toContainText('submitted successfully');

  // Verify the reference number starts with "KYC-".
  // toContainText(text) checks that the element's text contains the given substring.
  await expect(page.getByTestId('result-ref')).toContainText('Reference: KYC-');
});

// --------------------------------------------------------------------------
// Exercise 6: Validate Required Fields Per Step
// --------------------------------------------------------------------------
// Try to advance without filling fields and verify validation errors appear.
test('exercise 6: validate required fields per step', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Go to step 2 (Personal Info).
  await page.getByTestId('btn-start').click();

  // Click "Next" without filling anything.
  await page.getByTestId('btn-next-personal').click();

  // Verify we're still on step 2 (didn't advance).
  await expect(page.getByTestId('step-personal')).toBeVisible();

  // Verify all error messages are now visible.
  // The 'visible' CSS class is added to show each error message.
  await expect(page.getByTestId('error-first-name')).toBeVisible();
  await expect(page.getByTestId('error-last-name')).toBeVisible();
  await expect(page.getByTestId('error-email')).toBeVisible();
  await expect(page.getByTestId('error-dob')).toBeVisible();
  await expect(page.getByTestId('error-country')).toBeVisible();

  // Fill the fields and advance to step 3.
  await fillPersonalInfo(page, DEFAULT_DATA);
  await page.getByTestId('btn-next-personal').click();
  await expect(page.getByTestId('step-document')).toBeVisible();

  // Click "Next" on step 3 without selecting doc type or uploading.
  await page.getByTestId('btn-next-document').click();

  // Verify we're still on step 3 and errors are shown.
  await expect(page.getByTestId('step-document')).toBeVisible();
  await expect(page.getByTestId('error-doc-type')).toBeVisible();
  await expect(page.getByTestId('error-upload')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Progress Indicator
// --------------------------------------------------------------------------
// At each step, verify the progress bar highlights the correct step.
test('exercise 7: verify progress indicator', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Step 1: only step 1 is active, none completed.
  // toHaveClass(/regex/) checks that the element's class attribute matches the regex.
  await expect(page.getByTestId('progress-step-1')).toHaveClass(/active/);
  await expect(page.getByTestId('progress-step-2')).not.toHaveClass(/active|completed/);

  // Move to step 2.
  await page.getByTestId('btn-start').click();

  // Step 2: step 1 is completed, step 2 is active.
  await expect(page.getByTestId('progress-step-1')).toHaveClass(/completed/);
  await expect(page.getByTestId('progress-step-2')).toHaveClass(/active/);
  await expect(page.getByTestId('progress-step-3')).not.toHaveClass(/active|completed/);

  // Move to step 3.
  await fillPersonalInfo(page, DEFAULT_DATA);
  await page.getByTestId('btn-next-personal').click();

  // Step 3: steps 1-2 completed, step 3 active.
  await expect(page.getByTestId('progress-step-1')).toHaveClass(/completed/);
  await expect(page.getByTestId('progress-step-2')).toHaveClass(/completed/);
  await expect(page.getByTestId('progress-step-3')).toHaveClass(/active/);

  // Move to step 4.
  await uploadDocument(page);
  await page.getByTestId('btn-next-document').click();

  // Step 4: steps 1-3 completed, step 4 active.
  await expect(page.getByTestId('progress-step-3')).toHaveClass(/completed/);
  await expect(page.getByTestId('progress-step-4')).toHaveClass(/active/);
});

// --------------------------------------------------------------------------
// Exercise 8: Test With Different Applicant Data
// --------------------------------------------------------------------------
// Run the flow with different data sets and verify the review page.
// Also test the failure scenario by using an email containing "fail".
test('exercise 8: test with different applicant data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Data set 1: normal flow with success.
  const data1 = {
    firstName: 'Alice', lastName: 'Smith',
    email: 'alice@example.com', dob: '1985-12-01', country: 'UK'
  };

  await page.getByTestId('btn-start').click();
  await fillPersonalInfo(page, data1);
  await page.getByTestId('btn-next-personal').click();
  await uploadDocument(page, 'drivers-license', 'license.jpg');
  await page.getByTestId('btn-next-document').click();

  // Verify review shows Alice's data.
  await expect(page.getByTestId('review-first-name')).toHaveText('Alice');
  await expect(page.getByTestId('review-last-name')).toHaveText('Smith');
  await expect(page.getByTestId('review-country')).toHaveText('United Kingdom');
  await expect(page.getByTestId('review-doc-type')).toHaveText("Driver's License");

  // Now reload and test a failure scenario.
  await page.goto(PLAYGROUND);

  const data2 = {
    firstName: 'Bob', lastName: 'Fail',
    email: 'bob@fail.com', dob: '2000-01-01', country: 'DE'
  };

  await page.getByTestId('btn-start').click();
  await fillPersonalInfo(page, data2);
  await page.getByTestId('btn-next-personal').click();
  await uploadDocument(page, 'national-id', 'id-card.png');
  await page.getByTestId('btn-next-document').click();
  await page.getByTestId('btn-submit').click();

  // Verify the failure result page.
  await expect(page.getByTestId('step-result')).toBeVisible({ timeout: 3000 });
  await expect(page.getByTestId('result-title')).toHaveText('Verification Failed');
  await expect(page.getByTestId('result-message')).toContainText('could not verify');
});
