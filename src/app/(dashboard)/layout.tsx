import React, { Suspense } from 'react';
import Link from 'next/link';
import { DashboardSidebar, DashboardTopbarUser } from '@/components/layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f5f6f8] text-slate-900 antialiased font-sans">
      {/* Sidenav - Thanh điều hướng dọc chuẩn Preclinic */}
      <Suspense fallback={<div className="hidden lg:block w-16 bg-white border-r border-slate-200/90 shrink-0" />}>
        <DashboardSidebar />
      </Suspense>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Topbar Header chuẩn Preclinic (Chỉ hiển thị ở Desktop lg trở lên) */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Left space */}
          <div className="flex-1" />

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick link to Landing / Public Homepage */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#2E37A4] hover:bg-slate-100 transition-colors border border-slate-200/80 outline-hidden"
              title="Xem giao diện Trang Chủ công khai"
            >
              <span className="material-symbols-outlined text-[17px]">home</span>
              <span className="hidden sm:inline">Trang Chủ</span>
            </Link>

            {/* Notifications Button */}
            <div className="relative">
              <Link
                href="/notifications"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#2E37A4] hover:bg-slate-200/70 transition-colors relative outline-hidden"
                aria-label="Thông báo hệ thống"
                title="Trung tâm thông báo đa kênh"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </Link>
            </div>

            {/* Topbar User Profile */}
            <Suspense fallback={<div className="w-9 h-9 rounded-full bg-slate-100" />}>
              <DashboardTopbarUser />
            </Suspense>
          </div>
        </header>

        {/* Nội dung trang */}
        <main className="flex-1">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>

        {/* Footer phong cách Preclinic */}
        <footer className="py-3 px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col xl:flex-row items-center justify-between gap-2 text-xs text-slate-600 border-t border-slate-200/90 bg-white">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-slate-800">FamiDoc Preclinic Architecture</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>© 2026 FamiDoc Healthcare Platform · Chuẩn Bộ Y Tế &amp; HIPAA</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-slate-600 font-medium">
            <Link
              href="/contact"
              className="inline-flex min-h-8 items-center px-2.5 rounded-lg text-slate-600 hover:text-[#2E37A4] hover:bg-slate-200/70 transition-colors whitespace-nowrap outline-hidden"
            >
              Trung tâm Hỗ trợ 24/7
            </Link>
            <Link
              href="/settings"
              className="inline-flex min-h-8 items-center px-2.5 rounded-lg text-slate-600 hover:text-[#2E37A4] hover:bg-slate-200/70 transition-colors whitespace-nowrap outline-hidden"
            >
              Bảo mật EMR
            </Link>
            <Link
              href="/packages"
              className="inline-flex min-h-8 items-center px-2.5 rounded-lg text-slate-600 hover:text-[#2E37A4] hover:bg-slate-200/70 transition-colors whitespace-nowrap outline-hidden"
            >
              Bảng giá Gói
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
