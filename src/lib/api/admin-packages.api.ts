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
  quotaPeriod?: 'PER_TERM' | 'PER_MONTH';
  videoQuotaPolicy?: 'FIXED' | 'CONTRACT';
  homeVisitUnitPriceVnd?: number;
  quotas: { videoConsultations: number; homeVisits: number };
}

export interface AdminCarePackageItem extends PackageTerms {
  id: string;
  code: string;
  version: number;
  status: PackageStatus;
}

export type CarePackageAdminDto = AdminCarePackageItem;

export interface PackageRuleFinding {
  code: string;
  level: 'BLOCK' | 'WARN' | 'INFO';
  message: string;
}
export interface PackageValidationResult {
  ok: boolean;
  requiresAcknowledgement: string[];
  findings: PackageRuleFinding[];
  load: {
    totalVisits: number;
    maxTotalVisits: number;
    visitsPerMonth: number;
    doctorUtilization: number;
    level: 'SAFE' | 'WARN' | 'OVER';
  };
  maxContractVideoConsultations: number | null;
}

const base = '/api/v1/admin/care-packages';
export const adminPackagesApi = {
  listPackages: async (params?: {
    page?: number;
    limit?: number;
    status?: PackageStatus;
    excludeDrafts?: boolean;
  }): Promise<AdminPage<AdminCarePackageItem>> =>
    unwrapApiEnvelope(await httpClient.get(base, params, { cache: 'no-store' })),
  getPackageById: async (id: string): Promise<AdminCarePackageItem> =>
    unwrapApiEnvelope(await httpClient.get(`${base}/${id}`)),
  validatePackage: async (
    payload: Omit<PackageTerms, 'quotaPeriod' | 'videoQuotaPolicy'> & { packageId?: string },
  ): Promise<PackageValidationResult> =>
    unwrapApiEnvelope(await httpClient.post(`${base}/validate`, payload)),
  createPackage: async (
    payload: Omit<PackageTerms, 'quotaPeriod' | 'videoQuotaPolicy'>,
  ): Promise<AdminCarePackageItem> =>
    unwrapApiEnvelope(await httpClient.post(base, payload)),
  updatePackage: async (
    id: string,
    payload: Partial<Omit<PackageTerms, 'quotaPeriod' | 'videoQuotaPolicy'>>,
  ): Promise<AdminCarePackageItem> =>
    unwrapApiEnvelope(await httpClient.patch(`${base}/${id}`, payload)),
  reopenPackage: async (id: string): Promise<AdminCarePackageItem> =>
    unwrapApiEnvelope(await httpClient.post(`${base}/${id}/reopen`, {})),
  retirePackage: async (id: string): Promise<AdminCarePackageItem> =>
    unwrapApiEnvelope(await httpClient.post(`${base}/${id}/retire`)),
  deletePackage: async (id: string): Promise<{ id: string; deletedAt: string }> =>
    unwrapApiEnvelope(await httpClient.delete(`${base}/${id}`)),
};
