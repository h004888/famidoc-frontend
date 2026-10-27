import type { Metadata } from 'next';
import { DoctorVerificationView } from '@/features/doctor-verification';

export const metadata: Metadata = {
  title: 'Hồ Sơ Y Khoa & Xác Thực Chứng Chỉ Hành Nghề (CCHN) | FamiDoc Pro',
  description:
    'Nộp và thẩm định chứng chỉ hành nghề Bộ Y Tế, văn bằng y khoa chuyên khoa và chứng thư ký số điện tử của bác sĩ.',
};

export default function DoctorVerificationPage() {
  return <DoctorVerificationView />;
}

