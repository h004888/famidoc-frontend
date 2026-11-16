import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api/public.api';
import type { PublicDoctorDetailDto } from '@/lib/api/public.api';
import { ApiError } from '@/lib/http/errors';
import {
  DoctorDetailPageContent,
  generateMetadata,
  getDoctorDetail,
} from '@/app/doctors/[id]/page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    const error = new Error('NEXT_NOT_FOUND') as Error & { digest?: string };
    error.digest = 'NEXT_NOT_FOUND';
    throw error;
  }),
}));

vi.mock('@/lib/api/public.api', () => ({
  publicApi: {
    getDoctorDetail: vi.fn(),
  },
}));

type MockDoctorDetailViewProps = {
  initialDoctor?: { doctorName?: string; specialty?: string } | null;
};

vi.mock('@/features/doctors', () => ({
  DoctorDetailView: vi.fn(({ initialDoctor }: MockDoctorDetailViewProps) => (
    <div data-testid="doctor-detail-view">
      <h1 data-testid="doctor-name">{initialDoctor?.doctorName || 'No Doctor'}</h1>
      <p data-testid="doctor-specialty">{initialDoctor?.specialty || ''}</p>
    </div>
  )),
}));

function buildDoctor(overrides: Partial<PublicDoctorDetailDto> = {}): PublicDoctorDetailDto {
  return {
    id: 'doc-01',
    doctorName: 'Nguyễn Văn Hoài',
    academicTitle: 'PGS. TS.',
    specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
    specialtyKey: 'general',
    avatarUrl: null,
    bio: 'Hơn 24 năm kinh nghiệm thực hành lâm sàng.',
    isVerified: true,
    isAvailable: true,
    panel: { activeCount: 10, maxCapacity: 30 },
    stats: {
      experienceYears: 24,
      ratingAvg: 4.9,
      totalReviews: 40,
      completedEncounters: 300,
    },
    facility: null,
    credentials: [],
    treatedCases: [],
    careModel: { serviceModes: [], commitments: [] },
    carePackages: [],
    reviews: { ratingAvg: 4.9, totalReviews: 40, items: [] },
    ...overrides,
  };
}

describe('Doctor Detail Server Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('returns dynamic metadata with the doctor name and bio', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockResolvedValueOnce(
        buildDoctor({ id: 'meta-1' })
      );

      const metadata = await generateMetadata({
        params: Promise.resolve({ id: 'meta-1' }),
      });

      expect(publicApi.getDoctorDetail).toHaveBeenCalledWith('meta-1');
      expect(metadata.title).toContain('Nguyễn Văn Hoài');
      expect(metadata.description).toBe(
        'Hơn 24 năm kinh nghiệm thực hành lâm sàng.'
      );
    });

    it('uses a fallback description when the doctor has no bio', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockResolvedValueOnce(
        buildDoctor({ id: 'meta-2', bio: null, academicTitle: null })
      );

      const metadata = await generateMetadata({
        params: Promise.resolve({ id: 'meta-2' }),
      });

      expect(metadata.title).toContain('Nguyễn Văn Hoài');
      expect(metadata.description).toContain('Nguyễn Văn Hoài');
    });

    it('returns fallback metadata when the API fails', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockRejectedValueOnce(
        new Error('Not found')
      );

      const metadata = await generateMetadata({
        params: Promise.resolve({ id: 'meta-unknown' }),
      });

      expect(metadata.title).toBeDefined();
    });
  });

  describe('DoctorDetailPageContent', () => {
    it('fetches the doctor and passes the full payload to DoctorDetailView', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockResolvedValueOnce(
        buildDoctor({ id: 'page-1' })
      );

      const pageJsx = await DoctorDetailPageContent({
        params: Promise.resolve({ id: 'page-1' }),
      });

      render(pageJsx);

      expect(publicApi.getDoctorDetail).toHaveBeenCalledWith('page-1');
      expect(screen.getByTestId('doctor-name')).toHaveTextContent(
        'Nguyễn Văn Hoài'
      );
      expect(screen.getByTestId('doctor-specialty')).toHaveTextContent(
        'Bác sĩ Gia đình & Nội Tổng Quát'
      );
    });

    it('triggers notFound() when the API fails', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockRejectedValueOnce(
        new Error('Doctor not found (404)')
      );

      await expect(
        DoctorDetailPageContent({
          params: Promise.resolve({ id: 'page-invalid' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });

    it('rethrows server/network ApiError (>= 500) instead of masking it as 404', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(publicApi.getDoctorDetail).mockRejectedValueOnce(
        new ApiError('fetch failed', 500)
      );

      await expect(
        DoctorDetailPageContent({
          params: Promise.resolve({ id: 'page-500' }),
        })
      ).rejects.toThrow('fetch failed');

      expect(notFound).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('request deduplication', () => {
    it('shares one fetch between metadata and page while they run concurrently', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockResolvedValue(
        buildDoctor({ id: 'dedupe-1' })
      );

      await Promise.all([
        getDoctorDetail('dedupe-1'),
        getDoctorDetail('dedupe-1'),
      ]);

      expect(publicApi.getDoctorDetail).toHaveBeenCalledTimes(1);
    });
  });
});
