import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';
import type { EmitFn, ExerciseResult, ExecutionSummary } from './types.js';

interface ArtillerySummary {
  min?: number;
  max?: number;
  count?: number;
  mean?: number;
  p50?: number;
  median?: number;
  p75?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  p999?: number;
}

interface ArtilleryReport {
  aggregate?: {
    counters?: Record<string, number>;
    summaries?: Record<string, ArtillerySummary>;
    period?: number;
  };
}

function sumCountersByPrefix(
  counters: Record<string, number>,
  prefix: string
): number {
  let total = 0;
  for (const [key, value] of Object.entries(counters)) {
    if (key.startsWith(prefix)) total += value;
  }
  return total;
}

export async function runArtillery(testFilePath: string, emit: EmitFn): Promise<void> {
  emit({
    type: 'started',
    data: { framework: 'artillery', testFile: path.basename(testFilePath) },
  });

  const reportPath = path.join(
    os.tmpdir(),
    `artillery-report-${crypto.randomBytes(6).toString('hex')}.json`
  );

  return new Promise<void>((resolve) => {
    const child = spawn(
      'artillery',
      ['run', '--quiet', '--output', reportPath, testFilePath],
      {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let stderr = '';
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', (exitCode) => {
      try {
        let report: ArtilleryReport | null = null;
        try {
          if (fs.existsSync(reportPath)) {
            const raw = fs.readFileSync(reportPath, 'utf-8');
            report = JSON.parse(raw) as ArtilleryReport;
            fs.unlinkSync(reportPath);
          }
        } catch {
          report = null;
        }

        if (!report?.aggregate) {
          const errorMessage =
            stderr?.slice(0, 1000) ||
            stdout?.slice(0, 1000) ||
            'Artillery produced no report';
          emit({ type: 'error', data: { message: errorMessage } });
          resolve();
          return;
        }

        const counters = report.aggregate.counters ?? {};
        const summaries = report.aggregate.summaries ?? {};
        const results: ExerciseResult[] = [];

        // 1. Did any virtual users complete?
        const vusersCreated = counters['vusers.created'] ?? 0;
        const vusersCompleted = counters['vusers.completed'] ?? 0;
        const vusersFailed = counters['vusers.failed'] ?? 0;
        results.push({
          exercise: 'virtual users completed without error',
          status: vusersCreated > 0 && vusersFailed === 0 ? 'passed' : 'failed',
          error:
            vusersFailed > 0
              ? `${vusersFailed} of ${vusersCreated} virtual users failed`
              : vusersCreated === 0
                ? 'no virtual users were created — check the YAML config'
                : undefined,
        });

        // 2. Were all HTTP responses successful (2xx)?
        const totalResponses = counters['http.responses'] ?? 0;
        const responses2xx = sumCountersByPrefix(counters, 'http.codes.2');
        const responses4xx = sumCountersByPrefix(counters, 'http.codes.4');
        const responses5xx = sumCountersByPrefix(counters, 'http.codes.5');
        results.push({
          exercise: 'all HTTP responses were 2xx',
          status: totalResponses > 0 && responses2xx === totalResponses ? 'passed' : 'failed',
          error:
            responses4xx > 0 || responses5xx > 0
              ? `${responses4xx} 4xx, ${responses5xx} 5xx out of ${totalResponses} responses`
              : totalResponses === 0
                ? 'no HTTP responses recorded'
                : undefined,
        });

        // 3. Latency summary (informational — always passes if recorded)
        const responseTime = summaries['http.response_time'];
        if (responseTime && typeof responseTime.p95 === 'number') {
          results.push({
            exercise: 'response time summary',
            status: 'passed',
            error: undefined,
            duration: responseTime.mean,
          });
        }

        // 4. Ensure assertions — Artillery 2.x exits non-zero when any
        //    `config.ensure` check fails. We can't get per-assertion granularity
        //    from the JSON report, so we use exit code as a single roll-up.
        results.push({
          exercise: 'ensure assertions satisfied',
          status: exitCode === 0 ? 'passed' : 'failed',
          error:
            exitCode === 0
              ? undefined
              : `Artillery exited with code ${exitCode}. Run \`artillery run\` directly to see which ensure check failed.`,
        });

        for (const r of results) {
          emit({ type: 'result', data: r as unknown as Record<string, unknown> });
        }

        const passed = results.filter((r) => r.status === 'passed').length;
        const failed = results.filter((r) => r.status === 'failed').length;
        const summaryEvent: ExecutionSummary = {
          passed,
          failed,
          skipped: 0,
          total: results.length,
          duration: report.aggregate.period ?? 0,
        };

        emit({ type: 'done', data: summaryEvent as unknown as Record<string, unknown> });
        resolve();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse Artillery report';
        emit({ type: 'error', data: { message: `Artillery report parse error: ${message}` } });
        resolve();
      }
    });

    child.on('error', (err) => {
      const message = err.message.includes('ENOENT')
        ? 'Artillery not found. Install it with `npm install -g artillery`.'
        : `Failed to spawn Artillery: ${err.message}`;
      emit({ type: 'error', data: { message } });
      resolve();
    });
  });
}
