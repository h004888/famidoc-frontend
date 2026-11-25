'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  History,
  RefreshCw,
} from 'lucide-react';
import { useFamilySubscriptionGateState } from '@/components/layout/family-subscription-gate';
import {
  PaymentIssueDialog,
  type PaymentIssueContext,
} from '@/components/shared/payment-issue-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingPaymentStep } from '@/features/booking';
import {
  getSupportCaseStatusLabel,
  isOpenSupportCaseStatus,
  paymentsApi,
  SUPPORT_CASE_STATUS_STYLES,
  supportCasesApi,
  type FamilyPaymentRequestItem,
  type SupportCaseSummary,
} from '@/lib/api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { cn } from '@/lib/utils';

const PAYMENT_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Chờ thanh toán',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  PAID: {
    label: 'Đã thanh toán',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  EXPIRED: {
    label: 'Hết hạn mã QR',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'border-slate-300 bg-slate-100 text-slate-700',
  },
};

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? dateFormatter.format(parsed)
    : value;
}

export function FamilyBillingView() {
  const router = useRouter();
  const search = useSearchParams();
  const requestedCaseId = search.get('supportCaseId')?.trim();
  const { gateStatus, gateError, isLoadingGate, refreshGateStatus } =
    useFamilySubscriptionGateState();
  const pending = gateStatus?.pendingContract;
  const gateActive = gateStatus?.activeContract ?? null;
  const contractId =
    search.get('contractId')?.trim() ||
    (!requestedCaseId && pending?.contractStatus === 'PENDING_PAYMENT'
      ? pending.id
      : undefined);
  const addendumId = search.get('addendumId')?.trim() || undefined;

  const [requests, setRequests] = useState<FamilyPaymentRequestItem[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCaseSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [showArchivedQrs, setShowArchivedQrs] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContext, setDialogContext] =
    useState<PaymentIssueContext | null>(null);
  const [dialogCaseId, setDialogCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!requestedCaseId) return;
    setDialogContext(null);
    setDialogCaseId(requestedCaseId);
    setDialogOpen(true);
  }, [requestedCaseId]);

  const loadBillingHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const [paymentList, casesPage] = await Promise.all([
        paymentsApi.listMyPaymentRequests(),
        supportCasesApi
          .list({ type: 'PAYMENT_ISSUE', limit: 30 })
          .catch(() => ({ items: [] as SupportCaseSummary[] })),
      ]);
      setRequests(paymentList ?? []);
      setSupportCases(casesPage?.items ?? []);
    } catch (cause) {
      setHistoryError(
        extractErrorMessage(
          cause,
          'Chưa tải được lịch sử yêu cầu thanh toán của hộ gia đình.',
        ),
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBillingHistory();
  }, [loadBillingHistory]);

  const openExistingCase = (sc: SupportCaseSummary) => {
    const snap = sc.contextSnapshot ?? {};
    setDialogContext({
      contractId: sc.contractId,
      contractNumber: sc.contract.contractNumber,
      packageName: sc.contract.packageName,
      invoiceId: sc.invoiceId || '',
      paymentCode:
        sc.invoice?.invoiceCode ||
        (typeof snap.paymentCode === 'string' ? snap.paymentCode : sc.caseCode),
      transferContent:
        typeof snap.transferContent === 'string'
          ? snap.transferContent
          : undefined,
      amountVnd:
        sc.invoice?.totalPayable ??
        (typeof snap.amountVnd === 'number' ? snap.amountVnd : 0),
      paymentStatus: sc.invoice?.paymentStatus || 'PENDING',
    });
    setDialogCaseId(sc.id);
    setDialogOpen(true);
  };

  const paidRequests = useMemo(
    () => requests.filter((item) => item.status === 'PAID'),
    [requests],
  );
  const archivedRequests = useMemo(
    () =>
      requests.filter(
        (item) => item.status === 'EXPIRED' || item.status === 'CANCELLED',
      ),
    [requests],
  );
  const hasAttentionArchivedItem = useMemo(
    () =>
      archivedRequests.some(
        (item) =>
          Boolean(item.openSupportCase) ||
          item.latestTransaction?.outcome === 'REVIEW_REQUIRED',
      ),
    [archivedRequests],
  );

  // Bảo toàn luồng báo lỗi chuyển khoản: chỉ thu gọn QR hết hạn khi đã có biên lai PAID và không có item cần soát xét.
  const shouldCollapseArchived =
    paidRequests.length > 0 && !hasAttentionArchivedItem;

  const visibleRequests = useMemo(() => {
    if (!shouldCollapseArchived || showArchivedQrs) {
      return requests;
    }
    return requests.filter(
      (item) => item.status !== 'EXPIRED' && item.status !== 'CANCELLED',
    );
  }, [requests, shouldCollapseArchived, showArchivedQrs]);

  const collapsedArchivedCount = shouldCollapseArchived
    ? archivedRequests.length
    : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {contractId ? (
        <BookingPaymentStep
          key={`${contractId}:${addendumId ?? ''}`}
          contractId={contractId}
          addendumId={addendumId}
        />
      ) : !gateActive && (gateError || isLoadingGate || !gateStatus) ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h1 className="text-xl font-bold text-slate-900">
            Hóa đơn, Biên lai &amp; Thanh toán
          </h1>
          {gateError ? (
            <>
              <p role="alert" className="text-sm text-destructive">
                {gateError}
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-primary cursor-pointer"
                onClick={() => void refreshGateStatus()}
              >
                Thử lại
              </button>
            </>
          ) : (
            <p role="status" className="text-sm text-slate-600">
              Đang kiểm tra hợp đồng chờ thanh toán…
            </p>
          )}
        </section>
      ) : null}

      {/* Bảng Hóa đơn, Biên lai & Thanh toán */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-0.5 min-w-0">
            <h1 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
              <History className="size-4 text-primary shrink-0" aria-hidden="true" />
              <span>Hóa đơn, Biên lai &amp; Thanh toán</span>
            </h1>
            <p className="text-xs text-slate-600">
              Bấm vào một dòng để xem chi tiết biên lai điện tử hoặc đối soát chuyển khoản.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={historyLoading}
            onClick={() => void loadBillingHistory()}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RefreshCw
              className={cn(
                'size-3.5 mr-1.5',
                historyLoading && 'animate-spin',
              )}
              aria-hidden="true"
            />
            Làm mới
          </Button>
        </div>

        {historyError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
          >
            {historyError}
          </div>
        )}

        {historyLoading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500"
          >
            <RefreshCw
              className="size-4 animate-spin text-primary"
              aria-hidden="true"
            />
            <span>Đang tải danh sách hóa đơn…</span>
          </div>
        ) : visibleRequests.length === 0 && collapsedArchivedCount === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-600">
            <p>
              {gateActive
                ? 'Hộ gia đình chưa có hóa đơn thanh toán nào được ghi nhận.'
                : 'Không có hợp đồng nào đang chờ thanh toán. Hộ gia đình chưa có yêu cầu thanh toán VietQR nào.'}
            </p>
            {!gateActive && (
              <Link
                href="/family/subscription"
                className="mt-2 inline-block font-semibold text-primary hover:underline"
              >
                Xem gói và hợp đồng
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3">Mã hóa đơn</th>
                    <th className="px-4 py-3">Loại / Gói dịch vụ</th>
                    <th className="px-4 py-3">Hợp đồng</th>
                    <th className="px-4 py-3 text-right">Số tiền</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="w-10 px-3 py-3" aria-label="Chi tiết" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {visibleRequests.map((item) => {
                    const statusInfo = PAYMENT_STATUS_BADGE[item.status] ?? {
                      label: item.status,
                      className: 'border-slate-200 bg-slate-50 text-slate-700',
                    };
                    const isReviewTx =
                      item.latestTransaction?.outcome === 'REVIEW_REQUIRED';

                    return (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        onClick={() => router.push(`/family/billing/${item.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/family/billing/${item.id}`);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-slate-50/90 focus-visible:bg-slate-50 focus-visible:outline-none"
                      >
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-bold text-slate-900 tabular-nums">
                            {item.paymentCode}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                            {item.paidAt
                              ? formatDate(item.paidAt)
                              : formatDate(item.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-semibold"
                            >
                              {item.addendumId || item.addendumNumber
                                ? `Phụ lục ${item.addendumNumber ? `#${item.addendumNumber}` : ''}`.trim()
                                : 'HĐ Gốc'}
                            </Badge>
                            <span className="font-medium text-slate-900">
                              {item.packageName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top font-semibold text-slate-700 tabular-nums">
                          #{item.contractNumber}
                        </td>
                        <td className="px-4 py-3.5 align-top text-right font-bold text-primary tabular-nums whitespace-nowrap">
                          {item.amountVnd.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[11px] font-semibold',
                                statusInfo.className,
                              )}
                            >
                              {statusInfo.label}
                            </Badge>
                            {isReviewTx && (
                              <Badge
                                variant="outline"
                                className="border-amber-300 bg-amber-50 text-amber-900 text-[10px] font-semibold"
                              >
                                Chờ soát xét
                              </Badge>
                            )}
                            {item.openSupportCase && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] font-semibold',
                                  SUPPORT_CASE_STATUS_STYLES[
                                    item.openSupportCase
                                      .status as keyof typeof SUPPORT_CASE_STATUS_STYLES
                                  ] || 'border-blue-300 bg-blue-50 text-blue-900',
                                )}
                              >
                                Hỗ trợ:{' '}
                                {getSupportCaseStatusLabel(
                                  item.openSupportCase
                                    .status as Parameters<
                                    typeof getSupportCaseStatusLabel
                                  >[0],
                                  'PAYMENT_ISSUE',
                                )}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 align-middle text-right text-slate-400">
                          <ChevronRight className="inline size-4" aria-hidden="true" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {collapsedArchivedCount > 0 && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchivedQrs((prev) => !prev)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {showArchivedQrs ? (
                    <>
                      <ChevronUp className="size-3.5 mr-1.5" aria-hidden="true" />
                      Thu gọn {collapsedArchivedCount} mã QR cũ đã hết hạn / hủy
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3.5 mr-1.5" aria-hidden="true" />
                      Xem thêm {collapsedArchivedCount} mã QR cũ đã hết hạn / hủy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Các hồ sơ báo lỗi chuyển khoản đã xử lý trước đó để gia đình tra cứu lại */}
        {supportCases.filter((c) => !isOpenSupportCaseStatus(c.status)).length >
          0 && (
          <div className="space-y-2.5 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hồ sơ báo lỗi chuyển khoản đã hoàn tất
            </h3>
            <div className="space-y-2">
              {supportCases
                .filter((c) => !isOpenSupportCaseStatus(c.status))
                .map((sc) => (
                  <div
                    key={sc.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="tabular-nums text-slate-900">
                          {sc.caseCode}
                        </strong>
                        <span className="text-slate-600 tabular-nums">
                          {sc.invoice?.invoiceCode || sc.contract.contractNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-semibold',
                            SUPPORT_CASE_STATUS_STYLES[sc.status],
                          )}
                        >
                          {getSupportCaseStatusLabel(sc.status, sc.caseType)}
                        </Badge>
                      </div>
                      {sc.resolutionSummary && (
                        <p className="line-clamp-1 text-slate-600">
                          Kết luận: {sc.resolutionSummary}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openExistingCase(sc)}
                      className="rounded-lg text-xs cursor-pointer"
                    >
                      Xem lại hồ sơ
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      <PaymentIssueDialog
        key={dialogCaseId ?? dialogContext?.invoiceId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        context={dialogContext}
        existingCaseId={dialogCaseId}
        onCaseChanged={() => {
          void loadBillingHistory();
        }}
      />
    </div>
  );
}
