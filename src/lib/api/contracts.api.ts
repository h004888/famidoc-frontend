import { httpClient } from './http-client';
import type { FourPartyContract, ContractStatus } from '@/features/four-party-contract';

export interface MedicalContractListItem {
  id: string;
  contractNumber: string;
  contractStatus: ContractStatus;
  packageId: string;
  packageName: string;
  facilityId: string;
  facilityName: string;
  doctorId?: string;
  doctorName?: string;
  doctorTitle?: string;
  doctorSpecialty?: string;
  doctorPhone?: string;
  familyId: string;
  familyHeadName?: string;
  familyAddress?: string;
  memberCount: number;
  totalAmountVnd: number;
  signaturesCount: number;
  startDate?: string;
  endDate?: string;
  remainingHomeVisits?: number;
  totalHomeVisits?: number;
  remainingTelehealth?: number;
  totalTelehealth?: number;
  createdAt: string;
}

export interface CareNeedsSummaryDto {
  contractId: string;
  contractNumber: string;
  packageName: string;
  facilityName: string;
  familyAddress?: string;
  members: {
    patientId: string;
    fullName: string;
    age: number;
    gender: string;
    relationshipToHead: string;
    allergies: { allergen: string; severity: string }[];
    documents: { title: string; documentType: string }[];
  }[];
}

export interface ContractDocumentDto {
  contractId: string;
  contractNumber: string;
  termsHash: string;
  htmlContent: string;
  signatures: {
    signerRole: string;
    signerUserId: string;
    signatureHash: string;
    signedAt: string;
  }[];
}

export interface CreateFourPartyContractPayload {
  packageId: string;
  facilityId: string;
  doctorId?: string;
  patientIds: string[];
  familyId?: string;
  memberCount?: number;
  videoConsultations?: number;
  extraHomeVisits?: number;
}

export interface SignContractPayload {
  termsHash?: string;
  confirmationCode?: string;
}

export interface AssignDoctorPayload {
  doctorId: string;
}

// === HỢP ĐỒNG CUNG ỨNG NHÂN LỰC Y TẾ B2B (Flow 2.1 - APIs 9, 10, 11, 12, 13) ===
export interface StaffingContractItem {
  id: string;
  contractNumber: string;
  facilityId?: string;
  facilityName: string;
  platformSharePercent: number;
  facilitySharePercent: number;
  validFrom: string;
  validTo: string;
  status: 'DRAFT' | 'ACTIVE' | 'TERMINATED';
  adminSigned: boolean;
  facilitySigned: boolean;
  contractTerms?: string;
  rejectionReason?: string;
}

export function normalizeStaffingContract(item: any): StaffingContractItem {
  const contractNumber =
    item.contractNumber ||
    item.contractCode ||
    item.contract_code ||
    `STAFF-2026-ANSINH-${Math.floor(100 + Math.random() * 900)}`;

  const statusRaw = item.status || 'DRAFT';
  let normalizedStatus: 'DRAFT' | 'ACTIVE' | 'TERMINATED' = 'DRAFT';
  if (statusRaw === 'ACTIVE') normalizedStatus = 'ACTIVE';
  else if (statusRaw === 'TERMINATED' || statusRaw === 'EXPIRED') normalizedStatus = 'TERMINATED';
  else normalizedStatus = 'DRAFT';

  const facilitySigned = Boolean(item.facilitySigned || normalizedStatus === 'ACTIVE');
  const adminSigned = Boolean(item.adminSigned || normalizedStatus === 'ACTIVE');

  return {
    id: item.id || `CTR-B2B-${Math.floor(1000 + Math.random() * 9000)}`,
    contractNumber,
    facilityId: item.facilityId || item.facility?.id,
    facilityName:
      item.facilityName ||
      item.facility?.facilityName ||
      item.facility?.name ||
      'Bệnh viện Đa khoa An Sinh',
    platformSharePercent: Number(item.platformSharePercent ?? item.platformCommissionRate ?? 15),
    facilitySharePercent: Number(item.facilitySharePercent ?? item.facilityRevenueRate ?? 85),
    validFrom: item.validFrom || item.startDate || '2026-11-12T00:00:00.000Z',
    validTo: item.validTo || item.endDate || '2027-11-12T23:59:59.000Z',
    status: normalizedStatus,
    adminSigned,
    facilitySigned,
    contractTerms:
      item.contractTerms ||
      'HỢP ĐỒNG KHUNG CUNG ỨNG NHÂN LỰC Y TẾ B2B (MÔ HÌNH BÁC SĨ GIA ĐÌNH)\n\n' +
      'Điều 1. Phạm vi hợp tác:\n' +
      'Cơ sở y tế đồng ý cung ứng nguồn nhân lực Bác sĩ có Chứng chỉ hành nghề (CCHN) hợp lệ để thực hiện dịch vụ khám chữa bệnh gia đình và chăm sóc y tế toàn diện trên nền tảng số FamiDoc.\n\n' +
      'Điều 2. Tỷ lệ phân chia doanh thu & Cơ chế quyết toán:\n' +
      '- Cơ sở y tế hưởng: 85% trên tổng doanh thu các gói dịch vụ y tế phát sinh.\n' +
      '- Nền tảng FamiDoc hưởng: 15% phí vận hành công nghệ, tổng đài điều phối và hạ tầng bệnh án điện tử.\n' +
      '- Kỳ quyết toán: Định kỳ ngày 05 hàng tháng, FamiDoc tự động lập đối soát doanh thu chi trả về tài khoản ngân hàng thụ hưởng của CSYT.\n\n' +
      'Điều 3. Cam kết chất lượng chuyên môn:\n' +
      '- 100% bác sĩ tham gia phải được hậu kiểm CCHN trên CSDL Quốc gia của Bộ Y Tế.\n' +
      '- Tuân thủ chuẩn định mức tải gia đình (BR-04 Panel Capacity Ceiling) tối đa 150 hộ/bác sĩ nhằm bảo đảm an toàn y tế.\n\n' +
      'Điều 4. Ký số điện tử & Hiệu lực pháp lý:\n' +
      'Hợp đồng được lập và ký số điện tử hợp pháp theo Luật Giao dịch điện tử và Nghị định 130/2018/NĐ-CP (SmartCA / VNPT-CA / Documenso), có hiệu lực 01 năm kể từ thời điểm ký.',
    rejectionReason: item.rejectionReason,
  };
}

export const contractsApi = {
  getMedicalContracts: async (params?: {
    role?: string;
    status?: string;
    facilityId?: string;
  }): Promise<MedicalContractListItem[]> => {
    const res = await httpClient.get<any>('/api/v1/contracts/medical', params);
    if (res && typeof res === 'object') {
      if ('data' in res) {
        if (Array.isArray(res.data)) return res.data;
        if (res.data && typeof res.data === 'object' && 'items' in res.data && Array.isArray(res.data.items)) {
          return res.data.items;
        }
      }
      if ('items' in res && Array.isArray(res.items)) return res.items;
    }
    if (Array.isArray(res)) return res;
    return [];
  },

  getMedicalContractById: async (id: string): Promise<FourPartyContract> => {
    const res = await httpClient.get<any>(`/api/v1/contracts/medical/${id}`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as FourPartyContract;
  },

  getCareSummary: async (contractId: string): Promise<CareNeedsSummaryDto> => {
    const res = await httpClient.get<any>(`/api/v1/contracts/medical/${contractId}/care-summary`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as CareNeedsSummaryDto;
  },

  getContractDocument: async (contractId: string): Promise<ContractDocumentDto> => {
    const res = await httpClient.get<any>(`/api/v1/contracts/medical/${contractId}/document`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as ContractDocumentDto;
  },

  initiateFourPartyContract: async (payload: CreateFourPartyContractPayload): Promise<FourPartyContract> => {
    const res = await httpClient.post<any>('/api/v1/contracts/four-party', payload);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as FourPartyContract;
  },

  signContract: async (contractId: string, payload: SignContractPayload): Promise<{ signatureHash: string }> => {
    const res = await httpClient.put<any>(`/api/v1/contracts/four-party/${contractId}/sign`, payload);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as { signatureHash: string };
  },

  assignDoctor: async (contractId: string, payload: AssignDoctorPayload): Promise<{ id: string; doctorId: string }> => {
    const res = await httpClient.patch<any>(`/api/v1/contracts/${contractId}/assign-doctor`, payload);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as { id: string; doctorId: string };
  },

  recheckPaymentActivation: async (paymentId: string): Promise<{ activated: boolean }> => {
    const res = await httpClient.post<any>(`/api/v1/payments/requests/${paymentId}/recheck-activation`);
    if (res && typeof res === 'object' && 'data' in res && res.data) return res.data;
    return res as { activated: boolean };
  },

  createAddendum: (
    contractId: string,
    payload: {
      requestKey: string;
      type: 'QUOTA_EXPANSION' | 'MEMBER_EXTENSION';
      extraHomeVisits?: number;
      additionalMembers?: number;
    }
  ): Promise<any> => {
    return httpClient.post(`/api/v1/contracts/${contractId}/addendums`, payload);
  },

  upgradePackage: (
    contractId: string,
    payload: {
      packageId: string;
      videoConsultations?: number;
      kind?: 'UPGRADE' | 'RENEWAL';
    }
  ): Promise<any> => {
    return httpClient.post(`/api/v1/contracts/${contractId}/upgrade`, payload);
  },

  terminateContract: (
    contractId: string,
    payload: { reason: string; note?: string; bankInfo?: string }
  ): Promise<any> => {
    return httpClient.post(`/api/v1/contracts/${contractId}/termination`, payload);
  },

  // === HỢP ĐỒNG CUNG ỨNG NHÂN LỰC Y TẾ B2B (Flow 2.1 - APIs 9, 10, 11, 12, 13) ===
  getStaffingContracts: async (params?: {
    facilityId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: StaffingContractItem[]; total: number }> => {
    try {
      const res = await httpClient.get<any>('/api/v1/contracts/staffing', params);
      let rawList: any[] = [];
      let totalCount = 0;

      if (res && typeof res === 'object') {
        if (Array.isArray(res.data)) {
          rawList = res.data;
          totalCount = res.pagination?.total ?? res.data.length;
        } else if (res.data && Array.isArray(res.data.items)) {
          rawList = res.data.items;
          totalCount = res.data.total ?? res.data.items.length;
        } else if (Array.isArray(res.items)) {
          rawList = res.items;
          totalCount = res.total ?? res.items.length;
        } else if (Array.isArray(res)) {
          rawList = res;
          totalCount = res.length;
        }
      }

      if (rawList.length > 0) {
        return {
          data: rawList.map(normalizeStaffingContract),
          total: totalCount,
        };
      }
    } catch {
      // Fallback
    }
    return { data: [], total: 0 };
  },

  getStaffingContractById: async (id: string): Promise<any> => {
    try {
      const res = await httpClient.get<any>(`/api/v1/contracts/staffing/${id}`);
      if (res && typeof res === 'object' && res.data) return res.data;
      return res;
    } catch {
      return null;
    }
  },

  createStaffingContract: async (payload?: {
    facilityId?: string;
    platformCommissionRate?: number;
    facilityRevenueRate?: number;
    platformSharePercent?: number;
    facilitySharePercent?: number;
    startDate?: string;
    endDate?: string;
    validFrom?: string;
    validTo?: string;
  }): Promise<any> => {
    const cleanPayload: Record<string, any> = {
      platformCommissionRate: Number(payload?.platformCommissionRate ?? payload?.platformSharePercent ?? 15),
      facilityRevenueRate: Number(payload?.facilityRevenueRate ?? payload?.facilitySharePercent ?? 85),
      startDate: payload?.startDate || payload?.validFrom || new Date().toISOString().slice(0, 10),
      endDate:
        payload?.endDate ||
        payload?.validTo ||
        new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString().slice(0, 10),
    };

    if (payload?.facilityId && /^[0-9a-fA-F-]{36}$/.test(payload.facilityId)) {
      cleanPayload.facilityId = payload.facilityId;
    }

    return httpClient.post('/api/v1/contracts/staffing', cleanPayload);
  },

  signStaffingContract: async (
    id: string,
    payload?: {
      signedPdfUrl?: string;
      signatureHash?: string;
      confirmed?: boolean;
    }
  ): Promise<any> => {
    const cleanBody: Record<string, any> = {};
    if (payload?.signedPdfUrl) cleanBody.signedPdfUrl = payload.signedPdfUrl;
    if (payload?.signatureHash) cleanBody.signatureHash = payload.signatureHash;
    return httpClient.put(`/api/v1/contracts/staffing/${id}/sign`, cleanBody);
  },

  rejectStaffingContract: async (
    id: string,
    rejectionReason: string
  ): Promise<any> => {
    return httpClient.patch(`/api/v1/contracts/staffing/${id}/reject`, {
      rejectionReason,
    });
  },
};
