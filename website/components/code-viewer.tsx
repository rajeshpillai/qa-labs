'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeFile {
  filename: string;
  html: string;
}

interface CodeViewerProps {
  playwrightFiles: CodeFile[];
  cypressFiles: CodeFile[];
}

type Framework = 'playwright' | 'cypress';

export function CodeViewer({ playwrightFiles, cypressFiles }: CodeViewerProps) {
  const hasPlaywright = playwrightFiles.length > 0;
  const hasCypress = cypressFiles.length > 0;

  const [framework, setFramework] = useState<Framework>(
    hasPlaywright ? 'playwright' : 'cypress'
  );
  const [fileIndex, setFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const files = framework === 'playwright' ? playwrightFiles : cypressFiles;
  const currentFile = files[fileIndex] ?? null;

  const handleFrameworkChange = useCallback((fw: Framework) => {
    setFramework(fw);
    setFileIndex(0);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!currentFile) return;
    // Extract text content from HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = currentFile.html;
    const text = tmp.textContent ?? '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentFile]);

  if (!hasPlaywright && !hasCypress) {
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
      <div className="flex items-center gap-0 border-b border-border">
        {hasPlaywright && (
          <button
            onClick={() => handleFrameworkChange('playwright')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              framework === 'playwright'
                ? 'border-green-600 text-green-700 dark:border-green-400 dark:text-green-400'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            Playwright
          </button>
        )}
        {hasCypress && (
          <button
            onClick={() => handleFrameworkChange('cypress')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              framework === 'cypress'
                ? 'border-green-600 text-green-700 dark:border-green-400 dark:text-green-400'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            Cypress
          </button>
        )}
      </div>

      {/* File sub-tabs (if multiple files) */}
      {files.length > 1 && (
        <div className="flex items-center gap-0 border-b border-border bg-surface/50">
          {files.map((file, i) => (
            <button
              key={file.filename}
              onClick={() => setFileIndex(i)}
              className={cn(
                'px-3 py-1.5 text-xs font-mono transition-colors',
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
