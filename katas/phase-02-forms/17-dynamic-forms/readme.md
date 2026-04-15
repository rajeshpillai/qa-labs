# Kata 17: Dynamic Forms

## What You Will Learn

- How to test forms where fields appear and disappear based on user selections
- How to verify conditional visibility of form sections
- How to add and remove repeated form sections dynamically
- How to test conditional validation (only validating visible fields)
- How to verify form state after toggling options on and off

## Prerequisites

- Completed Katas 13-16
- Understanding of form interactions, selectors, and visibility assertions

## Concepts Explained

### Conditional Visibility Based on Selection

```typescript
// PLAYWRIGHT
// Select "Business" to show business fields.
await page.getByTestId('select-account-type').selectOption('business');
// Verify the business section became visible.
await expect(page.getByTestId('business-section')).toBeVisible();
// Verify individual-only sections are hidden.
await expect(page.getByTestId('joint-section')).toBeHidden();

// CYPRESS
cy.get('[data-testid="select-account-type"]').select('business');
cy.get('[data-testid="business-section"]').should('be.visible');
cy.get('[data-testid="joint-section"]').should('not.be.visible');
```

### Checkbox Toggle

```typescript
// PLAYWRIGHT
// check() checks an unchecked checkbox. uncheck() unchecks it.
await page.getByTestId('checkbox-pep').check();
await expect(page.getByTestId('pep-section')).toBeVisible();

await page.getByTestId('checkbox-pep').uncheck();
await expect(page.getByTestId('pep-section')).toBeHidden();

// CYPRESS
// check() and uncheck() toggle checkboxes.
cy.get('[data-testid="checkbox-pep"]').check();
cy.get('[data-testid="pep-section"]').should('be.visible');

cy.get('[data-testid="checkbox-pep"]').uncheck();
cy.get('[data-testid="pep-section"]').should('not.be.visible');
```

### Adding Dynamic Sections

```typescript
// PLAYWRIGHT
// Click the "Add Beneficiary" button to create a new form section.
await page.getByTestId('btn-add-beneficiary').click();
// Verify the new section appeared. Each beneficiary gets a testid
// like "beneficiary-1", "beneficiary-2", etc.
await expect(page.getByTestId('beneficiary-1')).toBeVisible();
// Verify the count updated.
await expect(page.getByTestId('beneficiary-count')).toHaveText('1');

// CYPRESS
cy.get('[data-testid="btn-add-beneficiary"]').click();
cy.get('[data-testid="beneficiary-1"]').should('be.visible');
cy.get('[data-testid="beneficiary-count"]').should('have.text', '1');
```

### Removing Dynamic Sections

```typescript
// PLAYWRIGHT
// Each beneficiary section has a Remove button.
await page.getByTestId('btn-remove-beneficiary-1').click();
await expect(page.getByTestId('beneficiary-1')).toBeHidden();

// CYPRESS
cy.get('[data-testid="btn-remove-beneficiary-1"]').click();
cy.get('[data-testid="beneficiary-1"]').should('not.exist');
```

## Playground

The playground is a KYC application form where fields dynamically appear and disappear:

1. **Account Type Dropdown** — Options: "Individual" (default), "Business", "Joint Account".
   - **Individual**: No extra sections shown.
   - **Business**: Shows company name, registration number, and business type fields.
   - **Joint Account**: Shows second applicant name, email, and relationship fields.

2. **Primary Applicant Name** — Always visible and required.

3. **Business Section** — Hidden by default. Appears when "Business" is selected. Contains company name (required), registration number (required), and business type dropdown.

4. **Joint Account Section** — Hidden by default. Appears when "Joint Account" is selected. Contains second applicant name (required), email (required), and relationship dropdown.

5. **PEP Checkbox** — "I am a Politically Exposed Person". When checked, shows PEP details section with position (required), country (required), and notes fields.

6. **Beneficiaries** — An "Add Beneficiary" button creates repeated form sections. Each section has a name (required), percentage, relationship dropdown, and a Remove button. The beneficiary count updates.

7. **Conditional Validation** — The submit button validates only the currently visible required fields. Hidden sections are not validated.

## Exercises

### Exercise 1: Select Individual and Verify Business Fields Are Hidden
Select "Individual" account type. Verify the business and joint sections are both hidden.

### Exercise 2: Select Business and Verify Business Fields Appear
Select "Business" account type. Verify the business section is visible with company name and registration number fields.

### Exercise 3: Add a Beneficiary and Verify New Section
Click "Add Beneficiary". Verify a new beneficiary section appears with name, percentage, and relationship fields.

### Exercise 4: Remove a Beneficiary
Add a beneficiary, then click its Remove button. Verify the section disappears and the count decreases.

### Exercise 5: PEP Checkbox Shows Detail Fields
Check the PEP checkbox. Verify the PEP details section appears with position and country fields.

### Exercise 6: Verify Conditional Validation
Select "Business", leave company fields empty, and submit. Verify business-specific errors appear. Switch to "Individual" and submit with just the primary name — verify no business errors appear.

### Exercise 7: Add Multiple Beneficiaries
Click "Add Beneficiary" three times. Verify three sections appear with correct numbering and the count shows 3.

### Exercise 8: Verify Form State After Toggling
Select "Business" and fill company fields. Switch to "Joint Account" — verify business fields hide and joint fields appear. Switch back to "Business" — verify business fields reappear.

## Solutions

### Playwright Solution

See `playwright/dynamic-forms.spec.ts`

### Cypress Solution

See `cypress/dynamic-forms.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Filling fields in a hidden section | Hidden fields may not accept input or may be ignored | Only interact with fields after verifying their section is visible |
| Asserting on hidden elements with `.toHaveValue()` | Hidden elements may still have values from before being hidden | Use visibility checks first, then value checks |
| Not waiting for dynamic sections to render | Clicking "Add" creates DOM elements — assertions may run too fast | Playwright and Cypress auto-wait, but verify the element exists |
| Expecting validation errors on hidden fields | The form only validates visible required fields | Validate only the currently visible sections |
| Removing a beneficiary and checking the wrong testid | After removal, the element is gone from the DOM — use `not.exist` | Use `toBeHidden()` (PW) or `should('not.exist')` (Cy) |

## Quick Reference

| Action | Playwright | Cypress |
|--------|-----------|---------|
| Select dropdown option | `selectOption('business')` | `select('business')` |
| Check checkbox | `check()` | `check()` |
| Uncheck checkbox | `uncheck()` | `uncheck()` |
| Verify visible | `expect(loc).toBeVisible()` | `should('be.visible')` |
| Verify hidden | `expect(loc).toBeHidden()` | `should('not.be.visible')` |
| Verify not in DOM | N/A (use toBeHidden) | `should('not.exist')` |
| Click add button | `click()` | `click()` |
| Count elements | `locator.count()` | `should('have.length', N)` |
| Check text | `expect(loc).toHaveText(str)` | `should('have.text', str)` |
