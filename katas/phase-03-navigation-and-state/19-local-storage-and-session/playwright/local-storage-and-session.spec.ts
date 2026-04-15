import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-03-navigation-and-state/19-local-storage-and-session/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Fill Form and Save Draft to localStorage
// --------------------------------------------------------------------------
// This exercise demonstrates filling a form and saving the data to
// localStorage using the playground's "Save Draft" button, then verifying
// the data was stored.
test('exercise 1: fill form and save draft to localStorage', async ({ page }) => {
  // Navigate to the playground.
  await page.goto(PLAYGROUND);

  // Fill in the form fields.
  // fill(value) clears the input first, then types the value.
  await page.getByTestId('draft-name').fill('Aisha Patel');
  await page.getByTestId('draft-email').fill('aisha@example.com');

  // selectOption(value) selects the <option> with the matching value attribute.
  await page.getByTestId('draft-country').selectOption('sg');
  await page.getByTestId('draft-notes').fill('Urgent KYC review needed');

  // Click the Save Draft button.
  await page.getByTestId('btn-save-draft').click();

  // Verify the status message confirms the save.
  await expect(page.getByTestId('draft-status')).toHaveText('Draft saved successfully!');

  // Verify the data was actually stored in localStorage.
  // page.evaluate(fn) runs a JavaScript function in the browser context.
  // This lets us directly access browser APIs like localStorage.
  const storedDraft = await page.evaluate(() => {
    // localStorage.getItem(key) returns the stored string or null.
    return localStorage.getItem('kyc-draft');
  });

  // Parse the JSON string and verify the values match what we entered.
  const draft = JSON.parse(storedDraft!);
  expect(draft.name).toBe('Aisha Patel');
  expect(draft.email).toBe('aisha@example.com');
  expect(draft.country).toBe('sg');
  expect(draft.notes).toBe('Urgent KYC review needed');
});

// --------------------------------------------------------------------------
// Exercise 2: Reload Page and Load Draft — Verify Data Persists
// --------------------------------------------------------------------------
// localStorage data survives page reloads. We save a draft, reload the
// page, click "Load Draft", and verify the form fields are restored.
test('exercise 2: reload page and load draft to verify persistence', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Fill and save a draft.
  await page.getByTestId('draft-name').fill('Ben Okafor');
  await page.getByTestId('draft-email').fill('ben@example.com');
  await page.getByTestId('draft-country').selectOption('uk');
  await page.getByTestId('draft-notes').fill('Documents pending');
  await page.getByTestId('btn-save-draft').click();

  // Reload the page. page.reload() refreshes the page (like pressing F5).
  // All form fields will be empty after reload, but localStorage persists.
  await page.reload();

  // Verify form fields are empty after reload.
  await expect(page.getByTestId('draft-name')).toHaveValue('');

  // Click Load Draft to restore the form from localStorage.
  await page.getByTestId('btn-load-draft').click();

  // Verify the form fields are populated with the saved data.
  // toHaveValue(value) checks the current value of an input/textarea/select.
  await expect(page.getByTestId('draft-name')).toHaveValue('Ben Okafor');
  await expect(page.getByTestId('draft-email')).toHaveValue('ben@example.com');
  await expect(page.getByTestId('draft-country')).toHaveValue('uk');
  await expect(page.getByTestId('draft-notes')).toHaveValue('Documents pending');

  // Verify the status message.
  await expect(page.getByTestId('draft-status')).toHaveText('Draft loaded successfully!');
});

// --------------------------------------------------------------------------
// Exercise 3: Clear Draft — Verify Storage is Empty
// --------------------------------------------------------------------------
// The "Clear Draft" button removes the draft from localStorage and clears
// all form fields.
test('exercise 3: clear draft and verify storage is empty', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Save a draft first.
  await page.getByTestId('draft-name').fill('Clara Jansen');
  await page.getByTestId('btn-save-draft').click();

  // Verify the draft exists in localStorage.
  let stored = await page.evaluate(() => localStorage.getItem('kyc-draft'));
  expect(stored).not.toBeNull();

  // Click Clear Draft.
  await page.getByTestId('btn-clear-draft').click();

  // Verify the form fields are empty.
  await expect(page.getByTestId('draft-name')).toHaveValue('');
  await expect(page.getByTestId('draft-email')).toHaveValue('');

  // Verify localStorage no longer has the draft key.
  stored = await page.evaluate(() => localStorage.getItem('kyc-draft'));
  expect(stored).toBeNull();

  // Verify the status message.
  await expect(page.getByTestId('draft-status')).toHaveText('Draft cleared.');
});

// --------------------------------------------------------------------------
// Exercise 4: Verify sessionStorage Counter Increments
// --------------------------------------------------------------------------
// The playground uses sessionStorage to count page views within the current
// session. Each page load increments the counter.
test('exercise 4: verify sessionStorage counter increments on reload', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // On first load, the counter should be 1.
  await expect(page.getByTestId('session-counter')).toHaveText('1');

  // Verify sessionStorage has the correct value.
  // page.evaluate() runs code in the browser to access sessionStorage.
  let count = await page.evaluate(() => sessionStorage.getItem('kyc-page-views'));
  expect(count).toBe('1');

  // Reload the page — counter should increment to 2.
  // sessionStorage persists across reloads within the same tab/context.
  await page.reload();
  await expect(page.getByTestId('session-counter')).toHaveText('2');

  // Reload again — counter should be 3.
  await page.reload();
  await expect(page.getByTestId('session-counter')).toHaveText('3');

  // Verify sessionStorage value matches.
  count = await page.evaluate(() => sessionStorage.getItem('kyc-page-views'));
  expect(count).toBe('3');
});

// --------------------------------------------------------------------------
// Exercise 5: Change Theme and Verify Persistence
// --------------------------------------------------------------------------
// Clicking the theme toggle switches between light/dark mode. The
// preference is saved in localStorage and restored on page load.
test('exercise 5: change theme and verify persistence across reload', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify we start in Light Mode.
  await expect(page.getByTestId('theme-label')).toHaveText('Light Mode');

  // The <body> should NOT have the 'dark' class.
  // locator('body') selects the <body> element.
  await expect(page.locator('body')).not.toHaveClass(/dark/);

  // Click the theme switch to toggle to Dark Mode.
  await page.getByTestId('theme-switch').click();

  // Verify the UI updated to Dark Mode.
  await expect(page.getByTestId('theme-label')).toHaveText('Dark Mode');
  await expect(page.locator('body')).toHaveClass(/dark/);

  // Verify localStorage saved the preference.
  const theme = await page.evaluate(() => localStorage.getItem('kyc-theme'));
  expect(theme).toBe('dark');

  // Reload the page — the theme should persist.
  await page.reload();

  // Verify dark mode is still active after reload.
  await expect(page.getByTestId('theme-label')).toHaveText('Dark Mode');
  await expect(page.locator('body')).toHaveClass(/dark/);
});

// --------------------------------------------------------------------------
// Exercise 6: Verify localStorage Keys Exist
// --------------------------------------------------------------------------
// After saving a draft and setting a theme, we verify that the expected
// keys exist in localStorage.
test('exercise 6: verify localStorage keys after saving draft and theme', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Save a draft.
  await page.getByTestId('draft-name').fill('Derek Wong');
  await page.getByTestId('btn-save-draft').click();

  // Set the theme to dark.
  await page.getByTestId('theme-switch').click();

  // Read all localStorage keys using page.evaluate().
  // Object.keys(localStorage) doesn't work because localStorage is not
  // a plain object. We iterate manually.
  const keys = await page.evaluate(() => {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      // localStorage.key(i) returns the key name at the given index.
      result.push(localStorage.key(i)!);
    }
    return result;
  });

  // Verify both keys exist.
  expect(keys).toContain('kyc-draft');
  expect(keys).toContain('kyc-theme');
});

// --------------------------------------------------------------------------
// Exercise 7: Read Storage Directly in Test (No UI Interaction)
// --------------------------------------------------------------------------
// Sometimes you need to pre-populate storage BEFORE the page loads, or
// read it without clicking any buttons. This exercise shows how to set
// and read storage directly using page.evaluate().
test('exercise 7: read and write storage directly in the test', async ({ page }) => {
  // Navigate to the page first (storage is scoped to the origin).
  await page.goto(PLAYGROUND);

  // Pre-populate localStorage with a draft using page.evaluate().
  // This bypasses the UI entirely — useful for setting up test fixtures.
  await page.evaluate(() => {
    const draft = {
      name: 'Test User',
      email: 'test@example.com',
      country: 'in',
      notes: 'Pre-populated by test'
    };
    localStorage.setItem('kyc-draft', JSON.stringify(draft));
  });

  // Reload so the page can read the pre-populated data.
  await page.reload();

  // Click Load Draft — the form should fill with our test data.
  await page.getByTestId('btn-load-draft').click();

  await expect(page.getByTestId('draft-name')).toHaveValue('Test User');
  await expect(page.getByTestId('draft-email')).toHaveValue('test@example.com');
  await expect(page.getByTestId('draft-country')).toHaveValue('in');
  await expect(page.getByTestId('draft-notes')).toHaveValue('Pre-populated by test');

  // Read a specific value back.
  const email = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('kyc-draft')!);
    return data.email;
  });
  expect(email).toBe('test@example.com');
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Storage Survives Page Refresh
// --------------------------------------------------------------------------
// This exercise confirms that localStorage data persists after a page
// refresh, while also verifying the storage inspector UI updates.
test('exercise 8: verify storage survives page refresh', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Save a draft.
  await page.getByTestId('draft-name').fill('Priya Sharma');
  await page.getByTestId('draft-email').fill('priya@example.com');
  await page.getByTestId('btn-save-draft').click();

  // Click "Refresh View" to update the storage inspector.
  await page.getByTestId('btn-refresh-storage').click();

  // The localStorage viewer should now show the kyc-draft key.
  await expect(page.getByTestId('local-storage-view')).toContainText('kyc-draft');

  // Reload the page.
  await page.reload();

  // Click Refresh View again to see the storage contents.
  await page.getByTestId('btn-refresh-storage').click();

  // The draft should still be visible in the storage inspector.
  await expect(page.getByTestId('local-storage-view')).toContainText('kyc-draft');
  await expect(page.getByTestId('local-storage-view')).toContainText('Priya Sharma');

  // Load the draft and verify the form is populated.
  await page.getByTestId('btn-load-draft').click();
  await expect(page.getByTestId('draft-name')).toHaveValue('Priya Sharma');
  await expect(page.getByTestId('draft-email')).toHaveValue('priya@example.com');
});
