import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { FamilyMemberCareView } from '@/features/family-dashboard';

export const instant = false;

export const metadata: Metadata = {
  title: 'Chăm Sóc Sức Khỏe Hằng Ngày Của Thành Viên | FamiDoc',
  description:
    'Xem chỉ số sinh hiệu, lịch hẹn khám và đơn thuốc đã được chia sẻ.',
};

async function FamilyMemberCarePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FamilyMemberCareView memberId={id} />;
}

export default function FamilyMemberCarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <FamilyMemberCarePageContent params={params} />
    </Suspense>
  );
}
