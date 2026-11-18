'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  doctorsApi,
  type DoctorQuotaProposalDto,
} from '@/lib/api/doctors.api';
import { extractErrorMessage } from '@/lib/api';

export function AdminQuotaProposalsPanel() {
  const [proposals, setProposals] = useState<DoctorQuotaProposalDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DoctorQuotaProposalDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadProposals = async () => {
    if (typeof doctorsApi.getAdminQuotaProposals !== 'function') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await doctorsApi.getAdminQuotaProposals({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 20,
      });
      setProposals(res.items ?? []);
    } catch {
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (proposal: DoctorQuotaProposalDto) => {
    setReviewingId(proposal.id);
    try {
      await doctorsApi.reviewQuotaProposal(proposal.id, {
        action: 'APPROVE',
        reviewNote: `Chấp thuận cập nhật hạn mức lên ${proposal.requestedMaxPanel} hộ gia đình.`,
      });
      toast.success(
        `Đã duyệt điều chỉnh Quota cho ${proposal.doctor?.doctorName ?? 'bác sĩ'} (${proposal.requestedMaxPanel} hộ).`
      );
      await loadProposals();
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể phê duyệt đề xuất quota.')
      );
    } finally {
      setReviewingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget || !rejectReason.trim()) return;
    setReviewingId(rejectTarget.id);
    try {
      await doctorsApi.reviewQuotaProposal(rejectTarget.id, {
        action: 'REJECT',
        reviewNote: rejectReason.trim(),
      });
      toast.success('Đã từ chối đề xuất điều chỉnh Quota và gửi thông báo tới CSYT.');
      setRejectTarget(null);
      setRejectReason('');
      await loadProposals();
    } catch (err) {
      toast.error(
        extractErrorMessage(err, 'Không thể từ chối đề xuất quota.')
      );
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Card
      data-testid="admin-quota-proposals-panel"
      className="rounded-2xl border-slate-200/80 bg-white shadow-xs"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="material-symbols-outlined text-[20px] text-[#0037c1]">
              tune
            </span>
            <span>Duyệt Đề Xuất Điều Chỉnh Quota Bác Sĩ</span>
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Cơ sở y tế đề xuất điều chỉnh hạn mức hộ gia đình tối đa (`maxPanelCapacity`), Admin đối soát trước khi áp dụng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
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
              {st === 'PENDING'
                ? 'Chờ duyệt'
                : st === 'APPROVED'
                  ? 'Đã duyệt'
                  : st === 'REJECTED'
                    ? 'Từ chối'
                    : 'Tất cả'}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Đang tải danh sách đề xuất quota...
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 rounded-xl bg-slate-50 border border-slate-100">
            Không có đề xuất điều chỉnh quota nào trong trạng thái đã chọn.
          </div>
        ) : (
          <div className="space-y-2.5">
            {proposals.map((item) => (
              <div
                key={item.id}
                data-testid={`quota-proposal-row-${item.id}`}
                className="rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {item.doctor?.doctorName ?? 'Bác sĩ'}
                    </span>
                    <span className="text-xs text-slate-500">
                      • {item.facility?.facilityName ?? 'Cơ sở y tế'}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        item.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 text-[11px]'
                          : item.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]'
                            : 'bg-rose-50 text-rose-700 border-rose-200 text-[11px]'
                      }
                    >
                      {item.status === 'PENDING'
                        ? 'Chờ duyệt'
                        : item.status === 'APPROVED'
                          ? 'Đã duyệt'
                          : 'Từ chối'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 tabular-nums">
                    <span>
                      Hạn mức:{' '}
                      <strong>{item.currentMaxPanel}</strong> →{' '}
                      <strong className="text-[#0037c1]">
                        {item.requestedMaxPanel} hộ
                      </strong>
                    </span>
                    {typeof item.activeAndHeldCount === 'number' && (
                      <span className="text-slate-500">
                        (Đang giữ chỗ/hoạt động: {item.activeAndHeldCount} hộ)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Lý do CSYT:</strong> {item.reason}
                  </p>
                  {item.reviewNote && (
                    <p className="text-[11px] text-slate-500">
                      <strong>Phản hồi Admin:</strong> {item.reviewNote}
                    </p>
                  )}
                </div>

                {item.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={reviewingId === item.id}
                      onClick={() => void handleApprove(item)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Phê duyệt
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={reviewingId === item.id}
                      onClick={() => {
                        setRejectTarget(item);
                        setRejectReason('');
                      }}
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                    >
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {rejectTarget && (
          <form
            onSubmit={handleRejectSubmit}
            className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-3"
          >
            <p className="text-xs font-bold text-slate-900">
              Từ chối đề xuất của {rejectTarget.doctor?.doctorName} (lên{' '}
              {rejectTarget.requestedMaxPanel} hộ)
            </p>
            <textarea
              required
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối gửi về Cơ sở y tế..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0037c1]"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setRejectTarget(null)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!rejectReason.trim() || reviewingId === rejectTarget.id}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                Xác nhận từ chối
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
