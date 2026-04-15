# Kata 28: Document Verification

## What You Will Learn

- How to test document upload and processing workflows
- How to wait for asynchronous processing to complete (spinners, loading states)
- How to verify extracted/auto-filled data from simulated OCR
- How to test edit-and-confirm flows on extracted data
- How to verify status transitions across multiple phases
- How to test error states and retry flows
- How to simulate invalid documents and verify failure handling

## Prerequisites

- Completed Katas 1-27
- Understanding of file upload testing from Kata 26
- Familiarity with async state transitions (loading, success, error)

## Concepts Explained

### Document Verification Workflow

```
In fintech, document verification typically follows this pattern:

1. UPLOAD — User selects a document type and uploads an image/PDF
2. PROCESSING — OCR (Optical Character Recognition) extracts text
3. REVIEW — Extracted fields are shown for user review/correction
4. CONFIRMED — User confirms the data is correct

Each state has its own UI: upload form, spinner, extracted fields
form, and confirmation message. Tests must verify each transition.
```

### Waiting for Async Processing

```
The OCR processing step takes time (simulated with a 2-second delay).
Tests must wait for the spinner to disappear and the results to appear.

Playwright:
  // toBeVisible() retries until the element appears in the DOM.
  // Use a generous timeout since processing takes 2 seconds.
  await expect(page.getByTestId('extracted-fields')).toBeVisible({ timeout: 5000 });

Cypress:
  // .should('be.visible') retries until the assertion passes.
  cy.get('[data-testid="extracted-fields"]', { timeout: 5000 })
    .should('be.visible');

Both frameworks automatically retry the assertion until the
timeout expires, so you don't need explicit sleep/wait calls.
```

### Testing Editable Extracted Fields

```
After OCR, extracted fields are pre-filled but editable.
Tests should:
  1. Verify the auto-filled values are correct
  2. Clear a field and type a new value
  3. Confirm and verify the new value is accepted

This tests a common fintech pattern where OCR may produce
imperfect results that users need to correct.
```

## Playground

The playground simulates a document upload + OCR verification flow:

1. **Upload Section** — document type selector, file upload area, and "Process Document" button
2. **Processing Spinner** — animated spinner with "Extracting text via OCR..." message shown during the 2-second simulated processing delay
3. **Extracted Fields** — five auto-filled fields (name, DOB, ID number, address, expiry) with a "Confirm Verification" button
4. **Confirmed Section** — success message after confirmation
5. **Error Banner** — shown when an "invalid" document is uploaded (filename contains "invalid"), with a "Try Again" button

Status transitions are tracked via:
- A status badge (Upload / Processing / Review / Confirmed / Failed)
- Step pills (Upload, Processing, Review, Confirmed) that show completed/active states

OCR results vary by document type (passport, driver's license, national ID) for realistic testing.

## Exercises

### Exercise 1: Upload and Verify Processing Starts
Select a document type, upload a file, click "Process Document". Verify the spinner appears and the status changes to "Processing".

### Exercise 2: Wait for OCR Results
Upload and process a document. Wait for the spinner to disappear and the extracted fields to appear. Verify the status changes to "Review".

### Exercise 3: Verify Extracted Fields
Process a passport document and verify all five extracted fields contain the expected OCR values (name, DOB, ID number, address, expiry).

### Exercise 4: Edit Extracted Field
After OCR extraction, clear the name field and type a new name. Confirm and verify the flow completes (the edit is accepted).

### Exercise 5: Confirm Verification
Complete the upload, processing, and review steps. Click "Confirm Verification" and verify the confirmed section appears with the success message.

### Exercise 6: Verify Status Transitions
Walk through the entire flow and verify the status badge text and step pills change correctly at each phase: Upload -> Processing -> Review -> Confirmed.

### Exercise 7: Test With Invalid Document
Upload a file whose name contains "invalid". Process it and verify the error banner appears with the failure message and the status shows "Failed".

### Exercise 8: Retry After Failure
Upload an invalid document, process it (triggers error), then click "Try Again". Verify the page resets to the upload state. Upload a valid document and verify it processes successfully.

## Solutions

### Playwright Solution

See `playwright/document-verification.spec.ts`

### Cypress Solution

See `cypress/document-verification.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Not waiting for processing to complete | The OCR simulation takes 2 seconds; asserting on extracted fields too early will fail | Wait for `extracted-fields` to be visible with `timeout: 5000` |
| Asserting on the spinner after it disappears | The spinner is hidden after processing; checking it will fail | Assert the spinner is visible during processing, then wait for extracted fields |
| Forgetting to select a document type | The OCR results depend on the document type selection | Always select a document type before processing |
| Using the wrong filename for failure testing | Only filenames containing "invalid" trigger the failure path | Use a filename like "invalid-doc.pdf" to trigger errors |
| Not resetting between retry tests | The retry resets the file input; you must re-upload | After clicking "Try Again", re-select document type and re-upload |

## Quick Reference

### Playwright Document Verification

| Action | Method | Example |
|--------|--------|---------|
| Upload file | `setInputFiles()` | `await page.getByTestId('file-input').setInputFiles(...)` |
| Wait for spinner | `toBeVisible()` | `await expect(spinner).toBeVisible()` |
| Wait for results | `toBeVisible()` | `await expect(fields).toBeVisible({ timeout: 5000 })` |
| Check field value | `toHaveValue()` | `await expect(input).toHaveValue('Jane Doe')` |
| Edit field | `fill()` | `await input.fill('New Name')` |
| Check status | `toHaveText()` | `await expect(badge).toHaveText('Review')` |

### Cypress Document Verification

| Action | Method | Example |
|--------|--------|---------|
| Upload file | `selectFile()` | `cy.get(input).selectFile(...)` |
| Wait for spinner | `.should('be.visible')` | `cy.get(spinner).should('be.visible')` |
| Wait for results | `.should('be.visible')` | `cy.get(fields, { timeout: 5000 }).should('be.visible')` |
| Check field value | `.should('have.value')` | `cy.get(input).should('have.value', 'Jane Doe')` |
| Edit field | `.clear().type()` | `cy.get(input).clear().type('New Name')` |
| Check status | `.should('have.text')` | `cy.get(badge).should('have.text', 'Review')` |
