'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface NotificationItem {
  id: string;
  category: 'clinical' | 'telemetry' | 'financial' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  channels: ('in_app' | 'sms' | 'zalo' | 'email')[];
  linkHref?: string;
  linkLabel?: string;
  severity?: 'info' | 'warning' | 'urgent';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    category: 'telemetry',
    title: 'Cảnh báo Chỉ số Huyết áp Vượt ngưỡng Mục tiêu',
    message: 'Thiết bị IoT Omron ghi nhận huyết áp cụ Nguyễn Văn Phúc lúc 06:45 sáng nay là 142/92 mmHg. Bác sĩ gia đình PGS.TS Nguyễn Trọng Nghĩa đã được đồng bộ thông báo tự động.',
    timestamp: '15 phút trước',
    isRead: false,
    channels: ['in_app', 'sms', 'zalo'],
    linkHref: '/family/vitals',
    linkLabel: 'Xem biểu đồ sinh tồn',
    severity: 'urgent',
  },
  {
    id: 'NOTIF-02',
    category: 'clinical',
    title: 'Bác sĩ Đã Phát hành & Ký số Đơn Thuốc Điện Tử (1NF)',
    message: 'Đơn thuốc số #RX-88219-01 đã được ký số HSM Viettel-CA và cập nhật vào Tủ thuốc gia đình. Mã tra cứu đơn thuốc quốc gia: DT-2026-88219.',
    timestamp: '1 giờ trước',
    isRead: false,
    channels: ['in_app', 'zalo'],
    linkHref: '/family/members',
    linkLabel: 'Xem đơn thuốc chi tiết',
    severity: 'info',
  },
  {
    id: 'NOTIF-03',
    category: 'financial',
    title: 'Xác nhận Quyết toán VietQR & Cấp Biên lai Kỳ hạn',
    message: 'Giao dịch 4.245.000 đ cho gói Chăm Sóc Gia Đình Toàn Diện (Kỳ 1) đã được cổng BIDV Escrow xác thực tự động qua Webhook Napas 24/7.',
    timestamp: '3 giờ trước',
    isRead: false,
    channels: ['in_app', 'sms', 'email'],
    linkHref: '/family/billing',
    linkLabel: 'Tải biên lai thanh toán',
    severity: 'info',
  },
  {
    id: 'NOTIF-04',
    category: 'clinical',
    title: 'Nhắc Lịch Thăm Khám Y Học Gia Đình Tận Nhà',
    message: 'Lịch khám định kỳ bệnh mạn tính cho cụ Nguyễn Văn Phúc dự kiến diễn ra vào Thứ Hai lúc 09:00 sáng. Bác sĩ trưởng khoa sẽ đến trực tiếp tại địa chỉ gia đình.',
    timestamp: 'Hôm qua, 18:30',
    isRead: true,
    channels: ['in_app', 'sms', 'zalo'],
    linkHref: '/family/appointments',
    linkLabel: 'Kiểm tra lịch hẹn',
    severity: 'info',
  },
  {
    id: 'NOTIF-05',
    category: 'system',
    title: 'Xác thực CCHN & Chữ Ký Số Y Tế Thành Công',
    message: 'Hệ thống đã hoàn tất liên thông kiểm tra mã chứng chỉ hành nghề CCHN-004128/BYT trên cổng cơ sở dữ liệu Bộ Y Tế Việt Nam.',
    timestamp: '2 ngày trước',
    isRead: true,
    channels: ['in_app', 'email'],
    linkHref: '/doctor/verification',
    linkLabel: 'Xem hồ sơ CCHN',
    severity: 'info',
  },
];

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

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
    const matchCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchChannel =
      selectedChannel === 'all' ||
      item.channels.includes(selectedChannel as any);
    return matchCategory && matchChannel;
  });

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Preclinic Style */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Hệ thống</span>
              <span className="text-slate-300">/</span>
              <span className="text-[#2E37A4] font-semibold">Trung tâm thông báo đa kênh</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Multi-Channel Notification Hub
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 animate-pulse">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Giám sát và điều phối luồng thông báo y tế đa kênh tự động: In-App, SMS Brandname, Zalo ZNS và Email mã hóa.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[17px] text-[#2E37A4]">done_all</span>
              <span>Đánh dấu đã đọc</span>
            </button>
            <Link
              href="/settings"
              className="px-3.5 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
              <span>Cài đặt nhận tin</span>
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Categories Tab */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'telemetry', label: 'Cảnh báo Sinh tồn IoT' },
              { id: 'clinical', label: 'Lịch khám & Đơn thuốc' },
              { id: 'financial', label: 'Thanh toán & Escrow' },
              { id: 'system', label: 'Hệ thống & CCHN' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#2E37A4] text-white font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Channels Filter Dropdown / Pills */}
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Kênh gửi:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-[#2E37A4]"
            >
              <option value="all">Mọi kênh phát tán</option>
              <option value="in_app">Ứng dụng (In-App)</option>
              <option value="sms">SMS Brandname FamiDoc</option>
              <option value="zalo">Zalo ZNS Y Tế</option>
              <option value="email">Email Thông Báo</option>
            </select>
          </div>
        </div>

        {/* Notifications Stream */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">notifications_off</span>
              </div>
              <h3 className="font-bold text-slate-800 text-base">Không có thông báo nào phù hợp</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Hiện tại không có thông báo mới trong bộ lọc đã chọn. Bạn có thể chọn danh mục khác để xem lịch sử.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 cursor-pointer relative overflow-hidden ${
                  !item.isRead
                    ? 'bg-white border-[#2E37A4]/30 shadow-[0_2px_12px_rgba(46,55,164,0.06)] ring-1 ring-[#2E37A4]/10'
                    : 'bg-white border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-300'
                }`}
              >
                {/* Active Indicator Bar */}
                {!item.isRead && (
                  <span className="absolute top-0 left-0 bottom-0 w-1 bg-[#2E37A4]"></span>
                )}

                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Category Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.category === 'telemetry'
                        ? 'bg-rose-50 text-rose-600'
                        : item.category === 'clinical'
                        ? 'bg-blue-50 text-[#2E37A4]'
                        : item.category === 'financial'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.category === 'telemetry'
                        ? 'vital_signs'
                        : item.category === 'clinical'
                        ? 'clinical_notes'
                        : item.category === 'financial'
                        ? 'payments'
                        : 'notifications'}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-bold truncate ${
                          !item.isRead ? 'text-slate-900 font-extrabold' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#2E37A4] shrink-0"></span>
                      )}
                      {item.severity === 'urgent' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Khẩn cấp
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.message}
                    </p>

                    {/* Metadata & Multi-Channels */}
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {item.timestamp}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-500">Đã phát kênh:</span>
                        {item.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono font-bold uppercase text-[9px]"
                          >
                            {ch === 'in_app' ? 'App' : ch === 'sms' ? 'SMS' : ch === 'zalo' ? 'ZNS' : 'Email'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Items */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.linkHref && (
                    <Link
                      href={item.linkHref}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-[#2E37A4]/10 text-[#2E37A4] hover:text-[#222982] rounded-xl text-xs font-bold transition-colors border border-slate-200/80 flex items-center gap-1"
                    >
                      <span>{item.linkLabel || 'Chi tiết'}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa thông báo"
                    aria-label="Xóa thông báo"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

