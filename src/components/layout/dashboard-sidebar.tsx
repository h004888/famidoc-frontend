'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, getDefaultPathForRole } from '@/features/auth/context/auth-context';
import { LoginRole } from '@/features/auth/schemas/auth.schema';

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: string;
  exact?: boolean;
  badge?: string;
  badgeColor?: string;
}

interface RoleMenuConfig {
  title: string;
  badge: string;
  badgeColor: string;
  items: NavItem[];
}

// Cấu hình menu riêng biệt cho từng Role độc lập với bảng màu sáng chuẩn Preclinic
const ROLE_MENUS: Record<LoginRole, RoleMenuConfig> = {
  ADMIN: {
    title: 'Phân Hệ Quản Trị Viên',
    badge: 'Admin Backoffice',
    badgeColor: 'bg-indigo-50 text-indigo-800 border border-indigo-200/80',
    items: [
      { href: '/admin', label: 'Tổng quan Nền tảng', shortLabel: 'Tổng quan', icon: 'monitoring', exact: true, badge: 'Live', badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
      { href: '/admin/packages', label: 'Quản trị Gói dịch vụ', shortLabel: 'Gói DV', icon: 'inventory_2' },
      { href: '/admin/contracts', label: 'Hợp đồng & Pháp lý', shortLabel: 'Hợp đồng', icon: 'handshake' },
      { href: '/admin/reconciliation', label: 'Đối soát SePay', shortLabel: 'Đối soát', icon: 'payments' },
      { href: '/admin/disputes', label: 'Trọng tài & Tranh chấp', shortLabel: 'Tranh chấp', icon: 'gavel', badge: '3', badgeColor: 'bg-rose-50 text-rose-800 border border-rose-200' },
      { href: '/admin/users', label: 'Tài khoản, RBAC & Audit', shortLabel: 'Tài khoản', icon: 'shield_person' },
    ],
  },
  FACILITY: {
    title: 'Phân Hệ Cơ Sở Y Tế',
    badge: 'Bệnh viện / Phòng khám',
    badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200/80',
    items: [
      { href: '/facility', label: 'Tổng quan Cơ sở', shortLabel: 'Tổng quan', icon: 'local_hospital', exact: true, badge: 'Live Queue', badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
      { href: '/facility/contracts', label: 'Hợp đồng 4 Bên & Gán BS', shortLabel: 'Hợp đồng', icon: 'history_edu', badge: 'SCR-22', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' },
      { href: '/facility/staff', label: 'Quản lý Nhân sự Y tế', shortLabel: 'Nhân sự', icon: 'badge' },
      { href: '/facility/coordination', label: 'Điều phối & Chuyển viện', shortLabel: 'Điều phối', icon: 'support_agent', badge: 'Hot', badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200' },
      { href: '/facility/contracts', label: 'Hợp đồng tiếp nhận', shortLabel: 'HĐ tiếp nhận', icon: 'handshake' },
      { href: '/facility/revenue', label: 'Đối soát Doanh thu B2B', shortLabel: 'Doanh thu', icon: 'payments' },
    ],
  },
  DOCTOR: {
    title: 'Phân Hệ Bác Sĩ Gia Đình',
    badge: 'Bác sĩ CCHN',
    badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    items: [
      { href: '/doctor', label: 'Bảng Lâm sàng', shortLabel: 'Lâm sàng', icon: 'dashboard', exact: true, badge: '12 Ca', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' },
      { href: '/doctor/contracts', label: 'Hợp đồng & Phụ trách Hộ', shortLabel: 'HĐ Phụ trách', icon: 'assignment_turned_in', badge: 'SCR-16', badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200' },
      { href: '/doctor/timetable', label: 'Lịch trực & Panel Cap', shortLabel: 'Lịch trực', icon: 'calendar_clock' },
      { href: '/doctor/encounters', label: 'Khám SOAP & Kê đơn', shortLabel: 'Khám SOAP', icon: 'clinical_notes' },
      { href: '/doctor/contracts', label: 'Hợp đồng phụ trách', shortLabel: 'HĐ phụ trách', icon: 'assignment' },
      { href: '/doctor/telemedicine', label: 'Tư vấn WebRTC 24/7', shortLabel: 'Telemed', icon: 'videocam', badge: 'HD', badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
      { href: '/doctor/verification', label: 'Xác thực CCHN Y tế', shortLabel: 'CCHN', icon: 'verified_user' },
    ],
  },
  FAMILY: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', shortLabel: 'Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Quản lý Thành viên', shortLabel: 'Thành viên', icon: 'group' },
      { href: '/family/appointments', label: 'Đặt lịch Home & Tele', shortLabel: 'Lịch hẹn', icon: 'event_available', badge: '1 Sắp tới', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' },
      { href: '/family/telemedicine', label: 'Phòng khám Video 24/7', shortLabel: 'Telemed', icon: 'videocam', badge: 'HD', badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo IoT', shortLabel: 'Chỉ số', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & Tiến trình ký', shortLabel: 'Gói & HĐ', icon: 'history_edu', exact: true },
      { href: '/family/subscription/contract', label: 'Hợp đồng điện tử', shortLabel: 'HĐ điện tử', icon: 'description' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', shortLabel: 'Thanh toán', icon: 'receipt_long' },
    ],
  },
  PATIENT: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', shortLabel: 'Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Quản lý Thành viên', shortLabel: 'Thành viên', icon: 'group' },
      { href: '/family/appointments', label: 'Đặt lịch Home & Tele', shortLabel: 'Lịch hẹn', icon: 'event_available', badge: '1 Sắp tới', badgeColor: 'bg-blue-50 text-blue-800 border border-blue-200' },
      { href: '/family/telemedicine', label: 'Phòng khám Video 24/7', shortLabel: 'Telemed', icon: 'videocam', badge: 'HD', badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
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

export function DashboardSidebar() {
  const pathname = usePathname() || '/family';
  const { role, user, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clinicDropdownOpen, setClinicDropdownOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(CLINIC_LIST[0]);

  // Chỉ lấy menu của đúng Role hiện tại đang đăng nhập
  const currentMenu = ROLE_MENUS[role] || ROLE_MENUS.FAMILY;

  const renderSidebar = (isCollapsedState: boolean) => (
    <div className="flex flex-col h-full bg-white text-slate-700 font-sans border-r border-slate-200/90">
      {/* Brand Header */}
      <div
        className={`flex items-center h-16 border-b border-slate-100 shrink-0 bg-white ${
          isCollapsedState ? 'justify-center px-2' : 'justify-start px-4'
        }`}
      >
        <Link
          href={getDefaultPathForRole(role)}
          className="flex items-center overflow-hidden outline-hidden"
          title="Bảng điều khiển FamiDoc"
          aria-label="Bảng điều khiển FamiDoc"
        >
          {isCollapsedState ? (
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src="/images/logo_khong_chu.png"
                alt="FamiDoc Icon"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
            </div>
          ) : (
            <div className="h-10 w-[150px] flex items-center shrink-0">
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

      {/* Preclinic Clinic Switcher Dropdown */}
      {!isCollapsedState ? (
        <div className="p-3 border-b border-slate-100 relative bg-white">
          <button
            type="button"
            onClick={() => setClinicDropdownOpen(!clinicDropdownOpen)}
            className="w-full bg-slate-50 hover:bg-slate-200/70 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-left transition-colors group outline-hidden cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#2E37A4]/10 border border-[#2E37A4]/20 flex items-center justify-center text-[#2E37A4] shrink-0">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#2E37A4] transition-colors">
                  {selectedClinic.name}
                </div>
                <div className="text-xs text-slate-600 truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">{selectedClinic.address}</span>
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-600 group-hover:text-slate-900 shrink-0">
              {clinicDropdownOpen ? 'expand_less' : 'unfold_more'}
            </span>
          </button>

          {/* Clinic Dropdown Menu */}
          {clinicDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 space-y-1">
              <div className="px-2.5 py-1 text-xs font-semibold text-slate-600">
                Chuyển cơ sở y tế phụ trách
              </div>
              {CLINIC_LIST.map((clinic) => (
                <button
                  key={clinic.id}
                  type="button"
                  onClick={() => {
                    setSelectedClinic(clinic);
                    setClinicDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors outline-hidden cursor-pointer ${
                    selectedClinic.id === clinic.id
                      ? 'bg-[#2E37A4] text-white font-semibold'
                      : 'hover:bg-slate-200/70 text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold truncate">{clinic.name}</div>
                    <div className="text-xs opacity-80 truncate">{clinic.address} · {clinic.type}</div>
                  </div>
                  {selectedClinic.id === clinic.id && (
                    <span className="material-symbols-outlined text-[16px] text-white">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="py-3 flex justify-center border-b border-slate-100 text-[#2E37A4]">
          <span className="material-symbols-outlined text-[20px]" title={selectedClinic.name}>domain</span>
        </div>
      )}

      {/* Nav Items List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div className="space-y-1">
          {currentMenu.items.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={isCollapsedState ? item.label : undefined}
                aria-label={item.label}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors group outline-hidden ${
                  isActive
                    ? 'bg-[#2E37A4] text-white font-semibold'
                    : 'text-slate-700 hover:text-[#2E37A4] hover:bg-slate-200/70'
                } ${isCollapsedState ? 'justify-center px-2' : ''}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 group-hover:text-[#2E37A4]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsedState && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsedState && item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Global Settings & Utilities */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <Link
            href="/packages"
            onClick={() => setMobileMenuOpen(false)}
            title={isCollapsedState ? 'Danh mục Gói Dịch vụ' : undefined}
            aria-label="Danh mục Gói Dịch vụ"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors group outline-hidden ${
              pathname === '/packages'
                ? 'bg-[#2E37A4] text-white font-semibold'
                : 'text-slate-700 hover:text-[#2E37A4] hover:bg-slate-200/70'
            } ${isCollapsedState ? 'justify-center px-2' : ''}`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                pathname === '/packages' ? 'text-white' : 'text-slate-600 group-hover:text-[#2E37A4]'
              }`}
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors group outline-hidden ${
              pathname === '/settings'
                ? 'bg-[#2E37A4] text-white font-semibold'
                : 'text-slate-700 hover:text-[#2E37A4] hover:bg-slate-200/70'
            } ${isCollapsedState ? 'justify-center px-2' : ''}`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                pathname === '/settings' ? 'text-white' : 'text-slate-600 group-hover:text-[#2E37A4]'
              }`}
            >
              settings
            </span>
            {!isCollapsedState && <span>Cài đặt &amp; Hồ sơ BHYT</span>}
          </Link>
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings"
            title={user?.name || 'Hồ sơ tài khoản'}
            aria-label={user?.name || 'Hồ sơ tài khoản'}
            className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-200/70 transition-colors flex-1 min-w-0 outline-hidden ${
              isCollapsedState ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#2E37A4] text-white flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.avatarText || 'FD'}
            </div>
            {!isCollapsedState && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 truncate">{user?.name}</div>
                <div className="text-xs text-slate-600 truncate">{user?.facilityOrTitle || user?.phone}</div>
              </div>
            )}
          </Link>

          {!isCollapsedState && (
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-500/10 transition-colors shrink-0 flex items-center justify-center outline-hidden cursor-pointer"
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
      <div className="lg:hidden flex items-center justify-between px-4 h-16 bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="w-9 h-9 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 flex items-center justify-center cursor-pointer outline-hidden shrink-0"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <Link
            href="/"
            className="h-9 w-[132px] flex items-center shrink-0 outline-hidden"
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
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 hover:text-[#2E37A4] hover:bg-slate-200/70 transition-colors relative outline-hidden"
            aria-label="Thông báo hệ thống"
            title="Trung tâm thông báo đa kênh"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </Link>

          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-[#2E37A4] text-white flex items-center justify-center font-semibold text-xs outline-hidden"
            aria-label="Hồ sơ tài khoản & Cài đặt"
          >
            {user?.avatarText || 'FD'}
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Điều hướng chính trên điện thoại"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(15,23,42,0.05)] px-1.5 py-1"
      >
        <div
          className={`grid items-center ${
            hasOverflowMobileTabs || primaryMobileTabs.length === 5
              ? 'grid-cols-5'
              : 'grid-cols-4'
          }`}
        >
          {primaryMobileTabs.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors outline-hidden ${
                  isActive
                    ? 'text-[#2E37A4] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-medium'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#2E37A4]" />
                )}
                <span
                  className={`material-symbols-outlined text-[20px] leading-none ${
                    isActive ? 'text-[#2E37A4]' : 'text-slate-600'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-xs mt-1 leading-tight truncate max-w-full">
                  {item.shortLabel || item.label}
                </span>
              </Link>
            );
          })}

          {hasOverflowMobileTabs && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors cursor-pointer outline-hidden ${
                mobileMenuOpen || isOverflowTabActive
                  ? 'text-[#2E37A4] font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 font-medium'
              }`}
            >
              {(mobileMenuOpen || isOverflowTabActive) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#2E37A4]" />
              )}
              <span
                className={`material-symbols-outlined text-[20px] leading-none ${
                  mobileMenuOpen || isOverflowTabActive ? 'text-[#2E37A4]' : 'text-slate-600'
                }`}
              >
                apps
              </span>
              <span className="text-xs mt-1 leading-tight truncate">Thêm</span>
            </button>
          )}
        </div>
      </nav>

      {/* Desktop Sidenav: Thu gọn ban đầu (w-20), hover vào thì mở rộng (w-64) */}
      <aside
        className="hidden lg:block shrink-0 w-20 relative sticky top-0 h-screen z-40"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setClinicDropdownOpen(false);
        }}
      >
        <div
          className={`h-full absolute top-0 left-0 bg-white transition-all duration-300 ease-in-out border-r border-slate-200/90 overflow-hidden ${
            isHovered ? 'w-64 shadow-xl z-40' : 'w-20 shadow-xs'
          }`}
        >
          {renderSidebar(!isHovered)}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full shadow-xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebar(false)}
          </div>
        </div>
      )}
    </>
  );
}
