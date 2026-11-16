import { http, HttpResponse } from 'msw';
import type {
  LandingDoctorItem,
  LandingPackageItem,
  LandingPortalMetrics,
} from '@/features/landing/types';

const API_BASE =
  process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const mockPortalMetrics: LandingPortalMetrics = {
  totalPartnerFacilities: 12,
  totalDoctors: 48,
  totalActivePackages: 4,
  totalFamiliesServed: 320,
};

export const mockPublicDoctors: LandingDoctorItem[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    academicTitle: 'Phó Giáo sư, Tiến sĩ',
    specialty: 'Nội tổng quát & Y học gia đình',
    experienceYears: 24,
    bio: 'Nguyên Trưởng khoa Khám bệnh BV Đại học Y Dược TP.HCM.',
    ratingAvg: 5.0,
    totalReviews: 480,
    isAvailable: true,
    avatarUrl: '/images/medsev/home-one/doctor/1.jpg',
    facility: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      facilityName: 'Bệnh viện Đại học Y Dược TP.HCM',
    },
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    doctorName: 'BSCKII Trần Mai Phương',
    academicTitle: 'Bác sĩ Chuyên khoa II',
    specialty: 'Nhi khoa & Dinh dưỡng',
    experienceYears: 18,
    bio: 'Từng công tác tại BV Nhi Đồng 1.',
    ratingAvg: 4.9,
    totalReviews: 620,
    isAvailable: true,
    avatarUrl: '/images/medsev/home-one/doctor/2.jpg',
    facility: {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      facilityName: 'Bệnh viện Nhi Đồng 1',
    },
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    doctorName: 'ThS.BS Lê Hoàng Nam',
    academicTitle: 'Thạc sĩ, Bác sĩ',
    specialty: 'Lão khoa & Tim mạch',
    experienceYears: 22,
    bio: 'Chuyên gia hội chẩn cấp cao bệnh lý người cao tuổi.',
    ratingAvg: 4.8,
    totalReviews: 210,
    isAvailable: true,
    avatarUrl: null,
    facility: {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      facilityName: 'Bệnh viện Chợ Rẫy',
    },
  },
];

export const mockPublicPackages: LandingPackageItem[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    packageCode: 'PKG-BASIC-1M',
    packageName: 'Gói Trải Nghiệm',
    durationMonths: 1,
    basePrice: 1000000,
    periodicVisitsQuota: 1,
    telehealthQuota: 1,
    maxMembers: 2,
    includedMembers: 1,
    additionalMemberMonthlyPrice: 75000,
    description: 'Thử nghiệm y tế gia đình 1 tháng.',
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    packageCode: 'PKG-FAMILY-3M',
    packageName: 'Gói Đồng Hành',
    durationMonths: 3,
    basePrice: 2850000,
    periodicVisitsQuota: 3,
    telehealthQuota: 4,
    maxMembers: 6,
    includedMembers: 3,
    additionalMemberMonthlyPrice: 75000,
    description: 'Chăm sóc gia đình tiêu chuẩn 3 tháng.',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    packageCode: 'PKG-ELDERLY-6M',
    packageName: 'Gói An Tâm',
    durationMonths: 6,
    basePrice: 6475000,
    periodicVisitsQuota: 7,
    telehealthQuota: 8,
    maxMembers: 8,
    includedMembers: 4,
    additionalMemberMonthlyPrice: 75000,
    description: 'Chăm sóc sức khỏe trung hạn 6 tháng.',
  },
  {
    id: '40000000-0000-4000-8000-000000000004',
    packageCode: 'PKG-ROYAL-12M',
    packageName: 'Gói Toàn Diện',
    durationMonths: 12,
    basePrice: 12600000,
    periodicVisitsQuota: 14,
    telehealthQuota: 24,
    maxMembers: 10,
    includedMembers: 6,
    additionalMemberMonthlyPrice: 75000,
    description: 'Bảo trợ y tế gia đình toàn diện 12 tháng.',
  },
];

export const landingHandlers = [
  http.get(`${API_BASE}/api/v1/public/portal-overview`, () => {
    return HttpResponse.json(
      {
        success: true,
        code: 200,
        data: {
          metrics: mockPortalMetrics,
          featuredFacilities: [],
          featuredPackages: [],
        },
      },
      { status: 200 }
    );
  }),

  http.get(`${API_BASE}/api/v1/public/doctors`, () => {
    return HttpResponse.json(
      {
        success: true,
        code: 200,
        data: mockPublicDoctors,
        meta: {
          pagination: {
            page: 1,
            pageSize: 3,
            totalRecords: mockPortalMetrics.totalDoctors,
            totalPages: 16,
          },
        },
      },
      { status: 200 }
    );
  }),

  http.get(`${API_BASE}/api/v1/public/packages`, () => {
    return HttpResponse.json(
      {
        success: true,
        code: 200,
        data: {
          items: mockPublicPackages,
          meta: {
            total: mockPublicPackages.length,
            page: 1,
            limit: 4,
            totalPages: 1,
          },
        },
      },
      { status: 200 }
    );
  }),

  http.post(`${API_BASE}/api/v1/public/consultation-requests`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const phone = body.phone as string;

    if (phone === '0900000000') {
      return HttpResponse.json(
        { message: 'Số điện thoại đã gửi yêu cầu trước đó' },
        { status: 400 }
      );
    }

    if (phone === '0911111111') {
      return HttpResponse.json({ message: 'Internal error' }, { status: 500 });
    }

    return HttpResponse.json(
      {
        success: true,
        code: 201,
        data: {
          ticketId: 'CRQ-TEST-999',
          status: 'RECEIVED',
          message: 'Yêu cầu tư vấn của bạn đã được tiếp nhận thành công.',
        },
      },
      { status: 201 }
    );
  }),
];
