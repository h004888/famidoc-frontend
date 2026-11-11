export const CONTRACT_STATUSES = [
  'DRAFT',
  'FAMILY_SIGNED',
  'PLATFORM_SIGNED',
  'FACILITY_ASSIGNED',
  'DOCTOR_ACCEPTED',
  'PENDING_PAYMENT',
  'ACTIVE',
  'CANCELLED',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: 'Bản thảo',
  FAMILY_SIGNED: 'Gia đình đã ký',
  PLATFORM_SIGNED: 'Nền tảng đã duyệt',
  FACILITY_ASSIGNED: 'CSYT đã phân công',
  DOCTOR_ACCEPTED: 'Bác sĩ đã chấp thuận',
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Đang hiệu lực',
  CANCELLED: 'Đã hủy',
};

export const CONTRACT_TRANSITION_MAP: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['FAMILY_SIGNED', 'CANCELLED'],
  FAMILY_SIGNED: ['PLATFORM_SIGNED', 'CANCELLED'],
  PLATFORM_SIGNED: ['FACILITY_ASSIGNED', 'CANCELLED'],
  FACILITY_ASSIGNED: ['DOCTOR_ACCEPTED', 'CANCELLED'],
  DOCTOR_ACCEPTED: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['CANCELLED'],
  CANCELLED: [],
};

export function canTransitionContractStatus(
  current: ContractStatus,
  target: ContractStatus,
): boolean {
  const allowed = CONTRACT_TRANSITION_MAP[current] || [];
  return allowed.includes(target);
}

export function getNextContractStatuses(current: ContractStatus): ContractStatus[] {
  return CONTRACT_TRANSITION_MAP[current] || [];
}

export function transitionContractStatus(
  current: ContractStatus,
  target: ContractStatus,
): ContractStatus {
  if (!canTransitionContractStatus(current, target)) {
    throw new Error(
      `Không thể chuyển trạng thái hợp đồng từ "${current}" sang "${target}". Luồng chuyển trạng thái không hợp lệ.`,
    );
  }
  return target;
}
