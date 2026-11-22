import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { contractsApi, type FourPartyContract } from '@/lib/api/contracts.api';
import { paymentsApi } from '@/lib/api/payments.api';
import { ApiConnectionError, ApiError } from '@/lib/http/errors';
import { AdminPaymentRequestView } from '../admin-payment-request-view';
import { AdminWebhookEventsView } from '../admin-webhook-events-view';

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: { getMedicalContracts: vi.fn().mockResolvedValue([]), getMedicalContractById: vi.fn() },
}));
vi.mock('@/lib/api/payments.api', () => ({
  paymentsApi: { createAdminPaymentRequest: vi.fn(), getAdminPaymentEligibility: vi.fn(), listWebhookEvents: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([]);
  vi.mocked(paymentsApi.getAdminPaymentEligibility).mockResolvedValue({ eligible: true, blockingReasons: [] });
});

function pendingContract(id: string): FourPartyContract {
  return {
    id, contractNumber: 'HD-TRA-CUU', status: 'PENDING_PAYMENT',
    packageId: 'pkg-1', packageName: 'Gói đã ký', packagePrice: 150000, durationMonths: 1,
    familyId: 'family-1', familyRepresentativeName: 'Gia đình A',
    familyRepresentativePhone: '0901234567', familyRepresentativeEmail: 'a@example.invalid',
    createdAt: '2026-11-01', signatures: {},
  };
}

async function lookupContract(contract: FourPartyContract) {
  vi.mocked(contractsApi.getMedicalContractById).mockResolvedValueOnce(contract);
  fireEvent.change(screen.getByLabelText('ID hợp đồng'), { target: { value: `  ${contract.id.toUpperCase()}  ` } });
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu hợp đồng' }));
  await screen.findByText(`${contract.contractNumber} · ${contract.familyRepresentativeName}`);
  expect(contractsApi.getMedicalContractById).toHaveBeenCalledWith(contract.id);
}

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
  await lookupContract(pendingContract(contractId));
  expect(await screen.findByText('Đủ điều kiện tạo mã cho khoản này.')).toBeInTheDocument();
  expect(screen.getByLabelText('Số tiền cần thu (VNĐ)')).toHaveValue(150000);
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

it('requires an addendum for ACTIVE contracts, populates pending addenda dropdown, and blocks embedded FD code', async () => {
  const activeContractId = '60000000-0000-4000-8000-000000000010';
  const addendumId = '70000000-0000-4000-8000-000000000020';
  vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([
    {
      id: activeContractId,
      contractNumber: 'HD-4P-2026-0099',
      status: 'ACTIVE',
      packageId: 'pkg-1',
      packageName: 'Gói Gia Đình Tiêu Chuẩn',
      packagePrice: 3600000,
      durationMonths: 12,
      familyId: 'fam-1',
      familyRepresentativeName: 'Nguyễn Văn A',
      familyRepresentativePhone: '0901234567',
      familyRepresentativeEmail: 'a@famidoc.vn',
      assignedDoctorId: 'doc-1',
      assignedDoctorName: 'BS. Trần Thị B',
      createdAt: '2026-11-01T00:00:00Z',
      signatures: {
        family: { signedBy: 'A', signerRole: 'FAMILY', signedAt: '2026-11-01T00:00:00Z', sha256Hash: '1234567890abcdef' },
        platform: { signedBy: 'Admin', signerRole: 'PLATFORM', signedAt: '2026-11-01T00:00:00Z', sha256Hash: '1234567890abcdef' },
        facility: { signedBy: 'CSYT', signerRole: 'FACILITY', signedAt: '2026-11-01T00:00:00Z', sha256Hash: '1234567890abcdef' },
        doctor: { signedBy: 'BS', signerRole: 'DOCTOR', signedAt: '2026-11-01T00:00:00Z', sha256Hash: '1234567890abcdef' },
      },
      addenda: [
        {
          id: addendumId,
          addendumNumber: 'PL-2026-0001',
          addendumType: 'MEMBER_EXTENSION',
          additionalAmount: 500000,
          status: 'PENDING_PAYMENT',
          signedRoles: ['FAMILY_REP', 'ADMIN', 'HEALTHCARE_FACILITY', 'ASSIGNED_DOCTOR'],
          hasPaidInvoice: false,
        },
      ],
    },
  ]);

  render(<AdminPaymentRequestView />);
  const select = await screen.findByLabelText('Hợp đồng cần thu');
  fireEvent.change(select, { target: { value: activeContractId } });

  // Tự động chọn phụ lục duy nhất đang chờ thanh toán và điền sẵn số tiền phụ lục
  expect(screen.getByLabelText('Phụ lục cần thu *')).toHaveValue(addendumId);
  expect(screen.getByLabelText('Số tiền cần thu (VNĐ)')).toHaveValue(500000);
  await screen.findByText('Đủ điều kiện tạo mã cho khoản này.');

  // Nếu bỏ chọn phụ lục ở hợp đồng ACTIVE -> chặn trước khi gọi API
  fireEvent.change(screen.getByLabelText('Phụ lục cần thu *'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Nội dung chuyển khoản'), { target: { value: 'THU PHU LUC' } });
  fireEvent.change(screen.getByLabelText('Lý do tạo hoặc đổi mã'), { target: { value: 'Thu tiền bổ sung thành viên' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(screen.getByRole('alert')).toHaveTextContent(/Hợp đồng đang hiệu lực chỉ tạo được mã thu tiền cho phụ lục/);
  expect(paymentsApi.createAdminPaymentRequest).not.toHaveBeenCalled();

  // Chọn lại phụ lục nhưng nhập nội dung chứa sẵn mã FD -> chặn trước khi gọi API
  fireEvent.change(screen.getByLabelText('Phụ lục cần thu *'), { target: { value: addendumId } });
  await screen.findByText('Đủ điều kiện tạo mã cho khoản này.');
  fireEvent.change(screen.getByLabelText('Nội dung chuyển khoản'), { target: { value: 'THU PHI FD123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(screen.getByRole('alert')).toHaveTextContent(/Nội dung không được chứa mã FD của hóa đơn/);
  expect(paymentsApi.createAdminPaymentRequest).not.toHaveBeenCalled();
});

it('displays Vietnamese blockingReasons from backend 409 conflict', async () => {
  const contractId = '60000000-0000-4000-8000-000000000002';
  vi.mocked(paymentsApi.createAdminPaymentRequest).mockRejectedValue(
    new ApiError('Hợp đồng chưa đủ điều kiện thanh toán.', 409, {
      error: {
        detail: 'Contract is not ready for payment',
        blockingReasons: ['ADMIN_SIGNATURE_REQUIRED', 'DOCTOR_VERIFICATION_REQUIRED'],
      },
    }),
  );

  render(<AdminPaymentRequestView />);
  await lookupContract(pendingContract(contractId));
  await screen.findByText('Đủ điều kiện tạo mã cho khoản này.');
  fireEvent.change(screen.getByLabelText('Nội dung chuyển khoản'), { target: { value: 'THU PHI' } });
  fireEvent.change(screen.getByLabelText('Lý do tạo hoặc đổi mã'), { target: { value: 'Kiểm tra lý do chặn' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Hợp đồng chưa đủ điều kiện thanh toán.');
  });
  expect(screen.getByRole('alert')).toHaveTextContent(/Ban quản trị FamiDoc chưa hoàn tất chữ ký số/);
  expect(screen.getByRole('alert')).toHaveTextContent(/hồ sơ bác sĩ phải được xác minh/);
});

it('finds an active contract by UUID, checks each addendum and hides the old QR on change', async () => {
  const contractId = '60000000-0000-4000-8000-000000000a01';
  const firstId = '70000000-0000-4000-8000-000000000a01';
  const secondId = '70000000-0000-4000-8000-000000000a02';
  const addenda = [
    { id: firstId, addendumNumber: 'PL-001', additionalAmount: 50000 },
    { id: secondId, addendumNumber: 'PL-002', additionalAmount: 75000 },
  ].map((item) => ({ ...item, addendumType: 'MEMBER_EXTENSION', status: 'PENDING_PAYMENT', signedRoles: ['FAMILY_REP', 'ADMIN', 'HEALTHCARE_FACILITY', 'ASSIGNED_DOCTOR'] }));
  vi.mocked(paymentsApi.getAdminPaymentEligibility)
    .mockResolvedValueOnce({ eligible: true, blockingReasons: [] })
    .mockResolvedValueOnce({
      eligible: false, message: 'Phụ lục hợp đồng chưa đủ điều kiện thanh toán.',
      blockingReasons: ['DOCTOR_SIGNATURE_REQUIRED'],
    });
  vi.mocked(paymentsApi.createAdminPaymentRequest).mockResolvedValueOnce({
    id: 'invoice-id', contractId, addendumId: firstId, familyId: 'family-1', environment: 'TEST',
    attempt: 1, paymentCode: 'FD000043', transferContent: 'FD000043 THU PHU LUC',
    amountVnd: 50000, currency: 'VND', expectedAccountNumber: '0000000000',
    expectedGateway: 'TEST_BANK', status: 'PENDING', createdAt: '2026-11-17T12:00:00Z',
    expiresAt: '2026-11-17T12:15:00Z', paidAt: null, acceptedTransactionId: null,
  });
  render(<AdminPaymentRequestView />);
  await lookupContract({ ...pendingContract(contractId), status: 'ACTIVE', addenda });
  expect(paymentsApi.getAdminPaymentEligibility).not.toHaveBeenCalled();
  const select = screen.getByLabelText('Phụ lục cần thu *');
  fireEvent.change(select, { target: { value: firstId } });
  await screen.findByText('Đủ điều kiện tạo mã cho khoản này.');
  fireEvent.change(screen.getByLabelText('Nội dung chuyển khoản'), { target: { value: 'THU PHU LUC' } });
  fireEvent.change(screen.getByLabelText('Lý do tạo hoặc đổi mã'), { target: { value: 'Thu khoản bổ sung' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(await screen.findByText('FD000043 THU PHU LUC')).toBeInTheDocument();
  expect(paymentsApi.createAdminPaymentRequest).toHaveBeenCalledWith(expect.objectContaining({ addendumId: firstId, amountVnd: 50000 }));

  fireEvent.change(select, { target: { value: secondId } });
  expect(screen.queryByText('FD000043 THU PHU LUC')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Số tiền cần thu (VNĐ)')).toHaveValue(75000);
  expect(await screen.findByText(/Bác sĩ phụ trách chưa hoàn tất chữ ký số/)).toBeInTheDocument();
  expect(paymentsApi.getAdminPaymentEligibility).toHaveBeenLastCalledWith(contractId, secondId);
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(paymentsApi.createAdminPaymentRequest).toHaveBeenCalledTimes(1);
});

it('shows a lookup error and prevents issuing a request for an unknown UUID', async () => {
  vi.mocked(contractsApi.getMedicalContractById).mockRejectedValueOnce(new ApiError('Không tìm thấy hợp đồng.', 404));
  render(<AdminPaymentRequestView />);
  fireEvent.change(screen.getByLabelText('ID hợp đồng'), { target: { value: '60000000-0000-4000-8000-000000000039' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu hợp đồng' }));
  const lookupError = await screen.findByRole('alert');
  expect(lookupError).toHaveTextContent('Chưa tra cứu được hợp đồng. Không tìm thấy hợp đồng.');
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(paymentsApi.getAdminPaymentEligibility).not.toHaveBeenCalled();
  expect(paymentsApi.createAdminPaymentRequest).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('ID hợp đồng'), { target: { value: '' } });
  expect(lookupError).not.toBeInTheDocument();
});

it('only shows a retry button when the eligibility check loses its connection', async () => {
  const contract = pendingContract('60000000-0000-4000-8000-000000000040');
  vi.mocked(paymentsApi.getAdminPaymentEligibility).mockRejectedValueOnce(
    new ApiConnectionError('Không thể kết nối đến máy chủ lúc này. Vui lòng thử lại sau.'),
  );
  render(<AdminPaymentRequestView />);
  await lookupContract(contract);
  const retry = await screen.findByRole('button', { name: 'Kiểm tra lại' });
  expect(screen.queryByText(/Không thể kết nối đến máy chủ/)).not.toBeInTheDocument();
  fireEvent.click(retry);
  expect(await screen.findByText('Đủ điều kiện tạo mã cho khoản này.')).toBeInTheDocument();
  expect(screen.queryByText(/Chưa kiểm tra được điều kiện tạo mã/)).not.toBeInTheDocument();
});

it('allows looking up the same UUID again without displaying the connection alert', async () => {
  const contract = pendingContract('60000000-0000-4000-8000-000000000041');
  vi.mocked(contractsApi.getMedicalContractById)
    .mockRejectedValueOnce(new ApiConnectionError('Thiết bị đang ngoại tuyến. Hãy kết nối mạng rồi thử lại.'))
    .mockResolvedValueOnce(contract);
  render(<AdminPaymentRequestView />);
  fireEvent.change(screen.getByLabelText('ID hợp đồng'), { target: { value: contract.id } });
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu hợp đồng' }));
  const retry = await screen.findByRole('button', { name: 'Thử tra cứu lại' });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByLabelText('ID hợp đồng')).toHaveValue(contract.id);
  fireEvent.click(retry);
  expect(await screen.findByText('Đủ điều kiện tạo mã cho khoản này.')).toBeInTheDocument();
  expect(contractsApi.getMedicalContractById).toHaveBeenCalledTimes(2);
});

it('keeps the form and offers a retry if the issue request loses its connection', async () => {
  const contract = pendingContract('60000000-0000-4000-8000-000000000042');
  vi.mocked(paymentsApi.createAdminPaymentRequest).mockRejectedValueOnce(
    new ApiConnectionError('Không thể kết nối đến máy chủ lúc này. Vui lòng thử lại sau.'),
  );
  render(<AdminPaymentRequestView />);
  await lookupContract(contract);
  await screen.findByText('Đủ điều kiện tạo mã cho khoản này.');
  fireEvent.change(screen.getByLabelText('Nội dung chuyển khoản'), { target: { value: 'THU PHI' } });
  fireEvent.change(screen.getByLabelText('Lý do tạo hoặc đổi mã'), { target: { value: 'Kiểm thử thu tiền' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(await screen.findByRole('button', { name: 'Thử tạo mã lại' })).toBeEnabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Nội dung chuyển khoản')).toHaveValue('THU PHI');
  expect(paymentsApi.createAdminPaymentRequest).toHaveBeenCalledTimes(1);
});

it('suggests the main contract price, hides addenda and blocks a paid main contract', async () => {
  vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([{
    id: '60000000-0000-4000-8000-000000000030', contractNumber: 'HD-PAID', status: 'PENDING_PAYMENT', packageId: 'pkg-1', packageName: 'Gói đã ký', packagePrice: 150000, durationMonths: 1,
    familyId: 'family-1', familyRepresentativeName: 'Gia đình A', familyRepresentativePhone: '0901234567', familyRepresentativeEmail: 'a@example.invalid', createdAt: '2026-11-01', hasPaidContractInvoice: true, signatures: {},
  }]);
  render(<AdminPaymentRequestView />);
  fireEvent.change(await screen.findByLabelText('Hợp đồng cần thu'), { target: { value: '60000000-0000-4000-8000-000000000030' } });
  expect(screen.getByLabelText('Số tiền cần thu (VNĐ)')).toHaveValue(150000);
  expect(screen.queryByLabelText(/Phụ lục cần thu|ID phụ lục/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Nội dung chuyển khoản'), { target: { value: 'THU HOP DONG' } });
  fireEvent.change(screen.getByLabelText('Lý do tạo hoặc đổi mã'), { target: { value: 'Kiểm tra khoản đã thu' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tạo mã thu tiền' }));
  expect(screen.getByRole('alert')).toHaveTextContent('đã được ghi nhận thanh toán');
  expect(paymentsApi.createAdminPaymentRequest).not.toHaveBeenCalled();
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
