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
    badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
    items: [
      { href: '/admin', label: 'Tổng quan Nền tảng', icon: 'monitoring', exact: true, badge: 'Live', badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      { href: '/admin/packages', label: 'Quản trị Gói dịch vụ', icon: 'inventory_2' },
      { href: '/admin/contracts', label: 'Hợp đồng & Pháp lý', icon: 'handshake' },
      { href: '/admin/disputes', label: 'Trọng tài & Tranh chấp', icon: 'gavel', badge: '3', badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200' },
      { href: '/admin/users', label: 'Tài khoản, RBAC & Audit', icon: 'shield_person' },
    ],
  },
  FACILITY: {
    title: 'Phân Hệ Cơ Sở Y Tế',
    badge: 'Bệnh viện / Phòng khám',
    badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    items: [
      { href: '/facility', label: 'Tổng quan Cơ sở', icon: 'local_hospital', exact: true, badge: 'Live Queue', badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      { href: '/facility/staff', label: 'Quản lý Nhân sự Y tế', icon: 'badge' },
      { href: '/facility/coordination', label: 'Điều phối & Chuyển viện', icon: 'support_agent', badge: 'Hot', badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200' },
      { href: '/facility/revenue', label: 'Đối soát Doanh thu B2B', icon: 'payments' },
    ],
  },
  DOCTOR: {
    title: 'Phân Hệ Bác Sĩ Gia Đình',
    badge: 'Bác sĩ CCHN',
    badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    items: [
      { href: '/doctor', label: 'Bảng Lâm sàng', icon: 'dashboard', exact: true, badge: '12 Ca', badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
      { href: '/doctor/timetable', label: 'Lịch trực & Panel Cap', icon: 'calendar_clock' },
      { href: '/doctor/encounters', label: 'Khám SOAP & Kê đơn', icon: 'clinical_notes' },
      { href: '/doctor/telemedicine', label: 'Tư vấn WebRTC 24/7', icon: 'videocam', badge: 'HD', badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
      { href: '/doctor/verification', label: 'Xác thực CCHN Y tế', icon: 'verified_user' },
    ],
  },
  FAMILY: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Hồ sơ & Timeline EHR', icon: 'person_search' },
      { href: '/family/appointments', label: 'Đặt lịch Home & Tele', icon: 'event_available', badge: '1 Sắp tới', badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo IoT', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & HĐ 4 Bên', icon: 'history_edu' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', icon: 'receipt_long' },
    ],
  },
  PATIENT: {
    title: 'Phân Hệ Đại Diện Hộ Gia Đình',
    badge: 'Hộ Gia đình',
    badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    items: [
      { href: '/family', label: 'Bảng Sức khỏe Gia đình', icon: 'family_restroom', exact: true },
      { href: '/family/members', label: 'Hồ sơ & Timeline EHR', icon: 'person_search' },
      { href: '/family/appointments', label: 'Đặt lịch Home & Tele', icon: 'event_available', badge: '1 Sắp tới', badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200' },
      { href: '/family/vitals', label: 'Chỉ số & Cảnh báo IoT', icon: 'ecg_heart' },
      { href: '/family/subscription', label: 'Gói Chăm sóc & HĐ 4 Bên', icon: 'history_edu' },
      { href: '/family/billing', label: 'Thanh toán VietQR & Biên lai', icon: 'receipt_long' },
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
      {/* Brand Header: Không có nút mũi tên, căn giữa logo khi thu nhỏ */}
      <div
        className={`flex items-center h-16 border-b border-slate-100 shrink-0 bg-white transition-all ${
          isCollapsedState ? 'justify-center px-2' : 'justify-start px-4'
        }`}
      >
        <Link href="/" className="flex items-center group overflow-hidden" title="Trang chủ FamiDoc">
          {isCollapsedState ? (
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/images/logo_khong_chu.png"
                alt="FamiDoc Icon"
                className="w-full h-full object-contain transition-transform group-hover:scale-105"
              />
            </div>
          ) : (
            <div className="flex items-center">
              <img
                src="/images/FamiDoc Healthcare Logo.png"
                alt="FamiDoc Logo"
                className="h-11 w-auto max-w-[175px] object-contain transition-transform group-hover:scale-105"
              />
            </div>
          )}
        </Link>
      </div>

      {/* Preclinic Clinic Switcher Dropdown */}
      {!isCollapsedState ? (
        <div className="p-3 border-b border-slate-100 relative bg-white">
          <button
            onClick={() => setClinicDropdownOpen(!clinicDropdownOpen)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#2E37A4]/10 border border-[#2E37A4]/20 flex items-center justify-center text-[#2E37A4] shrink-0">
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-[#2E37A4] transition-colors">
                  {selectedClinic.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {selectedClinic.address}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-slate-600 shrink-0">
              {clinicDropdownOpen ? 'expand_less' : 'unfold_more'}
            </span>
          </button>

          {/* Clinic Dropdown Menu */}
          {clinicDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Chuyển Cơ Sở Y Tế Phụ Trách
              </div>
              {CLINIC_LIST.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => {
                    setSelectedClinic(clinic);
                    setClinicDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                    selectedClinic.id === clinic.id
                      ? 'bg-[#2E37A4] text-white font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold truncate">{clinic.name}</div>
                    <div className="text-[10px] opacity-75">{clinic.address} • {clinic.type}</div>
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

      {/* Role Badge Indicator */}
      {!isCollapsedState ? (
        <div className="px-3 pt-3 pb-1">
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">verified_user</span>
              {currentMenu.title}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${currentMenu.badgeColor}`}>
              {currentMenu.badge}
            </span>
          </div>
        </div>
      ) : (
        <div className="py-2.5 flex justify-center border-b border-slate-100 text-[#2E37A4]">
          <span className="material-symbols-outlined text-[18px]" title={currentMenu.title}>verified_user</span>
        </div>
      )}

      {/* Nav Items List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="space-y-1">
          {!isCollapsedState && (
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Nghiệp Vụ Chính
            </div>
          )}

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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group ${
                    isActive
                      ? 'bg-[#2E37A4] text-white font-bold shadow-sm shadow-[#2E37A4]/25 ring-1 ring-[#2E37A4]'
                      : 'text-slate-600 hover:text-[#2E37A4] hover:bg-slate-50 hover:pl-3.5'
                  } ${isCollapsedState ? 'justify-center px-2 hover:pl-2' : ''}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 group-hover:text-[#2E37A4]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsedState && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsedState && item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeColor || 'bg-slate-100 text-slate-600 group-hover:bg-[#2E37A4]/10 group-hover:text-[#2E37A4]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Global Settings & Utilities */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          {!isCollapsedState && (
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hệ Thống &amp; Tiện Ích
            </div>
          )}
          <Link
            href="/packages"
            onClick={() => setMobileMenuOpen(false)}
            title={isCollapsedState ? 'Danh mục Gói Dịch vụ' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group ${
              pathname === '/packages'
                ? 'bg-[#2E37A4] text-white font-bold shadow-sm shadow-[#2E37A4]/25 ring-1 ring-[#2E37A4]'
                : 'text-slate-600 hover:text-[#2E37A4] hover:bg-slate-50 hover:pl-3.5'
            } ${isCollapsedState ? 'justify-center px-2 hover:pl-2' : ''}`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                pathname === '/packages' ? 'text-white' : 'text-slate-400 group-hover:text-[#2E37A4]'
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all group ${
              pathname === '/settings'
                ? 'bg-[#2E37A4] text-white font-bold shadow-sm shadow-[#2E37A4]/25 ring-1 ring-[#2E37A4]'
                : 'text-slate-600 hover:text-[#2E37A4] hover:bg-slate-50 hover:pl-3.5'
            } ${isCollapsedState ? 'justify-center px-2 hover:pl-2' : ''}`}
          >
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                pathname === '/settings' ? 'text-white' : 'text-slate-400 group-hover:text-[#2E37A4]'
              }`}
            >
              settings
            </span>
            {!isCollapsedState && <span>Cài đặt &amp; Hồ sơ BHYT</span>}
          </Link>
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 shrink-0 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/settings"
            title={user?.name}
            className={`flex items-center gap-2.5 p-1 rounded-xl hover:bg-white border border-transparent hover:border-slate-200/80 transition-all flex-1 min-w-0 ${
              isCollapsedState ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#2E37A4]/20 shrink-0">
              {user?.avatarText || 'FD'}
            </div>
            {!isCollapsedState && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.facilityOrTitle || user?.phone}</div>
              </div>
            )}
          </Link>

          {!isCollapsedState && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 flex items-center gap-1"
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
      <div className="lg:hidden flex items-center justify-between px-4 h-16 bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Mở menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <Link href="/" className="flex items-center">
          <img
            src="/images/FamiDoc Healthcare Logo.png"
            alt="FamiDoc Logo"
            className="h-9 w-auto max-w-[140px] object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-[#2E37A4] text-white flex items-center justify-center font-bold text-xs"
          >
            {user?.avatarText || 'FD'}
          </Link>
        </div>
      </div>

      {/* Desktop Sidenav: Thu gọn ban đầu (w-20), hover vào thì mở rộng (w-64) mượt mà */}
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
            isHovered ? 'w-64 shadow-2xl z-40' : 'w-20 shadow-xs'
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
            className="w-72 max-w-[85vw] h-full shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebar(false)}
          </div>
        </div>
      )}
    </>
  );
}
