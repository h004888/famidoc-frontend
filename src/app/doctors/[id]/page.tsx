import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { DoctorDetailView } from '@/features/doctors';

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Hồ Sơ Bác Sĩ & Chuyên Gia Y Tế | FamiDoc Pro`,
    description: `Xem chi tiết tiểu sử chuyên môn, chứng chỉ hành nghề Bộ Y Tế, bằng cấp và đặt lịch khám cùng chuyên gia ${id}.`,
  };
}

async function DoctorDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DoctorDetailView id={id} />;
}

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <DoctorDetailPageContent params={params} />
    </Suspense>
  );
}

