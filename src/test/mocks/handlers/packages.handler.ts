import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const packageHandlers = [
  http.get(`${API_URL}/api/v1/packages`, () => {
    return HttpResponse.json({
      packages: [
        {
          id: 'pkg-basic',
          name: 'Chăm Sóc Cơ Bản',
          price: 499000,
          period: 'tháng',
          tier: 'Tiêu chuẩn',
          badgeColor: 'green',
          features: [
            '2 lần khám tận nhà / năm',
            'Tư vấn Telehealth không giới hạn',
            'Hồ sơ sức khỏe số E-Health',
          ],
        },
        {
          id: 'pkg-family',
          name: 'Gia Đình Toàn Diện',
          price: 1290000,
          period: 'tháng',
          tier: 'Toàn diện',
          badgeColor: 'amber',
          isPopular: true,
          features: [
            'Bác sĩ riêng chỉ định thăm khám',
            '6 lượt khám tận nhà / năm',
            'Xét nghiệm máu & sinh hóa cơ bản',
            'Hỗ trợ điều phối xe cứu thương',
          ],
        },
        {
          id: 'pkg-elderly',
          name: 'Chăm Sóc Người Cao Tuổi',
          price: 1850000,
          period: 'tháng',
          tier: 'Chuyên sâu',
          badgeColor: 'blue',
          features: [
            'Theo dõi huyết áp, đường huyết từ xa',
            'Điều dưỡng hỗ trợ tiêm truyền tại nhà',
            'Kê đơn và giao thuốc tận cửa',
          ],
        },
        {
          id: 'pkg-vip',
          name: 'Gia Đình Hoàng Gia',
          price: 3900000,
          period: 'tháng',
          tier: 'VIP Platinum',
          badgeColor: 'red',
          features: [
            'Khám tại nhà định kỳ hàng tháng',
            'Hội chẩn cùng chuyên gia đầu ngành',
            'Đặc quyền cấp cứu trực thăng liên kết',
          ],
        },
      ],
    });
  }),
];
