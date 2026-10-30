'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FAMILY_TABS = [
  { href: '/family', label: 'Tổng quan Sức khỏe', icon: 'dashboard', exact: true },
  { href: '/family/members', label: 'Hồ sơ & Lịch sử EHR', icon: 'folder_shared' },
  { href: '/family/appointments', label: 'Đặt lịch khám', icon: 'calendar_month' },
  { href: '/family/vitals', label: 'Chỉ số & Cảnh báo', icon: 'monitor_heart' },
  { href: '/family/subscription', label: 'Gói & Hợp đồng điện tử', icon: 'history_edu' },
  { href: '/family/billing', label: 'Thanh toán VietQR', icon: 'qr_code_2' },
];

function FamilyTabsContent() {
  const pathname = usePathname() || '/family';

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Phân hệ Gia đình">
      {FAMILY_TABS.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-[#2E37A4] text-white shadow-xs font-bold ring-1 ring-[#2E37A4]'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#00D3C7]' : 'text-slate-400'}`}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function FamilyNav() {
  return (
    <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xs py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {FAMILY_TABS.map((tab) => (
                <div
                  key={tab.href}
                  className="px-3.5 py-2 rounded-xl text-xs bg-white text-slate-500 border border-slate-200 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              ))}
            </div>
          }
        >
          <FamilyTabsContent />
        </Suspense>
      </div>
    </div>
  );
}
