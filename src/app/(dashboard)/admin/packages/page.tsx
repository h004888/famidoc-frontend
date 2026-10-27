import { AdminPackagesView } from '@/features/admin-packages';

export const metadata = {
  title: 'Quản trị Gói Dịch vụ Chăm sóc | FamiDoc Admin',
  description: 'Cấu hình quyền lợi, biểu giá 1-3-12 tháng và phát hành các gói chăm sóc sức khỏe gia đình',
};

export default function AdminPackagesPage() {
  return <AdminPackagesView />;
}

