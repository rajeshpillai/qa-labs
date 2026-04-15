import { test, expect } from '@playwright/test';

// The base path to this kata's playground.
// The web server serves the katas/ directory, so the path starts from there.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/10-canvas-and-svg/playground/';

// --------------------------------------------------------------------------
// Helper: simulate a mouse stroke on a canvas element.
// Dispatches mousedown, several mousemove events, then mouseup.
// --------------------------------------------------------------------------
async function drawOnCanvas(
  page: import('@playwright/test').Page,
  testId: string,
) {
  const canvas = page.getByTestId(testId);

  // boundingBox returns { x, y, width, height } of the element in page
  // coordinates. We use these to calculate absolute positions for mouse events.
  const box = await canvas.boundingBox();
  if (!box) throw new Error(`Canvas [data-testid="${testId}"] not found`);

  // Start near the centre-left of the canvas
  const startX = box.x + box.width * 0.2;
  const startY = box.y + box.height * 0.5;

  // page.mouse.move moves the virtual mouse to absolute coordinates.
  await page.mouse.move(startX, startY);

  // page.mouse.down presses the left button (triggers mousedown on canvas).
  await page.mouse.down();

  // Draw a short zigzag stroke across the canvas.
  // Each move triggers mousemove, which calls ctx.lineTo + ctx.stroke.
  const steps = 5;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      startX + i * 30,
      startY + (i % 2 === 0 ? -20 : 20),
      { steps: 3 },  // interpolate 3 sub-steps for smoother movement
    );
  }

  // page.mouse.up releases the button (triggers mouseup).
  await page.mouse.up();
}

// --------------------------------------------------------------------------
// Exercise 1: Draw on the signature canvas
// --------------------------------------------------------------------------
test('exercise 1: draw on signature canvas via mouse events', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Use the helper to simulate a drawing stroke on the signature pad.
  await drawOnCanvas(page, 'signature-pad');

  // After drawing, the global hasContent flag is true.
  // page.evaluate runs JavaScript in the browser and returns the result.
  const hasContent = await page.evaluate(() => (window as any).hasContent);
  expect(hasContent).toBe(true);
});

// --------------------------------------------------------------------------
// Exercise 2: Verify canvas is not blank after drawing
// --------------------------------------------------------------------------
test('exercise 2: canvas is not blank after drawing', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Before drawing, the canvas should be blank.
  // We call the helper function isCanvasBlank exposed on window.
  const blankBefore = await page.evaluate(() => {
    const c = document.querySelector('[data-testid="signature-pad"]') as HTMLCanvasElement;
    return (window as any).isCanvasBlank(c);
  });
  expect(blankBefore).toBe(true);

  // Draw a stroke
  await drawOnCanvas(page, 'signature-pad');

  // After drawing, the canvas should no longer be blank.
  // isCanvasBlank checks every pixel's alpha channel — if any pixel is
  // non-transparent, it returns false.
  const blankAfter = await page.evaluate(() => {
    const c = document.querySelector('[data-testid="signature-pad"]') as HTMLCanvasElement;
    return (window as any).isCanvasBlank(c);
  });
  expect(blankAfter).toBe(false);
});

// --------------------------------------------------------------------------
// Exercise 3: Clear signature and verify canvas is blank
// --------------------------------------------------------------------------
test('exercise 3: clear button resets the canvas', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Draw something first
  await drawOnCanvas(page, 'signature-pad');

  // Click the Clear button. It calls ctx.clearRect to wipe the canvas.
  await page.getByTestId('clear-signature').click();

  // Verify the canvas is blank again
  const isBlank = await page.evaluate(() => {
    const c = document.querySelector('[data-testid="signature-pad"]') as HTMLCanvasElement;
    return (window as any).isCanvasBlank(c);
  });
  expect(isBlank).toBe(true);

  // The signature status should revert to "Unsigned"
  await expect(page.getByTestId('signature-status')).toHaveText('Unsigned');
});

// --------------------------------------------------------------------------
// Exercise 4: Click SVG element and verify selection state
// --------------------------------------------------------------------------
test('exercise 4: click heat map cell to select it', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the Credit Q3 cell (risk score 91)
  const cell = page.getByTestId('cell-credit-q3');
  await cell.click();

  // The click handler adds the "selected" class to the clicked cell.
  await expect(cell).toHaveClass(/selected/);

  // The "selected-cell" text should update with the cell's data-label.
  await expect(page.getByTestId('selected-cell')).toHaveText('Credit Q3: 91');

  // Click a different cell and verify the selection moves
  const cell2 = page.getByTestId('cell-ops-q1');
  await cell2.click();
  await expect(cell2).toHaveClass(/selected/);
  // The first cell should no longer be selected
  await expect(cell).not.toHaveClass(/selected/);
  await expect(page.getByTestId('selected-cell')).toHaveText('Ops Q1: 12');
});

// --------------------------------------------------------------------------
// Exercise 5: Verify SVG bar chart values (read height attributes)
// --------------------------------------------------------------------------
test('exercise 5: read SVG bar chart data-value attributes', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Each bar has a data-value attribute encoding the approval count.
  // getAttribute retrieves a DOM attribute as a string.
  const janValue = await page.getByTestId('bar-jan').getAttribute('data-value');
  expect(janValue).toBe('80');

  const febValue = await page.getByTestId('bar-feb').getAttribute('data-value');
  expect(febValue).toBe('120');

  // We can also verify the height attribute, which encodes the visual bar size.
  const febHeight = await page.getByTestId('bar-feb').getAttribute('height');
  expect(febHeight).toBe('120');

  // Check the tallest bar (May, value 140, height 140)
  await expect(page.getByTestId('bar-may')).toHaveAttribute('data-value', '140');
  await expect(page.getByTestId('bar-may')).toHaveAttribute('height', '140');
});

// --------------------------------------------------------------------------
// Exercise 6: Hover over SVG element and verify tooltip
// --------------------------------------------------------------------------
test('exercise 6: hover over heat map cell shows tooltip', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // The tooltip is hidden by default (no "visible" class).
  const tooltip = page.getByTestId('heatmap-tooltip');
  await expect(tooltip).toBeHidden();

  // Hover over the Market Q2 cell. locator.hover() moves the mouse
  // to the centre of the element, firing mouseover and mousemove.
  await page.getByTestId('cell-market-q2').hover();

  // The mouseover handler adds class "visible" and sets the text.
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText('Market Q2: 53');
});

// --------------------------------------------------------------------------
// Exercise 7: Verify canvas dimensions
// --------------------------------------------------------------------------
test('exercise 7: verify canvas dimensions', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Check the signature pad dimensions via HTML attributes.
  // toHaveAttribute verifies the attribute value as a string.
  const sigPad = page.getByTestId('signature-pad');
  await expect(sigPad).toHaveAttribute('width', '400');
  await expect(sigPad).toHaveAttribute('height', '200');

  // Check the chart canvas dimensions
  const chartCanvas = page.getByTestId('chart-canvas');
  await expect(chartCanvas).toHaveAttribute('width', '400');
  await expect(chartCanvas).toHaveAttribute('height', '220');

  // We can also read the runtime properties via evaluate.
  // canvas.width and canvas.height return the drawing-surface size in pixels.
  const dims = await page.evaluate(() => {
    const c = document.querySelector('[data-testid="signature-pad"]') as HTMLCanvasElement;
    return { w: c.width, h: c.height };
  });
  expect(dims.w).toBe(400);
  expect(dims.h).toBe(200);
});

// --------------------------------------------------------------------------
// Exercise 8: Verify signature status changes after drawing
// --------------------------------------------------------------------------
test('exercise 8: capture signature updates status to Signed', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initially the status should be "Unsigned"
  const status = page.getByTestId('signature-status');
  await expect(status).toHaveText('Unsigned');
  await expect(status).toHaveClass(/status-unsigned/);

  // Draw a signature
  await drawOnCanvas(page, 'signature-pad');

  // Click "Capture Signature" — this updates the status to "Signed"
  await page.getByTestId('capture-signature').click();

  // Verify the status text and CSS class changed
  await expect(status).toHaveText('Signed');
  await expect(status).toHaveClass(/status-signed/);

  // The capture button text should also change
  await expect(page.getByTestId('capture-signature')).toHaveText('Signature Captured');
});
