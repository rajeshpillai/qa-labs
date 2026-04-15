'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KataSearchItem {
  slug: string;
  phaseSlug: string;
  title: string;
  phaseName: string;
  number: number;
}

interface SearchProps {
  allKatas: KataSearchItem[];
}

export function Search({ allKatas }: SearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allKatas.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.phaseName.toLowerCase().includes(q) ||
        String(k.number).padStart(2, '0').includes(q)
    );
  }, [query, allKatas]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery('');
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const handleSelect = useCallback(
    (kata: KataSearchItem) => {
      handleClose();
      router.push(`/katas/${kata.phaseSlug}/${kata.slug}/`);
    },
    [handleClose, router]
  );

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          handleClose();
        } else {
          handleOpen();
        }
      }
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleOpen, handleClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <SearchIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Search katas...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <SearchIcon className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search katas by name or phase..."
                className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
              <button
                onClick={handleClose}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {query.trim() && results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No katas found for &ldquo;{query}&rdquo;
                </div>
              )}
              {results.map((kata) => (
                <button
                  key={kata.slug}
                  onClick={() => handleSelect(kata)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-white',
                      'bg-zinc-600'
                    )}
                  >
                    {kata.phaseName}
                  </span>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100">
                    Kata {String(kata.number).padStart(2, '0')}: {kata.title}
                  </span>
                </button>
              ))}
              {!query.trim() && (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  Type to search across all 44 katas...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
