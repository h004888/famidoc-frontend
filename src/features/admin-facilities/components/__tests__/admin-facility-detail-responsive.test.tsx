import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminFacilityDetailView } from '../admin-facility-detail-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    getAdminFacilityDetail: vi.fn().mockResolvedValue({
      id: 'FAC-1',
      facilityName: 'Bệnh viện Kiểm Thử',
      representativeName: 'Nguyễn Văn A',
      email: 'fac@test.vn',
      phone: '0901234567',
      address: 'Hà Nội',
      operatingLicense: '01293/BYT-GPHĐ',
      taxCode: '0102030405',
      hasLegalDocument: true,
      hasOperatingLicense: true,
      hasBusinessLicense: true,
      onboardingStatus: 'ACTIVE',
      status: 'ACTIVE',
      createdAt: '2026-11-10T08:00:00.000Z',
    }),
    fetchLegalDocumentBlobUrl: vi.fn().mockResolvedValue('blob:mock-doc'),
  },
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getStaffingContracts: vi.fn().mockResolvedValue({
      data: [
        {
          id: 'CTR-1',
          contractNumber: 'STAFF-2026-001',
          facilityId: 'FAC-1',
          facilityName: 'Bệnh viện Kiểm Thử',
          platformSharePercent: 15,
          facilitySharePercent: 85,
          validFrom: '2026-11-01',
          validTo: '2027-11-01',
          status: 'ACTIVE',
          adminSigned: true,
          facilitySigned: true,
        },
      ],
    }),
  },
}));

describe('AdminFacilityDetailView Responsive Contracts Table', () => {
  it('renders without nested <main> and shows mobile contract cards when switching to CONTRACTS tab', async () => {
    const { container } = render(<AdminFacilityDetailView facilityId="FAC-1" />);

    await screen.findAllByText('Bệnh viện Kiểm Thử');
    expect(container.querySelector('main')).toBeNull();

    const contractsTab = screen.getByRole('button', { name: /5\. Hợp đồng B2B & Ký kết/i });
    fireEvent.click(contractsTab);

    expect(screen.getByTestId('facility-contracts-mobile')).toBeInTheDocument();
  });

  it('displays separate preview buttons for Operating License and Business Registration Certificate on LEGAL tab', async () => {
    render(<AdminFacilityDetailView facilityId="FAC-1" />);
    await screen.findAllByText('Bệnh viện Kiểm Thử');

    const legalTab = screen.getByRole('button', { name: /2\. Hồ sơ pháp lý & GPHĐ/i });
    fireEvent.click(legalTab);

    expect(screen.getByRole('button', { name: /Xem \/ Tải GPHĐ KBCB/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xem \/ Tải Giấy ĐKKD/i })).toBeInTheDocument();
  });
});
