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
    <nav className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Phân hệ Quản trị viên">
      {ADMIN_TABS.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              isActive
                ? 'bg-slate-900 text-white shadow-xs font-bold ring-1 ring-slate-800'
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

export function AdminNav() {
  return (
    <div className="border-b border-slate-200/80 bg-slate-50/70 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {ADMIN_TABS.map((tab) => (
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
          <AdminTabsContent />
        </Suspense>
      </div>
    </div>
  );
}

