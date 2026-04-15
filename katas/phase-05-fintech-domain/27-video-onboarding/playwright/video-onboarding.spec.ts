import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-05-fintech-domain/27-video-onboarding/playground/';

// ─── Helper: startAndWaitForCall ──────────────────────────────────────
// Clicks Start Call and waits for the connection status to show "Connected".
// The call has a 500ms connecting delay, so we wait for the text to change.
async function startAndWaitForCall(page: any) {
  await page.getByTestId('btn-start-call').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connected', { timeout: 3000 });
}

// ─── Helper: enterOtp ────────────────────────────────────────────────
// Reads the displayed OTP code, then fills each digit into the OTP inputs.
// locator.textContent() returns the element's text as a string.
// locator.fill(value) clears the input and sets the new value.
async function enterOtp(page: any) {
  const otp = await page.getByTestId('otp-display').textContent();
  for (let i = 0; i < 6; i++) {
    await page.getByTestId(`otp-${i + 1}`).fill(otp![i]);
  }
}

// --------------------------------------------------------------------------
// Exercise 1: Start Call and Verify Canvas Updates
// --------------------------------------------------------------------------
// Start the call and verify the frame count increases, proving animation runs.
test('exercise 1: start call and verify canvas updates', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify initial frame count is 0.
  await expect(page.getByTestId('frame-count')).toHaveText('0');

  // Start the call and wait for connection.
  await startAndWaitForCall(page);

  // Wait for the frame count to increase above 0.
  // We use a regex that matches any non-zero number.
  // not.toHaveText('0') retries until the text is no longer "0".
  await expect(page.getByTestId('frame-count')).not.toHaveText('0', { timeout: 3000 });

  // Verify the canvas element exists and has expected dimensions.
  const canvas = page.getByTestId('video-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '400');
  await expect(canvas).toHaveAttribute('height', '300');
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Timer Counts
// --------------------------------------------------------------------------
// Start the call and verify the duration timer increases and countdown decreases.
test('exercise 2: verify timer counts', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await startAndWaitForCall(page);

  // Wait for the call duration to reach at least "00:02".
  // toHaveText() retries until the text matches. We give 5 seconds.
  await expect(page.getByTestId('call-duration')).toHaveText('00:02', { timeout: 5000 });

  // Verify the countdown timer is less than 01:00.
  // We read the text content and parse it.
  const countdownText = await page.getByTestId('countdown-timer').textContent();
  // Parse "MM:SS" format: extract seconds value.
  const parts = countdownText!.split(':');
  const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  // The countdown started at 60 and has been running, so it should be less.
  expect(totalSeconds).toBeLessThan(60);
});

// --------------------------------------------------------------------------
// Exercise 3: End Call and Verify Status
// --------------------------------------------------------------------------
// Start the call, then end it. Verify status transitions.
test('exercise 3: end call and verify status', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await startAndWaitForCall(page);

  // Click "End Call".
  await page.getByTestId('btn-end-call').click();

  // Verify connection status is "Disconnected".
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected');

  // Verify the connection status badge has the disconnected CSS class.
  await expect(page.getByTestId('connection-status')).toHaveClass(/status-disconnected/);

  // Verify the video call status shows "Completed".
  await expect(page.getByTestId('status-video-call')).toHaveText('Completed');

  // Verify "Start Call" is re-enabled and "End Call" is disabled.
  await expect(page.getByTestId('btn-start-call')).toBeEnabled();
  await expect(page.getByTestId('btn-end-call')).toBeDisabled();
});

// --------------------------------------------------------------------------
// Exercise 4: Enter OTP and Verify
// --------------------------------------------------------------------------
// Read the OTP, enter it, click Verify, and confirm success.
test('exercise 4: enter OTP and verify', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await startAndWaitForCall(page);

  // Read the OTP code displayed on the page.
  const otp = await page.getByTestId('otp-display').textContent();
  // The OTP should be 6 digits.
  expect(otp).toMatch(/^\d{6}$/);

  // Enter each digit into the individual OTP input fields.
  await enterOtp(page);

  // Click the Verify button.
  await page.getByTestId('btn-verify-otp').click();

  // Verify success message appears.
  await expect(page.getByTestId('otp-success')).toBeVisible();
  await expect(page.getByTestId('otp-success')).toHaveText('OTP verified successfully!');

  // Verify the OTP verified status updates.
  await expect(page.getByTestId('status-otp-verified')).toHaveText('Yes');
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Call Duration
// --------------------------------------------------------------------------
// Start the call, wait 3 seconds, then verify duration.
test('exercise 5: verify call duration', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await startAndWaitForCall(page);

  // Wait for the call duration to reach at least "00:03".
  // toHaveText() retries until the text matches the expected value.
  await expect(page.getByTestId('call-duration')).toHaveText('00:03', { timeout: 6000 });
});

// --------------------------------------------------------------------------
// Exercise 6: Screenshot Capture Changes State
// --------------------------------------------------------------------------
// Start the call, capture a screenshot, verify preview and status.
test('exercise 6: screenshot capture changes state', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await startAndWaitForCall(page);

  // Verify initial screenshot status.
  await expect(page.getByTestId('screenshot-status')).toHaveText('No screenshot taken');
  await expect(page.getByTestId('status-screenshot')).toHaveText('No');

  // Click the screenshot button.
  await page.getByTestId('btn-screenshot').click();

  // Verify the screenshot preview image appears.
  // toBeVisible() retries until the element is visible in the DOM.
  await expect(page.getByTestId('screenshot-preview')).toBeVisible();

  // Verify the preview image has a data URL src (base64 PNG).
  // toHaveAttribute(name, value) checks the element's attribute matches.
  await expect(page.getByTestId('screenshot-preview')).toHaveAttribute('src', /^data:image\/png/);

  // Verify status text updates.
  await expect(page.getByTestId('screenshot-status')).toHaveText('Screenshot captured');
  await expect(page.getByTestId('status-screenshot')).toHaveText('Yes');
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Connection States
// --------------------------------------------------------------------------
// Walk through all connection states: Idle -> Connecting -> Connected -> Disconnected.
test('exercise 7: verify connection states', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initial state: Idle.
  await expect(page.getByTestId('connection-status')).toHaveText('Idle');
  await expect(page.getByTestId('connection-status')).toHaveClass(/status-idle/);

  // Click Start Call — should transition to "Connecting...".
  await page.getByTestId('btn-start-call').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Connecting...');
  await expect(page.getByTestId('connection-status')).toHaveClass(/status-connecting/);

  // Wait for "Connected".
  await expect(page.getByTestId('connection-status')).toHaveText('Connected', { timeout: 3000 });
  await expect(page.getByTestId('connection-status')).toHaveClass(/status-connected/);

  // End the call — should show "Disconnected".
  await page.getByTestId('btn-end-call').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected');
  await expect(page.getByTestId('connection-status')).toHaveClass(/status-disconnected/);
});

// --------------------------------------------------------------------------
// Exercise 8: Complete Full Video Onboarding Flow
// --------------------------------------------------------------------------
// Start call, verify OTP, capture screenshot, end call, verify "Complete".
test('exercise 8: complete full video onboarding flow', async ({ page }) => {
  await page.goto(PLAYGROUND);
  await startAndWaitForCall(page);

  // Verify OTP.
  await enterOtp(page);
  await page.getByTestId('btn-verify-otp').click();
  await expect(page.getByTestId('otp-success')).toBeVisible();

  // Capture screenshot.
  await page.getByTestId('btn-screenshot').click();
  await expect(page.getByTestId('screenshot-preview')).toBeVisible();

  // End the call.
  await page.getByTestId('btn-end-call').click();
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected');

  // Verify all individual statuses.
  await expect(page.getByTestId('status-video-call')).toHaveText('Completed');
  await expect(page.getByTestId('status-otp-verified')).toHaveText('Yes');
  await expect(page.getByTestId('status-screenshot')).toHaveText('Yes');

  // Verify overall status is "Complete".
  await expect(page.getByTestId('overall-status')).toHaveText('Complete');
});
