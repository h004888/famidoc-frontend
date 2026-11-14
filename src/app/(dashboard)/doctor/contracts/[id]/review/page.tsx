import React, { Suspense } from 'react';
import { DoctorContractReviewView } from '@/features/doctor-dashboard';

export const instant = false;

export const metadata = {
  title: 'Thẩm định Hồ sơ Chăm sóc & Ký số Y khoa | FamiDoc',
  description: 'Bác sĩ gia đình xem Care Needs Summary và thực hiện ký số điện tử chấp thuận chuyên môn hợp đồng 4 bên',
};

interface DoctorContractReviewPageProps {
  params: Promise<{ id: string }>;
}

async function DoctorContractReviewPageContent({ params }: DoctorContractReviewPageProps) {
  const { id } = await params;
  return <DoctorContractReviewView contractId={id} />;
}

export default function DoctorContractReviewPage({ params }: DoctorContractReviewPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#2E37A4]/20 border-t-[#2E37A4] rounded-full animate-spin" />
        </div>
      }
    >
      <DoctorContractReviewPageContent params={params} />
    </Suspense>
  );
}
