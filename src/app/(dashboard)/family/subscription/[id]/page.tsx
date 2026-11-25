import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SubscriptionContractDetailView } from '@/features/subscription-contract';

export const metadata: Metadata = {
  title: 'Chi tiết Gói Dịch Vụ & Hợp Đồng PDF | FamiDoc Pro',
  description: 'Xem chi tiết hạn mức quyền lợi và bản PDF hợp đồng y tế 4 bên.',
};

export default async function FamilySubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Đang tải chi tiết gói dịch vụ &amp; hợp đồng…
        </div>
      }
    >
      <SubscriptionContractDetailView contractId={id} />
    </Suspense>
  );
}
