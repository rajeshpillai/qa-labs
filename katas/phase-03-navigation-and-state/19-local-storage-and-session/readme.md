# Kata 19: Local Storage and Session

## What You Will Learn

- How to test localStorage-based features (save, load, clear drafts)
- How to test sessionStorage-based features (page view counter)
- How to verify data persistence across page reloads
- How to read and write storage directly from tests (test fixtures)
- How to verify theme preference persistence
- Differences between localStorage (permanent) and sessionStorage (tab-scoped)

## Prerequisites

- Completed Katas 01-18
- Understanding of DOM selectors, form interactions, and assertions

## Concepts Explained

### localStorage vs sessionStorage

```
Both localStorage and sessionStorage store key-value pairs (strings only)
in the browser. They have the same API but different lifetimes:

localStorage:
  - Persists until explicitly deleted (survives browser restarts)
  - Shared across all tabs/windows of the same origin
  - Typical use: user preferences, drafts, cached data

sessionStorage:
  - Scoped to the browser tab
  - Cleared when the tab is closed
  - Survives page reloads within the same tab
  - Typical use: session-specific counters, temporary state

Shared API:
  .setItem(key, value)   — store a string value under the key
  .getItem(key)          — retrieve the value (null if missing)
  .removeItem(key)       — delete a single key
  .clear()               — delete all keys
  .length                — number of stored keys
  .key(index)            — get the key name at a given index
```

### Playwright: Accessing Storage via evaluate()

```typescript
// PLAYWRIGHT
// page.evaluate(fn) runs a JavaScript function in the browser context.
// This is how you directly access browser APIs like localStorage and
// sessionStorage from your test code.
//
// Signature:
//   page.evaluate<R>(pageFunction: () => R): Promise<R>
//
// The function runs in the browser, NOT in Node.js. Any values you
// return must be serializable (strings, numbers, arrays, objects).

// Write to localStorage:
await page.evaluate(() => {
  localStorage.setItem('key', 'value');
});

// Read from localStorage:
const value = await page.evaluate(() => {
  return localStorage.getItem('key');
});

// Read from sessionStorage:
const count = await page.evaluate(() => {
  return sessionStorage.getItem('page-views');
});

// Clear all storage:
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
```

### Cypress: Accessing Storage via cy.window()

```typescript
// CYPRESS
// cy.window() yields the browser's window object. You chain .then()
// to access win.localStorage or win.sessionStorage.
//
// Signature:
//   cy.window(options?: Partial<WindowOptions>): Chainable<Window>

// Write to localStorage:
cy.window().then((win) => {
  win.localStorage.setItem('key', 'value');
});

// Read from localStorage:
cy.window().then((win) => {
  const value = win.localStorage.getItem('key');
  expect(value).to.equal('expected');
});

// Clear storage before page loads (in cy.visit's onBeforeLoad):
cy.visit('/page', {
  onBeforeLoad(win) {
    win.localStorage.clear();
    win.sessionStorage.clear();
  }
});
```

### Storing Objects in Storage

```typescript
// Storage only accepts strings. To store objects, serialize with
// JSON.stringify() and deserialize with JSON.parse().

// Saving an object:
const draft = { name: 'Aisha', email: 'aisha@example.com' };
localStorage.setItem('draft', JSON.stringify(draft));
// Stored as: '{"name":"Aisha","email":"aisha@example.com"}'

// Loading an object:
const stored = localStorage.getItem('draft');
const parsed = JSON.parse(stored);
console.log(parsed.name); // 'Aisha'
```

### Verifying Storage After Page Reload

```typescript
// PLAYWRIGHT
// Save data, then reload and verify it persisted:
await page.evaluate(() => localStorage.setItem('theme', 'dark'));
await page.reload();
const theme = await page.evaluate(() => localStorage.getItem('theme'));
expect(theme).toBe('dark');

// CYPRESS
cy.window().then(win => win.localStorage.setItem('theme', 'dark'));
cy.reload();
cy.window().then(win => {
  expect(win.localStorage.getItem('theme')).to.equal('dark');
});
```

## Playground

The playground is a "KYC Draft Saving" application with these features:

1. **Draft Form** — Four fields: Full Name (text input), Email Address (email input), Country (dropdown), and Additional Notes (textarea). Three buttons: Save Draft, Load Draft, and Clear Draft.
2. **Save Draft** — Serializes all form fields to JSON and stores them in localStorage under the key `kyc-draft`.
3. **Load Draft** — Reads the `kyc-draft` key from localStorage, parses the JSON, and populates all form fields.
4. **Clear Draft** — Removes the `kyc-draft` key from localStorage and clears all form fields.
5. **Theme Toggle** — A light/dark mode switch. The preference is saved in localStorage under the key `kyc-theme` and restored on page load.
6. **Session Counter** — Displays the number of page views in the current session using sessionStorage. Increments on each page load.
7. **Storage Inspector** — Shows the current contents of both localStorage and sessionStorage in read-only viewer panels. Updated via "Refresh View" button.

### Storage Keys Used

| Key | Storage Type | Description |
|-----|-------------|-------------|
| `kyc-draft` | localStorage | JSON string containing form field values |
| `kyc-theme` | localStorage | `'dark'` or `'light'` — theme preference |
| `kyc-page-views` | sessionStorage | Page view count as a string (e.g., `'3'`) |

## Exercises

### Exercise 1: Fill Form and Save Draft
Fill all four form fields, click Save Draft, and verify the data was stored in localStorage by reading it directly from the test.

### Exercise 2: Reload and Load Draft — Verify Persistence
Save a draft, reload the page, click Load Draft, and verify all form fields are populated with the saved values.

### Exercise 3: Clear Draft — Verify Empty
Save a draft, then click Clear Draft. Verify the form fields are empty and the localStorage key was removed.

### Exercise 4: Verify sessionStorage Counter
Check that the session counter shows 1 on first load, then increments on each subsequent reload.

### Exercise 5: Change Theme — Verify Persistence
Toggle the theme to dark, verify the UI changed, reload the page, and verify dark mode persists.

### Exercise 6: Verify localStorage Keys
After saving a draft and changing theme, read all localStorage keys and verify both `kyc-draft` and `kyc-theme` are present.

### Exercise 7: Read/Write Storage Directly in Test
Pre-populate localStorage with test data (without using the UI), reload, and load the draft to verify the form fills with your test data.

### Exercise 8: Storage Survives Page Refresh
Save a draft, verify the storage inspector shows it, reload the page, and verify the draft is still visible in the storage inspector and can be loaded.

## Solutions

### Playwright Solution

See `playwright/local-storage-and-session.spec.ts`

### Cypress Solution

See `cypress/local-storage-and-session.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Storing objects directly in localStorage | localStorage only stores strings — objects become `"[object Object]"` | Use `JSON.stringify()` to serialize and `JSON.parse()` to deserialize |
| Not clearing storage between tests | Previous test data leaks into the next test | Clear storage in `beforeEach` using `onBeforeLoad` (Cypress) or `evaluate` (Playwright) |
| Confusing localStorage with sessionStorage | sessionStorage is tab-scoped and clears when the tab closes | Use localStorage for persistent data and sessionStorage for session-scoped data |
| Reading storage before the page has written to it | The page script may not have run yet | Wait for a visible indicator (status message, counter text) before reading storage |
| Forgetting that `getItem` returns null, not undefined | Comparing with `undefined` will give a false negative | Check for `null`: `expect(value).to.be.null` or `expect(value).toBeNull()` |

## Quick Reference

### Playwright Storage

| Action | Method | Example |
|--------|--------|---------|
| Read localStorage | `page.evaluate(() => localStorage.getItem(key))` | `const v = await page.evaluate(() => localStorage.getItem('draft'))` |
| Write localStorage | `page.evaluate(() => localStorage.setItem(key, val))` | `await page.evaluate(() => localStorage.setItem('k', 'v'))` |
| Remove key | `page.evaluate(() => localStorage.removeItem(key))` | `await page.evaluate(() => localStorage.removeItem('draft'))` |
| Clear all | `page.evaluate(() => localStorage.clear())` | `await page.evaluate(() => localStorage.clear())` |
| Read sessionStorage | `page.evaluate(() => sessionStorage.getItem(key))` | `const c = await page.evaluate(() => sessionStorage.getItem('views'))` |
| Reload page | `page.reload()` | `await page.reload()` |

### Cypress Storage

| Action | Method | Example |
|--------|--------|---------|
| Read localStorage | `cy.window().then(win => win.localStorage.getItem(key))` | `cy.window().then(w => expect(w.localStorage.getItem('k')).to.eq('v'))` |
| Write localStorage | `cy.window().then(win => win.localStorage.setItem(key, val))` | `cy.window().then(w => w.localStorage.setItem('k', 'v'))` |
| Clear on visit | `cy.visit(url, { onBeforeLoad(win) { win.localStorage.clear() } })` | See example above |
| Read sessionStorage | `cy.window().then(win => win.sessionStorage.getItem(key))` | `cy.window().then(w => expect(w.sessionStorage.getItem('v')).to.eq('1'))` |
| Reload page | `cy.reload()` | `cy.reload()` |
