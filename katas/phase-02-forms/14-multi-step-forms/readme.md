# Kata 14: Multi-Step Forms

## What You Will Learn

- How to navigate forward and backward through a multi-step wizard
- How to verify progress indicators update as you move between steps
- How to validate each step before advancing
- How to verify a review page displays all previously entered data
- How to complete a full end-to-end wizard flow

## Prerequisites

- Completed Kata 13 (Form Validation)
- Understanding of form interactions (fill, select, click)

## Concepts Explained

### Navigating Between Steps

```typescript
// PLAYWRIGHT
// Click the "Next" button on step 1 to go to step 2.
// The wizard hides step 1 and shows step 2 by toggling CSS classes.
await page.getByTestId('btn-next-1').click();

// Click "Back" on step 2 to return to step 1.
await page.getByTestId('btn-back-2').click();

// CYPRESS
cy.get('[data-testid="btn-next-1"]').click();
cy.get('[data-testid="btn-back-2"]').click();
```

### Checking Which Step Is Active

```typescript
// PLAYWRIGHT
// Each step has a data-testid like "step-1", "step-2", etc.
// The active step has the CSS class "active" which sets display:block.
// Hidden steps have display:none, so toBeVisible() fails for them.
await expect(page.getByTestId('step-2')).toBeVisible();
await expect(page.getByTestId('step-1')).toBeHidden();

// CYPRESS
cy.get('[data-testid="step-2"]').should('be.visible');
cy.get('[data-testid="step-1"]').should('not.be.visible');
```

### Checking Progress Indicator State

```typescript
// PLAYWRIGHT
// Each indicator has classes: "active" (current step, blue),
// "completed" (previous steps, green), or neither (future steps, grey).
await expect(page.getByTestId('indicator-1')).toHaveClass(/completed/);
await expect(page.getByTestId('indicator-2')).toHaveClass(/active/);

// CYPRESS
cy.get('[data-testid="indicator-1"]').should('have.class', 'completed');
cy.get('[data-testid="indicator-2"]').should('have.class', 'active');
```

### Verifying Review Page Data

```typescript
// PLAYWRIGHT
// The review page shows each field value in a span with a testid
// like "review-fullName", "review-email", etc.
await expect(page.getByTestId('review-fullName')).toHaveText('Aisha Patel');

// CYPRESS
cy.get('[data-testid="review-fullName"]').should('have.text', 'Aisha Patel');
```

## Playground

The playground is a 4-step KYC wizard. It contains:

1. **Step 1: Personal Information** — Full Name, Email, Phone (all required).
2. **Step 2: Address Details** — Street Address, City, Country dropdown, Postal Code (all required).
3. **Step 3: Employment Information** — Employment Status dropdown, Employer Name, Income Range dropdown (all required).
4. **Step 4: Review & Submit** — Displays all entered data in read-only format with a Submit button.
5. **Progress Bar** — Four numbered circles at the top. The current step is blue ("active"), completed steps are green ("completed"), future steps are grey.
6. **Back/Next Buttons** — Step 1 has only "Next". Steps 2-3 have "Back" and "Next". Step 4 has "Back" and "Submit".
7. **Per-step Validation** — Clicking "Next" validates the current step's required fields. If any are empty, error messages appear and the wizard does not advance.

## Exercises

### Exercise 1: Navigate Forward Through Steps
Fill step 1 with valid data and click Next. Verify step 2 is visible and step 1 is hidden.

### Exercise 2: Navigate Back to Previous Step
From step 2, click Back. Verify step 1 is visible again and your previously entered data is still there.

### Exercise 3: Verify Progress Indicator Updates
Navigate from step 1 to step 2. Verify indicator 1 shows "completed" (green) and indicator 2 shows "active" (blue).

### Exercise 4: Validate Step 1 Prevents Advancing When Empty
Click Next on step 1 without filling fields. Verify error messages appear and you remain on step 1.

### Exercise 5: Complete the Full 4-Step Flow
Fill all steps with valid data and navigate to the review page. Verify you reach step 4.

### Exercise 6: Verify Review Page Shows All Entered Data
Complete all steps and verify the review page displays the exact values you entered for each field.

### Exercise 7: Submit from the Review Page
Complete all steps, reach the review page, and click "Submit Application". Verify the success message appears.

### Exercise 8: Step Validation Prevents Advancing (Step 2)
Navigate to step 2 and click Next without filling address fields. Verify errors appear and you stay on step 2.

## Solutions

### Playwright Solution

See `playwright/multi-step-forms.spec.ts`

### Cypress Solution

See `cypress/multi-step-forms.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Forgetting to fill the current step before clicking Next | Validation blocks advancement if required fields are empty | Fill all required fields in the current step first |
| Checking for step visibility before the transition completes | The DOM may not have updated yet | Playwright and Cypress auto-wait, but ensure you click the button first |
| Verifying review data before reaching step 4 | Review data is populated only when step 4 becomes active | Navigate to step 4 first, then check review values |
| Using the wrong indicator testid | indicator-1 through indicator-4 correspond to steps 1-4 | Match the indicator number to the step number |
| Not checking that Back preserves data | Navigating back should keep previously entered values | After going back, verify input values are still populated |

## Quick Reference

### Wizard Navigation

| Action | Playwright | Cypress |
|--------|-----------|---------|
| Go to next step | `await page.getByTestId('btn-next-N').click()` | `cy.get('[data-testid="btn-next-N"]').click()` |
| Go to previous step | `await page.getByTestId('btn-back-N').click()` | `cy.get('[data-testid="btn-back-N"]').click()` |
| Verify step visible | `await expect(page.getByTestId('step-N')).toBeVisible()` | `cy.get('[data-testid="step-N"]').should('be.visible')` |
| Verify indicator active | `await expect(ind).toHaveClass(/active/)` | `cy.get(ind).should('have.class', 'active')` |
| Verify indicator done | `await expect(ind).toHaveClass(/completed/)` | `cy.get(ind).should('have.class', 'completed')` |
| Submit application | `await page.getByTestId('btn-submit').click()` | `cy.get('[data-testid="btn-submit"]').click()` |
