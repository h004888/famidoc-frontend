import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContractEditView } from '../admin-contract-edit-view';
import { contractsApi } from '@/lib/api';
import { doctorsApi } from '@/lib/api/doctors.api';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

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

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    contractsApi: {
      ...actual.contractsApi,
      getMedicalContractDetail: vi.fn(),
      updateMedicalContract: vi.fn(),
      assignDoctor: vi.fn(),
      getStaffingContractById: vi.fn(),
      updateStaffingContract: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/doctors.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/doctors.api')>();
  return {
    ...actual,
    doctorsApi: {
      ...actual.doctorsApi,
      getAdminDoctors: vi.fn(),
    },
  };
});

describe('AdminContractEditView (Sửa / Cập nhật Hợp đồng bên Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and updates a 4-party medical contract', async () => {
    const user = userEvent.setup();

    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ct-med-01',
      contractNumber: 'CTR-2026-001',
      contractStatus: 'PENDING_APPROVAL',
      totalAmount: 5200000,
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2027-05-01T00:00:00.000Z',
      createdAt: '2026-04-28T00:00:00.000Z',
      memberCount: 4,
      additionalTerms: 'Khám tại nhà định kỳ hàng tháng.',
      doctor: { id: 'doc-1', doctorName: 'BS. Nguyễn Lan', specialty: 'Y học gia đình' },
      facility: { id: 'fac-1', facilityName: 'BV Đại học Y Dược' },
      familyUnit: {
        homeAddress: '12 Nguyễn Huệ, Q1',
        representativeUser: { fullName: 'Phạm Hoàng Minh' },
      },
      signatures: [],
    });

    vi.mocked(doctorsApi.getAdminDoctors).mockResolvedValue([
      { id: 'doc-1', doctorName: 'BS. Nguyễn Lan', specialty: 'Y học gia đình' },
      { id: 'doc-2', doctorName: 'BS. Trần Minh Khoa', specialty: 'Nội tổng quát' },
    ]);

    vi.mocked(contractsApi.updateMedicalContract).mockResolvedValue({
      id: 'ct-med-01',
      contractNumber: 'CTR-2026-001',
      contractStatus: 'ACTIVE',
      totalAmount: 6000000,
      startDate: '2026-05-01',
      endDate: '2027-05-01',
      createdAt: '2026-04-28T00:00:00.000Z',
    });

    render(<AdminContractEditView contractId="ct-med-01" contractType="medical" />);

    expect(await screen.findByText(/Cập nhật Hợp đồng Y tế 4 Bên · CTR-2026-001/i)).toBeInTheDocument();

    const memberInput = screen.getByLabelText(/Số thành viên áp dụng/i);
    await user.clear(memberInput);
    await user.type(memberInput, '5');

    const termsInput = screen.getByLabelText(/Điều khoản bổ sung/i);
    await user.clear(termsInput);
    await user.type(termsInput, 'Bổ sung 2 lượt xét nghiệm tại nhà.');

    await user.click(screen.getByRole('button', { name: /Lưu cập nhật Hợp đồng/i }));

    await waitFor(() => {
      expect(contractsApi.updateMedicalContract).toHaveBeenCalledWith(
        'ct-med-01',
        expect.objectContaining({
          memberCount: 5,
          additionalTerms: 'Bổ sung 2 lượt xét nghiệm tại nhà.',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/contracts');
    });
  });

  it('loads, validates share percentage, and updates a B2B staffing contract', async () => {
    const user = userEvent.setup();

    vi.mocked(contractsApi.getStaffingContractById).mockResolvedValue({
      id: 'st-001',
      contractNumber: 'STAFF-2026-001',
      facilityName: 'Bệnh viện Đa khoa An Sinh',
      facilitySharePercent: 85,
      platformSharePercent: 15,
      validFrom: '2026-01-01T00:00:00.000Z',
      validTo: '2027-01-01T00:00:00.000Z',
      status: 'DRAFT',
      adminSigned: false,
      facilitySigned: false,
      contractTerms: 'Điều khoản B2B chuẩn.',
    });

    vi.mocked(contractsApi.updateStaffingContract).mockResolvedValue({ ok: true });

    render(<AdminContractEditView contractId="st-001" contractType="staffing" />);

    expect(await screen.findByText(/Cập nhật Hợp đồng B2B · STAFF-2026-001/i)).toBeInTheDocument();

    const shareInput = screen.getByLabelText(/Tỷ lệ CSYT hưởng/i);
    await user.clear(shareInput);
    await user.type(shareInput, '80');

    await user.click(screen.getByRole('button', { name: /Lưu cập nhật B2B/i }));

    await waitFor(() => {
      expect(contractsApi.updateStaffingContract).toHaveBeenCalledWith(
        'st-001',
        expect.objectContaining({
          facilitySharePercent: 80,
          platformSharePercent: 20,
          status: 'DRAFT',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/contracts');
    });
  });
});
