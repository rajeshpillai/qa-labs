const PLAYGROUND = '/phase-06-complex-scenarios/36-notifications-and-toasts/playground/';

describe('Kata 36: Notifications and Toasts', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Trigger Toast, Verify Appears Then Dismisses
  // --------------------------------------------------------------------------
  // Shows an info toast, verifies it appears, then waits for auto-dismiss.
  it('exercise 1: trigger toast and verify auto-dismiss', () => {
    // Click the Info Toast button.
    cy.get('[data-testid="toast-info-btn"]').click();

    // Verify the toast appeared with correct text.
    cy.get('[data-testid="toast-info"]')
      .should('be.visible')
      .and('contain.text', 'System update available');

    // Wait for auto-dismiss (3s + animation). The toast element is removed
    // from the DOM after dismissal, so we check for non-existence.
    // .should('not.exist') waits (up to the default or specified timeout)
    // until the element is no longer in the DOM.
    cy.get('[data-testid="toast-info"]', { timeout: 5000 })
      .should('not.exist');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Banner Persists
  // --------------------------------------------------------------------------
  // Shows the banner and verifies it stays visible after a delay.
  it('exercise 2: verify banner persists', () => {
    // Show the banner.
    cy.get('[data-testid="show-banner-btn"]').click();

    // Verify visible.
    cy.get('[data-testid="banner"]').should('be.visible');
    cy.get('[data-testid="banner-text"]').should('contain.text', 'maintenance');

    // Wait 2 seconds and verify it's still visible (does not auto-dismiss).
    // cy.wait(ms) pauses the test for the given milliseconds.
    cy.wait(2000);
    cy.get('[data-testid="banner"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Dismiss Notification
  // --------------------------------------------------------------------------
  // Shows the banner, dismisses it, verifies it's gone.
  it('exercise 3: dismiss banner notification', () => {
    // Show banner.
    cy.get('[data-testid="show-banner-btn"]').click();
    cy.get('[data-testid="banner"]').should('be.visible');

    // Click dismiss.
    cy.get('[data-testid="banner-dismiss"]').click();

    // Verify hidden.
    cy.get('[data-testid="banner"]').should('not.be.visible');

    // Verify last action.
    cy.get('[data-testid="last-action"]').should('have.text', 'Banner dismissed');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Badge Count
  // --------------------------------------------------------------------------
  // Triggers multiple notifications and checks the badge number.
  it('exercise 4: verify badge count', () => {
    // Badge starts hidden.
    cy.get('[data-testid="badge-count"]').should('not.be.visible');

    // Trigger 3 toasts.
    cy.get('[data-testid="toast-info-btn"]').click();
    cy.get('[data-testid="toast-success-btn"]').click();
    cy.get('[data-testid="toast-error-btn"]').click();

    // Verify badge count is 3.
    cy.get('[data-testid="badge-count"]')
      .should('be.visible')
      .and('have.text', '3');

    // Verify total notifications.
    cy.get('[data-testid="total-notifications"]').should('have.text', '3');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Open Notification Drawer
  // --------------------------------------------------------------------------
  // Clicks the bell, verifies the drawer opens with notification items.
  it('exercise 5: open notification drawer', () => {
    // Create notifications.
    cy.get('[data-testid="toast-info-btn"]').click();
    cy.get('[data-testid="toast-error-btn"]').click();

    // Open drawer.
    cy.get('[data-testid="bell-btn"]').click();

    // Verify drawer is open.
    cy.get('[data-testid="notification-drawer"]').should('have.class', 'open');

    // Verify overlay visible.
    cy.get('[data-testid="drawer-overlay"]').should('be.visible');

    // Verify items in the drawer.
    cy.get('[data-testid="drawer-item-0"]').should('be.visible');
    cy.get('[data-testid="drawer-item-1"]').should('be.visible');

    // Verify badge reset (notifications "read").
    cy.get('[data-testid="badge-count"]').should('not.be.visible');

    // Close drawer.
    cy.get('[data-testid="drawer-close"]').click();
    cy.get('[data-testid="notification-drawer"]').should('not.have.class', 'open');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Click Snackbar Action (Undo)
  // --------------------------------------------------------------------------
  // Shows the snackbar and clicks the Undo button.
  it('exercise 6: click snackbar undo action', () => {
    // Show snackbar.
    cy.get('[data-testid="show-snackbar-btn"]').click();

    // Verify visible with correct message.
    cy.get('[data-testid="snackbar"]').should('be.visible');
    cy.get('[data-testid="snackbar-message"]').should('contain.text', 'Item deleted');

    // Click Undo.
    cy.get('[data-testid="snackbar-undo"]').click();

    // Verify snackbar dismissed.
    cy.get('[data-testid="snackbar"]').should('not.be.visible');

    // Verify undo status.
    cy.get('[data-testid="undo-status"]').should('have.text', 'Item restored');

    // Verify last action.
    cy.get('[data-testid="last-action"]').should('have.text', 'Undo performed');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Priority Stacking Order
  // --------------------------------------------------------------------------
  // Fires priority toasts and verifies the error toast appears last in DOM
  // (visually on top due to column-reverse).
  it('exercise 7: verify priority stacking order', () => {
    // Fire priority toasts.
    cy.get('[data-testid="priority-toast-btn"]').click();

    // Wait for all toasts to appear.
    cy.wait(500);

    // Verify 3 toasts exist.
    cy.get('.toast').should('have.length', 3);

    // The last toast in the DOM should be the error (highest priority).
    // .last() gets the last element in the set of matched elements.
    cy.get('.toast').last().should('have.attr', 'data-toast-type', 'error');

    // The first toast in the DOM should be the info (lowest priority).
    // .first() gets the first element in the set.
    cy.get('.toast').first().should('have.attr', 'data-toast-type', 'info');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Multiple Toasts Stacking
  // --------------------------------------------------------------------------
  // Fires 3 toasts and verifies all are visible simultaneously.
  it('exercise 8: multiple toasts stacking', () => {
    // Fire 3 toasts.
    cy.get('[data-testid="multi-toast-btn"]').click();

    // Wait for all toasts.
    cy.wait(500);

    // Verify 3 toasts visible.
    cy.get('.toast').should('have.length', 3);

    // Verify each type is present.
    cy.get('[data-testid="toast-info"]').should('be.visible');
    cy.get('[data-testid="toast-success"]').should('be.visible');
    cy.get('[data-testid="toast-warning"]').should('be.visible');

    // Verify total count.
    cy.get('[data-testid="total-notifications"]').should('have.text', '3');

    // Wait for auto-dismiss and verify all are gone.
    cy.get('.toast', { timeout: 6000 }).should('have.length', 0);
  });
});
