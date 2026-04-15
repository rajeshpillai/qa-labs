import { spawn } from 'child_process';
import path from 'path';
import type { EmitFn, ExerciseResult, ExecutionSummary } from './types.js';

const CYPRESS_CWD = path.join(process.cwd(), '..', 'cypress');

export async function runCypress(
  testFilePath: string,
  emit: EmitFn
): Promise<void> {
  emit({
    type: 'started',
    data: { framework: 'cypress', testFile: testFilePath },
  });

  return new Promise<void>((resolve) => {
    const child = spawn(
      'npx',
      [
        'cypress',
        'run',
        '--spec',
        testFilePath,
        '--reporter',
        'json',
        '--config',
        'baseUrl=http://localhost:8080,video=false',
        '--browser',
        'electron',
        '--headless',
      ],
      {
        cwd: CYPRESS_CWD,
        env: { ...process.env },
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
        // Cypress JSON reporter may output non-JSON lines before the JSON block.
        // Find the JSON object in stdout.
        const jsonStart = stdout.indexOf('{');
        const jsonStr = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;
        const report = JSON.parse(jsonStr);

        const results: ExerciseResult[] = [];
        const tests = report.tests ?? [];

        for (const test of tests) {
          const hasPassed = !test.err || Object.keys(test.err).length === 0;
          const exerciseResult: ExerciseResult = {
            exercise: test.fullTitle ?? test.title ?? 'unknown',
            status: hasPassed ? 'passed' : 'failed',
            duration: test.duration,
            error: test.err?.message,
          };

          results.push(exerciseResult);
          emit({ type: 'result', data: exerciseResult as unknown as Record<string, unknown> });
        }

        const stats = report.stats ?? {};
        const summary: ExecutionSummary = {
          passed: stats.passes ?? results.filter((r) => r.status === 'passed').length,
          failed: stats.failures ?? results.filter((r) => r.status === 'failed').length,
          skipped: stats.pending ?? 0,
          total: stats.tests ?? results.length,
          duration: stats.duration ?? 0,
        };

        emit({ type: 'done', data: summary as unknown as Record<string, unknown> });
        resolve();
      } catch {
        const errorMessage = stderr || `Cypress exited with code ${code}`;
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
        data: { message: `Failed to spawn Cypress: ${err.message}` },
      });
      resolve();
    });
  });
}
