const PLAYGROUND = '/phase-03-navigation-and-state/21-tabs-and-windows/playground/';

describe('Kata 21: Tabs and Windows', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Click Link and Handle New Tab
  // --------------------------------------------------------------------------
  // Cypress runs inside a single browser tab and cannot natively switch to
  // new tabs. The standard approach is to:
  //   1. Remove target="_blank" from the link so it opens in the same tab, OR
  //   2. Verify the link's href and target attributes, then visit the URL directly
  //
  // This exercise demonstrates both approaches.
  it('exercise 1: click link and handle new tab', () => {
    // Approach: Remove target="_blank" so the link opens in the same tab.
    // invoke('removeAttr', 'target') removes the target attribute from
    // the element, causing the link to open in the current tab instead.
    cy.get('[data-testid="link-view-terms"]')
      .invoke('removeAttr', 'target')
      .click();

    // Now the terms page opens in the same tab.
    // Verify we navigated to the terms page.
    cy.get('[data-testid="terms-title"]').should('have.text', 'Terms and Conditions');

    // Verify the URL contains terms.html.
    cy.url().should('include', 'terms.html');

    // Go back to the parent page.
    cy.go('back');
    cy.get('[data-testid="page-header"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify New Tab URL
  // --------------------------------------------------------------------------
  // Instead of actually opening the new tab, we verify the link's attributes
  // to confirm it would open the correct URL in a new tab.
  it('exercise 2: verify new tab link attributes', () => {
    // Verify the link has target="_blank" (would open in new tab).
    // .should('have.attr', name, value) checks an HTML attribute.
    cy.get('[data-testid="link-view-terms"]')
      .should('have.attr', 'target', '_blank');

    // Verify the link points to terms.html.
    // .should('have.attr', 'href') checks the href attribute.
    cy.get('[data-testid="link-view-terms"]')
      .should('have.attr', 'href', 'terms.html');

    // Visit the terms page directly to verify it loads correctly.
    const termsUrl = PLAYGROUND + 'terms.html';
    cy.visit(termsUrl);
    cy.get('[data-testid="terms-title"]').should('have.text', 'Terms and Conditions');
    cy.title().should('contain', 'Terms and Conditions');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Interact with Popup Content
  // --------------------------------------------------------------------------
  // Since Cypress can't open popups, we visit the popup page directly
  // and interact with it as a regular page.
  it('exercise 3: interact with popup content directly', () => {
    // Visit the consent form page directly.
    cy.visit(PLAYGROUND + 'consent-form.html');

    // Verify the page loaded.
    cy.get('[data-testid="consent-title"]').should('have.text', 'Data Processing Consent');

    // Check all consent checkboxes.
    // .check() ticks a checkbox.
    cy.get('[data-testid="consent-identity"]').check();
    cy.get('[data-testid="consent-background"]').check();
    cy.get('[data-testid="consent-storage"]').check();

    // Verify checkboxes are checked.
    // .should('be.checked') asserts a checkbox is ticked.
    cy.get('[data-testid="consent-identity"]').should('be.checked');
    cy.get('[data-testid="consent-background"]').should('be.checked');
    cy.get('[data-testid="consent-storage"]').should('be.checked');

    // Click "Give Consent".
    cy.get('[data-testid="btn-give-consent"]').click();

    // Verify the consent status message appears.
    cy.get('[data-testid="consent-status"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Close Popup and Verify Parent State
  // --------------------------------------------------------------------------
  // In Cypress, we simulate the postMessage that a popup would send
  // to verify the parent page handles it correctly.
  it('exercise 4: simulate popup message and verify parent state', () => {
    // Verify initial state.
    cy.get('[data-testid="consent-given"]').should('have.text', 'No');

    // Simulate a postMessage from a popup window.
    // cy.window() yields the browser window object.
    // We call postMessage directly to simulate what the popup would do.
    cy.window().then((win) => {
      win.postMessage(
        { type: 'consent-given', message: 'User provided data processing consent' },
        '*'
      );
    });

    // Verify the parent page updated its state.
    cy.get('[data-testid="consent-given"]').should('have.text', 'Yes');
    cy.get('[data-testid="consent-status-label"]').should('have.text', 'Consent provided');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Handle window.open() Popup
  // --------------------------------------------------------------------------
  // Cypress can stub window.open to prevent the popup from opening
  // and verify it was called with the correct arguments.
  it('exercise 5: stub window.open and verify it is called', () => {
    // cy.window().then() gives us the window object.
    // cy.stub(obj, method) replaces a method with a stub that records calls.
    //
    // Stubbing window.open prevents the popup from actually opening
    // and lets us verify the method was called with the expected arguments.
    cy.window().then((win) => {
      // cy.stub() returns a Sinon stub object.
      // .as('windowOpen') gives the stub an alias for later assertions.
      cy.stub(win, 'open').as('windowOpen');
    });

    // Click the button that calls window.open().
    cy.get('[data-testid="btn-video-call"]').click();

    // Verify window.open was called with the correct arguments.
    // cy.get('@windowOpen') retrieves the stub by its alias.
    // .should('be.calledOnce') verifies it was called exactly once.
    cy.get('@windowOpen').should('be.calledOnce');

    // .should('be.calledWith', ...args) verifies the arguments.
    // The first argument is the URL, second is the window name,
    // third is the features string.
    cy.get('@windowOpen').should(
      'be.calledWith',
      'video-call.html',
      'videoCall',
      'width=500,height=400,left=200,top=200'
    );
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Cross-Tab Communication (postMessage)
  // --------------------------------------------------------------------------
  // We simulate postMessage events to test the parent page's message
  // handler without needing actual popups.
  it('exercise 6: verify cross-tab communication via postMessage', () => {
    // Verify the placeholder is visible initially.
    cy.get('[data-testid="message-placeholder"]').should('be.visible');

    // Send a postMessage simulating a consent popup response.
    cy.window().then((win) => {
      win.postMessage(
        { type: 'consent-given', message: 'User provided data processing consent' },
        '*'
      );
    });

    // Verify the message log received the message.
    // The placeholder should be removed and a new entry should appear.
    cy.get('[data-testid="message-entry-1"]').should('be.visible');
    cy.get('[data-testid="message-entry-1"]').should('contain.text', 'consent-given');

    // Send another message simulating a video call completion.
    cy.window().then((win) => {
      win.postMessage(
        { type: 'video-completed', message: 'Video verification call completed successfully' },
        '*'
      );
    });

    // Verify the second message appeared.
    cy.get('[data-testid="message-entry-2"]').should('be.visible');
    cy.get('[data-testid="message-entry-2"]').should('contain.text', 'video-completed');

    // Verify parent state updated based on messages.
    cy.get('[data-testid="consent-given"]').should('have.text', 'Yes');
    cy.get('[data-testid="video-completed"]').should('have.text', 'Yes');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Switch Between Tabs (Visit Pages Sequentially)
  // --------------------------------------------------------------------------
  // Since Cypress runs in a single tab, we simulate tab switching by
  // visiting pages sequentially and verifying each page's content.
  it('exercise 7: visit multiple pages sequentially to simulate tab switching', () => {
    // Verify we are on the main portal page.
    cy.get('[data-testid="page-header"]').should('contain.text', 'Tabs and Windows');

    // "Switch" to the terms page.
    cy.visit(PLAYGROUND + 'terms.html');
    cy.get('[data-testid="terms-title"]').should('have.text', 'Terms and Conditions');

    // Verify terms page content.
    cy.get('[data-testid="terms-section-1"]').should('contain.text', 'personal information');

    // "Switch" back to the main page.
    cy.visit(PLAYGROUND);
    cy.get('[data-testid="page-header"]').should('contain.text', 'Tabs and Windows');

    // "Switch" to the video call page.
    cy.visit(PLAYGROUND + 'video-call.html');
    cy.get('[data-testid="video-call-title"]').should('have.text', 'Video Verification Call');

    // "Switch" back to main.
    cy.visit(PLAYGROUND);
    cy.get('[data-testid="page-header"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Handle Multiple Popups (Stub and Simulate)
  // --------------------------------------------------------------------------
  // We stub window.open for multiple popup calls and simulate their
  // responses via postMessage.
  it('exercise 8: handle multiple popups via stub and postMessage', () => {
    // Stub window.open.
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    // Open both popups.
    cy.get('[data-testid="btn-video-call"]').click();
    cy.get('[data-testid="btn-consent-form"]').click();

    // Verify window.open was called twice.
    // .should('be.calledTwice') verifies exactly two calls.
    cy.get('@windowOpen').should('be.calledTwice');

    // Simulate messages from both popups.
    cy.window().then((win) => {
      // Consent popup response.
      win.postMessage(
        { type: 'consent-given', message: 'User provided data processing consent' },
        '*'
      );
    });

    cy.window().then((win) => {
      // Video call popup response.
      win.postMessage(
        { type: 'video-completed', message: 'Video verification call completed successfully' },
        '*'
      );
    });

    // Verify the parent page processed both messages.
    cy.get('[data-testid="consent-given"]').should('have.text', 'Yes');
    cy.get('[data-testid="video-completed"]').should('have.text', 'Yes');

    // Verify message log has entries from both.
    cy.get('[data-testid="message-entry-1"]').should('contain.text', 'consent-given');
    cy.get('[data-testid="message-entry-2"]').should('contain.text', 'video-completed');
  });

});
