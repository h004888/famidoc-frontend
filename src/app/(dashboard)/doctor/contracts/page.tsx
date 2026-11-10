import { DoctorContractsView } from '@/features/doctor-contracts';

export const metadata = {
  title: 'Hợp Đồng Phụ Trách & Ký Cam Kết Y Đức (SCR-16) | FamiDoc Doctor',
  description: 'Tiếp nhận phân công bác sĩ gia đình từ bệnh viện, xem xét tiền sử lâm sàng hộ gia đình và ký cam kết y đức',
};

export default function DoctorContractsPage() {
  return <DoctorContractsView />;
}
