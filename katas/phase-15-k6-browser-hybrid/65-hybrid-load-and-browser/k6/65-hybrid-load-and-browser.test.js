// Kata 65 — Hybrid Load and Browser
//
// Two parallel scenarios:
// 1. api_hammer: 100 RPS HTTP load against /lab/echo (simulates server stress)
// 2. browser_sample: 2 concurrent Chromium tabs loading the page,
//    measuring Web Vitals while the API is hot.
//
// Asserts both server-side AND client-side thresholds. If the API gets
// slow under load, the browser metrics will degrade — caught here.

import http from 'k6/http';
import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const HTTP_BASE = __ENV.K6_BASE_URL || 'http://localhost:3000';
const PLAYGROUND_BASE = __ENV.K6_BROWSER_URL || 'http://localhost:8080';
const PAGE = `${PLAYGROUND_BASE}/phase-13-frontend-perf/58-lighthouse-basics/playground/`;

export const options = {
  scenarios: {
    // The "load": 100 RPS of HTTP traffic creating realistic backend stress.
    api_hammer: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 30,
      maxVUs: 60,
      exec: 'apiCalls',
    },
    // The "probe": small browser sample measuring UX during the load.
    browser_sample: {
      executor: 'constant-vus',
      vus: 2,
      duration: '20s',
      options: { browser: { type: 'chromium' } },
      exec: 'browserFlow',
    },
  },
  thresholds: {
    // Server-side: API stays within SLO under load.
    'http_req_duration{kind:api}': ['p(95)<300'],
    'http_req_failed{kind:api}': ['rate<0.01'],
    // Client-side: page experience holds up while server is busy.
    // Note: k6 browser only emits these from the browser scenario,
    // even though both scenarios run in parallel.
    'browser_web_vital_lcp': ['p(95)<3000'],
    'browser_web_vital_fcp': ['p(95)<2500'],
    'browser_web_vital_cls': ['p(95)<0.15'],
  },
};

// Scenario 1: API hammer.
export function apiCalls() {
  http.get(`${HTTP_BASE}/lab/echo`, { tags: { kind: 'api' } });
}

// Scenario 2: browser sample.
export async function browserFlow() {
  const page = await browser.newPage();
  try {
    await page.goto(PAGE, { waitUntil: 'networkidle' });
    await check(page, {
      'page renders during load': async (p) => {
        const hero = p.locator('[data-testid="hero"]');
        return await hero.isVisible();
      },
    });
  } finally {
    await page.close();
  }
}
