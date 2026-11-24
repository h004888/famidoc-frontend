import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminContractsView } from '../admin-contracts-view';
import { getPartySignatureMatrix } from '../contract-status-helpers';
import { contractsApi } from '@/lib/api';
import { facilitiesApi } from '@/lib/api/facilities.api';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: ({ token, host }: { token: string; host?: string }) => (
    <div data-testid="mock-admin-documenso-form" data-token={token} data-host={host} />
  ),
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getMedicalContracts: vi.fn(),
      getStaffingContracts: vi.fn(),
      createStaffingContract: vi.fn(),
      signStaffingContract: vi.fn(),
      getStaffingSigningSession: vi.fn(),
      syncStaffingDocumenso: vi.fn(),
      getSigningSession: vi.fn(),
      syncDocumenso: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/facilities.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/facilities.api')>();
  return {
    ...actual,
    facilitiesApi: {
      ...actual.facilitiesApi,
      getAdminFacilities: vi.fn(),
    },
  };
});

describe('AdminContractsView (Real API & Documenso Modal)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([
      {
        id: 'ct-real-001',
        contractNumber: 'CTR-2026-888',
        status: 'FAMILY_SIGNED',
        createdAt: '2026-04-10T09:00:00Z',
        packageId: 'pkg-1',
        packageName: 'Gói Chăm Sóc Gia Đình Tiêu Chuẩn',
        packagePrice: 5200000,
        durationMonths: 12,
        membersCount: 3,
        familyId: 'fam-1',
        familyRepresentativeName: 'Phạm Hoàng Minh',
        familyRepresentativePhone: '0909123456',
        facilityId: 'fac-1',
        facilityName: 'Phòng khám FamiCare Quận 3',
        doctorId: 'doc-1',
        doctorName: 'BS. Nguyễn Thị Lan',
        members: [],
        signatures: {
          family: {
            signedBy: 'Phạm Hoàng Minh',
            signerRole: 'FAMILY',
            signedAt: '2026-04-10T09:05:00Z',
            sha256Hash: 'Documenso-family',
          },
        },
      },
    ]);

    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValue({
      data: [
        {
          id: 'st-001',
          contractNumber: 'STAFF-2026-001',
          facilityName: 'Bệnh viện Đa khoa An Sinh',
          facilitySharePercent: 85,
          platformSharePercent: 15,
          validFrom: '2026-01-01T00:00:00Z',
          validTo: '2027-01-01T00:00:00Z',
          status: 'DRAFT',
          rawStatus: 'PENDING_ADMIN_SIGNATURE',
          adminSigned: false,
          facilitySigned: true,
        },
      ],
      total: 1,
    });
    vi.mocked(contractsApi.signStaffingContract).mockResolvedValue({ ok: true });

    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [
        {
          id: 'fac-1',
          facilityName: 'Phòng khám FamiCare Quận 3',
          representativeName: 'Nguyễn Văn An',
          phone: '0901112222',
          email: 'q3@famicare.vn',
          address: '123 Võ Văn Tần, Q3',
          status: 'ACTIVE',
          onboardingStatus: 'ACTIVE',
        },
        {
          id: 'fac-2',
          facilityName: 'Bệnh viện Đa khoa An Sinh',
          representativeName: 'Lê Thị Bình',
          phone: '0903334444',
          email: 'ansinh@hospital.vn',
          address: '10 Huỳnh Văn Bánh, PN',
          status: 'ACTIVE',
          onboardingStatus: 'ACTIVE',
        },
      ],
      total: 2,
    } as never);

    vi.mocked(contractsApi.getSigningSession).mockResolvedValue({
      contractId: 'ct-real-001',
      contractNumber: 'CTR-2026-888',
      contractStatus: 'PENDING_APPROVAL',
      signerRole: 'ADMIN',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-admin',
      signingUrl: 'https://sign.famidoc.online/sign/tok-admin',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });
  });

  it('loads real contracts from contractsApi.getMedicalContracts and links Ký xác nhận to /admin/contracts/[id]/review', async () => {
    render(<AdminContractsView />);

    await waitFor(() => {
      expect(contractsApi.getMedicalContracts).toHaveBeenCalledWith({ all: true });
      expect(screen.getAllByText(/CTR-2026-888/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Phạm Hoàng Minh').length).toBeGreaterThan(0);
    });

    const signLinks = screen.getAllByRole('link', { name: /Ký xác nhận/i });
    expect(signLinks[0]).toHaveAttribute('href', '/admin/contracts/ct-real-001/review');
  });

  it('displays cancelled badge for CANCELLED contracts without family signature', async () => {
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValueOnce([
      {
        id: 'ct-cancelled-001',
        contractNumber: 'CTR-2026-999',
        status: 'CANCELLED',
        createdAt: '2026-04-01T09:00:00Z',
        packageId: 'pkg-1',
        packageName: 'Gói Chăm Sóc Cơ Bản',
        packagePrice: 3200000,
        durationMonths: 12,
        membersCount: 2,
        familyId: 'fam-2',
        familyRepresentativeName: 'Trần Văn Bình',
        familyRepresentativePhone: '0912345678',
        facilityId: 'fac-1',
        facilityName: 'Phòng khám FamiCare Quận 3',
        members: [],
        signatures: {},
      },
    ]);

    render(<AdminContractsView />);

    await waitFor(() => {
      expect(screen.getAllByText(/CTR-2026-999/).length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Đã hủy / Hết hạn').length).toBeGreaterThan(0);
    expect(screen.queryByText('Chờ gia đình ký')).toBeNull();
  });

  it('links B2B Ký xác nhận directly to /admin/contracts/staffing/[id] page without modal', async () => {
    render(<AdminContractsView />);

    await waitFor(() => {
      expect(screen.getAllByText('STAFF-2026-001').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText('Lọc theo loại hợp đồng'), {
      target: { value: 'B2B' },
    });

    const signLink = screen.getAllByRole('link', { name: /Ký xác nhận/i })[0];
    expect(signLink).toHaveAttribute('href', '/admin/contracts/staffing/st-001');
  });

  it('supports keyboard navigation on facility combobox and closes listbox on Escape without closing Dialog', async () => {
    render(<AdminContractsView />);

    const createBtn = await screen.findByRole('button', { name: /Tạo HĐ B2B/i });
    fireEvent.click(createBtn);

    const combobox = await waitFor(() => {
      const el = screen.getAllByRole('combobox').find((c) => c.hasAttribute('aria-expanded'));
      if (!el) throw new Error('Combobox not found');
      return el;
    });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    // Open with ArrowDown
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Navigate with ArrowDown / ArrowUp and select with Enter
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    fireEvent.keyDown(combobox, { key: 'ArrowUp' });
    fireEvent.keyDown(combobox, { key: 'Enter' });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    // Reopen and press Escape: listbox closes while Dialog stays open
    fireEvent.keyDown(combobox, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(combobox, { key: 'Escape' });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays inline role="alert" error and disables submit button when validToDate <= validFromDate', async () => {
    render(<AdminContractsView />);

    const createBtn = await screen.findByRole('button', { name: /Tạo HĐ B2B/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      const el = screen.getAllByRole('combobox').find((c) => c.hasAttribute('aria-expanded'));
      if (!el) throw new Error('Combobox not found');
    });

    const startInput = screen.getByLabelText(/Ngày bắt đầu hiệu lực/i);
    const endInput = screen.getByLabelText(/Ngày kết thúc hiệu lực/i);

    fireEvent.change(startInput, { target: { value: '2026-12-01' } });
    fireEvent.change(endInput, { target: { value: '2026-12-01' } });

    const alertEl = screen.getByRole('alert');
    expect(alertEl).toHaveTextContent(/Ngày kết thúc hiệu lực phải sau ngày bắt đầu/i);
    expect(endInput).toHaveAttribute('aria-invalid', 'true');

    const submitBtn = screen.getByRole('button', { name: /Lưu & Gửi Dự Thảo/i });
    expect(submitBtn).toBeDisabled();
  });

  it('displays KPI 50-record scope note when 50 medical contracts are loaded', async () => {
    const fiftyContracts = Array.from({ length: 50 }, (_, idx) => ({
      id: `ct-${idx + 1}`,
      contractNumber: `CTR-2026-${String(idx + 1).padStart(3, '0')}`,
      status: 'FAMILY_SIGNED' as const,
      createdAt: '2026-04-10T09:00:00Z',
      packageId: 'pkg-1',
      packageName: 'Gói Chăm Sóc Gia Đình Tiêu Chuẩn',
      packagePrice: 5200000,
      durationMonths: 12,
      membersCount: 3,
      familyId: `fam-${idx + 1}`,
      familyRepresentativeName: `Chủ hộ ${idx + 1}`,
      familyRepresentativePhone: '0909123456',
      facilityId: 'fac-1',
      facilityName: 'Phòng khám FamiCare Quận 3',
      doctorId: 'doc-1',
      doctorName: 'BS. Nguyễn Thị Lan',
      members: [],
      signatures: {},
    }));
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValueOnce(fiftyContracts);

    render(<AdminContractsView />);

    await waitFor(() => {
      expect(screen.getByText(/Tổng hợp đồng/i).closest('button')).toHaveTextContent('51');
    });
  });

  it('ẩn nút "Ký xác nhận" và loại khỏi đếm/lọc READY_FOR_ADMIN khi documensoEnvelopeId === null', async () => {
    const legacyContract = {
      id: 'ct-legacy-null-env',
      contractNumber: 'CTR-2026-LEGACY',
      status: 'FAMILY_SIGNED' as const,
      createdAt: '2026-04-10T09:00:00Z',
      packageId: 'pkg-1',
      packageName: 'Gói Chăm Sóc Gia Đình Tiêu Chuẩn',
      packagePrice: 5200000,
      durationMonths: 12,
      membersCount: 3,
      familyId: 'fam-1',
      familyRepresentativeName: 'Nguyễn Văn Legacy',
      familyRepresentativePhone: '0909123456',
      facilityId: 'fac-1',
      facilityName: 'Phòng khám FamiCare Quận 3',
      doctorId: 'doc-1',
      doctorName: 'BS. Nguyễn Thị Lan',
      documensoEnvelopeId: null,
      members: [],
      signatures: {
        family: {
          signedBy: 'Nguyễn Văn Legacy',
          signerRole: 'FAMILY' as const,
          signedAt: '2026-04-10T09:05:00Z',
          sha256Hash: 'legacy-signature-hash',
        },
      },
    };

    expect(
      getPartySignatureMatrix(legacyContract).find((p) => p.key === 'D')?.isAdminTurn
    ).toBe(false);

    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValueOnce([legacyContract]);
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValueOnce({
      data: [],
      total: 0,
    });

    render(<AdminContractsView />);

    await waitFor(() => {
      expect(screen.getAllByText(/CTR-2026-LEGACY/).length).toBeGreaterThan(0);
    });

    expect(
      screen.queryByRole('button', { name: /Ký xác nhận/i })
    ).toBeNull();
    expect(
      screen.getAllByRole('link', { name: /Xem chi tiết/i }).length
    ).toBeGreaterThan(0);

    const readyFilterBtn = screen.getByRole('button', { name: /Chờ Admin ký/i });
    expect(readyFilterBtn).toHaveTextContent('0');
    fireEvent.click(readyFilterBtn);

    expect(screen.queryAllByText(/CTR-2026-LEGACY/)).toHaveLength(0);
    expect(screen.getByText(/Không có hợp đồng phù hợp/i)).toBeInTheDocument();
  });

  it('submits optional supplementary terms (contractTerms) when creating B2B contract in CreateB2BContractDialog', async () => {
    vi.mocked(contractsApi.createStaffingContract).mockResolvedValueOnce({
      id: 'st-new',
      contractCode: 'STF-2026-NEW1',
    });

    render(<AdminContractsView />);

    const createBtn = await screen.findByRole('button', { name: /Tạo HĐ B2B/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      const el = screen.getAllByRole('combobox').find((c) => c.hasAttribute('aria-expanded'));
      if (!el) throw new Error('Combobox not found');
    });

    const suppInput = screen.getByLabelText(/Điều khoản bổ sung \/ Thỏa thuận đặc thù/i);
    fireEvent.change(suppInput, {
      target: { value: 'Ưu tiên điều phối bác sĩ khu vực Quận 3.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Lưu & Gửi Dự Thảo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(contractsApi.createStaffingContract).toHaveBeenCalledWith(
        expect.objectContaining({
          facilityId: 'fac-1',
          facilityRevenueRate: 85,
          platformCommissionRate: 15,
          contractTerms: 'Ưu tiên điều phối bác sĩ khu vực Quận 3.',
        })
      );
    });
  });

  it('renders unified table with Loại filter, sort control, and B2B detail action', async () => {
    vi.mocked(contractsApi.getStaffingContracts).mockResolvedValueOnce({
      data: [
        {
          id: 'st-100',
          contractNumber: 'STAFF-2026-100',
          facilityName: 'Bệnh viện Quốc tế A',
          facilitySharePercent: 80,
          platformSharePercent: 20,
          validFrom: '2026-01-01T00:00:00Z',
          validTo: '2027-01-01T00:00:00Z',
          status: 'DRAFT',
          rawStatus: 'PENDING_ADMIN_SIGNATURE',
          adminSigned: false,
          facilitySigned: true,
        },
        {
          id: 'st-200',
          contractNumber: 'STAFF-2026-200',
          facilityName: 'Phòng khám Đa khoa B',
          facilitySharePercent: 90,
          platformSharePercent: 10,
          validFrom: '2026-02-01T00:00:00Z',
          validTo: '2026-06-01T00:00:00Z',
          status: 'ACTIVE',
          rawStatus: 'ACTIVE',
          adminSigned: true,
          facilitySigned: true,
        },
      ],
      total: 2,
    });

    render(<AdminContractsView />);

    await waitFor(() => {
      expect(screen.getAllByText('STAFF-2026-100').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByLabelText('Lọc theo loại hợp đồng'), {
      target: { value: 'B2B' },
    });

    expect(screen.getByLabelText('Sắp xếp hợp đồng')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^Xem chi tiết$/i }).length).toBeGreaterThan(0);
  });

  it('excludes PENDING_FACILITY_SIGNATURE and REVISION_REQUESTED from READY_FOR_ADMIN filter', async () => {
    const { matchesStaffingStatusFilter } = await import('../contract-status-helpers');

    expect(
      matchesStaffingStatusFilter(
        {
          id: 'st-pfs',
          contractNumber: 'STF-1',
          facilityName: 'CSYT A',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-01-01',
          validTo: '2027-01-01',
          status: 'DRAFT',
          rawStatus: 'PENDING_FACILITY_SIGNATURE',
          facilitySigned: false,
          adminSigned: false,
        },
        'READY_FOR_ADMIN'
      )
    ).toBe(false);

    expect(
      matchesStaffingStatusFilter(
        {
          id: 'st-rev',
          contractNumber: 'STF-2',
          facilityName: 'CSYT A',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-01-01',
          validTo: '2027-01-01',
          status: 'DRAFT',
          rawStatus: 'REVISION_REQUESTED',
          facilitySigned: false,
          adminSigned: false,
        },
        'READY_FOR_ADMIN'
      )
    ).toBe(false);

    expect(
      matchesStaffingStatusFilter(
        {
          id: 'st-pas',
          contractNumber: 'STF-3',
          facilityName: 'CSYT A',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-01-01',
          validTo: '2027-01-01',
          status: 'DRAFT',
          rawStatus: 'PENDING_ADMIN_SIGNATURE',
          facilitySigned: true,
          adminSigned: false,
        },
        'READY_FOR_ADMIN'
      )
    ).toBe(true);
  });
});
