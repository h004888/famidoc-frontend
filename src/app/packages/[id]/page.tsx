import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { PackageDetailView } from '@/features/packages/components/package-detail-view';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Chi Tiết Gói Chăm Sóc Sức Khỏe | FamiDoc Pro`,
    description: `Bảng đối chiếu quyền lợi y tế, bác sĩ chuyên khoa phụ trách và cam kết dịch vụ cho gói ${id}.`,
  };
}

async function PackageDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PackageDetailView packageId={id} />;
}

export default function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <ServerAuthSessionBoundary>
        <PackageDetailContent params={params} />
      </ServerAuthSessionBoundary>
    </Suspense>
  );
}
