import { test, expect } from '@playwright/test';

// Base URL for the playground page.
const PLAYGROUND = '/phase-06-complex-scenarios/33-session-management/playground/';

// Helper: Log in with the default credentials.
// Fills the username and password fields, clicks Sign In, and waits for
// the dashboard to become visible.
async function login(page: import('@playwright/test').Page) {
  await page.getByTestId('username-input').fill('admin');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('login-btn').click();
  await expect(page.getByTestId('dashboard')).toBeVisible();
}

// --------------------------------------------------------------------------
// Exercise 1: Login and Verify Session Active
// --------------------------------------------------------------------------
// Signs in with valid credentials and verifies the dashboard shows an
// active session with the correct user.
test('exercise 1: login and verify session active', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the login panel is visible before signing in.
  await expect(page.getByTestId('login-panel')).toBeVisible();

  // Fill in credentials and click Sign In.
  await page.getByTestId('username-input').fill('admin');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('login-btn').click();

  // Verify the dashboard is now visible and shows correct session info.
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('session-status')).toHaveText('Active');
  await expect(page.getByTestId('session-user')).toHaveText('admin');

  // Verify a token was generated (should contain dots like a JWT).
  const token = await page.getByTestId('token-display').textContent();
  expect(token).toContain('.');
});

// --------------------------------------------------------------------------
// Exercise 2: Wait for Session Warning
// --------------------------------------------------------------------------
// Uses Playwright's clock API to fast-forward time to the warning threshold
// (10 seconds) without waiting real seconds.
test('exercise 2: wait for session warning', async ({ page }) => {
  // Install fake timers BEFORE navigating so all timers are captured.
  // page.clock.install() replaces setTimeout, setInterval, and Date
  // with controllable versions.
  await page.clock.install();
  await page.goto(PLAYGROUND);
  await login(page);

  // Verify the warning banner is not visible initially.
  await expect(page.getByTestId('session-warning')).not.toBeVisible();

  // Advance the clock by 10 seconds. This triggers all setInterval
  // callbacks that would have fired in that period, including the
  // session timer's tick function.
  await page.clock.fastForward(10000);

  // Verify the warning banner is now visible.
  await expect(page.getByTestId('session-warning')).toBeVisible();

  // Verify the session status changed to "Warning".
  await expect(page.getByTestId('session-status')).toHaveText('Warning');
});

// --------------------------------------------------------------------------
// Exercise 3: Refresh Session Before Expiry
// --------------------------------------------------------------------------
// Advances to the warning state, then clicks Refresh to reset the timer.
test('exercise 3: refresh session before expiry', async ({ page }) => {
  await page.clock.install();
  await page.goto(PLAYGROUND);
  await login(page);

  // Advance to warning state (10 seconds).
  await page.clock.fastForward(10000);
  await expect(page.getByTestId('session-warning')).toBeVisible();

  // Click the Refresh Session button to reset the timer.
  await page.getByTestId('refresh-session-btn').click();

  // Verify the warning banner disappeared (timer was reset).
  await expect(page.getByTestId('session-warning')).not.toBeVisible();

  // Verify the session is back to "Active".
  await expect(page.getByTestId('session-status')).toHaveText('Active');

  // Verify the timer reset to 15s.
  await expect(page.getByTestId('session-timer')).toHaveText('15s');

  // Verify the refresh count incremented.
  await expect(page.getByTestId('refresh-count')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 4: Let Session Expire, Verify Overlay
// --------------------------------------------------------------------------
// Advances the clock past the full timeout (15 seconds) and verifies the
// expired overlay appears.
test('exercise 4: let session expire and verify overlay', async ({ page }) => {
  await page.clock.install();
  await page.goto(PLAYGROUND);
  await login(page);

  // Advance the clock by 15 seconds (full session timeout).
  await page.clock.fastForward(15000);

  // Verify the expired overlay is visible.
  await expect(page.getByTestId('expired-overlay')).toBeVisible();

  // Verify the overlay shows the expired message.
  await expect(page.getByTestId('expired-message')).toContainText('timed out');

  // Verify the session status shows "Expired".
  await expect(page.getByTestId('session-status')).toHaveText('Expired');

  // Verify the timer shows 0s.
  await expect(page.getByTestId('session-timer')).toHaveText('0s');
});

// --------------------------------------------------------------------------
// Exercise 5: Re-login After Expiry
// --------------------------------------------------------------------------
// Lets the session expire, clicks "Sign In Again", and logs in again.
test('exercise 5: re-login after session expiry', async ({ page }) => {
  await page.clock.install();
  await page.goto(PLAYGROUND);
  await login(page);

  // Let the session expire.
  await page.clock.fastForward(15000);
  await expect(page.getByTestId('expired-overlay')).toBeVisible();

  // Click the "Sign In Again" button on the overlay.
  await page.getByTestId('relogin-btn').click();

  // Verify the overlay is hidden and the login panel reappears.
  await expect(page.getByTestId('expired-overlay')).not.toBeVisible();
  await expect(page.getByTestId('login-panel')).toBeVisible();

  // Log in again with the same credentials.
  // Need to reinstall clock for the new session timers.
  await page.getByTestId('username-input').fill('admin');
  await page.getByTestId('password-input').fill('password123');
  await page.getByTestId('login-btn').click();

  // Verify the new session is active.
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('session-status')).toHaveText('Active');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Token Refresh
// --------------------------------------------------------------------------
// Refreshes the session and verifies a new token is generated (different
// from the original).
test('exercise 6: verify token refresh generates new token', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await login(page);

  // Capture the initial token.
  const initialToken = await page.getByTestId('token-display').textContent();

  // Click Refresh Session to generate a new token.
  await page.getByTestId('refresh-session-btn').click();

  // Verify a new token was generated (different from the initial).
  // toHaveText with a negation: we get the new text and compare.
  const newToken = await page.getByTestId('token-display').textContent();
  expect(newToken).not.toBe(initialToken);

  // Verify the refresh count incremented to 1.
  await expect(page.getByTestId('refresh-count')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 7: Rapid Interactions Keep Session Alive
// --------------------------------------------------------------------------
// Clicks the Interact button repeatedly to keep the session timer from
// reaching the warning or expiry threshold.
test('exercise 7: rapid interactions keep session alive', async ({ page }) => {
  await page.clock.install();
  await page.goto(PLAYGROUND);
  await login(page);

  // Advance 8 seconds (close to warning at 10s).
  await page.clock.fastForward(8000);

  // Click Interact to reset the timer.
  await page.getByTestId('interact-btn').click();

  // Verify the session is still Active (not Warning).
  await expect(page.getByTestId('session-status')).toHaveText('Active');
  await expect(page.getByTestId('session-timer')).toHaveText('15s');

  // Advance another 8 seconds (would have expired without interaction).
  await page.clock.fastForward(8000);

  // Click Interact again.
  await page.getByTestId('interact-btn').click();

  // Verify the session is still active.
  await expect(page.getByTestId('session-status')).toHaveText('Active');

  // Verify the expired overlay never appeared.
  await expect(page.getByTestId('expired-overlay')).not.toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Session State Across Page Reload
// --------------------------------------------------------------------------
// Logs in, reloads the page, and verifies the session is restored from
// sessionStorage.
test('exercise 8: session state persists across page reload', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await login(page);

  // Verify the session is active before reload.
  await expect(page.getByTestId('session-status')).toHaveText('Active');

  // Reload the page. The session should be restored from sessionStorage.
  // page.reload() navigates the page to its current URL.
  await page.reload();

  // Verify the dashboard is still visible (not the login panel).
  await expect(page.getByTestId('dashboard')).toBeVisible();

  // Verify the session user is still "admin".
  await expect(page.getByTestId('session-user')).toHaveText('admin');

  // Verify the session status is Active (restored from storage).
  await expect(page.getByTestId('session-status')).toHaveText('Active');

  // Verify the token was restored.
  const token = await page.getByTestId('token-display').textContent();
  expect(token).toContain('.');
});
