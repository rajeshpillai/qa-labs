const PLAYGROUND = '/phase-06-complex-scenarios/33-session-management/playground/';

describe('Kata 33: Session Management', () => {

  // Helper: Log in with default credentials.
  // Fills the form and clicks Sign In. Uses Cypress command chaining.
  function login() {
    // cy.get(selector).type(text) types into an input field.
    cy.get('[data-testid="username-input"]').type('admin');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-btn"]').click();
    // Wait for the dashboard to appear.
    cy.get('[data-testid="dashboard"]').should('be.visible');
  }

  // --------------------------------------------------------------------------
  // Exercise 1: Login and Verify Session Active
  // --------------------------------------------------------------------------
  // Signs in and verifies the dashboard shows an active session.
  it('exercise 1: login and verify session active', () => {
    cy.visit(PLAYGROUND);

    // Verify login panel is visible.
    cy.get('[data-testid="login-panel"]').should('be.visible');

    // Log in.
    login();

    // Verify session info is displayed correctly.
    cy.get('[data-testid="session-status"]').should('have.text', 'Active');
    cy.get('[data-testid="session-user"]').should('have.text', 'admin');

    // Verify a token was generated (contains dots like a JWT).
    cy.get('[data-testid="token-display"]')
      .invoke('text')
      .should('include', '.');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Wait for Session Warning
  // --------------------------------------------------------------------------
  // Uses cy.clock() and cy.tick() to fast-forward time to the warning.
  it('exercise 2: wait for session warning', () => {
    // cy.clock() installs fake timers (overrides setTimeout, setInterval,
    // and Date). Must be called before cy.visit() to capture all timers.
    cy.clock();
    cy.visit(PLAYGROUND);
    login();

    // Verify the warning banner is not visible initially.
    cy.get('[data-testid="session-warning"]').should('not.be.visible');

    // cy.tick(ms) advances the fake clock by the given milliseconds.
    // This triggers any setInterval/setTimeout callbacks that would
    // fire within that period.
    cy.tick(10000);

    // Verify the warning banner appeared.
    cy.get('[data-testid="session-warning"]').should('be.visible');

    // Verify session status changed to "Warning".
    cy.get('[data-testid="session-status"]').should('have.text', 'Warning');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Refresh Session Before Expiry
  // --------------------------------------------------------------------------
  // Advances to warning, refreshes, and verifies the timer reset.
  it('exercise 3: refresh session before expiry', () => {
    cy.clock();
    cy.visit(PLAYGROUND);
    login();

    // Advance to warning state.
    cy.tick(10000);
    cy.get('[data-testid="session-warning"]').should('be.visible');

    // Click Refresh Session.
    cy.get('[data-testid="refresh-session-btn"]').click();

    // Verify warning disappeared and timer reset.
    cy.get('[data-testid="session-warning"]').should('not.be.visible');
    cy.get('[data-testid="session-status"]').should('have.text', 'Active');
    cy.get('[data-testid="session-timer"]').should('have.text', '15s');
    cy.get('[data-testid="refresh-count"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Let Session Expire, Verify Overlay
  // --------------------------------------------------------------------------
  // Advances the clock past the full 15-second timeout.
  it('exercise 4: let session expire and verify overlay', () => {
    cy.clock();
    cy.visit(PLAYGROUND);
    login();

    // Advance 15 seconds (full timeout).
    cy.tick(15000);

    // Verify the expired overlay is visible.
    cy.get('[data-testid="expired-overlay"]').should('be.visible');

    // Verify the expired message content.
    cy.get('[data-testid="expired-message"]').should('contain.text', 'timed out');

    // Verify session status is "Expired" and timer shows 0s.
    cy.get('[data-testid="session-status"]').should('have.text', 'Expired');
    cy.get('[data-testid="session-timer"]').should('have.text', '0s');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Re-login After Expiry
  // --------------------------------------------------------------------------
  // Lets session expire, clicks re-login, and signs in again.
  it('exercise 5: re-login after session expiry', () => {
    cy.clock();
    cy.visit(PLAYGROUND);
    login();

    // Let session expire.
    cy.tick(15000);
    cy.get('[data-testid="expired-overlay"]').should('be.visible');

    // Click "Sign In Again".
    cy.get('[data-testid="relogin-btn"]').click();

    // Verify overlay hidden and login panel visible.
    cy.get('[data-testid="expired-overlay"]').should('not.be.visible');
    cy.get('[data-testid="login-panel"]').should('be.visible');

    // Restore real timers before logging in again so the new session
    // timers work. cy.clock().invoke('restore') removes the fake timers.
    cy.clock().invoke('restore');

    // Log in again.
    login();

    // Verify new session is active.
    cy.get('[data-testid="session-status"]').should('have.text', 'Active');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Token Refresh
  // --------------------------------------------------------------------------
  // Refreshes the session and verifies a new token was generated.
  it('exercise 6: verify token refresh generates new token', () => {
    cy.visit(PLAYGROUND);
    login();

    // Capture the initial token using .invoke('text') and .then().
    cy.get('[data-testid="token-display"]')
      .invoke('text')
      .then(initialToken => {
        // Click Refresh Session.
        cy.get('[data-testid="refresh-session-btn"]').click();

        // Verify the new token is different from the initial one.
        // .invoke('text') gets the current text, .should() asserts.
        cy.get('[data-testid="token-display"]')
          .invoke('text')
          .should('not.eq', initialToken);
      });

    // Verify refresh count is 1.
    cy.get('[data-testid="refresh-count"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Rapid Interactions Keep Session Alive
  // --------------------------------------------------------------------------
  // Clicks Interact before timeout to keep the session alive.
  it('exercise 7: rapid interactions keep session alive', () => {
    cy.clock();
    cy.visit(PLAYGROUND);
    login();

    // Advance 8 seconds (close to warning at 10s).
    cy.tick(8000);

    // Click Interact to reset the timer.
    cy.get('[data-testid="interact-btn"]').click();

    // Verify session is still Active.
    cy.get('[data-testid="session-status"]').should('have.text', 'Active');
    cy.get('[data-testid="session-timer"]').should('have.text', '15s');

    // Advance another 8 seconds (total 16s from login, would have expired).
    cy.tick(8000);

    // Click Interact again.
    cy.get('[data-testid="interact-btn"]').click();

    // Verify session is still active (interactions kept it alive).
    cy.get('[data-testid="session-status"]').should('have.text', 'Active');

    // Verify the expired overlay never appeared.
    cy.get('[data-testid="expired-overlay"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Session State Across Page Reload
  // --------------------------------------------------------------------------
  // Logs in, reloads the page, and verifies the session is restored.
  it('exercise 8: session state persists across page reload', () => {
    cy.visit(PLAYGROUND);
    login();

    // Verify session is active.
    cy.get('[data-testid="session-status"]').should('have.text', 'Active');

    // Reload the page. cy.reload() is equivalent to pressing F5.
    cy.reload();

    // Verify the dashboard is still visible (session restored from
    // sessionStorage by the page's JavaScript).
    cy.get('[data-testid="dashboard"]').should('be.visible');
    cy.get('[data-testid="session-user"]').should('have.text', 'admin');
    cy.get('[data-testid="session-status"]').should('have.text', 'Active');

    // Verify the token was restored.
    cy.get('[data-testid="token-display"]')
      .invoke('text')
      .should('include', '.');
  });
});
