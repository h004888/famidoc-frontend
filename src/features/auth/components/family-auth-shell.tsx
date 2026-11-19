'use client';

import React from 'react';
import Link from 'next/link';

interface FamilyAuthShellProps {
  dataPurpose: 'login-screen' | 'registration-screen';
  children: React.ReactNode;
}

const FEATURE_HIGHLIGHTS = [
  {
    lines: ['Đặt lịch', 'nhanh chóng'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
        <circle cx="8" cy="14" fill="currentColor" r="1" />
        <circle cx="12" cy="14" fill="currentColor" r="1" />
        <circle cx="16" cy="14" fill="currentColor" r="1" />
      </svg>
    ),
  },
  {
    lines: ['Theo dõi', 'sức khỏe dễ dàng'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    lines: ['Chăm sóc', 'cá nhân hóa'],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <path d="M3.5 12h3l2-3 3 6 2-3h5" />
      </svg>
    ),
  },
] as const;

/**
 * Shared split-screen shell for Family Portal authentication pages (/login, /register).
 */
export function FamilyAuthShell({ dataPurpose, children }: FamilyAuthShellProps) {
  return (
    <div
      className="text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-700 min-h-screen w-full flex items-stretch justify-center p-4 sm:p-6 py-8 lg:p-0 relative overflow-x-hidden"
      style={{
        background: 'radial-gradient(120% 100% at 15% 10%, #FFFFFF 0%, #F4F9FF 38%, #E9F3FE 72%, #DCEBFE 100%)',
      }}
    >
      <main
        className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 items-stretch relative overflow-hidden z-20"
        data-purpose={dataPurpose}
      >
        {/* LEFT COLUMN: SEAMLESS BRAND PRESENTATION & HERO IMAGERY */}
        <section
          className="hidden lg:flex lg:col-span-6 flex-col justify-between self-stretch relative z-10"
          data-purpose="brand-showcase"
        >
          <div className="px-8 pt-8 pb-4 xl:px-14 xl:pt-10 xl:pb-5 relative z-20">
            <Link
              href="/"
              className="inline-block mb-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl group"
              data-purpose="main-logo"
            >
              <img
                src="/images/logo.png"
                alt="FamiDoc Logo"
                className="h-8 xl:h-9 w-auto object-contain drop-shadow-xs transition-transform group-hover:scale-105"
              />
            </Link>

            <div className="max-w-xl mb-5" data-purpose="hero-copy">
              <h2 className="text-2xl xl:text-[28px] font-bold text-slate-900 leading-[1.26] tracking-tight">
                Bảo vệ bản thân &amp; gia đình bạn —
                <span className="block text-blue-600 mt-1 font-bold">
                  Đặt lịch khám trực tuyến dễ dàng.
                </span>
              </h2>
              <p className="text-slate-600 text-xs lg:text-sm mt-2.5 font-normal leading-relaxed">
                FamiDoc – Nền tảng quản lý bác sĩ gia đình và chăm sóc sức khỏe toàn diện.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 xl:gap-3.5 max-w-xl" data-purpose="feature-cards">
              {FEATURE_HIGHLIGHTS.map((item) => (
                <div
                  key={item.lines.join('-')}
                  className="bg-white/85 backdrop-blur-sm border border-blue-100/90 rounded-2xl p-2.5 xl:p-3 flex flex-col items-center text-center shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                    {item.icon}
                  </div>
                  <span className="text-[11px] xl:text-xs font-semibold text-slate-700 leading-tight">
                    {item.lines[0]}
                    <br />
                    {item.lines[1]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative w-[114%] flex-1 min-h-[300px] xl:min-h-[360px] pointer-events-none select-none z-10"
            data-purpose="hero-illustration"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.72) 12%, black 24%, black 100%)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.72) 12%, black 24%, black 100%)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to right, black 0%, black 64%, rgba(0, 0, 0, 0.45) 82%, transparent 100%)',
                maskImage:
                  'linear-gradient(to right, black 0%, black 64%, rgba(0, 0, 0, 0.45) 82%, transparent 100%)',
              }}
            >
              <img
                alt="Bác sĩ gia đình và chăm sóc sức khỏe toàn diện FamiDoc"
                src="/images/famidoc_register_hero.png"
                className="w-full h-full object-cover object-[center_18%] select-none"
              />
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: AUTH FORM CARD */}
        <section
          className="w-full lg:col-span-6 flex justify-center items-center lg:p-8 xl:p-10 relative z-20"
          data-purpose="form-section"
        >
          {children}
        </section>
      </main>
    </div>
  );
}
