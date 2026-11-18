import { httpClient } from './http-client';
import { fetchPaginatedList } from './paginated-list';
import { unwrapApiEnvelope } from './envelope';
import type { DoctorClinicalTier } from './public.api';

export interface DoctorQuotaProposalDto {
  id: string;
  doctorId: string;
  facilityId: string;
  currentMaxPanel: number;
  requestedMaxPanel: number;
  activeAndHeldCount?: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  doctor?: {
    id: string;
    doctorName: string;
    specialty?: string;
    clinicalTier?: DoctorClinicalTier;
    maxPanelCapacity?: number;
    activePanelCount?: number;
  };
  facility?: {
    id: string;
    facilityName: string;
  };
}

export interface DoctorCredentialDto {
  id?: string;
  credentialType: 'PRACTICE_LICENSE_CCHN' | 'FAMILY_MEDICINE_CERT' | 'DEGREE';
  certificateNumber: string;
  issueDate: string;
  issuingAuthority: string;
  fileUrl: string;
  facilityVerified?: boolean;
  platformApproved?: boolean;
  rejectionReason?: string | null;
}

export interface DoctorProfileDto {
  id: string;
  userId?: string;
  doctorName: string;
  email?: string;
  phone?: string;
  specialty: string;
  academicTitle?: string | null;
  experienceYears: number;
  clinicalTier?: DoctorClinicalTier;
  bio?: string | null;
  activePanelCount?: number;
  maxPanelCapacity?: number;
  activeAndHeldCount?: number;
  remainingSlots?: number;
  isQuotaFull?: boolean;
  ratingAvg?: number;
  totalReviews?: number;
  onboardingStatus:
    | 'PENDING_SUBMISSION'
    | 'PENDING_FACILITY_REVIEW'
    | 'FACILITY_VERIFIED'
    | 'ACTIVE'
    | 'SUSPENDED'
    | string;
  rejectionReason?: string | null;
  credentialsSubmittedAt?: string | null;
  facilityId: string;
  facilityName?: string;
  facility?: {
    id: string;
    facilityName: string;
    address?: string;
    hotline?: string;
  };
  credentials?: DoctorCredentialDto[];
}

export interface SubmitDoctorCredentialItemPayload {
  credentialType: 'PRACTICE_LICENSE_CCHN' | 'DEGREE' | 'FAMILY_MEDICINE_CERT';
  certificateNumber: string;
  issueDate: string;
  issuingAuthority: string;
}

export interface SubmitCredentialsPayload {
  academicTitle?: string;
  specialty?: string;
  experienceYears?: number;
  bio?: string;
  credentials?: SubmitDoctorCredentialItemPayload[];
  cchnFile?: File | null;
  degreeFile?: File | null;
  familyMedicineFile?: File | null;
}

export interface FacilityApprovePayload {
  approved?: boolean;
  isApproved?: boolean;
  notes?: string;
  verificationNotes?: string;
  rejectionReason?: string;
}

export interface PlatformApprovePayload {
  approved?: boolean;
  isApproved?: boolean;
  notes?: string;
  rejectionReason?: string;
  backgroundCheckConsent?: boolean;
}

export interface CreateFacilityDoctorPayload {
  doctorName?: string;
  fullName?: string;
  email: string;
  phone: string;
  specialty?: string;
  experienceYears?: number;
  academicTitle?: string;
  bio?: string;
}

export interface BulkDoctorNormalizedRowDto {
  rowNumber: number;
  doctorName: string;
  email: string;
  phone: string;
  specialty: string;
  academicTitle?: string;
  experienceYears: number;
  bio?: string;
}

export interface BulkDoctorExistingRowDto {
  rowNumber: number;
  doctorName: string;
  email: string;
  phone: string;
  existingDoctorId: string;
  existingDoctorName: string;
  existingOnboardingStatus: string;
  reason: string;
}

export interface BulkDoctorInvalidRowDto {
  rowNumber: number;
  raw: {
    doctorName?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    academicTitle?: string;
    experienceYears?: string | number;
    bio?: string;
  };
  errors: string[];
}

export interface BulkImportDoctorsPreviewResponse {
  summary: {
    totalReadRows: number;
    validCount: number;
    existingSkippedCount: number;
    invalidCount: number;
    maxReadRows: number;
    maxConfirmBatch: number;
  };
  validRows: BulkDoctorNormalizedRowDto[];
  existingRows: BulkDoctorExistingRowDto[];
  invalidRows: BulkDoctorInvalidRowDto[];
}

export interface ConfirmBulkDoctorItemPayload {
  rowNumber?: number;
  doctorName: string;
  email: string;
  phone: string;
  specialty?: string;
  academicTitle?: string;
  experienceYears?: number;
  bio?: string;
}

export interface ConfirmBulkImportDoctorsResponse {
  summary: {
    requestedCount: number;
    createdCount: number;
    failedCount: number;
    mailSentCount: number;
    mailFailedCount: number;
  };
  createdDoctors: Array<{
    rowNumber?: number;
    doctor: DoctorProfileDto;
    mailSent: boolean;
    mailWarning?: string;
  }>;
  failedRows: Array<{
    rowNumber?: number;
    doctorName: string;
    email: string;
    phone: string;
    reason: string;
  }>;
}

export const doctorsApi = {
  getDoctorMe: async (): Promise<DoctorProfileDto> => {
    const res: any = await httpClient.get<any>('/api/v1/doctors/me');
    if (res && typeof res === 'object') {
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        return res.data as DoctorProfileDto;
      }
      return res as DoctorProfileDto;
    }
    return res;
  },

  submitMyCredentials: async (payload: SubmitCredentialsPayload): Promise<any> => {
    const formData = new FormData();
    if (payload.academicTitle !== undefined && payload.academicTitle.trim()) {
      formData.append('academicTitle', payload.academicTitle.trim());
    }
    if (payload.specialty !== undefined && payload.specialty.trim()) {
      formData.append('specialty', payload.specialty.trim());
    }
    if (payload.experienceYears !== undefined && !Number.isNaN(Number(payload.experienceYears))) {
      formData.append('experienceYears', String(Math.max(0, Number(payload.experienceYears))));
    }
    if (payload.bio !== undefined && payload.bio.trim()) {
      formData.append('bio', payload.bio.trim());
    }

    const credentialsArray = Array.isArray(payload.credentials) ? payload.credentials : [];
    formData.append('credentials', JSON.stringify(credentialsArray));

    if (payload.cchnFile) {
      formData.append('cchnFile', payload.cchnFile);
    }
    if (payload.degreeFile) {
      formData.append('degreeFile', payload.degreeFile);
    }
    if (payload.familyMedicineFile) {
      formData.append('familyMedicineFile', payload.familyMedicineFile);
    }

    const res: any = await httpClient.upload('/api/v1/doctors/me/credentials', formData, 'PUT');
    if (res && typeof res === 'object' && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      return res.data;
    }
    return res;
  },

  fetchCredentialFileBlobUrl: async (doctorId: string | 'me', credentialId: string): Promise<string> => {
    const endpoint =
      doctorId === 'me'
        ? `/api/v1/doctors/me/credentials/${credentialId}/file`
        : `/api/v1/doctors/${doctorId}/credentials/${credentialId}/file`;
    const blob = await httpClient.getBlob(endpoint);
    return URL.createObjectURL(blob);
  },

  facilityApproveCredentials: async (
    doctorId: string,
    payload: FacilityApprovePayload
  ): Promise<any> => {
    const approved = payload.approved !== undefined ? Boolean(payload.approved) : Boolean(payload.isApproved);
    const notes = payload.verificationNotes || payload.notes;
    const body: Record<string, unknown> = { approved };
    if (notes?.trim()) {
      body.verificationNotes = notes.trim();
    } else if (approved) {
      body.verificationNotes = 'Cơ sở y tế đã thẩm định hồ sơ chuyên môn.';
    }
    if (payload.rejectionReason?.trim()) {
      body.rejectionReason = payload.rejectionReason.trim();
    }
    const res: any = await httpClient.patch(`/api/v1/doctors/${doctorId}/credentials/facility-approve`, body);
    if (res && typeof res === 'object' && res.data && typeof res.data === 'object') return res.data;
    return res;
  },

  platformApproveCredentials: async (
    doctorId: string,
    payload: PlatformApprovePayload
  ): Promise<DoctorProfileDto> => {
    const approved = payload.approved !== undefined ? Boolean(payload.approved) : Boolean(payload.isApproved);
    const res: any = await httpClient.patch(`/api/v1/doctors/${doctorId}/credentials/platform-approve`, {
      approved,
      ...(payload.backgroundCheckConsent === undefined ? {} : { backgroundCheckConsent: payload.backgroundCheckConsent }),
      ...(payload.rejectionReason?.trim() ? { rejectionReason: payload.rejectionReason.trim() } : {}),
    });
    if (res && typeof res === 'object' && res.data && typeof res.data === 'object') return res.data;
    return res;
  },

  createFacilityDoctor: (facilityIdOrPayload: string | CreateFacilityDoctorPayload, maybePayload?: CreateFacilityDoctorPayload): Promise<any> => {
    let targetPayload: CreateFacilityDoctorPayload;
    let targetFacilityId: string | undefined;

    if (typeof facilityIdOrPayload === 'string') {
      targetFacilityId = facilityIdOrPayload;
      targetPayload = maybePayload || ({} as any);
    } else {
      targetPayload = facilityIdOrPayload;
      targetFacilityId = undefined;
    }

    const cleanPayload: Record<string, unknown> = {
      doctorName: targetPayload.doctorName || targetPayload.fullName || 'Bác sĩ',
      email: targetPayload.email,
      phone: targetPayload.phone,
      specialty: targetPayload.specialty || 'Y học gia đình',
    };
    if (targetPayload.academicTitle?.trim()) {
      cleanPayload.academicTitle = targetPayload.academicTitle.trim();
    }
    if (targetPayload.experienceYears !== undefined && !Number.isNaN(Number(targetPayload.experienceYears))) {
      cleanPayload.experienceYears = Math.max(0, Number(targetPayload.experienceYears));
    }
    if (targetPayload.bio?.trim()) {
      cleanPayload.bio = targetPayload.bio.trim();
    }

    const isUUID = targetFacilityId && /^[0-9a-fA-F-]{36}$/.test(targetFacilityId);
    const endpoint = isUUID ? `/api/v1/facilities/${targetFacilityId}/doctors` : '/api/v1/facilities/doctors';

    return httpClient.post(endpoint, cleanPayload);
  },

  downloadDoctorImportTemplate: async (): Promise<Blob> => {
    return httpClient.getBlob('/api/v1/facilities/doctors/import/template');
  },

  previewDoctorsExcelImport: async (
    file: File
  ): Promise<BulkImportDoctorsPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await httpClient.upload<unknown>(
      '/api/v1/facilities/doctors/import/preview',
      formData,
      'POST'
    );
    return unwrapApiEnvelope<BulkImportDoctorsPreviewResponse>(res);
  },

  confirmDoctorsBulkImport: async (
    doctors: ConfirmBulkDoctorItemPayload[]
  ): Promise<ConfirmBulkImportDoctorsResponse> => {
    const res = await httpClient.post<unknown>(
      '/api/v1/facilities/doctors/import/confirm',
      { doctors }
    );
    return unwrapApiEnvelope<ConfirmBulkImportDoctorsResponse>(res);
  },

  getFacilityDoctors: async (facilityId?: string, params?: any): Promise<any[]> => {
    const isUUID = facilityId && /^[0-9a-fA-F-]{36}$/.test(facilityId);
    const endpoint = isUUID ? `/api/v1/facilities/${facilityId}/doctors` : '/api/v1/facilities/doctors';
    try {
      return (await fetchPaginatedList<DoctorProfileDto>(endpoint, params)).data;
    } catch (err) {
      console.error('Lỗi khi tải danh sách Bác sĩ trực thuộc từ Backend:', err);
      throw err;
    }
  },

  getAdminDoctors: async (params?: any): Promise<any[]> => {
    return (await fetchPaginatedList<DoctorProfileDto>('/api/v1/doctors', params)).data;
  },

  getDoctorById: async (id: string): Promise<DoctorProfileDto | null> => {
    try {
      const res: any = await httpClient.get<any>(`/api/v1/doctors/${id}`);
      if (res && typeof res === 'object') {
        if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
          return res.data as DoctorProfileDto;
        }
        return res as DoctorProfileDto;
      }
    } catch {
      // Fallback
    }
    return null;
  },

  createQuotaProposal: async (
    doctorId: string,
    payload: { requestedMaxPanel: number; reason: string }
  ): Promise<DoctorQuotaProposalDto> => {
    const res = await httpClient.post<unknown>(
      `/api/v1/facilities/doctors/${encodeURIComponent(doctorId)}/quota-proposals`,
      payload
    );
    return unwrapApiEnvelope<DoctorQuotaProposalDto>(res);
  },

  getDoctorQuotaProposals: async (
    doctorId: string
  ): Promise<DoctorQuotaProposalDto[]> => {
    const res = await httpClient.get<unknown>(
      `/api/v1/facilities/doctors/${encodeURIComponent(doctorId)}/quota-proposals`
    );
    const unwrapped = unwrapApiEnvelope<{ items?: DoctorQuotaProposalDto[] } | DoctorQuotaProposalDto[]>(res);
    return Array.isArray(unwrapped) ? unwrapped : unwrapped?.items ?? [];
  },

  getFacilityQuotaProposals: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DoctorQuotaProposalDto[]> => {
    const res = await httpClient.get<unknown>('/api/v1/facilities/quota-proposals', params);
    const unwrapped = unwrapApiEnvelope<{ items?: DoctorQuotaProposalDto[] } | DoctorQuotaProposalDto[]>(res);
    return Array.isArray(unwrapped) ? unwrapped : unwrapped?.items ?? [];
  },

  getAdminQuotaProposals: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: DoctorQuotaProposalDto[]; total: number }> => {
    const res = await httpClient.get<unknown>('/api/v1/admin/quota-proposals', params);
    const unwrapped = unwrapApiEnvelope<{
      items?: DoctorQuotaProposalDto[];
      total?: number;
    }>(res);
    return {
      items: unwrapped?.items ?? [],
      total: unwrapped?.total ?? 0,
    };
  },

  reviewQuotaProposal: async (
    proposalId: string,
    payload: { action: 'APPROVE' | 'REJECT'; reviewNote?: string }
  ): Promise<DoctorQuotaProposalDto> => {
    const res = await httpClient.patch<unknown>(
      `/api/v1/admin/quota-proposals/${encodeURIComponent(proposalId)}`,
      payload
    );
    return unwrapApiEnvelope<DoctorQuotaProposalDto>(res);
  },
};
