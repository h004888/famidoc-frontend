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
import { Textarea } from '@/components/ui/textarea';

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

function getSessionBucket(time: string): 'morning' | 'afternoon' | 'evening' {
  const hour = Number.parseInt(time.split(':')[0] || '8', 10);
  if (!Number.isFinite(hour) || hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getSessionLabel(bucket: 'morning' | 'afternoon' | 'evening'): string {
  if (bucket === 'morning') return 'Sáng';
  if (bucket === 'afternoon') return 'Chiều';
  return 'Tối';
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
  const [pendingReschedules, setPendingReschedules] = useState<EncounterRescheduleRequestItem[]>(
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

  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [viewMode, setViewMode] = useState<'timeline' | 'timetable'>('timeline');
  const [memberFilter, setMemberFilter] = useState<string>('__ALL__');
  const [selectedTimetableApt, setSelectedTimetableApt] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const [weekAnchorIso, setWeekAnchorIso] = useState(todayIso);
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
        setAppointments(res.data.map(mapEncounterToAppointment));
      }
      setPendingReschedules(
        (pendingList ?? []).filter(
          (r) => r.status === 'PENDING' && r.familyDecision === 'PENDING'
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
            <Button
              type="button"
              size="sm"
              disabled={!canBookTelehealth}
              onClick={() => {
                setTelehealthError('');
                setTelehealthModalOpen(true);
              }}
              className="rounded-xl text-xs font-semibold gap-1.5"
              title={
                !canBookTelehealth
                  ? 'Hết lượt Tư vấn Video trong gói hoặc chưa có hợp đồng hoạt động'
                  : 'Đặt lịch Tư vấn Video với Bác sĩ phụ trách'
              }
            >
              <span className="material-symbols-outlined text-[16px]">video_call</span>
              <span>+ Đặt Tư vấn Video</span>
            </Button>

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
          pendingReschedules.length > 0) && (
          <section aria-label="Việc cần xác nhận ngay" className="space-y-3">
            {arrivedEncounters.map((apt) => (
              <div
                key={`arrived-${apt.id}`}
                className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                    <span className="material-symbols-outlined text-[20px] text-emerald-700">
                      location_on
                    </span>
                    <span>Bác sĩ {apt.doctorName} đã có mặt tại nhà bạn</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Lịch khám lúc {apt.time} ({apt.displayDate}) · Vui lòng chạm xác nhận để bắt đầu
                    buổi thăm khám.
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={confirmingArrivalId === apt.id}
                  onClick={() => void handleConfirmArrival(apt.id)}
                  className="min-h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>
                    {confirmingArrivalId === apt.id
                      ? 'Đang xác nhận...'
                      : 'Xác nhận Bác sĩ đã đến nhà'}
                  </span>
                </Button>
              </div>
            ))}

            {onTheWayEncounters.map((apt) => (
              <div
                key={`way-${apt.id}`}
                className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 flex items-center gap-3 text-xs text-sky-900"
              >
                <span className="material-symbols-outlined text-[20px] text-sky-600 shrink-0">
                  directions_car
                </span>
                <div>
                  <strong className="font-bold">
                    Bác sĩ {apt.doctorName} đang trên đường đến nhà bạn
                  </strong>{' '}
                  cho buổi khám lúc {apt.time} ({apt.displayDate}).
                </div>
              </div>
            ))}

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

        {/* 4. FILTER BAR & TIMELINE / TIMETABLE */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto self-start">
              {[
                { id: 'upcoming', label: 'Sắp tới', count: upcomingCount },
                { id: 'completed', label: 'Đã khám', count: completedCount },
                { id: 'all', label: 'Tất cả', count: appointments.length },
              ].map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as 'upcoming' | 'completed' | 'all')}
                    className={`min-h-9 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[11px] tabular-nums font-semibold leading-none ${
                        isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(appointments.length > 2 || memberFilter !== '__ALL__') &&
                familyMembers.length > 1 && (
                  <select
                    aria-label="Lọc theo thành viên"
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:border-primary outline-none"
                  >
                    <option value="__ALL__">Mọi thành viên</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                )}

              <div
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 text-xs"
                role="group"
                aria-label="Chế độ xem lịch"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    viewMode === 'timeline'
                      ? 'bg-[#2E37A4] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                  <span>Timeline</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timetable')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    viewMode === 'timetable'
                      ? 'bg-[#2E37A4] text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">calendar_view_week</span>
                  <span>Khóa biểu tuần</span>
                </button>
              </div>
            </div>
          </div>

          {loadError ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3 shadow-xs">
              <p role="alert" className="text-sm font-medium text-rose-700">
                {loadError}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadTimetable()}>
                Thử tải lại
              </Button>
            </div>
          ) : isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-10 text-center space-y-3 shadow-xs">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-xs font-medium text-slate-500">Đang tải lịch khám tại nhà...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-10 text-center space-y-2 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
              <h3 className="font-bold text-sm text-slate-900">
                Chưa có lịch khám tại nhà nào trong mục này
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Lịch khám định kỳ sẽ được hệ thống tự động sắp xếp theo gói chăm sóc của gia đình.
              </p>
            </div>
          ) : viewMode === 'timetable' ? (
            (() => {
              const weekDays = getWeekDays(weekAnchorIso);
              const shiftWeek = (deltaDays: number) => {
                const d = new Date(`${weekAnchorIso}T00:00:00`);
                d.setDate(d.getDate() + deltaDays);
                setWeekAnchorIso(d.toISOString().slice(0, 10));
              };
              const sessions: {
                key: 'morning' | 'afternoon' | 'evening';
                label: string;
                range: string;
              }[] = [
                { key: 'morning', label: 'Sáng', range: '07:00 – 12:00' },
                { key: 'afternoon', label: 'Chiều', range: '13:00 – 17:30' },
                { key: 'evening', label: 'Tối', range: '18:00 – 21:00' },
              ];

              return (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
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
                                        className={`w-full text-left rounded-lg border p-2 transition-colors cursor-pointer ${
                                          apt.type === 'home'
                                            ? 'border-indigo-200 bg-indigo-50/80 text-indigo-950 hover:bg-indigo-100/70'
                                            : 'border-sky-200 bg-sky-50/80 text-sky-950 hover:bg-sky-100/70'
                                        }`}
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
                </div>
              );
            })()
          ) : (
            /* TIMELINE THEO NGÀY */
            <div className="space-y-6">
              {(() => {
                const groups = new Map<string, Appointment[]>();
                for (const apt of filteredAppointments) {
                  const key = apt.date || 'unknown';
                  const list = groups.get(key) ?? [];
                  list.push(apt);
                  groups.set(key, list);
                }
                return Array.from(groups.entries()).map(([dateKey, dayItems]) => (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2E37A4] shrink-0" />
                      <h2 className="text-sm font-bold text-slate-900">
                        {formatTimelineDayHeading(dateKey, todayIso)}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
                        {dayItems.length} lịch hẹn
                      </span>
                    </div>

                    <div className="ml-1 pl-4 border-l-2 border-slate-200 space-y-3">
                      {dayItems.map((apt) => {
                        const bucket = getSessionBucket(apt.time);
                        const pendingReq = apt.pendingReschedule;
                        return (
                          <div
                            key={apt.id}
                            className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-2.5 md:gap-4 items-start"
                          >
                            <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0.5 pt-1">
                              <span className="text-base font-bold tabular-nums text-[#2E37A4]">
                                {apt.time}
                              </span>
                              <span className="text-[11px] font-medium text-slate-500">
                                Buổi {getSessionLabel(bucket).toLowerCase()}
                              </span>
                            </div>

                            <Card className="bg-white rounded-2xl border-slate-200/80 hover:border-slate-300 shadow-xs transition-all p-4 sm:p-5 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                                      apt.type === 'home'
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : 'bg-sky-50 text-sky-700 border-sky-200/70'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">
                                      {apt.type === 'home' ? 'home_health' : 'videocam'}
                                    </span>
                                    <span>
                                      {apt.type === 'home'
                                        ? 'Khám Bác sĩ Tại Nhà'
                                        : 'Tư Vấn Video (Telehealth)'}
                                    </span>
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-[11px] font-medium bg-slate-100 text-slate-600"
                                  >
                                    {apt.type === 'home' ? 'Tự động theo gói' : 'Đặt theo nhu cầu'}
                                  </Badge>
                                </div>

                                <div>
                                  {apt.status === 'requested' && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      <span>Chờ Bác sĩ duyệt</span>
                                    </span>
                                  )}
                                  {apt.status === 'confirmed' && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      <span>Đã xếp lịch</span>
                                    </span>
                                  )}
                                  {apt.status === 'on_the_way' && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                                      Bác sĩ đang di chuyển
                                    </span>
                                  )}
                                  {apt.status === 'arrived' && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                      Bác sĩ đã đến · Chờ xác nhận
                                    </span>
                                  )}
                                  {apt.status === 'in_progress' && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                      Đang thăm khám
                                    </span>
                                  )}
                                  {apt.status === 'completed' && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                      Đã hoàn thành
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
                                <div className="space-y-2 min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                                      <span className="material-symbols-outlined text-[16px] text-primary">
                                        person
                                      </span>
                                      <span>{apt.patientName}</span>
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span>
                                      <strong className="text-slate-800">{apt.doctorName}</strong> (
                                      {apt.hospital})
                                    </span>
                                  </div>

                                  <p className="text-xs sm:text-sm text-slate-800 font-medium bg-slate-50 rounded-xl border border-slate-200/70 px-3.5 py-2.5">
                                    {apt.chiefComplaint}
                                  </p>

                                  {apt.address && (
                                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                      <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
                                        location_on
                                      </span>
                                      <span>{apt.address}</span>
                                    </p>
                                  )}

                                  {pendingReq && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-900">
                                      <span className="font-semibold">
                                        {apt.type === 'telehealth'
                                          ? 'Đang chờ đổi giờ (2 bên): '
                                          : 'Đang chờ duyệt đổi lịch (3 bên): '}
                                      </span>
                                      <span>
                                        Gia đình {pendingReq.familyDecision === 'APPROVED' ? '✓' : '⏳'} ·
                                        Bác sĩ {pendingReq.doctorDecision === 'APPROVED' ? '✓' : '⏳'}
                                        {apt.type === 'home' &&
                                          ` · CSYT ${pendingReq.facilityDecision === 'APPROVED' ? '✓' : '⏳'}`}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  {apt.type === 'telehealth' &&
                                    (apt.status === 'confirmed' || apt.status === 'in_progress') && (
                                      <Button asChild size="sm" className="h-9 rounded-xl text-xs font-semibold gap-1.5">
                                        <Link href={`/family/telemedicine?encounterId=${apt.id}`}>
                                          <span className="material-symbols-outlined text-[16px]">
                                            videocam
                                          </span>
                                          <span>Vào phòng khám Video</span>
                                        </Link>
                                      </Button>
                                    )}

                                  {apt.type === 'home' && apt.status === 'arrived' && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={confirmingArrivalId === apt.id}
                                      onClick={() => void handleConfirmArrival(apt.id)}
                                      className="h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold gap-1.5"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        check_circle
                                      </span>
                                      <span>Xác nhận Bác sĩ đã đến nhà</span>
                                    </Button>
                                  )}

                                  {apt.status === 'confirmed' && !pendingReq && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenReschedule(apt)}
                                      className="h-9 rounded-xl text-xs font-semibold gap-1"
                                    >
                                      <span className="material-symbols-outlined text-[15px] text-primary">
                                        edit_calendar
                                      </span>
                                      <span>Đề xuất đổi lịch</span>
                                    </Button>
                                  )}

                                  {apt.status === 'completed' && (
                                    <Button
                                      asChild
                                      variant="outline"
                                      size="sm"
                                      className="h-9 rounded-xl text-primary border-primary/20 text-xs font-semibold gap-1.5"
                                    >
                                      <Link
                                        href={
                                          apt.patientId
                                            ? `/family/members/${apt.patientId}`
                                            : '/family/medical-book'
                                        }
                                      >
                                        <span className="material-symbols-outlined text-[16px]">
                                          clinical_notes
                                        </span>
                                        <span>Xem kết quả khám &amp; toa thuốc</span>
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
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

      {/* MODAL: CHI TIẾT TỪ KHÓA BIỂU TUẦN */}
      <Dialog
        open={Boolean(selectedTimetableApt)}
        onOpenChange={(open) => !open && setSelectedTimetableApt(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          {selectedTimetableApt && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Khám Bác sĩ Tại Nhà
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
                <div className="flex justify-end gap-2">
                  {selectedTimetableApt.status === 'arrived' && (
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
                  {selectedTimetableApt.status === 'confirmed' &&
                    !selectedTimetableApt.pendingReschedule && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const target = selectedTimetableApt;
                          setSelectedTimetableApt(null);
                          handleOpenReschedule(target);
                        }}
                      >
                        Đề xuất đổi lịch
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
