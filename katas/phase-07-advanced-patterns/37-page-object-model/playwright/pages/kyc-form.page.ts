import { type Page, type Locator, expect } from '@playwright/test';

// =============================================================================
// KycFormPage — Page Object Model for the KYC Onboarding Form
// =============================================================================
//
// This class encapsulates all interactions with the KYC form.
// Each method maps to a user action (fill a field, click a button, etc.).
//
// RULE 1: The constructor receives the Playwright `page` fixture.
// RULE 2: Selectors are defined ONCE as private properties — never in tests.
// RULE 3: Public methods are named from the user's perspective.
// RULE 4: Methods return `this` where possible to allow chaining.
// =============================================================================

export class KycFormPage {
  // ---------------------------------------------------------------------------
  // Private locators — these are the ONLY place selectors appear.
  // If the dev team changes a data-testid, you fix it here and nowhere else.
  // ---------------------------------------------------------------------------

  /** The full-name text input field. */
  private readonly nameInput: Locator;

  /** The email text input field. */
  private readonly emailInput: Locator;

  /** The country dropdown (select element). */
  private readonly countrySelect: Locator;

  /** The document type dropdown (select element). */
  private readonly docTypeSelect: Locator;

  /** The submit button that sends the form. */
  private readonly submitButton: Locator;

  /** The status message that appears after submission. */
  private readonly submitStatus: Locator;

  /** The loading spinner that shows during submission. */
  private readonly submitLoading: Locator;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------
  // The `page` parameter is Playwright's Page object.
  // We store it and create all locators up front.
  // Locators are lazy — they don't query the DOM until you call an action.
  // ---------------------------------------------------------------------------
  constructor(private readonly page: Page) {
    this.nameInput = page.getByTestId('full-name-input');
    this.emailInput = page.getByTestId('email-input');
    this.countrySelect = page.getByTestId('country-select');
    this.docTypeSelect = page.getByTestId('doc-type-select');
    this.submitButton = page.getByTestId('submit-btn');
    this.submitStatus = page.getByTestId('submit-status');
    this.submitLoading = page.getByTestId('submit-loading');
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to the KYC form playground.
   * goto() loads the URL in the browser. Kata 37 ships its own flat
   * KYC form playground purpose-built for practicing the POM pattern.
   */
  async goto(): Promise<void> {
    await this.page.goto('/phase-07-advanced-patterns/37-page-object-model/playground/');
  }

  // ---------------------------------------------------------------------------
  // Actions — each method performs ONE user action
  // ---------------------------------------------------------------------------

  /**
   * Fill the Full Name field.
   * fill() clears any existing text first, then types the new value.
   *
   * @param name — the applicant's full name to enter
   */
  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  /**
   * Fill the Email field.
   *
   * @param email — the applicant's email address to enter
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Select a country from the dropdown.
   * selectOption() picks a value from a <select> element by its value attribute.
   *
   * @param countryCode — the country code (e.g., 'US', 'IN', 'GB', 'DE')
   */
  async selectCountry(countryCode: string): Promise<void> {
    await this.countrySelect.selectOption(countryCode);
  }

  /**
   * Select a document type from the dropdown.
   *
   * @param docType — the document type value (e.g., 'passport', 'drivers-license')
   */
  async selectDocType(docType: string): Promise<void> {
    await this.docTypeSelect.selectOption(docType);
  }

  /**
   * Click the Submit KYC button.
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Fill the entire form in one call — a convenience method.
   * This is useful when multiple tests need to fill the same form
   * with different data.
   *
   * @param data — an object with name, email, country, and docType fields
   */
  async fillForm(data: {
    name: string;
    email: string;
    country?: string;
    docType?: string;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    if (data.country) {
      await this.selectCountry(data.country);
    }
    if (data.docType) {
      await this.selectDocType(data.docType);
    }
  }

  // ---------------------------------------------------------------------------
  // Assertions — verify page state from the user's perspective
  // ---------------------------------------------------------------------------

  /**
   * Assert that the submission succeeded and shows the expected reference ID.
   *
   * @param referenceId — the expected reference ID in the success message
   */
  async expectSuccess(referenceId: string): Promise<void> {
    await expect(this.submitStatus).toContainText(referenceId);
    await expect(this.submitStatus).toHaveClass(/status-success/);
  }

  /**
   * Assert that the submission failed and shows an error message.
   *
   * @param errorText — the expected text in the error message
   */
  async expectError(errorText: string): Promise<void> {
    await expect(this.submitStatus).toContainText(errorText);
    await expect(this.submitStatus).toHaveClass(/status-error/);
  }

  /**
   * Assert that the submit button is visible and enabled.
   */
  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Assert that the submit button is disabled.
   */
  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }
}
