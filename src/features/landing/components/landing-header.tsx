'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/packages', label: 'Gói chăm sóc' },
  { href: '/doctors', label: 'Bác sĩ & Cơ sở y tế' },
  { href: '/contact', label: 'Liên hệ & Tư vấn' },
];

export function LandingHeader() {
  const pathname = usePathname() || '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* 1. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img
            alt="FamiDoc Logo"
            className="h-11 w-auto object-contain"
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                  ? 'text-[#0046c0] font-semibold bg-blue-50'
                  : 'text-slate-700 hover:text-[#0046c0] hover:bg-slate-50'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-[#0046c0] rounded-md transition-colors"
          >
            Đăng nhập
          </Link>

          <Link
            href="/register"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-md bg-[#0046c0] hover:bg-[#003899] text-white text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <span>Đăng ký</span>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Mở menu điều hướng"
            aria-expanded={isMobileMenuOpen}
            className="md:hidden w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer ml-1"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
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
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'text-[#0046c0] font-semibold bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
