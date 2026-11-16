import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminContractsView } from '../admin-contracts-view';
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
      signStaffingContract: vi.fn(),
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
          adminSigned: false,
          facilitySigned: false,
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

  it('requires confirmation dialog before signing B2B staffing contract with SmartCA', async () => {
    render(<AdminContractsView />);

    const b2bTab = await screen.findByRole('tab', { name: /Hợp Đồng Cung Ứng Nhân Lực B2B/i });
    fireEvent.mouseDown(b2bTab);
    fireEvent.click(b2bTab);

    await waitFor(() => {
      expect(screen.getAllByText('STAFF-2026-001').length).toBeGreaterThan(0);
    });

    const signSmartCaBtn = screen.getAllByRole('button', { name: /Ký Duyệt \(SmartCA\)/i })[0];
    fireEvent.click(signSmartCaBtn);

    expect(contractsApi.signStaffingContract).not.toHaveBeenCalled();
    expect(screen.getByText(/Xác nhận ký số SmartCA Hợp đồng B2B/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận Ký SmartCA/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(contractsApi.signStaffingContract).toHaveBeenCalledWith(
        'st-001',
        expect.objectContaining({ confirmed: true })
      );
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
});
