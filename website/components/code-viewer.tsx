'use client';

import { useState, useCallback, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FrameworkId } from '@/lib/types';

interface CodeFile {
  filename: string;
  html: string;
}

export interface FrameworkSection {
  id: FrameworkId;
  label: string;
  files: CodeFile[];
}

interface CodeViewerProps {
  frameworks: FrameworkSection[];
}

export function CodeViewer({ frameworks }: CodeViewerProps) {
  const available = useMemo(
    () => frameworks.filter((fw) => fw.files.length > 0),
    [frameworks]
  );

  const [activeId, setActiveId] = useState<FrameworkId | null>(
    available[0]?.id ?? null
  );
  const [fileIndex, setFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const active = available.find((fw) => fw.id === activeId) ?? available[0];
  const files = active?.files ?? [];
  const currentFile = files[fileIndex] ?? null;

  const handleFrameworkChange = useCallback((id: FrameworkId) => {
    setActiveId(id);
    setFileIndex(0);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!currentFile) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = currentFile.html;
    const text = tmp.textContent ?? '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentFile]);

  if (available.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] rounded-lg border border-border bg-background">
        <p className="text-muted">
          No solution files available for this kata.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Framework tabs */}
      <div className="flex items-center gap-0 border-b border-border overflow-x-auto">
        {available.map((fw) => (
          <button
            key={fw.id}
            onClick={() => handleFrameworkChange(fw.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              active?.id === fw.id
                ? 'border-green-600 text-green-700 dark:border-green-400 dark:text-green-400'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {fw.label}
          </button>
        ))}
      </div>

      {/* File sub-tabs (if multiple files) */}
      {files.length > 1 && (
        <div className="flex items-center gap-0 border-b border-border bg-surface/50 overflow-x-auto">
          {files.map((file, i) => (
            <button
              key={file.filename}
              onClick={() => setFileIndex(i)}
              className={cn(
                'px-3 py-1.5 text-xs font-mono transition-colors whitespace-nowrap',
                i === fileIndex
                  ? 'bg-background text-foreground border-b-2 border-accent'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      {/* Code block */}
      {currentFile && (
        <div className="relative group rounded-b-lg border border-t-0 border-border overflow-hidden">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 z-10 p-2 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Filename label */}
          <div className="px-4 py-2 bg-zinc-800 dark:bg-zinc-900 text-xs font-mono text-zinc-400 border-b border-zinc-700 dark:border-zinc-800">
            {currentFile.filename}
          </div>

          {/* Highlighted code */}
          <div
            className="overflow-x-auto text-sm [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!p-4 [&_pre]:!bg-[#24292e]"
            dangerouslySetInnerHTML={{ __html: currentFile.html }}
          />
        </div>
      )}
    </div>
  );
}
