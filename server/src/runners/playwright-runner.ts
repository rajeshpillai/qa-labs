import { spawn } from 'child_process';
import path from 'path';
import type { EmitFn, ExerciseResult, ExecutionSummary } from './types.js';

const PLAYWRIGHT_CWD = path.join(process.cwd(), '..', 'playwright');
const KATAS_DIR = path.join(process.cwd(), '..', 'katas');

export async function runPlaywright(
  testFilePath: string,
  emit: EmitFn
): Promise<void> {
  emit({
    type: 'started',
    data: { framework: 'playwright', testFile: path.basename(testFilePath) },
  });

  // Make the test path relative to the katas directory (testDir in playwright.config)
  const relativeTestPath = path.relative(KATAS_DIR, testFilePath);

  return new Promise<void>((resolve) => {
    const child = spawn(
      'npx',
      [
        'playwright', 'test',
        relativeTestPath,
        '--reporter=json',
        '--project=chromium',
      ],
      {
        cwd: PLAYWRIGHT_CWD,
        env: {
          ...process.env,
          PLAYWRIGHT_BASE_URL: 'http://localhost:8080',
          QA_LABS_SERVER: 'true',
          // Ensure test files can resolve @playwright/test from playwright/node_modules
          NODE_PATH: path.join(PLAYWRIGHT_CWD, 'node_modules'),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', () => {
      try {
        const report = JSON.parse(stdout);
        const results: ExerciseResult[] = [];

        // Playwright JSON reporter: suites contain specs
        const suites = report.suites ?? [];
        for (const suite of suites) {
          const specs = suite.specs ?? [];
          for (const spec of specs) {
            const test = spec.tests?.[0];
            const result = test?.results?.[0];

            const status =
              result?.status === 'passed'
                ? 'passed'
                : result?.status === 'skipped'
                  ? 'skipped'
                  : 'failed';

            const exerciseResult: ExerciseResult = {
              exercise: spec.title ?? 'unknown',
              status,
              duration: result?.duration,
              error: result?.error?.message,
            };

            results.push(exerciseResult);
            emit({ type: 'result', data: exerciseResult as unknown as Record<string, unknown> });
          }
        }

        const summary: ExecutionSummary = {
          passed: results.filter((r) => r.status === 'passed').length,
          failed: results.filter((r) => r.status === 'failed').length,
          skipped: results.filter((r) => r.status === 'skipped').length,
          total: results.length,
          duration: report.stats?.duration ?? 0,
        };

        emit({ type: 'done', data: summary as unknown as Record<string, unknown> });
        resolve();
      } catch {
        const errorMessage = stderr?.slice(0, 500) || 'Failed to parse test results';
        emit({ type: 'error', data: { message: errorMessage } });
        resolve();
      }
    });

    child.on('error', (err) => {
      emit({
        type: 'error',
        data: { message: `Failed to spawn Playwright: ${err.message}` },
      });
      resolve();
    });
  });
}
