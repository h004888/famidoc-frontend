'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
          className="group flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          title="Hồ sơ tài khoản & Cài đặt"
          aria-label="Mở menu tài khoản"
        >
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {user?.avatarText || 'FD'}
              </AvatarFallback>
            </Avatar>
            <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden flex-col text-left md:flex">
            <span className="max-w-[140px] truncate text-xs font-semibold leading-tight text-slate-900 transition-colors group-hover:text-primary">
              {user?.name || 'Tài khoản FamiDoc'}
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
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="truncate text-xs font-bold text-slate-900">{user?.name || 'Tài khoản FamiDoc'}</div>
          <div className="truncate text-[11px] font-medium text-slate-500">{roleLabel}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs">
            <Link href="/settings" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">manage_accounts</span>
              <span>Hồ sơ &amp; Cài đặt BHYT</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg text-xs">
            <Link href="/notifications" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">notifications</span>
              <span>Trung tâm thông báo</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={logout}
          className="cursor-pointer rounded-lg text-xs text-rose-700 focus:bg-rose-50 focus:text-rose-800"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
