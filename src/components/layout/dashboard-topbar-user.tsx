'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Settings, UserRound } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Accessible user profile dropdown in the dashboard topbar.
 */
export function DashboardTopbarUser() {
  const { user, role, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const avatarText = mounted ? (user?.avatarText || 'FD') : 'FD';
  const displayName = mounted ? (user?.name || '') : '';
  const roleLabel =
    role === 'ADMIN'
      ? 'Super Admin'
      : role === 'FACILITY'
        ? 'Quản trị Cơ sở Y tế'
        : role === 'DOCTOR'
          ? 'Bác sĩ CCHN'
          : 'Đại diện Hộ gia đình';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-200/70 group outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          title="Hồ sơ tài khoản & Đăng xuất"
          aria-label="Mở menu tài khoản người dùng"
        >
          <div className="relative">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E37A4] text-xs font-semibold text-white"
              suppressHydrationWarning
            >
              {avatarText}
            </div>
            <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden flex-col text-left md:flex">
            <span
              className="max-w-[140px] truncate text-xs font-semibold leading-tight text-slate-900 transition-colors group-hover:text-[#2E37A4]"
              suppressHydrationWarning
            >
              {displayName}
            </span>
            <span className="mt-0.5 text-xs font-medium leading-tight text-slate-600">
              {roleLabel}
            </span>
          </div>
          <span className="material-symbols-outlined hidden text-[16px] text-slate-600 group-hover:text-slate-900 md:block">
            keyboard_arrow_down
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2.5 py-1.5">
          <p className="truncate text-xs font-semibold text-slate-900" suppressHydrationWarning>
            {displayName || 'Tài khoản FamiDoc'}
          </p>
          <p className="truncate text-[11px] font-normal text-slate-500">{roleLabel}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {role === 'DOCTOR' && (
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs">
            <Link href="/doctor/profile" className="flex items-center gap-2">
              <UserRound className="size-4 text-slate-500" aria-hidden="true" />
              <span>Hồ sơ chuyên môn Bác sĩ</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs">
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4 text-slate-500" aria-hidden="true" />
            <span>Cài đặt &amp; Tài khoản</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={() => logout()}
          variant="destructive"
          className="cursor-pointer rounded-lg text-xs font-semibold"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
