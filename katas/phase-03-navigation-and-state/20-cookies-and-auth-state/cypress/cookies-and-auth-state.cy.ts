const PLAYGROUND = '/phase-03-navigation-and-state/20-cookies-and-auth-state/playground/';

describe('Kata 20: Cookies and Auth State', () => {

  // beforeEach clears all cookies and navigates to the playground.
  // cy.clearCookies() removes all cookies for the current domain.
  beforeEach(() => {
    cy.clearCookies();
    cy.visit(PLAYGROUND);
  });

  // Helper: perform a login by filling the form and clicking the button.
  function login(options: { rememberMe?: boolean } = {}) {
    cy.get('[data-testid="input-username"]').type('admin');
    cy.get('[data-testid="input-password"]').type('password123');
    if (options.rememberMe) {
      // .check() ticks a checkbox. It's a no-op if already checked.
      cy.get('[data-testid="checkbox-remember"]').check();
    }
    cy.get('[data-testid="btn-login"]').click();
  }

  // --------------------------------------------------------------------------
  // Exercise 1: Login and Verify Cookie is Set
  // --------------------------------------------------------------------------
  // After logging in, the playground sets a cookie named 'kyc-session'.
  // We use cy.getCookie() to verify it exists and has the correct value.
  it('exercise 1: login and verify cookie is set', () => {
    // Perform login.
    login();

    // cy.getCookie(name) finds a single cookie by name.
    // It yields a cookie object with properties: name, value, domain,
    // path, httpOnly, secure, expiry.
    // If the cookie doesn't exist, it yields null.
    //
    // Signature:
    //   cy.getCookie(name: string): Chainable<Cookie | null>
    cy.getCookie('kyc-session').should('exist');
    cy.getCookie('kyc-session').should('have.property', 'value', 'admin');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Dashboard is Shown After Login
  // --------------------------------------------------------------------------
  // After login, the login form hides and the dashboard appears with
  // a welcome message.
  it('exercise 2: verify dashboard shown after login', () => {
    // Verify login form is visible before login.
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="dashboard"]').should('not.be.visible');

    // Perform login.
    login();

    // Verify dashboard is visible.
    cy.get('[data-testid="dashboard"]').should('be.visible');
    cy.get('[data-testid="login-form"]').should('not.be.visible');

    // Verify welcome message.
    cy.get('[data-testid="welcome-message"]').should('have.text', 'Welcome, admin!');

    // Verify auth state display.
    cy.get('[data-testid="auth-status-text"]').should('have.text', 'Authenticated as admin');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Logout and Verify Cookie is Cleared
  // --------------------------------------------------------------------------
  // Clicking "Log Out" deletes the cookie and shows the login form.
  it('exercise 3: logout and verify cookie is cleared', () => {
    // Login first.
    login();
    cy.get('[data-testid="dashboard"]').should('be.visible');

    // Click Logout.
    cy.get('[data-testid="btn-logout"]').click();

    // Verify login form is shown again.
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="dashboard"]').should('not.be.visible');

    // Verify auth state.
    cy.get('[data-testid="auth-status-text"]').should('have.text', 'Not Authenticated');

    // Verify the cookie was deleted.
    // When a cookie doesn't exist, cy.getCookie yields null.
    // .should('not.exist') asserts the yielded value is null.
    cy.getCookie('kyc-session').should('not.exist');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Remember Me Sets a Persistent Cookie
  // --------------------------------------------------------------------------
  // When "Remember Me" is checked, the cookie has an expiry date in
  // the future instead of being a session cookie.
  it('exercise 4: remember me sets a persistent cookie', () => {
    // Login with Remember Me.
    login({ rememberMe: true });

    // Verify the cookie exists.
    cy.getCookie('kyc-session').should('exist');

    // Verify the cookie has an expiry in the future.
    // The expiry property is a Unix timestamp (seconds since epoch).
    cy.getCookie('kyc-session').then((cookie) => {
      expect(cookie!.value).to.equal('admin');

      // A persistent cookie has an expiry timestamp.
      // A session cookie has expiry undefined or null in Cypress.
      expect(cookie!.expiry).to.be.a('number');

      // Verify it expires approximately 7 days from now (604800 seconds).
      const now = Date.now() / 1000;
      const expectedExpiry = now + 604800;
      expect(cookie!.expiry).to.be.greaterThan(expectedExpiry - 10);
      expect(cookie!.expiry).to.be.lessThan(expectedExpiry + 10);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Auth State Display
  // --------------------------------------------------------------------------
  // The auth state banner updates its text and CSS class based on
  // authentication status.
  it('exercise 5: verify auth state display changes on login/logout', () => {
    // Before login.
    cy.get('[data-testid="auth-status-text"]').should('have.text', 'Not Authenticated');
    cy.get('[data-testid="auth-state"]').should('have.class', 'logged-out');
    cy.get('[data-testid="auth-state"]').should('not.have.class', 'logged-in');

    // Login.
    login();

    // After login.
    cy.get('[data-testid="auth-status-text"]').should('have.text', 'Authenticated as admin');
    cy.get('[data-testid="auth-state"]').should('have.class', 'logged-in');
    cy.get('[data-testid="auth-state"]').should('not.have.class', 'logged-out');

    // Logout.
    cy.get('[data-testid="btn-logout"]').click();

    // After logout.
    cy.get('[data-testid="auth-status-text"]').should('have.text', 'Not Authenticated');
    cy.get('[data-testid="auth-state"]').should('have.class', 'logged-out');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Reuse Auth State by Setting Cookie Before Visit
  // --------------------------------------------------------------------------
  // Instead of performing the full login flow, we can set the cookie
  // directly using cy.setCookie() and reload. This is useful for
  // skipping login in tests that don't test the login flow itself.
  it('exercise 6: reuse auth state by setting cookie before visit', () => {
    // cy.setCookie(name, value, options?) sets a cookie directly.
    //
    // Signature:
    //   cy.setCookie(name: string, value: string, options?: {
    //     path?: string, domain?: string, secure?: boolean,
    //     httpOnly?: boolean, expiry?: number, sameSite?: string
    //   }): Chainable<Cookie>
    cy.setCookie('kyc-session', 'admin');

    // Reload the page — the playground reads the cookie on load.
    cy.reload();

    // Verify we are on the dashboard without having logged in via the form.
    cy.get('[data-testid="dashboard"]').should('be.visible');
    cy.get('[data-testid="welcome-message"]').should('have.text', 'Welcome, admin!');
    cy.get('[data-testid="auth-status-text"]').should('have.text', 'Authenticated as admin');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Set Cookie Manually and Verify
  // --------------------------------------------------------------------------
  // This exercise demonstrates setting a custom cookie from the test
  // and verifying it appears in the cookie inspector.
  it('exercise 7: set cookie manually and verify in cookie inspector', () => {
    // Set a custom cookie.
    cy.setCookie('custom-test-cookie', 'hello-from-cypress');

    // Reload so the cookie inspector picks up the new cookie.
    cy.reload();

    // Click Refresh to update the cookie display.
    cy.get('[data-testid="btn-refresh-cookies"]').click();

    // Verify the cookie inspector shows our custom cookie.
    cy.get('[data-testid="cookie-display"]').should('contain.text', 'custom-test-cookie');
    cy.get('[data-testid="cookie-display"]').should('contain.text', 'hello-from-cypress');

    // Verify using cy.getCookie.
    cy.getCookie('custom-test-cookie').should('have.property', 'value', 'hello-from-cypress');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Cookie Attributes (Name, Value, Path)
  // --------------------------------------------------------------------------
  // Cookies have attributes like path, domain, and sameSite. This
  // exercise reads and verifies these attributes.
  it('exercise 8: verify cookie attributes after login', () => {
    // Login to create the session cookie.
    login();

    // Get the cookie and inspect its attributes.
    cy.getCookie('kyc-session').then((cookie) => {
      // Verify the cookie exists.
      expect(cookie).to.not.be.null;

      // Verify the name.
      expect(cookie!.name).to.equal('kyc-session');

      // Verify the value.
      expect(cookie!.value).to.equal('admin');

      // Verify the path. Our setCookie sets path to '/'.
      expect(cookie!.path).to.equal('/');

      // Verify the sameSite attribute.
      expect(cookie!.sameSite).to.equal('lax');

      // Session cookies set via JavaScript are not httpOnly.
      expect(cookie!.httpOnly).to.equal(false);
    });

    // cy.getCookies() returns ALL cookies as an array.
    // Useful for checking how many cookies exist.
    //
    // Signature:
    //   cy.getCookies(): Chainable<Cookie[]>
    cy.getCookies().then((cookies) => {
      const ourCookies = cookies.filter(c => c.name.startsWith('kyc-'));
      expect(ourCookies.length).to.be.greaterThan(0);
    });
  });

});
