const PLAYGROUND = '/phase-06-complex-scenarios/35-error-recovery-and-retries/playground/';

describe('Kata 35: Error Recovery and Retries', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Trigger Error, Verify Error Message
  // --------------------------------------------------------------------------
  // Forces a failure using cy.window() and verifies the error text.
  it('exercise 1: trigger error and verify error message', () => {
    // cy.window() yields the browser's window object.
    // .then(win => ...) lets us set custom properties on it.
    cy.window().then(win => {
      (win as any).__forceResult = 'error';
    });

    // Click the action button.
    cy.get('[data-testid="random-action-btn"]').click();

    // Verify the error message is displayed.
    cy.get('[data-testid="random-result"]').should('contain.text', 'failed');

    // Verify the retry button appeared.
    cy.get('[data-testid="random-retry-btn"]').should('be.visible');

    // Verify attempt count.
    cy.get('[data-testid="random-attempts"]').should('have.text', '1');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Click Retry, Verify Recovery
  // --------------------------------------------------------------------------
  it('exercise 2: click retry and verify recovery', () => {
    // Force failure first.
    cy.window().then(win => { (win as any).__forceResult = 'error'; });
    cy.get('[data-testid="random-action-btn"]').click();
    cy.get('[data-testid="random-result"]').should('contain.text', 'failed');

    // Force success for retry.
    cy.window().then(win => { (win as any).__forceResult = 'success'; });
    cy.get('[data-testid="random-retry-btn"]').click();

    // Verify recovery.
    cy.get('[data-testid="random-result"]').should('contain.text', 'successfully');

    // Verify retry button hidden after success.
    cy.get('[data-testid="random-retry-btn"]').should('not.be.visible');

    // Verify attempt count is 2.
    cy.get('[data-testid="random-attempts"]').should('have.text', '2');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Test with Mocked Consistent Failure
  // --------------------------------------------------------------------------
  it('exercise 3: test with mocked consistent failure', () => {
    cy.window().then(win => { (win as any).__forceResult = 'error'; });

    // Click 3 times. First click on main button, then retry button.
    cy.get('[data-testid="random-action-btn"]').click();
    cy.get('[data-testid="random-result"]').should('contain.text', 'failed');

    cy.get('[data-testid="random-retry-btn"]').click();
    cy.get('[data-testid="random-result"]').should('contain.text', 'failed');

    cy.get('[data-testid="random-retry-btn"]').click();
    cy.get('[data-testid="random-result"]').should('contain.text', 'failed');

    // Verify all 3 attempts counted.
    cy.get('[data-testid="random-attempts"]').should('have.text', '3');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Test Graceful Degradation
  // --------------------------------------------------------------------------
  it('exercise 4: test graceful degradation with cached data', () => {
    // Fetch while online.
    cy.get('[data-testid="fetch-data-btn"]').click();
    cy.get('[data-testid="fetch-result"]').should('contain.text', 'Live data');
    cy.get('[data-testid="data-source"]').should('have.text', 'network');

    // Go offline.
    cy.get('[data-testid="simulate-offline-btn"]').click();

    // Fetch while offline — should show cached data.
    cy.get('[data-testid="fetch-data-btn"]').click();
    cy.get('[data-testid="fetch-result"]').should('contain.text', 'Cached from');
    cy.get('[data-testid="data-source"]').should('have.text', 'cache');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Circuit Breaker After N Failures
  // --------------------------------------------------------------------------
  it('exercise 5: verify circuit breaker after 3 failures', () => {
    // Verify circuit starts CLOSED.
    cy.get('[data-testid="circuit-status"]').should('have.text', 'CLOSED');

    // Force all calls to fail.
    cy.window().then(win => { (win as any).__circuitForceFailure = true; });

    // Trigger 3 failures.
    cy.get('[data-testid="circuit-action-btn"]').click();
    cy.get('[data-testid="circuit-action-btn"]').click();
    cy.get('[data-testid="circuit-action-btn"]').click();

    // Verify circuit is OPEN.
    cy.get('[data-testid="circuit-status"]').should('have.text', 'OPEN');
    cy.get('[data-testid="circuit-failures"]').should('have.text', '3');

    // Verify additional calls are blocked.
    cy.get('[data-testid="circuit-action-btn"]').click();
    cy.get('[data-testid="circuit-result"]').should('contain.text', 'Circuit is OPEN');

    // Reset and verify CLOSED.
    cy.get('[data-testid="circuit-reset-btn"]').click();
    cy.get('[data-testid="circuit-status"]').should('have.text', 'CLOSED');
    cy.get('[data-testid="circuit-failures"]').should('have.text', '0');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Error Boundary UI
  // --------------------------------------------------------------------------
  it('exercise 6: verify error boundary UI', () => {
    // Component visible before crash.
    cy.get('[data-testid="component-content"]').should('be.visible');

    // Trigger crash.
    cy.get('[data-testid="crash-btn"]').click();

    // Error boundary visible.
    cy.get('[data-testid="error-boundary"]').should('be.visible');
    cy.get('[data-testid="error-boundary-message"]').should('contain.text', 'unexpected error');

    // Component hidden.
    cy.get('[data-testid="component-content"]').should('not.be.visible');

    // Recover.
    cy.get('[data-testid="error-boundary-retry"]').click();

    // Component restored, error boundary hidden.
    cy.get('[data-testid="component-content"]').should('be.visible');
    cy.get('[data-testid="error-boundary"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Test Timeout Handling
  // --------------------------------------------------------------------------
  it('exercise 7: test timeout handling', () => {
    // Force timeout.
    cy.window().then(win => { (win as any).__forceTimeout = true; });

    cy.get('[data-testid="timeout-btn"]').click();

    // Verify loading state.
    cy.get('[data-testid="timeout-result"]').should('contain.text', 'in progress');

    // Wait for timeout (3s) and verify error.
    cy.get('[data-testid="timeout-result"]', { timeout: 5000 })
      .should('contain.text', 'timed out');

    // Verify retry button appeared.
    cy.get('[data-testid="timeout-retry-btn"]').should('be.visible');

    // Force success and retry.
    cy.window().then(win => { (win as any).__forceTimeout = false; });
    cy.get('[data-testid="timeout-retry-btn"]').click();

    // Verify recovery.
    cy.get('[data-testid="timeout-result"]', { timeout: 3000 })
      .should('contain.text', 'successfully');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Error Does Not Lose Form Data
  // --------------------------------------------------------------------------
  it('exercise 8: verify error does not lose form data', () => {
    // Fill form.
    cy.get('[data-testid="form-name"]').type('John Doe');
    cy.get('[data-testid="form-email"]').type('john@example.com');

    // First submit fails (default behavior).
    cy.get('[data-testid="form-submit-btn"]').click();
    cy.get('[data-testid="form-result"]').should('contain.text', 'Failed to submit');

    // Verify form data is preserved.
    // .should('have.value', val) checks the input's current value.
    cy.get('[data-testid="form-name"]').should('have.value', 'John Doe');
    cy.get('[data-testid="form-email"]').should('have.value', 'john@example.com');

    // Second submit succeeds.
    cy.get('[data-testid="form-submit-btn"]').click();
    cy.get('[data-testid="form-result"]').should('contain.text', 'successfully');
    cy.get('[data-testid="form-result"]').should('contain.text', 'John Doe');

    // Verify attempt count.
    cy.get('[data-testid="form-attempts"]').should('have.text', '2');
  });
});
