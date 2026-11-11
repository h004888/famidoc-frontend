import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { OfficialContractViewer } from '@/features/subscription-contract';

export const metadata: Metadata = {
  title: 'Hợp Đồng Điện Tử Chính Thức | FamiDoc Family',
  description:
    'Xem, in và tải bản sao chứng thực số của hợp đồng dịch vụ chăm sóc sức khỏe gia đình 4 bên.',
};

export default function OfficialContractPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Đang tải văn bản hợp đồng 4 bên...
        </div>
      }
    >
      <OfficialContractViewer />
    </Suspense>
  );
}
