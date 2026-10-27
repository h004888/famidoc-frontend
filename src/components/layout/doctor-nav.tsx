'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DOCTOR_TABS = [
  { href: '/doctor', label: 'Bảng điều khiển Lâm sàng', icon: 'dashboard', exact: true },
  { href: '/doctor/timetable', label: 'Lịch trực & Panel Cap', icon: 'calendar_clock' },
  { href: '/doctor/encounters', label: 'Khám SOAP & Kê đơn', icon: 'clinical_notes' },
  { href: '/doctor/telemedicine', label: 'Tư vấn WebRTC 24/7', icon: 'videocam' },
  { href: '/doctor/verification', label: 'Xác thực CCHN Y tế', icon: 'verified_user' },
];

function DoctorTabsContent() {
  const pathname = usePathname() || '/doctor';

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Phân hệ Bác sĩ">
      {DOCTOR_TABS.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-[#2563eb] text-white shadow-xs font-bold'
                : 'bg-white text-[#475569] hover:text-[#0f172a] hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function DoctorNav() {
  return (
    <div className="border-b border-slate-200/80 bg-slate-50/50 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {DOCTOR_TABS.map((tab) => (
                <div
                  key={tab.href}
                  className="px-4 py-2.5 rounded-xl text-xs bg-white text-[#475569] border border-slate-200 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              ))}
            </div>
          }
        >
          <DoctorTabsContent />
        </Suspense>
      </div>
    </div>
  );
}

