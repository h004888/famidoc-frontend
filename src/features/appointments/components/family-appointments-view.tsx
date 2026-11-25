'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { contractsApi } from '@/lib/api/contracts.api';
import {
  encountersApi,
  type EncounterItem,
  type EncounterRescheduleRequestItem,
} from '@/lib/api/encounters.api';
import { patientsApi, type PatientDto } from '@/lib/api/patients.api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  canFamilyConfirmAttendance,
  deriveDualLaneState,
  formatEncounterTime,
} from '@/lib/encounter-dual-lane';
import { FamilyVisitConfirmModal } from './family-visit-confirm-modal';

interface Appointment {
  id: string;
  type: 'home' | 'telehealth';
  category: 'PERIODIC_ROUTINE' | 'AD_HOC_ON_DEMAND' | string;
  patientId?: string;
  patientName: string;
  doctorName: string;
  hospital: string;
  date: string;
  displayDate: string;
  time: string;
  status:
    | 'requested'
    | 'confirmed'
    | 'on_the_way'
    | 'arrived'
    | 'in_progress'
    | 'completed'
    | 'cancelled';
  rawStatus: string;
  chiefComplaint: string;
  address?: string;
  pendingReschedule?: EncounterRescheduleRequestItem | null;
}

function formatVnDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const [yyyy, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function getSessionBucket(time: string): 'morning' | 'afternoon' {
  const hour = Number.parseInt(time.split(':')[0] || '8', 10);
  if (!Number.isFinite(hour) || hour < 12) return 'morning';
  return 'afternoon';
}

function getSessionLabel(bucket: 'morning' | 'afternoon'): string {
  return bucket === 'morning' ? 'Sáng' : 'Chiều';
}

function getWeekDays(anchorIso: string): { iso: string; dayLabel: string; shortDate: string }[] {
  const base = new Date(`${anchorIso}T00:00:00`);
  const safe = Number.isNaN(base.getTime()) ? new Date() : base;
  const day = safe.getDay();
  const diffToSun = -day;
  const sunday = new Date(safe);
  sunday.setDate(safe.getDate() + diffToSun);
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

  const startOffset = firstOfMonth.getDay(); // 0 = Sun
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
  if (deltaMonths !== 0) {
    safe.setMonth(safe.getMonth() + deltaMonths);
  }
  if (deltaDays !== 0) {
    safe.setDate(safe.getDate() + deltaDays);
  }
  const yyyy = safe.getFullYear();
  const mm = String(safe.getMonth() + 1).padStart(2, '0');
  const dd = String(safe.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getCalendarPillStyle(apt: Appointment): string {
  if (apt.status === 'completed') {
    return 'bg-slate-100 text-slate-600 border-slate-200/80 hover:bg-slate-200/70';
  }
  if (apt.status === 'requested') {
    return 'bg-amber-50 text-amber-900 border-amber-200/80 hover:bg-amber-100/80';
  }
  if (apt.status === 'arrived' || apt.status === 'in_progress') {
    return 'bg-emerald-50 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100/80';
  }
  if (apt.type === 'telehealth') {
    return 'bg-violet-50 text-violet-900 border-violet-200/80 hover:bg-violet-100/80';
  }
  return 'bg-sky-50 text-sky-900 border-sky-200/80 hover:bg-sky-100/80';
}

function formatTimelineDayHeading(isoDate: string, todayIso: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  const weekdayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const wd = weekdayNames[parsed.getDay()];
  const formatted = formatVnDate(isoDate);
  if (isoDate === todayIso) return `Hôm nay · ${wd}, ${formatted}`;
  return `${wd}, ${formatted}`;
}

function mapEncounterToAppointment(item: EncounterItem): Appointment {
  const repName =
    item.contract?.familyUnit?.representativeUser?.fullName ||
    item.contract?.familyUnit?.representativeUser?.name;
  const isFamilyVisit =
    item.visitScope === 'FAMILY' || (item.participants && item.participants.length > 1);
  const participantNames = isFamilyVisit
    ? repName
      ? `Hộ ${repName}`
      : 'Toàn bộ gia đình'
    : item.participants?.[0]?.patient?.fullName ||
      item.patient?.fullName ||
      (repName ? `Hộ ${repName}` : 'Thành viên gia đình');
  const patientId = item.patientId || item.participants?.[0]?.patientId;
  const dateStr = item.scheduledDate ? item.scheduledDate.slice(0, 10) : '';
  const timeStr = item.scheduledTime?.includes('T')
    ? item.scheduledTime.slice(11, 16)
    : item.scheduledTime?.slice(0, 5) || '';
  const rawStatus = String(item.encounterStatus || 'CONFIRMED');
  const statusMap: Record<string, Appointment['status']> = {
    CONFIRMED: 'confirmed',
    REQUESTED: 'requested',
    ON_THE_WAY: 'on_the_way',
    ARRIVED: 'arrived',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    WRAP_UP: 'completed',
    NO_SHOW: 'cancelled',
  };
  const isHome = item.encounterType !== 'TELEHEALTH' && item.encounterType !== 'TELEMEDICINE';
  const resolvedAddress = isHome
    ? item.contract?.familyUnit?.homeAddress ||
      item.contract?.familyUnit?.address ||
      item.patient?.address ||
      undefined
    : undefined;
  const pendingReschedule =
    (item.rescheduleRequests ?? []).find((r) => r.status === 'PENDING') ?? null;

  return {
    id: item.id,
    type: isHome ? 'home' : 'telehealth',
    category: item.category || 'PERIODIC_ROUTINE',
    patientId,
    patientName: participantNames,
    doctorName: item.doctor?.doctorName || 'Bác sĩ phụ trách',
    hospital: item.doctor?.facility?.facilityName || 'Cơ sở y tế đối tác',
    date: dateStr,
    displayDate: formatVnDate(dateStr),
    time: timeStr,
    status: statusMap[rawStatus] ?? 'confirmed',
    rawStatus,
    chiefComplaint:
      item.subjectiveNote?.trim() ||
      (item.category === 'PERIODIC_ROUTINE'
        ? 'Khám định kỳ gia đình theo gói chăm sóc'
        : 'Khám theo nhu cầu gia đình'),
    address: resolvedAddress,
    pendingReschedule,
  };
}

export function FamilyAppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rawEncounters, setRawEncounters] = useState<EncounterItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    encounter: EncounterItem;
    mode: 'ARRIVED' | 'NO_SHOW';
  } | null>(null);
  const [pendingReschedules, setPendingReschedules] = useState<EncounterRescheduleRequestItem[]>(
    []
  );
  const [outgoingReschedules, setOutgoingReschedules] = useState<EncounterRescheduleRequestItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [quotas, setQuotas] = useState<{
    home: number;
    totalHome: number;
    telehealth: number;
    totalTelehealth: number;
    videoPolicy: string;
    quotaPeriod: string;
    packageName: string;
    endDate: string;
  }>({
    home: 0,
    totalHome: 0,
    telehealth: 0,
    totalTelehealth: 0,
    videoPolicy: 'FIXED',
    quotaPeriod: 'PER_TERM',
    packageName: '',
    endDate: '',
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<PatientDto[]>([]);
  const [confirmingArrivalId, setConfirmingArrivalId] = useState<string | null>(null);
  const [decidingRescheduleId, setDecidingRescheduleId] = useState<string | null>(null);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  const [memberFilter, setMemberFilter] = useState<string>('__ALL__');
  const [selectedTimetableApt, setSelectedTimetableApt] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const [calendarAnchorIso, setCalendarAnchorIso] = useState(todayIso);
  const [mobileSelectedDate, setMobileSelectedDate] = useState(todayIso);
  const [rescheduleDate, setRescheduleDate] = useState(todayIso);
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleError, setRescheduleError] = useState('');
  const [activeContractId, setActiveContractId] = useState('');
  const [telehealthModalOpen, setTelehealthModalOpen] = useState(false);
  const [telehealthPatientId, setTelehealthPatientId] = useState('');
  const [telehealthDate, setTelehealthDate] = useState(todayIso);
  const [telehealthTime, setTelehealthTime] = useState('09:00');
  const [telehealthReason, setTelehealthReason] = useState('');
  const [telehealthError, setTelehealthError] = useState('');
  const [submittingTelehealth, setSubmittingTelehealth] = useState(false);

  const loadTimetable = useCallback(async () => {
    setLoadError(null);
    try {
      const [res, pendingList] = await Promise.all([
        encountersApi.getFamilyTimetable({ pageSize: 50 }),
        encountersApi.getPendingRescheduleRequests().catch(() => []),
      ]);
      if (Array.isArray(res.data)) {
        setRawEncounters(res.data);
        setAppointments(res.data.map(mapEncounterToAppointment));
      }
      setPendingReschedules(
        (pendingList ?? []).filter(
          (r) => r.status === 'PENDING' && r.familyDecision === 'PENDING'
        )
      );
      setOutgoingReschedules(
        (pendingList ?? []).filter(
          (r) => r.status === 'PENDING' && r.familyDecision === 'APPROVED'
        )
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không thể tải danh sách lịch hẹn khám.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimetable();
    contractsApi
      .getFamilyGateStatus()
      .then(async (gate) => {
        if (gate?.activeContract) {
          setActiveContractId(gate.activeContract.id);
          try {
            const detail = await contractsApi.getMedicalContractDetail(gate.activeContract.id);
            setQuotas({
              home: detail?.remainingHomeVisits ?? 0,
              totalHome: detail?.servicePackage?.periodicVisitsQuota ?? 0,
              telehealth: detail?.remainingTelehealth ?? 0,
              totalTelehealth: detail?.servicePackage?.telehealthQuota ?? 0,
              videoPolicy: detail?.servicePackage?.videoQuotaPolicy ?? 'FIXED',
              quotaPeriod: detail?.servicePackage?.quotaPeriod ?? 'PER_TERM',
              packageName: detail?.servicePackage?.packageName ?? '',
              endDate: detail?.endDate ? detail.endDate.slice(0, 10) : '',
            });
          } catch {
            // Keep default quotas if detail fetch fails
          }
        }
      })
      .catch(() => {});

    patientsApi
      .getFamilyMembers()
      .then((res) => {
        const list = Array.isArray(res) ? res : ((res as { data?: PatientDto[] })?.data ?? []);
        if (Array.isArray(list)) {
          const activeMembers = list.filter((p: PatientDto) => !p.status || p.status === 'ACTIVE');
          setFamilyMembers(activeMembers);
          if (activeMembers[0]?.id) {
            setTelehealthPatientId((prev) => prev || activeMembers[0].id);
          }
        }
      })
      .catch(() => {});
  }, [loadTimetable]);

  const handleConfirmArrival = async (encounterId: string) => {
    setConfirmingArrivalId(encounterId);
    try {
      await encountersApi.confirmArrival(encounterId);
      toast.success('Đã xác nhận bác sĩ có mặt tại nhà. Buổi khám đang diễn ra.');
      await loadTimetable();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xác nhận bác sĩ có mặt.');
    } finally {
      setConfirmingArrivalId(null);
    }
  };

  const handleDecideReschedule = async (
    encounterId: string,
    requestId: string,
    decision: 'APPROVE' | 'REJECT'
  ) => {
    setDecidingRescheduleId(requestId);
    try {
      await encountersApi.decideRescheduleRequest(encounterId, requestId, { decision });
      toast.success(
        decision === 'APPROVE'
          ? 'Đã đồng ý đề xuất đổi lịch.'
          : 'Đã giữ nguyên lịch khám cũ.'
      );
      await loadTimetable();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể phản hồi yêu cầu đổi lịch.');
    } finally {
      setDecidingRescheduleId(null);
    }
  };

  const handleWithdrawReschedule = async (encounterId: string, requestId: string) => {
    setDecidingRescheduleId(requestId);
    try {
      await encountersApi.withdrawRescheduleRequest(encounterId, requestId);
      toast.success('Đã thu hồi đề xuất đổi lịch. Lịch khám cũ vẫn được giữ nguyên.');
      await loadTimetable();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thu hồi đề xuất đổi lịch.');
    } finally {
      setDecidingRescheduleId(null);
    }
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleTarget(apt);
    setRescheduleDate(apt.date || todayIso);
    setRescheduleTime(apt.time || '14:00');
    setRescheduleError('');
    setRescheduleReason('');
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduleError('');
    setSubmittingReschedule(true);
    try {
      await encountersApi.requestReschedule(rescheduleTarget.id, {
        proposedDate: rescheduleDate,
        proposedTime: rescheduleTime,
        rescheduleReason:
          rescheduleReason.trim() || 'Gia đình đề xuất đổi sang khung giờ thuận tiện hơn',
      });
      await loadTimetable();
      toast.success(
        rescheduleTarget.type === 'telehealth'
          ? `Đã gửi yêu cầu đổi giờ Tư vấn Video sang ${rescheduleTime} ngày ${formatVnDate(rescheduleDate)} tới Bác sĩ.`
          : `Đã gửi yêu cầu đổi lịch sang ${rescheduleTime} ngày ${formatVnDate(rescheduleDate)} tới Bác sĩ và Cơ sở y tế.`
      );
      setRescheduleTarget(null);
    } catch (err) {
      setRescheduleError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi yêu cầu dời lịch. Vui lòng kiểm tra quy định báo trước tối thiểu 4 giờ.'
      );
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleSubmitTelehealth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContractId) {
      setTelehealthError('Không tìm thấy hợp đồng đang hoạt động để đặt lịch.');
      return;
    }
    if (!telehealthReason.trim()) {
      setTelehealthError('Vui lòng mô tả lý do hoặc triệu chứng cần bác sĩ tư vấn.');
      return;
    }
    setTelehealthError('');
    setSubmittingTelehealth(true);
    try {
      await encountersApi.createAdHocEncounter({
        contractId: activeContractId,
        patientId: telehealthPatientId || undefined,
        encounterType: 'TELEHEALTH',
        desiredDate: telehealthDate,
        desiredTime: telehealthTime,
        reason: telehealthReason.trim(),
      });
      await loadTimetable();
      toast.success('Đã gửi yêu cầu Tư vấn Video tới Bác sĩ phụ trách.');
      setTelehealthReason('');
      setTelehealthModalOpen(false);
    } catch (err) {
      setTelehealthError(
        err instanceof Error ? err.message : 'Không thể gửi yêu cầu Tư vấn Video.'
      );
    } finally {
      setSubmittingTelehealth(false);
    }
  };

  const canBookTelehealth =
    Boolean(activeContractId) &&
    (quotas.videoPolicy === 'UNLIMITED' ||
      quotas.videoPolicy === 'CONTRACT' ||
      quotas.telehealth > 0);

  const isActiveVisitStatus = (s: Appointment['status']) =>
    s === 'requested' ||
    s === 'confirmed' ||
    s === 'on_the_way' ||
    s === 'arrived' ||
    s === 'in_progress';

  const filteredAppointments = appointments
    .filter((apt) => {
      if (activeTab === 'upcoming' && !isActiveVisitStatus(apt.status)) return false;
      if (activeTab === 'completed' && apt.status !== 'completed') return false;
      if (memberFilter !== '__ALL__' && apt.patientId !== memberFilter) return false;
      return true;
    })
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const arrivedEncounters = appointments.filter((a) => a.status === 'arrived');
  const onTheWayEncounters = appointments.filter((a) => a.status === 'on_the_way');
  const upcomingCount = appointments.filter((a) => isActiveVisitStatus(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-5">
        {/* 1. COMPACT HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              Lịch Hẹn Khám Gia Đình
            </h1>
            {quotas.packageName && (
              <p className="text-xs text-slate-500">
                Gói đang sử dụng:{' '}
                <span className="font-semibold text-slate-700">{quotas.packageName}</span>
                {quotas.endDate ? ` · HSD: ${formatVnDate(quotas.endDate)}` : ''}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {canBookTelehealth ? (
              <Button asChild size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
                <Link href="/family/appointments/book-video">
                  <span className="material-symbols-outlined text-[16px]">video_call</span>
                  <span>+ Đặt Tư vấn Video</span>
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled
                className="rounded-xl text-xs font-semibold gap-1.5"
                title="Hết lượt Tư vấn Video trong gói hoặc chưa có hợp đồng hoạt động"
              >
                <span className="material-symbols-outlined text-[16px]">video_call</span>
                <span>+ Đặt Tư vấn Video</span>
              </Button>
            )}

            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5">
              <Link href="/family/telemedicine">
                <span className="material-symbols-outlined text-[16px] text-sky-600">videocam</span>
                <span>Phòng khám Video</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* 2. COMPACT QUOTA STRIP */}
        <section
          aria-label="Hạn mức gói khám"
          className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-primary">home_health</span>
              <span className="text-slate-600">Khám tại nhà:</span>
              <strong
                className={`tabular-nums font-bold ${
                  quotas.home === 0 ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {quotas.totalHome > 0
                  ? `${quotas.home}/${quotas.totalHome} lượt còn lại`
                  : `${quotas.home} lượt còn lại`}
              </strong>
            </div>

            <span aria-hidden="true" className="hidden sm:inline text-slate-300">
              •
            </span>

            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-sky-600">videocam</span>
              <span className="text-slate-600">Tư vấn Video:</span>
              {quotas.videoPolicy === 'UNLIMITED' ? (
                <strong className="font-bold text-emerald-700">Không giới hạn</strong>
              ) : quotas.videoPolicy === 'CONTRACT' ? (
                <strong className="font-bold text-emerald-700">Theo hợp đồng</strong>
              ) : (
                <strong className="tabular-nums font-bold text-slate-900">
                  {quotas.totalTelehealth > 0
                    ? `${quotas.telehealth}/${quotas.totalTelehealth} lượt còn lại`
                    : `${quotas.telehealth} lượt còn lại`}
                </strong>
              )}
            </div>
          </div>

          <span className="text-[11px] text-slate-500">
            Khám tại nhà: tự động theo gói · Tư vấn Video: đặt theo nhu cầu
          </span>
        </section>

        {/* 3. PRIORITY ACTION BANNERS (1-Tap Arrival Confirmation + Tripartite Reschedule Decisions) */}
        {(arrivedEncounters.length > 0 ||
          onTheWayEncounters.length > 0 ||
          pendingReschedules.length > 0 ||
          outgoingReschedules.length > 0) && (
          <section aria-label="Việc cần xác nhận ngay" className="space-y-3">
            {outgoingReschedules.map((req) => {
              const newDate = formatVnDate(req.proposedDate.slice(0, 10));
              const newTime = req.proposedTime.includes('T')
                ? req.proposedTime.slice(11, 16)
                : req.proposedTime.slice(0, 5);
              const hour = Number.parseInt(newTime.split(':')[0] || '8', 10);
              const slotLabel =
                hour < 12 ? 'Khung Sáng (08:00 - 11:30)' : 'Khung Chiều (13:30 - 17:30)';
              return (
                <div
                  key={`outgoing-${req.id}`}
                  className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-950"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-sky-900">
                      <span className="material-symbols-outlined text-[18px] text-sky-700">
                        hourglass_top
                      </span>
                      <span>Đang chờ Bác sĩ duyệt đề xuất đổi lịch</span>
                    </div>
                    <p>
                      Đổi sang: <strong className="tabular-nums">{newDate}</strong> ·{' '}
                      <strong>{slotLabel}</strong>
                    </p>
                    <p className="text-sky-800">
                      Tiến độ: Gia đình ✓ · Bác sĩ ⏳ (tạm giữ khung tối đa 24 giờ){' '}
                      {req.reason ? `· Lý do: ${req.reason}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={decidingRescheduleId === req.id}
                    onClick={() => void handleWithdrawReschedule(req.encounterId, req.id)}
                    className="h-8 rounded-xl border-sky-300 bg-white text-sky-900 hover:bg-sky-100 text-xs font-semibold shrink-0"
                  >
                    {decidingRescheduleId === req.id ? 'Đang thu hồi...' : 'Thu hồi đề xuất'}
                  </Button>
                </div>
              );
            })}
            {pendingReschedules.map((req) => {
              const initiatorLabel =
                req.requestedByRole === 'HEALTHCARE_FACILITY'
                  ? 'Cơ sở y tế'
                  : req.requestedByRole === 'DOCTOR'
                    ? 'Bác sĩ phụ trách'
                    : 'Gia đình';
              const newDate = formatVnDate(req.proposedDate.slice(0, 10));
              const newTime = req.proposedTime.includes('T')
                ? req.proposedTime.slice(11, 16)
                : req.proposedTime.slice(0, 5);
              return (
                <div
                  key={`resched-${req.id}`}
                  className="rounded-2xl border border-amber-300 bg-amber-50/85 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">
                        edit_calendar
                      </span>
                      <span>
                        {initiatorLabel} đề xuất đổi lịch sang {newTime} ngày {newDate}
                      </span>
                    </div>
                    <p className="text-amber-900">Lý do: {req.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={decidingRescheduleId === req.id}
                      onClick={() =>
                        void handleDecideReschedule(req.encounterId, req.id, 'APPROVE')
                      }
                      className="h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                    >
                      Đồng ý lịch mới
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={decidingRescheduleId === req.id}
                      onClick={() =>
                        void handleDecideReschedule(req.encounterId, req.id, 'REJECT')
                      }
                      className="h-9 rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-100 text-xs font-semibold"
                    >
                      Giữ lịch cũ
                    </Button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* 3B. DANH SÁCH CA KHÁM 2 LÀN (3 TAB RÕ VIỆC CẦN LÀM) */}
        {(() => {
          const now = new Date();
          const enriched = rawEncounters.map((enc) => ({
            enc,
            lane: deriveDualLaneState(enc, now),
            canConfirm: canFamilyConfirmAttendance(enc, now),
          }));
          const todayOrNeedConfirm = enriched.filter(
            (x) =>
              x.lane.reconciledStatus === 'ACTIVE' ||
              x.lane.reconciledStatus === 'PENDING_RECORD' ||
              x.canConfirm,
          );
          const upcomingList = enriched.filter((x) => x.lane.reconciledStatus === 'UPCOMING');
          const historyList = enriched.filter(
            (x) =>
              x.lane.reconciledStatus === 'COMPLETED' ||
              x.lane.reconciledStatus === 'DISPUTED' ||
              x.lane.reconciledStatus === 'CANCELLED',
          );

          const renderEncounterCard = (item: (typeof enriched)[number]) => {
            const { enc, lane, canConfirm } = item;
            const doctorName =
              enc.doctor?.doctorName || enc.doctor?.user?.name || 'Bác sĩ phụ trách';
            const dateLabel = formatVnDate(String(enc.scheduledDate || '').slice(0, 10));
            const timeLabel = formatEncounterTime(enc.scheduledTime);
            const isHome =
              String(enc.encounterType || '').toUpperCase() === 'HOME_VISIT';
            return (
              <Card key={enc.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900">
                    {dateLabel} • {timeLabel} • {isHome ? 'Khám tại nhà' : 'Khám trực tuyến'}
                  </div>
                  <Badge variant="outline">{lane.familyStatusLabel}</Badge>
                </div>
                <p className="text-sm text-slate-700">Bác sĩ: {doctorName}</p>
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
                  <div>
                    <span className="font-semibold">Phía Gia đình:</span>{' '}
                    {!isHome
                      ? 'Khám trực tuyến qua phòng Video'
                      : lane.familyReportedNoShow
                        ? 'Đã báo không đến'
                        : lane.familyConfirmed
                          ? 'Đã xác nhận bác sĩ có đến'
                          : canConfirm
                            ? 'Chờ xác nhận bác sĩ có đến không'
                            : 'Chưa đến giờ xác nhận'}
                  </div>
                  <div>
                    <span className="font-semibold">Phía Bác sĩ:</span>{' '}
                    {lane.hasFinalizedRecord
                      ? 'Đã gửi hồ sơ khám'
                      : lane.familyReportedNoShow
                        ? 'Đang kiểm tra sự cố'
                        : 'Chưa gửi hồ sơ khám'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canConfirm && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-700 text-white hover:bg-emerald-800"
                        onClick={() => setConfirmModal({ encounter: enc, mode: 'ARRIVED' })}
                      >
                        Bác sĩ ĐÃ ĐẾN
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => setConfirmModal({ encounter: enc, mode: 'NO_SHOW' })}
                      >
                        Bác sĩ KHÔNG ĐẾN
                      </Button>
                    </>
                  )}
                  {lane.hasFinalizedRecord && !lane.familyReportedNoShow && (
                    <Link
                      href="/family/prescriptions"
                      className="inline-flex h-8 items-center rounded-lg border border-teal-300 bg-teal-50 px-3 text-xs font-semibold text-teal-900 hover:bg-teal-100"
                    >
                      Xem kết quả &amp; Đơn thuốc
                    </Link>
                  )}
                </div>
              </Card>
            );
          };

          return (
            <section aria-label="Danh sách ca khám theo trạng thái" className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
              <Tabs defaultValue="today" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="today">
                    Hôm nay / Cần xác nhận ({todayOrNeedConfirm.length})
                  </TabsTrigger>
                  <TabsTrigger value="upcoming">Sắp tới ({upcomingList.length})</TabsTrigger>
                  <TabsTrigger value="history">Đã hoàn tất ({historyList.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="space-y-3">
                  {todayOrNeedConfirm.length === 0 ? (
                    <p className="text-sm text-slate-600">Không có ca khám nào cần xác nhận hôm nay.</p>
                  ) : (
                    todayOrNeedConfirm.map(renderEncounterCard)
                  )}
                </TabsContent>
                <TabsContent value="upcoming" className="space-y-3">
                  {upcomingList.length === 0 ? (
                    <p className="text-sm text-slate-600">Chưa có lịch khám sắp tới.</p>
                  ) : (
                    upcomingList.map(renderEncounterCard)
                  )}
                </TabsContent>
                <TabsContent value="history" className="space-y-3">
                  {historyList.length === 0 ? (
                    <p className="text-sm text-slate-600">Chưa có lịch sử ca khám.</p>
                  ) : (
                    historyList.map(renderEncounterCard)
                  )}
                </TabsContent>
              </Tabs>
              <FamilyVisitConfirmModal
                open={confirmModal !== null}
                mode={confirmModal?.mode ?? 'ARRIVED'}
                encounter={confirmModal?.encounter ?? null}
                onClose={() => setConfirmModal(null)}
                onCompleted={() => {
                  setConfirmModal(null);
                  void loadTimetable();
                }}
              />
            </section>
          );
        })()}

        {/* 4. CALENDAR & TIMELINE VIEW */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {/* Calendar Top Bar (matching reference Calendar layout) */}
          <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Lịch khám
                </h2>
              </div>

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
                    : (() => {
                        const wd = getWeekDays(calendarAnchorIso);
                        return `${wd[0].shortDate} – ${wd[6].shortDate}`;
                      })()}
                </span>
              </div>
            </div>

            {/* Calendar Sub-Toolbar: Week | Month */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 text-xs"
                role="group"
                aria-label="Chế độ xem lịch"
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

              <div className="flex flex-wrap items-center gap-2" />
            </div>
          </div>

          {loadError ? (
            <div className="p-8 text-center space-y-3">
              <p role="alert" className="text-sm font-medium text-rose-700">
                {loadError}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadTimetable()}>
                Thử tải lại
              </Button>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-xs font-medium text-slate-500">Đang tải lịch khám gia đình...</p>
            </div>
          ) : viewMode === 'month' ? (
            /* MONTH CALENDAR GRID (Sun - Sat) */
            (() => {
              const monthCells = getMonthGridDays(calendarAnchorIso);
              const weekdayHeaders = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
              const byDate = new Map<string, Appointment[]>();
              for (const apt of filteredAppointments) {
                const list = byDate.get(apt.date) ?? [];
                list.push(apt);
                byDate.set(apt.date, list);
              }

              const selectedDayApts = byDate.get(mobileSelectedDate) ?? [];

              return (
                <>
                  {/* MOBILE: Compact Month Grid + Selected-Day Agenda (no horizontal scroll) */}
                  <div className="md:hidden p-3 space-y-4">
                    <div data-testid="mobile-month-calendar" className="space-y-1.5">
                      <div className="grid grid-cols-7 gap-1">
                        {weekdayHeaders.map((label) => (
                          <div
                            key={label}
                            className="text-center text-[11px] font-semibold text-slate-500 py-1"
                          >
                            {label}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {monthCells.map((cell) => {
                          const dayApts = byDate.get(cell.iso) ?? [];
                          const isToday = cell.iso === todayIso;
                          const isSelected = cell.iso === mobileSelectedDate;
                          const hasHome = dayApts.some((a) => a.type === 'home');
                          const hasVideo = dayApts.some((a) => a.type === 'telehealth');
                          return (
                            <button
                              key={cell.iso}
                              type="button"
                              onClick={() => setMobileSelectedDate(cell.iso)}
                              className={`h-11 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'border-[#2E37A4] bg-indigo-50/70 ring-1 ring-[#2E37A4]/30'
                                  : isToday
                                    ? 'border-indigo-300 bg-indigo-50/20'
                                    : cell.isCurrentMonth
                                      ? 'border-slate-200/80 bg-white'
                                      : 'border-slate-100 bg-slate-50/60 opacity-50'
                              }`}
                            >
                              <span
                                className={`text-xs font-semibold tabular-nums leading-none ${
                                  isToday
                                    ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2E37A4] text-white text-[11px]'
                                    : isSelected
                                      ? 'text-[#2E37A4]'
                                      : cell.isCurrentMonth
                                        ? 'text-slate-800'
                                        : 'text-slate-400'
                                }`}
                              >
                                {cell.dayNumber}
                              </span>
                              <div className="flex items-center justify-center gap-0.5 h-1.5">
                                {hasHome && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                )}
                                {hasVideo && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div data-testid="mobile-agenda-list" className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {formatTimelineDayHeading(mobileSelectedDate, todayIso)}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {selectedDayApts.length} lịch hẹn
                        </span>
                      </div>
                      {selectedDayApts.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-xs text-slate-500">
                          Không có lịch khám trong ngày này.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedDayApts.map((apt) => (
                            <button
                              key={apt.id}
                              type="button"
                              onClick={() => setSelectedTimetableApt(apt)}
                              className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${getCalendarPillStyle(
                                apt
                              )}`}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                                <span>
                                  {apt.type === 'home' ? 'Khám tại nhà' : 'Tư vấn Video'}
                                </span>
                                <span className="tabular-nums">{apt.time}</span>
                              </div>
                              <div className="text-xs font-medium mt-1">
                                {apt.doctorName} · {apt.patientName}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DESKTOP: 7-column full month grid */}
                  <div className="hidden md:block p-3 sm:p-5 overflow-x-auto">
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
                        const dayApts = byDate.get(cell.iso) ?? [];
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
                              {dayApts.length > 0 ? (
                                <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                                  {dayApts.length} lịch
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
                              {dayApts.map((apt) => (
                                <button
                                  key={apt.id}
                                  type="button"
                                  onClick={() => setSelectedTimetableApt(apt)}
                                  title={`${apt.time} - ${apt.patientName} (${apt.doctorName})`}
                                  className={`w-full text-left rounded-md border px-2 py-1 text-[11px] font-medium truncate transition-colors cursor-pointer ${getCalendarPillStyle(
                                    apt
                                  )}`}
                                >
                                  <span className="tabular-nums font-semibold">{apt.time}</span>
                                  <span> - </span>
                                  <span>
                                    {apt.type === 'home' ? 'Tại nhà' : 'Video'} · {apt.patientName}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </>
              );
            })()
          ) : (
            /* WEEK TIMETABLE VIEW */
            (() => {
              const weekDays = getWeekDays(calendarAnchorIso);
              const sessions: {
                key: 'morning' | 'afternoon';
                label: string;
                range: string;
              }[] = [
                { key: 'morning', label: 'Sáng', range: '08:00 – 11:30' },
                { key: 'afternoon', label: 'Chiều', range: '13:30 – 17:30' },
              ];

              const weekSelectedIso = weekDays.some((d) => d.iso === mobileSelectedDate)
                ? mobileSelectedDate
                : weekDays[0]?.iso ?? todayIso;
              const mobileWeekApts = filteredAppointments.filter((a) => a.date === weekSelectedIso);

              return (
                <>
                  {/* MOBILE: 7-day strip + agenda */}
                  <div className="md:hidden p-3 space-y-4">
                    <div className="grid grid-cols-7 gap-1">
                      {weekDays.map((day) => {
                        const isSelected = day.iso === weekSelectedIso;
                        const isToday = day.iso === todayIso;
                        const count = filteredAppointments.filter((a) => a.date === day.iso).length;
                        return (
                          <button
                            key={day.iso}
                            type="button"
                            onClick={() => setMobileSelectedDate(day.iso)}
                            className={`rounded-xl border py-2 px-1 flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#2E37A4] bg-indigo-50/70 text-[#2E37A4]'
                                : isToday
                                  ? 'border-indigo-300 bg-indigo-50/20 text-slate-800'
                                  : 'border-slate-200/80 bg-white text-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-semibold uppercase">{day.dayLabel}</span>
                            <span className="text-xs font-bold tabular-nums">{day.shortDate.slice(0, 2)}</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                count > 0 ? 'bg-sky-500' : 'bg-transparent'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="text-xs font-bold text-slate-800">
                        {formatTimelineDayHeading(weekSelectedIso, todayIso)}
                      </div>
                      {mobileWeekApts.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-xs text-slate-500">
                          Không có lịch khám trong ngày này.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {mobileWeekApts.map((apt) => (
                            <button
                              key={apt.id}
                              type="button"
                              onClick={() => setSelectedTimetableApt(apt)}
                              className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${getCalendarPillStyle(
                                apt
                              )}`}
                            >
                              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                                <span>
                                  {apt.type === 'home' ? 'Khám tại nhà' : 'Tư vấn Video'}
                                </span>
                                <span className="tabular-nums">{apt.time}</span>
                              </div>
                              <div className="text-xs font-medium mt-1">
                                {apt.doctorName} · {apt.patientName}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DESKTOP: 7-column week timetable */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[780px] border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/40">
                        <th className="w-28 px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider">
                          Buổi
                        </th>
                        {weekDays.map((day) => (
                          <th
                            key={day.iso}
                            className={`px-2.5 py-2.5 text-center font-semibold border-l border-slate-100 ${
                              day.iso === todayIso
                                ? 'bg-indigo-50/70 text-[#2E37A4]'
                                : 'text-slate-700'
                            }`}
                          >
                            <span className="block text-[11px] uppercase">{day.dayLabel}</span>
                            <span className="block text-xs font-bold tabular-nums">
                              {day.shortDate}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map((session) => (
                        <tr key={session.key} className="align-top">
                          <td className="px-3 py-3 bg-slate-50/30 border-r border-slate-100">
                            <div className="font-bold text-slate-800">{session.label}</div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              {session.range}
                            </div>
                          </td>
                          {weekDays.map((day) => {
                            const cellItems = filteredAppointments.filter(
                              (a) => a.date === day.iso && getSessionBucket(a.time) === session.key
                            );
                            return (
                              <td
                                key={`${day.iso}-${session.key}`}
                                className={`p-2 min-h-[76px] border-l border-slate-100 ${
                                  day.iso === todayIso ? 'bg-indigo-50/20' : ''
                                }`}
                              >
                                <div className="space-y-1.5 min-h-[60px]">
                                  {cellItems.map((apt) => (
                                    <button
                                      key={apt.id}
                                      type="button"
                                      onClick={() => setSelectedTimetableApt(apt)}
                                      className={`w-full text-left rounded-lg border p-2 transition-colors cursor-pointer ${getCalendarPillStyle(
                                        apt
                                      )}`}
                                    >
                                      <div className="font-bold tabular-nums text-[11px]">
                                        {apt.time} · {apt.type === 'home' ? 'Tại nhà' : 'Video'}
                                      </div>
                                      <div className="truncate font-semibold text-[11px] mt-0.5">
                                        {apt.patientName}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              );
            })()
          )}
        </section>
      </main>

      {/* MODAL: ĐỀ XUẤT ĐỔI LỊCH (CẦN BÁC SĨ & CSYT XÁC NHẬN) */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          {rescheduleTarget && (
            <>
              <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
                <DialogTitle className="font-bold text-base text-white">
                  Đề xuất đổi lịch khám
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 mt-0.5">
                  Yêu cầu sẽ được gửi tới Bác sĩ và Cơ sở y tế xác nhận (báo trước tối thiểu 4 giờ).
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="text-slate-500">
                    Lịch hiện tại:{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {rescheduleTarget.time} · {rescheduleTarget.displayDate}
                    </strong>
                  </div>
                  <div className="text-slate-500">
                    Bác sĩ: <strong className="text-primary">{rescheduleTarget.doctorName}</strong>
                  </div>
                </div>

                {rescheduleError && (
                  <p
                    role="alert"
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs"
                  >
                    {rescheduleError}
                  </p>
                )}

                <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="block font-semibold text-slate-700 mb-1.5">
                        Ngày khám mới
                      </Label>
                      <Input
                        type="date"
                        required
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="h-10 rounded-xl bg-slate-50/50 font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <Label className="block font-semibold text-slate-700 mb-1.5">
                        Khung giờ mới
                      </Label>
                      <select
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold text-slate-900 focus:border-primary outline-none"
                      >
                        <option value="08:30">08:30 (Sáng)</option>
                        <option value="09:30">09:30 (Sáng)</option>
                        <option value="10:30">10:30 (Sáng)</option>
                        <option value="14:00">14:00 (Chiều)</option>
                        <option value="15:00">15:00 (Chiều)</option>
                        <option value="16:00">16:00 (Chiều)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="block font-semibold text-slate-700 mb-1.5">
                      Lý do đổi lịch
                    </Label>
                    <Textarea
                      rows={2}
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="VD: Gia đình có việc bận đột xuất buổi sáng..."
                      className="p-3 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-xs"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRescheduleTarget(null)}
                      className="flex-1 rounded-xl font-semibold"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      disabled={submittingReschedule}
                      className="flex-1 rounded-xl font-semibold"
                    >
                      {submittingReschedule ? 'Đang gửi...' : 'Gửi yêu cầu đổi lịch'}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CHI TIẾT LỊCH HẸN TỪ CALENDAR */}
      <Dialog
        open={Boolean(selectedTimetableApt)}
        onOpenChange={(open) => !open && setSelectedTimetableApt(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          {selectedTimetableApt && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {selectedTimetableApt.type === 'home'
                    ? 'Khám Bác sĩ Tại Nhà'
                    : 'Tư vấn Video (Telehealth)'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 tabular-nums">
                  {selectedTimetableApt.time} · {selectedTimetableApt.displayDate}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5">
                  <div>
                    <span className="text-slate-500">Đối tượng: </span>
                    <strong className="text-slate-900">{selectedTimetableApt.patientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Bác sĩ: </span>
                    <strong className="text-slate-900">
                      {selectedTimetableApt.doctorName} ({selectedTimetableApt.hospital})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Nội dung: </span>
                    <span className="text-slate-800">{selectedTimetableApt.chiefComplaint}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {selectedTimetableApt.type === 'telehealth' &&
                    (selectedTimetableApt.status === 'confirmed' ||
                      selectedTimetableApt.status === 'in_progress') && (
                      <Button asChild size="sm">
                        <Link href={`/family/telemedicine?encounterId=${selectedTimetableApt.id}`}>
                          Vào phòng khám Video
                        </Link>
                      </Button>
                    )}
                  {selectedTimetableApt.type === 'home' &&
                    selectedTimetableApt.status === 'arrived' && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const id = selectedTimetableApt.id;
                          setSelectedTimetableApt(null);
                          void handleConfirmArrival(id);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Xác nhận Bác sĩ đã đến nhà
                      </Button>
                    )}
                  {selectedTimetableApt.status === 'requested' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const id = selectedTimetableApt.id;
                        setSelectedTimetableApt(null);
                        void encountersApi
                          .cancelEncounter(id, 'Gia đình hủy yêu cầu chờ duyệt')
                          .then(() => {
                            toast.success('Đã hủy yêu cầu và hoàn lại lượt tạm giữ.');
                            return loadTimetable();
                          })
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : 'Không thể hủy yêu cầu.'),
                          );
                      }}
                      className="text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      Hủy yêu cầu
                    </Button>
                  )}
                  {selectedTimetableApt.status === 'confirmed' &&
                    !selectedTimetableApt.pendingReschedule && (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/family/appointments/${selectedTimetableApt.id}/reschedule`}
                          onClick={() => setSelectedTimetableApt(null)}
                        >
                          Đề xuất đổi lịch
                        </Link>
                      </Button>
                    )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: ĐẶT LỊCH TƯ VẤN VIDEO (TELEHEALTH) */}
      <Dialog open={telehealthModalOpen} onOpenChange={setTelehealthModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-600 text-[20px]">video_call</span>
              <span>Đặt lịch Tư vấn Video</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chọn khung giờ và mô tả vấn đề sức khỏe. Bác sĩ phụ trách sẽ duyệt lịch trực tuyến
              cho gia đình (chỉ cần 2 bên Gia đình &amp; Bác sĩ).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSubmitTelehealth(e)} className="space-y-4 pt-1">
            {telehealthError && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
              >
                {telehealthError}
              </div>
            )}

            {familyMembers.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="telehealth-member" className="text-xs font-semibold text-slate-700">
                  Thành viên cần tư vấn
                </Label>
                <select
                  id="telehealth-member"
                  value={telehealthPatientId}
                  onChange={(e) => setTelehealthPatientId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="telehealth-date" className="text-xs font-semibold text-slate-700">
                  Ngày tư vấn
                </Label>
                <Input
                  id="telehealth-date"
                  type="date"
                  min={todayIso}
                  value={telehealthDate}
                  onChange={(e) => setTelehealthDate(e.target.value)}
                  required
                  className="h-10 rounded-xl text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telehealth-time" className="text-xs font-semibold text-slate-700">
                  Khung giờ
                </Label>
                <select
                  id="telehealth-time"
                  value={telehealthTime}
                  onChange={(e) => setTelehealthTime(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  {[
                    '08:30',
                    '09:00',
                    '09:30',
                    '10:00',
                    '10:30',
                    '11:00',
                    '14:00',
                    '14:30',
                    '15:00',
                    '15:30',
                    '16:00',
                  ].map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telehealth-reason" className="text-xs font-semibold text-slate-700">
                Triệu chứng / Vấn đề cần hỏi Bác sĩ
              </Label>
              <Textarea
                id="telehealth-reason"
                rows={3}
                value={telehealthReason}
                onChange={(e) => setTelehealthReason(e.target.value)}
                placeholder="Ví dụ: Đo huyết áp sáng nay hơi cao, muốn hỏi chỉnh liều thuốc..."
                required
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTelehealthModalOpen(false)}
                className="flex-1 rounded-xl font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submittingTelehealth}
                className="flex-1 rounded-xl font-semibold"
              >
                {submittingTelehealth ? 'Đang gửi...' : 'Gửi yêu cầu Tư vấn'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
