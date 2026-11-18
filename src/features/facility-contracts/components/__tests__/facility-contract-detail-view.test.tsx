import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FacilityContractDetailView } from '../facility-contract-detail-view';
import { contractsApi } from '@/lib/api/contracts.api';
import { FACILITY_GATE_REFRESH_EVENT } from '@/components/layout/facility-verification-gate';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/facility/contracts/ctr-b2b-002',
}));

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({ token, host }: { token: string; host?: string }) => (
    <div data-testid="mock-detail-documenso" data-token={token} data-host={host} />
  ),
}));

vi.mock('@/lib/api/contracts.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/contracts.api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getStaffingContractById: vi.fn(),
      signStaffingContract: vi.fn(),
      rejectStaffingContract: vi.fn(),
      getStaffingSigningSession: vi.fn(),
      syncStaffingDocumenso: vi.fn(),
      fetchStaffingSignedPdfBlobUrl: vi.fn(),
    },
  };
});

const draftRaw = {
  id: 'ctr-b2b-002',
  contractCode: 'HĐHT-2026-ND1-002',
  facilityId: 'fac-01',
  facilityName: 'Bệnh viện Nhi Đồng 1',
  facilityRevenueRate: 85,
  platformCommissionRate: 15,
  startDate: '2026-12-01T00:00:00.000Z',
  endDate: '2028-11-30T23:59:59.000Z',
  status: 'PENDING_SIGNATURE',
};

describe('FacilityContractDetailView (/facility/contracts/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error alert with retry button when getStaffingContractById fails, then loads on retry', async () => {
    vi.mocked(contractsApi.getStaffingContractById)
      .mockRejectedValueOnce(new Error('Không thể kết nối máy chủ B2B'))
      .mockResolvedValueOnce(draftRaw);

    render(<FacilityContractDetailView contractId="ctr-b2b-002" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Không thể kết nối máy chủ B2B');
    expect(contractsApi.getStaffingContractById).toHaveBeenCalledWith(
      'ctr-b2b-002',
      { throwOnError: true }
    );

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    expect(await screen.findByText('Số hiệu: HĐHT-2026-ND1-002')).toBeInTheDocument();
    expect(screen.getByText('Luật Giao dịch điện tử 20/2023/QH15')).toBeInTheDocument();
    expect(screen.getByText('Điều 1. Giải thích thuật ngữ')).toBeInTheDocument();
    expect(screen.getByText('Điều 10. Bất khả kháng, Giải quyết tranh chấp & Hiệu lực chung')).toBeInTheDocument();
    expect(screen.getByText('Không có thỏa thuận bổ sung nào khác.')).toBeInTheDocument();
    expect(contractsApi.getStaffingContractById).toHaveBeenCalledTimes(2);
  });

  it('renders TERMINATED state ahead of facilitySigned and shows rejectionReason', async () => {
    vi.mocked(contractsApi.getStaffingContractById).mockResolvedValueOnce({
      ...draftRaw,
      status: 'TERMINATED',
      facilitySigned: true,
      rejectionReason: 'Đề xuất điều chỉnh kỳ đối soát sang ngày 10.',
    });

    render(<FacilityContractDetailView contractId="ctr-b2b-002" />);

    expect(
      await screen.findByText('Hợp đồng đã từ chối / đang chờ điều chỉnh')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Đề xuất điều chỉnh kỳ đối soát sang ngày 10\./i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Tải bản PDF đã ký/i)).not.toBeInTheDocument();
  });

  it('renders active signedPdfUrl link and amber Bên A seal when adminSigned is false', async () => {
    vi.mocked(contractsApi.getStaffingContractById).mockResolvedValueOnce({
      ...draftRaw,
      status: 'ACTIVE',
      adminSigned: false,
      facilitySigned: true,
      signedPdfUrl: 'https://cdn.famidoc.vn/contracts/custom-signed.pdf',
    });

    render(<FacilityContractDetailView contractId="ctr-b2b-002" />);

    const pdfLink = await screen.findByRole('link', { name: /Tải bản PDF đã ký/i });
    expect(pdfLink).toHaveAttribute(
      'href',
      'https://cdn.famidoc.vn/contracts/custom-signed.pdf'
    );
    expect(screen.getByText('Chờ FamiDoc ký duyệt')).toBeInTheDocument();
  });

  it('renders Documenso embed for facility signing, syncs completion, and transitions to waiting for admin', async () => {
    vi.mocked(contractsApi.getStaffingContractById)
      .mockResolvedValueOnce({
        ...draftRaw,
        adminSigned: false,
        facilitySigned: false,
      })
      .mockResolvedValueOnce({
        ...draftRaw,
        status: 'PENDING_ADMIN_SIGNATURE',
        facilitySigned: true,
        adminSigned: false,
      });
    vi.mocked(contractsApi.getStaffingSigningSession).mockResolvedValue({
      contractId: 'ctr-b2b-002',
      contractCode: 'HĐHT-2026-ND1-002',
      status: 'PENDING_FACILITY_SIGNATURE',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-b2b-detail-1',
      signingUrl: 'https://sign.famidoc.online/sign/tok-b2b-detail-1',
      facilitySigned: false,
      adminSigned: false,
      signedPdfUrl: null,
    });
    vi.mocked(contractsApi.syncStaffingDocumenso).mockResolvedValueOnce({
      synced: true,
      contractId: 'ctr-b2b-002',
      status: 'PENDING_ADMIN_SIGNATURE',
      facilitySigned: true,
      adminSigned: false,
      signedPdfUrl: null,
    });

    render(<FacilityContractDetailView contractId="ctr-b2b-002" />);

    const gateListener = vi.fn();
    window.addEventListener(FACILITY_GATE_REFRESH_EVENT, gateListener);

    try {
      const embed = await screen.findByTestId('mock-detail-documenso');
      expect(embed).toHaveAttribute('data-token', 'tok-b2b-detail-1');

      fireEvent.click(screen.getByRole('button', { name: /Đồng bộ sau khi ký/i }));

      await waitFor(() => {
        expect(contractsApi.syncStaffingDocumenso).toHaveBeenCalledWith('ctr-b2b-002');
      });

      expect(
        await screen.findByText('Cơ sở y tế đã hoàn tất ký bước 1 — Chờ Admin ký kích hoạt')
      ).toBeInTheDocument();
      expect(screen.getByText('Chờ FamiDoc ký duyệt')).toBeInTheDocument();
      expect(gateListener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(FACILITY_GATE_REFRESH_EVENT, gateListener);
    }
  });

  it('hides proxy PDF download button when ACTIVE contract was signed via internal fallback (no documensoItemId)', async () => {
    vi.mocked(contractsApi.getStaffingContractById).mockResolvedValueOnce({
      ...draftRaw,
      status: 'ACTIVE',
      facilitySigned: true,
      adminSigned: true,
      documensoItemId: null,
      signedPdfUrl: null,
    });

    render(<FacilityContractDetailView contractId="ctr-b2b-002" />);

    expect(
      await screen.findByText('Hợp đồng Hợp tác B2B đang có hiệu lực')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tải bản PDF đã ký/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Tải bản PDF đã ký/i })).not.toBeInTheDocument();
  });

  it('enforces 5-500 char validation on reject dialog and clears reason when closed', async () => {
    vi.mocked(contractsApi.getStaffingContractById).mockResolvedValueOnce(draftRaw);
    vi.mocked(contractsApi.rejectStaffingContract).mockResolvedValueOnce({
      statusCode: 200,
    });

    render(<FacilityContractDetailView contractId="ctr-b2b-002" />);

    fireEvent.click(
      await screen.findByRole('button', { name: /Yêu cầu sửa điều khoản/i })
    );

    const textarea = await screen.findByLabelText(/Nội dung đề xuất/i);
    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'abc' } });
    expect(submitBtn).toBeDisabled();
    expect(
      screen.getByText('Vui lòng nhập tối thiểu 5 ký tự.')
    ).toBeInTheDocument();

    // Close and reopen: stale reason should be cleared
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    await waitFor(() => {
      expect(screen.queryByLabelText(/Nội dung đề xuất/i)).not.toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Yêu cầu sửa điều khoản/i })
    );
    const reopenedTextarea = await screen.findByLabelText(/Nội dung đề xuất/i);
    expect(reopenedTextarea).toHaveValue('');

    fireEvent.change(reopenedTextarea, {
      target: { value: 'Đề xuất điều chỉnh tỷ lệ 90/10' },
    });
    const enabledSubmit = screen.getByRole('button', { name: /Gửi yêu cầu/i });
    expect(enabledSubmit).toBeEnabled();
    fireEvent.click(enabledSubmit);

    await waitFor(() => {
      expect(contractsApi.rejectStaffingContract).toHaveBeenCalledWith(
        'ctr-b2b-002',
        'Đề xuất điều chỉnh tỷ lệ 90/10'
      );
    });
    expect(
      await screen.findByText('Hợp đồng đã từ chối / đang chờ điều chỉnh')
    ).toBeInTheDocument();
  });
});
