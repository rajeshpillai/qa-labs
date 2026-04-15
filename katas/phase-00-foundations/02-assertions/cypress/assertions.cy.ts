const PLAYGROUND = '/phase-00-foundations/02-assertions/playground/';

describe('Kata 02: Assertions', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Text Assertions
  // --------------------------------------------------------------------------
  it('exercise 1: verify stat card text content', () => {
    // 'have.text' checks the exact text content of the element.
    // Whitespace is preserved, so make sure it matches exactly.
    cy.get('[data-testid="stat-total-value"]')
      .should('have.text', '1,247');

    // 'contain.text' checks that the text INCLUDES the expected substring.
    // More forgiving than 'have.text'.
    cy.get('[data-testid="stat-total"]')
      .should('contain.text', 'Total Applications');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Visibility Assertions
  // --------------------------------------------------------------------------
  it('exercise 2: verify alerts are visible', () => {
    // 'be.visible' checks the element is rendered and visible on screen.
    cy.get('[data-testid="alert-success"]').should('be.visible');
    cy.get('[data-testid="alert-warning"]').should('be.visible');
    cy.get('[data-testid="alert-error"]').should('be.visible');

    // .and() chains multiple assertions on the same subject.
    // The subject (the element) is passed through the chain.
    cy.get('[data-testid="alert-success"]')
      .should('be.visible')
      .and('contain.text', '12 applications processed');

    cy.get('[data-testid="alert-warning"]')
      .should('contain.text', 'manual review');

    cy.get('[data-testid="alert-error"]')
      .should('contain.text', 'experiencing delays');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Count Assertions
  // --------------------------------------------------------------------------
  it('exercise 3: verify table row count', () => {
    // 'have.length' checks the number of matched elements.
    // This is Cypress's equivalent of Playwright's toHaveCount.
    cy.get('[data-testid="app-table"] tbody tr')
      .should('have.length', 3);
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Attribute Assertions
  // --------------------------------------------------------------------------
  it('exercise 4: verify input attributes', () => {
    // 'have.attr' checks an HTML attribute. With two arguments,
    // it checks the attribute exists AND has the specified value.
    // With one argument, it just checks the attribute exists.
    cy.get('[data-testid="input-readonly"]')
      .should('have.attr', 'readonly')
      .and('have.value', 'KYC-2024-0001');

    // 'be.disabled' is a shorthand for checking the disabled attribute.
    cy.get('[data-testid="input-disabled"]')
      .should('be.disabled')
      .and('have.value', 'Cannot edit');

    // Check the required attribute.
    cy.get('[data-testid="input-required"]')
      .should('have.attr', 'required');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: CSS Assertions
  // --------------------------------------------------------------------------
  it('exercise 5: verify and change CSS styles', () => {
    // 'have.css' checks a computed CSS property.
    // IMPORTANT: browsers compute colors as rgb(), not hex.
    cy.get('[data-testid="colored-box"]')
      .should('have.css', 'background-color', 'rgb(59, 130, 246)')
      .and('have.css', 'border-radius', '8px');

    // Click the button to change the color.
    cy.get('[data-testid="btn-change-color"]').click();

    // Verify the new color. Cypress auto-retries .should() assertions,
    // so it will wait for the color to change before passing.
    cy.get('[data-testid="colored-box"]')
      .should('have.css', 'background-color', 'rgb(239, 68, 68)');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Counter Interactions
  // --------------------------------------------------------------------------
  it('exercise 6: counter increment, decrement, and reset', () => {
    // Verify initial state.
    cy.get('[data-testid="counter-value"]').should('have.text', '0');

    // Click +1 three times.
    cy.get('[data-testid="btn-increment"]').click();
    cy.get('[data-testid="btn-increment"]').click();
    cy.get('[data-testid="btn-increment"]').click();
    cy.get('[data-testid="counter-value"]').should('have.text', '3');

    // Click -1 once.
    cy.get('[data-testid="btn-decrement"]').click();
    cy.get('[data-testid="counter-value"]').should('have.text', '2');

    // Reset.
    cy.get('[data-testid="btn-reset-counter"]').click();
    cy.get('[data-testid="counter-value"]').should('have.text', '0');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Dynamic Content
  // --------------------------------------------------------------------------
  it('exercise 7: add and clear dynamic alerts', () => {
    // Initially no dynamic alerts.
    cy.get('[data-testid="dynamic-alerts"] .alert')
      .should('have.length', 0);

    // Click "Add Alert" twice.
    cy.get('[data-testid="btn-add-alert"]').click();
    cy.get('[data-testid="btn-add-alert"]').click();

    // Verify 2 alerts appear.
    cy.get('[data-testid="dynamic-alerts"] .alert')
      .should('have.length', 2);

    // Verify the first alert text.
    cy.get('[data-testid="dynamic-alert-1"]')
      .should('contain.text', 'Alert #1');

    // Clear all alerts.
    cy.get('[data-testid="btn-clear-alerts"]').click();
    cy.get('[data-testid="dynamic-alerts"] .alert')
      .should('have.length', 0);
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Negative Assertions
  // --------------------------------------------------------------------------
  it('exercise 8: negative assertions', () => {
    // 'not.exist' means the element is NOT in the DOM.
    // 'not.be.visible' means the element IS in the DOM but hidden.
    // Here the empty list has no .list-item children at all.
    cy.get('[data-testid="empty-list"] .list-item')
      .should('not.exist');

    cy.get('[data-testid="empty-message"]')
      .should('have.text', 'No pending verifications.');

    // The items list should have items (NOT be empty).
    cy.get('[data-testid="items-list"] .list-item')
      .should('have.length.greaterThan', 0);

    cy.get('[data-testid="items-list"] .list-item')
      .should('have.length', 3);
  });

  // --------------------------------------------------------------------------
  // Exercise 9: Data Attributes
  // --------------------------------------------------------------------------
  it('exercise 9: verify custom data attributes', () => {
    // 'have.attr' can check any HTML attribute including data-* attributes.
    // Pass the attribute name and expected value as two arguments.
    cy.get('[data-testid="data-attributes"]')
      .should('have.attr', 'data-status', 'active')
      .and('have.attr', 'data-priority', 'high')
      .and('have.attr', 'data-count', '42')
      .and('have.attr', 'data-user-role', 'admin');
  });

  // --------------------------------------------------------------------------
  // Exercise 10: Multiple Assertions on One Element
  // --------------------------------------------------------------------------
  it('exercise 10: multiple assertions on a link', () => {
    // Chain multiple assertions with .should() and .and().
    // Each .and() receives the same subject element.
    cy.get('[data-testid="link-terms"]')
      .should('be.visible')
      .and('have.attr', 'href', 'https://example.com/terms')
      .and('have.attr', 'target', '_blank')
      .and('have.text', 'Terms of Service');
  });

});
