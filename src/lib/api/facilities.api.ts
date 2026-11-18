import { httpClient } from './http-client';

export interface CreateFacilityByAdminPayload {
  facilityName: string;
  representativeName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface AdminFacilityItem {
  id: string;
  userId?: string;
  facilityName: string;
  representativeName: string;
  email: string;
  phone: string;
  address: string;
  verificationStatus?: 'PENDING' | 'ACTIVE' | 'REJECTED';
  onboardingStatus: 'PENDING_LEGAL' | 'LEGAL_SUBMITTED' | 'ACTIVE' | 'REJECTED';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  taxCode?: string;
  operatingLicense?: string;
  licenseIssuer?: string;
  licenseDate?: string;
  legalRejectionReason?: string | null;
  hasLegalDocument?: boolean;
  hasOperatingLicense?: boolean;
  hasBusinessLicense?: boolean;
  hasActiveStaffingContract?: boolean;
  hasHistoricalStaffingContract?: boolean;
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
  const vStatus = (item.verificationStatus || (item.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING')) as
    | 'PENDING'
    | 'ACTIVE'
    | 'REJECTED';
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

  const legalRejectionReason: string | null = item.legalRejectionReason ?? null;

  let normalizedOnboarding: AdminFacilityItem['onboardingStatus'] = 'PENDING_LEGAL';
  if (vStatus === 'ACTIVE' || item.status === 'ACTIVE') {
    normalizedOnboarding = 'ACTIVE';
  } else if (vStatus === 'REJECTED' || userStatus === 'SUSPENDED' || Boolean(legalRejectionReason)) {
    normalizedOnboarding = 'REJECTED';
  } else if (hasSubmittedLegal) {
    normalizedOnboarding = 'LEGAL_SUBMITTED';
  } else {
    normalizedOnboarding = 'PENDING_LEGAL';
  }

  const hasOperatingLicense = Boolean(
    item.hasOperatingLicense ?? (item.hasLegalDocument || item.legalDocumentKey),
  );
  const hasBusinessLicense = Boolean(
    item.hasBusinessLicense || item.businessLicenseKey,
  );
  const hasLegalDocument = hasOperatingLicense;
  let rawFiles: string[] = [];
  if (Array.isArray(item.licenseFiles) && item.licenseFiles.length > 0) {
    rawFiles = item.licenseFiles;
  } else if (Array.isArray(item.license_files) && item.license_files.length > 0) {
    rawFiles = item.license_files;
  } else if (hasOperatingLicense && item.id) {
    rawFiles = [`/api/v1/facilities/${item.id}/legal-document?type=operating`];
    if (hasBusinessLicense) {
      rawFiles.push(`/api/v1/facilities/${item.id}/legal-document?type=business`);
    }
  } else if (typeof item.legalDocumentsUrl === 'string' && item.legalDocumentsUrl.trim()) {
    rawFiles = [item.legalDocumentsUrl.trim()];
  }

  return {
    id: item.id || '',
    userId: item.userId || item.user_id,
    facilityName: item.facilityName || item.facility_name || item.name || 'Cơ sở Y tế FamiDoc',
    representativeName:
      item.representativeName ||
      item.user?.fullName ||
      item.user?.name ||
      item.representative_name ||
      'Đang cập nhật',
    email: item.email || item.user?.email || item.contactEmail || '',
    phone: item.phone || item.hotline || item.user?.phone || '',
    address: item.address || '',
    verificationStatus: vStatus,
    onboardingStatus: normalizedOnboarding,
    status:
      item.status === 'ACTIVE' || vStatus === 'ACTIVE' || normalizedOnboarding === 'ACTIVE'
        ? 'ACTIVE'
        : 'PENDING',
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    taxCode: isPendingTax ? '' : rawTax || undefined,
    operatingLicense: isPendingLicense ? '' : rawLicense || undefined,
    licenseIssuer:
      item.licenseIssuer ||
      item.license_issuer ||
      item.issuingAuthority ||
      item.issuing_authority ||
      undefined,
    licenseDate: item.licenseDate || item.license_date || item.issueDate || item.issue_date || undefined,
    legalRejectionReason,
    hasLegalDocument,
    hasOperatingLicense,
    hasBusinessLicense,
    hasActiveStaffingContract:
      typeof item.hasActiveStaffingContract === 'boolean'
        ? item.hasActiveStaffingContract
        : undefined,
    hasHistoricalStaffingContract:
      typeof item.hasHistoricalStaffingContract === 'boolean'
        ? item.hasHistoricalStaffingContract
        : undefined,
    bankName: rawBankName && rawBankName !== 'CHƯA_CẬP_NHẬT' ? rawBankName : undefined,
    bankAccount:
      item.bankAccount ||
      (item.bankAccountNumber && item.bankAccountNumber !== 'CHƯA_CẬP_NHẬT'
        ? item.bankAccountNumber
        : undefined) ||
      (item.bank_account_number && item.bank_account_number !== 'CHƯA_CẬP_NHẬT'
        ? item.bank_account_number
        : undefined),
    bankAccountHolder:
      item.bankAccountHolder && item.bankAccountHolder !== 'CHƯA_CẬP_NHẬT'
        ? item.bankAccountHolder
        : item.bank_account_holder && item.bank_account_holder !== 'CHƯA_CẬP_NHẬT'
          ? item.bank_account_holder
          : undefined,
    licenseFiles: rawFiles,
  };
}

export const facilitiesApi = {
  // Admin tạo mới tài khoản Cơ sở Y tế đối tác và gửi email mật khẩu ngẫu nhiên
  createFacilityByAdmin: async (payload: CreateFacilityByAdminPayload): Promise<AdminFacilityItem> => {
    const res = await httpClient.post<any>('/api/v1/admin/facilities', payload);
    return normalizeFacility(res?.data ?? res);
  },

  // Admin xem danh sách CSYT kèm lọc và phân trang
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
      // Fallback sang public API nếu không phải phiên Admin
    }

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

  // Admin thẩm định & kích hoạt hoặc từ chối hồ sơ pháp lý CSYT
  verifyLegal: async (
    id: string,
    payload?: { verified?: boolean; approved?: boolean; notes?: string; rejectionReason?: string }
  ): Promise<any> => {
    const approved = payload?.approved ?? payload?.verified ?? true;
    const reason = payload?.rejectionReason ?? payload?.notes;
    return httpClient.patch(`/api/v1/admin/facilities/${id}/verify-legal`, {
      approved,
      ...(reason?.trim() ? { rejectionReason: reason.trim() } : {}),
    });
  },

  // Xem trực tiếp bản scan pháp lý qua API bảo mật JWT
  fetchLegalDocumentBlobUrl: async (
    facilityId: string,
    docType: 'operating' | 'business' = 'operating',
  ): Promise<string> => {
    const blob = await httpClient.getBlob(
      `/api/v1/facilities/${facilityId}/legal-document?type=${docType}`,
    );
    return URL.createObjectURL(blob);
  },

  // Cơ sở Y tế xem hồ sơ của chính mình
  getMyFacilityProfile: async (): Promise<AdminFacilityItem | null> => {
    try {
      const res = await httpClient.get<any>('/api/v1/facilities/me');
      if (res && typeof res === 'object') {
        if (res.data) return normalizeFacility(res.data);
        return normalizeFacility(res);
      }
    } catch {
      // Ignore
    }
    return null;
  },

  // Cơ sở Y tế nộp hồ sơ pháp lý kèm 2 tệp scan riêng (multipart FormData)
  updateLegalProfile: async (payload: {
    facilityName?: string;
    licenseNumber: string;
    taxCode: string;
    hotline: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    address: string;
    licenseIssuer: string;
    licenseDate: string;
    operatingLicenseFile?: File | null;
    businessLicenseFile?: File | null;
    file?: File | null;
  }): Promise<any> => {
    const formData = new FormData();
    formData.append('licenseNumber', payload.licenseNumber.trim());
    formData.append('taxCode', payload.taxCode.trim());
    formData.append('hotline', payload.hotline.trim());
    formData.append('bankName', payload.bankName.trim());
    formData.append('bankAccountNumber', payload.bankAccountNumber.trim());
    formData.append('bankAccountHolder', payload.bankAccountHolder.trim().toUpperCase());
    formData.append('address', payload.address.trim());
    formData.append('licenseIssuer', payload.licenseIssuer.trim());
    formData.append('licenseDate', payload.licenseDate.trim());

    if (payload.facilityName?.trim()) {
      formData.append('facilityName', payload.facilityName.trim());
    }

    const opFile = payload.operatingLicenseFile || payload.file;
    if (opFile) {
      formData.append('operatingLicenseFile', opFile);
    }
    if (payload.businessLicenseFile) {
      formData.append('businessLicenseFile', payload.businessLicenseFile);
    }

    const res = await httpClient.upload<any>('/api/v1/facilities/me/legal-profile', formData, 'PUT');
    return res?.data ? normalizeFacility(res.data) : res;
  },
};
