import type { Metadata } from 'next';
import { FamilyMembersView } from '@/features/family-members';

export const metadata: Metadata = {
  title: 'Quản Lý Thành Viên & Hồ Sơ Sức Khỏe Gia Đình | FamiDoc Pro',
  description:
    'Quản lý danh sách thành viên hộ gia đình, thông tin BHYT, tiền sử bệnh và phân bổ bác sĩ gia đình phụ trách.',
};

export default function FamilyMembersPage() {
  return <FamilyMembersView />;
}

