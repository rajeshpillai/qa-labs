import { test, expect } from '@playwright/test';

// Base URL for the playground page.
const PLAYGROUND = '/phase-06-complex-scenarios/36-notifications-and-toasts/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Trigger Toast, Verify Appears Then Dismisses
// --------------------------------------------------------------------------
// Shows an info toast and verifies it auto-dismisses after 3 seconds.
test('exercise 1: trigger toast and verify auto-dismiss', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the Info Toast button.
  await page.getByTestId('toast-info-btn').click();

  // Verify the toast appeared.
  // getByTestId('toast-info') finds the dynamically created toast element.
  const toast = page.getByTestId('toast-info');
  await expect(toast).toBeVisible();

  // Verify the toast text content.
  await expect(toast).toContainText('System update available');

  // Wait for auto-dismiss (3 seconds + animation).
  // toBeHidden() with a timeout waits up to that many milliseconds
  // for the element to become invisible or removed from the DOM.
  await expect(toast).toBeHidden({ timeout: 5000 });
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Banner Persists
// --------------------------------------------------------------------------
// Shows the banner and verifies it stays visible (no auto-dismiss).
test('exercise 2: verify banner persists', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Show the banner.
  await page.getByTestId('show-banner-btn').click();

  // Verify the banner is visible.
  await expect(page.getByTestId('banner')).toBeVisible();
  await expect(page.getByTestId('banner-text')).toContainText('maintenance');

  // Wait 2 seconds and verify the banner is still visible (it persists).
  await page.waitForTimeout(2000);
  await expect(page.getByTestId('banner')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 3: Dismiss Notification
// --------------------------------------------------------------------------
// Shows the banner, clicks the dismiss button, verifies it's gone.
test('exercise 3: dismiss banner notification', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Show and verify the banner.
  await page.getByTestId('show-banner-btn').click();
  await expect(page.getByTestId('banner')).toBeVisible();

  // Click the dismiss button (X).
  await page.getByTestId('banner-dismiss').click();

  // Verify the banner is hidden.
  await expect(page.getByTestId('banner')).toBeHidden();

  // Verify the last action was recorded.
  await expect(page.getByTestId('last-action')).toHaveText('Banner dismissed');
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Badge Count
// --------------------------------------------------------------------------
// Triggers multiple notifications and verifies the badge count updates.
test('exercise 4: verify badge count', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Badge should start hidden (0 notifications).
  await expect(page.getByTestId('badge-count')).toBeHidden();

  // Trigger 3 toasts.
  await page.getByTestId('toast-info-btn').click();
  await page.getByTestId('toast-success-btn').click();
  await page.getByTestId('toast-error-btn').click();

  // Verify the badge count is 3.
  await expect(page.getByTestId('badge-count')).toBeVisible();
  await expect(page.getByTestId('badge-count')).toHaveText('3');

  // Verify total notifications count.
  await expect(page.getByTestId('total-notifications')).toHaveText('3');
});

// --------------------------------------------------------------------------
// Exercise 5: Open Notification Drawer
// --------------------------------------------------------------------------
// Clicks the bell icon, verifies the drawer slides in with items.
test('exercise 5: open notification drawer', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Create some notifications first.
  await page.getByTestId('toast-info-btn').click();
  await page.getByTestId('toast-error-btn').click();

  // Click the bell button to open the drawer.
  await page.getByTestId('bell-btn').click();

  // Verify the drawer is open.
  // We check for the 'open' CSS class on the drawer element.
  await expect(page.getByTestId('notification-drawer')).toHaveClass(/open/);

  // Verify the drawer overlay is visible (dim background).
  await expect(page.getByTestId('drawer-overlay')).toBeVisible();

  // Verify the drawer contains notification items.
  // The first notification item has data-testid="drawer-item-0".
  await expect(page.getByTestId('drawer-item-0')).toBeVisible();
  await expect(page.getByTestId('drawer-item-1')).toBeVisible();

  // Verify the badge was reset to 0 (notifications "read").
  await expect(page.getByTestId('badge-count')).toBeHidden();

  // Close the drawer.
  await page.getByTestId('drawer-close').click();
  await expect(page.getByTestId('notification-drawer')).not.toHaveClass(/open/);
});

// --------------------------------------------------------------------------
// Exercise 6: Click Snackbar Action (Undo)
// --------------------------------------------------------------------------
// Shows the snackbar and clicks the Undo button.
test('exercise 6: click snackbar undo action', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Show the snackbar.
  await page.getByTestId('show-snackbar-btn').click();

  // Verify the snackbar is visible with the correct message.
  await expect(page.getByTestId('snackbar')).toBeVisible();
  await expect(page.getByTestId('snackbar-message')).toContainText('Item deleted');

  // Click the Undo button.
  await page.getByTestId('snackbar-undo').click();

  // Verify the snackbar dismissed.
  await expect(page.getByTestId('snackbar')).toBeHidden();

  // Verify the undo status updated.
  await expect(page.getByTestId('undo-status')).toHaveText('Item restored');

  // Verify the last action was "Undo performed".
  await expect(page.getByTestId('last-action')).toHaveText('Undo performed');
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Priority Stacking Order
// --------------------------------------------------------------------------
// Fires priority toasts (info, warning, error) and verifies the error
// toast appears last (visually on top due to column-reverse).
test('exercise 7: verify priority stacking order', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the Priority Toasts button (fires info, then warning, then error).
  await page.getByTestId('priority-toast-btn').click();

  // Wait a moment for all toasts to appear.
  await page.waitForTimeout(500);

  // Get all toast elements in the container.
  // locator.all() returns an array of all matching locators.
  const toasts = await page.locator('.toast').all();

  // There should be 3 toasts.
  expect(toasts.length).toBe(3);

  // The last toast in DOM order is the error (highest priority).
  // Because of column-reverse, the last DOM element appears on top visually.
  const lastToast = toasts[toasts.length - 1];
  await expect(lastToast).toHaveAttribute('data-toast-type', 'error');

  // The first toast in DOM order is the info (lowest priority).
  const firstToast = toasts[0];
  await expect(firstToast).toHaveAttribute('data-toast-type', 'info');
});

// --------------------------------------------------------------------------
// Exercise 8: Multiple Toasts Stacking
// --------------------------------------------------------------------------
// Fires 3 toasts and verifies all are visible simultaneously.
test('exercise 8: multiple toasts stacking', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the "Fire 3 Toasts" button.
  await page.getByTestId('multi-toast-btn').click();

  // Wait for all toasts to appear.
  await page.waitForTimeout(500);

  // Verify the toast container has 3 toasts.
  // locator.count() returns the number of matching elements.
  await expect(page.locator('.toast')).toHaveCount(3);

  // Verify each toast has the expected type.
  await expect(page.getByTestId('toast-info')).toBeVisible();
  await expect(page.getByTestId('toast-success')).toBeVisible();
  await expect(page.getByTestId('toast-warning')).toBeVisible();

  // Verify the total notification count updated.
  await expect(page.getByTestId('total-notifications')).toHaveText('3');

  // Wait for auto-dismiss (3s + animation) and verify all are gone.
  await expect(page.locator('.toast')).toHaveCount(0, { timeout: 6000 });
});
