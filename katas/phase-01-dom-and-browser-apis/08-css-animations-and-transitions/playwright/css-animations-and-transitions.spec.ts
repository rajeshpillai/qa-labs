import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/08-css-animations-and-transitions/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Click Card to Trigger Flip, Verify Back Content Visible
// --------------------------------------------------------------------------
// This exercise demonstrates testing a CSS 3D flip animation. The card
// rotates 180 degrees on the Y axis when clicked, revealing the back face.
test('exercise 1: click card to flip and verify back content', async ({ page }) => {
  // Navigate to the playground page.
  await page.goto(PLAYGROUND);

  // Verify the card starts in the "front" state (not flipped).
  await expect(page.getByTestId('flip-state')).toHaveText('front');

  // Verify the flip card does NOT have the 'flipped' class initially.
  // toHaveClass(regex) checks if the element's className attribute matches
  // the regular expression. The 'not' modifier negates the assertion.
  await expect(page.getByTestId('flip-card')).not.toHaveClass(/flipped/);

  // Click the card container to trigger the flip animation.
  // The click handler toggles the 'flipped' class on the .flip-card element,
  // which triggers a CSS transition: transform 0.6s ease (rotateY 180deg).
  await page.getByTestId('flip-container').click();

  // Verify the card now has the 'flipped' class.
  // toHaveClass(regex) auto-retries until the class is present or timeout.
  await expect(page.getByTestId('flip-card')).toHaveClass(/flipped/);

  // Verify the state text updated to "back".
  await expect(page.getByTestId('flip-state')).toHaveText('back');

  // Verify the back face content is accessible. Even though the front face
  // is now hidden (via backface-visibility: hidden), the back face content
  // is in the DOM and we can read its text.
  await expect(page.getByTestId('flip-back')).toContainText('Risk Level: High');
  await expect(page.getByTestId('flip-back')).toContainText('United Kingdom');
});

// --------------------------------------------------------------------------
// Exercise 2: Open Sidebar, Verify It Slides In (Check CSS Transform)
// --------------------------------------------------------------------------
// This exercise demonstrates checking CSS transform values to verify that
// a slide-in sidebar has fully transitioned into view.
test('exercise 2: open sidebar and verify slide-in transform', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the sidebar starts in the closed state.
  await expect(page.getByTestId('sidebar-state')).toHaveText('closed');

  // Verify the sidebar panel does NOT have the 'open' class.
  await expect(page.getByTestId('sidebar-panel')).not.toHaveClass(/open/);

  // Click "Toggle Filters" to slide in the sidebar.
  await page.getByTestId('btn-toggle-sidebar').click();

  // Verify the sidebar now has the 'open' class.
  await expect(page.getByTestId('sidebar-panel')).toHaveClass(/open/);

  // Verify the sidebar state updated to "open".
  await expect(page.getByTestId('sidebar-state')).toHaveText('open');

  // Verify the CSS transform changed. When the sidebar is open, its
  // transform is translateX(0), which the browser computes as a matrix.
  // toHaveCSS(property, value) checks the computed style of the element.
  // It auto-retries, so it waits for the 0.4s transition to complete.
  //
  // translateX(0) computes to the identity matrix: matrix(1, 0, 0, 1, 0, 0)
  // We use 'none' or the matrix — browsers may return either for translateX(0).
  await expect(page.getByTestId('sidebar-panel')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, 0)'
  );
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Spinner is Animating (Check animation-name CSS Property)
// --------------------------------------------------------------------------
// This exercise demonstrates reading the CSS animation-name property to
// verify that a CSS @keyframes animation is actively running.
test('exercise 3: verify spinner animation is active', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the spinner is initially hidden (display: none via absence of 'active' class).
  await expect(page.getByTestId('spinner')).not.toBeVisible();

  // Click "Start Loading" to activate the spinner.
  await page.getByTestId('btn-toggle-spinner').click();

  // Verify the spinner is now visible.
  // The 'active' class sets display: block, making the spinner visible.
  await expect(page.getByTestId('spinner')).toBeVisible();

  // Verify the spinner has the 'active' class.
  await expect(page.getByTestId('spinner')).toHaveClass(/active/);

  // Verify the CSS animation-name is 'spin'. This confirms that the
  // @keyframes animation defined in CSS is actively running on this element.
  // locator.evaluate(fn) runs a function in the browser context and returns
  // the result. We use getComputedStyle() to read the animation-name property.
  const animationName = await page.getByTestId('spinner').evaluate(
    (el) => window.getComputedStyle(el).animationName
  );

  // The animation-name should be 'spin' (defined in the CSS @keyframes rule).
  expect(animationName).toBe('spin');

  // Verify the status text updated.
  await expect(page.getByTestId('spinner-status')).toHaveText('Loading...');
});

// --------------------------------------------------------------------------
// Exercise 4: Trigger Fade-in, Verify Opacity Changes
// --------------------------------------------------------------------------
// This exercise demonstrates verifying CSS opacity transitions. The alert
// notification fades in (opacity 0 -> 1) and out (opacity 1 -> 0).
test('exercise 4: fade in and fade out, verify opacity', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the element starts with opacity 0 (hidden via CSS).
  // toHaveCSS(property, value) checks the computed style.
  await expect(page.getByTestId('fade-element')).toHaveCSS('opacity', '0');

  // Click "Show Alert" to trigger the fade-in.
  // This adds the 'visible' class, which sets opacity: 1 with a 0.5s transition.
  await page.getByTestId('btn-fade-in').click();

  // Verify the opacity transitions to 1. toHaveCSS() auto-retries, so it
  // will wait for the 0.5s transition to complete before passing.
  await expect(page.getByTestId('fade-element')).toHaveCSS('opacity', '1');

  // Verify the opacity display text updated.
  await expect(page.getByTestId('fade-opacity')).toHaveText('1');

  // Click "Hide Alert" to trigger the fade-out.
  // This removes the 'visible' class, transitioning opacity back to 0.
  await page.getByTestId('btn-fade-out').click();

  // Verify the opacity returns to 0.
  await expect(page.getByTestId('fade-element')).toHaveCSS('opacity', '0');
  await expect(page.getByTestId('fade-opacity')).toHaveText('0');
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Progress Bar Width Transition
// --------------------------------------------------------------------------
// This exercise demonstrates checking an element's width after a CSS
// transition. The progress bar fills to a percentage with a 0.8s transition.
test('exercise 5: verify progress bar width transitions', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the progress starts at 0%.
  await expect(page.getByTestId('progress-value')).toHaveText('0%');

  // Click the 50% button to set progress to 50%.
  await page.getByTestId('btn-progress-50').click();

  // Verify the progress value text updated immediately.
  await expect(page.getByTestId('progress-value')).toHaveText('50%');

  // Wait for the width transition to complete, then verify the inline style.
  // We check the inline style.width because the playground sets it directly.
  // evaluate() runs in the browser and returns the element's style.width value.
  await page.waitForTimeout(900); // wait for 0.8s transition + buffer
  const width50 = await page.getByTestId('progress-fill').evaluate(
    (el) => el.style.width
  );
  expect(width50).toBe('50%');

  // Click the 100% button to fill the bar completely.
  await page.getByTestId('btn-progress-100').click();
  await expect(page.getByTestId('progress-value')).toHaveText('100%');

  // Wait and verify the final width.
  await page.waitForTimeout(900);
  const width100 = await page.getByTestId('progress-fill').evaluate(
    (el) => el.style.width
  );
  expect(width100).toBe('100%');
});

// --------------------------------------------------------------------------
// Exercise 6: Open/Close Accordion, Verify Height
// --------------------------------------------------------------------------
// This exercise demonstrates testing accordion components that use CSS
// max-height transitions for smooth expand/collapse animations.
test('exercise 6: open and close accordion, verify height transition', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the first accordion body starts closed (no 'open' class).
  await expect(page.getByTestId('accordion-body-1')).not.toHaveClass(/open/);

  // Verify the accordion body has max-height: 0px when closed.
  // toHaveCSS() reads the computed style. max-height: 0 computes to "0px".
  await expect(page.getByTestId('accordion-body-1')).toHaveCSS('max-height', '0px');

  // Click the first accordion header to open it.
  await page.getByTestId('accordion-header-1').click();

  // Verify the body now has the 'open' class.
  await expect(page.getByTestId('accordion-body-1')).toHaveClass(/open/);

  // Verify the arrow rotated (it gets the 'open' class for the rotation).
  await expect(page.getByTestId('accordion-arrow-1')).toHaveClass(/open/);

  // Verify the max-height is now greater than 0 (the 'open' class sets
  // max-height: 200px). We read the computed value and check it's not "0px".
  const maxHeight = await page.getByTestId('accordion-body-1').evaluate(
    (el) => window.getComputedStyle(el).maxHeight
  );
  expect(maxHeight).not.toBe('0px');

  // Click the header again to close the accordion.
  await page.getByTestId('accordion-header-1').click();

  // Verify the body no longer has the 'open' class.
  await expect(page.getByTestId('accordion-body-1')).not.toHaveClass(/open/);

  // Verify max-height returns to 0px after the transition.
  await expect(page.getByTestId('accordion-body-1')).toHaveCSS('max-height', '0px');
});

// --------------------------------------------------------------------------
// Exercise 7: Trigger Processing Overlay, Wait for It to Disappear
// --------------------------------------------------------------------------
// This exercise demonstrates waiting for a timed animation sequence:
// the overlay fades in, stays visible for 2 seconds, then fades out.
test('exercise 7: processing overlay appears and auto-disappears', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the overlay starts in the idle state.
  await expect(page.getByTestId('processing-state')).toHaveText('idle');

  // Verify the overlay is not visible (opacity: 0, pointer-events: none).
  await expect(page.getByTestId('processing-overlay')).toHaveCSS('opacity', '0');

  // Click "Process Application" to trigger the overlay.
  await page.getByTestId('btn-process').click();

  // Verify the overlay becomes visible (opacity transitions to 1).
  // toHaveCSS() auto-retries, waiting for the 0.3s fade-in to complete.
  await expect(page.getByTestId('processing-overlay')).toHaveCSS('opacity', '1');

  // Verify the processing state changed to "processing".
  await expect(page.getByTestId('processing-state')).toHaveText('processing');

  // Verify the processing box content is visible.
  await expect(page.getByTestId('processing-box')).toContainText('Please wait');

  // Wait for the overlay to automatically disappear. The playground removes
  // the 'active' class after 2 seconds, which triggers a 0.3s fade-out.
  // We increase the assertion timeout to account for the 2s + 0.3s delay.
  await expect(page.getByTestId('processing-overlay')).toHaveCSS('opacity', '0', {
    timeout: 5000, // wait up to 5 seconds for the full cycle
  });

  // Verify the state changed to "complete".
  await expect(page.getByTestId('processing-state')).toHaveText('complete');
});

// --------------------------------------------------------------------------
// Exercise 8: Verify Computed Styles During Transitions
// --------------------------------------------------------------------------
// This exercise demonstrates reading CSS computed styles at different points
// to observe transition behavior. We check the progress bar style before
// and after the transition completes.
test('exercise 8: verify computed styles before and after transition', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the 75% button to start the progress bar transition.
  await page.getByTestId('btn-progress-75').click();

  // Immediately read the inline style (set instantly by JavaScript).
  // The inline style.width is set to "75%" right away, but the computed
  // (rendered) width transitions over 0.8s.
  const inlineWidth = await page.getByTestId('progress-fill').evaluate(
    (el) => el.style.width
  );
  // The inline style should be "75%" immediately.
  expect(inlineWidth).toBe('75%');

  // Read the computed width immediately — it may still be mid-transition.
  // getComputedStyle().width returns the actual rendered pixel width.
  const computedWidthDuring = await page.getByTestId('progress-fill').evaluate(
    (el) => parseFloat(window.getComputedStyle(el).width)
  );
  // During the transition, the computed width is being animated from 0
  // toward the final value. We just verify it's a number.
  expect(typeof computedWidthDuring).toBe('number');

  // Wait for the 0.8s transition to finish.
  await page.waitForTimeout(1000);

  // Read the computed width after the transition completes.
  const computedWidthAfter = await page.getByTestId('progress-fill').evaluate(
    (el) => parseFloat(window.getComputedStyle(el).width)
  );

  // After the transition, the computed width should be greater than
  // the mid-transition value (or equal if we were slow reading the first).
  expect(computedWidthAfter).toBeGreaterThanOrEqual(computedWidthDuring);

  // Also verify the progress bar's parent (track) width to calculate
  // expected percentage.
  const trackWidth = await page.getByTestId('progress-track').evaluate(
    (el) => parseFloat(window.getComputedStyle(el).width)
  );
  const expectedWidth = trackWidth * 0.75;

  // The final computed width should be approximately 75% of the track width.
  // We allow 2px tolerance for rounding.
  expect(computedWidthAfter).toBeGreaterThan(expectedWidth - 2);
  expect(computedWidthAfter).toBeLessThan(expectedWidth + 2);
});
