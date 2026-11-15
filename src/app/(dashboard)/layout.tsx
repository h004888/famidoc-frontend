import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  DashboardSidebar,
  FamilySubscriptionGateGuard,
  FamilySubscriptionGateProvider,
  SiteHeader,
} from '@/components/layout';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FamilySubscriptionGateProvider>
      <SidebarProvider defaultOpen={false} className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
        <div className="flex min-h-screen w-full flex-col lg:flex-row">
          {/* Sidenav - Thanh điều hướng dọc chuẩn shadcn + Preclinic */}
          <Suspense fallback={<div className="hidden w-20 shrink-0 border-r border-slate-200/90 bg-white lg:block" />}>
            <DashboardSidebar />
          </Suspense>

          {/* Main content wrapper */}
          <SidebarInset className="flex min-w-0 flex-1 flex-col bg-[#f5f6f8] pb-16 lg:pb-0">
            <Suspense fallback={<div className="hidden h-16 border-b border-slate-200/90 bg-white lg:block" />}>
              <SiteHeader />
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
