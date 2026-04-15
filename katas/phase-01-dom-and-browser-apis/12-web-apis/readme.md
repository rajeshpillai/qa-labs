# Kata 12: Web APIs

## What You Will Learn

- How to test clipboard operations (copy/paste) with browser automation
- How to mock the Geolocation API and verify displayed coordinates
- How to handle native browser dialogs (alert, confirm, prompt) in tests
- How to grant/deny permissions (camera, microphone) in test contexts
- How to verify file downloads in test automation
- How to read/write localStorage from tests
- The differences between Playwright and Cypress approaches to each API

## Prerequisites

- Completed Phase 00 katas
- Completed Kata 11 (DOM Mutations)

## Concepts Explained

### Clipboard API

The Clipboard API (`navigator.clipboard`) lets web pages read from and write to the system clipboard. In tests, you verify clipboard content using `page.evaluate()` (Playwright) or `cy.window()` (Cypress).

```typescript
// PLAYWRIGHT — read clipboard content after a copy action
const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
expect(clipboardText).toBe('1234-5678-9012-3456');

// CYPRESS — clipboard testing via window
cy.window().then((win) => {
  win.navigator.clipboard.readText().then((text) => {
    expect(text).to.eq('1234-5678-9012-3456');
  });
});
```

### Geolocation API

The Geolocation API (`navigator.geolocation`) returns the user's position. In tests, you mock it to return predictable coordinates.

```typescript
// PLAYWRIGHT — grant permission and set geolocation before navigating
await context.grantPermissions(['geolocation']);
await context.setGeolocation({ latitude: 28.6139, longitude: 77.2090 });

// CYPRESS — stub geolocation in the browser window
cy.visit(url, {
  onBeforeLoad(win) {
    cy.stub(win.navigator.geolocation, 'getCurrentPosition')
      .callsFake((cb) => cb({ coords: { latitude: 28.6139, longitude: 77.2090 } }));
  },
});
```

### Browser Dialogs (alert, confirm, prompt)

Native browser dialogs block JavaScript execution. Test frameworks handle them differently:

```typescript
// PLAYWRIGHT — listen for dialog events BEFORE triggering them
page.on('dialog', async (dialog) => {
  // dialog.type() is 'alert', 'confirm', or 'prompt'
  // dialog.message() is the dialog text
  await dialog.accept();  // or dialog.dismiss()
});

// CYPRESS — stub window methods
cy.on('window:alert', (text) => {
  expect(text).to.contain('Payment');
});
cy.on('window:confirm', () => true);  // return true = accept, false = dismiss
```

### Permissions API

The Permissions API controls access to device features like camera and microphone:

```typescript
// PLAYWRIGHT — grant permissions via browser context
await context.grantPermissions(['camera']);

// CYPRESS — permissions must be handled differently (no built-in API)
// Typically you stub the getUserMedia call
```

### File Downloads

Verifying downloads requires intercepting the browser's download mechanism:

```typescript
// PLAYWRIGHT — wait for the download event
const downloadPromise = page.waitForEvent('download');
await page.getByTestId('btn-download').click();
const download = await downloadPromise;
expect(download.suggestedFilename()).toBe('statement.csv');

// CYPRESS — verify the download link attributes
cy.get('[data-testid="btn-download"]').click();
// Verify the download status message
```

### Web Storage (localStorage)

localStorage persists key-value pairs in the browser:

```typescript
// PLAYWRIGHT — read/write localStorage via evaluate
await page.evaluate(() => localStorage.setItem('theme', 'dark'));
const value = await page.evaluate(() => localStorage.getItem('theme'));

// CYPRESS — access localStorage via cy.window()
cy.window().then((win) => {
  win.localStorage.setItem('theme', 'dark');
  expect(win.localStorage.getItem('theme')).to.eq('dark');
});
```

## Playground

The playground demonstrates six browser APIs:

1. **Clipboard** — "Copy Account Number" button + paste target input
2. **Geolocation** — "Detect Location" button showing latitude/longitude
3. **Browser Dialogs** — alert, confirm, and prompt buttons with result display
4. **Permissions** — camera access request with granted/denied status
5. **Web Storage** — save/load/clear data in localStorage
6. **File Download** — generates and downloads a CSV statement file

## Exercises

### Exercise 1: Copy to Clipboard and Verify
Click "Copy Account Number" and verify the clipboard contains the account number.

### Exercise 2: Mock Geolocation and Verify Coordinates
Mock the geolocation API to return Delhi coordinates (28.6139, 77.2090), click "Detect Location", and verify the displayed lat/lng.

### Exercise 3: Handle Alert Dialog
Set up a dialog handler, click "Show Alert", and verify the alert message text and that the result shows "Alert was dismissed."

### Exercise 4: Handle Confirm Dialog (Accept and Dismiss)
Test both accepting and dismissing the confirm dialog. Verify the result text changes accordingly ("Transfer confirmed." vs "Transfer cancelled.").

### Exercise 5: Handle Prompt Dialog with Input
Set up a prompt handler that enters a custom amount, click "Show Prompt", and verify the result displays the entered amount.

### Exercise 6: Grant/Deny Camera Permission
Grant camera permission in the test context, click "Request Camera Access", and verify the status shows "Granted". Then test the denied case.

### Exercise 7: Verify File Download
Click "Download Statement (CSV)", verify the download is triggered, and check the suggested filename.

### Exercise 8: Read/Write localStorage
Write a key-value pair to localStorage, reload the page, read it back, and verify the value persists.

## Solutions

### Playwright Solution

See `playwright/web-apis.spec.ts`

### Cypress Solution

See `cypress/web-apis.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Not setting up dialog handler before triggering | Dialog blocks JS, handler must be registered first | Call `page.on('dialog')` before `.click()` |
| Reading clipboard without granting permission | Browser may deny clipboard access | Use `context.grantPermissions(['clipboard-read'])` in Playwright |
| Not mocking geolocation before page load | The page calls geolocation on button click | Mock it before or during page visit |
| Forgetting to await dialog.accept() | Dialog stays open, blocking the page | Always `await dialog.accept()` or `dialog.dismiss()` |
| Using cy.wait(ms) for download verification | Downloads may take varying time | Use status messages or file existence checks |

## Quick Reference

### Playwright Web API Methods

| API | Method | Example |
|-----|--------|---------|
| Clipboard | `page.evaluate(() => navigator.clipboard.readText())` | Read clipboard content |
| Geolocation | `context.setGeolocation({ latitude, longitude })` | Mock location |
| Permissions | `context.grantPermissions(['camera'])` | Grant device access |
| Dialogs | `page.on('dialog', handler)` | Handle alert/confirm/prompt |
| Download | `page.waitForEvent('download')` | Intercept file download |
| Storage | `page.evaluate(() => localStorage.getItem(key))` | Read localStorage |

### Cypress Web API Methods

| API | Method | Example |
|-----|--------|---------|
| Clipboard | `cy.window().its('navigator.clipboard')` | Access clipboard |
| Geolocation | `cy.stub(win.navigator.geolocation, ...)` | Mock location |
| Dialogs | `cy.on('window:alert', handler)` | Handle alert |
| Confirm | `cy.on('window:confirm', () => true/false)` | Accept/dismiss |
| Storage | `cy.window().then(win => win.localStorage)` | Access localStorage |
