'use client';

import { useSyncExternalStore } from 'react';

export type ContractWorkflowStep =
  | 'DRAFT'
  | 'PENDING_ADMIN_SIGN'
  | 'PENDING_FACILITY_SIGN'
  | 'PENDING_DOCTOR_SIGN'
  | 'PENDING_PAYMENT'
  | 'ACTIVE';

export interface FamilyMemberRecord {
  id: string;
  name: string;
  relation: string;
  birthYear: number;
  gender: 'Nam' | 'Nữ';
  cccdOrBhyt: string;
  baselineMedicalHistory: string;
  allergies?: string;
  chronicConditions?: string;
}

export interface DoctorCapacityOption {
  id: string;
  name: string;
  title: string;
  specialty: string;
  cchn: string;
  activePanelCount: number;
  maxPanelCapacity: number; // Max 30 per BR-04
  isAvailable: boolean;
}

export interface ContractWorkflowData {
  contractCode: string;
  packageName: string;
  packagePrice: number;
  packagePriceFormatted: string;
  durationMonths: number;
  familyId: string;
  familyHeadName: string;
  familyPhone: string;
  familyAddress: string;
  members: FamilyMemberRecord[];
  
  step: ContractWorkflowStep;
  statusLabel: string;

  // Party A: Family Representative
  familySigned: boolean;
  familySignedAt?: string;
  familySignerName?: string;
  familyOtpMethod?: string;

  // Party B: Platform Provider (Admin)
  adminSigned: boolean;
  adminSignedAt?: string;
  adminSignerName?: string;
  adminCertSerial?: string;

  // Party C: Healthcare Facility (BV ĐHYD)
  facilitySigned: boolean;
  facilitySignedAt?: string;
  facilityName?: string;
  facilitySignerName?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  assignedDoctorTitle?: string;

  // Party D: Assigned In-house Physician
  doctorSigned: boolean;
  doctorSignedAt?: string;
  doctorSignerName?: string;
  doctorCchn?: string;

  // Payment Settlement (VietQR)
  paymentPaid: boolean;
  paymentPaidAt?: string;
  paymentTransactionCode?: string;
  vietQrUrl?: string;
}

const STORAGE_KEY = 'famidoc_4party_contract_v1';

let cachedSnapshot: ContractWorkflowData | null = null;
let lastRawString: string | null = null;

export const INITIAL_DOCTOR_CANDIDATES: DoctorCapacityOption[] = [
  {
    id: 'DOC-7901',
    name: 'BS.CKII Trần Thanh Mai',
    title: 'Bác sĩ Gia đình & Nội Tim Mạch',
    specialty: 'Y học Gia đình - CCHN: 004128/HCM',
    cchn: '004128/HCM',
    activePanelCount: 18,
    maxPanelCapacity: 30, // BR-04 ceiling
    isAvailable: true,
  },
  {
    id: 'DOC-7902',
    name: 'ThS.BS Nguyễn Hoài Nam',
    title: 'Bác sĩ Gia đình & Lão khoa',
    specialty: 'Y học Gia đình - CCHN: 005319/HCM',
    cchn: '005319/HCM',
    activePanelCount: 24,
    maxPanelCapacity: 30,
    isAvailable: true,
  },
  {
    id: 'DOC-7903',
    name: 'BS.CKI Lê Thị Kim Oanh',
    title: 'Bác sĩ Nhi & Y học Gia đình',
    specialty: 'Nhi khoa - CCHN: 003921/HCM',
    cchn: '003921/HCM',
    activePanelCount: 30,
    maxPanelCapacity: 30,
    isAvailable: false, // BR-04: BLOCKED capacity limit
  },
];

export const DEFAULT_WORKFLOW_STATE: ContractWorkflowData = {
  contractCode: 'CTR-4P-2026-88219',
  packageName: 'Gói Gia Đình Toàn Diện VIP (12 Tháng)',
  packagePrice: 9600000,
  packagePriceFormatted: '9.600.000 đ',
  durationMonths: 12,
  familyId: 'FAM-88219',
  familyHeadName: 'Nguyễn Văn An',
  familyPhone: '0912345678',
  familyAddress: '124 Nguyễn Tri Phương, Phường 7, Quận 5, TP.HCM',
  members: [
    {
      id: 'MEM-01',
      name: 'Nguyễn Văn Phúc',
      relation: 'Ông nội',
      birthYear: 1948,
      gender: 'Nam',
      cccdOrBhyt: '079048001234',
      baselineMedicalHistory: 'Tăng huyết áp Độ 2 (JNC-7), Đái tháo đường Type 2 kiểm soát kém (HbA1c 8.1%)',
      allergies: 'Không ghi nhận',
      chronicConditions: 'Tăng HA, ĐTĐ T2',
    },
    {
      id: 'MEM-02',
      name: 'Nguyễn Văn An',
      relation: 'Chủ hộ (Đại diện)',
      birthYear: 1984,
      gender: 'Nam',
      cccdOrBhyt: '079084005678',
      baselineMedicalHistory: 'Gout thể nhẹ ngắt quãng, Acid uric 480 umol/L',
      allergies: 'Không',
      chronicConditions: 'Gout nhẹ',
    },
    {
      id: 'MEM-03',
      name: 'Trần Thu Hà',
      relation: 'Vợ',
      birthYear: 1988,
      gender: 'Nữ',
      cccdOrBhyt: '079088009876',
      baselineMedicalHistory: 'Thể trạng tốt, tiền sử sốc phản vệ Penicillin & Amoxicillin (Cảnh báo CDS cấp 1)',
      allergies: 'Penicillin, Amoxicillin (Dị ứng nhóm Beta-lactam)',
      chronicConditions: 'Không',
    },
    {
      id: 'MEM-04',
      name: 'Bé Nguyễn Minh An',
      relation: 'Con trai',
      birthYear: 2020,
      gender: 'Nam',
      cccdOrBhyt: 'GKS-2020-00129',
      baselineMedicalHistory: 'Phát triển thể chất bình thường, tiêm chủng mở rộng đầy đủ',
      allergies: 'Không',
      chronicConditions: 'Không',
    },
  ],

  step: 'PENDING_ADMIN_SIGN',
  statusLabel: 'Chờ Quản Trị Viên Ký Số (Bên B)',

  // Party A: Family
  familySigned: true,
  familySignedAt: '10/11/2026 14:15:20',
  familySignerName: 'Nguyễn Văn An (Đại diện Hộ)',
  familyOtpMethod: 'SMS OTP Viettel (0988)',

  // Party B: Admin
  adminSigned: false,
  adminSignedAt: undefined,
  adminSignerName: undefined,
  adminCertSerial: undefined,

  // Party C: Facility
  facilitySigned: false,
  facilitySignedAt: undefined,
  facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
  facilitySignerName: undefined,
  assignedDoctorId: undefined,
  assignedDoctorName: undefined,
  assignedDoctorTitle: undefined,

  // Party D: Doctor
  doctorSigned: false,
  doctorSignedAt: undefined,
  doctorSignerName: undefined,
  doctorCchn: undefined,

  // Payment
  paymentPaid: false,
  paymentPaidAt: undefined,
  paymentTransactionCode: 'TXN-20261110-88219',
};

export function getContractWorkflow(): ContractWorkflowData {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOW_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (lastRawString === null && cachedSnapshot !== null) {
        return cachedSnapshot;
      }
      const initialJson = JSON.stringify(DEFAULT_WORKFLOW_STATE);
      localStorage.setItem(STORAGE_KEY, initialJson);
      lastRawString = initialJson;
      cachedSnapshot = DEFAULT_WORKFLOW_STATE;
      return cachedSnapshot;
    }
    if (raw === lastRawString && cachedSnapshot !== null) {
      return cachedSnapshot;
    }
    cachedSnapshot = JSON.parse(raw) as ContractWorkflowData;
    lastRawString = raw;
    return cachedSnapshot;
  } catch {
    return DEFAULT_WORKFLOW_STATE;
  }
}

export function saveContractWorkflow(data: ContractWorkflowData): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(data);
    lastRawString = raw;
    cachedSnapshot = data;
    localStorage.setItem(STORAGE_KEY, raw);
    window.dispatchEvent(new Event('famidoc_contract_updated'));
  } catch (e) {
    console.error('Failed to save contract workflow', e);
  }
}

export function updateContractStep(
  nextStep: ContractWorkflowStep,
  updates?: Partial<ContractWorkflowData>
): ContractWorkflowData {
  const current = getContractWorkflow();
  const nextData: ContractWorkflowData = {
    ...current,
    ...updates,
    step: nextStep,
  };

  switch (nextStep) {
    case 'DRAFT':
      nextData.statusLabel = 'Dự Thảo Hợp Đồng 4 Bên';
      break;
    case 'PENDING_ADMIN_SIGN':
      nextData.statusLabel = 'Chờ Quản Trị Nền Tảng Ký Duyệt (Bên B)';
      break;
    case 'PENDING_FACILITY_SIGN':
      nextData.statusLabel = 'Chờ Cơ Sở Y Tế Phân Công BS & Ký Số (Bên C)';
      break;
    case 'PENDING_DOCTOR_SIGN':
      nextData.statusLabel = 'Chờ Bác Sĩ Gia Đình Tiếp Nhận & Ký Số (Bên D)';
      break;
    case 'PENDING_PAYMENT':
      nextData.statusLabel = 'Chờ Thanh Toán VietQR Tự Động (15 Phút)';
      break;
    case 'ACTIVE':
      nextData.statusLabel = 'Hợp Đồng Đang Có Hiệu Lực (ACTIVE)';
      break;
  }

  saveContractWorkflow(nextData);
  return nextData;
}

export function resetContractWorkflow(): ContractWorkflowData {
  saveContractWorkflow(DEFAULT_WORKFLOW_STATE);
  return DEFAULT_WORKFLOW_STATE;
}

function subscribeContractWorkflow(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('famidoc_contract_updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('famidoc_contract_updated', callback);
    window.removeEventListener('storage', callback);
  };
}

export function useContractWorkflow(): ContractWorkflowData {
  return useSyncExternalStore(
    subscribeContractWorkflow,
    () => getContractWorkflow(),
    () => DEFAULT_WORKFLOW_STATE
  );
}
