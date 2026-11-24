import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DoctorMatchingWizard } from '../doctor-matching-wizard';
import { matchingApi, publicApi } from '@/lib/api';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams('packageId=pkg-1&members=4'),
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    publicApi: {
      ...actual.publicApi,
      getPackages: vi.fn(),
    },
    matchingApi: {
      ...actual.matchingApi,
      matchDoctors: vi.fn(),
    },
  };
});

describe('DoctorMatchingWizard (/doctors/matching - Task 6.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getPackages).mockResolvedValue({
      items: [
        {
          id: 'pkg-1',
          packageCode: 'DONG_HANH',
          packageName: 'Gói Đồng Hành',
          durationMonths: 3,
          basePrice: 2850000,
          periodicVisitsQuota: 3,
          telehealthQuota: 20,
          includedMembers: 3,
          maxMembers: 6,
          additionalMemberMonthlyPrice: 75000,
          quotaPeriod: 'PER_TERM',
        },
      ],
    });
  });

  it('displays Screen 5A with Top 1 doctor, up to 3 alternatives, and relaxed banner when MATCHED', async () => {
    vi.mocked(matchingApi.matchDoctors).mockResolvedValue({
      outcome: 'MATCHED',
      matchingSessionId: 'sess-track-b-1',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      jevModelVersion: 'jev-1.14.0',
      rankingSource: 'AI',
      relaxedAcademicTitle: true,
      requestedAcademicTitle: 'BS.CKI',
      scores: { jevFitScore: 0.88, vacancyScore: 0.9, compositeScore: 0.886 },
      rationale: 'Phù hợp chuyên môn lão khoa',
      comparisonRows: [
        {
          criterion: 'Nhu cầu sức khỏe',
          familyNeed: 'Khám định kỳ cả nhà',
          doctorMatch: 'Khớp chuyên khoa Y học gia đình',
          isMatched: true,
        },
        {
          criterion: 'Khu vực sống',
          familyNeed: 'Quận 1, TP. Hồ Chí Minh',
          doctorMatch: 'Đúng khu vực (Quận 1, TP.HCM)',
          isMatched: true,
        },
      ],
      package: {
        id: 'pkg-1',
        packageCode: 'DONG_HANH',
        packageName: 'Gói Đồng Hành',
        durationMonths: 3,
        basePrice: 2850000,
        includedMembers: 3,
        maxMembers: 6,
        additionalMemberMonthlyPrice: 75000,
        periodicVisitsQuota: 3,
        telehealthQuota: 20,
      },
      memberCount: 4,
      doctor: {
        id: 'doc-1',
        doctorName: 'BS. Nguyễn Văn An',
        specialty: 'Y học gia đình',
        academicTitle: 'ThS.BS',
        experienceYears: 8,
        clinicalTier: 'STANDARD',
        ratingAvg: 4.9,
        totalReviews: 40,
        remainingSlots: 20,
        maxPanelCapacity: 30,
        avatarUrl: null,
      },
      facility: {
        id: 'fac-1',
        facilityName: 'Phòng khám FamiDoc',
        address: 'Quận 1, TP.HCM',
        hotline: '1900 1234',
      },
      alternatives: [
        {
          rank: 2,
          scores: { jevFitScore: 0.82, vacancyScore: 0.8, compositeScore: 0.814 },
          rationale: 'Sát nhu cầu nhi khoa',
          shortReason: 'Rất hợp chăm trẻ nhỏ nhưng ở khác khu vực bạn chọn.',
          doctor: {
            id: 'doc-2',
            doctorName: 'BS. Lâm Khánh Chi',
            specialty: 'Nhi khoa',
            academicTitle: 'BS.CKI',
            experienceYears: 9,
            clinicalTier: 'STANDARD',
            ratingAvg: 4.8,
            totalReviews: 12,
            remainingSlots: 10,
            maxPanelCapacity: 20,
            avatarUrl: '/images/doc-2.jpg',
          },
          facility: {
            id: 'fac-2',
            facilityName: 'BV Nhi Đồng 1',
            address: 'Quận 10, TP.HCM',
            hotline: '1900 5678',
          },
        },
      ],
    });

    render(<DoctorMatchingWizard />);

    await waitFor(() => {
      expect(screen.getByTestId('matching-member-count')).toHaveTextContent('4 người');
    });

    fireEvent.change(screen.getByLabelText('Tỉnh / Thành phố'), {
      target: { value: 'TP. Hồ Chí Minh' },
    });
    fireEvent.change(screen.getByLabelText('Phường / Xã'), {
      target: { value: 'Quận 1' },
    });
    fireEvent.click(screen.getByText('Bác sĩ Chuyên khoa I (BS.CKI)'));
    fireEvent.click(
      screen.getByRole('button', { name: /Tìm bác sĩ phù hợp ngay/i })
    );

    await waitFor(() => {
      expect(matchingApi.matchDoctors).toHaveBeenCalledWith(
        expect.objectContaining({
          packageId: 'pkg-1',
          memberCount: 4,
          requestedAcademicTitle: 'BS.CKI',
          districtArea: 'Quận 1, TP. Hồ Chí Minh',
        })
      );
      expect(screen.getByTestId('matching-relaxed-banner')).toBeInTheDocument();
      const top1 = screen.getByTestId('matching-top1-card');
      expect(top1).toHaveTextContent('BS. Nguyễn Văn An');
      expect(top1).toHaveTextContent('So sánh độ phù hợp với nhu cầu gia đình');
      expect(top1).toHaveTextContent('Khớp chuyên khoa Y học gia đình');
      expect(
        screen.getByRole('link', { name: /Chọn bác sĩ này & Tiếp tục đặt gói/i })
      ).toHaveAttribute('href', '/booking?matchSessionId=sess-track-b-1');

      const alt2 = screen.getByTestId('matching-alt-card-2');
      expect(alt2).toHaveTextContent('BS. Lâm Khánh Chi');
      expect(alt2).toHaveTextContent('Rất hợp chăm trẻ nhỏ nhưng ở khác khu vực bạn chọn.');
      expect(screen.getByAltText('BS. Lâm Khánh Chi')).toHaveAttribute('src', '/images/doc-2.jpg');
      expect(
        screen.getByRole('link', { name: 'Chọn bác sĩ này' })
      ).toHaveAttribute(
        'href',
        '/booking?packageId=pkg-1&doctorId=doc-2&facilityId=fac-2&members=4'
      );
    });
  });

  it('displays Screen 5B with Hotline 1900 8821 when platform is full (PLATFORM_FULL)', async () => {
    vi.mocked(matchingApi.matchDoctors).mockResolvedValue({
      outcome: 'PLATFORM_FULL',
      packageId: 'pkg-1',
      memberCount: 4,
      hotline: '1900 8821',
      message: 'Hiện toàn bộ bác sĩ trên hệ thống đều đã kín lịch nhận gia đình.',
    });

    render(<DoctorMatchingWizard />);

    await waitFor(() => {
      expect(screen.getByText('Gói Đồng Hành')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Tìm bác sĩ phù hợp ngay/i })
    );

    await waitFor(() => {
      const banner = screen.getByTestId('matching-platform-full-banner');
      expect(banner).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /Gọi Hotline: 1900 8821/i })
      ).toHaveAttribute('href', 'tel:19008821');
      expect(
        screen.getByRole('link', { name: /Xem danh sách bác sĩ/i })
      ).toHaveAttribute('href', '/doctors');
    });
  });
});
