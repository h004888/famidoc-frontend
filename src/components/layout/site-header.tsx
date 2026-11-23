'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, getDefaultPathForRole } from '@/features/auth/context/auth-context';
import { LoginRole } from '@/features/auth/schemas/auth.schema';
import { getCurrentBrowserHost, getSubdomainPortal } from '@/lib/portal-routing';
import { ROLE_MENUS, getRoleFromPathname } from './dashboard-sidebar';
import { DashboardTopbarNotifications } from './dashboard-topbar-notifications';
import { DashboardTopbarUser } from './dashboard-topbar-user';
import { useFamilySubscriptionGateState } from './family-subscription-gate';
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
  '/settings': 'Cài đặt',
  '/packages': 'Danh mục Gói Dịch vụ',
};

export interface SiteHeaderProps {
  initialRole?: LoginRole;
}

/**
 * Shared desktop dashboard topbar with sidebar toggle, dynamic breadcrumb, notifications, and user menu.
 */
export function SiteHeader({ initialRole }: SiteHeaderProps = {}) {
  const pathname = usePathname() || '/family';
  const { role, isAuthenticated } = useAuth();
  const { isFamilyLocked, gateStatus, unlockTargetHref } = useFamilySubscriptionGateState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathRole = getRoleFromPathname(pathname);
  const hostPortalRole = mounted ? getSubdomainPortal(getCurrentBrowserHost()) : null;
  const effectiveRole: LoginRole =
    pathRole || hostPortalRole || initialRole || (isAuthenticated ? role : mounted ? role : 'FAMILY');
  const menuConfig = ROLE_MENUS[effectiveRole] || ROLE_MENUS.FAMILY;
  const isFamilyAccount = effectiveRole === 'FAMILY' || effectiveRole === 'PATIENT';
  /**
   * Khi tài khoản gia đình chưa kích hoạt gói và đang ở khung dashboard, breadcrumb
   * gốc của vai trò trỏ về `/onboarding`. Nếu đang chờ ký/thanh toán thì trỏ
   * về đúng bước `/booking/...` để người dùng tiếp tục luồng nghiệp vụ.
   */
  const familyGateHomePath = gateStatus?.pendingContract?.id ? unlockTargetHref : '/onboarding';
  const isFamilyLockedAccount =
    isFamilyLocked && (effectiveRole === 'FAMILY' || effectiveRole === 'PATIENT');
  const roleHomePath = isFamilyLockedAccount
    ? familyGateHomePath
    : getDefaultPathForRole(effectiveRole);
  const breadcrumbHomeHref = '/';

  const matchedItem =
    menuConfig.items.find((item) => item.href === pathname) ||
    menuConfig.items
      .filter((item) => !item.exact && pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];

  /* ── Dynamic label override for member detail pages ── */
  const memberPathMatch = pathname.match(/^\/family\/members\/([^/]+)$/);
  const memberId = memberPathMatch?.[1] ?? null;
  const [memberBreadcrumbLabel, setMemberBreadcrumbLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setMemberBreadcrumbLabel(null);
      return;
    }
    setMemberBreadcrumbLabel(null);

    // Try localStorage cache first (populated by page-level components)
    try {
      const cached = localStorage.getItem(`member_name_${memberId}`);
      if (cached) {
        setMemberBreadcrumbLabel(cached);
        return;
      }
    } catch { /* ignore */ }

    // Fallback: fetch from external API
    let cancelled = false;
    import('@/lib/api').then(mod => {
      mod.patientsApi.getMemberById(memberId)
        .then(data => {
          if (!cancelled && data?.fullName) {
            setMemberBreadcrumbLabel(data.fullName);
            try { localStorage.setItem(`member_name_${memberId}`, data.fullName); } catch {}
          } else if (!cancelled) {
            setMemberBreadcrumbLabel(memberId);
          }
        })
        .catch(() => {
          if (!cancelled) setMemberBreadcrumbLabel(memberId);
        });
    }).catch(() => { /* module error */ });
    return () => { cancelled = true; };
  }, [memberId]);

  const settingsBreadcrumbLabel = isFamilyAccount
    ? 'Cài đặt & Hồ sơ BHYT'
    : 'Cài đặt tài khoản';
  const currentLabel =
    matchedItem?.label ||
    (pathname === '/settings' ? settingsBreadcrumbLabel : EXTRA_ROUTE_LABELS[pathname]) ||
    menuConfig.title;

  const isFamilyOverviewHub = pathname === '/family';

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:px-6 lg:flex lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger
          className="h-9 w-9 rounded-xl text-slate-600 hover:bg-accent hover:text-primary cursor-pointer"
          aria-label="Bật hoặc tắt thanh điều hướng"
          title="Bật hoặc tắt thanh điều hướng"
        />
        {!isFamilyOverviewHub && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb suppressHydrationWarning>
              <BreadcrumbList className="text-xs" suppressHydrationWarning>
                {!isFamilyAccount && (
                  <>
                    <BreadcrumbItem suppressHydrationWarning>
                      <BreadcrumbLink asChild suppressHydrationWarning>
                        <Link href={breadcrumbHomeHref} className="font-medium text-slate-500 hover:text-primary" suppressHydrationWarning>
                          Trang chủ
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
                <BreadcrumbItem suppressHydrationWarning>
                  <BreadcrumbLink asChild suppressHydrationWarning>
                    <Link href={roleHomePath} className="font-medium text-slate-500 hover:text-primary" suppressHydrationWarning>
                      {menuConfig.roleLabel}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {memberId ? (
                  <>
                    <BreadcrumbItem suppressHydrationWarning>
                      <BreadcrumbLink asChild suppressHydrationWarning>
                        <Link
                          href={matchedItem?.href || '/family/members'}
                          className="font-medium text-slate-500 hover:text-primary"
                          suppressHydrationWarning
                        >
                          {matchedItem?.label || 'Quản lý Thành viên'}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem suppressHydrationWarning>
                      <BreadcrumbPage className="font-semibold text-primary" suppressHydrationWarning>
                        {memberBreadcrumbLabel || 'Hồ sơ thành viên'}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                ) : (
                  <BreadcrumbItem suppressHydrationWarning>
                    <BreadcrumbPage className="font-semibold text-primary" suppressHydrationWarning>{currentLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <React.Suspense fallback={<div className="h-9 w-9 rounded-xl bg-slate-100" />}>
          <DashboardTopbarNotifications />
        </React.Suspense>

        <React.Suspense fallback={<div className="h-9 w-9 rounded-full bg-slate-100" />}>
          <DashboardTopbarUser />
        </React.Suspense>
      </div>
    </header>
  );
}
