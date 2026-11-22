import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FamilyTelemedicineView } from '@/features/family-telemedicine';

export const metadata: Metadata = {
  title: 'Phòng Khám Telehealth Trực Tuyến WebRTC | FamiDoc Pro',
  description:
    'Phòng khám trực tuyến bảo mật WebRTC kết nối trực tiếp gia đình với Bác sĩ quản nhiệm, hỗ trợ tư vấn video HD, theo dõi sinh hiệu và chat y tế.',
};

export default function FamilyTelemedicinePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Đang tải phòng khám...</div>}>
      <FamilyTelemedicineView />
    </Suspense>
  );
}
