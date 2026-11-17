import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { BlogCatalogView } from '@/features/blog';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';

export const instant = false;

export const metadata: Metadata = {
  title: 'Cẩm Nang & Đào Tạo Hướng Dẫn Y Tế Gia Đình | FamiDoc',
  description:
    'Trung tâm cẩm nang đào tạo và hướng dẫn y tế gia đình FamiDoc. Khám phá 4 Trụ cột Y học gia đình, quy chuẩn khám tận nhà, tư vấn Telehealth và hồ sơ bệnh án điện tử EHR.',
};

export default function BlogCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0046c0]/20 border-t-[#0046c0] rounded-full animate-spin" />
        </div>
      }
    >
      <ServerAuthSessionBoundary>
        <BlogCatalogView />
      </ServerAuthSessionBoundary>
    </Suspense>
  );
}
