// =============================================================================
// KYC Form Page Object — Cypress Version
// =============================================================================
//
// In Cypress, we do NOT use classes. Cypress discourages the class-based
// pattern because Cypress commands are chainable and synchronous-looking
// (they queue commands internally). Classes with `this` can cause confusion.
//
// Instead, we use a PLAIN OBJECT with methods. Each method calls Cypress
// commands directly (cy.get, cy.type, cy.click, etc.).
//
// This object is exported and imported in test files:
//   import { kycFormPage } from './pages/kyc-form.page';
// =============================================================================

// The playground URL for the KYC form.
const PLAYGROUND = '/phase-07-advanced-patterns/37-page-object-model/playground/';

/**
 * kycFormPage — a plain object containing all interactions with the KYC form.
 *
 * Why a plain object instead of a class?
 * - Cypress commands are NOT Promises — they are chainable commands
 * - Using `this` in Cypress can cause issues with command chaining
 * - Plain objects are simpler and match Cypress's functional style
 */
export const kycFormPage = {

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Visit the KYC form playground page.
   * cy.visit(url) navigates the browser to the given URL.
   */
  visit() {
    cy.visit(PLAYGROUND);
  },

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Type a name into the Full Name field.
   *
   * cy.get(selector) finds the element in the DOM.
   * .clear() removes any existing text.
   * .type(text) types the text into the field.
   *
   * @param name — the full name to enter
   */
  fillName(name: string) {
    cy.get('[data-testid="full-name-input"]').clear().type(name);
  },

  /**
   * Type an email into the Email field.
   *
   * @param email — the email address to enter
   */
  fillEmail(email: string) {
    cy.get('[data-testid="email-input"]').clear().type(email);
  },

  /**
   * Select a country from the Country dropdown.
   *
   * cy.get(selector).select(value) picks an option from a <select> element.
   * The value must match the <option>'s value attribute.
   *
   * @param countryCode — the country code (e.g., 'US', 'IN', 'GB')
   */
  selectCountry(countryCode: string) {
    cy.get('[data-testid="country-select"]').select(countryCode);
  },

  /**
   * Select a document type from the Document Type dropdown.
   *
   * @param docType — the document type (e.g., 'passport', 'drivers-license')
   */
  selectDocType(docType: string) {
    cy.get('[data-testid="doc-type-select"]').select(docType);
  },

  /**
   * Click the Submit KYC button.
   */
  submit() {
    cy.get('[data-testid="submit-btn"]').click();
  },

  /**
   * Fill the entire form in one call.
   * This convenience method fills all fields from a data object.
   *
   * @param data — an object with name, email, and optional country/docType
   */
  fillForm(data: {
    name: string;
    email: string;
    country?: string;
    docType?: string;
  }) {
    this.fillName(data.name);
    this.fillEmail(data.email);
    if (data.country) {
      this.selectCountry(data.country);
    }
    if (data.docType) {
      this.selectDocType(data.docType);
    }
  },

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert that the submission succeeded and shows the expected reference ID.
   *
   * .should('contain.text', text) asserts the element's text includes the value.
   * .and('have.class', cls) chains another assertion on the same element.
   *
   * @param referenceId — the expected reference ID in the success message
   */
  expectSuccess(referenceId: string) {
    cy.get('[data-testid="submit-status"]')
      .should('contain.text', referenceId)
      .and('have.class', 'status-success');
  },

  /**
   * Assert that the submission failed and shows an error.
   *
   * @param errorText — the expected error message text
   */
  expectError(errorText: string) {
    cy.get('[data-testid="submit-status"]')
      .should('contain.text', errorText)
      .and('have.class', 'status-error');
  }
};
