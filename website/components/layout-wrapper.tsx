'use client';

import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/sidebar-mobile';
import { ThemeToggle } from '@/components/theme-toggle';
import type { Phase } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LayoutWrapperProps {
  phases: Phase[];
  children: React.ReactNode;
}

export function LayoutWrapper({ phases, children }: LayoutWrapperProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:fixed lg:inset-y-0 lg:z-30 transition-all duration-300',
          collapsed ? 'lg:w-0 lg:overflow-hidden' : 'lg:w-[280px]'
        )}
      >
        <Sidebar phases={phases} />
      </aside>

      {/* Desktop top bar: collapse toggle + theme toggle */}
      <div className="hidden lg:flex fixed top-4 right-4 z-30 items-center gap-2">
        <ThemeToggle />
      </div>

      {/* Sidebar collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'hidden lg:flex fixed top-4 z-40 p-2 rounded-md transition-all duration-300',
          'bg-surface border border-border text-muted hover:text-foreground hover:bg-background',
          collapsed ? 'left-4' : 'left-[244px]'
        )}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="w-4 h-4" />
        ) : (
          <PanelLeftClose className="w-4 h-4" />
        )}
      </button>

      {/* Mobile header + sidebar drawer */}
      <MobileHeader phases={phases} />

      {/* Main content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'lg:pl-0' : 'lg:pl-[280px]'
        )}
      >
        <div className="mx-auto max-w-4xl px-6 py-8 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
