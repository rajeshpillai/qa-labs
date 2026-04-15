import { type Page, type Locator, expect } from '@playwright/test';

// =============================================================================
// ReviewPage — Page Object Model for the Applicant Lookup / Review Section
// =============================================================================
//
// This class encapsulates interactions with the applicant lookup section
// of the KYC playground. It handles loading applicant data and verifying
// the displayed information.
//
// In a real app, the "review" page might be a separate route. Here it is
// the top section of the Kata 26 playground that loads applicant data via
// a GET request.
// =============================================================================

export class ReviewPage {
  // ---------------------------------------------------------------------------
  // Private locators
  // ---------------------------------------------------------------------------

  /** The text input for the applicant ID. */
  private readonly applicantIdInput: Locator;

  /** The button that triggers the applicant lookup. */
  private readonly loadButton: Locator;

  /** The card that displays loaded applicant data. */
  private readonly applicantCard: Locator;

  /** Individual fields inside the applicant card. */
  private readonly applicantName: Locator;
  private readonly applicantEmail: Locator;
  private readonly applicantCountry: Locator;
  private readonly applicantRisk: Locator;

  /** The error message element for failed lookups. */
  private readonly errorMessage: Locator;

  /** The loading spinner. */
  private readonly loadingIndicator: Locator;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------
  constructor(private readonly page: Page) {
    this.applicantIdInput = page.getByTestId('applicant-id-input');
    this.loadButton = page.getByTestId('load-applicant-btn');
    this.applicantCard = page.getByTestId('applicant-card');
    this.applicantName = page.getByTestId('applicant-name');
    this.applicantEmail = page.getByTestId('applicant-email');
    this.applicantCountry = page.getByTestId('applicant-country');
    this.applicantRisk = page.getByTestId('applicant-risk');
    this.errorMessage = page.getByTestId('applicant-error');
    this.loadingIndicator = page.getByTestId('applicant-loading');
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to the KYC playground (same page as the form).
   */
  async goto(): Promise<void> {
    await this.page.goto('/phase-05-fintech-domain/26-kyc-onboarding-flow/playground/');
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Enter an applicant ID into the lookup field.
   *
   * @param id — the applicant ID to search for (e.g., 'APP-1001')
   */
  async enterApplicantId(id: string): Promise<void> {
    // clear() removes existing text; fill() replaces it with the new value.
    await this.applicantIdInput.fill(id);
  }

  /**
   * Click the "Load Applicant" button to trigger the GET request.
   */
  async loadApplicant(): Promise<void> {
    await this.loadButton.click();
  }

  /**
   * Enter an applicant ID and immediately click Load — a convenience method.
   *
   * @param id — the applicant ID to look up
   */
  async lookupApplicant(id: string): Promise<void> {
    await this.enterApplicantId(id);
    await this.loadApplicant();
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * Assert that the applicant card is visible and shows the expected data.
   *
   * @param expected — an object with the expected field values
   */
  async expectApplicantData(expected: {
    name: string;
    email: string;
    country: string;
    risk: string;
  }): Promise<void> {
    // waitFor() waits until the element appears in the DOM and is visible.
    await this.applicantCard.waitFor({ state: 'visible' });

    // toContainText() checks that the element's text includes the expected value.
    await expect(this.applicantName).toContainText(expected.name);
    await expect(this.applicantEmail).toContainText(expected.email);
    await expect(this.applicantCountry).toContainText(expected.country);
    await expect(this.applicantRisk).toContainText(expected.risk);
  }

  /**
   * Assert that an error message is visible with the expected text.
   *
   * @param errorText — the expected error message text
   */
  async expectError(errorText: string): Promise<void> {
    await expect(this.errorMessage).toContainText(errorText);
  }

  /**
   * Assert that the applicant card is NOT visible (no data loaded).
   */
  async expectNoData(): Promise<void> {
    await expect(this.applicantCard).not.toBeVisible();
  }
}
