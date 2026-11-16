import React from 'react';
import { ServerAuthSessionBoundary } from '@/features/auth/components/server-auth-session-boundary';
import { LandingHeader, type LandingHeaderProps } from './landing-header';

export function LandingHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200" aria-busy="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
        <div className="h-10 sm:h-11 w-32 rounded-lg bg-slate-100 animate-pulse" />
        <div className="hidden md:flex items-center gap-2">
          <div className="h-8 w-20 rounded-md bg-slate-100 animate-pulse" />
          <div className="h-8 w-24 rounded-md bg-slate-100 animate-pulse" />
          <div className="h-8 w-28 rounded-md bg-slate-100 animate-pulse" />
          <div className="h-8 w-32 rounded-md bg-slate-100 animate-pulse" />
        </div>
        <div className="h-9 w-28 sm:w-36 rounded-lg bg-slate-100 animate-pulse" />
      </div>
    </header>
  );
}

/**
 * Wrapper Server Component cho `LandingHeader`, đọc cookie phiên bên trong `<Suspense>`
 * để render ngay trạng thái đã đăng nhập mà không chặn static shell của trang.
 */
export async function LandingHeaderWithSession(props: LandingHeaderProps = {}) {
  return (
    <ServerAuthSessionBoundary>
      <LandingHeader {...props} />
    </ServerAuthSessionBoundary>
  );
}
