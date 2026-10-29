'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { LoginRole } from '@/features/auth/schemas/auth.schema';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

interface RoleMenuConfig {
  title: string;
  badge: string;
  badgeColor: string;
  items: NavItem[];
}

// Cấu hình menu riêng biệt cho từng Role độc lập
const ROLE_MENUS: Record<LoginRole, RoleMenuConfig> = {
  ADMIN: {
    title: 'Phân Hệ Quản Trị Viên',
    badge: 'Admin Backoffice',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    items: [
      { href: '/admin', label: 'Tổng quan Nền tảng', icon: 'monitoring', exact: true },
      { href: '/admin/packages', label: 'Quản trị Gói dịch vụ', icon: 'inventory_2' },
      { href: '/admin/contracts', label: 'Hợp đồng & Pháp lý', icon: 'handshake' },
      { href: '/admin/disputes', label: 'Trọng tài & Tranh chấp', icon: 'gavel' },
      { href: '/admin/users', label: 'Tài khoản, RBAC & Audit', icon: 'shield_person' },
    ],
  },
  FACILITY: {
    title: 'Phân Hệ Cơ Sở Y Tế',
    badge: 'Bệnh viện / Phòng khám',
    badgeColor: 'bg-blue-100 text-blue-800',
    items: [
      { href: '/facility', label: 'Tổng quan Cơ sở', icon: 'local_hospital', exact: true },
      { href: '/facility/staff', label: 'Quản lý Nhân sự Y tế', icon: 'badge' },
      { href: '/facility/coordination', label: 'Điều phối & Khiếu nại', icon: 'support_agent' },
      { href: '/facility/revenue', label: 'Đối soát Doanh thu B2B', icon: 'payments' },
    ],
  },
  DOCTOR: {
    title: 'Phân Hệ Bác Sĩ Gia Đình',
    badge: 'Bác sĩ CCHN',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    items: [
      { href: '/doctor', label: 'Bảng Lâm sàng', icon: 'dashboard', exact: true },
      { href: '/doctor/timetable', label: 'Lịch trực & Panel Cap', icon: 'calendar_clock' },
      { href: '/doctor/encounters', label: 'Khám SOAP & Kê đơn', icon: 'clinical_notes' },
      { href: '/doctor/telemedicine', label: 'Tư vấn WebRTC 24/7', icon: 'videocam' },
      { href: '/doctor/verification', label: 'Xác thực CCHN Y tế', icon: 'verified_user' },
    ],
  },
  FAMILY: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-100 text-amber-800',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Hồ sơ & Timeline EHR', icon: 'person_search' },
      { href: '/family/appointments', label: 'Đặt lịch Home & Tele', icon: 'event_available' },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & HĐ 4 Bên', icon: 'contract' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', icon: 'receipt_long' },
    ],
  },
  PATIENT: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-100 text-amber-800',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Hồ sơ & Timeline EHR', icon: 'person_search' },
      { href: '/family/appointments', label: 'Đặt lịch Home & Tele', icon: 'event_available' },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & HĐ 4 Bên', icon: 'contract' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', icon: 'receipt_long' },
    ],
  },
};

export function DashboardSidebar() {
  const pathname = usePathname() || '/family';
  const { role, user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Chỉ lấy menu của đúng Role hiện tại đang đăng nhập
  const currentMenu = ROLE_MENUS[role] || ROLE_MENUS.FAMILY;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className={`flex items-center justify-between ${isCollapsed ? 'px-2' : 'px-3.5'} h-20 border-b border-slate-800 shrink-0`}>
        <Link href="/" className="flex items-center group overflow-hidden">
          <div className={`rounded-xl shadow-md transition-all group-hover:shadow-lg ${isCollapsed
            ? 'w-12 h-12 p-1.5 flex items-center justify-center'
            : 'h-14 px-3.5 py-1.5 flex items-center justify-center'
            }`}>
            <img
              src="/images/FamiDoc Healthcare Logo.png"
              alt="FamiDoc Logo"
              className={
                isCollapsed
                  ? 'h-full w-full object-contain'
                  : 'h-25 w-auto max-w-[175px] object-contain transition-transform group-hover:scale-105'
              }
            />
          </div>
        </Link>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Role Badge Indicator */}
      {!isCollapsed ? (
        <div className="px-3 pt-3 pb-2 border-b border-slate-800/80">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-400">
              verified_user
            </span>
            <div className="truncate">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                Phân hệ đăng nhập
              </div>
              <div className="text-xs font-bold text-white truncate">
                {currentMenu.title}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-2.5 flex justify-center border-b border-slate-800 text-blue-400">
          <span className="material-symbols-outlined text-[20px]">verified_user</span>
        </div>
      )}

      {/* Nav Items List: CHỈ HIỂN THỊ MENU RIÊNG CỦA ROLE NÀY */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Danh mục nghiệp vụ</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${currentMenu.badgeColor}`}>
                {currentMenu.badge}
              </span>
            </div>
          )}

          <div className="space-y-1 pt-1">
            {currentMenu.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40 ring-1 ring-blue-500'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? 'text-white' : 'text-slate-400'
                      }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Global Settings link */}
        <div className="pt-2 border-t border-slate-800 space-y-1">
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${pathname === '/settings'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            {!isCollapsed && <span>Cài đặt tài khoản</span>}
          </Link>
        </div>
      </div>

      {/* User Footer Profile & Nút Đăng Xuất (Logout) */}
      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30 shrink-0">
              {user?.avatarText || 'FD'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.facilityOrTitle || user?.phone}</div>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 flex items-center gap-1"
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

  return (
    <>
      {/* Mobile Top Bar (hamburger) */}
      <div className="lg:hidden flex items-center justify-between px-4 h-16 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          aria-label="Mở menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <Link href="/" className="flex items-center">
          <div className="bg-white rounded-xl px-3 py-1.5 flex items-center justify-center shadow-xs">
            <img
              src="/images/FamiDoc Healthcare Logo.png"
              alt="FamiDoc Logo"
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          </div>
        </Link>

        <button onClick={logout} className="p-2 text-slate-300 hover:text-rose-400" title="Đăng xuất">
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Vertical Left Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
