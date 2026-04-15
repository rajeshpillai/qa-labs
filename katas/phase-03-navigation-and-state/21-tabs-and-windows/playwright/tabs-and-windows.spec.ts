import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-03-navigation-and-state/21-tabs-and-windows/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Click Link and Handle New Tab
// --------------------------------------------------------------------------
// When a link has target="_blank", clicking it opens a new browser tab.
// In Playwright, new tabs appear as 'popup' events on the page. We use
// page.waitForEvent('popup') to capture the new tab's Page object.
test('exercise 1: click link and handle new tab', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // page.waitForEvent('popup') returns a Promise that resolves to the
  // new Page object when a new tab/window opens.
  //
  // Signature:
  //   page.waitForEvent(event: 'popup'): Promise<Page>
  //
  // We start waiting BEFORE clicking the link to avoid a race condition.
  // Promise.all ensures both the click and the wait happen concurrently.
  const [newTab] = await Promise.all([
    // Wait for the popup (new tab) event.
    page.waitForEvent('popup'),
    // Click the link that opens in a new tab.
    page.getByTestId('link-view-terms').click()
  ]);

  // Wait for the new tab to finish loading.
  await newTab.waitForLoadState('load');

  // Verify the new tab loaded the terms page.
  await expect(newTab.getByTestId('terms-title')).toHaveText('Terms and Conditions');

  // The parent page should show a status update.
  await expect(page.getByTestId('tab-status')).toHaveText('Terms page opened in new tab.');

  // Close the new tab when done.
  await newTab.close();
});

// --------------------------------------------------------------------------
// Exercise 2: Verify New Tab URL
// --------------------------------------------------------------------------
// After opening a new tab, we verify its URL matches the expected page.
test('exercise 2: verify new tab URL', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const [newTab] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('link-view-terms').click()
  ]);

  await newTab.waitForLoadState('load');

  // newTab.url() returns the full URL of the new tab.
  // We verify it contains 'terms.html'.
  expect(newTab.url()).toContain('terms.html');

  // Alternatively, use toHaveURL with a regex pattern.
  await expect(newTab).toHaveURL(/terms\.html/);

  // Verify the new tab's title.
  await expect(newTab).toHaveTitle(/Terms and Conditions/);

  await newTab.close();
});

// --------------------------------------------------------------------------
// Exercise 3: Interact with Popup Content
// --------------------------------------------------------------------------
// After opening a popup, we can interact with its content using the
// popup's Page object — same API as the parent page.
test('exercise 3: interact with popup content', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Open the consent form popup.
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('btn-consent-form').click()
  ]);

  await popup.waitForLoadState('load');

  // Interact with elements in the popup — check all consent checkboxes.
  // The popup's Page object works exactly like the parent's Page object.
  await popup.getByTestId('consent-identity').check();
  await popup.getByTestId('consent-background').check();
  await popup.getByTestId('consent-storage').check();

  // Verify checkboxes are checked.
  // toBeChecked() asserts a checkbox/radio is checked.
  await expect(popup.getByTestId('consent-identity')).toBeChecked();
  await expect(popup.getByTestId('consent-background')).toBeChecked();
  await expect(popup.getByTestId('consent-storage')).toBeChecked();

  // Click "Give Consent" in the popup.
  await popup.getByTestId('btn-give-consent').click();

  // Verify the consent status message appears in the popup.
  await expect(popup.getByTestId('consent-status')).toBeVisible();

  await popup.close();
});

// --------------------------------------------------------------------------
// Exercise 4: Close Popup and Verify Parent State Updates
// --------------------------------------------------------------------------
// When a popup sends a postMessage and closes, the parent window should
// update its state based on the received message.
test('exercise 4: close popup and verify parent state updates', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial parent state.
  await expect(page.getByTestId('consent-given')).toHaveText('No');

  // Open the consent form popup.
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('btn-consent-form').click()
  ]);

  await popup.waitForLoadState('load');

  // Give consent in the popup.
  await popup.getByTestId('consent-identity').check();
  await popup.getByTestId('btn-give-consent').click();

  // The popup sends a postMessage to the parent. Wait for the parent
  // to process it and update its state.
  await expect(page.getByTestId('consent-given')).toHaveText('Yes');

  // Close the popup.
  await popup.close();

  // Verify the parent's popup status updated.
  await expect(page.getByTestId('consent-status-label')).toHaveText('Consent provided');
});

// --------------------------------------------------------------------------
// Exercise 5: Handle window.open() Popup
// --------------------------------------------------------------------------
// The "Start Video Call" button uses window.open() to create a popup.
// In Playwright, this also triggers the 'popup' event.
test('exercise 5: handle window.open popup', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial status.
  await expect(page.getByTestId('video-status-label')).toHaveText('Video call not started');

  // Open the video call popup via the button (which uses window.open).
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('btn-video-call').click()
  ]);

  await popup.waitForLoadState('load');

  // Verify the popup loaded the video call page.
  await expect(popup.getByTestId('video-call-title')).toHaveText('Video Verification Call');

  // Verify the parent shows the video call is in progress.
  await expect(page.getByTestId('video-status-label')).toHaveText('Video call in progress...');

  // End the call in the popup.
  await popup.getByTestId('btn-end-call').click();

  // The popup sends a postMessage before closing. Wait for parent to update.
  await expect(page.getByTestId('video-completed')).toHaveText('Yes');
  await expect(page.getByTestId('video-status-label')).toHaveText('Video call completed');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Cross-Tab Communication (postMessage)
// --------------------------------------------------------------------------
// Popups communicate with the parent window using postMessage.
// This exercise verifies the message log updates when messages are received.
test('exercise 6: verify cross-tab communication via postMessage', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initially, the message log should show the placeholder.
  await expect(page.getByTestId('message-placeholder')).toBeVisible();

  // Open the consent form popup and give consent.
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('btn-consent-form').click()
  ]);

  await popup.waitForLoadState('load');
  await popup.getByTestId('btn-give-consent').click();

  // Verify the message log on the parent page received the message.
  // The placeholder should be gone and a new entry should appear.
  await expect(page.getByTestId('message-entry-1')).toBeVisible();
  await expect(page.getByTestId('message-entry-1')).toContainText('consent-given');

  await popup.close();

  // We can also send a postMessage directly from the test using evaluate.
  // This is useful for testing the message handler without a real popup.
  await page.evaluate(() => {
    window.postMessage(
      { type: 'test-message', message: 'Hello from Playwright test' },
      '*'
    );
  });

  // Verify the test message appeared in the log.
  await expect(page.getByTestId('message-entry-2')).toBeVisible();
  await expect(page.getByTestId('message-entry-2')).toContainText('Hello from Playwright test');
});

// --------------------------------------------------------------------------
// Exercise 7: Switch Between Multiple Tabs
// --------------------------------------------------------------------------
// When multiple tabs/popups are open, we can switch between them using
// the BrowserContext's pages() method.
test('exercise 7: switch between multiple tabs', async ({ page, context }) => {
  await page.goto(PLAYGROUND);

  // Open the terms page in a new tab.
  const [termsTab] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('link-view-terms').click()
  ]);
  await termsTab.waitForLoadState('load');

  // context.pages() returns an array of all open Page objects in the
  // current browser context.
  //
  // Signature:
  //   context.pages(): Page[]
  let allPages = context.pages();

  // We should have 2 pages: the parent and the terms tab.
  expect(allPages.length).toBe(2);

  // We can switch between them by using the respective Page objects.
  // Interact with the terms tab.
  await expect(termsTab.getByTestId('terms-title')).toHaveText('Terms and Conditions');

  // Switch back to the parent page and verify it's still functional.
  await expect(page.getByTestId('page-header')).toBeVisible();
  await expect(page.getByTestId('tab-status')).toHaveText('Terms page opened in new tab.');

  // Accept terms in the new tab.
  await termsTab.getByTestId('btn-accept-terms').click();

  // Verify parent received the message.
  await expect(page.getByTestId('terms-accepted')).toHaveText('Yes');

  // Close the terms tab.
  await termsTab.close();

  // Verify only the parent page remains.
  allPages = context.pages();
  expect(allPages.length).toBe(1);
});

// --------------------------------------------------------------------------
// Exercise 8: Handle Multiple Popups
// --------------------------------------------------------------------------
// Multiple popups can be open simultaneously. We track and interact
// with each one independently.
test('exercise 8: handle multiple popups', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Open the video call popup.
  const [videoPopup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('btn-video-call').click()
  ]);
  await videoPopup.waitForLoadState('load');

  // Open the consent form popup.
  const [consentPopup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByTestId('btn-consent-form').click()
  ]);
  await consentPopup.waitForLoadState('load');

  // Both popups should be open. Verify their titles.
  await expect(videoPopup).toHaveTitle(/Video Verification/);
  await expect(consentPopup).toHaveTitle(/Data Consent/);

  // Verify the active popups count on the parent. The poll interval is
  // 500ms, so we use a retrying assertion.
  await expect(page.getByTestId('active-popups')).toHaveText('2');

  // Interact with the consent popup.
  await consentPopup.getByTestId('consent-identity').check();
  await consentPopup.getByTestId('btn-give-consent').click();
  await expect(page.getByTestId('consent-given')).toHaveText('Yes');

  // Close the consent popup.
  await consentPopup.close();

  // Only the video popup should remain. Wait for the interval to update.
  await expect(page.getByTestId('active-popups')).toHaveText('1');

  // End the video call.
  await videoPopup.getByTestId('btn-end-call').click();
  await expect(page.getByTestId('video-completed')).toHaveText('Yes');

  // Verify the message log has entries from both popups.
  await expect(page.getByTestId('message-entry-1')).toBeVisible();
  await expect(page.getByTestId('message-entry-2')).toBeVisible();
});
