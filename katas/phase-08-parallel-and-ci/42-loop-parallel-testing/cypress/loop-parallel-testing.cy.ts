// =============================================================================
// Kata 42: Loop Parallel Testing — Cypress Tests
// =============================================================================
//
// This file generates tests dynamically from a JSON fixture file
// using forEach. Each applicant gets its own it() test block.
//
// Within this spec file, tests run SEQUENTIALLY (Cypress limitation).
// To achieve parallelism, run multiple spec files simultaneously
// using Cypress Cloud or manual CI job splitting.
// =============================================================================

const PLAYGROUND = '/phase-08-parallel-and-ci/42-loop-parallel-testing/playground/';

// Define the applicant type.
interface Applicant {
  name: string;
  email: string;
  country: string;
  docType: string;
  expectedRef: string;
  expectedStatus: 'success' | 'error';
  scenario: string;
}

// Import the fixture data directly for test generation.
// require() works at file load time, before tests run.
const applicants: Applicant[] = require('../fixtures/applicants.json');

// Split applicants by expected status.
const successApplicants = applicants.filter((a) => a.expectedStatus === 'success');
const errorApplicants = applicants.filter((a) => a.expectedStatus === 'error');

describe('Kata 42: Loop Parallel Testing', () => {

  // --------------------------------------------------------------------------
  // Exercise 1 & 2: Generate Tests from Fixture Data
  // --------------------------------------------------------------------------
  // forEach() iterates over the array and calls it() for each applicant.
  // Cypress registers all tests at file load time, then runs them sequentially.
  describe('exercise 1-2: success scenarios', () => {
    successApplicants.forEach((applicant) => {
      it(`submit KYC for ${applicant.name} [${applicant.scenario}]`, () => {
        // Set up the mock API response for this specific applicant.
        // cy.intercept(method, url, response) returns a fake response.
        cy.intercept('POST', '/api/kyc/submit', {
          statusCode: 200,
          body: { referenceId: applicant.expectedRef }
        }).as('submitKyc');

        // Navigate to the KYC form.
        cy.visit(PLAYGROUND);

        // Fill the form with this applicant's data.
        // .type(text) types into the input field.
        cy.get('[data-testid="full-name-input"]').type(applicant.name);
        cy.get('[data-testid="email-input"]').type(applicant.email);

        // .select(value) picks an option from a <select> dropdown.
        cy.get('[data-testid="country-select"]').select(applicant.country);
        cy.get('[data-testid="doc-type-select"]').select(applicant.docType);

        // Click submit.
        cy.get('[data-testid="submit-btn"]').click();

        // Wait for the intercepted request to complete.
        cy.wait('@submitKyc');

        // Verify the success message shows this applicant's reference.
        cy.get('[data-testid="submit-status"]')
          .should('contain.text', applicant.expectedRef)
          .and('have.class', 'status-success');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Adding a New Applicant
  // --------------------------------------------------------------------------
  // To add a new test:
  //   1. Open fixtures/applicants.json
  //   2. Add a new object with name, email, country, etc.
  //   3. Run tests — a new it() block appears automatically
  //
  // No changes to this test file are needed. Data drives the tests.

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Unique Mock Responses
  // --------------------------------------------------------------------------
  it('exercise 4: verify all applicant refs are unique', () => {
    // Extract all expected reference IDs from the fixture.
    const allRefs = successApplicants.map((a) => a.expectedRef);

    // Create a Set (which removes duplicates) and check the size.
    const uniqueRefs = new Set(allRefs);

    // If all refs are unique, the Set size equals the array length.
    expect(uniqueRefs.size).to.equal(allRefs.length);
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Error Scenario Tests from Data
  // --------------------------------------------------------------------------
  describe('exercise 5: error scenarios', () => {
    errorApplicants.forEach((applicant) => {
      it(`error scenario: ${applicant.scenario}`, () => {
        // Mock a 400 error response.
        cy.intercept('POST', '/api/kyc/submit', {
          statusCode: 400,
          body: { error: 'Validation failed' }
        }).as('submitKyc');

        cy.visit(PLAYGROUND);

        // Fill with the (possibly invalid) fixture data.
        // If name is empty, type a space (Cypress requires non-empty type).
        cy.get('[data-testid="full-name-input"]').type(applicant.name || ' ');
        cy.get('[data-testid="email-input"]').type(applicant.email);
        cy.get('[data-testid="country-select"]').select(applicant.country);
        cy.get('[data-testid="doc-type-select"]').select(applicant.docType);

        cy.get('[data-testid="submit-btn"]').click();
        cy.wait('@submitKyc');

        // Verify the error status is displayed.
        cy.get('[data-testid="submit-status"]')
          .should('have.class', 'status-error');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Summary and Scaling Notes
  // --------------------------------------------------------------------------
  it('exercise 6: loop testing summary', () => {
    // This file generated tests automatically:
    //
    // - Success tests: one per applicant with expectedStatus 'success'
    // - Error tests: one per applicant with expectedStatus 'error'
    //
    // SCALING IN CYPRESS:
    //   Since Cypress runs tests sequentially within a file, to achieve
    //   parallelism with loop-generated tests, split them across files:
    //
    //   File 1: loop-applicants-group-1.cy.ts (applicants 1-25)
    //   File 2: loop-applicants-group-2.cy.ts (applicants 26-50)
    //   File 3: loop-applicants-group-3.cy.ts (applicants 51-75)
    //   File 4: loop-applicants-group-4.cy.ts (applicants 76-100)
    //
    //   Then run all 4 files in parallel across CI machines.
    //
    // SCALING IN PLAYWRIGHT:
    //   Just increase --workers. No file splitting needed.
    //   Playwright distributes individual tests across workers automatically.

    const totalTests = successApplicants.length + errorApplicants.length;
    cy.log(`Generated ${totalTests} tests from fixture data`);

    cy.visit('data:text/html,<h1>Loop Testing Complete</h1>');
    cy.get('h1').should('have.text', 'Loop Testing Complete');
  });
});
