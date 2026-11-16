'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ContractSigningTrackerView } from '@/features/subscription-contract/components/contract-signing-tracker-view';
import { contractsApi } from '@/lib/api';
import { useBookingNavigationOptional } from './booking-navigation-context';

export interface BookingTrackingStepProps {
  contractId?: string;
}

/**
 * Bước 2 của luồng `/booking`: theo dõi tiến độ ký 4 bên ngoài Dashboard và
 * chuyển sang bước thanh toán `/booking/payment?contractId=<id>`.
 * Đồng thời báo `contractStatus` lên `BookingNavigationContext` để shell khóa
 * điều hướng lùi khi hợp đồng đã `ACTIVE`.
 */
export function BookingTrackingStep({ contractId }: BookingTrackingStepProps) {
  const router = useRouter();
  const bookingNavigation = useBookingNavigationOptional();
  const [contractStatus, setContractStatus] = useState<string | undefined>(
    undefined
  );

  const syncNavigation = bookingNavigation?.update;

  useEffect(() => {
    if (!contractId) return;
    let active = true;
    syncNavigation?.({
      contractId,
      contractStatus: undefined,
      doctorId: undefined,
    });
    void (async () => {
      try {
        const detail = await contractsApi.getMedicalContractDetail(contractId);
        if (!active) return;
        setContractStatus(detail.contractStatus);
        syncNavigation?.({
          contractId,
          contractStatus: detail.contractStatus,
          doctorId: detail.doctor?.id,
        });
      } catch {
        if (!active) return;
        syncNavigation?.({
          contractId,
          contractStatus: undefined,
          doctorId: undefined,
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [contractId, syncNavigation]);

  if (!contractId) {
    return (
      <section
        data-testid="booking-tracking-missing-contract"
        className="rounded-2xl border border-amber-200 bg-white p-6 sm:p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <span className="material-symbols-outlined text-[24px]">receipt_long</span>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Chưa có hợp đồng để theo dõi
          </h1>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
            Đường dẫn theo dõi cần mã hợp đồng. Hãy mở lại liên kết trong email thông báo, hoặc chọn
            bác sĩ và gói chăm sóc để khởi tạo hợp đồng mới.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Về bước xác nhận gói</span>
          </Link>
          <Link
            href="/doctors"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <span>Chọn bác sĩ &amp; gói chăm sóc</span>
          </Link>
        </div>
      </section>
    );
  }

  const isActive = contractStatus === 'ACTIVE';

  return (
    <div className="space-y-4">
      {!isActive && (
        <Link
          href={`/booking?contractId=${encodeURIComponent(contractId)}`}
          data-testid="booking-back-to-step-1"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Quay lại bước xác nhận gói</span>
        </Link>
      )}

      <ContractSigningTrackerView
        contractId={contractId}
        backHref={`/booking?contractId=${encodeURIComponent(contractId)}`}
        onProceedPayment={() =>
          router.push(`/booking/payment?contractId=${encodeURIComponent(contractId)}`)
        }
      />
    </div>
  );
}
