'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract headings from the rendered DOM
  useEffect(() => {
    const timer = setTimeout(() => {
      const prose = document.querySelector('.prose');
      if (!prose) return;

      const elements = prose.querySelectorAll('h2, h3');
      const items: TocItem[] = [];

      elements.forEach((el, i) => {
        // Ensure each heading has an id for linking
        if (!el.id) {
          el.id = `heading-${i}-${el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ?? i}`;
        }
        items.push({
          id: el.id,
          text: el.textContent ?? '',
          level: el.tagName === 'H2' ? 2 : 3,
        });
      });

      setHeadings(items);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Track active section with IntersectionObserver
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    // Find the first heading that is intersecting
    for (const entry of entries) {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id);
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0,
    });

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [headings, handleIntersection]);

  if (headings.length < 2) return null;

  return (
    <nav className="hidden 2xl:block fixed right-[max(1rem,calc((100vw-var(--qa-sidebar-w,0px)-64rem)/2-15rem))] top-36 w-56 max-h-[calc(100vh-10rem)] overflow-y-auto">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                'block text-xs leading-relaxed py-0.5 transition-colors',
                h.level === 2 ? 'pl-3' : 'pl-5',
                activeId === h.id
                  ? 'text-accent border-l-2 border-accent -ml-px font-medium'
                  : 'text-muted hover:text-foreground'
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
