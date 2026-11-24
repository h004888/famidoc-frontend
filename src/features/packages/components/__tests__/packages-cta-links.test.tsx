import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PackagesCatalogView } from '../packages-catalog-view';
import { PackageDetailView } from '../package-detail-view';
import { publicApi, type PublicPackageDetailDto, type PublicPackageItemDto } from '@/lib/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/packages',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

const MOCK_PACKAGES: PublicPackageItemDto[] = [
  {
    id: 'pkg-uuid-1',
    packageCode: 'BASIC',
    packageName: 'Gói Trải Nghiệm',
    durationMonths: 1,
    basePrice: 1000000,
    periodicVisitsQuota: 1,
    telehealthQuota: 2,
    includedMembers: 2,
    maxMembers: 4,
    additionalMemberMonthlyPrice: 75000,
    quotaPeriod: 'PER_TERM',
    description: 'Gói cơ bản',
  },
  {
    id: 'pkg-uuid-2',
    packageCode: 'FAMILY',
    packageName: 'Gói Đồng Hành',
    durationMonths: 3,
    basePrice: 2850000,
    periodicVisitsQuota: 3,
    telehealthQuota: 20,
    includedMembers: 4,
    maxMembers: 6,
    additionalMemberMonthlyPrice: 75000,
    quotaPeriod: 'PER_TERM',
    description: 'Gói gia đình',
  },
];

const MOCK_DETAIL: PublicPackageDetailDto = {
  ...MOCK_PACKAGES[1]!,
  benefits: {
    periodicVisitsQuota: 3,
    telehealthQuota: 20,
    clinicalServices: ['Khám tại nhà định kỳ'],
  },
};

describe('Dual-Track CTA links trên /packages và /packages/[id]', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('PackagesCatalogView: mỗi gói cung cấp 2 CTA Track A (/doctors) và Track B (/doctors/matching)', async () => {
    vi.spyOn(publicApi, 'getPackages').mockResolvedValue({ items: MOCK_PACKAGES });
    render(<PackagesCatalogView />);

    await waitFor(() => {
      expect(screen.getByTestId('package-card-BASIC')).toBeInTheDocument();
    });

    const hrefs = screen
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'))
      .filter((href): href is string => Boolean(href));

    expect(hrefs).toContain('/packages/pkg-uuid-1');
    expect(hrefs).toContain('/packages/pkg-uuid-2');
    expect(hrefs).not.toContain('/doctors?packageId=pkg-uuid-1&members=2');
    expect(hrefs).not.toContain('/doctors/matching?packageId=pkg-uuid-1&members=2');
  });

  it('PackageDetailView: hiển thị 2 nhánh Track A và Track B với đúng packageId và members', async () => {
    vi.spyOn(publicApi, 'getPackageDetail').mockResolvedValue(MOCK_DETAIL);
    render(<PackageDetailView packageId="pkg-uuid-2" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Gói Đồng Hành' })).toBeInTheDocument();
    });

    expect(
      screen.getByRole('link', { name: /Gia đình tự chọn bác sĩ/i })
    ).toHaveAttribute('href', '/doctors?packageId=pkg-uuid-2&members=4');
    expect(
      screen.getByRole('link', { name: /Hệ thống gợi ý bác sĩ phù hợp/i })
    ).toHaveAttribute('href', '/doctors/matching?packageId=pkg-uuid-2&members=4');
  });
});
