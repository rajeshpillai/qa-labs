// Path to the playground HTML served by the dev server.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/11-dom-mutations/playground/';

describe('Kata 11: DOM Mutations', () => {

  beforeEach(() => {
    // Visit the playground before each test.
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Wait for New Notification (DOM Insertion)
  //
  // The feed auto-adds a notification every 3 seconds via setInterval.
  // cy.get() + .should('have.length', n) retries automatically until
  // the expected number of elements exist in the DOM.
  // --------------------------------------------------------------------------
  it('exercise 1: wait for a new notification to appear', () => {
    // Wait for at least 1 notification to be inserted.
    // { timeout: 5000 } gives Cypress up to 5 seconds to retry.
    // The notification arrives after 3s, so this passes comfortably.
    cy.get('[data-testid="notification-item"]', { timeout: 5000 })
      .should('have.length', 1);

    // Verify the notification contains visible text.
    cy.get('[data-testid="notification-text"]').first()
      .should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Notification Count Increments
  //
  // Wait for notifications and verify the counter text updates.
  // .should('have.text', '1') retries until the text matches.
  // --------------------------------------------------------------------------
  it('exercise 2: verify unread count increments with new notifications', () => {
    // Wait for the first notification.
    cy.get('[data-testid="notification-item"]', { timeout: 5000 })
      .should('have.length', 1);

    // Unread count should be "1".
    cy.get('[data-testid="unread-count"]')
      .should('have.text', '1');

    // Wait for the second notification.
    cy.get('[data-testid="notification-item"]', { timeout: 5000 })
      .should('have.length', 2);

    // Unread count should be "2".
    cy.get('[data-testid="unread-count"]')
      .should('have.text', '2');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Dismiss a Notification (DOM Removal)
  //
  // Wait for a notification, click dismiss, and verify it's gone.
  // .should('have.length', 0) retries until no elements remain.
  // --------------------------------------------------------------------------
  it('exercise 3: dismiss a notification and verify removal', () => {
    // Wait for the first notification.
    cy.get('[data-testid="notification-item"]', { timeout: 5000 })
      .should('have.length', 1);

    // Pause the feed so no new notifications arrive.
    cy.get('[data-testid="btn-pause-feed"]').click();

    // Click the dismiss button on the first notification.
    // The dismiss button removes the notification element from the DOM.
    cy.get('[data-testid="btn-dismiss"]').first().click();

    // Verify the notification is removed — count is now 0.
    cy.get('[data-testid="notification-item"]')
      .should('have.length', 0);

    // Unread count should also be 0.
    cy.get('[data-testid="unread-count"]')
      .should('have.text', '0');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Mark All as Read (CSS Class Change)
  //
  // "Mark All Read" adds the CSS class "read" to every notification.
  // .should('have.class', 'read') retries until the class is present.
  // --------------------------------------------------------------------------
  it('exercise 4: mark all as read and verify class change', () => {
    // Wait for the first notification.
    cy.get('[data-testid="notification-item"]', { timeout: 5000 })
      .should('have.length', 1);

    // Pause the feed.
    cy.get('[data-testid="btn-pause-feed"]').click();

    // Verify the notification does NOT have the "read" class yet.
    cy.get('[data-testid="notification-item"]').first()
      .should('not.have.class', 'read');

    // Click "Mark All Read".
    cy.get('[data-testid="btn-mark-all-read"]').click();

    // Verify the notification now has the "read" class.
    // This class changes background, border, and text color via CSS.
    cy.get('[data-testid="notification-item"]').first()
      .should('have.class', 'read');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Wait for Price Text to Change (Text Mutation)
  //
  // The live price updates every 2 seconds. We capture the initial text,
  // then use .should('not.have.text', initial) to wait for it to change.
  // --------------------------------------------------------------------------
  it('exercise 5: wait for live price text to change', () => {
    // Read the initial price text using .invoke('text').
    // .then() gives us the text value to use in the next assertion.
    cy.get('[data-testid="live-price"]')
      .invoke('text')
      .then((initialPrice) => {
        // .should('not.have.text', initialPrice) retries until the
        // element's text is different from the initial value.
        // Price updates every 2s, so this passes within 5s.
        cy.get('[data-testid="live-price"]', { timeout: 5000 })
          .should('not.have.text', initialPrice);
      });

    // Also verify the timestamp has been set.
    cy.get('[data-testid="price-timestamp"]')
      .should('not.have.text', '--:--:--');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Badge Visibility Based on Count
  //
  // Badge is visible when unread > 0, hidden when unread = 0.
  // The badge uses display:none (via CSS class "hidden") to hide.
  // --------------------------------------------------------------------------
  it('exercise 6: badge shows when unread, hides when all read', () => {
    // Wait for a notification so there's something to mark as read.
    cy.get('[data-testid="notification-item"]', { timeout: 5000 })
      .should('have.length', 1);

    // Badge should be visible (unread count > 0).
    cy.get('[data-testid="unread-badge"]')
      .should('be.visible');

    // Pause the feed and mark all as read.
    cy.get('[data-testid="btn-pause-feed"]').click();
    cy.get('[data-testid="btn-mark-all-read"]').click();

    // Badge should now be hidden (CSS class "hidden" sets display:none).
    cy.get('[data-testid="unread-badge"]')
      .should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Wait for Multiple Notifications to Accumulate
  //
  // Notifications arrive every 3 seconds. We wait for 3 to appear.
  // With a 3s interval, 3 notifications take ~9s, so we use a 15s timeout.
  // --------------------------------------------------------------------------
  it('exercise 7: wait for at least 3 notifications', () => {
    // .should('have.length', 3) retries until exactly 3 elements match.
    cy.get('[data-testid="notification-item"]', { timeout: 15000 })
      .should('have.length', 3);

    // Verify the total count display matches.
    cy.get('[data-testid="total-count"]')
      .should('have.text', '3');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Element Attribute Changes Dynamically
  //
  // "Toggle Priority" changes data-priority from "normal" to "high".
  // .should('have.attr', name, value) retries until the attribute matches.
  // --------------------------------------------------------------------------
  it('exercise 8: verify attribute changes on toggle', () => {
    // Verify initial attribute value.
    cy.get('[data-testid="status-message"]')
      .should('have.attr', 'data-priority', 'normal');

    // Click "Toggle Priority".
    cy.get('[data-testid="btn-change-attr"]').click();

    // Verify the attribute changed to "high".
    cy.get('[data-testid="status-message"]')
      .should('have.attr', 'data-priority', 'high');

    // Verify the text content also changed.
    cy.get('[data-testid="status-message"]')
      .should('have.text', 'System status: High priority — maintenance scheduled');

    // Toggle back and verify it reverts.
    cy.get('[data-testid="btn-change-attr"]').click();
    cy.get('[data-testid="status-message"]')
      .should('have.attr', 'data-priority', 'normal');
  });

});
