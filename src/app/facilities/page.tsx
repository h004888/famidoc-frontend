import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FacilitiesDirectoryView } from '@/features/facilities';

export const metadata: Metadata = {
  title: 'Mạng Lưới Bệnh Viện & Cơ Sở Y Tế Đối Tác | FamiDoc Pro',
  description:
    'Danh sách hơn 18 bệnh viện tuyến trung ương và phòng khám đa khoa kỹ thuật cao liên kết bảo trợ y tế gia đình FamiDoc.',
};

export default function FacilitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-8 text-slate-500 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#0046c0]/30 border-t-[#0046c0] rounded-full animate-spin" />
            <span>Đang tải mạng lưới cơ sở y tế...</span>
          </div>
        </div>
      }
    >
      <FacilitiesDirectoryView />
    </Suspense>
  );
}
