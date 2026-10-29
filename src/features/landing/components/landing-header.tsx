'use client';

import React from 'react';
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

        {/* Navigation Links */}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-[#0046c0] rounded-md transition-colors"
          >
            Đăng nhập
          </Link>

          <Link
            href="/register"
            className="px-5 py-2.5 rounded-md bg-[#0046c0] hover:bg-[#003899] text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <span>Đăng ký</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
