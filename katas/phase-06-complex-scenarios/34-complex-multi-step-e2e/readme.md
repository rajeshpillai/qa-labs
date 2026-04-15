# Kata 34: Complex Multi-Step E2E

## What You Will Learn

- How to test a full end-to-end onboarding flow spanning 6 steps
- How to verify step-by-step unlocking and progression
- How to ensure data carries through multiple form steps
- How to handle simulated async operations (video verification, background checks)
- How to test that users cannot skip steps
- How to verify a final summary page aggregates all entered data

## Prerequisites

- Completed Katas 01-33
- Understanding of form interactions, file uploads, and async waits

## Concepts Explained

### Multi-Step Wizards

```
A multi-step wizard guides users through a sequence of forms/views.
Each step must be completed before the next unlocks:

  Register  -->  KYC  -->  Document  -->  Video  -->  Background  -->  Approval
     1           2           3             4            5               6

The tracker at the top shows:
  - completed steps (green)
  - the current active step (blue)
  - locked future steps (grey)
```

### Testing Long Flows

```
Long E2E flows require:
  1. Helper functions to avoid repetition (e.g., completeStep1, completeStep2)
  2. Patience with async steps (video verification, background checks)
  3. Assertions at each step boundary to catch regressions early
  4. Data validation at the final summary to ensure nothing was lost
```

### Playwright: File Upload

```typescript
// PLAYWRIGHT
// setInputFiles(path) sets a file on an <input type="file"> element.
// The file does not need to exist physically — Playwright creates it.
await page.getByTestId('file-input').setInputFiles({
  name: 'id-card.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('fake file content'),
});
```

### Cypress: File Upload

```typescript
// CYPRESS
// selectFile(fileOrFixture) sets a file on a file input.
cy.get('[data-testid="file-input"]').selectFile({
  contents: Cypress.Buffer.from('fake content'),
  fileName: 'id-card.pdf',
  mimeType: 'application/pdf',
});
```

## Playground Overview

A 6-step onboarding wizard:

1. **Register** — Email, password, full name
2. **KYC** — Date of birth, nationality, address, phone
3. **Document Upload** — Upload a government ID
4. **Video Verification** — Simulated 2-second camera check
5. **Background Check** — Simulated progress bar (4 stages)
6. **Final Approval** — Success view with data summary

A status tracker at the top shows completed, active, and locked steps.

## Exercises

1. **Complete full happy path** — Walk through all 6 steps and verify the final success view
2. **Verify step unlocking** — Check that completing a step unlocks the next one
3. **Verify cannot skip steps** — Ensure step 3 is locked when only step 1 is done
4. **Partial completion and resume** — Complete steps 1-2, verify step 3 is active
5. **Verify data carries through steps** — Enter data in step 1, verify it appears in the final summary
6. **Error at one step doesn't lose data** — Submit step 2 with missing fields, fix and continue
7. **Verify final success state** — Check the success icon, title, and message on step 6
8. **Test with different data sets** — Run the flow with different user data and verify the summary
