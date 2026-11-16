import React from 'react';
import type { Metadata } from 'next';
import { FacilityContractsView } from '@/features/facility-contracts';

export const metadata: Metadata = {
  title: 'Hợp Đồng Cung Ứng Nhân Lực B2B & Điều Phối 4 Bên | Cơ Sở Y Tế FamiDoc',
  description:
    'Quản lý hợp đồng cung ứng nhân lực y tế B2B (Flow 2.1) và điều phối hợp đồng y tế 4 bên gia đình (SCR-22).',
};

export default function FacilityContractsPage() {
  return <FacilityContractsView />;
}
