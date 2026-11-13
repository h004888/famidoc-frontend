import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FacilitiesDirectoryView } from '../facilities-directory-view';
import { publicApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  publicApi: {
    getFacilities: vi.fn(),
  },
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

const MOCK_FACILITIES_RESPONSE = [
  {
    id: 'fac-hmu',
    facilityName: 'Phòng khám Đa khoa Đại học Y Hà Nội - HMU Clinic',
    licenseNumber: '00456/BYT-GPHĐ',
    address: 'Số 1 Tôn Thất Tùng, Phường Kim Liên, Quận Đống Đa, Hà Nội',
    phone: '+842438523798',
  },
  {
    id: 'fac-umc',
    facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
    licenseNumber: 'GPHĐ-001829/BYT-GPHĐ',
    address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
    phone: '1900 7178',
  },
  {
    id: 'fac-danang',
    facilityName: 'Bệnh viện Đa khoa Đà Nẵng',
    licenseNumber: 'GPHĐ-000512/SYT-GPHĐ',
    address: '124 Hải Phòng, Phường Thạch Thang, Quận Hải Châu, Đà Nẵng',
    phone: '0236 3821 118',
  },
];

describe('FacilitiesDirectoryView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders facilities from publicApi.getFacilities and matches city properly', async () => {
    vi.mocked(publicApi.getFacilities).mockResolvedValue(MOCK_FACILITIES_RESPONSE);

    render(<FacilitiesDirectoryView />);

    await waitFor(() => {
      expect(screen.getByText('Phòng khám Đa khoa Đại học Y Hà Nội - HMU Clinic')).toBeInTheDocument();
      expect(screen.getByText('Bệnh viện Đại học Y Dược TP.HCM')).toBeInTheDocument();
      expect(screen.getByText('Bệnh viện Đa khoa Đà Nẵng')).toBeInTheDocument();
    });

    // Check that city filter works
    const citySelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(citySelect, { target: { value: 'Hà Nội' } });

    await waitFor(() => {
      expect(screen.getByText('Phòng khám Đa khoa Đại học Y Hà Nội - HMU Clinic')).toBeInTheDocument();
      expect(screen.queryByText('Bệnh viện Đại học Y Dược TP.HCM')).not.toBeInTheDocument();
      expect(screen.queryByText('Bệnh viện Đa khoa Đà Nẵng')).not.toBeInTheDocument();
    });
  });

  it('filters facilities by search query keyword', async () => {
    vi.mocked(publicApi.getFacilities).mockResolvedValue(MOCK_FACILITIES_RESPONSE);

    render(<FacilitiesDirectoryView />);

    await waitFor(() => {
      expect(screen.getByText('Bệnh viện Đại học Y Dược TP.HCM')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên bệnh viện/i);
    fireEvent.change(searchInput, { target: { value: 'Đà Nẵng' } });

    await waitFor(() => {
      expect(screen.getByText('Bệnh viện Đa khoa Đà Nẵng')).toBeInTheDocument();
      expect(screen.queryByText('Phòng khám Đa khoa Đại học Y Hà Nội - HMU Clinic')).not.toBeInTheDocument();
    });
  });
});
