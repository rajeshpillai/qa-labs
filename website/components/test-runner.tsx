'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExerciseResult, ExecutionSummary, FrameworkId } from '@/lib/types';

interface FrameworkChoice {
  id: FrameworkId;
  label: string;
}

interface TestRunnerProps {
  phaseSlug: string;
  kataSlug: string;
  frameworks: FrameworkChoice[];
}

export function TestRunner({
  phaseSlug,
  kataSlug,
  frameworks,
}: TestRunnerProps) {
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [framework, setFramework] = useState<FrameworkId>(
    frameworks[0]?.id ?? 'playwright'
  );
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [summary, setSummary] = useState<ExecutionSummary | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  // Check server health on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/health/')
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) { setServerAvailable(false); return; }
        try {
          const data = await res.json();
          setServerAvailable(data?.status === 'ok');
        } catch {
          setServerAvailable(false);
        }
      })
      .catch(() => {
        if (!cancelled) setServerAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleError = useCallback((index: number) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);
    setExpandedErrors(new Set());

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ framework, phaseSlug, kataSlug }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        setRunning(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop()!;

        for (const event of events) {
          const lines = event.split('\n');
          let eventType = '';
          let eventData = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7);
            if (line.startsWith('data: ')) eventData = line.slice(6);
          }
          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData);

            if (eventType === 'started') {
              // Server started running tests — results will stream in
              setResults([]);
            } else if (eventType === 'result') {
              setResults((prev) => [
                ...prev,
                {
                  exercise: data.exercise as string,
                  status: data.status as ExerciseResult['status'],
                  duration: data.duration as number | undefined,
                  error: data.error as string | undefined,
                },
              ]);
            } else if (eventType === 'done') {
              setSummary({
                passed: data.passed,
                failed: data.failed,
                total: data.total,
                duration: data.duration,
              });
            } else if (eventType === 'error') {
              setSummary(null);
            }
          } catch {
            // ignore malformed JSON
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // unexpected error
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [framework, phaseSlug, kataSlug]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Loading state
  if (serverAvailable === null) {
    return (
      <div className="flex items-center justify-center min-h-[300px] rounded-lg border border-border bg-background">
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Checking test server...</span>
        </div>
      </div>
    );
  }

  // Server not available
  if (!serverAvailable) {
    return (
      <div className="flex items-center justify-center min-h-[300px] rounded-lg border border-border bg-background">
        <div className="flex flex-col items-center gap-3 max-w-md text-center px-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-muted">
            Test execution requires the hosted version. Run{' '}
            <code className="px-1.5 py-0.5 rounded bg-surface text-foreground text-xs font-mono">
              cd server && npm start
            </code>{' '}
            locally.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Framework tabs + action buttons */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-0 overflow-x-auto">
          {frameworks.map((fw) => (
            <button
              key={fw.id}
              onClick={() => !running && setFramework(fw.id)}
              disabled={running}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                framework === fw.id
                  ? 'border-green-600 text-green-700 dark:border-green-400 dark:text-green-400'
                  : 'border-transparent text-muted hover:text-foreground',
                running && 'opacity-50 cursor-not-allowed'
              )}
            >
              {fw.label}
            </button>
          ))}
        </div>

        <div className="pr-3">
          {running ? (
            <button
              onClick={handleStop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Run Tests
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="rounded-b-lg border border-t-0 border-border bg-background min-h-[300px]">
        {results.length === 0 && !running ? (
          <div className="flex items-center justify-center min-h-[300px] text-muted text-sm">
            Click &ldquo;Run Tests&rdquo; to execute the {framework} tests for
            this kata.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((result, i) => (
              <div key={i} className="flex flex-col">
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    result.status === 'failed' && 'cursor-pointer hover:bg-surface/50'
                  )}
                  onClick={() => result.status === 'failed' && toggleError(i)}
                >
                  {/* Status icon */}
                  {result.status === 'running' && (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                  )}
                  {result.status === 'passed' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                  {result.status === 'failed' && (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  {result.status === 'skipped' && (
                    <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}

                  {/* Exercise name */}
                  <span
                    className={cn(
                      'text-sm flex-1 min-w-0',
                      result.status === 'passed' && 'text-foreground',
                      result.status === 'failed' && 'text-foreground',
                      result.status === 'running' && 'text-muted',
                      result.status === 'skipped' && 'text-muted'
                    )}
                  >
                    {result.exercise}
                  </span>

                  {/* Duration */}
                  {result.duration != null && (
                    <span className="text-xs text-muted tabular-nums shrink-0">
                      {result.duration.toFixed(1)}s
                    </span>
                  )}

                  {/* Expand chevron for failures */}
                  {result.status === 'failed' && result.error && (
                    <span className="text-muted shrink-0">
                      {expandedErrors.has(i) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>

                {/* Error detail */}
                {result.status === 'failed' &&
                  result.error &&
                  expandedErrors.has(i) && (
                    <div className="px-4 pb-3">
                      <pre className="text-xs font-mono leading-relaxed p-3 rounded-md bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50 overflow-x-auto whitespace-pre-wrap break-words">
                        {result.error}
                      </pre>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {/* Summary bar */}
        {summary && (
          <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-surface/50 rounded-b-lg">
            <span className="text-sm font-medium text-foreground">
              <span className="text-green-600 dark:text-green-400">
                {summary.passed} passed
              </span>
              {summary.failed > 0 && (
                <>
                  {', '}
                  <span className="text-red-600 dark:text-red-400">
                    {summary.failed} failed
                  </span>
                </>
              )}
            </span>
            <span className="text-xs text-muted tabular-nums">
              ({summary.duration.toFixed(1)}s)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
