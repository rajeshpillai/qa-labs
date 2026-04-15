# Kata 27: Video Onboarding

## What You Will Learn

- How to test canvas-based UI elements (simulated video feed)
- How to verify timer-based state changes (countdown, call duration)
- How to test OTP (one-time password) input flows
- How to verify connection state transitions (idle, connecting, connected, disconnected)
- How to test screenshot capture from a canvas element
- How to use `page.evaluate()` to inspect canvas state
- How to coordinate multiple async events (timer + animation + user input)

## Prerequisites

- Completed Katas 1-26
- Understanding of `requestAnimationFrame` and `setInterval` concepts
- Familiarity with canvas basics (no deep knowledge needed)

## Concepts Explained

### Testing Canvas Elements

```
Canvas elements (<canvas>) render pixels, not DOM elements.
You can't query individual shapes drawn on a canvas the way
you query DOM elements. Instead, you test canvas UIs by:

1. CHECKING SURROUNDING STATE
   Verify counters, status text, and buttons that change when
   the canvas is active. For example, a frame counter that
   increments proves the canvas is being updated.

2. USING toDataURL()
   canvas.toDataURL() converts the canvas content to a base64
   image string. You can verify it's not empty, or compare it
   to a known value (snapshot testing).

3. CHECKING DIMENSIONS
   Verify the canvas has the expected width and height attributes.
```

### Testing Timers and Countdowns

```
Timer-based UIs use setInterval or setTimeout to update values
over time. Testing strategies:

1. WAIT FOR SPECIFIC VALUES
   Instead of sleeping for exact durations, wait for the DOM text
   to contain the expected value. Both Playwright and Cypress
   retry assertions automatically.

2. USE GENEROUS TIMEOUTS
   Timers can be slightly off due to browser scheduling. Use
   timeouts larger than the expected wait time.

3. VERIFY DIRECTION
   For countdowns, verify the value decreases. For duration
   timers, verify the value increases.
```

### Testing OTP Input

```
OTP inputs are typically 6 separate single-character fields.
Testing requires:

1. TYPING INTO EACH FIELD INDIVIDUALLY
   Each field accepts one character and auto-focuses the next.

2. VERIFYING THE OTP CODE
   The playground displays the OTP code, so tests can read it
   and enter it into the inputs.

Playwright:
  const otp = await page.getByTestId('otp-display').textContent();
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-${i + 1}`).fill(otp[i]);
  }

Cypress:
  cy.get('[data-testid="otp-display"]').invoke('text').then((otp) => {
    for (let i = 0; i < 6; i++) {
      cy.get(`[data-testid="otp-${i + 1}"]`).type(otp[i]);
    }
  });
```

## Playground

The playground is a video call simulation page with:

1. **Canvas Video Feed** — a `<canvas>` element that draws animated colored rectangles using `requestAnimationFrame`. Shows the OTP code and call duration overlaid on the feed.

2. **Call Controls** — "Start Call" and "End Call" buttons. Start Call transitions through Connecting (500ms delay) to Connected.

3. **Connection Status** — badge showing Idle, Connecting..., Connected, or Disconnected.

4. **Call Duration** — increments every second while the call is active (MM:SS format).

5. **Countdown Timer** — counts down from 60 seconds. Auto-ends the call when it reaches zero.

6. **Frame Count** — shows how many animation frames have been drawn.

7. **OTP Verification** — the 6-digit OTP code is shown in the video feed and displayed above the input. Enter the code in 6 individual input fields and click Verify.

8. **Screenshot Capture** — captures the current canvas frame as a PNG image and displays a preview.

9. **Onboarding Status** — tracks whether the video call, OTP verification, and screenshot have been completed. Overall status becomes "Complete" when all three are done.

## Exercises

### Exercise 1: Start Call and Verify Canvas Updates
Start the call and verify the frame count increases above 0, proving the canvas is being animated.

### Exercise 2: Verify Timer Counts
Start the call and wait for the call duration to show at least "00:02". Verify the countdown timer shows a value less than "01:00".

### Exercise 3: End Call and Verify Status
Start the call, then end it. Verify the connection status changes to "Disconnected" and the video call status shows "Completed".

### Exercise 4: Enter OTP and Verify
Start the call, read the displayed OTP code, enter it into the 6 input fields, click Verify, and confirm the success message appears.

### Exercise 5: Verify Call Duration
Start the call, wait 3 seconds, then verify the call duration shows at least "00:03".

### Exercise 6: Screenshot Capture Changes State
Start the call, click the screenshot button, and verify the screenshot preview image appears and the status updates.

### Exercise 7: Verify Connection States
Verify the initial state is "Idle". Start the call and verify it transitions through "Connecting..." to "Connected". End the call and verify "Disconnected".

### Exercise 8: Complete Full Video Onboarding Flow
Start the call, verify OTP, capture a screenshot, end the call, and verify the overall status is "Complete".

## Solutions

### Playwright Solution

See `playwright/video-onboarding.spec.ts`

### Cypress Solution

See `cypress/video-onboarding.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Asserting canvas pixel content directly | Canvas pixels are hard to assert deterministically in tests | Assert on surrounding state (frame count, status text) instead |
| Not waiting for the "Connected" state | The call has a 500ms connecting delay | Wait for connection-status to show "Connected" before interacting |
| Checking call duration too precisely | Timer ticks may not be perfectly aligned | Use `toContainText` or verify the value is at least the expected amount |
| Entering OTP before call starts | The OTP code is generated only when the call starts | Start the call first, then read and enter the OTP |
| Forgetting to end the call for "Complete" status | Overall status requires video call to be "Completed" | End the call after OTP and screenshot to reach "Complete" |

## Quick Reference

### Playwright Canvas and Timer Testing

| Action | Method | Example |
|--------|--------|---------|
| Check frame count | `toHaveText()` with regex | `await expect(el).not.toHaveText('0')` |
| Wait for timer value | `toHaveText()` with timeout | `await expect(el).toHaveText('00:02', { timeout: 5000 })` |
| Read OTP from page | `textContent()` | `const otp = await el.textContent()` |
| Fill OTP digit | `locator.fill()` | `await page.getByTestId('otp-1').fill('3')` |
| Check image visible | `toBeVisible()` | `await expect(img).toBeVisible()` |
| Check canvas dataURL | `page.evaluate()` | `await page.evaluate(() => canvas.toDataURL())` |

### Cypress Canvas and Timer Testing

| Action | Method | Example |
|--------|--------|---------|
| Check frame count | `.should('not.have.text')` | `cy.get(el).should('not.have.text', '0')` |
| Wait for timer value | `.should('have.text')` | `cy.get(el).should('have.text', '00:02')` |
| Read OTP from page | `.invoke('text')` | `cy.get(el).invoke('text').then(...)` |
| Type OTP digit | `cy.get().type()` | `cy.get('[data-testid="otp-1"]').type('3')` |
| Check image visible | `.should('be.visible')` | `cy.get('img').should('be.visible')` |
| Check attribute | `.should('have.attr')` | `cy.get('img').should('have.attr', 'src')` |
