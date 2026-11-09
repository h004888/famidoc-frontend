'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/auth-context';

export function DashboardTopbarUser() {
  const { user, role } = useAuth();

  return (
    <Link
      href="/settings"
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-200/70 transition-colors group outline-hidden"
      title="Hồ sơ tài khoản & Cài đặt"
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-[#2E37A4] text-white flex items-center justify-center font-semibold text-xs shrink-0">
          {user?.avatarText || 'FD'}
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
      </div>
      <div className="hidden md:flex flex-col text-left">
        <span className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-[#2E37A4] transition-colors truncate max-w-[140px]">
          {user?.name}
        </span>
        <span className="text-xs text-slate-600 font-medium leading-tight mt-0.5">
          {role === 'ADMIN' && 'Super Admin'}
          {role === 'FACILITY' && 'Quản trị Cơ sở Y tế'}
          {role === 'DOCTOR' && 'Bác sĩ CCHN'}
          {(role === 'FAMILY' || role === 'PATIENT') && 'Đại diện Hộ gia đình'}
        </span>
      </div>
      <span className="material-symbols-outlined text-[16px] text-slate-600 group-hover:text-slate-900 hidden md:block">
        keyboard_arrow_down
      </span>
    </Link>
  );
}
