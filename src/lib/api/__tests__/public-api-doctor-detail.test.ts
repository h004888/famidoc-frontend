import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import {
  publicApi,
  PublicDoctorDetailDto,
  PublicDoctorReviewsResponse,
} from '../public.api';

describe('publicApi - Doctor Detail and Reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDoctorDetail', () => {
    it('calls GET /api/v1/public/doctors/:id and returns the canonical profile from the envelope', async () => {
      const mockDoctorDetail: PublicDoctorDetailDto = {
        id: 'doc-01',
        doctorName: 'Nguyễn Văn Hoài',
        academicTitle: 'PGS. TS.',
        specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
        specialtyKey: 'general',
        avatarUrl: '/images/doctor-1.jpg',
        bio: 'Bác sĩ đầu ngành với hơn 24 năm kinh nghiệm.',
        isVerified: true,
        isAvailable: true,
        panel: { activeCount: 18, maxCapacity: 30 },
        stats: {
          experienceYears: 24,
          ratingAvg: 4.96,
          totalReviews: 384,
          completedEncounters: 2400,
        },
        facility: {
          id: 'fac-1',
          facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
          address: '215 Hồng Bàng, Quận 5',
          verificationStatus: 'ACTIVE',
        },
        credentials: [
          {
            id: 'cred-1',
            type: 'DEGREE',
            typeLabel: 'Bằng cấp chuyên môn',
            issuingAuthority: 'Đại học Paris Descartes',
            issueYear: 2008,
            verified: true,
          },
        ],
        treatedCases: [{ id: 'case-1', summary: 'Quản lý tăng huyết áp.' }],
        careModel: {
          serviceModes: [
            {
              id: 'care-1',
              category: 'SERVICE_MODE',
              title: 'Khám tận nhà',
              description: 'Khám tại nhà.',
              icon: 'home',
              sortOrder: 1,
            },
          ],
          commitments: [],
        },
        carePackages: [
          {
            id: 'pkg-1',
            packageCode: 'PKG-FAMILY-01',
            packageName: 'Gói Đồng Hành',
            durationMonths: 3,
            basePrice: 2850000,
            formattedPrice: '2.850.000đ',
            periodicVisitsQuota: 3,
            telehealthQuota: 4,
            includedMembers: 3,
            maxMembers: 6,
            additionalMemberMonthlyPrice: 75000,
          },
        ],
        reviews: {
          ratingAvg: 4.96,
          totalReviews: 384,
          items: [
            {
              id: 'rev-1',
              patientDisplayName: 'Nguyễn V. A.',
              ratingStars: 5,
              comment: 'Bác sĩ rất tận tâm.',
              packageName: 'Gói Đồng Hành',
              district: 'Quận 7',
              reviewedAt: '2026-11-01T08:30:00.000Z',
            },
          ],
        },
      };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
        success: true,
        code: 200,
        data: mockDoctorDetail,
      });

      const result = await publicApi.getDoctorDetail('doc-01');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/public/doctors/doc-01');
      expect(result).toEqual(mockDoctorDetail);
      expect(result.panel).toEqual({ activeCount: 18, maxCapacity: 30 });
      expect(result.reviews.items[0].patientDisplayName).toBe('Nguyễn V. A.');
    });

    it('returns the direct response when the backend does not wrap an envelope', async () => {
      const rawDoctor = {
        id: 'doc-02',
        doctorName: 'Trần Thị Thu Trang',
        specialty: 'Nhi Khoa',
      } as PublicDoctorDetailDto;

      vi.spyOn(httpClient, 'get').mockResolvedValueOnce(rawDoctor);

      const result = await publicApi.getDoctorDetail('doc-02');
      expect(result.id).toBe('doc-02');
      expect(result.doctorName).toBe('Trần Thị Thu Trang');
    });
  });

  describe('getDoctorReviews', () => {
    it('calls GET /api/v1/public/doctors/:id/reviews and maps the paginated envelope', async () => {
      const mockReviewsEnvelope = {
        success: true,
        code: 200,
        data: [
          {
            id: 'rev-1',
            patientDisplayName: 'Nguyễn V. A.',
            ratingStars: 5,
            comment: 'Bác sĩ khám rất tận tâm và kỹ lưỡng!',
            packageName: 'Gói Đồng Hành',
            district: 'Quận 7',
            reviewedAt: '2026-10-15T08:30:00.000Z',
          },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 5,
            totalRecords: 28,
            totalPages: 6,
            hasNextPage: true,
          },
        },
      };

      const getSpy = vi
        .spyOn(httpClient, 'get')
        .mockResolvedValueOnce(mockReviewsEnvelope);

      const result: PublicDoctorReviewsResponse = await publicApi.getDoctorReviews(
        'doc-01',
        { page: 1, limit: 5 }
      );

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/public/doctors/doc-01/reviews',
        { page: 1, limit: 5 }
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].patientDisplayName).toBe('Nguyễn V. A.');
      expect(result.pagination?.totalRecords).toBe(28);
      expect(result.pagination?.hasNextPage).toBe(true);
    });

    it('returns empty items when the response data is empty', async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
        success: true,
        data: null,
      });

      const result = await publicApi.getDoctorReviews('doc-none');
      expect(result.items).toEqual([]);
      expect(result.pagination).toBeUndefined();
    });

    it('handles a direct array response without an envelope', async () => {
      const rawReviews = [
        {
          id: 'rev-2',
          patientDisplayName: 'Lê H.',
          ratingStars: 5,
          reviewedAt: '2026-10-20T10:00:00.000Z',
        },
      ];
      vi.spyOn(httpClient, 'get').mockResolvedValueOnce(rawReviews);

      const result = await publicApi.getDoctorReviews('doc-01');
      expect(result.items).toEqual(rawReviews);
      expect(result.pagination).toBeUndefined();
    });
  });

  it('no longer exposes the consultation request client', () => {
    expect('submitConsultationRequest' in publicApi).toBe(false);
  });
});
