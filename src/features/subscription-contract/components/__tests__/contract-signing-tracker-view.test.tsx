import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractSigningTrackerView } from '../contract-signing-tracker-view';
import { contractsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  contractsApi: {
    getMedicalContractById: vi.fn().mockResolvedValue({
      id: 'FMD-2026-REGR821',
      status: 'DOCTOR_ACCEPTED',
    }),
  },
}));

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

describe('Màn 7: ContractSigningTrackerView (Stepper theo dõi tiến độ ký kết 4 bên)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('renders 5-step stepper and contract metadata', () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          packageName: 'Gói Toàn Diện Gia Đình (12 Tháng)',
          packagePrice: '9.600.000 đ',
          facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
          doctorName: 'BS. CKII Lê Hoàng Nam',
          status: 'FAMILY_SIGNED',
        }}
      />
    );

    // Contract details
    expect(screen.getByText(/FMD-2026-REGR821/i)).toBeInTheDocument();
    expect(screen.getByText(/Gói Toàn Diện Gia Đình \(12 Tháng\)/i)).toBeInTheDocument();
    expect(screen.getByText(/9\.600\.000 đ/i)).toBeInTheDocument();

    // 5 Steps in the Stepper
    expect(screen.getByText(/1\. Gia đình ký số/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Nền tảng ký duyệt/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. CSYT phân công & ký/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Bác sĩ ký chấp thuận/i)).toBeInTheDocument();
    expect(screen.getByText(/5\. Thanh toán & Kích hoạt/i)).toBeInTheDocument();
  });

  it('correctly marks current step when status is FAMILY_SIGNED', () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'FAMILY_SIGNED',
        }}
      />
    );

    // Step 1 completed, Step 2 is in progress/current
    expect(screen.getByTestId('step-1')).toHaveAttribute('data-step-status', 'completed');
    expect(screen.getByTestId('step-2')).toHaveAttribute('data-step-status', 'current');
    expect(screen.getByTestId('step-3')).toHaveAttribute('data-step-status', 'pending');
    expect(screen.getByTestId('step-4')).toHaveAttribute('data-step-status', 'pending');
    expect(screen.getByTestId('step-5')).toHaveAttribute('data-step-status', 'pending');
  });

  it('correctly marks current step when status is FACILITY_ASSIGNED', () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'FACILITY_ASSIGNED',
        }}
      />
    );

    // Steps 1, 2, 3 completed; Step 4 is current
    expect(screen.getByTestId('step-1')).toHaveAttribute('data-step-status', 'completed');
    expect(screen.getByTestId('step-2')).toHaveAttribute('data-step-status', 'completed');
    expect(screen.getByTestId('step-3')).toHaveAttribute('data-step-status', 'completed');
    expect(screen.getByTestId('step-4')).toHaveAttribute('data-step-status', 'current');
    expect(screen.getByTestId('step-5')).toHaveAttribute('data-step-status', 'pending');
  });

  it('displays VietQR payment button when contract reaches DOCTOR_ACCEPTED or PENDING_PAYMENT', () => {
    const handleProceedPayment = vi.fn();
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'DOCTOR_ACCEPTED',
          packagePrice: '9.600.000 đ',
        }}
        onProceedPayment={handleProceedPayment}
      />
    );

    // Steps 1..4 completed, Step 5 is current
    expect(screen.getByTestId('step-4')).toHaveAttribute('data-step-status', 'completed');
    expect(screen.getByTestId('step-5')).toHaveAttribute('data-step-status', 'current');

    // Shows VietQR action callout
    const payBtn = screen.getByRole('button', { name: /Thanh toán VietQR/i });
    expect(payBtn).toBeInTheDocument();

    fireEvent.click(payBtn);
    expect(handleProceedPayment).toHaveBeenCalled();
  });

  it('calls contractsApi.getMedicalContractById when refresh button is clicked', async () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'FAMILY_SIGNED',
        }}
      />
    );

    const refreshBtn = screen.getByRole('button', { name: /Cập nhật tiến độ/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(contractsApi.getMedicalContractById).toHaveBeenCalledWith('FMD-2026-REGR821');
    });
  });

  it('displays active contract status and link when status is ACTIVE', () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'ACTIVE',
        }}
      />
    );

    // All steps completed
    expect(screen.getByTestId('step-5')).toHaveAttribute('data-step-status', 'completed');
    expect(screen.getByText(/Hợp đồng đang có hiệu lực pháp lý/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem bản sao hợp đồng/i })).toHaveAttribute(
      'href',
      '/family/subscription/contract'
    );
  });

  it('standardizes typography without font-mono, font-black, or font-extrabold and has tabular-nums', () => {
    const { container } = render(<ContractSigningTrackerView />);
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });
});
