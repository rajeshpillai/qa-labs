import { test, expect } from '@playwright/test';

const PLAYGROUND = '/phase-00-foundations/03-waits-and-timing/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Wait for Delayed Element (1s)
// --------------------------------------------------------------------------
test('exercise 1: wait for 1-second delayed element', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the button that triggers a 1-second delay.
  await page.getByTestId('btn-delay-1s').click();

  // Playwright's expect auto-retries for up to 5 seconds (default).
  // Since the element appears after 1s, this passes within the default timeout.
  // No sleep() or waitForTimeout needed!
  await expect(page.getByTestId('delayed-1s')).toBeVisible();
  await expect(page.getByTestId('delayed-1s')).toHaveText('Appeared after 1 second!');
});

// --------------------------------------------------------------------------
// Exercise 2: Wait for Slow Element (3s)
// --------------------------------------------------------------------------
test('exercise 2: wait for 3-second delayed element', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await page.getByTestId('btn-delay-3s').click();

  // 3 seconds is within the default 5s timeout, so this works too.
  await expect(page.getByTestId('delayed-3s')).toBeVisible();
  await expect(page.getByTestId('delayed-3s')).toHaveText('Appeared after 3 seconds!');
});

// --------------------------------------------------------------------------
// Exercise 2b: Wait for Very Slow Element (7s) - Custom Timeout
// --------------------------------------------------------------------------
test('exercise 2b: wait for 7-second delayed element with custom timeout', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await page.getByTestId('btn-delay-7s').click();

  // 7 seconds exceeds the default 5s timeout. We must increase it.
  // The { timeout } option tells Playwright how long to retry.
  await expect(page.getByTestId('delayed-7s')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('delayed-7s')).toHaveText('Appeared after 7 seconds!');
});

// --------------------------------------------------------------------------
// Exercise 3: Loading State Transition
// --------------------------------------------------------------------------
test('exercise 3: loading spinner then data', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial state.
  await expect(page.getByTestId('initial-message')).toBeVisible();

  // Click the fetch button.
  await page.getByTestId('btn-fetch-data').click();

  // Verify the loading spinner appears.
  // The spinner shows immediately after clicking.
  await expect(page.getByTestId('loading-spinner')).toBeVisible();

  // Now wait for the data to load (replaces the spinner after 2s).
  // We don't need to wait for the spinner to disappear first —
  // just assert the final state and Playwright handles the timing.
  await expect(page.getByTestId('applicant-data')).toBeVisible();
  await expect(page.getByTestId('loaded-name')).toHaveText('Priya Sharma');
  await expect(page.getByTestId('loaded-email')).toHaveText('priya@example.com');
  await expect(page.getByTestId('loaded-status')).toHaveText('Verified');
});

// --------------------------------------------------------------------------
// Exercise 4: Polling / Auto-Refresh
// --------------------------------------------------------------------------
test('exercise 4: wait for polling to complete', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click to start the verification polling process.
  await page.getByTestId('btn-start-polling').click();

  // The status updates every 2 seconds through 5 steps.
  // Total time: ~10 seconds. We need a longer timeout.
  await expect(page.getByTestId('polling-step')).toHaveText('5', { timeout: 15000 });
  await expect(page.getByTestId('polling-status')).toHaveText('Complete');
});

// --------------------------------------------------------------------------
// Exercise 5: Debounced Search
// --------------------------------------------------------------------------
test('exercise 5: debounced search with 300ms delay', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Type into the debounced search box.
  await page.getByTestId('input-debounce-search').fill('Priya');

  // After typing, a "Searching..." indicator shows for 300ms.
  // Then the actual results appear.
  // We just wait for the final state — the search results.
  await expect(page.getByTestId('search-result').first()).toBeVisible();
  await expect(page.getByTestId('search-result').first()).toContainText('Priya Sharma');
});

// --------------------------------------------------------------------------
// Exercise 6: Progress Bar
// --------------------------------------------------------------------------
test('exercise 6: wait for progress bar to complete', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await page.getByTestId('btn-start-upload').click();

  // The progress bar fills incrementally. We wait for the status text
  // to indicate completion rather than checking the exact percentage.
  await expect(page.getByTestId('upload-status')).toHaveText('Processing complete!', { timeout: 10000 });
  await expect(page.getByTestId('upload-percent')).toHaveText('100%');
});

// --------------------------------------------------------------------------
// Exercise 7: Toast Notification Lifecycle
// --------------------------------------------------------------------------
test('exercise 7: toast appears and auto-dismisses', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click to show a success toast.
  await page.getByTestId('btn-toast-success').click();

  // Verify the toast appears immediately.
  const toast = page.getByTestId('toast-1');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Application approved successfully!');

  // The toast auto-dismisses after 3 seconds + 0.5s fade animation.
  // We wait for it to be removed from the DOM.
  // toBeHidden waits for the element to become hidden or detached.
  await expect(toast).toBeHidden({ timeout: 5000 });
});

// --------------------------------------------------------------------------
// Exercise 8: Skeleton to Content
// --------------------------------------------------------------------------
test('exercise 8: skeleton loading then real content', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await page.getByTestId('btn-load-profile').click();

  // Verify skeleton appears.
  await expect(page.getByTestId('skeleton-loader')).toBeVisible();

  // Wait for real profile data (replaces skeleton after 2.5s).
  await expect(page.getByTestId('profile-data')).toBeVisible();
  await expect(page.getByTestId('profile-name')).toHaveText('Amit Patel');
  await expect(page.getByTestId('profile-level')).toHaveText('Level 3 - Enhanced');
});
