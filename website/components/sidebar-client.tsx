'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Phase } from '@/lib/types';

interface SidebarClientProps {
  phases: Phase[];
}

export function SidebarClient({ phases }: SidebarClientProps) {
  const pathname = usePathname();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    // Start with all phases expanded
    return new Set(phases.map((p) => p.slug));
  });
  const [completedKatas, setCompletedKatas] = useState<Set<string>>(new Set());

  // Load progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('qa-labs-progress');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setCompletedKatas(new Set(parsed));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Auto-expand the phase that contains the current kata
  useEffect(() => {
    for (const phase of phases) {
      for (const kata of phase.katas) {
        const kataPath = `/katas/${phase.slug}/${kata.slug}/`;
        if (pathname === kataPath || pathname === kataPath.slice(0, -1)) {
          setExpandedPhases((prev) => {
            const next = new Set(prev);
            next.add(phase.slug);
            return next;
          });
          break;
        }
      }
    }
  }, [pathname, phases]);

  function togglePhase(slug: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
      {phases.map((phase) => {
        const isExpanded = expandedPhases.has(phase.slug);
        const completedCount = phase.katas.filter((k) =>
          completedKatas.has(`${phase.slug}/${k.slug}`)
        ).length;

        return (
          <div key={phase.slug}>
            {/* Phase header */}
            <button
              onClick={() => togglePhase(phase.slug)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              )}
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-accent/15 text-xs font-bold text-accent shrink-0">
                {phase.number}
              </span>
              <span className="truncate">{phase.name}</span>
              <span className="ml-auto text-xs text-muted shrink-0">
                {completedCount > 0
                  ? `${completedCount}/${phase.katas.length}`
                  : phase.katas.length}
              </span>
            </button>

            {/* Kata list */}
            {isExpanded && (
              <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                {phase.katas.map((kata) => {
                  const kataPath = `/katas/${phase.slug}/${kata.slug}/`;
                  const isActive =
                    pathname === kataPath ||
                    pathname === kataPath.slice(0, -1);
                  const isCompleted = completedKatas.has(
                    `${phase.slug}/${kata.slug}`
                  );

                  return (
                    <li key={kata.slug}>
                      <Link
                        href={kataPath}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-accent/15 text-accent font-medium'
                            : 'text-muted hover:text-foreground hover:bg-surface'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                        )}
                        <span className="truncate">
                          {kata.number}. {kata.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
