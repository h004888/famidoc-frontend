'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/auth-context';

export function DashboardTopbarUser() {
  const { user, role } = useAuth();

  return (
    <Link
      href="/settings"
      className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors group"
      title="Hồ sơ tài khoản & Cài đặt"
    >
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#2E37A4]/20 group-hover:ring-[#2E37A4]/40 transition-all">
          {user?.avatarText || 'FD'}
        </div>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
      </div>
      <div className="hidden md:flex flex-col text-left">
        <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#2E37A4] transition-colors truncate max-w-[140px]">
          {user?.name}
        </span>
        <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
          {role === 'ADMIN' && 'Super Admin'}
          {role === 'FACILITY' && 'Quản trị Cơ sở Y tế'}
          {role === 'DOCTOR' && 'Bác sĩ CCHN'}
          {(role === 'FAMILY' || role === 'PATIENT') && 'Đại diện Hộ gia đình'}
        </span>
      </div>
      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-600 hidden md:block">
        keyboard_arrow_down
      </span>
    </Link>
  );
}
