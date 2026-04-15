import { test, expect } from '@playwright/test';

// Base URL for the playground page.
const PLAYGROUND = '/phase-06-complex-scenarios/34-complex-multi-step-e2e/playground/';

// Default test data used across exercises.
const DEFAULT_DATA = {
  email: 'jane@example.com',
  password: 'secret123',
  name: 'Jane Doe',
  dob: '1990-05-15',
  nationality: 'US',
  address: '123 Main St, Springfield',
  phone: '+1 555-0123',
  fileName: 'passport.pdf',
};

// --------------------------------------------------------------------------
// Helpers: Complete individual steps to avoid repetition in tests.
// Each helper fills the required fields and clicks the submit button.
// --------------------------------------------------------------------------

// Step 1: Register — fill email, password, name, then click submit.
async function completeRegister(page: import('@playwright/test').Page, data = DEFAULT_DATA) {
  await page.getByTestId('reg-email').fill(data.email);
  await page.getByTestId('reg-password').fill(data.password);
  await page.getByTestId('reg-name').fill(data.name);
  await page.getByTestId('register-submit').click();
}

// Step 2: KYC — fill personal details, then click submit.
async function completeKyc(page: import('@playwright/test').Page, data = DEFAULT_DATA) {
  await page.getByTestId('kyc-dob').fill(data.dob);
  await page.getByTestId('kyc-nationality').selectOption(data.nationality);
  await page.getByTestId('kyc-address').fill(data.address);
  await page.getByTestId('kyc-phone').fill(data.phone);
  await page.getByTestId('kyc-submit').click();
}

// Step 3: Document Upload — upload a fake file, then click submit.
async function completeDocument(page: import('@playwright/test').Page, data = DEFAULT_DATA) {
  // setInputFiles creates a synthetic file without needing a real file.
  // The buffer contains fake content — only the name matters for our test.
  await page.getByTestId('file-input').setInputFiles({
    name: data.fileName,
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake pdf content'),
  });
  await page.getByTestId('document-submit').click();
}

// Step 4: Video Verification — start verification, wait for completion.
async function completeVideo(page: import('@playwright/test').Page) {
  await page.getByTestId('start-video-btn').click();
  // Wait for the verification to finish (2 seconds simulated delay).
  // We wait for the "Continue" button to appear instead of sleeping.
  await expect(page.getByTestId('video-submit')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('video-submit').click();
}

// Step 5: Background Check — start check, wait for completion.
async function completeBackground(page: import('@playwright/test').Page) {
  await page.getByTestId('start-bg-check').click();
  // Wait for the background check to finish (4 stages at 500ms each).
  // We wait for the "Continue" button to appear.
  await expect(page.getByTestId('bg-submit')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('bg-submit').click();
}

// --------------------------------------------------------------------------
// Exercise 1: Complete Full Happy Path
// --------------------------------------------------------------------------
// Walks through all 6 steps and verifies the final success view.
test('exercise 1: complete full happy path', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Step 1: Register
  await completeRegister(page);
  await expect(page.getByTestId('step-kyc')).toBeVisible();

  // Step 2: KYC
  await completeKyc(page);
  await expect(page.getByTestId('step-document')).toBeVisible();

  // Step 3: Document Upload
  await completeDocument(page);
  await expect(page.getByTestId('step-video')).toBeVisible();

  // Step 4: Video Verification
  await completeVideo(page);
  await expect(page.getByTestId('step-background')).toBeVisible();

  // Step 5: Background Check
  await completeBackground(page);

  // Step 6: Verify final success view.
  await expect(page.getByTestId('step-approval')).toBeVisible();
  await expect(page.getByTestId('success-title')).toHaveText('Onboarding Complete!');
  await expect(page.getByTestId('summary-name')).toHaveText(DEFAULT_DATA.name);
  await expect(page.getByTestId('summary-email')).toHaveText(DEFAULT_DATA.email);
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Step Unlocking
// --------------------------------------------------------------------------
// Checks that the tracker updates correctly as steps are completed.
test('exercise 2: verify step unlocking', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initially, only step 1 is active; step 2 is locked.
  await expect(page.getByTestId('tracker-register')).toHaveClass(/active/);
  await expect(page.getByTestId('tracker-kyc')).toHaveClass(/locked/);

  // Complete step 1.
  await completeRegister(page);

  // Now step 1 should be completed, step 2 should be active.
  // toHaveClass(regex) checks if the element's class attribute matches
  // the given regular expression.
  await expect(page.getByTestId('tracker-register')).toHaveClass(/completed/);
  await expect(page.getByTestId('tracker-kyc')).toHaveClass(/active/);
  await expect(page.getByTestId('tracker-document')).toHaveClass(/locked/);
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Cannot Skip Steps
// --------------------------------------------------------------------------
// After completing only step 1, verifies that step 3+ panels are hidden.
test('exercise 3: verify cannot skip steps', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Complete only step 1 (Register).
  await completeRegister(page);

  // Step 2 (KYC) should be visible (it's the current step).
  await expect(page.getByTestId('step-kyc')).toBeVisible();

  // Steps 3-6 should be hidden (cannot skip to them).
  // toBeHidden() checks that the element is not visible or not in the DOM.
  await expect(page.getByTestId('step-document')).toBeHidden();
  await expect(page.getByTestId('step-video')).toBeHidden();
  await expect(page.getByTestId('step-background')).toBeHidden();
  await expect(page.getByTestId('step-approval')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 4: Partial Completion and Resume
// --------------------------------------------------------------------------
// Completes steps 1-2, then verifies step 3 is active and ready.
test('exercise 4: partial completion and resume', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Complete steps 1 and 2.
  await completeRegister(page);
  await completeKyc(page);

  // Verify step 3 (Document Upload) is now active.
  await expect(page.getByTestId('step-document')).toBeVisible();
  await expect(page.getByTestId('tracker-document')).toHaveClass(/active/);

  // Verify steps 1-2 are marked completed in the tracker.
  await expect(page.getByTestId('tracker-register')).toHaveClass(/completed/);
  await expect(page.getByTestId('tracker-kyc')).toHaveClass(/completed/);
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Data Carries Through Steps
// --------------------------------------------------------------------------
// Enters data in steps 1-2 and verifies it appears in the final summary.
test('exercise 5: verify data carries through steps', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Complete all steps with default data.
  await completeRegister(page);
  await completeKyc(page);
  await completeDocument(page);
  await completeVideo(page);
  await completeBackground(page);

  // Verify the final summary shows the data entered in earlier steps.
  await expect(page.getByTestId('summary-name')).toHaveText(DEFAULT_DATA.name);
  await expect(page.getByTestId('summary-email')).toHaveText(DEFAULT_DATA.email);
  await expect(page.getByTestId('summary-nationality')).toHaveText(DEFAULT_DATA.nationality);
  await expect(page.getByTestId('summary-document')).toHaveText(DEFAULT_DATA.fileName);
  await expect(page.getByTestId('summary-video')).toHaveText('Yes');
  await expect(page.getByTestId('summary-background')).toHaveText('Passed');
});

// --------------------------------------------------------------------------
// Exercise 6: Error at One Step Doesn't Lose Data
// --------------------------------------------------------------------------
// Attempts to submit step 2 with missing fields, fixes the error, and
// continues without losing data from step 1.
test('exercise 6: error at one step does not lose data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Complete step 1 with data.
  await completeRegister(page);

  // Try to submit step 2 without filling all fields (only fill DOB).
  await page.getByTestId('kyc-dob').fill('1990-05-15');
  await page.getByTestId('kyc-submit').click();

  // Verify the error message is shown.
  await expect(page.getByTestId('kyc-error')).toBeVisible();

  // Now fill in the remaining fields and submit again.
  await page.getByTestId('kyc-nationality').selectOption('US');
  await page.getByTestId('kyc-address').fill('123 Main St');
  await page.getByTestId('kyc-phone').fill('+1 555-0123');
  await page.getByTestId('kyc-submit').click();

  // Verify we advanced to step 3 (the error didn't break the flow).
  await expect(page.getByTestId('step-document')).toBeVisible();

  // Complete remaining steps and verify step 1 data is still in the summary.
  await completeDocument(page);
  await completeVideo(page);
  await completeBackground(page);
  await expect(page.getByTestId('summary-name')).toHaveText(DEFAULT_DATA.name);
  await expect(page.getByTestId('summary-email')).toHaveText(DEFAULT_DATA.email);
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Final Success State
// --------------------------------------------------------------------------
// Completes all steps and verifies every element in the success view.
test('exercise 7: verify final success state', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Complete all steps.
  await completeRegister(page);
  await completeKyc(page);
  await completeDocument(page);
  await completeVideo(page);
  await completeBackground(page);

  // Verify the success view elements.
  await expect(page.getByTestId('success-view')).toBeVisible();
  await expect(page.getByTestId('success-icon')).toBeVisible();
  await expect(page.getByTestId('success-title')).toHaveText('Onboarding Complete!');
  await expect(page.getByTestId('success-message')).toContainText('verified and approved');

  // Verify the summary table exists and has content.
  await expect(page.getByTestId('summary-table')).toBeVisible();

  // Verify all tracker steps are completed or active (the last step is active).
  await expect(page.getByTestId('tracker-register')).toHaveClass(/completed/);
  await expect(page.getByTestId('tracker-kyc')).toHaveClass(/completed/);
  await expect(page.getByTestId('tracker-document')).toHaveClass(/completed/);
  await expect(page.getByTestId('tracker-video')).toHaveClass(/completed/);
  await expect(page.getByTestId('tracker-background')).toHaveClass(/completed/);
  await expect(page.getByTestId('tracker-approval')).toHaveClass(/active/);
});

// --------------------------------------------------------------------------
// Exercise 8: Test with Different Data Sets
// --------------------------------------------------------------------------
// Runs the flow with alternate user data and verifies the summary.
test('exercise 8: test with different data sets', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const altData = {
    email: 'alex@company.org',
    password: 'p@ssw0rd',
    name: 'Alex Rivera',
    dob: '1985-11-20',
    nationality: 'DE',
    address: 'Berliner Str 42, Berlin',
    phone: '+49 30 1234567',
    fileName: 'drivers-license.jpg',
  };

  // Complete all steps with alternate data.
  await completeRegister(page, altData);
  await completeKyc(page, altData);
  await completeDocument(page, altData);
  await completeVideo(page);
  await completeBackground(page);

  // Verify the summary shows the alternate data, not the defaults.
  await expect(page.getByTestId('summary-name')).toHaveText('Alex Rivera');
  await expect(page.getByTestId('summary-email')).toHaveText('alex@company.org');
  await expect(page.getByTestId('summary-nationality')).toHaveText('DE');
  await expect(page.getByTestId('summary-document')).toHaveText('drivers-license.jpg');
});
