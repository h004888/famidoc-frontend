import React from 'react';
import Link from 'next/link';
import { DashboardSidebar, DashboardTopbarUser } from '@/components/layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 antialiased font-sans">
      {/* Thanh điều hướng nằm dọc bên trái */}
      <DashboardSidebar />

      {/* Vùng nội dung chính bên phải */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar hỗ trợ nhanh */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              FamiDoc Enterprise Suite
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/packages"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Xem Bảng giá Gói</span>
            </Link>

            <button
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
              aria-label="Thông báo hệ thống"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            <DashboardTopbarUser />
          </div>
        </header>

        {/* Nội dung trang */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer tinh gọn */}
        <footer className="py-3 px-4 sm:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-200 bg-white">
          <span>© 2026 FamiDoc Healthcare Platform • Chuẩn Bộ Y Tế &amp; HIPAA</span>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Trung tâm Hỗ trợ</Link>
            <Link href="/settings" className="hover:text-blue-600 transition-colors">Bảo mật</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
