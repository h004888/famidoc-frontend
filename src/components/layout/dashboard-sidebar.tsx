'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  badge?: string;
  badgeColor?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Ban Quản Trị (Admin)',
    badge: 'Admin',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    items: [
      { href: '/admin', label: 'Tổng quan Nền tảng', icon: 'monitoring', exact: true },
      { href: '/admin/packages', label: 'Quản trị Gói dịch vụ', icon: 'inventory_2' },
      { href: '/admin/contracts', label: 'Hợp đồng & Pháp lý', icon: 'handshake' },
      { href: '/admin/disputes', label: 'Trọng tài & Tranh chấp', icon: 'gavel' },
      { href: '/admin/users', label: 'Tài khoản, RBAC & Audit', icon: 'shield_person' },
    ],
  },
  {
    title: 'Cơ Sở Y Tế Đối Tác',
    badge: 'Bệnh viện',
    badgeColor: 'bg-blue-100 text-blue-800',
    items: [
      { href: '/facility', label: 'Tổng quan Cơ sở', icon: 'local_hospital', exact: true },
      { href: '/facility/staff', label: 'Quản lý Nhân sự Y tế', icon: 'badge' },
      { href: '/facility/coordination', label: 'Điều phối & Khiếu nại', icon: 'support_agent' },
      { href: '/facility/revenue', label: 'Đối soát Doanh thu B2B', icon: 'payments' },
    ],
  },
  {
    title: 'Bác Sĩ Thực Hành',
    badge: 'Doctor',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    items: [
      { href: '/doctor', label: 'Bảng Lâm sàng', icon: 'dashboard', exact: true },
      { href: '/doctor/timetable', label: 'Lịch trực & Panel Cap', icon: 'calendar_clock' },
      { href: '/doctor/encounters', label: 'Khám SOAP & Kê đơn', icon: 'clinical_notes' },
      { href: '/doctor/telemedicine', label: 'Tư vấn WebRTC 24/7', icon: 'videocam' },
      { href: '/doctor/verification', label: 'Xác thực CCHN Y tế', icon: 'verified_user' },
    ],
  },
  {
    title: 'Đại Diện Hộ Gia Đình',
    badge: 'Gia đình',
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
];

export function DashboardSidebar() {
  const pathname = usePathname() || '/family';
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Xác định phân hệ hiện tại để highlight
  const currentSection = pathname.startsWith('/admin')
    ? 'Ban Quản Trị (Admin)'
    : pathname.startsWith('/facility')
    ? 'Cơ Sở Y Tế Đối Tác'
    : pathname.startsWith('/doctor')
    ? 'Bác Sĩ Thực Hành'
    : 'Đại Diện Hộ Gia Đình';

  const [expandedSection, setExpandedSection] = useState<string>(currentSection);

  const toggleSection = (title: string) => {
    setExpandedSection(prev => (prev === title ? '' : title));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-900/50">
            F
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                FamiDoc<span className="text-amber-400">.Pro</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Y tế Gia đình Toàn diện
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav List with Custom Scrollbar */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {NAV_SECTIONS.map((section) => {
          const isSectionOpen = expandedSection === section.title;
          const hasActiveChild = section.items.some(item =>
            item.exact ? pathname === item.href : pathname.startsWith(item.href)
          );

          return (
            <div key={section.title} className="space-y-1">
              {/* Section Header (when not collapsed) */}
              {!isCollapsed ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={hasActiveChild ? 'text-amber-400' : ''}>{section.title}</span>
                    {section.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${section.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 text-slate-500 group-hover:text-slate-300 ${isSectionOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              ) : (
                <div className="h-px bg-slate-800 my-2 mx-1" title={section.title} />
              )}

              {/* Items in section */}
              {(!isCollapsed ? isSectionOpen || hasActiveChild : true) && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40 ring-1 ring-blue-500'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <span className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Global Settings link */}
        <div className="pt-2 border-t border-slate-800 space-y-1">
          <Link
            href="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              pathname === '/settings'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            {!isCollapsed && <span>Cài đặt &amp; Bảo mật</span>}
          </Link>
        </div>
      </div>

      {/* User Footer Profile in Sidebar */}
      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/40">
        <Link
          href="/settings"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30 shrink-0">
            FD
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">Ban Quản Trị Y Tế</div>
              <div className="text-[10px] text-slate-400 truncate">famidoc.pro@admin</div>
            </div>
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar (hamburger) */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          aria-label="Mở menu"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
            F
          </div>
          <span className="font-bold text-sm text-white">FamiDoc<span className="text-amber-400">.Pro</span></span>
        </Link>

        <Link href="/settings" className="p-2 text-slate-300 hover:text-white">
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
        </Link>
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
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

