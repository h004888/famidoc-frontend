import React, { Suspense } from 'react';
import { AdminFacilityDetailView } from '@/features/admin-facilities';

export const instant = false;

export const metadata = {
  title: 'Chi tiết & Thẩm định Cơ sở Y tế | FamiDoc Admin',
  description: 'Thẩm định hồ sơ pháp lý và kích hoạt tài khoản Cơ sở y tế đối tác theo quy trình Flow 2.1',
};

interface AdminFacilityDetailPageProps {
  params: Promise<{ id: string }>;
}

async function AdminFacilityDetailPageContent({ params }: AdminFacilityDetailPageProps) {
  const { id } = await params;
  return <AdminFacilityDetailView facilityId={id} />;
}

export default function AdminFacilityDetailPage({ params }: AdminFacilityDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <AdminFacilityDetailPageContent params={params} />
    </Suspense>
  );
}
