'use client';

import { useEffect, useState } from 'react';
import {
  BanknoteArrowDown,
  CalendarClock,
  FileText,
  Percent,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
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
import { Card, CardContent } from '@/components/ui/card';
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
import {
  MonthlyPayoutPolicyBanner,
  SettlementPaymentSummary,
} from '@/components/shared/settlement-payment-summary';

const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

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
  const [period, setPeriod] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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
        if (active) setAnalytics(data);
      })
      .catch((cause: unknown) => {
        if (active) {
          setAnalytics(null);
          setError(extractErrorMessage(cause, 'Không tải được báo cáo doanh thu.'));
        }
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
          : canReview
            ? 'Chờ CSYT xác nhận'
            : '—';
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header + Bộ lọc kỳ báo cáo */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Đối soát doanh thu B2B
              </h1>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">
                <CalendarClock aria-hidden="true" className="mr-1 size-3.5" />
                Nhận tiền hàng tháng
              </Badge>
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">
                <ShieldAlert aria-hidden="true" className="mr-1 size-3.5" />
                CSYT &amp; Bác sĩ tự kê khai thuế
              </Badge>
            </div>
            <p className="text-sm text-slate-600">
              Đối soát và nhận tiền hàng tháng từ nền tảng FamiDoc theo ngày phục vụ, kể cả gói mua theo quý hoặc năm.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-end gap-2.5 sm:w-auto">
            <label className="min-w-0 flex-1 space-y-1 text-xs font-semibold text-slate-700 sm:flex-none">
              <span className="block">Kỳ báo cáo</span>
              <input
                type="month"
                min="2000-01"
                max="2200-12"
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900 sm:w-auto"
                value={period}
                onChange={(event) => {
                  setError('');
                  setIsLoading(true);
                  setPeriod(event.target.value);
                }}
              />
            </label>
            <label className="min-w-0 flex-1 space-y-1 text-xs font-semibold text-slate-700 sm:flex-none">
              <span className="block">Môi trường</span>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900 sm:w-auto"
                value={environment}
                onChange={(event) => {
                  setError('');
                  setIsLoading(true);
                  setEnvironment(event.target.value as typeof environment);
                }}
              >
                <option value="LIVE">LIVE</option>
                <option value="TEST">TEST</option>
              </select>
            </label>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => {
                setError('');
                setIsLoading(true);
                setRefresh((value) => value + 1);
              }}
            >
              <RefreshCw aria-hidden="true" className="mr-1.5 size-4" />
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      {isLoading && (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Đang tải báo cáo doanh thu…
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {analytics && !isLoading && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-sm font-semibold text-slate-800 shadow-2xs">
              <CalendarClock aria-hidden="true" className="size-4 text-primary" />
              <span>
                Tháng {analytics.month}/{analytics.year} · {analytics.environment}
              </span>
            </p>
            <span className="text-xs text-slate-500">
              Tỷ lệ phân bổ cố định: 85% CSYT nhận · 15% Phí nền tảng
            </span>
          </div>

          {/* 4 Card KPI trực quan phân tách dòng tiền */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-200 py-4 shadow-2xs">
              <CardContent className="space-y-1.5 px-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-600">Doanh thu ghi nhận</p>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <TrendingUp aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {amount.format(analytics.grossVnd)}
                </p>
                <p className="text-xs text-slate-500">100% doanh thu phân bổ trong tháng</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/30 bg-gradient-to-br from-blue-50/80 via-white to-white py-4 shadow-2xs">
              <CardContent className="space-y-1.5 px-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-blue-950">Phần doanh thu CSYT (85%)</p>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BanknoteArrowDown aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="text-xl font-bold text-primary tabular-nums">
                  {amount.format(analytics.facilityShareVnd)}
                </p>
                <p className="text-xs font-medium text-blue-900/80">
                  Nền tảng trả cho CSYT · Chưa khấu trừ thuế
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 py-4 shadow-2xs">
              <CardContent className="space-y-1.5 px-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-600">Phí nền tảng (15%)</p>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <Percent aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {amount.format(analytics.platformFeeVnd)}
                </p>
                <p className="text-xs text-slate-500">Phí công nghệ &amp; vận hành FamiDoc</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 py-4 shadow-2xs">
              <CardContent className="space-y-1.5 px-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-600">Số hóa đơn</p>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <FileText aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {analytics.invoiceCount.toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-slate-500">Hóa đơn phát sinh phân bổ trong kỳ</p>
              </CardContent>
            </Card>
          </div>

          {/* Chính sách chi trả hàng tháng & Tuyên bố không hỗ trợ đóng thuế cho CSYT và bác sĩ */}
          <MonthlyPayoutPolicyBanner role="facility" />

          {/* Bảng quyết toán của kỳ */}
          <Card className="gap-0 overflow-hidden border-slate-200 py-0 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="font-bold text-slate-900">Bảng quyết toán của kỳ</h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  Kiểm tra doanh thu, xác nhận bảng đối soát hàng tháng để nền tảng thực hiện chuyển khoản.
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {analytics.settlements.length} bảng quyết toán
              </span>
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/90">
                    <TableHead>Mã quyết toán</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">
                      Phân bổ tháng (100% / −15%)
                    </TableHead>
                    <TableHead>Số tiền nhận CSYT (85%)</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Mã chuyển khoản</TableHead>
                    <TableHead>Đối soát CSYT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.settlements.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/70">
                      <TableCell>
                        <p className="tabular-nums text-sm font-semibold text-slate-900">
                          {item.settlementCode}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Kỳ tháng {item.month}/{item.year}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-xs tabular-nums">
                        <p className="font-medium text-slate-800">
                          {amount.format(item.totalRealizedRevenue)}
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Phí 15%: −{amount.format(item.platformFeeAmount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-primary tabular-nums">
                          {amount.format(item.facilityPayoutAmount)}
                        </p>
                        <p className="text-xs text-slate-600">
                          Tháng {item.month}/{item.year} · Chưa khấu trừ thuế
                        </p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
                            Chi tiết tiền và thuế
                          </summary>
                          <div className="w-full max-w-md py-2">
                            <SettlementPaymentSummary item={item} />
                          </div>
                        </details>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={settlementStatusStyles[item.disbursementStatus]}
                        >
                          {settlementStatus[item.disbursementStatus]}
                        </Badge>
                        {item.settledAt && (
                          <p className="mt-1 text-xs text-slate-500">
                            Ngày chuyển: {new Date(item.settledAt).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                        {item.failureReason && (
                          <p className="mt-1 max-w-xs whitespace-normal text-xs text-red-700">
                            {item.failureReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="wrap-anywhere tabular-nums text-xs font-medium text-slate-800">
                          {item.bankTransferOrderId || '—'}
                        </span>
                        {item.bankDestination?.accountNumber && (
                          <p className="mt-0.5 wrap-anywhere text-[11px] text-slate-500">
                            {item.bankDestination.bankName} · {item.bankDestination.accountNumber}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{renderReview(item)}</TableCell>
                    </TableRow>
                  ))}
                  {analytics.settlements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-600">
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
                      <span className="tabular-nums font-semibold text-slate-900">
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
                      <p className="text-[11px] text-slate-500">85% · Chưa trừ thuế</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={settlementStatusStyles[item.disbursementStatus]}
                    >
                      {settlementStatus[item.disbursementStatus]}
                    </Badge>
                    {item.settledAt && (
                      <span className="text-xs text-slate-500">
                        Chuyển ngày {new Date(item.settledAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  {item.failureReason && (
                    <p className="text-xs text-red-700">{item.failureReason}</p>
                  )}
                  {item.bankTransferOrderId && (
                    <p className="wrap-anywhere text-xs text-muted-foreground">
                      Mã chuyển khoản <span className="tabular-nums">{item.bankTransferOrderId}</span>
                    </p>
                  )}
                  <details>
                    <summary className="cursor-pointer text-xs font-medium text-primary">
                      Chi tiết tiền và thuế
                    </summary>
                    <div className="py-2">
                      <SettlementPaymentSummary item={item} />
                    </div>
                  </details>
                  {renderReview(item)}
                </div>
              ))}
              {analytics.settlements.length === 0 && (
                <p className="p-8 text-center text-sm text-slate-600">
                  Chưa có bảng quyết toán cho kỳ này.
                </p>
              )}
            </div>
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
