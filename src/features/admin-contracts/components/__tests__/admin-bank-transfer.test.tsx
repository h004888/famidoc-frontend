import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { paymentsApi } from '@/lib/api/payments.api';
import { AdminPaymentRequestView } from '../admin-payment-request-view';
import { AdminWebhookEventsView } from '../admin-webhook-events-view';

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: { getMedicalContracts: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@/lib/api/payments.api', () => ({
  paymentsApi: { createAdminPaymentRequest: vi.fn(), listWebhookEvents: vi.fn() },
}));

it('shows the returned bank details and immutable FD code after the Admin issues a request', async () => {
  const contractId = '60000000-0000-4000-8000-000000000001';
  vi.mocked(paymentsApi.createAdminPaymentRequest).mockResolvedValue({
    id: 'invoice-id', contractId, familyId: 'family-id', environment: 'TEST',
    attempt: 2, paymentCode: 'FD000042', transferContent: 'THU PHI FD000042',
    amountVnd: 150000, currency: 'VND', expectedAccountNumber: '0000000000',
    expectedGateway: 'TEST_BANK', status: 'PENDING', createdAt: '2026-11-17T12:00:00Z',
    expiresAt: '2026-11-17T12:15:00Z', paidAt: null, acceptedTransactionId: null,
  });
  render(<AdminPaymentRequestView />);
  fireEvent.change(screen.getByLabelText('ID hợp đồng'), { target: { value: contractId } });
  fireEvent.change(screen.getByLabelText('Số tiền cần thu (VNĐ)'), { target: { value: '150000' } });
  fireEvent.change(screen.getByLabelText('Nội dung chuyển khoản'), { target: { value: 'THU PHI' } });
  fireEvent.change(screen.getByLabelText('Lý do tạo hoặc đổi mã'), { target: { value: 'Kiểm thử thu tiền' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(await screen.findByText('THU PHI FD000042')).toBeInTheDocument();
  expect(paymentsApi.createAdminPaymentRequest).toHaveBeenCalledWith({
    contractId, addendumId: undefined, amountVnd: 150000,
    transferDescription: 'THU PHI', reason: 'Kiểm thử thu tiền',
  });
  expect(screen.getByText('TEST_BANK · 0000000000')).toBeInTheDocument();
});

it('shows a failed match as an error despite a successful HTTP acknowledgment', async () => {
  vi.mocked(paymentsApi.listWebhookEvents).mockResolvedValue({
    items: [
      { id: 'a', environment: 'TEST', status: 'ERROR', resultCode: 'AMOUNT_MISMATCH',
        httpStatus: 200, receivedAt: '2026-11-17T12:00:00Z', providerTransactionId: '321', transactionId: 'transaction-id' },
    ],
    page: 1, limit: 20, total: 1,
  });
  render(<AdminWebhookEventsView />);
  fireEvent.change(screen.getByLabelText('Loại dữ liệu'), { target: { value: 'TEST' } });
  fireEvent.change(screen.getByLabelText('Kết quả xử lý'), { target: { value: 'ERROR' } });
  expect(await screen.findByText('Số tiền nhận khác số tiền trên hóa đơn')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Chi tiết kỹ thuật'));
  expect(screen.getByText('HTTP 200 · AMOUNT_MISMATCH')).toBeVisible();
  expect(paymentsApi.listWebhookEvents).toHaveBeenLastCalledWith({ environment: 'TEST', status: 'ERROR', page: 1 });
});
