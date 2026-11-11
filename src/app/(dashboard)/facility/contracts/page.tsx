import React from 'react';
import type { Metadata } from 'next';
import { FacilityContractInboundView } from '@/features/facility-coordination';

export const metadata: Metadata = {
  title: 'Điều Phối Hợp Đồng 4 Bên & Gán Bác Sĩ (SCR-22) | Cơ Sở Y Tế FamiDoc',
  description:
    'Tiếp nhận hợp đồng y tế gia đình từ Admin, kiểm tra định mức tải bác sĩ (BR-04) và ký số đại diện Cơ sở y tế.',
};

export default function FacilityContractsPage() {
  return <FacilityContractInboundView />;
}
