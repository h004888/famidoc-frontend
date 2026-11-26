'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/context/auth-context';
import { getNotificationAction, getNotificationTime, markFamilyNotificationsRead, useFamilyNotificationOwner, useFamilyNotifications } from '@/features/notifications/hooks/use-family-notifications';
import {
  getFacilityNotificationAction,
  getFacilityNotificationTime,
  markFacilityNotificationsRead,
  useFacilityNotificationOwner,
  useFacilityNotifications,
} from '@/features/notifications/hooks/use-facility-notifications';
import {
  getDoctorNotificationAction,
  getDoctorNotificationTime,
  markDoctorNotificationsRead,
  useDoctorNotificationOwner,
  useDoctorNotifications,
} from '@/features/notifications/hooks/use-doctor-notifications';

export interface TopbarNotificationItem {
  id: string;
  type: 'PAYMENT_ERROR' | 'DISPUTE' | 'GENERAL';
  typeLabel: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionHref: string;
  actionLabel: string;
  icon: string;
  badgeClass: string;
}

const ADMIN_TOPBAR_NOTIFICATIONS: TopbarNotificationItem[] = [
  {
    id: 'ADMIN-NOTIF-01',
    type: 'PAYMENT_ERROR',
    typeLabel: 'Đơn thanh toán lỗi (Gia đình)',
    title: 'Lỗi đối soát thanh toán VietQR - Hộ FAM-88219',
    message: 'Gia đình Nguyễn Văn An chuyển khoản sai cú pháp nội dung gói khám 6 tháng. Cần đối soát thủ công để kích hoạt.',
    timestamp: '10 phút trước',
    isRead: false,
    actionHref: '/admin/reconciliation',
    actionLabel: 'Xử lý đối soát',
    icon: 'receipt_long',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'ADMIN-NOTIF-02',
    type: 'DISPUTE',
    typeLabel: 'Khiếu nại tranh chấp (Gia đình - Bác sĩ)',
    title: 'Khiếu nại tranh chấp buổi khám - Hộ FAM-042 & BS Trần Mai Phương',
    message: 'Gia đình phản ánh bác sĩ đến muộn 45 phút và không đo điện tim theo thỏa thuận gói. Cần thụ lý xác minh.',
    timestamp: '35 phút trước',
    isRead: false,
    actionHref: '/admin/disputes',
    actionLabel: 'Thụ lý khiếu nại',
    icon: 'gavel',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

const GENERAL_TOPBAR_NOTIFICATIONS: TopbarNotificationItem[] = [
  {
    id: 'GEN-NOTIF-01',
    type: 'GENERAL',
    typeLabel: 'Lịch khám',
    title: 'Xác nhận lịch bác sĩ khám tại nhà',
    message: 'Bác sĩ phụ trách gia đình sẽ đến khám định kỳ vào lúc 09:30 ngày mai.',
    timestamp: '1 giờ trước',
    isRead: false,
    actionHref: '/family/appointments',
    actionLabel: 'Xem lịch hẹn',
    icon: 'calendar_month',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

export function DashboardTopbarNotifications() {
  const { role } = useAuth();
  const familyOwner = useFamilyNotificationOwner();
  const familyNotifications = useFamilyNotifications(familyOwner, 1, 8);
  const facilityOwner = useFacilityNotificationOwner();
  const facilityNotifications = useFacilityNotifications(facilityOwner, 1, 8);
  const doctorOwner = useDoctorNotificationOwner();
  const doctorNotifications = useDoctorNotifications(doctorOwner, 1, 8);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<TopbarNotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    setMounted(true);
    setNotifications(isAdmin ? ADMIN_TOPBAR_NOTIFICATIONS : GENERAL_TOPBAR_NOTIFICATIONS);
  }, [isAdmin]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const visibleNotifications = familyOwner
    ? (familyNotifications.data?.items ?? []).map((item): TopbarNotificationItem => {
        const action = getNotificationAction(item);
        return {
          id: item.id,
          type: 'GENERAL',
          typeLabel: action?.type ?? 'Cập nhật',
          title: item.title,
          message: item.content,
          timestamp: getNotificationTime(item),
          isRead: item.isRead,
          actionHref: action?.href ?? '/notifications',
          actionLabel: action?.label ?? 'Xem thông báo',
          icon: action?.icon ?? 'notifications',
          badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        };
      })
    : facilityOwner
      ? (facilityNotifications.data?.items ?? []).map((item): TopbarNotificationItem => {
          const action = getFacilityNotificationAction(item);
          return {
            id: item.id,
            type: 'GENERAL',
            typeLabel: action.type,
            title: item.title,
            message: item.content,
            timestamp: getFacilityNotificationTime(item),
            isRead: item.isRead,
            actionHref: action.href,
            actionLabel: action.label,
            icon: action.icon,
            badgeClass: 'bg-blue-50 text-primary border-blue-200',
          };
        })
      : doctorOwner
        ? (doctorNotifications.data?.items ?? []).map((item): TopbarNotificationItem => {
            const action = getDoctorNotificationAction(item);
            return {
              id: item.id,
              type: 'GENERAL',
              typeLabel: action.type,
              title: item.title,
              message: item.content,
              timestamp: getDoctorNotificationTime(item),
              isRead: item.isRead,
              actionHref: action.href,
              actionLabel: action.label,
              icon: action.icon,
              badgeClass:
                item.type === 'ENCOUNTER_RECORD_OVERDUE'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200',
            };
          })
        : notifications;
  const unreadCount = familyOwner
    ? familyNotifications.data?.unreadCount ?? 0
    : facilityOwner
      ? facilityNotifications.data?.unreadCount ?? 0
      : doctorOwner
        ? doctorNotifications.data?.unreadCount ?? 0
        : notifications.filter((n) => !n.isRead).length;
  const hasVisibleUnread = visibleNotifications.some((item) => !item.isRead);

  function markFamilyRead(ids: string[]) {
    void markFamilyNotificationsRead(ids).catch((error: Error) => toast.error(error.message));
  }

  function markFacilityRead(ids: string[]) {
    void markFacilityNotificationsRead(ids).catch((error: Error) => toast.error(error.message));
  }

  function markDoctorRead(ids: string[]) {
    void markDoctorNotificationsRead(ids).catch((error: Error) => toast.error(error.message));
  }

  const markAllAsRead = () => {
    if (familyOwner) {
      markFamilyRead(visibleNotifications.filter((item) => !item.isRead).map((item) => item.id));
      return;
    }
    if (facilityOwner) {
      markFacilityRead(visibleNotifications.filter((item) => !item.isRead).map((item) => item.id));
      return;
    }
    if (doctorOwner) {
      markDoctorRead(visibleNotifications.filter((item) => !item.isRead).map((item) => item.id));
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markItemAsRead = (id: string) => {
    if (familyOwner) {
      if (visibleNotifications.some((item) => item.id === id && !item.isRead)) markFamilyRead([id]);
      return;
    }
    if (facilityOwner) {
      if (visibleNotifications.some((item) => item.id === id && !item.isRead)) markFacilityRead([id]);
      return;
    }
    if (doctorOwner) {
      if (visibleNotifications.some((item) => item.id === id && !item.isRead)) markDoctorRead([id]);
      return;
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          if (familyOwner && !isOpen) familyNotifications.reload();
          if (facilityOwner && !isOpen) facilityNotifications.reload();
          if (doctorOwner && !isOpen) doctorNotifications.reload();
          setIsOpen(!isOpen);
        }}
        aria-label={
          mounted && unreadCount > 0
            ? `Thông báo hệ thống (${unreadCount} chưa đọc)`
            : 'Thông báo hệ thống'
        }
        title="Thông báo hệ thống"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {mounted && unreadCount > 0 && (
          <span
            data-testid="notification-unread-badge"
            className="absolute -top-1 -right-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white tabular-nums"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Danh sách thông báo"
          className="absolute right-0 z-50 mt-2 w-[min(21rem,calc(100vw-4.5rem))] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10 sm:w-96"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#0046c0]">
                {isAdmin ? 'admin_panel_settings' : 'notifications'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {isAdmin
                  ? 'Thông báo Quản trị viên'
                  : facilityOwner
                    ? 'Thông báo Cơ sở Y tế'
                    : doctorOwner
                      ? 'Thông báo Bác sĩ'
                      : 'Thông báo hệ thống'}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 tabular-nums">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {hasVisibleUnread && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-slate-500 hover:text-[#0046c0] transition-colors cursor-pointer"
              >
                {familyOwner || facilityOwner || doctorOwner ? 'Đọc các tin này' : 'Đọc tất cả'}
              </button>
            )}
          </div>

          {/* Subtitle mô tả phạm vi tiếp nhận cho Admin */}
          {isAdmin && (
            <div className="px-3.5 py-2 bg-blue-50/60 border-b border-blue-100 text-[11px] text-slate-600 leading-tight">
              Tiếp nhận: <strong>(1) Đơn thanh toán lỗi gia đình</strong> &amp; <strong>(2) Đơn khiếu nại tranh chấp gia đình - bác sĩ</strong>.
            </div>
          )}

          {/* Danh sách thông báo */}
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {familyOwner && familyNotifications.error
                  ? familyNotifications.error
                  : familyOwner && !familyNotifications.data
                    ? 'Đang tải thông báo…'
                    : facilityOwner && facilityNotifications.error
                      ? facilityNotifications.error
                      : facilityOwner && !facilityNotifications.data
                        ? 'Đang tải thông báo…'
                        : 'Không có thông báo mới.'}
              </div>
            ) : (
              visibleNotifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 transition-colors hover:bg-slate-50/80 ${
                    !item.isRead ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${item.badgeClass}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {item.icon}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeClass}`}
                        >
                          {item.typeLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 leading-snug">
                        {item.title}
                      </p>

                      <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>

                      <div className="pt-1.5 flex items-center justify-between">
                        <Link
                          href={item.actionHref}
                          onClick={() => {
                            markItemAsRead(item.id);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0046c0] hover:text-[#0037c1] hover:underline"
                        >
                          <span>{item.actionLabel}</span>
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_forward
                          </span>
                        </Link>

                        {!item.isRead && (
                          <button
                            type="button"
                            onClick={() => markItemAsRead(item.id)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#0046c0] hover:text-[#0037c1] inline-flex items-center gap-1"
            >
              <span>Xem tất cả tại Trung tâm thông báo</span>
              <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
