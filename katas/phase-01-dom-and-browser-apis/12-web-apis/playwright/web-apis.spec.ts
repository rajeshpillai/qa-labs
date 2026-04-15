import { test, expect } from '@playwright/test';

// Path to the playground HTML served by the dev server.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/12-web-apis/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Copy to Clipboard and Verify
//
// We grant clipboard permissions, click the copy button, then read
// the clipboard content using page.evaluate() to call the browser's
// Clipboard API.
// --------------------------------------------------------------------------
test('exercise 1: copy account number to clipboard', async ({ page, context }) => {
  // Grant clipboard-read and clipboard-write permissions so the page
  // can access the clipboard without a user gesture prompt.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto(PLAYGROUND);

  // Click the "Copy Account Number" button.
  await page.getByTestId('btn-copy-account').click();

  // Verify the status message shows "Copied to clipboard!".
  await expect(page.getByTestId('copy-status')).toHaveText('Copied to clipboard!');

  // Read the clipboard content using page.evaluate().
  // navigator.clipboard.readText() is an async browser API that returns
  // the current clipboard text.
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

  // Verify the clipboard contains the expected account number.
  expect(clipboardText).toBe('1234-5678-9012-3456');
});

// --------------------------------------------------------------------------
// Exercise 2: Mock Geolocation and Verify Coordinates
//
// We set a fake geolocation on the browser context BEFORE navigating.
// When the page calls navigator.geolocation.getCurrentPosition(),
// it receives our mocked coordinates instead of real GPS data.
// --------------------------------------------------------------------------
test('exercise 2: mock geolocation and verify displayed coordinates', async ({ page, context }) => {
  // Grant geolocation permission so the page doesn't show a prompt.
  await context.grantPermissions(['geolocation']);

  // Set the fake geolocation — these are coordinates for New Delhi, India.
  await context.setGeolocation({ latitude: 28.6139, longitude: 77.2090 });

  await page.goto(PLAYGROUND);

  // Click "Detect Location".
  await page.getByTestId('btn-detect-location').click();

  // Verify the displayed latitude and longitude match our mocked values.
  // toFixed(4) in the playground formats them as "28.6139" and "77.2090".
  await expect(page.getByTestId('location-lat')).toHaveText('28.6139');
  await expect(page.getByTestId('location-lng')).toHaveText('77.2090');

  // Verify the result box shows a success message.
  await expect(page.getByTestId('location-result')).toContainText('Location detected');
});

// --------------------------------------------------------------------------
// Exercise 3: Handle Alert Dialog
//
// page.on('dialog') registers a listener that fires whenever the page
// triggers alert(), confirm(), or prompt(). We MUST register the
// listener BEFORE clicking the button, because the dialog blocks JS.
// --------------------------------------------------------------------------
test('exercise 3: handle alert dialog and verify message', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Variable to capture the alert message text.
  let alertMessage = '';

  // Register the dialog handler BEFORE triggering the alert.
  // dialog.type() tells us which kind of dialog it is ('alert', 'confirm', 'prompt').
  // dialog.message() returns the text shown in the dialog.
  // dialog.accept() dismisses the dialog (same as clicking OK).
  page.on('dialog', async (dialog) => {
    alertMessage = dialog.message();
    await dialog.accept();
  });

  // Click the button that triggers alert().
  await page.getByTestId('btn-trigger-alert').click();

  // Verify the alert had the expected message.
  expect(alertMessage).toBe('Payment of Rs 5,000 has been processed successfully!');

  // Verify the page updated after the dialog was dismissed.
  await expect(page.getByTestId('dialog-result')).toHaveText('Alert was dismissed.');
});

// --------------------------------------------------------------------------
// Exercise 4: Handle Confirm Dialog (Accept and Dismiss)
//
// confirm() returns true when accepted (OK) and false when dismissed
// (Cancel). We test both cases to verify the page reacts correctly.
// --------------------------------------------------------------------------
test('exercise 4a: accept confirm dialog', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Accept the confirm dialog by calling dialog.accept().
  page.on('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain('Rs 50,000');
    await dialog.accept();   // User clicks "OK"
  });

  await page.getByTestId('btn-trigger-confirm').click();

  // When confirm returns true, the page shows "Transfer confirmed."
  await expect(page.getByTestId('dialog-result')).toHaveText('Transfer confirmed.');
});

test('exercise 4b: dismiss confirm dialog', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Dismiss the confirm dialog by calling dialog.dismiss().
  page.on('dialog', async (dialog) => {
    await dialog.dismiss();  // User clicks "Cancel"
  });

  await page.getByTestId('btn-trigger-confirm').click();

  // When confirm returns false, the page shows "Transfer cancelled."
  await expect(page.getByTestId('dialog-result')).toHaveText('Transfer cancelled.');
});

// --------------------------------------------------------------------------
// Exercise 5: Handle Prompt Dialog with Input
//
// prompt() shows a text input. We use dialog.accept(text) to enter
// a value, simulating the user typing into the prompt and clicking OK.
// --------------------------------------------------------------------------
test('exercise 5: handle prompt dialog and enter text', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Register the dialog handler. For prompt dialogs, accept() takes
  // an optional string argument — the text to enter in the prompt input.
  page.on('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt');
    // dialog.defaultValue() returns the pre-filled text (if any).
    expect(dialog.defaultValue()).toBe('1000');
    // Accept with a custom value.
    await dialog.accept('25000');
  });

  await page.getByTestId('btn-trigger-prompt').click();

  // Verify the page displays the entered amount.
  await expect(
    page.getByTestId('dialog-result')
  ).toHaveText('Transfer amount set to Rs 25000');
});

// --------------------------------------------------------------------------
// Exercise 6: Grant Camera Permission and Verify
//
// context.grantPermissions() pre-grants browser permissions so the
// getUserMedia() call succeeds without showing a prompt. We verify
// the UI status changes from "Not requested" to "Granted".
// --------------------------------------------------------------------------
test('exercise 6a: grant camera permission and verify UI', async ({ page, context }) => {
  // Grant camera permission BEFORE navigating.
  await context.grantPermissions(['camera']);

  await page.goto(PLAYGROUND);

  // Click "Request Camera Access".
  await page.getByTestId('btn-request-camera').click();

  // Verify the status changed to "Granted".
  await expect(page.getByTestId('permission-status')).toHaveText('Granted');
  await expect(page.getByTestId('permission-result')).toContainText('Camera access granted');
});

test('exercise 6b: deny camera permission and verify UI', async ({ page, context }) => {
  // Clear all permissions — this means getUserMedia() will be denied.
  await context.clearPermissions();

  await page.goto(PLAYGROUND);

  await page.getByTestId('btn-request-camera').click();

  // When permission is denied, the status shows "Denied".
  await expect(page.getByTestId('permission-status')).toHaveText('Denied');
  await expect(page.getByTestId('permission-result')).toContainText('Camera access denied');
});

// --------------------------------------------------------------------------
// Exercise 7: Verify File Download
//
// page.waitForEvent('download') returns a Download object when the
// browser initiates a file download. We can check the suggested
// filename and even read the downloaded file's content.
// --------------------------------------------------------------------------
test('exercise 7: verify CSV download triggers', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Start waiting for the download event BEFORE clicking the button.
  // This is similar to how we handle dialogs — register the listener first.
  const downloadPromise = page.waitForEvent('download');

  // Click the download button.
  await page.getByTestId('btn-download-statement').click();

  // Await the download object.
  const download = await downloadPromise;

  // Verify the suggested filename.
  // suggestedFilename() returns the value of the <a download="..."> attribute.
  expect(download.suggestedFilename()).toBe('statement-april-2026.csv');

  // Optionally, read the downloaded file's content to verify it.
  // download.path() returns the path to the temporary file on disk.
  const path = await download.path();
  expect(path).toBeTruthy();

  // Verify the download status message on the page.
  await expect(
    page.getByTestId('download-status')
  ).toContainText('Download started');
});

// --------------------------------------------------------------------------
// Exercise 8: Read/Write localStorage
//
// page.evaluate() runs JavaScript in the browser context, giving us
// direct access to localStorage. We write a value, verify it persists,
// and confirm the UI reflects the stored data.
// --------------------------------------------------------------------------
test('exercise 8: read and write localStorage', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Write a value to localStorage via page.evaluate().
  // This runs in the browser context, same as typing in the DevTools console.
  await page.evaluate(() => {
    localStorage.setItem('preferred_currency', 'INR');
  });

  // Read it back and verify.
  const value = await page.evaluate(() => localStorage.getItem('preferred_currency'));
  expect(value).toBe('INR');

  // Now use the UI to save a value.
  await page.getByTestId('storage-key').fill('theme');
  await page.getByTestId('storage-value').fill('dark');
  await page.getByTestId('btn-storage-save').click();

  // Verify the UI shows the saved confirmation.
  await expect(
    page.getByTestId('storage-result')
  ).toHaveText('Saved: "theme" = "dark"');

  // Verify it was actually stored in localStorage.
  const storedTheme = await page.evaluate(() => localStorage.getItem('theme'));
  expect(storedTheme).toBe('dark');

  // Use the "Load" button to read it back via the UI.
  await page.getByTestId('btn-storage-load').click();
  await expect(
    page.getByTestId('storage-result')
  ).toHaveText('Loaded: "theme" = "dark"');
});
