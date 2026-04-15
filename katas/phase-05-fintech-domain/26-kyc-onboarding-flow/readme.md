# Kata 26: KYC Onboarding Flow

## What You Will Learn

- How to test multi-step wizard/onboarding flows end-to-end
- How to verify progress indicators update correctly per step
- How to navigate back and forth between steps without losing data
- How to simulate file uploads in Playwright and Cypress
- How to verify review/summary pages reflect previously entered data
- How to validate required fields at each step before advancing
- How to test both success and failure outcomes of a form submission

## Prerequisites

- Completed Katas 1-25 (especially form and navigation katas)
- Understanding of multi-step form patterns
- Familiarity with file input handling in browser tests

## Concepts Explained

### Multi-Step Onboarding Flows

```
KYC (Know Your Customer) onboarding is a common fintech pattern
where users complete identity verification in a guided, multi-step flow.

Typical steps:
  1. Welcome / introduction page
  2. Personal information form (name, email, DOB, country)
  3. Document upload (passport, driver's license, etc.)
  4. Review summary — user confirms all entered data
  5. Submission result — success or failure

Testing challenges:
  - Each step has its own validation rules
  - Data entered in step 2 must appear correctly in step 4
  - Navigation backward should preserve previously entered data
  - Progress indicators must reflect the current step
  - The final submission may succeed or fail
```

### Simulating File Uploads

```
Playwright:
  // setInputFiles() sets files on a file input element.
  // This simulates the user selecting a file in the file picker dialog.
  await page.getByTestId('file-input').setInputFiles({
    name: 'passport.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake-pdf-content')
  });

Cypress:
  // selectFile() is a Cypress command that simulates file selection.
  // It creates a File object and triggers the change event on the input.
  cy.get('[data-testid="file-input"]').selectFile({
    contents: Cypress.Buffer.from('fake-pdf-content'),
    fileName: 'passport.pdf',
    mimeType: 'application/pdf'
  }, { force: true });
```

### Testing Data Flow Across Steps

```
A key testing concern in multi-step flows: does data entered in
earlier steps appear correctly on the review page?

Pattern:
  1. Fill in fields on step 2 with known values
  2. Proceed to step 3 (document upload)
  3. Proceed to step 4 (review)
  4. Assert that each review field matches what was entered

This catches bugs where:
  - Field values are not carried forward
  - Field values are swapped or truncated
  - Select dropdown shows the value code instead of the display text
```

## Playground

The playground is a complete KYC onboarding application with five steps:

1. **Welcome** — introduction page with a "Get Started" button
2. **Personal Info** — form with first name, last name, email, DOB, country
3. **Document Upload** — document type selector and file upload area
4. **Review** — summary table showing all entered data
5. **Result** — success or failure message after submission

Features:
- Progress bar with 5 numbered steps (completed / active / pending states)
- Validation errors shown per step when required fields are empty
- Upload area that shows the selected filename
- Review table that auto-populates from entered data
- Success result with random reference number
- Failure result triggered by email containing "fail"

## Exercises

### Exercise 1: Complete Happy Path End-to-End
Walk through all 5 steps: click Get Started, fill personal info, upload a document, review, and submit. Verify the success result page appears.

### Exercise 2: Verify Each Step Content
Navigate through each step and verify its heading and key content elements are visible.

### Exercise 3: Navigate Back and Forth
Go to step 2, fill data, go to step 3, then navigate back to step 2. Verify the previously entered data is still present.

### Exercise 4: Verify Review Page Data
Fill in personal info and upload a document, then verify the review page shows every field value correctly.

### Exercise 5: Submit and Verify Success
Complete the flow and verify the success icon, title, message, and reference number appear.

### Exercise 6: Validate Required Fields Per Step
Try to advance from step 2 without filling fields. Verify validation errors appear. Try to advance from step 3 without uploading. Verify the upload error appears.

### Exercise 7: Verify Progress Indicator
At each step, verify the progress bar highlights the correct step as "active" and marks previous steps as "completed".

### Exercise 8: Test With Different Applicant Data
Run the flow twice with different data sets (different names, emails, countries). Verify the review page reflects each data set correctly. Use an email containing "fail" to trigger the failure result.

## Solutions

### Playwright Solution

See `playwright/kyc-onboarding-flow.spec.ts`

### Cypress Solution

See `cypress/kyc-onboarding-flow.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Not waiting for step transition | Steps change via CSS class toggle; asserting too early may target the wrong step | Wait for the target step's `data-testid` to be visible |
| Using `fill()` on a hidden file input | The file input is hidden; `fill()` doesn't work for file inputs | Use `setInputFiles()` (Playwright) or `selectFile()` (Cypress) |
| Checking review data before navigating to step 4 | Review table is populated only when step 4 becomes active | Navigate to step 4 first, then assert review values |
| Not resetting state between tests | Each test should start fresh; leftover data from a previous test can cause false passes | Navigate to the playground URL at the start of each test |
| Forgetting the submit delay | Submission has a 1-second simulated delay | Wait for the result step to be visible before asserting |

## Quick Reference

### Playwright Multi-Step Flow Testing

| Action | Method | Example |
|--------|--------|---------|
| Click button | `locator.click()` | `await page.getByTestId('btn-start').click()` |
| Fill input | `locator.fill()` | `await page.getByTestId('input-first-name').fill('John')` |
| Select option | `locator.selectOption()` | `await page.getByTestId('select-country').selectOption('US')` |
| Upload file | `locator.setInputFiles()` | `await page.getByTestId('file-input').setInputFiles(...)` |
| Check visibility | `expect(locator).toBeVisible()` | `await expect(page.getByTestId('step-review')).toBeVisible()` |
| Check text | `expect(locator).toHaveText()` | `await expect(page.getByTestId('review-email')).toHaveText('a@b.com')` |
| Check class | `expect(locator).toHaveClass()` | `await expect(step).toHaveClass(/active/)` |

### Cypress Multi-Step Flow Testing

| Action | Method | Example |
|--------|--------|---------|
| Click button | `cy.get().click()` | `cy.get('[data-testid="btn-start"]').click()` |
| Fill input | `cy.get().type()` | `cy.get('[data-testid="input-first-name"]').type('John')` |
| Select option | `cy.get().select()` | `cy.get('[data-testid="select-country"]').select('US')` |
| Upload file | `cy.get().selectFile()` | `cy.get('[data-testid="file-input"]').selectFile(...)` |
| Check visibility | `.should('be.visible')` | `cy.get('[data-testid="step-review"]').should('be.visible')` |
| Check text | `.should('have.text')` | `cy.get('[data-testid="review-email"]').should('have.text', 'a@b.com')` |
| Check class | `.should('have.class')` | `cy.get('[data-testid="progress-step-2"]').should('have.class', 'active')` |
