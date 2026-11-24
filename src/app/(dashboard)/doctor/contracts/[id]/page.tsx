import React, { Suspense } from 'react';
import { DoctorContractReviewView } from '@/features/doctor-dashboard';

export const instant = false;

export const metadata = {
  title: 'Chi tiết Hợp đồng & Ký xác nhận | FamiDoc',
  description:
    'Bác sĩ gia đình xem chi tiết hợp đồng 4 bên, thông tin hộ gia đình và thực hiện ký số điện tử chấp thuận chuyên môn.',
};

interface DoctorContractDetailPageProps {
  params: Promise<{ id: string }>;
}

async function DoctorContractDetailPageContent({
  params,
}: DoctorContractDetailPageProps) {
  const { id } = await params;
  return <DoctorContractReviewView contractId={id} />;
}

export default function DoctorContractDetailPage({
  params,
}: DoctorContractDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2E37A4]/20 border-t-[#2E37A4]" />
        </div>
      }
    >
      <DoctorContractDetailPageContent params={params} />
    </Suspense>
  );
}
