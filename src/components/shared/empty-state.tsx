import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Standardized empty state card with Material Symbol icon, title, message, and optional CTA.
 */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('rounded-2xl border-slate-200/80 bg-white shadow-2xs', className)}>
      <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h3>
        {description && <p className="mt-1 max-w-md text-xs text-slate-500 sm:text-sm">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
