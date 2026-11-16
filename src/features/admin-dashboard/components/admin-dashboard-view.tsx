'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { KpiStatCard, DashboardChartCard } from '@/components/dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type StatPeriod = 'monthly' | 'weekly' | 'yearly';
type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

interface ArbitrationItem {
  id: string;
  family: string;
  doctorOrFacility: string;
  issue: string;
  escrowAmount: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
  avatarText: string;
}

const PERIOD_STATS: Record<
  StatPeriod,
  {
    summary: { total: string; completed: string; scheduled: string; cancelled: string; slaText: string };
    series: { label: string; homeVisits: number; telehealth: number }[];
    peakNote: string;
  }
> = {
  monthly: {
    summary: {
      total: '6.314',
      completed: '4.578',
      scheduled: '1.280',
      cancelled: '456',
      slaText: '4.578 / 6.314 ca (SLA 94.8%)',
    },
    series: [
      { label: 'T5', homeVisits: 720, telehealth: 340 },
      { label: 'T6', homeVisits: 810, telehealth: 390 },
      { label: 'T7', homeVisits: 890, telehealth: 420 },
      { label: 'T8', homeVisits: 940, telehealth: 460 },
      { label: 'T9', homeVisits: 1020, telehealth: 510 },
      { label: 'T10', homeVisits: 1180, telehealth: 580 },
    ],
    peakNote: 'Tháng 10/2026: Đạt đỉnh 280 ca/ngày · Khám tại nhà 68% • Telehealth 32%',
  },
  weekly: {
    summary: {
      total: '1.482',
      completed: '1.190',
      scheduled: '214',
      cancelled: '78',
      slaText: '1.190 / 1.482 ca (SLA 96.2%)',
    },
    series: [
      { label: 'T2', homeVisits: 142, telehealth: 68 },
      { label: 'T3', homeVisits: 158, telehealth: 74 },
      { label: 'T4', homeVisits: 171, telehealth: 82 },
      { label: 'T5', homeVisits: 164, telehealth: 79 },
      { label: 'T6', homeVisits: 186, telehealth: 91 },
      { label: 'T7', homeVisits: 148, telehealth: 72 },
      { label: 'CN', homeVisits: 112, telehealth: 56 },
    ],
    peakNote: 'Tuần hiện tại: Cao điểm Thứ 6 (277 ca/ngày) · Phản hồi TB 11 phút',
  },
  yearly: {
    summary: {
      total: '68.420',
      completed: '54.910',
      scheduled: '9.840',
      cancelled: '3.670',
      slaText: '54.910 / 68.420 ca (SLA 95.4%)',
    },
    series: [
      { label: '2022', homeVisits: 11200, telehealth: 4800 },
      { label: '2023', homeVisits: 18400, telehealth: 8600 },
      { label: '2024', homeVisits: 26900, telehealth: 13200 },
      { label: '2025', homeVisits: 35600, telehealth: 18900 },
      { label: '2026', homeVisits: 45200, telehealth: 23220 },
    ],
    peakNote: 'Tăng trưởng lũy kế 2026: +38.5% lượt khám tại nhà so với cùng kỳ 2025',
  },
};

const appointmentChartConfig = {
  homeVisits: {
    label: 'Khám tại nhà',
    color: 'var(--chart-1)',
  },
  telehealth: {
    label: 'Telehealth HD',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function AdminDashboardView() {
  const [statPeriod, setStatPeriod] = useState<StatPeriod>('monthly');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedArbitration, setSelectedArbitration] = useState<ArbitrationItem | null>(null);

  const kpis = [
    {
      title: 'Doanh thu GMV YTD',
      value: '4.820.500.000 đ',
      change: '+18.4%',
      period: 'so với tháng trước',
      icon: 'payments',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Hợp đồng Hiệu lực',
      value: '3.250 Hộ',
      change: '+142 hộ',
      period: 'trong 7 ngày qua',
      icon: 'family_restroom',
      iconBg: 'bg-primary/10 text-primary',
      badgeBg: 'bg-blue-50 text-primary border-blue-200',
    },
    {
      title: 'Mạng lưới Bác sĩ & CSYT',
      value: '184 BS / 12 BV',
      change: '100%',
      period: 'CCHN BYT thẩm định',
      icon: 'medical_services',
      iconBg: 'bg-sky-50 text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'Tranh chấp Escrow',
      value: '3 Ca khẩn',
      change: 'SLA < 24h',
      period: 'cần xử lý ngay',
      icon: 'gavel',
      iconBg: 'bg-rose-50 text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const pendingArbitrations: ArbitrationItem[] = [
    {
      id: 'DISP-2026-004',
      family: 'Hộ FAM-88219 (Trần Thị Lan)',
      doctorOrFacility: 'BS. Hoàng Gia Bảo / BV ĐH Y Dược',
      issue: 'Gia đình yêu cầu hoàn tiền 50% gói khám tại nhà do bác sĩ trễ hẹn >45p',
      escrowAmount: '1.200.000 đ',
      time: '1 giờ trước',
      severity: 'high',
      avatarText: 'TL',
    },
    {
      id: 'DISP-2026-003',
      family: 'Hộ FAM-11029 (Lê Minh Quân)',
      doctorOrFacility: 'Khoa Dược Bệnh viện Hoàn Mỹ',
      issue: 'Khiếu nại sai lệch danh mục thuốc bảo hiểm trong đơn điện tử 1NF',
      escrowAmount: '850.000 đ',
      time: '3 giờ trước',
      severity: 'medium',
      avatarText: 'MQ',
    },
    {
      id: 'DISP-2026-002',
      family: 'Hộ FAM-44012 (Nguyễn Thu Hà)',
      doctorOrFacility: 'Phòng khám Đa khoa Trustcare',
      issue: 'Tranh chấp phụ phí xét nghiệm sinh hóa máu phát sinh tại nhà',
      escrowAmount: '600.000 đ',
      time: '5 giờ trước',
      severity: 'low',
      avatarText: 'TH',
    },
  ];

  const filteredArbitrations =
    severityFilter === 'all'
      ? pendingArbitrations
      : pendingArbitrations.filter((item) => item.severity === severityFilter);

  const popularDoctors = [
    {
      name: 'PGS.TS Nguyễn Trọng Nghĩa',
      specialty: 'Tim mạch & Lão khoa',
      hospital: 'BV Đại học Y Dược',
      rating: '4.95',
      bookings: '384',
      avatarText: 'TN',
    },
    {
      name: 'ThS.BS Lê Hoàng Yến',
      specialty: 'Sản phụ khoa & Tiền sản',
      hospital: 'Vinmec Central Park',
      rating: '4.92',
      bookings: '296',
      avatarText: 'HY',
    },
    {
      name: 'BS.CKII Trần Thanh Mai',
      specialty: 'Nhi khoa & Tiêm chủng',
      hospital: 'BV Nhi Đồng 1',
      rating: '4.88',
      bookings: '242',
      avatarText: 'TM',
    },
  ];

  const systemHealth = [
    { name: 'Dịch vụ Ký số Chữ ký số SmartCA (Bộ TT&TT)', status: 'Operational', latency: '42ms' },
    { name: 'Cổng Ký quỹ Đảm bảo Escrow (BIDV Open Banking)', status: 'Operational', latency: '110ms' },
    { name: 'Cơ sở dữ liệu Bệnh án Điện tử Mã hóa (HIPAA EMR)', status: 'Operational', latency: '18ms' },
    { name: 'Cổng kết nối CCHN Khám chữa bệnh (Bộ Y Tế API)', status: 'Operational', latency: '85ms' },
  ];

  const activePeriodStats = PERIOD_STATS[statPeriod];

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
              <span>Trang chủ</span>
              <span className="text-slate-300">/</span>
              <span>Quản trị viên</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-primary">Tổng quan Nền tảng</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild className="rounded-xl px-4 text-xs font-bold sm:text-sm">
              <Link href="/admin/packages">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Cấu hình Gói Mới</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm"
            >
              <Link href="/admin/disputes">
                <span className="material-symbols-outlined text-[18px] text-rose-500">gavel</span>
                <span>Phân xử Trọng tài ({pendingArbitrations.length})</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 KPI Cards chuẩn shadcn */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <KpiStatCard
              key={idx}
              title={kpi.title}
              value={kpi.value}
              badgeText={kpi.change}
              badgeClassName={kpi.badgeBg}
              period={kpi.period}
              icon={kpi.icon}
              iconClassName={kpi.iconBg}
            />
          ))}
        </div>

        {/* Main Grid: Appointment Chart & Arbitration Table vs Popular Doctors & Health */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <DashboardChartCard
              title="Thống kê Lịch hẹn & Dịch vụ Y tế"
              description="Tần suất thăm khám tại nhà và Telehealth toàn hệ thống"
              config={appointmentChartConfig}
              action={
                <Tabs
                  value={statPeriod}
                  onValueChange={(value) => setStatPeriod(value as StatPeriod)}
                >
                  <TabsList className="rounded-xl bg-slate-100 p-1">
                    <TabsTrigger
                      value="monthly"
                      className="rounded-lg px-3 text-xs font-semibold data-[state=active]:text-primary"
                    >
                      Tháng
                    </TabsTrigger>
                    <TabsTrigger
                      value="weekly"
                      className="rounded-lg px-3 text-xs font-semibold data-[state=active]:text-primary"
                    >
                      Tuần
                    </TabsTrigger>
                    <TabsTrigger
                      value="yearly"
                      className="rounded-lg px-3 text-xs font-semibold data-[state=active]:text-primary"
                    >
                      Năm
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              }
              headerExtra={
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Tổng cuộc hẹn
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                      {activePeriodStats.summary.total}
                    </h4>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Đã hoàn thành
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                      {activePeriodStats.summary.completed}
                    </h4>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Đang xếp lịch
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                      {activePeriodStats.summary.scheduled}
                    </h4>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Đã hủy / Đổi hẹn
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                      {activePeriodStats.summary.cancelled}
                    </h4>
                  </div>
                </div>
              }
              footer={
                <div className="flex flex-col justify-between gap-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500 sm:flex-row sm:items-center">
                  <span>{activePeriodStats.peakNote}</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {activePeriodStats.summary.slaText}
                  </span>
                </div>
              }
            >
              <AreaChart data={activePeriodStats.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillHomeVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-homeVisits)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-homeVisits)" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="fillTelehealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-telehealth)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-telehealth)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  type="monotone"
                  dataKey="telehealth"
                  stroke="var(--color-telehealth)"
                  strokeWidth={2}
                  fill="url(#fillTelehealth)"
                />
                <Area
                  type="monotone"
                  dataKey="homeVisits"
                  stroke="var(--color-homeVisits)"
                  strokeWidth={2}
                  fill="url(#fillHomeVisits)"
                />
              </AreaChart>
            </DashboardChartCard>

            {/* Arbitration Queue Table */}
            <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/80 bg-white py-0 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <CardHeader className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span className="material-symbols-outlined text-[20px] text-rose-500">gavel</span>
                    <span>Hàng Đợi Trọng Tài &amp; Tranh Chấp Escrow</span>
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-slate-500">
                    Các ca tranh chấp cần trọng tài độc lập giải phóng dòng tiền ký quỹ
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tabs
                    value={severityFilter}
                    onValueChange={(value) => setSeverityFilter(value as SeverityFilter)}
                  >
                    <TabsList className="h-8 rounded-lg bg-slate-100 p-0.5">
                      <TabsTrigger value="all" className="rounded-md px-2.5 text-[11px] font-semibold">
                        Tất cả
                      </TabsTrigger>
                      <TabsTrigger value="high" className="rounded-md px-2.5 text-[11px] font-semibold">
                        Khẩn
                      </TabsTrigger>
                      <TabsTrigger value="medium" className="rounded-md px-2.5 text-[11px] font-semibold">
                        Vừa
                      </TabsTrigger>
                      <TabsTrigger value="low" className="rounded-md px-2.5 text-[11px] font-semibold">
                        Thường
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Link
                    href="/admin/disputes"
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Xem tất cả</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </div>
              </CardHeader>

              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50/80">
                    <TableHead className="px-4 py-3 text-slate-500">Mã / Mức độ</TableHead>
                    <TableHead className="px-4 py-3 text-slate-500">Đại diện Hộ Gia đình</TableHead>
                    <TableHead className="px-4 py-3 text-slate-500">Bác sĩ / Cơ sở</TableHead>
                    <TableHead className="px-4 py-3 text-slate-500">Số tiền Escrow</TableHead>
                    <TableHead className="px-4 py-3 text-right text-slate-500">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-xs">
                  {filteredArbitrations.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/70">
                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-700 tabular-nums">{item.id}</div>
                        <Badge
                          variant="outline"
                          className={`mt-1 rounded-full text-[10px] font-bold ${
                            item.severity === 'high'
                              ? 'border-rose-200 bg-rose-100 text-rose-700'
                              : item.severity === 'medium'
                              ? 'border-amber-200 bg-amber-100 text-amber-700'
                              : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.severity === 'high' ? 'Khẩn (SLA 24h)' : item.severity === 'medium' ? 'Vừa' : 'Thường'}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {item.avatarText}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-slate-900">{item.family}</div>
                            <div className="line-clamp-1 max-w-xs text-[11px] text-slate-500">
                              {item.issue}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{item.doctorOrFacility}</div>
                        <div className="text-[11px] text-slate-500">{item.time}</div>
                      </TableCell>

                      <TableCell className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-rose-600 tabular-nums">{item.escrowAmount}</div>
                        <span className="text-[10px] text-slate-500">Đang đóng băng</span>
                      </TableCell>

                      <TableCell className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => setSelectedArbitration(item)}
                            className="rounded-lg text-xs font-semibold"
                          >
                            Xem nhanh
                          </Button>
                          <Button asChild size="xs" className="rounded-lg px-3 text-xs font-bold">
                            <Link href="/admin/disputes">
                              <span>Xử lý</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Right Column: Popular Doctors & System Health */}
          <div className="space-y-6 lg:col-span-4">
            <Card className="gap-4 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <CardHeader className="flex flex-row items-center justify-between px-5 pb-0">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">
                  Bác Sĩ Nổi Bật
                </CardTitle>
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700"
                >
                  Top Đánh Giá
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3.5 px-5">
                {popularDoctors.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-slate-200 hover:bg-slate-50/70"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#0037c1] to-[#00D3C7] text-xs font-bold text-white shadow-xs">
                          {doc.avatarText}
                        </div>
                        <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-xs font-bold text-slate-900">{doc.name}</h4>
                        <p className="truncate text-[11px] text-slate-500">{doc.specialty}</p>
                        <p className="text-[10px] text-slate-500">{doc.hospital}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500 tabular-nums">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        <span>{doc.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 tabular-nums">{doc.bookings} lượt</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="gap-4 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <CardHeader className="flex flex-row items-center justify-between px-5 pb-0">
                <CardTitle className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
                  <span className="material-symbols-outlined text-[19px] text-emerald-500">cloud_done</span>
                  <span>Hạ Tầng Kỹ Thuật Y Tế</span>
                </CardTitle>
                <span className="text-[11px] font-bold text-emerald-600 tabular-nums">99.98% SLA</span>
              </CardHeader>

              <CardContent className="space-y-3 px-5">
                {systemHealth.map((srv, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between border-b border-slate-100 pb-3 text-xs last:border-b-0 last:pb-0"
                  >
                    <div className="pr-2">
                      <div className="font-semibold text-slate-800">{srv.name}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500 tabular-nums">
                        Độ trễ: {srv.latency}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-md border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                    >
                      {srv.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* HIPAA Audit Banner */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#111827] to-[#1e1b4b] p-5 text-white shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#00D3C7]">shield_person</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Audit Logs Chuẩn HIPAA
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                Mọi truy xuất hồ sơ bệnh án EMR và lệnh giải ngân đều được lưu vết bảo vệ tính bất biến theo chuẩn Bộ Y Tế.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                <span className="text-slate-400 tabular-nums">12.490 sự kiện</span>
                <Link href="/admin/users" className="font-bold text-[#00D3C7] hover:underline">
                  Xem nhật ký
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet xem nhanh hồ sơ tranh chấp Escrow */}
      <Sheet open={Boolean(selectedArbitration)} onOpenChange={(open) => !open && setSelectedArbitration(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedArbitration && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <span className="material-symbols-outlined text-[20px] text-rose-500">gavel</span>
                  <span>Chi tiết Tranh chấp {selectedArbitration.id}</span>
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500">
                  Kiểm tra nhanh chứng từ trước khi điều phối phân xử Escrow
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 text-xs">
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Đại diện Hộ gia đình:</span>
                    <strong className="text-right text-slate-900">{selectedArbitration.family}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Bác sĩ / Cơ sở:</span>
                    <strong className="text-right text-slate-900">{selectedArbitration.doctorOrFacility}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Số tiền Escrow đóng băng:</span>
                    <strong className="text-rose-600 tabular-nums">{selectedArbitration.escrowAmount}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Thời gian tiếp nhận:</span>
                    <span className="text-slate-700">{selectedArbitration.time}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-slate-800">Nội dung khiếu nại</div>
                  <p className="rounded-xl border border-slate-200 bg-white p-3 leading-relaxed text-slate-600">
                    {selectedArbitration.issue}
                  </p>
                </div>
              </div>

              <SheetFooter>
                <Button asChild className="w-full rounded-xl font-bold">
                  <Link href="/admin/disputes">Chuyển tới Trang Phân xử Trọng tài</Link>
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}