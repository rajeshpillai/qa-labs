// =============================================================================
// Kata 40: Test Data and Fixtures — Cypress Tests
// =============================================================================
// These tests demonstrate Cypress's cy.fixture() for loading test data
// and data-driven testing patterns.
//
// cy.fixture(path) loads a JSON file from the cypress/fixtures/ directory.
// The path is relative to cypress/fixtures/.
// =============================================================================

const PLAYGROUND = '/phase-07-advanced-patterns/40-test-data-and-fixtures/playground/';

// Define the applicant type for clarity.
interface Applicant {
  name: string;
  email: string;
  country: string;
  docType: string;
  expectedRef: string;
  scenario: string;
}

describe('Kata 40: Test Data and Fixtures', () => {

  // --------------------------------------------------------------------------
  // Exercise 1: Load Fixture with cy.fixture()
  // --------------------------------------------------------------------------
  // cy.fixture() loads a JSON file and makes it available in the test.
  it('exercise 1: load fixture and use first applicant', () => {
    // cy.fixture(filePath) loads a JSON file from cypress/fixtures/.
    // The path 'applicants.json' resolves to cypress/fixtures/applicants.json.
    // .then() receives the parsed JSON data.
    //
    // NOTE: The fixture path here is relative to THIS kata's cypress/fixtures/
    // directory. In a real project, you would configure the fixturesFolder
    // in cypress.config.ts or use the full path.
    cy.fixture('applicants.json').then((applicants: Applicant[]) => {
      const applicant = applicants[0];

      // Set up the mock response BEFORE visiting the page.
      cy.intercept('POST', '/api/kyc/submit', {
        statusCode: 200,
        body: { referenceId: applicant.expectedRef }
      }).as('submitKyc');

      cy.visit(PLAYGROUND);

      // Fill the form using fixture data.
      cy.get('[data-testid="full-name-input"]').type(applicant.name);
      cy.get('[data-testid="email-input"]').type(applicant.email);
      cy.get('[data-testid="country-select"]').select(applicant.country);
      cy.get('[data-testid="doc-type-select"]').select(applicant.docType);

      cy.get('[data-testid="submit-btn"]').click();
      cy.wait('@submitKyc');

      // Assert using the fixture's expected reference.
      cy.get('[data-testid="submit-status"]')
        .should('contain.text', applicant.expectedRef)
        .and('have.class', 'status-success');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Parameterized Tests with forEach
  // --------------------------------------------------------------------------
  // In Cypress, you generate parameterized tests by loading the fixture
  // OUTSIDE the test and looping with forEach.
  //
  // IMPORTANT: cy.fixture() is async and only works inside Cypress commands.
  // For dynamic test generation, you can import the JSON directly.

  // Import the fixture data directly for test generation.
  // This works because the file is a static JSON file.
  const applicants: Applicant[] = require('./fixtures/applicants.json');

  applicants.forEach((applicant) => {
    it(`exercise 2: submit KYC for ${applicant.name} (${applicant.scenario})`, () => {
      cy.intercept('POST', '/api/kyc/submit', {
        statusCode: 200,
        body: { referenceId: applicant.expectedRef }
      }).as('submitKyc');

      cy.visit(PLAYGROUND);

      cy.get('[data-testid="full-name-input"]').type(applicant.name);
      cy.get('[data-testid="email-input"]').type(applicant.email);
      cy.get('[data-testid="country-select"]').select(applicant.country);
      cy.get('[data-testid="doc-type-select"]').select(applicant.docType);

      cy.get('[data-testid="submit-btn"]').click();
      cy.wait('@submitKyc');

      cy.get('[data-testid="submit-status"]')
        .should('contain.text', applicant.expectedRef)
        .and('have.class', 'status-success');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Fixture with Aliases (this.* pattern)
  // --------------------------------------------------------------------------
  // cy.fixture().as('alias') makes data available via this.alias.
  // NOTE: You MUST use function() syntax, NOT arrow functions,
  // because arrow functions don't have their own `this` context.
  describe('exercise 3: fixture aliases', function () {
    // Load the fixture in beforeEach and alias it.
    beforeEach(function () {
      // .as('applicantData') stores the fixture data on `this.applicantData`.
      cy.fixture('applicants.json').as('applicantData');
    });

    it('should use aliased fixture data', function () {
      // Access the fixture data via this.applicantData.
      // This only works with function() — NOT with arrow functions () => {}.
      const applicant = (this.applicantData as Applicant[])[1];

      cy.intercept('POST', '/api/kyc/submit', {
        statusCode: 200,
        body: { referenceId: applicant.expectedRef }
      }).as('submitKyc');

      cy.visit(PLAYGROUND);

      cy.get('[data-testid="full-name-input"]').type(applicant.name);
      cy.get('[data-testid="email-input"]').type(applicant.email);
      cy.get('[data-testid="country-select"]').select(applicant.country);

      cy.get('[data-testid="submit-btn"]').click();
      cy.wait('@submitKyc');

      cy.get('[data-testid="submit-status"]')
        .should('contain.text', applicant.expectedRef);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Dynamic Data Factory
  // --------------------------------------------------------------------------
  // A factory function creates unique data for each test run.
  it('exercise 4: use dynamic data factory', () => {
    /**
     * createApplicant — generates a unique applicant object.
     *
     * @param overrides — custom fields to merge with defaults
     * @returns a complete Applicant object with a unique timestamp-based email
     */
    function createApplicant(overrides: Partial<Applicant> = {}): Applicant {
      const ts = Date.now();
      return {
        name: `Test User ${ts}`,
        email: `test-${ts}@example.com`,
        country: 'US',
        docType: 'passport',
        expectedRef: `KYC-DYN-${ts}`,
        scenario: 'dynamic',
        ...overrides  // spread operator merges overrides on top of defaults
      };
    }

    const applicant = createApplicant({ name: 'Dynamic Cypress User' });

    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: applicant.expectedRef }
    }).as('submitKyc');

    cy.visit(PLAYGROUND);

    cy.get('[data-testid="full-name-input"]').type(applicant.name);
    cy.get('[data-testid="email-input"]').type(applicant.email);
    cy.get('[data-testid="country-select"]').select(applicant.country);

    cy.get('[data-testid="submit-btn"]').click();
    cy.wait('@submitKyc');

    cy.get('[data-testid="submit-status"]')
      .should('contain.text', applicant.expectedRef);
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Filter Fixture Data
  // --------------------------------------------------------------------------
  // Run tests only for applicants matching a specific criteria.
  const usApplicants = applicants.filter((a) => a.country === 'US');

  usApplicants.forEach((applicant) => {
    it(`exercise 5: US-only test for ${applicant.name}`, () => {
      cy.intercept('POST', '/api/kyc/submit', {
        statusCode: 200,
        body: { referenceId: applicant.expectedRef }
      }).as('submitKyc');

      cy.visit(PLAYGROUND);

      cy.get('[data-testid="full-name-input"]').type(applicant.name);
      cy.get('[data-testid="email-input"]').type(applicant.email);
      cy.get('[data-testid="country-select"]').select(applicant.country);
      cy.get('[data-testid="doc-type-select"]').select(applicant.docType);

      cy.get('[data-testid="submit-btn"]').click();
      cy.wait('@submitKyc');

      // Verify country is US (sanity check from fixture data).
      expect(applicant.country).to.equal('US');

      cy.get('[data-testid="submit-status"]')
        .should('contain.text', applicant.expectedRef);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Error Scenario with Fixture Data
  // --------------------------------------------------------------------------
  // Use fixture data to drive error scenario tests.
  it('exercise 6: test error scenario with factory data', () => {
    // Simulate a server rejection for invalid data.
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 400,
      body: { error: 'Validation failed: name is required' }
    }).as('submitKyc');

    cy.visit(PLAYGROUND);

    // Submit with minimal data to trigger an error.
    cy.get('[data-testid="full-name-input"]').type(' ');
    cy.get('[data-testid="email-input"]').type('bad-email');

    cy.get('[data-testid="submit-btn"]').click();
    cy.wait('@submitKyc');

    // Verify the error response is displayed.
    cy.get('[data-testid="submit-status"]')
      .should('have.class', 'status-error');
  });
});
