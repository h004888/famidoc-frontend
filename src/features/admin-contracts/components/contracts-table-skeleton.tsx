import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ContractsTableSkeletonProps {
  columns: number;
  rows?: number;
}

export function ContractsTableSkeleton({ columns, rows = 5 }: ContractsTableSkeletonProps) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden py-0 gap-0" aria-busy="true">
      <Table className="text-xs sm:text-sm">
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
            {Array.from({ length: columns }).map((_, idx) => (
              <TableHead key={idx} className="py-3.5 px-4">
                <Skeleton className="h-3.5 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((__, colIdx) => (
                <TableCell key={colIdx} className="py-3.5 px-4">
                  <Skeleton className="h-4 w-full max-w-[160px]" />
                  <Skeleton className="mt-1.5 h-3 w-20" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
