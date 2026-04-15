const PLAYGROUND = '/phase-00-foundations/06-iframes-and-shadow-dom/playground/';

// ---------------------------------------------------------------------------
// Helper: get the <body> of an iframe.
// Cypress does NOT have built-in iframe support like Playwright's frameLocator.
// This helper reaches into the iframe's contentDocument and wraps its body
// so you can chain normal Cypress commands on it.
// ---------------------------------------------------------------------------
function getIframeBody(selector: string) {
  return cy
    .get(selector)                              // find the <iframe> element
    .its('0.contentDocument.body')              // get its contentDocument.body (DOM node)
    .should('not.be.empty')                     // make sure the iframe has loaded
    .then(cy.wrap);                             // wrap it so we can chain Cypress commands
}

describe('Kata 06: Iframes and Shadow DOM', () => {

  beforeEach(() => {
    // Visit the playground before every test.
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Access iframe content using the iframe helper
  // --------------------------------------------------------------------------
  it('exercise 1: read text inside an iframe', () => {
    // Use the helper to get the payment iframe's body.
    // Once wrapped, you can use .find() to locate elements inside.
    getIframeBody('[data-testid="payment-iframe"]')
      .find('[data-testid="payment-title"]')      // find element inside the iframe body
      .should('have.text', 'Secure Payment Gateway');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Fill form inside iframe
  // --------------------------------------------------------------------------
  it('exercise 2: fill the payment form inside an iframe', () => {
    // Get the iframe body, then use .find() + .type() to fill fields.
    // Remember: Cypress type() appends text (fields start empty here, so that's fine).
    getIframeBody('[data-testid="payment-iframe"]').then(($body) => {
      // .find() scopes the search to the iframe body.
      cy.wrap($body).find('[data-testid="input-cardholder"]').type('Alice Johnson');
      cy.wrap($body).find('[data-testid="input-card-number"]').type('4242 4242 4242 4242');
      cy.wrap($body).find('[data-testid="input-amount"]').type('250.00');
      cy.wrap($body).find('[data-testid="select-currency"]').select('EUR');

      // Verify the values.
      cy.wrap($body).find('[data-testid="input-cardholder"]').should('have.value', 'Alice Johnson');
      cy.wrap($body).find('[data-testid="input-card-number"]').should('have.value', '4242 4242 4242 4242');
      cy.wrap($body).find('[data-testid="input-amount"]').should('have.value', '250.00');
      cy.wrap($body).find('[data-testid="select-currency"]').should('have.value', 'EUR');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Click button inside iframe and verify result
  // --------------------------------------------------------------------------
  it('exercise 3: submit the payment form and verify confirmation', () => {
    getIframeBody('[data-testid="payment-iframe"]').then(($body) => {
      // Fill the form.
      cy.wrap($body).find('[data-testid="input-cardholder"]').type('Bob Smith');
      cy.wrap($body).find('[data-testid="input-amount"]').type('99.99');
      cy.wrap($body).find('[data-testid="select-currency"]').select('GBP');

      // Click submit inside the iframe.
      cy.wrap($body).find('[data-testid="btn-submit-payment"]').click();

      // Verify the result message appeared inside the iframe.
      cy.wrap($body).find('[data-testid="payment-result"]')
        .should('be.visible')
        .and('contain.text', '99.99 GBP')
        .and('contain.text', 'Bob Smith');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Access Shadow DOM elements
  // --------------------------------------------------------------------------
  it('exercise 4: read text inside a shadow DOM component', () => {
    // Cypress needs { includeShadowDom: true } to pierce shadow roots.
    // This option tells cy.get() / .find() to search inside shadow DOM.
    cy.get('[data-testid="widget-title"]', { includeShadowDom: true })
      .should('have.text', 'Compliance Check');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Interact with Shadow DOM form
  // --------------------------------------------------------------------------
  it('exercise 5: fill and submit the compliance widget form', () => {
    // Each command that targets a shadow DOM element needs { includeShadowDom: true }.
    // Alternatively, set "includeShadowDom": true in cypress.config.ts globally.
    cy.get('[data-testid="input-entity-name"]', { includeShadowDom: true })
      .type('Acme Corp');

    cy.get('[data-testid="input-entity-id"]', { includeShadowDom: true })
      .type('ENT-007');

    cy.get('[data-testid="select-check-type"]', { includeShadowDom: true })
      .select('aml');

    // Click the button inside the shadow root.
    cy.get('[data-testid="btn-run-check"]', { includeShadowDom: true })
      .click();

    // Verify the status message.
    cy.get('[data-testid="check-status"]', { includeShadowDom: true })
      .should('be.visible')
      .and('contain.text', 'AML check passed for Acme Corp (ENT-007)');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Access nested iframes (iframe inside iframe)
  // --------------------------------------------------------------------------
  it('exercise 6: read content from a nested iframe', () => {
    // Step 1: Get the outer iframe body.
    getIframeBody('[data-testid="outer-iframe"]').then(($outerBody) => {
      // Verify content in the outer frame.
      cy.wrap($outerBody).find('[data-testid="outer-title"]')
        .should('have.text', 'Outer Audit Frame');

      cy.wrap($outerBody).find('[data-testid="outer-text"]')
        .should('contain.text', 'outer compliance audit layer');

      // Step 2: Get the inner iframe body from within the outer iframe.
      // We find the inner <iframe> element, then access its contentDocument.
      cy.wrap($outerBody)
        .find('[data-testid="inner-iframe"]')
        .its('0.contentDocument.body')
        .should('not.be.empty')
        .then(cy.wrap)
        .then(($innerBody) => {
          // Now we can assert on elements inside the nested iframe.
          cy.wrap($innerBody).find('[data-testid="inner-text"]')
            .should('contain.text', 'All checks passed')
            .and('contain.text', 'AUD-2026-0415');
        });
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Switch between multiple iframes
  // --------------------------------------------------------------------------
  it('exercise 7: interact with multiple iframes in sequence', () => {
    // In Cypress, there is no explicit "switch to frame" like Selenium.
    // You just get each iframe's body whenever you need it.

    // Access the payment iframe and fill a field.
    getIframeBody('[data-testid="payment-iframe"]')
      .find('[data-testid="input-cardholder"]')
      .type('Multi-Frame Test');

    // Access the terms iframe — no "switching" required.
    getIframeBody('[data-testid="terms-iframe"]')
      .find('[data-testid="terms-title"]')
      .should('have.text', 'Terms of Service v3.1');

    // Go back and verify the payment iframe still has the entered value.
    getIframeBody('[data-testid="payment-iframe"]')
      .find('[data-testid="input-cardholder"]')
      .should('have.value', 'Multi-Frame Test');

    // Access something on the main page (outside any iframe).
    cy.get('[data-testid="page-header"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Assert content across iframe boundary
  // --------------------------------------------------------------------------
  it('exercise 8: verify terms iframe content and accept on main page', () => {
    // Step 1: Read content from inside the terms iframe.
    getIframeBody('[data-testid="terms-iframe"]').then(($body) => {
      cy.wrap($body).find('[data-testid="terms-section-1"]')
        .should('contain.text', 'compliance regulations');

      cy.wrap($body).find('[data-testid="terms-last-updated"]')
        .should('have.text', 'Last updated: 2026-04-01');
    });

    // Step 2: Interact with elements on the MAIN page (not in iframe).
    // The checkbox and button are on the parent page, not inside the iframe.
    cy.get('[data-testid="terms-checkbox"]').check();
    cy.get('[data-testid="btn-accept-terms"]').click();

    // Step 3: Verify the result on the main page.
    cy.get('[data-testid="terms-result"]')
      .should('have.text', 'Terms accepted successfully. You may proceed.');
  });

});
