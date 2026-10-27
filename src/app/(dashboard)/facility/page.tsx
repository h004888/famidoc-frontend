import { FacilityDashboardView } from '@/features/facility-dashboard';

export const metadata = {
  title: 'Tổng quan Cơ sở Y tế Đối tác | FamiDoc',
  description: 'Bảng điều khiển quản lý nhân sự y tế, lịch khám và doanh thu cơ sở đối tác FamiDoc',
};

export default function FacilityPage() {
  return <FacilityDashboardView />;
}

