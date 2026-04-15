'use client';

import { useRef, useState } from 'react';
import { ExternalLink, RotateCw, Loader2 } from 'lucide-react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface PlaygroundViewerProps {
  kataSlug: string;
  hasPlayground: boolean;
}

export function PlaygroundViewer({ kataSlug, hasPlayground }: PlaygroundViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const playgroundUrl = `${basePath}/playgrounds/${kataSlug}/index.html`;

  if (!hasPlayground) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-lg border border-border bg-background">
        <p className="text-muted">
          No playground available for this kata.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 rounded-t-lg border border-b-0 border-border bg-surface">
        <button
          onClick={() => iframeRef.current?.contentWindow?.location.reload()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-background border border-border text-foreground hover:bg-surface transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Reload
        </button>
        <a
          href={playgroundUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-background border border-border text-foreground hover:bg-surface transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>
      </div>

      {/* iframe */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-b-lg border border-border bg-background min-h-[600px]">
            <div className="flex items-center gap-2 text-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading playground...</span>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={playgroundUrl}
          onLoad={() => setLoading(false)}
          className="w-full min-h-[600px] rounded-b-lg border border-border bg-white"
          title={`Playground for ${kataSlug}`}
        />
      </div>
    </div>
  );
}
