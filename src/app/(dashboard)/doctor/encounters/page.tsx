import type { Metadata } from 'next';
import { DoctorEncountersView } from '@/features/doctor-encounters';

export const metadata: Metadata = {
  title: 'Sổ khám và kê đơn | FamiDoc',
  description: 'Xem lịch sử và ghi nhận lần khám cho từng thành viên.',
};

export default function DoctorEncountersPage() {
  return <DoctorEncountersView />;
}

