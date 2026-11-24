import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminStaffingDetailView } from '@/features/admin-contracts';

export const metadata: Metadata = {
  title: 'Chi tiết & Ký Hợp đồng B2B | FamiDoc Admin',
  description:
    'Quản trị viên xem chi tiết, ký số Documenso và xem trước PDF hợp đồng B2B.',
};

interface AdminStaffingDetailPageProps {
  params: Promise<{ id: string }>;
}

async function AdminStaffingDetailContent({
  params,
}: AdminStaffingDetailPageProps) {
  const { id } = await params;
  return <AdminStaffingDetailView contractId={id} />;
}

export default function AdminStaffingDetailPage({
  params,
}: AdminStaffingDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-6 text-xs text-slate-500">
          Đang tải hợp đồng B2B...
        </div>
      }
    >
      <AdminStaffingDetailContent params={params} />
    </Suspense>
  );
}
