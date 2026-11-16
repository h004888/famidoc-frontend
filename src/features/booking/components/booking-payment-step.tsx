'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  contractsApi,
  type VietQRPaymentRequestDto,
} from '@/lib/api/contracts.api';
import { FAMILY_GATE_REFRESH_EVENT } from '@/components/layout/family-subscription-gate';
import { useBookingNavigationOptional } from './booking-navigation-context';

export interface BookingPaymentStepProps {
  contractId?: string;
  pollingIntervalMs?: number;
}

function formatVnd(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function formatRemaining(expiresAt: string | undefined): number {
  if (!expiresAt) return 0;
  return Math.max(0, Date.parse(expiresAt) - Date.now());
}

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Đồng hồ đếm ngược tính lại từ mốc tuyệt đối mỗi giây để không trôi khi tab bị treo.
 * Dừng khi hết hạn hoặc tab ẩn.
 */
function PaymentCountdown({
  expiresAt,
  onExpire,
}: {
  expiresAt: string | undefined;
  onExpire: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() => formatRemaining(expiresAt));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    if (!expiresAt) return;

    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      const next = formatRemaining(expiresAt);
      setRemainingMs(next);
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
    };

    // Đồng bộ ngay một lần sau khi mount thay vì setState trực tiếp trong effect.
    tick();

    const timer = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [expiresAt, onExpire]);

  const isUrgent = remainingMs > 0 && remainingMs <= 60_000;

  return (
    <span
      data-testid="payment-countdown"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold tabular-nums ${
        isUrgent
          ? 'border-amber-300 bg-amber-50 text-amber-900'
          : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">timer</span>
      <span>Còn {formatClock(remainingMs)}</span>
    </span>
  );
}

type PaymentLoadOutcome =
  | { kind: 'paid'; payment: VietQRPaymentRequestDto | null }
  | { kind: 'pending'; payment: VietQRPaymentRequestDto }
  | { kind: 'needs_signing'; message: string }
  | { kind: 'error'; message: string };

async function resolvePaymentOrContractState(
  contractId: string
): Promise<PaymentLoadOutcome> {
  try {
    const request = await contractsApi.createVietQRPayment(contractId);
    if (request.status === 'PAID') {
      return { kind: 'paid', payment: request };
    }
    return { kind: 'pending', payment: request };
  } catch (error) {
    try {
      const detail = await contractsApi.getMedicalContractDetail(contractId);
      if (detail?.contractStatus === 'ACTIVE') {
        return { kind: 'paid', payment: null };
      }
      if (detail?.contractStatus === 'PENDING_APPROVAL') {
        return {
          kind: 'needs_signing',
          message:
            'Hợp đồng chưa hoàn tất đủ 4 chữ ký số trên Documenso để mở thanh toán VietQR.',
        };
      }
    } catch {
      // Giữ nguyên thông báo lỗi khởi tạo VietQR nếu không đọc được chi tiết hợp đồng.
    }
    return {
      kind: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Không thể khởi tạo yêu cầu thanh toán VietQR.',
    };
  }
}

/**
 * Bước 3 của luồng `/booking`: thanh toán VietQR theo `contractId` và màn hình chúc mừng
 * khi hợp đồng chuyển `ACTIVE`, mở khóa Dashboard gia đình.
 */
export function BookingPaymentStep({
  contractId,
  pollingIntervalMs = 8000,
}: BookingPaymentStepProps) {
  const [payment, setPayment] = useState<VietQRPaymentRequestDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contractId));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [needsSigning, setNeedsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isReissuing, setIsReissuing] = useState(false);
  const isMountedRef = useRef(true);
  const bookingNavigation = useBookingNavigationOptional();
  const syncNavigation = bookingNavigation?.update;

  const broadcastGateRefresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(FAMILY_GATE_REFRESH_EVENT));
    }
  }, []);

  const activate = useCallback(() => {
    setIsActivated(true);
    broadcastGateRefresh();
    // Hợp đồng đã ACTIVE: shell khóa điều hướng lùi về Bước 1.
    syncNavigation?.({ contractStatus: 'ACTIVE' });
  }, [broadcastGateRefresh, syncNavigation]);

  const applyLoadOutcome = useCallback(
    (outcome: PaymentLoadOutcome) => {
      if (outcome.kind === 'paid') {
        setPayment(outcome.payment);
        setErrorMessage(null);
        setNeedsSigning(false);
        activate();
        return;
      }
      if (outcome.kind === 'pending') {
        setPayment(outcome.payment);
        setErrorMessage(null);
        setNeedsSigning(false);
        setIsExpired(outcome.payment.status === 'EXPIRED');
        return;
      }
      if (outcome.kind === 'needs_signing') {
        setNeedsSigning(true);
        setErrorMessage(outcome.message);
        return;
      }
      setNeedsSigning(false);
      setErrorMessage(outcome.message);
    },
    [activate]
  );

  const loadPayment = useCallback(async () => {
    if (!contractId) return;
    try {
      const outcome = await resolvePaymentOrContractState(contractId);
      if (!isMountedRef.current) return;
      applyLoadOutcome(outcome);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyLoadOutcome, contractId]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setNeedsSigning(false);
    void loadPayment();
  };

  // Đồng bộ contractId lên shell ngay khi vào Bước 3 để nút Quay lại giữ đúng ngữ cảnh.
  useEffect(() => {
    if (!contractId) return;
    syncNavigation?.({
      contractId,
      contractStatus: undefined,
      doctorId: undefined,
    });
  }, [contractId, syncNavigation]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!contractId) {
      return () => {
        isMountedRef.current = false;
      };
    }
    async function loadInitialPayment() {
      try {
        const outcome = await resolvePaymentOrContractState(contractId as string);
        if (!isMountedRef.current) return;
        applyLoadOutcome(outcome);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
    void loadInitialPayment();
    return () => {
      isMountedRef.current = false;
    };
  }, [applyLoadOutcome, contractId]);

  // Tự động kiểm tra trạng thái thanh toán để phát hiện hợp đồng đã ACTIVE.
  useEffect(() => {
    if (!contractId || !payment || isActivated || pollingIntervalMs <= 0) return;
    const timer = setInterval(async () => {
      try {
        const [latestPayment, latestGate] = await Promise.all([
          contractsApi.getPaymentStatus(payment.id),
          contractsApi.getFamilyGateStatus(),
        ]);
        if (!isMountedRef.current) return;
        setPayment(latestPayment);
        if (latestPayment.status === 'PAID' || latestGate.hasActiveContract) {
          activate();
          toast.success('Hợp đồng đã kích hoạt ACTIVE. Dashboard gia đình đã được mở khóa!');
        }
      } catch {
        // Bỏ qua lỗi tạm thời của nhịp kiểm tra nền.
      }
    }, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [activate, contractId, isActivated, payment, pollingIntervalMs]);

  const handleVerifyPayment = async () => {
    if (!payment) return;
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const latestPayment = await contractsApi.getPaymentStatus(payment.id);
      setPayment(latestPayment);
      const latestGate = await contractsApi.getFamilyGateStatus();
      if (latestPayment.status === 'PAID' || latestGate.hasActiveContract) {
        activate();
        toast.success('Đã xác nhận thanh toán. Hợp đồng đã kích hoạt ACTIVE!');
      } else {
        toast.info(
          `Chưa ghi nhận giao dịch cho mã ${latestPayment.paymentCode}. Vui lòng chuyển khoản đúng nội dung "${latestPayment.transferContent || latestPayment.paymentCode}" rồi kiểm tra lại.`
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể kiểm tra trạng thái thanh toán.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text);
    setIsCopied(key);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleReissue = async () => {
    if (!contractId || isReissuing) return;
    setIsReissuing(true);
    setErrorMessage(null);
    try {
      // Máy chủ tự đóng mã quá hạn và cấp mã mới với attempt + 1.
      const fresh = await contractsApi.createVietQRPayment(contractId);
      if (!isMountedRef.current) return;
      if (fresh.status === 'PAID') {
        activate();
        return;
      }
      setPayment(fresh);
      setIsExpired(fresh.status === 'EXPIRED');
      toast.success('Đã tạo mã thanh toán mới.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể tạo mã thanh toán mới. Vui lòng thử lại.'
      );
    } finally {
      if (isMountedRef.current) setIsReissuing(false);
    }
  };

  const markExpired = useCallback(() => {
    setIsExpired(true);
  }, []);

  if (!contractId) {
    return (
      <section
        data-testid="booking-payment-missing-contract"
        className="rounded-2xl border border-amber-200 bg-white p-6 sm:p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Chưa có hợp đồng cần thanh toán
          </h1>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
            Đường dẫn thanh toán cần mã hợp đồng. Hãy mở lại liên kết trong email thông báo thanh
            toán, hoặc theo dõi tiến trình ký hợp đồng đang chờ.
          </p>
        </div>
        <Link
          href="/doctors"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Chọn bác sĩ &amp; gói chăm sóc</span>
        </Link>
      </section>
    );
  }

  if (isActivated) {
    return (
      <section
        data-testid="booking-payment-success"
        className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 text-center space-y-5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <span className="material-symbols-outlined text-[30px]">verified</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            Chúc mừng! Gói chăm sóc gia đình đã được kích hoạt
          </h1>
          <p className="mx-auto max-w-lg text-xs sm:text-sm text-slate-600 leading-relaxed">
            Hợp đồng 4 bên đã có hiệu lực. Bạn có thể khai báo hồ sơ thành viên và bắt đầu sử dụng
            toàn bộ tính năng chăm sóc sức khỏe gia đình.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/family/members"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-emerald-800"
          >
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            <span>Thêm hồ sơ thành viên</span>
          </Link>
          <Link
            href="/family"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-50"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            <span>Vào Bảng điều khiển Gia đình</span>
          </Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3"
      >
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-xs font-medium text-slate-500">
          Đang khởi tạo mã thanh toán VietQR...
        </p>
      </div>
    );
  }

  if (!payment) {
    return (
      <section
        role="alert"
        data-testid="booking-payment-error"
        className="rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8 space-y-4"
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined shrink-0 text-[22px] text-rose-600">error</span>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-rose-900">
              Không thể khởi tạo thanh toán VietQR
            </h2>
            <p className="text-xs text-rose-800 leading-relaxed">
              {errorMessage || 'Vui lòng thử lại sau ít phút.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700 cursor-pointer"
          >
            Thử lại
          </button>
          <Link
            href={`/booking/tracking?contractId=${encodeURIComponent(contractId)}`}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              needsSigning
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'border border-rose-200 bg-white text-rose-800 hover:bg-rose-100'
            }`}
          >
            Quay lại theo dõi ký 4 bên
          </Link>
        </div>
      </section>
    );
  }

  const amountLabel = formatVnd(payment.amountVnd);
  const transferMemo = payment.transferContent || payment.paymentCode;

  return (
    <section
      data-testid="booking-payment-pending"
      className="space-y-5"
      aria-label="Thanh toán VietQR kích hoạt gói"
    >
      <Link
        href={`/booking/tracking?contractId=${encodeURIComponent(contractId)}`}
        data-testid="booking-back-to-step-2"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        <span>Quay lại theo dõi ký hợp đồng</span>
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-slate-900">
            Thanh toán VietQR để kích hoạt gói
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ hoặc chuyển khoản đúng số tiền và nội
            dung đối soát bên dưới. Hệ thống tự động kích hoạt hợp đồng khi nhận được giao dịch.
          </p>
        </div>
        {!isExpired && <PaymentCountdown expiresAt={payment.expiresAt} onExpire={markExpired} />}
      </header>

      {errorMessage && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      {isExpired && (
        <div
          role="alert"
          data-testid="booking-payment-expired"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
        >
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-destructive">
            timer_off
          </span>
          <div className="space-y-1">
            <p className="font-semibold text-destructive">Mã thanh toán đã hết hạn</p>
            <p className="text-muted-foreground">
              Mã VietQR chỉ có hiệu lực trong 15 phút. Vui lòng tạo mã mới để tiếp tục thanh toán.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center lg:col-span-4">
          {payment.qrUrl ? (
            <div
              className={`rounded-2xl border border-slate-200 bg-white p-3 ${
                isExpired ? 'pointer-events-none opacity-40 blur-sm' : ''
              }`}
            >
              <img
                src={payment.qrUrl}
                alt="Mã VietQR thanh toán kích hoạt gói"
                aria-hidden={isExpired}
                className="h-48 w-48 object-contain"
              />
            </div>
          ) : (
            <div
              role="status"
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm lg:w-full"
            >
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-slate-600">
                info
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Môi trường thử nghiệm</p>
                <p className="text-slate-600">
                  Không có mã QR cho giao dịch mô phỏng. Dùng thông tin chuyển khoản bên cạnh để
                  thanh toán thủ công.
                </p>
              </div>
            </div>
          )}
          <p className="text-sm leading-relaxed text-slate-600">
            {payment.qrUrl
              ? 'Quét mã bằng ứng dụng ngân hàng để tự động điền số tài khoản, số tiền và nội dung đối soát.'
              : 'Nhập thủ công ba thông tin bên cạnh vào ứng dụng ngân hàng.'}
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-8">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <span className="block text-xs font-semibold uppercase tracking-wider text-primary">
              Tài khoản thụ hưởng chính thức
            </span>
            <h2 className="text-base font-bold text-slate-900">
              CTCP Chăm Sóc Y Tế Gia Đình FamiDoc
            </h2>
            <span className="inline-block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {payment.expectedGateway}
            </span>
          </div>

          {[
            { key: 'acc', label: `Số tài khoản (${payment.expectedGateway})`, value: payment.expectedAccountNumber },
            { key: 'amt', label: 'Số tiền thanh toán', value: amountLabel },
            { key: 'memo', label: 'Nội dung chuyển khoản (Tự động đối soát)', value: transferMemo },
          ].map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="min-w-0">
                <span className="block text-xs font-medium text-slate-500">{row.label}</span>
                <strong className="block truncate text-sm font-bold tabular-nums text-slate-900">
                  {row.value}
                </strong>
              </div>
              <button
                type="button"
                disabled={isExpired}
                aria-label={`Sao chép ${row.label}`}
                onClick={() => copyToClipboard(row.value, row.key)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isCopied === row.key ? 'Đã chép ✓' : 'Sao chép'}
              </button>
            </div>
          ))}

          <span aria-live="polite" className="sr-only">
            {isCopied ? 'Đã sao chép nội dung thanh toán vào bộ nhớ tạm.' : ''}
          </span>

          {payment.attempt > 1 && (
            <p className="text-xs font-medium text-amber-800" data-testid="payment-attempt">
              Lần thanh toán thứ {payment.attempt} — mã trước đó đã hết hiệu lực.
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            {isExpired ? (
              <button
                type="button"
                onClick={() => void handleReissue()}
                disabled={isReissuing}
                data-testid="payment-reissue"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto cursor-pointer"
              >
                {isReissuing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Đang tạo mã mới...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    <span>Tạo mã thanh toán mới</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleVerifyPayment()}
                disabled={isVerifying}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Đang kiểm tra giao dịch...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Xác nhận tôi đã chuyển khoản</span>
                  </>
                )}
              </button>
            )}
            <span className="text-xs tabular-nums text-slate-500">
              Mã thanh toán: {payment.paymentCode}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
