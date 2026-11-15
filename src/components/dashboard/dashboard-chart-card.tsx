'use client';

import React from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export interface DashboardChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  config: ChartConfig;
  chartClassName?: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ComponentProps<typeof ChartContainer>['children'];
}

/**
 * Shared chart card wrapper built on shadcn Card and Recharts ChartContainer.
 */
export function DashboardChartCard({
  title,
  description,
  action,
  config,
  chartClassName,
  headerExtra,
  footer,
  className,
  children,
}: DashboardChartCardProps) {
  return (
    <Card
      className={cn(
        '@container/card gap-4 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]',
        className
      )}
    >
      <CardHeader className="px-5 pb-0">
        <CardTitle className="text-base font-bold tracking-tight text-slate-900">{title}</CardTitle>
        {description && <CardDescription className="text-xs text-slate-500">{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>

      <CardContent className="space-y-4 px-5">
        {headerExtra}
        <ChartContainer config={config} className={cn('aspect-auto h-[230px] w-full', chartClassName)}>
          {children}
        </ChartContainer>
        {footer}
      </CardContent>
    </Card>
  );
}
