const PLAYGROUND = '/phase-06-complex-scenarios/34-complex-multi-step-e2e/playground/';

// Default test data used across exercises.
const DEFAULT_DATA = {
  email: 'jane@example.com',
  password: 'secret123',
  name: 'Jane Doe',
  dob: '1990-05-15',
  nationality: 'US',
  address: '123 Main St, Springfield',
  phone: '+1 555-0123',
  fileName: 'passport.pdf',
};

describe('Kata 34: Complex Multi-Step E2E', () => {

  // -----------------------------------------------------------------------
  // Helpers: Complete individual steps. Each helper fills the required
  // fields and clicks the submit button. Cypress chains commands, so
  // each .type() or .click() waits for the previous to finish.
  // -----------------------------------------------------------------------

  // Step 1: Register
  function completeRegister(data = DEFAULT_DATA) {
    cy.get('[data-testid="reg-email"]').type(data.email);
    cy.get('[data-testid="reg-password"]').type(data.password);
    cy.get('[data-testid="reg-name"]').type(data.name);
    cy.get('[data-testid="register-submit"]').click();
  }

  // Step 2: KYC
  function completeKyc(data = DEFAULT_DATA) {
    cy.get('[data-testid="kyc-dob"]').type(data.dob);
    // cy.get(select).select(value) selects an option by its value attribute.
    cy.get('[data-testid="kyc-nationality"]').select(data.nationality);
    cy.get('[data-testid="kyc-address"]').type(data.address);
    cy.get('[data-testid="kyc-phone"]').type(data.phone);
    cy.get('[data-testid="kyc-submit"]').click();
  }

  // Step 3: Document Upload
  function completeDocument(data = DEFAULT_DATA) {
    // cy.get(input).selectFile(fileSpec) simulates selecting a file.
    // The contents parameter accepts a Cypress.Buffer for synthetic files.
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('fake pdf content'),
      fileName: data.fileName,
      mimeType: 'application/pdf',
    }, { force: true }); // force: true because the input is hidden
    cy.get('[data-testid="document-submit"]').click();
  }

  // Step 4: Video Verification
  function completeVideo() {
    cy.get('[data-testid="start-video-btn"]').click();
    // Wait for the Continue button to appear (video verification takes ~2s).
    cy.get('[data-testid="video-submit"]', { timeout: 5000 }).should('be.visible').click();
  }

  // Step 5: Background Check
  function completeBackground() {
    cy.get('[data-testid="start-bg-check"]').click();
    // Wait for the Continue button to appear (background check takes ~2s).
    cy.get('[data-testid="bg-submit"]', { timeout: 5000 }).should('be.visible').click();
  }

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Complete Full Happy Path
  // --------------------------------------------------------------------------
  it('exercise 1: complete full happy path', () => {
    completeRegister();
    cy.get('[data-testid="step-kyc"]').should('be.visible');

    completeKyc();
    cy.get('[data-testid="step-document"]').should('be.visible');

    completeDocument();
    cy.get('[data-testid="step-video"]').should('be.visible');

    completeVideo();
    cy.get('[data-testid="step-background"]').should('be.visible');

    completeBackground();

    // Verify final success view.
    cy.get('[data-testid="step-approval"]').should('be.visible');
    cy.get('[data-testid="success-title"]').should('have.text', 'Onboarding Complete!');
    cy.get('[data-testid="summary-name"]').should('have.text', DEFAULT_DATA.name);
    cy.get('[data-testid="summary-email"]').should('have.text', DEFAULT_DATA.email);
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Step Unlocking
  // --------------------------------------------------------------------------
  it('exercise 2: verify step unlocking', () => {
    // Initially step 1 active, step 2 locked.
    cy.get('[data-testid="tracker-register"]').should('have.class', 'active');
    cy.get('[data-testid="tracker-kyc"]').should('have.class', 'locked');

    // Complete step 1.
    completeRegister();

    // Step 1 completed, step 2 active.
    // .should('have.class', name) checks for a single CSS class.
    cy.get('[data-testid="tracker-register"]').should('have.class', 'completed');
    cy.get('[data-testid="tracker-kyc"]').should('have.class', 'active');
    cy.get('[data-testid="tracker-document"]').should('have.class', 'locked');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Cannot Skip Steps
  // --------------------------------------------------------------------------
  it('exercise 3: verify cannot skip steps', () => {
    // Complete only step 1.
    completeRegister();

    // Step 2 visible, steps 3-6 hidden.
    cy.get('[data-testid="step-kyc"]').should('be.visible');
    cy.get('[data-testid="step-document"]').should('not.be.visible');
    cy.get('[data-testid="step-video"]').should('not.be.visible');
    cy.get('[data-testid="step-background"]').should('not.be.visible');
    cy.get('[data-testid="step-approval"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Partial Completion and Resume
  // --------------------------------------------------------------------------
  it('exercise 4: partial completion and resume', () => {
    completeRegister();
    completeKyc();

    // Verify step 3 is now active.
    cy.get('[data-testid="step-document"]').should('be.visible');
    cy.get('[data-testid="tracker-document"]').should('have.class', 'active');

    // Steps 1-2 are completed in the tracker.
    cy.get('[data-testid="tracker-register"]').should('have.class', 'completed');
    cy.get('[data-testid="tracker-kyc"]').should('have.class', 'completed');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Data Carries Through Steps
  // --------------------------------------------------------------------------
  it('exercise 5: verify data carries through steps', () => {
    completeRegister();
    completeKyc();
    completeDocument();
    completeVideo();
    completeBackground();

    // Verify the final summary shows data from all earlier steps.
    cy.get('[data-testid="summary-name"]').should('have.text', DEFAULT_DATA.name);
    cy.get('[data-testid="summary-email"]').should('have.text', DEFAULT_DATA.email);
    cy.get('[data-testid="summary-nationality"]').should('have.text', DEFAULT_DATA.nationality);
    cy.get('[data-testid="summary-document"]').should('have.text', DEFAULT_DATA.fileName);
    cy.get('[data-testid="summary-video"]').should('have.text', 'Yes');
    cy.get('[data-testid="summary-background"]').should('have.text', 'Passed');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Error at One Step Doesn't Lose Data
  // --------------------------------------------------------------------------
  it('exercise 6: error at one step does not lose data', () => {
    completeRegister();

    // Try to submit step 2 with only DOB filled.
    cy.get('[data-testid="kyc-dob"]').type('1990-05-15');
    cy.get('[data-testid="kyc-submit"]').click();

    // Verify error message is visible.
    cy.get('[data-testid="kyc-error"]').should('be.visible');

    // Fill remaining fields and submit again.
    cy.get('[data-testid="kyc-nationality"]').select('US');
    cy.get('[data-testid="kyc-address"]').type('123 Main St');
    cy.get('[data-testid="kyc-phone"]').type('+1 555-0123');
    cy.get('[data-testid="kyc-submit"]').click();

    // Verify we advanced to step 3.
    cy.get('[data-testid="step-document"]').should('be.visible');

    // Complete remaining steps and verify step 1 data is preserved.
    completeDocument();
    completeVideo();
    completeBackground();
    cy.get('[data-testid="summary-name"]').should('have.text', DEFAULT_DATA.name);
    cy.get('[data-testid="summary-email"]').should('have.text', DEFAULT_DATA.email);
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Final Success State
  // --------------------------------------------------------------------------
  it('exercise 7: verify final success state', () => {
    completeRegister();
    completeKyc();
    completeDocument();
    completeVideo();
    completeBackground();

    // Verify all elements of the success view.
    cy.get('[data-testid="success-view"]').should('be.visible');
    cy.get('[data-testid="success-icon"]').should('be.visible');
    cy.get('[data-testid="success-title"]').should('have.text', 'Onboarding Complete!');
    cy.get('[data-testid="success-message"]').should('contain.text', 'verified and approved');
    cy.get('[data-testid="summary-table"]').should('be.visible');

    // Verify tracker states.
    cy.get('[data-testid="tracker-register"]').should('have.class', 'completed');
    cy.get('[data-testid="tracker-kyc"]').should('have.class', 'completed');
    cy.get('[data-testid="tracker-document"]').should('have.class', 'completed');
    cy.get('[data-testid="tracker-video"]').should('have.class', 'completed');
    cy.get('[data-testid="tracker-background"]').should('have.class', 'completed');
    cy.get('[data-testid="tracker-approval"]').should('have.class', 'active');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Test with Different Data Sets
  // --------------------------------------------------------------------------
  it('exercise 8: test with different data sets', () => {
    const altData = {
      email: 'alex@company.org',
      password: 'p@ssw0rd',
      name: 'Alex Rivera',
      dob: '1985-11-20',
      nationality: 'DE',
      address: 'Berliner Str 42, Berlin',
      phone: '+49 30 1234567',
      fileName: 'drivers-license.jpg',
    };

    completeRegister(altData);
    completeKyc(altData);
    completeDocument(altData);
    completeVideo();
    completeBackground();

    // Verify summary shows the alternate data.
    cy.get('[data-testid="summary-name"]').should('have.text', 'Alex Rivera');
    cy.get('[data-testid="summary-email"]').should('have.text', 'alex@company.org');
    cy.get('[data-testid="summary-nationality"]').should('have.text', 'DE');
    cy.get('[data-testid="summary-document"]').should('have.text', 'drivers-license.jpg');
  });
});
