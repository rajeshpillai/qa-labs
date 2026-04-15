import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-03-navigation-and-state/20-cookies-and-auth-state/playground/';

// Helper: perform a login by filling the form and clicking the button.
async function login(page: import('@playwright/test').Page, { rememberMe = false } = {}) {
  await page.getByTestId('input-username').fill('admin');
  await page.getByTestId('input-password').fill('password123');
  if (rememberMe) {
    // check() ticks a checkbox. It's a no-op if already checked.
    await page.getByTestId('checkbox-remember').check();
  }
  await page.getByTestId('btn-login').click();
}

// --------------------------------------------------------------------------
// Exercise 1: Login and Verify Cookie is Set
// --------------------------------------------------------------------------
// After logging in, the playground sets a cookie named 'kyc-session'.
// We verify the cookie exists and has the correct value.
test('exercise 1: login and verify cookie is set', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Perform login.
  await login(page);

  // page.context().cookies(url) returns an array of Cookie objects for
  // the given URL. Each cookie has properties: name, value, domain,
  // path, expires, httpOnly, secure, sameSite.
  const cookies = await page.context().cookies();

  // Find the kyc-session cookie in the list.
  // Array.find() returns the first element matching the condition.
  const sessionCookie = cookies.find(c => c.name === 'kyc-session');

  // Verify the cookie exists and has the correct value.
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie!.value).toBe('admin');

  // A session cookie (no "Remember Me") has expires = -1, meaning it
  // expires when the browser session ends.
  expect(sessionCookie!.expires).toBe(-1);
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Dashboard is Shown After Login
// --------------------------------------------------------------------------
// After a successful login, the login form should be hidden and the
// dashboard should be visible with a welcome message.
test('exercise 2: verify dashboard shown after login', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify login form is visible before login.
  await expect(page.getByTestId('login-form')).toBeVisible();
  await expect(page.getByTestId('dashboard')).toBeHidden();

  // Perform login.
  await login(page);

  // Verify dashboard is now visible.
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('login-form')).toBeHidden();

  // Verify the welcome message.
  await expect(page.getByTestId('welcome-message')).toHaveText('Welcome, admin!');

  // Verify the auth state display.
  await expect(page.getByTestId('auth-status-text')).toHaveText('Authenticated as admin');
});

// --------------------------------------------------------------------------
// Exercise 3: Logout and Verify Cookie is Cleared
// --------------------------------------------------------------------------
// Clicking "Log Out" should delete the session cookie and return to the
// login form.
test('exercise 3: logout and verify cookie is cleared', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Login first.
  await login(page);
  await expect(page.getByTestId('dashboard')).toBeVisible();

  // Click Logout.
  await page.getByTestId('btn-logout').click();

  // Verify the login form is shown again.
  await expect(page.getByTestId('login-form')).toBeVisible();
  await expect(page.getByTestId('dashboard')).toBeHidden();

  // Verify the auth state display.
  await expect(page.getByTestId('auth-status-text')).toHaveText('Not Authenticated');

  // Verify the cookie was deleted.
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'kyc-session');
  expect(sessionCookie).toBeUndefined();
});

// --------------------------------------------------------------------------
// Exercise 4: Remember Me Sets a Persistent Cookie
// --------------------------------------------------------------------------
// When "Remember Me" is checked, the cookie should have a max-age (expires
// in the future) instead of being a session cookie.
test('exercise 4: remember me sets a persistent cookie', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Login with Remember Me checked.
  await login(page, { rememberMe: true });

  // Get the cookies and find the session cookie.
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'kyc-session');

  expect(sessionCookie).toBeDefined();
  expect(sessionCookie!.value).toBe('admin');

  // A persistent cookie has an expires timestamp in the future.
  // The expires field is a Unix timestamp (seconds since epoch).
  // We verify it's greater than the current time.
  const now = Date.now() / 1000; // Convert milliseconds to seconds.
  expect(sessionCookie!.expires).toBeGreaterThan(now);

  // The cookie should expire approximately 7 days from now (604800 seconds).
  // We allow some tolerance (within 10 seconds) for test execution time.
  const expectedExpiry = now + 604800;
  expect(sessionCookie!.expires).toBeGreaterThan(expectedExpiry - 10);
  expect(sessionCookie!.expires).toBeLessThan(expectedExpiry + 10);
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Auth State Display
// --------------------------------------------------------------------------
// The auth state banner at the top shows whether the user is authenticated
// and updates its CSS class accordingly.
test('exercise 5: verify auth state display changes on login/logout', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Before login: should show "Not Authenticated" with logged-out class.
  await expect(page.getByTestId('auth-status-text')).toHaveText('Not Authenticated');
  await expect(page.getByTestId('auth-state')).toHaveClass(/logged-out/);
  await expect(page.getByTestId('auth-state')).not.toHaveClass(/logged-in/);

  // Login.
  await login(page);

  // After login: should show "Authenticated as admin" with logged-in class.
  await expect(page.getByTestId('auth-status-text')).toHaveText('Authenticated as admin');
  await expect(page.getByTestId('auth-state')).toHaveClass(/logged-in/);
  await expect(page.getByTestId('auth-state')).not.toHaveClass(/logged-out/);

  // Logout.
  await page.getByTestId('btn-logout').click();

  // Should revert to logged-out state.
  await expect(page.getByTestId('auth-status-text')).toHaveText('Not Authenticated');
  await expect(page.getByTestId('auth-state')).toHaveClass(/logged-out/);
});

// --------------------------------------------------------------------------
// Exercise 6: Reuse Auth State Across Tests with storageState
// --------------------------------------------------------------------------
// Playwright can save and restore browser state (cookies, localStorage)
// using storageState. This exercise demonstrates saving the auth state
// after login and restoring it to skip the login step in a subsequent test.
test('exercise 6: reuse auth state by setting cookies before navigation', async ({ page, context }) => {
  // Instead of performing the full login flow, we can set the cookie
  // directly using context.addCookies(). This simulates restoring a
  // saved auth state.
  //
  // context.addCookies(cookies) adds cookies to the browser context.
  // Each cookie object must include: name, value, url OR (domain + path).
  //
  // Signature:
  //   context.addCookies(cookies: Array<{
  //     name: string, value: string, url?: string,
  //     domain?: string, path?: string, expires?: number,
  //     httpOnly?: boolean, secure?: boolean, sameSite?: 'Strict' | 'Lax' | 'None'
  //   }>): Promise<void>

  // We need the page URL's origin. Let's navigate first to get the URL.
  await page.goto(PLAYGROUND);
  const url = page.url();

  // Add the session cookie directly (skipping the login form).
  await context.addCookies([{
    name: 'kyc-session',
    value: 'admin',
    url: url
  }]);

  // Reload the page — the playground reads the cookie on load and
  // auto-shows the dashboard.
  await page.reload();

  // Verify we are on the dashboard without having logged in via the form.
  await expect(page.getByTestId('dashboard')).toBeVisible();
  await expect(page.getByTestId('welcome-message')).toHaveText('Welcome, admin!');
  await expect(page.getByTestId('auth-status-text')).toHaveText('Authenticated as admin');
});

// --------------------------------------------------------------------------
// Exercise 7: Set Cookie Manually and Verify
// --------------------------------------------------------------------------
// This exercise demonstrates setting a cookie directly from the test
// code and verifying it appears in the playground's cookie inspector.
test('exercise 7: set cookie manually and verify in cookie inspector', async ({ page, context }) => {
  await page.goto(PLAYGROUND);

  // Set a custom cookie via the Playwright context API.
  await context.addCookies([{
    name: 'custom-test-cookie',
    value: 'hello-from-playwright',
    url: page.url()
  }]);

  // Reload so the cookie inspector picks up the new cookie.
  await page.reload();

  // Click Refresh to update the cookie display.
  await page.getByTestId('btn-refresh-cookies').click();

  // Verify the cookie inspector shows our custom cookie.
  await expect(page.getByTestId('cookie-display')).toContainText('custom-test-cookie');
  await expect(page.getByTestId('cookie-display')).toContainText('hello-from-playwright');

  // Verify by reading cookies from the context.
  const cookies = await context.cookies();
  const customCookie = cookies.find(c => c.name === 'custom-test-cookie');
  expect(customCookie).toBeDefined();
  expect(customCookie!.value).toBe('hello-from-playwright');
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Cookie Attributes (Name, Value, Path)
// --------------------------------------------------------------------------
// Cookies have several attributes beyond name and value. This exercise
// verifies the path and sameSite attributes of the session cookie.
test('exercise 8: verify cookie attributes after login', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Login to create the session cookie.
  await login(page);

  // Get all cookies for the current context.
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'kyc-session');

  // Verify the cookie exists.
  expect(sessionCookie).toBeDefined();

  // Verify the cookie name.
  expect(sessionCookie!.name).toBe('kyc-session');

  // Verify the cookie value.
  expect(sessionCookie!.value).toBe('admin');

  // Verify the cookie path. Our setCookie function sets path to '/'.
  expect(sessionCookie!.path).toBe('/');

  // Verify the SameSite attribute. We set it to 'Lax' in the playground.
  // Playwright normalizes the case to title case.
  expect(sessionCookie!.sameSite).toBe('Lax');

  // Session cookies are not httpOnly (they were set via JavaScript,
  // not via HTTP response headers).
  expect(sessionCookie!.httpOnly).toBe(false);

  // Verify cookie count — after login there should be at least the
  // session cookie.
  const ourCookies = cookies.filter(c => c.name.startsWith('kyc-'));
  expect(ourCookies.length).toBeGreaterThanOrEqual(1);
});
