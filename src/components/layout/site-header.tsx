'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, getDefaultPathForRole } from '@/features/auth/context/auth-context';
import { ROLE_MENUS, getRoleFromPathname } from './dashboard-sidebar';
import { DashboardTopbarUser } from './dashboard-topbar-user';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const EXTRA_ROUTE_LABELS: Record<string, string> = {
  '/notifications': 'Thông báo hệ thống',
  '/settings': 'Cài đặt & Hồ sơ BHYT',
  '/packages': 'Danh mục Gói Dịch vụ',
};

/**
 * Shared desktop dashboard topbar with sidebar toggle, dynamic breadcrumb, notifications, and user menu.
 */
export function SiteHeader() {
  const pathname = usePathname() || '/family';
  const { role } = useAuth();
  const pathRole = getRoleFromPathname(pathname);
  const effectiveRole = pathRole || role || 'FAMILY';
  const menuConfig = ROLE_MENUS[effectiveRole] || ROLE_MENUS.FAMILY;
  const homePath = getDefaultPathForRole(effectiveRole);

  const matchedItem =
    menuConfig.items.find((item) => item.href === pathname) ||
    menuConfig.items
      .filter((item) => !item.exact && pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];

  const currentLabel = matchedItem?.label || EXTRA_ROUTE_LABELS[pathname] || menuConfig.title;

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:px-6 lg:flex lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger
          className="h-9 w-9 rounded-xl text-slate-600 hover:bg-accent hover:text-primary"
          aria-label="Bật hoặc tắt thanh điều hướng"
        />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={homePath} className="font-medium text-slate-500 hover:text-primary">
                  Trang chủ
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={homePath} className="font-medium text-slate-500 hover:text-primary">
                  {menuConfig.roleLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-primary">{currentLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-accent hover:text-primary outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Thông báo hệ thống"
          title="Trung tâm thông báo đa kênh"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </Link>

        <React.Suspense fallback={<div className="h-9 w-9 rounded-full bg-slate-100" />}>
          <DashboardTopbarUser />
        </React.Suspense>
      </div>
    </header>
  );
}
