import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractSigningTrackerView } from '../contract-signing-tracker-view';
import { contractsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  contractsApi: {
    getMedicalContractDetail: vi.fn(),
    getSigningSession: vi.fn(),
    syncDocumenso: vi.fn(),
  },
}));

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({
    token,
    onDocumentCompleted,
  }: {
    token: string;
    onDocumentCompleted?: () => void;
  }) => (
    <div data-testid="mock-tracker-documenso-form" data-token={token}>
      <button type="button" onClick={() => onDocumentCompleted?.()}>
        Ký xong
      </button>
    </div>
  ),
}));

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

const detailDto = (overrides: Record<string, unknown> = {}) => ({
  id: 'FMD-2026-REGR821',
  contractNumber: 'MC2026TEST01',
  contractStatus: 'PENDING_PAYMENT',
  totalAmount: '9600000.00',
  memberCount: 4,
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2026-12-31T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  facility: { facilityName: 'Bệnh viện Đại học Y Dược TP.HCM' },
  doctor: { user: { fullName: 'BS. Trần Thanh Mai' } },
  servicePackage: { packageName: 'Gói Toàn Diện Gia Đình (12 Tháng)' },
  ...overrides,
});

describe('ContractSigningTrackerView (Luồng Documenso 2 pha & Thanh toán)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue(
      detailDto() as never
    );
    vi.mocked(contractsApi.getSigningSession).mockResolvedValue({
      contractId: 'FMD-2026-REGR821',
      contractNumber: 'MC2026TEST01',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'FAMILY_REP',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-ben-a',
      signingUrl: 'https://sign.famidoc.online/sign/tok-ben-a',
      signedRoles: [],
      signedPdfUrl: null,
    });
  });

  it('hiển thị quy trình 2 pha (Bên A trước -> B/C/D song song) và thông tin hợp đồng', () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          packageName: 'Gói Toàn Diện Gia Đình (12 Tháng)',
          packagePrice: '9.600.000 đ',
          facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
          doctorName: 'BS. CKII Lê Hoàng Nam',
          status: 'FAMILY_SIGNED',
          signedRoles: ['FAMILY_REP', 'ASSIGNED_DOCTOR'],
        }}
      />
    );

    expect(screen.getByText(/FMD-2026-REGR821/i)).toBeInTheDocument();
    expect(screen.getByText(/Gói Toàn Diện Gia Đình \(12 Tháng\)/i)).toBeInTheDocument();
    expect(screen.getByText(/9\.600\.000 đ/i)).toBeInTheDocument();
    expect(screen.getByTestId('phase-1-family')).toHaveAttribute(
      'data-phase-status',
      'completed'
    );
    expect(screen.getByTestId('phase-2-parallel')).toHaveAttribute(
      'data-phase-status',
      'current'
    );
    expect(screen.getByTestId('party-status-ASSIGNED_DOCTOR')).toHaveAttribute(
      'data-signed',
      'true'
    );
    expect(screen.getByTestId('party-status-HEALTHCARE_FACILITY')).toHaveAttribute(
      'data-signed',
      'false'
    );
  });

  it('nhúng Documenso ngay khi Bên A chưa ký xong (PENDING_APPROVAL) và đồng bộ sau khi hoàn tất', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail)
      .mockResolvedValueOnce(
        detailDto({
          contractStatus: 'PENDING_APPROVAL',
          signatures: [],
        }) as never
      )
      .mockResolvedValueOnce(
        detailDto({
          contractStatus: 'PENDING_APPROVAL',
          signatures: [
            { signerRole: 'FAMILY_REP', signerUserId: 'u1', signedAt: '2026-11-13T10:00:00Z' },
          ],
        }) as never
      );
    vi.mocked(contractsApi.syncDocumenso).mockResolvedValueOnce({
      synced: true,
      contractId: 'FMD-2026-REGR821',
      contractStatus: 'PENDING_APPROVAL',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });

    render(<ContractSigningTrackerView contractId="FMD-2026-REGR821" />);

    const form = await screen.findByTestId('mock-tracker-documenso-form');
    expect(form).toHaveAttribute('data-token', 'tok-ben-a');

    fireEvent.click(screen.getByRole('button', { name: /Ký xong/i }));

    await waitFor(() => {
      expect(contractsApi.syncDocumenso).toHaveBeenCalledWith('FMD-2026-REGR821');
      expect(screen.getByTestId('phase-1-family')).toHaveAttribute(
        'data-phase-status',
        'completed'
      );
    });
  });

  it('hiển thị nút Thanh toán VietQR khi đủ 4/4 chữ ký (PENDING_PAYMENT)', () => {
    const handleProceedPayment = vi.fn();
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'PENDING_PAYMENT',
          packagePrice: '9.600.000 đ',
        }}
        onProceedPayment={handleProceedPayment}
      />
    );

    expect(screen.getByTestId('phase-2-parallel')).toHaveAttribute(
      'data-phase-status',
      'completed'
    );
    expect(screen.getByTestId('phase-3-payment')).toHaveAttribute(
      'data-phase-status',
      'current'
    );

    const payBtn = screen.getByRole('button', { name: /Thanh toán VietQR/i });
    fireEvent.click(payBtn);
    expect(handleProceedPayment).toHaveBeenCalled();
  });

  it('điều hướng nút thanh toán mặc định tới /booking/payment?contractId=<id>', () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'PENDING_PAYMENT',
          packagePrice: '9.600.000 đ',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Thanh toán VietQR/i }));
    expect(mockPush).toHaveBeenCalledWith('/booking/payment?contractId=FMD-2026-REGR821');
  });

  it('gọi contractsApi.getMedicalContractDetail khi bấm Cập nhật tiến độ', async () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          status: 'FAMILY_SIGNED',
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cập nhật tiến độ/i }));

    await waitFor(() => {
      expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledWith('FMD-2026-REGR821');
    });
  });

  it('hiển thị trạng thái ACTIVE cùng liên kết tới /family/members và bản sao hợp đồng', () => {
    render(
      <ContractSigningTrackerView
        contract={{
          id: 'FMD-2026-REGR821',
          memberCount: 4,
          status: 'ACTIVE',
        }}
      />
    );

    expect(screen.getByTestId('phase-3-payment')).toHaveAttribute(
      'data-phase-status',
      'completed'
    );
    expect(screen.getByText(/Hợp đồng đang có hiệu lực pháp lý/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Quản lý thành viên/i })).toHaveAttribute(
      'href',
      '/family/members'
    );
    expect(screen.getByRole('link', { name: /Xem bản sao hợp đồng/i })).toHaveAttribute(
      'href',
      '/family/subscription/contract'
    );
  });

  it('tuân thủ chuẩn typography không dùng font-mono/black/extrabold và có tabular-nums', () => {
    const { container } = render(
      <ContractSigningTrackerView
        contract={{ id: 'FMD-2026-REGR821', status: 'FAMILY_SIGNED' }}
      />
    );
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    expect(container.innerHTML).toContain('tabular-nums');
  });

  it('hiển thị lỗi có thể thấy được khi tải hợp đồng thất bại', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockRejectedValue(
      Object.assign(new Error('Not found'), { status: 404 })
    );

    render(<ContractSigningTrackerView contractId="missing-contract" />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Không tìm thấy hợp đồng này/i)
    ).toBeInTheDocument();
  });

  it('hiển thị trạng thái trống khi không có contractId', () => {
    render(<ContractSigningTrackerView />);

    expect(screen.getByText(/Chưa có hợp đồng để theo dõi/i)).toBeInTheDocument();
    expect(contractsApi.getMedicalContractDetail).not.toHaveBeenCalled();
  });
});
