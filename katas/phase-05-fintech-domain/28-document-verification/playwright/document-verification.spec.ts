import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-05-fintech-domain/28-document-verification/playground/';

// ─── Helper: uploadFile ──────────────────────────────────────────────
// Selects a document type and uploads a simulated file.
// setInputFiles() creates a synthetic file without needing a real file on disk.
// The buffer parameter provides fake content for the file.
async function uploadFile(page: any, docType: string = 'passport', fileName: string = 'passport.pdf') {
  await page.getByTestId('select-doc-type').selectOption(docType);
  await page.getByTestId('file-input').setInputFiles({
    name: fileName,
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake-content')
  });
}

// ─── Helper: uploadAndProcess ────────────────────────────────────────
// Uploads a file and clicks the Process button. Optionally waits for
// the extracted fields to appear (indicating processing is complete).
async function uploadAndProcess(page: any, docType: string = 'passport', fileName: string = 'passport.pdf', waitForResults: boolean = true) {
  await uploadFile(page, docType, fileName);
  await page.getByTestId('btn-process').click();
  if (waitForResults) {
    // Wait for the extracted fields section to become visible.
    // The processing takes 2 seconds, so we allow up to 5 seconds.
    await expect(page.getByTestId('extracted-fields')).toBeVisible({ timeout: 5000 });
  }
}

// --------------------------------------------------------------------------
// Exercise 1: Upload and Verify Processing Starts
// --------------------------------------------------------------------------
// Upload a file, click Process, verify the spinner and status change.
test('exercise 1: upload and verify processing starts', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial status is "Upload".
  await expect(page.getByTestId('current-status')).toHaveText('Upload');

  // Upload a file.
  await uploadFile(page);

  // Verify the upload area shows the file is selected.
  await expect(page.getByTestId('upload-filename')).toHaveText('passport.pdf');
  await expect(page.getByTestId('upload-area')).toHaveClass(/has-file/);

  // Click "Process Document".
  await page.getByTestId('btn-process').click();

  // Verify the spinner is visible.
  // toBeVisible() checks the element is displayed in the viewport.
  await expect(page.getByTestId('processing-spinner')).toBeVisible();
  await expect(page.getByTestId('processing-text')).toHaveText('Extracting text via OCR...');

  // Verify status changed to "Processing".
  await expect(page.getByTestId('current-status')).toHaveText('Processing');
});

// --------------------------------------------------------------------------
// Exercise 2: Wait for OCR Results
// --------------------------------------------------------------------------
// Upload, process, wait for the spinner to disappear and results to appear.
test('exercise 2: wait for OCR results', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Upload and start processing.
  await uploadFile(page);
  await page.getByTestId('btn-process').click();

  // Verify spinner is visible during processing.
  await expect(page.getByTestId('processing-spinner')).toBeVisible();

  // Wait for the extracted fields to appear (processing complete).
  // toBeVisible() with timeout will retry until the element appears.
  await expect(page.getByTestId('extracted-fields')).toBeVisible({ timeout: 5000 });

  // Verify the spinner is now hidden.
  await expect(page.getByTestId('processing-spinner')).toBeHidden();

  // Verify status is now "Review".
  await expect(page.getByTestId('current-status')).toHaveText('Review');
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Extracted Fields
// --------------------------------------------------------------------------
// Process a passport and verify all OCR-extracted field values.
test('exercise 3: verify extracted fields', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await uploadAndProcess(page, 'passport');

  // Verify each extracted field contains the expected OCR value.
  // toHaveValue(value) checks the input element's current value.
  await expect(page.getByTestId('extracted-name')).toHaveValue('Jane Alice Doe');
  await expect(page.getByTestId('extracted-dob')).toHaveValue('15-Mar-1990');
  await expect(page.getByTestId('extracted-id-number')).toHaveValue('P12345678');
  await expect(page.getByTestId('extracted-address')).toHaveValue('123 Main St, New York, NY 10001');
  await expect(page.getByTestId('extracted-expiry')).toHaveValue('15-Mar-2030');
});

// --------------------------------------------------------------------------
// Exercise 4: Edit Extracted Field
// --------------------------------------------------------------------------
// After OCR, edit the name field, then confirm successfully.
test('exercise 4: edit extracted field', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await uploadAndProcess(page, 'passport');

  // Verify the original OCR name.
  await expect(page.getByTestId('extracted-name')).toHaveValue('Jane Alice Doe');

  // Clear the name field and type a corrected name.
  // fill() clears the input first, then types the new value.
  await page.getByTestId('extracted-name').fill('Jane A. Doe-Smith');

  // Verify the field now has the new value.
  await expect(page.getByTestId('extracted-name')).toHaveValue('Jane A. Doe-Smith');

  // Confirm verification — should succeed even with edited fields.
  await page.getByTestId('btn-confirm').click();
  await expect(page.getByTestId('confirmed-section')).toBeVisible();
  await expect(page.getByTestId('current-status')).toHaveText('Confirmed');
});

// --------------------------------------------------------------------------
// Exercise 5: Confirm Verification
// --------------------------------------------------------------------------
// Complete the full flow and verify the confirmation page.
test('exercise 5: confirm verification', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await uploadAndProcess(page, 'drivers-license', 'license.jpg');

  // Click "Confirm Verification".
  await page.getByTestId('btn-confirm').click();

  // Verify the confirmed section is visible with the success message.
  await expect(page.getByTestId('confirmed-section')).toBeVisible();
  await expect(page.getByTestId('confirmed-title')).toHaveText('Document Verified');
  await expect(page.getByTestId('confirmed-message')).toContainText('Verification complete');

  // Verify the status badge shows "Confirmed".
  await expect(page.getByTestId('current-status')).toHaveText('Confirmed');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Status Transitions
// --------------------------------------------------------------------------
// Walk through the entire flow and verify status at each phase.
test('exercise 6: verify status transitions', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Phase 1: Upload — initial state.
  await expect(page.getByTestId('current-status')).toHaveText('Upload');
  await expect(page.getByTestId('step-upload-pill')).toHaveClass(/active/);

  // Upload a file and start processing.
  await uploadFile(page);
  await page.getByTestId('btn-process').click();

  // Phase 2: Processing.
  await expect(page.getByTestId('current-status')).toHaveText('Processing');
  await expect(page.getByTestId('step-processing-pill')).toHaveClass(/active/);
  await expect(page.getByTestId('step-upload-pill')).toHaveClass(/completed/);

  // Phase 3: Review — wait for processing to complete.
  await expect(page.getByTestId('extracted-fields')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('current-status')).toHaveText('Review');
  await expect(page.getByTestId('step-review-pill')).toHaveClass(/active/);
  await expect(page.getByTestId('step-processing-pill')).toHaveClass(/completed/);

  // Phase 4: Confirmed.
  await page.getByTestId('btn-confirm').click();
  await expect(page.getByTestId('current-status')).toHaveText('Confirmed');
  await expect(page.getByTestId('step-confirmed-pill')).toHaveClass(/active/);
  await expect(page.getByTestId('step-review-pill')).toHaveClass(/completed/);
});

// --------------------------------------------------------------------------
// Exercise 7: Test With Invalid Document
// --------------------------------------------------------------------------
// Upload an "invalid" document and verify the error state.
test('exercise 7: test with invalid document', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Upload a file with "invalid" in the name — this triggers the failure path.
  await uploadFile(page, 'passport', 'invalid-blurry-doc.pdf');
  await page.getByTestId('btn-process').click();

  // Wait for the error banner to appear (after 2s processing delay).
  await expect(page.getByTestId('error-banner')).toBeVisible({ timeout: 5000 });

  // Verify the error message text.
  await expect(page.getByTestId('error-message')).toContainText('could not be processed');

  // Verify the status shows "Failed".
  await expect(page.getByTestId('current-status')).toHaveText('Failed');

  // Verify the "Try Again" button is visible.
  await expect(page.getByTestId('btn-retry')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 8: Retry After Failure
// --------------------------------------------------------------------------
// Upload invalid doc, fail, retry, then succeed with a valid document.
test('exercise 8: retry after failure', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First attempt: invalid document.
  await uploadFile(page, 'passport', 'invalid-doc.pdf');
  await page.getByTestId('btn-process').click();
  await expect(page.getByTestId('error-banner')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('current-status')).toHaveText('Failed');

  // Click "Try Again" to reset to upload state.
  await page.getByTestId('btn-retry').click();

  // Verify we're back to the upload state.
  await expect(page.getByTestId('current-status')).toHaveText('Upload');
  await expect(page.getByTestId('upload-section')).toBeVisible();
  await expect(page.getByTestId('error-banner')).toBeHidden();

  // Second attempt: valid document.
  await uploadAndProcess(page, 'national-id', 'valid-id-card.pdf');

  // Verify OCR results appear.
  await expect(page.getByTestId('extracted-name')).toHaveValue('Maria Garcia Lopez');
  await expect(page.getByTestId('current-status')).toHaveText('Review');

  // Confirm verification.
  await page.getByTestId('btn-confirm').click();
  await expect(page.getByTestId('current-status')).toHaveText('Confirmed');
});
