export interface KataFile {
  filename: string;
  content: string;  // raw source code
}

export type FrameworkId =
  | 'playwright'
  | 'cypress'
  | 'k6'
  | 'artillery'
  | 'jmeter';

export interface Kata {
  slug: string;           // "01-selectors-and-locators"
  number: number;         // 1
  title: string;          // "Selectors and Locators"
  phaseSlug: string;      // "phase-00-foundations"
  phaseNumber: number;    // 0
  phaseName: string;      // "Foundations"
  readmeRaw: string;      // raw markdown
  hasPlayground: boolean;
  playwrightFiles: KataFile[];
  cypressFiles: KataFile[];
  k6Files: KataFile[];
  artilleryFiles: KataFile[];
  jmeterFiles: KataFile[];
}

export interface Phase {
  slug: string;
  number: number;
  name: string;
  katas: Kata[];
}

export interface ExerciseResult {
  exercise: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration?: number;
  error?: string;
}

export interface ExecutionSummary {
  passed: number;
  failed: number;
  total: number;
  duration: number;
}
