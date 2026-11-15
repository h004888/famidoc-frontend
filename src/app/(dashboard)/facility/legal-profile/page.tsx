import React from 'react';
import type { Metadata } from 'next';
import { FacilityLegalView } from '@/features/facility-legal/components/facility-legal-view';

export const metadata: Metadata = {
  title: 'Hồ sơ Pháp lý & Thẩm định Cấp 2 | FamiDoc Facility',
  description: 'Hoàn thiện hồ sơ Giấy phép hoạt động (GPHĐ) và Mã số thuế phục vụ hậu kiểm CSDL Quốc gia.',
};

export default function FacilityLegalProfilePage() {
  return <FacilityLegalView />;
}
