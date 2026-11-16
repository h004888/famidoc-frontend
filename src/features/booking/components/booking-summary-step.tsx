'use client';

import Link from 'next/link';
import { DoctorContractInitiationPanel } from '@/features/subscription-contract/components/doctor-contract-initiation-panel';

export interface BookingSummaryStepProps {
  packageId?: string;
  doctorId?: string;
  facilityId?: string;
  /** Mã hợp đồng đang có để tái dựng ngữ cảnh Bước 1 (khi quay lại từ Bước 2/3). */
  contractId?: string;
  requestedMembers?: number;
}

/**
 * Bước 1 của luồng `/booking`: xác nhận bác sĩ, gói chăm sóc và khởi tạo hợp đồng 4 bên.
 * Thiếu tham số bắt buộc thì không hiển thị dữ liệu mẫu mà hướng dẫn quay về `/doctors`.
 * Khi có `contractId`, panel tự tải chi tiết hợp đồng để dựng lại ngữ cảnh.
 */
export function BookingSummaryStep({
  packageId,
  doctorId,
  facilityId,
  contractId,
  requestedMembers,
}: BookingSummaryStepProps) {
  const hasBookingContext = Boolean(packageId && doctorId && facilityId);

  if (!hasBookingContext && !contractId) {
    return (
      <section
        data-testid="booking-missing-context"
        className="rounded-2xl border border-amber-200 bg-white p-6 sm:p-8 text-center space-y-4"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <span className="material-symbols-outlined text-[24px]">info</span>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            Chưa chọn bác sĩ và gói chăm sóc
          </h1>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
            Đường dẫn đặt gói cần có đủ thông tin bác sĩ, cơ sở y tế và gói chăm sóc. Vui lòng chọn
            bác sĩ gia đình và gói phù hợp để bắt đầu.
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

  return (
    <DoctorContractInitiationPanel
      packageId={packageId}
      doctorId={doctorId}
      facilityId={facilityId}
      contractId={contractId}
      requestedMembers={
        typeof requestedMembers === 'number' ? requestedMembers : 1
      }
      trackingPath="/booking/tracking"
    />
  );
}
