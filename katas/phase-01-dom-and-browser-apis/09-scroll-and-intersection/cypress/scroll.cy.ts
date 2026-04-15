// The base path to this kata's playground.
// Cypress prepends the baseUrl (http://localhost:8080) to this path.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/09-scroll-and-intersection/playground/';

describe('Kata 09: Scroll and Intersection', () => {

  // beforeEach runs before every test in this describe block.
  // We visit the playground page so each test starts fresh.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Scroll to bottom and verify new items load
  // --------------------------------------------------------------------------
  it('exercise 1: scroll to bottom triggers infinite scroll', () => {
    // Confirm we start with 10 transaction items.
    // [data-testid^="tx-item-"] is a CSS attribute selector that matches any
    // element whose data-testid starts with "tx-item-".
    cy.get('[data-testid^="tx-item-"]').should('have.length', 10);

    // scrollIntoView() scrolls the DOM so that the matched element is visible
    // in the viewport. This triggers the IntersectionObserver on the sentinel.
    cy.get('[data-testid="load-more-sentinel"]').scrollIntoView();

    // After the observer fires, 10 more items are appended (total 20).
    // .should automatically retries until the assertion passes or times out.
    cy.get('[data-testid^="tx-item-"]', { timeout: 5000 })
      .should('have.length', 20);
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Scroll a lazy image into view and verify src changes
  // --------------------------------------------------------------------------
  it('exercise 2: lazy image loads when scrolled into view', () => {
    // Before scrolling, the img src should be the inline SVG placeholder.
    // .invoke('attr', 'src') retrieves the current src attribute value.
    cy.get('[data-testid="lazy-img-1"]')
      .invoke('attr', 'src')
      .should('match', /data:image\/svg\+xml/);

    // scrollIntoView scrolls the element into the visible area, triggering
    // the IntersectionObserver that swaps the placeholder for the real image.
    cy.get('[data-testid="lazy-img-1"]').scrollIntoView();

    // After the observer fires, data-loaded is set to "true".
    cy.get('[data-testid="lazy-img-1"]', { timeout: 5000 })
      .should('have.attr', 'data-loaded', 'true');

    // The src should now be the real image URL, not the placeholder.
    cy.get('[data-testid="lazy-img-1"]')
      .invoke('attr', 'src')
      .should('not.match', /data:image\/svg\+xml/);
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Scroll down and verify "back to top" button appears
  // --------------------------------------------------------------------------
  it('exercise 3: back-to-top button appears on scroll', () => {
    // The button is initially hidden (display: none via CSS).
    // 'not.be.visible' checks computed visibility.
    cy.get('[data-testid="back-to-top"]').should('not.be.visible');

    // cy.scrollTo scrolls the window (or a scrollable container) to
    // the given x, y coordinates. Here we scroll 400px down from the top.
    cy.scrollTo(0, 400);

    // After scrolling past 300px, the JS adds class "visible" which sets
    // display: flex, making the button visible.
    cy.get('[data-testid="back-to-top"]').should('be.visible');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Click "back to top" and verify scroll position
  // --------------------------------------------------------------------------
  it('exercise 4: clicking back-to-top scrolls to top', () => {
    // Scroll down to reveal the button
    cy.scrollTo(0, 500);
    cy.get('[data-testid="back-to-top"]').should('be.visible');

    // Click the button, which calls window.scrollTo({ top: 0 })
    cy.get('[data-testid="back-to-top"]').click();

    // cy.window() yields the browser's window object.
    // We access its scrollY property to verify we scrolled to the top.
    // The smooth scroll animation takes time, so we use should() which retries.
    cy.window().its('scrollY').should('equal', 0);
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Verify fixed header changes class on scroll
  // --------------------------------------------------------------------------
  it('exercise 5: header gains compact class on scroll', () => {
    // Initially the header should not have the "compact" class.
    cy.get('[data-testid="header"]').should('not.have.class', 'compact');

    // Scroll past the 100px threshold
    cy.scrollTo(0, 150);

    // The scroll listener adds "compact" when scrollY > 100.
    cy.get('[data-testid="header"]').should('have.class', 'compact');

    // Scroll back to top and verify compact is removed
    cy.scrollTo(0, 0);
    cy.get('[data-testid="header"]').should('not.have.class', 'compact');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Scroll to a specific section and verify nav highlights
  // --------------------------------------------------------------------------
  it('exercise 6: scroll-spy highlights current section in nav', () => {
    // Initially "Overview" nav link should be active
    cy.get('[data-testid="nav-overview"]').should('have.class', 'active');

    // Scroll the feed section into view
    cy.get('[data-testid="section-feed"]').scrollIntoView();

    // The IntersectionObserver-based scroll-spy updates the active class.
    // "Feed" should now be active, and "Overview" should not.
    cy.get('[data-testid="nav-feed"]', { timeout: 3000 })
      .should('have.class', 'active');
    cy.get('[data-testid="nav-overview"]')
      .should('not.have.class', 'active');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify element is / isn't in viewport
  // --------------------------------------------------------------------------
  it('exercise 7: check whether element is in viewport', () => {
    // In Cypress we can check if an element is in the viewport by comparing
    // its bounding rect to the window dimensions.
    // .then() gives us the jQuery-wrapped element so we can call native DOM methods.
    cy.get('[data-testid="section-overview"]').then(($el) => {
      // $el[0] is the raw DOM element. getBoundingClientRect returns its
      // position relative to the viewport.
      const rect = $el[0].getBoundingClientRect();
      // If top < window.innerHeight and bottom > 0, the element is visible.
      expect(rect.top).to.be.lessThan(window.innerHeight);
      expect(rect.bottom).to.be.greaterThan(0);
    });

    // The feed section should NOT be visible initially (it is below the fold).
    cy.get('[data-testid="section-feed"]').then(($el) => {
      const rect = $el[0].getBoundingClientRect();
      // The top of the feed section should be below the viewport bottom.
      expect(rect.top).to.be.greaterThan(window.innerHeight);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Scroll and verify total loaded items count
  // --------------------------------------------------------------------------
  it('exercise 8: verify loaded item count after multiple scrolls', () => {
    // Confirm the initial count display shows 10
    cy.get('#loaded-count').should('have.text', '10');

    // Scroll sentinel into view to trigger one load
    cy.get('[data-testid="load-more-sentinel"]').scrollIntoView();
    cy.get('#loaded-count', { timeout: 5000 }).should('have.text', '20');

    // Scroll sentinel again after new items push it down
    cy.get('[data-testid="load-more-sentinel"]').scrollIntoView();
    cy.get('#loaded-count', { timeout: 5000 }).should('have.text', '30');

    // Final verification: 30 items in the DOM
    cy.get('[data-testid^="tx-item-"]').should('have.length', 30);
  });
});
