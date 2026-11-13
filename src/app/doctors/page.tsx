import type { Metadata } from 'next';
import { DoctorDirectoryView } from '@/features/doctors';
import { LandingFloatingActions } from '@/features/landing';

export const metadata: Metadata = {
  title: 'Đội ngũ Bác sĩ Gia đình & Chuyên gia Y tế | FamiDoc Pro',
  description:
    'Tra cứu danh bạ hơn 1.200 bác sĩ gia đình có chứng chỉ hành nghề Bộ Y Tế, đặt lịch thăm khám tận nhà và tư vấn Telehealth trực tuyến 24/7 cùng chuyên gia FamiDoc Pro.',
};

export default function DoctorsPage() {
  return (
    <>
      <DoctorDirectoryView />
      <LandingFloatingActions />
    </>
  );
}
