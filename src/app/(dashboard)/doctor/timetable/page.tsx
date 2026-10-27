import type { Metadata } from 'next';
import { DoctorTimetableView } from '@/features/doctor-timetable';

export const metadata: Metadata = {
  title: 'Lịch Làm Việc Lâm Sàng & Quản Lý Panel Cap | FamiDoc Pro',
  description:
    'Quản lý thời gian biểu khám tại nhà, lịch tư vấn từ xa và hạn mức bệnh nhân quản nhiệm của bác sĩ gia đình.',
};

export default function DoctorTimetablePage() {
  return <DoctorTimetableView />;
}

