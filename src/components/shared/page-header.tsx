import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface PageBreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  breadcrumbs?: PageBreadcrumbItem[];
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standardized page header with optional breadcrumb trail, title, badge, and action slots.
 */
export function PageHeader({
  breadcrumbs,
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Đường dẫn trang" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  {index > 0 && <span className="text-slate-300">/</span>}
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="transition-colors hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn(isLast && 'font-semibold text-primary')}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {badge}
        </div>

        {description && <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
