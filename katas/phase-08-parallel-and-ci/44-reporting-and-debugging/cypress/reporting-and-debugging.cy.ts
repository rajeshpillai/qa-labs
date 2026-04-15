// =============================================================================
// Kata 44: Reporting and Debugging — Cypress Tests
// =============================================================================
//
// These tests demonstrate Cypress's debugging and reporting features.
//
// CYPRESS REPORTERS:
//   Default: 'spec' (terminal output)
//   HTML:    mochawesome (npm install mochawesome)
//
// CYPRESS DEBUGGING:
//   cy.debug()    — pauses and opens DevTools
//   cy.pause()    — pauses the test runner
//   .debug()      — chained, pauses with subject in console
//   cy.log()      — prints to the Cypress command log
// =============================================================================

describe('Kata 44: Reporting and Debugging', () => {

  // --------------------------------------------------------------------------
  // Exercise 1: Cypress Command Log
  // --------------------------------------------------------------------------
  // cy.log() prints messages to the Cypress command log (left panel).
  // These messages help trace test execution flow.
  it('exercise 1: use cy.log for test tracing', () => {
    // cy.log(message, ...args) prints to the Cypress command log.
    // This is visible in the Cypress Test Runner's left panel.
    // It does NOT print to the terminal — use console.log() for that.
    cy.log('Starting exercise 1: command log demo');

    cy.visit('data:text/html,<h1>Log Demo</h1><p>Test logging</p>');

    cy.log('Page loaded successfully');

    cy.get('h1').should('have.text', 'Log Demo');
    cy.log('Heading assertion passed');

    cy.get('p').should('contain.text', 'logging');
    cy.log('Paragraph assertion passed');

    // cy.log is also useful for marking sections of complex tests:
    cy.log('--- SECTION: Form Interaction ---');
    cy.log('--- SECTION: Assertion Phase ---');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Console Log Capture
  // --------------------------------------------------------------------------
  // Capture browser console.log messages for debugging.
  it('exercise 2: capture browser console messages', () => {
    // cy.on('window:console', callback) is NOT a real Cypress event.
    // Instead, use cy.window() to access the console.
    //
    // The common pattern: stub console.log before visiting the page.
    cy.visit('data:text/html,<h1>Console Demo</h1><script>console.log("App loaded"); console.warn("Watch out!"); console.error("Something broke");</script>');

    // cy.window() gives access to the browser's window object.
    // We can spy on console methods to capture messages.
    cy.window().then((win) => {
      // cy.spy(object, method) wraps a method with a spy.
      // The spy records all calls without changing the method's behavior.
      cy.spy(win.console, 'log').as('consoleLog');
      cy.spy(win.console, 'error').as('consoleError');
    });

    // Trigger some console activity by reloading.
    cy.reload();

    // NOTE: Spies only capture calls AFTER they are set up.
    // Messages logged before cy.spy() are not captured.
    // To capture initial page load messages, set up spies in
    // cy.on('window:before:load', (win) => { cy.spy(win.console, 'log'); })
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Screenshot Capture
  // --------------------------------------------------------------------------
  // cy.screenshot() captures the current state of the page.
  it('exercise 3: capture screenshots at key points', () => {
    cy.visit('data:text/html,<h1>Screenshot Demo</h1><p>Before interaction</p><button id="btn" onclick="this.textContent=\'Done!\'">Click</button>');

    // cy.screenshot(name, options?) captures the viewport.
    //
    // Parameters:
    //   name — filename for the screenshot (saved to cypress/screenshots/)
    //
    // Options:
    //   capture: 'fullPage' | 'viewport' | 'runner'
    //   overwrite: true/false — overwrite existing screenshot
    //   clip: { x, y, width, height } — capture a specific region
    //   padding: number — add padding around element screenshots

    // Capture BEFORE interaction.
    cy.screenshot('before-click', { overwrite: true });

    // Perform an interaction.
    cy.get('#btn').click();

    // Capture AFTER interaction.
    cy.screenshot('after-click', { overwrite: true });

    // Verify the button text changed.
    cy.get('#btn').should('have.text', 'Done!');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Element-Specific Screenshot
  // --------------------------------------------------------------------------
  it('exercise 4: screenshot a specific element', () => {
    cy.visit('data:text/html,<div style="padding:2rem"><h1>Element Screenshot</h1><div id="card" style="padding:1rem;border:2px solid blue;border-radius:8px;background:#f0f8ff"><h2>KYC Card</h2><p>Applicant: Aisha Patel</p><p>Status: Approved</p></div></div>');

    // cy.get(selector).screenshot(name) captures just the element.
    // The screenshot is cropped to the element's bounding box.
    cy.get('#card').screenshot('kyc-card', {
      overwrite: true,
      // padding — adds pixels around the element in the screenshot.
      // Useful to capture context around the element.
      padding: 10
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Cypress Video Configuration
  // --------------------------------------------------------------------------
  // Cypress can record a video of the entire spec file execution.
  it('exercise 5: video recording (configure in cypress.config.ts)', () => {
    // VIDEO CONFIGURATION:
    //
    // In cypress.config.ts:
    //   e2e: {
    //     video: true,              // enable video recording
    //     videoCompression: 32,     // compression quality (0 = best, 51 = worst)
    //     videosFolder: 'cypress/videos'  // where videos are saved
    //   }
    //
    // Videos are recorded per SPEC FILE (not per test).
    // The video captures the entire run of this file.
    //
    // Videos are saved to: cypress/videos/<spec-name>.mp4
    //
    // BEST PRACTICE:
    //   - Enable video only in CI (not locally — too slow)
    //   - Use compression to reduce file size
    //   - Upload videos as CI artifacts (see Kata 43)
    //
    // DISABLE in interactive mode (cypress open):
    //   Video is only recorded in headless mode (cypress run).

    cy.log('Video is configured in cypress.config.ts, not in test code');
    cy.visit('data:text/html,<h1>Video Demo</h1>');
    cy.get('h1').should('have.text', 'Video Demo');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Debugging Techniques
  // --------------------------------------------------------------------------
  it('exercise 6: debugging techniques cheatsheet', () => {
    cy.visit('data:text/html,<h1>Debug Practice</h1><p id="status">Loading...</p><script>setTimeout(function(){document.getElementById("status").textContent="Ready"},100)</script>');

    // TECHNIQUE 1: cy.log() — print to command log
    cy.log('Waiting for status to change...');

    // TECHNIQUE 2: .then() with console.log — print to terminal
    cy.get('#status').then(($el) => {
      // eslint-disable-next-line no-console
      console.log('Current status text:', $el.text());
    });

    // Wait for the dynamic update.
    cy.get('#status').should('have.text', 'Ready');

    // TECHNIQUE 3: cy.debug() — pauses test and opens DevTools
    // Uncomment the line below to try it:
    // cy.debug();

    // TECHNIQUE 4: cy.pause() — pauses the test runner
    // Uncomment the line below to try it:
    // cy.pause();

    // TECHNIQUE 5: .debug() — chained, logs the subject to console
    // cy.get('#status').debug();

    // TECHNIQUE 6: Cypress.log() — create custom log entries
    Cypress.log({
      name: 'custom-log',
      message: 'Test completed successfully',
      consoleProps: () => ({
        'Status': 'Ready',
        'Technique': 'Cypress.log with consoleProps'
      })
    });

    cy.get('h1').should('have.text', 'Debug Practice');
  });
});
