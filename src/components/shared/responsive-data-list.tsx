import React from 'react';
import { Card } from '@/components/ui/card';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';

export interface ResponsiveDataListProps<T> {
  items: T[];
  keyExtractor: (item: T, index: number) => string;
  renderDesktopTable: () => React.ReactNode;
  renderMobileCard: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

/**
 * Renders a desktop table on md+ viewports and a stacked card list on < md viewports.
 */
export function ResponsiveDataList<T>({
  items,
  keyExtractor,
  renderDesktopTable,
  renderMobileCard,
  isLoading = false,
  loadingText = 'Đang tải dữ liệu...',
  emptyTitle = 'Không có dữ liệu phù hợp',
  emptyDescription,
  emptyIcon = 'inbox',
  emptyAction,
  className,
}: ResponsiveDataListProps<T>) {
  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border-slate-200/90 shadow-xs', className)}>
        <div
          className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500"
          role="status"
        >
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
          <span className="text-xs font-medium sm:text-sm">{loadingText}</span>
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <Card className={cn('overflow-hidden rounded-2xl border-slate-200/90 py-0 gap-0 shadow-xs', className)}>
      <div className="hidden md:block">{renderDesktopTable()}</div>
      <div className="divide-y divide-slate-100 md:hidden">
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)}>{renderMobileCard(item, index)}</div>
        ))}
      </div>
    </Card>
  );
}
