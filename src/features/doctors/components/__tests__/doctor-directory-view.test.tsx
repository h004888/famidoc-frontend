import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DoctorDirectoryView } from '../doctor-directory-view';
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

describe('DoctorDirectoryView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(publicApi.getFacilities).mockResolvedValue([]);
  });

  it('renders doctors from API and does not depend on cchnNumber', async () => {
    vi.mocked(publicApi.getDoctors).mockResolvedValue({
      items: [
        {
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
        },
      ],
      pagination: {
        page: 1,
        pageSize: 9,
        totalRecords: 1,
        totalPages: 1,
      },
    });

    render(<DoctorDirectoryView />);

    await waitFor(() => {
      expect(screen.getByText('BS. Lê Thị Bích')).toBeInTheDocument();
      expect(screen.getByText('Bệnh viện Bạch Mai')).toBeInTheDocument();
      expect(screen.getByText('ThS.BS')).toBeInTheDocument();
    });

    expect(screen.queryByText(/CCHN/i)).not.toBeInTheDocument();
  });

  it('triggers publicApi.getDoctors with city when city filter changes', async () => {
    vi.mocked(publicApi.getDoctors).mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 9, totalRecords: 0, totalPages: 1 },
    });

    render(<DoctorDirectoryView />);

    const citySelect = screen.getAllByRole('combobox').find((el) => el.innerHTML.includes('Hà Nội'));
    expect(citySelect).toBeDefined();

    if (citySelect) {
      fireEvent.change(citySelect, { target: { value: 'Hà Nội' } });
      await waitFor(() => {
        expect(publicApi.getDoctors).toHaveBeenCalledWith(
          expect.objectContaining({ city: 'Hà Nội' })
        );
      });
    }
  });

  it('renders skeleton cards while loading and does not render mock doctors initially', async () => {
    let resolvePromise!: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(publicApi.getDoctors).mockReturnValue(pendingPromise as never);

    render(<DoctorDirectoryView />);

    // 1. Should render skeleton container and cards
    expect(screen.getByTestId('doctors-skeleton-grid')).toBeInTheDocument();
    const skeletons = screen.getAllByTestId('doctor-skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);

    // 2. Should NOT render any mock doctor names
    expect(screen.queryByText('Nguyễn Văn Hoài')).not.toBeInTheDocument();
    expect(screen.queryByText('Trần Thị Thu Trang')).not.toBeInTheDocument();

    // 3. When API resolves, skeleton disappears and real doctor appears
    resolvePromise({
      items: [
        {
          id: 'doc-real-99',
          doctorName: 'BS. Triệu Tuấn Anh',
          academicTitle: 'BS.CKII',
          specialty: 'Tim Mạch',
          ratingAvg: 4.95,
          totalReviews: 120,
          isAvailable: true,
          avatarUrl: 'https://images.unsplash.com/doc-real-99',
          facility: {
            id: 'fac-99',
            facilityName: 'Bệnh viện Chợ Rẫy',
          },
        },
      ],
      pagination: { page: 1, pageSize: 9, totalRecords: 1, totalPages: 1 },
    });

    await waitFor(() => {
      expect(screen.queryByTestId('doctors-skeleton-grid')).not.toBeInTheDocument();
      expect(screen.getByText('BS. Triệu Tuấn Anh')).toBeInTheDocument();
    });
  });
});
