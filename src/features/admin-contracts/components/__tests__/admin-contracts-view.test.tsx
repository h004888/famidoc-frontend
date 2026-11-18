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

  it('loads real contracts from contractsApi.getMedicalContracts and opens Documenso modal for Bên D signing', async () => {
    render(<AdminContractsView />);

    await waitFor(() => {
      expect(contractsApi.getMedicalContracts).toHaveBeenCalledWith({ limit: 50 });
      expect(screen.getAllByText(/CTR-2026-888/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Phạm Hoàng Minh').length).toBeGreaterThan(0);
    });

    const signBtn = screen.getAllByRole('button', { name: /Ký trên Documenso/i })[0];
    fireEvent.click(signBtn);

    await waitFor(() => {
      expect(contractsApi.getSigningSession).toHaveBeenCalledWith('ct-real-001');
      expect(screen.getByTestId('mock-admin-documenso-form')).toHaveAttribute(
        'data-token',
        'tok-admin'
      );
    });
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
    // Only the KPI card title has "Chờ Bên A ký trước", not the CANCELLED row badge
    expect(screen.getAllByText('Chờ Bên A ký trước')).toHaveLength(1);
  });

  it('opens sequential B2B signing dialog with Documenso embed before syncing B2B staffing contract', async () => {
    vi.mocked(contractsApi.getStaffingSigningSession).mockResolvedValue({
      contractId: 'st-001',
      contractCode: 'STAFF-2026-001',
      status: 'PENDING_ADMIN_SIGNATURE',
      signerRole: 'ADMIN',
      alreadySigned: false,
      canSign: true,
      signingToken: 'tok-b2b-admin-1',
      signingUrl: 'https://sign.famidoc.online/sign/tok-b2b-admin-1',
      facilitySigned: true,
      adminSigned: false,
      signedPdfUrl: null,
    });
    vi.mocked(contractsApi.syncStaffingDocumenso).mockResolvedValue({
      synced: true,
      contractId: 'st-001',
      status: 'ACTIVE',
      facilitySigned: true,
      adminSigned: true,
      signedPdfUrl: '/api/v1/contracts/staffing/st-001/signed-pdf',
    });

    render(<AdminContractsView />);

    const b2bTab = await screen.findByRole('tab', { name: /Hợp Đồng Cung Ứng Nhân Lực B2B/i });
    fireEvent.mouseDown(b2bTab);
    fireEvent.click(b2bTab);

    await waitFor(() => {
      expect(screen.getAllByText('STAFF-2026-001').length).toBeGreaterThan(0);
    });

    const signBtn = screen.getAllByRole('button', { name: /Ký Duyệt \(Documenso\)/i })[0];
    fireEvent.click(signBtn);

    expect(contractsApi.signStaffingContract).not.toHaveBeenCalled();
    expect(screen.getByText(/Ký Hợp Đồng B2B Trên Documenso — Quản trị viên Nền tảng/i)).toBeInTheDocument();
    expect(screen.getByText('Bước 1: Cơ sở Y tế đối tác')).toBeInTheDocument();
    expect(screen.getByText('Bước 2: Quản trị viên FamiDoc')).toBeInTheDocument();

    const embed = await screen.findByTestId('mock-admin-documenso-form');
    expect(embed).toHaveAttribute('data-token', 'tok-b2b-admin-1');

    fireEvent.click(screen.getByRole('button', { name: /Đồng bộ sau khi ký/i }));

    await waitFor(() => {
      expect(contractsApi.syncStaffingDocumenso).toHaveBeenCalledWith('st-001');
    });
  });

  it('supports keyboard navigation on facility combobox and closes listbox on Escape without closing Dialog', async () => {
    render(<AdminContractsView />);

    const createBtn = await screen.findByRole('button', { name: /Thiết Lập Dự Thảo HĐ B2B/i });
    fireEvent.click(createBtn);

    const combobox = await screen.findByRole('combobox');
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

    const createBtn = await screen.findByRole('button', { name: /Thiết Lập Dự Thảo HĐ B2B/i });
    fireEvent.click(createBtn);

    await screen.findByRole('combobox');

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
      expect(
        screen.getByText(/Số liệu KPI đang tổng hợp trên 50 hợp đồng y tế mới nhất từ máy chủ/i)
      ).toBeInTheDocument();
    });
  });

  it('ẩn nút "Ký trên Documenso" và loại khỏi đếm/lọc READY_FOR_ADMIN khi documensoEnvelopeId === null', async () => {
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

    render(<AdminContractsView />);

    await waitFor(() => {
      expect(screen.getAllByText(/CTR-2026-LEGACY/).length).toBeGreaterThan(0);
    });

    expect(
      screen.queryByRole('button', { name: /Ký trên Documenso/i })
    ).toBeNull();
    expect(
      screen.getAllByRole('button', { name: /Chi tiết & Documenso/i }).length
    ).toBeGreaterThan(0);

    const readyFilterBtn = screen.getByRole('button', { name: /Chờ Admin ký \(Bên D\)/i });
    expect(readyFilterBtn).toHaveTextContent('0');
    fireEvent.click(readyFilterBtn);

    expect(screen.queryAllByText(/CTR-2026-LEGACY/)).toHaveLength(0);
    expect(screen.getByText(/Không có hợp đồng y tế phù hợp/i)).toBeInTheDocument();
  });

  it('submits optional supplementary terms (contractTerms) when creating B2B contract in CreateB2BContractDialog', async () => {
    vi.mocked(contractsApi.createStaffingContract).mockResolvedValueOnce({
      id: 'st-new',
      contractCode: 'STF-2026-NEW1',
    });

    render(<AdminContractsView />);

    const createBtn = await screen.findByRole('button', { name: /Thiết Lập Dự Thảo HĐ B2B/i });
    fireEvent.click(createBtn);

    await screen.findByRole('combobox');

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

  it('renders B2B tab with matching 4-party layout: sort control, 2-party progress matrix, and compact columns', async () => {
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

    const b2bTab = await screen.findByRole('tab', { name: /Hợp Đồng Cung Ứng Nhân Lực B2B/i });
    fireEvent.mouseDown(b2bTab);
    fireEvent.click(b2bTab);

    await waitFor(() => {
      expect(screen.getAllByText('STAFF-2026-100').length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('combobox', { name: /Sắp xếp hợp đồng B2B/i })).toBeInTheDocument();
    expect(screen.getByText('Tiến độ 2 bên')).toBeInTheDocument();
    expect(screen.getByLabelText('Tiến độ 1 trên 2 chữ ký')).toBeInTheDocument();
    expect(screen.getByLabelText('Tiến độ 2 trên 2 chữ ký')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Chi tiết$/i }).length).toBeGreaterThan(0);
  });
});
