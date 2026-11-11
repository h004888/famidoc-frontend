import React from 'react';
import type { Metadata } from 'next';
import { DoctorContractsInboundView } from '@/features/doctor-dashboard';

export const metadata: Metadata = {
  title: 'Hợp Đồng Phụ Trách & Tiếp Nhận Y Tế (SCR-16) | FamiDoc Doctor',
  description:
    'Tiếp nhận phân công bác sĩ gia đình từ cơ sở y tế, xem xét tiền sử lâm sàng hộ gia đình và ký cam kết y đức.',
};

export default function DoctorContractsPage() {
  return <DoctorContractsInboundView />;
}
