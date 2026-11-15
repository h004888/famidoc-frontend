import { FacilityStaffView } from '@/features/facility-staff';

export const metadata = {
  title: 'Quản lý Bác sĩ Trực thuộc | Cơ Sở Y Tế FamiDoc',
  description: 'Khởi tạo tài khoản Bác sĩ trực thuộc (Flow 2.1 - API 14) và thẩm định hồ sơ CCHN',
};

export default function FacilityDoctorsPage() {
  return <FacilityStaffView />;
}
