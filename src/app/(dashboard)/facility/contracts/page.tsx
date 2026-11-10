import { FacilityContractsView } from '@/features/facility-contracts';

export const metadata = {
  title: 'Điều Phối Hợp Đồng 4 Bên & Gán Bác Sĩ (SCR-22) | BV ĐHYD TP.HCM',
  description: 'Tiếp nhận hợp đồng y tế gia đình từ Admin, kiểm tra định mức tải bác sĩ (BR-04) và ký số đại diện Cơ sở y tế',
};

export default function FacilityContractsPage() {
  return <FacilityContractsView />;
}
