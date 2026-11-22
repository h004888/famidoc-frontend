'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  History,
  MessageSquare,
  ReceiptText,
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
  const search = useSearchParams();
  const requestedCaseId = search.get('supportCaseId')?.trim();
  const { gateStatus, gateError, isLoadingGate, refreshGateStatus } =
    useFamilySubscriptionGateState();
  const pending = gateStatus?.pendingContract;
  const contractId =
    search.get('contractId')?.trim() ||
    (!requestedCaseId && pending?.contractStatus === 'PENDING_PAYMENT' ? pending.id : undefined);
  const addendumId = search.get('addendumId')?.trim() || undefined;

  const [requests, setRequests] = useState<FamilyPaymentRequestItem[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCaseSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

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

  const openReportForRequest = (item: FamilyPaymentRequestItem) => {
    setDialogContext({
      contractId: item.contractId,
      contractNumber: item.contractNumber,
      packageName: item.packageName,
      invoiceId: item.id,
      paymentCode: item.paymentCode,
      transferContent: item.transferContent,
      amountVnd: item.amountVnd,
      paymentStatus: item.status,
      latestTransaction: item.latestTransaction,
    });
    setDialogCaseId(item.openSupportCase?.id ?? null);
    setDialogOpen(true);
  };

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/family" className="text-sm font-semibold text-primary">
        ← Bảng sức khỏe gia đình
      </Link>

      {contractId ? (
        <BookingPaymentStep
          key={`${contractId}:${addendumId ?? ''}`}
          contractId={contractId}
          addendumId={addendumId}
        />
      ) : (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h1 className="text-xl font-bold text-slate-900">Thanh toán VietQR</h1>
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
          ) : isLoadingGate || !gateStatus ? (
            <p role="status" className="text-sm text-slate-600">
              Đang kiểm tra hợp đồng chờ thanh toán…
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Không có hợp đồng nào đang chờ thanh toán. Nếu gia đình đã
                chuyển khoản trước đó nhưng gặp sự cố, bạn có thể báo lỗi hoặc
                theo dõi kết quả đối soát ngay bên dưới.
              </p>
              <Link
                href="/family/subscription"
                className="inline-block text-sm font-semibold text-primary hover:underline"
              >
                Xem gói và hợp đồng
              </Link>
            </>
          )}
        </section>
      )}

      {/* Lịch sử yêu cầu thanh toán & Báo lỗi chuyển khoản */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-0.5 min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <History className="size-4 text-primary shrink-0" aria-hidden="true" />
              <span>Lịch sử yêu cầu thanh toán &amp; Hỗ trợ chuyển khoản</span>
            </h2>
            <p className="text-xs text-slate-600">
              Bấm <strong>Báo lỗi chuyển khoản</strong> trực tiếp trên hóa đơn nếu
              ngân hàng đã trừ tiền nhưng gói chưa kích hoạt — hệ thống sẽ tự điền
              sẵn thông tin để Admin đối soát với SePay.
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
            <span>Đang tải lịch sử yêu cầu thanh toán…</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-600">
            Hộ gia đình chưa có yêu cầu thanh toán VietQR nào.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((item) => {
              const statusInfo = PAYMENT_STATUS_BADGE[item.status] ?? {
                label: item.status,
                className: 'border-slate-200 bg-slate-50 text-slate-700',
              };
              const hasOpenCase = Boolean(item.openSupportCase);
              const isReviewTx =
                item.latestTransaction?.outcome === 'REVIEW_REQUIRED';

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-1.5 text-xs sm:text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 tabular-nums wrap-anywhere">
                        {item.paymentCode}
                      </span>
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
                          className="border-amber-300 bg-amber-50 text-amber-900 text-[11px] font-semibold"
                        >
                          SePay chờ soát xét
                        </Badge>
                      )}
                      {item.openSupportCase && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[11px] font-semibold',
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

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>
                        Hợp đồng:{' '}
                        <strong className="text-slate-900 tabular-nums">
                          {item.contractNumber}
                        </strong>
                      </span>
                      <span>·</span>
                      <span className="truncate">{item.packageName}</span>
                      <span>·</span>
                      <strong className="text-primary tabular-nums">
                        {item.amountVnd.toLocaleString('vi-VN')} đ
                      </strong>
                    </div>

                    <div className="text-[11px] text-slate-500 tabular-nums">
                      Tạo lúc: {formatDate(item.createdAt)}
                      {item.paidAt
                        ? ` · Ghi nhận thanh toán: ${formatDate(item.paidAt)}`
                        : ` · Hết hạn: ${formatDate(item.expiresAt)}`}
                    </div>

                    {hasOpenCase && (
                      <div className="flex items-start gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-1.5 text-[11px] text-blue-900">
                        <AlertTriangle
                          className="mt-0.5 size-3.5 shrink-0 text-blue-700"
                          aria-hidden="true"
                        />
                        <span>
                          Đang có hồ sơ đối soát{' '}
                          <strong>{item.openSupportCase?.caseCode}</strong>. Vui
                          lòng chờ Admin phản hồi trước khi chuyển khoản lại.
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={hasOpenCase ? 'default' : 'outline'}
                      onClick={() => openReportForRequest(item)}
                      className={cn(
                        'rounded-xl text-xs font-semibold cursor-pointer',
                        hasOpenCase
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
                      )}
                    >
                      {hasOpenCase ? (
                        <>
                          <MessageSquare
                            className="size-3.5 mr-1.5"
                            aria-hidden="true"
                          />
                          <span>Xem trao đổi với Admin</span>
                        </>
                      ) : (
                        <>
                          <ReceiptText
                            className="size-3.5 mr-1.5"
                            aria-hidden="true"
                          />
                          <span>Báo lỗi chuyển khoản</span>
                        </>
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
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
