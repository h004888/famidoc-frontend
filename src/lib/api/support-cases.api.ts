import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';
import { ApiError } from '@/lib/http/errors';

export function readExistingSupportCaseId(cause: unknown): string | null {
  if (!(cause instanceof ApiError) || cause.status !== 409) return null;
  const details = cause.details as {
    error?: { existingCaseId?: unknown };
    existingCaseId?: unknown;
  } | undefined;
  const id = details?.error?.existingCaseId ?? details?.existingCaseId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export type SupportCaseType =
  | 'COMPLAINT_APPEAL'
  | 'COMPLAINT_QUESTION'
  | 'PAYMENT_ISSUE';

export type SupportCaseStatus =
  | 'OPEN'
  | 'IN_REVIEW'
  | 'NEED_MORE_INFO'
  | 'RESOLVED'
  | 'CLOSED';

export interface SupportCaseMessage {
  id: string;
  caseId: string;
  senderUserId: string;
  senderRole: 'FAMILY_REP' | 'ADMIN' | string;
  senderName: string;
  body: string;
  attachmentKeys: string[];
  createdAt: string;
}

export interface SupportCaseRelatedTransaction {
  id: string;
  providerTransactionId: string;
  amountReceived: number;
  paymentTime: string;
  outcome: 'MATCHED' | 'REVIEW_REQUIRED' | 'IGNORED' | string;
  reason: string | null;
  referenceCode: string;
  gateway: string;
  accountNumber: string;
  paymentCode: string | null;
  transferContent: string | null;
}

export interface SupportCaseSummary {
  id: string;
  caseCode: string;
  caseType: SupportCaseType;
  status: SupportCaseStatus;
  familyUserId: string;
  contractId: string;
  complaintId: string | null;
  invoiceId: string | null;
  transactionId: string | null;
  contextSnapshot: Record<string, unknown>;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: {
    id: string;
    senderRole: string;
    body: string;
    createdAt: string;
  } | null;
  familyUser: {
    id: string;
    fullName: string;
    phone: string;
  };
  contract: {
    id: string;
    contractNumber: string;
    contractStatus: string;
    facilityName: string;
    packageName: string;
  };
  complaint: {
    id: string;
    complaintCode: string;
    complaintCategory: string;
    status: string;
    resolutionOutcome: string | null;
  } | null;
  invoice: {
    id: string;
    invoiceCode: string;
    addendumId?: string | null;
    totalPayable: number;
    paymentStatus: string;
    paidAt: string | null;
  } | null;
}

export interface SupportCaseDetail {
  id: string;
  caseCode: string;
  caseType: SupportCaseType;
  status: SupportCaseStatus;
  familyUserId: string;
  contractId: string;
  complaintId: string | null;
  invoiceId: string | null;
  transactionId: string | null;
  contextSnapshot: Record<string, unknown>;
  resolutionSummary: string | null;
  resolvedAt: string | null;
  resolvedBy: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  familyUser: {
    id: string;
    fullName: string;
    phone: string;
  };
  contract: {
    id: string;
    contractNumber: string;
    contractStatus: string;
    facilityName: string;
    doctorName: string | null;
    packageName: string;
  };
  complaint: {
    id: string;
    complaintCode: string;
    complaintCategory: string;
    description: string;
    evidenceAttachments: string[];
    facilityResponse: string | null;
    facilityReviewedAt: string | null;
    resolutionOutcome: string | null;
    resolutionNotes: string | null;
    status: string;
    resolvedAt: string | null;
    createdAt: string;
  } | null;
  invoice: {
    id: string;
    invoiceCode: string;
    transferContent: string;
    totalPayable: number;
    paymentStatus: string;
    expectedAccountNumber: string | null;
    expectedGateway: string | null;
    expiredAt: string;
    paidAt: string | null;
    createdAt: string;
  } | null;
  relatedTransactions: SupportCaseRelatedTransaction[];
  familyCanReply: boolean;
  remainingFamilyMessages: number;
  messages: SupportCaseMessage[];
}

export interface SupportCasePage {
  items: SupportCaseSummary[];
  total: number;
  page: number;
  limit: number;
}

export const SUPPORT_CASE_TYPE_LABELS: Record<SupportCaseType, string> = {
  COMPLAINT_APPEAL: 'Yêu cầu xem xét lại',
  COMPLAINT_QUESTION: 'Câu hỏi về khiếu nại',
  PAYMENT_ISSUE: 'Báo lỗi chuyển khoản',
};

export const SUPPORT_CASE_STATUS_STYLES: Record<SupportCaseStatus, string> = {
  OPEN: 'border-amber-300 bg-amber-50 text-amber-900',
  IN_REVIEW: 'border-blue-300 bg-blue-50 text-blue-900',
  NEED_MORE_INFO: 'border-orange-300 bg-orange-50 text-orange-900',
  RESOLVED: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  CLOSED: 'border-slate-300 bg-slate-100 text-slate-700',
};

export function getSupportCaseStatusLabel(
  status: SupportCaseStatus,
  caseType?: SupportCaseType,
): string {
  switch (status) {
    case 'OPEN':
      return 'Chờ Admin tiếp nhận';
    case 'IN_REVIEW':
      return caseType === 'PAYMENT_ISSUE'
        ? 'Đang đối soát'
        : 'Đang xem xét lại';
    case 'NEED_MORE_INFO':
      return 'Cần bổ sung thông tin';
    case 'RESOLVED':
      return 'Đã có kết quả';
    case 'CLOSED':
      return 'Đã đóng';
    default:
      return status;
  }
}

export function isOpenSupportCaseStatus(status?: string | null): boolean {
  return (
    status === 'OPEN' || status === 'IN_REVIEW' || status === 'NEED_MORE_INFO'
  );
}

export function isValidSupportAttachmentFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    mime === 'application/pdf' ||
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    name.endsWith('.pdf') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  );
}

export function supportAttachmentFileName(key: string): string {
  const parts = key.split('/');
  return parts[parts.length - 1] || key;
}

export const supportCasesApi = {
  list: async (params?: {
    type?: string;
    status?: SupportCaseStatus;
    complaintId?: string;
    invoiceId?: string;
    contractId?: string;
    onlyOpen?: true;
    page?: number;
    limit?: number;
  }): Promise<SupportCasePage> => {
    return unwrapApiEnvelope<SupportCasePage>(
      await httpClient.get('/api/v1/support-cases', params, {
        cache: 'no-store',
      }),
    );
  },

  detail: async (id: string): Promise<SupportCaseDetail> => {
    return unwrapApiEnvelope<SupportCaseDetail>(
      await httpClient.get(
        `/api/v1/support-cases/${encodeURIComponent(id)}`,
        undefined,
        { cache: 'no-store' },
      ),
    );
  },

  uploadAttachment: async (file: File): Promise<{ attachmentKey: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const raw = await httpClient.upload<unknown>(
      '/api/v1/support-cases/attachments',
      formData,
    );
    return unwrapApiEnvelope<{ attachmentKey: string }>(raw);
  },

  downloadAttachmentBlob: async (caseId: string, key: string): Promise<Blob> => {
    return httpClient.getBlob(
      `/api/v1/support-cases/${encodeURIComponent(caseId)}/attachments?key=${encodeURIComponent(key)}`,
    );
  },

  createComplaintCase: async (payload: {
    complaintId: string;
    mode: 'APPEAL' | 'QUESTION';
    message: string;
    attachmentKeys?: string[];
  }): Promise<SupportCaseDetail> => {
    return unwrapApiEnvelope<SupportCaseDetail>(
      await httpClient.post('/api/v1/support-cases/complaint-review', payload),
    );
  },

  createPaymentIssueCase: async (payload: {
    contractId: string;
    invoiceId?: string;
    message: string;
    attachmentKeys?: string[];
  }): Promise<SupportCaseDetail> => {
    return unwrapApiEnvelope<SupportCaseDetail>(
      await httpClient.post('/api/v1/support-cases/payment-issue', payload),
    );
  },

  postMessage: async (
    caseId: string,
    payload: { body: string; attachmentKeys?: string[] },
  ): Promise<SupportCaseDetail> => {
    return unwrapApiEnvelope<SupportCaseDetail>(
      await httpClient.post(
        `/api/v1/support-cases/${encodeURIComponent(caseId)}/messages`,
        payload,
      ),
    );
  },

  updateStatus: async (
    caseId: string,
    payload: {
      status: 'IN_REVIEW' | 'NEED_MORE_INFO' | 'RESOLVED' | 'CLOSED';
      resolutionSummary?: string;
      replyMessage?: string;
    },
  ): Promise<SupportCaseDetail> => {
    return unwrapApiEnvelope<SupportCaseDetail>(
      await httpClient.patch(
        `/api/v1/support-cases/${encodeURIComponent(caseId)}/status`,
        payload,
      ),
    );
  },
};
