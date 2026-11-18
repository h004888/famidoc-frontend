'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  extractErrorMessage,
  matchingApi,
  type MatchingQueueItemDto,
} from '@/lib/api';

const STATUS_LABELS: Record<
  MatchingQueueItemDto['status'],
  { label: string; badgeClass: string }
> = {
  QUEUED: {
    label: 'Đang chờ điều phối',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  ASSIGNED: {
    label: 'Đã gán bác sĩ · Chờ xác nhận',
    badgeClass: 'bg-blue-50 text-[#0037c1] border-blue-200',
  },
  CONFIRMED: {
    label: 'Đã khởi tạo hợp đồng',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  EXPIRED: {
    label: 'Hết hạn SLA',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export function FamilyMatchingQueuePanel() {
  const [items, setItems] = useState<MatchingQueueItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadQueue = async () => {
    if (typeof matchingApi.getMyQueueRequests !== 'function') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await matchingApi.getMyQueueRequests();
      setItems(res.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await matchingApi.cancelQueueRequest(id, 'Gia đình chủ động hủy yêu cầu chờ');
      toast.success('Đã hủy yêu cầu tìm bác sĩ trong hàng chờ.');
      await loadQueue();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể hủy yêu cầu hàng chờ.'));
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <section
      data-testid="family-matching-queue-panel"
      aria-label="Hàng chờ điều phối bác sĩ"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Yêu Cầu Ghép Nối Bác Sĩ Đang Theo Dõi ({items.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi yêu cầu tìm bác sĩ từ Track B khi cần Quản trị viên phân công thủ công.
          </p>
        </div>
        <Link
          href="/doctors/matching"
          className="text-xs font-semibold text-[#0037c1] hover:underline"
        >
          Tạo yêu cầu ghép nối mới →
        </Link>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const statusMeta = STATUS_LABELS[item.status] ?? STATUS_LABELS.QUEUED;
          return (
            <div
              key={item.id}
              data-testid={`family-queue-item-${item.id}`}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {item.servicePackage?.packageName ?? 'Gói chăm sóc gia đình'}
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    ({item.memberCount} thành viên)
                  </span>
                  <Badge variant="outline" className={`text-[11px] ${statusMeta.badgeClass}`}>
                    {statusMeta.label}
                  </Badge>
                </div>

                {item.districtArea && (
                  <p className="text-xs text-slate-600">
                    Khu vực ưu tiên: <strong>{item.districtArea}</strong>
                  </p>
                )}
                {item.sanitizedDescription && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {item.sanitizedDescription}
                  </p>
                )}

                {item.status === 'ASSIGNED' && item.assignedDoctor && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-950">
                    Bác sĩ được gán:{' '}
                    <strong>{item.assignedDoctor.doctorName}</strong>
                    {item.assignedFacility && (
                      <> · {item.assignedFacility.facilityName}</>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-slate-400 tabular-nums">
                  Hạn SLA: {new Date(item.slaExpiresAt).toLocaleString('vi-VN')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {item.status === 'QUEUED' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={cancellingId === item.id}
                    onClick={() => void handleCancel(item.id)}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                  >
                    {cancellingId === item.id ? 'Đang hủy...' : 'Hủy yêu cầu chờ'}
                  </Button>
                )}
                {item.status === 'ASSIGNED' && (
                  <Button
                    asChild
                    size="sm"
                    className="bg-[#0037c1] hover:bg-[#002c9a] text-white text-xs font-semibold"
                  >
                    <Link href={`/booking?queueId=${encodeURIComponent(item.id)}`}>
                      Xem bác sĩ &amp; Xác nhận hợp đồng
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
