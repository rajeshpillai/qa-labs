'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Kata } from '@/lib/types';
import { cn } from '@/lib/utils';
import { KataContent } from '@/components/kata-content';
import { PlaygroundViewer } from '@/components/playground-viewer';
import { CodeViewer } from '@/components/code-viewer';
import { ProgressTracker } from '@/components/progress-tracker';

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

type Tab = 'learn' | 'playground' | 'solutions';

interface KataPageClientProps {
  kata: Kata;
  prev: Kata | null;
  next: Kata | null;
  playwrightHtml: { filename: string; html: string }[];
  cypressHtml: { filename: string; html: string }[];
}

export function KataPageClient({
  kata,
  prev,
  next,
  playwrightHtml,
  cypressHtml,
}: KataPageClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('learn');

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: 'learn', label: 'Learn' },
    { key: 'playground', label: 'Playground', disabled: !kata.hasPlayground },
    {
      key: 'solutions',
      label: 'Solutions',
      disabled:
        playwrightHtml.length === 0 && cypressHtml.length === 0,
    },
  ];

  const phaseColor = PHASE_COLORS[kata.phaseNumber] ?? 'bg-zinc-600';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
                phaseColor
              )}
            >
              Phase {kata.phaseNumber}
            </span>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              Kata {String(kata.number).padStart(2, '0')}: {kata.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ProgressTracker kataSlug={kata.slug} />

            <div className="flex items-center gap-1 ml-2">
              {prev ? (
                <Link
                  href={`/katas/${prev.phaseSlug}/${prev.slug}/`}
                  className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  title={`Previous: ${prev.title}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
              ) : (
                <span className="p-1.5 text-zinc-300 dark:text-zinc-700">
                  <ChevronLeft className="w-5 h-5" />
                </span>
              )}
              {next ? (
                <Link
                  href={`/katas/${next.phaseSlug}/${next.slug}/`}
                  className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  title={`Next: ${next.title}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <span className="p-1.5 text-zinc-300 dark:text-zinc-700">
                  <ChevronRight className="w-5 h-5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
                tab.disabled && 'opacity-40 cursor-not-allowed hover:text-zinc-500 dark:hover:text-zinc-400'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {activeTab === 'learn' && <KataContent markdown={kata.readmeRaw} />}

          {activeTab === 'playground' && (
            <PlaygroundViewer kataSlug={kata.slug} hasPlayground={kata.hasPlayground} />
          )}

          {activeTab === 'solutions' && (
            <CodeViewer
              playwrightFiles={playwrightHtml}
              cypressFiles={cypressHtml}
            />
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between">
          {prev ? (
            <Link
              href={`/katas/${prev.phaseSlug}/${prev.slug}/`}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/katas/${next.phaseSlug}/${next.slug}/`}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <span>{next.title}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </footer>
    </div>
  );
}
