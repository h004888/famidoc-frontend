'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { facilitiesApi, type FacilityOverviewDto } from '@/lib/api/facilities.api';
import { contractsApi, type StaffingContractItem } from '@/lib/api/contracts.api';
import { extractErrorMessage } from '@/lib/api';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { KpiStatCard, DashboardChartCard } from '@/components/dashboard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const channelChartConfig = {
  visits: {
    label: 'Lượt khám',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const ENCOUNTER_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  HOME_VISIT: {
    label: 'Khám tại nhà',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  TELEHEALTH: {
    label: 'Telehealth',
    className: 'border-teal-200 bg-teal-50 text-teal-700',
  },
  FACILITY_VISIT: {
    label: 'Tại cơ sở',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
};

const ENCOUNTER_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  REQUESTED: {
    label: 'Chờ xác nhận',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  IN_PROGRESS: {
    label: 'Đang khám',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  COMPLETED: {
    label: 'Hoàn tất',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
};

function formatDateVi(rawDate: string): string {
  if (!rawDate) return '—';
  const parts = rawDate.slice(0, 10).split('-');
  if (parts.length !== 3) return rawDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'BN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function FacilityDashboardView() {
  const [facilityName, setFacilityName] = useState<string>('Cơ sở Y tế Đối tác');
  const [facilityCode, setFacilityCode] = useState<string>('CSYT-VN');
  const [isFacilityActive, setIsFacilityActive] = useState<boolean | null>(null);
  const [hasActiveB2b, setHasActiveB2b] = useState<boolean>(false);
  const [legalRejectionReason, setLegalRejectionReason] = useState<string | null>(null);
  const [pendingContract, setPendingContract] = useState<StaffingContractItem | null>(null);

  const [overview, setOverview] = useState<FacilityOverviewDto | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (isMountedCheck?: () => boolean) => {
    setIsLoadingOverview(true);
    setOverviewError(null);

    const profilePromise = facilitiesApi.getMyFacilityProfile().catch(() => null);
    const overviewPromise = facilitiesApi.getMyOverview();

    const [profileSettled, overviewResult] = await Promise.allSettled([
      profilePromise,
      overviewPromise,
    ]);

    if (isMountedCheck && !isMountedCheck()) return;

    const data = profileSettled.status === 'fulfilled' ? profileSettled.value : null;
    if (data) {
      if (data.facilityName) setFacilityName(data.facilityName);
      if (data.id) setFacilityCode(data.id);
      const active = Boolean(data.verificationStatus === 'ACTIVE' || data.status === 'ACTIVE');
      setIsFacilityActive(active);
      setHasActiveB2b(Boolean(data.hasActiveStaffingContract));
      setLegalRejectionReason(data.legalRejectionReason ?? null);

      if (active) {
        contractsApi
          .getStaffingContracts()
          .then((res) => {
            if (isMountedCheck && !isMountedCheck()) return;
            if (res && Array.isArray(res.data)) {
              const activeB2bFromList = res.data.some((c) => c.status === 'ACTIVE');
              if (activeB2bFromList) {
                setHasActiveB2b(true);
              }
              const draft = res.data.find(
                (c) =>
                  c.rawStatus === 'PENDING_FACILITY_SIGNATURE' ||
                  (c.status === 'DRAFT' &&
                    c.rawStatus !== 'REVISION_REQUESTED' &&
                    !c.facilitySigned)
              );
              setPendingContract(draft || null);
            }
          })
          .catch(() => {});
      }
    }

    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value);
      if (overviewResult.value.revenue.activeB2bContractCode) {
        setHasActiveB2b(true);
      }
    } else {
      setOverview(null);
      setOverviewError(
        extractErrorMessage(
          overviewResult.reason,
          'Không thể tải số liệu tổng quan vận hành của cơ sở y tế.'
        )
      );
    }

    setIsLoadingOverview(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    void loadDashboardData(() => isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadDashboardData]);

  const stats = overview
    ? [
        {
          title: 'Bác sĩ trực thuộc',
          value: overview.doctors.total.toLocaleString('vi-VN'),
          subtitle: `${overview.doctors.active} đang hoạt động • ${overview.doctors.pending} chờ duyệt`,
          change: `${overview.doctors.active} hoạt động`,
          icon: 'badge',
          iconBg: 'bg-primary/10 text-primary',
          badgeBg: 'bg-blue-50 text-primary border-blue-200',
        },
        {
          title: 'Lượt khám tháng này',
          value: overview.encounters.total.toLocaleString('vi-VN'),
          subtitle: `${overview.encounters.completed} hoàn tất • ${overview.encounters.confirmed + overview.encounters.inProgress} đang/sắp khám`,
          change: `Tháng ${overview.encounters.month}/${overview.encounters.year}`,
          icon: 'medical_services',
          iconBg: 'bg-emerald-50 text-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        {
          title: 'Tỷ lệ hoàn thành lịch khám',
          value: `${overview.encounters.completionRatePercent}%`,
          subtitle: `Panel Cap ${overview.doctors.panelUtilizationPercent}% (${overview.doctors.activePanelCount}/${overview.doctors.maxPanelCapacity} hộ)`,
          change: `${overview.encounters.completed}/${overview.encounters.total} ca`,
          icon: 'verified',
          iconBg: 'bg-sky-50 text-sky-600',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        },
        {
          title: 'Doanh thu B2B tháng này',
          value: vndFormatter.format(overview.revenue.facilityShareVnd),
          subtitle: `Tổng thu ${vndFormatter.format(overview.revenue.grossVnd)} • ${overview.revenue.invoiceCount} hóa đơn`,
          change: `${overview.revenue.facilitySharePercent}/${overview.revenue.platformSharePercent}`,
          icon: 'payments',
          iconBg: 'bg-amber-50 text-amber-600',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        },
      ]
    : [];

  const totalEncounters = overview?.encounters.total ?? 0;
  const homeCount = overview?.encounters.byChannel.HOME_VISIT ?? 0;
  const teleCount = overview?.encounters.byChannel.TELEHEALTH ?? 0;
  const facilityCount = overview?.encounters.byChannel.FACILITY_VISIT ?? 0;
  const calcChannelPct = (count: number) =>
    totalEncounters > 0 ? Math.round((count / totalEncounters) * 100) : 0;

  const channelChartData = [
    {
      channel: 'Tại nhà',
      visits: homeCount,
      share: `${calcChannelPct(homeCount)}%`,
      fill: 'var(--chart-1)',
    },
    {
      channel: 'Telehealth',
      visits: teleCount,
      share: `${calcChannelPct(teleCount)}%`,
      fill: 'var(--chart-2)',
    },
    {
      channel: 'Tại BV',
      visits: facilityCount,
      share: `${calcChannelPct(facilityCount)}%`,
      fill: 'var(--chart-3)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Facility Header Banner */}
        <Card className="rounded-2xl border-slate-200/80 bg-white py-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <CardContent className="flex flex-col items-start justify-between gap-5 px-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0037c1] to-[#00D3C7] text-white shadow-md ring-4 ring-primary/10">
                <span className="material-symbols-outlined text-[30px]">local_hospital</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {facilityName}
                  </h1>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Mã định danh BYT: <span className="font-bold text-slate-700 tabular-nums">{facilityCode}</span> •
                  Phụ trách mạng lưới Bác sĩ Gia đình FamiDoc
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-2.5 md:w-auto">
              {isFacilityActive === true ? (
                hasActiveB2b ? (
                  <>
                    <Button asChild className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold sm:text-sm md:flex-none">
                      <Link href="/facility/doctors">
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        <span>Quản lý Bác sĩ</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex-1 rounded-xl border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:text-sm md:flex-none"
                    >
                      <Link href="/facility/coordination">
                        <span className="material-symbols-outlined text-[18px] text-primary">rule_settings</span>
                        <span>Điều phối viện</span>
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold sm:text-sm md:flex-none">
                    <Link
                      href={
                        pendingContract
                          ? `/facility/contracts/${pendingContract.id}`
                          : '/facility/contracts'
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">contract_edit</span>
                      <span>
                        {pendingContract ? 'Xem & Ký Hợp đồng B2B' : 'Hợp đồng Hợp tác B2B'}
                      </span>
                    </Link>
                  </Button>
                )
              ) : (
                <Button asChild className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 sm:text-sm md:flex-none">
                  <Link href="/facility/legal-profile">
                    <span className="material-symbols-outlined text-[18px]">policy</span>
                    <span>Hoàn thiện Hồ sơ Pháp lý</span>
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Banner: Hoàn thiện hồ sơ pháp lý khi chưa ACTIVE */}
        {isFacilityActive === false && (
          <div className="p-4 sm:p-5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <span className="material-symbols-outlined text-base">policy</span>
                <span>Tài khoản cơ sở y tế đang chờ duyệt pháp lý</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
                {legalRejectionReason
                  ? `Hồ sơ pháp lý cần bổ sung: "${legalRejectionReason}". Vui lòng cập nhật và nộp lại để Admin kích hoạt.`
                  : 'Vui lòng hoàn thiện và nộp hồ sơ pháp lý (GPHĐ, Mã số thuế, Tài khoản ngân hàng và bản scan PDF/Ảnh). Các chức năng B2B & quản lý bác sĩ sẽ tự động mở khóa sau khi Admin duyệt.'}
              </p>
            </div>
            <Link
              href="/facility/legal-profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all shrink-0 self-start md:self-auto"
            >
              <span>Nộp / Cập nhật Hồ sơ Pháp lý</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Action Banner: Hợp đồng B2B chờ ký kết (Flow 2.1) */}
        {pendingContract && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Hợp đồng Hợp tác B2B cần hoàn tất ký số
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {pendingContract.contractNumber} ({pendingContract.facilitySharePercent}% Doanh thu CSYT)
              </h3>
              <p className="text-xs text-slate-300">
                Quản trị viên FamiDoc đã phát hành dự thảo hợp đồng B2B. Cơ sở y tế vui lòng xem xét và ký số Bước 1 để hoàn tất kích hoạt với FamiDoc.
              </p>
            </div>

            <Link
              href={`/facility/contracts/${pendingContract.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all shrink-0 self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-base">draw</span>
              <span>Xem &amp; Ký số ngay</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Loading State */}
        {isLoadingOverview && !overview && (
          <div role="status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4].map((idx) => (
              <Card key={idx} className="h-32 animate-pulse rounded-2xl border-slate-200/80 bg-white p-5">
                <div className="h-4 w-28 rounded bg-slate-100" />
                <div className="mt-4 h-7 w-20 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-40 rounded bg-slate-100" />
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {overviewError && !isLoadingOverview && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-rose-600">error</span>
              <div>
                <p className="text-sm font-bold">Không thể tải dữ liệu tổng quan cơ sở y tế</p>
                <p className="mt-0.5 text-xs text-rose-800">{overviewError}</p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => void loadDashboardData()}
              className="shrink-0 cursor-pointer rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Real Overview Content */}
        {overview && !overviewError && (
          <>
            {/* 4 Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {stats.map((s, idx) => (
                <KpiStatCard
                  key={idx}
                  title={s.title}
                  value={s.value}
                  badgeText={s.change}
                  badgeClassName={s.badgeBg}
                  subtitle={s.subtitle}
                  icon={s.icon}
                  iconClassName={s.iconBg}
                />
              ))}
            </div>

            {/* Recent Encounters & Operational Metrics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Recent Encounters & Pending Reschedules (8 cols) */}
              <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/80 bg-white py-0 shadow-[0_2px_8px_rgba(0,0,0,0.03)] lg:col-span-8">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-5">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                      <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
                      <span>Lịch Khám &amp; Điều Phối Gần Đây</span>
                      {overview.pendingRescheduleCount > 0 && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 tabular-nums"
                        >
                          {overview.pendingRescheduleCount} đổi lịch chờ duyệt
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-xs text-slate-500">
                      Các buổi khám gần nhất của bác sĩ trực thuộc cơ sở y tế trong hệ thống
                    </CardDescription>
                  </div>
                  {isFacilityActive === true && (
                    <Link
                      href="/facility/coordination"
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span>Xem điều phối</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  )}
                </CardHeader>

                <CardContent className="divide-y divide-slate-100 p-0">
                  {overview.recentEncounters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <span className="material-symbols-outlined text-[34px] text-slate-300">
                        event_available
                      </span>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Chưa có lịch khám nào phát sinh tại cơ sở
                      </p>
                      <p className="mt-1 max-w-md text-xs text-slate-500">
                        Khi hộ gia đình ký hợp đồng và đặt lịch khám với bác sĩ trực thuộc, lịch điều phối sẽ hiển thị tại đây.
                      </p>
                    </div>
                  ) : (
                    overview.recentEncounters.map((enc) => {
                      const typeMeta = ENCOUNTER_TYPE_LABELS[enc.encounterType] ?? {
                        label: enc.encounterType,
                        className: 'border-slate-200 bg-slate-50 text-slate-700',
                      };
                      const statusMeta = ENCOUNTER_STATUS_LABELS[enc.encounterStatus] ?? {
                        label: enc.encounterStatus,
                        className: 'border-slate-200 bg-slate-50 text-slate-700',
                      };
                      const patientLabel =
                        enc.patientNames.length > 0
                          ? enc.patientNames.join(', ')
                          : 'Bệnh nhân hộ gia đình';

                      return (
                        <div key={enc.id} className="p-5 transition-colors hover:bg-slate-50/70">
                          <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                  {getInitials(patientLabel)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-bold text-slate-900">{patientLabel}</span>
                                {enc.contractNumber && (
                                  <span className="ml-2 text-xs text-slate-500 tabular-nums">
                                    #{enc.contractNumber}
                                  </span>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeMeta.className}`}
                              >
                                {typeMeta.label}
                              </Badge>
                            </div>
                            <span className="text-xs font-medium text-slate-500 tabular-nums">
                              {formatDateVi(enc.scheduledDate)} • {enc.scheduledTime || '—'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 pl-10.5 text-xs">
                            <div className="flex flex-wrap items-center gap-4 text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-primary">stethoscope</span>
                                <span>{enc.doctorName}</span>
                              </span>
                              {enc.specialty && (
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[16px] text-slate-500">domain</span>
                                  <span>{enc.specialty}</span>
                                </span>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2.5 py-0.5 font-bold ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Capacity, Channel Chart & B2B Contract Summary (4 cols) */}
              <div className="space-y-6 lg:col-span-4">
                <Card className="gap-4 rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                  <CardHeader className="flex flex-row items-center justify-between px-5 pb-0">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Công Suất &amp; Tiến Độ Vận Hành
                    </CardTitle>
                    <span className="text-xs font-bold text-primary tabular-nums">
                      Tháng {overview.encounters.month}/{overview.encounters.year}
                    </span>
                  </CardHeader>

                  <CardContent className="space-y-4 px-5 text-xs">
                    <div>
                      <div className="mb-1.5 flex justify-between font-semibold">
                        <span className="text-slate-600">Tỷ lệ hoàn thành lịch khám</span>
                        <span className="font-bold text-primary tabular-nums">
                          {overview.encounters.completionRatePercent}% ({overview.encounters.completed}/{overview.encounters.total} ca)
                        </span>
                      </div>
                      <Progress
                        value={overview.encounters.completionRatePercent}
                        aria-label="Tỷ lệ hoàn thành lịch khám"
                        className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-primary"
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex justify-between font-semibold">
                        <span className="text-slate-600">Công suất Panel Cap (Bác sĩ/Hộ)</span>
                        <span className="font-bold text-emerald-600 tabular-nums">
                          {overview.doctors.panelUtilizationPercent}% ({overview.doctors.activePanelCount}/{overview.doctors.maxPanelCapacity} hộ)
                        </span>
                      </div>
                      <Progress
                        value={overview.doctors.panelUtilizationPercent}
                        aria-label="Công suất Panel Cap"
                        className="h-2 bg-slate-100 [&_[data-slot=progress-indicator]]:bg-emerald-500"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <span className="font-semibold text-slate-600">Yêu cầu đổi lịch chờ CSYT duyệt</span>
                      <Link
                        href="/facility/coordination"
                        className="font-bold text-primary tabular-nums hover:underline"
                      >
                        {overview.pendingRescheduleCount} yêu cầu
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <DashboardChartCard
                  title="Phân Bổ Kênh Dịch Vụ Y Tế"
                  description={`Tỷ lệ các kênh khám tháng ${overview.encounters.month}/${overview.encounters.year}`}
                  config={channelChartConfig}
                  chartClassName="h-[170px]"
                  footer={
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                          Thăm khám tại nhà
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {calcChannelPct(homeCount)}% ({homeCount} ca)
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#00D3C7]" />
                          Tư vấn Telehealth HD
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {calcChannelPct(teleCount)}% ({teleCount} ca)
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#fe8f1a]" />
                          Đến khám trực tiếp tại BV
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {calcChannelPct(facilityCount)}% ({facilityCount} ca)
                        </span>
                      </div>
                    </div>
                  }
                >
                  <BarChart data={channelChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="channel" tickLine={false} axisLine={false} tickMargin={6} />
                    <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="visits" radius={[8, 8, 0, 0]}>
                      {channelChartData.map((entry) => (
                        <Cell key={entry.channel} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </DashboardChartCard>

                {/* Platform Partnership Info */}
                <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-[#111827] to-[#1e1b4b] p-5 text-white shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#00D3C7]">verified</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Đối Soát Doanh Thu B2B Ký Số
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    {overview.revenue.activeB2bContractCode
                      ? `Hợp đồng chia sẻ doanh thu ${overview.revenue.facilitySharePercent}/${overview.revenue.platformSharePercent} đang hiệu lực${overview.revenue.activeB2bValidTo ? ` đến ${formatDateVi(overview.revenue.activeB2bValidTo)}` : ''}. Doanh thu tháng ${overview.revenue.month}/${overview.revenue.year}: ${vndFormatter.format(overview.revenue.facilityShareVnd)}.`
                      : `Cơ sở y tế hiện chưa có hợp đồng B2B đang hiệu lực. Tỷ lệ mặc định tham chiếu ${overview.revenue.facilitySharePercent}/${overview.revenue.platformSharePercent}.`}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                    <span className="text-slate-400 tabular-nums">
                      {overview.revenue.activeB2bContractCode || 'Chưa có HĐ B2B'}
                    </span>
                    {isFacilityActive === true ? (
                      <Link href="/facility/revenue" className="font-bold text-[#00D3C7] hover:underline">
                        Kiểm tra sao kê
                      </Link>
                    ) : (
                      <Link href="/facility/legal-profile" className="font-bold text-amber-300 hover:underline">
                        Chờ duyệt pháp lý
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
