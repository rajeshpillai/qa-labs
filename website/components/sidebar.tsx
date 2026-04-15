import { BookOpen } from 'lucide-react';
import { SidebarClient } from './sidebar-client';
import type { Phase } from '@/lib/types';

export interface SidebarProps {
  phases: Phase[];
}

export function Sidebar({ phases }: SidebarProps) {
  return (
    <div className="flex h-full w-[280px] flex-col border-r border-border bg-background">
      {/* Logo / title */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <BookOpen className="h-6 w-6 text-accent shrink-0" />
        <h1 className="text-xl font-bold">
          <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
            QA Labs
          </span>
        </h1>
      </div>

      {/* Scrollable phase list (client component for interactivity) */}
      <SidebarClient phases={phases} />
    </div>
  );
}
