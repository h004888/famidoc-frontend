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

  it('submits Track B intake and navigates to /booking?matchSessionId=... when MATCHED', async () => {
    vi.mocked(matchingApi.matchDoctors).mockResolvedValue({
      outcome: 'MATCHED',
      matchingSessionId: 'sess-track-b-1',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      jevModelVersion: 'jev-1.14.0',
      scores: { jevFitScore: 0.88, vacancyScore: 0.9, compositeScore: 0.886 },
      rationale: 'Phù hợp chuyên môn lão khoa',
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
    });

    render(<DoctorMatchingWizard />);

    await waitFor(() => {
      expect(screen.getByTestId('matching-member-count')).toHaveTextContent('4 người');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Quận 1, TP.HCM' }));
    fireEvent.click(
      screen.getByRole('button', { name: /Tìm bác sĩ phù hợp ngay/i })
    );

    await waitFor(() => {
      expect(matchingApi.matchDoctors).toHaveBeenCalledWith(
        expect.objectContaining({
          packageId: 'pkg-1',
          memberCount: 4,
          districtArea: 'Quận 1, TP.HCM',
        })
      );
      expect(pushMock).toHaveBeenCalledWith(
        '/booking?matchSessionId=sess-track-b-1'
      );
    });
  });

  it('displays Admin Queue confirmation banner when Track B falls back to QUEUED', async () => {
    vi.mocked(matchingApi.matchDoctors).mockResolvedValue({
      outcome: 'QUEUED',
      queueRequestId: 'queue-req-99',
      status: 'QUEUED',
      fallbackReason: 'BELOW_FIT_THRESHOLD',
      slaExpiresAt: new Date(Date.now() + 86400_000).toISOString(),
      packageId: 'pkg-1',
      memberCount: 4,
      message: 'Yêu cầu đã được chuyển tới Hàng chờ điều phối Admin.',
    });

    render(<DoctorMatchingWizard />);

    await waitFor(() => {
      expect(screen.getByText('Gói Đồng Hành')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Tìm bác sĩ phù hợp ngay/i })
    );

    await waitFor(() => {
      const banner = screen.getByTestId('matching-queued-banner');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent('queue-req-99');
      expect(
        screen.getByRole('link', { name: /Theo dõi hàng chờ tại Cổng Gia đình/i })
      ).toHaveAttribute('href', '/family/subscription');
    });
  });
});
