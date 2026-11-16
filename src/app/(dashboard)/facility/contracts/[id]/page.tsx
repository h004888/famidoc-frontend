import React, { Suspense } from 'react';
import { FacilityContractDetailView } from '@/features/facility-contracts';

export const instant = false;

export const metadata = {
  title: 'Chi tiết & Ký Hợp đồng B2B Cung ứng Nhân lực | Cơ sở Y tế FamiDoc',
  description: 'Cơ sở Y tế rà soát điều khoản và thực hiện ký số điện tử hợp đồng cung ứng nhân lực y tế theo Flow 2.1',
};

interface FacilityContractDetailPageProps {
  params: Promise<{ id: string }>;
}

async function FacilityContractDetailPageContent({ params }: FacilityContractDetailPageProps) {
  const { id } = await params;
  return <FacilityContractDetailView contractId={id} />;
}

export default function FacilityContractDetailPage({ params }: FacilityContractDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <FacilityContractDetailPageContent params={params} />
    </Suspense>
  );
}
