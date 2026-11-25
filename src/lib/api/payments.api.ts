import { httpClient } from './http-client';
import { unwrapApiEnvelope } from './envelope';

export type PaymentRequestStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export interface PaymentRequest {
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
  status: PaymentRequestStatus;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  acceptedTransactionId: string | null;
}

export interface CreatePaymentRequestPayload {
  contractId: string;
  addendumId?: string;
}

export interface AdminPaymentRequestPayload extends CreatePaymentRequestPayload {
  amountVnd: number;
  transferDescription: string;
  reason: string;
}

export interface PaymentEligibility {
  eligible: boolean;
  message?: string;
  blockingReasons: string[];
}

export interface SePayWebhookEvent {
  id: string;
  environment: 'TEST' | 'LIVE';
  status: 'SUCCESS' | 'ERROR';
  httpStatus: number;
  resultCode: string;
  providerTransactionId: string | null;
  transactionId: string | null;
  receivedAt: string;
}

export interface SePayWebhookPage {
  items: SePayWebhookEvent[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentTransactionItem {
  id: string;
  environment: 'TEST' | 'LIVE';
  providerTransactionId: string;
  gateway: string;
  transferType?: 'in' | 'out';
  amountVnd: number;
  transactionAt: string;
  receivedAt: string;
  accountNumber: string;
  paymentCode: string | null;
  paymentRequestId: string | null;
  referenceCode: string;
  transferContent?: string | null;
  contractNumber?: string | null;
  payerName?: string | null;
  payerPhoneLast4?: string | null;
  outcome: 'MATCHED' | 'REVIEW_REQUIRED' | 'IGNORED';
  reason: string | null;
  ingestionSource?: 'WEBHOOK' | 'SEPAY_API';
  sepayWebhookTransactionId?: string | null;
  sepayApiTransactionId?: string | null;
}

export interface PaymentTransactionsSummary {
  totalInVnd: number;
  totalOutVnd: number;
  reviewRequiredCount: number;
}

export interface PaymentTransactionsPage {
  items: PaymentTransactionItem[];
  total: number;
  page: number;
  limit: number;
  summary?: PaymentTransactionsSummary;
}

export interface PaymentActivationResult {
  activated: boolean;
  blockingReasons: string[];
}

export interface FamilyPaymentRequestItem {
  id: string;
  contractId: string;
  contractNumber: string;
  contractStatus: string;
  packageName: string;
  facilityName: string;
  paymentCode: string;
  transferContent: string;
  amountVnd: number;
  grossAmountVnd?: number;
  vatAmountVnd?: number;
  paymentGateway?: string;
  addendumId?: string | null;
  addendumNumber?: string | null;
  addendumType?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  memberCount?: number;
  status: PaymentRequestStatus;
  expectedAccountNumber: string | null;
  expectedGateway: string | null;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  latestTransaction: {
    id: string;
    providerTransactionId: string;
    amountReceived: number;
    paymentTime: string;
    outcome: 'MATCHED' | 'REVIEW_REQUIRED' | 'IGNORED' | string;
    reason: string | null;
    referenceCode: string;
    gateway: string;
  } | null;
  openSupportCase: {
    id: string;
    caseCode: string;
    status: string;
    updatedAt: string;
  } | null;
}

export const paymentsApi = {
  getAdminPaymentEligibility: async (
    contractId: string,
    addendumId?: string,
  ): Promise<PaymentEligibility> =>
    unwrapApiEnvelope(await httpClient.get('/api/v1/payments/admin/eligibility', { contractId, addendumId }, { cache: 'no-store' })),

  createAdminPaymentRequest: async (payload: AdminPaymentRequestPayload): Promise<PaymentRequest> =>
    unwrapApiEnvelope(await httpClient.post('/api/v1/payments/admin/requests', payload)),

  listWebhookEvents: async (params: {
    environment: 'TEST' | 'LIVE';
    page: number;
    status?: SePayWebhookEvent['status'];
  }): Promise<SePayWebhookPage> =>
    unwrapApiEnvelope(await httpClient.get('/api/v1/payments/webhook-events', params, { cache: 'no-store' })),

  createVietQRPayment: async (payload: CreatePaymentRequestPayload): Promise<PaymentRequest> => {
    return unwrapApiEnvelope(await httpClient.post('/api/v1/payments/vietqr', payload));
  },

  getPaymentStatus: async (paymentId: string): Promise<PaymentRequest> => {
    return unwrapApiEnvelope(await httpClient.get(`/api/v1/payments/${paymentId}/status`));
  },

  cancelPaymentRequest: async (paymentId: string): Promise<PaymentRequest> => {
    return unwrapApiEnvelope(await httpClient.post(`/api/v1/payments/requests/${paymentId}/cancel`));
  },

  recheckPaymentActivation: async (paymentId: string): Promise<PaymentActivationResult> => {
    return unwrapApiEnvelope(await httpClient.post(`/api/v1/payments/requests/${paymentId}/recheck-activation`));
  },

  listTransactions: async (
    params?: {
      limit?: number;
      page?: number;
      outcome?: PaymentTransactionItem['outcome'];
      transferType?: 'in' | 'out';
      search?: string;
    },
  ): Promise<PaymentTransactionsPage> => {
    return unwrapApiEnvelope(await httpClient.get('/api/v1/payments/transactions', params, { cache: 'no-store' }));
  },

  listMyPaymentRequests: async (): Promise<FamilyPaymentRequestItem[]> => {
    return unwrapApiEnvelope(await httpClient.get('/api/v1/payments/my-requests', undefined, { cache: 'no-store' }));
  },
};
