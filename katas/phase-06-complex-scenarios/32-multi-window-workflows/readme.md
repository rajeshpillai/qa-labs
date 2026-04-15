# Kata 32: Multi-Window Workflows

## What You Will Learn

- How to open and interact with popup windows spawned by window.open()
- How to switch between multiple browser windows/tabs in your tests
- How to verify content inside a popup window
- How to test cross-window communication via postMessage
- How to handle popup lifecycle (open, interact, close) in both Playwright and Cypress
- Differences between Playwright's multi-page context model and Cypress's single-tab limitation

## Prerequisites

- Completed Katas 01-31
- Understanding of browser window.open() and postMessage APIs

## Concepts Explained

### window.open() and Popups

```
window.open(url, target, features) opens a new browser window or tab.

  url      — the URL to load in the new window
  target   — a name for the window (reuses if a window with that name exists)
  features — a comma-separated string like "width=500,height=400"

The returned value is a Window object (or null if blocked).
The popup can communicate with its opener via:
  - window.opener   — reference to the window that opened the popup
  - postMessage()   — safe cross-origin messaging between windows
```

### postMessage for Cross-Window Communication

```
window.postMessage(data, targetOrigin) sends a message to another window.

The receiving window listens with:
  window.addEventListener('message', (event) => {
    event.data         — the data sent
    event.origin       — the origin of the sender
    event.source       — reference to the sending Window
  });

In our playground:
  1. Main page opens a popup with applicant details as URL params
  2. Admin acts (approve/reject) in the popup
  3. Popup sends postMessage to window.opener
  4. Main page receives the message and updates the applicant status
```

### Playwright: Handling Multiple Pages

```typescript
// PLAYWRIGHT
// Playwright represents each browser tab/window as a separate Page object.
// When window.open() is called, Playwright fires a 'popup' event on the
// page that triggered it. You can wait for this event:

const [popup] = await Promise.all([
  page.waitForEvent('popup'),           // wait for the popup event
  page.getByTestId('review-1').click(), // click triggers window.open()
]);

// Now 'popup' is a full Page object — you can interact with it just
// like the main page:
await popup.waitForLoadState();
await popup.getByTestId('approve-btn').click();
```

### Cypress: Popup Limitations and Workarounds

```typescript
// CYPRESS
// Cypress runs inside a single browser tab and cannot natively switch
// to popup windows. The recommended approach is to:
//
//   1. Stub window.open() to prevent the popup from actually opening
//   2. Instead, visit the popup URL directly in the same Cypress tab
//   3. Or use cy.origin() for cross-origin scenarios (Cypress 12+)
//
// Approach: Stub window.open and capture the URL

cy.window().then(win => {
  cy.stub(win, 'open').as('windowOpen');
});
cy.get('[data-testid="review-1"]').click();
cy.get('@windowOpen').should('have.been.called');

// To test the popup content, visit the captured URL:
cy.get('@windowOpen').then(stub => {
  const url = stub.getCall(0).args[0];
  cy.visit(url);
});
```

## Playground Overview

The playground has two pages:

**index.html** — Main page with an applicant list table. Each row has a "Review" button that opens a popup window.

**admin-panel.html** — Popup page showing applicant details with Approve/Reject buttons. When the admin acts, the popup sends a postMessage back to the main page.

## Exercises

1. **Open review window** — Click the Review button and verify a popup opens
2. **Interact with popup** — Click a button inside the popup window
3. **Verify popup content** — Check that the popup displays the correct applicant details
4. **Approve in popup, verify main page** — Approve an applicant and verify the main page status updates
5. **Reject in popup** — Reject an applicant and verify the main page shows "rejected"
6. **Close popup, verify main state** — Close the popup and verify the main page state is preserved
7. **Handle multiple popups** — Open review windows for two different applicants
8. **Synchronize state between windows** — Act in one popup and verify another popup still works correctly
