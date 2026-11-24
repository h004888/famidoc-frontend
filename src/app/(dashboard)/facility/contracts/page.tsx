import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { FacilityUnifiedContractsView } from '@/features/facility-contracts';

export const metadata: Metadata = {
  title: 'Quản lý Hợp đồng | Cơ sở Y tế FamiDoc',
  description:
    'Quản lý tập trung hợp đồng y tế 4 bên và hợp đồng hợp tác B2B của Cơ sở Y tế.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function FacilityContractsLoader({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawType = typeof params.type === 'string' ? params.type : undefined;
  const initialTypeFilter =
    rawType === 'FOUR_PARTY' || rawType === 'B2B' ? rawType : 'ALL';

  return <FacilityUnifiedContractsView initialTypeFilter={initialTypeFilter} />;
}

export default function FacilityContractsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] p-6 text-xs text-slate-500">
          Đang tải danh sách hợp đồng...
        </div>
      }
    >
      <FacilityContractsLoader searchParams={searchParams} />
    </Suspense>
  );
}
