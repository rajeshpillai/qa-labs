import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import type { EmitFn, ExerciseResult, ExecutionSummary } from './types.js';

interface K6Summary {
  metrics?: Record<string, K6Metric>;
  root_group?: K6Group;
}

// k6 v0.x put stats under `values` and thresholds as { ok: boolean }.
// k6 v2 flattened stats onto the metric itself and uses bare booleans for
// thresholds where `true` = BREACHED (i.e., failed). We tolerate both.
interface K6Metric {
  type?: string;
  contains?: string;
  values?: Record<string, number>;
  thresholds?: Record<string, boolean | { ok: boolean }>;
  // v2 flat stats — same field names as values would have
  avg?: number;
  min?: number;
  max?: number;
  med?: number;
  rate?: number;
  count?: number;
  value?: number;
  [key: string]: unknown; // allow p(95), p(99) etc.
}

function metricStat(metric: K6Metric, key: string): number | undefined {
  if (metric.values && typeof metric.values[key] === 'number') return metric.values[key];
  const flat = metric[key];
  if (typeof flat === 'number') return flat;
  return undefined;
}

// Returns `true` if the threshold passed (i.e., NOT breached).
function thresholdPassed(value: boolean | { ok: boolean }): boolean {
  if (typeof value === 'boolean') {
    // v2: bare boolean where true means "breached"
    return value === false;
  }
  // v0.x: { ok: boolean } where ok=true means "passed"
  return value.ok === true;
}

interface K6Check {
  name: string;
  path: string;
  passes: number;
  fails: number;
}

interface K6Group {
  name: string;
  path: string;
  // k6 may emit these as either an array (older versions) or an object
  // keyed by name (newer versions). We normalize both shapes via toArray().
  checks?: K6Check[] | Record<string, K6Check>;
  groups?: K6Group[] | Record<string, K6Group>;
}

function toArray<T>(value: T[] | Record<string, T> | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return Object.values(value);
}

function flattenChecks(group: K6Group, acc: K6Check[] = []): K6Check[] {
  for (const c of toArray(group.checks)) acc.push(c);
  for (const g of toArray(group.groups)) flattenChecks(g, acc);
  return acc;
}

export async function runK6(testFilePath: string, emit: EmitFn): Promise<void> {
  emit({
    type: 'started',
    data: { framework: 'k6', testFile: path.basename(testFilePath) },
  });

  const summaryPath = path.join(
    os.tmpdir(),
    `k6-summary-${crypto.randomBytes(6).toString('hex')}.json`
  );

  return new Promise<void>((resolve) => {
    const child = spawn(
      'k6',
      [
        'run',
        '--quiet',
        '--no-usage-report',
        '--summary-export', summaryPath,
        testFilePath,
      ],
      {
        env: {
          ...process.env,
          K6_BASE_URL: process.env.K6_BASE_URL ?? 'http://localhost:3000',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.stdout.on('data', () => {
      // discard — we only consume the summary file
    });

    child.on('close', () => {
      try {
        let summary: K6Summary | null = null;
        try {
          if (fs.existsSync(summaryPath)) {
            const raw = fs.readFileSync(summaryPath, 'utf-8');
            summary = JSON.parse(raw) as K6Summary;
            fs.unlinkSync(summaryPath);
          }
        } catch {
          summary = null;
        }

        if (!summary) {
          const errorMessage = stderr?.slice(0, 1000) || 'k6 produced no summary';
          emit({ type: 'error', data: { message: errorMessage } });
          resolve();
          return;
        }

        const results: ExerciseResult[] = [];

        // Each check → one exercise result
        const checks = summary.root_group ? flattenChecks(summary.root_group) : [];
        for (const c of checks) {
          const status: ExerciseResult['status'] = c.fails === 0 ? 'passed' : 'failed';
          const result: ExerciseResult = {
            exercise: c.name,
            status,
            error:
              c.fails > 0
                ? `${c.fails} of ${c.passes + c.fails} iterations failed this check`
                : undefined,
          };
          results.push(result);
          emit({ type: 'result', data: result as unknown as Record<string, unknown> });
        }

        // Each threshold → one exercise result
        const metrics = summary.metrics ?? {};
        for (const [metricName, metric] of Object.entries(metrics)) {
          for (const [thresholdExpr, thresholdResult] of Object.entries(metric.thresholds ?? {})) {
            const passed = thresholdPassed(thresholdResult);
            const status: ExerciseResult['status'] = passed ? 'passed' : 'failed';
            const observedStats = {
              avg: metricStat(metric, 'avg'),
              med: metricStat(metric, 'med'),
              p95: metricStat(metric, 'p(95)'),
              p99: metricStat(metric, 'p(99)'),
              rate: metricStat(metric, 'rate'),
              count: metricStat(metric, 'count'),
              value: metricStat(metric, 'value'),
            };
            const result: ExerciseResult = {
              exercise: `${metricName}: ${thresholdExpr}`,
              status,
              error: passed
                ? undefined
                : `Threshold violated. Observed: ${JSON.stringify(observedStats)}`,
            };
            results.push(result);
            emit({ type: 'result', data: result as unknown as Record<string, unknown> });
          }
        }

        // Synthesize a default check from http_req_failed if no checks/thresholds were defined
        if (results.length === 0) {
          const httpReqFailed = metricStat(metrics.http_req_failed ?? {}, 'rate');
          if (typeof httpReqFailed === 'number') {
            const status: ExerciseResult['status'] = httpReqFailed === 0 ? 'passed' : 'failed';
            const synthetic: ExerciseResult = {
              exercise: 'http_req_failed === 0',
              status,
              error: status === 'failed' ? `http_req_failed rate = ${httpReqFailed}` : undefined,
            };
            results.push(synthetic);
            emit({ type: 'result', data: synthetic as unknown as Record<string, unknown> });
          }
        }

        const passed = results.filter((r) => r.status === 'passed').length;
        const failed = results.filter((r) => r.status === 'failed').length;
        const iterDurAvg = metricStat(metrics.iteration_duration ?? {}, 'avg') ?? 0;
        const iterCount = metricStat(metrics.iterations ?? {}, 'count') ?? 0;
        const durationMs = iterDurAvg * iterCount;

        const execSummary: ExecutionSummary = {
          passed,
          failed,
          skipped: 0,
          total: results.length,
          duration: durationMs,
        };

        emit({ type: 'done', data: execSummary as unknown as Record<string, unknown> });
        resolve();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse k6 summary';
        emit({ type: 'error', data: { message: `k6 summary parse error: ${message}` } });
        resolve();
      }
    });

    child.on('error', (err) => {
      const message =
        err.message.includes('ENOENT')
          ? 'k6 not found. Install it from https://k6.io/docs/get-started/installation/'
          : `Failed to spawn k6: ${err.message}`;
      emit({ type: 'error', data: { message } });
      resolve();
    });
  });
}
