import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import {
  publicApi,
  PublicDoctorDetailDto,
  PublicDoctorReviewsResponse,
  SubmitConsultationPayload,
  ConsultationResponseDto,
} from '../public.api';

describe('Task 3: publicApi - Doctor Detail, Reviews, and Consultation Request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDoctorDetail', () => {
    it('calls GET /api/v1/public/doctors/:id and returns PublicDoctorDetailDto from envelope', async () => {
      const mockDoctorDetail: PublicDoctorDetailDto = {
        id: 'doc-01',
        doctorName: 'PGS. TS. Nguyễn Văn Hoài',
        academicTitle: 'PGS. TS.',
        specialty: 'Bác sĩ Gia đình & Nội Tổng Quát',
        specialtyKey: 'general',
        cchnNumber: 'CCHN-001892/BYT-CCHN',
        experienceYears: 24,
        ratingAvg: 4.96,
        totalReviews: 384,
        consultationCount: 2400,
        hospital: 'Bệnh viện Đại học Y Dược TP.HCM',
        location: 'TP. Hồ Chí Minh',
        avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
        services: ['home', 'telehealth', 'clinic'],
        bio: 'Bác sĩ đầu ngành với hơn 24 năm kinh nghiệm.',
        education: ['Tiến sĩ Y khoa - Paris Descartes (2008)'],
        schedule: 'Thứ 2 - Thứ 7: 08:00 - 18:00',
        carePackages: [
          {
            id: 'pkg-1',
            name: 'Gói Đồng Hành',
            price: 2850000,
            durationMonths: 3,
            features: ['3 lượt khám tại nhà'],
          },
        ],
        facility: {
          id: 'fac-01',
          facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
        },
      };

      const envelopeResponse = {
        success: true,
        code: 200,
        message: 'Lấy thông tin chi tiết bác sĩ thành công',
        data: mockDoctorDetail,
      };

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(envelopeResponse);

      const result = await publicApi.getDoctorDetail('doc-01');

      expect(getSpy).toHaveBeenCalledWith('/api/v1/public/doctors/doc-01');
      expect(result).toEqual(mockDoctorDetail);
      expect(result.doctorName).toBe('PGS. TS. Nguyễn Văn Hoài');
      expect(result.carePackages).toHaveLength(1);
    });

    it('returns direct response if not wrapped in standard data envelope', async () => {
      const rawDoctor = {
        id: 'doc-02',
        doctorName: 'ThS. BS. CKII Trần Thị Thu Trang',
        specialty: 'Nhi Khoa & Dinh Dưỡng Trẻ Em',
      };

      vi.spyOn(httpClient, 'get').mockResolvedValueOnce(rawDoctor);

      const result = await publicApi.getDoctorDetail('doc-02');
      expect(result.id).toBe('doc-02');
      expect(result.doctorName).toBe('ThS. BS. CKII Trần Thị Thu Trang');
    });
  });

  describe('getDoctorReviews', () => {
    it('calls GET /api/v1/public/doctors/:id/reviews and returns paginated reviews from envelope', async () => {
      const mockReviewsEnvelope = {
        success: true,
        code: 200,
        data: [
          {
            id: 'rev-1',
            authorName: 'Trần Minh Anh',
            rating: 5,
            comment: 'Bác sĩ khám rất tận tâm và kỹ lưỡng!',
            createdAt: '2026-10-15T08:30:00.000Z',
            serviceName: 'Khám tại nhà',
            verified: true,
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

      const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValueOnce(mockReviewsEnvelope);

      const result: PublicDoctorReviewsResponse = await publicApi.getDoctorReviews('doc-01', {
        page: 1,
        limit: 5,
      });

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/public/doctors/doc-01/reviews',
        { page: 1, limit: 5 }
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].authorName).toBe('Trần Minh Anh');
      expect(result.pagination?.totalRecords).toBe(28);
      expect(result.pagination?.hasNextPage).toBe(true);
    });

    it('returns empty items array when response data is empty or null', async () => {
      vi.spyOn(httpClient, 'get').mockResolvedValueOnce({
        success: true,
        data: null,
      });

      const result = await publicApi.getDoctorReviews('doc-none');
      expect(result.items).toEqual([]);
      expect(result.pagination).toBeUndefined();
    });

    it('handles direct array response without envelope', async () => {
      const rawReviews = [
        {
          id: 'rev-2',
          authorName: 'Lê Hoàng',
          rating: 5,
          createdAt: '2026-10-20T10:00:00.000Z',
        },
      ];
      vi.spyOn(httpClient, 'get').mockResolvedValueOnce(rawReviews);

      const result = await publicApi.getDoctorReviews('doc-01');
      expect(result.items).toEqual(rawReviews);
      expect(result.pagination).toBeUndefined();
    });
  });

  describe('submitConsultationRequest', () => {
    it('calls POST /api/v1/public/consultation-requests with payload and returns ticket response from envelope', async () => {
      const payload: SubmitConsultationPayload = {
        fullName: 'Nguyễn Văn Minh',
        phone: '0912345678',
        email: 'minh.nguyen@famidoc.vn',
        preferredPackageId: 'pkg-1',
        healthNeeds: 'Gia đình có người cao tuổi cần theo dõi huyết áp định kỳ tại nhà.',
        familyMemberCount: 4,
      };

      const mockResponse: ConsultationResponseDto = {
        ticketId: 'CRQ-L9X4K2-A1B2',
        status: 'RECEIVED',
        message: 'Tiếp nhận yêu cầu tư vấn thành công.',
        submittedAt: '2026-11-02T09:45:00.000Z',
      };

      const postSpy = vi.spyOn(httpClient, 'post').mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      });

      const result = await publicApi.submitConsultationRequest(payload);

      expect(postSpy).toHaveBeenCalledWith('/api/v1/public/consultation-requests', payload);
      expect(result.ticketId).toBe('CRQ-L9X4K2-A1B2');
      expect(result.status).toBe('RECEIVED');
    });

    it('returns direct response if not wrapped in envelope', async () => {
      const payload: SubmitConsultationPayload = {
        fullName: 'Trần Văn B',
        phone: '0987654321',
        healthNeeds: 'Cần tư vấn gói dinh dưỡng trẻ nhỏ.',
      };

      const mockResponse: ConsultationResponseDto = {
        ticketId: 'CRQ-DIRECT-1234',
        status: 'RECEIVED',
        message: 'Đã nhận hồ sơ',
      };

      vi.spyOn(httpClient, 'post').mockResolvedValueOnce(mockResponse);

      const result = await publicApi.submitConsultationRequest(payload);
      expect(result.ticketId).toBe('CRQ-DIRECT-1234');
    });
  });
});
