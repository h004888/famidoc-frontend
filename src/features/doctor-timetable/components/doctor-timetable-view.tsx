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

function getSessionBucket(time: string): 'morning' | 'afternoon' | 'evening' {
  const hour = Number.parseInt(time.split(':')[0] || '8', 10);
  if (!Number.isFinite(hour) || hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
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
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(safe);
  monday.setDate(safe.getDate() + diffToMon);
  const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  return labels.map((dayLabel, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return { iso: `${yyyy}-${mm}-${dd}`, dayLabel, shortDate: `${dd}/${mm}` };
  });
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [statusTab, setStatusTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [typeFilter, setTypeFilter] = useState<'all' | 'home' | 'telehealth'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'weekly'>('timeline');

  const todayIso = new Date().toISOString().slice(0, 10);
  const [weekAnchorIso, setWeekAnchorIso] = useState(todayIso);

  const [actionId, setActionId] = useState<string | null>(null);
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
        if (st === 'CANCELLED' || st === 'REQUESTED') return false;
        if (statusTab === 'upcoming' && !isUpcomingStatus(st)) return false;
        if (statusTab === 'completed' && st !== 'COMPLETED') return false;
        const isHome = enc.encounterType === 'HOME_VISIT';
        if (typeFilter === 'home' && !isHome) return false;
        if (typeFilter === 'telehealth' && isHome) return false;
        return true;
      })
      .sort((a, b) =>
        `${getEncounterDate(a)} ${getEncounterTime(a)}`.localeCompare(
          `${getEncounterDate(b)} ${getEncounterTime(b)}`
        )
      );
  }, [encounters, statusTab, typeFilter]);

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

  const handleConfirmTelehealth = async (encounterId: string, confirmed: boolean) => {
    setActionId(encounterId);
    try {
      await encountersApi.confirmEncounter(encounterId, confirmed);
      toast.success(
        confirmed
          ? 'Đã nhận lịch Tư vấn Video. Hệ thống đã đồng bộ với gia đình.'
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

  const weekDays = useMemo(() => getWeekDays(weekAnchorIso), [weekAnchorIso]);
  const shiftWeek = (deltaDays: number) => {
    const d = new Date(`${weekAnchorIso}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    setWeekAnchorIso(d.toISOString().slice(0, 10));
  };

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

        {/* 2. COMPACT OPERATIONAL STRIP */}
        <section
          aria-label="Tóm tắt lịch làm việc"
          className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium ${
                counts.pendingCount > 0
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-amber-600">
                pending_actions
              </span>
              <span>Chờ duyệt (Video / Đổi lịch):</span>
              <strong className="tabular-nums font-bold">{counts.pendingCount}</strong>
            </span>

            <button
              type="button"
              onClick={() => setStatusTab('upcoming')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-primary/5 text-slate-700 hover:text-primary font-medium transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">
                event_upcoming
              </span>
              <span>Sắp tới &amp; Đang khám:</span>
              <strong className="tabular-nums font-bold">{counts.upcoming}</strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('completed')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-medium transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-600">
                task_alt
              </span>
              <span>Đã hoàn thành:</span>
              <strong className="tabular-nums font-bold">{counts.completed}</strong>
            </button>
          </div>

          <span className="text-[11px] text-slate-500">
            Khám tại nhà: Check-in 1 bước · Tư vấn Video: Duyệt 2 bên
          </span>
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
              {pendingTelehealthRequests.map((enc) => (
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
                        {getEncounterTime(enc)} · {formatVnDate(getEncounterDate(enc))}
                      </span>
                      <span className="font-semibold text-slate-800">
                        · {getPatientLabel(enc)}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {enc.cancelReason || enc.subjectiveNote || 'Gia đình đặt lịch Tư vấn Video.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionId === enc.id}
                      onClick={() => void handleConfirmTelehealth(enc.id, true)}
                      className="h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      <span>Nhận lịch Video</span>
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
              ))}

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
                      CSYT: {req.facilityDecision === 'APPROVED' ? 'Đã đồng ý ✓' : 'Đang chờ duyệt'}
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

        {/* 4. UNIFIED CONTROL BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              {(
                [
                  { key: 'upcoming', label: `Sắp tới (${counts.upcoming})` },
                  { key: 'completed', label: `Đã khám (${counts.completed})` },
                  { key: 'all', label: `Tất cả (${counts.all})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                    statusTab === tab.key
                      ? 'bg-primary text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              {(
                [
                  { key: 'all', label: 'Tất cả' },
                  { key: 'home', label: 'Tại nhà' },
                  { key: 'telehealth', label: 'Video' },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTypeFilter(item.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    typeFilter === item.key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_agenda</span>
              <span>Theo ngày</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_view_week</span>
              <span>Khóa biểu tuần</span>
            </button>
          </div>
        </div>

        {/* 5. MAIN CONTENT */}
        {loadError ? (
          <Card className="bg-white rounded-2xl border-rose-200 p-8 text-center space-y-3">
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
          </Card>
        ) : isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Đang tải lịch làm việc">
            {[1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-32 rounded-md bg-slate-200" />
                  <div className="h-5 w-24 rounded-full bg-slate-200" />
                </div>
                <div className="h-4 w-64 rounded-md bg-slate-100" />
                <div className="h-3 w-full rounded-md bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filteredEncounters.length === 0 ? (
          <Card className="bg-white rounded-2xl border-slate-200 p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
            <h3 className="text-sm font-bold text-slate-900">
              Chưa có ca khám nào trong mục này
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Các lịch khám tại nhà tự động theo gói và lịch tư vấn Video đã nhận sẽ hiển thị tại
              đây để bạn check-in và ghi nhận bệnh án.
            </p>
          </Card>
        ) : viewMode === 'weekly' ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => shiftWeek(-7)}
                  className="h-8 px-2.5 text-xs"
                >
                  ← Tuần trước
                </Button>
                <span className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums px-2">
                  Tuần {weekDays[0].shortDate} – {weekDays[6].shortDate}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => shiftWeek(7)}
                  className="h-8 px-2.5 text-xs"
                >
                  Tuần sau →
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWeekAnchorIso(todayIso)}
                className="h-7 px-2 text-xs text-primary"
              >
                Hôm nay
              </Button>
            </div>

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
                      { key: 'morning', label: 'Sáng', range: '07:00 – 12:00' },
                      { key: 'afternoon', label: 'Chiều', range: '13:00 – 17:30' },
                      { key: 'evening', label: 'Tối', range: '18:00 – 21:00' },
                    ] as const
                  ).map((sess) => (
                    <tr key={sess.key} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3 align-top bg-slate-50/30">
                        <div className="font-bold text-slate-800">{sess.label}</div>
                        <div className="text-[10px] text-slate-400 tabular-nums">{sess.range}</div>
                      </td>
                      {weekDays.map((day) => {
                        const cellItems = filteredEncounters.filter((enc) => {
                          return (
                            getEncounterDate(enc) === day.iso &&
                            getSessionBucket(getEncounterTime(enc)) === sess.key
                          );
                        });
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
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDate.map(([dateKey, dayItems]) => (
              <section key={dateKey} className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {formatDayHeading(dateKey, todayIso)}
                  </h2>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {dayItems.length} ca khám
                  </span>
                </div>

                <div className="space-y-3">
                  {dayItems.map((enc) => {
                    const isHome = enc.encounterType === 'HOME_VISIT';
                    const rawStatus = String(enc.encounterStatus || 'CONFIRMED');
                    const statusInfo = getStatusInfo(rawStatus);
                    const timeStr = getEncounterTime(enc);
                    const patientName = getPatientLabel(enc);
                    const pendingReq = (enc.rescheduleRequests ?? []).find(
                      (r) => r.status === 'PENDING'
                    );
                    const addressOrReason = isHome
                      ? enc.contract?.familyUnit?.homeAddress ||
                        enc.contract?.familyUnit?.address ||
                        'Theo địa chỉ hộ gia đình trên hợp đồng'
                      : enc.cancelReason ||
                        enc.subjectiveNote ||
                        'Tư vấn sức khỏe trực tuyến qua Video';

                    return (
                      <Card
                        key={enc.id}
                        className="bg-white rounded-2xl border-slate-200/90 hover:border-slate-300 shadow-2xs transition-colors p-4 sm:p-5 space-y-4"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-[100px_190px_1fr_auto] gap-4 items-center">
                          {/* Column 1: Time */}
                          <div className="flex lg:flex-col items-baseline lg:items-start gap-2 lg:gap-0.5">
                            <span className="text-lg font-bold text-primary tabular-nums">
                              {timeStr}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              {getSessionLabel(getSessionBucket(timeStr))}
                            </span>
                          </div>

                          {/* Column 2: Type & Status */}
                          <div className="space-y-1.5">
                            <Badge
                              variant="outline"
                              className={`gap-1 font-semibold ${
                                isHome
                                  ? 'bg-primary/10 text-primary border-primary/20'
                                  : 'bg-sky-50 text-sky-800 border-sky-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isHome ? 'home_health' : 'videocam'}
                              </span>
                              <span>{isHome ? 'Khám tại nhà' : 'Tư vấn Video'}</span>
                            </Badge>
                            <div>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusInfo.className}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Column 3: Patient & Location/Reason */}
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                              {getInitials(patientName)}
                            </span>
                            <div className="min-w-0 space-y-1">
                              <div className="text-sm font-bold text-slate-900 truncate">
                                {patientName}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">
                                  {isHome ? 'location_on' : 'notes'}
                                </span>
                                <span className="truncate">{addressOrReason}</span>
                              </div>
                            </div>
                          </div>

                          {/* Column 4: Primary & Secondary Actions */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {isHome &&
                              (rawStatus === 'CONFIRMED' || rawStatus === 'ON_THE_WAY') && (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={actionId === enc.id}
                                  onClick={() => void handleMarkArrived(enc.id)}
                                  className="h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    location_on
                                  </span>
                                  <span>Check-in đã đến nhà</span>
                                </Button>
                              )}

                            {isHome && rawStatus === 'IN_PROGRESS' && (
                              <Button
                                asChild
                                size="sm"
                                className="h-9 rounded-xl text-xs font-semibold gap-1.5"
                              >
                                <Link href={`/doctor/encounters?encounterId=${enc.id}`}>
                                  <span className="material-symbols-outlined text-[16px]">
                                    clinical_notes
                                  </span>
                                  <span>Mở bệnh án &amp; Khám</span>
                                </Link>
                              </Button>
                            )}

                            {!isHome &&
                              (rawStatus === 'CONFIRMED' || rawStatus === 'IN_PROGRESS') && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-9 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold gap-1.5"
                                >
                                  <Link href={`/doctor/telemedicine?encounterId=${enc.id}`}>
                                    <span className="material-symbols-outlined text-[16px]">
                                      videocam
                                    </span>
                                    <span>Vào phòng khám Video</span>
                                  </Link>
                                </Button>
                              )}

                            {rawStatus === 'CONFIRMED' && !pendingReq && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRescheduleModal(enc)}
                                className="h-9 rounded-xl text-xs font-semibold"
                              >
                                Xin đổi lịch
                              </Button>
                            )}

                            {rawStatus === 'COMPLETED' && (
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-xl text-xs font-semibold"
                              >
                                <Link href={`/doctor/encounters?encounterId=${enc.id}`}>
                                  Xem lại hồ sơ
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>

                        {pendingReq && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-900">
                            <span className="font-semibold">Đang chờ duyệt đổi lịch: </span>
                            <span>
                              Gia đình {pendingReq.familyDecision === 'APPROVED' ? '✓' : '⏳'} · Bác
                              sĩ {pendingReq.doctorDecision === 'APPROVED' ? '✓' : '⏳'}
                              {isHome &&
                                ` · CSYT ${pendingReq.facilityDecision === 'APPROVED' ? '✓' : '⏳'}`}
                            </span>
                          </div>
                        )}

                        {isHome && statusInfo.stepIndex >= 0 && (
                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px]">
                            <span className="font-semibold text-slate-500 mr-1">
                              Tiến độ thực địa:
                            </span>
                            {PROGRESS_STEPS.map((st, index) => {
                              const isDone = statusInfo.stepIndex > st.step;
                              const isCurrent = statusInfo.stepIndex === st.step;
                              return (
                                <React.Fragment key={st.step}>
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      isCurrent
                                        ? 'text-primary font-bold'
                                        : isDone
                                          ? 'text-emerald-700'
                                          : 'text-slate-400'
                                    }`}
                                  >
                                    <span
                                      className={`h-2 w-2 rounded-full ${
                                        isCurrent
                                          ? 'bg-primary'
                                          : isDone
                                            ? 'bg-emerald-600'
                                            : 'bg-slate-200'
                                      }`}
                                    />
                                    <span>{st.label}</span>
                                  </span>
                                  {index < PROGRESS_STEPS.length - 1 && (
                                    <span aria-hidden="true" className="text-slate-300">
                                      —
                                    </span>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
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
                  {selectedWeeklyEnc.encounterType === 'HOME_VISIT' &&
                    selectedWeeklyEnc.encounterStatus === 'CONFIRMED' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const id = selectedWeeklyEnc.id;
                          setSelectedWeeklyEnc(null);
                          void handleMarkArrived(id);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Check-in đã đến nhà
                      </Button>
                    )}
                  {selectedWeeklyEnc.encounterType === 'HOME_VISIT' &&
                    selectedWeeklyEnc.encounterStatus === 'IN_PROGRESS' && (
                      <Button asChild size="sm">
                        <Link href={`/doctor/encounters?encounterId=${selectedWeeklyEnc.id}`}>
                          Mở bệnh án &amp; Khám
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
