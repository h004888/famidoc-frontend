import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';
import { fetchPaginatedList } from './paginated-list';
import type { FourPartyContract, ContractStatus } from '@/features/four-party-contract';

export type { FourPartyContract, ContractStatus };

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
  doctorAvatarUrl?: string | null;
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
  familyId?: string;
  packageName: string;
  facilityName?: string;
  familyAddress?: string;
  totalMembers?: number;
  members: {
    patientId: string;
    fullName: string;
    dateOfBirth?: string;
    age: number;
    ageGroup?: 'CHILD' | 'ADOLESCENT' | 'ADULT' | 'ELDERLY';
    gender: string;
    relationshipToHead: string;
    allergies: {
      id?: string;
      allergen?: string;
      allergenName?: string;
      allergenType?: string;
      severity: string;
      clinicalManifestation?: string | null;
    }[];
    documents: {
      id?: string;
      title?: string;
      documentName?: string;
      documentType: string;
    }[];
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
  | 'PAID_PENDING_APPROVAL'
  | 'PENDING_ACTIVATION'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_EXPIRED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'CANCELLED';

export type BackendSignerRole =
  | 'FAMILY_REP'
  | 'HEALTHCARE_FACILITY'
  | 'ASSIGNED_DOCTOR'
  | 'ADMIN';

/** Payload thật của GET /api/v1/contracts/medical/:id (shape Prisma, đã bóc envelope). */
export interface MedicalContractDetailDto {
  signingDeadlineAt?: string | null;
  serverTime?: string;
  terminationReason?: string | null;
  id: string;
  contractNumber: string;
  contractStatus: BackendContractStatus;
  totalAmount: string | number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
  memberCount?: number;
  remainingHomeVisits?: number;
  remainingTelehealth?: number;
  additionalTerms?: string | null;
  homeVisitAddress?: string | null;
  documensoEnvelopeId?: string | null;
  documensoItemId?: string | null;
  signedPdfUrl?: string | null;
  upgradedFromId?: string | null;
  holdExpiresAt?: string | null;
  upgradedFrom?: {
    id: string;
    contractNumber: string;
    contractStatus: BackendContractStatus;
    startDate: string;
    endDate: string;
  } | null;
  upgrades?: Array<{
    id: string;
    contractNumber: string;
    contractStatus: BackendContractStatus;
    startDate: string;
    endDate: string;
    holdExpiresAt?: string | null;
    createdAt: string;
  }>;
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
    academicTitle?: string;
    experienceYears?: number;
    cchnNumber?: string;
    credentials?: Array<{
      credentialType?: string;
      certificateNumber?: string;
    }>;
    user?: { fullName?: string; email?: string; avatarUrl?: string | null };
  } | null;
  members?: Array<{
    id?: string;
    patientId?: string;
    patient?: {
      id?: string;
      fullName?: string;
      dateOfBirth?: string;
      gender?: string;
      relationshipToHead?: string;
    };
  }>;
  documensoSigners?: Array<{
    signerRole: BackendSignerRole;
    status: string;
    completedAt?: string | null;
  }>;
  addenda?: Array<{
    id: string;
    addendumNumber: string;
    addendumType: string;
    additionalAmount: string | number;
    status: string;
    createdAt?: string;
    signatures?: Array<{
      signerRole: BackendSignerRole;
      signedAt?: string;
    }>;
  }>;
  invoices?: Array<{
    id?: string;
    addendumId?: string | null;
    paymentStatus?: string;
  }>;
  servicePackage?: {
    id?: string;
    packageName?: string;
    durationMonths?: number;
    periodicVisitsQuota?: number;
    telehealthQuota?: number;
    videoQuotaPolicy?: 'FIXED' | 'UNLIMITED' | string;
    quotaPeriod?: 'PER_TERM' | 'MONTHLY' | string;
  };
  billingSnapshot?: {
    package?: { name?: string };
    pricing?: { totalPriceVnd?: number };
    renewalConfirmation?: {
      confirmedByUserId?: string;
      confirmedAt?: string;
      ipAddress?: string;
      termsHash?: string;
      caseType?: string;
    };
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

export interface PaymentActivationStateDto {
  activated: boolean;
  blockingReasons: string[];
}

export interface PaymentLatestTransactionDto {
  id: string;
  outcome: 'MATCHED' | 'REVIEW_REQUIRED' | 'IGNORED';
  reason: string | null;
  referenceCode: string | null;
  amountVnd?: number;
  receivedAt: string;
}

export interface PaymentRecheckActivationResultDto {
  contractId?: string;
  status?: 'PENDING' | 'PENDING_ACTIVATION' | 'ACTIVE' | 'CANCELLED';
  activated: boolean;
  blockingReasons: string[];
}

export interface ContractRenewalPreviewDto {
  sourceContractId: string;
  sourceContractNumber: string;
  sourceStatus: BackendContractStatus;
  eligible: boolean;
  suggestBuyNew: boolean;
  caseType: 'CASE_A' | 'CASE_B' | null;
  graceDays: number;
  graceEndsAt: string | null;
  expectedStartDate: string | null;
  expectedEndDate: string | null;
  paymentDeadlineAt: string | null;
  blockingReasons: Array<{ code: string; message: string }>;
  existingRenewal: {
    id: string;
    contractNumber: string;
    contractStatus: BackendContractStatus;
  } | null;
  package: {
    id: string;
    code: string;
    name: string;
    durationMonths: number;
    quotas: {
      homeVisits: number;
      videoConsultations: number;
    };
  } | null;
  doctor: {
    id: string;
    fullName: string;
  } | null;
  facility: {
    id: string;
    name: string;
  } | null;
  members: Array<{
    id: string;
    fullName: string;
    relationshipToRep: string;
  }>;
  pricing: {
    basePriceVnd: number;
    additionalMembersTotalVnd: number;
    totalPriceVnd: number;
    currency: string;
  } | null;
  termsHash: string | null;
}

export interface ConfirmContractRenewalResultDto {
  id: string;
  contractNumber: string;
  contractStatus: BackendContractStatus;
  holdExpiresAt?: string | null;
}

export interface VietQRPaymentRequestDto {
  id: string;
  contractId: string;
  familyId: string;
  addendumId?: string;
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
  activation?: PaymentActivationStateDto | null;
  latestTransaction?: PaymentLatestTransactionDto | null;
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
  hasHistoricalContracts?: boolean;
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
  facilityId?: string;
  doctorId?: string;
  patientIds?: string[];
  familyId?: string;
  memberCount?: number;
  videoConsultations?: number;
  extraHomeVisits?: number;
  additionalTerms?: string;
  homeVisitAddress?: string;
  /** ID hợp đồng nháp chưa thanh toán cần hủy nguyên tử trước khi tạo hợp đồng mới. */
  replaceContractId?: string;
  /** ID phiên gợi ý bác sĩ tự động (Track B) đã khớp thành công. */
  matchingSessionId?: string;
  /** ID yêu cầu hàng chờ điều phối Admin đã được phân công bác sĩ. */
  queueRequestId?: string;
}

export interface SignContractPayload {
  termsHash?: string;
  confirmationCode?: string;
}

export interface AssignDoctorPayload {
  doctorId: string;
}

// === HỢP ĐỒNG CUNG ỨNG NHÂN LỰC Y TẾ B2B ===
export type BackendB2bContractStatus =
  | 'PENDING_FACILITY_SIGNATURE'
  | 'REVISION_REQUESTED'
  | 'PENDING_ADMIN_SIGNATURE'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED';

export interface StaffingSigningSessionDto {
  contractId: string;
  contractCode: string;
  status: string;
  signerRole: 'HEALTHCARE_FACILITY' | 'ADMIN';
  alreadySigned: boolean;
  canSign: boolean;
  waitingReason?: string;
  signingToken: string | null;
  signingUrl: string | null;
  facilitySigned: boolean;
  adminSigned: boolean;
  signedPdfUrl: string | null;
  documensoItemId?: string | null;
  hasDocumensoPdf?: boolean;
}

export interface StaffingTerminationImpactDto {
  contractId: string;
  facilityId: string;
  status: BackendB2bContractStatus;
  activeMedicalContracts: number;
  pendingMedicalContracts: number;
  openEncounters: number;
  unsettledSettlements: number;
  unsettledPaidInvoices: number;
  activeOrOnboardingDoctors: number;
  openComplaints: number;
  hasBlockingDependencies: boolean;
  warnings: string[];
}

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
  rawStatus?: BackendB2bContractStatus;
  adminSigned: boolean;
  facilitySigned: boolean;
  facilitySignedAt?: string | null;
  adminSignedAt?: string | null;
  documensoEnvelopeId?: string | null;
  documensoItemId?: string | null;
  signedPdfUrl?: string | null;
  upgradedFromId?: string | null;
  holdExpiresAt?: string | null;
  upgradedFrom?: {
    id: string;
    contractNumber: string;
    contractStatus: BackendContractStatus;
    startDate: string;
    endDate: string;
  } | null;
  upgrades?: Array<{
    id: string;
    contractNumber: string;
    contractStatus: BackendContractStatus;
    startDate: string;
    endDate: string;
    holdExpiresAt?: string | null;
    createdAt: string;
  }>;
  contractTerms?: string;
  rejectionReason?: string;
  revisionReason?: string | null;
  terminationRequestStatus?: string | null;
  terminationRequestReason?: string | null;
  terminationRequestedAt?: string | null;
  terminatedReason?: string | null;
  terminatedAt?: string | null;
  platformLegal?: {
    companyName: string;
    taxCode: string;
    address: string;
    representative: string;
    supportContact: string;
  };
  facilitySummary?: {
    licenseNumber?: string;
    licenseIssuer?: string | null;
    licenseDate?: string | null;
    taxCode?: string | null;
    address?: string;
    hotline?: string;
  };
}

export function normalizeStaffingContract(item: any): StaffingContractItem {
  const contractNumber =
    item?.contractNumber ||
    item?.contractCode ||
    item?.contract_code ||
    (item?.id ? String(item.id) : '—');

  const statusRaw = item?.status as string | undefined;
  let normalizedStatus: 'DRAFT' | 'ACTIVE' | 'TERMINATED' = 'TERMINATED';
  if (statusRaw === 'ACTIVE') {
    normalizedStatus = 'ACTIVE';
  } else if (
    !statusRaw ||
    statusRaw === 'DRAFT' ||
    statusRaw === 'PENDING_SIGNATURE' ||
    statusRaw === 'PENDING_FACILITY_SIGNATURE' ||
    statusRaw === 'REVISION_REQUESTED' ||
    statusRaw === 'PENDING_ADMIN_SIGNATURE'
  ) {
    normalizedStatus = 'DRAFT';
  }

  const rawStatus: BackendB2bContractStatus = (
    statusRaw === 'PENDING_FACILITY_SIGNATURE' ||
    statusRaw === 'REVISION_REQUESTED' ||
    statusRaw === 'PENDING_ADMIN_SIGNATURE' ||
    statusRaw === 'ACTIVE' ||
    statusRaw === 'EXPIRED' ||
    statusRaw === 'TERMINATED'
      ? statusRaw
      : normalizedStatus === 'ACTIVE'
        ? 'ACTIVE'
        : normalizedStatus === 'TERMINATED'
          ? 'TERMINATED'
          : 'PENDING_FACILITY_SIGNATURE'
  ) as BackendB2bContractStatus;

  const facilitySigned = Boolean(
    item?.facilitySigned ??
      (Boolean(item?.facilitySignedAt) ||
        rawStatus === 'PENDING_ADMIN_SIGNATURE' ||
        normalizedStatus === 'ACTIVE')
  );
  const adminSigned = Boolean(
    item?.adminSigned ??
      (Boolean(item?.adminSignedAt) || normalizedStatus === 'ACTIVE')
  );
  const rawFacilityShare = Number(
    item?.facilitySharePercent ?? item?.facilityRevenueRate ?? 85
  );
  const facilitySharePercent = Number.isFinite(rawFacilityShare)
    ? rawFacilityShare
    : 85;
  const rawPlatformShare = Number(
    item?.platformSharePercent ?? item?.platformCommissionRate ?? 15
  );
  const platformSharePercent = Number.isFinite(rawPlatformShare)
    ? rawPlatformShare
    : 15;

  return {
    id: item.id,
    contractNumber,
    facilityId: item?.facilityId || item?.facility?.id,
    facilityName:
      item.facilityName ||
      item.facility?.facilityName ||
      item.facility?.name ||
      '—',
    platformSharePercent,
    facilitySharePercent,
    validFrom: item.validFrom || item.startDate || '',
    validTo: item.validTo || item.endDate || '',
    status: normalizedStatus,
    rawStatus,
    adminSigned,
    facilitySigned,
    facilitySignedAt: item?.facilitySignedAt ?? null,
    adminSignedAt: item?.adminSignedAt ?? null,
    documensoEnvelopeId: item?.documensoEnvelopeId ?? null,
    documensoItemId: item?.documensoItemId ?? null,
    signedPdfUrl: item?.signedPdfUrl ?? null,
    contractTerms: (() => {
      const raw = typeof item?.contractTerms === 'string' ? item.contractTerms.trim() : '';
      if (
        !raw ||
        raw.startsWith('HỢP ĐỒNG NGUYÊN TẮC CUNG ỨNG NGUỒN NHÂN LỰC Y TẾ B2B') ||
        raw.startsWith('HỢP ĐỒNG KHUNG CUNG ỨNG NHÂN LỰC Y TẾ B2B')
      ) {
        return '';
      }
      return raw;
    })(),
    rejectionReason: item?.rejectionReason ?? item?.revisionReason ?? undefined,
    revisionReason: item?.revisionReason ?? item?.rejectionReason ?? null,
    terminationRequestStatus: item?.terminationRequestStatus ?? null,
    terminationRequestReason: item?.terminationRequestReason ?? null,
    terminationRequestedAt: item?.terminationRequestedAt ?? null,
    terminatedReason: item?.terminatedReason ?? null,
    terminatedAt: item?.terminatedAt ?? null,
    platformLegal: item?.platformLegal ?? undefined,
    facilitySummary: item?.facility
      ? {
          licenseNumber: item.facility.licenseNumber,
          licenseIssuer: item.facility.licenseIssuer ?? null,
          licenseDate: item.facility.licenseDate ?? null,
          taxCode: item.facility.taxCode ?? null,
          address: item.facility.address,
          hotline: item.facility.hotline,
        }
      : undefined,
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
  } else if (
    dto.contractStatus === 'EXPIRED' ||
    dto.contractStatus === 'TERMINATED' ||
    dto.contractStatus === 'CANCELLED'
  ) {
    status = 'CANCELLED';
  } else if (dto.contractStatus === 'PENDING_PAYMENT') {
    status = 'PENDING_PAYMENT';
  } else if (dto.contractStatus === 'PENDING_ACTIVATION') {
    status = 'ACTIVE';
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
  const invoices = dto.invoices ?? [];
  // Tách tiền hợp đồng gốc với tiền phụ lục để không báo nhầm là đã thanh toán.
  const hasPaidContractInvoice = invoices.some(
    (inv) => !inv.addendumId && inv.paymentStatus === 'PAID',
  );
  const mappedAddenda = dto.addenda?.map((item) => ({
    id: item.id,
    addendumNumber: item.addendumNumber,
    addendumType: item.addendumType,
    additionalAmount: Number.isFinite(Number(item.additionalAmount))
      ? Number(item.additionalAmount)
      : 0,
    status: item.status,
    createdAt: item.createdAt,
    // Một bên ký nhiều bản thì trên giao diện vẫn chỉ tính là một bên.
    signedRoles: Array.from(
      new Set((item.signatures ?? []).map((sig) => sig.signerRole)),
    ),
    hasPaidInvoice: invoices.some(
      (inv) => inv.addendumId === item.id && inv.paymentStatus === 'PAID',
    ),
  }));

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
    doctorAvatarUrl: dto.doctor?.user?.avatarUrl ?? null,
    assignedDoctorId: dto.doctor?.id,
    assignedDoctorName: dto.doctor?.doctorName || dto.doctor?.user?.fullName,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    startDate: dto.startDate,
    endDate: dto.endDate,
    documensoEnvelopeId: dto.documensoEnvelopeId,
    upgradedFromId: dto.upgradedFromId ?? null,
    holdExpiresAt: dto.holdExpiresAt ?? null,
    rawContractStatus: dto.contractStatus,
    signatures: mappedSignatures,
    ...(mappedAddenda ? { addenda: mappedAddenda } : {}),
    hasPaidContractInvoice,
  };
}

export const contractsApi = {
  getMedicalContracts: async (params?: {
    all?: boolean;
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

    if (params?.all) {
      const all = await fetchPaginatedList<MedicalContractDetailDto | FourPartyContract>(
        '/api/v1/contracts/medical', queryParams,
      );
      return all.data.map(mapMedicalContractToFourParty);
    }

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

  getCareSummary: async (contractId: string): Promise<CareNeedsSummaryDto> => {
    const payload = await httpClient.get<unknown>(
      `/api/v1/contracts/medical/${contractId}/care-summary`
    );
    return unwrapEnvelope<CareNeedsSummaryDto>(payload);
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

  /** Xem trước bản nháp PDF stateless có watermark BẢN NHÁP. */
  previewFourPartyDraftPdf: async (payload: {
    packageId: string;
    doctorId?: string;
    facilityId?: string;
    memberCount: number;
    homeVisitAddress?: string;
    additionalTerms?: string;
  }): Promise<Blob> => {
    return httpClient.getBlob('/api/v1/contracts/four-party/preview-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  /** Đổi bác sĩ thay thế & bảo lưu 100% tiền tạm giữ (credit transfer). */
  replaceDoctorWithCredit: async (
    sourceContractId: string,
    doctorId: string
  ): Promise<{ id: string; contractNumber: string; creditSourceContractId?: string }> => {
    const response = await httpClient.post<unknown>(
      `/api/v1/contracts/four-party/${encodeURIComponent(sourceContractId)}/replace-doctor`,
      { doctorId }
    );
    return unwrapEnvelope(response);
  },

  /** Gửi yêu cầu hoàn tiền 100% về tài khoản ngân hàng thụ hưởng. */
  createRefundRequest: async (
    contractId: string,
    payload: { bankName: string; accountNumber: string; accountHolder: string }
  ): Promise<{
    id: string;
    refundCode: string;
    amountVnd: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: string;
  }> => {
    const response = await httpClient.post<unknown>(
      `/api/v1/contracts/four-party/${encodeURIComponent(contractId)}/refund-request`,
      payload
    );
    return unwrapEnvelope(response);
  },

  /** Lấy trạng thái yêu cầu hoàn tiền của hợp đồng. */
  getRefundRequest: async (
    contractId: string
  ): Promise<{
    id: string;
    refundCode: string;
    amountVnd: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: string;
    createdAt: string;
  }> => {
    const response = await httpClient.get<unknown>(
      `/api/v1/contracts/four-party/${encodeURIComponent(contractId)}/refund-request`
    );
    return unwrapEnvelope(response);
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

  createVietQRPayment: async (contractId: string, addendumId?: string): Promise<VietQRPaymentRequestDto> => {
    const response = await httpClient.post<unknown>('/api/v1/payments/requests', {
      contractId,
      ...(addendumId ? { addendumId } : {}),
    });
    return unwrapEnvelope<VietQRPaymentRequestDto>(response);
  },

  getPaymentStatus: async (paymentId: string): Promise<VietQRPaymentRequestDto> => {
    const response = await httpClient.get<unknown>(`/api/v1/payments/requests/${paymentId}`);
    return unwrapEnvelope<VietQRPaymentRequestDto>(response);
  },

  recheckPaymentActivation: async (
    paymentId: string
  ): Promise<PaymentRecheckActivationResultDto> => {
    const response = await httpClient.post<unknown>(
      `/api/v1/payments/requests/${paymentId}/recheck-activation`
    );
    return unwrapEnvelope<PaymentRecheckActivationResultDto>(response);
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

  // === HỢP ĐỒNG CUNG ỨNG NHÂN LỰC Y TẾ B2B ===
  getStaffingContracts: async (
    params?: {
      facilityId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
    options?: { throwOnError?: boolean }
  ): Promise<{ data: StaffingContractItem[]; total: number }> => {
    try {
      const normalizedParams =
        params && typeof params.limit === 'number'
          ? { ...params, limit: Math.min(Math.max(1, params.limit), 50) }
          : params;
        const result = await fetchPaginatedList('/api/v1/contracts/staffing', normalizedParams);
        return { data: result.data.map(normalizeStaffingContract), total: result.total };
    } catch (err) {
      if (options?.throwOnError) {
        throw err;
      }
      return { data: [], total: 0 };
    }
  },

  getStaffingContractById: async (
    id: string,
    options?: { throwOnError?: boolean }
  ): Promise<any> => {
    try {
      const res = await httpClient.get<any>(`/api/v1/contracts/staffing/${id}`);
      const unwrapped = unwrapEnvelope<any>(res);
      if (
        unwrapped &&
        typeof unwrapped === 'object' &&
        'data' in unwrapped &&
        unwrapped.data &&
        typeof unwrapped.data === 'object'
      ) {
        return unwrapped.data;
      }
      return unwrapped;
    } catch (err) {
      if (options?.throwOnError) {
        throw err;
      }
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

    if (payload?.facilityId?.trim()) {
      cleanPayload.facilityId = payload.facilityId.trim();
    }
    if ((payload as { contractTerms?: string })?.contractTerms?.trim()) {
      cleanPayload.contractTerms = (payload as { contractTerms?: string }).contractTerms!.trim();
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

  requestStaffingRevision: async (
    id: string,
    rejectionReason: string
  ): Promise<any> => {
    return httpClient.patch(`/api/v1/contracts/staffing/${id}/request-revision`, {
      rejectionReason,
    });
  },

  rejectStaffingContract: async (
    id: string,
    rejectionReason: string
  ): Promise<any> => {
    return httpClient.patch(`/api/v1/contracts/staffing/${id}/request-revision`, {
      rejectionReason,
    });
  },

  getStaffingSigningSession: async (id: string): Promise<StaffingSigningSessionDto> => {
    const res = await httpClient.get<unknown>(`/api/v1/contracts/staffing/${id}/signing-session`);
    return unwrapEnvelope<StaffingSigningSessionDto>(res);
  },

  syncStaffingDocumenso: async (
    id: string
  ): Promise<{
    synced: boolean;
    contractId: string;
    status: string;
    facilitySigned: boolean;
    adminSigned: boolean;
    signedPdfUrl: string | null;
  }> => {
    const res = await httpClient.post<unknown>(`/api/v1/contracts/staffing/${id}/sync-documenso`);
    return unwrapEnvelope(res);
  },

  fetchStaffingSignedPdfBlobUrl: async (id: string): Promise<string> => {
    const blob = await httpClient.getBlob(`/api/v1/contracts/staffing/${id}/signed-pdf`);
    return URL.createObjectURL(blob);
  },

  getStaffingTerminationImpact: async (
    id: string
  ): Promise<StaffingTerminationImpactDto> => {
    const res = await httpClient.get<unknown>(`/api/v1/contracts/staffing/${id}/termination-impact`);
    return unwrapEnvelope<StaffingTerminationImpactDto>(res);
  },

  requestStaffingTermination: async (
    id: string,
    reason: string
  ): Promise<unknown> => {
    return httpClient.post(`/api/v1/contracts/staffing/${id}/termination-request`, {
      reason,
    });
  },

  terminateStaffingContract: async (
    id: string,
    payload: { reason: string; force?: boolean; handoverNotes?: string }
  ): Promise<unknown> => {
    return httpClient.patch(`/api/v1/contracts/staffing/${id}/terminate`, payload);
  },

  updateMedicalContract: async (
    id: string,
    payload: UpdateMedicalContractPayload
  ): Promise<MedicalContractDetailDto> => {
    const response = await httpClient.patch<unknown>(
      `/api/v1/contracts/medical/${id}`,
      payload
    );
    return unwrapEnvelope<MedicalContractDetailDto>(response);
  },

  updateStaffingContract: async (
    id: string,
    payload: UpdateStaffingContractPayload
  ): Promise<unknown> => {
    const cleanBody: Record<string, string | number> = {};
    if (payload.facilitySharePercent !== undefined) {
      cleanBody.facilityRevenueRate = Number(payload.facilitySharePercent);
      cleanBody.platformCommissionRate = Number(
        payload.platformSharePercent ?? 100 - payload.facilitySharePercent
      );
    }
    if (payload.validFrom) cleanBody.startDate = payload.validFrom;
    if (payload.validTo) cleanBody.endDate = payload.validTo;
    if (payload.contractTerms !== undefined) cleanBody.contractTerms = payload.contractTerms;
    return httpClient.patch(`/api/v1/contracts/staffing/${id}`, cleanBody);
  },

  getRenewalPreview: async (id: string): Promise<ContractRenewalPreviewDto> => {
    const response = await httpClient.get<unknown>(
      `/api/v1/contracts/${id}/renewal-preview`,
    );
    return unwrapEnvelope<ContractRenewalPreviewDto>(response);
  },

  confirmRenewal: async (
    id: string,
    payload: {
      acceptedTerms: boolean;
      termsHash: string;
      videoConsultations?: number;
    },
  ): Promise<ConfirmContractRenewalResultDto> => {
    const response = await httpClient.post<unknown>(
      `/api/v1/contracts/${id}/renew`,
      payload,
    );
    return unwrapEnvelope<ConfirmContractRenewalResultDto>(response);
  },
};

export interface UpdateMedicalContractPayload {
  contractStatus?: BackendContractStatus;
  doctorId?: string | null;
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  memberCount?: number;
  additionalTerms?: string;
  adminNote?: string;
}

export interface UpdateStaffingContractPayload {
  status?: 'DRAFT' | 'ACTIVE' | 'TERMINATED';
  facilitySharePercent?: number;
  platformSharePercent?: number;
  validFrom?: string;
  validTo?: string;
  contractTerms?: string;
  rejectionReason?: string;
}
