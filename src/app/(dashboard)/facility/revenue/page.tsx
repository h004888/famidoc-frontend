import { FacilityRevenueView } from '@/features/facility-revenue';

export const metadata = {
  title: 'Đối soát Doanh thu B2B & Ký số | Bệnh viện Đối tác FamiDoc',
  description: 'Theo dõi phân bổ doanh thu theo tỷ lệ cam kết 70/30 và giải ngân quỹ Escrow với nền tảng',
};

export default function FacilityRevenuePage() {
  return <FacilityRevenueView />;
}

