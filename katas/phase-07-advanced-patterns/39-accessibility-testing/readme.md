# Kata 39: Accessibility Testing (a11y)

## What You Will Learn

- What accessibility (a11y) testing is and why it matters
- How to use @axe-core/playwright to scan for a11y violations in Playwright
- How to use cypress-axe to scan for a11y violations in Cypress
- How to identify common a11y issues: missing labels, poor contrast, missing ARIA
- How to fix a11y violations and verify the fixes in tests
- How to target specific WCAG rules and elements

## Prerequisites

- Completed Katas 01-38
- Basic understanding of HTML forms and semantic elements
- No prior accessibility knowledge needed — this kata teaches from scratch

## Plugin Setup

### Playwright

```bash
# Install the axe-core integration for Playwright
npm install --save-dev @axe-core/playwright
```

### Cypress

```bash
# Install cypress-axe and axe-core
npm install --save-dev cypress-axe axe-core

# In cypress/support/e2e.ts, add:
# import 'cypress-axe';

# In your test, inject axe first:
# cy.injectAxe();   ← loads axe-core into the page
# cy.checkA11y();   ← scans and fails if violations exist
```

## Concepts Explained

### What Is Accessibility (a11y)?

```
Accessibility means designing websites so that EVERYONE can use them,
including people who:
  - Are blind or low-vision (use screen readers like NVDA, JAWS, VoiceOver)
  - Have motor disabilities (navigate with keyboard only, no mouse)
  - Are deaf or hard of hearing (need captions for audio)
  - Have cognitive disabilities (need clear, simple language)

"a11y" is shorthand for "accessibility" — 'a', 11 letters, 'y'.

WCAG (Web Content Accessibility Guidelines) defines the rules.
There are three levels:
  - Level A   — minimum (all sites should meet this)
  - Level AA  — standard (most regulations require this)
  - Level AAA — ideal (aspirational, not required)
```

### Common a11y Issues (All Present in the Playground)

```
The playground in this kata has INTENTIONAL accessibility issues.
Here is what is wrong and why it matters:

1. MISSING FORM LABELS
   <input> elements without <label> elements.
   Screen readers cannot tell the user what the field is for.
   Fix: add <label for="field-id">Label Text</label>

2. MISSING ALT TEXT ON IMAGES
   <img> without alt="description".
   Screen readers say "image" but cannot describe what it shows.
   Fix: add alt="Description of the image"

3. POOR COLOR CONTRAST
   Light gray text on white background — hard to read.
   WCAG requires a contrast ratio of at least 4.5:1 for normal text.
   Fix: use darker text colors

4. MISSING ARIA ATTRIBUTES
   Interactive elements without role, aria-label, or aria-describedby.
   Screen readers cannot convey the element's purpose.
   Fix: add appropriate ARIA attributes

5. NO FOCUS INDICATORS
   Removing outline:none on interactive elements.
   Keyboard users cannot see which element is focused.
   Fix: keep default focus styles or add custom ones

6. MISSING PAGE LANDMARKS
   No <main>, <nav>, <header> landmarks.
   Screen readers cannot help users jump to page sections.
   Fix: use semantic HTML elements
```

### axe-core Rules

```
axe-core is the industry-standard accessibility scanning engine.
It checks for 90+ rules based on WCAG 2.0/2.1 A and AA.

Each violation has:
  - id        — rule identifier (e.g., 'label', 'color-contrast')
  - impact    — severity: 'minor', 'moderate', 'serious', 'critical'
  - help      — human-readable description of the issue
  - helpUrl   — link to detailed documentation
  - nodes     — array of DOM elements that violate the rule
```

## Playground

The playground (`playground/index.html`) is a KYC form with **intentional
accessibility issues**. Your exercises will:
1. Scan the page and discover violations
2. Understand what each violation means
3. Fix the violations in the HTML
4. Re-scan to verify the fixes

## Exercises

### Exercise 1: Run a Full a11y Scan
Scan the entire page and see how many violations axe-core finds.

### Exercise 2: Check Specific Rules
Run axe with specific rules enabled (e.g., only 'label' or 'color-contrast').

### Exercise 3: Scan a Specific Element
Scan just the form section instead of the full page.

### Exercise 4: Verify Missing Labels
Check that form inputs have associated labels.

### Exercise 5: Check Color Contrast
Scan for color contrast violations and understand the contrast ratio.

### Exercise 6: Fix and Re-Verify
Fix a11y issues by injecting corrected HTML and re-scan to verify.

## Key Takeaways

```
- Accessibility testing is automated checks for WCAG compliance
- axe-core is the most widely used a11y engine (used by both Playwright and Cypress)
- @axe-core/playwright provides AxeBuilder for Playwright tests
- cypress-axe provides cy.injectAxe() and cy.checkA11y() for Cypress
- Automated scans catch ~30-40% of a11y issues — manual testing still needed
- Fix the easy ones first: labels, alt text, contrast, focus indicators
- Every fix makes the web usable for more people
```
