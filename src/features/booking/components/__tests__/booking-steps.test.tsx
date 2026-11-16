import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BookingSummaryStep } from '../booking-summary-step';
import { BookingTrackingStep } from '../booking-tracking-step';
import { BookingPaymentStep } from '../booking-payment-step';
import { contractsApi } from '@/lib/api/contracts.api';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/subscription-contract/components/doctor-contract-initiation-panel', () => ({
  DoctorContractInitiationPanel: ({
    packageId,
    doctorId,
    facilityId,
    contractId,
    requestedMembers,
    trackingPath,
  }: {
    packageId?: string;
    doctorId?: string;
    facilityId?: string;
    contractId?: string;
    requestedMembers: number;
    trackingPath?: string;
  }) => (
    <div
      data-testid="initiation-panel"
      data-package-id={packageId ?? ''}
      data-doctor-id={doctorId ?? ''}
      data-facility-id={facilityId ?? ''}
      data-contract-id={contractId ?? ''}
      data-members={requestedMembers}
      data-tracking-path={trackingPath ?? ''}
    />
  ),
}));

vi.mock('@/features/subscription-contract/components/contract-signing-tracker-view', () => ({
  ContractSigningTrackerView: ({
    contractId,
    backHref,
    onProceedPayment,
  }: {
    contractId?: string;
    backHref?: string;
    onProceedPayment?: () => void;
  }) => (
    <div data-testid="tracker-view" data-contract-id={contractId ?? ''} data-back-href={backHref ?? ''}>
      <button type="button" onClick={() => onProceedPayment?.()}>
        Thanh toán VietQR ngay
      </button>
    </div>
  ),
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    createVietQRPayment: vi.fn(),
    getPaymentStatus: vi.fn(),
    getFamilyGateStatus: vi.fn(),
    getMedicalContractDetail: vi.fn(),
  },
}));

const pendingPayment = {
  id: 'pay-1',
  contractId: 'ctr-1',
  familyId: 'fam-1',
  environment: 'TEST' as const,
  attempt: 1,
  paymentCode: 'FMD-PAY-0001',
  transferContent: 'FMD PAY 0001',
  amountVnd: 9600000,
  currency: 'VND' as const,
  qrUrl: null,
  expectedAccountNumber: '882190068688',
  expectedGateway: 'MBBANK',
  status: 'PENDING' as const,
  createdAt: '2026-11-15T00:00:00.000Z',
  expiresAt: '2026-11-15T00:15:00.000Z',
  paidAt: null,
  acceptedTransactionId: null,
};

describe('BookingSummaryStep', () => {
  it('render panel khởi tạo hợp đồng với đúng ngữ cảnh và trackingPath /booking/tracking', () => {
    render(
      <BookingSummaryStep
        packageId="pkg-1"
        doctorId="doc-1"
        facilityId="fac-1"
        requestedMembers={3}
      />
    );

    const panel = screen.getByTestId('initiation-panel');
    expect(panel).toHaveAttribute('data-package-id', 'pkg-1');
    expect(panel).toHaveAttribute('data-doctor-id', 'doc-1');
    expect(panel).toHaveAttribute('data-facility-id', 'fac-1');
    expect(panel).toHaveAttribute('data-members', '3');
    expect(panel).toHaveAttribute('data-tracking-path', '/booking/tracking');
  });

  it('hướng dẫn về /doctors khi thiếu tham số bắt buộc', () => {
    render(<BookingSummaryStep packageId="pkg-1" doctorId="doc-1" />);

    expect(screen.queryByTestId('initiation-panel')).toBeNull();
    expect(screen.getByTestId('booking-missing-context')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chọn bác sĩ/i })).toHaveAttribute('href', '/doctors');
  });

  it('nhận và truyền contractId xuống panel khi quay lại Bước 1 từ Bước 2/3', () => {
    render(<BookingSummaryStep contractId="ctr-77" />);

    const panel = screen.getByTestId('initiation-panel');
    expect(panel).toHaveAttribute('data-contract-id', 'ctr-77');
    expect(panel).toHaveAttribute('data-tracking-path', '/booking/tracking');
    expect(screen.queryByTestId('booking-missing-context')).toBeNull();
  });
});

describe('BookingTrackingStep', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'PENDING_APPROVAL',
    } as never);
  });

  it('dùng ContractSigningTrackerView với nút thanh toán trỏ tới /booking/payment', async () => {
    render(<BookingTrackingStep contractId="ctr-1" />);

    expect(screen.getByTestId('tracker-view')).toHaveAttribute('data-contract-id', 'ctr-1');
    expect(screen.getByTestId('booking-back-to-step-1')).toHaveAttribute(
      'href',
      '/booking?contractId=ctr-1'
    );
    await waitFor(() => {
      expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledWith('ctr-1');
    });
    screen.getByRole('button', { name: /Thanh toán VietQR ngay/i }).click();
    expect(pushMock).toHaveBeenCalledWith('/booking/payment?contractId=ctr-1');
  });

  it('ẩn nút quay lại Bước 1 khi hợp đồng đã ACTIVE', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'ACTIVE',
    } as never);

    render(<BookingTrackingStep contractId="ctr-1" />);

    await waitFor(() => {
      expect(screen.queryByTestId('booking-back-to-step-1')).toBeNull();
    });
  });

  it('không gọi dữ liệu mẫu khi thiếu contractId', () => {
    render(<BookingTrackingStep />);

    expect(screen.queryByTestId('tracker-view')).toBeNull();
    expect(screen.getByTestId('booking-tracking-missing-contract')).toBeInTheDocument();
  });
});

describe('BookingPaymentStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue(pendingPayment as never);
  });

  it('hiển thị trạng thái chờ thanh toán VietQR theo contractId và nút quay lại Bước 2', async () => {
    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-pending')).toBeInTheDocument();
    expect(screen.getByTestId('booking-back-to-step-2')).toHaveAttribute(
      'href',
      '/booking/tracking?contractId=ctr-1'
    );
    expect(contractsApi.createVietQRPayment).toHaveBeenCalledWith('ctr-1');
    expect(screen.getByText('FMD PAY 0001')).toBeInTheDocument();
    expect(screen.getByText('9.600.000 đ')).toBeInTheDocument();
  });

  it('hiển thị màn hình chúc mừng kèm CTA Dashboard khi hợp đồng ACTIVE', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      status: 'PAID',
    } as never);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-success')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Thêm hồ sơ thành viên/i })).toHaveAttribute(
      'href',
      '/family/members'
    );
    expect(screen.getByRole('link', { name: /Vào Bảng điều khiển Gia đình/i })).toHaveAttribute(
      'href',
      '/family'
    );
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'famidoc:family-gate-refresh' }));
  });

  it('không gọi API khi thiếu contractId', async () => {
    render(<BookingPaymentStep />);

    await waitFor(() => {
      expect(screen.getByTestId('booking-payment-missing-contract')).toBeInTheDocument();
    });
    expect(contractsApi.createVietQRPayment).not.toHaveBeenCalled();
  });

  it('chuyển sang màn hình chúc mừng khi createVietQRPayment lỗi nhưng hợp đồng đã ACTIVE', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new Error('Contract is not pending')
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'ACTIVE',
    } as never);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-success')).toBeInTheDocument();
    expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledWith('ctr-1');
    expect(screen.getByRole('link', { name: /Vào Bảng điều khiển Gia đình/i })).toHaveAttribute(
      'href',
      '/family'
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'famidoc:family-gate-refresh' })
    );
  });

  it('hiển thị nút quay lại /booking/tracking khi hợp đồng chưa đủ 4 chữ ký', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new Error('Contract is not ready for payment')
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'PENDING_APPROVAL',
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-error')).toBeInTheDocument();
    expect(
      screen.getByText(/chưa hoàn tất đủ 4 chữ ký số trên Documenso/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Quay lại theo dõi ký 4 bên/i })
    ).toHaveAttribute('href', '/booking/tracking?contractId=ctr-1');
  });
});
