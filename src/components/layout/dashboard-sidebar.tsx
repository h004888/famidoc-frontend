'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth, getDefaultPathForRole } from '@/features/auth/context/auth-context';
import { LoginRole } from '@/features/auth/schemas/auth.schema';
import { getCurrentBrowserHost, getSubdomainPortal } from '@/lib/portal-routing';
import { DashboardTopbarUser } from './dashboard-topbar-user';
import {
  getFacilityPathLockInfo,
  useFacilityVerificationGateState,
} from './facility-verification-gate';
import {
  isRestrictedDoctorPath,
  useDoctorVerificationGateState,
} from './doctor-verification-gate';
import {
  isRestrictedFamilyPath,
  useFamilySubscriptionGateState,
} from './family-subscription-gate';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  SidebarProvider,
  useOptionalSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: string;
  exact?: boolean;
  badge?: string;
  badgeColor?: string;
}

export interface RoleMenuConfig {
  title: string;
  roleLabel: string;
  badge: string;
  badgeColor: string;
  items: NavItem[];
}

export const ROLE_MENUS: Record<LoginRole, RoleMenuConfig> = {
  ADMIN: {
    title: 'Phân Hệ Quản Trị Viên',
    roleLabel: 'Quản trị viên',
    badge: 'Quản trị hệ thống',
    badgeColor: 'bg-indigo-50 text-indigo-800 border border-indigo-200/80',
    items: [
      {
        href: '/admin',
        label: 'Tổng quan Nền tảng',
        shortLabel: 'Tổng quan',
        icon: 'monitoring',
        exact: true,
      },
      {
        href: '/admin/facilities',
        label: 'Quản trị Cơ sở Y tế',
        shortLabel: 'CSYT',
        icon: 'local_hospital',
      },
      {
        href: '/admin/doctors',
        label: 'Thẩm định Bác sĩ CCHN',
        shortLabel: 'Bác sĩ',
        icon: 'stethoscope',
      },
      {
        href: '/admin/matching-config',
        label: 'Cấu hình AI Matching',
        shortLabel: 'AI Match',
        icon: 'tune',
      },
      { href: '/admin/packages', label: 'Quản lý Gói dịch vụ', shortLabel: 'Gói DV', icon: 'inventory_2' },
      { href: '/admin/contracts', label: 'Hợp đồng & Pháp lý', shortLabel: 'Hợp đồng', icon: 'handshake' },
      { href: '/admin/reconciliation', label: 'Đối soát doanh thu', shortLabel: 'Đối soát', icon: 'payments' },
      {
        href: '/admin/disputes',
        label: 'Xử lý khiếu nại',
        shortLabel: 'Khiếu nại',
        icon: 'gavel',
      },
      { href: '/admin/users', label: 'Quản lý tài khoản và phân quyền', shortLabel: 'Tài khoản', icon: 'shield_person' },
    ],
  },
  FACILITY: {
    title: 'Phân Hệ Cơ Sở Y Tế',
    roleLabel: 'Cơ sở y tế',
    badge: 'Bệnh viện / Phòng khám',
    badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200/80',
    items: [
      {
        href: '/facility',
        label: 'Tổng quan Cơ sở',
        shortLabel: 'Tổng quan',
        icon: 'local_hospital',
        exact: true,
      },
      {
        href: '/facility/legal-profile',
        label: 'Hồ sơ Pháp lý & GPHĐ',
        shortLabel: 'Pháp lý',
        icon: 'policy',
      },
      {
        href: '/facility/contracts',
        label: 'Hợp đồng Hợp tác B2B',
        shortLabel: 'HĐ B2B',
        icon: 'history_edu',
      },
      { href: '/facility/doctors', label: 'Quản lý Bác sĩ & CCHN', shortLabel: 'Bác sĩ', icon: 'badge' },
      {
        href: '/facility/coordination',
        label: 'Hợp đồng Y tế 4 bên',
        shortLabel: 'HĐ 4 bên',
        icon: 'support_agent',
      },
      { href: '/facility/revenue', label: 'Đối soát Doanh thu B2B', shortLabel: 'Doanh thu', icon: 'payments' },
      { href: '/facility/complaints', label: 'Xác minh khiếu nại', shortLabel: 'Khiếu nại', icon: 'gavel' },
    ],
  },
  DOCTOR: {
    title: 'Phân Hệ Bác Sĩ Gia Đình',
    roleLabel: 'Bác sĩ CCHN',
    badge: 'Bác sĩ CCHN',
    badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    items: [
      {
        href: '/doctor',
        label: 'Bảng Lâm sàng',
        shortLabel: 'Lâm sàng',
        icon: 'dashboard',
        exact: true,
      },
      {
        href: '/doctor/contracts',
        label: 'Hợp đồng & Phụ trách Hộ',
        shortLabel: 'HĐ Phụ trách',
        icon: 'assignment_turned_in',
      },
      { href: '/doctor/timetable', label: 'Lịch trực & Panel Cap', shortLabel: 'Lịch trực', icon: 'calendar_clock' },
      { href: '/doctor/encounters', label: 'Khám SOAP & Kê đơn', shortLabel: 'Khám SOAP', icon: 'clinical_notes' },
      {
        href: '/doctor/telemedicine',
        label: 'Tư vấn WebRTC 24/7',
        shortLabel: 'Telemed',
        icon: 'videocam',
      },
      { href: '/doctor/verification', label: 'Xác thực CCHN Y tế', shortLabel: 'CCHN', icon: 'verified_user' },
      { href: '/doctor/profile', label: 'Hồ sơ Chuyên môn', shortLabel: 'Hồ sơ', icon: 'account_circle' },
    ],
  },
  FAMILY: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    roleLabel: 'Hộ gia đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', shortLabel: 'Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Quản lý Thành viên', shortLabel: 'Thành viên', icon: 'group' },
      {
        href: '/family/appointments',
        label: 'Đặt lịch Home & Tele',
        shortLabel: 'Lịch hẹn',
        icon: 'event_available',
      },
      {
        href: '/family/telemedicine',
        label: 'Phòng khám Video 24/7',
        shortLabel: 'Telemed',
        icon: 'videocam',
      },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo sức khỏe', shortLabel: 'Chỉ số', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & Tiến trình ký', shortLabel: 'Gói & HĐ', icon: 'history_edu', exact: true },
      { href: '/family/subscription/contract', label: 'Hợp đồng điện tử', shortLabel: 'HĐ điện tử', icon: 'description' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', shortLabel: 'Thanh toán', icon: 'receipt_long' },
    ],
  },
  PATIENT: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    roleLabel: 'Hộ gia đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', shortLabel: 'Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Quản lý Thành viên', shortLabel: 'Thành viên', icon: 'group' },
      {
        href: '/family/appointments',
        label: 'Đặt lịch Home & Tele',
        shortLabel: 'Lịch hẹn',
        icon: 'event_available',
      },
      {
        href: '/family/telemedicine',
        label: 'Phòng khám Video 24/7',
        shortLabel: 'Telemed',
        icon: 'videocam',
      },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo sức khỏe', shortLabel: 'Chỉ số', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & Tiến trình ký', shortLabel: 'Gói & HĐ', icon: 'history_edu', exact: true },
      { href: '/family/subscription/contract', label: 'Hợp đồng điện tử', shortLabel: 'HĐ điện tử', icon: 'description' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', shortLabel: 'Thanh toán', icon: 'receipt_long' },
    ],
  },
};

/**
 * Suy ra vai trò từ URL pathname để SSR và Client render đồng nhất, tránh hydration mismatch
 */
export const getRoleFromPathname = (path: string): LoginRole | null => {
  if (path.startsWith('/admin')) return 'ADMIN';
  if (path.startsWith('/facility')) return 'FACILITY';
  if (path.startsWith('/doctor')) return 'DOCTOR';
  if (path.startsWith('/family')) return 'FAMILY';
  return null;
};

function DashboardSidebarInner({ initialRole }: { initialRole?: LoginRole }) {
  const pathname = usePathname() || '/family';
  const { role, isAuthenticated, logout } = useAuth();
  const { isFamilyLocked, unlockTargetHref, gateStatus } = useFamilySubscriptionGateState();
  const { facilityProfile, isFacilityLocked } = useFacilityVerificationGateState();
  const { isDoctorLocked } = useDoctorVerificationGateState();
  const sidebar = useOptionalSidebar();

  const [mounted, setMounted] = useState(false);
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const [localOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (sidebar) {
      try {
        localStorage.setItem('famidoc_sidebar_pinned', String(sidebar.open));
      } catch { }
    }
  }, [sidebar]);

  const pathRole = getRoleFromPathname(pathname);
  const hostPortalRole = mounted ? getSubdomainPortal(getCurrentBrowserHost()) : null;
  const effectiveRole: LoginRole =
    pathRole || hostPortalRole || initialRole || (isAuthenticated ? role : mounted ? role : 'FAMILY');
  const currentMenu = ROLE_MENUS[effectiveRole] || ROLE_MENUS.FAMILY;
  const isFamilyAccount = effectiveRole === 'FAMILY' || effectiveRole === 'PATIENT';
  const settingsLabel = isFamilyAccount ? 'Cài đặt & Hồ sơ BHYT' : 'Cài đặt tài khoản';
  const isAdminSidebar = effectiveRole === 'ADMIN';
  const sidebarUtilities = [
    ...(!isAdminSidebar ? [{ href: '/packages', label: 'Danh mục Gói Dịch vụ', icon: 'inventory_2' }] : []),
    { href: '/settings', label: isAdminSidebar ? 'Cài đặt' : settingsLabel, icon: 'settings' },
  ];

  const getFacilityItemLock = (href: string) =>
    effectiveRole === 'FACILITY'
      ? getFacilityPathLockInfo(href, facilityProfile)
      : { locked: false, stage: null, redirectTo: '/facility' };

  const isDoctorRestricted = (href: string) =>
    effectiveRole === 'DOCTOR' && isDoctorLocked && isRestrictedDoctorPath(href);

  const logoHref =
    effectiveRole === 'FACILITY' && isFacilityLocked
      ? '/facility/legal-profile'
      : effectiveRole === 'DOCTOR' && isDoctorLocked
        ? '/doctor/verification'
        : getDefaultPathForRole(effectiveRole);

  const mobileMenuOpen = sidebar ? sidebar.openMobile : localMobileOpen;
  const setMobileMenuOpen = sidebar ? sidebar.setOpenMobile : setLocalMobileOpen;
  const isOpen = sidebar ? sidebar.open : localOpen;


  const renderSidebarContent = (isCollapsedState: boolean) => (
    <div className="flex h-full flex-col border-r border-slate-200/90 bg-sidebar font-sans text-sidebar-foreground">
      {/* Brand Header */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-slate-100 bg-sidebar',
          isCollapsedState ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        <Link
          href={logoHref}
          className="flex items-center overflow-hidden outline-hidden"
          title="Bảng điều khiển FamiDoc"
          aria-label="Bảng điều khiển FamiDoc"
        >
          {isCollapsedState ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <img
                src="/images/logo_khong_chu.png"
                alt="FamiDoc Icon"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </div>
          ) : (
            <div className="flex h-10 w-[150px] shrink-0 items-center">
              <img
                src="/images/FamiDoc Healthcare Logo.png"
                alt="FamiDoc Logo"
                width={150}
                height={40}
                className="h-10 w-[150px] object-contain"
              />
            </div>
          )}
        </Link>


      </div>

      {/* Nav Items List */}
      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {currentMenu.items.map((item) => {
            const facilityLock = getFacilityItemLock(item.href);
            const doctorItemLocked = isDoctorRestricted(item.href);
            const isItemLocked =
              (isFamilyLocked && isRestrictedFamilyPath(item.href)) ||
              facilityLock.locked ||
              doctorItemLocked;
            const lockTooltip = facilityLock.locked
              ? facilityLock.stage === 'B2B'
                ? 'Cần ký Hợp đồng Hợp tác B2B (ACTIVE) để mở khóa'
                : 'Chờ Admin duyệt hồ sơ pháp lý để mở khóa'
              : doctorItemLocked
                ? 'Cần hoàn tất xác thực CCHN 2 cấp để mở khóa'
                : 'Cần kích hoạt gói chăm sóc để mở khóa';
            const lockBadge = facilityLock.locked
              ? facilityLock.stage === 'B2B'
                ? 'Chờ HĐ B2B'
                : 'Chờ duyệt'
              : doctorItemLocked
                ? 'Chờ duyệt'
                : 'Cần gói';
            const isActive =
              !isItemLocked &&
              (item.exact ? pathname === item.href : pathname.startsWith(item.href));

            if (isItemLocked) {
              const lockedButton = (
                <button
                  key={item.href}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={lockTooltip}
                  aria-label={`${item.label} (Đã khóa)`}
                  className={cn(
                    'flex w-full cursor-not-allowed items-center justify-between gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5 text-xs font-medium text-slate-400 opacity-75 sm:text-sm',
                    isCollapsedState && 'justify-center px-2'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="material-symbols-outlined shrink-0 text-[20px] text-slate-400">
                      lock
                    </span>
                    {!isCollapsedState && (
                      <span className="text-left leading-snug">{item.label}</span>
                    )}
                  </div>
                  {!isCollapsedState && (
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-full border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                    >
                      {lockBadge}
                    </Badge>
                  )}
                </button>
              );

              return isCollapsedState ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{lockedButton}</TooltipTrigger>
                  <TooltipContent side="right">{item.label} (Đã khóa)</TooltipContent>
                </Tooltip>
              ) : (
                lockedButton
              );
            }

            const linkEl = (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={isCollapsedState ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  'group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors outline-hidden sm:text-sm',
                  isActive
                    ? 'bg-primary font-semibold text-primary-foreground shadow-2xs'
                    : 'text-slate-700 hover:bg-accent hover:text-primary',
                  isCollapsedState && 'justify-center px-2'
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'material-symbols-outlined shrink-0 text-[20px] transition-colors',
                      isActive ? 'text-primary-foreground' : 'text-slate-600 group-hover:text-primary'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsedState && (
                    <span className="leading-snug">{item.label}</span>
                  )}
                </div>
                {!isCollapsedState && item.badge && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );

            return isCollapsedState ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              linkEl
            );
          })}
        </div>

        {!isCollapsedState && isFamilyLocked && (
          <div
            className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs"
            data-testid="sidebar-family-gate-notice"
          >
            <div className="flex items-start gap-2 font-semibold text-amber-900">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px]">lock</span>
              <span>Chưa kích hoạt gói chăm sóc</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              Cần kích hoạt gói chăm sóc &amp; hợp đồng ACTIVE để mở khóa các mục quản lý gia đình.
            </p>
            <Link
              href={gateStatus?.pendingContract ? unlockTargetHref : '/onboarding'}
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {gateStatus?.pendingContract ? 'Theo dõi tiến trình hợp đồng' : 'Chọn bác sĩ & gói ngay'}
            </Link>
            {gateStatus?.pendingContract && (
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white/70 px-3 py-1.5 font-semibold text-amber-900 transition-colors hover:bg-white"
              >
                <span className="material-symbols-outlined text-[15px]">home_health</span>
                <span>Không gian chuẩn bị</span>
              </Link>
            )}
          </div>
        )}

        {/* Global Settings & Utilities */}
        <div className="space-y-1 border-t border-slate-100 pt-2">
          {(() => {
            const settingsEl = (
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                title={isCollapsedState ? settingsLabel : undefined}
                aria-label={settingsLabel}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors outline-hidden sm:text-sm',
                  pathname === '/settings'
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'text-slate-700 hover:bg-accent hover:text-primary',
                  isCollapsedState && 'justify-center px-2'
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined shrink-0 text-[20px] transition-colors',
                    pathname === '/settings' ? 'text-primary-foreground' : 'text-slate-600 group-hover:text-primary'
                  )}
                >
                  settings
                </span>
                {!isCollapsedState && <span>{settingsLabel}</span>}
              </Link>
            );

            return isCollapsedState ? (
              <Tooltip>
                <TooltipTrigger asChild>{settingsEl}</TooltipTrigger>
                <TooltipContent side="right">{settingsLabel}</TooltipContent>
              </Tooltip>
            ) : (
              settingsEl
            );
          })()}

          {(() => {
            const logoutEl = (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                title={isCollapsedState ? 'Đăng xuất' : undefined}
                aria-label="Đăng xuất"
                className={cn(
                  'group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 outline-hidden sm:text-sm',
                  isCollapsedState && 'justify-center px-2'
                )}
              >
                <span className="material-symbols-outlined shrink-0 text-[20px]">logout</span>
                {!isCollapsedState && <span>Đăng xuất</span>}
              </button>
            );

            return isCollapsedState ? (
              <Tooltip>
                <TooltipTrigger asChild>{logoutEl}</TooltipTrigger>
                <TooltipContent side="right">Đăng xuất</TooltipContent>
              </Tooltip>
            ) : (
              logoutEl
            );
          })()}
        </div>
      </div>

      {isAdminSidebar && (
        <div className="shrink-0 border-t border-slate-200 p-3">
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            aria-label="Đăng xuất"
            title={isCollapsedState ? 'Đăng xuất' : undefined}
            className={cn(
              'h-10 w-full text-destructive hover:bg-destructive/10 hover:text-destructive',
              isCollapsedState ? 'justify-center px-0' : 'justify-start'
            )}
          >
            <LogOut aria-hidden="true" />
            {!isCollapsedState && 'Đăng xuất'}
          </Button>
        </div>
      )}
    </div>
  );

  const hasOverflowMobileTabs = currentMenu.items.length > 5;
  const primaryMobileTabs = hasOverflowMobileTabs
    ? currentMenu.items.slice(0, 4)
    : currentMenu.items;
  const overflowMobileTabs = hasOverflowMobileTabs ? currentMenu.items.slice(4) : [];
  const isOverflowTabActive = overflowMobileTabs.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 text-slate-900 lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900 outline-hidden"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <Link
            href="/"
            className="flex h-9 w-[132px] shrink-0 items-center outline-hidden"
            aria-label="Trang chủ FamiDoc"
          >
            <img
              src="/images/FamiDoc Healthcare Logo.png"
              alt="FamiDoc Logo"
              width={132}
              height={36}
              className="h-9 w-[132px] object-contain"
            />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-accent hover:text-primary outline-hidden"
            aria-label="Thông báo hệ thống"
            title="Trung tâm thông báo đa kênh"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </Link>

          <DashboardTopbarUser compact />
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Điều hướng chính trên điện thoại"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-1.5 py-1 shadow-[0_-4px_16px_rgba(15,23,42,0.05)] backdrop-blur-md lg:hidden"
      >
        <div
          className={cn(
            'grid items-center',
            hasOverflowMobileTabs || primaryMobileTabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'
          )}
        >
          {primaryMobileTabs.map((item) => {
            const facilityLock = getFacilityItemLock(item.href);
            const doctorItemLocked = isDoctorRestricted(item.href);
            const isItemLocked =
              (isFamilyLocked && isRestrictedFamilyPath(item.href)) ||
              facilityLock.locked ||
              doctorItemLocked;
            const lockTooltip = facilityLock.locked
              ? facilityLock.stage === 'B2B'
                ? 'Cần ký Hợp đồng Hợp tác B2B (ACTIVE) để mở khóa'
                : 'Chờ Admin duyệt hồ sơ pháp lý để mở khóa'
              : doctorItemLocked
                ? 'Cần hoàn tất xác thực CCHN 2 cấp để mở khóa'
                : 'Cần kích hoạt gói chăm sóc để mở khóa';
            const isActive =
              !isItemLocked &&
              (item.exact ? pathname === item.href : pathname.startsWith(item.href));

            if (isItemLocked) {
              return (
                <button
                  key={item.href}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title={lockTooltip}
                  aria-label={`${item.label} (Đã khóa)`}
                  className="relative flex cursor-not-allowed flex-col items-center justify-center rounded-xl px-1 py-1.5 font-medium text-slate-400 opacity-70"
                >
                  <span className="material-symbols-outlined text-[20px] leading-none text-slate-400">
                    lock
                  </span>
                  <span className="mt-1 max-w-full truncate text-xs leading-tight">
                    {item.shortLabel || item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-colors outline-hidden',
                  isActive
                    ? 'font-semibold text-primary'
                    : 'font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
                <span
                  className={cn(
                    'material-symbols-outlined text-[20px] leading-none',
                    isActive ? 'text-primary' : 'text-slate-600'
                  )}
                >
                  {item.icon}
                </span>
                <span className="mt-1 max-w-full truncate text-xs leading-tight">
                  {item.shortLabel || item.label}
                </span>
              </Link>
            );
          })}

          {hasOverflowMobileTabs && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                'relative flex cursor-pointer flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-colors outline-hidden',
                mobileMenuOpen || isOverflowTabActive
                  ? 'font-semibold text-primary'
                  : 'font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              )}
            >
              {(mobileMenuOpen || isOverflowTabActive) && (
                <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
              <span
                className={cn(
                  'material-symbols-outlined text-[20px] leading-none',
                  mobileMenuOpen || isOverflowTabActive ? 'text-primary' : 'text-slate-600'
                )}
              >
                apps
              </span>
              <span className="mt-1 truncate text-xs leading-tight">Thêm</span>
            </button>
          )}
        </div>
      </nav>

      {/* Desktop Sidenav: Thu gọn (w-20) hiện logo và icon các trang, mở rộng (w-64) qua SidebarTrigger, không tự động bung khi hover */}
      <aside
        data-state={isOpen ? 'expanded' : 'collapsed'}
        className={cn(
          'relative sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-300 ease-in-out lg:block',
          isOpen ? 'w-64' : 'w-20'
        )}
      >
        <div
          className={cn(
            'h-full overflow-hidden border-r border-slate-200/90 bg-sidebar transition-[width] duration-300 ease-in-out',
            isOpen ? 'w-64' : 'w-20'
          )}
        >
          {renderSidebarContent(!isOpen)}
        </div>
      </aside>

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] p-0 lg:hidden [&>button]:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>{currentMenu.title}</SheetTitle>
            <SheetDescription>Menu điều hướng hệ thống FamiDoc</SheetDescription>
          </SheetHeader>
          {renderSidebarContent(false)}
        </SheetContent>
      </Sheet>
    </>
  );
}

export interface DashboardSidebarProps {
  initialRole?: LoginRole;
}

/**
 * Shared role-aware dashboard sidebar. Automatically provides SidebarProvider fallback when rendered standalone.
 */
export function DashboardSidebar({ initialRole }: DashboardSidebarProps = {}) {
  const sidebar = useOptionalSidebar();
  if (sidebar) {
    return <DashboardSidebarInner initialRole={initialRole} />;
  }

  const initialPinned = (() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('famidoc_sidebar_pinned') : null;
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  })();

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen={initialPinned} className="min-h-0 w-auto">
        <DashboardSidebarInner initialRole={initialRole} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
