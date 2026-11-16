import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DoctorDirectoryView, buildDoctorHref } from '../doctor-directory-view';
import { publicApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  publicApi: {
    getDoctors: vi.fn(),
    getFacilities: vi.fn(),
  },
}));

vi.mock('@/features/landing', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

const doctorItem = {
  id: 'doc-real-1',
  doctorName: 'BS. Lê Thị Bích',
  academicTitle: 'ThS.BS',
  specialty: 'Y học Gia đình & Nội Tổng Quát',
  ratingAvg: 4.88,
  totalReviews: 88,
  isAvailable: true,
  avatarUrl: 'https://images.unsplash.com/doctor-real-1',
  facility: {
    id: 'fac-1',
    facilityName: 'Bệnh viện Bạch Mai',
    address: 'Hà Nội',
  },
};

describe('CTA đăng ký trên /doctors dẫn vào hồ sơ bác sĩ thay vì /family/subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getFacilities).mockResolvedValue([]);
    vi.mocked(publicApi.getDoctors).mockResolvedValue({
      items: [doctorItem],
      pagination: { page: 1, pageSize: 9, totalRecords: 1, totalPages: 1 },
    });
  });

  it('buildDoctorHref giữ packageId khi có và bỏ query khi không có', () => {
    expect(buildDoctorHref('doc-1')).toBe('/doctors/doc-1');
    expect(buildDoctorHref('doc-1', null)).toBe('/doctors/doc-1');
    expect(buildDoctorHref('doc-1', 'FAMILY')).toBe('/doctors/doc-1?packageId=FAMILY');
    expect(buildDoctorHref('doc-1', '  ')).toBe('/doctors/doc-1');
  });

  it('link "Đăng ký Bác sĩ" trỏ tới /doctors/<id> và không còn /family/subscription/new', async () => {
    render(<DoctorDirectoryView />);

    await waitFor(() => {
      expect(screen.getByText('BS. Lê Thị Bích')).toBeInTheDocument();
    });

    const registerLink = screen.getByRole('link', { name: /Đăng ký Bác sĩ/i });
    expect(registerLink).toHaveAttribute('href', '/doctors/doc-real-1');

    const allHrefs = screen.getAllByRole('link').map((el) => el.getAttribute('href') ?? '');
    expect(allHrefs.some((href) => href.includes('/family/subscription'))).toBe(false);
  });

  it('khi có packageId: hiển thị banner ngữ cảnh và truyền tiếp packageId vào link bác sĩ', async () => {
    render(<DoctorDirectoryView packageId="FAMILY" />);

    await waitFor(() => {
      expect(screen.getByText('BS. Lê Thị Bích')).toBeInTheDocument();
    });

    const banner = screen.getByTestId('selected-package-banner');
    expect(banner).toHaveTextContent('FAMILY');
    expect(
      screen.getByRole('link', { name: /Đăng ký Bác sĩ/i })
    ).toHaveAttribute('href', '/doctors/doc-real-1?packageId=FAMILY');
    expect(screen.getByRole('link', { name: 'BS. Lê Thị Bích' })).toHaveAttribute(
      'href',
      '/doctors/doc-real-1?packageId=FAMILY'
    );
  });

  it('không hiển thị banner gói khi /doctors không có packageId', async () => {
    render(<DoctorDirectoryView />);

    await waitFor(() => {
      expect(screen.getByText('BS. Lê Thị Bích')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('selected-package-banner')).toBeNull();
  });
});
