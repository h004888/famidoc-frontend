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
      onboardingStatus: 'ACTIVE',
      status: 'ACTIVE',
      createdAt: '2026-11-10T08:00:00.000Z',
    }),
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
});
