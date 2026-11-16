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
  /** ID hợp đồng nháp chưa thanh toán cần hủy nguyên tử trước khi tạo hợp đồng mới. */
  replaceContractId?: string;
}

export interface SignContractPayload {
  termsHash?: string;
  confirmationCode?: string;
}

export interface AssignDoctorPayload {
  doctorId: string;
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
    id: string,
    options?: { forceSync?: boolean }
  ): Promise<MedicalContractDetailDto> => {
    const payload = await httpClient.get<unknown>(
      `/api/v1/contracts/medical/${id}`,
      options?.forceSync ? { forceSync: '1' } : undefined
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

  /**
   * Hủy bản nháp hợp đồng chưa thanh toán (PENDING_APPROVAL / PENDING_PAYMENT, chưa có hóa đơn PAID).
   */
  cancelDraftContract: async (
    contractId: string,
    reason?: string
  ): Promise<{ id: string; contractStatus: BackendContractStatus }> => {
    const response = await httpClient.post<unknown>(
      `/api/v1/contracts/medical/${contractId}/cancel-draft`,
      reason ? { reason } : {}
    );
    return unwrapEnvelope<{ id: string; contractStatus: BackendContractStatus }>(response);
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
};
