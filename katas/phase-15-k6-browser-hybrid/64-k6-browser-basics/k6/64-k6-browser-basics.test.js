// Kata 64 — k6 Browser Basics
//
// Loads the kata-58 playground (a deliberately well-built page) in a
// real Chromium under k6's browser module, asserts on Web Vitals
// emitted automatically by the module.
//
// Requires k6 v0.43+ — k6 v2.x has the browser module built in.

import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const BASE_URL = __ENV.K6_BROWSER_URL || 'http://localhost:8080';
const PAGE = `${BASE_URL}/phase-13-frontend-perf/58-lighthouse-basics/playground/`;

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 3,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    // k6 browser emits these automatically — no PerformanceObserver
    // glue needed (compare with kata 58's Playwright solution).
    'browser_web_vital_lcp': ['p(95)<2500'],
    'browser_web_vital_fcp': ['p(95)<1800'],
    'browser_web_vital_cls': ['p(95)<0.1'],
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(PAGE, { waitUntil: 'networkidle' });

    // Page is up — sanity check the basics rendered.
    await check(page, {
      'page title is set': async (p) => {
        const title = await p.title();
        return title.length > 0;
      },
      'hero element is visible': async (p) => {
        const hero = p.locator('[data-testid="hero"]');
        return await hero.isVisible();
      },
      'four content cards rendered': async (p) => {
        const cards = p.locator('.card');
        return (await cards.count()) === 4;
      },
    });
  } finally {
    // Critical — leaked tabs drain memory fast.
    await page.close();
  }
}
