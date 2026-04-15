'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { isKataComplete, setKataComplete } from '@/lib/progress';

interface ProgressTrackerProps {
  kataSlug: string;
}

export function ProgressTracker({ kataSlug }: ProgressTrackerProps) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isKataComplete(kataSlug));
  }, [kataSlug]);

  const toggle = () => {
    const next = !completed;
    setKataComplete(kataSlug, next);
    setCompleted(next);
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-surface"
      title={completed ? 'Mark as incomplete' : 'Mark as completed'}
    >
      {completed ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-400">Completed</span>
        </>
      ) : (
        <>
          <Circle className="w-4 h-4 text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400">Mark complete</span>
        </>
      )}
    </button>
  );
}
