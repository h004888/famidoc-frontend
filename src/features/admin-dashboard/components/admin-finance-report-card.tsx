'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardAction, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AdminFinanceReport } from '@/lib/api/admin.api';
import { formatCurrencyVND } from '@/lib/utils';

const chartConfig = {
  receivedVnd: { label: 'Tiền thu', color: '#0f766e' },
  paidVnd: { label: 'Chi trả CSYT', color: '#b45309' },
} satisfies ChartConfig;
const compactAmount = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 });

type AdminFinanceReportCardProps = {
  year: number;
  currentYear: number;
  onYearChange: (year: number) => void;
  report?: AdminFinanceReport;
  loading: boolean;
  error?: string;
};

export function AdminFinanceReportCard({ year, currentYear, onYearChange, report, loading, error }: AdminFinanceReportCardProps) {
  const years = Array.from({ length: currentYear - 1999 }, (_, index) => currentYear - index);
  const chartData = report?.months.map((row) => ({ ...row, label: `T${row.month}` }));
  const hasMovements = report?.months.some(({ receivedVnd, paidVnd }) => receivedVnd !== 0 || paidVnd !== 0);

  return (
    <Card role="region" aria-labelledby="admin-finance-report-title" className="gap-4 rounded-2xl border-slate-200/80 bg-white py-5">
      <CardHeader className="px-4 sm:px-5">
        <h2 id="admin-finance-report-title" className="text-base font-bold text-slate-900">Báo cáo tài chính năm</h2>
        <CardDescription>
          Hóa đơn đã thanh toán và khoản chi trả CSYT đã xác nhận, theo tháng thực thu và thực chi.
        </CardDescription>
        <CardAction>
          <select
            aria-label="Năm báo cáo tài chính"
            className="h-9 rounded-md border bg-white px-2 text-sm tabular-nums"
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-5" aria-busy={loading}>
        {loading && <p role="status" className="text-sm text-muted-foreground">Đang tải báo cáo tài chính…</p>}
        {error && <p role="alert" className="text-sm text-destructive">Không tải được báo cáo tài chính. Vui lòng thử lại.</p>}
        {report && <>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2.5">
              <dt className="text-sm text-teal-800">Tổng tiền thu</dt>
              <dd className="wrap-anywhere text-lg font-bold tabular-nums text-teal-900">{formatCurrencyVND(report.totals.receivedVnd)}</dd>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
              <dt className="text-sm text-amber-800">Tổng chi trả CSYT</dt>
              <dd className="wrap-anywhere text-lg font-bold tabular-nums text-amber-900">{formatCurrencyVND(report.totals.paidVnd)}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <dt className="text-sm text-slate-600">Chênh lệch thu chi</dt>
              <dd className="wrap-anywhere text-lg font-bold tabular-nums text-slate-900">{formatCurrencyVND(report.totals.netVnd)}</dd>
            </div>
          </dl>
          {hasMovements ? (
            <div className="overflow-x-auto">
              <ChartContainer config={chartConfig} className="aspect-auto h-64 min-w-[520px]">
                <BarChart data={chartData} accessibilityLayer barGap={4} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" interval={0} tickLine={false} axisLine={false} />
                  <YAxis width={66} allowDecimals={false} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${compactAmount.format(value)} ₫`} />
                  <ChartTooltip content={<ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-3">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-medium tabular-nums">{formatCurrencyVND(Number(value))}</span>
                      </div>
                    )}
                  />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="receivedVnd" name={chartConfig.receivedVnd.label} fill="var(--color-receivedVnd)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="paidVnd" name={chartConfig.paidVnd.label} fill="var(--color-paidVnd)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-muted-foreground">
              Chưa có khoản thu hoặc chi trả CSYT được ghi nhận trong năm {report.year}.
            </p>
          )}
          <details className="rounded-xl border border-slate-200">
            <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-slate-800">Xem số liệu từng tháng</summary>
            <Table aria-label={`Thu và chi trả từng tháng năm ${report.year}`} className="min-w-72">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead scope="col" className="px-3">Tháng</TableHead>
                  <TableHead scope="col" className="px-3 text-right">Tiền thu</TableHead>
                  <TableHead scope="col" className="px-3 text-right">Chi trả CSYT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.months.map(({ month, receivedVnd, paidVnd }) => (
                  <TableRow key={month}>
                    <TableHead scope="row" className="px-3 text-slate-700">Tháng {month}</TableHead>
                    <TableCell className="px-3 text-right tabular-nums">{formatCurrencyVND(receivedVnd)}</TableCell>
                    <TableCell className="px-3 text-right tabular-nums">{formatCurrencyVND(paidVnd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </details>
        </>}
      </CardContent>
    </Card>
  );
}
