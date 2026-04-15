import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
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

// --------------------------------------------------------------------------
// Exercise 1: Mock Successful Scores Response
// --------------------------------------------------------------------------
// This exercise sets up a mock for the /api/risk-scores endpoint and verifies
// that the dashboard renders all score cards correctly.
test('exercise 1: mock successful scores response', async ({ page }) => {
  // Set up the mock BEFORE navigating to the page. The dashboard auto-fetches
  // scores on load, so the mock must be ready before the page makes the request.
  await page.route('/api/risk-scores', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SCORES)
    });
  });

  // Navigate to the playground. The dashboard will auto-fetch and display
  // the mock data.
  await page.goto(PLAYGROUND);

  // Verify all 3 score cards are rendered.
  // getByTestId('score-card-0') targets the first card (zero-indexed).
  await expect(page.getByTestId('score-card-0')).toBeVisible();
  await expect(page.getByTestId('score-card-1')).toBeVisible();
  await expect(page.getByTestId('score-card-2')).toBeVisible();

  // Verify entity names are correct.
  await expect(page.getByTestId('entity-name-0')).toHaveText('Acme Corp');
  await expect(page.getByTestId('entity-name-1')).toHaveText('Beta Ltd');
  await expect(page.getByTestId('entity-name-2')).toHaveText('Gamma Inc');

  // Verify score values.
  // toHaveText(string) checks the element's textContent matches exactly.
  await expect(page.getByTestId('score-value-0')).toHaveText('72');
  await expect(page.getByTestId('score-value-1')).toHaveText('89');
  await expect(page.getByTestId('score-value-2')).toHaveText('34');

  // Verify risk labels.
  await expect(page.getByTestId('risk-label-0')).toHaveText('Medium Risk');
  await expect(page.getByTestId('risk-label-1')).toHaveText('High Risk');
  await expect(page.getByTestId('risk-label-2')).toHaveText('Low Risk');
});

// --------------------------------------------------------------------------
// Exercise 2: Mock Error Response and Verify Error UI
// --------------------------------------------------------------------------
// This exercise returns a 500 error and verifies the dashboard shows the
// error panel with the correct message.
test('exercise 2: mock error response and verify error UI', async ({ page }) => {
  await page.route('/api/risk-scores', async (route) => {
    // Return a 500 Internal Server Error with an error message.
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Database connection timeout' })
    });
  });

  await page.goto(PLAYGROUND);

  // Verify the error panel is visible with the correct error message.
  await expect(page.getByTestId('error-panel')).toBeVisible();
  await expect(page.getByTestId('error-message')).toHaveText('Database connection timeout');

  // Verify the status bar shows "Error".
  await expect(page.getByTestId('status-text')).toHaveText('Error');

  // Verify the retry button is visible inside the error panel.
  await expect(page.getByTestId('retry-btn')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 3: Mock Slow Response and Verify Loading State
// --------------------------------------------------------------------------
// This exercise adds a delay to the mock response so we can verify the
// loading indicator appears during the request.
test('exercise 3: mock slow response and verify loading state', async ({ page }) => {
  await page.route('/api/risk-scores', async (route) => {
    // Wait 1.5 seconds before responding to simulate a slow server.
    // We use a Promise with setTimeout to create the delay.
    await new Promise(resolve => setTimeout(resolve, 1500));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SCORES)
    });
  });

  await page.goto(PLAYGROUND);

  // The loading indicator should be visible while waiting for the response.
  // toBeVisible() retries until the element appears (up to the test timeout).
  await expect(page.getByTestId('loading-indicator')).toBeVisible();

  // The status text should say "Loading..." during the request.
  await expect(page.getByTestId('status-text')).toHaveText('Loading...');

  // Wait for the loading to finish — the indicator should disappear.
  // toBeHidden() retries until the element is no longer visible.
  await expect(page.getByTestId('loading-indicator')).toBeHidden({ timeout: 5000 });

  // After loading completes, the data should be visible.
  await expect(page.getByTestId('score-card-0')).toBeVisible();
  await expect(page.getByTestId('status-text')).toHaveText('Loaded');
});

// --------------------------------------------------------------------------
// Exercise 4: Mock Different Data and Verify UI Updates
// --------------------------------------------------------------------------
// This exercise changes the mock data between the initial load and a refresh
// to verify the UI updates accordingly.
test('exercise 4: mock different data and verify UI updates', async ({ page }) => {
  // Use a variable to control which data the mock returns.
  let returnUpdated = false;

  const initialScores = {
    scores: [{ entity: 'Acme Corp', score: 72, riskLevel: 'Medium' }]
  };

  const updatedScores = {
    scores: [{ entity: 'Acme Corp', score: 95, riskLevel: 'High' }]
  };

  await page.route('/api/risk-scores', async (route) => {
    // Return different data based on the flag.
    const data = returnUpdated ? updatedScores : initialScores;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data)
    });
  });

  await page.goto(PLAYGROUND);

  // Verify initial data is displayed.
  await expect(page.getByTestId('score-value-0')).toHaveText('72');
  await expect(page.getByTestId('risk-label-0')).toHaveText('Medium Risk');

  // Switch the mock to return updated data.
  returnUpdated = true;

  // Click Refresh to trigger a new request with the updated mock.
  await page.getByTestId('refresh-btn').click();

  // Verify the UI updated to show the new data.
  await expect(page.getByTestId('score-value-0')).toHaveText('95');
  await expect(page.getByTestId('risk-label-0')).toHaveText('High Risk');
});

// --------------------------------------------------------------------------
// Exercise 5: Conditional Mocking (Different Response Per Request)
// --------------------------------------------------------------------------
// This exercise uses a call counter inside the route handler to return
// different responses on each request.
test('exercise 5: conditional mocking based on request count', async ({ page }) => {
  // Track how many times the handler has been called.
  let callCount = 0;

  await page.route('/api/risk-scores', async (route) => {
    callCount++;

    if (callCount === 1) {
      // First request (page load): return one entity.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [{ entity: 'Delta Corp', score: 55, riskLevel: 'Medium' }]
        })
      });
    } else {
      // Second request (refresh): return a different entity.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [{ entity: 'Epsilon Ltd', score: 28, riskLevel: 'Low' }]
        })
      });
    }
  });

  await page.goto(PLAYGROUND);

  // Verify first request shows Delta Corp.
  await expect(page.getByTestId('entity-name-0')).toHaveText('Delta Corp');
  await expect(page.getByTestId('score-value-0')).toHaveText('55');

  // Click Refresh to trigger the second request.
  await page.getByTestId('refresh-btn').click();

  // Verify second request shows Epsilon Ltd.
  await expect(page.getByTestId('entity-name-0')).toHaveText('Epsilon Ltd');
  await expect(page.getByTestId('score-value-0')).toHaveText('28');
});

// --------------------------------------------------------------------------
// Exercise 6: Mock with Delay
// --------------------------------------------------------------------------
// This exercise adds a 500ms delay and verifies the loading state appears
// and then transitions to the loaded state.
test('exercise 6: mock with delay', async ({ page }) => {
  await page.route('/api/risk-scores', async (route) => {
    // Add a 500ms delay to simulate moderate network latency.
    await new Promise(resolve => setTimeout(resolve, 500));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        scores: [{ entity: 'Zeta Corp', score: 60, riskLevel: 'Medium' }]
      })
    });
  });

  await page.goto(PLAYGROUND);

  // Verify loading appears during the delay.
  await expect(page.getByTestId('loading-indicator')).toBeVisible();
  await expect(page.getByTestId('refresh-btn')).toBeDisabled();

  // Wait for the data to load.
  await expect(page.getByTestId('score-card-0')).toBeVisible({ timeout: 3000 });

  // After loading, the indicator should be hidden and the button re-enabled.
  await expect(page.getByTestId('loading-indicator')).toBeHidden();
  await expect(page.getByTestId('refresh-btn')).toBeEnabled();
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Request Count
// --------------------------------------------------------------------------
// This exercise triggers multiple requests and verifies the request counter
// in the dashboard UI updates correctly.
test('exercise 7: verify request count', async ({ page }) => {
  await page.route('/api/risk-scores', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SCORES)
    });
  });

  await page.goto(PLAYGROUND);

  // Wait for the initial auto-fetch to complete.
  await expect(page.getByTestId('score-card-0')).toBeVisible();

  // Verify request count is 1 after page load.
  await expect(page.getByTestId('request-count-value')).toHaveText('1');

  // Click Refresh — count should go to 2.
  await page.getByTestId('refresh-btn').click();
  await expect(page.getByTestId('request-count-value')).toHaveText('2');

  // Click Refresh again — count should go to 3.
  await page.getByTestId('refresh-btn').click();
  await expect(page.getByTestId('request-count-value')).toHaveText('3');
});

// --------------------------------------------------------------------------
// Exercise 8: Mock Partial Failure
// --------------------------------------------------------------------------
// This exercise simulates a scenario where the first request succeeds (data
// loads) but the second request (refresh) fails with an error.
test('exercise 8: mock partial failure', async ({ page }) => {
  let callCount = 0;

  await page.route('/api/risk-scores', async (route) => {
    callCount++;

    if (callCount === 1) {
      // First request: return valid scores.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SCORES)
      });
    } else {
      // Second request: return a 503 Service Unavailable error.
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Service temporarily unavailable' })
      });
    }
  });

  await page.goto(PLAYGROUND);

  // Verify the initial load succeeded — scores are visible.
  await expect(page.getByTestId('score-card-0')).toBeVisible();
  await expect(page.getByTestId('entity-name-0')).toHaveText('Acme Corp');

  // Click Refresh — this triggers the failing second request.
  await page.getByTestId('refresh-btn').click();

  // Verify the error panel appears with the error message.
  await expect(page.getByTestId('error-panel')).toBeVisible();
  await expect(page.getByTestId('error-message')).toHaveText(
    'Service temporarily unavailable'
  );

  // Verify the status changed to "Error".
  await expect(page.getByTestId('status-text')).toHaveText('Error');
});
