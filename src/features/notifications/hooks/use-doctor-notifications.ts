'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { unwrapApiEnvelope } from '@/lib/api/envelope';
import { httpClient } from '@/lib/api/http-client';

export interface DoctorNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPage {
  items: DoctorNotification[];
  total: number;
  unreadCount: number;
}

const refreshEvent = 'famidoc:doctor-notifications-refresh';
const endpoint = '/api/v1/notifications';
const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function getDoctorNotificationTime(item: DoctorNotification) {
  return timeFormatter.format(new Date(item.createdAt));
}

export function getDoctorNotificationAction(item: DoctorNotification) {
  if (item.type.startsWith('ENCOUNTER_')) {
    if (item.referenceId) {
      return {
        href: `/doctor/encounters?encounterId=${encodeURIComponent(item.referenceId)}`,
        label: 'Mở ca khám',
        icon: 'clinical_notes',
        type:
          item.type === 'ENCOUNTER_RECORD_OVERDUE'
            ? 'Quá hạn hồ sơ'
            : item.type === 'ENCOUNTER_RECORD_DUE_SOON'
              ? 'Nhắc hạn hồ sơ'
              : 'Ca khám',
      };
    }
    return {
      href: '/doctor/timetable',
      label: 'Xem lịch trực',
      icon: 'calendar_month',
      type: 'Lịch khám',
    };
  }
  if (item.type.startsWith('RESCHEDULE_')) {
    return {
      href: '/doctor/timetable',
      label: 'Xem yêu cầu đổi lịch',
      icon: 'event_repeat',
      type: 'Đổi lịch',
    };
  }
  return {
    href: '/notifications',
    label: 'Xem thông báo',
    icon: 'notifications',
    type: 'Thông báo',
  };
}

export function useDoctorNotificationOwner() {
  const { user, role, isAuthenticated } = useAuth();
  return isAuthenticated && role === 'DOCTOR' ? user?.id : undefined;
}

export function useDoctorNotifications(
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
          },
          { signal: request.signal, cache: 'no-store' },
        )
        .then(
          (response) => {
            if (!request.signal.aborted) {
              setResult({
                key,
                data: unwrapApiEnvelope<NotificationPage>(response),
              });
            }
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

export async function markDoctorNotificationsRead(ids: string[]) {
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
