import React from 'react';
import { cn } from '@/lib/utils';

export interface DashboardPageShellProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

/**
 * Standardized dashboard page container rendered inside SidebarInset (<main>).
 * Uses a <div> wrapper to avoid nested <main> landmarks while enforcing consistent
 * max-width and responsive horizontal/vertical padding across all dashboard portals.
 */
export function DashboardPageShell({
  children,
  className,
  containerClassName,
}: DashboardPageShellProps) {
  return (
    <div className={cn('min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased', className)}>
      <div
        className={cn(
          'mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
          containerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
