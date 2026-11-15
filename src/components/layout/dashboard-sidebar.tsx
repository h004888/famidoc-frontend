'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, getDefaultPathForRole } from '@/features/auth/context/auth-context';
import { LoginRole } from '@/features/auth/schemas/auth.schema';
import {
  isRestrictedFamilyPath,
  useFamilySubscriptionGateState,
} from './family-subscription-gate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    badge: 'Admin Backoffice',
    badgeColor: 'bg-indigo-50 text-indigo-800 border border-indigo-200/80',
    items: [
      {
        href: '/admin',
        label: 'Tổng quan Nền tảng',
        shortLabel: 'Tổng quan',
        icon: 'monitoring',
        exact: true,
        badge: 'Live',
        badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      },
      {
        href: '/admin/facilities',
        label: 'Quản trị Cơ sở Y tế',
        shortLabel: 'CSYT',
        icon: 'local_hospital',
        badge: 'Duyệt 2 cấp',
        badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200',
      },
      { href: '/admin/packages', label: 'Quản trị Gói dịch vụ', shortLabel: 'Gói DV', icon: 'inventory_2' },
      { href: '/admin/contracts', label: 'Hợp đồng & Pháp lý', shortLabel: 'Hợp đồng', icon: 'handshake' },
      { href: '/admin/reconciliation', label: 'Đối soát SePay', shortLabel: 'Đối soát', icon: 'payments' },
      {
        href: '/admin/disputes',
        label: 'Trọng tài & Tranh chấp',
        shortLabel: 'Tranh chấp',
        icon: 'gavel',
        badge: '3',
        badgeColor: 'bg-rose-50 text-rose-800 border border-rose-200',
      },
      { href: '/admin/users', label: 'Tài khoản, RBAC & Audit', shortLabel: 'Tài khoản', icon: 'shield_person' },
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
        badge: 'Live Queue',
        badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      },
      {
        href: '/facility/contracts',
        label: 'Hợp đồng 4 Bên & Gán BS',
        shortLabel: 'Hợp đồng',
        icon: 'history_edu',
        badge: 'SCR-22',
        badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200',
      },
      { href: '/facility/staff', label: 'Quản lý Nhân sự Y tế', shortLabel: 'Nhân sự', icon: 'badge' },
      {
        href: '/facility/coordination',
        label: 'Điều phối & Chuyển viện',
        shortLabel: 'Điều phối',
        icon: 'support_agent',
        badge: 'Hot',
        badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200',
      },
      { href: '/facility/revenue', label: 'Đối soát Doanh thu B2B', shortLabel: 'Doanh thu', icon: 'payments' },
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
        badge: '12 Ca',
        badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200',
      },
      {
        href: '/doctor/contracts',
        label: 'Hợp đồng & Phụ trách Hộ',
        shortLabel: 'HĐ Phụ trách',
        icon: 'assignment_turned_in',
        badge: 'SCR-16',
        badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200',
      },
      { href: '/doctor/timetable', label: 'Lịch trực & Panel Cap', shortLabel: 'Lịch trực', icon: 'calendar_clock' },
      { href: '/doctor/encounters', label: 'Khám SOAP & Kê đơn', shortLabel: 'Khám SOAP', icon: 'clinical_notes' },
      {
        href: '/doctor/telemedicine',
        label: 'Tư vấn WebRTC 24/7',
        shortLabel: 'Telemed',
        icon: 'videocam',
        badge: 'HD',
        badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      },
      { href: '/doctor/verification', label: 'Xác thực CCHN Y tế', shortLabel: 'CCHN', icon: 'verified_user' },
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
        badge: '1 Sắp tới',
        badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200',
      },
      {
        href: '/family/telemedicine',
        label: 'Phòng khám Video 24/7',
        shortLabel: 'Telemed',
        icon: 'videocam',
        badge: 'HD',
        badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo IoT', shortLabel: 'Chỉ số', icon: 'ecg_heart' },
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
        badge: '1 Sắp tới',
        badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200',
      },
      {
        href: '/family/telemedicine',
        label: 'Phòng khám Video 24/7',
        shortLabel: 'Telemed',
        icon: 'videocam',
        badge: 'HD',
        badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo IoT', shortLabel: 'Chỉ số', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & Tiến trình ký', shortLabel: 'Gói & HĐ', icon: 'history_edu', exact: true },
      { href: '/family/subscription/contract', label: 'Hợp đồng điện tử', shortLabel: 'HĐ điện tử', icon: 'description' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', shortLabel: 'Thanh toán', icon: 'receipt_long' },
    ],
  },
};

const CLINIC_LIST = [
  { id: 'c-01', name: 'BV Đại học Y Dược TP.HCM', address: 'Quận 5, TP.HCM', type: 'Trụ sở Trung tâm' },
  { id: 'c-02', name: 'PKĐK Trustcare Hub Medical', address: 'Bến Nghé, Quận 1', type: 'Phòng khám Vệ tinh' },
  { id: 'c-03', name: 'Vinmec Central Park', address: 'Bình Thạnh, TP.HCM', type: 'BV Đối tác Cấp 1' },
];

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
  const { role, user, logout } = useAuth();
  const { isFamilyLocked, unlockTargetHref, gateStatus } = useFamilySubscriptionGateState();
  const sidebar = useOptionalSidebar();

  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [localMobileOpen, setLocalMobileOpen] = useState(false);
  const [localPinned, setLocalPinned] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('famidoc_sidebar_pinned') : null;
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [selectedClinic, setSelectedClinic] = useState(CLINIC_LIST[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathRole = getRoleFromPathname(pathname);
  const effectiveRole: LoginRole = pathRole || initialRole || (mounted ? role : 'FAMILY');
  const currentMenu = ROLE_MENUS[effectiveRole] || ROLE_MENUS.FAMILY;

  const avatarText = mounted ? (user?.avatarText || 'FD') : 'FD';
  const displayName = mounted ? (user?.name || '') : '';
  const userSubtitle = mounted ? (user?.facilityOrTitle || user?.phone || '') : '';

  const mobileMenuOpen = sidebar ? sidebar.openMobile : localMobileOpen;
  const setMobileMenuOpen = sidebar ? sidebar.setOpenMobile : setLocalMobileOpen;
  const isPinned = sidebar ? sidebar.open : localPinned;
  const isPinnedExpanded = isPinned;
  const isExpanded = isPinnedExpanded || isHovered;

  const togglePin = () => {
    if (sidebar) {
      const next = !sidebar.open;
      sidebar.setOpen(next);
      try {
        localStorage.setItem('famidoc_sidebar_pinned', String(next));
      } catch {}
    } else {
      setLocalPinned((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('famidoc_sidebar_pinned', String(next));
        } catch {}
        return next;
      });
    }
    setIsHovered(true);
  };

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
          href={getDefaultPathForRole(effectiveRole)}
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

        {/* Nút ghim / bỏ ghim thanh điều hướng (Desktop) */}
        {!isCollapsedState && (
          <button
            type="button"
            onClick={togglePin}
            className={`hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer outline-hidden shrink-0 ${
              isPinned
                ? 'text-[#2E37A4] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 shadow-2xs'
                : 'text-slate-400 hover:text-[#2E37A4] hover:bg-slate-100 border border-slate-200/60'
            }`}
            title={
              isPinned
                ? 'Bỏ ghim thanh điều hướng (Tự động thu gọn khi rời chuột)'
                : 'Ghim cố định thanh điều hướng'
            }
            aria-label={isPinned ? 'Bỏ ghim thanh điều hướng' : 'Ghim thanh điều hướng'}
          >
            <span
              className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                isPinned ? 'material-symbols-filled -rotate-45 text-[#2E37A4]' : 'text-slate-500 hover:text-[#2E37A4]'
              }`}
            >
              push_pin
            </span>
          </button>
        )}
      </div>

      {/* Accessible Clinic Switcher using shadcn DropdownMenu */}
      {!isCollapsedState ? (
        <div className="border-b border-slate-100 bg-sidebar p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Chuyển cơ sở y tế phụ trách"
                className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-2.5 text-left transition-colors hover:bg-accent outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[18px]">domain</span>
                  </div>
                  <div className="truncate">
                    <div className="truncate text-xs font-semibold text-slate-900 transition-colors group-hover:text-primary">
                      {selectedClinic.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-600">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="truncate">{selectedClinic.address}</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined shrink-0 text-[16px] text-slate-600 group-hover:text-slate-900">
                  unfold_more
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 rounded-xl p-1.5">
              <DropdownMenuLabel className="px-2.5 py-1 text-xs font-semibold text-slate-600">
                Chuyển cơ sở y tế phụ trách
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CLINIC_LIST.map((clinic) => {
                const isSelected = selectedClinic.id === clinic.id;
                return (
                  <DropdownMenuItem
                    key={clinic.id}
                    onSelect={() => setSelectedClinic(clinic)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs',
                      isSelected && 'bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground'
                    )}
                  >
                    <div className="min-w-0 truncate">
                      <div className="truncate font-semibold">{clinic.name}</div>
                      <div className="truncate text-[11px] opacity-80">
                        {clinic.address} · {clinic.type}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined ml-2 shrink-0 text-[16px]">check</span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex justify-center border-b border-slate-100 py-3 text-primary">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="material-symbols-outlined text-[20px]" aria-label={selectedClinic.name}>
                domain
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">{selectedClinic.name}</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Nav Items List */}
      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        <div className="space-y-1">
          {currentMenu.items.map((item) => {
            const isItemLocked = isFamilyLocked && isRestrictedFamilyPath(item.href);
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
                  title="Cần kích hoạt gói chăm sóc để mở khóa"
                  aria-label={`${item.label} (Đã khóa - cần kích hoạt gói)`}
                  className={cn(
                    'flex w-full cursor-not-allowed items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2.5 text-xs font-medium text-slate-400 opacity-75 sm:text-sm',
                    isCollapsedState && 'justify-center px-2'
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="material-symbols-outlined shrink-0 text-[20px] text-slate-400">
                      lock
                    </span>
                    {!isCollapsedState && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsedState && (
                    <Badge
                      variant="outline"
                      className="shrink-0 rounded-full border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                    >
                      Cần gói
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
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors outline-hidden sm:text-sm',
                  isActive
                    ? 'bg-primary font-semibold text-primary-foreground shadow-2xs'
                    : 'text-slate-700 hover:bg-accent hover:text-primary',
                  isCollapsedState && 'justify-center px-2'
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className={cn(
                      'material-symbols-outlined shrink-0 text-[20px] transition-colors',
                      isActive ? 'text-primary-foreground' : 'text-slate-600 group-hover:text-primary'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsedState && <span className="truncate">{item.label}</span>}
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
              href={unlockTargetHref}
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {gateStatus?.pendingContract ? 'Theo dõi tiến trình hợp đồng' : 'Chọn bác sĩ & gói ngay'}
            </Link>
          </div>
        )}

        {/* Global Settings & Utilities */}
        <div className="space-y-1 border-t border-slate-100 pt-2">
          <Link
            href="/packages"
            onClick={() => setMobileMenuOpen(false)}
            title={isCollapsedState ? 'Danh mục Gói Dịch vụ' : undefined}
            aria-label="Danh mục Gói Dịch vụ"
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors outline-hidden sm:text-sm',
              pathname === '/packages'
                ? 'bg-primary font-semibold text-primary-foreground'
                : 'text-slate-700 hover:bg-accent hover:text-primary',
              isCollapsedState && 'justify-center px-2'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined shrink-0 text-[20px] transition-colors',
                pathname === '/packages' ? 'text-primary-foreground' : 'text-slate-600 group-hover:text-primary'
              )}
            >
              inventory_2
            </span>
            {!isCollapsedState && <span>Danh mục Gói Dịch vụ</span>}
          </Link>

          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            title={isCollapsedState ? 'Cài đặt & Hồ sơ BHYT' : undefined}
            aria-label="Cài đặt & Hồ sơ BHYT"
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
            {!isCollapsedState && <span>Cài đặt &amp; Hồ sơ BHYT</span>}
          </Link>
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings"
            title={displayName || 'Hồ sơ tài khoản'}
            aria-label={displayName || 'Hồ sơ tài khoản'}
            className={cn(
              'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-200/70 outline-hidden',
              isCollapsedState && 'justify-center'
            )}
            suppressHydrationWarning
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              suppressHydrationWarning
            >
              {avatarText}
            </div>
            {!isCollapsedState && (
              <div className="min-w-0 flex-1" suppressHydrationWarning>
                <div className="truncate text-xs font-semibold text-slate-900" suppressHydrationWarning>{displayName}</div>
                <div className="truncate text-xs text-slate-600" suppressHydrationWarning>{userSubtitle}</div>
              </div>
            )}
          </Link>

          {!isCollapsedState && (
            <button
              type="button"
              onClick={logout}
              className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-700 outline-hidden"
              title="Đăng xuất khỏi tài khoản"
              aria-label="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}
        </div>
      </div>
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

          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground outline-hidden"
            aria-label="Hồ sơ tài khoản & Cài đặt"
            suppressHydrationWarning
          >
            <span suppressHydrationWarning>{avatarText}</span>
          </Link>
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
            const isItemLocked = isFamilyLocked && isRestrictedFamilyPath(item.href);
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
                  title="Cần kích hoạt gói chăm sóc để mở khóa"
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

      {/* Desktop Sidenav: Thu gọn icon (w-20), mở rộng khi hover hoặc khi SidebarTrigger bật */}
      <aside
        data-state={isExpanded ? 'expanded' : 'collapsed'}
        className={cn(
          'relative sticky top-0 z-40 hidden h-screen shrink-0 transition-[width] duration-300 ease-in-out lg:block',
          isPinnedExpanded ? 'w-64' : 'w-20'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            'absolute top-0 left-0 h-full overflow-hidden border-r border-slate-200/90 bg-sidebar transition-all duration-300 ease-in-out',
            isExpanded ? 'z-40 w-64 shadow-xl' : 'w-20 shadow-xs'
          )}
        >
          {renderSidebarContent(!isExpanded)}
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
