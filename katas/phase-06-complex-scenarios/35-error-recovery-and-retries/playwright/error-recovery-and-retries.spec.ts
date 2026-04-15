import { test, expect } from '@playwright/test';

// Base URL for the playground page.
const PLAYGROUND = '/phase-06-complex-scenarios/35-error-recovery-and-retries/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Trigger Error, Verify Error Message
// --------------------------------------------------------------------------
// Forces a failure using page.evaluate() and verifies the error message.
test('exercise 1: trigger error and verify error message', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Set the global override to force the random action to fail.
  // page.evaluate(fn) executes the given function in the browser context.
  // We cast window to `any` because __forceResult is a custom property
  // not defined in the Window type.
  await page.evaluate(() => {
    (window as any).__forceResult = 'error';
  });

  // Click the action button.
  await page.getByTestId('random-action-btn').click();

  // Verify the error result is displayed.
  await expect(page.getByTestId('random-result')).toContainText('failed');

  // Verify the retry button appeared.
  await expect(page.getByTestId('random-retry-btn')).toBeVisible();

  // Verify the attempt counter incremented.
  await expect(page.getByTestId('random-attempts')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 2: Click Retry, Verify Recovery
// --------------------------------------------------------------------------
// First forces a failure, then forces success and clicks retry.
test('exercise 2: click retry and verify recovery', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Force failure on first click.
  await page.evaluate(() => { (window as any).__forceResult = 'error'; });
  await page.getByTestId('random-action-btn').click();
  await expect(page.getByTestId('random-result')).toContainText('failed');

  // Now force success for the retry.
  await page.evaluate(() => { (window as any).__forceResult = 'success'; });
  await page.getByTestId('random-retry-btn').click();

  // Verify recovery — the result should now show success.
  await expect(page.getByTestId('random-result')).toContainText('successfully');

  // Verify the retry button is hidden after success.
  await expect(page.getByTestId('random-retry-btn')).toBeHidden();

  // Verify the attempt count is 2 (one failure + one success).
  await expect(page.getByTestId('random-attempts')).toHaveText('2');
});

// --------------------------------------------------------------------------
// Exercise 3: Test with Mocked Consistent Failure
// --------------------------------------------------------------------------
// Forces all attempts to fail and verifies the error persists.
test('exercise 3: test with mocked consistent failure', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Force all actions to fail.
  await page.evaluate(() => { (window as any).__forceResult = 'error'; });

  // Click the action button 3 times.
  for (let i = 0; i < 3; i++) {
    // First click uses the main button, subsequent clicks use the retry button.
    if (i === 0) {
      await page.getByTestId('random-action-btn').click();
    } else {
      await page.getByTestId('random-retry-btn').click();
    }
    // Verify each attempt shows the error.
    await expect(page.getByTestId('random-result')).toContainText('failed');
  }

  // Verify all 3 attempts were counted.
  await expect(page.getByTestId('random-attempts')).toHaveText('3');
});

// --------------------------------------------------------------------------
// Exercise 4: Test Graceful Degradation
// --------------------------------------------------------------------------
// Simulates going offline and verifies cached data is shown as fallback.
test('exercise 4: test graceful degradation with cached data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // First fetch while online — should show fresh data.
  await page.getByTestId('fetch-data-btn').click();
  await expect(page.getByTestId('fetch-result')).toContainText('Live data', { timeout: 3000 });
  await expect(page.getByTestId('data-source')).toHaveText('network');

  // Click "Go Offline" to simulate network failure.
  await page.getByTestId('simulate-offline-btn').click();

  // Fetch again — should show cached data.
  await page.getByTestId('fetch-data-btn').click();
  await expect(page.getByTestId('fetch-result')).toContainText('Cached from', { timeout: 3000 });
  await expect(page.getByTestId('data-source')).toHaveText('cache');
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Circuit Breaker After N Failures
// --------------------------------------------------------------------------
// Forces 3 consecutive failures and verifies the circuit breaker opens.
test('exercise 5: verify circuit breaker after 3 failures', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the circuit starts CLOSED.
  await expect(page.getByTestId('circuit-status')).toHaveText('CLOSED');

  // Force all circuit calls to fail.
  await page.evaluate(() => { (window as any).__circuitForceFailure = true; });

  // Click 3 times to trigger 3 failures.
  for (let i = 0; i < 3; i++) {
    await page.getByTestId('circuit-action-btn').click();
  }

  // Verify the circuit is now OPEN.
  await expect(page.getByTestId('circuit-status')).toHaveText('OPEN');
  await expect(page.getByTestId('circuit-failures')).toHaveText('3');

  // Verify additional calls are blocked.
  await page.getByTestId('circuit-action-btn').click();
  await expect(page.getByTestId('circuit-result')).toContainText('Circuit is OPEN');

  // Reset the circuit and verify it's CLOSED again.
  await page.getByTestId('circuit-reset-btn').click();
  await expect(page.getByTestId('circuit-status')).toHaveText('CLOSED');
  await expect(page.getByTestId('circuit-failures')).toHaveText('0');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Error Boundary UI
// --------------------------------------------------------------------------
// Triggers a component crash and verifies the error boundary displays.
test('exercise 6: verify error boundary UI', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the component content is visible before the crash.
  await expect(page.getByTestId('component-content')).toBeVisible();

  // Click the "Trigger Crash" button.
  await page.getByTestId('crash-btn').click();

  // Verify the error boundary is now visible.
  await expect(page.getByTestId('error-boundary')).toBeVisible();
  await expect(page.getByTestId('error-boundary-message')).toContainText('unexpected error');

  // Verify the component content is hidden.
  await expect(page.getByTestId('component-content')).toBeHidden();

  // Click "Try Again" to recover.
  await page.getByTestId('error-boundary-retry').click();

  // Verify the component is restored and the error boundary is hidden.
  await expect(page.getByTestId('component-content')).toBeVisible();
  await expect(page.getByTestId('error-boundary')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 7: Test Timeout Handling
// --------------------------------------------------------------------------
// Forces a timeout and verifies the timeout error message appears.
test('exercise 7: test timeout handling', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Force the request to time out.
  await page.evaluate(() => { (window as any).__forceTimeout = true; });

  // Click Send Request.
  await page.getByTestId('timeout-btn').click();

  // Verify the loading state appears first.
  await expect(page.getByTestId('timeout-result')).toContainText('in progress');

  // Wait for the timeout (3 seconds) and verify the error.
  await expect(page.getByTestId('timeout-result')).toContainText('timed out', { timeout: 5000 });

  // Verify the retry button appeared.
  await expect(page.getByTestId('timeout-retry-btn')).toBeVisible();

  // Force success and retry.
  await page.evaluate(() => { (window as any).__forceTimeout = false; });
  await page.getByTestId('timeout-retry-btn').click();

  // Verify recovery.
  await expect(page.getByTestId('timeout-result')).toContainText('successfully', { timeout: 3000 });
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Error Does Not Lose Form Data
// --------------------------------------------------------------------------
// Fills the form, submits (first attempt fails), verifies form data is
// preserved, submits again (succeeds).
test('exercise 8: verify error does not lose form data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Fill in the form with test data.
  await page.getByTestId('form-name').fill('John Doe');
  await page.getByTestId('form-email').fill('john@example.com');

  // First submit — should fail (default behavior: first attempt fails).
  await page.getByTestId('form-submit-btn').click();
  await expect(page.getByTestId('form-result')).toContainText('Failed to submit');

  // Verify form data is preserved (inputs still have the entered values).
  // toHaveValue(value) checks the input's current value.
  await expect(page.getByTestId('form-name')).toHaveValue('John Doe');
  await expect(page.getByTestId('form-email')).toHaveValue('john@example.com');

  // Second submit — should succeed.
  await page.getByTestId('form-submit-btn').click();
  await expect(page.getByTestId('form-result')).toContainText('successfully');
  await expect(page.getByTestId('form-result')).toContainText('John Doe');

  // Verify attempt count is 2.
  await expect(page.getByTestId('form-attempts')).toHaveText('2');
});
