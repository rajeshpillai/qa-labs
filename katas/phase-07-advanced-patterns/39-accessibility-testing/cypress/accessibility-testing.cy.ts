// =============================================================================
// Kata 39: Accessibility Testing — Cypress Tests
// =============================================================================
//
// These tests use cypress-axe to scan for accessibility violations.
//
// SETUP:
//   1. npm install --save-dev cypress-axe axe-core
//   2. In cypress/support/e2e.ts, add:
//      import 'cypress-axe';
//   3. In cypress/support/index.d.ts (or tsconfig), declare the types:
//      /// <reference types="cypress-axe" />
//
// USAGE PATTERN:
//   cy.injectAxe()  — loads axe-core into the page (call AFTER cy.visit)
//   cy.checkA11y()  — runs the scan and fails if violations exist
//   cy.checkA11y(selector, options) — scan specific element with options
// =============================================================================

const PLAYGROUND = '/phase-07-advanced-patterns/39-accessibility-testing/playground/';

describe('Kata 39: Accessibility Testing', () => {

  beforeEach(() => {
    // Visit the playground before each test.
    cy.visit(PLAYGROUND);

    // cy.injectAxe() loads the axe-core library into the page.
    // This MUST be called after cy.visit() and before cy.checkA11y().
    // It injects a <script> tag with the axe-core code.
    cy.injectAxe();
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Full Page a11y Scan (Expect Failures)
  // --------------------------------------------------------------------------
  // cy.checkA11y() scans the entire page and fails if violations are found.
  // Since our playground has intentional issues, we configure it to LOG
  // violations instead of failing the test.
  it('exercise 1: scan entire page and log violations', () => {
    // cy.checkA11y() with a callback lets us handle violations manually.
    //
    // Signature:
    //   cy.checkA11y(
    //     context?,    — CSS selector or element to scan (null = whole page)
    //     options?,    — axe-core configuration options
    //     callback?,   — function called with violations array
    //     skipFailures? — if true, don't fail the test on violations
    //   )
    //
    // We use skipFailures: true because the playground has intentional issues.
    // In a real test, you would NOT set skipFailures — you want it to fail.
    cy.checkA11y(
      null,   // null = scan the entire page
      {},     // no special options
      (violations) => {
        // This callback receives the violations array.
        // Each violation has: id, impact, description, help, nodes[].
        cy.log(`Found ${violations.length} a11y violations`);

        // Log each violation for learning purposes.
        violations.forEach((violation) => {
          cy.log(
            `[${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} elements)`
          );
        });

        // We EXPECT violations because the playground has issues.
        expect(violations.length).to.be.greaterThan(0);
      },
      true  // skipFailures: true — don't fail the test on violations
    );
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Check Specific Rules Only
  // --------------------------------------------------------------------------
  // Narrow the scan to a single rule to focus on one issue at a time.
  it('exercise 2: check label rules only', () => {
    // The second parameter is an axe-core options object.
    // runOnly.values specifies which rules to check.
    cy.checkA11y(
      null,   // scan the whole page
      {
        runOnly: {
          type: 'rule',
          values: ['label']  // only check the 'label' rule
        }
      },
      (violations) => {
        cy.log(`Label violations: ${violations.length}`);

        // The playground has inputs without labels.
        const labelViolation = violations.find((v) => v.id === 'label');
        if (labelViolation) {
          cy.log(`${labelViolation.nodes.length} inputs missing labels`);
        }
        expect(labelViolation).to.not.be.undefined;
      },
      true  // don't fail the test
    );
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Scan a Specific Section
  // --------------------------------------------------------------------------
  // Pass a CSS selector as the first argument to scan just that element.
  it('exercise 3: scan only the form section', () => {
    // The first parameter is a CSS selector string.
    // Only elements within this selector are scanned.
    cy.checkA11y(
      '[data-testid="kyc-form-section"]',  // scan only the form
      {},
      (violations) => {
        cy.log(`Form section violations: ${violations.length}`);
        violations.forEach((v) => {
          cy.log(`  [${v.impact}] ${v.id}: ${v.help}`);
        });
        expect(violations.length).to.be.greaterThan(0);
      },
      true
    );
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Check for Missing Image Alt Text
  // --------------------------------------------------------------------------
  it('exercise 4: check image alt text', () => {
    cy.checkA11y(
      '[data-testid="profile-section"]',  // scan the profile section
      {
        runOnly: {
          type: 'rule',
          values: ['image-alt']  // only check image alt text
        }
      },
      (violations) => {
        cy.log(`Image alt violations: ${violations.length}`);
        const imageViolation = violations.find((v) => v.id === 'image-alt');
        expect(imageViolation).to.not.be.undefined;
      },
      true
    );
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Check Color Contrast
  // --------------------------------------------------------------------------
  it('exercise 5: check color contrast', () => {
    cy.checkA11y(
      null,
      {
        runOnly: {
          type: 'rule',
          values: ['color-contrast']
        }
      },
      (violations) => {
        cy.log(`Contrast violations: ${violations.length}`);
        const contrastViolation = violations.find((v) => v.id === 'color-contrast');
        if (contrastViolation) {
          cy.log(`${contrastViolation.nodes.length} elements with poor contrast`);
        }
        // The .low-contrast text should trigger a violation.
        expect(contrastViolation).to.not.be.undefined;
      },
      true
    );
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Fix Violations and Re-Scan
  // --------------------------------------------------------------------------
  // Inject fixes into the DOM and verify the violations are resolved.
  it('exercise 6: fix label violations and verify', () => {
    // STEP 1: Confirm violations exist.
    cy.checkA11y(
      '[data-testid="kyc-form-section"]',
      { runOnly: { type: 'rule', values: ['label'] } },
      (violations) => {
        expect(violations.length).to.be.greaterThan(0);
        cy.log(`Before fix: ${violations.length} label violations`);
      },
      true
    );

    // STEP 2: Fix by adding labels.
    // cy.window().then(win => { ... }) gives access to the browser's window.
    // We use standard DOM APIs to create and insert <label> elements.
    cy.window().then((win) => {
      const doc = win.document;
      const fixes = [
        { inputId: 'full-name', labelText: 'Full Name' },
        { inputId: 'email', labelText: 'Email Address' },
        { inputId: 'phone', labelText: 'Phone Number' },
        { inputId: 'country', labelText: 'Country' },
        { inputId: 'notes', labelText: 'Additional Notes' }
      ];

      fixes.forEach((fix) => {
        const input = doc.getElementById(fix.inputId);
        if (input && !doc.querySelector(`label[for="${fix.inputId}"]`)) {
          const label = doc.createElement('label');
          label.setAttribute('for', fix.inputId);
          label.textContent = fix.labelText;
          input.parentNode?.insertBefore(label, input);
        }
      });
    });

    // STEP 3: Re-inject axe (needed after DOM changes in some cases).
    cy.injectAxe();

    // STEP 4: Re-scan and verify labels pass.
    cy.checkA11y(
      '[data-testid="kyc-form-section"]',
      { runOnly: { type: 'rule', values: ['label'] } },
      (violations) => {
        cy.log(`After fix: ${violations.length} label violations`);
        expect(violations.length).to.equal(0);
      },
      true
    );
  });
});
