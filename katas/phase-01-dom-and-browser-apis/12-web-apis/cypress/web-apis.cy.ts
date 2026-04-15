// Path to the playground HTML served by the dev server.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/12-web-apis/playground/';

describe('Kata 12: Web APIs', () => {

  // --------------------------------------------------------------------------
  // Exercise 1: Copy to Clipboard and Verify
  //
  // We stub navigator.clipboard.writeText to capture what was copied.
  // Direct clipboard access in Cypress is tricky due to browser security,
  // so we use a stub to intercept the call instead.
  // --------------------------------------------------------------------------
  it('exercise 1: copy account number to clipboard', () => {
    cy.visit(PLAYGROUND, {
      // onBeforeLoad runs before the page's JavaScript executes.
      // We use it to set up stubs on the window object.
      onBeforeLoad(win) {
        // Stub writeText so we can verify what was copied.
        // callsFake makes the stub behave like a real function.
        cy.stub(win.navigator.clipboard, 'writeText')
          .as('clipboardWrite')           // alias for later assertions
          .resolves();                    // make it resolve (async success)
      },
    });

    // Click the copy button.
    cy.get('[data-testid="btn-copy-account"]').click();

    // Verify the status text updates.
    cy.get('[data-testid="copy-status"]')
      .should('have.text', 'Copied to clipboard!');

    // Verify our stub was called with the account number.
    // @clipboardWrite is the alias we set above.
    cy.get('@clipboardWrite')
      .should('have.been.calledWith', '1234-5678-9012-3456');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Mock Geolocation and Verify Coordinates
  //
  // We stub navigator.geolocation.getCurrentPosition to call the success
  // callback with our fake coordinates. This avoids needing real GPS.
  // --------------------------------------------------------------------------
  it('exercise 2: mock geolocation and verify displayed coordinates', () => {
    cy.visit(PLAYGROUND, {
      onBeforeLoad(win) {
        // Stub getCurrentPosition to immediately call the success callback
        // with our fake coordinates for New Delhi.
        cy.stub(win.navigator.geolocation, 'getCurrentPosition')
          .callsFake((successCallback) => {
            successCallback({
              coords: {
                latitude: 28.6139,
                longitude: 77.2090,
                accuracy: 10,
              },
            });
          });
      },
    });

    // Click "Detect Location".
    cy.get('[data-testid="btn-detect-location"]').click();

    // Verify the displayed coordinates match our mocked values.
    cy.get('[data-testid="location-lat"]')
      .should('have.text', '28.6139');

    cy.get('[data-testid="location-lng"]')
      .should('have.text', '77.2090');

    // Verify the result box shows success.
    cy.get('[data-testid="location-result"]')
      .should('contain.text', 'Location detected');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Handle Alert Dialog
  //
  // Cypress auto-accepts alerts by default. To verify the alert message,
  // we use cy.on('window:alert') which receives the alert text.
  // --------------------------------------------------------------------------
  it('exercise 3: handle alert dialog and verify message', () => {
    cy.visit(PLAYGROUND);

    // Set up a stub for the alert. cy.on('window:alert') fires whenever
    // the page calls alert(). We wrap it in a stub so we can assert on it.
    const alertStub = cy.stub().as('alertHandler');
    cy.on('window:alert', alertStub);

    // Click the button that triggers alert().
    cy.get('[data-testid="btn-trigger-alert"]').click();

    // Verify the stub was called with the expected message.
    cy.get('@alertHandler')
      .should('have.been.calledWith', 'Payment of Rs 5,000 has been processed successfully!');

    // Verify the page updated after the alert was dismissed.
    cy.get('[data-testid="dialog-result"]')
      .should('have.text', 'Alert was dismissed.');
  });

  // --------------------------------------------------------------------------
  // Exercise 4a: Accept Confirm Dialog
  //
  // cy.on('window:confirm') receives the confirm message. Return true
  // to accept (OK) or false to dismiss (Cancel).
  // --------------------------------------------------------------------------
  it('exercise 4a: accept confirm dialog', () => {
    cy.visit(PLAYGROUND);

    // Return true from the confirm handler to simulate clicking "OK".
    // This makes confirm() return true in the page's JavaScript.
    cy.on('window:confirm', (text) => {
      expect(text).to.contain('Rs 50,000');
      return true;   // Accept the dialog
    });

    cy.get('[data-testid="btn-trigger-confirm"]').click();

    // When confirmed, the page shows "Transfer confirmed."
    cy.get('[data-testid="dialog-result"]')
      .should('have.text', 'Transfer confirmed.');
  });

  // --------------------------------------------------------------------------
  // Exercise 4b: Dismiss Confirm Dialog
  // --------------------------------------------------------------------------
  it('exercise 4b: dismiss confirm dialog', () => {
    cy.visit(PLAYGROUND);

    // Return false from the confirm handler to simulate clicking "Cancel".
    cy.on('window:confirm', () => false);

    cy.get('[data-testid="btn-trigger-confirm"]').click();

    // When cancelled, the page shows "Transfer cancelled."
    cy.get('[data-testid="dialog-result"]')
      .should('have.text', 'Transfer cancelled.');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Handle Prompt Dialog with Input
  //
  // Cypress does not have built-in prompt handling like Playwright.
  // We stub window.prompt to return a custom value.
  // --------------------------------------------------------------------------
  it('exercise 5: handle prompt dialog and enter text', () => {
    cy.visit(PLAYGROUND);

    // Stub window.prompt to return a specific value.
    // This replaces the native prompt() so no dialog appears.
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('25000');
    });

    cy.get('[data-testid="btn-trigger-prompt"]').click();

    // Verify the page displays the entered amount.
    cy.get('[data-testid="dialog-result"]')
      .should('have.text', 'Transfer amount set to Rs 25000');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Grant/Deny Camera Permission
  //
  // Cypress cannot directly grant browser permissions like Playwright.
  // We stub navigator.mediaDevices.getUserMedia to simulate grant/deny.
  // --------------------------------------------------------------------------
  it('exercise 6a: simulate camera permission granted', () => {
    cy.visit(PLAYGROUND, {
      onBeforeLoad(win) {
        // Stub getUserMedia to resolve with a fake MediaStream.
        // We create a minimal mock with a getTracks() method that
        // returns an array with a stoppable track.
        cy.stub(win.navigator.mediaDevices, 'getUserMedia')
          .resolves({
            getTracks: () => [{ stop: () => {} }],
          } as unknown as MediaStream);
      },
    });

    cy.get('[data-testid="btn-request-camera"]').click();

    // Verify the status shows "Granted".
    cy.get('[data-testid="permission-status"]')
      .should('have.text', 'Granted');

    cy.get('[data-testid="permission-result"]')
      .should('contain.text', 'Camera access granted');
  });

  it('exercise 6b: simulate camera permission denied', () => {
    cy.visit(PLAYGROUND, {
      onBeforeLoad(win) {
        // Stub getUserMedia to reject with an error (permission denied).
        cy.stub(win.navigator.mediaDevices, 'getUserMedia')
          .rejects(new DOMException('Permission denied', 'NotAllowedError'));
      },
    });

    cy.get('[data-testid="btn-request-camera"]').click();

    // Verify the status shows "Denied".
    cy.get('[data-testid="permission-status"]')
      .should('have.text', 'Denied');

    cy.get('[data-testid="permission-result"]')
      .should('contain.text', 'Camera access denied');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify File Download
  //
  // Cypress does not have a built-in download event like Playwright.
  // We verify the download was triggered by checking the status message
  // and the download link attributes.
  // --------------------------------------------------------------------------
  it('exercise 7: verify download is triggered', () => {
    cy.visit(PLAYGROUND);

    // Click the download button.
    cy.get('[data-testid="btn-download-statement"]').click();

    // Verify the download status message.
    cy.get('[data-testid="download-status"]')
      .should('contain.text', 'Download started')
      .and('contain.text', 'statement-april-2026.csv');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Read/Write localStorage
  //
  // cy.window() gives access to the browser's window object, which
  // includes localStorage. We can read/write directly.
  // --------------------------------------------------------------------------
  it('exercise 8: read and write localStorage', () => {
    cy.visit(PLAYGROUND);

    // Write a value to localStorage via cy.window().
    cy.window().then((win) => {
      win.localStorage.setItem('preferred_currency', 'INR');
    });

    // Read it back and verify.
    cy.window().then((win) => {
      expect(win.localStorage.getItem('preferred_currency')).to.eq('INR');
    });

    // Use the UI to save a key-value pair.
    cy.get('[data-testid="storage-key"]').type('theme');
    cy.get('[data-testid="storage-value"]').type('dark');
    cy.get('[data-testid="btn-storage-save"]').click();

    // Verify the UI shows confirmation.
    cy.get('[data-testid="storage-result"]')
      .should('have.text', 'Saved: "theme" = "dark"');

    // Verify it was actually stored in localStorage.
    cy.window().then((win) => {
      expect(win.localStorage.getItem('theme')).to.eq('dark');
    });

    // Use the "Load" button to read it back via the UI.
    cy.get('[data-testid="btn-storage-load"]').click();
    cy.get('[data-testid="storage-result"]')
      .should('have.text', 'Loaded: "theme" = "dark"');
  });

});
