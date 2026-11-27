'use client';

import { useEffect, useState } from 'react';
import { isFamilyRole } from '@/components/layout/family-subscription-gate';
import { useAuth } from '@/features/auth/context/auth-context';
import { unwrapApiEnvelope } from '@/lib/api/envelope';
import { httpClient } from '@/lib/api/http-client';

export interface FamilyNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPage {
  items: FamilyNotification[];
  total: number;
  unreadCount: number;
}

export const PRESCRIPTION_NOTIFICATION = 'PRESCRIPTION_SHARED';
const refreshEvent = 'famidoc:notifications-refresh';
const endpoint = '/api/v1/notifications';
const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function getNotificationTime(item: FamilyNotification) {
  return timeFormatter.format(new Date(item.createdAt));
}

export function getNotificationAction(item: FamilyNotification) {
  const supportQuery = item.referenceId
    ? '?supportCaseId=' + encodeURIComponent(item.referenceId)
    : '';
  if (item.type === PRESCRIPTION_NOTIFICATION && item.referenceId) {
    return {
      href: `/family/prescriptions/${encodeURIComponent(item.referenceId)}`,
      label: 'Xem đơn thuốc',
      icon: 'medication',
      type: 'Đơn thuốc',
    };
  }
  // Xếp lịch tự động sau thanh toán chưa xong: referenceId là mã hợp đồng.
  if (
    item.type === 'ENCOUNTER_MANUAL_SCHEDULE_REQUIRED' ||
    item.type === 'ENCOUNTER_AUTO_SCHEDULE_FAILED' ||
    item.type === 'ENCOUNTER_AUTO_SCHEDULE_MISSING_DATA'
  ) {
    return {
      href: '/family/appointments',
      label: 'Xem lịch hẹn',
      icon: 'event_busy',
      type:
        item.type === 'ENCOUNTER_MANUAL_SCHEDULE_REQUIRED'
          ? 'Chờ bác sĩ xếp lịch'
          : item.type === 'ENCOUNTER_AUTO_SCHEDULE_FAILED'
            ? 'Xếp lịch chưa thành công'
            : 'Cần bổ sung thông tin',
    };
  }
  if (
    item.type.startsWith('ENCOUNTER_') ||
    item.type.startsWith('RESCHEDULE_')
  ) {
    return {
      href: '/family/appointments',
      label: 'Xem lịch hẹn',
      icon: 'calendar_month',
      type: 'Lịch khám',
    };
  }
  if (item.type === 'CONTRACT_EXPIRY_15D') {
    return {
      href: '/family/subscription',
      label: 'Xem hợp đồng',
      icon: 'event_note',
      type: 'Hợp đồng',
    };
  }
  if (
    item.type === 'COMPLAINT' ||
    item.type === 'SUPPORT_CASE_COMPLAINT'
  ) {
    return {
      href: '/family/feedback' + (item.type === 'SUPPORT_CASE_COMPLAINT' ? supportQuery : ''),
      label: 'Xem khiếu nại',
      icon: 'gavel',
      type: 'Khiếu nại',
    };
  }
  if (
    item.type === 'SUPPORT_CASE_PAYMENT' ||
    item.type === 'SUPPORT_CASE'
  ) {
    return {
      href: '/family/billing' + supportQuery,
      label: 'Xem hỗ trợ thanh toán',
      icon: 'payments',
      type: 'Thanh toán',
    };
  }
  return null;
}

export function useFamilyNotificationOwner() {
  const { user, role, isAuthenticated } = useAuth();
  return isAuthenticated && isFamilyRole(role) ? user?.id : undefined;
}

export function useFamilyNotifications(
  userId: string | undefined,
  page = 1,
  limit = 20,
  filter = 'all',
) {
  const key = userId ? `${userId}:${page}:${limit}:${filter}` : '';
  const [result, setResult] = useState<{
    key: string;
    data?: NotificationPage;
    error?: string;
  }>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!key) return;
    let controller: AbortController | undefined;
    const load = () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      httpClient
        .get(
          endpoint,
          {
            page,
            limit,
            unreadOnly: filter === 'unread' ? 'true' : undefined,
            type:
              filter === 'prescriptions'
                ? PRESCRIPTION_NOTIFICATION
                : undefined,
          },
          { signal: request.signal, cache: 'no-store' },
        )
        .then(
          (response) => {
            if (!request.signal.aborted)
              setResult({
                key,
                data: unwrapApiEnvelope<NotificationPage>(response),
              });
          },
          () => {
            if (!request.signal.aborted) {
              setResult((current) => ({
                key,
                data: current?.key === key ? current.data : undefined,
                error: 'Chưa tải được thông báo.',
              }));
            }
          },
        );
    };
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30_000);
    window.addEventListener('focus', load);
    window.addEventListener(refreshEvent, load);
    return () => {
      controller?.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', load);
      window.removeEventListener(refreshEvent, load);
    };
  }, [filter, key, limit, page, version]);

  const visible = result?.key === key ? result : undefined;
  return { ...visible, reload: () => setVersion((value) => value + 1) };
}

export async function markFamilyNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  const outcomes = await Promise.allSettled(
    ids.map((id) =>
      httpClient.patch(`${endpoint}/${encodeURIComponent(id)}/read`),
    ),
  );
  window.dispatchEvent(new Event(refreshEvent));
  if (outcomes.some((outcome) => outcome.status === 'rejected')) {
    throw new Error('Chưa đánh dấu được một số thông báo. Vui lòng thử lại.');
  }
}
