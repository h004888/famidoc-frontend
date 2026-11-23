'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  isValidSupportAttachmentFile,
  readExistingSupportCaseId,
  supportCasesApi,
  type SupportCaseDetail,
} from '@/lib/api';
import { extractErrorMessage } from '@/lib/api/error-handler';
import { SupportCaseThread } from './support-case-thread';

export interface PaymentIssueContext {
  contractId: string;
  contractNumber?: string;
  packageName?: string;
  invoiceId: string;
  paymentCode: string;
  transferContent?: string;
  amountVnd: number;
  paymentStatus: string;
  latestTransaction?: {
    referenceCode?: string | null;
    outcome?: string;
    reason?: string | null;
    amountReceived?: number;
  } | null;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã ghi nhận thanh toán',
  EXPIRED: 'Hết hạn mã QR',
  CANCELLED: 'Đã hủy mã thanh toán',
};

const QUICK_ISSUE_TEMPLATES = [
  'Tôi đã chuyển tiền thành công nhưng gói chăm sóc vẫn chưa kích hoạt.',
  'Ngân hàng đã trừ tiền nhưng mã VietQR báo hết hạn trước khi hệ thống ghi nhận.',
  'Tôi chuyển khoản nhầm số tiền hoặc thiếu mã nội dung chuyển khoản, nhờ Admin hỗ trợ đối soát.',
];

export interface PaymentIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: PaymentIssueContext | null;
  existingCaseId?: string | null;
  onCaseChanged?: (detail: SupportCaseDetail) => void;
}

export function PaymentIssueDialog({
  open,
  onOpenChange,
  context,
  existingCaseId,
  onCaseChanged,
}: PaymentIssueDialogProps) {
  const [caseDetail, setCaseDetail] = useState<SupportCaseDetail | null>(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [failedCaseId, setFailedCaseId] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadExistingCase = useCallback(async (caseId: string) => {
    setLoadingCase(true);
    setLoadError('');
    setFailedCaseId(null);
    try {
      const detail = await supportCasesApi.detail(caseId);
      if (detail.caseType !== 'PAYMENT_ISSUE') {
        setLoadError('Không tìm thấy hồ sơ báo lỗi chuyển khoản.');
        return null;
      }
      setCaseDetail(detail);
      return detail;
    } catch (cause) {
      setFailedCaseId(caseId);
      setLoadError(
        extractErrorMessage(
          cause,
          'Không tải được hồ sơ báo lỗi chuyển khoản hiện có.',
        ),
      );
      return null;
    } finally {
      setLoadingCase(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setCaseDetail(null);
      setFailedCaseId(null);
      setLoadError('');
      setSubmitError('');
      setMessage('');
      setReceiptFile(null);
      return;
    }
    if (existingCaseId) {
      void loadExistingCase(existingCaseId);
    }
  }, [existingCaseId, loadExistingCase, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context || submitting) return;
    setSubmitError('');

    const trimmed = message.trim();
    if (trimmed.length < 10 || trimmed.length > 2000) {
      setSubmitError(
        'Vui lòng mô tả ngắn sự cố chuyển khoản (từ 10 đến 2.000 ký tự).',
      );
      return;
    }

    setSubmitting(true);
    try {
      let attachmentKeys: string[] | undefined;
      if (receiptFile) {
        const uploaded = await supportCasesApi.uploadAttachment(receiptFile);
        attachmentKeys = [uploaded.attachmentKey];
      }

      const created = await supportCasesApi.createPaymentIssueCase({
        contractId: context.contractId,
        invoiceId: context.invoiceId,
        message: trimmed,
        ...(attachmentKeys ? { attachmentKeys } : {}),
      });
      setCaseDetail(created);
      setMessage('');
      setReceiptFile(null);
      onCaseChanged?.(created);
      toast.success(
        `Đã gửi báo lỗi chuyển khoản (${created.caseCode}). Admin sẽ đối soát giao dịch SePay và phản hồi ngay trong hồ sơ này.`,
      );
    } catch (cause) {
      // Nếu hóa đơn đã có hồ sơ mở ở tab khác, tự mở thẳng hồ sơ hiện có.
      const existingId = readExistingSupportCaseId(cause);
      if (existingId) {
        const detail = await loadExistingCase(existingId);
        if (detail) {
          onCaseChanged?.(detail);
          toast.info('Hóa đơn này đã có hồ sơ đang xử lý. Hệ thống đã mở lại cuộc trao đổi.');
        }
      } else {
        setSubmitError(
          extractErrorMessage(
            cause,
            'Không gửi được báo lỗi chuyển khoản. Vui lòng thử lại.',
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!context && !existingCaseId) return null;

  const invoice = caseDetail?.invoice;
  const displayContext = invoice ? {
    paymentCode: invoice.invoiceCode,
    amountVnd: invoice.totalPayable,
    paymentStatus: invoice.paymentStatus,
    transferContent: invoice.transferContent,
    contractNumber: caseDetail?.contract.contractNumber,
    latestTransaction: caseDetail?.relatedTransactions[0],
  } : context;
  const amountLabel = displayContext?.amountVnd.toLocaleString('vi-VN');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 sm:max-w-2xl sm:rounded-3xl [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-white/15 [&>[data-slot=dialog-close]]:p-1.5 [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:opacity-90 [&>[data-slot=dialog-close]]:hover:bg-white/25">
        <DialogHeader className="shrink-0 bg-gradient-to-r from-[#09253b] to-[#0037c1] p-4 text-left text-white sm:p-5">
          <div className="pr-8 text-xs font-semibold text-blue-100">
            Hỗ trợ đối soát giao dịch SePay
          </div>
          <DialogTitle className="mt-0.5 text-base font-bold text-white sm:text-lg">
            {caseDetail
              ? `Theo dõi báo lỗi chuyển khoản (${caseDetail.caseCode})`
              : 'Báo lỗi chuyển khoản'}
          </DialogTitle>
          <DialogDescription className="text-xs text-blue-100/90">
            Hệ thống tự động gắn mã giao dịch, hợp đồng và số tiền cần thu để Admin
            kiểm tra nhanh mà không cần soạn đơn khiếu nại.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-xs sm:p-5 sm:text-sm">
          {displayContext && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Thông tin hệ thống tự động điền sẵn
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <div className="min-w-0">
                  <span className="text-slate-500">Mã thanh toán: </span>
                  <strong className="text-slate-900 tabular-nums wrap-anywhere">
                    {displayContext.paymentCode}
                  </strong>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-500">Số tiền cần thu: </span>
                  <strong className="text-primary tabular-nums">{amountLabel} đ</strong>
                </div>
                {displayContext.contractNumber && (
                  <div className="min-w-0">
                    <span className="text-slate-500">Hợp đồng: </span>
                    <strong className="text-slate-900 tabular-nums">
                      {displayContext.contractNumber}
                    </strong>
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-slate-500">Trạng thái hóa đơn: </span>
                  <strong className="text-slate-900">
                    {PAYMENT_STATUS_LABELS[displayContext.paymentStatus] ||
                      displayContext.paymentStatus}
                  </strong>
                </div>
                {displayContext.transferContent && (
                  <div className="min-w-0 sm:col-span-2">
                    <span className="text-slate-500">Nội dung chuyển khoản: </span>
                    <strong className="text-slate-900 tabular-nums break-words">
                      {displayContext.transferContent}
                    </strong>
                  </div>
                )}
                {displayContext.latestTransaction?.referenceCode && (
                  <div className="min-w-0 sm:col-span-2">
                    <span className="text-slate-500">Giao dịch SePay gần nhất: </span>
                    <strong className="text-amber-900 tabular-nums">
                      {displayContext.latestTransaction.referenceCode}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {loadingCase || (existingCaseId && !caseDetail && !loadError) ? (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
              <RefreshCw className="size-4 animate-spin text-primary" aria-hidden="true" />
              <span>Đang tải hồ sơ trao đổi với Admin…</span>
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            >
              <p>{loadError}</p>
              {failedCaseId && (
                <button
                  type="button"
                  className="mt-2 font-semibold underline"
                  onClick={() => void loadExistingCase(failedCaseId)}
                >
                  Thử tải lại hồ sơ
                </button>
              )}
            </div>
          ) : caseDetail ? (
            <SupportCaseThread
              caseDetail={caseDetail}
              viewerRole="FAMILY_REP"
              onUpdated={(updated) => {
                setCaseDetail(updated);
                onCaseChanged?.(updated);
              }}
              onRefresh={async () => {
                const refreshed = await loadExistingCase(caseDetail.id);
                if (refreshed) onCaseChanged?.(refreshed);
              }}
              refreshing={loadingCase}
            />
          ) : (
            <form
              id="payment-issue-form"
              noValidate
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-amber-700"
                  aria-hidden="true"
                />
                <p className="leading-relaxed">
                  Nếu ngân hàng đã trừ tiền nhưng gói chưa kích hoạt, hãy báo lỗi
                  tại đây và chờ Admin đối soát trước khi thử chuyển khoản lại để
                  tránh chuyển trùng 2 lần.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="payment-issue-message"
                  className="text-xs font-semibold text-slate-800"
                >
                  Mô tả ngắn sự cố gặp phải{' '}
                  <span className="text-rose-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ISSUE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setMessage(tpl)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-primary/40 hover:bg-blue-50 hover:text-primary cursor-pointer text-left"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
                <Textarea
                  id="payment-issue-message"
                  rows={3}
                  maxLength={2000}
                  disabled={submitting}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ví dụ: Tôi đã chuyển tiền lúc 14:20 qua MBBank nhưng gói vẫn chưa kích hoạt..."
                  className="rounded-xl text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="payment-issue-receipt"
                  className="text-xs font-semibold text-slate-800"
                >
                  Đính kèm ảnh biên lai chuyển khoản (tùy chọn, PDF/PNG/JPEG ≤ 5 MB)
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="payment-issue-receipt"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={submitting}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setSubmitError('');
                      if (file && !isValidSupportAttachmentFile(file)) {
                        e.target.value = '';
                        setReceiptFile(null);
                        setSubmitError(
                          'Chỉ chấp nhận ảnh biên lai định dạng PDF, PNG hoặc JPEG.',
                        );
                        return;
                      }
                      if (
                        file &&
                        (file.size === 0 || file.size > 5 * 1024 * 1024)
                      ) {
                        e.target.value = '';
                        setReceiptFile(null);
                        setSubmitError(
                          'Tệp biên lai phải có dung lượng từ 1 byte đến 5 MB.',
                        );
                        return;
                      }
                      setReceiptFile(file);
                    }}
                  />
                  <label
                    htmlFor="payment-issue-receipt"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
                  >
                    <Upload className="size-3.5" aria-hidden="true" />
                    <span>Chọn ảnh biên lai</span>
                  </label>
                  {receiptFile ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 max-w-56">
                      <span className="truncate">{receiptFile.name}</span>
                      <button
                        type="button"
                        aria-label="Xóa ảnh biên lai"
                        onClick={() => setReceiptFile(null)}
                        className="text-blue-700 hover:text-blue-950 cursor-pointer"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Chưa chọn tệp</span>
                  )}
                </div>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
                >
                  {submitError}
                </div>
              )}
            </form>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          {context && !existingCaseId && !caseDetail && !loadingCase && !loadError && (
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={(e) => {
                void handleSubmit(e as unknown as React.FormEvent);
              }}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {submitting ? 'Đang gửi báo lỗi…' : 'Gửi báo lỗi chuyển khoản'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
