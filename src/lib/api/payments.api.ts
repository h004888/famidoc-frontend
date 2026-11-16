import { httpClient } from './http-client';

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

export interface PaymentTransactionItem {
  id: string;
  environment: string;
  gatewayTransactionId: string;
  amountReceived: number;
  paymentTime: string;
  accountNumber: string;
  paymentCode?: string;
  referenceCode?: string;
  outcome: string;
  reason?: string;
}

export const paymentsApi = {
  createVietQRPayment: (payload: CreatePaymentRequestPayload): Promise<PaymentRequest> => {
    return httpClient.post<PaymentRequest>('/api/v1/payments/vietqr', payload);
  },

  getPaymentStatus: (paymentId: string): Promise<PaymentRequest> => {
    return httpClient.get<PaymentRequest>(`/api/v1/payments/${paymentId}/status`);
  },

  cancelPaymentRequest: (paymentId: string): Promise<PaymentRequest> => {
    return httpClient.post<PaymentRequest>(`/api/v1/payments/requests/${paymentId}/cancel`);
  },

  recheckPaymentActivation: (paymentId: string): Promise<{ activated: boolean }> => {
    return httpClient.post<{ activated: boolean }>(`/api/v1/payments/requests/${paymentId}/recheck-activation`);
  },

  listTransactions: (params?: { limit?: number; offset?: number }): Promise<PaymentTransactionItem[]> => {
    return httpClient.get<PaymentTransactionItem[]>('/api/v1/payments/transactions', params);
  },
};
