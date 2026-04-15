import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// Kata 39: Accessibility Testing — Playwright Tests
// =============================================================================
// These tests use @axe-core/playwright to scan for accessibility violations.
//
// SETUP: npm install --save-dev @axe-core/playwright
//
// AxeBuilder is a class that configures and runs axe-core scans.
// It returns a results object with violations, passes, and incomplete checks.
// =============================================================================

const PLAYGROUND = '/phase-07-advanced-patterns/39-accessibility-testing/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Full Page a11y Scan
// --------------------------------------------------------------------------
// Run axe-core on the entire page and examine the violations.
test('exercise 1: scan entire page for a11y violations', async ({ page }) => {
  // Navigate to the playground with intentional a11y issues.
  await page.goto(PLAYGROUND);

  // AxeBuilder(page) creates a new scanner attached to the current page.
  // .analyze() runs the scan and returns a results object.
  //
  // Results object shape:
  //   results.violations — array of rules that FAILED (issues found)
  //   results.passes     — array of rules that PASSED
  //   results.incomplete — array of rules that need manual review
  //   results.inapplicable — array of rules that don't apply to this page
  const results = await new AxeBuilder({ page }).analyze();

  // Log violations for learning purposes.
  // Each violation has: id, impact, description, help, helpUrl, nodes[].
  // eslint-disable-next-line no-console
  console.log('Violations found:', results.violations.length);
  for (const violation of results.violations) {
    // eslint-disable-next-line no-console
    console.log(`  [${violation.impact}] ${violation.id}: ${violation.help}`);
  }

  // We EXPECT violations because the playground has intentional issues.
  // In a real test, you would assert: expect(results.violations).toHaveLength(0);
  // Here we assert that violations were found (proving the scan works).
  expect(results.violations.length).toBeGreaterThan(0);
});

// --------------------------------------------------------------------------
// Exercise 2: Check Specific Rules Only
// --------------------------------------------------------------------------
// You can run axe with only specific rules enabled.
// This is useful when fixing issues one at a time.
test('exercise 2: scan for label violations only', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // .withRules(['rule-id']) runs ONLY the specified rules.
  // 'label' checks that every form input has an associated <label>.
  const results = await new AxeBuilder({ page })
    .withRules(['label'])  // only check the 'label' rule
    .analyze();

  // eslint-disable-next-line no-console
  console.log('Label violations:', results.violations.length);

  // The playground has multiple inputs without labels.
  // Each violation.nodes[] array contains the specific DOM elements.
  for (const violation of results.violations) {
    // eslint-disable-next-line no-console
    console.log(`  Found ${violation.nodes.length} elements without labels`);
  }

  // We expect the 'label' rule to have violations.
  const labelViolation = results.violations.find(v => v.id === 'label');
  expect(labelViolation).toBeDefined();
});

// --------------------------------------------------------------------------
// Exercise 3: Scan a Specific Section
// --------------------------------------------------------------------------
// Instead of scanning the whole page, scan just one section.
test('exercise 3: scan only the form section', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // .include(selector) limits the scan to elements matching the CSS selector.
  // This is useful when you want to focus on one component at a time.
  const results = await new AxeBuilder({ page })
    .include('[data-testid="kyc-form-section"]')  // scan only the form
    .analyze();

  // eslint-disable-next-line no-console
  console.log('Form section violations:', results.violations.length);
  for (const violation of results.violations) {
    // eslint-disable-next-line no-console
    console.log(`  [${violation.impact}] ${violation.id}: ${violation.help}`);
  }

  // The form section should have violations (missing labels, contrast).
  expect(results.violations.length).toBeGreaterThan(0);
});

// --------------------------------------------------------------------------
// Exercise 4: Check for Missing Image Alt Text
// --------------------------------------------------------------------------
// The 'image-alt' rule checks that all <img> elements have alt attributes.
test('exercise 4: check image alt text', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const results = await new AxeBuilder({ page })
    .withRules(['image-alt'])  // only check image alt text
    .analyze();

  // eslint-disable-next-line no-console
  console.log('Image alt violations:', results.violations.length);

  // The playground has an <img> without alt — this should be a violation.
  const imageAltViolation = results.violations.find(v => v.id === 'image-alt');
  expect(imageAltViolation).toBeDefined();

  // Log which elements are missing alt text.
  if (imageAltViolation) {
    for (const node of imageAltViolation.nodes) {
      // node.html contains the HTML of the violating element.
      // eslint-disable-next-line no-console
      console.log('  Missing alt on:', node.html.substring(0, 80) + '...');
    }
  }
});

// --------------------------------------------------------------------------
// Exercise 5: Check Color Contrast
// --------------------------------------------------------------------------
// The 'color-contrast' rule checks that text meets WCAG contrast ratios.
test('exercise 5: check color contrast', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();

  // eslint-disable-next-line no-console
  console.log('Contrast violations:', results.violations.length);

  // The .low-contrast text in the playground has insufficient contrast.
  const contrastViolation = results.violations.find(v => v.id === 'color-contrast');

  if (contrastViolation) {
    for (const node of contrastViolation.nodes) {
      // node.any[0].message contains the contrast ratio details.
      // eslint-disable-next-line no-console
      console.log('  Contrast issue:', node.any?.[0]?.message || 'see details');
    }
  }

  // We expect a contrast violation from the .low-contrast text.
  expect(contrastViolation).toBeDefined();
});

// --------------------------------------------------------------------------
// Exercise 6: Fix Violations and Re-Scan
// --------------------------------------------------------------------------
// Inject fixes into the DOM and verify axe-core passes.
// This simulates the fix-verify cycle developers go through.
test('exercise 6: fix label violations and re-scan', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // STEP 1: Verify violations exist BEFORE the fix.
  const beforeResults = await new AxeBuilder({ page })
    .withRules(['label'])
    .include('[data-testid="kyc-form-section"]')
    .analyze();

  expect(beforeResults.violations.length).toBeGreaterThan(0);
  // eslint-disable-next-line no-console
  console.log('Before fix — label violations:', beforeResults.violations.length);

  // STEP 2: Fix the violations by adding labels.
  // page.evaluate() runs JavaScript in the browser context.
  // We add <label> elements before each input that is missing one.
  await page.evaluate(() => {
    // Define the fixes: each entry maps an input ID to its label text.
    const fixes: Array<{ inputId: string; labelText: string }> = [
      { inputId: 'full-name', labelText: 'Full Name' },
      { inputId: 'email', labelText: 'Email Address' },
      { inputId: 'phone', labelText: 'Phone Number' },
      { inputId: 'country', labelText: 'Country' },
      { inputId: 'notes', labelText: 'Additional Notes' }
    ];

    for (const fix of fixes) {
      const input = document.getElementById(fix.inputId);
      if (input && !document.querySelector(`label[for="${fix.inputId}"]`)) {
        // Create a <label> element.
        const label = document.createElement('label');
        // 'for' connects the label to the input by ID.
        label.setAttribute('for', fix.inputId);
        label.textContent = fix.labelText;
        label.style.display = 'block';
        label.style.fontSize = '0.85rem';
        label.style.fontWeight = '600';
        label.style.color = '#475569';
        label.style.marginBottom = '0.25rem';
        // Insert the label before the input.
        input.parentNode?.insertBefore(label, input);
      }
    }
  });

  // STEP 3: Re-scan to verify the fixes worked.
  const afterResults = await new AxeBuilder({ page })
    .withRules(['label'])
    .include('[data-testid="kyc-form-section"]')
    .analyze();

  // eslint-disable-next-line no-console
  console.log('After fix — label violations:', afterResults.violations.length);

  // After adding labels, the 'label' rule should pass.
  expect(afterResults.violations).toHaveLength(0);
});
