import React from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-on-background">
      {/* Top Navbar */}
      <header className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 h-16 sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-base shadow-sm">
              F
            </div>
            <span className="font-bold text-lg text-primary tracking-tight">FamiDoc<span className="text-[#fa8c16]">.Pro</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-2 lg:gap-4 text-xs font-semibold">
            <Link href="/family" className="px-3 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              Gia đình
            </Link>
            <Link href="/doctor" className="px-3 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              Bác sĩ
            </Link>
            <Link href="/facility" className="px-3 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              Cơ sở y tế
            </Link>
            <Link href="/packages" className="px-3 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              Gói dịch vụ
            </Link>
            <Link href="/settings" className="px-3 py-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              Cài đặt &amp; Bảo mật
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant" aria-label="Thông báo">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>
          <Link href="/settings" className="flex items-center gap-2 text-xs font-semibold text-on-surface hover:text-primary">
            <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold">
              NA
            </div>
            <span className="hidden sm:inline">Nguyễn Văn An</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-outline border-t border-outline-variant bg-surface-container-lowest">
        © 2026 FamiDoc Pro Healthcare Platform. Chuẩn Bộ Y Tế &amp; HIPAA.
      </footer>
    </div>
  );
}
