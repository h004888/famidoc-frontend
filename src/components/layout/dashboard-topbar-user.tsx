'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/auth-context';
import type { LoginRole } from '@/features/auth/schemas/auth.schema';
import { getCurrentBrowserHost, getSubdomainPortal } from '@/lib/portal-routing';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const ROLE_DISPLAY_TITLES: Record<LoginRole, string> = {
  ADMIN: 'Super Admin',
  FACILITY: 'Quản trị Cơ sở Y tế',
  DOCTOR: 'Bác sĩ CCHN',
  FAMILY: 'Đại diện Hộ gia đình',
  PATIENT: 'Thành viên Hộ gia đình',
};

const ROLE_PROFILE_LINKS: Partial<
  Record<LoginRole, { href: string; label: string; icon: string }>
> = {
  ADMIN: { href: '/admin/users', label: 'Tài khoản & phân quyền', icon: 'shield_person' },
  FACILITY: { href: '/facility/legal-profile', label: 'Hồ sơ pháp lý cơ sở', icon: 'policy' },
  DOCTOR: { href: '/doctor/profile', label: 'Hồ sơ chuyên môn', icon: 'account_circle' },
};

export interface DashboardTopbarUserProps {
  compact?: boolean;
}

/**
 * Accessible user profile dropdown in the dashboard topbar.
 */
export function DashboardTopbarUser({ compact = false }: DashboardTopbarUserProps = {}) {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hostPortalRole = mounted ? getSubdomainPortal(getCurrentBrowserHost()) : null;
  const effectiveRole: LoginRole =
    isAuthenticated ? role : hostPortalRole || role || 'FAMILY';

  const avatarText = mounted || isAuthenticated ? user?.avatarText || 'FD' : 'FD';
  const displayName =
    mounted || isAuthenticated ? user?.name || ROLE_DISPLAY_TITLES[effectiveRole] : '';
  const contactSubtitle = user?.email || user?.phone || '';
  const roleLabel = ROLE_DISPLAY_TITLES[effectiveRole] || ROLE_DISPLAY_TITLES.FAMILY;
  const roleProfileLink = ROLE_PROFILE_LINKS[effectiveRole];
  const isFamilyAccount = effectiveRole === 'FAMILY' || effectiveRole === 'PATIENT';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={
            compact
              ? 'relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 outline-hidden focus-visible:ring-2 focus-visible:ring-ring'
              : 'flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-200/70 group outline-hidden focus-visible:ring-2 focus-visible:ring-ring'
          }
          title="Mở menu tài khoản"
          aria-label="Mở menu tài khoản"
        >
          {compact ? (
            <span suppressHydrationWarning>{avatarText}</span>
          ) : (
            <>
              <div className="relative">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                  suppressHydrationWarning
                >
                  {avatarText}
                </div>
                <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden flex-col text-left md:flex">
                <span
                  className="max-w-[140px] truncate text-xs leading-tight font-semibold text-slate-900 transition-colors group-hover:text-primary"
                  suppressHydrationWarning
                >
                  {displayName}
                </span>
                <span className="mt-0.5 text-xs leading-tight font-medium text-slate-600">
                  {roleLabel}
                </span>
              </div>
              <span className="material-symbols-outlined hidden text-[16px] text-slate-600 group-hover:text-slate-900 md:block">
                keyboard_arrow_down
              </span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 rounded-xl border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="mb-1 border-b border-slate-100 px-3 py-2.5">
            <div className="flex items-start gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                suppressHydrationWarning
              >
                {avatarText}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate text-xs font-semibold text-slate-900 sm:text-sm"
                  suppressHydrationWarning
                >
                  {displayName || 'Người dùng FamiDoc'}
                </div>
                {contactSubtitle && (
                  <div
                    className="truncate text-[11px] text-slate-500"
                    suppressHydrationWarning
                  >
                    {contactSubtitle}
                  </div>
                )}
                <div className="pt-1.5">
                  <Badge
                    variant="outline"
                    className="rounded-full border-blue-200/80 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary"
                  >
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          {roleProfileLink && (
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 sm:text-sm">
              <Link href={roleProfileLink.href}>
                <span className="material-symbols-outlined text-[18px] text-primary">
                  {roleProfileLink.icon}
                </span>
                <span>{roleProfileLink.label}</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 sm:text-sm">
            <Link href="/settings">
              <span className="material-symbols-outlined text-[18px] text-slate-500">
                settings
              </span>
              <span>
                {isFamilyAccount ? 'Cài đặt tài khoản & BHYT' : 'Cài đặt tài khoản & bảo mật'}
              </span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 sm:text-sm">
            <Link href="/notifications">
              <span className="material-symbols-outlined text-[18px] text-slate-500">
                notifications
              </span>
              <span>Trung tâm thông báo</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5 bg-slate-100" />

        <DropdownMenuItem
          variant="destructive"
          onSelect={() => logout()}
          className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-700 sm:text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
