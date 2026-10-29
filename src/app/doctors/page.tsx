import type { Metadata } from 'next';
import { DoctorDirectoryView } from '@/features/doctors';
import { LandingFloatingActions } from '@/features/landing';

export const metadata: Metadata = {
  title: 'Danh mục Bác sĩ & Cơ sở Y tế Đối tác | FamiDoc Pro',
  description:
    'Tra cứu thông tin hơn 1.200 bác sĩ gia đình có chứng chỉ hành nghề Bộ Y Tế và mạng lưới bệnh viện, phòng khám đối tác tuyến đầu liên kết với FamiDoc Pro.',
};

export default function DoctorsPage() {
  return (
    <>
      <DoctorDirectoryView />
      <LandingFloatingActions />
    </>
  );
}
