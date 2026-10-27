import { AdminUsersView } from '@/features/admin-users';

export const metadata = {
  title: 'Quản trị Người dùng, Phân quyền RBAC & Audit Logs | FamiDoc Admin',
  description: 'Quản lý tài khoản toàn nền tảng, thiết lập vai trò và kiểm toán nhật ký an ninh',
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}

