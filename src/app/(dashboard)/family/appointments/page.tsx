import type { Metadata } from 'next';
import { FamilyAppointmentsView } from '@/features/appointments';

export const metadata: Metadata = {
  title: 'Đặt Lịch Khám Tại Nhà & Telehealth 24/7 | FamiDoc Pro',
  description:
    'Đặt lịch hẹn bác sĩ gia đình thăm khám tận nhà hoặc tư vấn y tế từ xa qua video, theo dõi trạng thái tiếp nhận và hồ sơ điều phối.',
};

export default function FamilyAppointmentsPage() {
  return <FamilyAppointmentsView />;
}

