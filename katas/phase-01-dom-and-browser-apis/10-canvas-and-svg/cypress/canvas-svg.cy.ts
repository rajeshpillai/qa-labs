// The base path to this kata's playground.
// Cypress prepends the baseUrl (http://localhost:8080) to this path.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/10-canvas-and-svg/playground/';

// --------------------------------------------------------------------------
// Helper: simulate a mouse drawing stroke on a canvas element.
// Uses Cypress's .trigger() to dispatch mousedown, mousemove, mouseup.
// trigger(event, options) dispatches a synthetic DOM event on the element.
// --------------------------------------------------------------------------
function drawOnCanvas(testId: string) {
  // .trigger('mousedown', { ... }) fires a mousedown event at the given
  // offsetX/offsetY coordinates relative to the element's top-left corner.
  cy.get(`[data-testid="${testId}"]`)
    .trigger('mousedown', { offsetX: 50, offsetY: 100 });

  // Draw a short zigzag by dispatching several mousemove events.
  // Each mousemove causes the canvas listener to call ctx.lineTo + ctx.stroke.
  cy.get(`[data-testid="${testId}"]`)
    .trigger('mousemove', { offsetX: 80,  offsetY: 80  })
    .trigger('mousemove', { offsetX: 110, offsetY: 120 })
    .trigger('mousemove', { offsetX: 140, offsetY: 80  })
    .trigger('mousemove', { offsetX: 170, offsetY: 120 })
    .trigger('mousemove', { offsetX: 200, offsetY: 100 });

  // Release the mouse button to end the stroke.
  cy.get(`[data-testid="${testId}"]`)
    .trigger('mouseup');
}

describe('Kata 10: Canvas and SVG', () => {

  // beforeEach runs before every test. We visit the playground page
  // so each test starts with a fresh, unmodified page.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Draw on the signature canvas
  // --------------------------------------------------------------------------
  it('exercise 1: draw on signature canvas via mouse events', () => {
    // Use the helper to simulate a drawing stroke
    drawOnCanvas('signature-pad');

    // After drawing, the global hasContent flag should be true.
    // cy.window() yields the browser's window object.
    // .its('hasContent') reads the property from the window.
    cy.window().its('hasContent').should('equal', true);
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify canvas is not blank after drawing
  // --------------------------------------------------------------------------
  it('exercise 2: canvas is not blank after drawing', () => {
    // Before drawing, confirm the canvas is blank.
    // cy.window().then(win => ...) gives us the window object so we can
    // call the isCanvasBlank helper function exposed by the playground.
    cy.window().then((win: any) => {
      const c = win.document.querySelector('[data-testid="signature-pad"]');
      expect(win.isCanvasBlank(c)).to.be.true;
    });

    // Draw a stroke
    drawOnCanvas('signature-pad');

    // After drawing, the canvas should NOT be blank.
    // isCanvasBlank scans every pixel's alpha channel.
    cy.window().then((win: any) => {
      const c = win.document.querySelector('[data-testid="signature-pad"]');
      expect(win.isCanvasBlank(c)).to.be.false;
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Clear signature and verify canvas is blank
  // --------------------------------------------------------------------------
  it('exercise 3: clear button resets the canvas', () => {
    // Draw something first
    drawOnCanvas('signature-pad');

    // Click the Clear button, which calls ctx.clearRect on the canvas.
    cy.get('[data-testid="clear-signature"]').click();

    // Verify the canvas is blank again
    cy.window().then((win: any) => {
      const c = win.document.querySelector('[data-testid="signature-pad"]');
      expect(win.isCanvasBlank(c)).to.be.true;
    });

    // The signature status should revert to "Unsigned"
    cy.get('[data-testid="signature-status"]').should('have.text', 'Unsigned');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Click SVG element and verify selection state
  // --------------------------------------------------------------------------
  it('exercise 4: click heat map cell to select it', () => {
    // Click the Credit Q3 cell (risk score 91).
    // SVG elements support .click() just like HTML elements in Cypress.
    cy.get('[data-testid="cell-credit-q3"]').click();

    // The click handler adds the "selected" class.
    // .should('have.class', 'selected') checks the element's classList.
    cy.get('[data-testid="cell-credit-q3"]')
      .should('have.class', 'selected');

    // The "selected-cell" label should show the cell's data-label text.
    cy.get('[data-testid="selected-cell"]')
      .should('have.text', 'Credit Q3: 91');

    // Click a different cell and verify the selection moves
    cy.get('[data-testid="cell-ops-q1"]').click();
    cy.get('[data-testid="cell-ops-q1"]')
      .should('have.class', 'selected');

    // The previously selected cell should lose its "selected" class.
    cy.get('[data-testid="cell-credit-q3"]')
      .should('not.have.class', 'selected');

    cy.get('[data-testid="selected-cell"]')
      .should('have.text', 'Ops Q1: 12');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify SVG bar chart values (read height attributes)
  // --------------------------------------------------------------------------
  it('exercise 5: read SVG bar chart data-value attributes', () => {
    // Each SVG <rect> bar has a data-value attribute with the approval count.
    // .should('have.attr', name, value) asserts an attribute equals a value.
    cy.get('[data-testid="bar-jan"]')
      .should('have.attr', 'data-value', '80');

    cy.get('[data-testid="bar-feb"]')
      .should('have.attr', 'data-value', '120');

    // Verify the height attribute matches the visual bar height.
    // .invoke('attr', 'height') retrieves the attribute value.
    cy.get('[data-testid="bar-feb"]')
      .invoke('attr', 'height')
      .should('equal', '120');

    // Check the tallest bar (May)
    cy.get('[data-testid="bar-may"]')
      .should('have.attr', 'data-value', '140')
      .and('have.attr', 'height', '140');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Hover over SVG element and verify tooltip
  // --------------------------------------------------------------------------
  it('exercise 6: hover over heat map cell shows tooltip', () => {
    // The tooltip is hidden by default.
    cy.get('[data-testid="heatmap-tooltip"]').should('not.be.visible');

    // .trigger('mouseover') fires a mouseover event, which shows the tooltip.
    // We use trigger instead of cy.realHover because trigger works reliably
    // for synthetic DOM events that the playground listens for.
    cy.get('[data-testid="cell-market-q2"]').trigger('mouseover');

    // The mouseover handler sets the tooltip text and adds the "visible" class.
    cy.get('[data-testid="heatmap-tooltip"]')
      .should('be.visible')
      .and('have.text', 'Market Q2: 53');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify canvas dimensions
  // --------------------------------------------------------------------------
  it('exercise 7: verify canvas dimensions', () => {
    // Check the signature pad dimensions via HTML attributes.
    cy.get('[data-testid="signature-pad"]')
      .should('have.attr', 'width', '400')
      .and('have.attr', 'height', '200');

    // Check the chart canvas dimensions.
    cy.get('[data-testid="chart-canvas"]')
      .should('have.attr', 'width', '400')
      .and('have.attr', 'height', '220');

    // We can also read the runtime properties via the DOM.
    // .then($el => ...) gives us the jQuery-wrapped element.
    // $el[0] is the raw HTMLCanvasElement with .width and .height properties.
    cy.get('[data-testid="signature-pad"]').then(($el) => {
      const canvas = $el[0] as HTMLCanvasElement;
      expect(canvas.width).to.equal(400);
      expect(canvas.height).to.equal(200);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify signature status changes after drawing
  // --------------------------------------------------------------------------
  it('exercise 8: capture signature updates status to Signed', () => {
    // Initially the status should be "Unsigned"
    cy.get('[data-testid="signature-status"]')
      .should('have.text', 'Unsigned')
      .and('have.class', 'status-unsigned');

    // Draw a signature
    drawOnCanvas('signature-pad');

    // Click "Capture Signature" to finalize
    cy.get('[data-testid="capture-signature"]').click();

    // Verify the status changed to "Signed"
    cy.get('[data-testid="signature-status"]')
      .should('have.text', 'Signed')
      .and('have.class', 'status-signed');

    // The capture button text should also update
    cy.get('[data-testid="capture-signature"]')
      .should('have.text', 'Signature Captured');
  });
});
