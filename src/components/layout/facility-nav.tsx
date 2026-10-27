'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FACILITY_TABS = [
  { href: '/facility', label: 'Tổng quan Cơ sở y tế', icon: 'local_hospital', exact: true },
  { href: '/facility/staff', label: 'Quản lý Nhân sự y tế', icon: 'badge' },
  { href: '/facility/coordination', label: 'Điều phối & Khiếu nại', icon: 'support_agent' },
  { href: '/facility/revenue', label: 'Đối soát Doanh thu B2B', icon: 'payments' },
];

function FacilityTabsContent() {
  const pathname = usePathname() || '/facility';

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Phân hệ Cơ sở Y tế">
      {FACILITY_TABS.map((tab) => {
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

export function FacilityNav() {
  return (
    <div className="border-b border-slate-200/80 bg-slate-50/50 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {FACILITY_TABS.map((tab) => (
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
          <FacilityTabsContent />
        </Suspense>
      </div>
    </div>
  );
}

