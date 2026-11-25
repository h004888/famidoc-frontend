'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  FileText,
  Printer,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  PaymentIssueDialog,
  type PaymentIssueContext,
} from '@/components/shared/payment-issue-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  paymentsApi,
  type FamilyPaymentRequestItem,
} from '@/lib/api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { cn } from '@/lib/utils';

interface FamilyBillingDetailViewProps {
  invoiceId: string;
}

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

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Asia/Ho_Chi_Minh',
});

const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatVnd(value: number | null | undefined): string {
  const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${safe.toLocaleString('vi-VN')} đ`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? dateTimeFormatter.format(parsed)
    : value;
}

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? shortDateFormatter.format(parsed)
    : value;
}

function getReceiptTypeLabel(item: FamilyPaymentRequestItem): string {
  if (!item.addendumId && !item.addendumNumber) {
    return 'Hợp đồng dịch vụ gốc';
  }
  const code = item.addendumNumber ? `#${item.addendumNumber}` : '';
  switch (item.addendumType) {
    case 'ADD_MEMBER':
      return `Phụ lục hợp đồng ${code} (Thêm thành viên)`.trim();
    case 'UPGRADE_PACKAGE':
      return `Phụ lục hợp đồng ${code} (Nâng cấp gói)`.trim();
    case 'ADD_HOME_VISITS':
      return `Phụ lục hợp đồng ${code} (Bổ sung lượt khám)`.trim();
    default:
      return `Phụ lục hợp đồng ${code}`.trim();
  }
}

export function FamilyBillingDetailView({
  invoiceId,
}: FamilyBillingDetailViewProps) {
  const [item, setItem] = useState<FamilyPaymentRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueContext, setIssueContext] = useState<PaymentIssueContext | null>(
    null,
  );
  const [issueCaseId, setIssueCaseId] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await paymentsApi.listMyPaymentRequests();
      const matched = (list ?? []).find((entry) => entry.id === invoiceId) ?? null;
      setItem(matched);
    } catch (cause) {
      setError(
        extractErrorMessage(cause, 'Không thể tải chi tiết hóa đơn thanh toán.'),
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleOpenIssue = () => {
    if (!item) return;
    setIssueContext({
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
    setIssueCaseId(item.openSupportCase?.id ?? null);
    setIssueOpen(true);
  };

  if (loading) {
    return (
      <div
        role="status"
        className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500"
      >
        <RefreshCw className="size-4 animate-spin text-primary" aria-hidden="true" />
        <span>Đang tải chi tiết hóa đơn…</span>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
        <Link
          href="/family/billing"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Quay lại danh sách Hóa đơn</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {error || 'Không tìm thấy thông tin hóa đơn này.'}
        </div>
      </div>
    );
  }

  const statusInfo = PAYMENT_STATUS_BADGE[item.status] ?? {
    label: item.status,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  const totalAmount =
    typeof item.amountVnd === 'number' && Number.isFinite(item.amountVnd)
      ? item.amountVnd
      : 0;
  const grossAmount =
    typeof item.grossAmountVnd === 'number' && Number.isFinite(item.grossAmountVnd)
      ? item.grossAmountVnd
      : totalAmount;
  const vatAmount =
    typeof item.vatAmountVnd === 'number' && Number.isFinite(item.vatAmountVnd)
      ? item.vatAmountVnd
      : 0;
  const bankReference =
    item.latestTransaction?.referenceCode ||
    item.latestTransaction?.providerTransactionId ||
    '';
  const gatewayName =
    item.latestTransaction?.gateway || item.expectedGateway || 'VietQR';

  const handleCopyReference = async () => {
    if (!bankReference) return;
    try {
      await navigator.clipboard?.writeText(bankReference);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 1800);
    } catch {
      // Ignore clipboard error.
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="print:hidden">
        <Link
          href="/family/billing"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Quay lại danh sách Hóa đơn</span>
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              Chi tiết Hóa đơn #{item.paymentCode}
            </h1>
            <Badge
              variant="outline"
              className={cn('text-xs font-semibold', statusInfo.className)}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            FamiDoc Pro · Xác nhận tự động qua {item.paymentGateway || 'VietQR'} / SePay · Ghi nhận lúc{' '}
            <span className="tabular-nums">
              {formatDateTime(item.paidAt || item.createdAt)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Printer className="mr-1.5 size-3.5" aria-hidden="true" />
            In / Lưu PDF
          </Button>
          <Button asChild size="sm" className="rounded-xl text-xs font-semibold">
            <Link href={`/family/subscription/${item.contractId}`}>
              <FileText className="mr-1.5 size-3.5" aria-hidden="true" />
              Xem gói &amp; Hợp đồng PDF
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Thông tin gói & hợp đồng */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Thông tin gói &amp; Hợp đồng
          </h2>
          <dl className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Gói dịch vụ</dt>
              <dd className="text-right font-semibold text-slate-900">
                {item.packageName}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Mã hợp đồng</dt>
              <dd className="text-right font-semibold text-slate-900 tabular-nums">
                #{item.contractNumber}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Loại thu</dt>
              <dd className="text-right font-semibold text-slate-900">
                {getReceiptTypeLabel(item)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-slate-500">Cơ sở y tế</dt>
              <dd className="text-right font-semibold text-slate-900">
                {item.facilityName}
              </dd>
            </div>
            {(item.contractStartDate || item.contractEndDate) && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Thời hạn hiệu lực</dt>
                <dd className="text-right font-semibold text-slate-900 tabular-nums">
                  {formatShortDate(item.contractStartDate)} –{' '}
                  {formatShortDate(item.contractEndDate)}
                </dd>
              </div>
            )}
            {typeof item.memberCount === 'number' && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Thành viên áp dụng</dt>
                <dd className="text-right font-semibold text-slate-900 tabular-nums">
                  {item.memberCount} thành viên
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Chi tiết số tiền & Chứng từ giao dịch */}
        <div className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chi tiết số tiền
            </h2>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Giá gói dịch vụ (Gross)</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatVnd(grossAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Thuế GTGT (VAT)</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatVnd(vatAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-base font-bold text-slate-900">
                <span>Tổng đã thanh toán</span>
                <span className="text-primary tabular-nums">
                  {formatVnd(totalAmount)}
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chứng từ giao dịch ngân hàng (SePay)
            </h2>
            <dl className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Ngân hàng / STK nhận</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">
                  {gatewayName}
                  {item.expectedAccountNumber
                    ? ` · ${item.expectedAccountNumber}`
                    : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Mã giao dịch</dt>
                <dd className="flex items-center gap-1.5 font-semibold text-slate-900 tabular-nums">
                  <span>{bankReference || '—'}</span>
                  {bankReference && (
                    <button
                      type="button"
                      onClick={() => void handleCopyReference()}
                      aria-label="Sao chép mã giao dịch"
                      className="inline-flex items-center rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 print:hidden cursor-pointer"
                    >
                      {copiedRef ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-slate-500">Nội dung CK</dt>
                <dd className="text-right font-medium text-slate-800 wrap-anywhere">
                  {item.transferContent}
                </dd>
              </div>
              {item.latestTransaction?.outcome && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Đối chiếu</dt>
                  <dd className="font-semibold text-emerald-700">
                    {item.latestTransaction.outcome}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </div>

      <div className="flex justify-end print:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenIssue}
          className="rounded-xl border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
        >
          <ShieldAlert className="mr-1.5 size-3.5" aria-hidden="true" />
          {item.openSupportCase
            ? 'Xem trao đổi với Admin'
            : 'Báo lỗi chuyển khoản / Khiếu nại'}
        </Button>
      </div>

      <PaymentIssueDialog
        key={issueCaseId ?? issueContext?.invoiceId}
        open={issueOpen}
        onOpenChange={setIssueOpen}
        context={issueContext}
        existingCaseId={issueCaseId}
        onCaseChanged={() => {
          void loadDetail();
        }}
      />
    </div>
  );
}
