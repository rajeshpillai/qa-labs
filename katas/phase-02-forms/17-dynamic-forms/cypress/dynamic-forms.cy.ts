const PLAYGROUND = '/phase-02-forms/17-dynamic-forms/playground/';

describe('Kata 17: Dynamic Forms', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Select Individual and Verify Business Fields Are Hidden
  // --------------------------------------------------------------------------
  it('exercise 1: individual account hides business and joint sections', () => {
    // Verify the default selection is "Individual".
    // should('have.value', val) checks the <select>'s current value.
    cy.get('[data-testid="select-account-type"]').should('have.value', 'individual');

    // Verify both dynamic sections are hidden.
    // should('not.be.visible') checks the element has display:none.
    cy.get('[data-testid="business-section"]').should('not.be.visible');
    cy.get('[data-testid="joint-section"]').should('not.be.visible');

    // Explicitly select Individual.
    cy.get('[data-testid="select-account-type"]').select('individual');

    // Both should remain hidden.
    cy.get('[data-testid="business-section"]').should('not.be.visible');
    cy.get('[data-testid="joint-section"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Select Business and Verify Business Fields Appear
  // --------------------------------------------------------------------------
  it('exercise 2: business account shows business section', () => {
    // select(value) picks the <option> with matching value.
    cy.get('[data-testid="select-account-type"]').select('business');

    // Verify business section is visible.
    cy.get('[data-testid="business-section"]').should('be.visible');
    cy.get('[data-testid="input-company-name"]').should('be.visible');
    cy.get('[data-testid="input-reg-number"]').should('be.visible');
    cy.get('[data-testid="select-business-type"]').should('be.visible');

    // Joint section should remain hidden.
    cy.get('[data-testid="joint-section"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Add a Beneficiary and Verify New Section
  // --------------------------------------------------------------------------
  it('exercise 3: add beneficiary creates new section', () => {
    // Verify no beneficiaries initially.
    cy.get('[data-testid="beneficiary-count"]').should('have.text', '0');

    // Click the "Add Beneficiary" button.
    cy.get('[data-testid="btn-add-beneficiary"]').click();

    // Verify the section appeared.
    cy.get('[data-testid="beneficiary-1"]').should('be.visible');

    // Verify the fields exist.
    cy.get('[data-testid="input-beneficiary-name-1"]').should('be.visible');
    cy.get('[data-testid="input-beneficiary-pct-1"]').should('be.visible');
    cy.get('[data-testid="select-beneficiary-rel-1"]').should('be.visible');

    // Verify count updated.
    cy.get('[data-testid="beneficiary-count"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Remove a Beneficiary
  // --------------------------------------------------------------------------
  it('exercise 4: remove beneficiary removes section', () => {
    // Add a beneficiary.
    cy.get('[data-testid="btn-add-beneficiary"]').click();
    cy.get('[data-testid="beneficiary-1"]').should('be.visible');
    cy.get('[data-testid="beneficiary-count"]').should('have.text', '1');

    // Click Remove.
    cy.get('[data-testid="btn-remove-beneficiary-1"]').click();

    // Verify the section is gone from the DOM.
    // should('not.exist') checks the element was removed entirely.
    cy.get('[data-testid="beneficiary-1"]').should('not.exist');

    // Count should be 0.
    cy.get('[data-testid="beneficiary-count"]').should('have.text', '0');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: PEP Checkbox Shows Detail Fields
  // --------------------------------------------------------------------------
  it('exercise 5: PEP checkbox shows PEP details', () => {
    // PEP section hidden initially.
    cy.get('[data-testid="pep-section"]').should('not.be.visible');

    // check() sets a checkbox to the checked state.
    cy.get('[data-testid="checkbox-pep"]').check();

    // PEP section visible.
    cy.get('[data-testid="pep-section"]').should('be.visible');
    cy.get('[data-testid="input-pep-position"]').should('be.visible');
    cy.get('[data-testid="input-pep-country"]').should('be.visible');

    // uncheck() sets a checkbox to the unchecked state.
    cy.get('[data-testid="checkbox-pep"]').uncheck();
    cy.get('[data-testid="pep-section"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Conditional Validation
  // --------------------------------------------------------------------------
  it('exercise 6: conditional validation based on account type', () => {
    // Select Business, fill primary name, submit without business fields.
    cy.get('[data-testid="select-account-type"]').select('business');
    cy.get('[data-testid="input-primary-name"]').type('Aisha Patel');
    cy.get('[data-testid="btn-submit"]').click();

    // Business errors should appear.
    cy.get('[data-testid="error-company-name"]').should('be.visible');
    cy.get('[data-testid="error-reg-number"]').should('be.visible');

    // Switch to Individual — business hides.
    cy.get('[data-testid="select-account-type"]').select('individual');
    cy.get('[data-testid="business-section"]').should('not.be.visible');

    // Submit again.
    cy.get('[data-testid="btn-submit"]').click();

    // No business errors — they are hidden.
    cy.get('[data-testid="error-company-name"]').should('not.be.visible');

    // Success since only primary name was required.
    cy.get('[data-testid="form-status"]').should('have.class', 'success');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Add Multiple Beneficiaries
  // --------------------------------------------------------------------------
  it('exercise 7: add multiple beneficiaries', () => {
    // Add three.
    cy.get('[data-testid="btn-add-beneficiary"]').click();
    cy.get('[data-testid="btn-add-beneficiary"]').click();
    cy.get('[data-testid="btn-add-beneficiary"]').click();

    // All three visible.
    cy.get('[data-testid="beneficiary-1"]').should('be.visible');
    cy.get('[data-testid="beneficiary-2"]').should('be.visible');
    cy.get('[data-testid="beneficiary-3"]').should('be.visible');

    // Count is 3.
    cy.get('[data-testid="beneficiary-count"]').should('have.text', '3');

    // Each has its own name input.
    cy.get('[data-testid="input-beneficiary-name-1"]').should('be.visible');
    cy.get('[data-testid="input-beneficiary-name-2"]').should('be.visible');
    cy.get('[data-testid="input-beneficiary-name-3"]').should('be.visible');

    // Remove the middle one (#2).
    cy.get('[data-testid="btn-remove-beneficiary-2"]').click();
    cy.get('[data-testid="beneficiary-count"]').should('have.text', '2');
    cy.get('[data-testid="beneficiary-2"]').should('not.exist');
    // 1 and 3 remain.
    cy.get('[data-testid="beneficiary-1"]').should('be.visible');
    cy.get('[data-testid="beneficiary-3"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Form State After Toggling
  // --------------------------------------------------------------------------
  it('exercise 8: form state after toggling account types', () => {
    // Select Business and fill fields.
    cy.get('[data-testid="select-account-type"]').select('business');
    cy.get('[data-testid="business-section"]').should('be.visible');
    cy.get('[data-testid="input-company-name"]').type('Acme Corp');
    cy.get('[data-testid="input-reg-number"]').type('RC-123');

    // Switch to Joint — business hides, joint shows.
    cy.get('[data-testid="select-account-type"]').select('joint');
    cy.get('[data-testid="business-section"]').should('not.be.visible');
    cy.get('[data-testid="joint-section"]').should('be.visible');

    // Verify joint fields are visible.
    cy.get('[data-testid="input-joint-name"]').should('be.visible');
    cy.get('[data-testid="input-joint-email"]').should('be.visible');

    // Switch back to Business — business reappears, joint hides.
    cy.get('[data-testid="select-account-type"]').select('business');
    cy.get('[data-testid="business-section"]').should('be.visible');
    cy.get('[data-testid="joint-section"]').should('not.be.visible');

    // Data we entered earlier should still be there.
    // should('have.value', str) checks the input's current value.
    cy.get('[data-testid="input-company-name"]').should('have.value', 'Acme Corp');
  });

});
