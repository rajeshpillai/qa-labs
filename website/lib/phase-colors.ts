export const PHASE_COLORS: Record<number, string> = {
  0: 'bg-blue-600',
  1: 'bg-emerald-600',
  2: 'bg-violet-600',
  3: 'bg-amber-600',
  4: 'bg-rose-600',
  5: 'bg-cyan-600',
  6: 'bg-pink-600',
  7: 'bg-teal-600',
  8: 'bg-indigo-600',
  9: 'bg-sky-600',
  10: 'bg-lime-600',
  11: 'bg-orange-600',
  12: 'bg-red-600',
  13: 'bg-purple-600',
  14: 'bg-fuchsia-600',
  15: 'bg-green-600',
  16: 'bg-yellow-600',
  17: 'bg-stone-600',
  18: 'bg-slate-600',
};

export const PHASE_BORDERS: Record<number, string> = {
  0: 'border-blue-200 dark:border-blue-900',
  1: 'border-emerald-200 dark:border-emerald-900',
  2: 'border-violet-200 dark:border-violet-900',
  3: 'border-amber-200 dark:border-amber-900',
  4: 'border-rose-200 dark:border-rose-900',
  5: 'border-cyan-200 dark:border-cyan-900',
  6: 'border-pink-200 dark:border-pink-900',
  7: 'border-teal-200 dark:border-teal-900',
  8: 'border-indigo-200 dark:border-indigo-900',
  9: 'border-sky-200 dark:border-sky-900',
  10: 'border-lime-200 dark:border-lime-900',
  11: 'border-orange-200 dark:border-orange-900',
  12: 'border-red-200 dark:border-red-900',
  13: 'border-purple-200 dark:border-purple-900',
  14: 'border-fuchsia-200 dark:border-fuchsia-900',
  15: 'border-green-200 dark:border-green-900',
  16: 'border-yellow-200 dark:border-yellow-900',
  17: 'border-stone-200 dark:border-stone-900',
  18: 'border-slate-200 dark:border-slate-900',
};

export const DEFAULT_PHASE_COLOR = 'bg-zinc-600';
export const DEFAULT_PHASE_BORDER = 'border-zinc-200 dark:border-zinc-800';

export function phaseColor(phaseNumber: number): string {
  return PHASE_COLORS[phaseNumber] ?? DEFAULT_PHASE_COLOR;
}

export function phaseBorder(phaseNumber: number): string {
  return PHASE_BORDERS[phaseNumber] ?? DEFAULT_PHASE_BORDER;
}
