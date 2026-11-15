'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc.');
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Đã xóa thông báo.');
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
        badgeBg: 'bg-blue-50 text-primary border-blue-200/80',
        tagText: 'text-primary bg-blue-50',
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
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <Card className="rounded-2xl border-slate-200/80 bg-white py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] sm:py-6">
          <CardContent className="flex flex-col justify-between gap-4 px-5 sm:flex-row sm:items-center sm:px-6">
            <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                <span className="material-symbols-outlined text-[24px]">
                  notifications_active
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Thông Báo Gia Đình
                  </h1>
                  {unreadCount > 0 ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 tabular-nums"
                    >
                      {unreadCount} tin chưa đọc
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700"
                    >
                      Đã xem tất cả
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Cập nhật cảnh báo chỉ số sức khỏe, lịch hẹn bác sĩ, đơn thuốc và biên lai của gia đình
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="h-9 cursor-pointer rounded-xl border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[17px] text-primary">
                  done_all
                </span>
                <span>Đọc tất cả</span>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-blue-200/80 bg-blue-50/80 px-3.5 text-xs font-bold text-primary hover:bg-blue-100"
              >
                <Link href="/settings">
                  <span className="material-symbols-outlined text-[17px]">tune</span>
                  <span>Cài đặt</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200/80 bg-white py-0 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between gap-3 overflow-x-auto border-b border-slate-100 px-4 py-3.5 sm:px-6">
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
                  <Button
                    key={tab.id}
                    type="button"
                    size="sm"
                    variant={isActive ? 'default' : 'ghost'}
                    onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                    className={`h-8 cursor-pointer rounded-xl px-3 text-xs font-bold whitespace-nowrap ${
                      isActive ? 'shadow-2xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <span className="hidden shrink-0 text-xs text-slate-400 md:inline">
              Bấm vào thông báo để đánh dấu đã đọc
            </span>
          </div>

          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon="notifications_off"
              title="Không có thông báo nào trong mục này"
              description="Khi có lịch khám hoặc cập nhật sức khỏe mới, hệ thống sẽ hiển thị tại đây."
              className="rounded-none border-0 shadow-none"
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((item) => {
                const style = getCategoryStyle(item.category, item.isUrgent);

                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`flex cursor-pointer flex-col justify-between gap-4 p-4 transition-colors sm:flex-row sm:items-center sm:px-6 ${
                      !item.isRead
                        ? 'bg-blue-50/25 hover:bg-blue-50/40'
                        : 'bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.badgeBg}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {style.icon}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className={`rounded-md px-2 py-0.5 font-bold ${style.tagText}`}>
                            {item.categoryLabel}
                          </span>
                          <span className="font-medium text-slate-400">
                            • {item.timestamp}
                          </span>
                          {!item.isRead && (
                            <span className="inline-flex items-center gap-1 font-bold text-primary">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              Mới
                            </span>
                          )}
                        </div>

                        <h3
                          className={`text-sm leading-snug ${
                            !item.isRead
                              ? 'font-bold text-slate-900'
                              : 'font-semibold text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h3>

                        <p className="text-xs leading-relaxed text-slate-500">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2 pl-13 sm:pl-0">
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 rounded-xl bg-slate-100/90 px-3.5 text-xs font-bold whitespace-nowrap text-slate-700 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Link href={item.linkHref}>
                          <span>{item.linkLabel}</span>
                          <span className="material-symbols-outlined text-[15px]">
                            arrow_forward
                          </span>
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="cursor-pointer rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Xóa thông báo"
                        aria-label="Xóa thông báo"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          close
                        </span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
