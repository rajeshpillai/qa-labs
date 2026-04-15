const PLAYGROUND = '/phase-02-forms/13-form-validation/playground/';

describe('Kata 13: Form Validation', () => {

  // beforeEach runs before every test in this describe block.
  // We navigate to the playground so each test starts with a fresh page.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Helper: Fill every field with valid data.
  // --------------------------------------------------------------------------
  // Uses Cypress clear() + type() for text fields, select() for dropdowns.
  // clear() removes existing text so type() starts from an empty field.
  function fillValidData() {
    // clear() empties the input, then type() simulates keystrokes.
    cy.get('[data-testid="input-full-name"]').clear().type('Aisha Patel');
    cy.get('[data-testid="input-email"]').clear().type('aisha@example.com');
    cy.get('[data-testid="input-phone"]').clear().type('+1-555-123-4567');
    // For date inputs in Cypress, type() with an ISO date string works.
    cy.get('[data-testid="input-dob"]').clear().type('1990-05-15');
    // select(value) chooses the <option> whose value attribute matches.
    cy.get('[data-testid="input-nationality"]').select('IN');
    cy.get('[data-testid="input-id-number"]').clear().type('A12345678');
  }

  // --------------------------------------------------------------------------
  // Exercise 1: Submit Empty Form and Verify All Errors Appear
  // --------------------------------------------------------------------------
  it('exercise 1: submit empty form and verify all errors appear', () => {
    // Click the submit button without filling any fields.
    cy.get('[data-testid="btn-submit"]').click();

    // Verify every error message is now visible.
    // should('be.visible') asserts the element is rendered and visible.
    cy.get('[data-testid="error-full-name"]').should('be.visible');
    cy.get('[data-testid="error-email"]').should('be.visible');
    cy.get('[data-testid="error-phone"]').should('be.visible');
    cy.get('[data-testid="error-dob"]').should('be.visible');
    cy.get('[data-testid="error-nationality"]').should('be.visible');
    cy.get('[data-testid="error-id-number"]').should('be.visible');

    // Verify the form-level error banner is shown.
    cy.get('[data-testid="form-status"]')
      .should('be.visible')
      .and('contain.text', 'Please fix the errors');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Fill Valid Data and Verify Success Message
  // --------------------------------------------------------------------------
  it('exercise 2: fill valid data and verify success message', () => {
    // Fill all fields with valid data.
    fillValidData();

    // Submit the form.
    cy.get('[data-testid="btn-submit"]').click();

    // Verify the success banner is shown with correct class and text.
    // .should('have.class', 'success') checks the element has that CSS class.
    cy.get('[data-testid="form-status"]')
      .should('have.class', 'success')
      .and('contain.text', 'submitted successfully');

    // Verify error messages are hidden.
    cy.get('[data-testid="error-full-name"]').should('not.be.visible');
    cy.get('[data-testid="error-email"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Enter Invalid Email and Verify Error
  // --------------------------------------------------------------------------
  it('exercise 3: invalid email triggers email error', () => {
    fillValidData();
    // Override email with an invalid value — "notanemail" has no @ symbol.
    cy.get('[data-testid="input-email"]').clear().type('notanemail');

    cy.get('[data-testid="btn-submit"]').click();

    // Only the email error should be visible.
    cy.get('[data-testid="error-email"]').should('be.visible');

    // Other errors should be hidden.
    cy.get('[data-testid="error-full-name"]').should('not.be.visible');
    cy.get('[data-testid="error-phone"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Enter Invalid Phone and Verify Error
  // --------------------------------------------------------------------------
  it('exercise 4: invalid phone triggers phone error', () => {
    fillValidData();
    // "123" is only 3 digits — below the 10-digit minimum.
    cy.get('[data-testid="input-phone"]').clear().type('123');

    cy.get('[data-testid="btn-submit"]').click();

    // Only the phone error should be visible.
    cy.get('[data-testid="error-phone"]').should('be.visible');
    cy.get('[data-testid="error-email"]').should('not.be.visible');
    cy.get('[data-testid="error-full-name"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Enter Name Below Minimum Length
  // --------------------------------------------------------------------------
  it('exercise 5: name below minimum length triggers error', () => {
    fillValidData();
    // "AB" is 2 characters — below the 3-character minimum.
    cy.get('[data-testid="input-full-name"]').clear().type('AB');

    cy.get('[data-testid="btn-submit"]').click();

    cy.get('[data-testid="error-full-name"]').should('be.visible');
    cy.get('[data-testid="error-email"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Exact Error Message Text
  // --------------------------------------------------------------------------
  it('exercise 6: verify exact error message text', () => {
    // Submit empty form to trigger all errors.
    cy.get('[data-testid="btn-submit"]').click();

    // should('have.text', str) checks textContent exactly matches the string.
    cy.get('[data-testid="error-full-name"]')
      .should('have.text', 'Full name is required (3-50 characters).');

    cy.get('[data-testid="error-email"]')
      .should('have.text', 'Please enter a valid email address.');

    cy.get('[data-testid="error-phone"]')
      .should('have.text', 'Phone must be 10-15 digits (may start with +).');

    cy.get('[data-testid="error-dob"]')
      .should('have.text', 'Date of birth is required.');

    cy.get('[data-testid="error-nationality"]')
      .should('have.text', 'Please select your nationality.');

    cy.get('[data-testid="error-id-number"]')
      .should('have.text', 'ID number must be 5-20 characters.');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Error Styling (Red Border)
  // --------------------------------------------------------------------------
  it('exercise 7: verify error styling on invalid inputs', () => {
    // Submit empty form.
    cy.get('[data-testid="btn-submit"]').click();

    // should('have.class', name) checks the element's classList contains name.
    // The "input-error" class applies a red border via CSS.
    cy.get('[data-testid="input-full-name"]').should('have.class', 'input-error');
    cy.get('[data-testid="input-email"]').should('have.class', 'input-error');
    cy.get('[data-testid="input-phone"]').should('have.class', 'input-error');
    cy.get('[data-testid="input-dob"]').should('have.class', 'input-error');
    cy.get('[data-testid="input-nationality"]').should('have.class', 'input-error');
    cy.get('[data-testid="input-id-number"]').should('have.class', 'input-error');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Successful Submission Clears Errors
  // --------------------------------------------------------------------------
  it('exercise 8: successful submission clears previous errors', () => {
    // Step 1: Submit the empty form to trigger all error messages.
    cy.get('[data-testid="btn-submit"]').click();

    // Confirm errors are visible.
    cy.get('[data-testid="error-full-name"]').should('be.visible');
    cy.get('[data-testid="form-status"]').should('have.class', 'error');

    // Step 2: Fill all fields with valid data.
    fillValidData();

    // Step 3: Submit again.
    cy.get('[data-testid="btn-submit"]').click();

    // All error messages should now be hidden.
    cy.get('[data-testid="error-full-name"]').should('not.be.visible');
    cy.get('[data-testid="error-email"]').should('not.be.visible');
    cy.get('[data-testid="error-phone"]').should('not.be.visible');
    cy.get('[data-testid="error-dob"]').should('not.be.visible');
    cy.get('[data-testid="error-nationality"]').should('not.be.visible');
    cy.get('[data-testid="error-id-number"]').should('not.be.visible');

    // Inputs should no longer have the error class.
    cy.get('[data-testid="input-full-name"]').should('not.have.class', 'input-error');

    // The success banner should be shown.
    cy.get('[data-testid="form-status"]')
      .should('have.class', 'success')
      .and('contain.text', 'submitted successfully');
  });

});
