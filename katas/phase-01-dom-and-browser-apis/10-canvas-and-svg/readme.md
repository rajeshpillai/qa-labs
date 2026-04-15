# Kata 10: Canvas and SVG

## What You Will Learn

- How to simulate mouse drawing on an HTML5 Canvas element
- Verifying canvas content by inspecting pixel data (`getImageData`)
- Clicking and hovering SVG elements (heat map cells, bar chart bars)
- Reading SVG attributes (`data-value`, `height`) to verify chart data
- Testing tooltip visibility on hover
- Verifying canvas dimensions via attributes and runtime properties
- Playwright: `page.mouse.move/down/up`, `page.evaluate()`, `boundingBox()`
- Cypress: `.trigger('mousedown/mousemove/mouseup')`, `cy.window()`, `.invoke('attr')`

## Prerequisites

- Node.js 18+ installed
- Completed Kata 01-09 or comfortable with selectors, assertions, and mouse events
- Basic understanding of HTML5 Canvas and SVG

## Concepts Explained

### HTML5 Canvas

The `<canvas>` element provides a bitmap drawing surface. JavaScript draws on it using the 2D rendering context:

```javascript
const canvas = document.getElementById('my-canvas');
const ctx = canvas.getContext('2d');

// Draw a line
ctx.beginPath();         // start a new path
ctx.moveTo(10, 10);      // move to starting point
ctx.lineTo(100, 50);     // draw a line segment
ctx.stroke();            // render the path

// Clear the canvas
ctx.clearRect(0, 0, canvas.width, canvas.height);
```

**Testing challenge**: Canvas content is pixels, not DOM elements. You cannot query individual shapes. Instead, you:
1. Simulate mouse events to trigger drawing code
2. Inspect pixel data via `getImageData` to check if the canvas is blank or has content

### SVG (Scalable Vector Graphics)

SVG elements *are* DOM elements, so you can query, click, and read attributes just like HTML elements:

```html
<rect data-testid="bar-jan" width="30" height="80" data-value="80" fill="#3b82f6" />
```

```typescript
// Playwright
await expect(page.getByTestId('bar-jan')).toHaveAttribute('data-value', '80');

// Cypress
cy.get('[data-testid="bar-jan"]').should('have.attr', 'data-value', '80');
```

### Simulating Canvas Drawing in Tests

| Action | Playwright | Cypress |
|--------|-----------|---------|
| Move mouse | `page.mouse.move(x, y)` | `.trigger('mousemove', { offsetX, offsetY })` |
| Press button | `page.mouse.down()` | `.trigger('mousedown', { offsetX, offsetY })` |
| Release button | `page.mouse.up()` | `.trigger('mouseup')` |
| Get element position | `locator.boundingBox()` | `$el[0].getBoundingClientRect()` |

### Checking if a Canvas is Blank

```javascript
function isCanvasBlank(canvas) {
  const ctx = canvas.getContext('2d');
  // getImageData returns RGBA values for every pixel
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  // Check if all alpha values (every 4th byte) are zero
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false;
  }
  return true;
}
```

## Playground

Open the playground in your browser. It contains a **fintech signature and visualization page** with:

1. **Signature pad** (Canvas) — draw with the mouse, clear with a button, capture to change status
2. **SVG risk heat map** — 3x4 grid of colored cells, click to select, hover for tooltip
3. **SVG bar chart** — monthly approval counts with data-value attributes
4. **Canvas bar chart** — programmatically drawn bars for loan disbursements
5. **Signature status** — changes from "Unsigned" to "Signed" after capture

```bash
# start the playground server
npx serve katas -l 8080

# open in browser
# http://localhost:8080/phase-01-dom-and-browser-apis/10-canvas-and-svg/playground/
```

## Exercises

### Exercise 1: Draw on Signature Canvas

Simulate mouse events (mousedown, mousemove, mouseup) on the signature canvas and verify the `hasContent` flag becomes true.

**Playwright hint**: use `page.mouse.move/down/up` with coordinates from `boundingBox()`
**Cypress hint**: use `.trigger('mousedown', { offsetX, offsetY })` then `mousemove` and `mouseup`

### Exercise 2: Verify Canvas is Not Blank After Drawing

Call `isCanvasBlank()` before and after drawing to verify the canvas goes from blank to non-blank.

### Exercise 3: Clear Signature and Verify Canvas is Blank

Draw, then click Clear, then verify `isCanvasBlank()` returns true and status reverts to "Unsigned".

### Exercise 4: Click SVG Element and Verify Selection

Click a heat map cell and verify it gains the `selected` class. Click another and verify the selection moves.

### Exercise 5: Read SVG Bar Chart Values

Read `data-value` and `height` attributes from bar chart `<rect>` elements and verify they match expected values.

### Exercise 6: Hover Over SVG Element and Verify Tooltip

Hover over a heat map cell and verify the tooltip becomes visible with the correct text.

### Exercise 7: Verify Canvas Dimensions

Check the `width` and `height` attributes of both canvas elements, and verify them via runtime properties.

### Exercise 8: Verify Signature Status After Drawing

Draw on the canvas, click "Capture Signature", and verify the status changes from "Unsigned" to "Signed".

## Solutions

### Playwright Solution

See `playwright/canvas-svg.spec.ts` — every line is commented to explain what it does.

### Cypress Solution

See `cypress/canvas-svg.cy.ts` — every line is commented to explain what it does.

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Clicking the canvas without mousedown/mousemove | Canvas drawing requires a sequence of mouse events, not a click | Use mousedown, then mousemove (multiple), then mouseup |
| Using page coordinates for Cypress `.trigger()` | Cypress trigger uses `offsetX/offsetY` relative to the element | Use offset coordinates, not page coordinates |
| Trying to query shapes inside a canvas | Canvas is pixels, not DOM — there are no child elements | Use `getImageData` to inspect pixel data |
| Forgetting that SVG elements are in a different namespace | SVG elements are still DOM elements and support standard selectors | Use `cy.get` / `page.getByTestId` normally |
| Not hovering before checking the tooltip | The tooltip only appears on mouseover | Use `.hover()` (Playwright) or `.trigger('mouseover')` (Cypress) |

## Quick Reference

### Playwright Canvas / SVG Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `page.mouse.move(x, y)` | Move mouse to absolute coordinates | `page.mouse.move(100, 200)` |
| `page.mouse.down()` | Press left mouse button | `page.mouse.down()` |
| `page.mouse.up()` | Release left mouse button | `page.mouse.up()` |
| `locator.boundingBox()` | Get element position and size | `const box = await el.boundingBox()` |
| `locator.hover()` | Move mouse to element centre | `page.getByTestId('cell').hover()` |
| `page.evaluate(fn)` | Run JS in the browser | `page.evaluate(() => isCanvasBlank(c))` |
| `toHaveAttribute(k, v)` | Assert DOM attribute value | `expect(el).toHaveAttribute('height', '120')` |

### Cypress Canvas / SVG Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `.trigger(event, opts)` | Dispatch a DOM event | `.trigger('mousedown', { offsetX: 50, offsetY: 100 })` |
| `cy.window()` | Yield the browser window object | `cy.window().its('hasContent')` |
| `.should('have.attr')` | Assert element attribute | `.should('have.attr', 'data-value', '80')` |
| `.should('have.class')` | Assert CSS class presence | `.should('have.class', 'selected')` |
| `.invoke('attr', name)` | Read an attribute value | `.invoke('attr', 'height').should('equal', '120')` |
| `.then($el => ...)` | Access raw DOM element | `.then($el => $el[0].width)` |
