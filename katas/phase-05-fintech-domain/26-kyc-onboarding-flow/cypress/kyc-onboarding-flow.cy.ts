const PLAYGROUND = '/phase-05-fintech-domain/26-kyc-onboarding-flow/playground/';

// ─── Helper: fillPersonalInfo ────────────────────────────────────────
// Fills the personal info form (step 2) with the given data.
// cy.get().clear().type() clears any existing value and types new text.
// cy.get().select(value) selects the <option> with the matching value.
function fillPersonalInfo(data: {
  firstName: string; lastName: string; email: string; dob: string; country: string;
}) {
  cy.get('[data-testid="input-first-name"]').clear().type(data.firstName);
  cy.get('[data-testid="input-last-name"]').clear().type(data.lastName);
  cy.get('[data-testid="input-email"]').clear().type(data.email);
  cy.get('[data-testid="input-dob"]').clear().type(data.dob);
  cy.get('[data-testid="select-country"]').select(data.country);
}

// ─── Helper: uploadDocument ──────────────────────────────────────────
// Selects a document type and simulates a file upload.
// cy.get().selectFile() creates a synthetic file and triggers the file input's change event.
// { force: true } is needed because the file input is hidden (display:none).
function uploadDocument(docType: string = 'passport', fileName: string = 'passport.pdf') {
  cy.get('[data-testid="select-doc-type"]').select(docType);
  cy.get('[data-testid="file-input"]').selectFile({
    contents: Cypress.Buffer.from('fake-pdf-content'),
    fileName: fileName,
    mimeType: 'application/pdf'
  }, { force: true });
}

// Default test data used across exercises.
const DEFAULT_DATA = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  dob: '1990-05-15',
  country: 'US'
};

describe('Kata 26: KYC Onboarding Flow', () => {

  // beforeEach runs before every test. We navigate to the playground
  // so each test starts with a fresh page state.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Complete Happy Path End-to-End
  // --------------------------------------------------------------------------
  // Walk through all 5 steps and verify the success result page appears.
  it('exercise 1: complete happy path end-to-end', () => {
    // Step 1: Welcome — click "Get Started".
    cy.get('[data-testid="step-welcome"]').should('be.visible');
    cy.get('[data-testid="btn-start"]').click();

    // Step 2: Personal Info — fill and click "Next".
    cy.get('[data-testid="step-personal"]').should('be.visible');
    fillPersonalInfo(DEFAULT_DATA);
    cy.get('[data-testid="btn-next-personal"]').click();

    // Step 3: Document Upload — select type, upload, click "Next".
    cy.get('[data-testid="step-document"]').should('be.visible');
    uploadDocument();
    cy.get('[data-testid="btn-next-document"]').click();

    // Step 4: Review — verify visible, then submit.
    cy.get('[data-testid="step-review"]').should('be.visible');
    cy.get('[data-testid="btn-submit"]').click();

    // Step 5: Result — wait for the result to appear (1s submit delay).
    // { timeout: 3000 } gives Cypress extra time to retry the assertion.
    cy.get('[data-testid="step-result"]', { timeout: 3000 }).should('be.visible');
    cy.get('[data-testid="result-title"]').should('have.text', 'Application Submitted');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Each Step Content
  // --------------------------------------------------------------------------
  // Navigate through each step and verify its heading and key elements.
  it('exercise 2: verify each step content', () => {
    // Step 1: Welcome.
    cy.get('[data-testid="step-welcome"]').should('be.visible')
      .and('contain.text', 'Welcome to KYC Onboarding');
    cy.get('[data-testid="btn-start"]').click();

    // Step 2: Personal Info — verify form fields are visible.
    cy.get('[data-testid="step-personal"]').should('be.visible');
    cy.get('[data-testid="input-first-name"]').should('be.visible');
    cy.get('[data-testid="input-email"]').should('be.visible');
    cy.get('[data-testid="select-country"]').should('be.visible');

    // Fill and advance.
    fillPersonalInfo(DEFAULT_DATA);
    cy.get('[data-testid="btn-next-personal"]').click();

    // Step 3: Document Upload — verify upload area is visible.
    cy.get('[data-testid="step-document"]').should('be.visible');
    cy.get('[data-testid="upload-area"]').should('be.visible');
    cy.get('[data-testid="select-doc-type"]').should('be.visible');

    // Fill and advance.
    uploadDocument();
    cy.get('[data-testid="btn-next-document"]').click();

    // Step 4: Review — verify the review table is visible.
    cy.get('[data-testid="step-review"]').should('be.visible');
    cy.get('[data-testid="review-table"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Navigate Back and Forth
  // --------------------------------------------------------------------------
  // Go forward, then back, and verify entered data is preserved.
  it('exercise 3: navigate back and forth', () => {
    // Go to step 2 and fill data.
    cy.get('[data-testid="btn-start"]').click();
    fillPersonalInfo(DEFAULT_DATA);

    // Advance to step 3.
    cy.get('[data-testid="btn-next-personal"]').click();
    cy.get('[data-testid="step-document"]').should('be.visible');

    // Navigate back to step 2.
    cy.get('[data-testid="btn-back-document"]').click();
    cy.get('[data-testid="step-personal"]').should('be.visible');

    // Verify the data is still present.
    // .should('have.value', value) checks the input's current value.
    cy.get('[data-testid="input-first-name"]').should('have.value', 'John');
    cy.get('[data-testid="input-last-name"]').should('have.value', 'Doe');
    cy.get('[data-testid="input-email"]').should('have.value', 'john.doe@example.com');
    cy.get('[data-testid="select-country"]').should('have.value', 'US');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Review Page Data
  // --------------------------------------------------------------------------
  // Fill in all data, then verify the review page shows every field correctly.
  it('exercise 4: verify review page data', () => {
    cy.get('[data-testid="btn-start"]').click();
    fillPersonalInfo(DEFAULT_DATA);
    cy.get('[data-testid="btn-next-personal"]').click();
    uploadDocument('passport', 'my-passport.pdf');
    cy.get('[data-testid="btn-next-document"]').click();

    // Verify each review field matches the entered data.
    cy.get('[data-testid="review-first-name"]').should('have.text', 'John');
    cy.get('[data-testid="review-last-name"]').should('have.text', 'Doe');
    cy.get('[data-testid="review-email"]').should('have.text', 'john.doe@example.com');
    cy.get('[data-testid="review-dob"]').should('have.text', '1990-05-15');
    cy.get('[data-testid="review-country"]').should('have.text', 'United States');
    cy.get('[data-testid="review-doc-type"]').should('have.text', 'Passport');
    cy.get('[data-testid="review-doc-file"]').should('have.text', 'my-passport.pdf');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Submit and Verify Success
  // --------------------------------------------------------------------------
  // Complete the flow and verify all elements of the success result page.
  it('exercise 5: submit and verify success', () => {
    cy.get('[data-testid="btn-start"]').click();
    fillPersonalInfo(DEFAULT_DATA);
    cy.get('[data-testid="btn-next-personal"]').click();
    uploadDocument();
    cy.get('[data-testid="btn-next-document"]').click();
    cy.get('[data-testid="btn-submit"]').click();

    // Wait for the result step (1s submission delay).
    cy.get('[data-testid="step-result"]', { timeout: 3000 }).should('be.visible');
    cy.get('[data-testid="result-title"]').should('have.text', 'Application Submitted');
    cy.get('[data-testid="result-message"]').should('contain.text', 'submitted successfully');

    // Verify the reference number starts with "KYC-".
    // .should('contain.text', text) checks that the element's text includes the substring.
    cy.get('[data-testid="result-ref"]').should('contain.text', 'Reference: KYC-');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Validate Required Fields Per Step
  // --------------------------------------------------------------------------
  // Try to advance without filling fields and verify validation errors appear.
  it('exercise 6: validate required fields per step', () => {
    cy.get('[data-testid="btn-start"]').click();

    // Click "Next" without filling anything.
    cy.get('[data-testid="btn-next-personal"]').click();

    // Verify we're still on step 2.
    cy.get('[data-testid="step-personal"]').should('be.visible');

    // Verify all error messages are visible.
    cy.get('[data-testid="error-first-name"]').should('be.visible');
    cy.get('[data-testid="error-last-name"]').should('be.visible');
    cy.get('[data-testid="error-email"]').should('be.visible');
    cy.get('[data-testid="error-dob"]').should('be.visible');
    cy.get('[data-testid="error-country"]').should('be.visible');

    // Fill fields and advance to step 3.
    fillPersonalInfo(DEFAULT_DATA);
    cy.get('[data-testid="btn-next-personal"]').click();
    cy.get('[data-testid="step-document"]').should('be.visible');

    // Click "Next" on step 3 without uploading.
    cy.get('[data-testid="btn-next-document"]').click();

    // Verify we're still on step 3 with errors.
    cy.get('[data-testid="step-document"]').should('be.visible');
    cy.get('[data-testid="error-doc-type"]').should('be.visible');
    cy.get('[data-testid="error-upload"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Progress Indicator
  // --------------------------------------------------------------------------
  // At each step, verify the progress bar highlights the correct step.
  it('exercise 7: verify progress indicator', () => {
    // Step 1: step 1 is active.
    cy.get('[data-testid="progress-step-1"]').should('have.class', 'active');
    cy.get('[data-testid="progress-step-2"]').should('not.have.class', 'active')
      .and('not.have.class', 'completed');

    // Move to step 2.
    cy.get('[data-testid="btn-start"]').click();
    cy.get('[data-testid="progress-step-1"]').should('have.class', 'completed');
    cy.get('[data-testid="progress-step-2"]').should('have.class', 'active');
    cy.get('[data-testid="progress-step-3"]').should('not.have.class', 'active')
      .and('not.have.class', 'completed');

    // Move to step 3.
    fillPersonalInfo(DEFAULT_DATA);
    cy.get('[data-testid="btn-next-personal"]').click();
    cy.get('[data-testid="progress-step-1"]').should('have.class', 'completed');
    cy.get('[data-testid="progress-step-2"]').should('have.class', 'completed');
    cy.get('[data-testid="progress-step-3"]').should('have.class', 'active');

    // Move to step 4.
    uploadDocument();
    cy.get('[data-testid="btn-next-document"]').click();
    cy.get('[data-testid="progress-step-3"]').should('have.class', 'completed');
    cy.get('[data-testid="progress-step-4"]').should('have.class', 'active');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Test With Different Applicant Data
  // --------------------------------------------------------------------------
  // Run the flow with different data and test the failure scenario.
  it('exercise 8: test with different applicant data', () => {
    // Data set 1: Alice, UK, driver's license.
    const data1 = {
      firstName: 'Alice', lastName: 'Smith',
      email: 'alice@example.com', dob: '1985-12-01', country: 'UK'
    };

    cy.get('[data-testid="btn-start"]').click();
    fillPersonalInfo(data1);
    cy.get('[data-testid="btn-next-personal"]').click();
    uploadDocument('drivers-license', 'license.jpg');
    cy.get('[data-testid="btn-next-document"]').click();

    // Verify review shows Alice's data.
    cy.get('[data-testid="review-first-name"]').should('have.text', 'Alice');
    cy.get('[data-testid="review-last-name"]').should('have.text', 'Smith');
    cy.get('[data-testid="review-country"]').should('have.text', 'United Kingdom');
    cy.get('[data-testid="review-doc-type"]').should('have.text', "Driver's License");

    // Reload and test failure scenario.
    cy.visit(PLAYGROUND);

    const data2 = {
      firstName: 'Bob', lastName: 'Fail',
      email: 'bob@fail.com', dob: '2000-01-01', country: 'DE'
    };

    cy.get('[data-testid="btn-start"]').click();
    fillPersonalInfo(data2);
    cy.get('[data-testid="btn-next-personal"]').click();
    uploadDocument('national-id', 'id-card.png');
    cy.get('[data-testid="btn-next-document"]').click();
    cy.get('[data-testid="btn-submit"]').click();

    // Verify the failure result.
    cy.get('[data-testid="step-result"]', { timeout: 3000 }).should('be.visible');
    cy.get('[data-testid="result-title"]').should('have.text', 'Verification Failed');
    cy.get('[data-testid="result-message"]').should('contain.text', 'could not verify');
  });
});
