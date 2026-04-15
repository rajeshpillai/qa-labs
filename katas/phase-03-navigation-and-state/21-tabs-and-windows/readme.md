# Kata 21: Tabs and Windows

## What You Will Learn

- How to handle links that open in new tabs (target="_blank")
- How to capture and interact with popup windows opened via window.open()
- How to verify cross-window communication using postMessage
- How to switch between multiple tabs/popups in Playwright
- How to stub window.open in Cypress to prevent actual popups
- How to verify parent window state updates after popup interactions

## Prerequisites

- Completed Katas 01-20
- Understanding of DOM selectors, assertions, and event handling

## Concepts Explained

### How Tabs and Popups Work

```
New tabs and popups are created in two ways:

1. HTML links with target="_blank":
   <a href="page.html" target="_blank">Open in new tab</a>
   The browser opens the URL in a new tab. The new tab has access to
   window.opener (a reference to the opening window).

2. JavaScript window.open():
   const popup = window.open('page.html', 'name', 'width=500,height=400');
   Opens a new window/popup. The features string (third argument) controls
   the popup size and position. Returns a reference to the new window.

Cross-window communication:
   window.opener.postMessage(data, targetOrigin)  — child to parent
   popup.postMessage(data, targetOrigin)           — parent to child
   window.addEventListener('message', handler)     — listen for messages
```

### Playwright: waitForEvent('popup')

```typescript
// PLAYWRIGHT
// When a new tab or popup opens, Playwright fires a 'popup' event on
// the page that triggered it. We use waitForEvent to capture the new
// Page object.
//
// Signature:
//   page.waitForEvent(event: 'popup'): Promise<Page>
//
// IMPORTANT: Start waiting BEFORE the action that opens the popup.
// Using Promise.all ensures we don't miss the event.
const [newTab] = await Promise.all([
  page.waitForEvent('popup'),   // Start listening for the popup
  page.click('[data-testid="link"]')  // This triggers the popup
]);

// The newTab is a full Page object — same API as the parent page.
await newTab.waitForLoadState('load');
await expect(newTab.getByTestId('title')).toHaveText('New Page');

// Close the popup when done.
await newTab.close();
```

### Playwright: context.pages()

```typescript
// PLAYWRIGHT
// context.pages() returns an array of all open Page objects in the
// current browser context. Useful for switching between tabs.
//
// Signature:
//   context.pages(): Page[]
const allPages = context.pages();
console.log(allPages.length); // Number of open tabs

// Access a specific tab by index:
const parentPage = allPages[0];
const childTab = allPages[1];
```

### Cypress: Handling Tabs and Popups

```typescript
// CYPRESS
// Cypress runs inside a single browser tab and CANNOT switch to new
// tabs or popup windows. There are three strategies:

// Strategy 1: Remove target="_blank" and click normally
// invoke('removeAttr', 'target') removes the target attribute so the
// link opens in the same tab.
cy.get('a[target="_blank"]')
  .invoke('removeAttr', 'target')
  .click();

// Strategy 2: Verify attributes without clicking
// Check the link's href and target to confirm it would open correctly.
cy.get('a[target="_blank"]')
  .should('have.attr', 'href', '/terms.html')
  .should('have.attr', 'target', '_blank');

// Strategy 3: Stub window.open to prevent actual popups
// cy.stub(win, 'open') replaces window.open with a stub function.
cy.window().then((win) => {
  cy.stub(win, 'open').as('windowOpen');
});
cy.get('[data-testid="btn"]').click();
cy.get('@windowOpen').should('be.calledOnce');
cy.get('@windowOpen').should('be.calledWith', 'page.html', 'name', 'features');
```

### Cypress: Simulating postMessage

```typescript
// CYPRESS
// Since Cypress can't open real popups, we simulate the postMessage
// that a popup would send to the parent window.
cy.window().then((win) => {
  win.postMessage(
    { type: 'consent-given', message: 'User consented' },
    '*'
  );
});

// Verify the parent handled the message:
cy.get('[data-testid="consent-status"]').should('have.text', 'Yes');
```

## Playground

The playground is a "KYC Portal" with features that open new tabs and popups:

1. **View Terms Link** — An `<a>` link with `target="_blank"` that opens `terms.html` in a new browser tab. The terms page has "Accept Terms" and "Decline" buttons that send postMessage to the parent.

2. **Start Video Call Button** — Uses `window.open()` to open `video-call.html` in a popup window (500x400). The popup has an "End Call" button that sends a postMessage and closes.

3. **Open Consent Form Button** — Uses `window.open()` to open `consent-form.html` in a popup (450x350). Has three consent checkboxes and "Give Consent" / "Cancel" buttons.

4. **Cross-Window Messages** — A message log that displays all messages received via `window.addEventListener('message', ...)`. Updated in real-time.

5. **Parent Window State** — Tracks four states: terms accepted, video call completed, consent given, and active popup count. Updated based on postMessage events from popups.

### Popup Pages

| Page | URL | Purpose |
|------|-----|---------|
| Terms | `terms.html` | Terms and conditions with Accept/Decline buttons |
| Video Call | `video-call.html` | Simulated video call with End Call button |
| Consent Form | `consent-form.html` | Data consent checkboxes with Give Consent/Cancel |

## Exercises

### Exercise 1: Click Link and Handle New Tab
Click the "View Terms" link and capture the new tab. Verify the terms page content is visible. In Cypress, remove `target="_blank"` first.

### Exercise 2: Verify New Tab URL
After opening the terms page in a new tab, verify its URL contains `terms.html` and its title is correct. In Cypress, verify the link attributes.

### Exercise 3: Interact with Popup Content
Open the consent form popup and interact with it: check all consent checkboxes and click "Give Consent". Verify the status message appears.

### Exercise 4: Close Popup and Verify Parent State
Open a popup, complete an action (give consent), and verify the parent window's state updated based on the postMessage.

### Exercise 5: Handle window.open() Popup
Click the "Start Video Call" button (which uses window.open) and interact with the popup. In Cypress, stub window.open and verify it was called.

### Exercise 6: Verify Cross-Tab Communication (postMessage)
Verify that messages sent via postMessage from popups appear in the parent's message log. Test sending messages directly via evaluate/window.

### Exercise 7: Switch Between Multiple Tabs
Open the terms page in a new tab, verify its content, switch back to the parent, accept terms, and verify the parent received the message. Use context.pages() in Playwright.

### Exercise 8: Handle Multiple Popups
Open both the video call and consent form popups simultaneously. Interact with each independently. Verify the parent tracks the correct number of active popups.

## Solutions

### Playwright Solution

See `playwright/tabs-and-windows.spec.ts`

### Cypress Solution

See `cypress/tabs-and-windows.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Not waiting for the popup event before clicking | The popup event fires immediately — if you click first, you may miss it | Use `Promise.all([waitForEvent('popup'), click()])` in Playwright |
| Trying to switch tabs in Cypress | Cypress cannot control multiple browser tabs | Use `invoke('removeAttr', 'target')` or `cy.stub(win, 'open')` |
| Forgetting `waitForLoadState` on the popup | The popup page may not have finished loading when you start interacting | Always call `await popup.waitForLoadState('load')` |
| Not closing popups after tests | Open popups can interfere with subsequent tests | Close popups with `await popup.close()` in `afterEach` or within each test |
| Using wrong targetOrigin in postMessage | `'*'` is fine for testing but insecure in production | Use the actual origin string in production code |
| Assuming popup is a Page in Cypress | Cypress stubs return the stub object, not a Page | Interact with popup content by visiting the URL directly |

## Quick Reference

### Playwright Tabs and Popups

| Action | Method | Example |
|--------|--------|---------|
| Capture new tab | `page.waitForEvent('popup')` | `const [tab] = await Promise.all([page.waitForEvent('popup'), click()])` |
| List all pages | `context.pages()` | `const pages = context.pages()` |
| Wait for load | `popup.waitForLoadState()` | `await popup.waitForLoadState('load')` |
| Get popup URL | `popup.url()` | `expect(popup.url()).toContain('terms')` |
| Close popup | `popup.close()` | `await popup.close()` |
| Interact with popup | Same as page | `await popup.getByTestId('btn').click()` |

### Cypress Tabs and Popups

| Action | Method | Example |
|--------|--------|---------|
| Remove target="_blank" | `invoke('removeAttr', 'target')` | `cy.get('a').invoke('removeAttr', 'target').click()` |
| Check link attributes | `.should('have.attr', ...)` | `cy.get('a').should('have.attr', 'href', '/terms')` |
| Stub window.open | `cy.stub(win, 'open')` | `cy.window().then(w => cy.stub(w, 'open').as('open'))` |
| Verify stub called | `cy.get('@alias').should(...)` | `cy.get('@open').should('be.calledOnce')` |
| Simulate postMessage | `win.postMessage(...)` | `cy.window().then(w => w.postMessage(data, '*'))` |
| Visit popup URL | `cy.visit(url)` | `cy.visit('/popup-page.html')` |
