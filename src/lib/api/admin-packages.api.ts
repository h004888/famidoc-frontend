import type { AdminPage } from './admin.api';
import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type PackageStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
export interface PackageTerms {
  name: string;
  description: string;
  durationMonths: number;
  priceVnd: number;
  includedMembers: number;
  maxMembers: number;
  additionalMemberMonthlyPriceVnd: number;
  quotaPeriod: 'PER_TERM' | 'PER_MONTH';
  videoQuotaPolicy?: 'FIXED' | 'CONTRACT';
  homeVisitUnitPriceVnd?: number;
  quotas: { videoConsultations: number; homeVisits: number; facilityVisits: number };
}

export interface AdminCarePackageItem extends PackageTerms {
  id: string;
  code: string;
  version: number;
  status: PackageStatus;
}

export type CarePackageAdminDto = AdminCarePackageItem;

const base = '/api/v1/admin/care-packages';
export const adminPackagesApi = {
  listPackages: async (params?: { page?: number; limit?: number; status?: PackageStatus; excludeDrafts?: boolean }): Promise<AdminPage<AdminCarePackageItem>> =>
    unwrapApiEnvelope(await httpClient.get(base, params, { cache: 'no-store' })),
  getPackageById: async (id: string): Promise<AdminCarePackageItem> => unwrapApiEnvelope(await httpClient.get(`${base}/${id}`)),
  createPackage: async (payload: PackageTerms & { code: string }): Promise<AdminCarePackageItem> =>
    unwrapApiEnvelope(await httpClient.post(base, payload)),
  updatePackage: async (id: string, payload: Partial<PackageTerms>): Promise<AdminCarePackageItem> =>
    unwrapApiEnvelope(await httpClient.patch(`${base}/${id}`, payload)),
  reopenPackage: async (id: string): Promise<AdminCarePackageItem> => unwrapApiEnvelope(await httpClient.post(`${base}/${id}/reopen`)),
  retirePackage: async (id: string): Promise<AdminCarePackageItem> => unwrapApiEnvelope(await httpClient.post(`${base}/${id}/retire`)),
};
