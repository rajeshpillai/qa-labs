const PLAYGROUND = '/phase-04-api-and-realtime/23-api-mocking/playground/';

// Helper: a standard set of mock risk scores used across tests.
// Each score has an entity name, a numeric score, and a risk level.
const MOCK_SCORES = {
  scores: [
    { entity: 'Acme Corp', score: 72, riskLevel: 'Medium' },
    { entity: 'Beta Ltd', score: 89, riskLevel: 'High' },
    { entity: 'Gamma Inc', score: 34, riskLevel: 'Low' }
  ]
};

describe('Kata 23: API Mocking', () => {

  // --------------------------------------------------------------------------
  // Exercise 1: Mock Successful Scores Response
  // --------------------------------------------------------------------------
  // This exercise demonstrates mocking an API endpoint with cy.intercept()
  // and verifying the UI renders the mock data correctly.
  it('exercise 1: mock successful scores response', () => {
    // Set up the mock BEFORE visiting the page. The dashboard auto-fetches
    // on load, so the intercept must be ready first.
    // cy.intercept(method, url, response) registers a mock response.
    cy.intercept('GET', '/api/risk-scores', {
      statusCode: 200,
      body: MOCK_SCORES
    }).as('getScores');

    cy.visit(PLAYGROUND);

    // cy.wait('@getScores') pauses until the intercepted request completes.
    cy.wait('@getScores');

    // Verify all 3 score cards are rendered.
    cy.get('[data-testid="score-card-0"]').should('be.visible');
    cy.get('[data-testid="score-card-1"]').should('be.visible');
    cy.get('[data-testid="score-card-2"]').should('be.visible');

    // Verify entity names.
    cy.get('[data-testid="entity-name-0"]').should('have.text', 'Acme Corp');
    cy.get('[data-testid="entity-name-1"]').should('have.text', 'Beta Ltd');
    cy.get('[data-testid="entity-name-2"]').should('have.text', 'Gamma Inc');

    // Verify score values.
    cy.get('[data-testid="score-value-0"]').should('have.text', '72');
    cy.get('[data-testid="score-value-1"]').should('have.text', '89');
    cy.get('[data-testid="score-value-2"]').should('have.text', '34');

    // Verify risk labels.
    cy.get('[data-testid="risk-label-0"]').should('have.text', 'Medium Risk');
    cy.get('[data-testid="risk-label-1"]').should('have.text', 'High Risk');
    cy.get('[data-testid="risk-label-2"]').should('have.text', 'Low Risk');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Mock Error Response and Verify Error UI
  // --------------------------------------------------------------------------
  // This exercise returns a 500 error to verify the dashboard's error state.
  it('exercise 2: mock error response and verify error UI', () => {
    cy.intercept('GET', '/api/risk-scores', {
      statusCode: 500,
      body: { message: 'Database connection timeout' }
    }).as('getScores');

    cy.visit(PLAYGROUND);
    cy.wait('@getScores');

    // Verify the error panel is visible with the correct message.
    cy.get('[data-testid="error-panel"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('have.text', 'Database connection timeout');

    // Verify the status bar shows "Error".
    cy.get('[data-testid="status-text"]').should('have.text', 'Error');

    // Verify the retry button is visible.
    cy.get('[data-testid="retry-btn"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Mock Slow Response and Verify Loading State
  // --------------------------------------------------------------------------
  // This exercise adds a delay to the response to verify the loading indicator.
  it('exercise 3: mock slow response and verify loading state', () => {
    // Use a route handler function with req.reply() to add a delay.
    // The delay option specifies milliseconds to wait before sending.
    cy.intercept('GET', '/api/risk-scores', (req) => {
      req.reply({
        statusCode: 200,
        body: MOCK_SCORES,
        // delay adds a simulated network delay in milliseconds.
        delay: 1500
      });
    }).as('getScores');

    cy.visit(PLAYGROUND);

    // Immediately check for the loading indicator. Since the response is
    // delayed by 1.5 seconds, the loading state should be visible.
    cy.get('[data-testid="loading-indicator"]').should('be.visible');
    cy.get('[data-testid="status-text"]').should('have.text', 'Loading...');

    // Wait for the delayed response to complete.
    cy.wait('@getScores');

    // After the response arrives, loading should be hidden.
    cy.get('[data-testid="loading-indicator"]').should('not.be.visible');
    cy.get('[data-testid="score-card-0"]').should('be.visible');
    cy.get('[data-testid="status-text"]').should('have.text', 'Loaded');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Mock Different Data and Verify UI Updates
  // --------------------------------------------------------------------------
  // This exercise changes the mock response between the initial load and a
  // refresh to verify the UI updates.
  it('exercise 4: mock different data and verify UI updates', () => {
    // Use a variable to control the response data.
    let returnUpdated = false;

    const initialScores = {
      scores: [{ entity: 'Acme Corp', score: 72, riskLevel: 'Medium' }]
    };

    const updatedScores = {
      scores: [{ entity: 'Acme Corp', score: 95, riskLevel: 'High' }]
    };

    // Route handler function gives us dynamic control over the response.
    cy.intercept('GET', '/api/risk-scores', (req) => {
      req.reply({
        statusCode: 200,
        body: returnUpdated ? updatedScores : initialScores
      });
    }).as('getScores');

    cy.visit(PLAYGROUND);
    cy.wait('@getScores');

    // Verify initial data.
    cy.get('[data-testid="score-value-0"]').should('have.text', '72');
    cy.get('[data-testid="risk-label-0"]').should('have.text', 'Medium Risk');

    // Switch the mock data and trigger a refresh.
    // We set the flag using .then() to ensure it runs in Cypress's command queue.
    cy.then(() => { returnUpdated = true; });

    cy.get('[data-testid="refresh-btn"]').click();
    cy.wait('@getScores');

    // Verify the UI updated.
    cy.get('[data-testid="score-value-0"]').should('have.text', '95');
    cy.get('[data-testid="risk-label-0"]').should('have.text', 'High Risk');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Conditional Mocking (Different Response Per Request)
  // --------------------------------------------------------------------------
  // This exercise uses a call counter to return different data on each request.
  it('exercise 5: conditional mocking based on request count', () => {
    let callCount = 0;

    cy.intercept('GET', '/api/risk-scores', (req) => {
      callCount++;

      if (callCount === 1) {
        // First call (page load): Delta Corp.
        req.reply({
          statusCode: 200,
          body: {
            scores: [{ entity: 'Delta Corp', score: 55, riskLevel: 'Medium' }]
          }
        });
      } else {
        // Second call (refresh): Epsilon Ltd.
        req.reply({
          statusCode: 200,
          body: {
            scores: [{ entity: 'Epsilon Ltd', score: 28, riskLevel: 'Low' }]
          }
        });
      }
    }).as('getScores');

    cy.visit(PLAYGROUND);
    cy.wait('@getScores');

    // Verify first request shows Delta Corp.
    cy.get('[data-testid="entity-name-0"]').should('have.text', 'Delta Corp');
    cy.get('[data-testid="score-value-0"]').should('have.text', '55');

    // Click Refresh for the second request.
    cy.get('[data-testid="refresh-btn"]').click();
    cy.wait('@getScores');

    // Verify second request shows Epsilon Ltd.
    cy.get('[data-testid="entity-name-0"]').should('have.text', 'Epsilon Ltd');
    cy.get('[data-testid="score-value-0"]').should('have.text', '28');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Mock with Delay
  // --------------------------------------------------------------------------
  // This exercise adds a 500ms delay and verifies the loading/loaded transition.
  it('exercise 6: mock with delay', () => {
    cy.intercept('GET', '/api/risk-scores', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          scores: [{ entity: 'Zeta Corp', score: 60, riskLevel: 'Medium' }]
        },
        delay: 500
      });
    }).as('getScores');

    cy.visit(PLAYGROUND);

    // Verify loading appears during the delay.
    cy.get('[data-testid="loading-indicator"]').should('be.visible');
    // The refresh button should be disabled during loading.
    cy.get('[data-testid="refresh-btn"]').should('be.disabled');

    // Wait for the data to arrive.
    cy.wait('@getScores');

    // After loading, the indicator should be hidden and button re-enabled.
    cy.get('[data-testid="loading-indicator"]').should('not.be.visible');
    cy.get('[data-testid="refresh-btn"]').should('not.be.disabled');
    cy.get('[data-testid="score-card-0"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Request Count
  // --------------------------------------------------------------------------
  // This exercise triggers multiple requests and verifies the UI request
  // counter updates correctly.
  it('exercise 7: verify request count', () => {
    cy.intercept('GET', '/api/risk-scores', {
      statusCode: 200,
      body: MOCK_SCORES
    }).as('getScores');

    cy.visit(PLAYGROUND);
    cy.wait('@getScores');

    // After page load (auto-fetch), the request count should be 1.
    cy.get('[data-testid="request-count-value"]').should('have.text', '1');

    // Click Refresh — count should go to 2.
    cy.get('[data-testid="refresh-btn"]').click();
    cy.wait('@getScores');
    cy.get('[data-testid="request-count-value"]').should('have.text', '2');

    // Click Refresh again — count should go to 3.
    cy.get('[data-testid="refresh-btn"]').click();
    cy.wait('@getScores');
    cy.get('[data-testid="request-count-value"]').should('have.text', '3');

    // Verify the total number of intercepted requests using the alias.
    // cy.get('@alias.all') returns all intercepted requests for this alias.
    cy.get('@getScores.all').should('have.length', 3);
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Mock Partial Failure
  // --------------------------------------------------------------------------
  // First request succeeds, second request (refresh) fails. Verify the error
  // panel appears after the failure.
  it('exercise 8: mock partial failure', () => {
    let callCount = 0;

    cy.intercept('GET', '/api/risk-scores', (req) => {
      callCount++;

      if (callCount === 1) {
        // First request: return valid scores.
        req.reply({
          statusCode: 200,
          body: MOCK_SCORES
        });
      } else {
        // Second request: return a 503 error.
        req.reply({
          statusCode: 503,
          body: { message: 'Service temporarily unavailable' }
        });
      }
    }).as('getScores');

    cy.visit(PLAYGROUND);
    cy.wait('@getScores');

    // Verify initial data loaded successfully.
    cy.get('[data-testid="score-card-0"]').should('be.visible');
    cy.get('[data-testid="entity-name-0"]').should('have.text', 'Acme Corp');

    // Click Refresh — this triggers the failing request.
    cy.get('[data-testid="refresh-btn"]').click();
    cy.wait('@getScores');

    // Verify the error panel shows the error message.
    cy.get('[data-testid="error-panel"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should(
      'have.text',
      'Service temporarily unavailable'
    );

    // Verify status changed to "Error".
    cy.get('[data-testid="status-text"]').should('have.text', 'Error');
  });

});
