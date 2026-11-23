import { unwrapApiEnvelope } from './envelope';
import { httpClient } from './http-client';

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type AdminUserRole = 'ADMIN' | 'HEALTHCARE_FACILITY' | 'DOCTOR' | 'FAMILY_REP';
export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AdminUserRole;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  canRestore?: boolean;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  resourceName: string;
  resourceId: string;
  clientIp: string;
  details?: { reason?: string; previousStatus?: string; status?: string } | null;
  actorUser: Pick<AdminUser, 'fullName' | 'role'> | null;
}

export type ComplaintStatus = 'SUBMITTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type ComplaintSenderRole = 'FAMILY_REP' | 'DOCTOR';
export type ComplaintOutcome = 'NO_VIOLATION' | 'WARNING' | 'SERVICE_CORRECTION' | 'REFERRED_TO_FACILITY';

export interface AdminComplaint {
  id: string;
  complaintCode: string;
  complaintCategory: string;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  contractId: string;
  facilityReviewedAt?: string | null;
  complainantUser?: { fullName: string };
  contract?: { contractNumber: string; facility?: { facilityName: string } };
}

export interface AdminComplaintDetail extends AdminComplaint {
  facilityResponse?: string | null;
  resolutionOutcome?: ComplaintOutcome | null;
  resolutionNotes?: string | null;
  evidenceAttachments?: string[] | null;
}

export type AdminPeriod = 'weekly' | 'monthly' | 'yearly';
export interface AdminOverview {
  gmvVnd: number;
  activeContracts: number;
  doctors: number;
  facilities: number;
  openComplaints: number;
  counts: { total: number; completed: number; pending: number; cancelled: number };
  queue: AdminComplaint[];
  series: Array<{ label: string; HOME_VISIT: number; TELEHEALTH: number; FACILITY_VISIT: number }>;
}

export interface AdminFinanceReport {
  year: number;
  environment: 'LIVE' | 'TEST';
  totals: { receivedVnd: number; paidVnd: number; netVnd: number };
  months: { month: number; receivedVnd: number; paidVnd: number }[];
}

export const complaintStatusLabel: Record<ComplaintStatus, string> = {
  SUBMITTED: 'Chờ thụ lý', INVESTIGATING: 'Đang xác minh', RESOLVED: 'Đã kết luận', CLOSED: 'Đã đóng',
};

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  return unwrapApiEnvelope(await httpClient.get(path, params, { cache: 'no-store' }));
}

export const adminApi = {
  overview: (period: AdminPeriod, environment: 'LIVE' | 'TEST' = 'LIVE') => get<AdminOverview>('/api/v1/admin/overview', { period, environment }),
  financeReport: (year: number, environment: AdminFinanceReport['environment']) =>
    get<AdminFinanceReport>('/api/v1/admin/finance-report', { year, environment }),
  users: (params: { page: number; limit?: number; role?: AdminUserRole; q?: string }) =>
    get<AdminPage<AdminUser>>('/api/v1/admin/users', params),
  auditLogs: (params: {
    page: number;
    limit?: number;
    action?: string;
    q?: string;
    resourceName?: string;
    resourceId?: string;
  }) => get<AdminPage<AdminAuditLog>>('/api/v1/admin/audit-logs', params),
  changeUserStatus: async (id: string, status: 'SUSPENDED' | 'ACTIVE', reason: string): Promise<AdminUser> =>
    unwrapApiEnvelope(await httpClient.patch(`/api/v1/admin/users/${id}/status`, { status, reason })),
  complaints: (params: { page: number; status?: ComplaintStatus; complainantRole?: ComplaintSenderRole }) =>
    get<AdminPage<AdminComplaint>>('/api/v1/admin/complaints', params),
  facilityComplaints: (params: { page: number; status?: ComplaintStatus }) =>
    get<AdminPage<AdminComplaint>>('/api/v1/facilities/me/complaints', params),
  complaint: (id: string) => get<AdminComplaintDetail>(`/api/v1/complaints/${id}`),
  updateComplaint: async (id: string, payload: { action: 'INVESTIGATE' | 'CLOSE' } | {
    action: 'RESOLVE'; outcome: ComplaintOutcome; notes: string;
  } | {
    action: 'FACILITY_RESPONSE'; notes: string;
  }): Promise<AdminComplaintDetail> =>
    unwrapApiEnvelope(await httpClient.patch(`/api/v1/complaints/${id}/resolve`, payload)),
};
