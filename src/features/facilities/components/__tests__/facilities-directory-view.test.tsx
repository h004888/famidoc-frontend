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

  it('renders pagination and shows correct page info when facilities exceed page size', async () => {
    const manyFacilities = Array.from({ length: 8 }, (_, i) => ({
      id: `fac-${i + 1}`,
      facilityName: `Bệnh viện Cơ sở ${i + 1}`,
      licenseNumber: `GPHĐ-00${i + 1}/BYT`,
      address: `Địa chỉ số ${i + 1}, Hà Nội`,
      phone: `090000000${i}`,
    }));

    vi.mocked(publicApi.getFacilities).mockResolvedValue(manyFacilities);

    render(<FacilitiesDirectoryView />);

    await waitFor(() => {
      expect(screen.getByText('Bệnh viện Cơ sở 1')).toBeInTheDocument();
      expect(screen.getByText('Bệnh viện Cơ sở 6')).toBeInTheDocument();
      // Cơ sở 7 nằm ở trang 2 nên không hiển thị ở trang 1
      expect(screen.queryByText('Bệnh viện Cơ sở 7')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Hiển thị 6 trong tổng 8 cơ sở y tế')).toBeInTheDocument();
    expect(screen.getByText('Trang 1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Phân trang' })).toBeInTheDocument();

    // Bấm sang trang 2
    const page2Button = screen.getByRole('button', { name: 'Chuyển đến trang 2' });
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.getByText('Bệnh viện Cơ sở 7')).toBeInTheDocument();
      expect(screen.getByText('Bệnh viện Cơ sở 8')).toBeInTheDocument();
      expect(screen.queryByText('Bệnh viện Cơ sở 1')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Hiển thị 2 trong tổng 8 cơ sở y tế')).toBeInTheDocument();
    expect(screen.getByText('Trang 2 / 2')).toBeInTheDocument();
  });
});
