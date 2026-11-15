import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ContractSigningTrackerView } from '@/features/subscription-contract';

export const metadata: Metadata = {
  title: 'Tiến Độ Ký Hợp Đồng 4 Bên | FamiDoc Family',
  description:
    'Theo dõi tiến trình luân chuyển và ký số điện tử của hợp đồng chăm sóc bác sĩ gia đình 4 bên.',
};

export default async function ContractTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const rawContractId = params.contractId;
  const contractId =
    typeof rawContractId === 'string' && rawContractId.trim().length > 0
      ? rawContractId.trim()
      : undefined;

  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Đang tải tiến trình ký hợp đồng...
        </div>
      }
    >
      <ContractSigningTrackerView contractId={contractId} />
    </Suspense>
  );
}
