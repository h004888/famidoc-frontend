'use client';

import Link from 'next/link';
import { DoctorContractInitiationPanel } from '@/features/subscription-contract/components/doctor-contract-initiation-panel';

export interface BookingSummaryStepProps {
  packageId?: string;
  doctorId?: string;
  facilityId?: string;
  matchSessionId?: string;
  queueId?: string;
  /** Mã hợp đồng đang có để tái dựng ngữ cảnh Bước 1 (khi quay lại từ Bước 2/3). */
  contractId?: string;
  requestedMembers?: number;
  trackingPath?: string;
}

/**
 * Bước 1 của luồng `/booking` và `/family/subscription/new`:
 * Hỗ trợ ngữ cảnh Track A (`packageId + doctorId`), Track B (`matchSessionId`),
 * Hàng chờ Admin (`queueId`), hoặc `contractId` hiện có.
 */
export function BookingSummaryStep({
  packageId,
  doctorId,
  facilityId,
  matchSessionId,
  queueId,
  contractId,
  requestedMembers,
  trackingPath = '/booking/tracking',
}: BookingSummaryStepProps) {
  const hasTrackAContext = Boolean(packageId && doctorId);
  const hasTrackBContext = Boolean(matchSessionId);
  const hasQueueContext = Boolean(queueId);
  const hasBookingContext =
    hasTrackAContext || hasTrackBContext || hasQueueContext || Boolean(contractId);

  if (!hasBookingContext) {
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
            Đường dẫn đặt gói cần có gói dịch vụ và bác sĩ (Track A), phiên gợi ý bác sĩ (Track B), hoặc yêu cầu hàng chờ đã được gán bác sĩ.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/doctors"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span>Chọn bác sĩ &amp; gói chăm sóc</span>
          </Link>
          <Link
            href="/doctors/matching"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-blue-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary transition-colors hover:bg-blue-100"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>Hệ thống gợi ý bác sĩ (Track B)</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <DoctorContractInitiationPanel
      packageId={packageId}
      doctorId={doctorId}
      facilityId={facilityId}
      matchSessionId={matchSessionId}
      queueId={queueId}
      contractId={contractId}
      requestedMembers={
        typeof requestedMembers === 'number' ? requestedMembers : 1
      }
      trackingPath={trackingPath}
    />
  );
}
