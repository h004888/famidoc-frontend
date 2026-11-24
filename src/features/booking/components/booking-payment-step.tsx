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
import { PaymentIssueDialog } from '@/components/shared/payment-issue-dialog';
import {
  contractsApi,
  type VietQRPaymentRequestDto,
} from '@/lib/api/contracts.api';
import {
  getSupportCaseStatusLabel,
  isOpenSupportCaseStatus,
  supportCasesApi,
  type SupportCaseSummary,
} from '@/lib/api/support-cases.api';
import {
  encountersApi,
  type EncounterItem,
} from '@/lib/api/encounters.api';
import { FAMILY_GATE_REFRESH_EVENT } from '@/components/layout/family-subscription-gate';
import { ApiError } from '@/lib/http/errors';
import {
  describeBlockingReasons,
  readBlockingReasonsFromError,
} from '@/lib/payment-blocking-reasons';
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

type OpenPaymentIssue = Pick<SupportCaseSummary, 'id' | 'caseCode' | 'status'>;

type PaymentLoadOutcome =
  | { kind: 'active'; payment: VietQRPaymentRequestDto | null }
  | { kind: 'payment'; payment: VietQRPaymentRequestDto; openIssue?: OpenPaymentIssue }
  | { kind: 'needs_signing'; message: string; blockingReasons: string[] }
  | { kind: 'error'; message: string; blockingReasons: string[] };

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
    // Kiểm tra hồ sơ đang đối soát trước khi phát mã mới, kể cả sau khi tải lại trang.
    const openCases = await supportCasesApi.list({
      type: 'PAYMENT_ISSUE',
      contractId,
      onlyOpen: true,
      limit: 50,
    }).catch(() => null);
    const openIssue = openCases?.items.find((item) =>
      item.invoiceId &&
      isOpenSupportCaseStatus(item.status) &&
      (item.invoice?.addendumId ?? undefined) === addendumId,
    );
    if (openIssue?.invoiceId) {
      const request = await contractsApi.getPaymentStatus(openIssue.invoiceId);
      const outcome = await resolveIssuedPayment(request, contractId, addendumId);
      return outcome.kind === 'payment' ? { ...outcome, openIssue } : outcome;
    }

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
    // Giữ lại từng lý do backend trả về để gia đình biết còn thiếu bước nào.
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
      if (!addendumId && detail?.contractStatus === 'PAID_PENDING_APPROVAL') {
        if (typeof window !== 'undefined') {
          window.location.assign(`/booking/status?contractId=${encodeURIComponent(contractId)}`);
        }
        return { kind: 'active', payment: null };
      }
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
  const [showPaymentIssueModal, setShowPaymentIssueModal] = useState(false);
  const [openPaymentIssue, setOpenPaymentIssue] = useState<OpenPaymentIssue | null>(null);
  const [firstEncounter, setFirstEncounter] = useState<EncounterItem | null>(null);
  const [scheduledEncounters, setScheduledEncounters] = useState<EncounterItem[]>([]);
  const [encountersLoaded, setEncountersLoaded] = useState(false);
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

  useEffect(() => {
    if (!isActivated || !contractId || addendumId) return;
    let active = true;
    encountersApi
      .getFamilyTimetable({ contractId, category: 'PERIODIC_ROUTINE', pageSize: 20 })
      .then((res) => {
        if (!active) return;
        const list = res.data ?? [];
        setScheduledEncounters(list);
        setFirstEncounter(list[0] ?? null);
        setEncountersLoaded(true);
      })
      .catch(() => {
        if (active) setEncountersLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [addendumId, contractId, isActivated]);

  const applyLoadOutcome = useCallback(
    (outcome: PaymentLoadOutcome) => {
      setOpenPaymentIssue(outcome.kind === 'payment' ? outcome.openIssue ?? null : null);
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

  const paymentId = payment?.id;

  // Tự động kiểm tra trạng thái thanh toán để phát hiện hợp đồng đã ACTIVE.
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
    if (!contractId || isReissuing || openPaymentIssue) return;
    setIsReissuing(true);
    setErrorMessage(null);
    setBlockingReasons([]);
    try {
      // Máy chủ tự đóng mã quá hạn và cấp mã mới với attempt + 1.
      const outcome = await resolvePaymentOrContractState(contractId, addendumId);
      if (!isMountedRef.current) return;
      applyLoadOutcome(outcome);
      if (outcome.kind === 'payment' && !outcome.openIssue && outcome.payment.status === 'PENDING') {
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
        {firstEncounter && (
          <div
            data-testid="booking-payment-first-encounter"
            className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-left space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Lộ trình Khám tại nhà đã chốt sẵn ({scheduledEncounters.length} mốc)
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                Đã xác nhận
              </span>
            </div>
            <div className="space-y-1.5">
              {scheduledEncounters.slice(0, 3).map((enc, idx) => {
                const rawTime = enc.scheduledTime?.includes('T')
                  ? enc.scheduledTime.slice(11, 16)
                  : enc.scheduledTime?.slice(0, 5) || '08:00';
                const hour = Number.parseInt(rawTime.split(':')[0] || '8', 10);
                const slotLabel =
                  hour < 12 ? 'Khung Sáng (08:00 - 11:30)' : 'Khung Chiều (13:30 - 17:30)';
                const isManual =
                  enc.encounterStatus === 'REQUESTED' &&
                  (enc.cancelReason?.includes('MANUAL_SLOT_REQUIRED') ||
                    String(enc.scheduleStage) === 'MANUAL_SLOT_REQUIRED');
                return (
                  <div
                    key={enc.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/90 border border-emerald-100 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-slate-900 tabular-nums">
                      Mốc {idx + 1}: {enc.scheduledDate?.slice(0, 10).split('-').reverse().join('/')} ·{' '}
                      {slotLabel}
                    </span>
                    <span
                      className={`font-semibold ${
                        isManual ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {isManual ? 'Chờ BS xếp tay' : 'Đã chốt'}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-600">
              Tư vấn Video (Online): Không xếp tự động — gia đình chủ động đặt khi có nhu cầu.
            </p>
          </div>
        )}
        {encountersLoaded && scheduledEncounters.length === 0 && (
          <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-left text-xs text-amber-900 space-y-1">
            <div className="font-bold">Lưu ý khởi tạo lịch Khám tại nhà</div>
            <p>
              Nếu gói có lượt Khám tại nhà nhưng chưa hiển thị lịch, vui lòng kiểm tra địa chỉ nhà
              hoặc bổ sung hồ sơ thành viên gia đình. Quỹ Tư vấn Video sẽ được đặt theo nhu cầu.
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/family/appointments"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors hover:bg-emerald-800"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Xem lịch khám</span>
          </Link>
          <Link
            href="/family/members"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-50"
          >
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            <span>Thêm hồ sơ thành viên</span>
          </Link>
          <Link
            href="/family"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
  const paymentIssueDialog = (
    <PaymentIssueDialog
      open={showPaymentIssueModal}
      onOpenChange={setShowPaymentIssueModal}
      context={{
        contractId: payment.contractId || contractId,
        invoiceId: payment.id,
        paymentCode: payment.paymentCode,
        transferContent: transferMemo,
        amountVnd: payment.amountVnd,
        paymentStatus: payment.status,
        latestTransaction: payment.latestTransaction
          ? {
              referenceCode: payment.latestTransaction.referenceCode,
              outcome: payment.latestTransaction.outcome,
              reason: payment.latestTransaction.reason,
              amountReceived: payment.latestTransaction.amountVnd,
            }
          : null,
      }}
      existingCaseId={openPaymentIssue?.id ?? null}
      onCaseChanged={(detail) => {
        if (isOpenSupportCaseStatus(detail.status)) {
          setOpenPaymentIssue({
            id: detail.id,
            caseCode: detail.caseCode,
            status: detail.status,
          });
        } else {
          setOpenPaymentIssue(null);
        }
      }}
    />
  );

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
        <div className="flex flex-wrap items-center gap-2.5">
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
          <button
            type="button"
            onClick={() => setShowPaymentIssueModal(true)}
            data-testid="payment-report-issue"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-400 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>
              {openPaymentIssue
                ? `Theo dõi báo lỗi (${openPaymentIssue.caseCode})`
                : 'Báo lỗi chuyển khoản'}
            </span>
          </button>
        </div>
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        {paymentIssueDialog}
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

      {openPaymentIssue && (
        <div
          role="status"
          data-testid="payment-open-support-case"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-950"
        >
          <div className="space-y-1 min-w-0 flex-1">
            <p className="font-bold">
              Đang xử lý báo lỗi chuyển khoản ({openPaymentIssue.caseCode}) ·{' '}
              {getSupportCaseStatusLabel(
                openPaymentIssue.status,
                'PAYMENT_ISSUE',
              )}
            </p>
            <p className="text-xs leading-relaxed text-blue-900">
              Admin đang đối soát giao dịch SePay cho mã thanh toán này. Nếu ngân
              hàng đã trừ tiền, quý gia đình vui lòng <strong>không chuyển khoản lại</strong>{' '}
              trước khi có phản hồi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPaymentIssueModal(true)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary/90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>Xem trao đổi với Admin</span>
          </button>
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
              {openPaymentIssue
                ? 'Vui lòng theo dõi phản hồi của Admin trong hồ sơ đang đối soát.'
                : 'Mã VietQR chỉ có hiệu lực trong 15 phút. Vui lòng tạo mã mới để tiếp tục thanh toán.'}
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

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {isExpired ? (
                !openPaymentIssue && <button
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

              <button
                type="button"
                onClick={() => setShowPaymentIssueModal(true)}
                data-testid="payment-report-issue"
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 text-xs sm:text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 sm:w-auto cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">report_problem</span>
                <span>
                  {openPaymentIssue
                    ? 'Xem trao đổi báo lỗi'
                    : 'Báo lỗi chuyển khoản'}
                </span>
              </button>
            </div>
            <span className="text-xs tabular-nums text-slate-500">
              Mã thanh toán: {payment.paymentCode}
            </span>
          </div>
        </div>
      </div>

      {paymentIssueDialog}

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
