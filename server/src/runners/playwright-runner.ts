import { spawn } from 'child_process';
import path from 'path';
import type { EmitFn, ExerciseResult, ExecutionSummary } from './types.js';

const PLAYWRIGHT_CWD = path.join(process.cwd(), '..', 'playwright');

export async function runPlaywright(
  testFilePath: string,
  emit: EmitFn
): Promise<void> {
  emit({
    type: 'started',
    data: { framework: 'playwright', testFile: testFilePath },
  });

  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      'npx',
      ['playwright', 'test', testFilePath, '--reporter=json', '--project=chromium'],
      {
        cwd: PLAYWRIGHT_CWD,
        env: {
          ...process.env,
          PLAYWRIGHT_BASE_URL: 'http://localhost:8080',
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

    child.on('close', (code) => {
      try {
        const report = JSON.parse(stdout);
        const results: ExerciseResult[] = [];
        const startTime = Date.now();

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
          duration: Date.now() - startTime,
        };

        emit({ type: 'done', data: summary as unknown as Record<string, unknown> });
        resolve();
      } catch {
        const errorMessage = stderr || `Playwright exited with code ${code}`;
        emit({
          type: 'error',
          data: { message: errorMessage },
        });
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
