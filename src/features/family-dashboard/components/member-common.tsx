'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/* ═══════════════════════════════════════════════════
   Loading skeleton
   ═══════════════════════════════════════════════════ */

export function MemberProfileSkeleton() {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <section className="rounded-2xl border bg-white p-5 sm:p-7 space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 sm:size-20 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="bg-slate-100 h-px w-full mt-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </section>
      <Skeleton className="h-14 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Error state
   ═══════════════════════════════════════════════════ */

export function MemberProfileError({ message }: { message?: string }) {
  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
      <div className="mx-auto size-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px]" aria-hidden="true">person_off</span>
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900">Không thể hiển thị hồ sơ</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">{message || 'Hồ sơ thành viên không tồn tại.'}</p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button variant="outline" onClick={() => window.location.reload()}>Thử tải lại</Button>
        <Button asChild className="bg-primary hover:bg-primary/90 text-white">
          <Link href="/family/members">Quay lại danh sách thành viên</Link>
        </Button>
      </div>
    </div>
  );
}
