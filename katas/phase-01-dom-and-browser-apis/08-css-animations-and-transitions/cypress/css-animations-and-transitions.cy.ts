const PLAYGROUND = '/phase-01-dom-and-browser-apis/08-css-animations-and-transitions/playground/';

describe('Kata 08: CSS Animations and Transitions', () => {

  // beforeEach runs before every test in this describe block.
  // We navigate to the playground page so each test starts fresh.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Click Card to Trigger Flip, Verify Back Content Visible
  // --------------------------------------------------------------------------
  // This exercise demonstrates testing a CSS 3D flip animation by checking
  // for the "flipped" class and reading back-face content.
  it('exercise 1: click card to flip and verify back content', () => {
    // Verify the card starts in the "front" state.
    // .should('have.text', str) asserts the element's textContent equals str.
    cy.get('[data-testid="flip-state"]').should('have.text', 'front');

    // Verify the flip card does NOT have the 'flipped' class.
    // .should('not.have.class', name) checks the element's classList
    // does not contain the specified class name.
    cy.get('[data-testid="flip-card"]').should('not.have.class', 'flipped');

    // Click the card container to trigger the flip animation.
    // The click handler toggles the 'flipped' class, which triggers a CSS
    // transition: transform 0.6s ease (rotateY 180deg).
    cy.get('[data-testid="flip-container"]').click();

    // Verify the card now has the 'flipped' class.
    // .should('have.class', name) auto-retries until the class is present
    // or the assertion timeout expires.
    cy.get('[data-testid="flip-card"]').should('have.class', 'flipped');

    // Verify the state text updated to "back".
    cy.get('[data-testid="flip-state"]').should('have.text', 'back');

    // Verify the back face content is accessible.
    // .should('contain.text', str) checks if textContent contains the string.
    cy.get('[data-testid="flip-back"]').should('contain.text', 'Risk Level: High');
    cy.get('[data-testid="flip-back"]').should('contain.text', 'United Kingdom');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Open Sidebar, Verify It Slides In (Check CSS Transform)
  // --------------------------------------------------------------------------
  // This exercise demonstrates checking computed CSS transform values to
  // verify a slide-in transition completed.
  it('exercise 2: open sidebar and verify slide-in transform', () => {
    // Verify the sidebar starts closed.
    cy.get('[data-testid="sidebar-state"]').should('have.text', 'closed');
    cy.get('[data-testid="sidebar-panel"]').should('not.have.class', 'open');

    // Click "Toggle Filters" to slide in the sidebar.
    cy.get('[data-testid="btn-toggle-sidebar"]').click();

    // Verify the sidebar now has the 'open' class.
    cy.get('[data-testid="sidebar-panel"]').should('have.class', 'open');

    // Verify the state updated.
    cy.get('[data-testid="sidebar-state"]').should('have.text', 'open');

    // Verify the CSS transform changed to translateX(0).
    // .should('have.css', property, value) checks the computed style.
    // Browsers compute translateX(0) as the identity matrix string.
    // The 0.4s transition must complete before this assertion passes.
    // Cypress auto-retries .should() assertions, so it waits naturally.
    cy.get('[data-testid="sidebar-panel"]').should(
      'have.css',
      'transform',
      'matrix(1, 0, 0, 1, 0, 0)'
    );
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Spinner is Animating (Check animation-name CSS Property)
  // --------------------------------------------------------------------------
  // This exercise demonstrates reading the CSS animation-name property to
  // confirm a @keyframes animation is running.
  it('exercise 3: verify spinner animation is active', () => {
    // Verify the spinner is initially hidden.
    // .should('not.be.visible') asserts the element is not visible (display:none).
    cy.get('[data-testid="spinner"]').should('not.be.visible');

    // Click "Start Loading" to activate the spinner.
    cy.get('[data-testid="btn-toggle-spinner"]').click();

    // Verify the spinner is now visible.
    cy.get('[data-testid="spinner"]').should('be.visible');

    // Verify the spinner has the 'active' class.
    cy.get('[data-testid="spinner"]').should('have.class', 'active');

    // Verify the CSS animation-name is 'spin'.
    // .should('have.css', 'animation-name', 'spin') checks the computed
    // animation-name property. When the @keyframes 'spin' animation is
    // assigned to the element, this property returns 'spin'.
    cy.get('[data-testid="spinner"]').should('have.css', 'animation-name', 'spin');

    // Verify the status text updated.
    cy.get('[data-testid="spinner-status"]').should('have.text', 'Loading...');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Trigger Fade-in, Verify Opacity Changes
  // --------------------------------------------------------------------------
  // This exercise demonstrates verifying CSS opacity transitions using
  // Cypress's have.css assertion.
  it('exercise 4: fade in and fade out, verify opacity', () => {
    // Verify the element starts with opacity 0.
    // .should('have.css', 'opacity', '0') checks the computed opacity.
    cy.get('[data-testid="fade-element"]').should('have.css', 'opacity', '0');

    // Click "Show Alert" to trigger the fade-in transition.
    // This adds the 'visible' class, setting opacity: 1 with a 0.5s transition.
    cy.get('[data-testid="btn-fade-in"]').click();

    // Verify the opacity transitioned to 1.
    // Cypress auto-retries .should() assertions, so it naturally waits
    // for the 0.5s transition to complete before this passes.
    cy.get('[data-testid="fade-element"]').should('have.css', 'opacity', '1');

    // Verify the opacity display updated.
    cy.get('[data-testid="fade-opacity"]').should('have.text', '1');

    // Click "Hide Alert" to trigger the fade-out transition.
    cy.get('[data-testid="btn-fade-out"]').click();

    // Verify the opacity returns to 0.
    cy.get('[data-testid="fade-element"]').should('have.css', 'opacity', '0');
    cy.get('[data-testid="fade-opacity"]').should('have.text', '0');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Progress Bar Width Transition
  // --------------------------------------------------------------------------
  // This exercise demonstrates checking element width after a CSS transition.
  it('exercise 5: verify progress bar width transitions', () => {
    // Verify the progress starts at 0%.
    cy.get('[data-testid="progress-value"]').should('have.text', '0%');

    // Click the 50% button.
    cy.get('[data-testid="btn-progress-50"]').click();

    // Verify the progress value text updated.
    cy.get('[data-testid="progress-value"]').should('have.text', '50%');

    // Verify the inline style width was set to 50%.
    // .invoke('css', property) reads the jQuery-computed CSS property value.
    // We wait for the transition to complete with a should() chain.
    // Checking the inline style.width via invoke('attr', 'style') gives us
    // the value set by JavaScript, not the transitioning computed value.
    cy.get('[data-testid="progress-fill"]')
      .should('have.attr', 'style')
      .and('contain', 'width: 50%');

    // Click the 100% button.
    cy.get('[data-testid="btn-progress-100"]').click();
    cy.get('[data-testid="progress-value"]').should('have.text', '100%');

    // Verify the style updated.
    cy.get('[data-testid="progress-fill"]')
      .should('have.attr', 'style')
      .and('contain', 'width: 100%');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Open/Close Accordion, Verify Height
  // --------------------------------------------------------------------------
  // This exercise demonstrates testing accordion expand/collapse using
  // CSS max-height transitions.
  it('exercise 6: open and close accordion, verify height transition', () => {
    // Verify the first accordion body starts closed.
    cy.get('[data-testid="accordion-body-1"]').should('not.have.class', 'open');

    // Verify the max-height is 0px when closed.
    // .should('have.css', 'max-height', '0px') checks the computed max-height.
    cy.get('[data-testid="accordion-body-1"]').should('have.css', 'max-height', '0px');

    // Click the first accordion header to open it.
    cy.get('[data-testid="accordion-header-1"]').click();

    // Verify the body has the 'open' class.
    cy.get('[data-testid="accordion-body-1"]').should('have.class', 'open');

    // Verify the arrow rotated (has 'open' class).
    cy.get('[data-testid="accordion-arrow-1"]').should('have.class', 'open');

    // Verify the max-height is greater than 0px.
    // .invoke('css', 'max-height') returns the computed max-height value.
    // .then() lets us run custom assertions on the value.
    cy.get('[data-testid="accordion-body-1"]')
      .invoke('css', 'max-height')
      .then((maxHeight) => {
        // maxHeight is a string like "200px". parseFloat extracts the number.
        expect(parseFloat(maxHeight as string)).to.be.greaterThan(0);
      });

    // Click the header again to close the accordion.
    cy.get('[data-testid="accordion-header-1"]').click();

    // Verify the body no longer has the 'open' class.
    cy.get('[data-testid="accordion-body-1"]').should('not.have.class', 'open');

    // Verify max-height returns to 0px.
    cy.get('[data-testid="accordion-body-1"]').should('have.css', 'max-height', '0px');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Trigger Processing Overlay, Wait for It to Disappear
  // --------------------------------------------------------------------------
  // This exercise demonstrates waiting for a timed animation sequence.
  // The overlay fades in, shows for 2 seconds, then automatically fades out.
  it('exercise 7: processing overlay appears and auto-disappears', () => {
    // Verify the overlay starts idle.
    cy.get('[data-testid="processing-state"]').should('have.text', 'idle');

    // Verify the overlay is not visible (opacity 0).
    cy.get('[data-testid="processing-overlay"]').should('have.css', 'opacity', '0');

    // Click "Process Application" to trigger the overlay.
    cy.get('[data-testid="btn-process"]').click();

    // Verify the overlay becomes visible (opacity transitions to 1).
    // Cypress auto-retries, waiting for the 0.3s fade-in transition.
    cy.get('[data-testid="processing-overlay"]').should('have.css', 'opacity', '1');

    // Verify the state changed to "processing".
    cy.get('[data-testid="processing-state"]').should('have.text', 'processing');

    // Verify the processing box content.
    cy.get('[data-testid="processing-box"]').should('contain.text', 'Please wait');

    // Wait for the overlay to automatically disappear (2s delay + 0.3s fade-out).
    // We increase the Cypress default command timeout for this assertion.
    // { timeout: 5000 } tells Cypress to retry for up to 5 seconds.
    cy.get('[data-testid="processing-overlay"]', { timeout: 5000 })
      .should('have.css', 'opacity', '0');

    // Verify the state changed to "complete".
    cy.get('[data-testid="processing-state"]').should('have.text', 'complete');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Computed Styles During Transitions
  // --------------------------------------------------------------------------
  // This exercise demonstrates reading computed CSS styles at different
  // points during a transition to observe intermediate values.
  it('exercise 8: verify computed styles before and after transition', () => {
    // Click the 75% button to start the progress bar transition.
    cy.get('[data-testid="btn-progress-75"]').click();

    // Immediately verify the inline style was set (JavaScript sets this instantly).
    // .should('have.attr', 'style') reads the element's style attribute.
    // .and('contain', str) chains an additional assertion on the same subject.
    cy.get('[data-testid="progress-fill"]')
      .should('have.attr', 'style')
      .and('contain', 'width: 75%');

    // Read the computed width immediately — it may be mid-transition.
    // .invoke('css', 'width') calls jQuery's .css('width') on the element,
    // which returns the computed pixel width as a string (e.g., "300px").
    cy.get('[data-testid="progress-fill"]')
      .invoke('css', 'width')
      .then((widthDuring) => {
        // Store the mid-transition value. It's a string like "123.45px".
        const valueDuring = parseFloat(widthDuring as string);
        // It should be a valid number greater than or equal to 0.
        expect(valueDuring).to.be.at.least(0);
      });

    // Wait for the 0.8s transition to complete, then verify the final width.
    // We use cy.wait() to pause, then re-read the computed width.
    cy.wait(1000);

    // Read the final computed width and verify it's approximately 75% of
    // the track width.
    cy.get('[data-testid="progress-track"]')
      .invoke('css', 'width')
      .then((trackWidth) => {
        const track = parseFloat(trackWidth as string);
        const expected = track * 0.75;

        // Now read the progress fill's computed width and compare.
        cy.get('[data-testid="progress-fill"]')
          .invoke('css', 'width')
          .then((fillWidth) => {
            const fill = parseFloat(fillWidth as string);
            // Allow 2px tolerance for rounding.
            expect(fill).to.be.closeTo(expected, 2);
          });
      });
  });

});
