import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FacilityDetailView } from '../facility-detail-view';
import { publicApi, type PublicFacilityDto } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  publicApi: {
    getFacilityDetail: vi.fn(),
    getFacilities: vi.fn(),
    getDoctors: vi.fn(),
  },
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

const SAMPLE_FACILITY_DTO: PublicFacilityDto = {
  id: '386586b0-34a0-43f0-9c87-528983872698',
  facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
  type: 'Bệnh viện Tuyến Trung Ương',
  tier: 'Hạng Đặc Biệt',
  status: 'ACTIVE',
  licenseNumber: 'GPHĐ-001829/BYT-GPHĐ',
  taxCode: '0302839101',
  address: '215 Hồng Bàng, Phường 11, Quận 5, TP. Hồ Chí Minh',
  city: 'TP. Hồ Chí Minh',
  hotline: '1900 7178',
  phone: '028 3855 4269',
  email: 'bvdhyd@umc.edu.vn',
  websiteUrl: 'https://bvdaihoc.com.vn',
  workingHours: 'Thứ 2 - Thứ 6: 06:30 - 16:30 | Thứ 7: 06:30 - 11:30 | Cấp cứu: 24/7',
  bedCount: '1.000+ giường',
  imageUrl: '/images/medsev/home-one/4.jpg',
  specialties: [
    'Tim Mạch Can Thiệp',
    'Tiêu Hóa - Gan Mật',
    'Lão Khoa & Quản Trị Bệnh Mạn Tính',
    'Nhi Khoa',
    'Nội Tổng Quát',
    'Hồi Sức Cấp Cứu (ICU)',
  ],
  privileges: [
    'Lối đi tiếp đón ưu tiên FamiDoc Fast-Track',
    'Bảo lãnh viện phí trực tiếp và liên thông BHYT',
    'Đồng bộ dữ liệu xét nghiệm vào Bệnh án điện tử EMR FamiDoc',
  ],
  featuredDoctors: [
    {
      id: 'doc-01',
      doctorName: 'Nguyễn Văn Hoài',
      academicTitle: 'PGS. TS. Bác sĩ',
      specialty: 'Nội Tổng Quát & Y học Gia đình',
      avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
    },
  ],
};

describe('FacilityDetailView Component with Full DTO', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all detailed fields: tier, status, license, specialties, privileges, hotline, and featured doctors', async () => {
    vi.mocked(publicApi.getFacilityDetail).mockResolvedValue(SAMPLE_FACILITY_DTO);

    render(<FacilityDetailView id="386586b0-34a0-43f0-9c87-528983872698" />);

    await waitFor(() => {
      // 1. Facility Name & Type & Tier
      expect(screen.getByRole('heading', { level: 1, name: 'Bệnh viện Đại học Y Dược TP.HCM' })).toBeInTheDocument();
      expect(screen.getByText('Bệnh viện Tuyến Trung Ương')).toBeInTheDocument();
      expect(screen.getAllByText('Hạng Đặc Biệt')[0]).toBeInTheDocument();

      // 2. Status & Legal
      expect(screen.getByText('Đối tác bảo trợ chính thức')).toBeInTheDocument();
      expect(screen.getByText('GPHĐ-001829/BYT-GPHĐ')).toBeInTheDocument();
      expect(screen.getByText('0302839101')).toBeInTheDocument();

      // 3. Specialties
      expect(screen.getByText('Tim Mạch Can Thiệp')).toBeInTheDocument();
      expect(screen.getByText('Tiêu Hóa - Gan Mật')).toBeInTheDocument();
      expect(screen.getByText('Hồi Sức Cấp Cứu (ICU)')).toBeInTheDocument();

      // 4. Privileges
      expect(screen.getByText('Lối đi tiếp đón ưu tiên FamiDoc Fast-Track')).toBeInTheDocument();
      expect(screen.getByText('Bảo lãnh viện phí trực tiếp và liên thông BHYT')).toBeInTheDocument();

      // 5. Contact & Hotline Action
      expect(screen.getByText('Hotline: 1900 7178')).toBeInTheDocument();
      expect(screen.getByText('028 3855 4269')).toBeInTheDocument();
      expect(screen.getByText('bvdhyd@umc.edu.vn')).toBeInTheDocument();

      // 6. Featured Doctors
      expect(screen.getByText('Nguyễn Văn Hoài')).toBeInTheDocument();
      expect(screen.getByText('PGS. TS. Bác sĩ')).toBeInTheDocument();
    });
  });
});
