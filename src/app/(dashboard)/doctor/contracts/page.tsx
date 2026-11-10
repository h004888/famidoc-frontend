import React from 'react';
import type { Metadata } from 'next';
import { DoctorContractsInboundView } from '@/features/doctor-dashboard';

export const metadata: Metadata = {
  title: 'Hợp Đồng Y Tế Phụ Trách | Bác Sĩ Gia Đình FamiDoc',
  description:
    'Danh sách các hợp đồng chăm sóc sức khỏe gia đình được Cơ sở y tế phân công cho Bác sĩ tiếp nhận trách nhiệm chuyên môn.',
};

export default function DoctorContractsPage() {
  return <DoctorContractsInboundView />;
}
