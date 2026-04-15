# Selector Cheatsheet

## Playwright Locators

| Method | What it does | When to use |
|--------|-------------|-------------|
| `page.getByTestId('id')` | Finds by `data-testid` attribute | When elements have test IDs (preferred) |
| `page.getByRole('role', { name })` | Finds by ARIA role and accessible name | For buttons, links, headings, inputs |
| `page.getByLabel('text')` | Finds form control by its `<label>` | For labeled form inputs |
| `page.getByPlaceholder('text')` | Finds by `placeholder` attribute | For inputs with placeholders |
| `page.getByText('text')` | Finds by visible text content | For any element with specific text |
| `page.locator('css')` | Finds by CSS selector | Escape hatch for complex selectors |

## Cypress Selectors

| Method | What it does | When to use |
|--------|-------------|-------------|
| `cy.get('selector')` | Finds by CSS selector | Primary method for finding elements |
| `cy.contains('text')` | Finds element containing text | For text-based lookups |
| `cy.contains('sel', 'text')` | Finds selector + text | For specific element type with text |
| `.find('selector')` | Finds descendant (chained only) | For narrowing within a parent |
| `.within(() => {})` | Scopes commands to parent | For multiple assertions on one parent |

## CSS Selector Syntax

| Pattern | Meaning | Example |
|---------|---------|---------|
| `#id` | By ID | `#full-name` |
| `.class` | By class | `.btn-primary` |
| `[attr="val"]` | By attribute | `[data-testid="x"]` |
| `[attr^="val"]` | Attribute starts with | `[data-testid^="card-"]` |
| `[attr$="val"]` | Attribute ends with | `[data-testid$="-btn"]` |
| `[attr*="val"]` | Attribute contains | `[class*="status"]` |
| `tag` | By tag name | `button`, `input` |
| `parent child` | Descendant | `form input` |
| `parent > child` | Direct child | `ul > li` |
| `:first-child` | First child | `li:first-child` |
| `:nth-child(n)` | Nth child (1-based) | `tr:nth-child(2)` |

## Selector Priority (Best to Worst)

1. `data-testid` — dedicated for testing, never breaks accidentally
2. ARIA role + name — semantic, accessibility-friendly
3. Label / placeholder — tied to visible UI text
4. Text content — may change when copy is updated
5. CSS class — changes with design updates
6. XPath — breaks on any DOM restructure
