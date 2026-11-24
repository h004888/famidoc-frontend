import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const LIVE_PACKAGES: PublicPackageItemDto[] = [
  {
    id: 'pkg-live-1',
    packageCode: 'TRAI_NGHIEM',
    packageName: 'Gói Trải Nghiệm',
    durationMonths: 1,
    basePrice: 1000000,
    periodicVisitsQuota: 1,
    telehealthQuota: 2,
    maxMembers: 4,
    includedMembers: 2,
    additionalMemberMonthlyPrice: 75000,
    quotaPeriod: 'PER_TERM',
    description: 'Gói dùng thử chăm sóc ngoại trú',
  },
  {
    id: 'pkg-live-2',
    packageCode: 'DONG_HANH',
    packageName: 'Gói Đồng Hành',
    durationMonths: 3,
    basePrice: 2850000,
    periodicVisitsQuota: 3,
    telehealthQuota: 20,
    maxMembers: 6,
    includedMembers: 4,
    additionalMemberMonthlyPrice: 75000,
    quotaPeriod: 'PER_TERM',
    description: 'Gói tiêu chuẩn hộ gia đình',
  },
];

const LIVE_PACKAGE_DETAIL: PublicPackageDetailDto = {
  ...LIVE_PACKAGES[1]!,
  benefits: {
    periodicVisitsQuota: 3,
    telehealthQuota: 20,
    clinicalServices: ['Khám tổng quát tại nhà định kỳ'],
  },
};

describe('PackagesCatalogView & PackageDetailView (Task 5.1 Live API)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads live ServicePackage items from API and switches between full-term and monthly-average pricing', async () => {
    const getPackagesSpy = vi
      .spyOn(publicApi, 'getPackages')
      .mockResolvedValue({ items: LIVE_PACKAGES });

    render(<PackagesCatalogView />);

    await waitFor(() => {
      expect(getPackagesSpy).toHaveBeenCalled();
      expect(screen.getByRole('heading', { level: 3, name: 'Gói Đồng Hành' })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 3, name: 'Gói Trải Nghiệm' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Tìm theo tên gói chăm sóc/i)).toBeNull();
    expect(screen.queryByText(/Kỳ hạn gói:/i)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Bình Quân Theo Tháng' }));
    expect(screen.getAllByText('/tháng').length).toBeGreaterThanOrEqual(2);
  });

  it('renders PackageDetailView from live API without hardcoded doctor names and updates Dual-Track links on member change', async () => {
    vi.spyOn(publicApi, 'getPackageDetail').mockResolvedValue(LIVE_PACKAGE_DETAIL);

    render(<PackageDetailView packageId="pkg-live-2" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Gói Đồng Hành' })).toBeInTheDocument();
    });

    // Không chứa tên bác sĩ gán cứng từ mock cũ
    expect(screen.queryByText(/Nguyễn Minh Tuấn|Lê Hoàng Nam|Phạm Hoàng Long/i)).toBeNull();

    // Hiển thị đủ hạn mức với tabular-nums
    expect(screen.getAllByText('4 người').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('6 người', { exact: true })).toBeInTheDocument();

    // Tăng số thành viên từ 4 -> 5 và kiểm tra URL Track A / Track B cập nhật theo
    await userEvent.click(screen.getByRole('button', { name: 'Tăng số thành viên' }));
    expect(screen.getByTestId('package-detail-member-count')).toHaveTextContent('5 người');

    const trackALink = screen.getByRole('link', { name: /Gia đình tự chọn bác sĩ/i });
    const trackBLink = screen.getByRole('link', { name: /Hệ thống gợi ý bác sĩ phù hợp/i });

    expect(trackALink).toHaveAttribute('href', '/doctors?packageId=pkg-live-2&members=5');
    expect(trackBLink).toHaveAttribute('href', '/doctors/matching?packageId=pkg-live-2&members=5');
  });

  it('does not contain forbidden typography classes (font-mono, font-black, font-extrabold)', () => {
    const files = [
      '../packages-catalog-view.tsx',
      '../package-detail-view.tsx',
    ];
    for (const rel of files) {
      const source = fs.readFileSync(path.resolve(__dirname, rel), 'utf-8');
      expect(source).not.toMatch(/\bfont-(mono|black|extrabold)\b/);
    }
  });
});
