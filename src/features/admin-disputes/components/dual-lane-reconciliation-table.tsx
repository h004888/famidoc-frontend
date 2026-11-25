'use client';

import { useEffect, useState } from 'react';
import { Bell, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { encountersApi, type EncounterItem } from '@/lib/api/encounters.api';
import {
  deriveDualLaneState,
  formatRemainingRecordDeadline,
} from '@/lib/encounter-dual-lane';

type ReconciliationFilter = 'ALL' | 'DISPUTED' | 'PENDING_RECORD';

export interface DualLaneReconciliationTableProps {
  encounters?: EncounterItem[];
  now?: Date;
  onInspectDispute?: (encounter: EncounterItem) => void;
}

export function DualLaneReconciliationTable({
  encounters: propEncounters,
  now,
  onInspectDispute,
}: DualLaneReconciliationTableProps) {
  const [encounters, setEncounters] = useState<EncounterItem[]>(propEncounters ?? []);
  const [loading, setLoading] = useState(!propEncounters);
  const [filter, setFilter] = useState<ReconciliationFilter>('ALL');
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});
  const [remindingId, setRemindingId] = useState<string | null>(null);

  useEffect(() => {
    if (propEncounters) {
      setEncounters(propEncounters);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    encountersApi
      .getFacilityScheduleBoard()
      .then((res) => {
        if (mounted && Array.isArray(res?.encounters)) {
          setEncounters(res.encounters);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [propEncounters]);

  const currentNow = now ?? new Date();
  const rows = encounters.map((enc) => ({
    enc,
    lane: deriveDualLaneState(enc, currentNow),
  }));

  const disputedCount = rows.filter((r) => r.lane.reconciledStatus === 'DISPUTED').length;
  const pendingRecordCount = rows.filter(
    (r) => r.lane.reconciledStatus === 'PENDING_RECORD',
  ).length;

  const visibleRows = rows.filter((r) => {
    if (filter === 'DISPUTED') return r.lane.reconciledStatus === 'DISPUTED';
    if (filter === 'PENDING_RECORD') return r.lane.reconciledStatus === 'PENDING_RECORD';
    return true;
  });

  const handleRemind = async (encounterId: string) => {
    setRemindingId(encounterId);
    try {
      await encountersApi.remindWrapUp(encounterId);
      setRemindedIds((prev) => ({ ...prev, [encounterId]: true }));
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">Đối soát Ca khám 2 làn</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={filter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilter('ALL')}
          >
            Tất cả ({rows.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === 'DISPUTED' ? 'default' : 'outline'}
            onClick={() => setFilter('DISPUTED')}
          >
            Cần xử lý: NO_SHOW/DISPUTED ({disputedCount})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={filter === 'PENDING_RECORD' ? 'default' : 'outline'}
            onClick={() => setFilter('PENDING_RECORD')}
          >
            Chờ hồ sơ 24h ({pendingRecordCount})
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Đang tải dữ liệu đối soát...</p>
      ) : visibleRows.length === 0 ? (
        <p className="text-sm text-slate-600">Không có ca khám nào trong bộ lọc này.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ca khám</TableHead>
              <TableHead>Làn Gia đình</TableHead>
              <TableHead>Làn Bác sĩ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map(({ enc, lane }) => {
              const title =
                enc.contract?.familyUnit?.familyName ||
                enc.patient?.fullName ||
                enc.id;
              return (
                <TableRow key={enc.id}>
                  <TableCell className="text-xs">
                    <div className="font-bold text-slate-900">{title}</div>
                    <div className="text-slate-500">
                      {String(enc.scheduledDate).slice(0, 10)} •{' '}
                      {String(enc.scheduledTime).slice(0, 5)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {lane.familyReportedNoShow ? (
                      <span className="font-semibold text-red-700">✕ BÁO KHÔNG ĐẾN</span>
                    ) : lane.familyConfirmed ? (
                      <span className="font-semibold text-emerald-700">✓ Có đến</span>
                    ) : lane.autoClosedByTimeout ? (
                      <span className="text-slate-600">Quá hạn 48h (Tự động đóng)</span>
                    ) : (
                      <span className="text-slate-600">Chưa xác nhận</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium text-slate-900">{lane.doctorStatusLabel}</div>
                    {lane.reconciledStatus === 'PENDING_RECORD' &&
                      lane.remainingRecordHours !== null && (
                        <div className="text-amber-800">
                          {formatRemainingRecordDeadline(lane.remainingRecordHours)}
                        </div>
                      )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        lane.reconciledStatus === 'DISPUTED'
                          ? 'border-red-300 bg-red-50 text-red-800'
                          : lane.reconciledStatus === 'PENDING_RECORD'
                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      }
                    >
                      {lane.reconciledStatus === 'DISPUTED'
                        ? 'DISPUTED / NO_SHOW'
                        : lane.reconciledStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {lane.reconciledStatus === 'DISPUTED' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onInspectDispute?.(enc)}
                      >
                        <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                        Xử lý đối soát
                      </Button>
                    )}
                    {lane.reconciledStatus === 'PENDING_RECORD' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={remindingId === enc.id || Boolean(remindedIds[enc.id])}
                        onClick={() => void handleRemind(enc.id)}
                      >
                        <Bell className="mr-1 h-3.5 w-3.5" />
                        {remindedIds[enc.id] ? 'Đã gửi nhắc' : 'Gửi nhắc bác sĩ'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
