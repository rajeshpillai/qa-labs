export interface RunEvent {
  type: 'started' | 'result' | 'done' | 'error';
  data: Record<string, unknown>;
}

export interface ExerciseResult {
  exercise: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
}

export interface ExecutionSummary {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
}

export type EmitFn = (event: RunEvent) => void;
