'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  contractsApi,
  type VietQRPaymentRequestDto,
} from '@/lib/api/contracts.api';
import { FAMILY_GATE_REFRESH_EVENT } from '@/components/layout/family-subscription-gate';
import { useBookingNavigationOptional } from './booking-navigation-context';

export interface BookingPaymentStepProps {
  contractId?: string;
  addendumId?: string;
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
  | { kind: 'active'; payment: VietQRPaymentRequestDto | null }
  | { kind: 'payment'; payment: VietQRPaymentRequestDto }
  | { kind: 'needs_signing'; message: string; blockingReasons: string[] }
  | { kind: 'error'; message: string; blockingReasons: string[] };

/**
 * Diễn giải mã lý do chặn thanh toán do backend trả trong `error.blockingReasons`
 * (RFC 9457 extension) thành thông báo tiếng Việt dễ hiểu cho hộ gia đình.
 */
const BLOCKING_REASON_LABELS: Record<string, string> = {
  FAMILY_SIGNATURE_REQUIRED:
    'Đại diện hộ gia đình chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  ADMIN_SIGNATURE_REQUIRED:
    'Ban quản trị FamiDoc chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  FACILITY_SIGNATURE_REQUIRED:
    'Cơ sở y tế chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  DOCTOR_SIGNATURE_REQUIRED:
    'Bác sĩ phụ trách chưa hoàn tất chữ ký số trên hợp đồng 4 bên.',
  FACILITY_ASSIGNMENT_REQUIRED:
    'Hợp đồng chưa được gán cơ sở y tế phụ trách.',
  DOCTOR_ASSIGNMENT_REQUIRED:
    'Hợp đồng chưa có bác sĩ gia đình phụ trách.',
  DOCTOR_VERIFICATION_REQUIRED:
    'Cơ sở y tế hoặc bác sĩ phụ trách chưa hoàn tất điều kiện kích hoạt: cơ sở cần có hợp đồng cung ứng nhân lực B2B còn hiệu lực và hồ sơ bác sĩ phải được xác minh.',
  PANEL_CAPACITY_UNAVAILABLE:
    'Bác sĩ phụ trách đã đạt giới hạn số hộ gia đình nhận chăm sóc. Vui lòng chọn bác sĩ khác.',
  CONTRACT_TERM_NOT_CURRENT:
    'Thời hạn hợp đồng chưa bắt đầu hoặc đã hết hiệu lực tại thời điểm thanh toán.',
  ADDITIONAL_FAMILY_MEMBERS_PAYMENT_REQUIRED:
    'Số thành viên đang hoạt động của hộ gia đình vượt quá số suất trên hợp đồng. Vui lòng thanh toán bổ sung cho các thành viên tăng thêm.',
  CONTRACT_CANCELLED:
    'Hợp đồng đã bị hủy nên không thể tiếp tục thanh toán.',
  VERIFIED_PAYMENT_REQUIRED:
    'Chưa ghi nhận giao dịch chuyển khoản được xác minh cho hợp đồng này.',
  FAMILY_ALREADY_HAS_ACTIVE_CONTRACT:
    'Hộ gia đình đang có một hợp đồng khác còn hiệu lực.',
};

const REVIEW_REASON_LABELS: Record<string, string> = {
  LATE_PAYMENT: 'Giao dịch chuyển khoản đến sau khi mã VietQR hết hạn 15 phút.',
  WRONG_ACCOUNT: 'Giao dịch chuyển sai số tài khoản hoặc ngân hàng thụ hưởng.',
  AMOUNT_MISMATCH: 'Số tiền chuyển khoản không khớp với số tiền trên hóa đơn.',
  SUPERSEDED_REQUEST: 'Giao dịch sử dụng mã thanh toán cũ đã được thay thế.',
  CANCELLED_REQUEST: 'Giao dịch chuyển vào mã thanh toán đã hủy.',
  ALREADY_PAID: 'Mã thanh toán này đã được ghi nhận giao dịch trước đó.',
  CONTRACT_UNAVAILABLE: 'Hợp đồng hiện không ở trạng thái sẵn sàng kích hoạt.',
  BEFORE_REQUEST: 'Thời gian giao dịch xảy ra trước khi mã thanh toán được tạo.',
  FUTURE_TRANSACTION: 'Thời gian giao dịch không hợp lệ.',
  DUPLICATE_BANK_REFERENCE: 'Mã tham chiếu ngân hàng bị trùng lặp.',
  MISSING_CODE: 'Nội dung chuyển khoản thiếu mã thanh toán.',
  AMBIGUOUS_CODE: 'Nội dung chuyển khoản chứa nhiều mã thanh toán không rõ ràng.',
  UNKNOWN_CODE: 'Mã thanh toán trong nội dung chuyển khoản không khớp.',
};

const GENERIC_BLOCKING_MESSAGE =
  'Hợp đồng chưa đủ điều kiện để thanh toán VietQR. Vui lòng xem chi tiết bên dưới.';

function readBlockingReasonsFromError(error: unknown): string[] {
  const details = (error as { details?: unknown } | null)?.details as
    | { error?: { blockingReasons?: unknown } }
    | undefined;
  const raw = details?.error?.blockingReasons;
  if (!Array.isArray(raw)) return [];
  return raw.filter((reason): reason is string => typeof reason === 'string');
}

function describeBlockingReasons(codes: string[]): string[] {
  const seen = new Set<string>();
  const messages: string[] = [];
  for (const code of codes) {
    const label = BLOCKING_REASON_LABELS[code] ?? `Lý do chưa xác định (${code}).`;
    if (seen.has(label)) continue;
    seen.add(label);
    messages.push(label);
  }
  return messages;
}

function isClosedPayment(payment: VietQRPaymentRequestDto) {
  return payment.status === 'EXPIRED' || payment.status === 'CANCELLED';
}

async function isPaidContractActive(
  payment: VietQRPaymentRequestDto,
  contractId: string,
  addendumId?: string,
): Promise<boolean> {
  if (addendumId || payment.addendumId || payment.status !== 'PAID' || payment.contractId !== contractId) {
    return false;
  }
  if (payment.activation) return payment.activation.activated;

  const gate = await contractsApi.getFamilyGateStatus().catch(() => null);
  if (gate?.activeContract?.id === contractId) return true;

  const detail = await contractsApi.getMedicalContractDetail(contractId).catch(() => null);
  return detail?.contractStatus === 'ACTIVE';
}

async function resolveIssuedPayment(
  request: VietQRPaymentRequestDto,
  contractId: string,
  addendumId?: string,
): Promise<PaymentLoadOutcome> {
  const latest =
    request.status === 'PAID' && !addendumId && !request.activation
      ? await contractsApi.getPaymentStatus(request.id).catch(() => null)
      : null;
  const payment = latest?.status === 'PAID' && latest.id === request.id ? latest : request;
  return {
    kind: (await isPaidContractActive(payment, contractId, addendumId)) ? 'active' : 'payment',
    payment,
  };
}

async function resolvePaymentOrContractState(
  contractId: string,
  addendumId?: string,
): Promise<PaymentLoadOutcome> {
  const storageKey = `famidoc:payment-request:${contractId}:${addendumId ?? ''}`;
  try {
    const request = addendumId
      ? await contractsApi.createVietQRPayment(contractId, addendumId)
      : await contractsApi.createVietQRPayment(contractId);
    try {
      sessionStorage.setItem(storageKey, request.id);
    } catch {
      // Bộ nhớ trình duyệt có thể bị vô hiệu hóa.
    }
    return await resolveIssuedPayment(request, contractId, addendumId);
  } catch (error) {
    const blockingReasons = readBlockingReasonsFromError(error);
    try {
      const previousRequestId = sessionStorage.getItem(storageKey);
      if (previousRequestId) {
        const request = await contractsApi.getPaymentStatus(previousRequestId);
        if (
          request.status === 'PAID' &&
          request.contractId === contractId &&
          (request.addendumId ?? undefined) === addendumId
        ) {
          const active = await isPaidContractActive(request, contractId, addendumId);
          return { kind: active ? 'active' : 'payment', payment: request };
        }
      }
    } catch {
      // Giữ lỗi khởi tạo nếu chưa lấy được trạng thái yêu cầu đã tạo.
    }
    try {
      const detail = await contractsApi.getMedicalContractDetail(contractId);
      if (!addendumId && detail?.contractStatus === 'ACTIVE') {
        return { kind: 'active', payment: null };
      }
      if (detail?.contractStatus === 'PENDING_APPROVAL') {
        return {
          kind: 'needs_signing',
          message:
            'Hợp đồng chưa hoàn tất đủ 4 chữ ký số trên Documenso để mở thanh toán VietQR.',
          blockingReasons,
        };
      }
    } catch {
      // Giữ nguyên thông báo lỗi khởi tạo VietQR nếu không đọc được chi tiết hợp đồng.
    }
    return {
      kind: 'error',
      message:
        blockingReasons.length > 0
          ? GENERIC_BLOCKING_MESSAGE
          : error instanceof Error
            ? error.message
            : 'Không thể khởi tạo yêu cầu thanh toán VietQR.',
      blockingReasons,
    };
  }
}

/**
 * Bước 3 của luồng `/booking`: thanh toán VietQR theo `contractId` và màn hình chúc mừng
 * khi hợp đồng chuyển `ACTIVE`, mở khóa Dashboard gia đình.
 */
export function BookingPaymentStep({
  contractId,
  addendumId,
  pollingIntervalMs = 8000,
}: BookingPaymentStepProps) {
  const [payment, setPayment] = useState<VietQRPaymentRequestDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(contractId));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [needsSigning, setNeedsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockingReasons, setBlockingReasons] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isReissuing, setIsReissuing] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
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
      if (outcome.kind === 'active') {
        setPayment(outcome.payment);
        setErrorMessage(null);
        setNeedsSigning(false);
        setBlockingReasons([]);
        activate();
        return;
      }
      if (outcome.kind === 'payment') {
        setPayment(outcome.payment);
        setErrorMessage(null);
        setNeedsSigning(false);
        setBlockingReasons([]);
        setIsExpired(isClosedPayment(outcome.payment));
        return;
      }
      if (outcome.kind === 'needs_signing') {
        setPayment(null);
        setNeedsSigning(true);
        setErrorMessage(outcome.message);
        setBlockingReasons(describeBlockingReasons(outcome.blockingReasons));
        return;
      }
      setPayment(null);
      setNeedsSigning(false);
      setErrorMessage(outcome.message);
      setBlockingReasons(describeBlockingReasons(outcome.blockingReasons));
    },
    [activate]
  );

  const loadPayment = useCallback(async () => {
    if (!contractId) return;
    try {
        const outcome = await resolvePaymentOrContractState(contractId, addendumId);
      if (!isMountedRef.current) return;
      applyLoadOutcome(outcome);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [addendumId, applyLoadOutcome, contractId]);

  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    setNeedsSigning(false);
    setBlockingReasons([]);
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
        const outcome = await resolvePaymentOrContractState(contractId as string, addendumId);
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
  }, [addendumId, applyLoadOutcome, contractId]);

  // Tự động kiểm tra trạng thái thanh toán để phát hiện hợp đồng đã ACTIVE.
  const paymentId = payment?.id;
  const isAddendumPaid = Boolean(addendumId) && payment?.status === 'PAID';
  useEffect(() => {
    if (!contractId || !paymentId || isActivated || isAddendumPaid || pollingIntervalMs <= 0) return;
    let activePolling = true;
    let checking = false;
    const timer = setInterval(async () => {
      if (checking) return;
      checking = true;
      try {
        const latestPayment = await contractsApi.getPaymentStatus(paymentId);
        const active = await isPaidContractActive(latestPayment, contractId, addendumId);
        if (!activePolling) return;
        setPayment(latestPayment);
        setIsExpired(isClosedPayment(latestPayment));
        if (active) {
          activate();
          toast.success('Hợp đồng đã kích hoạt ACTIVE. Dashboard gia đình đã được mở khóa!');
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          activePolling = false;
          clearInterval(timer);
        }
        // Bỏ qua lỗi tạm thời khác của nhịp kiểm tra nền.
      } finally {
        checking = false;
      }
    }, pollingIntervalMs);
    return () => {
      activePolling = false;
      clearInterval(timer);
    };
  }, [activate, addendumId, contractId, isActivated, isAddendumPaid, paymentId, pollingIntervalMs]);

  const handleVerifyPayment = async () => {
    if (!payment || !contractId) return;
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const latestPayment = await contractsApi.getPaymentStatus(payment.id);
      const active = await isPaidContractActive(latestPayment, contractId, addendumId);
      setPayment(latestPayment);
      setIsExpired(isClosedPayment(latestPayment));
      if (active) {
        activate();
        toast.success('Đã xác nhận thanh toán. Hợp đồng đã kích hoạt ACTIVE!');
      } else if (latestPayment.status === 'PAID') {
        toast.info(
          addendumId
            ? 'Hệ thống đã ghi nhận thanh toán phụ lục.'
            : 'Đã ghi nhận thanh toán, hệ thống đang xử lý kích hoạt hợp đồng.',
        );
      } else if (latestPayment.latestTransaction?.outcome === 'REVIEW_REQUIRED') {
        toast.info('Đã nhận giao dịch chuyển khoản và đang được soát xét thủ công.');
      } else if (isClosedPayment(latestPayment)) {
        toast.info('Mã thanh toán đã đóng. Vui lòng tạo mã mới.');
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

  const handleRecheckActivation = async () => {
    if (!payment || payment.status !== 'PAID' || addendumId || isRechecking) return;
    setIsRechecking(true);
    setErrorMessage(null);
    try {
      const result = await contractsApi.recheckPaymentActivation(payment.id);
      if (!isMountedRef.current) return;
      if (result.activated) {
        activate();
        toast.success('Hợp đồng đã kích hoạt ACTIVE. Dashboard gia đình đã được mở khóa!');
        return;
      }
      setPayment((prev) =>
        prev
          ? {
              ...prev,
              activation: {
                activated: false,
                blockingReasons: result.blockingReasons ?? [],
              },
            }
          : prev
      );
      toast.info(
        'Hợp đồng vẫn chưa đủ điều kiện kích hoạt. Vui lòng kiểm tra các lý do bên dưới.'
      );
    } catch (error) {
      if (!isMountedRef.current) return;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể kiểm tra lại tình trạng kích hoạt.'
      );
    } finally {
      if (isMountedRef.current) setIsRechecking(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text);
    setIsCopied(key);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleReissue = async () => {
    if (!contractId || isReissuing) return;
    setIsReissuing(true);
    setErrorMessage(null);
    setBlockingReasons([]);
    try {
      // Máy chủ tự đóng mã quá hạn và cấp mã mới với attempt + 1.
      const outcome = await resolvePaymentOrContractState(contractId, addendumId);
      if (!isMountedRef.current) return;
      applyLoadOutcome(outcome);
      if (outcome.kind === 'payment' && outcome.payment.status === 'PENDING') {
        toast.success('Đã cập nhật mã thanh toán.');
      }
    } catch (error) {
      const reasons = readBlockingReasonsFromError(error);
      setBlockingReasons(describeBlockingReasons(reasons));
      setErrorMessage(
        reasons.length > 0
          ? GENERIC_BLOCKING_MESSAGE
          : error instanceof Error
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
        {blockingReasons.length > 0 && (
          <ul
            data-testid="booking-payment-blocking-reasons"
            className="list-disc space-y-1.5 rounded-xl border border-rose-200 bg-white/70 p-3 pl-7 text-xs leading-relaxed text-rose-900"
          >
            {blockingReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
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
  if (payment.status === 'PAID') {
    if (addendumId) {
      return (
        <section role="status" className="space-y-3 rounded-xl border border-emerald-200 bg-white p-6">
          <h1 className="text-lg font-bold">Đã ghi nhận thanh toán phụ lục</h1>
          <p className="text-sm text-slate-600">{transferMemo} · {amountLabel} · {payment.environment}</p>
        </section>
      );
    }

    const activationBlockingMessages = describeBlockingReasons(payment.activation?.blockingReasons ?? []);
    return (
      <section
        role="status"
        data-testid="payment-paid-pending-activation"
        className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-amber-700">
            hourglass_top
          </span>
          <div className="space-y-1">
            <h1 className="font-bold">Đã ghi nhận thanh toán, đang xử lý kích hoạt</h1>
            <p className="text-xs leading-relaxed text-amber-900">
              Mã thanh toán {payment.paymentCode} · {amountLabel} · {payment.environment}
            </p>
          </div>
        </div>
        {activationBlockingMessages.length > 0 && (
          <ul
            data-testid="payment-activation-blocking-reasons"
            className="list-disc space-y-1 rounded-lg border border-amber-200 bg-white/80 p-3 pl-7 text-xs leading-relaxed text-amber-950"
          >
            {activationBlockingMessages.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => void handleRecheckActivation()}
          disabled={isRechecking}
          data-testid="payment-recheck-activation"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60 cursor-pointer"
        >
          {isRechecking ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Đang kiểm tra lại...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span>Kiểm tra lại tình trạng kích hoạt</span>
            </>
          )}
        </button>
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
      </section>
    );
  }

  const reviewTransaction = payment.latestTransaction?.outcome === 'REVIEW_REQUIRED'
    ? payment.latestTransaction
    : null;

  return (
    <section
      data-testid="booking-payment-pending"
      className="space-y-5"
      aria-label={addendumId ? 'Thanh toán phụ lục qua VietQR' : 'Thanh toán VietQR kích hoạt gói'}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-slate-900">
            {addendumId ? 'Thanh toán phụ lục qua VietQR' : 'Thanh toán VietQR để kích hoạt gói'}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ hoặc chuyển khoản đúng số tiền và nội
            dung đối soát bên dưới.
          </p>
          {payment.environment === 'TEST' && (
            <p className="text-sm font-semibold text-amber-800">Môi trường TEST. Dùng mô phỏng giao dịch SePay.</p>
          )}
        </div>
        {!isExpired && (
          <PaymentCountdown expiresAt={payment.expiresAt} onExpire={markExpired} />
        )}
      </header>

      {errorMessage && (
        <div role="alert" className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <p>{errorMessage}</p>
          {blockingReasons.length > 0 && (
            <ul
              data-testid="booking-payment-blocking-reasons"
              className="list-disc space-y-1 pl-5 text-xs leading-relaxed"
            >
              {blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {reviewTransaction && (
        <div
          role="status"
          data-testid="payment-review-required"
          className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-amber-700">
              manage_search
            </span>
            <div className="space-y-1">
              <p className="font-bold">Đã nhận giao dịch, đang được soát xét thủ công</p>
              <p className="text-xs leading-relaxed text-amber-900">
                {reviewTransaction.reason
                  ? REVIEW_REASON_LABELS[reviewTransaction.reason] ??
                    `Giao dịch cần bộ phận hỗ trợ đối soát thêm (${reviewTransaction.reason}).`
                  : 'Giao dịch đã được ghi nhận và đang chờ bộ phận hỗ trợ đối soát thủ công.'}
              </p>
              <p className="text-xs font-semibold tabular-nums text-amber-950">
                Mã tham chiếu giao dịch: {reviewTransaction.referenceCode || reviewTransaction.id}
              </p>
            </div>
          </div>
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
            <p className="font-semibold text-destructive">
              {payment.status === 'CANCELLED' ? 'Mã thanh toán đã bị hủy' : 'Mã thanh toán đã hết hạn'}
            </p>
            <p className="text-muted-foreground">
              Mã VietQR chỉ có hiệu lực trong 15 phút. Vui lòng tạo mã mới để tiếp tục thanh toán.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center lg:col-span-4">
          {payment.qrUrl ? (
            <>
              <div
                className={`rounded-2xl border border-slate-200 bg-white p-3 ${
                  isExpired ? 'pointer-events-none opacity-40 blur-sm' : ''
                }`}
              >
                <img
                  src={payment.qrUrl}
                  alt="Mã VietQR thanh toán kích hoạt gói"
                  aria-hidden={isExpired}
                  className="h-56 w-56 sm:h-72 sm:w-72 max-w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isExpired}
                  onClick={() => setShowQrModal(true)}
                  data-testid="payment-qr-zoom"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                  <span>Phóng to</span>
                </button>
                <a
                  href={payment.qrUrl}
                  download={`vietqr-${payment.paymentCode}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="payment-qr-download"
                  aria-disabled={isExpired}
                  className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 ${
                    isExpired ? 'pointer-events-none opacity-50' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Tải ảnh QR</span>
                </a>
              </div>
            </>
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

      {payment.qrUrl && (
        <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
          <DialogContent
            data-testid="payment-qr-modal"
            className="max-w-[calc(100%-1rem)] sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200/80 text-center gap-0"
          >
            <DialogHeader className="bg-primary text-primary-foreground p-4 sm:p-5 text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-100 block">
                Cổng thanh toán NAPAS 24/7
              </span>
              <DialogTitle className="font-bold text-base text-white">
                Quét Mã VietQR Ngân Hàng
              </DialogTitle>
            </DialogHeader>
            <div className="p-2 sm:p-5 space-y-4">
              <div className="flex justify-center rounded-2xl border border-slate-200/70 bg-slate-50 p-1 sm:p-3">
                <img
                  src={payment.qrUrl}
                  alt={`Mã VietQR phóng to ${payment.paymentCode}`}
                  className="h-80 w-80 sm:h-96 sm:w-96 min-h-[320px] min-w-[320px] max-h-[80vh] max-w-full object-contain rounded-xl bg-white p-1 sm:p-2"
                />
              </div>
              <div className="space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3.5 text-left text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Số tài khoản ({payment.expectedGateway})</span>
                  <strong className="font-bold tabular-nums text-slate-900">
                    {payment.expectedAccountNumber}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Số tiền</span>
                  <strong className="font-bold tabular-nums text-primary">{amountLabel}</strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Nội dung chuyển khoản</span>
                  <strong className="font-bold tabular-nums text-slate-900">{transferMemo}</strong>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
