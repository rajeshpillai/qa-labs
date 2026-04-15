import { test, expect } from '@playwright/test';

const PLAYGROUND = '/phase-02-forms/17-dynamic-forms/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Select Individual and Verify Business Fields Are Hidden
// --------------------------------------------------------------------------
// The default account type is "Individual". Business and joint sections
// should both be hidden.
test('exercise 1: individual account hides business and joint sections', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the default selection is "Individual".
  // toHaveValue(val) checks the <select>'s current value.
  await expect(page.getByTestId('select-account-type')).toHaveValue('individual');

  // Verify the business section is hidden.
  // toBeHidden() checks the element has display:none (via the "hidden" class).
  await expect(page.getByTestId('business-section')).toBeHidden();

  // Verify the joint section is also hidden.
  await expect(page.getByTestId('joint-section')).toBeHidden();

  // Explicitly select "Individual" (it's already selected, but this tests
  // the behavior of explicitly choosing it).
  await page.getByTestId('select-account-type').selectOption('individual');

  // Both sections should remain hidden.
  await expect(page.getByTestId('business-section')).toBeHidden();
  await expect(page.getByTestId('joint-section')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 2: Select Business and Verify Business Fields Appear
// --------------------------------------------------------------------------
// Choosing "Business" should reveal the business details section.
test('exercise 2: business account shows business section', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Select "Business" account type.
  // selectOption(value) picks the <option> with the matching value.
  await page.getByTestId('select-account-type').selectOption('business');

  // Verify the business section is now visible.
  await expect(page.getByTestId('business-section')).toBeVisible();

  // Verify the business fields are present and interactable.
  await expect(page.getByTestId('input-company-name')).toBeVisible();
  await expect(page.getByTestId('input-reg-number')).toBeVisible();
  await expect(page.getByTestId('select-business-type')).toBeVisible();

  // Verify the joint section is still hidden.
  await expect(page.getByTestId('joint-section')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 3: Add a Beneficiary and Verify New Section
// --------------------------------------------------------------------------
// Clicking "Add Beneficiary" creates a new form section.
test('exercise 3: add beneficiary creates new section', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify no beneficiaries initially.
  await expect(page.getByTestId('beneficiary-count')).toHaveText('0');

  // Click the "Add Beneficiary" button.
  await page.getByTestId('btn-add-beneficiary').click();

  // Verify a beneficiary section appeared.
  // The first beneficiary gets data-testid="beneficiary-1".
  await expect(page.getByTestId('beneficiary-1')).toBeVisible();

  // Verify the beneficiary fields exist.
  await expect(page.getByTestId('input-beneficiary-name-1')).toBeVisible();
  await expect(page.getByTestId('input-beneficiary-pct-1')).toBeVisible();
  await expect(page.getByTestId('select-beneficiary-rel-1')).toBeVisible();

  // Verify the count updated.
  await expect(page.getByTestId('beneficiary-count')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 4: Remove a Beneficiary
// --------------------------------------------------------------------------
// Add a beneficiary, then remove it.
test('exercise 4: remove beneficiary removes section', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Add a beneficiary.
  await page.getByTestId('btn-add-beneficiary').click();
  await expect(page.getByTestId('beneficiary-1')).toBeVisible();
  await expect(page.getByTestId('beneficiary-count')).toHaveText('1');

  // Click the Remove button on beneficiary 1.
  await page.getByTestId('btn-remove-beneficiary-1').click();

  // Verify the section is gone.
  // toBeHidden() works because the element is removed from the DOM entirely.
  await expect(page.getByTestId('beneficiary-1')).toBeHidden();

  // Verify the count decreased.
  await expect(page.getByTestId('beneficiary-count')).toHaveText('0');
});

// --------------------------------------------------------------------------
// Exercise 5: PEP Checkbox Shows Detail Fields
// --------------------------------------------------------------------------
// Checking the PEP checkbox reveals PEP detail fields.
test('exercise 5: PEP checkbox shows PEP details', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify PEP section is initially hidden.
  await expect(page.getByTestId('pep-section')).toBeHidden();

  // Check the PEP checkbox.
  // check() clicks the checkbox to set it to checked state.
  await page.getByTestId('checkbox-pep').check();

  // Verify the PEP section appeared.
  await expect(page.getByTestId('pep-section')).toBeVisible();
  await expect(page.getByTestId('input-pep-position')).toBeVisible();
  await expect(page.getByTestId('input-pep-country')).toBeVisible();

  // Uncheck it — the section should hide again.
  // uncheck() clicks the checkbox to set it to unchecked state.
  await page.getByTestId('checkbox-pep').uncheck();
  await expect(page.getByTestId('pep-section')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Conditional Validation
// --------------------------------------------------------------------------
// The form only validates fields that are currently visible.
test('exercise 6: conditional validation based on account type', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Select "Business" and submit without filling business fields.
  await page.getByTestId('select-account-type').selectOption('business');
  await page.getByTestId('input-primary-name').fill('Aisha Patel');
  await page.getByTestId('btn-submit').click();

  // Business-specific errors should appear.
  await expect(page.getByTestId('error-company-name')).toBeVisible();
  await expect(page.getByTestId('error-reg-number')).toBeVisible();

  // Now switch to "Individual" — business fields hide.
  await page.getByTestId('select-account-type').selectOption('individual');
  await expect(page.getByTestId('business-section')).toBeHidden();

  // Submit again — only the primary name is validated (which we already filled).
  await page.getByTestId('btn-submit').click();

  // No business errors should appear since those fields are hidden.
  await expect(page.getByTestId('error-company-name')).toBeHidden();

  // Success should show since only the primary name was required.
  await expect(page.getByTestId('form-status')).toHaveClass(/success/);
});

// --------------------------------------------------------------------------
// Exercise 7: Add Multiple Beneficiaries
// --------------------------------------------------------------------------
// Click the Add button three times and verify all sections exist.
test('exercise 7: add multiple beneficiaries', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Add three beneficiaries.
  await page.getByTestId('btn-add-beneficiary').click();
  await page.getByTestId('btn-add-beneficiary').click();
  await page.getByTestId('btn-add-beneficiary').click();

  // Verify all three sections exist.
  await expect(page.getByTestId('beneficiary-1')).toBeVisible();
  await expect(page.getByTestId('beneficiary-2')).toBeVisible();
  await expect(page.getByTestId('beneficiary-3')).toBeVisible();

  // Verify the count shows 3.
  await expect(page.getByTestId('beneficiary-count')).toHaveText('3');

  // Verify each has its own name input.
  await expect(page.getByTestId('input-beneficiary-name-1')).toBeVisible();
  await expect(page.getByTestId('input-beneficiary-name-2')).toBeVisible();
  await expect(page.getByTestId('input-beneficiary-name-3')).toBeVisible();

  // Remove the middle one (#2) and verify count updates.
  await page.getByTestId('btn-remove-beneficiary-2').click();
  await expect(page.getByTestId('beneficiary-count')).toHaveText('2');
  await expect(page.getByTestId('beneficiary-2')).toBeHidden();
  // Beneficiaries 1 and 3 should still be visible.
  await expect(page.getByTestId('beneficiary-1')).toBeVisible();
  await expect(page.getByTestId('beneficiary-3')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Form State After Toggling
// --------------------------------------------------------------------------
// Switch between account types and verify sections toggle correctly.
test('exercise 8: form state after toggling account types', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Select "Business" and fill company fields.
  await page.getByTestId('select-account-type').selectOption('business');
  await expect(page.getByTestId('business-section')).toBeVisible();
  await page.getByTestId('input-company-name').fill('Acme Corp');
  await page.getByTestId('input-reg-number').fill('RC-123');

  // Switch to "Joint Account" — business should hide, joint should show.
  await page.getByTestId('select-account-type').selectOption('joint');
  await expect(page.getByTestId('business-section')).toBeHidden();
  await expect(page.getByTestId('joint-section')).toBeVisible();

  // Verify joint fields are visible.
  await expect(page.getByTestId('input-joint-name')).toBeVisible();
  await expect(page.getByTestId('input-joint-email')).toBeVisible();

  // Switch back to "Business" — business should reappear, joint should hide.
  await page.getByTestId('select-account-type').selectOption('business');
  await expect(page.getByTestId('business-section')).toBeVisible();
  await expect(page.getByTestId('joint-section')).toBeHidden();

  // Verify the company name we entered earlier is still in the input.
  // The input retains its value because we only toggled visibility,
  // not removed the element from the DOM.
  await expect(page.getByTestId('input-company-name')).toHaveValue('Acme Corp');
});
