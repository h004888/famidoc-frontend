import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface KpiStatCardProps {
  title: string;
  value: React.ReactNode;
  badgeText?: string;
  badgeClassName?: string;
  period?: string;
  subtitle?: string;
  icon: string;
  iconClassName?: string;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Shared KPI summary card aligned with shadcn @container/card and FamiDoc Clinical Prestige tokens.
 */
export function KpiStatCard({
  title,
  value,
  badgeText,
  badgeClassName,
  period,
  subtitle,
  icon,
  iconClassName,
  footer,
  className,
}: KpiStatCardProps) {
  return (
    <Card
      className={cn(
        '@container/card gap-0 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-md',
        className
      )}
    >
      <CardContent className="px-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
              iconClassName
            )}
          >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
          </span>

          {(badgeText || period) && (
            <div className="text-right">
              {badgeText && (
                <Badge
                  variant="outline"
                  className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', badgeClassName)}
                >
                  {badgeText}
                </Badge>
              )}
              {period && <p className="mt-0.5 text-[11px] text-slate-500">{period}</p>}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <div className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 tabular-nums @[220px]/card:text-2xl">
            {value}
          </div>
          {subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}
          {footer && <div className="mt-2">{footer}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
