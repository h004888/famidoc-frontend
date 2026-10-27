import type { Metadata } from 'next';
import { FamilyMembersView } from '@/features/family-members';

export const metadata: Metadata = {
  title: 'Hồ Sơ Y Tế Thành Viên & Bệnh Án Điện Tử (EHR) | FamiDoc Pro',
  description:
    'Quản lý hồ sơ sức khỏe trọn đời của các thành viên gia đình, lịch sử khám chữa bệnh, đơn thuốc điện tử và kết quả xét nghiệm.',
};

export default function FamilyMembersPage() {
  return <FamilyMembersView />;
}

