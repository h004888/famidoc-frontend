import React, { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  DashboardSidebar,
  FamilySubscriptionGateGuard,
  FamilySubscriptionGateProvider,
  SiteHeader,
} from '@/components/layout';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { COOKIE_KEYS } from '@/lib/auth-storage';
import { LoginRole } from '@/features/auth/schemas/auth.schema';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let initialRole: LoginRole | undefined;
  try {
    const cookieStore = await cookies();
    const rawRole = cookieStore.get(COOKIE_KEYS.ROLE)?.value as LoginRole | undefined;
    if (rawRole && ['ADMIN', 'FACILITY', 'DOCTOR', 'FAMILY', 'PATIENT'].includes(rawRole)) {
      initialRole = rawRole;
    }
  } catch {}

  return (
    <FamilySubscriptionGateProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-[#f5f6f8] text-slate-900 antialiased font-sans">
          {/* Sidenav - Thanh điều hướng dọc chuẩn Preclinic */}
          <Suspense fallback={<div className="hidden lg:block w-64 bg-white border-r border-slate-200/90 shrink-0" />}>
            <DashboardSidebar initialRole={initialRole} />
          </Suspense>

          {/* Main content wrapper */}
          <SidebarInset className="flex min-w-0 flex-1 flex-col bg-[#f5f6f8] pb-16 lg:pb-0">
            <Suspense fallback={<div className="hidden h-16 border-b border-slate-200/90 bg-white lg:block" />}>
              <SiteHeader initialRole={initialRole} />
            </Suspense>

            {/* Nội dung trang */}
            <main className="flex-1">
              <Suspense fallback={null}>
                <FamilySubscriptionGateGuard>{children}</FamilySubscriptionGateGuard>
              </Suspense>
            </main>

            {/* Footer phong cách Preclinic */}
            <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200/90 bg-white px-4 py-3 text-center text-xs text-slate-600 sm:px-6 sm:text-left lg:px-8 xl:flex-row">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="font-semibold text-slate-800">FamiDoc Preclinic Architecture</span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span>© 2026 FamiDoc Healthcare Platform · Chuẩn Bộ Y Tế &amp; HIPAA</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1 font-medium text-slate-600 sm:gap-2">
                <Link
                  href="/contact"
                  className="inline-flex min-h-8 items-center whitespace-nowrap rounded-lg px-2.5 text-slate-600 transition-colors hover:bg-accent hover:text-primary outline-hidden"
                >
                  Trung tâm Hỗ trợ 24/7
                </Link>
                <Link
                  href="/settings"
                  className="inline-flex min-h-8 items-center whitespace-nowrap rounded-lg px-2.5 text-slate-600 transition-colors hover:bg-accent hover:text-primary outline-hidden"
                >
                  Bảo mật EMR
                </Link>
                <Link
                  href="/packages"
                  className="inline-flex min-h-8 items-center whitespace-nowrap rounded-lg px-2.5 text-slate-600 transition-colors hover:bg-accent hover:text-primary outline-hidden"
                >
                  Bảng giá Gói
                </Link>
              </div>
            </footer>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </FamilySubscriptionGateProvider>
  );
}
