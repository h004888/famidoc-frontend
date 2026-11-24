import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DoctorDetailView } from '../doctor-detail-view';
import type { Facility } from '../doctor-directory-view';
import { publicApi, type PublicDoctorDetailDto } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  publicApi: {
    getDoctors: vi.fn(),
    getFacilities: vi.fn(),
    getDoctorDetail: vi.fn(),
    getDoctorReviews: vi.fn(),
    submitConsultationRequest: vi.fn(),
  },
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

const mockDoctor: PublicDoctorDetailDto = {
  id: 'doc-real-100',
  doctorName: 'Lê Minh Trí',
  academicTitle: 'TS. Bác sĩ',
  specialty: 'Y học Gia đình & Lão khoa',
  specialtyKey: 'geriatric',
  avatarUrl: '/images/doctor-100.jpg',
  bio: 'Bác sĩ chuyên sâu về quản lý đa bệnh lý ở người cao tuổi.',
  isVerified: true,
  isAvailable: true,
  panel: { activeCount: 18, maxCapacity: 30 },
  stats: {
    experienceYears: 18,
    ratingAvg: 4.95,
    totalReviews: 120,
    completedEncounters: 1500,
  },
  facility: {
    id: 'fac-1',
    facilityName: 'Bệnh viện Thống Nhất',
    address: '1 Nguyễn Thông, Quận 3',
    verificationStatus: 'ACTIVE',
  },
  credentials: [
    {
      id: 'cred-1',
      type: 'DEGREE',
      typeLabel: 'Bằng cấp chuyên môn',
      issuingAuthority: 'Đại học Y Dược TP.HCM',
      issueYear: 2015,
      verified: true,
    },
  ],
  treatedCases: [
    {
      id: 'case-1',
      summary: 'Quản lý tăng huyết áp kháng trị cho bệnh nhân 72 tuổi.',
    },
  ],
  careModel: {
    serviceModes: [
      {
        id: 'mode-1',
        category: 'SERVICE_MODE',
        title: 'Khám tận nhà',
        description: 'Khám lâm sàng tại nhà, đo điện tim ECG.',
        icon: 'home',
        sortOrder: 1,
      },
    ],
    commitments: [
      {
        id: 'commit-1',
        category: 'COMMITMENT',
        title: 'Hồ sơ bệnh án điện tử trọn đời',
        description: 'Lưu trữ điện tử toàn bộ kết quả khám.',
        icon: 'folder_shared',
        sortOrder: 1,
      },
    ],
  },
  carePackages: [
    {
      id: 'pkg-1',
      packageCode: 'PKG-FAMILY-01',
      packageName: 'Gói Đồng Hành',
      durationMonths: 3,
      basePrice: 2850000,
      formattedPrice: '2.850.000đ',
      monthlyPrice: '950.000đ/tháng',
      periodicVisitsQuota: 3,
      telehealthQuota: 4,
      includedMembers: 3,
      maxMembers: 6,
      additionalMemberMonthlyPrice: 75000,
      highlight: 'Phù hợp gia đình 3-6 người',
      features: ['Bác sĩ phụ trách chính & lập phác đồ gia đình'],
    },
  ],
  reviews: {
    ratingAvg: 4.95,
    totalReviews: 120,
    items: [
      {
        id: 'rev-1',
        patientDisplayName: 'Nguyễn V. A.',
        ratingStars: 5,
        comment: 'Bác sĩ Trí rất tận tâm và giải thích cặn kẽ tình trạng bệnh.',
        packageName: 'Gói Đồng Hành',
        district: 'Quận 7',
        reviewedAt: '2026-11-01T08:30:00.000Z',
      },
    ],
  },
};

const emptyDoctor: PublicDoctorDetailDto = {
  ...mockDoctor,
  bio: null,
  facility: null,
  credentials: [],
  treatedCases: [],
  careModel: { serviceModes: [], commitments: [] },
  carePackages: [],
  reviews: { ratingAvg: null, totalReviews: 0, items: [] },
  stats: {
    experienceYears: 3,
    ratingAvg: null,
    totalReviews: 0,
    completedEncounters: 0,
  },
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getDoctors).mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 },
    });
    vi.mocked(publicApi.getDoctorReviews).mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 5, totalRecords: 0, totalPages: 1 },
    });
  });

describe('DoctorDetailView (API-only rendering)', () => {
  it('renders identity, statistics, bio, credentials, treated cases, care model and reviews from the API payload', () => {
    render(<DoctorDetailView initialDoctor={mockDoctor} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /TS\. Bác sĩ Lê Minh Trí/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Y học Gia đình & Lão khoa')).toBeInTheDocument();
    expect(screen.getAllByText('Bệnh viện Thống Nhất').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('1 Nguyễn Thông, Quận 3').length
    ).toBeGreaterThan(0);

    expect(screen.getByText('18 năm')).toBeInTheDocument();
    expect(screen.queryByText('1.500')).not.toBeInTheDocument();
    expect(screen.queryByText('18/30')).not.toBeInTheDocument();
    expect(screen.queryByText('120 đánh giá')).not.toBeInTheDocument();

    expect(screen.getByText(/Bác sĩ chuyên sâu về quản lý đa bệnh lý/i)).toBeInTheDocument();
    expect(screen.getByText('Bằng cấp chuyên môn')).toBeInTheDocument();
    expect(screen.getByText('Đại học Y Dược TP.HCM (2015)')).toBeInTheDocument();
    expect(
      screen.getByText(/Quản lý tăng huyết áp kháng trị cho bệnh nhân 72 tuổi/i)
    ).toBeInTheDocument();

    expect(screen.getByText('Khám tận nhà')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ bệnh án điện tử trọn đời')).toBeInTheDocument();

    expect(screen.queryByText('Đánh Giá Đã Xác Thực')).not.toBeInTheDocument();
    expect(screen.queryByText('Nguyễn V. A.')).not.toBeInTheDocument();
    expect(screen.getAllByText('Gói Đồng Hành').length).toBeGreaterThan(0);

    expect(screen.getAllByText('2.850.000đ').length).toBeGreaterThan(0);
    expect(screen.getByText('3 lượt khám tại nhà')).toBeInTheDocument();
    expect(screen.getByText('4 lượt telehealth')).toBeInTheDocument();
    expect(screen.getByText(/Bao gồm 3 người · Tối đa 6 người/i)).toBeInTheDocument();
    expect(screen.queryByText('Cơ Sở Y Tế Phụ Trách')).not.toBeInTheDocument();
    expect(screen.getByText('Bệnh viện Thống Nhất')).toBeInTheDocument();
  });

  it('does not render mock content, free-form consultation form or working schedule', () => {
    render(<DoctorDetailView initialDoctor={mockDoctor} />);

    expect(screen.queryByText(/bác sĩ Hoài/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chị Mai Lan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Anh Quốc Bảo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Thứ 2 - Thứ 7/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Đăng Ký Gói Chăm Sóc Ngay/i)).not.toBeInTheDocument();
    expect(document.querySelector('form')).toBeNull();
    expect(
      screen.getByRole('link', { name: /Đăng ký dịch vụ với bác sĩ/i })
    ).toHaveAttribute(
      'href',
      '/booking?packageId=pkg-1&doctorId=doc-real-100&facilityId=fac-1&members=3'
    );
  });

  it('renders empty states instead of fallback mock data when the API returns nothing', () => {
    render(<DoctorDetailView initialDoctor={emptyDoctor} />);

    expect(screen.getByText('Chưa có thông tin giới thiệu.')).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có chứng chỉ được công bố.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có ca bệnh tiêu biểu được công bố.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có thông tin phạm vi chăm sóc.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Bác sĩ chưa có đánh giá nào.')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Chưa có gói chăm sóc đang hoạt động.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Chưa có đánh giá')).not.toBeInTheDocument();
  });

  describe('Facility Mode (type="facility")', () => {
    const mockFacility: Facility = {
      id: 'fac-01',
      name: 'Bệnh viện Chợ Rẫy',
      type: 'Bệnh viện Tuyến Trung Ương',
      address: '201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      phone: '1900 1234',
      workingHours: '07:00 - 16:30',
      imageUrl: '/images/facilities/cho-ray.jpg',
      specialties: ['Nội tổng quát', 'Tim mạch', 'Cơ xương khớp'],
      privileges: ['Ưu tiên Fast-Track', 'Bảo lãnh viện phí'],
      bedCount: '1000+ giường',
    };

    it('does NOT render booking-widget, care package form, or guarantee card in facility mode', async () => {
      render(<DoctorDetailView type="facility" initialFacility={mockFacility} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /Bệnh viện Chợ Rẫy/i })).toBeInTheDocument();
      });

      // booking-widget should be completely absent
      expect(document.querySelector('#booking-widget')).toBeNull();

      // Feedback Item 1: "Gói Cơ Sở Y Tế Đang nhận bệnh nhân Đăng Ký Gói Khám Tại Cơ Sở" is removed
      expect(screen.queryByText(/Đăng Ký Gói Khám Tại Cơ Sở/i)).toBeNull();
      expect(screen.queryByText(/Đăng Ký Gói Chăm Sóc Cùng Bác Sĩ/i)).toBeNull();

      // Feedback Item 2: "Cam kết Y tế FamiDoc Pro" is removed
      expect(screen.queryByText(/Cam kết Y tế FamiDoc Pro/i)).toBeNull();

      // Mobile booking bar is removed
      expect(screen.queryByRole('button', { name: /Đăng ký gói chăm sóc/i })).toBeNull();
    });

    it('renders the affiliated doctors list for the facility (Feedback Item 3)', async () => {
      vi.mocked(publicApi.getDoctors).mockResolvedValueOnce({
        items: [
          {
            id: 'doc-cr-01',
            doctorName: 'TS. Bác sĩ Phạm Minh Đức',
            specialty: 'Tim Mạch & Huyết Áp',
            academicTitle: 'TS. BS',
            experienceYears: 20,
            ratingAvg: 4.97,
            facility: {
              id: 'fac-01',
              facilityName: 'Bệnh viện Chợ Rẫy',
            },
          },
          {
            id: 'doc-cr-02',
            doctorName: 'BS. CKII Hoàng Minh Tuấn',
            specialty: 'Cơ Xương Khớp',
            academicTitle: 'BS. CKII',
            experienceYears: 16,
            ratingAvg: 4.92,
            facility: {
              id: 'fac-01',
              facilityName: 'Bệnh viện Chợ Rẫy',
            },
          },
        ],
        pagination: { page: 1, pageSize: 50, totalRecords: 2, totalPages: 1 },
      });

      render(<DoctorDetailView type="facility" initialFacility={mockFacility} />);

      // Verify Header for affiliated doctors
      expect(await screen.findByText(/Đội Ngũ Bác Sĩ Trực Thuộc Bệnh viện Chợ Rẫy/i)).toBeInTheDocument();

      // Verify doctor items from API
      await waitFor(() => {
        expect(screen.getByText('TS. Bác sĩ Phạm Minh Đức')).toBeInTheDocument();
        expect(screen.getByText('BS. CKII Hoàng Minh Tuấn')).toBeInTheDocument();
        expect(screen.getByText('Tim Mạch & Huyết Áp')).toBeInTheDocument();
        expect(screen.getByText('Cơ Xương Khớp')).toBeInTheDocument();
      });

      // Verify links to doctors' profile
      const profileLinks = screen.getAllByRole('link', { name: /Hồ sơ & Đặt khám/i });
      expect(profileLinks.length).toBe(2);
      expect(profileLinks[0]).toHaveAttribute('href', '/doctors/doc-cr-01');
      expect(profileLinks[1]).toHaveAttribute('href', '/doctors/doc-cr-02');
    });

    it('renders honest empty state instead of mock doctors when API returns no matching doctors', async () => {
      vi.mocked(publicApi.getDoctors).mockResolvedValueOnce({
        items: [],
        pagination: { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 },
      });

      render(<DoctorDetailView type="facility" initialFacility={mockFacility} />);

      expect(await screen.findByText(/Đội Ngũ Bác Sĩ Trực Thuộc Bệnh viện Chợ Rẫy/i)).toBeInTheDocument();
      expect(
        await screen.findByText('Cơ sở y tế hiện chưa có bác sĩ nào đang hoạt động trên hệ thống.')
      ).toBeInTheDocument();
      expect(screen.queryByText('Phạm Minh Đức')).not.toBeInTheDocument();
      expect(screen.queryByText('Hoàng Minh Tuấn')).not.toBeInTheDocument();
    });
  });
});
