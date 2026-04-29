import { Router } from 'express';
import type { Request, Response } from 'express';
import { Semaphore } from '../utils/semaphore.js';
import { resolveTestFile, type Framework } from '../utils/kata-resolver.js';
import { runPlaywright } from '../runners/playwright-runner.js';
import { runCypress } from '../runners/cypress-runner.js';
import { runK6 } from '../runners/k6-runner.js';
import type { EmitFn, RunEvent } from '../runners/types.js';

const semaphore = new Semaphore(2);
const router = Router();

type RunnerFn = (testFilePath: string, emit: EmitFn) => Promise<void>;

const RUNNERS: Partial<Record<Framework, RunnerFn>> = {
  playwright: runPlaywright,
  cypress: runCypress,
  k6: runK6,
  // artillery, jmeter — not implemented yet; will return 501 below
};

router.post('/execute', async (req: Request, res: Response) => {
  const { framework, phaseSlug, kataSlug, testFile } = req.body as {
    framework?: string;
    phaseSlug?: string;
    kataSlug?: string;
    testFile?: string;
  };

  const validFrameworks: Framework[] = ['playwright', 'cypress', 'k6', 'artillery', 'jmeter'];
  if (!framework || !validFrameworks.includes(framework as Framework)) {
    res.status(400).json({
      error: `framework must be one of: ${validFrameworks.join(', ')}`,
    });
    return;
  }

  const runner = RUNNERS[framework as Framework];
  if (!runner) {
    res.status(501).json({
      error: `Runner for "${framework}" is not implemented yet on this server`,
    });
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
    testFilePath = resolveTestFile(phaseSlug, kataSlug, framework as Framework, testFile);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resolve test file';
    res.status(400).json({ error: message });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emit = (event: RunEvent) => {
    res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
  };

  await semaphore.acquire();
  try {
    await runner(testFilePath, emit);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    emit({ type: 'error', data: { message } });
  } finally {
    semaphore.release();
    res.end();
  }
});

export default router;
