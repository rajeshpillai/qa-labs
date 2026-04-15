import { test, expect } from '@playwright/test';

// Path to the playground HTML served by the dev server.
// The path is relative to the web server root (the project root).
const PLAYGROUND = '/phase-01-dom-and-browser-apis/11-dom-mutations/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Wait for New Notification (DOM Insertion)
//
// The feed auto-adds a notification every 3 seconds via setInterval.
// We use toHaveCount() which auto-retries until the expected number of
// elements exist in the DOM.
// --------------------------------------------------------------------------
test('exercise 1: wait for a new notification to appear', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initially the feed is empty (no notifications yet).
  // We wait for at least one notification to be inserted into the DOM.
  // toHaveCount() retries automatically — no sleep needed.
  // A notification appears after 3s, well within the default 5s timeout.
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(1, { timeout: 5000 });

  // Verify the notification has visible text content.
  await expect(
    page.getByTestId('notification-text').first()
  ).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Notification Count Increments
//
// Wait for a notification to arrive, then read the unread counter.
// The counter is updated by JavaScript each time a notification is added.
// --------------------------------------------------------------------------
test('exercise 2: verify unread count increments with new notifications', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Wait for the first notification to arrive (DOM insertion).
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(1, { timeout: 5000 });

  // The unread-count text should now be "1".
  // toHaveText() auto-retries until the text matches.
  await expect(
    page.getByTestId('unread-count')
  ).toHaveText('1');

  // Wait for a second notification (another 3 seconds).
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(2, { timeout: 5000 });

  // The unread-count text should now be "2".
  await expect(
    page.getByTestId('unread-count')
  ).toHaveText('2');
});

// --------------------------------------------------------------------------
// Exercise 3: Dismiss a Notification (DOM Removal)
//
// Wait for a notification to appear, click its dismiss button,
// then verify the notification element is removed from the DOM.
// --------------------------------------------------------------------------
test('exercise 3: dismiss a notification and verify removal', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Wait for the first notification to appear.
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(1, { timeout: 5000 });

  // Pause the feed so no new notifications arrive while we test.
  await page.getByTestId('btn-pause-feed').click();

  // Click the dismiss button on the first (and only) notification.
  // The dismiss button removes the parent notification from the DOM.
  await page.getByTestId('btn-dismiss').first().click();

  // Verify the notification is gone — count should be 0.
  // toHaveCount(0) retries until no matching elements remain.
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(0);

  // The unread count should also be 0 after dismissal.
  await expect(
    page.getByTestId('unread-count')
  ).toHaveText('0');
});

// --------------------------------------------------------------------------
// Exercise 4: Mark All as Read (CSS Class Change)
//
// When you click "Mark All Read", each notification element gains the
// CSS class "read". We verify this class change using toHaveClass().
// --------------------------------------------------------------------------
test('exercise 4: mark all as read and verify class change', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Wait for the first notification.
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(1, { timeout: 5000 });

  // Pause the feed so the count stays stable.
  await page.getByTestId('btn-pause-feed').click();

  // Verify the notification does NOT have the "read" class yet.
  // toHaveClass checks the element's className attribute.
  const firstNotification = page.getByTestId('notification-item').first();
  await expect(firstNotification).not.toHaveClass(/read/);

  // Click "Mark All Read".
  await page.getByTestId('btn-mark-all-read').click();

  // Verify the notification now has the "read" class.
  // The CSS class changes the background, border, and text color.
  await expect(firstNotification).toHaveClass(/read/);
});

// --------------------------------------------------------------------------
// Exercise 5: Wait for Price Text to Change (Text Mutation)
//
// The live price updates every 2 seconds. We capture the initial value,
// then use not.toHaveText() to wait until it changes.
// --------------------------------------------------------------------------
test('exercise 5: wait for live price text to change', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Read the initial price text.
  const initialPrice = await page.getByTestId('live-price').textContent();

  // not.toHaveText() auto-retries until the text is different from the
  // initial value. The price updates every 2s, so it should change
  // well within the default 5s timeout.
  await expect(
    page.getByTestId('live-price')
  ).not.toHaveText(initialPrice!, { timeout: 5000 });

  // Also verify the timestamp updates (proving the feed is live).
  await expect(
    page.getByTestId('price-timestamp')
  ).not.toHaveText('--:--:--');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Badge Visibility Based on Count
//
// The unread badge is visible when unreadCount > 0 and hidden when 0.
// We verify the show/hide behavior using toBeVisible/toBeHidden.
// --------------------------------------------------------------------------
test('exercise 6: badge shows when unread, hides when all read', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Wait for a notification to arrive.
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(1, { timeout: 5000 });

  // Badge should be visible (there are unread notifications).
  await expect(
    page.getByTestId('unread-badge')
  ).toBeVisible();

  // Pause the feed and mark all as read.
  await page.getByTestId('btn-pause-feed').click();
  await page.getByTestId('btn-mark-all-read').click();

  // Badge should now be hidden (CSS class "hidden" is added,
  // which sets display: none).
  await expect(
    page.getByTestId('unread-badge')
  ).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 7: Wait for Multiple Notifications to Accumulate
//
// Notifications arrive every 3 seconds. We wait for at least 3 to appear.
// This requires a longer timeout since 3 notifications = ~9 seconds.
// --------------------------------------------------------------------------
test('exercise 7: wait for at least 3 notifications', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // toHaveCount(3) retries until exactly 3 notification-item elements
  // exist. With a 3s interval, this takes ~9s, so we set timeout to 15s.
  await expect(
    page.getByTestId('notification-item')
  ).toHaveCount(3, { timeout: 15000 });

  // Verify the total count display matches.
  await expect(
    page.getByTestId('total-count')
  ).toHaveText('3');
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Element Attribute Changes Dynamically
//
// The "Toggle Priority" button changes data-priority from "normal"
// to "high" on the status message. We verify this with toHaveAttribute().
// --------------------------------------------------------------------------
test('exercise 8: verify attribute changes on toggle', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial attribute value.
  // toHaveAttribute(name, value) checks a specific attribute on the element.
  await expect(
    page.getByTestId('status-message')
  ).toHaveAttribute('data-priority', 'normal');

  // Click the "Toggle Priority" button.
  await page.getByTestId('btn-change-attr').click();

  // Verify the attribute changed to "high".
  await expect(
    page.getByTestId('status-message')
  ).toHaveAttribute('data-priority', 'high');

  // Also verify the text content changed as a result.
  await expect(
    page.getByTestId('status-message')
  ).toHaveText('System status: High priority — maintenance scheduled');

  // Toggle back and verify it reverts.
  await page.getByTestId('btn-change-attr').click();
  await expect(
    page.getByTestId('status-message')
  ).toHaveAttribute('data-priority', 'normal');
});
