import { AdminDashboardView } from '@/features/admin-dashboard';

export const metadata = {
  title: 'Trung tâm Quản trị Nền tảng (Admin Backoffice) | FamiDoc',
  description: 'Bảng điều khiển vận hành hệ thống y tế gia đình FamiDoc Pro',
};

export default function AdminPage() {
  return <AdminDashboardView />;
}

