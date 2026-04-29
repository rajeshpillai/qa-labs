# Kata 64: k6 Browser Basics

## What You Will Learn

- What k6's **browser module** does and how it differs from k6's HTTP module
- When to use **k6 browser** vs **Playwright** vs **k6 HTTP** — and the trade-offs
- The Playwright-like API in k6 browser: `page.goto`, `page.locator`, `page.click`
- **Browser-specific metrics** k6 emits: `browser_web_vital_lcp`, `browser_dom_content_loaded`, etc.
- Why browser tests are fundamentally **resource-heavy** and slow your test scaling

## Prerequisites

- k6 v0.43+ (the user's `k6 v2.0.0-rc1` includes `k6/browser` built in — no separate install)
- Phases 9–14 (you're comfortable with k6 HTTP scenarios, thresholds, custom metrics)
- Phase 13 (Web Vitals) — same metrics, different tool
- The QA Labs server running, serving the kata-13 playgrounds at :8080

## Concepts Explained

### What is k6 browser?

k6's `browser` module spins up a real **Chromium** instance and gives you a **Playwright-like API** to drive it from inside a k6 scenario. So instead of HTTP requests, your VUs are real browsers that load pages, click buttons, and emit Web Vitals.

```javascript
import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: { browser: { type: 'chromium' } },
    },
  },
};

export default async function () {
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/.../playground/');
  await check(page, {
    title: async (p) => (await p.title()) === 'Expected Title',
  });
  await page.close();
}
```

This is functionally Playwright in a k6 wrapper.

### When to use k6 browser

| Tool | When | Cost |
|------|------|------|
| **k6 HTTP** | Server-side load — RPS, p95, capacity | Cheap. 1000s of VUs per machine. |
| **Playwright** | Functional + Web Vitals on a few key pages | Per-test browser, ~50-100MB each |
| **k6 browser** | Browser-driven *load* — scaling Web Vitals measurement under real conditions | Same as Playwright × VU count. Heavy. |

**The killer use case:** you want to measure *Web Vitals while the system is under load*. Playwright runs in isolation; k6 HTTP doesn't render pages. k6 browser combines: many concurrent browsers exercising the page while load on the API drives realistic conditions.

### Trade-offs vs Playwright

If you already have Playwright tests, you might think: just run them as load. Doesn't quite work because:

- **Playwright is per-process.** Each test gets a fresh browser. k6 browser is per-VU (multiple iterations share the browser).
- **Playwright assertions are "fail fast".** k6 browser is "measure and continue" — same model as HTTP load tests.
- **Playwright has the full ecosystem** (screenshots, traces, debug tools). k6 browser is a lighter subset.
- **k6's built-in metrics** (Trend, Counter, Rate, thresholds) work seamlessly with browser metrics.

Use Playwright for **deep functional + perf debugging** of a few flows. Use k6 browser for **scaling those measurements** to find issues that only appear under concurrent browser load.

### Browser scenarios in k6

Browser-aware scenarios use a special `options.browser` config:

```javascript
export const options = {
  scenarios: {
    full_browser_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 5 },   // 5 concurrent browsers
        { duration: '1m', target: 5 },
      ],
      options: { browser: { type: 'chromium' } },
    },
  },
};
```

Note: scaling is much lower than HTTP. **5–20 concurrent browsers** is a typical maximum on a workstation. 100+ requires distributing the test.

### Built-in browser metrics

k6 browser emits Web Vitals automatically — no `PerformanceObserver` boilerplate:

| Metric | What it measures |
|--------|------------------|
| `browser_web_vital_lcp` | Largest Contentful Paint |
| `browser_web_vital_fcp` | First Contentful Paint |
| `browser_web_vital_cls` | Cumulative Layout Shift |
| `browser_web_vital_inp` | Interaction to Next Paint |
| `browser_web_vital_ttfb` | Time to First Byte |
| `browser_dom_content_loaded` | DOM ready event timing |
| `browser_first_paint` | First paint (any pixel) |
| `browser_data_received` / `browser_data_sent` | Network bytes per browser |

You assert on these the same way as `http_req_duration`:

```javascript
thresholds: {
  'browser_web_vital_lcp': ['p(95)<2500'],
  'browser_web_vital_cls': ['p(95)<0.1'],
}
```

### A typical k6 browser script

```javascript
import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 2,
      iterations: 5,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    'browser_web_vital_lcp': ['p(95)<2500'],
    'browser_web_vital_cls': ['p(95)<0.1'],
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:8080/page/', { waitUntil: 'networkidle' });

    // Standard Playwright-style locators
    const heading = page.locator('h1');
    await check(page, {
      'has h1': async () => (await heading.count()) > 0,
      'title is right': async (p) => (await p.title()) === 'My Page',
    });

    // You can interact too
    await page.locator('button.cta').click();
  } finally {
    await page.close();
  }
}
```

`browser.newPage()` reuses the per-VU browser context but gives a fresh tab. Always `close()` in a `finally` block — leaked tabs accumulate quickly.

### `check()` in browser context

The browser module provides its own `check()` (different from k6's regular one) that supports async truth functions:

```javascript
import { check } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

await check(page, {
  'visible': async (p) => await p.locator('h1').isVisible(),
});
```

The standard `import { check } from 'k6'` doesn't work the same way — use the jslib version for browser scenarios.

## Exercises

1. **Run the kata's spec.** What `browser_web_vital_lcp` and `browser_web_vital_fcp` does it report on the well-built page (kata 58 playground)? Do they match what kata 58's Playwright test reports?
2. **Switch to the broken page.** Modify the URL to hit kata 59's `playground/` (the deliberately-slow page). What changes? Which metric changes the most?
3. **Compare Playwright vs k6 browser.** Run kata 58's Playwright spec and this kata's spec back-to-back. Are the LCP values the same? Should be close — both use Chromium.
4. **Scale up.** Bump VUs to 5, then 10, then 20. At what point does your machine start running out of memory? Each VU is a full Chromium tab.

## Common Mistakes

- **Forgetting `await page.close()`.** Each leaked tab keeps Chromium memory alive. With 10+ VUs you'll OOM the test in minutes.
- **Mixing the two `check`s.** k6's `import { check } from 'k6'` is synchronous; browser scenarios need the async `check` from jslib.
- **Using k6 browser for capacity tests.** It can't scale to 1000s of concurrent browsers on a workstation. Use HTTP for capacity, browser for behavior.
- **Putting browser code in a non-browser scenario.** The `options.browser` config tells k6 to allocate a Chromium for that scenario. Without it, `browser.newPage()` errors.

## Cheat Sheet

```javascript
import { browser } from 'k6/browser';
import { check } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 2,
      iterations: 5,
      options: { browser: { type: 'chromium' } },
    },
  },
  thresholds: {
    'browser_web_vital_lcp': ['p(95)<2500'],
    'browser_web_vital_fcp': ['p(95)<1800'],
    'browser_web_vital_cls': ['p(95)<0.1'],
  },
};

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto('http://...', { waitUntil: 'networkidle' });
    await check(page, { 'loaded': async (p) => /* assertion */ });
  } finally {
    await page.close();
  }
}
```

| Use case | Best tool |
|----------|-----------|
| Server capacity (RPS at p95) | k6 HTTP |
| One-off Web Vitals on a page | Playwright (kata 58) |
| Web Vitals at scale, under load | **k6 browser** |
| Functional regression in CI | Playwright |
| Broad interaction perf (many clicks) | k6 browser |
