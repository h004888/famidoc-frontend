import React, { Suspense } from 'react';
import { FacilityFourPartyDetailView } from '@/features/facility-coordination';

export const instant = false;

export const metadata = {
  title: 'Chi tiết Hợp đồng Y tế 4 bên | Cơ sở Y tế FamiDoc',
  description:
    'Kiểm tra thông tin hộ gia đình, bác sĩ đã chọn, tiến trình ký số 4 bên và ký xác nhận trên Documenso.',
};

interface FacilityCoordinationDetailPageProps {
  params: Promise<{ id: string }>;
}

async function FacilityCoordinationDetailContent({
  params,
}: FacilityCoordinationDetailPageProps) {
  const { id } = await params;
  return <FacilityFourPartyDetailView contractId={id} />;
}

export default function FacilityCoordinationDetailPage({
  params,
}: FacilityCoordinationDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[420px] flex-col items-center justify-center gap-3 bg-[#f6f7f9] text-[#4a4f63]"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#eaeffa] border-t-[#0037c1]" />
          <p className="text-sm font-medium">
            Đang tải chi tiết hợp đồng y tế 4 bên...
          </p>
        </div>
      }
    >
      <FacilityCoordinationDetailContent params={params} />
    </Suspense>
  );
}
