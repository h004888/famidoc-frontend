import { FacilityRevenueView } from '@/features/facility-revenue';

export const metadata = {
  title: 'Đối soát Doanh thu & Nhận tiền Hàng tháng | Bệnh viện Đối tác FamiDoc',
  description:
    'Đối soát doanh thu và nhận chi trả 85% định kỳ hàng tháng từ nền tảng FamiDoc (CSYT và bác sĩ tự thực hiện nghĩa vụ thuế theo quy định).',
};

export default function FacilityRevenuePage() {
  return <FacilityRevenueView />;
}

