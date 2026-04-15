const PLAYGROUND = '/phase-03-navigation-and-state/18-multi-page-navigation/playground/';

describe('Kata 18: Multi-Page Navigation', () => {

  // beforeEach runs before every test in this describe block.
  // We navigate to the playground page so each test starts fresh.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Navigate to Each Page via Nav Links
  // --------------------------------------------------------------------------
  // This exercise demonstrates clicking navigation links and verifying
  // the correct page content appears using cy.get() and visibility checks.
  it('exercise 1: navigate to each page via nav links', () => {
    // Verify we start on the Home page. The home page div should be visible.
    // .should('be.visible') asserts the element is displayed in the viewport.
    cy.get('[data-testid="page-home"]').should('be.visible');

    // Click the "Apply" nav link.
    // cy.get(selector).click() finds the element and clicks it.
    cy.get('[data-testid="nav-apply"]').click();

    // Verify the Apply page is now visible and Home is hidden.
    // .should('not.be.visible') asserts the element exists but is not displayed.
    cy.get('[data-testid="page-apply"]').should('be.visible');
    cy.get('[data-testid="page-home"]').should('not.be.visible');

    // Click the "Status" nav link.
    cy.get('[data-testid="nav-status"]').click();
    cy.get('[data-testid="page-status"]').should('be.visible');
    cy.get('[data-testid="page-apply"]').should('not.be.visible');

    // Click the "Profile" nav link.
    cy.get('[data-testid="nav-profile"]').click();
    cy.get('[data-testid="page-profile"]').should('be.visible');
    cy.get('[data-testid="page-status"]').should('not.be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Verify URL Changes When Navigating
  // --------------------------------------------------------------------------
  // When we click a nav link, the URL hash updates. cy.url() returns the
  // current URL as a string for assertions.
  it('exercise 2: verify URL changes when navigating', () => {
    // Click the "Apply" link and verify the URL hash changed.
    cy.get('[data-testid="nav-apply"]').click();

    // cy.url() yields the current URL string.
    // .should('include', str) checks if the URL contains the substring.
    cy.url().should('include', '#/apply');

    // Navigate to Status and verify.
    cy.get('[data-testid="nav-status"]').click();
    cy.url().should('include', '#/status');

    // Navigate to Profile and verify.
    cy.get('[data-testid="nav-profile"]').click();
    cy.url().should('include', '#/profile');

    // Navigate back to Home and verify.
    cy.get('[data-testid="nav-home"]').click();
    cy.url().should('include', '#/home');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Active Nav State Highlighting
  // --------------------------------------------------------------------------
  // The currently active nav link gets a CSS class 'active'. We verify
  // this with .should('have.class', 'active').
  it('exercise 3: verify active nav state highlighting', () => {
    // On page load, the Home link should be active.
    // .should('have.class', className) checks if the element has the class.
    cy.get('[data-testid="nav-home"]').should('have.class', 'active');
    cy.get('[data-testid="nav-apply"]').should('not.have.class', 'active');

    // Navigate to Apply — now Apply should be active and Home should not.
    cy.get('[data-testid="nav-apply"]').click();
    cy.get('[data-testid="nav-apply"]').should('have.class', 'active');
    cy.get('[data-testid="nav-home"]').should('not.have.class', 'active');

    // Navigate to Status.
    cy.get('[data-testid="nav-status"]').click();
    cy.get('[data-testid="nav-status"]').should('have.class', 'active');
    cy.get('[data-testid="nav-apply"]').should('not.have.class', 'active');

    // Navigate to Profile.
    cy.get('[data-testid="nav-profile"]').click();
    cy.get('[data-testid="nav-profile"]').should('have.class', 'active');
    cy.get('[data-testid="nav-status"]').should('not.have.class', 'active');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Use Browser Back Button
  // --------------------------------------------------------------------------
  // cy.go('back') simulates the browser back button. cy.go('forward')
  // simulates the forward button. cy.go(-1) and cy.go(1) are numeric aliases.
  it('exercise 4: use browser back button to navigate', () => {
    // Navigate forward: Home -> Apply -> Status
    cy.get('[data-testid="nav-apply"]').click();
    cy.get('[data-testid="nav-status"]').click();

    // Verify we are on the Status page.
    cy.get('[data-testid="page-status"]').should('be.visible');

    // Go back one step. cy.go('back') simulates clicking the browser
    // back button. The hashchange event fires, triggering our router.
    cy.go('back');

    // We should now be on the Apply page.
    cy.get('[data-testid="page-apply"]').should('be.visible');
    cy.url().should('include', '#/apply');

    // Go back again — should return to Home.
    cy.go('back');
    cy.get('[data-testid="page-home"]').should('be.visible');
    cy.url().should('include', '#/home');
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify Content Switches Between Pages
  // --------------------------------------------------------------------------
  // Each page has unique content. We check specific text and elements
  // are present on each page.
  it('exercise 5: verify content switches between pages', () => {
    // Home page should show the welcome message.
    // .should('contain.text', str) checks if textContent contains the string.
    cy.get('[data-testid="page-home"]').should('contain.text', 'Welcome to KYC Portal');

    // Navigate to Apply — should show the application form.
    cy.get('[data-testid="nav-apply"]').click();
    cy.get('[data-testid="page-apply"]').should('contain.text', 'Apply for KYC Verification');
    cy.get('[data-testid="input-full-name"]').should('be.visible');

    // Navigate to Status — should show application status cards.
    cy.get('[data-testid="nav-status"]').click();
    cy.get('[data-testid="page-status"]').should('contain.text', 'Application Status');
    cy.get('[data-testid="app-status"]').should('have.text', 'Pending Review');

    // Navigate to Profile — should show profile details.
    cy.get('[data-testid="nav-profile"]').click();
    cy.get('[data-testid="page-profile"]').should('contain.text', 'Your Profile');
    cy.get('[data-testid="profile-name"]').should('have.text', 'Aisha Patel');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Deep Link Directly to a Page
  // --------------------------------------------------------------------------
  // Deep linking means visiting a URL with a specific hash directly.
  // The router should read the hash on load and display the correct page.
  it('exercise 6: deep link directly to a page', () => {
    // Visit the playground with the #/profile hash appended.
    // cy.visit(url) loads the page and waits for it to fully load.
    cy.visit(PLAYGROUND + '#/profile');

    // The Profile page should be visible immediately.
    cy.get('[data-testid="page-profile"]').should('be.visible');
    cy.get('[data-testid="page-home"]').should('not.be.visible');

    // The Profile nav link should be active.
    cy.get('[data-testid="nav-profile"]').should('have.class', 'active');

    // The route display should show #/profile.
    cy.get('[data-testid="current-route"]').should('have.text', '#/profile');

    // Deep link to the Status page.
    cy.visit(PLAYGROUND + '#/status');
    cy.get('[data-testid="page-status"]').should('be.visible');
    cy.get('[data-testid="nav-status"]').should('have.class', 'active');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Page Title/Heading Per Route
  // --------------------------------------------------------------------------
  // Each route updates both the visible heading and the document.title.
  // cy.title() returns the document.title for assertions.
  it('exercise 7: verify page title and heading per route', () => {
    // Check Home page heading and title.
    cy.get('[data-testid="page-home"] [data-testid="page-heading"]')
      .should('have.text', 'Welcome to KYC Portal');

    // cy.title() yields the current document.title string.
    cy.title().should('eq', 'Home | KYC Portal');

    // Navigate to Apply and check heading + title.
    cy.get('[data-testid="nav-apply"]').click();
    cy.get('[data-testid="page-apply"] [data-testid="page-heading"]')
      .should('have.text', 'Apply for KYC Verification');
    cy.title().should('eq', 'Apply | KYC Portal');

    // Navigate to Status.
    cy.get('[data-testid="nav-status"]').click();
    cy.get('[data-testid="page-status"] [data-testid="page-heading"]')
      .should('have.text', 'Application Status');
    cy.title().should('eq', 'Status | KYC Portal');

    // Navigate to Profile.
    cy.get('[data-testid="nav-profile"]').click();
    cy.get('[data-testid="page-profile"] [data-testid="page-heading"]')
      .should('have.text', 'Your Profile');
    cy.title().should('eq', 'Profile | KYC Portal');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Navigate via In-Page Link Click
  // --------------------------------------------------------------------------
  // The Home page has inline links to other pages. Clicking them should
  // navigate just like the nav bar.
  it('exercise 8: navigate via in-page link click', () => {
    // Click the "Start a new KYC application" link on the Home page.
    cy.get('[data-testid="home-apply-link"]').click();

    // Verify the Apply page is now visible.
    cy.get('[data-testid="page-apply"]').should('be.visible');
    cy.url().should('include', '#/apply');

    // The Apply nav link should be active.
    cy.get('[data-testid="nav-apply"]').should('have.class', 'active');

    // Go back to Home and try the Status link.
    cy.go('back');
    cy.get('[data-testid="page-home"]').should('be.visible');

    // Click the "check your application status" link.
    cy.get('[data-testid="home-status-link"]').click();
    cy.get('[data-testid="page-status"]').should('be.visible');
    cy.url().should('include', '#/status');

    // Use cy.go('forward') to test forward navigation.
    // cy.go('forward') simulates the browser forward button.
    cy.go('back');
    cy.get('[data-testid="page-home"]').should('be.visible');
    cy.go('forward');
    cy.get('[data-testid="page-status"]').should('be.visible');
  });

});
