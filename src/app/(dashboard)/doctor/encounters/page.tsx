import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DoctorEncountersView } from '@/features/doctor-encounters';

export const metadata: Metadata = {
  title: 'Khám Bệnh Lâm Sàng Chuẩn SOAP & Kê Đơn Điện Tử | FamiDoc Pro',
  description:
    'Giao diện khám bệnh điện tử chuẩn SOAP, chẩn đoán ICD-10, kê đơn thuốc 1NF và ký số HSM an toàn.',
};

export default function DoctorEncountersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải hồ sơ khám...</div>}>
      <DoctorEncountersView />
    </Suspense>
  );
}
