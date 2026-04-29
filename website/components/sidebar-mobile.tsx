'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { SidebarClient } from './sidebar-client';
import type { Phase } from '@/lib/types';

interface MobileHeaderProps {
  phases: Phase[];
}

export function MobileHeader({ phases }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3 lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-5 w-5 text-accent" />
          <span className="text-base font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            QA Labs
          </span>
        </Link>

        <ThemeToggle />
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[53px] lg:hidden" />

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[280px] transform bg-background border-r border-border transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
              QA Labs
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content */}
        <SidebarClient phases={phases} />
      </div>
    </>
  );
}
