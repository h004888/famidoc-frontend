'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { KpiStatCard } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import type { AdminStatusFilter, StaffingStatusFilter } from './contract-status-helpers';

export interface ContractsKpiStripProps {
  activeTab: 'medical' | 'staffing';
  medicalFilter: AdminStatusFilter;
  staffingFilter: StaffingStatusFilter;
  counts: {
    medicalReadyForAdmin: number;
    medicalWaitingFamily: number;
    medicalPendingPayment: number;
    medicalActive: number;
    staffingReadyForAdmin: number;
    staffingDraft: number;
    staffingActive: number;
    totalReadyForAdmin: number;
    totalActive: number;
  };
  onSelectMedicalFilter: (filter: AdminStatusFilter) => void;
  onSelectStaffingFilter: (filter: StaffingStatusFilter) => void;
  isMedicalLimitReached?: boolean;
}

export function ContractsKpiStrip({
  activeTab,
  medicalFilter,
  staffingFilter,
  counts,
  onSelectMedicalFilter,
  onSelectStaffingFilter,
  isMedicalLimitReached = false,
}: ContractsKpiStripProps) {
  const isReadySelected =
    activeTab === 'medical'
      ? medicalFilter === 'READY_FOR_ADMIN'
      : staffingFilter === 'READY_FOR_ADMIN';

  const isWaitingSelected =
    activeTab === 'medical'
      ? medicalFilter === 'WAITING_FAMILY'
      : staffingFilter === 'DRAFT';

  const isPaymentSelected = activeTab === 'medical' && medicalFilter === 'PENDING_PAYMENT';

  const isActiveSelected =
    activeTab === 'medical'
      ? medicalFilter === 'ACTIVE'
      : staffingFilter === 'ACTIVE';

  return (
    <section aria-label="Tổng quan điều phối hợp đồng" className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <button
        type="button"
        aria-pressed={isReadySelected}
        onClick={() =>
          activeTab === 'medical'
            ? onSelectMedicalFilter(isReadySelected ? 'ALL' : 'READY_FOR_ADMIN')
            : onSelectStaffingFilter(isReadySelected ? 'ALL' : 'READY_FOR_ADMIN')
        }
        className={cn(
          'text-left rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isReadySelected && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <KpiStatCard
          title="Cần Admin ký duyệt"
          value={activeTab === 'medical' ? counts.medicalReadyForAdmin : counts.staffingReadyForAdmin}
          badgeText={counts.totalReadyForAdmin > 0 ? 'Ưu tiên xử lý' : 'Đã xử lý'}
          badgeClassName={
            counts.totalReadyForAdmin > 0
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }
          subtitle={`${counts.medicalReadyForAdmin} HĐ 4 bên · ${counts.staffingReadyForAdmin} HĐ B2B`}
          icon="draw"
          iconClassName="bg-amber-50 text-amber-700"
        />
      </button>

      <button
        type="button"
        aria-pressed={isWaitingSelected}
        onClick={() =>
          activeTab === 'medical'
            ? onSelectMedicalFilter(isWaitingSelected ? 'ALL' : 'WAITING_FAMILY')
            : onSelectStaffingFilter(isWaitingSelected ? 'ALL' : 'DRAFT')
        }
        className={cn(
          'text-left rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isWaitingSelected && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <KpiStatCard
          title={activeTab === 'medical' ? 'Chờ Bên A ký trước' : 'HĐ B2B đang dự thảo'}
          value={activeTab === 'medical' ? counts.medicalWaitingFamily : counts.staffingDraft}
          badgeText="Đang chờ"
          badgeClassName="bg-slate-100 text-slate-700 border-slate-200"
          subtitle={activeTab === 'medical' ? 'Gia đình chưa ký Documenso' : 'Chờ hoàn tất chữ ký hai bên'}
          icon="hourglass_top"
          iconClassName="bg-slate-100 text-slate-700"
        />
      </button>

      <button
        type="button"
        aria-pressed={isPaymentSelected}
        disabled={activeTab !== 'medical'}
        onClick={() =>
          onSelectMedicalFilter(isPaymentSelected ? 'ALL' : 'PENDING_PAYMENT')
        }
        className={cn(
          'text-left rounded-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          activeTab === 'medical' ? 'cursor-pointer' : 'cursor-default opacity-80',
          isPaymentSelected && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <KpiStatCard
          title="Chờ thanh toán VietQR"
          value={counts.medicalPendingPayment}
          badgeText="Đã đủ 4 chữ ký"
          badgeClassName="bg-sky-50 text-sky-700 border-sky-200"
          subtitle="Đợi gia đình chuyển khoản kích hoạt"
          icon="qr_code_2"
          iconClassName="bg-sky-50 text-sky-700"
        />
      </button>

      <button
        type="button"
        aria-pressed={isActiveSelected}
        onClick={() =>
          activeTab === 'medical'
            ? onSelectMedicalFilter(isActiveSelected ? 'ALL' : 'ACTIVE')
            : onSelectStaffingFilter(isActiveSelected ? 'ALL' : 'ACTIVE')
        }
        className={cn(
          'text-left rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isActiveSelected && 'ring-2 ring-primary ring-offset-2'
        )}
      >
        <KpiStatCard
          title="Đang hiệu lực"
          value={activeTab === 'medical' ? counts.medicalActive : counts.staffingActive}
          badgeText="Hoạt động"
          badgeClassName="bg-emerald-50 text-emerald-700 border-emerald-200"
          subtitle={`${counts.medicalActive} HĐ Gia đình · ${counts.staffingActive} HĐ B2B`}
          icon="verified"
          iconClassName="bg-emerald-50 text-emerald-700"
        />
      </button>
      </div>
      {activeTab === 'medical' && isMedicalLimitReached && (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500 tabular-nums">
          <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>Số liệu KPI đang tổng hợp trên 50 hợp đồng y tế mới nhất từ máy chủ.</span>
        </p>
      )}
    </section>
  );
}
