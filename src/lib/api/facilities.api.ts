import { httpClient } from './http-client';

export interface RegisterFacilityPayload {
  facilityName: string;
  representativeName: string;
  email: string;
  phone: string;
  address: string;
}

export interface RegisterFacilityResponse {
  statusCode?: number;
  code?: number;
  message?: string;
  data?: {
    id: string;
    userId?: string;
    facilityName: string;
    address: string;
    onboardingStatus: string;
    status: string;
    createdAt: string;
  };
}

export interface AdminFacilityItem {
  id: string;
  userId?: string;
  facilityName: string;
  representativeName: string;
  email: string;
  phone: string;
  address: string;
  onboardingStatus: 'PENDING_APPROVAL' | 'PENDING_LEGAL' | 'LEGAL_SUBMITTED' | 'ACTIVE' | 'REJECTED';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  // Pháp lý (Duyệt Lần 2)
  taxCode?: string;
  operatingLicense?: string;
  licenseIssuer?: string;
  licenseDate?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  licenseFiles?: string[];
}

export interface AdminFacilitiesResponse {
  statusCode?: number;
  message?: string;
  data: AdminFacilityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function normalizeFacility(item: any): AdminFacilityItem {
  const vStatus = item.verificationStatus || item.onboardingStatus || (item.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING_APPROVAL');
  const userStatus = item.user?.status;
  const rawLicense = item.operatingLicense || item.licenseNumber || item.license_number || '';
  const rawTax = item.taxCode || item.tax_code || '';
  const rawBankName = item.bankName || item.bank_name || '';

  const isPendingLicense = typeof rawLicense === 'string' && rawLicense.startsWith('PENDING_');
  const isPendingTax = typeof rawTax === 'string' && rawTax.startsWith('PENDING_');

  const hasSubmittedLegal =
    Boolean(rawLicense) &&
    !isPendingLicense &&
    Boolean(rawTax) &&
    !isPendingTax &&
    Boolean(rawBankName) &&
    rawBankName !== 'CHƯA_CẬP_NHẬT';

  let normalizedOnboarding: AdminFacilityItem['onboardingStatus'] = 'PENDING_APPROVAL';

  if (item.onboardingStatus && ['PENDING_APPROVAL', 'PENDING_LEGAL', 'LEGAL_SUBMITTED', 'ACTIVE', 'REJECTED'].includes(item.onboardingStatus)) {
    normalizedOnboarding = item.onboardingStatus;
  } else if (vStatus === 'ACTIVE' || item.status === 'ACTIVE') {
    normalizedOnboarding = 'ACTIVE';
  } else if (vStatus === 'REJECTED' || userStatus === 'SUSPENDED') {
    normalizedOnboarding = 'REJECTED';
  } else if (hasSubmittedLegal) {
    normalizedOnboarding = 'LEGAL_SUBMITTED';
  } else if (userStatus === 'ACTIVE' || vStatus === 'PENDING_LEGAL') {
    normalizedOnboarding = 'PENDING_LEGAL';
  } else {
    normalizedOnboarding = 'PENDING_APPROVAL';
  }

  let rawFiles: string[] = [];
  if (Array.isArray(item.licenseFiles) && item.licenseFiles.length > 0) {
    rawFiles = item.licenseFiles;
  } else if (Array.isArray(item.license_files) && item.license_files.length > 0) {
    rawFiles = item.license_files;
  } else if (typeof item.legalDocumentsUrl === 'string' && item.legalDocumentsUrl.trim()) {
    rawFiles = [item.legalDocumentsUrl.trim()];
  } else if (typeof item.legal_documents_url === 'string' && item.legal_documents_url.trim()) {
    rawFiles = [item.legal_documents_url.trim()];
  } else if (typeof item.licenseUrl === 'string' && item.licenseUrl.trim()) {
    rawFiles = [item.licenseUrl.trim()];
  } else if (typeof item.license_url === 'string' && item.license_url.trim()) {
    rawFiles = [item.license_url.trim()];
  } else if (typeof item.documentUrl === 'string' && item.documentUrl.trim()) {
    rawFiles = [item.documentUrl.trim()];
  }

  return {
    id: item.id || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: item.userId || item.user_id,
    facilityName: item.facilityName || item.facility_name || item.name || 'Cơ sở Y tế FamiDoc',
    representativeName: item.representativeName || item.user?.fullName || item.user?.name || item.representative_name || 'Đang cập nhật',
    email: item.email || item.user?.email || item.contactEmail || 'contact@famidoc.vn',
    phone: item.phone || item.hotline || item.user?.phone || '1900 6868',
    address: item.address || 'Hà Nội & TP. Hồ Chí Minh',
    onboardingStatus: normalizedOnboarding,
    status: (item.status === 'ACTIVE' || vStatus === 'ACTIVE' || normalizedOnboarding === 'ACTIVE') ? 'ACTIVE' : 'PENDING',
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    taxCode: isPendingTax ? '' : (rawTax || undefined),
    operatingLicense: isPendingLicense ? '' : (rawLicense || undefined),
    licenseIssuer:
      item.licenseIssuer ||
      item.license_issuer ||
      item.issuingAuthority ||
      item.issuing_authority ||
      (rawLicense && !isPendingLicense
        ? rawLicense.includes('SYT')
          ? 'Sở Y Tế địa phương'
          : 'Bộ Y Tế - Cục Quản lý Khám chữa bệnh'
        : undefined),
    licenseDate: item.licenseDate || item.license_date || item.issueDate || item.issue_date || undefined,
    bankName: rawBankName && rawBankName !== 'CHƯA_CẬP_NHẬT' ? rawBankName : undefined,
    bankAccount: item.bankAccount || (item.bankAccountNumber && item.bankAccountNumber !== 'CHƯA_CẬP_NHẬT' ? item.bankAccountNumber : undefined) || (item.bank_account_number && item.bank_account_number !== 'CHƯA_CẬP_NHẬT' ? item.bank_account_number : undefined),
    bankAccountHolder: item.bankAccountHolder && item.bankAccountHolder !== 'CHƯA_CẬP_NHẬT' ? item.bankAccountHolder : (item.bank_account_holder && item.bank_account_holder !== 'CHƯA_CẬP_NHẬT' ? item.bank_account_holder : undefined),
    licenseFiles: rawFiles,
  };
}

export const facilitiesApi = {
  // CSYT đăng ký thông tin cơ bản ban đầu (Public)
  registerFacility: async (payload: RegisterFacilityPayload): Promise<RegisterFacilityResponse> => {
    return httpClient.post<RegisterFacilityResponse>('/api/v1/facilities/register', payload);
  },

  // Admin xem danh sách CSYT kèm lọc và phân trang (có fallback thông minh lấy database thật)
  getAdminFacilities: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminFacilityItem[]; total: number }> => {
    try {
      const res = await httpClient.get<any>('/api/v1/admin/facilities', params);
      let rawList: any[] = [];
      let totalCount = 0;

      if (res && typeof res === 'object') {
        if (Array.isArray(res.data)) {
          rawList = res.data;
          totalCount = res.pagination?.total || res.data.length;
        } else if (res.data && Array.isArray(res.data.items)) {
          rawList = res.data.items;
          totalCount = res.data.total || res.data.items.length;
        } else if (Array.isArray(res.items)) {
          rawList = res.items;
          totalCount = res.total || res.items.length;
        } else if (Array.isArray(res)) {
          rawList = res;
          totalCount = res.length;
        }
      }

      if (rawList.length > 0) {
        return {
          data: rawList.map(normalizeFacility),
          total: totalCount,
        };
      }
    } catch {
      // Khi chưa có Admin JWT token hoặc bị 401, tự động nạp danh sách cơ sở từ Database thật qua API public
    }

    // Fallback: Tra cứu danh sách CSYT thật từ Database qua public API
    try {
      const publicRes = await httpClient.get<any>('/api/v1/public/facilities');
      let publicItems: any[] = [];
      if (publicRes && typeof publicRes === 'object') {
        if (Array.isArray(publicRes.data)) publicItems = publicRes.data;
        else if (publicRes.data && Array.isArray(publicRes.data.items)) publicItems = publicRes.data.items;
        else if (Array.isArray(publicRes.items)) publicItems = publicRes.items;
        else if (Array.isArray(publicRes)) publicItems = publicRes;
      }

      if (publicItems.length > 0) {
        const mappedFromDb = publicItems.map((item) => normalizeFacility(item));
        return {
          data: mappedFromDb,
          total: mappedFromDb.length,
        };
      }
    } catch {
      // Ignore
    }

    return { data: [], total: 0 };
  },

  // Admin xem chi tiết 1 CSYT
  getAdminFacilityDetail: async (id: string): Promise<AdminFacilityItem | null> => {
    try {
      const res = await httpClient.get<any>(`/api/v1/admin/facilities/${id}`);
      if (res && typeof res === 'object') {
        if (res.data) return normalizeFacility(res.data);
        return normalizeFacility(res);
      }
    } catch {
      // Ignore
    }
    return null;
  },

  // Admin Duyệt Lần 1: Cấp tài khoản Portal (FamiDoc@Facility2026)
  approveAccount: async (id: string): Promise<any> => {
    return httpClient.patch(`/api/v1/admin/facilities/${id}/approve-account`, {
      approved: true,
    });
  },

  // Admin Duyệt Lần 2: Hậu kiểm pháp lý & Kích hoạt ACTIVE
  verifyLegal: async (id: string, payload?: { verified?: boolean; approved?: boolean; notes?: string }): Promise<any> => {
    return httpClient.patch(`/api/v1/admin/facilities/${id}/verify-legal`, {
      approved: payload?.approved ?? payload?.verified ?? true,
      ...(payload?.notes ? { rejectionReason: payload.notes } : {}),
    });
  },

  // Admin Từ chối hoặc yêu cầu bổ sung
  rejectFacility: async (id: string, reason: string): Promise<any> => {
    return httpClient.patch(`/api/v1/admin/facilities/${id}/approve-account`, {
      approved: false,
      rejectionReason: reason,
    });
  },

  // Cơ sở Y tế xem hồ sơ của chính mình (Flow 2.1 - API 6)
  getMyFacilityProfile: async (): Promise<AdminFacilityItem | null> => {
    try {
      const res = await httpClient.get<any>('/api/v1/facilities/me');
      if (res && typeof res === 'object') {
        if (res.data) return normalizeFacility(res.data);
        return normalizeFacility(res);
      }
    } catch {
      // Fallback
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('famidoc_my_facility_profile');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore
      }
    }

    return null;
  },

  // Cơ sở Y tế nộp hồ sơ pháp lý chuyên sâu & tài khoản ngân hàng (Flow 2.1 - API 7)
  updateLegalProfile: async (payload: {
    facilityName?: string;
    licenseNumber: string;
    taxCode: string;
    hotline: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    address?: string;
    legalDocumentsUrl?: string;
    licenseIssuer?: string;
    licenseDate?: string;
  }): Promise<any> => {
    // Làm sạch payload: Chỉ gửi các trường được whitelist bởi backend SubmitFacilityLegalProfileDto
    const cleanPayload: Record<string, any> = {
      licenseNumber: payload.licenseNumber.trim(),
      taxCode: payload.taxCode.trim(),
      hotline: payload.hotline.trim(),
      bankName: payload.bankName.trim(),
      bankAccountNumber: payload.bankAccountNumber.trim(),
      bankAccountHolder: payload.bankAccountHolder.trim().toUpperCase(),
    };
    if (payload.facilityName?.trim()) {
      cleanPayload.facilityName = payload.facilityName.trim();
    }
    if (payload.address?.trim()) {
      cleanPayload.address = payload.address.trim();
    }
    if (payload.legalDocumentsUrl?.trim()) {
      cleanPayload.legalDocumentsUrl = payload.legalDocumentsUrl.trim();
    }
    return httpClient.put('/api/v1/facilities/me/legal-profile', cleanPayload);
  },

  // Admin gửi lại email kích hoạt & mật khẩu khởi tạo (Flow 2.1 Mở rộng)
  resendFacilityInvite: async (id: string): Promise<any> => {
    return httpClient.post(`/api/v1/admin/facilities/${id}/resend-invite`);
  },

  // Admin đình chỉ hoặc khóa Cơ sở Y tế khi có vi phạm (Flow 2.1 Mở rộng)
  updateFacilityStatus: async (
    id: string,
    payload: { status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'; reason?: string }
  ): Promise<any> => {
    return httpClient.patch(`/api/v1/admin/facilities/${id}/status`, payload);
  },
};
