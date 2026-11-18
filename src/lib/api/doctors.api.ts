import { httpClient } from './http-client';
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
}

export interface DoctorProfileDto {
  id: string;
  userId?: string;
  doctorName: string;
  specialty: string;
  academicTitle?: string;
  experienceYears: number;
  clinicalTier?: DoctorClinicalTier;
  activePanelCount?: number;
  maxPanelCapacity?: number;
  activeAndHeldCount?: number;
  remainingSlots?: number;
  isQuotaFull?: boolean;
  ratingAvg?: number;
  totalReviews?: number;
  onboardingStatus: 'PENDING_SUBMISSION' | 'FACILITY_VERIFIED' | 'ACTIVE' | 'SUSPENDED' | string;
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

export interface SubmitCredentialsPayload {
  cchnNumber?: string;
  scopeOfPractice?: string;
  issuedBy?: string;
  issuedDate?: string;
  certificateFiles?: string[];
  credentials?: DoctorCredentialDto[];
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
    let credentialsArray: any[] = [];
    if (Array.isArray(payload.credentials) && payload.credentials.length > 0) {
      credentialsArray = payload.credentials;
    } else {
      const rawDate = payload.issuedDate || new Date().toISOString().split('T')[0];
      const parsedDate = new Date(rawDate);
      const validDateStr = isNaN(parsedDate.getTime())
        ? new Date().toISOString().split('T')[0]
        : parsedDate.toISOString().split('T')[0];

      const fileUrl =
        payload.certificateFiles && payload.certificateFiles.length > 0
          ? payload.certificateFiles[0]
          : 'https://storage.famidoc.vn/doctors/credentials/cchn.pdf';

      credentialsArray = [
        {
          credentialType: 'PRACTICE_LICENSE_CCHN',
          certificateNumber: payload.cchnNumber || '',
          issueDate: validDateStr,
          issuingAuthority: payload.issuedBy || '',
          fileUrl: fileUrl.startsWith('http') ? fileUrl : `https://storage.famidoc.vn/doctors/credentials/${fileUrl}`,
        },
      ];
    }
    const res: any = await httpClient.put('/api/v1/doctors/me/credentials', { credentials: credentialsArray });
    if (res && typeof res === 'object' && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
      return res.data;
    }
    return res;
  },

  facilityApproveCredentials: async (
    doctorId: string,
    payload: FacilityApprovePayload
  ): Promise<any> => {
    const approved = payload.approved !== undefined ? Boolean(payload.approved) : Boolean(payload.isApproved);
    const notes = payload.verificationNotes || payload.notes || 'Cơ sở y tế đã thẩm định hồ sơ chuyên môn.';
    const res: any = await httpClient.patch(`/api/v1/doctors/${doctorId}/credentials/facility-approve`, {
      approved,
      verificationNotes: notes,
      ...(payload.rejectionReason ? { rejectionReason: payload.rejectionReason } : {}),
    });
    if (res && typeof res === 'object' && res.data && typeof res.data === 'object') return res.data;
    return res;
  },

  platformApproveCredentials: async (
    doctorId: string,
    payload: PlatformApprovePayload
  ): Promise<any> => {
    const approved = payload.approved !== undefined ? Boolean(payload.approved) : Boolean(payload.isApproved);
    const res: any = await httpClient.patch(`/api/v1/doctors/${doctorId}/credentials/platform-approve`, {
      approved,
      backgroundCheckConsent: payload.backgroundCheckConsent ?? true,
      ...(payload.rejectionReason ? { rejectionReason: payload.rejectionReason } : {}),
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

    const cleanPayload = {
      doctorName: targetPayload.doctorName || targetPayload.fullName || 'Bác sĩ',
      email: targetPayload.email,
      phone: targetPayload.phone,
      specialty: targetPayload.specialty || 'Y học gia đình',
      experienceYears: Number(targetPayload.experienceYears ?? 3),
      academicTitle: targetPayload.academicTitle || 'BS.CKI',
    };

    const isUUID = targetFacilityId && /^[0-9a-fA-F-]{36}$/.test(targetFacilityId);
    const endpoint = isUUID ? `/api/v1/facilities/${targetFacilityId}/doctors` : '/api/v1/facilities/doctors';

    return httpClient.post(endpoint, cleanPayload);
  },

  getFacilityDoctors: async (facilityId?: string, params?: any): Promise<any[]> => {
    const isUUID = facilityId && /^[0-9a-fA-F-]{36}$/.test(facilityId);
    const endpoint = isUUID ? `/api/v1/facilities/${facilityId}/doctors` : '/api/v1/facilities/doctors';
    try {
      const res: any = await httpClient.get<any>(endpoint, params);
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data?.items)) return res.data.items;
      if (Array.isArray(res?.items)) return res.items;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    } catch (err) {
      console.error('Lỗi khi tải danh sách Bác sĩ trực thuộc từ Backend:', err);
      throw err;
    }
  },

  getAdminDoctors: async (params?: any): Promise<any[]> => {
    try {
      const res: any = await httpClient.get<any>('/api/v1/doctors', params);
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data?.items)) return res.data.items;
      if (Array.isArray(res?.items)) return res.items;
      if (Array.isArray(res?.data)) return res.data;
      return [];
    } catch (err) {
      console.warn('Lỗi khi tải danh sách Bác sĩ từ Admin API:', err);
      return [];
    }
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

  // CSYT gửi lại email thông tin tài khoản và mật khẩu khởi tạo cho bác sĩ
  resendDoctorInvite: async (doctorId: string): Promise<any> => {
    return httpClient.post(`/api/v1/facilities/doctors/${doctorId}/resend-invite`);
  },

  // CSYT cập nhật trạng thái làm việc / tạm hoãn / đình chỉ bác sĩ
  updateDoctorStatus: async (
    doctorId: string,
    payload: { status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED'; reason?: string }
  ): Promise<any> => {
    return httpClient.patch(`/api/v1/facilities/doctors/${doctorId}/status`, payload);
  },

  // CSYT hủy liên kết bác sĩ khi chuyển viện / thôi việc
  unlinkDoctor: async (doctorId: string): Promise<any> => {
    return httpClient.delete(`/api/v1/facilities/doctors/${doctorId}`);
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
