import React from 'react';
import Link from 'next/link';
import { DashboardSidebar, DashboardTopbarUser } from '@/components/layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f5f6f8] text-slate-900 antialiased font-sans">
      {/* Sidenav - Thanh điều hướng dọc chuẩn Preclinic */}
      <DashboardSidebar />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header chuẩn Preclinic */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Left space */}
          <div className="flex-1" />

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Notifications Button */}
            <div className="relative">
              <Link
                href="/notifications"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#2E37A4] hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors relative"
                aria-label="Thông báo hệ thống"
                title="Trung tâm thông báo đa kênh"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"></span>
              </Link>
            </div>

            {/* Topbar User Profile */}
            <DashboardTopbarUser />
          </div>
        </header>

        {/* Nội dung trang */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer phong cách Preclinic */}
        <footer className="py-3.5 px-4 sm:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-200/90 bg-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">FamiDoc Preclinic Architecture</span>
            <span className="text-slate-300">•</span>
            <span>© 2026 FamiDoc Healthcare Platform • Chuẩn Bộ Y Tế &amp; HIPAA</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <Link href="/contact" className="hover:text-[#2E37A4] transition-colors">Trung tâm Hỗ trợ 24/7</Link>
            <Link href="/settings" className="hover:text-[#2E37A4] transition-colors">Bảo mật EMR</Link>
            <Link href="/packages" className="hover:text-[#2E37A4] transition-colors">Bảng giá Gói</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
