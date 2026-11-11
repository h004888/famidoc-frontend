'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export type NotificationCategory = 'vitals' | 'appointment' | 'medication' | 'billing';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  categoryLabel: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  linkHref: string;
  linkLabel: string;
  isUrgent?: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    category: 'vitals',
    categoryLabel: 'Cảnh báo sức khỏe',
    title: 'Huyết áp của Ông Nguyễn Văn Phúc hơi cao (135/85 mmHg)',
    message:
      'Số đo sáng nay cao hơn ngưỡng mục tiêu. Gia đình nhắc Ông uống thuốc huyết áp đúng giờ và đo lại sau 30 phút nghỉ ngơi.',
    timestamp: '15 phút trước',
    isRead: false,
    linkHref: '/family/members/mem-01',
    linkLabel: 'Xem sổ sức khỏe',
    isUrgent: true,
  },
  {
    id: 'NOTIF-02',
    category: 'appointment',
    categoryLabel: 'Lịch hẹn khám',
    title: 'Xác nhận lịch Bác sĩ khám tại nhà (09:30 • 27/10/2026)',
    message:
      'PGS.TS Nguyễn Trọng Nghĩa sẽ đến khám định kỳ và đo điện tim tại nhà cho Ông Nguyễn Văn Phúc.',
    timestamp: '1 giờ trước',
    isRead: false,
    linkHref: '/family/appointments',
    linkLabel: 'Xem lịch hẹn',
  },
  {
    id: 'NOTIF-03',
    category: 'medication',
    categoryLabel: 'Nhắc dùng thuốc',
    title: 'Đã cập nhật đơn thuốc mới cho Ông Nguyễn Văn Phúc',
    message:
      'Bác sĩ phụ trách đã kê đơn thuốc điều trị huyết áp và đường huyết tháng 10 vào hồ sơ sức khỏe gia đình.',
    timestamp: '3 giờ trước',
    isRead: false,
    linkHref: '/family/members/mem-01',
    linkLabel: 'Xem lịch thuốc',
  },
  {
    id: 'NOTIF-04',
    category: 'billing',
    categoryLabel: 'Thanh toán & Biên lai',
    title: 'Đã phát hành biên lai điện tử gói Xét nghiệm tại nhà',
    message:
      'Khoản thanh toán 850.000 đ qua VietQR đã hoàn tất. Bạn có thể tải biên lai PDF bất kỳ lúc nào.',
    timestamp: 'Hôm qua, 18:30',
    isRead: true,
    linkHref: '/family/billing',
    linkLabel: 'Xem biên lai',
  },
  {
    id: 'NOTIF-05',
    category: 'appointment',
    categoryLabel: 'Lịch hẹn khám',
    title: 'Hoàn tất buổi tư vấn Video cho Con Nguyễn Minh Quân',
    message:
      'BS.CKII Trần Mai Phương đã gửi lời dặn chăm sóc hô hấp và đơn thuốc xịt mũi vào hồ sơ của bé.',
    timestamp: '2 ngày trước',
    isRead: true,
    linkHref: '/family/members/mem-03',
    linkLabel: 'Xem hồ sơ bé',
  },
];

export function NotificationsView() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'unread' | NotificationCategory
  >('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !item.isRead;
    return item.category === activeFilter;
  });

  const getCategoryStyle = (category: NotificationCategory, isUrgent?: boolean) => {
    if (isUrgent || category === 'vitals') {
      return {
        icon: 'vital_signs',
        badgeBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
        tagText: 'text-rose-700 bg-rose-50',
      };
    }
    if (category === 'appointment') {
      return {
        icon: 'calendar_month',
        badgeBg: 'bg-blue-50 text-[#2E37A4] border-blue-200/80',
        tagText: 'text-[#2E37A4] bg-blue-50',
      };
    }
    if (category === 'medication') {
      return {
        icon: 'medication',
        badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
        tagText: 'text-emerald-700 bg-emerald-50',
      };
    }
    return {
      icon: 'receipt_long',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      tagText: 'text-amber-800 bg-amber-50',
    };
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-5">
        {/* 1. HEADER THÔNG BÁO GIA ĐÌNH (GỌN GÀNG, DỄ HIỂU) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#2E37A4] text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[24px]">
                notifications_active
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Thông Báo Gia Đình
                </h1>
                {unreadCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 tabular-nums">
                    {unreadCount} tin chưa đọc
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đã xem tất cả
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500">
                Cập nhật cảnh báo chỉ số sức khỏe, lịch hẹn bác sĩ, đơn thuốc và biên lai của gia
                đình
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[17px] text-[#2E37A4]">
                done_all
              </span>
              <span>Đọc tất cả</span>
            </button>

            <Link
              href="/settings"
              className="px-3.5 py-2.5 bg-blue-50/80 hover:bg-blue-100 text-[#2E37A4] border border-blue-200/80 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
              <span>Cài đặt</span>
            </Link>
          </div>
        </div>

        {/* 2. KHUNG DANH SÁCH THÔNG BÁO PHẲNG (GỘP THANH LỌC VÀ DANH SÁCH VÀO 1 MẶT PHẲNG) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Thanh lọc gọn trên đầu danh sách */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: `Tất cả (${notifications.length})` },
                { id: 'unread', label: `Chưa đọc (${unreadCount})` },
                { id: 'vitals', label: 'Sức khỏe' },
                { id: 'appointment', label: 'Lịch khám' },
                { id: 'medication', label: 'Đơn thuốc' },
                { id: 'billing', label: 'Thanh toán' },
              ].map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2E37A4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-slate-400 hidden md:inline shrink-0">
              Bấm vào thông báo để đánh dấu đã đọc
            </span>
          </div>

          {/* Danh sách thông báo ngăn cách bằng đường kẻ mảnh (Không dùng nhiều hộp rời rạc) */}
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">
                  notifications_off
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Không có thông báo nào trong mục này
              </h3>
              <p className="text-xs text-slate-400">
                Khi có lịch khám hoặc cập nhật sức khỏe mới, hệ thống sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((item) => {
                const style = getCategoryStyle(item.category, item.isUrgent);

                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-4 sm:px-6 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                      !item.isRead
                        ? 'bg-blue-50/25 hover:bg-blue-50/40'
                        : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Bên trái: Icon + Nội dung */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${style.badgeBg}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {style.icon}
                        </span>
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        {/* Dòng nhãn loại & thời gian */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold ${style.tagText}`}
                          >
                            {item.categoryLabel}
                          </span>
                          <span className="text-slate-400 font-medium">
                            • {item.timestamp}
                          </span>
                          {!item.isRead && (
                            <span className="inline-flex items-center gap-1 text-[#2E37A4] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2E37A4]" />
                              Mới
                            </span>
                          )}
                        </div>

                        {/* Tiêu đề thông báo */}
                        <h3
                          className={`text-sm leading-snug ${
                            !item.isRead
                              ? 'font-bold text-slate-900'
                              : 'font-semibold text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h3>

                        {/* Nội dung chi tiết */}
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {/* Bên phải: Nút chuyển trang & Nút xóa */}
                    <div className="flex items-center justify-end gap-2 shrink-0 pl-13 sm:pl-0">
                      <Link
                        href={item.linkHref}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 rounded-xl bg-slate-100/90 hover:bg-[#2E37A4] text-slate-700 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <span>{item.linkLabel}</span>
                        <span className="material-symbols-outlined text-[15px]">
                          arrow_forward
                        </span>
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Xóa thông báo"
                        aria-label="Xóa thông báo"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
