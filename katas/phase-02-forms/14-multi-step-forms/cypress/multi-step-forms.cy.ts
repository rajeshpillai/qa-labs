const PLAYGROUND = '/phase-02-forms/14-multi-step-forms/playground/';

describe('Kata 14: Multi-Step Forms', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Helper: Fill step 1 (Personal Info) with valid data.
  // --------------------------------------------------------------------------
  function fillStep1() {
    cy.get('[data-testid="input-full-name"]').clear().type('Aisha Patel');
    cy.get('[data-testid="input-email"]').clear().type('aisha@example.com');
    cy.get('[data-testid="input-phone"]').clear().type('+1-555-123-4567');
  }

  // --------------------------------------------------------------------------
  // Helper: Fill step 2 (Address) with valid data.
  // --------------------------------------------------------------------------
  function fillStep2() {
    cy.get('[data-testid="input-street"]').clear().type('42 Baker Street');
    cy.get('[data-testid="input-city"]').clear().type('London');
    // select(value) picks the <option> whose value attribute matches.
    cy.get('[data-testid="input-country"]').select('GB');
    cy.get('[data-testid="input-postal"]').clear().type('W1U 6PL');
  }

  // --------------------------------------------------------------------------
  // Helper: Fill step 3 (Employment) with valid data.
  // --------------------------------------------------------------------------
  function fillStep3() {
    cy.get('[data-testid="input-employment-status"]').select('employed');
    cy.get('[data-testid="input-employer"]').clear().type('Acme Corp');
    cy.get('[data-testid="input-income"]').select('50k-100k');
  }

  // --------------------------------------------------------------------------
  // Helper: Fill and navigate all 3 steps to reach the review page.
  // --------------------------------------------------------------------------
  function completeAllSteps() {
    fillStep1();
    cy.get('[data-testid="btn-next-1"]').click();

    fillStep2();
    cy.get('[data-testid="btn-next-2"]').click();

    fillStep3();
    cy.get('[data-testid="btn-next-3"]').click();
  }

  // --------------------------------------------------------------------------
  // Exercise 1: Navigate Forward Through Steps
  // --------------------------------------------------------------------------
  it('exercise 1: navigate forward from step 1 to step 2', () => {
    // Verify step 1 is initially visible.
    cy.get('[data-testid="step-1"]').should('be.visible');

    // Fill step 1 and click Next.
    fillStep1();
    cy.get('[data-testid="btn-next-1"]').click();

    // Verify step 2 is visible and step 1 is hidden.
    // should('be.visible') checks the element is rendered (display:block).
    cy.get('[data-testid="step-2"]').should('be.visible');
    // should('not.be.visible') checks the element has display:none.
    cy.get('[data-testid="step-1"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Navigate Back to Previous Step
  // --------------------------------------------------------------------------
  it('exercise 2: navigate back from step 2 to step 1', () => {
    fillStep1();
    cy.get('[data-testid="btn-next-1"]').click();
    cy.get('[data-testid="step-2"]').should('be.visible');

    // Click Back.
    cy.get('[data-testid="btn-back-2"]').click();

    // Verify step 1 is visible again.
    cy.get('[data-testid="step-1"]').should('be.visible');
    cy.get('[data-testid="step-2"]').should('not.be.visible');

    // Verify data is still in the fields.
    // should('have.value', str) checks the input's current value.
    cy.get('[data-testid="input-full-name"]').should('have.value', 'Aisha Patel');
    cy.get('[data-testid="input-email"]').should('have.value', 'aisha@example.com');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Progress Indicator Updates
  // --------------------------------------------------------------------------
  it('exercise 3: progress indicator updates on navigation', () => {
    // Initially, indicator 1 should be active.
    cy.get('[data-testid="indicator-1"]').should('have.class', 'active');
    cy.get('[data-testid="indicator-2"]').should('not.have.class', 'active');

    // Navigate to step 2.
    fillStep1();
    cy.get('[data-testid="btn-next-1"]').click();

    // Indicator 1 should be "completed", indicator 2 should be "active".
    // should('have.class', name) checks the element's classList.
    cy.get('[data-testid="indicator-1"]').should('have.class', 'completed');
    cy.get('[data-testid="indicator-2"]').should('have.class', 'active');

    // Indicators 3 and 4 should have neither class.
    cy.get('[data-testid="indicator-3"]')
      .should('not.have.class', 'active')
      .and('not.have.class', 'completed');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Step 1 Validation Prevents Advancing
  // --------------------------------------------------------------------------
  it('exercise 4: step 1 validation prevents advancing when empty', () => {
    // Click Next without filling anything.
    cy.get('[data-testid="btn-next-1"]').click();

    // Still on step 1.
    cy.get('[data-testid="step-1"]').should('be.visible');
    cy.get('[data-testid="step-2"]').should('not.be.visible');

    // Errors appear.
    cy.get('[data-testid="error-full-name"]').should('be.visible');
    cy.get('[data-testid="error-email"]').should('be.visible');
    cy.get('[data-testid="error-phone"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Complete the Full 4-Step Flow
  // --------------------------------------------------------------------------
  it('exercise 5: complete full 4-step flow', () => {
    completeAllSteps();

    // Verify we reached step 4.
    cy.get('[data-testid="step-4"]').should('be.visible');
    cy.get('[data-testid="step-3"]').should('not.be.visible');

    // All indicators updated.
    cy.get('[data-testid="indicator-4"]').should('have.class', 'active');
    cy.get('[data-testid="indicator-1"]').should('have.class', 'completed');
    cy.get('[data-testid="indicator-2"]').should('have.class', 'completed');
    cy.get('[data-testid="indicator-3"]').should('have.class', 'completed');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Review Page Shows All Entered Data
  // --------------------------------------------------------------------------
  it('exercise 6: review page displays all entered data', () => {
    completeAllSteps();

    cy.get('[data-testid="step-4"]').should('be.visible');

    // Personal info.
    // should('have.text', str) checks the element's textContent exactly.
    cy.get('[data-testid="review-fullName"]').should('have.text', 'Aisha Patel');
    cy.get('[data-testid="review-email"]').should('have.text', 'aisha@example.com');
    cy.get('[data-testid="review-phone"]').should('have.text', '+1-555-123-4567');

    // Address info.
    cy.get('[data-testid="review-street"]').should('have.text', '42 Baker Street');
    cy.get('[data-testid="review-city"]').should('have.text', 'London');
    cy.get('[data-testid="review-country"]').should('have.text', 'United Kingdom');
    cy.get('[data-testid="review-postal"]').should('have.text', 'W1U 6PL');

    // Employment info.
    cy.get('[data-testid="review-employmentStatus"]').should('have.text', 'Employed');
    cy.get('[data-testid="review-employer"]').should('have.text', 'Acme Corp');
    cy.get('[data-testid="review-income"]').should('have.text', '$50,000 - $100,000');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Submit from the Review Page
  // --------------------------------------------------------------------------
  it('exercise 7: submit application from review page', () => {
    completeAllSteps();

    cy.get('[data-testid="btn-submit"]').click();

    cy.get('[data-testid="form-status"]')
      .should('be.visible')
      .and('have.class', 'success')
      .and('contain.text', 'submitted successfully');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Step 2 Validation Prevents Advancing
  // --------------------------------------------------------------------------
  it('exercise 8: step 2 validation prevents advancing when empty', () => {
    // Pass step 1.
    fillStep1();
    cy.get('[data-testid="btn-next-1"]').click();

    // Click Next on step 2 without filling anything.
    cy.get('[data-testid="btn-next-2"]').click();

    // Still on step 2.
    cy.get('[data-testid="step-2"]').should('be.visible');
    cy.get('[data-testid="step-3"]').should('not.be.visible');

    // Errors appear.
    cy.get('[data-testid="error-street"]').should('be.visible');
    cy.get('[data-testid="error-city"]').should('be.visible');
    cy.get('[data-testid="error-country"]').should('be.visible');
    cy.get('[data-testid="error-postal"]').should('be.visible');
  });

});
