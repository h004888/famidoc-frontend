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
          {/* Left: Quick Search Bar */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full max-w-md hidden sm:block">
              <span className="material-symbols-outlined text-[19px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm bệnh nhân, bác sĩ, lịch hẹn, hồ sơ y tế... (Ctrl + K)"
                className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 transition-all shadow-2xs"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Hospital status indicator */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>BV ĐH Y Dược • Hệ thống sẵn sàng 24/7</span>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Clinical Assistant Badge / Button */}
            <Link
              href="/doctor/telemedicine"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#2E37A4] bg-[#2E37A4]/5 hover:bg-[#2E37A4]/10 rounded-xl border border-[#2E37A4]/20 transition-all group"
            >
              <span className="material-symbols-outlined text-[17px] text-[#2E37A4] group-hover:scale-110 transition-transform">
                auto_awesome
              </span>
              <span>Trợ lý AI Y Tế</span>
            </Link>

            {/* Quick Packages link */}
            <Link
              href="/packages"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#2E37A4] bg-slate-50 hover:bg-[#2E37A4]/5 rounded-xl border border-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">inventory_2</span>
              <span>Gói dịch vụ</span>
            </Link>

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

            {/* Settings Quick Icon */}
            <Link
              href="/settings"
              className="w-9 h-9 hidden sm:flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
              title="Cài đặt hệ thống"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

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
