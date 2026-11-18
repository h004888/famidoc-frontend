'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { DashboardPageShell } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getNotificationAction,
  getNotificationTime,
  markFamilyNotificationsRead,
  useFamilyNotifications,
} from '../hooks/use-family-notifications';

const filters = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'prescriptions', label: 'Đơn thuốc' },
];
const limit = 20;

export function FamilyNotificationsView({ userId }: { userId: string }) {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [readError, setReadError] = useState('');
  const { data, error, reload } = useFamilyNotifications(
    userId,
    page,
    limit,
    filter,
  );
  const items = data?.items ?? [];
  const hasUnreadOnPage = items.some((item) => !item.isRead);

  function markRead(ids: string[]) {
    setReadError('');
    void markFamilyNotificationsRead(ids).catch((failure: Error) =>
      setReadError(failure.message),
    );
  }

  return (
    <DashboardPageShell containerClassName="max-w-5xl">
      <header className="flex items-center gap-4 rounded-2xl border border-teal-200/70 bg-gradient-to-br from-white to-teal-50 p-5 sm:p-7">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
          <Bell size={23} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Thông báo gia đình
          </h1>
          {Boolean(data?.unreadCount) && (
            <p className="mt-1 text-sm text-slate-600">
              {data?.unreadCount} thông báo chưa đọc
            </p>
          )}
        </div>
      </header>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Lọc thông báo"
          >
            {filters.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                aria-pressed={tab.id === filter}
                variant={tab.id === filter ? 'default' : 'outline'}
                onClick={() => {
                  setPage(1);
                  setFilter(tab.id);
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          {hasUnreadOnPage && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                markRead(
                  items.filter((item) => !item.isRead).map((item) => item.id),
                )
              }
            >
              Đọc tất cả trên trang
            </Button>
          )}
        </div>
        {error && (
          <div className="flex items-center justify-between gap-3 p-4">
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={reload}>
              Tải lại
            </Button>
          </div>
        )}
        {readError && (
          <p role="alert" className="p-4 text-sm text-red-700">
            {readError}
          </p>
        )}
        {!data && !error && (
          <p role="status" className="p-5 text-sm text-slate-600">
            Đang tải thông báo…
          </p>
        )}
        {data && items.length === 0 && (
          <p className="p-5 text-sm text-slate-600">
            Chưa có thông báo trong mục này.
          </p>
        )}
        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const action = getNotificationAction(item);
            return (
              <li
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 ${item.isRead ? '' : 'bg-teal-50/50'}`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {action && (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900">
                        {action.type}
                      </span>
                    )}
                    <time dateTime={item.createdAt}>
                      {getNotificationTime(item)}
                    </time>
                    {!item.isRead && (
                      <span className="font-medium text-teal-900">
                        Chưa đọc
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    {item.title}
                  </h2>
                  <p className="break-words text-sm text-slate-600">
                    {item.content}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!item.isRead && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead([item.id])}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  )}
                  {action && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={action.href}
                        onClick={() => {
                          if (!item.isRead) markRead([item.id]);
                        }}
                      >
                        {action.label}
                      </Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      {(page > 1 || (data?.total ?? 0) > page * limit) && (
        <nav
          aria-label="Phân trang thông báo"
          className="flex items-center justify-between gap-3"
        >
          <Button
            type="button"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm text-slate-600">Trang {page}</span>
          <Button
            type="button"
            variant="outline"
            disabled={(data?.total ?? 0) <= page * limit}
            onClick={() => setPage(page + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
    </DashboardPageShell>
  );
}
