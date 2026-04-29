import Link from 'next/link';
import { getAllPhases } from '@/lib/katas';
import { phaseColor, phaseBorder } from '@/lib/phase-colors';

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
            const color = phaseColor(phase.number);
            const border = phaseBorder(phase.number);

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
