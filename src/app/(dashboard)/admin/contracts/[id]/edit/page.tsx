import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { AdminContractEditView } from '@/features/admin-contracts';

export const metadata: Metadata = {
  title: 'Sửa & Cập nhật Hợp đồng | FamiDoc Admin',
  description: 'Trang quản trị chỉnh sửa thông tin hiệu lực, phân công bác sĩ, tỷ lệ chia sẻ và điều khoản hợp đồng.',
};

interface AdminContractEditPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

async function AdminContractEditPageContent({
  params,
  searchParams,
}: AdminContractEditPageProps) {
  const { id } = await params;
  const { type } = await searchParams;
  const contractType =
    type === 'staffing' ? 'staffing' : type === 'medical' ? 'medical' : undefined;

  return <AdminContractEditView contractId={id} contractType={contractType} />;
}

export default function AdminContractEditPage(props: AdminContractEditPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground">
          Đang tải trình chỉnh sửa hợp đồng...
        </div>
      }
    >
      <AdminContractEditPageContent {...props} />
    </Suspense>
  );
}
