# Kata 25: WebSockets

## What You Will Learn

- How to test real-time WebSocket-driven UIs
- How to verify connection status (connected, disconnected, connecting)
- How to verify messages appear in a real-time feed
- How to test bidirectional messaging (send and receive)
- How to test disconnect and reconnect flows
- How to use `page.evaluate()` to interact with mock WebSocket state
- How to verify message ordering and counts in real-time feeds

## Prerequisites

- Completed Katas 22-24
- Understanding of real-time communication concepts (WebSocket basics)
- Understanding of `setInterval`, `setTimeout`, and async patterns

## Concepts Explained

### What Are WebSockets?

```
WebSockets provide a persistent, bidirectional connection between a
browser and a server. Unlike HTTP (request-response), WebSockets let
the server push data to the client at any time.

Common uses in fintech:
  - Live price feeds (stock tickers, crypto prices)
  - Real-time status updates (KYC processing, transaction alerts)
  - Chat support (customer service widgets)
  - Notifications (fraud alerts, compliance updates)

The WebSocket lifecycle:
  1. Client calls new WebSocket(url) — opens a connection
  2. Server accepts — onopen fires
  3. Server sends data — onmessage fires with each message
  4. Either side can close — onclose fires
  5. Errors — onerror fires
```

### Testing WebSocket UIs

```
There are two main approaches to testing WebSocket-driven UIs:

1. OBSERVE THE DOM
   Since WebSocket messages cause DOM changes (new list items, updated
   text, status badges), you can simply wait for and assert on those
   DOM changes. This is the simplest approach.

2. INTERACT WITH THE MOCK
   Use page.evaluate() (Playwright) or cy.window() (Cypress) to access
   the mock WebSocket object and:
   - Inject custom messages
   - Check connection state
   - Force disconnect/reconnect
   - Verify message counts

The playground in this kata uses a mock WebSocket (implemented with
setInterval) that exposes window.mockWs for test interaction.
```

### Playwright: Testing WebSocket UIs

```typescript
// PLAYWRIGHT
// Approach 1: Wait for DOM changes caused by WebSocket messages.
// Click connect, then wait for feed messages to appear.
await page.getByTestId('connect-btn').click();
await expect(page.getByTestId('connection-status')).toHaveText('Connected');
// Wait for the first message to appear (mock sends every 2 seconds).
await expect(page.locator('.feed-message').first()).toBeVisible({ timeout: 5000 });

// Approach 2: Use page.evaluate() to interact with the mock.
// page.evaluate(fn) runs a function inside the browser's JavaScript context.
// This lets you access window.mockWs to inject messages or check state.
await page.evaluate(() => {
  window.mockWs.injectMessage({
    applicant: 'Test User',
    status: 'approved',
    id: 'KYC-TEST'
  });
});

// Approach 3: Listen for WebSocket events (if using real WebSocket).
// page.on('websocket', ws => ...) fires when a WebSocket connection opens.
// ws.on('framereceived', frame => ...) fires for each incoming message.
// (This only works with real WebSocket connections, not our mock.)
```

### Cypress: Testing WebSocket UIs

```typescript
// CYPRESS
// Approach 1: Wait for DOM changes.
cy.get('[data-testid="connect-btn"]').click();
cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');
cy.get('.feed-message', { timeout: 5000 }).should('have.length.at.least', 1);

// Approach 2: Access the mock via cy.window().
// cy.window() yields the browser's window object.
cy.window().then((win) => {
  win.mockWs.injectMessage({
    applicant: 'Test User',
    status: 'approved',
    id: 'KYC-TEST'
  });
});

// Approach 3: Stub the WebSocket constructor (for real WebSocket apps).
// cy.stub(window, 'WebSocket') replaces the WebSocket constructor
// with a controlled fake. (Not needed for our mock implementation.)
```

## Playground

The playground is a "Live KYC Status Feed & Chat Support" widget with:

1. **Connection Controls** — a "Connect" button that starts the simulated WebSocket connection and a "Disconnect" button to stop it. A status badge shows "Disconnected", "Connecting...", or "Connected".

2. **Live KYC Status Feed** — a list that receives simulated status updates every 2 seconds. Each message shows an applicant name, KYC reference ID, and the new status (approved, review, rejected, new). Newest messages appear at the top.

3. **Message Counter** — displays the total number of messages received.

4. **Chat Support Widget** — a chat interface that becomes active when connected. Users can type messages that appear in the chat. After 500ms, a simulated agent echoes back a response.

### Mock WebSocket API

The mock is available at `window.mockWs` after connecting:
- `window.mockWs.connected` — boolean, true if connected
- `window.mockWs.messageCount()` — returns the total message count
- `window.mockWs.injectMessage(update)` — push a custom message into the feed
- `window.mockWs.disconnect()` — programmatically close the connection

## Exercises

### Exercise 1: Verify Connection Status
Click the "Connect" button. Verify the status badge changes from "Disconnected" to "Connected". Verify the "Connect" button is hidden and the "Disconnect" button is visible.

### Exercise 2: Verify Messages Appear in Feed
Connect to the feed and wait for at least 2 messages to appear. Verify each message contains an applicant name and a status.

### Exercise 3: Send Chat Message and Verify Echo
Connect, type a chat message, and click Send. Verify your message appears in the chat. Wait for the agent echo response to appear.

### Exercise 4: Verify Message Count
Connect and wait for 3 messages to appear. Verify the message counter shows "3".

### Exercise 5: Disconnect and Verify Status
Connect, wait for a message, then click Disconnect. Verify the status badge changes to "Disconnected", the chat input is disabled, and no new messages appear.

### Exercise 6: Reconnect After Disconnect
Connect, disconnect, then connect again. Verify the status returns to "Connected" and new messages start appearing again.

### Exercise 7: Verify Message Ordering
Connect and wait for 3 messages. Verify the newest message is at the top of the feed list (first child of the list).

### Exercise 8: Inject Custom Message via page.evaluate
Use `page.evaluate()` (Playwright) or `cy.window()` (Cypress) to call `window.mockWs.injectMessage()` with a custom KYC update. Verify the custom message appears in the feed.

## Solutions

### Playwright Solution

See `playwright/websockets.spec.ts`

### Cypress Solution

See `cypress/websockets.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Not waiting long enough for messages | The mock sends messages every 2 seconds; asserting immediately will fail | Use `{ timeout: 5000 }` or higher for message assertions |
| Forgetting the connection delay | The mock has a 300ms "connecting" phase before "connected" | Wait for the status badge text to change before asserting messages |
| Not accounting for the echo delay | Chat echo responses take 500ms to appear | Wait for the echo message element to appear before asserting |
| Testing real WebSocket events with the mock | `page.on('websocket')` only fires for real WebSocket connections, not our mock | Use DOM assertions or `page.evaluate()` for the mock |
| Checking message count too early | Messages arrive asynchronously at 2-second intervals | Use `toHaveText('3')` with sufficient timeout rather than immediate checks |
| Not cleaning up after disconnect tests | If you reconnect, old message counts persist | Be aware that `messageCount` does not reset on reconnect |

## Quick Reference

### Playwright WebSocket Testing

| Action | Method | Example |
|--------|--------|---------|
| Click connect | `locator.click()` | `await page.getByTestId('connect-btn').click()` |
| Wait for status | `expect(locator).toHaveText()` | `await expect(status).toHaveText('Connected')` |
| Wait for messages | `locator.first()` with timeout | `await expect(msg.first()).toBeVisible({ timeout: 5000 })` |
| Count elements | `locator.count()` | `await expect(msgs).toHaveCount(3, { timeout: 10000 })` |
| Inject message | `page.evaluate()` | `await page.evaluate(() => window.mockWs.injectMessage(...))` |
| Check mock state | `page.evaluate()` | `const c = await page.evaluate(() => window.mockWs.connected)` |
| Real WS events | `page.on('websocket')` | `page.on('websocket', ws => ws.on('framereceived', ...))` |

### Cypress WebSocket Testing

| Action | Method | Example |
|--------|--------|---------|
| Click connect | `cy.get().click()` | `cy.get('[data-testid="connect-btn"]').click()` |
| Wait for status | `.should('have.text')` | `cy.get(status).should('have.text', 'Connected')` |
| Wait for messages | `.should('have.length.at.least')` | `cy.get('.feed-message').should('have.length.at.least', 2)` |
| Inject message | `cy.window()` | `cy.window().then(w => w.mockWs.injectMessage(...))` |
| Check mock state | `cy.window()` | `cy.window().its('mockWs.connected').should('be.true')` |
| Stub WebSocket | `cy.stub()` | `cy.window().then(w => cy.stub(w, 'WebSocket'))` |
