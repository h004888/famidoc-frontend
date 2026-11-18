import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { FacilityContractsView } from '../facility-contracts-view';
import { contractsApi } from '@/lib/api/contracts.api';
import { facilitiesApi } from '@/lib/api/facilities.api';

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({ token, host }: { token: string; host?: string }) => (
    <div data-testid="mock-facility-b2b-documenso" data-token={token} data-host={host} />
  ),
}));

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getMyFacilityProfile: vi.fn().mockResolvedValue({
      facilityName: 'Bệnh viện Nhi Đồng 1',
    }),
  },
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getStaffingContracts: vi.fn(),
    signStaffingContract: vi.fn(),
    rejectStaffingContract: vi.fn(),
    getStaffingSigningSession: vi.fn(),
    syncStaffingDocumenso: vi.fn(),
    fetchStaffingSignedPdfBlobUrl: vi.fn(),
  },
}));

const draftContract = {
  id: 'ctr-b2b-002',
  contractNumber: 'HĐHT-2026-ND1-002',
  facilityName: 'Bệnh viện Nhi Đồng 1',
  platformSharePercent: 15,
  facilitySharePercent: 85,
  validFrom: '2026-12-01T00:00:00.000Z',
  validTo: '2028-11-30T23:59:59.000Z',
  status: 'DRAFT' as const,
  adminSigned: true,
  facilitySigned: false,
  contractTerms: 'Điều khoản hợp tác B2B.',
};

const activeContract = {
  id: 'ctr-b2b-001',
  contractNumber: 'HĐHT-2024-ND1-001',
  facilityName: 'Bệnh viện Nhi Đồng 1',
  platformSharePercent: 18,
  facilitySharePercent: 82,
  validFrom: '2024-12-01T00:00:00.000Z',
  validTo: '2026-11-30T23:59:59.000Z',
  status: 'ACTIVE' as const,
  adminSigned: true,
  facilitySigned: true,
  contractTerms: 'Điều khoản hợp tác B2B.',
};

describe('FacilityContractsView (/facility/contracts — B2B Only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders facility-b2b-summary-card for single draft contract without history table, 4-party tab, or Reset Demo', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [draftContract],
      total: 1,
    });

    const { container } = render(<FacilityContractsView />);

    const summaryCard = await screen.findByTestId('facility-b2b-summary-card');
    expect(contractsApi.getStaffingContracts).toHaveBeenCalledWith(
      { limit: 50 },
      { throwOnError: true }
    );
    expect(summaryCard).toBeInTheDocument();
    expect(within(summaryCard).getByText('HĐHT-2026-ND1-002')).toBeInTheDocument();
    expect(within(summaryCard).getByText(/85% CSYT \/ 15% FamiDoc/i)).toBeInTheDocument();
    expect(within(summaryCard).getByText(/Ngày 05 hằng tháng/i)).toBeInTheDocument();

    const detailCta = within(summaryCard).getByRole('link', {
      name: /Xem chi tiết & Ký số/i,
    });
    expect(detailCta).toHaveAttribute('href', '/facility/contracts/ctr-b2b-002');

    // No history table for 1 record
    expect(screen.queryByTestId('facility-b2b-history')).not.toBeInTheDocument();

    // No legacy 4-party tabs, Reset Demo, or /facility/staff links
    expect(screen.queryByText(/Reset Demo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hợp Đồng Y Tế 4 Bên/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Flow 2\.1|SCR-22|BR-04/i)).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/facility/staff"]')).toBeNull();
    expect(container.querySelector('a[href="/facility/doctors"]')).not.toBeNull();

    // No typography violations
    expect(container.innerHTML).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
  });

  it('renders conditional history table below summary card when more than 1 B2B contract exists', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [draftContract, activeContract],
      total: 2,
    });

    render(<FacilityContractsView />);

    await screen.findByTestId('facility-b2b-summary-card');
    const historySection = screen.getByTestId('facility-b2b-history');
    expect(historySection).toBeInTheDocument();
    expect(within(historySection).getAllByText('HĐHT-2026-ND1-002').length).toBeGreaterThan(0);
    expect(within(historySection).getAllByText('HĐHT-2024-ND1-001').length).toBeGreaterThan(0);
  });

  it('renders centered Vietnamese empty card when getStaffingContracts returns empty array', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [],
      total: 0,
    });

    render(<FacilityContractsView />);

    const emptyCard = await screen.findByTestId('facility-b2b-empty-state');
    expect(emptyCard).toBeInTheDocument();
    expect(
      within(emptyCard).getByText('Chưa có dự thảo Hợp đồng Hợp tác B2B')
    ).toBeInTheDocument();
    expect(screen.queryByText(/An Sinh/i)).not.toBeInTheDocument();
  });

  it('surfaces Vietnamese error alert with retry button and no fake fallback when API fails', async () => {
    vi.mocked(contractsApi.getStaffingContracts)
      .mockRejectedValueOnce(new Error('Kết nối máy chủ gián đoạn'))
      .mockResolvedValueOnce({ data: [activeContract], total: 1 });

    render(<FacilityContractsView />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Kết nối máy chủ gián đoạn/i);
    expect(screen.queryByText(/An Sinh/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(screen.getByTestId('facility-b2b-summary-card')).toBeInTheDocument();
    });
    expect(contractsApi.getStaffingContracts).toHaveBeenCalledTimes(2);
  });

  it('opens Documenso sequential signing dialog for B2B contract and syncs completion', async () => {
    vi.mocked(contractsApi.getStaffingContracts)
      .mockResolvedValueOnce({
        data: [draftContract],
        total: 1,
      })
      .mockResolvedValue({
        data: [{ ...draftContract, rawStatus: 'PENDING_ADMIN_SIGNATURE', facilitySigned: true, adminSigned: false }],
        total: 1,
      });
    vi.mocked(contractsApi.getStaffingSigningSession).mockResolvedValue({
      contractId: 'ctr-b2b-002',
      contractCode: 'HĐHT-2026-ND1-002',
      status: 'PENDING_FACILITY_SIGNATURE',
      signerRole: 'HEALTHCARE_FACILITY',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-b2b-fac-1',
      signingUrl: 'https://sign.famidoc.online/sign/tok-b2b-fac-1',
      facilitySigned: false,
      adminSigned: false,
      signedPdfUrl: null,
    });
    vi.mocked(contractsApi.syncStaffingDocumenso).mockResolvedValue({
      synced: true,
      contractId: 'ctr-b2b-002',
      status: 'PENDING_ADMIN_SIGNATURE',
      facilitySigned: true,
      adminSigned: false,
      signedPdfUrl: null,
    });

    render(<FacilityContractsView />);

    await screen.findByTestId('facility-b2b-summary-card');
    fireEvent.click(screen.getByRole('button', { name: /Ký số \(Documenso\)/i }));

    expect(
      await screen.findByText(/Ký Hợp Đồng B2B Trên Documenso — Cơ sở Y tế/i)
    ).toBeInTheDocument();

    const embed = await screen.findByTestId('mock-facility-b2b-documenso');
    expect(embed).toHaveAttribute('data-token', 'tok-b2b-fac-1');

    fireEvent.click(screen.getByRole('button', { name: /Đồng bộ sau khi ký/i }));

    await waitFor(() => {
      expect(contractsApi.syncStaffingDocumenso).toHaveBeenCalledWith('ctr-b2b-002');
    });

    expect(await screen.findByText('Đã ký · Chờ Admin ký')).toBeInTheDocument();
  });

  it('allows requesting revision via shadcn Dialog with 5-char validation and renders REVISION_REQUESTED banner', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [draftContract],
      total: 1,
    });
    vi.mocked(contractsApi.rejectStaffingContract).mockResolvedValue({ statusCode: 200 });

    render(<FacilityContractsView />);

    await screen.findByTestId('facility-b2b-summary-card');
    fireEvent.click(screen.getByRole('button', { name: /Yêu cầu sửa điều khoản/i }));

    const reasonInput = await screen.findByLabelText(/Nội dung đề xuất/i);
    const submitBtn = screen.getByRole('button', { name: /Gửi yêu cầu đàm phán/i });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(reasonInput, { target: { value: 'abc' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(reasonInput, {
      target: { value: 'Đề xuất điều chỉnh tỷ lệ phân chia 90/10.' },
    });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contractsApi.rejectStaffingContract).toHaveBeenCalledWith(
        'ctr-b2b-002',
        'Đề xuất điều chỉnh tỷ lệ phân chia 90/10.'
      );
    });

    expect(
      await screen.findByText(/Đã gửi yêu cầu sửa/i)
    ).toBeInTheDocument();
    const terminatedBanner = screen.getByTestId('facility-b2b-terminated-banner');
    expect(terminatedBanner).toHaveTextContent(
      /Đề xuất điều chỉnh tỷ lệ phân chia 90\/10\./i
    );
    expect(
      screen.queryByRole('button', { name: /Ký số \(Documenso\)/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Yêu cầu sửa điều khoản/i })
    ).not.toBeInTheDocument();
  });
});
