import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';
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
  familyId: string;
  familyHeadName?: string;
  memberCount: number;
  totalAmountVnd: number;
  signaturesCount: number;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  doctorTitle?: string;
  doctorSpecialty?: string;
  doctorPhone?: string;
  remainingHomeVisits?: number;
  totalHomeVisits?: number;
  remainingTelehealth?: number;
  totalTelehealth?: number;
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

/**
 * Trạng thái hợp đồng do backend lưu trong PostgreSQL.
 * Khác với ContractStatus của FSM phía giao diện: backend chỉ có 5 trạng thái.
 */
export type BackendContractStatus =
  | 'PENDING_APPROVAL'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED';

export type BackendSignerRole =
  | 'FAMILY_REP'
  | 'HEALTHCARE_FACILITY'
  | 'ASSIGNED_DOCTOR'
  | 'ADMIN';

/** Payload thật của GET /api/v1/contracts/medical/:id (shape Prisma, đã bóc envelope). */
export interface MedicalContractDetailDto {
  id: string;
  contractNumber: string;
  contractStatus: BackendContractStatus;
  totalAmount: string | number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
  memberCount?: number;
  additionalTerms?: string | null;
  documensoEnvelopeId?: string | null;
  documensoItemId?: string | null;
  signedPdfUrl?: string | null;
  signatures?: Array<{
    id?: string;
    signerRole: BackendSignerRole;
    signerUserId: string;
    signatureHash?: string;
    signedAt: string;
  }>;
  familyUnit?: {
    id?: string;
    homeAddress?: string;
    emergencyPhone?: string;
    representativeUser?: { fullName?: string; email?: string; phoneNumber?: string };
  };
  facility?: {
    id?: string;
    facilityName?: string;
    address?: string;
    userId?: string;
  };
  doctor?: {
    id?: string;
    doctorName?: string;
    specialty?: string;
    user?: { fullName?: string; email?: string };
  } | null;
  servicePackage?: { id?: string; packageName?: string; durationMonths?: number };
  billingSnapshot?: {
    package?: { name?: string };
    pricing?: { totalPriceVnd?: number };
  };
}

export interface ContractSigningSessionDto {
  contractId: string;
  contractNumber: string;
  contractStatus: BackendContractStatus;
  signerRole: BackendSignerRole;
  alreadySigned: boolean;
  canSign: boolean;
  signingToken: string | null;
  signingUrl: string | null;
  signedRoles: BackendSignerRole[];
  signedPdfUrl: string | null;
}

export interface DocumensoSyncResultDto {
  synced: boolean;
  contractId: string;
  contractStatus: BackendContractStatus;
  signedRoles: BackendSignerRole[];
  signedPdfUrl: string | null;
}

export interface VietQRPaymentRequestDto {
  id: string;
  contractId: string;
  familyId: string;
  environment: 'TEST' | 'LIVE';
  attempt: number;
  paymentCode: string;
  transferContent?: string;
  amountVnd: number;
  currency: 'VND';
  qrUrl?: string | null;
  expectedAccountNumber: string;
  expectedGateway: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  acceptedTransactionId: string | null;
}

export interface FamilyGateDoctorSummaryDto {
  id: string;
  fullName: string;
  title: string;
  hospitalName: string;
  avatarUrl: string | null;
  phone: string | null;
  experienceYears: number;
}

export interface FamilyGateStatusDto {
  hasActiveContract: boolean;
  activeContract: {
    id: string;
    contractNumber: string;
    contractStatus?: BackendContractStatus;
    memberCount: number;
    endDate: string;
    packageName?: string | null;
    packageDescription?: string | null;
    doctor?: FamilyGateDoctorSummaryDto | null;
  } | null;
  pendingContract: {
    id: string;
    contractNumber: string;
    contractStatus: BackendContractStatus;
    memberCount?: number;
  } | null;
  familyUnit?: {
    id: string;
    homeAddress: string;
    emergencyPhone: string;
    representativeName: string;
  } | null;
  patientCount: number;
}

const unwrapEnvelope = unwrapApiEnvelope;

export interface CreateFourPartyContractPayload {
  packageId: string;
  facilityId: string;
  doctorId?: string;
  patientIds?: string[];
  familyId?: string;
  memberCount?: number;
  videoConsultations?: number;
  extraHomeVisits?: number;
  additionalTerms?: string;
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

function mapSignatureRoleToUiRole(
  role: BackendSignerRole
): 'FAMILY' | 'FACILITY' | 'DOCTOR' | 'PLATFORM' {
  switch (role) {
    case 'FAMILY_REP':
      return 'FAMILY';
    case 'HEALTHCARE_FACILITY':
      return 'FACILITY';
    case 'ASSIGNED_DOCTOR':
      return 'DOCTOR';
    case 'ADMIN':
      return 'PLATFORM';
  }
}

export function mapMedicalContractToFourParty(
  raw: MedicalContractDetailDto | FourPartyContract
): FourPartyContract {
  if (!raw || !('contractStatus' in raw)) {
    return raw as FourPartyContract;
  }

  const dto = raw as MedicalContractDetailDto;
  const sigs = dto.signatures ?? [];
  const signedRoles = sigs.map((s) => s.signerRole);

  let status: ContractStatus = 'DRAFT';
  if (dto.contractStatus === 'ACTIVE') {
    status = 'ACTIVE';
  } else if (dto.contractStatus === 'PENDING_PAYMENT') {
    status = 'PENDING_PAYMENT';
  } else if (
    dto.contractStatus === 'EXPIRED' ||
    dto.contractStatus === 'TERMINATED'
  ) {
    status = 'CANCELLED';
  } else if (signedRoles.length >= 4) {
    status = 'PENDING_PAYMENT';
  } else if (signedRoles.includes('FAMILY_REP')) {
    status = 'FAMILY_SIGNED';
  }

  const mappedSignatures: FourPartyContract['signatures'] = {};
  for (const s of sigs) {
    const uiRole = mapSignatureRoleToUiRole(s.signerRole);
    const hash =
      s.signatureHash && s.signatureHash.length >= 16
        ? s.signatureHash
        : 'documenso-verified-signature';
    if (uiRole === 'FAMILY') {
      mappedSignatures.family = {
        signedBy:
          dto.familyUnit?.representativeUser?.fullName ||
          'Đại diện Hộ gia đình',
        signerRole: 'FAMILY',
        signedAt: s.signedAt,
        sha256Hash: hash,
      };
    } else if (uiRole === 'FACILITY') {
      mappedSignatures.facility = {
        signedBy: dto.facility?.facilityName || 'Cơ sở Y tế phối hợp',
        signerRole: 'FACILITY',
        signedAt: s.signedAt,
        sha256Hash: hash,
      };
    } else if (uiRole === 'DOCTOR') {
      mappedSignatures.doctor = {
        signedBy:
          dto.doctor?.doctorName ||
          dto.doctor?.user?.fullName ||
          'Bác sĩ Gia đình phụ trách',
        signerRole: 'DOCTOR',
        signedAt: s.signedAt,
        sha256Hash: hash,
      };
    } else if (uiRole === 'PLATFORM') {
      mappedSignatures.platform = {
        signedBy: 'Nền tảng FamiDoc',
        signerRole: 'PLATFORM',
        signedAt: s.signedAt,
        sha256Hash: hash,
      };
    }
  }

  const parsedPrice =
    dto.billingSnapshot?.pricing?.totalPriceVnd ?? Number(dto.totalAmount ?? 0);

  return {
    id: dto.id,
    contractNumber: dto.contractNumber,
    status,
    packageId: dto.servicePackage?.id || 'pkg-default',
    packageName:
      dto.billingSnapshot?.package?.name ||
      dto.servicePackage?.packageName ||
      'Gói Chăm Sóc Sức Khỏe Gia Đình',
    packagePrice: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    durationMonths: dto.servicePackage?.durationMonths ?? 12,
    familyId: dto.familyUnit?.id || 'family-unknown',
    familyRepresentativeName:
      dto.familyUnit?.representativeUser?.fullName || 'Đại diện Hộ gia đình',
    familyRepresentativePhone:
      dto.familyUnit?.representativeUser?.phoneNumber ||
      dto.familyUnit?.emergencyPhone ||
      '—',
    familyRepresentativeEmail:
      dto.familyUnit?.representativeUser?.email || '',
    familyAddress: dto.familyUnit?.homeAddress || undefined,
    membersCount: dto.memberCount ?? 1,
    facilityId: dto.facility?.id,
    facilityName: dto.facility?.facilityName,
    facilityAddress: dto.facility?.address,
    doctorId: dto.doctor?.id,
    doctorName: dto.doctor?.doctorName || dto.doctor?.user?.fullName,
    assignedDoctorId: dto.doctor?.id,
    assignedDoctorName: dto.doctor?.doctorName || dto.doctor?.user?.fullName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    signatures: mappedSignatures,
  };
}

export const contractsApi = {
  getMedicalContracts: async (params?: {
    role?: string;
    status?: string;
    facilityId?: string;
    page?: number;
    limit?: number;
  }): Promise<FourPartyContract[]> => {
    const queryParams: Record<string, string | number | undefined> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.facilityId) queryParams.facilityId = params.facilityId;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const payload = await httpClient.get<unknown>(
      '/api/v1/contracts/medical',
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );
    const unwrapped = unwrapEnvelope<
      | { items?: Array<MedicalContractDetailDto | FourPartyContract> }
      | Array<MedicalContractDetailDto | FourPartyContract>
    >(payload);
    const list = Array.isArray(unwrapped) ? unwrapped : unwrapped?.items ?? [];
    return list.map(mapMedicalContractToFourParty);
  },

  getMedicalContractById: async (id: string): Promise<FourPartyContract> => {
    const payload = await httpClient.get<unknown>(`/api/v1/contracts/medical/${id}`);
    const unwrapped = unwrapEnvelope<MedicalContractDetailDto | FourPartyContract>(payload);
    return mapMedicalContractToFourParty(unwrapped);
  },

  /**
   * Bản chi tiết dùng cho trang theo dõi của gia đình: bóc envelope và trả đúng
   * shape backend (`contractStatus`, `facility`, `doctor.user`, `servicePackage`).
   * Giữ `getMedicalContractById` cho các view cũ để không đổi hành vi của chúng.
   */
  getMedicalContractDetail: async (
    id: string
  ): Promise<MedicalContractDetailDto> => {
    const payload = await httpClient.get<unknown>(
      `/api/v1/contracts/medical/${id}`
    );
    return unwrapEnvelope<MedicalContractDetailDto>(payload);
  },

  getSigningSession: async (
    contractId: string
  ): Promise<ContractSigningSessionDto> => {
    const payload = await httpClient.get<unknown>(
      `/api/v1/contracts/medical/${contractId}/signing-session`
    );
    return unwrapEnvelope<ContractSigningSessionDto>(payload);
  },

  syncDocumenso: async (
    contractId: string
  ): Promise<DocumensoSyncResultDto> => {
    const payload = await httpClient.post<unknown>(
      `/api/v1/contracts/four-party/${contractId}/sync-documenso`
    );
    return unwrapEnvelope<DocumensoSyncResultDto>(payload);
  },

  getFamilyGateStatus: async (): Promise<FamilyGateStatusDto> => {
    const payload = await httpClient.get<unknown>(
      '/api/v1/contracts/family/gate-status'
    );
    return unwrapEnvelope<FamilyGateStatusDto>(payload);
  },

  getCareSummary: (contractId: string): Promise<CareNeedsSummaryDto> => {
    return httpClient.get<CareNeedsSummaryDto>(`/api/v1/contracts/medical/${contractId}/care-summary`);
  },

  getContractDocument: (contractId: string): Promise<ContractDocumentDto> => {
    return httpClient.get<ContractDocumentDto>(`/api/v1/contracts/medical/${contractId}/document`);
  },

  initiateFourPartyContract: async (
    payload: CreateFourPartyContractPayload
  ): Promise<
    FourPartyContract & {
      id: string;
      documensoEnvelopeId?: string | null;
      documensoItemId?: string | null;
      signingToken?: string | null;
      signingUrl?: string | null;
    }
  > => {
    const response = await httpClient.post<unknown>(
      '/api/v1/contracts/four-party',
      payload
    );
    return unwrapEnvelope<
      FourPartyContract & {
        id: string;
        documensoEnvelopeId?: string | null;
        documensoItemId?: string | null;
        signingToken?: string | null;
        signingUrl?: string | null;
      }
    >(response);
  },

  signContract: (contractId: string, payload: SignContractPayload): Promise<{ signatureHash: string }> => {
    return httpClient.put<{ signatureHash: string }>(`/api/v1/contracts/four-party/${contractId}/sign`, payload);
  },

  assignDoctor: (contractId: string, payload: AssignDoctorPayload): Promise<{ id: string; doctorId: string }> => {
    return httpClient.patch<{ id: string; doctorId: string }>(`/api/v1/contracts/${contractId}/assign-doctor`, payload);
  },

  createVietQRPayment: async (contractId: string): Promise<VietQRPaymentRequestDto> => {
    const response = await httpClient.post<unknown>('/api/v1/payments/requests', {
      contractId,
    });
    return unwrapEnvelope<VietQRPaymentRequestDto>(response);
  },

  getPaymentStatus: async (paymentId: string): Promise<VietQRPaymentRequestDto> => {
    const response = await httpClient.get<unknown>(`/api/v1/payments/requests/${paymentId}`);
    return unwrapEnvelope<VietQRPaymentRequestDto>(response);
  },

  recheckPaymentActivation: (paymentId: string): Promise<{ activated: boolean }> => {
    return httpClient.post<{ activated: boolean }>(`/api/v1/payments/requests/${paymentId}/recheck-activation`);
  },

  /**
   * Trả đường dẫn proxy tải PDF đã ký phía backend.
   */
  getSignedPdfBlobUrl: (contractId: string): string => {
    return `/api/v1/contracts/medical/${contractId}/signed-pdf`;
  },

  /**
   * Tải tệp PDF đã ký dạng Blob (gửi kèm Bearer JWT tới backend proxy).
   */
  downloadSignedPdf: (contractId: string): Promise<Blob> => {
    return httpClient.getBlob(`/api/v1/contracts/medical/${contractId}/signed-pdf`);
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
