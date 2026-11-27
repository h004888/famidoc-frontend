'use client';

import { useEffect, useState } from 'react';
import { isFacilityRole } from '@/components/layout/facility-verification-gate';
import { useAuth } from '@/features/auth/context/auth-context';
import { unwrapApiEnvelope } from '@/lib/api/envelope';
import { httpClient } from '@/lib/api/http-client';

export interface FacilityNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPage {
  items: FacilityNotification[];
  total: number;
  unreadCount: number;
}

const refreshEvent = 'famidoc:facility-notifications-refresh';
const endpoint = '/api/v1/notifications';
const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function getFacilityNotificationTime(item: FacilityNotification) {
  return timeFormatter.format(new Date(item.createdAt));
}

export function getFacilityNotificationAction(item: FacilityNotification) {
  const type = (item.type || '').toUpperCase();

  // Xếp lịch tự động sau thanh toán thất bại / thiếu dữ liệu: referenceId là mã hợp đồng.
  if (
    type === 'ENCOUNTER_AUTO_SCHEDULE_FAILED' ||
    type === 'ENCOUNTER_AUTO_SCHEDULE_MISSING_DATA'
  ) {
    return {
      href: item.referenceId
        ? `/facility/coordination/${encodeURIComponent(item.referenceId)}`
        : '/facility/coordination',
      label: 'Xếp lịch lại',
      icon: 'event_repeat',
      type:
        type === 'ENCOUNTER_AUTO_SCHEDULE_FAILED'
          ? 'Lỗi xếp lịch'
          : 'Thiếu thông tin xếp lịch',
    };
  }

  if (type.startsWith('ENCOUNTER_') || type.startsWith('RESCHEDULE_')) {
    return {
      href: '/facility/coordination',
      label: 'Xem điều phối',
      icon: 'calendar_month',
      type: 'Điều phối khám',
    };
  }
  if (
    type.startsWith('STAFFING_CONTRACT_') ||
    type.startsWith('CONTRACT_') ||
    type.startsWith('ADDENDUM_') ||
    type.startsWith('MATCHING_QUEUE_')
  ) {
    return {
      href: '/facility/contracts',
      label: 'Xem hợp đồng',
      icon: 'contract_edit',
      type: 'Hợp đồng',
    };
  }
  if (type.startsWith('DOCTOR_') || type.startsWith('QUOTA_')) {
    return {
      href: '/facility/doctors',
      label: 'Quản lý bác sĩ',
      icon: 'stethoscope',
      type: 'Nhân sự bác sĩ',
    };
  }
  if (type.startsWith('COMPLAINT') || type.startsWith('DISPUTE')) {
    return {
      href: '/facility/complaints',
      label: 'Xử lý khiếu nại',
      icon: 'support_agent',
      type: 'Khiếu nại',
    };
  }
  if (
    type.startsWith('SETTLEMENT') ||
    type.startsWith('INVOICE') ||
    type.startsWith('PAYMENT')
  ) {
    return {
      href: '/facility/revenue',
      label: 'Xem doanh thu',
      icon: 'payments',
      type: 'Đối soát B2B',
    };
  }
  if (type.startsWith('FACILITY_LEGAL_')) {
    return {
      href: '/facility/legal-profile',
      label: 'Hồ sơ pháp lý',
      icon: 'policy',
      type: 'Pháp lý CSYT',
    };
  }
  return {
    href: '/notifications',
    label: 'Xem thông báo',
    icon: 'notifications',
    type: 'Hệ thống',
  };
}

export function useFacilityNotificationOwner() {
  const { user, role, isAuthenticated } = useAuth();
  return isAuthenticated && isFacilityRole(role) ? user?.id : undefined;
}

export function useFacilityNotifications(
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
                error: 'Chưa tải được thông báo cơ sở y tế.',
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

export async function markFacilityNotificationsRead(ids: string[]) {
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
