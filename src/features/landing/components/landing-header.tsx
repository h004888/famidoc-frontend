'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, getDefaultPathForRole } from '@/features/auth/context/auth-context';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/packages', label: 'Gói chăm sóc' },
  { href: '/doctors', label: 'Bác sĩ & Cơ sở y tế' },
  { href: '/contact', label: 'Liên hệ & Tư vấn' },
];

export function LandingHeader() {
  const pathname = usePathname() || '/';
  const { isAuthenticated, user, role, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const bottomNavItems = [
    {
      href: '/',
      label: 'Trang chủ',
      ariaLabel: 'Màn hình chính FamiDoc',
      icon: 'home',
      isActive: pathname === '/',
    },
    {
      href: '/packages',
      label: 'Gói khám',
      ariaLabel: 'Danh mục gói khám FamiDoc',
      icon: 'inventory_2',
      isActive: pathname.startsWith('/packages'),
    },
    {
      href: '/doctors',
      label: 'Bác sĩ',
      ariaLabel: 'Đội ngũ bác sĩ gia đình FamiDoc',
      icon: 'stethoscope',
      isActive: pathname.startsWith('/doctors'),
    },
    {
      href: '/contact',
      label: 'Tư vấn',
      ariaLabel: 'Gửi yêu cầu tư vấn FamiDoc',
      icon: 'support_agent',
      isActive: pathname.startsWith('/contact'),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        {/* 1. Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img
              alt="FamiDoc Logo"
              className="h-10 sm:h-11 w-auto object-contain"
              src="/images/FamiDoc Healthcare Logo.png"
            />
            <span className="sr-only">FamiDoc Pro</span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng chính">
            {NAV_LINKS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#0046c0] font-semibold bg-blue-50'
                      : 'text-slate-700 hover:text-[#0046c0] hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons: Khi đã đăng nhập thì hiển thị Avatar + Vào Dashboard + Đăng xuất, ngược lại hiển thị Đăng nhập & Đăng ký */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={getDefaultPathForRole(role)}
                  className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 text-[#0046c0] hover:bg-blue-100/80 text-xs sm:text-sm font-semibold transition-colors border border-blue-200/70"
                  title="Vào Bảng Điều Khiển"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border border-blue-300">
                    {user.avatarText || user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  title="Đăng xuất"
                  aria-label="Đăng xuất tài khoản"
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#0046c0] rounded-md transition-colors border border-slate-200 sm:border-transparent hover:border-slate-200"
                >
                  Đăng nhập
                </Link>

                <Link
                  href="/register"
                  className="hidden md:inline-flex px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-md bg-[#0046c0] hover:bg-[#003899] text-white text-xs sm:text-sm font-medium transition-colors items-center gap-1.5 shadow-xs"
                >
                  <span>Đăng ký</span>
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Mở menu điều hướng"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Dịch vụ &amp; Chăm sóc gia đình
            </div>

            <nav className="flex flex-col space-y-1" aria-label="Điều hướng di động">
              {NAV_LINKS.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#0046c0] font-semibold bg-blue-50'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold border border-slate-300 shrink-0">
                      {user.avatarText || user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email || user.phone}</div>
                    </div>
                  </div>

                  <Link
                    href={getDefaultPathForRole(role)}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-sm font-medium flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-lg">dashboard</span>
                    <span>Vào Bảng Điều Khiển</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>Đăng xuất tài khoản</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">login</span>
                    <span>Đăng nhập tài khoản</span>
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-lg bg-[#0046c0] hover:bg-[#003899] text-white text-sm font-medium flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    <span>Đăng ký Bác sĩ Gia đình</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. App-like Bottom Navigation Bar (Phương án B - Mobile Only) */}
      <nav
        aria-label="Thanh điều hướng di động chân trang"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-2 py-1"
      >
        <div className="grid grid-cols-4 items-center h-14 max-w-md mx-auto">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.ariaLabel}
              aria-current={item.isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors cursor-pointer ${
                item.isActive
                  ? 'text-[#0046c0] font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-[22px] transition-transform ${
                    item.isActive ? 'scale-110' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {item.isActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#0046c0]" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight" aria-hidden="true">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
