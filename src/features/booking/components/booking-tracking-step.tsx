'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { contractsApi } from '@/lib/api';
import type { MedicalContractDetailDto } from '@/lib/api';
import {
  BookingContractTrackingPanel,
  isAwaitingBookingSignatures,
} from './booking-contract-tracking-panel';
import { useBookingNavigationOptional } from './booking-navigation-context';

export interface BookingTrackingStepProps {
  contractId?: string;
  /**
   * Chu kỳ tự cập nhật tiến độ ký (ms). Mặc định `10000`; truyền `0` để tắt
   * trong unit test.
   */
  pollingIntervalMs?: number;
}

function describeContractLoadError(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  if (status === 404) {
    return 'Không tìm thấy hợp đồng này. Vui lòng kiểm tra lại đường dẫn trong email.';
  }
  if (status === 403) {
    return 'Bạn không có quyền xem hợp đồng này. Vui lòng đăng nhập bằng tài khoản đại diện hộ gia đình.';
  }
  return 'Không thể tải hợp đồng. Vui lòng kiểm tra kết nối và thử lại.';
}

/**
 * Bước 2 của luồng `/booking`: theo dõi tiến độ ký 4 bên ngoài Dashboard và
 * chuyển sang bước thanh toán `/booking/payment?contractId=<id>`.
 *
 * Dữ liệu hợp đồng được nạp **một lần duy nhất** tại đây (vừa đồng bộ
 * `BookingNavigationContext`, vừa cấp cho giao diện Bước 2) và tự cập nhật định kỳ
 * khi còn chờ chữ ký.
 */
export function BookingTrackingStep({
  contractId,
  pollingIntervalMs = 10_000,
}: BookingTrackingStepProps) {
  if (!contractId) {
    return (
      <section
        data-testid="booking-tracking-missing-contract"
        className="rounded-2xl border border-amber-200 bg-white p-6 text-center space-y-4 sm:p-8"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <span className="material-symbols-outlined text-[24px]">receipt_long</span>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-base font-bold text-slate-900 sm:text-lg">
            Chưa có hợp đồng để theo dõi
          </h1>
          <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-600 sm:text-sm">
            Đường dẫn theo dõi cần mã hợp đồng. Hãy mở lại liên kết trong email thông
            báo, hoặc chọn bác sĩ và gói chăm sóc để khởi tạo hợp đồng mới.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90 sm:text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Về bước xác nhận gói</span>
          </Link>
          <Link
            href="/doctors"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:text-sm"
          >
            <span>Chọn bác sĩ &amp; gói chăm sóc</span>
          </Link>
        </div>
      </section>
    );
  }

  // `key` đặt lại toàn bộ trạng thái nạp khi đổi hợp đồng mà không cần setState
  // đồng bộ trong effect.
  return (
    <TrackingContractView
      key={contractId}
      contractId={contractId}
      pollingIntervalMs={pollingIntervalMs}
    />
  );
}

function TrackingContractView({
  contractId,
  pollingIntervalMs,
}: {
  contractId: string;
  pollingIntervalMs: number;
}) {
  const router = useRouter();
  const bookingNavigation = useBookingNavigationOptional();
  const syncNavigation = bookingNavigation?.update;

  const [contract, setContract] = useState<MedicalContractDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const hasContractRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const applyContract = useCallback(
    (detail: MedicalContractDetailDto) => {
      hasContractRef.current = true;
      setContract(detail);
      setLoadError(null);
      syncNavigation?.({
        contractId: detail.id,
        contractStatus: detail.contractStatus,
        doctorId: detail.doctor?.id,
      });
    },
    [syncNavigation]
  );

  const handleLoadFailure = useCallback(
    (error: unknown) => {
      // Lỗi nhịp nền khi đã có dữ liệu: giữ nguyên giao diện đang hiển thị.
      if (hasContractRef.current) return;
      setLoadError(describeContractLoadError(error));
      syncNavigation?.({
        contractId,
        contractStatus: undefined,
        doctorId: undefined,
      });
    },
    [contractId, syncNavigation]
  );

  // Nạp lần đầu (hoặc nạp lại sau khi đổi `contractId` nhờ `key` của cha).
  useEffect(() => {
    let active = true;
    async function loadInitialContract() {
      try {
        const detail = await contractsApi.getMedicalContractDetail(contractId);
        if (!active) return;
        applyContract(detail);
      } catch (error) {
        if (!active) return;
        handleLoadFailure(error);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadInitialContract();
    return () => {
      active = false;
    };
  }, [applyContract, contractId, handleLoadFailure]);

  /**
   * `forceSync: true` chỉ dùng cho thao tác bấm `"Cập nhật tiến độ"`; nhịp
   * polling nền gọi mặc định để backend tự áp dụng cooldown chống dội Documenso.
   */
  const refreshContract = useCallback(
    async (options?: { forceSync?: boolean }) => {
      try {
        // Nhịp nền giữ nguyên chữ ký lời gọi một tham số để backend tự áp
        // dụng cooldown; chỉ thao tác thủ công mới kèm `forceSync`.
        const detail = options?.forceSync
          ? await contractsApi.getMedicalContractDetail(contractId, options)
          : await contractsApi.getMedicalContractDetail(contractId);
        if (!isMountedRef.current) return;
        applyContract(detail);
      } catch (error) {
        if (!isMountedRef.current) return;
        handleLoadFailure(error);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [applyContract, contractId, handleLoadFailure]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshContract({ forceSync: true });
    if (!isMountedRef.current) return;
    // Giữ phản hồi quay nút một nhịp ngắn để người dùng thấy thao tác đã chạy.
    setTimeout(() => {
      if (isMountedRef.current) setIsRefreshing(false);
    }, 400);
  }, [refreshContract]);

  // Tự cập nhật khi còn chờ chữ ký; tạm dừng khi tab bị ẩn.
  const isPolling = isAwaitingBookingSignatures(contract);
  useEffect(() => {
    if (!isPolling || pollingIntervalMs <= 0) return;
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      void refreshContract();
    }, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [isPolling, refreshContract, pollingIntervalMs]);

  const handleProceedPayment = useCallback(() => {
    router.push(`/booking/payment?contractId=${encodeURIComponent(contractId)}`);
  }, [contractId, router]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="booking-tracking-loading"
        className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3"
      >
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-xs font-medium text-slate-500">
          Đang tải tiến trình ký hợp đồng...
        </p>
      </div>
    );
  }

  if (!contract) {
    return (
      <section
        role="alert"
        data-testid="booking-tracking-error"
        className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8"
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined shrink-0 text-[22px] text-rose-600">
            error
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-rose-900 sm:text-base">
              Không thể tải hợp đồng
            </h2>
            <p className="text-xs leading-relaxed text-rose-800">
              {loadError || 'Vui lòng thử lại sau ít phút.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              void handleRefresh();
            }}
            className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700"
          >
            Thử lại
          </button>
          <Link
            href="/booking"
            className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-800 transition-colors hover:bg-rose-100"
          >
            Về bước xác nhận gói
          </Link>
        </div>
      </section>
    );
  }

  return (
    <BookingContractTrackingPanel
      contract={contract}
      isRefreshing={isRefreshing}
      onRefresh={() => void handleRefresh()}
      onProceedPayment={handleProceedPayment}
    />
  );
}
