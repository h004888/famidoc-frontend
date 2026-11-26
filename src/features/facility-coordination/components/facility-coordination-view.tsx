'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DualLaneReconciliationTable } from '@/features/admin-disputes/components/dual-lane-reconciliation-table';
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
} from '@/lib/api/encounters.api';
import { isEncounterActiveToday } from '@/lib/encounter-dual-lane';

interface FacilityScheduleItem {
  id: string;
  encounterType: string;
  patientName: string;
  contractNumber: string;
  assignedDoctor: string;
  rawDate: string;
  rawTime: string;
  address: string;
  rawStatus: string;
  pendingReschedule: EncounterRescheduleRequestItem | null;
}

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

function getSessionLabel(time: string): string {
  const hour = Number.parseInt(time.split(':')[0] || '8', 10);
  if (!Number.isFinite(hour) || hour < 12) return 'Buổi sáng';
  if (hour < 18) return 'Buổi chiều';
  return 'Buổi tối';
}

function getInitials(name: string): string {
  const clean = name.replace(/^(BS\.?|ThS\.?|CKI\.?|CKII\.?)\s*/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'BS';
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

function getStatusBadge(rawStatus: string) {
  switch (rawStatus) {
    case 'CONFIRMED':
      return {
        label: 'Đã xếp lịch',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: 'event_available',
        stepIndex: 0,
      };
    case 'ON_THE_WAY':
      return {
        label: 'Đang di chuyển',
        className: 'bg-sky-50 text-sky-800 border-sky-200',
        icon: 'directions_car',
        stepIndex: 0,
      };
    case 'ARRIVED':
      return {
        label: 'Đã đến · Chờ gia đình XN',
        className: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: 'location_on',
        stepIndex: 1,
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang thăm khám',
        className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        icon: 'stethoscope',
        stepIndex: 2,
      };
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'task_alt',
        stepIndex: 3,
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: 'cancel',
        stepIndex: -1,
      };
    default:
      return {
        label: rawStatus,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: 'schedule',
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

export function FacilityCoordinationView() {
  const [appointments, setAppointments] = useState<FacilityScheduleItem[]>([]);
  const [pendingReschedules, setPendingReschedules] = useState<EncounterRescheduleRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [doctorFilter, setDoctorFilter] = useState<string>('__ALL__');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'LIVE' | 'COMPLETED'>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'weekly'>('timeline');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const [weekAnchorIso, setWeekAnchorIso] = useState(todayIso);
  const [rescheduleTarget, setRescheduleTarget] = useState<FacilityScheduleItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(todayIso);
  const [rescheduleTime, setRescheduleTime] = useState('09:30');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const loadScheduleBoard = useCallback(async () => {
    setLoadError(null);
    try {
      const board = await encountersApi.getFacilityScheduleBoard();
      const mapped: FacilityScheduleItem[] = (board.encounters ?? [])
        .filter((enc: EncounterItem) => enc.encounterType !== 'TELEHEALTH')
        .map((enc: EncounterItem) => {
          const rawTime = enc.scheduledTime?.includes('T')
            ? enc.scheduledTime.slice(11, 16)
            : enc.scheduledTime?.slice(0, 5) || '';
          const repName =
            enc.contract?.familyUnit?.representativeUser?.fullName ||
            enc.contract?.familyUnit?.representativeUser?.name;
          const isFamilyVisit =
            enc.visitScope === 'FAMILY' || (enc.participants && enc.participants.length > 1);
          const patientName = isFamilyVisit
            ? repName
              ? `Hộ ${repName}`
              : 'Toàn bộ gia đình'
            : enc.participants?.[0]?.patient?.fullName ||
              enc.patient?.fullName ||
              (repName ? `Hộ ${repName}` : 'Cả gia đình');
          return {
            id: enc.id,
            encounterType: enc.encounterType,
            patientName,
            contractNumber: enc.contract?.contractNumber || enc.contractId,
            assignedDoctor: enc.doctor?.doctorName || 'Bác sĩ phụ trách',
            rawDate: enc.scheduledDate?.slice(0, 10) ?? '',
            rawTime,
            address:
              enc.contract?.familyUnit?.homeAddress ||
              enc.contract?.familyUnit?.address ||
              'Chưa cập nhật địa chỉ',
            rawStatus: String(enc.encounterStatus || 'CONFIRMED'),
            pendingReschedule:
              (enc.rescheduleRequests ?? []).find((r) => r.status === 'PENDING') ?? null,
          };
        })
        .sort((a, b) => `${a.rawDate} ${a.rawTime}`.localeCompare(`${b.rawDate} ${b.rawTime}`));

      setAppointments(mapped);
      setPendingReschedules(
        (board.pendingRescheduleRequests ?? []).filter(
          (r) => r.status === 'PENDING' && r.facilityDecision === 'PENDING'
        )
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Không thể tải bảng điều phối lịch khám bác sĩ.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScheduleBoard();
  }, [loadScheduleBoard]);

  const doctorOptions = useMemo(() => {
    return Array.from(new Set(appointments.map((a) => a.assignedDoctor))).sort();
  }, [appointments]);

  const isLiveAppointment = useCallback((a: FacilityScheduleItem) => {
    if (['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(a.rawStatus)) {
      return true;
    }
    return (
      a.encounterType === 'HOME_VISIT' &&
      isEncounterActiveToday({
        scheduledDate: a.rawDate,
        encounterStatus: a.rawStatus,
      })
    );
  }, []);

  const counts = useMemo(() => {
    const confirmed = appointments.filter((a) => a.rawStatus === 'CONFIRMED').length;
    const live = appointments.filter(isLiveAppointment).length;
    const completed = appointments.filter((a) => a.rawStatus === 'COMPLETED').length;
    return { all: appointments.length, confirmed, live, completed };
  }, [appointments, isLiveAppointment]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (doctorFilter !== '__ALL__' && apt.assignedDoctor !== doctorFilter) return false;
      if (statusFilter === 'CONFIRMED' && apt.rawStatus !== 'CONFIRMED') return false;
      if (statusFilter === 'LIVE' && !isLiveAppointment(apt)) {
        return false;
      }
      if (statusFilter === 'COMPLETED' && apt.rawStatus !== 'COMPLETED') return false;
      return true;
    });
  }, [appointments, doctorFilter, statusFilter, isLiveAppointment]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, FacilityScheduleItem[]>();
    for (const apt of filteredAppointments) {
      const key = apt.rawDate || 'Chưa xác định ngày';
      const existing = groups.get(key) ?? [];
      existing.push(apt);
      groups.set(key, existing);
    }
    return Array.from(groups.entries());
  }, [filteredAppointments]);

  const handleDecideReschedule = async (
    encounterId: string,
    requestId: string,
    decision: 'APPROVE' | 'REJECT'
  ) => {
    setDecidingId(requestId);
    try {
      await encountersApi.decideRescheduleRequest(encounterId, requestId, { decision });
      toast.success(
        decision === 'APPROVE'
          ? 'CSYT đã đồng ý yêu cầu đổi lịch.'
          : 'CSYT đã từ chối yêu cầu đổi lịch. Lịch cũ được giữ nguyên.'
      );
      await loadScheduleBoard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu đổi lịch.');
    } finally {
      setDecidingId(null);
    }
  };

  const handleOpenFacilityReschedule = (apt: FacilityScheduleItem) => {
    setRescheduleTarget(apt);
    setRescheduleDate(apt.rawDate && apt.rawDate >= todayIso ? apt.rawDate : todayIso);
    setRescheduleTime(apt.rawTime || '09:30');
    setRescheduleReason('');
    setRescheduleError('');
  };

  const handleSubmitFacilityReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    if (!rescheduleReason.trim()) {
      setRescheduleError('Vui lòng nhập lý do điều phối lại lịch khám.');
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
      toast.success('Đã gửi đề xuất đổi lịch tới Gia đình xác nhận.');
      setRescheduleTarget(null);
      await loadScheduleBoard();
    } catch (err) {
      setRescheduleError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi đề xuất đổi lịch. Vui lòng kiểm tra quy định báo trước tối thiểu 4 giờ.'
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

  const weeklyDoctors = useMemo(() => {
    if (doctorFilter !== '__ALL__') return [doctorFilter];
    return doctorOptions.length > 0 ? doctorOptions : ['Đội ngũ bác sĩ'];
  }, [doctorFilter, doctorOptions]);

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-5">
        {/* 1. HEADER & CONTROLS */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Điều Phối Lịch Khám Ngoại Viện Bác Sĩ
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Giám sát tiến độ bác sĩ khám tại nhà, duyệt yêu cầu đổi lịch 3 bên và chủ động điều
              phối lịch tới gia đình.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {doctorOptions.length > 0 && (
              <select
                aria-label="Lọc theo bác sĩ"
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              >
                <option value="__ALL__">Tất cả bác sĩ ({appointments.length})</option>
                {doctorOptions.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadScheduleBoard()}
              className="h-9 rounded-xl text-xs font-semibold gap-1.5 bg-white"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Làm mới</span>
            </Button>
          </div>
        </header>

        {/* 2. COMPACT OPERATIONAL STRIP */}
        <section
          aria-label="Tóm tắt vận hành lịch khám"
          className="rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium ${
                pendingReschedules.length > 0
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-amber-600">
                pending_actions
              </span>
              <span>Chờ duyệt đổi lịch:</span>
              <strong className="tabular-nums font-bold">{pendingReschedules.length}</strong>
            </span>

            <button
              type="button"
              onClick={() => setStatusFilter('LIVE')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-800 font-medium transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-sky-600">
                directions_car
              </span>
              <span>Đang đi / Đang khám:</span>
              <strong className="tabular-nums font-bold">{counts.live}</strong>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CONFIRMED')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-medium transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-600">
                event_available
              </span>
              <span>Đã xếp lịch:</span>
              <strong className="tabular-nums font-bold">{counts.confirmed}</strong>
            </button>
          </div>

          <span className="text-[11px] text-slate-500">
            Chỉ hiển thị các ca khám tại nhà (3 bên)
          </span>
        </section>

        {/* 3. PRIORITY QUEUE: PENDING 3-PARTY HOME_VISIT RESCHEDULES */}
        {pendingReschedules.length > 0 && (
          <section
            aria-label="Yêu cầu đổi lịch chờ CSYT phê duyệt"
            className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-700">
                pending_actions
              </span>
              <h2 className="text-sm font-bold text-amber-950">
                Yêu cầu đổi lịch khám tại nhà chờ CSYT duyệt ({pendingReschedules.length})
              </h2>
            </div>

            <div className="space-y-2.5">
              {pendingReschedules.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-amber-200/90 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-800 border-amber-200 font-semibold"
                      >
                        {req.requestedByRole === 'DOCTOR'
                          ? 'Bác sĩ đề xuất đổi lịch'
                          : 'Gia đình đề xuất đổi lịch'}
                      </Badge>
                      <span className="font-bold text-slate-900 tabular-nums">
                        Đề xuất sang {req.proposedTime?.slice(11, 16) || req.proposedTime?.slice(0, 5)} ·{' '}
                        {formatVnDate(req.proposedDate?.slice(0, 10) || '')}
                      </span>
                    </div>
                    <p className="text-slate-700">{req.reason}</p>
                    <p className="text-[11px] text-slate-500">
                      Đồng thuận 3 bên: Gia đình{' '}
                      {req.familyDecision === 'APPROVED' ? '✓' : '⏳'} · Bác sĩ{' '}
                      {req.doctorDecision === 'APPROVED' ? '✓' : '⏳'} · CSYT (Chờ bạn)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={decidingId === req.id}
                      onClick={() => void handleDecideReschedule(req.encounterId, req.id, 'APPROVE')}
                      className="h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">check</span>
                      <span>Đồng ý đổi lịch</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={decidingId === req.id}
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

        {viewMode === 'timeline' && <DualLaneReconciliationTable />}

        {/* 4. FILTER TABS & VIEW MODE SWITCHER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            {(
              [
                { key: 'ALL', label: `Tất cả (${counts.all})` },
                { key: 'CONFIRMED', label: `Đã xếp lịch (${counts.confirmed})` },
                { key: 'LIVE', label: `Đang đi / Khám (${counts.live})` },
                { key: 'COMPLETED', label: `Hoàn thành (${counts.completed})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                  statusFilter === tab.key
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
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
              <span>Lịch tuần Bác sĩ</span>
            </button>
          </div>
        </div>

        {/* 5. MAIN CONTENT */}
        {loadError ? (
          <Card className="bg-white rounded-2xl border-rose-200 p-8 text-center space-y-3">
            <p role="alert" className="text-sm font-medium text-rose-700">
              {loadError}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadScheduleBoard()}>
              Thử tải lại
            </Button>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Đang tải lịch khám">
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
        ) : filteredAppointments.length === 0 ? (
          <Card className="bg-white rounded-2xl border-slate-200 p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-slate-300">event_note</span>
            <h3 className="text-sm font-bold text-slate-900">
              Chưa có ca khám tại nhà nào trong bộ lọc này
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Các buổi khám tại nhà tự động theo gói hợp đồng 4 bên thuộc cơ sở y tế sẽ hiển thị
              tại đây để điều phối và theo dõi tiến độ.
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
              <table className="w-full min-w-[820px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="w-44 border-r border-slate-200 px-4 py-2.5 text-left text-xs font-semibold text-slate-700">
                      Bác sĩ
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day.iso}
                        className={`border-r border-slate-200 px-3 py-2.5 text-left font-semibold last:border-r-0 ${
                          day.iso === todayIso ? 'bg-primary/5 text-primary' : 'text-slate-700'
                        }`}
                      >
                        <span className="block text-[11px]">{day.dayLabel}</span>
                        <span className="block text-xs font-bold tabular-nums">{day.shortDate}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeklyDoctors.map((docName) => (
                    <tr key={docName} className="border-b border-slate-200 last:border-b-0">
                      <td className="border-r border-slate-200 bg-slate-50/30 px-4 py-3 text-left align-top font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {getInitials(docName)}
                          </span>
                          <span className="leading-snug">{docName}</span>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const cellItems = filteredAppointments.filter(
                          (a) => a.assignedDoctor === docName && a.rawDate === day.iso
                        );
                        return (
                          <td
                            key={day.iso}
                            className={`border-r border-slate-200 p-2 text-left align-top last:border-r-0 min-h-[76px] ${
                              day.iso === todayIso ? 'bg-primary/[0.02]' : ''
                            }`}
                          >
                            <div className="space-y-1.5">
                              {cellItems.map((apt) => {
                                const info = getStatusBadge(apt.rawStatus);
                                return (
                                  <button
                                    key={apt.id}
                                    type="button"
                                    onClick={() => {
                                      if (apt.rawStatus === 'CONFIRMED' && !apt.pendingReschedule) {
                                        handleOpenFacilityReschedule(apt);
                                      }
                                    }}
                                    className={`w-full text-left rounded-lg border p-2 transition-colors ${
                                      apt.rawStatus === 'CONFIRMED' && !apt.pendingReschedule
                                        ? 'border-primary/25 bg-primary/5 hover:bg-primary/10 cursor-pointer'
                                        : 'border-slate-200 bg-slate-50 cursor-default'
                                    }`}
                                  >
                                    <div className="font-bold text-primary tabular-nums">
                                      {apt.rawTime}
                                    </div>
                                    <div className="font-medium text-slate-900 truncate">
                                      {apt.patientName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                      {info.label}
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
                  {dayItems.map((apt) => {
                    const statusInfo = getStatusBadge(apt.rawStatus);
                    return (
                      <Card
                        key={apt.id}
                        className="bg-white rounded-2xl border-slate-200/90 hover:border-slate-300 shadow-2xs transition-colors p-4 sm:p-5 space-y-4"
                      >
                        {/* Top structured grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-[110px_220px_1fr_auto] gap-4 items-center">
                          {/* Column 1: Time */}
                          <div className="flex lg:flex-col items-baseline lg:items-start gap-2 lg:gap-0.5">
                            <span className="text-lg font-bold text-primary tabular-nums">
                              {apt.rawTime}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              {getSessionLabel(apt.rawTime)}
                            </span>
                          </div>

                          {/* Column 2: Doctor */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                              {getInitials(apt.assignedDoctor)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {apt.assignedDoctor}
                              </div>
                              <div className="text-[11px] text-slate-500 tabular-nums truncate">
                                HĐ: {apt.contractNumber}
                              </div>
                            </div>
                          </div>

                          {/* Column 3: Family & Address */}
                          <div className="min-w-0 space-y-1">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {apt.patientName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">
                                location_on
                              </span>
                              <span
                                className={
                                  apt.address === 'Chưa cập nhật địa chỉ'
                                    ? 'text-slate-400'
                                    : 'text-slate-600'
                                }
                              >
                                {apt.address}
                              </span>
                            </div>
                          </div>

                          {/* Column 4: Status & Action */}
                          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.className}`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {statusInfo.icon}
                              </span>
                              <span>{statusInfo.label}</span>
                            </span>

                            {apt.rawStatus === 'CONFIRMED' && !apt.pendingReschedule && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenFacilityReschedule(apt)}
                                className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[15px] text-primary">
                                  edit_calendar
                                </span>
                                <span>Đổi lịch (chỉ cần Gia đình XN)</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Pending reschedule notice */}
                        {apt.pendingReschedule && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-900">
                            <span className="font-semibold">Đang chờ xác nhận đổi lịch: </span>
                            <span>
                              Gia đình{' '}
                              {apt.pendingReschedule.familyDecision === 'APPROVED' ? '✓' : '⏳'} ·
                              Bác sĩ{' '}
                              {apt.pendingReschedule.doctorDecision === 'APPROVED' ? '✓' : '⏳'} ·
                              CSYT{' '}
                              {apt.pendingReschedule.facilityDecision === 'APPROVED' ? '✓' : '⏳'}
                            </span>
                          </div>
                        )}

                        {/* 4-stage arrival & visit progress bar */}
                        {statusInfo.stepIndex >= 0 && (
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

      {/* MODAL: CSYT ĐỀ XUẤT ĐỔI LỊCH (CHỈ CẦN GIA ĐÌNH XÁC NHẬN) */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          {rescheduleTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  CSYT đề xuất đổi lịch khám tại nhà
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Đề xuất này tự động ghi nhận đồng thuận của Bác sĩ &amp; CSYT, chỉ cần Gia đình
                  xác nhận 1 chạm để áp dụng (báo trước tối thiểu 4 giờ).
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={(e) => void handleSubmitFacilityReschedule(e)} className="space-y-4">
                {rescheduleError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
                  >
                    {rescheduleError}
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                  <div className="font-semibold text-slate-900">{rescheduleTarget.patientName}</div>
                  <div className="text-slate-600">
                    Bác sĩ:{' '}
                    <strong className="text-slate-800">{rescheduleTarget.assignedDoctor}</strong>
                  </div>
                  <div className="text-slate-600 tabular-nums">
                    Lịch hiện tại: {rescheduleTarget.rawTime} ·{' '}
                    {formatVnDate(rescheduleTarget.rawDate)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="facility-reschedule-date" className="text-xs font-semibold">
                      Ngày mới
                    </Label>
                    <Input
                      id="facility-reschedule-date"
                      type="date"
                      min={todayIso}
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      required
                      className="h-10 rounded-xl text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="facility-reschedule-time" className="text-xs font-semibold">
                      Giờ mới
                    </Label>
                    <Input
                      id="facility-reschedule-time"
                      type="time"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      required
                      className="h-10 rounded-xl text-xs tabular-nums"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="facility-reschedule-reason" className="text-xs font-semibold">
                    Lý do điều phối
                  </Label>
                  <Textarea
                    id="facility-reschedule-reason"
                    rows={3}
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Ví dụ: Điều chỉnh tuyến khám ngoại viện của bác sĩ..."
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
                    {submittingReschedule ? 'Đang gửi...' : 'Gửi tới Gia đình'}
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