'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/packages', label: 'Gói chăm sóc' },
  { href: '/doctors', label: 'Bác sĩ & Cơ sở y tế' },
  { href: '/contact', label: 'Liên hệ & Tư vấn' },
];

function PublicNav() {
  const pathname = (typeof usePathname === 'function' ? usePathname() : '') || '/';

  return (
    <nav className="hidden lg:flex items-center gap-1.5" aria-label="Điều hướng chính">
      {NAV_LINKS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3.5 py-2 rounded-lg text-sm transition-all ${
              isActive
                ? 'bg-[#2563eb] text-white font-semibold shadow-xs'
                : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100 font-medium'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PublicNavFallback() {
  return (
    <nav className="hidden lg:flex items-center gap-1.5" aria-label="Điều hướng chính">
      {NAV_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="px-3.5 py-2 rounded-lg text-sm text-[#475569] hover:text-[#0f172a] hover:bg-slate-100 font-medium transition-all"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-xs">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link className="flex items-center gap-2" href="/">
            <img
              alt="FamiDoc Logo"
              className="h-10 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAU71g-gMpZDL2TfDJ9N_YowMrnqS38Q1tuJNRBbP6RVncnQFvNp8GEeq7aT_Nf8I01iPzHedW0JOn_wlzUhBpd0qNx_mNiEs4yB8gbxihVQQYzzrC96guDY7kafTmyNXyBAIqb1yNjvh8T7C-K87u5QHp1gE0Hxao5DkdbzKx0y0B4lP9AHeFxhopxHNMvmqQ55BeaHVUYv_p09QiaiEnTS36V44cHn7BjqLNrtz9uO7Xqhu_WHswYwhtGilgJ37mc1g"
            />
          </Link>

          {/* Navigation Links wrapped in Suspense for SSR prerendering */}
          <Suspense fallback={<PublicNavFallback />}>
            <PublicNav />
          </Suspense>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-3">
          <a
            href="tel:19006868"
            className="hidden sm:flex items-center gap-1.5 text-[#2563eb] font-semibold text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-full border border-blue-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            <span>1900 6868</span>
          </a>

          <div className="flex items-center gap-2">
            <Link
              className="px-3.5 py-2 rounded-lg text-[#2563eb] hover:bg-blue-50 font-semibold transition-colors text-xs sm:text-sm"
              href="/login"
            >
              Đăng nhập
            </Link>
            <Link
              className="px-4 sm:px-5 py-2 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-all font-semibold shadow-sm text-xs sm:text-sm"
              href="/register"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

