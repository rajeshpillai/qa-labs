// =============================================================================
// Kata 38: Visual Regression Testing — Cypress Tests
// =============================================================================
//
// Cypress does NOT have built-in visual comparison like Playwright.
// cy.screenshot() captures images, but does NOT compare them automatically.
//
// For automated visual comparison in Cypress, you need a plugin:
//   - cypress-image-snapshot (open source, local comparison)
//   - @percy/cypress (Percy cloud service by BrowserStack)
//
// These exercises use cy.screenshot() for capturing images and demonstrate
// the patterns you would use with a comparison plugin.
//
// PLUGIN SETUP (cypress-image-snapshot):
//   1. npm install --save-dev @simonsmith/cypress-image-snapshot
//   2. In cypress/support/commands.ts:
//      import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command';
//      addMatchImageSnapshotCommand();
//   3. In cypress.config.ts:
//      import { addMatchImageSnapshotPlugin } from '@simonsmith/cypress-image-snapshot/plugin';
//      setupNodeEvents(on, config) { addMatchImageSnapshotPlugin(on); }
// =============================================================================

const PLAYGROUND = '/phase-07-advanced-patterns/38-visual-regression/playground/';

describe('Kata 38: Visual Regression Testing', () => {

  beforeEach(() => {
    // cy.visit() navigates to the playground before each test.
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Full-Page Screenshot Capture
  // --------------------------------------------------------------------------
  // cy.screenshot() captures the visible viewport and saves it to
  // cypress/screenshots/ with the name you provide.
  it('exercise 1: capture full page screenshot', () => {
    // cy.screenshot(name, options?) captures the current viewport.
    //
    // Parameters:
    //   name (string) — the filename for the screenshot (without extension)
    //
    // Options:
    //   capture: 'fullPage' — captures the entire scrollable page
    //   capture: 'viewport' — captures only the visible viewport (default)
    //   capture: 'runner'   — captures the entire Cypress test runner
    //   overwrite: true     — overwrite existing screenshot with same name
    //
    // Screenshots are saved to: cypress/screenshots/<spec-name>/<name>.png
    cy.screenshot('dashboard-full', {
      capture: 'fullPage',   // capture the entire scrollable page
      overwrite: true        // overwrite if a previous screenshot exists
    });

    // With cypress-image-snapshot plugin, you would use:
    // cy.matchImageSnapshot('dashboard-full', {
    //   failureThreshold: 0.01,
    //   failureThresholdType: 'percent'
    // });
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Element-Level Screenshot
  // --------------------------------------------------------------------------
  // You can capture a screenshot of a SPECIFIC element, not the full page.
  it('exercise 2: capture a single component screenshot', () => {
    // cy.get(selector).screenshot(name) captures just the matched element.
    // The screenshot is cropped to the element's bounding box.
    cy.get('[data-testid="dashboard-cards"]').screenshot('dashboard-cards', {
      overwrite: true
    });

    // Capture just the table.
    cy.get('[data-testid="applicant-table-section"]').screenshot('applicant-table', {
      overwrite: true
    });

    // With cypress-image-snapshot:
    // cy.get('[data-testid="dashboard-cards"]').matchImageSnapshot('dashboard-cards');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Hide Dynamic Content Before Capture
  // --------------------------------------------------------------------------
  // The timestamp changes every second. We hide it to get stable screenshots.
  it('exercise 3: hide dynamic content before screenshot', () => {
    // cy.get(selector).invoke(method, ...args) calls a jQuery method.
    // .invoke('css', 'visibility', 'hidden') sets CSS visibility to hidden.
    // This hides the element while preserving its space in the layout
    // (unlike display:none which collapses the space).
    cy.get('[data-testid="timestamp"]')
      .invoke('css', 'visibility', 'hidden');

    // Now capture — the timestamp area is blank but the layout is unchanged.
    cy.screenshot('dashboard-masked', {
      capture: 'fullPage',
      overwrite: true
    });

    // Alternative: replace the text with a static value.
    // cy.get('[data-testid="timestamp-value"]')
    //   .invoke('text', 'Jan 1, 2025, 12:00 PM');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Freeze Time for Consistent Screenshots
  // --------------------------------------------------------------------------
  // cy.clock() freezes JavaScript's Date object to a fixed point in time.
  it('exercise 4: freeze time for stable timestamps', () => {
    // cy.clock(timestamp) replaces the browser's Date, setTimeout, etc.
    // with a controllable clock. The timestamp is milliseconds since epoch.
    //
    // new Date('2025-01-15T10:00:00').getTime() converts to milliseconds.
    // After cy.clock(), any `new Date()` in the page returns this fixed time.
    cy.clock(new Date('2025-01-15T10:00:00').getTime());

    // Re-visit so the page script runs with the frozen clock.
    cy.visit(PLAYGROUND);

    // The timestamp now shows "Jan 15, 2025, 10:00 AM" every time.
    cy.get('[data-testid="timestamp-value"]')
      .should('contain.text', '2025');

    cy.screenshot('dashboard-frozen-time', {
      capture: 'fullPage',
      overwrite: true
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Responsive Viewport Screenshot
  // --------------------------------------------------------------------------
  // Test the same page at different viewport sizes.
  it('exercise 5: capture at mobile viewport size', () => {
    // cy.viewport(width, height) sets the browser viewport dimensions.
    // This simulates a mobile device screen size.
    cy.viewport(375, 812);

    // Re-visit to trigger responsive layout recalculation.
    cy.visit(PLAYGROUND);

    // Hide the timestamp for consistency.
    cy.get('[data-testid="timestamp"]')
      .invoke('css', 'visibility', 'hidden');

    cy.screenshot('dashboard-mobile', {
      capture: 'fullPage',
      overwrite: true
    });
  });

  it('exercise 5b: capture at tablet viewport size', () => {
    cy.viewport(768, 1024);
    cy.visit(PLAYGROUND);

    cy.get('[data-testid="timestamp"]')
      .invoke('css', 'visibility', 'hidden');

    cy.screenshot('dashboard-tablet', {
      capture: 'fullPage',
      overwrite: true
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Screenshot After Interaction
  // --------------------------------------------------------------------------
  // Capture the UI state after a user interaction (hover, click, focus).
  it('exercise 6: capture screenshot after button click', () => {
    // cy.get(selector).trigger('mouseover') simulates a mouse hover.
    // This triggers any :hover CSS styles on the element.
    cy.get('[data-testid="btn-export"]').trigger('mouseover');

    // Capture just the action buttons area.
    cy.get('[data-testid="action-buttons"]').screenshot('buttons-hover-state', {
      overwrite: true
    });

    // Capture after clicking the filter button.
    cy.get('[data-testid="btn-filter"]').click();

    cy.get('[data-testid="action-buttons"]').screenshot('buttons-after-click', {
      overwrite: true
    });
  });
});
