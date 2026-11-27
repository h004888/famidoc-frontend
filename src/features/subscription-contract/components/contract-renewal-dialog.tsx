'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  contractsApi,
  type ContractRenewalPreviewDto,
  type VietQRPaymentRequestDto,
} from '@/lib/api/contracts.api';
import { extractErrorMessage } from '@/lib/api/error-handler';

interface ContractRenewalDialogProps {
  contractId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? shortDateFormatter.format(parsed)
    : value;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? dateTimeFormatter.format(parsed)
    : value;
}

export function ContractRenewalDialog({
  contractId,
  onClose,
  onSuccess,
}: ContractRenewalDialogProps) {
  const [preview, setPreview] = useState<ContractRenewalPreviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [renewalContractId, setRenewalContractId] = useState<string | null>(null);
  const [payment, setPayment] = useState<VietQRPaymentRequestDto | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paidStatus, setPaidStatus] = useState<'PENDING_ACTIVATION' | 'ACTIVE' | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    contractsApi
      .getRenewalPreview(contractId)
      .then((res) => {
        if (active) setPreview(res);
      })
      .catch((err) => {
        if (active) {
          setError(
            extractErrorMessage(err, 'Không thể tải thông tin gia hạn hợp đồng.'),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contractId]);

  const handleConfirmRenewal = async () => {
    if (!preview?.eligible || !preview.termsHash || !acceptedTerms) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await contractsApi.confirmRenewal(contractId, {
        acceptedTerms: true,
        termsHash: preview.termsHash,
      });
      setRenewalContractId(created.id);
      const qr = await contractsApi.createVietQRPayment(created.id);
      setPayment(qr);
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Không thể xác nhận gia hạn hợp đồng.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!payment) return;
    setCheckingPayment(true);
    setError('');
    try {
      const status = await contractsApi.getPaymentStatus(payment.id);
      if (status.status === 'PAID') {
        const isPendingActivation =
          status.activation?.blockingReasons?.includes('AWAITING_START_DATE') ||
          preview?.caseType === 'CASE_A';
        setPaidStatus(isPendingActivation ? 'PENDING_ACTIVATION' : 'ACTIVE');
        onSuccess?.();
      }
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Không thể kiểm tra trạng thái thanh toán.'),
      );
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleCancelRenewal = async () => {
    if (!renewalContractId) return;
    setCancelling(true);
    setError('');
    try {
      await contractsApi.cancelDraftContract(
        renewalContractId,
        'Gia đình hủy yêu cầu gia hạn chưa thanh toán',
      );
      onClose();
    } catch (err) {
      setError(
        extractErrorMessage(err, 'Không thể hủy yêu cầu gia hạn.'),
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gia hạn hợp đồng chăm sóc sức khỏe"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Gia hạn hợp đồng chăm sóc sức khỏe
            </h2>
            {preview && (
              <p className="text-xs text-slate-500">
                Hợp đồng gốc #{preview.sourceContractNumber}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Đang kiểm tra điều kiện gia hạn…</span>
            </div>
          ) : error && !preview ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          ) : paidStatus ? (
            <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
              <h3 className="text-base font-bold text-emerald-900">
                {paidStatus === 'PENDING_ACTIVATION'
                  ? 'Đã thanh toán – chờ hiệu lực'
                  : 'Hợp đồng gia hạn đã có hiệu lực'}
              </h3>
              <p className="text-sm text-emerald-800">
                {paidStatus === 'PENDING_ACTIVATION'
                  ? `Kỳ gia hạn mới sẽ tự động kích hoạt vào ngày ${formatDate(preview?.expectedStartDate)} ngay sau khi kỳ hiện tại kết thúc.`
                  : 'Hợp đồng gia hạn của gia đình đã được kích hoạt thành công.'}
              </p>
              <Button type="button" onClick={onClose} className="rounded-xl">
                Hoàn tất
              </Button>
            </div>
          ) : payment ? (
            <div className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {error}
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <QrCode className="size-4" />
                  <span>Thanh toán VietQR để kích hoạt kỳ gia hạn</span>
                </div>
                {payment.qrUrl && (
                  <img
                    src={payment.qrUrl}
                    alt="Mã QR thanh toán gia hạn hợp đồng"
                    className="mx-auto h-52 w-52 rounded-xl border border-slate-200 bg-white p-2"
                  />
                )}
                <div className="space-y-1 text-sm">
                  <p>
                    Mã thanh toán:{' '}
                    <strong className="tabular-nums text-slate-900">
                      {payment.paymentCode}
                    </strong>
                  </p>
                  <p>
                    Số tiền:{' '}
                    <strong className="text-primary tabular-nums">
                      {payment.amountVnd.toLocaleString('vi-VN')} đ
                    </strong>
                  </p>
                  <p className="flex items-center justify-center gap-1 text-xs text-amber-700">
                    <Clock className="size-3.5" />
                    <span>
                      Hạn thanh toán: {formatDateTime(preview?.paymentDeadlineAt ?? payment.expiresAt)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelRenewal}
                  disabled={cancelling}
                  className="rounded-xl text-xs"
                >
                  {cancelling ? 'Đang hủy…' : 'Hủy yêu cầu gia hạn'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCheckPayment}
                  disabled={checkingPayment}
                  className="rounded-xl text-xs font-semibold"
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  {checkingPayment ? 'Đang kiểm tra…' : 'Kiểm tra thanh toán'}
                </Button>
              </div>
            </div>
          ) : preview && !preview.eligible ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-rose-900">
                  <AlertCircle className="size-4" />
                  <span>Không thể gia hạn hợp đồng này</span>
                </div>
                <ul className="list-disc pl-5 text-sm text-rose-800 space-y-1">
                  {preview.blockingReasons.map((reason) => (
                    <li key={reason.code}>{reason.message}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                  Đóng
                </Button>
                {preview.suggestBuyNew && (
                  <Button asChild className="rounded-xl">
                    <Link href="/doctors">Mua gói mới</Link>
                  </Button>
                )}
              </div>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {error}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">
                    {preview.package?.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {preview.caseType === 'CASE_A'
                      ? 'Gia hạn nối tiếp (không gián đoạn)'
                      : 'Gia hạn trong thời gian ân hạn'}
                  </Badge>
                </div>
                <p className="text-slate-600">
                  Thời hạn mới:{' '}
                  <strong className="text-slate-900 tabular-nums">
                    {formatDate(preview.expectedStartDate)} –{' '}
                    {formatDate(preview.expectedEndDate)}
                  </strong>
                </p>
                <p className="text-slate-600">
                  Bác sĩ phụ trách:{' '}
                  <strong className="text-slate-900">
                    {preview.doctor?.fullName ?? '—'}
                  </strong>
                  {preview.facility?.name ? ` · ${preview.facility.name}` : ''}
                </p>
                <p className="text-slate-600">
                  Quyền lợi cấp mới: {preview.package?.quotas.homeVisits ?? 0} lượt khám tại nhà ·{' '}
                  {preview.package?.quotas.videoConsultations ?? 0} lượt tư vấn video
                </p>
                <p className="text-slate-600">
                  Thành viên áp dụng ({preview.members.length}):{' '}
                  <span className="font-medium text-slate-800">
                    {preview.members.map((m) => m.fullName).join(', ')}
                  </span>
                </p>
                <p className="text-base font-bold text-primary tabular-nums">
                  Tổng chi phí gia hạn:{' '}
                  {(preview.pricing?.totalPriceVnd ?? 0).toLocaleString('vi-VN')} đ
                </p>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-xs text-slate-700 cursor-pointer">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))}
                />
                <span>
                  Tôi đã đọc và đồng ý gia hạn hợp đồng với đúng gói dịch vụ, bác sĩ phụ trách, danh sách thành viên và mức giá hiện hành nêu trên (không cần ký lại 4 bên).
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl"
                >
                  Đóng
                </Button>
                <Button
                  type="button"
                  disabled={!acceptedTerms || submitting}
                  onClick={handleConfirmRenewal}
                  className="rounded-xl font-semibold"
                >
                  <ShieldCheck className="mr-1.5 size-4" />
                  {submitting ? 'Đang tạo kỳ gia hạn…' : 'Xác nhận gia hạn'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
