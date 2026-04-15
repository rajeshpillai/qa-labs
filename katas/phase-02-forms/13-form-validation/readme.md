# Kata 13: Form Validation

## What You Will Learn

- How to submit a form and verify inline validation error messages
- How to fill in form fields with valid and invalid data
- How to check for specific error message text below each field
- How to verify error styling (red border) on invalid inputs
- How to verify a successful submission clears all errors

## Prerequisites

- Completed Katas 01-12
- Understanding of DOM selectors, assertions, and user interaction commands

## Concepts Explained

### Filling Form Fields

```typescript
// PLAYWRIGHT
// fill(value) clears the field and types the new value.
// It waits for the element to be editable before typing.
await page.getByTestId('input-email').fill('aisha@example.com');

// CYPRESS
// clear() removes existing text, then type() types new text.
// type() simulates real key presses one character at a time.
cy.get('[data-testid="input-email"]').clear().type('aisha@example.com');
```

### Submitting a Form

```typescript
// PLAYWRIGHT
// click() on the submit button triggers the form's submit event.
await page.getByTestId('btn-submit').click();

// CYPRESS
cy.get('[data-testid="btn-submit"]').click();
```

### Verifying Inline Error Messages

```typescript
// PLAYWRIGHT
// toBeVisible() checks the element is rendered and not hidden.
// The playground uses display:none by default and adds a 'visible'
// class to show the error message.
await expect(page.getByTestId('error-email')).toBeVisible();
await expect(page.getByTestId('error-email')).toHaveText('Please enter a valid email address.');

// CYPRESS
cy.get('[data-testid="error-email"]').should('be.visible');
cy.get('[data-testid="error-email"]').should('have.text', 'Please enter a valid email address.');
```

### Verifying Error Styling (CSS Class)

```typescript
// PLAYWRIGHT
// toHaveClass(regex) checks the element's className matches.
await expect(page.getByTestId('input-email')).toHaveClass(/input-error/);

// CYPRESS
cy.get('[data-testid="input-email"]').should('have.class', 'input-error');
```

### Selecting a Dropdown Option

```typescript
// PLAYWRIGHT
// selectOption(value) selects the <option> with the matching value attribute.
await page.getByTestId('input-nationality').selectOption('US');

// CYPRESS
// select(value) selects the <option> with the matching value.
cy.get('[data-testid="input-nationality"]').select('US');
```

## Playground

The playground is a "KYC Personal Details" form with client-side validation. It contains:

1. **Full Name** — required text input, 3-50 characters.
2. **Email Address** — required, validated against an email regex pattern.
3. **Phone Number** — required, must be 10-15 digits (may start with +, dashes/spaces allowed).
4. **Date of Birth** — required date input.
5. **Nationality** — required dropdown with country options.
6. **Government ID Number** — required text input, 5-20 characters.
7. **Submit Button** — triggers client-side validation.
8. **Status Banner** — shows green "success" or red "error" message after submission.
9. **Inline Errors** — each field has a hidden error message that appears when validation fails, with a red border on the input.

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Full Name | Required, 3-50 chars | "Full name is required (3-50 characters)." |
| Email | Required, email regex | "Please enter a valid email address." |
| Phone | Required, 10-15 digits | "Phone must be 10-15 digits (may start with +)." |
| Date of Birth | Required | "Date of birth is required." |
| Nationality | Required (non-empty) | "Please select your nationality." |
| ID Number | Required, 5-20 chars | "ID number must be 5-20 characters." |

## Exercises

### Exercise 1: Submit Empty Form and Verify All Errors Appear
Click the submit button without filling any fields. Verify that all six error messages are visible.

### Exercise 2: Fill Valid Data and Verify Success Message
Fill every field with valid data and submit. Verify the success banner appears with the correct text.

### Exercise 3: Enter Invalid Email and Verify Error
Fill all fields with valid data except email (use "notanemail"). Submit and verify only the email error appears.

### Exercise 4: Enter Invalid Phone and Verify Error
Fill all fields with valid data except phone (use "123"). Submit and verify only the phone error appears.

### Exercise 5: Enter Name Below Minimum Length
Fill all fields with valid data except name (use "AB" which is only 2 characters). Submit and verify the name error appears.

### Exercise 6: Verify Exact Error Message Text
Submit the empty form and verify each error message contains the exact expected text from the validation rules table above.

### Exercise 7: Verify Error Styling (Red Border)
Submit the empty form and verify that every required input has the "input-error" CSS class, indicating a red border.

### Exercise 8: Successful Submission Clears Errors
First submit the empty form to trigger errors. Then fill all fields with valid data and submit again. Verify all errors are gone and the success banner is shown.

## Solutions

### Playwright Solution

See `playwright/form-validation.spec.ts`

### Cypress Solution

See `cypress/form-validation.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using type() without clear() first | If the field already has text, type() appends to it | Always clear() before type() in Cypress; Playwright's fill() auto-clears |
| Checking error visibility before submitting | Errors are hidden until the form is submitted | Click the submit button first, then check for errors |
| Forgetting novalidate on the form | Browser's built-in validation popups interfere with custom messages | The playground uses novalidate so only JS validation runs |
| Not checking both error text and visibility | An element can exist but be hidden (display:none) | Use toBeVisible() / should('be.visible') alongside text checks |
| Selecting dropdown by display text instead of value | selectOption() and select() expect the value attribute by default | Use the value attribute (e.g. 'US'), not the display text ('United States') |

## Quick Reference

### Playwright Form Interaction

| Action | Method | Example |
|--------|--------|---------|
| Fill text input | `locator.fill(value)` | `await input.fill('Aisha Patel')` |
| Select dropdown | `locator.selectOption(value)` | `await dropdown.selectOption('US')` |
| Click submit | `locator.click()` | `await btn.click()` |
| Check visible | `expect(loc).toBeVisible()` | `await expect(error).toBeVisible()` |
| Check hidden | `expect(loc).toBeHidden()` | `await expect(error).toBeHidden()` |
| Check text | `expect(loc).toHaveText(str)` | `await expect(error).toHaveText('...')` |
| Check class | `expect(loc).toHaveClass(regex)` | `await expect(input).toHaveClass(/input-error/)` |

### Cypress Form Interaction

| Action | Method | Example |
|--------|--------|---------|
| Fill text input | `.clear().type(value)` | `cy.get(sel).clear().type('Aisha Patel')` |
| Select dropdown | `.select(value)` | `cy.get(sel).select('US')` |
| Click submit | `.click()` | `cy.get(sel).click()` |
| Check visible | `.should('be.visible')` | `cy.get(sel).should('be.visible')` |
| Check hidden | `.should('not.be.visible')` | `cy.get(sel).should('not.be.visible')` |
| Check text | `.should('have.text', str)` | `cy.get(sel).should('have.text', '...')` |
| Check class | `.should('have.class', name)` | `cy.get(sel).should('have.class', 'input-error')` |
