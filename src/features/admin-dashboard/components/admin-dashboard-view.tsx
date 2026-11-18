'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { DashboardChartCard, KpiStatCard } from '@/components/dashboard';
import { PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminQuotaProposalsPanel } from '@/features/admin-doctors/components/admin-quota-proposals-panel';
import { AdminMatchingQueuePanel } from '@/features/admin-doctors/components/admin-matching-queue-panel';
import { adminApi, complaintStatusLabel, type AdminComplaint, type AdminPeriod } from '@/lib/api/admin.api';
import { useAdminQuery } from '@/hooks/use-admin-query';
import { formatCurrencyVND } from '@/lib/utils';

const chartConfig = {
  HOME_VISIT: { label: 'Tại nhà', color: 'var(--chart-1)' },
  TELEHEALTH: { label: 'Video', color: 'var(--chart-2)' },
  FACILITY_VISIT: { label: 'Tại cơ sở', color: 'var(--chart-3)' },
} satisfies ChartConfig;
const number = new Intl.NumberFormat('vi-VN');

export function AdminDashboardView() {
  const [period, setPeriod] = useState<AdminPeriod>('monthly');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [selected, setSelected] = useState<AdminComplaint | null>(null);
  const load = useCallback(() => adminApi.overview(period, environment), [period, environment]);
  const { data, error, loading, refresh } = useAdminQuery(load);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Tổng quan nền tảng"
        actions={<>
          <select aria-label="Môi trường tổng quan" className="h-9 rounded-md border bg-white px-2 text-sm" value={environment}
            onChange={(event) => { setEnvironment(event.target.value as typeof environment); setSelected(null); }}>
            <option value="LIVE">LIVE · Dữ liệu thật</option>
            <option value="TEST">TEST · Dữ liệu thử</option>
          </select>
          <Button variant="outline" onClick={refresh} disabled={loading}>Làm mới</Button>
          <Button asChild><Link href="/admin/packages">Quản lý gói dịch vụ</Link></Button>
        </>}
      />
      <Tabs value={period} onValueChange={(value) => setPeriod(value as AdminPeriod)}>
        <TabsList aria-label="Kỳ thống kê lịch hẹn">
          <TabsTrigger value="weekly">Tuần</TabsTrigger>
          <TabsTrigger value="monthly">Tháng</TabsTrigger>
          <TabsTrigger value="yearly">Năm</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading && <p role="status" className="text-sm text-muted-foreground">Đang tải thống kê…</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {data && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiStatCard title="Tiền đã thu từ đầu năm" value={formatCurrencyVND(data.gmvVnd)} icon="payments" />
          <KpiStatCard title="Hợp đồng hiệu lực" value={number.format(data.activeContracts)} icon="family_restroom" />
          <KpiStatCard title="Bác sĩ / CSYT đang hoạt động" value={`${data.doctors} / ${data.facilities}`} icon="medical_services" />
          <KpiStatCard title="Khiếu nại đang mở" value={number.format(data.openComplaints)} icon="gavel" />
        </div>
        <DashboardChartCard title="Lịch hẹn theo loại dịch vụ" config={chartConfig} headerExtra={
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {([
              ['Tổng lượt', data.counts.total],
              ['Hoàn thành', data.counts.completed],
              ['Đang xử lý', data.counts.pending],
              ['Đã hủy', data.counts.cancelled],
            ] as const).map(([label, count]) => (
              <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="text-lg font-semibold tabular-nums">{number.format(count)}</dd></div>
            ))}
          </dl>
        }>
          <BarChart data={data.series} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="HOME_VISIT" fill="var(--color-HOME_VISIT)" stackId="encounters" />
            <Bar dataKey="TELEHEALTH" fill="var(--color-TELEHEALTH)" stackId="encounters" />
            <Bar dataKey="FACILITY_VISIT" fill="var(--color-FACILITY_VISIT)" stackId="encounters" />
          </BarChart>
        </DashboardChartCard>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Khiếu nại đang mở gần đây</CardTitle>
            <Button asChild size="sm" variant="outline"><Link href="/admin/disputes">Xem danh sách</Link></Button>
          </CardHeader>
          <CardContent className="divide-y">
            {data.queue.length === 0 && <p className="text-sm text-muted-foreground">Không có khiếu nại đang mở.</p>}
            {data.queue.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{item.complaintCode}</p>
                  <p className="text-muted-foreground">{item.contract?.facility?.facilityName}</p>
                </div>
                <Badge variant="outline">{complaintStatusLabel[item.status]}</Badge>
                <Button size="sm" variant="outline" onClick={() => setSelected(item)}>Xem nhanh</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </>}
      <AdminQuotaProposalsPanel />
      <AdminMatchingQueuePanel />
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Khiếu nại {selected?.complaintCode}</DialogTitle>
            <DialogDescription>{selected && complaintStatusLabel[selected.status]}</DialogDescription>
          </DialogHeader>
          <p className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-sm">{selected?.description}</p>
          <Button asChild><Link href="/admin/disputes">Mở mục Xử lý khiếu nại</Link></Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
