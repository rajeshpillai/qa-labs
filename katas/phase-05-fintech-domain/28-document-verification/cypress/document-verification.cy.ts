const PLAYGROUND = '/phase-05-fintech-domain/28-document-verification/playground/';

// ─── Helper: uploadFile ──────────────────────────────────────────────
// Selects a document type and simulates a file upload.
// cy.get().selectFile() creates a synthetic file and triggers the change event.
// { force: true } is needed because the file input is hidden (display:none).
function uploadFile(docType: string = 'passport', fileName: string = 'passport.pdf') {
  cy.get('[data-testid="select-doc-type"]').select(docType);
  cy.get('[data-testid="file-input"]').selectFile({
    contents: Cypress.Buffer.from('fake-content'),
    fileName: fileName,
    mimeType: 'application/pdf'
  }, { force: true });
}

// ─── Helper: uploadAndProcess ────────────────────────────────────────
// Uploads a file, clicks Process, and optionally waits for OCR results.
function uploadAndProcess(docType: string = 'passport', fileName: string = 'passport.pdf', waitForResults: boolean = true) {
  uploadFile(docType, fileName);
  cy.get('[data-testid="btn-process"]').click();
  if (waitForResults) {
    // Wait for extracted fields to appear (2s processing delay).
    cy.get('[data-testid="extracted-fields"]', { timeout: 5000 }).should('be.visible');
  }
}

describe('Kata 28: Document Verification', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Upload and Verify Processing Starts
  // --------------------------------------------------------------------------
  it('exercise 1: upload and verify processing starts', () => {
    // Verify initial status.
    cy.get('[data-testid="current-status"]').should('have.text', 'Upload');

    // Upload a file.
    uploadFile();

    // Verify file is shown.
    cy.get('[data-testid="upload-filename"]').should('have.text', 'passport.pdf');
    cy.get('[data-testid="upload-area"]').should('have.class', 'has-file');

    // Click Process.
    cy.get('[data-testid="btn-process"]').click();

    // Verify spinner is visible.
    cy.get('[data-testid="processing-spinner"]').should('be.visible');
    cy.get('[data-testid="processing-text"]').should('have.text', 'Extracting text via OCR...');

    // Verify status changed to Processing.
    cy.get('[data-testid="current-status"]').should('have.text', 'Processing');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Wait for OCR Results
  // --------------------------------------------------------------------------
  it('exercise 2: wait for OCR results', () => {
    uploadFile();
    cy.get('[data-testid="btn-process"]').click();

    // Verify spinner is visible during processing.
    cy.get('[data-testid="processing-spinner"]').should('be.visible');

    // Wait for extracted fields (processing takes 2s).
    // { timeout: 5000 } gives Cypress enough time to retry.
    cy.get('[data-testid="extracted-fields"]', { timeout: 5000 }).should('be.visible');

    // Verify spinner is now hidden.
    cy.get('[data-testid="processing-spinner"]').should('not.be.visible');

    // Verify status is "Review".
    cy.get('[data-testid="current-status"]').should('have.text', 'Review');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Extracted Fields
  // --------------------------------------------------------------------------
  it('exercise 3: verify extracted fields', () => {
    uploadAndProcess('passport');

    // Verify each field value.
    // .should('have.value', text) checks an input element's value attribute.
    cy.get('[data-testid="extracted-name"]').should('have.value', 'Jane Alice Doe');
    cy.get('[data-testid="extracted-dob"]').should('have.value', '15-Mar-1990');
    cy.get('[data-testid="extracted-id-number"]').should('have.value', 'P12345678');
    cy.get('[data-testid="extracted-address"]').should('have.value', '123 Main St, New York, NY 10001');
    cy.get('[data-testid="extracted-expiry"]').should('have.value', '15-Mar-2030');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Edit Extracted Field
  // --------------------------------------------------------------------------
  it('exercise 4: edit extracted field', () => {
    uploadAndProcess('passport');

    // Verify original name.
    cy.get('[data-testid="extracted-name"]').should('have.value', 'Jane Alice Doe');

    // Clear and type a new name.
    // .clear() removes existing text, .type() enters new text.
    cy.get('[data-testid="extracted-name"]').clear().type('Jane A. Doe-Smith');
    cy.get('[data-testid="extracted-name"]').should('have.value', 'Jane A. Doe-Smith');

    // Confirm — should succeed with edited field.
    cy.get('[data-testid="btn-confirm"]').click();
    cy.get('[data-testid="confirmed-section"]').should('be.visible');
    cy.get('[data-testid="current-status"]').should('have.text', 'Confirmed');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Confirm Verification
  // --------------------------------------------------------------------------
  it('exercise 5: confirm verification', () => {
    uploadAndProcess('drivers-license', 'license.jpg');

    // Click Confirm.
    cy.get('[data-testid="btn-confirm"]').click();

    // Verify confirmation page.
    cy.get('[data-testid="confirmed-section"]').should('be.visible');
    cy.get('[data-testid="confirmed-title"]').should('have.text', 'Document Verified');
    cy.get('[data-testid="confirmed-message"]').should('contain.text', 'Verification complete');
    cy.get('[data-testid="current-status"]').should('have.text', 'Confirmed');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Status Transitions
  // --------------------------------------------------------------------------
  it('exercise 6: verify status transitions', () => {
    // Phase 1: Upload.
    cy.get('[data-testid="current-status"]').should('have.text', 'Upload');
    cy.get('[data-testid="step-upload-pill"]').should('have.class', 'active');

    // Upload and process.
    uploadFile();
    cy.get('[data-testid="btn-process"]').click();

    // Phase 2: Processing.
    cy.get('[data-testid="current-status"]').should('have.text', 'Processing');
    cy.get('[data-testid="step-processing-pill"]').should('have.class', 'active');
    cy.get('[data-testid="step-upload-pill"]').should('have.class', 'completed');

    // Phase 3: Review.
    cy.get('[data-testid="extracted-fields"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="current-status"]').should('have.text', 'Review');
    cy.get('[data-testid="step-review-pill"]').should('have.class', 'active');
    cy.get('[data-testid="step-processing-pill"]').should('have.class', 'completed');

    // Phase 4: Confirmed.
    cy.get('[data-testid="btn-confirm"]').click();
    cy.get('[data-testid="current-status"]').should('have.text', 'Confirmed');
    cy.get('[data-testid="step-confirmed-pill"]').should('have.class', 'active');
    cy.get('[data-testid="step-review-pill"]').should('have.class', 'completed');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Test With Invalid Document
  // --------------------------------------------------------------------------
  it('exercise 7: test with invalid document', () => {
    // Upload a file with "invalid" in the name to trigger failure.
    uploadFile('passport', 'invalid-blurry-doc.pdf');
    cy.get('[data-testid="btn-process"]').click();

    // Wait for error banner (after 2s processing).
    cy.get('[data-testid="error-banner"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain.text', 'could not be processed');
    cy.get('[data-testid="current-status"]').should('have.text', 'Failed');
    cy.get('[data-testid="btn-retry"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Retry After Failure
  // --------------------------------------------------------------------------
  it('exercise 8: retry after failure', () => {
    // First attempt: invalid.
    uploadFile('passport', 'invalid-doc.pdf');
    cy.get('[data-testid="btn-process"]').click();
    cy.get('[data-testid="error-banner"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="current-status"]').should('have.text', 'Failed');

    // Click "Try Again".
    cy.get('[data-testid="btn-retry"]').click();

    // Verify reset to upload state.
    cy.get('[data-testid="current-status"]').should('have.text', 'Upload');
    cy.get('[data-testid="upload-section"]').should('be.visible');
    cy.get('[data-testid="error-banner"]').should('not.be.visible');

    // Second attempt: valid document.
    uploadAndProcess('national-id', 'valid-id-card.pdf');

    // Verify OCR results.
    cy.get('[data-testid="extracted-name"]').should('have.value', 'Maria Garcia Lopez');
    cy.get('[data-testid="current-status"]').should('have.text', 'Review');

    // Confirm.
    cy.get('[data-testid="btn-confirm"]').click();
    cy.get('[data-testid="current-status"]').should('have.text', 'Confirmed');
  });
});
