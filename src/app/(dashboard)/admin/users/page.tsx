import { AdminUsersView } from '@/features/admin-users';

export const metadata = {
  title: 'Quản lý Tài khoản & Phân quyền | FamiDoc Admin',
  description: 'Quản lý tài khoản toàn nền tảng, phân quyền truy cập và giám sát nhật ký hoạt động hệ thống',
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}

