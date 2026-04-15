import { Router } from 'express';
import type { Request, Response } from 'express';
import { Semaphore } from '../utils/semaphore.js';
import { resolveTestFile } from '../utils/kata-resolver.js';
import { runPlaywright } from '../runners/playwright-runner.js';
import { runCypress } from '../runners/cypress-runner.js';
import type { RunEvent } from '../runners/types.js';

const semaphore = new Semaphore(2);
const router = Router();

router.post('/execute', async (req: Request, res: Response) => {
  const { framework, phaseSlug, kataSlug, testFile } = req.body as {
    framework?: string;
    phaseSlug?: string;
    kataSlug?: string;
    testFile?: string;
  };

  if (!framework || (framework !== 'playwright' && framework !== 'cypress')) {
    res.status(400).json({ error: 'framework must be "playwright" or "cypress"' });
    return;
  }

  if (!phaseSlug || !kataSlug) {
    res.status(400).json({ error: 'phaseSlug and kataSlug are required' });
    return;
  }

  if (!semaphore.available) {
    res.status(429).json({ error: 'Too many concurrent test runs. Please try again shortly.' });
    return;
  }

  let testFilePath: string;
  try {
    testFilePath = resolveTestFile(phaseSlug, kataSlug, framework, testFile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resolve test file';
    res.status(400).json({ error: message });
    return;
  }

  // Set SSE headers
  res.setHeaders(new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }));
  res.flushHeaders();

  const emit = (event: RunEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  await semaphore.acquire();
  try {
    if (framework === 'playwright') {
      await runPlaywright(testFilePath, emit);
    } else {
      await runCypress(testFilePath, emit);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    emit({ type: 'error', data: { message } });
  } finally {
    semaphore.release();
    res.end();
  }
});

export default router;
