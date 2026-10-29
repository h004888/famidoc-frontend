'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/auth-context';

export function DashboardTopbarUser() {
  const { user, role } = useAuth();

  return (
    <Link
      href="/settings"
      className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600"
    >
      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20">
        {user?.avatarText || 'FD'}
      </div>
      <div className="hidden md:flex flex-col text-left">
        <span className="font-bold leading-tight truncate max-w-[150px]">{user?.name}</span>
        <span className="text-[10px] text-slate-400 font-normal">
          {role === 'ADMIN' && 'Super Admin'}
          {role === 'FACILITY' && 'Quản lý Cơ sở'}
          {role === 'DOCTOR' && 'Bác sĩ CCHN'}
          {(role === 'FAMILY' || role === 'PATIENT') && 'Đại diện Hộ'}
        </span>
      </div>
    </Link>
  );
}

