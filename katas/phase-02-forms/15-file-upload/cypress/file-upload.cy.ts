const PLAYGROUND = '/phase-02-forms/15-file-upload/playground/';

describe('Kata 15: File Upload', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Upload a File via the File Input
  // --------------------------------------------------------------------------
  // Use selectFile() to upload a virtual PDF file.
  it('exercise 1: upload a file via file input', () => {
    // Verify file count starts at 0.
    cy.get('[data-testid="file-count"]').should('have.text', '0');

    // selectFile() is a built-in Cypress command (since v9.3) that sets
    // files on an <input type="file"> element.
    //
    // Parameters:
    //   contents — a Cypress.Buffer holding the file data
    //   fileName — the name the browser will see for the file
    //   mimeType — the MIME type (must match an allowed type for validation)
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('fake pdf content'),
      fileName: 'id-proof.pdf',
      mimeType: 'application/pdf',
    }, { force: true }); // force:true because the input is hidden (display:none)

    // Wait for the simulated upload progress to complete.
    // The file count should update to 1.
    cy.get('[data-testid="file-count"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Uploaded File Appears in the List
  // --------------------------------------------------------------------------
  it('exercise 2: verify uploaded file appears in the list', () => {
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('fake jpeg content'),
      fileName: 'passport-scan.jpg',
      mimeType: 'image/jpeg',
    }, { force: true });

    // should('contain.text', str) checks if textContent contains the string.
    cy.get('[data-testid="file-items"]').should('contain.text', 'passport-scan.jpg');

    // The "no files" message should be hidden.
    cy.get('[data-testid="empty-list"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Upload Wrong File Type and Verify Error
  // --------------------------------------------------------------------------
  it('exercise 3: upload wrong file type shows error', () => {
    // Upload a .txt file — not in the allowed types list.
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('some text content'),
      fileName: 'notes.txt',
      mimeType: 'text/plain',
    }, { force: true });

    // Verify the error message is visible.
    cy.get('[data-testid="upload-error"]')
      .should('be.visible')
      .and('contain.text', 'notes.txt')
      .and('contain.text', 'not allowed');

    // File should NOT be added to the list.
    cy.get('[data-testid="file-count"]').should('have.text', '0');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Drag-and-Drop Upload
  // --------------------------------------------------------------------------
  // Use selectFile() with { action: 'drag-drop' } to drop a file onto
  // the drop zone element instead of the hidden file input.
  it('exercise 4: drag-and-drop upload onto drop zone', () => {
    // selectFile with action: 'drag-drop' simulates dropping a file
    // onto any element (not just <input type="file">).
    // This dispatches drop events on the target element.
    cy.get('[data-testid="drop-zone"]').selectFile({
      contents: Cypress.Buffer.from('fake png content'),
      fileName: 'address-proof.png',
      mimeType: 'image/png',
    }, { action: 'drag-drop' });

    // Verify the file appears.
    cy.get('[data-testid="file-items"]').should('contain.text', 'address-proof.png');
    cy.get('[data-testid="file-count"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify File Preview
  // --------------------------------------------------------------------------
  it('exercise 5: verify file preview exists for image upload', () => {
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('fake jpeg content'),
      fileName: 'selfie.jpg',
      mimeType: 'image/jpeg',
    }, { force: true });

    // Wait for the file to appear.
    cy.get('[data-testid="file-count"]').should('have.text', '1');

    // Find the file item containing our file name.
    // contains() finds an element whose text content includes the string.
    cy.get('.file-item').contains('selfie.jpg').parents('.file-item')
      .find('.file-preview')
      .should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Remove an Uploaded File
  // --------------------------------------------------------------------------
  it('exercise 6: remove an uploaded file', () => {
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.from('fake pdf'),
      fileName: 'old-id.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    // Verify it appeared.
    cy.get('[data-testid="file-count"]').should('have.text', '1');

    // Find the Remove button within the file item.
    // parents('.file-item') traverses up to the file-item ancestor.
    cy.get('.file-item').contains('old-id.pdf').parents('.file-item')
      .find('.btn-remove')
      .click();

    // Verify the file is removed.
    cy.get('[data-testid="file-count"]').should('have.text', '0');
    cy.get('[data-testid="empty-list"]').should('be.visible');
    cy.get('[data-testid="file-items"]').should('not.contain.text', 'old-id.pdf');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Upload Multiple Files
  // --------------------------------------------------------------------------
  it('exercise 7: upload multiple files at once', () => {
    // selectFile() accepts an array of file objects to upload multiple files.
    cy.get('[data-testid="file-input"]').selectFile([
      {
        contents: Cypress.Buffer.from('jpeg front'),
        fileName: 'id-front.jpg',
        mimeType: 'image/jpeg',
      },
      {
        contents: Cypress.Buffer.from('jpeg back'),
        fileName: 'id-back.jpg',
        mimeType: 'image/jpeg',
      },
    ], { force: true });

    // Both files should appear.
    cy.get('[data-testid="file-count"]').should('have.text', '2');
    cy.get('[data-testid="file-items"]').should('contain.text', 'id-front.jpg');
    cy.get('[data-testid="file-items"]').should('contain.text', 'id-back.jpg');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify File Size Display
  // --------------------------------------------------------------------------
  it('exercise 8: verify file size display', () => {
    // Create a file with a known size: 1024 bytes = 1.0 KB.
    // Cypress.Buffer.alloc(size) creates a buffer of the given byte length.
    cy.get('[data-testid="file-input"]').selectFile({
      contents: Cypress.Buffer.alloc(1024),
      fileName: 'sized-doc.pdf',
      mimeType: 'application/pdf',
    }, { force: true });

    cy.get('[data-testid="file-count"]').should('have.text', '1');

    // Find the file size element within the file item.
    cy.get('.file-item').contains('sized-doc.pdf').parents('.file-item')
      .find('.file-size')
      .should('have.text', '1.0 KB');
  });

});
