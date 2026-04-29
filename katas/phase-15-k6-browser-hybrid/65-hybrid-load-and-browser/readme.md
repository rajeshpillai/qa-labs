# Kata 65: Hybrid Load and Browser

## What You Will Learn

- How to **combine HTTP load and browser load** in a single k6 test
- The "**95% backend hammer + 5% UI sample**" pattern — RUM-style assertions under realistic load
- Per-scenario VU pools so the heavy browser load doesn't choke the cheap HTTP load
- Asserting **browser-side Web Vitals** while the server is at 80% capacity
- Why this finds bugs that pure HTTP or pure browser tests don't

## Prerequisites

- Completed [Kata 64 (k6 browser basics)](../64-k6-browser-basics/)
- k6 v0.43+
- The QA Labs server running

## Concepts Explained

### The combined-test scenario

The most realistic perf test is one where:

- **The server is under production-typical load** (HTTP scenarios at 100–1000 RPS)
- **A small population of real browsers** is sampling the page during that load
- **Web Vitals are asserted on the browser sample** — not on a quiet system

Without the load: your browser test is overly optimistic. Without the browser: your HTTP test misses CLS, LCP, JavaScript-induced jank.

### Pattern: parallel scenarios in one test

k6 lets you mix scenarios in one `options.scenarios` block. They run **in parallel** unless you stagger them with `startTime`.

```javascript
export const options = {
  scenarios: {
    // The big HTTP load — provides realistic backend stress.
    api_hammer: {
      executor: 'constant-arrival-rate',
      rate: 200, timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 50, maxVUs: 100,
      exec: 'apiCalls',
    },

    // The small browser sample — measures UX during the storm.
    browser_sample: {
      executor: 'constant-vus',
      vus: 2,
      duration: '60s',
      options: { browser: { type: 'chromium' } },
      exec: 'browserFlow',
    },
  },
  thresholds: {
    // Server-side: capacity is fine
    'http_req_duration{kind:api}': ['p(95)<300'],
    // Client-side: page is still snappy under load
    'browser_web_vital_lcp': ['p(95)<2500'],
    'browser_web_vital_cls': ['p(95)<0.1'],
  },
};
```

### What this finds

A purely-HTTP test won't notice:
- **JavaScript work piling up under load** — your server returns 200ms, but the browser then runs heavy JS that's slow because of a backend response field
- **API response shape regressions** that only manifest when rendered (e.g., a missing field causes a re-render loop)
- **Network condition effects** — when the server is slow, the browser experience compounds (auth → fetch → render delays)

A purely-browser test won't notice:
- **Server saturation**: your 5 browsers run fine, but real production has 1000s
- **Different UX at quiet vs busy times** — caches warm, DB slow

The hybrid test catches both.

### The exec function pattern

Each scenario specifies an `exec: '<function-name>'`. These are exported functions in your test module. They run in their own VU pool — browser scenarios don't compete with HTTP scenarios for VUs.

```javascript
export function apiCalls() {
  http.get(`${BASE_URL}/lab/echo`, { tags: { kind: 'api' } });
}

export async function browserFlow() {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/.../playground/`);
    // ...
  } finally {
    await page.close();
  }
}
```

The `default function () {}` becomes optional when every scenario has `exec`.

### Sizing the browser sample

How many browsers should you run alongside HTTP load?

- **Too few** (1-2): Web Vitals stats are noisy — only a few samples per percentile
- **Too many** (50+): Browsers themselves consume CPU/RAM, distorting the test
- **Sweet spot** (3-10): Enough samples for stable p95, not enough to be the bottleneck

For a 60-second test at typical iteration time of 5-10 seconds, 5 VUs gives you ~30-60 page-load samples. That's usually adequate.

### Network conditions

Real users aren't on your dev machine's gigabit. Throttle the browser scenario:

```javascript
const page = await browser.newPage();
const cdp = await page.context().newCDPSession(page);  // Chrome DevTools Protocol
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 100,         // 100ms RTT
  downloadThroughput: 1.6 * 1024 * 1024 / 8,  // 1.6 Mbps
  uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
});
```

This is approximately Slow 3G. Now your `browser_web_vital_lcp` reflects what real users on poor connections experience.

(The kata's solution doesn't include throttling for simplicity, but the pattern is in the cheat sheet.)

## Exercises

1. **Run the kata's spec.** What's the LCP under the API hammer? Compare with kata 64's LCP (no concurrent load). Is there degradation?
2. **Crank the API rate.** Bump `api_hammer.rate` from 200 to 1000 RPS. What happens to `browser_web_vital_lcp`? At what point does the browser experience degrade?
3. **Add network throttling.** Apply Slow 3G to the browser scenario. Now LCP includes realistic network delay. Does the difference between "API at 0 RPS" and "API at 200 RPS" become more or less visible?
4. **Bail-out scenario.** When `http_req_duration{kind:api}: p(95) > 1000`, abort the test. What's the right `delayAbortEval`? You don't want a startup blip to kill it.

## Common Mistakes

- **Not tagging.** With multiple scenarios, untagged metrics conflate browser HTTP requests with API HTTP requests. Tag `{ kind: 'api' }` for the hammer.
- **Asserting browser metrics on the API scenario.** They simply won't have data — `browser_web_vital_*` only populates from browser scenarios.
- **Same `preAllocatedVUs` for both.** Browser scenarios are heavier; allocate VUs separately per scenario.
- **Treating the browser sample as load.** It's a probe, not load. Real load comes from the HTTP scenario.

## Cheat Sheet

```javascript
// Hybrid scenario template
export const options = {
  scenarios: {
    api_hammer: {
      executor: 'constant-arrival-rate',
      rate: 200, timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 50,
      exec: 'apiCalls',
    },
    browser_sample: {
      executor: 'constant-vus',
      vus: 3,
      duration: '60s',
      options: { browser: { type: 'chromium' } },
      exec: 'browserFlow',
    },
  },
  thresholds: {
    'http_req_duration{kind:api}': ['p(95)<300'],
    'browser_web_vital_lcp': ['p(95)<2500'],
  },
};

// Network throttling for the browser scenario
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.emulateNetworkConditions', { /* slow 3g profile */ });
```

| Pattern | Use |
|---------|-----|
| 95% HTTP + 5% browser | Find UX regressions under realistic load |
| Sequential phases (`startTime`) | Compare quiet vs busy without rebooting |
| API hammer + auth flow browser | Test login UX while system is busy |
