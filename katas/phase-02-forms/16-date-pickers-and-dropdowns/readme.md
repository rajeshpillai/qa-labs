# Kata 16: Date Pickers and Dropdowns

## What You Will Learn

- How to set values on native date and time inputs
- How to interact with a custom calendar picker (open, navigate months, click days)
- How to use a searchable/filterable dropdown
- How to test cascading dropdowns (where one controls the options in another)
- How to select and deselect items in a multi-select tag component
- How to verify displayed selection text

## Prerequisites

- Completed Katas 13-15
- Understanding of form interactions, clicking, and typing

## Concepts Explained

### Setting a Native Date Input

```typescript
// PLAYWRIGHT
// fill(value) sets a date input's value. The format must be "YYYY-MM-DD".
await page.getByTestId('input-native-date').fill('1990-05-15');

// CYPRESS
// type() works for date inputs when you provide an ISO date string.
cy.get('[data-testid="input-native-date"]').type('1990-05-15');
```

### Interacting with a Custom Calendar

```typescript
// PLAYWRIGHT
// 1. Click the trigger button to open the calendar popup.
await page.getByTestId('calendar-trigger').click();
// 2. Navigate months using prev/next buttons.
await page.getByTestId('btn-next-month').click();
// 3. Click a specific day.
await page.getByTestId('cal-day-15').click();

// CYPRESS
cy.get('[data-testid="calendar-trigger"]').click();
cy.get('[data-testid="btn-next-month"]').click();
cy.get('[data-testid="cal-day-15"]').click();
```

### Searchable Dropdown

```typescript
// PLAYWRIGHT
// Type in the search input to filter options, then click the desired option.
await page.getByTestId('input-country-search').fill('India');
await page.getByTestId('country-option-india').click();

// CYPRESS
cy.get('[data-testid="input-country-search"]').type('India');
cy.get('[data-testid="country-option-india"]').click();
```

### Cascading Dropdown

```typescript
// PLAYWRIGHT
// Select an industry first, then the occupation dropdown becomes enabled
// with options specific to that industry.
await page.getByTestId('select-industry').selectOption('technology');
await page.getByTestId('select-occupation').selectOption('software-engineer');

// CYPRESS
cy.get('[data-testid="select-industry"]').select('technology');
cy.get('[data-testid="select-occupation"]').select('software-engineer');
```

### Multi-Select Tags

```typescript
// PLAYWRIGHT
// Click options to toggle selection. Selected items appear as tags.
await page.getByTestId('input-doc-search').click();
await page.getByTestId('doc-option-passport').click();
// Verify the tag appeared.
await expect(page.getByTestId('tag-passport')).toBeVisible();

// CYPRESS
cy.get('[data-testid="input-doc-search"]').click();
cy.get('[data-testid="doc-option-passport"]').click();
cy.get('[data-testid="tag-passport"]').should('be.visible');
```

## Playground

The playground is a KYC form with various date and dropdown controls:

1. **Native Date Input** — An `<input type="date">` for date of birth, with min/max range (1920-2010). Shows selected date in text.
2. **Custom Calendar Picker** — A vanilla JS calendar with month navigation (prev/next arrows), clickable days, "today" highlight, and "selected" highlight. Opens as a popup.
3. **Searchable Country Dropdown** — A text input that filters a list of 37 countries as you type. Clicking an option selects it.
4. **Cascading Industry/Occupation Dropdown** — Selecting an industry populates the occupation dropdown with relevant options. The occupation dropdown is disabled until an industry is chosen.
5. **Time Picker** — An `<input type="time">` for appointment scheduling (09:00-17:00).
6. **Multi-Select Document Types** — A searchable dropdown where clicking options toggles selection. Selected items appear as removable tags below the dropdown.

## Exercises

### Exercise 1: Set a Date via the Native Date Input
Use `fill()` or `type()` to set a date on the native date input. Verify the display text shows the formatted date.

### Exercise 2: Interact with the Custom Calendar
Open the calendar popup, navigate to a specific month, and click a day. Verify the trigger button updates with the selected date.

### Exercise 3: Select from the Searchable Country Dropdown
Type a search term to filter countries, then click an option. Verify the display shows the selected country.

### Exercise 4: Verify Cascading Dropdown Behavior
Select an industry and verify the occupation dropdown becomes enabled with the correct options. Select an occupation and verify the display.

### Exercise 5: Validate Date Range on Native Input
Enter a date outside the valid range (e.g., 2020) and verify the error message appears.

### Exercise 6: Clear the Calendar Selection
Open the calendar, select a date, then open it again and select a different date. Verify the display updates.

### Exercise 7: Verify Selected Display Text
Set values on multiple inputs and verify each display text element shows the correct human-readable text.

### Exercise 8: Multi-Select Tags
Open the document type dropdown, select multiple items, verify tags appear. Remove a tag and verify it disappears.

## Solutions

### Playwright Solution

See `playwright/date-pickers-and-dropdowns.spec.ts`

### Cypress Solution

See `cypress/date-pickers-and-dropdowns.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Using wrong date format for native input | Date inputs require "YYYY-MM-DD" format, not "MM/DD/YYYY" | Use ISO format: "1990-05-15" |
| Clicking a day without opening the calendar first | The calendar popup has display:none until opened | Click the trigger button first to open the popup |
| Not waiting for the dropdown list to appear | The list opens on focus/input, but assertions may run too fast | Verify the list has the "open" class before clicking options |
| Selecting occupation before industry | The occupation dropdown is disabled until an industry is selected | Always select the industry first |
| Forgetting to handle the search input for searchable dropdowns | The search input filters options — without typing, all options show | Type to filter, then click the visible option |

## Quick Reference

| Action | Playwright | Cypress |
|--------|-----------|---------|
| Set native date | `fill('1990-05-15')` | `type('1990-05-15')` |
| Open calendar | `getByTestId('calendar-trigger').click()` | `cy.get('[data-testid="calendar-trigger"]').click()` |
| Navigate month | `getByTestId('btn-next-month').click()` | `cy.get('[data-testid="btn-next-month"]').click()` |
| Click calendar day | `getByTestId('cal-day-15').click()` | `cy.get('[data-testid="cal-day-15"]').click()` |
| Search dropdown | `fill('India')` | `type('India')` |
| Select option | `getByTestId('country-option-india').click()` | `cy.get('[data-testid="country-option-india"]').click()` |
| Cascading select | `selectOption('technology')` | `select('technology')` |
| Verify tag | `expect(tag).toBeVisible()` | `cy.get(tag).should('be.visible')` |
| Remove tag | `getByTestId('remove-tag-x').click()` | `cy.get('[data-testid="remove-tag-x"]').click()` |
