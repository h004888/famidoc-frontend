import type { Metadata } from 'next';
import { DoctorTelemedicineView } from '@/features/doctor-telemedicine';

export const metadata: Metadata = {
  title: 'Phòng Khám Video Trực Tuyến WebRTC Telemedicine | FamiDoc Pro',
  description:
    'Phòng tư vấn khám bệnh trực tuyến bảo mật WebRTC chuẩn y tế, kết nối bác sĩ gia đình với người bệnh 24/7.',
};

export default function DoctorTelemedicinePage() {
  return <DoctorTelemedicineView />;
}

