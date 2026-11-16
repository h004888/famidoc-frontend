import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorDetailView } from '../doctor-detail-view';
import type { PublicDoctorDetailDto } from '@/lib/api';

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
    expect(screen.getByText('1.500')).toBeInTheDocument();
    expect(screen.getByText('18/30')).toBeInTheDocument();
    expect(screen.getAllByText('120 đánh giá').length).toBeGreaterThan(0);

    expect(screen.getByText(/Bác sĩ chuyên sâu về quản lý đa bệnh lý/i)).toBeInTheDocument();
    expect(screen.getByText('Bằng cấp chuyên môn')).toBeInTheDocument();
    expect(screen.getByText('Đại học Y Dược TP.HCM (2015)')).toBeInTheDocument();
    expect(
      screen.getByText(/Quản lý tăng huyết áp kháng trị cho bệnh nhân 72 tuổi/i)
    ).toBeInTheDocument();

    expect(screen.getByText('Khám tận nhà')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ bệnh án điện tử trọn đời')).toBeInTheDocument();

    expect(screen.getByText('Nguyễn V. A.')).toBeInTheDocument();
    expect(screen.getAllByText('Gói Đồng Hành').length).toBeGreaterThan(0);
    expect(screen.getByText('Quận 7')).toBeInTheDocument();
    expect(
      screen.getByText(/Bác sĩ Trí rất tận tâm và giải thích cặn kẽ/i)
    ).toBeInTheDocument();

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
    expect(screen.getByText('Bác sĩ chưa có đánh giá nào.')).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có gói chăm sóc đang hoạt động.')
    ).toBeInTheDocument();
    expect(screen.getByText('Chưa có đánh giá')).toBeInTheDocument();
  });
});
