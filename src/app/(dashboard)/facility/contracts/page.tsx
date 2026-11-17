import React from 'react';
import type { Metadata } from 'next';
import { FacilityContractsView } from '@/features/facility-contracts';

export const metadata: Metadata = {
  title: 'Hợp đồng Hợp tác B2B | Cơ sở Y tế FamiDoc',
  description:
    'Quản lý hợp đồng khung 2 bên về phân chia doanh thu và cung ứng dịch vụ bác sĩ gia đình giữa Cơ sở Y tế và FamiDoc.',
};

export default function FacilityContractsPage() {
  return <FacilityContractsView />;
}
