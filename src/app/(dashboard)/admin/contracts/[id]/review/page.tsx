import React, { Suspense } from 'react';
import { AdminFourPartyReviewView } from '@/features/admin-contracts';

export const instant = false;

export const metadata = {
  title: 'Thẩm định Hồ sơ Hợp đồng 4 Bên & Ký số Duyệt Platform | FamiDoc Admin',
  description: 'Admin nền tảng thẩm định chi tiết snapshot hồ sơ gia đình và ký duyệt điện tử hợp đồng chăm sóc sức khỏe 4 bên',
};

interface AdminFourPartyReviewPageProps {
  params: Promise<{ id: string }>;
}

async function AdminFourPartyReviewPageContent({ params }: AdminFourPartyReviewPageProps) {
  const { id } = await params;
  return <AdminFourPartyReviewView contractId={id} />;
}

export default function AdminFourPartyReviewPage({ params }: AdminFourPartyReviewPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#2E37A4]/20 border-t-[#2E37A4] rounded-full animate-spin" />
        </div>
      }
    >
      <AdminFourPartyReviewPageContent params={params} />
    </Suspense>
  );
}
