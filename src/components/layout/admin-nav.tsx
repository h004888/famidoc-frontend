'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_TABS = [
  { href: '/admin', label: 'Tổng quan Nền tảng', icon: 'monitoring', exact: true },
  { href: '/admin/packages', label: 'Quản trị Gói dịch vụ', icon: 'inventory_2' },
  { href: '/admin/contracts', label: 'Hợp đồng & Pháp lý', icon: 'handshake' },
  { href: '/admin/disputes', label: 'Trọng tài & Tranh chấp', icon: 'gavel' },
  { href: '/admin/users', label: 'Tài khoản, RBAC & Audit', icon: 'shield_person' },
];

function AdminTabsContent() {
  const pathname = usePathname() || '/admin';

  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Phân hệ Quản trị viên">
      {ADMIN_TABS.map((tab) => {
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

export function AdminNav() {
  return (
    <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xs py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {ADMIN_TABS.map((tab) => (
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
          <AdminTabsContent />
        </Suspense>
      </div>
    </div>
  );
}
