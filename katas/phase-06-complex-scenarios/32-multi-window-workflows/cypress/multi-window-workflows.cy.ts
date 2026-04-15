const PLAYGROUND = '/phase-06-complex-scenarios/32-multi-window-workflows/playground/';

describe('Kata 32: Multi-Window Workflows', () => {

  // -----------------------------------------------------------------------
  // IMPORTANT: Cypress runs inside a single browser tab and cannot natively
  // interact with popup windows opened by window.open(). The standard
  // workaround is to stub window.open() and then visit the popup URL
  // directly in the Cypress-controlled tab. This lets us test the popup
  // content and simulate postMessage communication back to the main page.
  // -----------------------------------------------------------------------

  // Helper: Stub window.open and return the URL it would have opened.
  // This prevents a real popup from opening (which Cypress can't control)
  // and captures the URL so we can visit it later.
  function stubWindowOpen() {
    cy.window().then(win => {
      // cy.stub(object, method) replaces the method with a spy/stub.
      // .callsFake(fn) provides a custom implementation that records
      // the URL and returns a fake window object.
      cy.stub(win, 'open').callsFake((url: string) => {
        // Store the URL on the window so tests can retrieve it.
        (win as any).__lastPopupUrl = url;
        // Return a minimal fake Window object to avoid errors in the
        // main page's code that checks if the popup opened.
        return { closed: false } as Window;
      }).as('windowOpen');
    });
  }

  // Helper: Simulate a postMessage from the popup back to the main page.
  // Since we can't actually have two windows, we send the message directly.
  function simulatePopupDecision(id: string, decision: string) {
    cy.window().then(win => {
      // Dispatch a 'message' event on the main page's window, mimicking
      // what the popup's postMessage would do.
      win.postMessage(
        { type: 'applicant-decision', id, decision },
        '*'
      );
    });
  }

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Open Review Window
  // --------------------------------------------------------------------------
  // Verifies that clicking Review calls window.open() with the correct URL.
  it('exercise 1: open review window', () => {
    // Stub window.open before clicking the button.
    stubWindowOpen();

    // Click the Review button for applicant 1 (Alice).
    cy.get('[data-testid="review-1"]').click();

    // Verify window.open was called.
    // .should('have.been.calledOnce') uses Sinon assertion syntax since
    // cy.stub creates a Sinon stub under the hood.
    cy.get('@windowOpen').should('have.been.calledOnce');

    // Verify the URL contains the admin-panel.html path and Alice's data.
    cy.get('@windowOpen').then((stub: any) => {
      const url: string = stub.getCall(0).args[0];
      expect(url).to.include('admin-panel.html');
      expect(url).to.include('name=Alice');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Interact with Popup (Visit Popup URL)
  // --------------------------------------------------------------------------
  // Since Cypress can't switch to a popup, we visit the popup URL directly
  // and interact with the admin panel page.
  it('exercise 2: interact with popup page', () => {
    // Visit the admin panel directly with query params for applicant 1.
    cy.visit(
      PLAYGROUND + 'admin-panel.html?id=1&name=Alice+Johnson&email=alice%40example.com&position=Engineer&risk=low&date=2025-01-15'
    );

    // Verify the Approve button is visible and click it.
    cy.get('[data-testid="approve-btn"]').should('be.visible').click();

    // Verify the decision banner appears.
    cy.get('[data-testid="decision-banner"]')
      .should('be.visible')
      .and('contain.text', 'approved');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Popup Content
  // --------------------------------------------------------------------------
  // Visits the popup URL and verifies all applicant fields are displayed.
  it('exercise 3: verify popup shows correct applicant details', () => {
    // Visit the admin panel with Bob's data.
    cy.visit(
      PLAYGROUND + 'admin-panel.html?id=2&name=Bob+Smith&email=bob%40example.com&position=Manager&risk=medium&date=2025-02-01'
    );

    // Verify each detail field matches the URL parameters.
    cy.get('[data-testid="applicant-name"]').should('have.text', 'Bob Smith');
    cy.get('[data-testid="applicant-email"]').should('have.text', 'bob@example.com');
    cy.get('[data-testid="applicant-position"]').should('have.text', 'Manager');
    cy.get('[data-testid="applicant-risk"]').should('have.text', 'medium');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Approve in Popup, Verify Main Page Updates
  // --------------------------------------------------------------------------
  // Simulates the approve flow using postMessage to update the main page.
  it('exercise 4: approve and verify main page updates via postMessage', () => {
    // Verify Alice starts as "pending".
    cy.get('[data-testid="status-1"]').should('have.text', 'pending');

    // Simulate the popup sending an "approved" postMessage for applicant 1.
    // In a real scenario, the popup's Approve button triggers this message.
    simulatePopupDecision('1', 'approved');

    // Verify the main page updated Alice's status to "approved".
    cy.get('[data-testid="status-1"]').should('have.text', 'approved');

    // Verify the status bar shows the last action.
    cy.get('[data-testid="last-action"]').should('contain.text', 'Alice Johnson');
    cy.get('[data-testid="last-action"]').should('contain.text', 'approved');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Reject in Popup
  // --------------------------------------------------------------------------
  // Similar to exercise 4 but with the reject decision.
  it('exercise 5: reject and verify main page updates', () => {
    // Verify Bob starts as "pending".
    cy.get('[data-testid="status-2"]').should('have.text', 'pending');

    // Simulate the popup sending a "rejected" postMessage for applicant 2.
    simulatePopupDecision('2', 'rejected');

    // Verify the main page updated Bob's status to "rejected".
    cy.get('[data-testid="status-2"]').should('have.text', 'rejected');

    // Verify the Review button for Bob is now disabled.
    cy.get('[data-testid="review-2"]').should('be.disabled');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Close Popup, Verify Main State
  // --------------------------------------------------------------------------
  // Tests that if no postMessage is sent (popup closed without action),
  // the main page state remains unchanged.
  it('exercise 6: no action preserves main page state', () => {
    // Stub window.open so the "popup" opens.
    stubWindowOpen();

    // Click Review — this opens the popup (stubbed).
    cy.get('[data-testid="review-3"]').click();

    // No postMessage is sent (admin closed popup without acting).

    // Verify Clara's status is still "pending".
    cy.get('[data-testid="status-3"]').should('have.text', 'pending');

    // Verify last action is still "None".
    cy.get('[data-testid="last-action"]').should('have.text', 'None');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Handle Multiple Popups
  // --------------------------------------------------------------------------
  // Opens two review popups (stubbed) and sends decisions for both.
  it('exercise 7: handle multiple popup decisions', () => {
    // Simulate approving Alice and rejecting Bob via postMessage.
    simulatePopupDecision('1', 'approved');
    cy.get('[data-testid="status-1"]').should('have.text', 'approved');

    simulatePopupDecision('2', 'rejected');
    cy.get('[data-testid="status-2"]').should('have.text', 'rejected');

    // Verify both statuses are correct simultaneously.
    cy.get('[data-testid="status-1"]').should('have.text', 'approved');
    cy.get('[data-testid="status-2"]').should('have.text', 'rejected');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Synchronize State Between Windows
  // --------------------------------------------------------------------------
  // Approves one applicant, then processes another, verifying the first
  // decision is preserved throughout.
  it('exercise 8: state persists across multiple decisions', () => {
    // Approve David (applicant 4).
    simulatePopupDecision('4', 'approved');
    cy.get('[data-testid="status-4"]').should('have.text', 'approved');

    // Reject Eva (applicant 5).
    simulatePopupDecision('5', 'rejected');
    cy.get('[data-testid="status-5"]').should('have.text', 'rejected');

    // Verify David's approval was not overwritten when Eva was rejected.
    cy.get('[data-testid="status-4"]').should('have.text', 'approved');

    // Verify all other applicants are still pending.
    cy.get('[data-testid="status-1"]').should('have.text', 'pending');
    cy.get('[data-testid="status-2"]').should('have.text', 'pending');
    cy.get('[data-testid="status-3"]').should('have.text', 'pending');
  });
});
