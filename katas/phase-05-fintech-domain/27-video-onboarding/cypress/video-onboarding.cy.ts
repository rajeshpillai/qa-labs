const PLAYGROUND = '/phase-05-fintech-domain/27-video-onboarding/playground/';

// ─── Helper: startAndWaitForCall ──────────────────────────────────────
// Clicks Start Call and waits for the connection status to show "Connected".
// The call has a 500ms connecting delay before it transitions.
function startAndWaitForCall() {
  cy.get('[data-testid="btn-start-call"]').click();
  cy.get('[data-testid="connection-status"]', { timeout: 3000 })
    .should('have.text', 'Connected');
}

// ─── Helper: enterOtp ────────────────────────────────────────────────
// Reads the displayed OTP code, then types each digit into the OTP inputs.
// cy.get().invoke('text') yields the element's text content.
// .then(callback) runs after the text is retrieved.
function enterOtp() {
  cy.get('[data-testid="otp-display"]').invoke('text').then((otp) => {
    for (let i = 0; i < 6; i++) {
      cy.get(`[data-testid="otp-${i + 1}"]`).type(otp[i]);
    }
  });
}

describe('Kata 27: Video Onboarding', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Start Call and Verify Canvas Updates
  // --------------------------------------------------------------------------
  // Start the call and verify the frame count increases above 0.
  it('exercise 1: start call and verify canvas updates', () => {
    // Verify initial frame count is 0.
    cy.get('[data-testid="frame-count"]').should('have.text', '0');

    // Start the call.
    startAndWaitForCall();

    // Wait for frame count to be non-zero.
    // .should('not.have.text', '0') retries until the text changes.
    cy.get('[data-testid="frame-count"]', { timeout: 3000 })
      .should('not.have.text', '0');

    // Verify the canvas element is visible and has expected dimensions.
    cy.get('[data-testid="video-canvas"]')
      .should('be.visible')
      .and('have.attr', 'width', '400')
      .and('have.attr', 'height', '300');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify Timer Counts
  // --------------------------------------------------------------------------
  // Start the call and verify duration increases and countdown decreases.
  it('exercise 2: verify timer counts', () => {
    startAndWaitForCall();

    // Wait for call duration to reach "00:02".
    // .should('have.text', '00:02') retries until the text matches.
    cy.get('[data-testid="call-duration"]', { timeout: 5000 })
      .should('have.text', '00:02');

    // Verify the countdown timer has decreased from 01:00.
    cy.get('[data-testid="countdown-timer"]').invoke('text').then((text) => {
      const parts = text.split(':');
      const totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      expect(totalSeconds).to.be.lessThan(60);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 3: End Call and Verify Status
  // --------------------------------------------------------------------------
  // Start the call, then end it. Verify status changes.
  it('exercise 3: end call and verify status', () => {
    startAndWaitForCall();

    // End the call.
    cy.get('[data-testid="btn-end-call"]').click();

    // Verify connection status.
    cy.get('[data-testid="connection-status"]')
      .should('have.text', 'Disconnected')
      .and('have.class', 'status-disconnected');

    // Verify video call status.
    cy.get('[data-testid="status-video-call"]').should('have.text', 'Completed');

    // Verify button states.
    cy.get('[data-testid="btn-start-call"]').should('not.be.disabled');
    cy.get('[data-testid="btn-end-call"]').should('be.disabled');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Enter OTP and Verify
  // --------------------------------------------------------------------------
  // Read the OTP, enter it, click Verify, confirm success.
  it('exercise 4: enter OTP and verify', () => {
    startAndWaitForCall();

    // Verify the OTP code is 6 digits.
    cy.get('[data-testid="otp-display"]').invoke('text')
      .should('match', /^\d{6}$/);

    // Enter the OTP digits.
    enterOtp();

    // Click Verify.
    cy.get('[data-testid="btn-verify-otp"]').click();

    // Verify success message appears.
    // .should('be.visible') checks the element is displayed.
    cy.get('[data-testid="otp-success"]')
      .should('be.visible')
      .and('have.text', 'OTP verified successfully!');

    // Verify status updates.
    cy.get('[data-testid="status-otp-verified"]').should('have.text', 'Yes');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Call Duration
  // --------------------------------------------------------------------------
  // Wait 3 seconds and verify the duration shows at least "00:03".
  it('exercise 5: verify call duration', () => {
    startAndWaitForCall();

    // Wait for duration to reach "00:03".
    cy.get('[data-testid="call-duration"]', { timeout: 6000 })
      .should('have.text', '00:03');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Screenshot Capture Changes State
  // --------------------------------------------------------------------------
  // Capture a screenshot and verify preview and status update.
  it('exercise 6: screenshot capture changes state', () => {
    startAndWaitForCall();

    // Verify initial state.
    cy.get('[data-testid="screenshot-status"]').should('have.text', 'No screenshot taken');
    cy.get('[data-testid="status-screenshot"]').should('have.text', 'No');

    // Capture screenshot.
    cy.get('[data-testid="btn-screenshot"]').click();

    // Verify preview image is visible with a data URL src.
    // .should('have.attr', 'src') checks the element has the attribute.
    // .and('match', regex) further validates the attribute value.
    cy.get('[data-testid="screenshot-preview"]')
      .should('be.visible')
      .and('have.attr', 'src')
      .and('match', /^data:image\/png/);

    // Verify status updates.
    cy.get('[data-testid="screenshot-status"]').should('have.text', 'Screenshot captured');
    cy.get('[data-testid="status-screenshot"]').should('have.text', 'Yes');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Connection States
  // --------------------------------------------------------------------------
  // Walk through: Idle -> Connecting -> Connected -> Disconnected.
  it('exercise 7: verify connection states', () => {
    // Initial: Idle.
    cy.get('[data-testid="connection-status"]')
      .should('have.text', 'Idle')
      .and('have.class', 'status-idle');

    // Start Call: should show Connecting first.
    cy.get('[data-testid="btn-start-call"]').click();
    cy.get('[data-testid="connection-status"]')
      .should('have.text', 'Connecting...')
      .and('have.class', 'status-connecting');

    // Then Connected.
    cy.get('[data-testid="connection-status"]', { timeout: 3000 })
      .should('have.text', 'Connected')
      .and('have.class', 'status-connected');

    // End Call: Disconnected.
    cy.get('[data-testid="btn-end-call"]').click();
    cy.get('[data-testid="connection-status"]')
      .should('have.text', 'Disconnected')
      .and('have.class', 'status-disconnected');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Complete Full Video Onboarding Flow
  // --------------------------------------------------------------------------
  // Start call, verify OTP, screenshot, end call, verify "Complete".
  it('exercise 8: complete full video onboarding flow', () => {
    startAndWaitForCall();

    // Verify OTP.
    enterOtp();
    cy.get('[data-testid="btn-verify-otp"]').click();
    cy.get('[data-testid="otp-success"]').should('be.visible');

    // Capture screenshot.
    cy.get('[data-testid="btn-screenshot"]').click();
    cy.get('[data-testid="screenshot-preview"]').should('be.visible');

    // End the call.
    cy.get('[data-testid="btn-end-call"]').click();
    cy.get('[data-testid="connection-status"]').should('have.text', 'Disconnected');

    // Verify all statuses.
    cy.get('[data-testid="status-video-call"]').should('have.text', 'Completed');
    cy.get('[data-testid="status-otp-verified"]').should('have.text', 'Yes');
    cy.get('[data-testid="status-screenshot"]').should('have.text', 'Yes');

    // Verify overall status is "Complete".
    cy.get('[data-testid="overall-status"]').should('have.text', 'Complete');
  });
});
