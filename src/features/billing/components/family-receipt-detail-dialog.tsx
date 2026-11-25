'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, FileText, Printer, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FamilyPaymentRequestItem } from '@/lib/api';

interface FamilyReceiptDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FamilyPaymentRequestItem | null;
  onReportIssue: (item: FamilyPaymentRequestItem) => void;
}

const receiptDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Asia/Ho_Chi_Minh',
});

const receiptShortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
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
    ? receiptDateFormatter.format(parsed)
    : value;
}

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? receiptShortDateFormatter.format(parsed)
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

export function FamilyReceiptDetailDialog({
  open,
  onOpenChange,
  item,
  onReportIssue,
}: FamilyReceiptDetailDialogProps) {
  const [copiedRef, setCopiedRef] = useState(false);

  if (!item) return null;

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
      // Ignore clipboard failures in restricted environments.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl p-6 print:border-0 print:shadow-none">
        <DialogHeader className="space-y-1.5 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Biên lai thanh toán điện tử
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                item.status === 'PAID'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                  : 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
              }
            >
              {item.status === 'PAID' ? 'Đã thanh toán' : item.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            FamiDoc Pro · Xác nhận tự động qua {item.paymentGateway || 'VietQR'} / SePay
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* 1. Mã & thời gian */}
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Mã hóa đơn</p>
              <p className="font-bold text-slate-900 tabular-nums">{item.paymentCode}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">Ngày ghi nhận</p>
              <p className="font-semibold text-slate-900 tabular-nums">
                {formatDateTime(item.paidAt || item.createdAt)}
              </p>
            </div>
          </div>

          {/* 2. Thông tin gói & hợp đồng */}
          <div className="space-y-2 rounded-xl border border-slate-200/80 p-3.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Thông tin gói &amp; Hợp đồng
            </h3>
            <dl className="grid grid-cols-1 gap-y-1.5 text-xs sm:grid-cols-2 sm:gap-x-4">
              <div>
                <dt className="text-slate-500">Gói dịch vụ</dt>
                <dd className="font-semibold text-slate-900">{item.packageName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Hợp đồng</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">
                  #{item.contractNumber}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Loại thu</dt>
                <dd className="font-semibold text-slate-900">
                  {getReceiptTypeLabel(item)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Cơ sở y tế</dt>
                <dd className="font-semibold text-slate-900">{item.facilityName}</dd>
              </div>
              {(item.contractStartDate || item.contractEndDate) && (
                <div>
                  <dt className="text-slate-500">Thời hạn hiệu lực</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums">
                    {formatShortDate(item.contractStartDate)} –{' '}
                    {formatShortDate(item.contractEndDate)}
                  </dd>
                </div>
              )}
              {typeof item.memberCount === 'number' && (
                <div>
                  <dt className="text-slate-500">Thành viên áp dụng</dt>
                  <dd className="font-semibold text-slate-900 tabular-nums">
                    {item.memberCount} thành viên
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 3. Chi tiết số tiền */}
          <div className="space-y-2 rounded-xl border border-slate-200/80 p-3.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chi tiết số tiền
            </h3>
            <div className="space-y-1.5 text-xs">
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
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-900">
                <span>Tổng đã thanh toán</span>
                <span className="text-primary tabular-nums">{formatVnd(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 4. Chứng từ giao dịch ngân hàng */}
          <div className="space-y-2 rounded-xl border border-slate-200/80 p-3.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Chứng từ giao dịch ngân hàng (SePay)
            </h3>
            <dl className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">Ngân hàng / STK nhận</dt>
                <dd className="font-semibold text-slate-900 tabular-nums">
                  {gatewayName}
                  {item.expectedAccountNumber ? ` · ${item.expectedAccountNumber}` : ''}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
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
              <div className="flex items-start justify-between gap-2">
                <dt className="shrink-0 text-slate-500">Nội dung CK</dt>
                <dd className="text-right font-medium text-slate-800 wrap-anywhere">
                  {item.transferContent}
                </dd>
              </div>
              {item.latestTransaction?.outcome && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Đối chiếu</dt>
                  <dd className="font-semibold text-emerald-700">
                    {item.latestTransaction.outcome}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onReportIssue(item)}
            className="text-xs text-slate-600 hover:text-amber-800 cursor-pointer"
          >
            <ShieldAlert className="mr-1.5 size-3.5" aria-hidden="true" />
            Báo lỗi / Khiếu nại
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
              <Link href={`/family/subscription/contract?contractId=${item.contractId}`}>
                <FileText className="mr-1.5 size-3.5" aria-hidden="true" />
                Xem hợp đồng điện tử
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Printer className="mr-1.5 size-3.5" aria-hidden="true" />
              In / Lưu PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
