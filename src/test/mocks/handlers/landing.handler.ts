import { http, HttpResponse } from 'msw';
import { CorePackageData, DoctorCardData } from '@/features/landing/types';

const API_BASE = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const mockCorePackages: CorePackageData[] = [
  {
    id: 'pkg-basic',
    name: 'Chăm Sóc Cơ Bản',
    tag: 'Tiêu chuẩn',
    tagType: 'standard',
    price: 499000,
    period: 'tháng',
    description: 'Dành cho cá nhân hoặc vợ chồng trẻ duy trì khám định kỳ.',
    icon: 'home_health',
    features: [
      '2 lần khám tận nhà / năm',
      'Tư vấn Telehealth không giới hạn',
      'Hồ sơ sức khỏe số E-Health',
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'pkg-family',
    name: 'Gia Đình Toàn Diện',
    tag: 'Toàn diện',
    tagType: 'popular',
    price: 1290000,
    period: 'tháng',
    description: 'Gói tối ưu cho 4 thành viên (cha mẹ và 2 con nhỏ).',
    icon: 'diversity_1',
    isPopular: true,
    features: [
      'Bác sĩ riêng chỉ định thăm khám',
      '6 lượt khám tận nhà / năm',
      'Xét nghiệm máu & sinh hóa cơ bản',
      'Hỗ trợ điều phối xe cứu thương',
    ],
    ctaText: 'Đăng ký ngay',
  },
  {
    id: 'pkg-elderly',
    name: 'Chăm Sóc Người Cao Tuổi',
    tag: 'Chuyên sâu',
    tagType: 'advanced',
    price: 1850000,
    period: 'tháng',
    description: 'Theo dõi chuyên biệt bệnh mạn tính: Tim mạch, Tiểu đường.',
    icon: 'elderly',
    features: [
      'Theo dõi huyết áp, đường huyết từ xa',
      'Điều dưỡng hỗ trợ tiêm truyền tại nhà',
      'Kê đơn và giao thuốc tận cửa',
    ],
    ctaText: 'Chọn gói này',
  },
  {
    id: 'pkg-vip',
    name: 'Gia Đình Hoàng Gia',
    tag: 'VIP Platinum',
    tagType: 'vip',
    price: 3900000,
    period: 'tháng',
    description: 'Đội ngũ Phó Giáo sư, Tiến sĩ trực tiếp phụ trách 24/7.',
    icon: 'workspace_premium',
    features: [
      'Khám tại nhà định kỳ hàng tháng',
      'Hội chẩn cùng chuyên gia đầu ngành',
      'Đặc quyền cấp cứu trực thăng liên kết',
    ],
    ctaText: 'Chọn gói này',
  },
];

export const mockFeaturedDoctors: DoctorCardData[] = [
  {
    id: 'doc-nghia',
    name: 'PGS.TS Nguyễn Trọng Nghĩa',
    title: 'Trưởng khoa Nội tổng quát',
    rating: 4.9,
    consultations: '420+ lượt khám',
    experience: 'Nguyên Trưởng khoa Khám bệnh BV Đại học Y Dược, hơn 22 năm kinh nghiệm quản trị bệnh mạn tính và y học gia đình.',
    license: 'CCHN: 004128/BYT',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuHmZZ-AjQ3V3EHVn3Zl50pQWoGMVEomQvOT78CwjV_zQ1pXgIE1ohGP5F_dVA0wYR0eq09yHtuJbiGPX5X-Ug85qsSgl1SDghHPhWK7i5Gdgt1yYQANVxl2kGz1I8tXZzg4GIjfqDvyD4Gprhk5DgtIk6DF8EsPhORaBNjpP0UD5sd2KVTi9tfs2mZnwpcMK4MMt_CBEk-fjGuX32KSxqDJXmCljTGW1UgrnvJu74XuyVdgKykM7tsw',
  },
  {
    id: 'doc-phuong',
    name: 'BSCKII Trần Mai Phương',
    title: 'Chuyên gia Nhi & Y học gia đình',
    rating: 5.0,
    consultations: '680+ lượt khám',
    experience: '16 năm đồng hành chăm sóc sức khỏe dinh dưỡng và bệnh lý trẻ sơ sinh tại Bệnh viện Nhi Đồng, thành viên Hội Nhi khoa Quốc tế.',
    license: 'CCHN: 009821/BYT',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVFPvjHiePB6Tzc0DZTNDgXt8iVSqbzY94uuiPhlChF5Ou8hV6cYKYxw3sKdjJ2DJr8nQ1Egivwt0QBF9DXnU0R2yJSPRbENhek6PGYxwY-ljI0jMIVQkjxGEoov4ARw3U79LxZS_Le4vjvwzf02Svt_TW45g2YbBxWWaeibTvdNL-zLv_g_gm8M0yr2VEsnouCuVkVqUJrgk6AvIlTIw-FOsn6xnFgbM83zjxwQTW6rEQFkYVtfwSUg',
  },
];

export const landingHandlers = [
  http.get(`${API_BASE}/api/v1/packages/core`, () => {
    return HttpResponse.json(mockCorePackages, { status: 200 });
  }),

  http.get(`${API_BASE}/api/v1/doctors/featured`, () => {
    return HttpResponse.json(mockFeaturedDoctors, { status: 200 });
  }),

  http.post(`${API_BASE}/api/v1/leads/consultation`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const phone = body.phoneNumber as string;

    if (phone === '0900000000') {
      return HttpResponse.json({ message: 'Số điện thoại đã gửi yêu cầu trước đó' }, { status: 400 });
    }

    if (phone === '0911111111') {
      return HttpResponse.json({ message: 'Internal error' }, { status: 500 });
    }

    return HttpResponse.json({ success: true, leadId: 'lead-999' }, { status: 201 });
  }),
];
