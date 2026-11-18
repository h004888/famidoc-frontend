'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  extractErrorMessage,
  matchingApi,
  publicApi,
  type MatchingQueueItemDto,
  type PublicDoctorDto,
} from '@/lib/api';

export function AdminMatchingQueuePanel() {
  const [items, setItems] = useState<MatchingQueueItemDto[]>([]);
  const [doctors, setDoctors] = useState<PublicDoctorDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    'QUEUED' | 'ASSIGNED' | 'CONFIRMED' | 'ALL'
  >('QUEUED');
  const [selectedDoctorByQueue, setSelectedDoctorByQueue] = useState<
    Record<string, string>
  >({});
  const [noteByQueue, setNoteByQueue] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadData = async () => {
    if (typeof matchingApi.getAdminQueueRequests !== 'function') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [queueRes, doctorsRes] = await Promise.all([
        matchingApi.getAdminQueueRequests({
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          limit: 20,
        }),
        typeof publicApi.getDoctors === 'function'
          ? publicApi
              .getDoctors({ onlyAvailable: true, limit: 50 })
              .catch(() => ({ items: [] as PublicDoctorDto[] }))
          : Promise.resolve({ items: [] as PublicDoctorDto[] }),
      ]);
      setItems(queueRes.items ?? []);
      setDoctors(doctorsRes.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleAssign = async (queueId: string) => {
    const doctorId = selectedDoctorByQueue[queueId];
    if (!doctorId) {
      toast.error('Vui lòng chọn bác sĩ còn slot trống trước khi gán.');
      return;
    }
    setAssigningId(queueId);
    try {
      await matchingApi.assignAdminQueueDoctor(queueId, {
        doctorId,
        ...(noteByQueue[queueId]?.trim()
          ? { adminNote: noteByQueue[queueId].trim() }
          : {}),
      });
      toast.success(
        'Đã gán bác sĩ thành công và gửi thông báo mời gia đình xác nhận.'
      );
      await loadData();
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể gán bác sĩ cho yêu cầu hàng chờ.')
      );
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Card
      data-testid="admin-matching-queue-panel"
      className="rounded-2xl border-slate-200/80 bg-white shadow-xs"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="material-symbols-outlined text-[20px] text-[#0037c1]">
              assignment_ind
            </span>
            <span>Hàng Chờ Điều Phối Bác Sĩ (Track B Fallback)</span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân công bác sĩ còn slot trống cho các yêu cầu chưa khớp tự động; hệ thống tự suy ra CSYT và gửi email mời gia đình xác nhận.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(['QUEUED', 'ASSIGNED', 'CONFIRMED', 'ALL'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0037c1] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'QUEUED'
                ? 'Chờ phân công'
                : st === 'ASSIGNED'
                  ? 'Đã gán BS'
                  : st === 'CONFIRMED'
                    ? 'Đã tạo HĐ'
                    : 'Tất cả'}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Đang tải hàng chờ điều phối...
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 rounded-xl bg-slate-50 border border-slate-100">
            Hiện không có yêu cầu nào trong hàng chờ điều phối.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                data-testid={`admin-queue-row-${item.id}`}
                className="rounded-xl border border-slate-200 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {item.user?.fullName ?? 'Hộ gia đình'}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {item.servicePackage?.packageName ?? 'Gói chăm sóc'} (
                      <span className="tabular-nums">{item.memberCount}</span> thành viên)
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'QUEUED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 text-[11px]'
                          : item.status === 'ASSIGNED'
                            ? 'bg-blue-50 text-[#0037c1] border-blue-200 text-[11px]'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    SLA: {new Date(item.slaExpiresAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong>Lý do vào hàng chờ:</strong> {item.fallbackReason}
                    {item.districtArea ? ` • Khu vực: ${item.districtArea}` : ''}
                    {item.requestedTier ? ` • Hạng BS: ${item.requestedTier}` : ''}
                  </p>
                  {item.sanitizedDescription && (
                    <p className="text-slate-500">{item.sanitizedDescription}</p>
                  )}
                  {item.assignedDoctor && (
                    <p className="text-[#0037c1] font-medium">
                      Đã gán: {item.assignedDoctor.doctorName}
                      {item.assignedFacility
                        ? ` (${item.assignedFacility.facilityName})`
                        : ''}
                    </p>
                  )}
                </div>

                {item.status === 'QUEUED' && (
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      aria-label={`Chọn bác sĩ cho yêu cầu ${item.id}`}
                      value={selectedDoctorByQueue[item.id] ?? ''}
                      onChange={(e) =>
                        setSelectedDoctorByQueue((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white text-slate-900"
                    >
                      <option value="">-- Chọn bác sĩ còn slot trống --</option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.doctorName} · {doc.specialty} (Còn{' '}
                          {doc.remainingSlots ??
                            Math.max(
                              0,
                              (doc.maxPanelCapacity ?? 30) -
                                (doc.activePanelCount ?? 0)
                            )}{' '}
                          slot · {doc.facility?.facilityName ?? 'CSYT'})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ghi chú gửi gia đình (tùy chọn)"
                      value={noteByQueue[item.id] ?? ''}
                      onChange={(e) =>
                        setNoteByQueue((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="sm:w-56 h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        assigningId === item.id || !selectedDoctorByQueue[item.id]
                      }
                      onClick={() => void handleAssign(item.id)}
                      className="bg-[#0037c1] hover:bg-[#002c9a] text-white text-xs font-semibold cursor-pointer"
                    >
                      {assigningId === item.id ? 'Đang gán...' : 'Gán bác sĩ'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
