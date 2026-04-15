import { test, expect } from '@playwright/test';

// Base URL for the main playground page.
const PLAYGROUND = '/phase-06-complex-scenarios/32-multi-window-workflows/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Open Review Window
// --------------------------------------------------------------------------
// Demonstrates how to wait for a popup event when window.open() is called.
// Playwright fires a 'popup' event on the page that triggered the open.
test('exercise 1: open review window', async ({ page }) => {
  // Navigate to the main applicant list page.
  await page.goto(PLAYGROUND);

  // Verify the status bar shows no action taken yet.
  await expect(page.getByTestId('last-action')).toHaveText('None');

  // Promise.all ensures we start waiting for the popup BEFORE the click
  // triggers window.open(). If we clicked first, the popup event might
  // fire before we start listening, causing a timeout.
  const [popup] = await Promise.all([
    // waitForEvent('popup') resolves with the new Page object when
    // a new window/tab is opened by this page.
    page.waitForEvent('popup'),
    // Click the Review button for applicant 1 (Alice Johnson).
    page.getByTestId('review-1').click(),
  ]);

  // Wait for the popup to finish loading its HTML and scripts.
  // waitForLoadState() defaults to 'load', meaning the page's load event.
  await popup.waitForLoadState();

  // Verify the popup opened by checking its title.
  await expect(popup).toHaveTitle(/Admin Review Panel/);
});

// --------------------------------------------------------------------------
// Exercise 2: Interact with Popup
// --------------------------------------------------------------------------
// Shows how to click buttons inside a popup window. The popup is a full
// Page object, so all Playwright locator methods work on it.
test('exercise 2: interact with popup window', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-1').click(),
  ]);
  await popup.waitForLoadState();

  // Verify the Approve button is visible and enabled in the popup.
  await expect(popup.getByTestId('approve-btn')).toBeVisible();
  await expect(popup.getByTestId('approve-btn')).toBeEnabled();

  // Click the Approve button inside the popup.
  await popup.getByTestId('approve-btn').click();

  // Verify the decision banner appears in the popup after clicking.
  // The popup shows a success/error banner confirming the action.
  await expect(popup.getByTestId('decision-banner')).toBeVisible();
  await expect(popup.getByTestId('decision-banner')).toContainText('approved');
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Popup Content
// --------------------------------------------------------------------------
// Checks that the popup displays the correct applicant details by reading
// the data-testid elements in the popup page.
test('exercise 3: verify popup shows correct applicant details', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Open the review popup for applicant 1 (Alice Johnson).
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-1').click(),
  ]);
  await popup.waitForLoadState();

  // Verify each field in the popup matches the data from the main page.
  // The popup reads applicant data from URL search parameters.
  await expect(popup.getByTestId('applicant-name')).toHaveText('Alice Johnson');
  await expect(popup.getByTestId('applicant-email')).toHaveText('alice@example.com');
  await expect(popup.getByTestId('applicant-position')).toHaveText('Engineer');
  await expect(popup.getByTestId('applicant-risk')).toHaveText('low');
});

// --------------------------------------------------------------------------
// Exercise 4: Approve in Popup, Verify Main Page Updates
// --------------------------------------------------------------------------
// The core cross-window test: act in the popup, verify the main page
// received the postMessage and updated the applicant status.
test('exercise 4: approve in popup and verify main page updates', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify Alice starts with "pending" status on the main page.
  await expect(page.getByTestId('status-1')).toHaveText('pending');

  // Open the review popup for Alice.
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-1').click(),
  ]);
  await popup.waitForLoadState();

  // Click Approve in the popup. This calls postMessage on window.opener.
  await popup.getByTestId('approve-btn').click();

  // Switch focus back to the main page and verify the status updated.
  // Playwright does not require an explicit "switch" — we simply use the
  // main page's locators. The postMessage handler on the main page updates
  // the DOM asynchronously, so we rely on Playwright's auto-waiting.
  await expect(page.getByTestId('status-1')).toHaveText('approved');

  // Verify the status bar also updated.
  await expect(page.getByTestId('last-action')).toContainText('Alice Johnson');
  await expect(page.getByTestId('last-action')).toContainText('approved');
});

// --------------------------------------------------------------------------
// Exercise 5: Reject in Popup
// --------------------------------------------------------------------------
// Same cross-window flow as exercise 4, but with the Reject action.
test('exercise 5: reject in popup and verify main page updates', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Open the review popup for applicant 2 (Bob Smith).
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-2').click(),
  ]);
  await popup.waitForLoadState();

  // Click Reject in the popup.
  await popup.getByTestId('reject-btn').click();

  // Verify the popup shows the rejection banner.
  await expect(popup.getByTestId('decision-banner')).toContainText('rejected');

  // Verify the main page updated Bob's status to "rejected".
  await expect(page.getByTestId('status-2')).toHaveText('rejected');

  // Verify the Review button for Bob is now disabled on the main page
  // (you cannot review an already-decided applicant).
  await expect(page.getByTestId('review-2')).toBeDisabled();
});

// --------------------------------------------------------------------------
// Exercise 6: Close Popup, Verify Main State
// --------------------------------------------------------------------------
// Tests that closing a popup without taking action preserves the main
// page state (applicant stays pending).
test('exercise 6: close popup without action preserves main state', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Open a review popup for applicant 3 (Clara Nguyen).
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-3').click(),
  ]);
  await popup.waitForLoadState();

  // Close the popup without approving or rejecting.
  // popup.close() closes the browser tab/window.
  await popup.close();

  // Verify Clara's status is still "pending" on the main page.
  await expect(page.getByTestId('status-3')).toHaveText('pending');

  // Verify the last action is still "None" (no decision was made).
  await expect(page.getByTestId('last-action')).toHaveText('None');
});

// --------------------------------------------------------------------------
// Exercise 7: Handle Multiple Popups
// --------------------------------------------------------------------------
// Opens two review popups simultaneously and interacts with both.
test('exercise 7: handle multiple popups', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Open popup for applicant 1 (Alice).
  const [popup1] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-1').click(),
  ]);
  await popup1.waitForLoadState();

  // Open popup for applicant 2 (Bob).
  const [popup2] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-2').click(),
  ]);
  await popup2.waitForLoadState();

  // Verify both popups show the correct applicant names.
  await expect(popup1.getByTestId('applicant-name')).toHaveText('Alice Johnson');
  await expect(popup2.getByTestId('applicant-name')).toHaveText('Bob Smith');

  // Approve Alice in popup1.
  await popup1.getByTestId('approve-btn').click();
  await expect(page.getByTestId('status-1')).toHaveText('approved');

  // Reject Bob in popup2.
  await popup2.getByTestId('reject-btn').click();
  await expect(page.getByTestId('status-2')).toHaveText('rejected');
});

// --------------------------------------------------------------------------
// Exercise 8: Synchronize State Between Windows
// --------------------------------------------------------------------------
// Approves one applicant, then opens another popup and verifies the
// first applicant's decision is reflected on the main page throughout.
test('exercise 8: synchronize state between windows', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Approve applicant 4 (David Park) via popup.
  const [popup4] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-4').click(),
  ]);
  await popup4.waitForLoadState();
  await popup4.getByTestId('approve-btn').click();

  // Wait for the main page to update.
  await expect(page.getByTestId('status-4')).toHaveText('approved');

  // Close the first popup.
  await popup4.close();

  // Now open a popup for applicant 5 (Eva Martinez).
  const [popup5] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('review-5').click(),
  ]);
  await popup5.waitForLoadState();

  // Verify David's status is still "approved" on the main page
  // (state was not lost when we opened a new popup).
  await expect(page.getByTestId('status-4')).toHaveText('approved');

  // Reject Eva in her popup.
  await popup5.getByTestId('reject-btn').click();
  await expect(page.getByTestId('status-5')).toHaveText('rejected');

  // Verify both decisions are reflected on the main page.
  await expect(page.getByTestId('status-4')).toHaveText('approved');
  await expect(page.getByTestId('status-5')).toHaveText('rejected');
});
