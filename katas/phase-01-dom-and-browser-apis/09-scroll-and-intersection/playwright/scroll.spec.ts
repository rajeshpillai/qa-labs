import { test, expect } from '@playwright/test';

// The base path to this kata's playground.
// The web server serves the katas/ directory, so the path starts from there.
const PLAYGROUND = '/phase-01-dom-and-browser-apis/09-scroll-and-intersection/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Scroll to bottom and verify new items load
// --------------------------------------------------------------------------
test('exercise 1: scroll to bottom triggers infinite scroll', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Wait for the initial 10 items to render.
  // getByTestId finds the very first transaction item to confirm the list loaded.
  await expect(page.getByTestId('tx-item-0')).toBeVisible();

  // Confirm we start with exactly 10 items.
  // locator('[data-testid^="tx-item-"]') matches every element whose
  // data-testid starts with "tx-item-".
  await expect(page.locator('[data-testid^="tx-item-"]')).toHaveCount(10);

  // scrollIntoViewIfNeeded scrolls the minimum amount so the element
  // becomes visible in the viewport. This triggers the IntersectionObserver
  // on the sentinel, which loads 10 more items.
  await page.getByTestId('load-more-sentinel').scrollIntoViewIfNeeded();

  // Wait for the new items to appear. After one scroll-triggered load
  // we expect 20 items total (10 initial + 10 loaded).
  await expect(page.locator('[data-testid^="tx-item-"]')).toHaveCount(20, {
    timeout: 5000,  // allow extra time for the simulated fetch delay
  });
});

// --------------------------------------------------------------------------
// Exercise 2: Scroll a lazy image into view and verify src changes
// --------------------------------------------------------------------------
test('exercise 2: lazy image loads when scrolled into view', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Before scrolling, the image src should be the inline SVG placeholder.
  // toHaveAttribute checks the current value of an HTML attribute.
  const lazyImg = page.getByTestId('lazy-img-1');
  await expect(lazyImg).toHaveAttribute('src', /data:image\/svg\+xml/);

  // Scroll the image into view so the IntersectionObserver fires.
  await lazyImg.scrollIntoViewIfNeeded();

  // After the observer fires, data-loaded is set to "true" and src
  // changes to the real URL from the data-src attribute.
  await expect(lazyImg).toHaveAttribute('data-loaded', 'true', {
    timeout: 5000,
  });

  // Verify the src is now the real image URL (picsum.photos), not the
  // inline SVG placeholder.
  await expect(lazyImg).not.toHaveAttribute('src', /data:image\/svg\+xml/);
});

// --------------------------------------------------------------------------
// Exercise 3: Scroll down and verify "back to top" button appears
// --------------------------------------------------------------------------
test('exercise 3: back-to-top button appears on scroll', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // The button exists in the DOM but is hidden (display: none) initially.
  // toBeHidden asserts the element is not visible (display:none, visibility:hidden,
  // or not in viewport don't count — Playwright checks computed visibility).
  const btn = page.getByTestId('back-to-top');
  await expect(btn).toBeHidden();

  // Use page.evaluate to run JavaScript in the browser context.
  // window.scrollBy scrolls relative to the current position.
  await page.evaluate(() => window.scrollBy(0, 400));

  // After scrolling past 300px the button should become visible.
  // The CSS class "visible" is toggled by the scroll event listener.
  await expect(btn).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 4: Click "back to top" and verify scroll position
// --------------------------------------------------------------------------
test('exercise 4: clicking back-to-top scrolls to top', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Scroll down first to make the button appear
  await page.evaluate(() => window.scrollBy(0, 500));
  const btn = page.getByTestId('back-to-top');
  await expect(btn).toBeVisible();

  // Click the button. It triggers window.scrollTo({ top: 0, behavior: 'smooth' }).
  await btn.click();

  // Wait until scrollY is 0. page.waitForFunction runs a predicate in the
  // browser and resolves when it returns true.
  await page.waitForFunction(() => window.scrollY === 0, null, {
    timeout: 5000,
  });

  // Double-check with an assertion: evaluate returns the current scrollY value.
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBe(0);
});

// --------------------------------------------------------------------------
// Exercise 5: Verify fixed header changes class on scroll
// --------------------------------------------------------------------------
test('exercise 5: header gains compact class on scroll', async ({ page }) => {
  await page.goto(PLAYGROUND);

  const header = page.getByTestId('header');

  // Initially the header should NOT have the "compact" class.
  // toHaveClass with a regex lets us check for the presence of a class.
  await expect(header).not.toHaveClass(/compact/);

  // Scroll past the 100px threshold that triggers compact mode
  await page.evaluate(() => window.scrollBy(0, 150));

  // Now the scroll event listener should have added "compact" to the classList.
  await expect(header).toHaveClass(/compact/);

  // Scroll back to top and verify compact is removed
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(header).not.toHaveClass(/compact/);
});

// --------------------------------------------------------------------------
// Exercise 6: Scroll to a specific section and verify nav highlights
// --------------------------------------------------------------------------
test('exercise 6: scroll-spy highlights current section in nav', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Initially the "Overview" nav link should be active (has class "active").
  await expect(page.getByTestId('nav-overview')).toHaveClass(/active/);

  // Scroll the feed section into view. The IntersectionObserver-based
  // scroll-spy should update the active nav link.
  await page.getByTestId('section-feed').scrollIntoViewIfNeeded();

  // Wait for the observer to fire and update the nav.
  // The "Feed" nav link should now be active.
  await expect(page.getByTestId('nav-feed')).toHaveClass(/active/, {
    timeout: 3000,
  });

  // The "Overview" link should no longer be active.
  await expect(page.getByTestId('nav-overview')).not.toHaveClass(/active/);
});

// --------------------------------------------------------------------------
// Exercise 7: Verify element is / isn't in viewport
// --------------------------------------------------------------------------
test('exercise 7: check whether element is in viewport', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // page.evaluate runs arbitrary JavaScript in the browser context.
  // getBoundingClientRect returns the element's position relative to the viewport.
  // An element is "in the viewport" when its top is less than window.innerHeight
  // and its bottom is greater than 0.
  const isInViewport = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="section-overview"]');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(isInViewport).toBe(true);

  // The feed section should NOT be in the viewport initially (it is further down).
  const feedInViewport = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="section-feed"]');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(feedInViewport).toBe(false);
});

// --------------------------------------------------------------------------
// Exercise 8: Scroll and verify total loaded items count
// --------------------------------------------------------------------------
test('exercise 8: verify loaded item count after multiple scrolls', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Confirm the initial count display shows 10 items.
  // #loaded-count is a <span> inside the item-count div.
  await expect(page.locator('#loaded-count')).toHaveText('10');

  // Scroll the sentinel into view to trigger one load (10 more items).
  await page.getByTestId('load-more-sentinel').scrollIntoViewIfNeeded();
  await expect(page.locator('#loaded-count')).toHaveText('20', {
    timeout: 5000,
  });

  // Scroll the sentinel again after the new items push it down.
  // We need a small wait for the DOM to settle, then scroll again.
  await page.getByTestId('load-more-sentinel').scrollIntoViewIfNeeded();
  await expect(page.locator('#loaded-count')).toHaveText('30', {
    timeout: 5000,
  });

  // Final check: 30 transaction items should exist in the DOM.
  await expect(page.locator('[data-testid^="tx-item-"]')).toHaveCount(30);
});
