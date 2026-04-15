const PLAYGROUND = '/phase-02-forms/16-date-pickers-and-dropdowns/playground/';

describe('Kata 16: Date Pickers and Dropdowns', () => {

  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Set a Date via the Native Date Input
  // --------------------------------------------------------------------------
  it('exercise 1: set date via native date input', () => {
    // Verify initial display.
    cy.get('[data-testid="value-native-date"]').should('have.text', 'None');

    // type() on a date input accepts an ISO date string "YYYY-MM-DD".
    // This triggers the "change" event on the input.
    cy.get('[data-testid="input-native-date"]').type('1990-05-15');

    // Verify the display updates.
    cy.get('[data-testid="value-native-date"]').should('have.text', 'May 15, 1990');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Interact with the Custom Calendar
  // --------------------------------------------------------------------------
  it('exercise 2: interact with custom calendar picker', () => {
    // Click the trigger to open the calendar popup.
    cy.get('[data-testid="calendar-trigger"]').click();

    // Verify the popup is visible.
    cy.get('[data-testid="calendar-popup"]').should('be.visible');

    // Verify initial month.
    cy.get('[data-testid="calendar-month-year"]')
      .should('contain.text', 'April')
      .and('contain.text', '2026');

    // Navigate to May.
    cy.get('[data-testid="btn-next-month"]').click();
    cy.get('[data-testid="calendar-month-year"]').should('contain.text', 'May');

    // Click day 20.
    cy.get('[data-testid="cal-day-20"]').click();

    // Verify the trigger text updated.
    cy.get('[data-testid="calendar-trigger"]')
      .should('contain.text', 'May')
      .and('contain.text', '20')
      .and('contain.text', '2026');

    cy.get('[data-testid="value-calendar-date"]').should('contain.text', 'May 20, 2026');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Select from the Searchable Country Dropdown
  // --------------------------------------------------------------------------
  it('exercise 3: select from searchable country dropdown', () => {
    cy.get('[data-testid="value-country"]').should('have.text', 'None');

    // Type "India" in the search input.
    // type() simulates keystrokes, which triggers the "input" event,
    // filtering the dropdown list.
    cy.get('[data-testid="input-country-search"]').type('India');

    // Verify the dropdown is open.
    cy.get('[data-testid="country-list"]').should('have.class', 'open');

    // Click the India option.
    cy.get('[data-testid="country-option-india"]').click();

    // Verify selected.
    cy.get('[data-testid="value-country"]').should('have.text', 'India');
    cy.get('[data-testid="input-country-search"]').should('have.value', 'India');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Cascading Dropdown Behavior
  // --------------------------------------------------------------------------
  it('exercise 4: cascading dropdown populates options', () => {
    // Verify occupation dropdown is disabled initially.
    // should('be.disabled') checks the "disabled" attribute.
    cy.get('[data-testid="select-occupation"]').should('be.disabled');

    // Select Technology industry.
    // select(value) picks the <option> with the matching value attribute.
    cy.get('[data-testid="select-industry"]').select('technology');

    // Verify occupation is now enabled.
    cy.get('[data-testid="select-occupation"]').should('be.enabled');

    // Select Software Engineer.
    cy.get('[data-testid="select-occupation"]').select('software-engineer');
    cy.get('[data-testid="value-occupation"]').should('have.text', 'Software Engineer');

    // Change industry to Healthcare.
    cy.get('[data-testid="select-industry"]').select('healthcare');

    // Occupation display should reset.
    cy.get('[data-testid="value-occupation"]').should('have.text', 'None');

    // Select a healthcare occupation.
    cy.get('[data-testid="select-occupation"]').select('doctor');
    cy.get('[data-testid="value-occupation"]').should('have.text', 'Doctor');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Validate Date Range on Native Input
  // --------------------------------------------------------------------------
  it('exercise 5: date outside valid range shows error', () => {
    // Enter a date in 2020 — outside the allowed max of 2010.
    cy.get('[data-testid="input-native-date"]').type('2020-06-15');

    // Verify the error message appears.
    cy.get('[data-testid="error-native-date"]')
      .should('be.visible')
      .and('contain.text', '1920')
      .and('contain.text', '2010');

    // Display should still show "None".
    cy.get('[data-testid="value-native-date"]').should('have.text', 'None');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Change Calendar Selection
  // --------------------------------------------------------------------------
  it('exercise 6: change calendar selection updates display', () => {
    // Select April 10.
    cy.get('[data-testid="calendar-trigger"]').click();
    cy.get('[data-testid="cal-day-10"]').click();
    cy.get('[data-testid="value-calendar-date"]').should('contain.text', 'April 10, 2026');

    // Select a different date — April 25.
    cy.get('[data-testid="calendar-trigger"]').click();
    cy.get('[data-testid="cal-day-25"]').click();

    cy.get('[data-testid="value-calendar-date"]').should('contain.text', 'April 25, 2026');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Selected Display Text
  // --------------------------------------------------------------------------
  it('exercise 7: verify display text for multiple inputs', () => {
    // Native date.
    cy.get('[data-testid="input-native-date"]').type('1985-12-25');
    cy.get('[data-testid="value-native-date"]').should('have.text', 'December 25, 1985');

    // Time.
    cy.get('[data-testid="input-time"]').type('14:30');
    cy.get('[data-testid="value-time"]').should('have.text', '14:30');

    // Country.
    cy.get('[data-testid="input-country-search"]').type('Singapore');
    cy.get('[data-testid="country-option-singapore"]').click();
    cy.get('[data-testid="value-country"]').should('have.text', 'Singapore');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Multi-Select Tags
  // --------------------------------------------------------------------------
  it('exercise 8: multi-select tags selection and removal', () => {
    // Open the dropdown and select Passport.
    cy.get('[data-testid="input-doc-search"]').click();
    cy.get('[data-testid="doc-option-passport"]').click();

    // Verify tag appeared.
    // should('be.visible') asserts the element is rendered and visible.
    cy.get('[data-testid="tag-passport"]').should('be.visible');

    // Select Driver License.
    cy.get('[data-testid="input-doc-search"]').click();
    cy.get('[data-testid="doc-option-driver-license"]').click();

    // Verify both tags.
    cy.get('[data-testid="tag-passport"]').should('be.visible');
    cy.get('[data-testid="tag-driver-license"]').should('be.visible');

    // Verify display text.
    cy.get('[data-testid="value-doc-types"]')
      .should('contain.text', 'Passport')
      .and('contain.text', 'Driver License');

    // Remove Passport tag.
    cy.get('[data-testid="remove-tag-passport"]').click();

    // Passport tag should be gone, Driver License should remain.
    cy.get('[data-testid="tag-passport"]').should('not.exist');
    cy.get('[data-testid="tag-driver-license"]').should('be.visible');

    // Display should only show Driver License.
    cy.get('[data-testid="value-doc-types"]').should('have.text', 'Driver License');
  });

});
