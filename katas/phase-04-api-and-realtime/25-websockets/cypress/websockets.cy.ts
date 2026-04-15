const PLAYGROUND = '/phase-04-api-and-realtime/25-websockets/playground/';

describe('Kata 25: WebSockets', () => {

  // beforeEach runs before every test. We navigate to the playground
  // so each test starts with a fresh, disconnected state.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Verify Connection Status
  // --------------------------------------------------------------------------
  // This exercise clicks the Connect button and verifies the UI transitions
  // from "Disconnected" to "Connected" state.
  it('exercise 1: verify connection status', () => {
    // Verify the initial disconnected state.
    cy.get('[data-testid="connection-status"]').should('have.text', 'Disconnected');
    cy.get('[data-testid="connect-btn"]').should('be.visible');
    cy.get('[data-testid="disconnect-btn"]').should('not.be.visible');

    // Click the Connect button.
    cy.get('[data-testid="connect-btn"]').click();

    // Verify the status transitions to "Connected".
    // The mock has a 300ms delay, so .should() will retry until it matches.
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');

    // Verify the Connect button is hidden and Disconnect button appears.
    cy.get('[data-testid="connect-btn"]').should('not.be.visible');
    cy.get('[data-testid="disconnect-btn"]').should('be.visible');

    // Verify the CSS class changed to connected.
    cy.get('[data-testid="connection-status"]').should('have.class', 'status-connected');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Messages Appear in Feed
  // --------------------------------------------------------------------------
  // This exercise connects and waits for messages to appear in the feed.
  it('exercise 2: verify messages appear in feed', () => {
    // Connect to start the feed.
    cy.get('[data-testid="connect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');

    // Wait for at least 2 messages to appear in the feed.
    // The mock sends one message every 2 seconds, so we set a longer timeout.
    // .should('have.length.at.least', n) waits until at least n elements match.
    cy.get('.feed-message', { timeout: 8000 }).should('have.length.at.least', 2);

    // Verify the first message (newest, at the top) is visible and has content.
    cy.get('.feed-message').first().should('be.visible');

    // Verify messages contain the expected "status changed to" text.
    cy.get('.feed-message').first().should('contain.text', 'status changed to');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Send Chat Message and Verify Echo
  // --------------------------------------------------------------------------
  // This exercise tests the bidirectional chat: send a message and verify
  // the agent echo response appears.
  it('exercise 3: send chat message and verify echo', () => {
    // Connect first — chat is disabled when disconnected.
    cy.get('[data-testid="connect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');

    // Type a chat message and click Send.
    // type(text) types into the input field character by character.
    cy.get('[data-testid="chat-input-field"]').type('What is the status of KYC-001?');
    cy.get('[data-testid="chat-send-btn"]').click();

    // Verify the user's message appears in the chat list.
    cy.get('[data-testid="chat-message-1"]')
      .should('be.visible')
      .and('contain.text', 'You:')
      .and('contain.text', 'What is the status of KYC-001?');

    // Wait for the agent echo response (500ms delay in the mock).
    cy.get('[data-testid="chat-message-2"]', { timeout: 2000 })
      .should('be.visible')
      .and('contain.text', 'Agent:')
      .and('contain.text', 'Received:')
      .and('contain.text', 'What is the status of KYC-001?');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Message Count
  // --------------------------------------------------------------------------
  // This exercise verifies the message counter updates as messages arrive.
  it('exercise 4: verify message count', () => {
    // Verify initial count is 0.
    cy.get('[data-testid="message-count-value"]').should('have.text', '0');

    // Connect to start receiving messages.
    cy.get('[data-testid="connect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');

    // Wait for the count to reach 3 (takes ~6 seconds at 2s intervals).
    // .should('have.text', '3') retries until the text matches or timeout.
    cy.get('[data-testid="message-count-value"]', { timeout: 10000 })
      .should('have.text', '3');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Disconnect and Verify Status
  // --------------------------------------------------------------------------
  // This exercise tests the disconnect flow.
  it('exercise 5: disconnect and verify status', () => {
    // Connect and wait for at least one message.
    cy.get('[data-testid="connect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');
    cy.get('.feed-message', { timeout: 5000 }).should('have.length.at.least', 1);

    // Click Disconnect.
    cy.get('[data-testid="disconnect-btn"]').click();

    // Verify the status changes to "Disconnected".
    cy.get('[data-testid="connection-status"]').should('have.text', 'Disconnected');
    cy.get('[data-testid="connection-status"]').should('have.class', 'status-disconnected');

    // Verify buttons swap back.
    cy.get('[data-testid="connect-btn"]').should('be.visible');
    cy.get('[data-testid="disconnect-btn"]').should('not.be.visible');

    // Verify chat is disabled.
    cy.get('[data-testid="chat-input-field"]').should('be.disabled');
    cy.get('[data-testid="chat-send-btn"]').should('be.disabled');
    cy.get('[data-testid="chat-status"]').should('have.text', 'Offline');

    // Record current message count, wait 3 seconds, verify no new messages.
    cy.get('[data-testid="message-count-value"]').invoke('text').then((countBefore) => {
      // cy.wait(ms) pauses the test for the specified duration.
      // We use this to verify no new messages arrive after disconnect.
      cy.wait(3000);
      cy.get('[data-testid="message-count-value"]').should('have.text', countBefore);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Reconnect After Disconnect
  // --------------------------------------------------------------------------
  // This exercise tests disconnecting and reconnecting.
  it('exercise 6: reconnect after disconnect', () => {
    // Connect.
    cy.get('[data-testid="connect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');
    cy.get('.feed-message', { timeout: 5000 }).should('have.length.at.least', 1);

    // Disconnect.
    cy.get('[data-testid="disconnect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Disconnected');

    // Record message count at disconnect.
    cy.get('[data-testid="message-count-value"]').invoke('text').then((countAtDisconnect) => {
      // Reconnect.
      cy.get('[data-testid="connect-btn"]').click();
      cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');

      // Verify new messages arrive — count increases beyond the disconnect value.
      const expectedCount = String(Number(countAtDisconnect) + 1);
      cy.get('[data-testid="message-count-value"]', { timeout: 5000 })
        .should('have.text', expectedCount);

      // Verify chat is re-enabled.
      cy.get('[data-testid="chat-status"]').should('have.text', 'Online');
      cy.get('[data-testid="chat-input-field"]').should('not.be.disabled');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Message Ordering
  // --------------------------------------------------------------------------
  // This exercise verifies that newer messages appear at the top of the feed.
  it('exercise 7: verify message ordering', () => {
    // Connect and wait for 3 messages.
    cy.get('[data-testid="connect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');
    cy.get('.feed-message', { timeout: 10000 }).should('have.length', 3);

    // Get the data-testid of the first (newest) and last (oldest) messages.
    // .first() returns the first matching element; .last() returns the last.
    cy.get('.feed-message').first().invoke('attr', 'data-testid').then((firstId) => {
      cy.get('.feed-message').last().invoke('attr', 'data-testid').then((lastId) => {
        // Extract numbers from data-testid (e.g., "feed-message-3" -> 3).
        const firstNum = parseInt(firstId!.replace('feed-message-', ''));
        const lastNum = parseInt(lastId!.replace('feed-message-', ''));

        // The first element should have a higher number (newer message).
        expect(firstNum).to.be.greaterThan(lastNum);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Inject Custom Message via cy.window()
  // --------------------------------------------------------------------------
  // This exercise uses cy.window() to access window.mockWs and inject a
  // custom message into the feed.
  it('exercise 8: inject custom message via cy.window()', () => {
    // Connect first (window.mockWs is set after connecting).
    cy.get('[data-testid="connect-btn"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Connected');

    // Use cy.window() to access the browser's window object.
    // cy.window() yields the window object, which we can use to call
    // window.mockWs.injectMessage() to push a custom message.
    cy.window().then((win) => {
      // Call the mock's injectMessage method with a custom KYC update.
      (win as any).mockWs.injectMessage({
        applicant: 'Test Automation User',
        status: 'approved',
        id: 'KYC-AUTO-001'
      });
    });

    // Verify the injected message appears in the feed.
    cy.get('[data-testid="feed-list"]')
      .should('contain.text', 'Test Automation User')
      .and('contain.text', 'KYC-AUTO-001')
      .and('contain.text', 'approved');

    // Verify we can also check the mock state.
    // cy.window().its('property') accesses a property on the window object.
    cy.window().its('mockWs').its('connected').should('equal', true);

    // Verify message count increased.
    cy.window().then((win) => {
      const count = (win as any).mockWs.messageCount();
      expect(count).to.be.greaterThan(0);
    });
  });

});
