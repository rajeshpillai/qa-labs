'use client';

import { useRef } from 'react';
import { ExternalLink, RotateCw } from 'lucide-react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface PlaygroundViewerProps {
  kataSlug: string;
  hasPlayground: boolean;
}

export function PlaygroundViewer({ kataSlug, hasPlayground }: PlaygroundViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playgroundUrl = `${basePath}/playgrounds/${kataSlug}/index.html`;

  if (!hasPlayground) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          No playground available for this kata.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 rounded-t-lg border border-b-0 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
        <button
          onClick={() => iframeRef.current?.contentWindow?.location.reload()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Reload
        </button>
        <a
          href={playgroundUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>
      </div>

      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={playgroundUrl}
        className="w-full min-h-[600px] rounded-b-lg border border-zinc-200 dark:border-zinc-800 bg-white"
        title={`Playground for ${kataSlug}`}
      />
    </div>
  );
}
