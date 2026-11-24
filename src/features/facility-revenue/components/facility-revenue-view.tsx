'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Layers,
  PackageCheck,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  financeApi,
  type FinanceAnalyticsDto,
  type FacilitySettlementDto,
  type ReviewSettlementPayload,
} from '@/lib/api/finance.api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SettlementPaymentSummary } from '@/components/shared/settlement-payment-summary';
import {
  FacilityFamilyPackagesPanel,
  FacilityPackageSummaryPanel,
} from './facility-business-tables';

const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

type RevenueTab = 'packages' | 'summary' | 'settlements';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function formatPeriodValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function parsePeriodValue(value: string): { year: number; month: number } | null {
  const [y, m] = value.split('-').map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;
  return { year: y, month: m };
}

function getDefaultVietnamPreviousMonth() {
  const now = new Date(Date.now() + 7 * 3_600_000);
  now.setUTCDate(1);
  now.setUTCMonth(now.getUTCMonth() - 1);
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function getCurrentVietnamMonth() {
  const now = new Date(Date.now() + 7 * 3_600_000);
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

const settlementStatus: Record<FacilitySettlementDto['disbursementStatus'], string> = {
  PENDING: 'Chờ chi trả',
  CONFIRMED: 'Đã xác nhận',
  FAILED: 'Chi trả thất bại',
  SETTLED: 'Đã chi trả',
};

const settlementStatusStyles: Record<FacilitySettlementDto['disbursementStatus'], string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-800',
  FAILED: 'border-red-200 bg-red-50 text-red-800',
  SETTLED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const reviewBadgeStyles = {
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  DISPUTED: 'border-red-200 bg-red-50 text-red-800',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function FacilityRevenueView() {
  const [analytics, setAnalytics] = useState<FinanceAnalyticsDto | null>(null);
  const [isTestEnvBlocked, setIsTestEnvBlocked] = useState(
    process.env.NEXT_PUBLIC_APP_ENV === 'production',
  );
  const [period, setPeriod] = useState('');
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => getDefaultVietnamPreviousMonth().year);
  const monthPickerRef = useRef<HTMLDivElement | null>(null);
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<RevenueTab>('packages');
  const [selectedPackageCode, setSelectedPackageCode] = useState<string | null>(null);
  const [review, setReview] = useState<{
    item: FacilitySettlementDto;
    action: ReviewSettlementPayload['action'];
  } | null>(null);
  const [reason, setReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    const [year, month] = period.split('-').map(Number);
    void financeApi
      .getAnalytics({ environment, ...(period ? { year, month } : {}) })
      .then((data) => {
        if (!active) return;
        setAnalytics(data);
        setSelectedPackageCode(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const rawMsg =
          cause instanceof Error
            ? cause.message
            : 'Không tải được báo cáo doanh thu.';
        const status =
          typeof (cause as { status?: unknown })?.status === 'number'
            ? (cause as { status: number }).status
            : undefined;
        if (
          environment === 'TEST' &&
          (status === 403 || /TEST bị khóa|production|Forbidden/i.test(rawMsg))
        ) {
          setIsTestEnvBlocked(true);
          setEnvironment('LIVE');
          toast.info(
            'Dữ liệu tài chính TEST bị khóa trong môi trường hiện tại. Đã chuyển về LIVE.',
          );
          return;
        }
        setAnalytics(null);
        setError(
          extractErrorMessage(cause, 'Không tải được báo cáo doanh thu.'),
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [environment, period, refresh]);

  const openReview = (item: FacilitySettlementDto, action: ReviewSettlementPayload['action']) => {
    setReason('');
    setReviewError('');
    setReview({ item, action });
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!review || isSubmittingReview) return;
    const { item, action } = review;
    const { reviewVersion } = item;
    if (reviewVersion === undefined) return;
    const note = reason.trim();
    if (action === 'REPORT_DISCREPANCY') {
      if (note.length < 10) {
        setReviewError('Vui lòng mô tả sai lệch ít nhất 10 ký tự.');
        return;
      }
      if (note.length > 1000) {
        setReviewError('Nội dung sai lệch không được vượt quá 1000 ký tự.');
        return;
      }
    }

    setIsSubmittingReview(true);
    setReviewError('');
    try {
      const payload = { environment: item.environment, reviewVersion };
      const updated = await financeApi.reviewSettlement(
        item.id,
        action === 'CONFIRM' ? { ...payload, action } : { ...payload, action, reason: note },
      );
      setAnalytics((current) =>
        current
          ? {
              ...current,
              settlements: current.settlements.map((entry) =>
                entry.id === updated.id ? updated : entry,
              ),
            }
          : current,
      );
      toast.success(
        action === 'CONFIRM' ? 'Đã xác nhận bảng đối soát.' : 'Đã gửi sai lệch cho Admin.',
      );
      setReview(null);
    } catch (cause) {
      setReviewError(
        extractErrorMessage(cause, 'Không lưu được kết quả đối soát.'),
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderReview = (item: FacilitySettlementDto) => {
    const settled = item.disbursementStatus === 'SETTLED';
    const canReview =
      !settled && item.reviewStatus === 'PENDING' && item.reviewVersion !== undefined;
    const status =
      item.reviewStatus === 'CONFIRMED'
        ? 'CSYT đã xác nhận'
        : item.reviewStatus === 'DISPUTED'
          ? 'Đã báo sai lệch'
          : canReview;
    const badgeClass =
      item.reviewStatus === 'CONFIRMED'
        ? reviewBadgeStyles.CONFIRMED
        : item.reviewStatus === 'DISPUTED'
          ? reviewBadgeStyles.DISPUTED
          : canReview
            ? reviewBadgeStyles.PENDING
            : '';

    return (
      <div className="space-y-2">
        <Badge variant="outline" className={badgeClass}>
          {status}
        </Badge>
        {item.reviewDisputeReason && (
          <p className="max-w-xs whitespace-normal break-words rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
            Sai lệch đã báo gần nhất: {item.reviewDisputeReason}
          </p>
        )}
        {canReview && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            <Button type="button" size="sm" onClick={() => openReview(item, 'CONFIRM')}>
              Xác nhận bảng
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openReview(item, 'REPORT_DISCREPANCY')}
            >
              Báo sai lệch
            </Button>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!monthPickerOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        monthPickerRef.current &&
        !monthPickerRef.current.contains(event.target as Node)
      ) {
        setMonthPickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMonthPickerOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [monthPickerOpen]);

  const activePeriod =
    parsePeriodValue(period) ??
    (analytics
      ? { year: analytics.year, month: analytics.month }
      : getDefaultVietnamPreviousMonth());

  const selectPeriod = (year: number, month: number) => {
    if (year < 2000 || year > 2200 || month < 1 || month > 12) return;
    setError('');
    setIsLoading(true);
    setPeriod(formatPeriodValue(year, month));
    setPickerYear(year);
    setMonthPickerOpen(false);
  };

  const shiftPeriod = (deltaMonths: number) => {
    const totalMonths = activePeriod.year * 12 + (activePeriod.month - 1) + deltaMonths;
    const nextYear = Math.floor(totalMonths / 12);
    const nextMonth = (totalMonths % 12) + 1;
    selectPeriod(nextYear, nextMonth);
  };

  const hasBusiness = Boolean(analytics?.facilityBusiness);
  const effectiveTab: RevenueTab = hasBusiness ? activeTab : 'settlements';
  const familyPackagesCount = analytics?.facilityBusiness?.familyPackages?.length ?? 0;
  const packagesSummaryCount = analytics?.facilityBusiness?.purchases.byPackage.length ?? 0;
  const pendingReviewCount =
    analytics?.settlements.filter(
      (item) => item.disbursementStatus !== 'SETTLED' && item.reviewStatus === 'PENDING',
    ).length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      {/* Header gọn + Bộ chọn lịch theo tháng */}
      <header className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-2xs sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                Đối soát doanh thu
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            {/* Bộ chọn lịch theo tháng */}
            <div ref={monthPickerRef} className="relative min-w-0 flex-1 sm:flex-none">
              <span className="mb-1 block text-xs font-semibold text-slate-700">
                Chọn tháng
              </span>
              <div className="inline-flex h-9 w-full items-center overflow-hidden rounded-md border border-slate-300 bg-white sm:w-auto">
                <button
                  type="button"
                  aria-label="Tháng trước"
                  disabled={isLoading}
                  onClick={() => shiftPeriod(-1)}
                  className="flex h-full items-center justify-center border-r border-slate-200 px-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Chọn tháng theo lịch"
                  aria-expanded={monthPickerOpen}
                  aria-haspopup="dialog"
                  disabled={isLoading}
                  onClick={() => {
                    setPickerYear(activePeriod.year);
                    setMonthPickerOpen((open) => !open);
                  }}
                  className="flex h-full flex-1 items-center justify-center gap-1.5 px-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-50 sm:min-w-[138px]"
                >
                  <Calendar aria-hidden="true" className="size-3.5 text-primary" />
                  <span className="tabular-nums">
                    Tháng {activePeriod.month}/{activePeriod.year}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Tháng sau"
                  disabled={isLoading}
                  onClick={() => shiftPeriod(1)}
                  className="flex h-full items-center justify-center border-l border-slate-200 px-2 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>

              {monthPickerOpen && (
                <div
                  role="dialog"
                  aria-label="Lịch chọn tháng"
                  className="absolute right-0 z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <button
                      type="button"
                      aria-label="Năm trước"
                      onClick={() => setPickerYear((year) => Math.max(2000, year - 1))}
                      className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ChevronLeft aria-hidden="true" className="size-4" />
                    </button>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      Năm {pickerYear}
                    </span>
                    <button
                      type="button"
                      aria-label="Năm sau"
                      onClick={() => setPickerYear((year) => Math.min(2200, year + 1))}
                      className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTHS.map((monthNumber) => {
                      const isSelected =
                        pickerYear === activePeriod.year &&
                        monthNumber === activePeriod.month;
                      return (
                        <button
                          key={monthNumber}
                          type="button"
                          onClick={() => selectPeriod(pickerYear, monthNumber)}
                          className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          Tháng {monthNumber}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = getDefaultVietnamPreviousMonth();
                        selectPeriod(prev.year, prev.month);
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-primary"
                    >
                      Tháng trước
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = getCurrentVietnamMonth();
                        selectPeriod(current.year, current.month);
                      }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Tháng hiện tại
                    </button>
                  </div>
                </div>
              )}
            </div>

            <label className="min-w-0 flex-1 space-y-1 text-xs font-semibold text-slate-700 sm:flex-none">
              <span className="block">Môi trường</span>
              <select
                aria-label="Môi trường"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                value={isTestEnvBlocked ? 'LIVE' : environment}
                disabled={isTestEnvBlocked}
                onChange={(event) => {
                  setError('');
                  setIsLoading(true);
                  setEnvironment(event.target.value as typeof environment);
                }}
              >
                <option value="LIVE">LIVE</option>
                {!isTestEnvBlocked && <option value="TEST">TEST</option>}
              </select>
            </label>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={isLoading}
              onClick={() => {
                setError('');
                setIsLoading(true);
                setRefresh((value) => value + 1);
              }}
            >
              <RefreshCw aria-hidden="true" className="mr-1.5 size-3.5" />
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      {isLoading && (
        <p
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600"
        >
          Đang tải báo cáo doanh thu…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {analytics && !isLoading && (
        <>
          {/* Lớp 1 (Ngoài cùng): 4 thẻ thông tin tổng quan tĩnh (không bấm) */}
          <section
            aria-label="Tổng quan doanh thu kỳ báo cáo"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {analytics.facilityBusiness && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
                  <span>Gói gia đình trong kỳ</span>
                  <PackageCheck aria-hidden="true" className="size-4 text-primary" />
                </div>
                <p className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums sm:text-xl">
                  {familyPackagesCount.toLocaleString('vi-VN')} gói
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {analytics.facilityBusiness.purchases.purchasingHouseholds.toLocaleString(
                    'vi-VN',
                  )}{' '}
                  hộ mua mới · {analytics.facilityBusiness.activeHouseholds.toLocaleString('vi-VN')}{' '}
                  hộ hiệu lực
                </p>
              </div>
            )}

            {analytics.facilityBusiness && (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
                  <span>Giá trị gói đã thanh toán</span>
                  <Layers aria-hidden="true" className="size-4 text-slate-500" />
                </div>
                <p className="mt-1.5 text-lg font-bold text-slate-900 tabular-nums sm:text-xl">
                  {amount.format(analytics.facilityBusiness.purchases.grossVnd)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {analytics.facilityBusiness.purchases.packagesSold.toLocaleString('vi-VN')} gói đã
                  thu trong tháng
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
                <span>Phí nền tảng kỳ này (15%)</span>
                <Wallet aria-hidden="true" className="size-4 text-amber-600" />
              </div>
              <p className="mt-1.5 text-lg font-bold text-amber-700 tabular-nums sm:text-xl">
                {amount.format(analytics.platformFeeVnd)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Trên doanh thu phân bổ {amount.format(analytics.grossVnd)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
                <span>CSYT nhận kỳ này (85%)</span>
                <FileCheck2 aria-hidden="true" className="size-4 text-primary" />
              </div>
              <p className="mt-1.5 text-lg font-bold text-primary tabular-nums sm:text-xl">
                {amount.format(analytics.facilityShareVnd)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {pendingReviewCount > 0
                  ? `${pendingReviewCount} bảng đang chờ CSYT xác nhận`
                  : 'Chưa khấu trừ thuế · Đối soát hàng tháng'}
              </p>
            </div>
          </section>

          {/* Lớp 2 (Trung gian): Không gian làm việc 1 khung duy nhất chia Tab ngang — không cần cuộn dài */}
          <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 py-0 shadow-2xs">
            <div
              role="tablist"
              aria-label="Phân mục đối soát doanh thu CSYT"
              className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/80 px-2 pt-2 sm:px-4"
            >
              {analytics.facilityBusiness && (
                <button
                  type="button"
                  role="tab"
                  id="tab-packages"
                  aria-selected={effectiveTab === 'packages'}
                  aria-controls="panel-packages"
                  onClick={() => setActiveTab('packages')}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                    effectiveTab === 'packages'
                      ? 'border-primary bg-white text-primary rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Gói gia đình &amp; Bác sĩ khám</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                    {familyPackagesCount}
                  </span>
                </button>
              )}

              {analytics.facilityBusiness && (
                <button
                  type="button"
                  role="tab"
                  id="tab-summary"
                  aria-selected={effectiveTab === 'summary'}
                  aria-controls="panel-summary"
                  onClick={() => setActiveTab('summary')}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                    effectiveTab === 'summary'
                      ? 'border-primary bg-white text-primary rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Tổng hợp theo gói</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                    {packagesSummaryCount}
                  </span>
                </button>
              )}

              <button
                type="button"
                role="tab"
                id="tab-settlements"
                aria-selected={effectiveTab === 'settlements'}
                aria-controls="panel-settlements"
                onClick={() => setActiveTab('settlements')}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                  effectiveTab === 'settlements'
                    ? 'border-primary bg-white text-primary rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Quyết toán kỳ</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                  {analytics.settlements.length}
                </span>
                {pendingReviewCount > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold text-amber-800"
                  >
                    Chờ xác nhận
                  </Badge>
                )}
              </button>
            </div>

            {/* Tab 1: Quản lý gói gia đình mua & Bác sĩ tham gia khám (bấm sâu xem giá gói / 15% / 85%) */}
            {effectiveTab === 'packages' && analytics.facilityBusiness && (
              <div
                role="tabpanel"
                id="panel-packages"
                aria-labelledby="tab-packages"
              >
                <FacilityFamilyPackagesPanel
                  business={analytics.facilityBusiness}
                  periodLabel={`Tháng ${analytics.month}/${analytics.year}`}
                  formatAmount={amount.format}
                  selectedPackageCode={selectedPackageCode}
                  onClearPackageFilter={() => setSelectedPackageCode(null)}
                />
              </div>
            )}

            {/* Tab 2: Tổng hợp theo gói đã thanh toán trong tháng (bấm 1 gói -> lọc sâu ở Tab 1) */}
            {effectiveTab === 'summary' && analytics.facilityBusiness && (
              <div
                role="tabpanel"
                id="panel-summary"
                aria-labelledby="tab-summary"
              >
                <FacilityPackageSummaryPanel
                  business={analytics.facilityBusiness}
                  formatAmount={amount.format}
                  onSelectPackage={(packageCode) => {
                    setSelectedPackageCode(packageCode);
                    setActiveTab('packages');
                  }}
                />
              </div>
            )}

            {/* Tab 3: Bảng quyết toán của kỳ */}
            {effectiveTab === 'settlements' && (
              <div
                role="tabpanel"
                id="panel-settlements"
                aria-labelledby="tab-settlements"
              >
                <div className="space-y-0.5 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5">
                  <h2
                    id="facility-settlement-title"
                    className="text-sm font-bold text-slate-900 sm:text-base"
                  >
                    Bảng quyết toán của kỳ
                  </h2>
                </div>

                {analytics.settlements.length === 0 && (
                  <dl className="grid gap-3 border-b border-slate-200 bg-slate-50/30 px-4 py-3 text-sm sm:grid-cols-3 sm:px-5">
                    <div>
                      <dt className="text-xs text-slate-600">Doanh thu phân bổ trong tháng</dt>
                      <dd className="font-semibold text-slate-900 tabular-nums">
                        {amount.format(analytics.grossVnd)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-600">Phí nền tảng trong tháng</dt>
                      <dd className="font-semibold text-amber-700 tabular-nums">
                        {amount.format(analytics.platformFeeVnd)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-600">Dự kiến chi trả trong tháng</dt>
                      <dd className="font-bold text-primary tabular-nums">
                        {amount.format(analytics.facilityShareVnd)}
                      </dd>
                    </div>
                  </dl>
                )}

                <div className="hidden md:block">
                  <Table
                    aria-labelledby="facility-settlement-title"
                    className="border-collapse"
                  >
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Mã quyết toán
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Phân bổ trong tháng
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Số tiền chi trả CSYT
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Trạng thái
                        </TableHead>
                        <TableHead className="border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Mã chuyển khoản
                        </TableHead>
                        <TableHead className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                          Đối soát CSYT
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.settlements.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/70">
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top">
                            <p className="text-sm font-semibold text-slate-900 tabular-nums">
                              {item.settlementCode}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Kỳ tháng {item.month}/{item.year}
                            </p>
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top text-xs tabular-nums">
                            <p className="font-medium text-slate-800">
                              {amount.format(item.totalRealizedRevenue)}
                            </p>
                            <p className="mt-0.5 text-slate-500">
                              Phí nền tảng −{amount.format(item.platformFeeAmount)}
                            </p>
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top">
                            <p className="text-sm font-bold text-primary tabular-nums">
                              {amount.format(item.facilityPayoutAmount)}
                            </p>
                            <p className="text-xs text-slate-600">Chưa khấu trừ thuế</p>
                            {/* <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
                                Chi tiết tiền và thuế
                              </summary>
                              <div className="w-full max-w-md py-2">
                                <SettlementPaymentSummary item={item} />
                              </div>
                            </details> */}
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top">
                            <Badge
                              variant="outline"
                              className={settlementStatusStyles[item.disbursementStatus]}
                            >
                              {settlementStatus[item.disbursementStatus]}
                            </Badge>
                            {item.settledAt && (
                              <p className="mt-1 text-xs text-slate-500">
                                Ngày chuyển:{' '}
                                {new Date(item.settledAt).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                            {item.failureReason && (
                              <p className="mt-1 max-w-xs whitespace-normal text-xs text-red-700">
                                {item.failureReason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="border-r border-slate-200 px-4 py-3 text-left align-top">
                            <span className="wrap-anywhere text-xs font-medium text-slate-800 tabular-nums">
                              {item.bankTransferOrderId || '—'}
                            </span>
                            {item.bankDestination?.accountNumber && (
                              <p className="mt-0.5 wrap-anywhere text-[11px] text-slate-500">
                                {item.bankDestination.bankName} ·{' '}
                                {item.bankDestination.accountNumber}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-left align-top">
                            {renderReview(item)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {analytics.settlements.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="px-4 py-10 text-left text-sm text-slate-600"
                          >
                            Chưa có bảng quyết toán cho kỳ này.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {analytics.settlements.map((item) => (
                    <div key={item.id} className="space-y-2.5 p-4 text-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="font-semibold text-slate-900 tabular-nums">
                            {item.settlementCode}
                          </span>
                          <p className="text-xs text-slate-500">
                            Kỳ tháng {item.month}/{item.year}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary tabular-nums">
                            {amount.format(item.facilityPayoutAmount)}
                          </span>
                          <p className="text-[11px] text-slate-500">Chưa khấu trừ thuế</p>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-slate-600">Doanh thu phân bổ</dt>
                          <dd className="font-medium tabular-nums">
                            {amount.format(item.totalRealizedRevenue)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-600">Phí nền tảng</dt>
                          <dd className="font-medium tabular-nums">
                            {amount.format(item.platformFeeAmount)}
                          </dd>
                        </div>
                      </dl>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={settlementStatusStyles[item.disbursementStatus]}
                        >
                          {settlementStatus[item.disbursementStatus]}
                        </Badge>
                        {item.settledAt && (
                          <span className="text-xs text-slate-500">
                            Chuyển ngày{' '}
                            {new Date(item.settledAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      {item.failureReason && (
                        <p className="text-xs text-red-700">{item.failureReason}</p>
                      )}
                      {item.bankTransferOrderId && (
                        <p className="wrap-anywhere text-xs text-muted-foreground">
                          Mã chuyển khoản{' '}
                          <span className="tabular-nums">{item.bankTransferOrderId}</span>
                        </p>
                      )}
                      {/* <details>
                        <summary className="cursor-pointer text-xs font-medium text-primary">
                          Chi tiết tiền và thuế
                        </summary>
                        <div className="py-2">
                          <SettlementPaymentSummary item={item} />
                        </div>
                      </details> */}
                      {renderReview(item)}
                    </div>
                  ))}
                  {analytics.settlements.length === 0 && (
                    <p className="p-8 text-center text-sm text-slate-600">
                      Chưa có bảng quyết toán cho kỳ này.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Dialog Xác nhận / Báo sai lệch của CSYT */}
      <Dialog
        open={review !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmittingReview) setReview(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          {review && (
            <form noValidate onSubmit={submitReview} className="space-y-4">
              <DialogHeader className="text-left">
                <DialogTitle>
                  {review.action === 'CONFIRM'
                    ? 'Xác nhận bảng đối soát'
                    : 'Báo sai lệch bảng đối soát'}
                </DialogTitle>
                <DialogDescription>
                  {review.item.settlementCode} · Tháng {review.item.month}/{review.item.year} ·
                  Phần CSYT {amount.format(review.item.facilityPayoutAmount)}
                </DialogDescription>
              </DialogHeader>

              <SettlementPaymentSummary item={review.item} />

              {review.action === 'CONFIRM' && (
                <p className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs leading-relaxed text-blue-950">
                  Khi bấm <strong>Xác nhận số liệu</strong>, CSYT đồng ý với số tiền chi trả kỳ
                  tháng {review.item.month}/{review.item.year} để nền tảng thực hiện chuyển khoản,
                  đồng thời xác nhận đã nắm rõ quy định <strong>CSYT và bác sĩ tự kê khai, nộp
                  thuế</strong> (nền tảng không hỗ trợ đóng thuế thay).
                </p>
              )}

              {review.action === 'REPORT_DISCREPANCY' && (
                <div className="space-y-2">
                  <Label htmlFor="settlement-review-reason">Nội dung sai lệch</Label>
                  <Textarea
                    id="settlement-review-reason"
                    required
                    minLength={10}
                    maxLength={1000}
                    value={reason}
                    disabled={isSubmittingReview}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Ghi kỳ, hóa đơn hoặc số tiền chưa khớp"
                  />
                  <p className="text-[11px] text-slate-500">
                    {reason.trim().length}/1000 ký tự (tối thiểu 10 ký tự)
                  </p>
                </div>
              )}
              {reviewError && (
                <p role="alert" className="text-sm text-destructive">
                  {reviewError}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmittingReview}
                  onClick={() => setReview(null)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmittingReview}>
                  {isSubmittingReview
                    ? 'Đang gửi…'
                    : review.action === 'CONFIRM'
                      ? 'Xác nhận số liệu'
                      : 'Gửi sai lệch'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
