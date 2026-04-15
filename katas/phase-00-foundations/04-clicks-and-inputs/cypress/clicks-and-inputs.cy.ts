const PLAYGROUND = '/phase-00-foundations/04-clicks-and-inputs/playground/';

describe('Kata 04: Clicks and Inputs', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Calculator
  // --------------------------------------------------------------------------
  it('exercise 1: calculate 42 + 18 = 60', () => {
    // Click digits to enter "42".
    cy.get('[data-testid="calc-4"]').click();
    cy.get('[data-testid="calc-2"]').click();
    cy.get('[data-testid="calc-display"]').should('have.text', '42');

    // Click the + operator.
    cy.get('[data-testid="calc-add"]').click();

    // Enter "18".
    cy.get('[data-testid="calc-1"]').click();
    cy.get('[data-testid="calc-8"]').click();

    // Click = to compute.
    cy.get('[data-testid="calc-equals"]').click();

    // Verify result.
    cy.get('[data-testid="calc-display"]').should('have.text', '60');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Fill Text Inputs
  // --------------------------------------------------------------------------
  it('exercise 2: fill inputs and verify live summary', () => {
    // In Cypress, type() appends text character by character.
    // Since the fields start empty, we don't need clear() first.
    cy.get('[data-testid="input-name"]').type('Alice Johnson');
    cy.get('[data-testid="input-email"]').type('alice@fintech.com');
    cy.get('[data-testid="input-amount"]').type('2500.50');

    // Verify the live summary.
    cy.get('[data-testid="summary-name"]').should('have.text', 'Alice Johnson');
    cy.get('[data-testid="summary-email"]').should('have.text', 'alice@fintech.com');
    cy.get('[data-testid="summary-amount"]').should('have.text', '2500.50');

    // Password field.
    cy.get('[data-testid="input-password"]').type('Str0ngP@ss!');
    cy.get('[data-testid="input-password"]').should('have.value', 'Str0ngP@ss!');

    // Textarea.
    cy.get('[data-testid="textarea-reason"]').type('Insufficient documentation provided.');
    cy.get('[data-testid="textarea-reason"]')
      .should('have.value', 'Insufficient documentation provided.');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Clear and Retype
  // --------------------------------------------------------------------------
  it('exercise 3: clear a field and type new value', () => {
    cy.get('[data-testid="input-name"]').type('Wrong Name');
    cy.get('[data-testid="input-name"]').should('have.value', 'Wrong Name');

    // clear() removes all text from the input.
    cy.get('[data-testid="input-name"]').clear();
    cy.get('[data-testid="input-name"]').should('have.value', '');

    // Type the correct value.
    cy.get('[data-testid="input-name"]').type('Correct Name');
    cy.get('[data-testid="input-name"]').should('have.value', 'Correct Name');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Select Dropdown
  // --------------------------------------------------------------------------
  it('exercise 4: select option from dropdown', () => {
    // select() can take a value or visible text.
    cy.get('[data-testid="select-risk"]').select('high');
    cy.get('[data-testid="select-risk"]').should('have.value', 'high');
    cy.get('[data-testid="selected-risk"]').should('have.text', 'High Risk');

    // Select by visible text.
    cy.get('[data-testid="select-risk"]').select('Critical Risk');
    cy.get('[data-testid="select-risk"]').should('have.value', 'critical');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Multi-Select
  // --------------------------------------------------------------------------
  it('exercise 5: select multiple options', () => {
    // Pass an array to select multiple values.
    // Only works on <select multiple> elements.
    cy.get('[data-testid="select-country"]').select(['us', 'in']);

    // Verify selected values using invoke to get the array of selected options.
    cy.get('[data-testid="select-country"]')
      .invoke('val')
      .should('deep.equal', ['us', 'in']);
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Checkboxes
  // --------------------------------------------------------------------------
  it('exercise 6: check and uncheck checkboxes', () => {
    // check() checks the checkbox.
    cy.get('[data-testid="check-identity"]').check();
    cy.get('[data-testid="check-sanctions"]').check();

    cy.get('[data-testid="check-identity"]').should('be.checked');
    cy.get('[data-testid="check-sanctions"]').should('be.checked');
    cy.get('[data-testid="checked-count"]').should('have.text', '2');

    // uncheck() unchecks.
    cy.get('[data-testid="check-identity"]').uncheck();
    cy.get('[data-testid="check-identity"]').should('not.be.checked');
    cy.get('[data-testid="checked-count"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Radio Buttons
  // --------------------------------------------------------------------------
  it('exercise 7: select radio buttons', () => {
    // check() works for radio buttons.
    cy.get('[data-testid="radio-approve"]').check();
    cy.get('[data-testid="radio-approve"]').should('be.checked');
    cy.get('[data-testid="decision-value"]').should('have.text', 'Approve');

    // Selecting a different radio unchecks the previous.
    cy.get('[data-testid="radio-reject"]').check();
    cy.get('[data-testid="radio-reject"]').should('be.checked');
    cy.get('[data-testid="radio-approve"]').should('not.be.checked');
    cy.get('[data-testid="decision-value"]').should('have.text', 'Reject');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Double Click
  // --------------------------------------------------------------------------
  it('exercise 8: double click', () => {
    // dblclick() performs a double-click.
    cy.get('[data-testid="btn-double-click"]').dblclick();

    cy.get('[data-testid="click-result"]')
      .should('have.text', 'Double click detected!');
  });

  // --------------------------------------------------------------------------
  // Exercise 9: Right Click (Context Menu)
  // --------------------------------------------------------------------------
  it('exercise 9: right click and context menu', () => {
    // rightclick() triggers the contextmenu event.
    cy.get('[data-testid="btn-right-click"]').rightclick();

    // Verify context menu appears.
    cy.get('[data-testid="context-menu"]').should('be.visible');

    // Click an option in the context menu.
    cy.get('[data-testid="ctx-approve"]').click();

    cy.get('[data-testid="click-result"]')
      .should('have.text', 'Context action: Approve');
  });

  // --------------------------------------------------------------------------
  // Exercise 10: Range Slider
  // --------------------------------------------------------------------------
  it('exercise 10: set range slider value', () => {
    // Cypress doesn't have a native method for range inputs.
    // Use invoke('val', value) to set the value, then trigger('input')
    // to fire the input event so the UI updates.
    cy.get('[data-testid="risk-slider"]')
      .invoke('val', 75)
      .trigger('input');

    cy.get('[data-testid="slider-value"]').should('have.text', '75');
  });

});
