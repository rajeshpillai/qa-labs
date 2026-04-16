import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-03-navigation-and-state/18-multi-page-navigation/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Navigate to Each Page via Nav Links
// --------------------------------------------------------------------------
// This exercise demonstrates clicking navigation links and verifying
// the correct page content appears. We use getByTestId() to find the
// nav links and page containers.
test('exercise 1: navigate to each page via nav links', async ({ page }) => {
  // Navigate to the playground. page.goto(url) loads the URL and waits
  // for the 'load' event by default.
  await page.goto(PLAYGROUND);

  // Verify we start on the Home page. The home page div should have
  // the 'visible' class, meaning it is displayed.
  await expect(page.getByTestId('page-home')).toBeVisible();

  // Click the "Apply" nav link to navigate to the Apply page.
  // click() performs a single left-click on the element.
  await page.getByTestId('nav-apply').click();

  // Verify the Apply page is now visible and Home is hidden.
  await expect(page.getByTestId('page-apply')).toBeVisible();
  await expect(page.getByTestId('page-home')).toBeHidden();

  // Click the "Status" nav link.
  await page.getByTestId('nav-status').click();
  await expect(page.getByTestId('page-status')).toBeVisible();
  await expect(page.getByTestId('page-apply')).toBeHidden();

  // Click the "Profile" nav link.
  await page.getByTestId('nav-profile').click();
  await expect(page.getByTestId('page-profile')).toBeVisible();
  await expect(page.getByTestId('page-status')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 2: Verify URL Changes When Navigating
// --------------------------------------------------------------------------
// When we click a nav link, the URL hash should update to reflect the
// current page. We use page.url() to read the full URL and check its hash.
test('exercise 2: verify URL changes when navigating', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Click the "Apply" link and verify the URL hash changed.
  await page.getByTestId('nav-apply').click();

  // page.url() returns the full URL as a string. We check it ends with
  // the expected hash fragment.
  await expect(page).toHaveURL(/#\/apply/);

  // Navigate to Status and verify the URL.
  await page.getByTestId('nav-status').click();
  await expect(page).toHaveURL(/#\/status/);

  // Navigate to Profile and verify.
  await page.getByTestId('nav-profile').click();
  await expect(page).toHaveURL(/#\/profile/);

  // Navigate back to Home and verify.
  await page.getByTestId('nav-home').click();
  await expect(page).toHaveURL(/#\/home/);
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Active Nav State Highlighting
// --------------------------------------------------------------------------
// The currently active nav link gets a CSS class 'active'. We verify
// this class is present on the correct link after each navigation.
test('exercise 3: verify active nav state highlighting', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // On page load, the Home link should be active.
  // toHaveClass(regex) checks if the element's className matches the pattern.
  await expect(page.getByTestId('nav-home')).toHaveClass(/active/);
  await expect(page.getByTestId('nav-apply')).not.toHaveClass(/active/);

  // Navigate to Apply — now Apply should be active and Home should not.
  await page.getByTestId('nav-apply').click();
  await expect(page.getByTestId('nav-apply')).toHaveClass(/active/);
  await expect(page.getByTestId('nav-home')).not.toHaveClass(/active/);

  // Navigate to Status.
  await page.getByTestId('nav-status').click();
  await expect(page.getByTestId('nav-status')).toHaveClass(/active/);
  await expect(page.getByTestId('nav-apply')).not.toHaveClass(/active/);

  // Navigate to Profile.
  await page.getByTestId('nav-profile').click();
  await expect(page.getByTestId('nav-profile')).toHaveClass(/active/);
  await expect(page.getByTestId('nav-status')).not.toHaveClass(/active/);
});

// --------------------------------------------------------------------------
// Exercise 4: Use Browser Back Button
// --------------------------------------------------------------------------
// After navigating forward through pages, the browser's back button
// should return to the previous page. Playwright's goBack() simulates
// clicking the browser back button.
test('exercise 4: use browser back button to navigate', async ({ page }) => {
  // Start on the Home route explicitly so that going back through the
  // history always lands on a well-defined hash route (and not on the
  // bare URL without a hash).
  await page.goto(PLAYGROUND + '#/home');

  // Navigate forward: Home -> Apply -> Status
  await page.getByTestId('nav-apply').click();
  await page.getByTestId('nav-status').click();

  // Verify we are on the Status page.
  await expect(page.getByTestId('page-status')).toBeVisible();

  // Go back one step. goBack() simulates clicking the browser back button.
  // It returns a response or null. The hashchange event fires, triggering
  // our router to show the previous page.
  //
  // For hash-only navigation, no full page load occurs, so we pass
  // { waitUntil: 'commit' } to avoid waiting for a 'load' event that
  // will never fire.
  await page.goBack({ waitUntil: 'commit' });

  // We should now be on the Apply page (the previous page in history).
  // Playwright's expect() auto-retries until the assertion passes,
  // giving the hashchange handler time to update the DOM.
  await expect(page).toHaveURL(/#\/apply/);
  await expect(page.getByTestId('page-apply')).toBeVisible();

  // Go back again — should return to Home.
  await page.goBack({ waitUntil: 'commit' });
  await expect(page).toHaveURL(/#\/home/);
  await expect(page.getByTestId('page-home')).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 5: Verify Content Switches Between Pages
// --------------------------------------------------------------------------
// Each page has unique content. We verify the specific content for each
// page is displayed and that other pages' content is not.
test('exercise 5: verify content switches between pages', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Home page should show the welcome message.
  await expect(page.getByTestId('page-home')).toContainText('Welcome to KYC Portal');

  // Navigate to Apply — should show the application form.
  await page.getByTestId('nav-apply').click();
  await expect(page.getByTestId('page-apply')).toContainText('Apply for KYC Verification');
  await expect(page.getByTestId('input-full-name')).toBeVisible();

  // Navigate to Status — should show application status cards.
  await page.getByTestId('nav-status').click();
  await expect(page.getByTestId('page-status')).toContainText('Application Status');
  await expect(page.getByTestId('app-status')).toHaveText('Pending Review');

  // Navigate to Profile — should show profile details.
  await page.getByTestId('nav-profile').click();
  await expect(page.getByTestId('page-profile')).toContainText('Your Profile');
  await expect(page.getByTestId('profile-name')).toHaveText('Aisha Patel');
});

// --------------------------------------------------------------------------
// Exercise 6: Deep Link Directly to a Page
// --------------------------------------------------------------------------
// Deep linking means navigating directly to a specific page via its URL,
// without first loading the home page. We use page.goto() with a hash
// fragment to test this.
test('exercise 6: deep link directly to a page', async ({ page }) => {
  // Navigate directly to the Profile page by appending the hash to the URL.
  // The router reads the hash on page load and shows the matching page.
  await page.goto(PLAYGROUND + '#/profile');

  // The Profile page should be visible immediately — no need to click any link.
  await expect(page.getByTestId('page-profile')).toBeVisible();
  await expect(page.getByTestId('page-home')).toBeHidden();

  // The Profile nav link should be active.
  await expect(page.getByTestId('nav-profile')).toHaveClass(/active/);

  // The route display should show #/profile.
  await expect(page.getByTestId('current-route')).toHaveText('#/profile');

  // Deep link to the Status page.
  await page.goto(PLAYGROUND + '#/status');
  await expect(page.getByTestId('page-status')).toBeVisible();
  await expect(page.getByTestId('nav-status')).toHaveClass(/active/);
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Page Title/Heading Per Route
// --------------------------------------------------------------------------
// Each route updates both the visible heading on the page and the
// document.title in the browser tab.
test('exercise 7: verify page title and heading per route', async ({ page }) => {
  // Navigate to Home.
  await page.goto(PLAYGROUND + '#/home');

  // The visible heading on the Home page should say "Welcome to KYC Portal".
  // We scope the heading search to the visible page.
  const homeHeading = page.getByTestId('page-home').getByTestId('page-heading');
  await expect(homeHeading).toHaveText('Welcome to KYC Portal');

  // page.title() returns the document.title string. Our router updates
  // it on every navigation.
  await expect(page).toHaveTitle('Home | KYC Portal');

  // Navigate to Apply and check heading + title.
  await page.getByTestId('nav-apply').click();
  const applyHeading = page.getByTestId('page-apply').getByTestId('page-heading');
  await expect(applyHeading).toHaveText('Apply for KYC Verification');
  await expect(page).toHaveTitle('Apply | KYC Portal');

  // Navigate to Status.
  await page.getByTestId('nav-status').click();
  const statusHeading = page.getByTestId('page-status').getByTestId('page-heading');
  await expect(statusHeading).toHaveText('Application Status');
  await expect(page).toHaveTitle('Status | KYC Portal');

  // Navigate to Profile.
  await page.getByTestId('nav-profile').click();
  const profileHeading = page.getByTestId('page-profile').getByTestId('page-heading');
  await expect(profileHeading).toHaveText('Your Profile');
  await expect(page).toHaveTitle('Profile | KYC Portal');
});

// --------------------------------------------------------------------------
// Exercise 8: Navigate via In-Page Link Click
// --------------------------------------------------------------------------
// The Home page contains links to other pages (e.g., "Start a new KYC
// application"). Clicking these in-page links should navigate just like
// clicking the nav bar links.
test('exercise 8: navigate via in-page link click', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // The Home page has a link "Start a new KYC application" pointing to #/apply.
  // Click it and verify it navigates to the Apply page.
  await page.getByTestId('home-apply-link').click();

  // Verify the Apply page is now visible.
  await expect(page.getByTestId('page-apply')).toBeVisible();
  await expect(page).toHaveURL(/#\/apply/);

  // The Apply nav link should be active.
  await expect(page.getByTestId('nav-apply')).toHaveClass(/active/);

  // Go back to Home and try the Status link.
  await page.goBack();
  await expect(page.getByTestId('page-home')).toBeVisible();

  // Click the "check your application status" link.
  await page.getByTestId('home-status-link').click();
  await expect(page.getByTestId('page-status')).toBeVisible();
  await expect(page).toHaveURL(/#\/status/);

  // Use goForward() to test forward navigation.
  // goForward() simulates clicking the browser's forward button.
  await page.goBack();
  await expect(page.getByTestId('page-home')).toBeVisible();
  await page.goForward();
  await expect(page.getByTestId('page-status')).toBeVisible();
});
