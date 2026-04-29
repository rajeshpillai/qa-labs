import { Router } from 'express';
import type { Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory state — fine for a learning lab; reset on restart.
const tokenStore = new Map<string, { user: string; issuedAt: number }>();
const rateBuckets = new Map<string, { tokens: number; lastRefillMs: number }>();
const kycApplications = new Map<string, KycApplication>();

interface KycApplication {
  id: string;
  status: 'started' | 'documents-uploaded' | 'video-verified' | 'approved' | 'rejected';
  user: string;
  createdAt: number;
}

// Helper: respond after delay
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Helper: latency drawn from a normal-ish distribution between p50 and p95
function sampleLatency(p50: number, p95: number): number {
  const tail = Math.random() < 0.05;
  if (tail) {
    // 5% tail: spread between p95 and 2× p95
    return p95 + Math.random() * p95;
  }
  // 95% body: skewed around p50
  const u = Math.random();
  return p50 * (0.6 + u * 0.8);
}

// /lab/echo — fast baseline
router.get('/lab/echo', (req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now(), query: req.query });
});

router.post('/lab/echo', (req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now(), body: req.body });
});

// /lab/slow?ms=N — fixed latency
router.get('/lab/slow', async (req: Request, res: Response) => {
  const ms = Math.min(parseInt(String(req.query.ms ?? '500'), 10) || 500, 30000);
  await delay(ms);
  res.json({ ok: true, ms });
});

// /lab/jitter?p50=&p95= — distribution-based latency
router.get('/lab/jitter', async (req: Request, res: Response) => {
  const p50 = Math.min(parseInt(String(req.query.p50 ?? '100'), 10) || 100, 30000);
  const p95 = Math.min(parseInt(String(req.query.p95 ?? '500'), 10) || 500, 30000);
  const actual = Math.round(sampleLatency(p50, p95));
  await delay(actual);
  res.json({ ok: true, latencyMs: actual });
});

// /lab/flaky?errorRate=0.1 — random 500s
router.get('/lab/flaky', (req: Request, res: Response) => {
  const errorRate = Math.min(
    Math.max(parseFloat(String(req.query.errorRate ?? '0.1')) || 0.1, 0),
    1
  );
  if (Math.random() < errorRate) {
    res.status(500).json({ error: 'simulated server failure', errorRate });
    return;
  }
  res.json({ ok: true, errorRate });
});

// /lab/limit — token bucket rate limiter (default: 5 rps per IP)
router.get('/lab/limit', (req: Request, res: Response) => {
  const capacity = 5;
  const refillPerSec = 5;
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefillMs: now };
    rateBuckets.set(ip, bucket);
  }
  const elapsedSec = (now - bucket.lastRefillMs) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec);
  bucket.lastRefillMs = now;

  if (bucket.tokens < 1) {
    res.status(429).json({ error: 'rate limit exceeded', retryAfterMs: 1000 });
    return;
  }
  bucket.tokens -= 1;
  res.json({ ok: true, remainingTokens: Math.floor(bucket.tokens) });
});

// /lab/auth/login — token-based auth
router.post('/lab/auth/login', (req: Request, res: Response) => {
  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' });
    return;
  }
  // Any non-empty username/password works for the lab
  if (password === 'wrong') {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }
  const token = crypto.randomBytes(16).toString('hex');
  tokenStore.set(token, { user: username, issuedAt: Date.now() });
  res.json({ token, user: username });
});

router.get('/lab/auth/me', (req: Request, res: Response) => {
  const auth = req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const session = tokenStore.get(token);
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.json({ user: session.user, sessionAgeMs: Date.now() - session.issuedAt });
});

// /lab/kyc/* — multi-step fintech flow
router.post('/lab/kyc/apply', (req: Request, res: Response) => {
  const { user } = (req.body ?? {}) as { user?: string };
  if (!user) {
    res.status(400).json({ error: 'user required' });
    return;
  }
  const id = crypto.randomBytes(8).toString('hex');
  kycApplications.set(id, {
    id,
    status: 'started',
    user,
    createdAt: Date.now(),
  });
  res.json({ id, status: 'started' });
});

router.post('/lab/kyc/:id/documents', async (req: Request, res: Response) => {
  const app = kycApplications.get(req.params.id);
  if (!app) {
    res.status(404).json({ error: 'application not found' });
    return;
  }
  await delay(sampleLatency(50, 200));
  app.status = 'documents-uploaded';
  res.json({ id: app.id, status: app.status });
});

router.post('/lab/kyc/:id/video', async (req: Request, res: Response) => {
  const app = kycApplications.get(req.params.id);
  if (!app) {
    res.status(404).json({ error: 'application not found' });
    return;
  }
  await delay(sampleLatency(200, 800));
  app.status = 'video-verified';
  res.json({ id: app.id, status: app.status });
});

router.post('/lab/kyc/:id/decision', async (req: Request, res: Response) => {
  const app = kycApplications.get(req.params.id);
  if (!app) {
    res.status(404).json({ error: 'application not found' });
    return;
  }
  await delay(sampleLatency(100, 500));
  // Deterministic-ish decision: reject if user contains "rej"
  app.status = app.user.toLowerCase().includes('rej') ? 'rejected' : 'approved';
  res.json({ id: app.id, status: app.status });
});

router.get('/lab/kyc/:id', (req: Request, res: Response) => {
  const app = kycApplications.get(req.params.id);
  if (!app) {
    res.status(404).json({ error: 'application not found' });
    return;
  }
  res.json(app);
});

// /lab/headers — echoes back the request headers + a synthetic trace id so
// load tests can verify that distributed-tracing headers (X-Trace-Id,
// traceparent, X-Request-Id) propagate correctly through the load generator.
router.get('/lab/headers', (req: Request, res: Response) => {
  const traceId = req.header('x-trace-id') || req.header('traceparent') || crypto.randomBytes(8).toString('hex');
  res.json({
    receivedHeaders: req.headers,
    serverTraceId: traceId,
    ts: Date.now(),
  });
});

// /lab/health — perf-lab specific health (separate from /api/health which the test runner uses)
router.get('/lab/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    activeApplications: kycApplications.size,
    rateBuckets: rateBuckets.size,
    activeTokens: tokenStore.size,
  });
});

export default router;
