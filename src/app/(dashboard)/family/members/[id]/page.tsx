import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { FamilyMemberCareView } from '@/features/family-dashboard';

export const instant = false;

export const metadata: Metadata = {
  title: 'Chăm Sóc Sức Khỏe Hằng Ngày Của Thành Viên | FamiDoc',
  description:
    'Theo dõi chỉ số sinh hiệu hôm nay, lịch hẹn khám bác sĩ và lịch dùng thuốc hằng ngày của từng thành viên trong gia đình.',
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
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#2E37A4]/20 border-t-[#2E37A4] rounded-full animate-spin" />
        </div>
      }
    >
      <FamilyMemberCarePageContent params={params} />
    </Suspense>
  );
}
