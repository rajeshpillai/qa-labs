// The base path to this kata's playground.
// Cypress prepends the baseUrl (http://localhost:8080) to this path.
const PLAYGROUND = '/phase-00-foundations/01-selectors-and-locators/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Find by Test ID
// --------------------------------------------------------------------------
describe('Kata 01: Selectors and Locators', () => {

  // beforeEach runs before every test in this describe block.
  // We visit the playground page so each test starts fresh.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  it('exercise 1: find submit button by data-testid', () => {
    // cy.get accepts a CSS selector. For data-testid, use the attribute selector.
    // [data-testid="btn-submit"] matches <button data-testid="btn-submit">.
    cy.get('[data-testid="btn-submit"]')
      // .should is a Cypress assertion. It automatically retries until
      // the assertion passes or the timeout (default 4s) expires.
      .should('have.text', 'Submit Application');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Find by Role
  // --------------------------------------------------------------------------
  it('exercise 2: find navigation link by text', () => {
    // cy.contains(selector, text) finds an element matching the CSS selector
    // that also contains the specified text. This is similar to Playwright's
    // getByRole('link', { name: 'Dashboard' }).
    cy.contains('a', 'Dashboard')
      .should('be.visible');

    // Find the main heading by tag and verify its text.
    cy.get('h1')
      .should('have.text', 'KYC Portal - Selectors Practice');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Find by Label and Placeholder
  // --------------------------------------------------------------------------
  it('exercise 3: find inputs by label and placeholder', () => {
    // Cypress doesn't have a built-in getByLabel, but we can use the
    // label's "for" attribute to find the associated input.
    // Step 1: Find the label containing "Full Name"
    // Step 2: Get its "for" attribute
    // Step 3: Use that to find the input by ID
    cy.contains('label', 'Full Name')
      .invoke('attr', 'for')    // gets the "for" attribute value
      .then((forAttr) => {
        cy.get(`#${forAttr}`)   // finds input by the ID referenced in "for"
          .should('be.visible');
      });

    // Alternatively, find by placeholder directly.
    // The attribute selector [placeholder="..."] matches the placeholder text.
    cy.get('[placeholder="+1 (555) 000-0000"]')
      .should('be.visible');

    // Type into the name field and verify the value.
    // cy.type() simulates keystrokes one character at a time.
    // Unlike Playwright's fill(), it does NOT clear the field first.
    // Use .clear() before .type() if you need to replace existing text.
    cy.get('[data-testid="input-full-name"]')
      .clear()
      .type('Test User')
      .should('have.value', 'Test User');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Find Within a Parent
  // --------------------------------------------------------------------------
  it('exercise 4: find elements within a parent card', () => {
    // .within() scopes all subsequent cy commands to the parent element.
    // This is equivalent to Playwright's chained locators.
    cy.get('[data-testid="applicant-card-1"]').within(() => {
      // All cy.get and cy.contains calls here only search within the card.
      cy.get('[data-testid="applicant-name-1"]')
        .should('have.text', 'John Doe');

      cy.get('[data-testid="applicant-email-1"]')
        .should('have.text', 'john.doe@example.com');

      cy.get('[data-testid="applicant-status-1"]')
        .should('have.text', 'Approved');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Work With a Table
  // --------------------------------------------------------------------------
  it('exercise 5: find table row and verify contents', () => {
    // .find() searches for descendant elements within the subject.
    // Unlike cy.get(), it must be chained from a parent element.
    cy.get('[data-testid="table-row-2"]').within(() => {
      cy.get('[data-testid="cell-name-2"]')
        .should('have.text', 'Jane Smith');

      cy.contains('Pending')
        .should('be.visible');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Select From Multiple Elements
  // --------------------------------------------------------------------------
  it('exercise 6: find last applicant card', () => {
    // Attribute selector with ^= (starts with) matches all cards.
    cy.get('[data-testid^="applicant-card-"]')
      // .should('have.length', N) verifies the number of matched elements.
      .should('have.length', 3);

    // .last() returns the last element in the set.
    cy.get('[data-testid^="applicant-card-"]')
      .last()
      .find('[data-testid="applicant-name-3"]')
      .should('have.text', 'Raj Kumar');

    // .eq(index) returns the element at the specified 0-based index.
    // .eq(0) is the first element.
    cy.get('[data-testid^="applicant-card-"]')
      .eq(0)
      .find('[data-testid="applicant-name-1"]')
      .should('have.text', 'John Doe');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Text Matching
  // --------------------------------------------------------------------------
  it('exercise 7: find elements by text content', () => {
    // cy.contains finds the first element matching the text.
    cy.contains('Identity Verification')
      .should('be.visible');

    // Count all list items in the checklist.
    cy.get('[data-testid="checklist"] li')
      .should('have.length', 5);

    // Verify a specific item exists.
    cy.contains('Sanctions Screening')
      .should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Toggle Visibility
  // --------------------------------------------------------------------------
  it('exercise 8: toggle panel visibility', () => {
    // The panel starts hidden. In Cypress, "not.be.visible" checks that
    // the element exists in the DOM but is not visible (display: none, etc.).
    cy.get('[data-testid="details-panel"]')
      .should('not.be.visible');

    // Click the toggle button to show the panel.
    cy.get('[data-testid="btn-toggle-panel"]').click();

    // Now the panel should be visible.
    cy.get('[data-testid="details-panel"]')
      .should('be.visible');

    // Verify panel content.
    cy.get('[data-testid="panel-content"]')
      .should('contain.text', 'KYC-001');

    // Click again to hide.
    cy.get('[data-testid="btn-toggle-panel"]').click();

    cy.get('[data-testid="details-panel"]')
      .should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 9: Interact With Search
  // --------------------------------------------------------------------------
  it('exercise 9: search and verify results', () => {
    // Type into the search box. Cypress auto-retries assertions,
    // so it will wait for the search results to appear.
    cy.get('[data-testid="input-search"]')
      .type('John');

    // Verify search results appear.
    cy.get('[data-testid="search-result-item"]')
      .should('have.length', 1)
      .first()
      .should('contain.text', 'KYC-001')
      .and('contain.text', 'John Doe');
  });

  // --------------------------------------------------------------------------
  // Exercise 10: Disabled Button
  // --------------------------------------------------------------------------
  it('exercise 10: verify button is disabled', () => {
    // 'be.disabled' checks the HTML disabled attribute.
    cy.get('[data-testid="btn-reject-selected"]')
      .should('be.visible')
      .and('be.disabled');

    // Compare with an enabled button.
    cy.get('[data-testid="btn-new-application"]')
      .should('be.enabled');
  });

});
