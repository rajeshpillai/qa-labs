// Kata 53 — Fintech KYC at Scale (k6 solution)
//
// Models a realistic KYC funnel with weighted drop-off:
//   75% complete the whole flow
//   15% bail after documents
//   5%  bail after video
//   5%  bail right after apply
//
// Each step has its own custom Trend metric and threshold so a regression
// in one leg of the funnel is immediately visible. Includes realistic
// think time between steps.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

// Per-step timing metrics. The `true` flag formats values as milliseconds
// in the summary output.
const tApply = new Trend('kyc_apply_ms', true);
const tDocs = new Trend('kyc_documents_ms', true);
const tVideo = new Trend('kyc_video_ms', true);
const tDecision = new Trend('kyc_decision_ms', true);

// Funnel completion rate — the business metric.
const completion = new Rate('kyc_completion');

export const options = {
  scenarios: {
    full_flow: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 60,
      maxVUs: 120,
      exec: 'fullFlow',
    },
    bail_at_video: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 15,
      exec: 'bailAtVideo',
    },
    bail_at_documents: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 25,
      exec: 'bailAtDocs',
    },
    bail_at_apply: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      exec: 'bailAtApply',
    },
  },
  thresholds: {
    // Per-step latency targets — tighter for faster steps.
    'kyc_apply_ms': ['p(95)<200'],
    'kyc_documents_ms': ['p(95)<400'],
    'kyc_video_ms': ['p(95)<1500'],
    'kyc_decision_ms': ['p(95)<800'],
    // Business metric: at least 70% of started applications complete.
    'kyc_completion': ['rate>0.70'],
    'http_req_failed': ['rate<0.01'],
  },
};

function apply() {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/lab/kyc/apply`,
    JSON.stringify({ user: `applicant-${__VU}-${__ITER}` }),
    { headers: { 'Content-Type': 'application/json' }, tags: { step: 'apply' } }
  );
  tApply.add(Date.now() - start);
  check(res, { 'apply status is 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json('id') : null;
}

function uploadDocs(id) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/lab/kyc/${id}/documents`,
    null,
    { tags: { step: 'documents' } }
  );
  tDocs.add(Date.now() - start);
  return check(res, { 'documents status is 200': (r) => r.status === 200 });
}

function videoVerify(id) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/lab/kyc/${id}/video`,
    null,
    { tags: { step: 'video' } }
  );
  tVideo.add(Date.now() - start);
  return check(res, { 'video status is 200': (r) => r.status === 200 });
}

function decide(id) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/lab/kyc/${id}/decision`,
    null,
    { tags: { step: 'decision' } }
  );
  tDecision.add(Date.now() - start);
  return check(res, { 'decision status is 200': (r) => r.status === 200 });
}

// Realistic think time between steps. `sleep()` blocks the iteration —
// open-model executors compensate by spinning up more VUs as needed.
function think(min, max) {
  sleep(min + Math.random() * (max - min));
}

export function fullFlow() {
  const id = apply();
  if (!id) return completion.add(false);

  think(1, 3);
  if (!uploadDocs(id)) return completion.add(false);

  think(3, 8);
  if (!videoVerify(id)) return completion.add(false);

  think(2, 5);
  if (!decide(id)) return completion.add(false);

  completion.add(true);
}

export function bailAtVideo() {
  const id = apply();
  if (!id) return completion.add(false);
  think(1, 3);
  uploadDocs(id);
  think(3, 8);
  videoVerify(id);
  // User abandons after video — no decision call.
  completion.add(false);
}

export function bailAtDocs() {
  const id = apply();
  if (!id) return completion.add(false);
  think(1, 3);
  uploadDocs(id);
  // User abandons after docs.
  completion.add(false);
}

export function bailAtApply() {
  apply();
  // User starts the application but never uploads anything.
  completion.add(false);
}
