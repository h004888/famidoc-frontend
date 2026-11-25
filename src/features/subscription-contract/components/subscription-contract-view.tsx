'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, History, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contractsApi, type FourPartyContract } from '@/lib/api';
import { DoctorContractInitiationPanel } from './doctor-contract-initiation-panel';

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Đang hiệu lực',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  PENDING_APPROVAL: {
    label: 'Chờ ký 4 bên',
    className: 'border-amber-300 bg-amber-50 text-amber-900',
  },
  EXPIRED: {
    label: 'Đã hết hạn',
    className: 'border-slate-300 bg-slate-100 text-slate-700',
  },
  TERMINATED: {
    label: 'Đã chấm dứt',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
};

const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? shortDateFormatter.format(parsed)
    : value;
}

export function SubscriptionContractView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageParam = searchParams?.get('packageId');
  const doctorParam = searchParams?.get('doctorId');
  const facilityParam = searchParams?.get('facilityId');
  const rawMembersParam = searchParams?.get('members');
  const parsedMembersParam =
    rawMembersParam !== null ? Number(rawMembersParam) : 1;
  const requestedMembersValue = Number.isFinite(parsedMembersParam)
    ? Math.trunc(parsedMembersParam)
    : 0;
  const matchSessionParam = searchParams?.get('matchSessionId');
  const queueParam = searchParams?.get('queueId');
  const hasDoctorBookingContext = Boolean(
    (packageParam && doctorParam) || matchSessionParam || queueParam,
  );

  const [contracts, setContracts] = useState<FourPartyContract[]>([]);
  const [loading, setLoading] = useState(!hasDoctorBookingContext);
  const [error, setError] = useState('');

  const loadContracts = () => {
    setLoading(true);
    setError('');
    contractsApi
      .getMedicalContracts()
      .then((list) => {
        setContracts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        setError('Chưa tải được danh sách gói dịch vụ và hợp đồng.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (hasDoctorBookingContext) return;
    loadContracts();
  }, [hasDoctorBookingContext]);

  if (hasDoctorBookingContext) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
        <main className="w-full max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <DoctorContractInitiationPanel
            packageId={packageParam ?? undefined}
            doctorId={doctorParam ?? undefined}
            facilityId={facilityParam ?? undefined}
            matchSessionId={matchSessionParam ?? undefined}
            queueId={queueParam ?? undefined}
            requestedMembers={requestedMembersValue}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="space-y-0.5">
              <h1 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900">
                <History className="size-4 text-primary shrink-0" aria-hidden="true" />
                <span>Gói Chăm Sóc &amp; Hợp Đồng Gia Đình</span>
              </h1>
              <p className="text-xs text-slate-600">
                Chọn một gói dịch vụ bên dưới để xem hạn mức quyền lợi và bản hợp đồng PDF.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={loadContracts}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Làm mới
            </Button>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div
              role="status"
              className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500"
            >
              <RefreshCw
                className="size-4 animate-spin text-primary"
                aria-hidden="true"
              />
              <span>Đang tải danh sách gói dịch vụ &amp; hợp đồng…</span>
            </div>
          ) : contracts.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-600">
              <p>Gia đình chưa có gói dịch vụ hoặc hợp đồng nào.</p>
              <Link
                href="/doctors"
                className="mt-2 inline-block font-semibold text-primary hover:underline"
              >
                Tìm bác sĩ &amp; đăng ký gói
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full min-w-[680px] border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3">Gói dịch vụ</th>
                    <th className="px-4 py-3">Mã hợp đồng</th>
                    <th className="px-4 py-3">Bác sĩ / CSYT</th>
                    <th className="px-4 py-3">Hiệu lực</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="w-10 px-3 py-3" aria-label="Chi tiết" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {contracts.map((item) => {
                    const raw = item as FourPartyContract & {
                      contractStatus?: string;
                      startDate?: string;
                      endDate?: string;
                      totalAmountVnd?: number;
                      memberCount?: number;
                    };
                    const statusKey = String(raw.contractStatus || raw.status || '');
                    const statusBadge = STATUS_BADGE_MAP[statusKey] ?? {
                      label: statusKey || 'Đang xử lý',
                      className: 'border-slate-200 bg-slate-50 text-slate-700',
                    };
                    const price = Number(
                      raw.totalAmountVnd ?? raw.packagePrice ?? 0,
                    );
                    const members = raw.memberCount ?? raw.membersCount ?? 1;
                    const startStr = formatShortDate(
                      raw.startDate || raw.activatedAt,
                    );
                    const endStr = formatShortDate(
                      raw.endDate || raw.expiresAt,
                    );

                    return (
                      <tr
                        key={item.id}
                        tabIndex={0}
                        onClick={() =>
                          router.push(`/family/subscription/${item.id}`)
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/family/subscription/${item.id}`);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-slate-50/90 focus-visible:bg-slate-50 focus-visible:outline-none"
                      >
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-bold text-slate-900">
                            {item.packageName || 'Gói Chăm Sóc Sức Khỏe Gia Đình'}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                            {price.toLocaleString('vi-VN')} đ · {members} thành viên
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top font-semibold text-slate-700 tabular-nums">
                          #{item.contractNumber}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-medium text-slate-900">
                            {item.doctorName || 'Chờ phân công bác sĩ'}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {item.facilityName || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top text-xs text-slate-600 tabular-nums">
                          {startStr} – {endStr}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-3.5 align-middle text-right text-slate-400">
                          <ChevronRight className="inline size-4" aria-hidden="true" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
