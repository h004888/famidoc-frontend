'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  encountersApi,
  type EncounterItem,
  type EncounterRescheduleRequestItem,
} from '@/lib/api';
import {
  deriveDualLaneState,
  formatRemainingRecordDeadline,
} from '@/lib/encounter-dual-lane';

function formatVnDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [yyyy, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function formatDayHeading(isoDate: string, todayIso: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const wd = weekdays[parsed.getDay()];
  const formatted = formatVnDate(isoDate);
  return isoDate === todayIso ? `Hôm nay · ${wd}, ${formatted}` : `${wd}, ${formatted}`;
}

function getEncounterTime(enc: EncounterItem): string {
  if (!enc.scheduledTime) return '';
  if (enc.scheduledTime.includes('T')) return enc.scheduledTime.slice(11, 16);
  return enc.scheduledTime.slice(0, 5);
}

function getEncounterDate(enc: EncounterItem): string {
  return enc.scheduledDate ? enc.scheduledDate.slice(0, 10) : '';
}

function getSessionBucket(time: string): 'morning' | 'afternoon' {
  const hour = Number.parseInt(time.split(':')[0] || '8', 10);
  if (!Number.isFinite(hour) || hour < 12) return 'morning';
  return 'afternoon';
}

function getSessionLabel(bucket: 'morning' | 'afternoon' | 'evening'): string {
  if (bucket === 'morning') return 'Buổi sáng';
  if (bucket === 'afternoon') return 'Buổi chiều';
  return 'Buổi tối';
}

function getPatientLabel(enc: EncounterItem): string {
  const repName =
    enc.contract?.familyUnit?.representativeUser?.fullName ||
    enc.contract?.familyUnit?.representativeUser?.name;
  if (enc.visitScope === 'FAMILY' || (enc.participants && enc.participants.length > 1)) {
    return repName ? `Hộ ${repName}` : 'Toàn bộ gia đình';
  }
  const singleParticipant = enc.participants?.[0]?.patient?.fullName;
  if (singleParticipant) return singleParticipant;
  if (enc.patient?.fullName) return enc.patient.fullName;
  return repName ? `Hộ ${repName}` : 'Thành viên gia đình';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'BN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getWeekDays(anchorIso: string): { iso: string; dayLabel: string; shortDate: string }[] {
  const base = new Date(`${anchorIso}T00:00:00`);
  const safe = Number.isNaN(base.getTime()) ? new Date() : base;
  const day = safe.getDay();
  const sunday = new Date(safe);
  sunday.setDate(safe.getDate() - day);
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return labels.map((dayLabel, idx) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + idx);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return { iso: `${yyyy}-${mm}-${dd}`, dayLabel, shortDate: `${dd}/${mm}` };
  });
}

function getMonthGridDays(anchorIso: string): {
  iso: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}[] {
  const base = new Date(`${anchorIso}T00:00:00`);
  const safe = Number.isNaN(base.getTime()) ? new Date() : base;
  const year = safe.getFullYear();
  const month = safe.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = firstOfMonth.getDay();
  const totalCells = Math.ceil((startOffset + lastOfMonth.getDate()) / 7) * 7;

  const cells: { iso: string; dayNumber: number; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    cells.push({
      iso: `${yyyy}-${mm}-${dd}`,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
    });
  }
  return cells;
}

function formatMonthYearLabel(anchorIso: string): string {
  const base = new Date(`${anchorIso}T00:00:00`);
  const safe = Number.isNaN(base.getTime()) ? new Date() : base;
  return `Tháng ${safe.getMonth() + 1}, ${safe.getFullYear()}`;
}

function shiftIsoDate(anchorIso: string, deltaDays: number, deltaMonths = 0): string {
  const base = new Date(`${anchorIso}T00:00:00`);
  const safe = Number.isNaN(base.getTime()) ? new Date() : base;
  if (deltaMonths !== 0) safe.setMonth(safe.getMonth() + deltaMonths);
  if (deltaDays !== 0) safe.setDate(safe.getDate() + deltaDays);
  const yyyy = safe.getFullYear();
  const mm = String(safe.getMonth() + 1).padStart(2, '0');
  const dd = String(safe.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getStatusInfo(rawStatus: string) {
  switch (rawStatus) {
    case 'REQUESTED':
      return {
        label: 'Chờ Bác sĩ duyệt',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        stepIndex: -1,
      };
    case 'CONFIRMED':
    case 'ON_THE_WAY':
      return {
        label: 'Đã xếp lịch',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        stepIndex: 0,
      };
    case 'ARRIVED':
      return {
        label: 'Đã check-in · Chờ gia đình XN',
        className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        stepIndex: 1,
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang thăm khám',
        className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        stepIndex: 2,
      };
    case 'WRAP_UP':
      return {
        label: 'Chờ hoàn tất hồ sơ',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        stepIndex: 2,
      };
    case 'NO_SHOW':
      return {
        label: 'Vắng mặt',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        stepIndex: -1,
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        stepIndex: 3,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        stepIndex: -1,
      };
    default:
      return {
        label: rawStatus,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        stepIndex: 0,
      };
  }
}

const PROGRESS_STEPS = [
  { label: 'Đã xếp', step: 0 },
  { label: 'Đã đến', step: 1 },
  { label: 'Đang khám', step: 2 },
  { label: 'Hoàn thành', step: 3 },
];

export function DoctorTimetableView() {
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [pendingReschedules, setPendingReschedules] = useState<EncounterRescheduleRequestItem[]>(
    []
  );
  const [outgoingReschedules, setOutgoingReschedules] = useState<EncounterRescheduleRequestItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');

  const todayIso = new Date().toISOString().slice(0, 10);
  const [calendarAnchorIso, setCalendarAnchorIso] = useState(todayIso);

  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedTelehealthTimes, setSelectedTelehealthTimes] = useState<Record<string, string>>({});
  const [selectedWeeklyEnc, setSelectedWeeklyEnc] = useState<EncounterItem | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<EncounterItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(todayIso);
  const [rescheduleTime, setRescheduleTime] = useState('09:30');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const loadTimetableAndRequests = useCallback(async () => {
    setLoadError(null);
    try {
      const [timetableRes, requests] = await Promise.all([
        encountersApi.getDoctorTimetable({ pageSize: 100 }),
        encountersApi.getPendingRescheduleRequests().catch(() => []),
      ]);
      if (Array.isArray(timetableRes?.data)) {
        setEncounters(timetableRes.data);
      }
      setPendingReschedules(
        (requests ?? []).filter((r) => r.status === 'PENDING' && r.doctorDecision === 'PENDING')
      );
      setOutgoingReschedules(
        (requests ?? []).filter(
          (r) =>
            r.status === 'PENDING' &&
            r.doctorDecision === 'APPROVED' &&
            r.familyDecision === 'PENDING'
        )
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Không thể tải lịch làm việc của bác sĩ.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimetableAndRequests();
  }, [loadTimetableAndRequests]);

  const pendingTelehealthRequests = useMemo(() => {
    return encounters.filter(
      (e) => e.encounterType === 'TELEHEALTH' && e.encounterStatus === 'REQUESTED'
    );
  }, [encounters]);

  const manualScheduleItems = useMemo(() => {
    return encounters.filter(
      (e) =>
        e.encounterStatus === 'REQUESTED' &&
        (e.cancelReason?.includes('MANUAL_SLOT_REQUIRED') ||
          String(e.scheduleStage) === 'MANUAL_SLOT_REQUIRED')
    );
  }, [encounters]);

  const isUpcomingStatus = (s: string) =>
    ['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(s);

  const counts = useMemo(() => {
    const active = encounters.filter((e) => e.encounterStatus !== 'CANCELLED');
    const upcoming = active.filter((e) => isUpcomingStatus(String(e.encounterStatus))).length;
    const completed = active.filter((e) => e.encounterStatus === 'COMPLETED').length;
    const pendingCount = pendingTelehealthRequests.length + pendingReschedules.length;
    return {
      upcoming,
      completed,
      all: active.length,
      pendingCount,
    };
  }, [encounters, pendingTelehealthRequests.length, pendingReschedules.length]);

  const filteredEncounters = useMemo(() => {
    return encounters
      .filter((enc) => {
        const st = String(enc.encounterStatus || '');
        if (st === 'CANCELLED') return false;
        return true;
      })
      .sort((a, b) =>
        `${getEncounterDate(a)} ${getEncounterTime(a)}`.localeCompare(
          `${getEncounterDate(b)} ${getEncounterTime(b)}`
        )
      );
  }, [encounters]);

  const todayEncounters = useMemo(() => {
    return filteredEncounters.filter((enc) => getEncounterDate(enc) === todayIso);
  }, [filteredEncounters, todayIso]);

  const nextUpcomingEncounter = useMemo(() => {
    return filteredEncounters.find((enc) => getEncounterDate(enc) >= todayIso) ?? null;
  }, [filteredEncounters, todayIso]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, EncounterItem[]>();
    for (const enc of filteredEncounters) {
      const key = getEncounterDate(enc) || 'Chưa xác định ngày';
      const list = map.get(key) ?? [];
      list.push(enc);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredEncounters]);

  const handleConfirmTelehealth = async (
    encounterId: string,
    confirmed: boolean,
    confirmedTime?: string
  ) => {
    setActionId(encounterId);
    try {
      await (encountersApi.confirmEncounter as any)(encounterId, confirmed, confirmedTime);
      toast.success(
        confirmed
          ? `Đã nhận lịch Tư vấn Video${confirmedTime ? ` lúc ${confirmedTime}` : ''}. Hệ thống đã đồng bộ với gia đình.`
          : 'Đã từ chối yêu cầu Tư vấn Video.'
      );
      await loadTimetableAndRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xử lý lịch Tư vấn Video.');
    } finally {
      setActionId(null);
    }
  };

  const handleDecideReschedule = async (
    encounterId: string,
    requestId: string,
    decision: 'APPROVE' | 'REJECT'
  ) => {
    setActionId(requestId);
    try {
      await encountersApi.decideRescheduleRequest(encounterId, requestId, { decision });
      toast.success(
        decision === 'APPROVE'
          ? 'Bác sĩ đã đồng ý đổi lịch khám.'
          : 'Bác sĩ đã từ chối yêu cầu đổi lịch. Lịch cũ được giữ nguyên.'
      );
      await loadTimetableAndRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu đổi lịch.');
    } finally {
      setActionId(null);
    }
  };

  const handleWithdrawReschedule = async (encounterId: string, requestId: string) => {
    setActionId(requestId);
    try {
      await encountersApi.withdrawRescheduleRequest(encounterId, requestId);
      toast.success('Đã thu hồi đề xuất đổi lịch. Lịch khám cũ được giữ nguyên.');
      await loadTimetableAndRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thu hồi đề xuất đổi lịch.');
    } finally {
      setActionId(null);
    }
  };

  const handleMarkArrived = async (encounterId: string) => {
    setActionId(encounterId);
    try {
      await encountersApi.markArrived(encounterId);
      toast.success('Đã check-in có mặt tại nhà. Đang chờ gia đình xác nhận 1 chạm.');
      await loadTimetableAndRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể check-in có mặt.');
    } finally {
      setActionId(null);
    }
  };

  const handleOpenRescheduleModal = (enc: EncounterItem) => {
    setRescheduleTarget(enc);
    setRescheduleDate(getEncounterDate(enc) || todayIso);
    setRescheduleTime(getEncounterTime(enc) || '09:30');
    setRescheduleReason('');
    setRescheduleError('');
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    if (!rescheduleReason.trim()) {
      setRescheduleError('Vui lòng nhập lý do xin đổi lịch.');
      return;
    }
    setRescheduleError('');
    setSubmittingReschedule(true);
    try {
      await encountersApi.requestReschedule(rescheduleTarget.id, {
        proposedDate: rescheduleDate,
        proposedTime: rescheduleTime,
        rescheduleReason: rescheduleReason.trim(),
      });
      toast.success(
        rescheduleTarget.encounterType === 'TELEHEALTH'
          ? 'Đã gửi đề xuất đổi giờ Tư vấn Video tới Gia đình.'
          : 'Đã gửi yêu cầu đổi lịch tới Gia đình và Cơ sở Y tế phê duyệt.'
      );
      setRescheduleTarget(null);
      await loadTimetableAndRequests();
    } catch (err) {
      setRescheduleError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi yêu cầu đổi lịch. Vui lòng kiểm tra quy định báo trước tối thiểu 4 giờ.'
      );
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const weekDays = useMemo(() => getWeekDays(calendarAnchorIso), [calendarAnchorIso]);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-5">
        {/* 1. COMPACT HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Lịch Làm Việc &amp; Ca Khám Bác Sĩ
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Quản lý ca khám tại nhà, lịch tư vấn Video và phản hồi yêu cầu đổi lịch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button asChild size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5">
              <Link href="/doctor/encounters">
                <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                <span>Sổ khám &amp; Kê đơn</span>
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadTimetableAndRequests()}
              className="h-9 rounded-xl text-xs font-semibold gap-1.5 bg-white"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Làm mới</span>
            </Button>
          </div>
        </header>

        {/* 2. LỊCH ĐI KHÁM HÔM NAY (HIỂN THỊ CÁC GIA ĐÌNH CẦN ĐI KHÁM TRONG NGÀY) */}
        <section
          aria-label="Gia đình cần đi khám hôm nay"
          className="rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-2xs space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">today</span>
              <h2 className="text-sm font-bold text-slate-900">
                Gia đình phải đi khám hôm nay ({formatVnDate(todayIso)})
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#2E37A4] tabular-nums">
              {todayEncounters.length} gia đình
            </span>
          </div>

          {todayEncounters.length === 0 ? (
            <p className="text-xs text-slate-500">
              Hôm nay chưa có lịch đi khám nào.
              {nextUpcomingEncounter
                ? ` Lịch gần nhất tiếp theo: ${formatVnDate(getEncounterDate(nextUpcomingEncounter))} (${
                    getSessionBucket(getEncounterTime(nextUpcomingEncounter)) === 'morning'
                      ? 'Khung Sáng'
                      : 'Khung Chiều'
                  }) — ${getPatientLabel(nextUpcomingEncounter)}.`
                : ''}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todayEncounters.map((enc) => {
                const isHome = enc.encounterType === 'HOME_VISIT';
                const timeStr = getEncounterTime(enc);
                const slotLabel =
                  getSessionBucket(timeStr) === 'morning'
                    ? 'Khung Sáng (08:00 - 11:30)'
                    : 'Khung Chiều (13:30 - 17:30)';
                const addr =
                  enc.contract?.familyUnit?.homeAddress || enc.contract?.familyUnit?.address;
                return (
                  <div
                    key={`today-${enc.id}`}
                    className="rounded-xl border border-teal-200 bg-teal-50/40 p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-teal-700 text-white text-[10px]">ACTIVE</Badge>
                        <div className="font-bold text-slate-900 truncate">
                          {getPatientLabel(enc)} · {isHome ? 'Khám tại nhà' : 'Video'}
                        </div>
                      </div>
                      <div className="text-[#2E37A4] font-semibold">
                        {isHome ? slotLabel : timeStr}
                      </div>
                      {addr && <div className="text-slate-500 truncate">{addr}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button asChild size="sm" className="h-8 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs">
                        <Link href={`/doctor/encounters?encounterId=${enc.id}`}>Mở ca</Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedWeeklyEnc(enc)}
                        className="h-8 rounded-lg text-xs"
                      >
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(() => {
            const pendingEhr = encounters.filter(
              (enc) =>
                getEncounterDate(enc) !== todayIso &&
                deriveDualLaneState(enc).reconciledStatus === 'PENDING_RECORD',
            );
            if (pendingEhr.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold text-amber-900">Ca đang chờ hoàn tất hồ sơ (24h)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pendingEhr.map((enc) => {
                    const lane = deriveDualLaneState(enc);
                    return (
                      <div
                        key={`pending-ehr-${enc.id}`}
                        className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="border-amber-300 bg-white text-amber-900 text-[10px]">
                              Chờ EHR
                            </Badge>
                            <span className="font-bold text-slate-900 truncate">
                              {getPatientLabel(enc)}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900">
                            {formatRemainingRecordDeadline(lane.remainingRecordHours)}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs shrink-0">
                          <Link href={`/doctor/encounters?encounterId=${enc.id}`}>Chốt hồ sơ</Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>

        {/* 3. PRIORITY INBOX (TELEHEALTH REQUESTS + RESCHEDULE REQUESTS) */}
        {counts.pendingCount > 0 && (
          <section
            aria-label="Hàng đợi cần bác sĩ xử lý"
            className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-700">
                notifications_active
              </span>
              <h2 className="text-sm font-bold text-amber-950">
                Cần Bác sĩ phản hồi ngay ({counts.pendingCount})
              </h2>
            </div>

            <div className="space-y-2.5">
              {pendingTelehealthRequests.map((enc) => {
                const isMorning = getSessionBucket(getEncounterTime(enc)) === 'morning';
                const candidateTimes = isMorning
                  ? ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00']
                  : ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
                const chosenTime = selectedTelehealthTimes[enc.id] ?? candidateTimes[1];
                return (
                <div
                  key={`tele-req-${enc.id}`}
                  className="bg-white rounded-xl border border-sky-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-sky-50 text-sky-800 border-sky-200 font-semibold gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">videocam</span>
                        <span>Yêu cầu Tư vấn Video · 2 bên</span>
                      </Badge>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {isMorning ? 'Khung Sáng (08:00–11:30)' : 'Khung Chiều (13:30–17:30)'} ·{' '}
                        {formatVnDate(getEncounterDate(enc))}
                      </span>
                      <span className="font-semibold text-slate-800">
                        · {getPatientLabel(enc)}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {enc.displayNotes || enc.subjectiveNote || 'Tư vấn sức khỏe gia đình theo nhu cầu'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-600">Chốt giờ gọi:</span>
                      <select
                        aria-label="Chốt giờ gọi cụ thể"
                        value={chosenTime}
                        onChange={(e) =>
                          setSelectedTelehealthTimes((prev) => ({
                            ...prev,
                            [enc.id]: e.target.value,
                          }))
                        }
                        className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold tabular-nums"
                      >
                        {candidateTimes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionId === enc.id}
                      onClick={() => void handleConfirmTelehealth(enc.id, true, chosenTime)}
                      className="h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      <span>Duyệt &amp; Chốt {chosenTime}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionId === enc.id}
                      onClick={() => void handleConfirmTelehealth(enc.id, false)}
                      className="h-8 rounded-lg border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
                );
              })}

              {pendingReschedules.map((req) => (
                <div
                  key={`resched-${req.id}`}
                  className="bg-white rounded-xl border border-amber-200/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-800 border-amber-200 font-semibold"
                      >
                        Gia đình đề xuất đổi lịch
                      </Badge>
                      <span className="font-bold text-slate-900 tabular-nums">
                        Đổi sang {req.proposedTime?.slice(11, 16) || req.proposedTime?.slice(0, 5)}{' '}
                        · {formatVnDate(req.proposedDate?.slice(0, 10) || '')}
                      </span>
                    </div>
                    <p className="text-slate-700">{req.reason}</p>
                    <p className="text-[11px] text-slate-500">
                      Tiến độ: Gia đình đã đề xuất ✓ · Chờ Bác sĩ xác nhận
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionId === req.id}
                      onClick={() => void handleDecideReschedule(req.encounterId, req.id, 'APPROVE')}
                      className="h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      <span>Đồng ý</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionId === req.id}
                      onClick={() => void handleDecideReschedule(req.encounterId, req.id, 'REJECT')}
                      className="h-8 rounded-lg border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3A. ĐỀ XUẤT ĐỔI LỊCH BÁC SĨ ĐÃ GỬI (CHỜ GIA ĐÌNH DUYỆT) */}
        {outgoingReschedules.length > 0 && (
          <section className="space-y-2">
            {outgoingReschedules.map((req) => (
              <div
                key={`doc-out-${req.id}`}
                className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950"
              >
                <div className="space-y-1">
                  <div className="font-bold text-sm text-sky-900">
                    Đang chờ Gia đình duyệt đề xuất đổi lịch (tạm giữ khung tối đa 24 giờ)
                  </div>
                  <p>
                    Đổi sang:{' '}
                    <strong className="tabular-nums">
                      {formatVnDate(req.proposedDate?.slice(0, 10) || '')}
                    </strong>{' '}
                    ·{' '}
                    <strong>
                      {Number.parseInt(
                        (req.proposedTime?.includes('T')
                          ? req.proposedTime.slice(11, 13)
                          : req.proposedTime?.slice(0, 2)) || '8',
                        10
                      ) < 12
                        ? 'Khung Sáng (08:00 - 11:30)'
                        : 'Khung Chiều (13:30 - 17:30)'}
                    </strong>
                    {req.reason ? ` · Lý do: ${req.reason}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionId === req.id}
                  onClick={() => void handleWithdrawReschedule(req.encounterId, req.id)}
                  className="h-8 rounded-xl border-sky-300 bg-white text-sky-900 hover:bg-sky-100 text-xs font-semibold shrink-0"
                >
                  {actionId === req.id ? 'Đang thu hồi...' : 'Thu hồi đề xuất'}
                </Button>
              </div>
            ))}
          </section>
        )}

        {/* 3B. BANNER EF3: CẦN BÁC SĨ TỰ XẾP TAY */}
        {manualScheduleItems.length > 0 && (
          <section
            aria-label="Mốc khám cần bác sĩ tự xếp tay"
            className="rounded-2xl border border-rose-200 bg-rose-50/85 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1 text-xs text-rose-950">
              <div className="font-bold text-sm text-rose-900">
                Cần Bác sĩ tự xếp tay (EF3): Có {manualScheduleItems.length} mốc khám định kỳ chưa xếp tự động được
              </div>
              <p>
                Các mốc này bị kín đủ 2/2 khung trong tuần dự kiến. Vui lòng chọn ngày và khung Sáng/Chiều còn trống trực tiếp trên lịch.
              </p>
            </div>
            <Button asChild size="sm" className="rounded-xl text-xs font-semibold shrink-0">
              <Link href="/doctor/timetable/manual-schedule">
                Xem &amp; Xếp tay ({manualScheduleItems.length})
              </Link>
            </Button>
          </section>
        )}

        {/* 4. CALENDAR CONTAINER (NO FILTERS · MONTH / WEEK · 2 SLOTS) */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Lịch làm việc
              </h2>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarAnchorIso(todayIso)}
                  className="h-8 rounded-lg text-xs font-medium px-3"
                >
                  Hôm nay
                </Button>
                <div className="inline-flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Khoảng thời gian trước"
                    onClick={() =>
                      setCalendarAnchorIso((prev) =>
                        viewMode === 'month' ? shiftIsoDate(prev, 0, -1) : shiftIsoDate(prev, -7)
                      )
                    }
                    className="h-8 w-8 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Khoảng thời gian sau"
                    onClick={() =>
                      setCalendarAnchorIso((prev) =>
                        viewMode === 'month' ? shiftIsoDate(prev, 0, 1) : shiftIsoDate(prev, 7)
                      )
                    }
                    className="h-8 w-8 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Button>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums pl-1 min-w-[118px]">
                  {viewMode === 'month'
                    ? formatMonthYearLabel(calendarAnchorIso)
                    : `${weekDays[0].shortDate} – ${weekDays[6].shortDate}`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 text-xs"
                role="group"
                aria-label="Chế độ xem lịch bác sĩ"
              >
                {[
                  { id: 'week', label: 'Tuần' },
                  { id: 'month', label: 'Tháng' },
                ].map((mode) => {
                  const active = viewMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setViewMode(mode.id as 'week' | 'month')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500">
                Định mức: Tối đa 2 gia đình/ngày (Sáng 08:00-11:30 · Chiều 13:30-17:30)
              </span>
            </div>
          </div>

          {loadError ? (
            <div className="p-8 text-center space-y-3">
              <p role="alert" className="text-sm font-medium text-rose-700">
                {loadError}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadTimetableAndRequests()}
              >
                Thử tải lại
              </Button>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Đang tải lịch làm việc của bác sĩ...
            </div>
          ) : viewMode === 'month' ? (
            (() => {
              const monthCells = getMonthGridDays(calendarAnchorIso);
              const weekdayHeaders = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
              const byDate = new Map<string, EncounterItem[]>();
              for (const enc of filteredEncounters) {
                const key = getEncounterDate(enc);
                const list = byDate.get(key) ?? [];
                list.push(enc);
                byDate.set(key, list);
              }

              return (
                <div className="p-3 sm:p-5 overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {weekdayHeaders.map((label) => (
                        <div
                          key={label}
                          className="text-center text-xs font-semibold text-slate-600 py-1"
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {monthCells.map((cell) => {
                        const dayItems = byDate.get(cell.iso) ?? [];
                        const isToday = cell.iso === todayIso;
                        const isPast = cell.iso < todayIso;
                        return (
                          <div
                            key={cell.iso}
                            className={`h-[120px] rounded-xl border p-2 flex flex-col transition-colors ${
                              isToday
                                ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-200/70'
                                : isPast
                                  ? 'border-slate-100 bg-slate-100/70 opacity-60'
                                  : cell.isCurrentMonth
                                    ? 'border-slate-200/80 bg-white hover:border-slate-300'
                                    : 'border-slate-100 bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5 shrink-0">
                              {dayItems.length > 0 ? (
                                <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                                  {dayItems.length} ca
                                </span>
                              ) : (
                                <span />
                              )}
                              <span
                                className={`text-xs font-semibold tabular-nums leading-none ${
                                  isToday
                                    ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#2E37A4] text-white'
                                    : cell.isCurrentMonth
                                      ? 'text-slate-700'
                                      : 'text-slate-300'
                                }`}
                              >
                                {cell.dayNumber}
                              </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                              {dayItems.map((enc) => {
                                const isHome = enc.encounterType === 'HOME_VISIT';
                                const timeStr = getEncounterTime(enc);
                                const bucketLabel =
                                  getSessionBucket(timeStr) === 'morning' ? 'Sáng' : 'Chiều';
                                return (
                                  <button
                                    key={enc.id}
                                    type="button"
                                    onClick={() => setSelectedWeeklyEnc(enc)}
                                    className={`w-full text-left rounded-md border px-2 py-1 text-[11px] font-medium truncate transition-colors cursor-pointer ${
                                      isHome
                                        ? 'bg-sky-50 text-sky-900 border-sky-200/80 hover:bg-sky-100/80'
                                        : 'bg-violet-50 text-violet-900 border-violet-200/80 hover:bg-violet-100/80'
                                    }`}
                                  >
                                    <span className="font-semibold">
                                      {isHome ? bucketLabel : timeStr}
                                    </span>
                                    <span> · </span>
                                    <span>{getPatientLabel(enc)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/40">
                    <th className="w-28 px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">
                      Buổi
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day.iso}
                        className={`px-2 py-2.5 text-center font-semibold border-l border-slate-100 ${
                          day.iso === todayIso ? 'bg-primary/5 text-primary' : 'text-slate-700'
                        }`}
                      >
                        <span className="block text-[11px] uppercase">{day.dayLabel}</span>
                        <span className="block text-xs font-bold tabular-nums">{day.shortDate}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      { key: 'morning', label: 'Sáng', range: '08:00 – 11:30' },
                      { key: 'afternoon', label: 'Chiều', range: '13:30 – 17:30' },
                    ] as const
                  ).map((sess) => (
                    <tr key={sess.key} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3 align-top bg-slate-50/30">
                        <div className="font-bold text-slate-800">{sess.label}</div>
                        <div className="text-[10px] text-slate-400 tabular-nums">{sess.range}</div>
                      </td>
                      {weekDays.map((day) => {
                        const cellItems = filteredEncounters.filter(
                          (enc) =>
                            getEncounterDate(enc) === day.iso &&
                            getSessionBucket(getEncounterTime(enc)) === sess.key
                        );
                        return (
                          <td
                            key={day.iso}
                            className={`p-1.5 align-top border-l border-slate-100 min-h-[76px] ${
                              day.iso === todayIso ? 'bg-primary/[0.02]' : ''
                            }`}
                          >
                            <div className="space-y-1.5">
                              {cellItems.map((enc) => {
                                const isHome = enc.encounterType === 'HOME_VISIT';
                                return (
                                  <button
                                    key={enc.id}
                                    type="button"
                                    onClick={() => setSelectedWeeklyEnc(enc)}
                                    className={`w-full text-left rounded-lg border p-2 transition-colors cursor-pointer ${
                                      isHome
                                        ? 'border-primary/25 bg-primary/5 hover:bg-primary/10'
                                        : 'border-sky-200 bg-sky-50 hover:bg-sky-100/80'
                                    }`}
                                  >
                                    <div className="font-bold text-slate-900 tabular-nums">
                                      {getEncounterTime(enc)} · {isHome ? 'Tại nhà' : 'Video'}
                                    </div>
                                    <div className="text-slate-700 truncate">
                                      {getPatientLabel(enc)}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* DIALOG: CHI TIẾT CA TỪ KHÓA BIỂU TUẦN */}
      <Dialog
        open={Boolean(selectedWeeklyEnc)}
        onOpenChange={(open) => !open && setSelectedWeeklyEnc(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          {selectedWeeklyEnc && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {selectedWeeklyEnc.encounterType === 'HOME_VISIT'
                    ? 'Ca Khám Tại Nhà'
                    : 'Ca Tư Vấn Video'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 tabular-nums">
                  {getEncounterTime(selectedWeeklyEnc)} ·{' '}
                  {formatVnDate(getEncounterDate(selectedWeeklyEnc))}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                  <div>
                    <span className="text-slate-500">Bệnh nhân / Gia đình: </span>
                    <strong className="text-slate-900">{getPatientLabel(selectedWeeklyEnc)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Trạng thái: </span>
                    <strong className="text-slate-900">
                      {getStatusInfo(String(selectedWeeklyEnc.encounterStatus)).label}
                    </strong>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  {selectedWeeklyEnc.encounterType === 'HOME_VISIT' && (
                    <Button asChild size="sm" className="bg-teal-700 hover:bg-teal-800 text-white">
                      <Link href={`/doctor/encounters?encounterId=${selectedWeeklyEnc.id}`}>
                        Mở Workspace Ca khám
                      </Link>
                    </Button>
                  )}
                  {selectedWeeklyEnc.encounterType !== 'HOME_VISIT' && (
                    <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700 text-white">
                      <Link href={`/doctor/telemedicine?encounterId=${selectedWeeklyEnc.id}`}>
                        Vào phòng khám Video
                      </Link>
                    </Button>
                  )}
                  {selectedWeeklyEnc.encounterStatus === 'CONFIRMED' && (
                    <Button asChild size="sm" variant="outline">
                      <Link
                        href={`/doctor/timetable/${selectedWeeklyEnc.id}/reschedule`}
                        onClick={() => setSelectedWeeklyEnc(null)}
                      >
                        Xin đổi lịch
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: BÁC SĨ XIN ĐỔI LỊCH */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          {rescheduleTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Bác sĩ xin đổi lịch khám
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {rescheduleTarget.encounterType === 'TELEHEALTH'
                    ? 'Đổi giờ Tư vấn Video chỉ cần Gia đình đồng ý (2 bên, báo trước tối thiểu 4 giờ).'
                    : 'Đổi lịch Khám tại nhà cần Gia đình và Cơ sở Y tế cùng đồng ý (3 bên, báo trước tối thiểu 4 giờ).'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={(e) => void handleSubmitReschedule(e)} className="space-y-4">
                {rescheduleError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
                  >
                    {rescheduleError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-reschedule-date" className="text-xs font-semibold">
                      Ngày mới
                    </Label>
                    <Input
                      id="doc-reschedule-date"
                      type="date"
                      min={todayIso}
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      required
                      className="h-10 rounded-xl text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="doc-reschedule-time" className="text-xs font-semibold">
                      Giờ mới
                    </Label>
                    <Input
                      id="doc-reschedule-time"
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      required
                      className="h-10 rounded-xl text-xs tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="doc-reschedule-reason" className="text-xs font-semibold">
                    Lý do xin đổi lịch
                  </Label>
                  <Textarea
                    id="doc-reschedule-reason"
                    rows={3}
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Ví dụ: Có ca cấp cứu đột xuất tại bệnh viện..."
                    required
                    className="rounded-xl text-xs resize-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRescheduleTarget(null)}
                    className="flex-1 rounded-xl font-semibold"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingReschedule}
                    className="flex-1 rounded-xl font-semibold"
                  >
                    {submittingReschedule ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
