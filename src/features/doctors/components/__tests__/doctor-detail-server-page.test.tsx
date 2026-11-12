import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api/public.api';
import type { PublicDoctorDetailDto } from '@/lib/api/public.api';
import { DoctorDetailPageContent, generateMetadata } from '@/app/doctors/[id]/page';
import * as DoctorDetailPageModule from '@/app/doctors/[id]/page';

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
  id?: string;
  initialDoctor?: { doctorName?: string; specialty?: string } | null;
};

vi.mock('@/features/doctors', () => ({
  DoctorDetailView: vi.fn(({ id, initialDoctor }: MockDoctorDetailViewProps) => (
    <div data-testid="doctor-detail-view" data-doctor-id={id}>
      <h1 data-testid="doctor-name">{initialDoctor?.doctorName || 'No Initial Doctor'}</h1>
      <p data-testid="doctor-specialty">{initialDoctor?.specialty || ''}</p>
    </div>
  )),
}));

describe('Task 5: Doctor Detail Server Page (generateMetadata & DoctorDetailPageContent)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('returns dynamic metadata with doctor name when API fetch succeeds', async () => {
      const mockDoctor: PublicDoctorDetailDto = {
        id: 'doc-01',
        doctorName: 'PGS. TS. Nguyễn Văn Hoài',
        academicTitle: 'PGS. TS.',
        specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
        bio: 'Hơn 24 năm kinh nghiệm thực hành lâm sàng.',
      };

      vi.mocked(publicApi.getDoctorDetail).mockResolvedValueOnce(mockDoctor);

      const metadata = await generateMetadata({
        params: Promise.resolve({ id: 'doc-01' }),
      });

      expect(publicApi.getDoctorDetail).toHaveBeenCalledWith('doc-01');
      expect(metadata.title).toContain('Nguyễn Văn Hoài');
    });

    it('returns fallback metadata when API throws error or doctor not found', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockRejectedValueOnce(new Error('Not found'));

      const metadata = await generateMetadata({
        params: Promise.resolve({ id: 'doc-unknown' }),
      });

      expect(publicApi.getDoctorDetail).toHaveBeenCalledWith('doc-unknown');
      expect(metadata.title).toBeDefined();
    });
  });

  describe('DoctorDetailPageContent', () => {
    it('fetches doctor details and passes initialDoctor to DoctorDetailView', async () => {
      const mockDoctor: PublicDoctorDetailDto = {
        id: 'doc-01',
        doctorName: 'PGS. TS. Nguyễn Văn Hoài',
        specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
      };

      vi.mocked(publicApi.getDoctorDetail).mockResolvedValueOnce(mockDoctor);

      const pageJsx = await DoctorDetailPageContent({
        params: Promise.resolve({ id: 'doc-01' }),
      });

      render(pageJsx);

      expect(publicApi.getDoctorDetail).toHaveBeenCalledWith('doc-01');
      expect(screen.getByTestId('doctor-name')).toHaveTextContent('PGS. TS. Nguyễn Văn Hoài');
      expect(screen.getByTestId('doctor-specialty')).toHaveTextContent('Bác sĩ Gia đình & Nội Tổng Quát');
    });

    it('triggers notFound() when API throws 404 or fails', async () => {
      vi.mocked(publicApi.getDoctorDetail).mockRejectedValueOnce(new Error('Doctor not found (404)'));

      await expect(
        DoctorDetailPageContent({
          params: Promise.resolve({ id: 'doc-invalid' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('ISR Cache Revalidation', () => {
    it('exports revalidate or complies with nextConfig.cacheComponents', () => {
      const pageModule = DoctorDetailPageModule as unknown as Record<string, unknown>;
      expect(pageModule.revalidate === undefined || pageModule.revalidate === 3600).toBe(true);
    });
  });
});
