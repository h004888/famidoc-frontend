import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentsApi } from '../payments.api';
import { httpClient } from '../http-client';

describe('paymentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createVietQRPayment calls POST /api/v1/payments/vietqr', async () => {
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
      id: 'pay-123',
      contractId: 'ctr-456',
      familyId: 'fam-789',
      environment: 'TEST',
      attempt: 1,
      paymentCode: 'FMD12345',
      transferContent: 'FMD FAM789',
      amountVnd: 9600000,
      currency: 'VND',
      expectedAccountNumber: '882190068688',
      expectedGateway: 'MB Bank',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      paidAt: null,
      acceptedTransactionId: null,
    });

    const res = await paymentsApi.createVietQRPayment({ contractId: 'ctr-456' });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/payments/vietqr', { contractId: 'ctr-456' });
    expect(res.paymentCode).toBe('FMD12345');
    expect(res.amountVnd).toBe(9600000);
  });

  it('getPaymentStatus calls GET /api/v1/payments/:id/status', async () => {
    const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
      id: 'pay-123',
      status: 'PAID',
      paidAt: new Date().toISOString(),
    });

    const res = await paymentsApi.getPaymentStatus('pay-123');

    expect(getSpy).toHaveBeenCalledWith('/api/v1/payments/pay-123/status');
    expect(res.status).toBe('PAID');
  });

  it('cancelPaymentRequest calls POST /api/v1/payments/requests/:id/cancel', async () => {
    const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
      id: 'pay-123',
      status: 'CANCELLED',
    });

    const res = await paymentsApi.cancelPaymentRequest('pay-123');

    expect(postSpy).toHaveBeenCalledWith('/api/v1/payments/requests/pay-123/cancel');
    expect(res.status).toBe('CANCELLED');
  });

  it('listTransactions calls GET /api/v1/payments/transactions', async () => {
    const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce([]);

    await paymentsApi.listTransactions({ limit: 10 });

    expect(getSpy).toHaveBeenCalledWith('/api/v1/payments/transactions', { limit: 10 });
  });
});
