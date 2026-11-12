import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { publicApi } from '@/lib/api/public.api';
import { DoctorDetailPageContent, generateMetadata, revalidate } from '@/app/doctors/[id]/page';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    const error = new Error('NEXT_NOT_FOUND');
    (error as any).digest = 'NEXT_NOT_FOUND';
    throw error;
  }),
}));

vi.mock('@/lib/api/public.api', () => ({
  publicApi: {
    getDoctorDetail: vi.fn(),
  },
}));

vi.mock('@/features/doctors', () => ({
  DoctorDetailView: vi.fn(({ id, initialDoctor }: any) => (
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
      const mockDoctor = {
        id: 'doc-01',
        doctorName: 'PGS. TS. Nguyễn Văn Hoài',
        academicTitle: 'PGS. TS.',
        specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
        bio: 'Hơn 24 năm kinh nghiệm thực hành lâm sàng.',
      };

      vi.mocked(publicApi.getDoctorDetail).mockResolvedValueOnce(mockDoctor as any);

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
      const mockDoctor = {
        id: 'doc-01',
        doctorName: 'PGS. TS. Nguyễn Văn Hoài',
        specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
      };

      vi.mocked(publicApi.getDoctorDetail).mockResolvedValueOnce(mockDoctor as any);

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
      expect(revalidate === undefined || revalidate === 3600).toBe(true);
    });
  });
});
