import Link from 'next/link';
import { getAllPhases } from '@/lib/katas';

const PHASE_COLORS: Record<number, string> = {
  0: 'bg-blue-600',
  1: 'bg-emerald-600',
  2: 'bg-violet-600',
  3: 'bg-amber-600',
  4: 'bg-rose-600',
  5: 'bg-cyan-600',
  6: 'bg-pink-600',
  7: 'bg-teal-600',
  8: 'bg-indigo-600',
};

const PHASE_BORDERS: Record<number, string> = {
  0: 'border-blue-200 dark:border-blue-900',
  1: 'border-emerald-200 dark:border-emerald-900',
  2: 'border-violet-200 dark:border-violet-900',
  3: 'border-amber-200 dark:border-amber-900',
  4: 'border-rose-200 dark:border-rose-900',
  5: 'border-cyan-200 dark:border-cyan-900',
  6: 'border-pink-200 dark:border-pink-900',
  7: 'border-teal-200 dark:border-teal-900',
  8: 'border-indigo-200 dark:border-indigo-900',
};

export default function Home() {
  const phases = getAllPhases();
  const firstKata = phases[0]?.katas[0];
  const totalKatas = phases.reduce((sum, p) => sum + p.katas.length, 0);

  return (
    <div className="min-h-screen bg-surface/50 dark:bg-zinc-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-emerald-600/10 dark:from-blue-600/5 dark:via-violet-600/5 dark:to-emerald-600/5" />
        <div className="relative max-w-5xl mx-auto px-4 py-24 sm:py-32 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-500 bg-clip-text text-transparent">
              QA Labs
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-muted max-w-xl mx-auto">
            {totalKatas} Testing Katas — Playwright &amp; Cypress
          </p>
          <p className="mt-2 text-sm text-muted">
            Hands-on exercises across {phases.length} phases, from foundations to advanced patterns
          </p>
          {firstKata && (
            <Link
              href={`/katas/${firstKata.phaseSlug}/${firstKata.slug}/`}
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start Learning
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </section>

      {/* Phase cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {phases.map((phase) => {
            const color = PHASE_COLORS[phase.number] ?? 'bg-zinc-600';
            const border = PHASE_BORDERS[phase.number] ?? 'border-zinc-200 dark:border-zinc-800';

            return (
              <div
                key={phase.slug}
                className={`rounded-xl border ${border} bg-background p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white ${color}`}
                  >
                    {phase.number}
                  </span>
                  <h2 className="text-base font-semibold text-foreground">
                    {phase.name}
                  </h2>
                </div>

                <p className="text-xs text-muted">
                  {phase.katas.length} kata{phase.katas.length !== 1 ? 's' : ''}
                </p>

                <ul className="flex flex-col gap-1">
                  {phase.katas.map((kata) => (
                    <li key={kata.slug}>
                      <Link
                        href={`/katas/${kata.phaseSlug}/${kata.slug}/`}
                        className="text-sm text-muted hover:text-accent transition-colors"
                      >
                        {String(kata.number).padStart(2, '0')}. {kata.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
