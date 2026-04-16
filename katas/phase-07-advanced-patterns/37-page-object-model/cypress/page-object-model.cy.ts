import { kycFormPage } from './pages/kyc-form.page';

// =============================================================================
// Kata 37: Page Object Model — Cypress Tests
// =============================================================================
// These tests demonstrate the POM pattern in Cypress.
// Exercises 1-3 show tests WITHOUT POM (raw selectors).
// Exercises 4-6 show the SAME tests WITH POM (clean and reusable).
// =============================================================================

const PLAYGROUND = '/phase-07-advanced-patterns/37-page-object-model/playground/';

describe('Kata 37: Page Object Model', () => {

  // --------------------------------------------------------------------------
  // Exercise 1: Test WITHOUT POM — Raw Selectors Everywhere
  // --------------------------------------------------------------------------
  // Notice how selectors like '[data-testid="full-name-input"]' are repeated
  // in every test. If the data-testid changes, you must fix EVERY test.
  it('exercise 1: submit KYC WITHOUT POM (raw selectors)', () => {
    // cy.intercept() sets up request interception BEFORE the action happens.
    // 'POST' — the HTTP method to match.
    // '/api/kyc/submit' — the URL pattern to match.
    // { statusCode, body } — the mock response to return.
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-RAW-001' }
    }).as('submitKyc');

    // Navigate to the page.
    cy.visit(PLAYGROUND);

    // Fill fields with raw selectors.
    cy.get('[data-testid="full-name-input"]').type('Aisha Patel');
    cy.get('[data-testid="email-input"]').type('aisha@example.com');
    cy.get('[data-testid="country-select"]').select('IN');
    cy.get('[data-testid="doc-type-select"]').select('passport');

    // Click submit.
    cy.get('[data-testid="submit-btn"]').click();

    // Wait for the intercepted request to complete.
    cy.wait('@submitKyc');

    // Assert with raw selectors.
    cy.get('[data-testid="submit-status"]')
      .should('contain.text', 'KYC-RAW-001')
      .and('have.class', 'status-success');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Another Test WITHOUT POM — Same Selectors Again
  // --------------------------------------------------------------------------
  // This second test repeats ALL the same selectors. Imagine 50 tests
  // like this — that is 50 places to update when a selector changes.
  it('exercise 2: submit different applicant WITHOUT POM', () => {
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-RAW-002' }
    }).as('submitKyc');

    cy.visit(PLAYGROUND);

    // Same selectors, different data.
    cy.get('[data-testid="full-name-input"]').type('Carlos Rivera');
    cy.get('[data-testid="email-input"]').type('carlos@example.com');
    cy.get('[data-testid="country-select"]').select('US');

    cy.get('[data-testid="submit-btn"]').click();
    cy.wait('@submitKyc');

    cy.get('[data-testid="submit-status"]')
      .should('contain.text', 'KYC-RAW-002');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Test Error WITHOUT POM
  // --------------------------------------------------------------------------
  it('exercise 3: test error handling WITHOUT POM', () => {
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('submitKyc');

    cy.visit(PLAYGROUND);

    cy.get('[data-testid="full-name-input"]').type('Error User');
    cy.get('[data-testid="email-input"]').type('error@example.com');
    cy.get('[data-testid="submit-btn"]').click();
    cy.wait('@submitKyc');

    cy.get('[data-testid="submit-status"]')
      .should('have.class', 'status-error');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Same Test WITH POM — Clean and Readable
  // --------------------------------------------------------------------------
  // Compare this to Exercise 1. The test reads like a user story.
  // No selectors visible. If a selector changes, you fix kyc-form.page.ts
  // and ALL tests continue working.
  it('exercise 4: submit KYC WITH POM (page object)', () => {
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-POM-001' }
    }).as('submitKyc');

    // Use the Page Object to navigate.
    kycFormPage.visit();

    // Use the Page Object to fill the form.
    kycFormPage.fillName('Aisha Patel');
    kycFormPage.fillEmail('aisha@example.com');
    kycFormPage.selectCountry('IN');
    kycFormPage.selectDocType('passport');

    // Use the Page Object to submit.
    kycFormPage.submit();

    cy.wait('@submitKyc');

    // Use the Page Object to assert.
    kycFormPage.expectSuccess('KYC-POM-001');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Use fillForm() Convenience Method
  // --------------------------------------------------------------------------
  // The fillForm() method accepts a data object — perfect for data-driven tests.
  it('exercise 5: fill form with one method call using POM', () => {
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-POM-002' }
    }).as('submitKyc');

    kycFormPage.visit();

    // One method call fills everything.
    kycFormPage.fillForm({
      name: 'Carlos Rivera',
      email: 'carlos@example.com',
      country: 'US',
      docType: 'drivers-license'
    });

    kycFormPage.submit();
    cy.wait('@submitKyc');
    kycFormPage.expectSuccess('KYC-POM-002');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Error Testing WITH POM
  // --------------------------------------------------------------------------
  // Compare to Exercise 3. The intent is immediately clear.
  it('exercise 6: test error handling WITH POM', () => {
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('submitKyc');

    kycFormPage.visit();

    kycFormPage.fillForm({
      name: 'Error User',
      email: 'error@example.com'
    });

    kycFormPage.submit();
    cy.wait('@submitKyc');

    // expectError checks for the error class and text — clean and reusable.
    kycFormPage.expectError('error');
  });
});
