import { httpClient } from './http-client';

export interface AdminCarePackageItem {
  id: string;
  packageCode: string;
  packageName: string;
  durationMonths: number;
  basePrice: number;
  periodicVisitsQuota: number;
  telehealthQuota: number;
  maxMembers: number;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  version: number;
  description?: string;
}

export type CarePackageAdminDto = AdminCarePackageItem;

export interface CreateAdminPackagePayload {
  packageCode?: string;
  packageName?: string;
  name?: string;
  durationMonths?: number;
  basePrice?: number;
  basePriceVnd?: number;
  periodicVisitsQuota?: number;
  homeVisitsQuota?: number;
  telehealthQuota?: number;
  maxMembers?: number;
  description?: string;
}

export const adminPackagesApi = {
  listPackages: (): Promise<AdminCarePackageItem[]> => {
    return httpClient.get<AdminCarePackageItem[]>('/api/v1/admin/care-packages');
  },

  getPackageById: (id: string): Promise<AdminCarePackageItem> => {
    return httpClient.get<AdminCarePackageItem>(`/api/v1/admin/care-packages/${id}`);
  },

  createPackage: (payload: CreateAdminPackagePayload): Promise<AdminCarePackageItem> => {
    return httpClient.post<AdminCarePackageItem>('/api/v1/admin/care-packages', payload);
  },

  updatePackage: (id: string, payload: Partial<CreateAdminPackagePayload>): Promise<AdminCarePackageItem> => {
    return httpClient.patch<AdminCarePackageItem>(`/api/v1/admin/care-packages/${id}`, payload);
  },

  createVersion: (id: string, payload?: any): Promise<AdminCarePackageItem> => {
    return httpClient.post<AdminCarePackageItem>(`/api/v1/admin/care-packages/${id}/versions`, payload);
  },

  publishPackage: (id: string): Promise<{ success: boolean; status: string }> => {
    return httpClient.post<{ success: boolean; status: string }>(`/api/v1/admin/care-packages/${id}/publish`);
  },

  retirePackage: (id: string): Promise<{ success: boolean; status: string }> => {
    return httpClient.post<{ success: boolean; status: string }>(`/api/v1/admin/care-packages/${id}/retire`);
  },
};
