// Kata 74 — Capstone: KYC Performance Engagement
//
// Synthesizes phases 9-17 into a single coherent test plan modeling the
// fictional Acme Bank KYC engagement brief. Five parallel scenarios:
//
//   1. api_hammer       — 100 RPS sustained HTTP load (capacity check)
//   2. kyc_funnel       — multi-step KYC flow with realistic drop-off
//   3. browser_sample   — 2 Chromium tabs measuring Web Vitals under load
//   4. rate_limit_probe — exercise the rate limiter (8 RPS against 5/sec limit)
//   5. trace_audit      — verify trace propagation works under load
//
// Thresholds enforce server-side SLOs, browser SLOs, funnel completion,
// and bounded rate-limit / error rates.

import http from 'k6/http';
import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { check as bcheck } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const HTTP_BASE = __ENV.K6_BASE_URL || 'http://localhost:3000';
const PLAYGROUND = __ENV.K6_BROWSER_URL || 'http://localhost:8080';
const PAGE = `${PLAYGROUND}/phase-13-frontend-perf/58-lighthouse-basics/playground/`;

// Custom metrics
const kycCompletion = new Rate('kyc_funnel_completion');
const rateLimitHits = new Counter('rate_limit_hits');
const tracePropagated = new Counter('trace_propagation_verified');
const tApply = new Trend('kyc_apply_ms', true);
const tDocs = new Trend('kyc_docs_ms', true);
const tDecision = new Trend('kyc_decision_ms', true);

export const options = {
  scenarios: {
    api_hammer: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 30,
      maxVUs: 60,
      exec: 'apiHammer',
      tags: { stream: 'api' },
    },
    kyc_funnel: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 20,
      exec: 'kycFunnel',
      tags: { stream: 'kyc' },
    },
    browser_sample: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
      options: { browser: { type: 'chromium' } },
      exec: 'browserFlow',
      tags: { stream: 'browser' },
    },
    rate_limit_probe: {
      executor: 'constant-arrival-rate',
      rate: 8,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 5,
      exec: 'rateLimitProbe',
      tags: { stream: 'rate_limit' },
    },
    trace_audit: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 5,
      exec: 'traceAudit',
      tags: { stream: 'trace' },
    },
  },
  thresholds: {
    // Server-side SLO under sustained load
    'http_req_duration{stream:api}': ['p(95)<300'],
    'http_req_failed{stream:api}': ['rate<0.01'],
    // Browser SLO under load
    'browser_web_vital_lcp': ['p(95)<3000'],
    'browser_web_vital_cls': ['p(95)<0.15'],
    // KYC funnel completion (business metric)
    'kyc_funnel_completion': ['rate>0.70'],
    'kyc_apply_ms': ['p(95)<300'],
    'kyc_docs_ms': ['p(95)<500'],
    'kyc_decision_ms': ['p(95)<1000'],
    // Rate limit working as designed
    'rate_limit_hits': ['count>0'],   // we WANT to see 429s — proves the limiter works
    // Trace propagation
    'trace_propagation_verified': ['count>50'],
  },
};

// Scenario 1: sustained API load
export function apiHammer() {
  const res = http.get(`${HTTP_BASE}/lab/echo`, { tags: { stream: 'api' } });
  check(res, { 'echo 200': (r) => r.status === 200 });
}

// Scenario 2: realistic KYC funnel
export function kycFunnel() {
  const start = Date.now();
  const apply = http.post(
    `${HTTP_BASE}/lab/kyc/apply`,
    JSON.stringify({ user: `cap-${__VU}-${__ITER}` }),
    { headers: { 'Content-Type': 'application/json' }, tags: { stream: 'kyc', step: 'apply' } }
  );
  tApply.add(Date.now() - start);
  if (apply.status !== 200) { kycCompletion.add(false); return; }

  const id = apply.json('id');
  sleep(0.5 + Math.random());

  const docsStart = Date.now();
  const docs = http.post(`${HTTP_BASE}/lab/kyc/${id}/documents`, null, {
    tags: { stream: 'kyc', step: 'docs' },
  });
  tDocs.add(Date.now() - docsStart);
  if (docs.status !== 200) { kycCompletion.add(false); return; }
  sleep(0.5 + Math.random());

  const video = http.post(`${HTTP_BASE}/lab/kyc/${id}/video`, null, {
    tags: { stream: 'kyc', step: 'video' },
  });
  if (video.status !== 200) { kycCompletion.add(false); return; }
  sleep(0.3);

  const decisionStart = Date.now();
  const decision = http.post(`${HTTP_BASE}/lab/kyc/${id}/decision`, null, {
    tags: { stream: 'kyc', step: 'decision' },
  });
  tDecision.add(Date.now() - decisionStart);
  kycCompletion.add(decision.status === 200);
}

// Scenario 3: browser sample
export async function browserFlow() {
  const page = await browser.newPage();
  try {
    await page.goto(PAGE, { waitUntil: 'networkidle' });
    await bcheck(page, {
      'page renders during load': async (p) => {
        const hero = p.locator('[data-testid="hero"]');
        return await hero.isVisible();
      },
    });
  } finally {
    await page.close();
  }
}

// Scenario 4: rate-limit probe
export function rateLimitProbe() {
  const res = http.get(`${HTTP_BASE}/lab/limit`, { tags: { stream: 'rate_limit' } });
  if (res.status === 429) rateLimitHits.add(1);
}

// Scenario 5: trace correlation audit
function newTraceparent() {
  const hex = (n) => Array.from({ length: n }, () =>
    Math.floor(Math.random() * 16).toString(16)).join('');
  return `00-${hex(32)}-${hex(16)}-01`;
}

export function traceAudit() {
  const tp = newTraceparent();
  const res = http.get(`${HTTP_BASE}/lab/headers`, {
    headers: { traceparent: tp },
    tags: { stream: 'trace' },
  });
  if (res.status === 200) {
    const echoed = res.json('receivedHeaders');
    if (echoed?.traceparent === tp) tracePropagated.add(1);
  }
}
