const PLAYGROUND = '/phase-00-foundations/03-waits-and-timing/playground/';

describe('Kata 03: Waits and Timing', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Wait for Delayed Element (1s)
  // --------------------------------------------------------------------------
  it('exercise 1: wait for 1-second delayed element', () => {
    cy.get('[data-testid="btn-delay-1s"]').click();

    // Cypress automatically retries .should() assertions for up to 4s (default).
    // Since the element appears after 1s, this works within the default timeout.
    // No cy.wait(1000) needed!
    cy.get('[data-testid="delayed-1s"]')
      .should('be.visible')
      .and('have.text', 'Appeared after 1 second!');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Wait for Slow Element (3s)
  // --------------------------------------------------------------------------
  it('exercise 2: wait for 3-second delayed element', () => {
    cy.get('[data-testid="btn-delay-3s"]').click();

    // 3s is within the default 4s timeout, so this works.
    cy.get('[data-testid="delayed-3s"]')
      .should('be.visible')
      .and('have.text', 'Appeared after 3 seconds!');
  });

  // --------------------------------------------------------------------------
  // Exercise 2b: Wait for Very Slow Element (7s) - Custom Timeout
  // --------------------------------------------------------------------------
  it('exercise 2b: wait for 7-second delayed element with custom timeout', () => {
    cy.get('[data-testid="btn-delay-7s"]').click();

    // 7s exceeds the default 4s timeout. Pass { timeout } to cy.get
    // to increase the retry window for this specific command.
    cy.get('[data-testid="delayed-7s"]', { timeout: 10000 })
      .should('be.visible')
      .and('have.text', 'Appeared after 7 seconds!');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Loading State Transition
  // --------------------------------------------------------------------------
  it('exercise 3: loading spinner then data', () => {
    // Verify initial state.
    cy.get('[data-testid="initial-message"]').should('be.visible');

    // Click the fetch button.
    cy.get('[data-testid="btn-fetch-data"]').click();

    // Verify the loading spinner appears.
    cy.get('[data-testid="loading-spinner"]').should('be.visible');

    // Wait for the data to load (replaces spinner after 2s).
    // Cypress retries .should until the element appears.
    cy.get('[data-testid="applicant-data"]', { timeout: 5000 })
      .should('be.visible');

    cy.get('[data-testid="loaded-name"]').should('have.text', 'Priya Sharma');
    cy.get('[data-testid="loaded-email"]').should('have.text', 'priya@example.com');
    cy.get('[data-testid="loaded-status"]').should('have.text', 'Verified');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Polling / Auto-Refresh
  // --------------------------------------------------------------------------
  it('exercise 4: wait for polling to complete', () => {
    cy.get('[data-testid="btn-start-polling"]').click();

    // The polling takes ~10 seconds (5 steps x 2s each).
    // We need a longer timeout to wait for the final state.
    cy.get('[data-testid="polling-step"]', { timeout: 15000 })
      .should('have.text', '5');

    cy.get('[data-testid="polling-status"]')
      .should('have.text', 'Complete');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Debounced Search
  // --------------------------------------------------------------------------
  it('exercise 5: debounced search with 300ms delay', () => {
    // Type into the debounced search box.
    cy.get('[data-testid="input-debounce-search"]').type('Priya');

    // After typing, a "Searching..." indicator shows for 300ms,
    // then the actual results appear.
    // We just assert the final state — Cypress retries until results show.
    cy.get('[data-testid="search-result"]')
      .should('have.length.gte', 1)
      .first()
      .should('contain.text', 'Priya Sharma');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Progress Bar
  // --------------------------------------------------------------------------
  it('exercise 6: wait for progress bar to complete', () => {
    cy.get('[data-testid="btn-start-upload"]').click();

    // Wait for the status text to indicate completion.
    cy.get('[data-testid="upload-status"]', { timeout: 10000 })
      .should('have.text', 'Processing complete!');

    cy.get('[data-testid="upload-percent"]')
      .should('have.text', '100%');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Toast Notification Lifecycle
  // --------------------------------------------------------------------------
  it('exercise 7: toast appears and auto-dismisses', () => {
    cy.get('[data-testid="btn-toast-success"]').click();

    // Verify the toast appears.
    cy.get('[data-testid="toast-1"]')
      .should('be.visible')
      .and('contain.text', 'Application approved successfully!');

    // The toast auto-dismisses after 3s + 0.5s fade.
    // 'not.exist' waits for the element to be removed from the DOM entirely.
    cy.get('[data-testid="toast-1"]', { timeout: 5000 })
      .should('not.exist');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Skeleton to Content
  // --------------------------------------------------------------------------
  it('exercise 8: skeleton loading then real content', () => {
    cy.get('[data-testid="btn-load-profile"]').click();

    // Verify skeleton appears.
    cy.get('[data-testid="skeleton-loader"]').should('be.visible');

    // Wait for real profile data (replaces skeleton after 2.5s).
    cy.get('[data-testid="profile-data"]', { timeout: 5000 })
      .should('be.visible');

    cy.get('[data-testid="profile-name"]').should('have.text', 'Amit Patel');
    cy.get('[data-testid="profile-level"]').should('have.text', 'Level 3 - Enhanced');
  });

});
