import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-04-api-and-realtime/25-websockets/playground/';

// Declare the mockWs type on the window object so TypeScript knows about it.
// This tells TypeScript that window.mockWs exists and has these methods/properties.
declare global {
  interface Window {
    mockWs: {
      connected: boolean;
      messageCount: () => number;
      injectMessage: (update: { applicant: string; status: string; id: string }) => void;
      disconnect: () => void;
    };
  }
}

// --------------------------------------------------------------------------
// Exercise 1: Verify Connection Status
// --------------------------------------------------------------------------
// This exercise clicks the Connect button and verifies the UI transitions
// from "Disconnected" to "Connected" state.
test('exercise 1: verify connection status', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the initial disconnected state.
  // toHaveText(text) checks the element's textContent matches exactly.
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected');
  await expect(page.getByTestId('connect-btn')).toBeVisible();
  await expect(page.getByTestId('disconnect-btn')).toBeHidden();

  // Click the Connect button to start the mock WebSocket connection.
  await page.getByTestId('connect-btn').click();

  // The mock has a 300ms connection delay. The status should transition
  // from "Connecting..." to "Connected".
  // toHaveText() retries automatically until the text matches or timeout.
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');

  // Verify the Connect button is hidden and Disconnect button is visible.
  await expect(page.getByTestId('connect-btn')).toBeHidden();
  await expect(page.getByTestId('disconnect-btn')).toBeVisible();

  // Verify the connection-status badge has the connected CSS class.
  await expect(page.getByTestId('connection-status')).toHaveClass(/status-connected/);
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Messages Appear in Feed
// --------------------------------------------------------------------------
// This exercise connects and waits for messages to appear in the live feed.
// The mock sends a status update every 2 seconds.
test('exercise 2: verify messages appear in feed', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Connect to the feed.
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');

  // Wait for at least 2 messages to appear in the feed.
  // The mock sends one message every 2 seconds, so we need ~4 seconds.
  // locator.count() returns the number of matching elements.
  // toHaveCount(n, { timeout }) waits until the count matches.
  const feedMessages = page.locator('.feed-message');
  await expect(feedMessages).toHaveCount(2, { timeout: 8000 });

  // Verify the first message contains expected content.
  // .first() returns the first matching element.
  const firstMessage = feedMessages.first();
  await expect(firstMessage).toBeVisible();

  // Verify the message contains an applicant name and a status keyword.
  // toContainText(text) checks if textContent includes the substring.
  const firstText = await firstMessage.textContent();
  // The message should contain "status changed to" (from our template).
  expect(firstText).toContain('status changed to');
});

// --------------------------------------------------------------------------
// Exercise 3: Send Chat Message and Verify Echo
// --------------------------------------------------------------------------
// This exercise tests the bidirectional chat: send a message and verify the
// agent echo response appears.
test('exercise 3: send chat message and verify echo', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Connect first — chat is disabled when disconnected.
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');

  // Type a message in the chat input.
  // fill(value) clears the input then types the value.
  await page.getByTestId('chat-input-field').fill('What is the status of KYC-001?');

  // Click the Send button.
  await page.getByTestId('chat-send-btn').click();

  // Verify the user's message appears in the chat list.
  // The first chat message (data-testid="chat-message-1") should be ours.
  const userMessage = page.getByTestId('chat-message-1');
  await expect(userMessage).toBeVisible();
  await expect(userMessage).toContainText('You:');
  await expect(userMessage).toContainText('What is the status of KYC-001?');

  // Wait for the agent echo response (appears after 500ms delay).
  const agentMessage = page.getByTestId('chat-message-2');
  await expect(agentMessage).toBeVisible({ timeout: 2000 });
  await expect(agentMessage).toContainText('Agent:');
  await expect(agentMessage).toContainText('Received:');
  await expect(agentMessage).toContainText('What is the status of KYC-001?');
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Message Count
// --------------------------------------------------------------------------
// This exercise waits for messages and verifies the counter updates correctly.
test('exercise 4: verify message count', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial count is 0.
  await expect(page.getByTestId('message-count-value')).toHaveText('0');

  // Connect to start receiving messages.
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');

  // Wait for the message count to reach 3.
  // The mock sends one message every 2 seconds, so this takes ~6 seconds.
  // toHaveText() retries until it matches or the timeout expires.
  await expect(page.getByTestId('message-count-value')).toHaveText('3', {
    timeout: 10000
  });
});

// --------------------------------------------------------------------------
// Exercise 5: Disconnect and Verify Status
// --------------------------------------------------------------------------
// This exercise tests the disconnect flow: verify the status changes,
// chat disables, and no new messages appear.
test('exercise 5: disconnect and verify status', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Connect and wait for at least one message.
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');
  await expect(page.locator('.feed-message')).toHaveCount(1, { timeout: 5000 });

  // Click the Disconnect button.
  await page.getByTestId('disconnect-btn').click();

  // Verify the status badge changes to "Disconnected".
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected');
  await expect(page.getByTestId('connection-status')).toHaveClass(/status-disconnected/);

  // Verify the Connect button reappears and Disconnect button hides.
  await expect(page.getByTestId('connect-btn')).toBeVisible();
  await expect(page.getByTestId('disconnect-btn')).toBeHidden();

  // Verify the chat input is disabled.
  await expect(page.getByTestId('chat-input-field')).toBeDisabled();
  await expect(page.getByTestId('chat-send-btn')).toBeDisabled();

  // Verify the chat status shows "Offline".
  await expect(page.getByTestId('chat-status')).toHaveText('Offline');

  // Record the current message count.
  const countBefore = await page.getByTestId('message-count-value').textContent();

  // Wait 3 seconds and verify no new messages arrived.
  await page.waitForTimeout(3000);
  const countAfter = await page.getByTestId('message-count-value').textContent();
  expect(countAfter).toBe(countBefore);
});

// --------------------------------------------------------------------------
// Exercise 6: Reconnect After Disconnect
// --------------------------------------------------------------------------
// This exercise tests disconnecting and reconnecting to verify the feed
// resumes.
test('exercise 6: reconnect after disconnect', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Connect.
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');

  // Wait for at least one message.
  await expect(page.locator('.feed-message')).toHaveCount(1, { timeout: 5000 });

  // Disconnect.
  await page.getByTestId('disconnect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected');

  // Record the message count at disconnect.
  const countAtDisconnect = await page.getByTestId('message-count-value').textContent();

  // Reconnect.
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');

  // Verify new messages arrive after reconnecting.
  // The count should increase beyond what it was at disconnect.
  const expectedCount = String(Number(countAtDisconnect) + 1);
  await expect(page.getByTestId('message-count-value')).toHaveText(expectedCount, {
    timeout: 5000
  });

  // Verify the chat is re-enabled.
  await expect(page.getByTestId('chat-status')).toHaveText('Online');
  await expect(page.getByTestId('chat-input-field')).toBeEnabled();
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Message Ordering
// --------------------------------------------------------------------------
// This exercise verifies that newer messages appear at the top of the feed
// list (prepended, not appended).
test('exercise 7: verify message ordering', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Connect and wait for 3 messages.
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');
  await expect(page.locator('.feed-message')).toHaveCount(3, { timeout: 10000 });

  // Get all feed messages in DOM order.
  const messages = page.locator('.feed-message');

  // The first message in the DOM should be the newest (most recent).
  // The last message in the DOM should be the oldest (earliest).
  // We verify by checking data-testid: message-3 should be first, message-1 last.
  const firstMessageTestId = await messages.first().getAttribute('data-testid');
  const lastMessageTestId = await messages.last().getAttribute('data-testid');

  // The newest message (highest number) should be first in the list.
  // Extract the number from the data-testid (e.g., "feed-message-3" -> 3).
  const firstNum = parseInt(firstMessageTestId!.replace('feed-message-', ''));
  const lastNum = parseInt(lastMessageTestId!.replace('feed-message-', ''));
  expect(firstNum).toBeGreaterThan(lastNum);
});

// --------------------------------------------------------------------------
// Exercise 8: Inject Custom Message via page.evaluate
// --------------------------------------------------------------------------
// This exercise uses page.evaluate() to access window.mockWs and inject a
// custom message into the feed, verifying it appears in the UI.
test('exercise 8: inject custom message via page.evaluate', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Connect first (window.mockWs is only available after connecting).
  await page.getByTestId('connect-btn').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected');

  // Use page.evaluate() to call window.mockWs.injectMessage().
  // page.evaluate(fn) runs the given function inside the browser's
  // JavaScript context, giving us access to window, document, and
  // any global variables like window.mockWs.
  await page.evaluate(() => {
    window.mockWs.injectMessage({
      applicant: 'Test Automation User',
      status: 'approved',
      id: 'KYC-AUTO-001'
    });
  });

  // Verify the injected message appears in the feed.
  // We search for the message text in the feed list.
  await expect(page.locator('.feed-message')).toContainText([
    'Test Automation User'
  ]);

  // Verify the message contains the expected status and ID.
  const feedText = await page.getByTestId('feed-list').textContent();
  expect(feedText).toContain('KYC-AUTO-001');
  expect(feedText).toContain('approved');

  // Verify we can also check the mock state via evaluate.
  const isConnected = await page.evaluate(() => window.mockWs.connected);
  expect(isConnected).toBe(true);

  const msgCount = await page.evaluate(() => window.mockWs.messageCount());
  expect(msgCount).toBeGreaterThan(0);
});
