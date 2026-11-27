import { CONTRACT_STATUS_LABELS, type FourPartyContract } from '@/features/four-party-contract';
import type { StaffingContractItem } from '@/lib/api';

export type AdminStatusFilter =
  | 'ALL'
  | 'READY_FOR_ADMIN'
  | 'WAITING_FAMILY'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'CANCELLED';

export type StaffingStatusFilter =
  | 'ALL'
  | 'DRAFT'
  | 'READY_FOR_ADMIN'
  | 'ACTIVE'
  | 'TERMINATED';

export type MedicalSortOption = 'NEWEST' | 'OLDEST_WAITING' | 'HIGHEST_VALUE';

export type StaffingSortOption = 'NEWEST' | 'EXPIRING_SOON' | 'HIGHEST_FACILITY_SHARE';

export interface MedicalBadgeInfo {
  label: string;
  className: string;
}

export interface PartySignatureState {
  key: 'A' | 'B' | 'C' | 'D';
  roleLabel: string;
  signed: boolean;
  isAdminTurn: boolean;
  signedAt?: string;
}

export interface StaffingPartySignatureState {
  key: 'CSYT' | 'Admin';
  roleLabel: string;
  signed: boolean;
  isAdminTurn: boolean;
  signedAt?: string | null;
}

export function resolveMedicalContractBadge(contract: FourPartyContract): MedicalBadgeInfo {
  if (contract.status === 'CANCELLED') {
    return {
      label: 'Đã hủy / Hết hạn',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  }

  if (contract.rawContractStatus === 'PENDING_ACTIVATION') {
    return {
      label: 'Đã thanh toán – chờ hiệu lực',
      className: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }

  if (contract.status === 'ACTIVE') {
    return {
      label: 'Đang hiệu lực',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (contract.status === 'PENDING_PAYMENT' || contract.upgradedFromId) {
    return {
      label: 'Chờ thanh toán VietQR',
      className: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }

  const familySigned = Boolean(contract.signatures?.family);
  const adminSigned = Boolean(contract.signatures?.platform);

  if (!familySigned) {
    return {
      label: 'Chờ Bên A ký trước',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  if (adminSigned) {
    return {
      label: 'Admin đã ký — chờ bên khác',
      className: 'bg-blue-50 text-primary border-blue-200',
    };
  }

  return {
    label: CONTRACT_STATUS_LABELS[contract.status] || 'Chờ Admin ký (Bên D)',
    className: 'bg-blue-50 text-primary border-blue-200',
  };
}

export function hasDocumensoSigningEnvelope(contract: FourPartyContract): boolean {
  return contract.documensoEnvelopeId !== null && contract.documensoEnvelopeId !== '';
}

export function isContractReadyForAdminSign(contract: FourPartyContract): boolean {
  const familySigned = Boolean(contract.signatures?.family);
  const adminSigned = Boolean(contract.signatures?.platform);
  return (
    hasDocumensoSigningEnvelope(contract) &&
    familySigned &&
    !adminSigned &&
    contract.status !== 'ACTIVE' &&
    contract.status !== 'CANCELLED'
  );
}

export function getPartySignatureMatrix(contract: FourPartyContract): PartySignatureState[] {
  const sigs = contract.signatures ?? {};
  const familySigned = Boolean(sigs.family);
  const readyForAdmin = isContractReadyForAdminSign(contract);

  return [
    {
      key: 'A',
      roleLabel: 'Bên A (Gia đình)',
      signed: familySigned,
      isAdminTurn: false,
      signedAt: sigs.family?.signedAt,
    },
    {
      key: 'B',
      roleLabel: 'Bên B (CSYT)',
      signed: Boolean(sigs.facility),
      isAdminTurn: false,
      signedAt: sigs.facility?.signedAt,
    },
    {
      key: 'C',
      roleLabel: 'Bên C (Bác sĩ)',
      signed: Boolean(sigs.doctor),
      isAdminTurn: false,
      signedAt: sigs.doctor?.signedAt,
    },
    {
      key: 'D',
      roleLabel: 'Bên D (Admin nền tảng)',
      signed: Boolean(sigs.platform),
      isAdminTurn: readyForAdmin,
      signedAt: sigs.platform?.signedAt,
    },
  ];
}

export function matchesMedicalStatusFilter(
  contract: FourPartyContract,
  filter: AdminStatusFilter
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'CANCELLED') return contract.status === 'CANCELLED';
  if (filter === 'ACTIVE') return contract.status === 'ACTIVE';
  if (filter === 'PENDING_PAYMENT') return contract.status === 'PENDING_PAYMENT';

  const familySigned = Boolean(contract.signatures?.family);

  if (filter === 'WAITING_FAMILY') {
    return contract.status === 'DRAFT' && !familySigned;
  }
  if (filter === 'READY_FOR_ADMIN') {
    return isContractReadyForAdminSign(contract);
  }
  return true;
}

export function matchesStaffingStatusFilter(
  item: StaffingContractItem,
  filter: StaffingStatusFilter
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'READY_FOR_ADMIN') {
    return isStaffingReadyForAdminSign(item);
  }
  return item.status === filter;
}

export function isStaffingReadyForAdminSign(item: StaffingContractItem): boolean {
  return (
    item.rawStatus === 'PENDING_ADMIN_SIGNATURE' ||
    (item.status === 'DRAFT' && item.facilitySigned && !item.adminSigned)
  );
}

export function resolveStaffingContractBadge(item: StaffingContractItem): MedicalBadgeInfo {
  if (item.status === 'ACTIVE') {
    return {
      label: 'Đang hiệu lực',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (item.rawStatus === 'REVISION_REQUESTED') {
    return {
      label: 'Yêu cầu chỉnh sửa',
      className: 'bg-rose-50 text-rose-800 border-rose-200',
    };
  }
  if (isStaffingReadyForAdminSign(item)) {
    return {
      label: 'Chờ Admin ký (Bước 2)',
      className: 'bg-blue-50 text-primary border-blue-200',
    };
  }
  if (item.status === 'DRAFT') {
    return {
      label: 'Chờ CSYT ký (Bước 1)',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  return {
    label: 'Đã chấm dứt / Hủy',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  };
}

export function getStaffingPartySignatureMatrix(
  item: StaffingContractItem
): StaffingPartySignatureState[] {
  const readyForAdmin = isStaffingReadyForAdminSign(item);

  return [
    {
      key: 'CSYT',
      roleLabel: 'Bước 1: Cơ sở Y tế đối tác',
      signed: item.facilitySigned,
      isAdminTurn: false,
      signedAt: item.facilitySignedAt,
    },
    {
      key: 'Admin',
      roleLabel: 'Bước 2: Admin nền tảng',
      signed: item.adminSigned,
      isAdminTurn: readyForAdmin,
      signedAt: item.adminSignedAt,
    },
  ];
}

export function computeContractTriageCounts(
  contracts: FourPartyContract[],
  staffingList: StaffingContractItem[]
) {
  const medicalReadyForAdmin = contracts.filter((c) =>
    matchesMedicalStatusFilter(c, 'READY_FOR_ADMIN')
  ).length;
  const medicalWaitingFamily = contracts.filter((c) =>
    matchesMedicalStatusFilter(c, 'WAITING_FAMILY')
  ).length;
  const medicalPendingPayment = contracts.filter((c) =>
    matchesMedicalStatusFilter(c, 'PENDING_PAYMENT')
  ).length;
  const medicalActive = contracts.filter((c) =>
    matchesMedicalStatusFilter(c, 'ACTIVE')
  ).length;
  const medicalCancelled = contracts.filter((c) =>
    matchesMedicalStatusFilter(c, 'CANCELLED')
  ).length;

  const staffingReadyForAdmin = staffingList.filter((s) =>
    matchesStaffingStatusFilter(s, 'READY_FOR_ADMIN')
  ).length;
  const staffingDraft = staffingList.filter((s) => s.status === 'DRAFT').length;
  const staffingActive = staffingList.filter((s) => s.status === 'ACTIVE').length;
  const staffingTerminated = staffingList.filter((s) => s.status === 'TERMINATED').length;

  return {
    medicalReadyForAdmin,
    medicalWaitingFamily,
    medicalPendingPayment,
    medicalActive,
    medicalCancelled,
    staffingReadyForAdmin,
    staffingDraft,
    staffingActive,
    staffingTerminated,
    totalReadyForAdmin: medicalReadyForAdmin + staffingReadyForAdmin,
    totalActive: medicalActive + staffingActive,
  };
}

export function formatContractCurrency(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}
