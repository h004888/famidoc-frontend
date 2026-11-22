'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  contractsApi,
  doctorsApi,
  encountersApi,
  type DoctorProfileDto,
  type EncounterItem,
  type EncounterType,
  type FourPartyContract,
} from '@/lib/api';
import {
  extractEncounterDateIso,
  extractEncounterTimeHm,
  formatEncounterDateVi,
  getEncounterCategoryLabel,
  getEncounterStatusLabel,
  getEncounterTypeLabel,
  getTodayIsoDate,
} from '@/lib/utils/encounter-format';

const TIME_WINDOWS = [
  { label: '08:00 - 09:30', minHour: 6, maxHour: 9.5, defaultTime: '08:00' },
  { label: '09:30 - 12:00', minHour: 9.5, maxHour: 12, defaultTime: '10:00' },
  { label: '13:30 - 15:30', minHour: 12, maxHour: 15.5, defaultTime: '14:00' },
  { label: '15:30 - 18:00', minHour: 15.5, maxHour: 18, defaultTime: '16:00' },
  { label: '18:00 - 21:00', minHour: 18, maxHour: 23, defaultTime: '19:30' },
];

const STANDARD_TIME_SLOTS = ['08:00', '09:00', '10:30', '14:00', '15:30', '17:00', '19:30'];

function getWeekDates(weekOffset = 0): { dayName: string; dateIso: string; label: string }[] {
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday + weekOffset * 7);

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  return dayNames.map((dayName, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      dayName,
      dateIso: `${y}-${m}-${day}`,
      label: `${dayName} (${day}/${m})`,
    };
  });
}

function getHourDecimal(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  if (Number.isNaN(h)) return 8;
  return h + (Number.isNaN(m) ? 0 : m / 60);
}

interface ContractPatientOption {
  patientId: string;
  fullName: string;
}

export function DoctorTimetableView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileDto | null>(null);
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [activeContracts, setActiveContracts] = useState<FourPartyContract[]>([]);
  const [isEmergencyReady, setIsEmergencyReady] = useState(true);
  const [maxRadius, setMaxRadius] = useState(10);

  // Modal: Lên lịch định kỳ
  const [showPeriodicModal, setShowPeriodicModal] = useState(false);
  const [periodicError, setPeriodicError] = useState('');
  const [contractPatients, setContractPatients] = useState<ContractPatientOption[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [periodicForm, setPeriodicForm] = useState({
    contractId: '',
    patientId: '',
    encounterType: 'HOME_VISIT' as EncounterType,
    scheduledDate: getTodayIsoDate(),
    scheduledTime: '09:00',
    notes: '',
  });

  // Modal: Hoàn tất / Điều chỉnh lịch (Finalize Ad-hoc hoặc xử lý Conflict)
  const [finalizeTarget, setFinalizeTarget] = useState<EncounterItem | null>(null);
  const [finalizeForm, setFinalizeForm] = useState({
    encounterType: 'HOME_VISIT' as EncounterType,
    scheduledDate: getTodayIsoDate(),
    scheduledTime: '09:00',
    doctorNotes: '',
  });

  // Modal: Phản hồi yêu cầu đổi lịch (Accept / Counter-propose / No suitable slot)
  const [rescheduleReviewTarget, setRescheduleReviewTarget] = useState<EncounterItem | null>(null);
  const [counterMode, setCounterMode] = useState<'COUNTER' | 'NO_SLOT'>('COUNTER');
  const [counterDate, setCounterDate] = useState(getTodayIsoDate());
  const [counterTime, setCounterTime] = useState('14:00');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewError, setReviewError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [profileRes, timetableRes, contractsRes] = await Promise.all([
        doctorsApi.getDoctorMe().catch(() => null),
        encountersApi.getDoctorTimetable({ pageSize: 150 }),
        contractsApi.getMedicalContracts({ status: 'ACTIVE' }).catch(() => [] as FourPartyContract[]),
      ]);

      setDoctorProfile(profileRes);
      setEncounters(timetableRes.data || []);
      setActiveContracts(contractsRes || []);
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể tải dữ liệu thời gian biểu bác sĩ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadPatientsForContract = useCallback(async (contractId: string) => {
    if (!contractId) {
      setContractPatients([]);
      return;
    }
    setLoadingPatients(true);
    try {
      const detail = await contractsApi.getMedicalContractDetail(contractId);
      const opts: ContractPatientOption[] = (detail.members || [])
        .map((m) => ({
          patientId: m.patientId || m.patient?.id || '',
          fullName: m.patient?.fullName || 'Thành viên hộ gia đình',
        }))
        .filter((o) => Boolean(o.patientId));
      setContractPatients(opts);
      setPeriodicForm((prev) => ({
        ...prev,
        patientId: opts[0]?.patientId || '',
      }));
    } catch {
      setContractPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  const handleOpenPeriodicModal = async (preselectedContractId?: string) => {
    const targetContractId = preselectedContractId || activeContracts[0]?.id || '';
    setPeriodicError('');
    setPeriodicForm((prev) => ({
      ...prev,
      contractId: targetContractId,
      patientId: '',
      scheduledDate: getTodayIsoDate(),
      notes: '',
    }));
    setShowPeriodicModal(true);
    if (targetContractId) {
      await loadPatientsForContract(targetContractId);
    }
  };

  const handleCreatePeriodic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodicForm.contractId) {
      setPeriodicError('Vui lòng chọn hợp đồng hộ gia đình.');
      return;
    }
    if (!periodicForm.patientId) {
      setPeriodicError('Vui lòng chọn thành viên gia đình cần khám.');
      return;
    }

    setSubmitting(true);
    setPeriodicError('');
    try {
      await encountersApi.createPeriodicEncounter({
        contractId: periodicForm.contractId,
        patientId: periodicForm.patientId,
        encounterType: periodicForm.encounterType,
        scheduledDate: periodicForm.scheduledDate,
        scheduledTime: periodicForm.scheduledTime,
        notes: periodicForm.notes.trim() || undefined,
      });
      toast.success('Đã lên lịch khám định kỳ và gửi đề xuất tới Gia đình xác nhận.');
      setShowPeriodicModal(false);
      await loadData();
    } catch (err: any) {
      setPeriodicError(err?.message || 'Không thể tạo lịch khám định kỳ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFinalize = (enc: EncounterItem) => {
    setFinalizeTarget(enc);
    setFinalizeForm({
      encounterType:
        (enc.encounterType === 'TELEHEALTH' || enc.encounterType === 'FACILITY_VISIT'
          ? enc.encounterType
          : 'HOME_VISIT') as EncounterType,
      scheduledDate: extractEncounterDateIso(enc.scheduledDate) || getTodayIsoDate(),
      scheduledTime: extractEncounterTimeHm(enc.scheduledTime) || '09:00',
      doctorNotes: '',
    });
  };

  const handleSubmitFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizeTarget) return;
    setSubmitting(true);
    try {
      await encountersApi.finalizeEncounter(finalizeTarget.id, {
        encounterType: finalizeForm.encounterType,
        scheduledDate: finalizeForm.scheduledDate,
        scheduledTime: finalizeForm.scheduledTime,
        doctorNotes: finalizeForm.doctorNotes.trim() || undefined,
      });
      toast.success('Đã hoàn tất lịch khám và gửi thông báo cho Gia đình xác nhận.');
      setFinalizeTarget(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cập nhật lịch khám.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptReschedule = async (enc: EncounterItem) => {
    setActionBusyId(enc.id);
    try {
      const res = await encountersApi.reviewReschedule(enc.id, { accept: true });
      if (res?.status === 'CONFLICT_ALERT') {
        toast.warning(res.message || 'Khung giờ gia đình chọn trùng ca trực tại CSYT. Vui lòng đề xuất giờ khác.');
      } else {
        toast.success('Đã chấp nhận yêu cầu đổi lịch và chốt lịch mới cho cả 3 bên.');
      }
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xử lý yêu cầu đổi lịch.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleOpenCounterModal = (enc: EncounterItem, mode: 'COUNTER' | 'NO_SLOT') => {
    setRescheduleReviewTarget(enc);
    setCounterMode(mode);
    setCounterDate(extractEncounterDateIso(enc.proposedDate || enc.scheduledDate) || getTodayIsoDate());
    setCounterTime(extractEncounterTimeHm(enc.proposedTime || enc.scheduledTime) || '14:00');
    setReviewNotes('');
    setReviewError('');
  };

  const handleSubmitRescheduleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleReviewTarget) return;

    setSubmitting(true);
    setReviewError('');
    try {
      const payload =
        counterMode === 'COUNTER'
          ? {
              accept: false,
              counterDate,
              counterTime,
              notes: reviewNotes.trim() || undefined,
            }
          : {
              accept: false,
              notes: reviewNotes.trim() || undefined,
            };

      const res = await encountersApi.reviewReschedule(rescheduleReviewTarget.id, payload);

      if (res?.status === 'CONFLICT_ALERT') {
        setReviewError(res.message || 'Khung giờ thay thế vẫn trùng lịch / ca trực tại CSYT.');
        await loadData();
        return;
      }

      if (res?.status === 'NO_SUITABLE_SLOT') {
        toast.info('Đã thông báo Gia đình hiện chưa có slot phù hợp và mời chọn khung giờ khác.');
      } else {
        toast.success('Đã gửi đề xuất khung giờ thay thế tới Gia đình xem xét.');
      }
      setRescheduleReviewTarget(null);
      await loadData();
    } catch (err: any) {
      setReviewError(err?.message || 'Không thể phản hồi yêu cầu đổi lịch.');
    } finally {
      setSubmitting(false);
    }
  };

  const conflictEncounters = useMemo(
    () => encounters.filter((e) => Boolean(e.conflictAlert) && e.encounterStatus !== 'CANCELLED'),
    [encounters]
  );

  const pendingAdHocEncounters = useMemo(
    () =>
      encounters.filter(
        (e) =>
          (e.encounterStatus === 'REQUESTED' || e.encounterStatus === 'PROPOSED') &&
          e.proposedBy === 'FAMILY_REP'
      ),
    [encounters]
  );

  const pendingRescheduleEncounters = useMemo(
    () =>
      encounters.filter(
        (e) => e.encounterStatus === 'RESCHEDULE_REQUESTED' && e.proposedBy !== 'DOCTOR'
      ),
    [encounters]
  );

  const doctorName = doctorProfile?.doctorName || 'Bác sĩ Gia đình';
  const facilityName = doctorProfile?.facility?.facilityName || 'Cơ sở y tế liên kết';
  const panelMax = doctorProfile?.maxPanelCapacity ?? 150;
  const panelCurrent = Math.max(doctorProfile?.activePanelCount ?? 0, activeContracts.length);
  const capPercentage = panelMax > 0 ? Math.min(100, Math.round((panelCurrent / panelMax) * 100)) : 0;

  const homeCount = encounters.filter((e) => e.encounterType === 'HOME_VISIT').length;
  const teleCount = encounters.filter(
    (e) => e.encounterType === 'TELEHEALTH' || e.encounterType === 'TELEMEDICINE'
  ).length;
  const confirmedCount = encounters.filter((e) => e.encounterStatus === 'CONFIRMED').length;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#0f172a] font-sans">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <Card className="bg-white p-6 rounded-2xl border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="px-2.5 py-0.5 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider border-blue-200"
              >
                Lịch Khám &amp; Điều Phối Bác Sĩ
              </Badge>
              <span className="text-xs text-slate-400 font-medium">{facilityName}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f172a]">{doctorName}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sẵn sàng tiếp nhận khẩn cấp:</span>
              <Checkbox
                checked={isEmergencyReady}
                onCheckedChange={(checked) => setIsEmergencyReady(checked === true)}
              />
            </label>

            <Button
              type="button"
              onClick={() => handleOpenPeriodicModal()}
              disabled={activeContracts.length === 0}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Lên lịch định kỳ</span>
            </Button>

            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold">
              <Link href="/doctor/encounters">Ca khám hôm nay</Link>
            </Button>
          </div>
        </Card>

        {loadError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-4"
          >
            <span>{loadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={loadData}>
              Thử lại
            </Button>
          </div>
        )}

        {/* Capacity & Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white p-6 rounded-2xl border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                Hợp đồng hộ đang phụ trách
              </span>
              <span className="text-xs font-bold text-primary tabular-nums">{capPercentage}% Tải</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#0f172a] tabular-nums">{panelCurrent}</span>
              <span className="text-xs text-slate-400 font-medium">/ tối đa {panelMax} hộ</span>
            </div>
            <Progress value={capPercentage} className="h-2.5" />
          </Card>

          <Card className="bg-white p-6 rounded-2xl border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">near_me</span>
              Bán Kính Khám Tại Nhà
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600 tabular-nums">{maxRadius}</span>
              <span className="text-xs text-slate-400 font-medium">km quanh {facilityName}</span>
            </div>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={maxRadius}
              onChange={(e) => setMaxRadius(parseInt(e.target.value, 10))}
              className="w-full accent-[#0037c1]"
            />
          </Card>

          <Card className="bg-white p-6 rounded-2xl border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">pie_chart</span>
              Tổng quan lịch khám
            </span>
            <div className="space-y-1.5 text-xs pt-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500">Đã chốt lịch (Confirmed):</span>
                <strong className="text-emerald-700">{confirmedCount} ca</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khám tại nhà:</span>
                <strong className="text-[#0f172a]">{homeCount} ca</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tư vấn Telehealth:</span>
                <strong className="text-primary">{teleCount} ca</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* HỘP XỬ LÝ XUNG ĐỘT & YÊU CẦU TỪ GIA ĐÌNH */}
        {(conflictEncounters.length > 0 ||
          pendingAdHocEncounters.length > 0 ||
          pendingRescheduleEncounters.length > 0) && (
          <section aria-label="Hộp xử lý yêu cầu lịch khám" className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">inbox</span>
              <span>Yêu cầu cần Bác sĩ xử lý ({conflictEncounters.length + pendingAdHocEncounters.length + pendingRescheduleEncounters.length})</span>
            </h2>

            {/* 1. Cảnh báo xung đột ca trực CSYT */}
            {conflictEncounters.map((enc) => (
              <Card
                key={`conflict-${enc.id}`}
                className="bg-rose-50/70 p-5 rounded-2xl border-2 border-rose-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-rose-600 text-white">Cảnh báo xung đột (CONFLICT_ALERT)</Badge>
                    <Badge variant="outline">{getEncounterTypeLabel(enc.encounterType)}</Badge>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {enc.patient?.fullName || 'Bệnh nhân'} — {extractEncounterTimeHm(enc.scheduledTime)} ·{' '}
                    {formatEncounterDateVi(enc.scheduledDate)}
                  </h3>
                  <p className="text-xs text-rose-800 font-medium">
                    {enc.conflictDetails || 'Trùng khung giờ với ca trực nội viện tại CSYT.'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleOpenFinalize(enc)}
                  className="rounded-xl shrink-0 font-semibold"
                >
                  Điều chỉnh giờ khác
                </Button>
              </Card>
            ))}

            {/* 2. Yêu cầu khám đột xuất (Ad-hoc) chờ duyệt */}
            {pendingAdHocEncounters.map((enc) => (
              <Card
                key={`adhoc-${enc.id}`}
                className="bg-white p-5 rounded-2xl border-2 border-sky-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-100">
                      Yêu cầu khám đột xuất (Ad-hoc)
                    </Badge>
                    <Badge variant="outline">{getEncounterTypeLabel(enc.encounterType)}</Badge>
                    <span className="text-xs text-slate-500 tabular-nums">
                      HĐ #{enc.contract?.contractNumber || '—'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {enc.patient?.fullName || 'Thành viên gia đình'} — Mong muốn:{' '}
                    <span className="text-primary tabular-nums">
                      {extractEncounterTimeHm(enc.scheduledTime)} · {formatEncounterDateVi(enc.scheduledDate)}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    <strong>Triệu chứng / Lý do:</strong> {enc.subjectiveNote || 'Không có mô tả'}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleOpenFinalize(enc)}
                  className="rounded-xl shrink-0 font-semibold gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">fact_check</span>
                  <span>Duyệt &amp; Hoàn tất lịch</span>
                </Button>
              </Card>
            ))}

            {/* 3. Yêu cầu xin đổi lịch từ Gia đình */}
            {pendingRescheduleEncounters.map((enc) => {
              const isBusy = actionBusyId === enc.id;
              return (
                <Card
                  key={`reschedule-${enc.id}`}
                  className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100">
                        Gia đình xin đổi lịch
                      </Badge>
                      <Badge variant="outline">{getEncounterTypeLabel(enc.encounterType)}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {enc.patient?.fullName || 'Thành viên gia đình'}
                    </h3>
                    <div className="text-xs text-slate-700 space-y-0.5 tabular-nums">
                      <div>
                        Giờ cũ: {extractEncounterTimeHm(enc.scheduledTime)} ·{' '}
                        {formatEncounterDateVi(enc.scheduledDate)} →{' '}
                        <strong className="text-primary">
                          Giờ gia đình đề xuất: {extractEncounterTimeHm(enc.proposedTime)} ·{' '}
                          {formatEncounterDateVi(enc.proposedDate)}
                        </strong>
                      </div>
                      <div className="text-slate-600">
                        <strong>Lý do:</strong> {enc.rescheduleReason || 'Không ghi chú'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleAcceptReschedule(enc)}
                      className="rounded-xl font-semibold gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Chấp nhận giờ mới</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleOpenCounterModal(enc, 'COUNTER')}
                      className="rounded-xl font-semibold gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">schedule_send</span>
                      <span>Đề xuất giờ khác</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleOpenCounterModal(enc, 'NO_SLOT')}
                      className="rounded-xl font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Báo không có slot
                    </Button>
                  </div>
                </Card>
              );
            })}
          </section>
        )}

        {/* HỢP ĐỒNG ACTIVE ĐANG PHỤ TRÁCH */}
        <section aria-label="Hợp đồng gia đình đang phụ trách" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Hợp đồng gia đình hiệu lực ({activeContracts.length})
            </h2>
          </div>

          {activeContracts.length === 0 ? (
            <Card className="bg-white p-5 rounded-2xl border-slate-200 text-xs text-slate-500">
              Chưa có hợp đồng gia đình đang ở trạng thái ACTIVE được phân công cho bạn.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeContracts.map((c) => (
                <Card
                  key={c.id}
                  className="bg-white p-4 rounded-2xl border-slate-200 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-primary bg-primary/5 tabular-nums">
                        #{c.contractNumber}
                      </Badge>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        ACTIVE
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 pt-1">
                      Hộ {c.familyRepresentativeName || 'Gia đình'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {c.packageName} · {c.membersCount} thành viên
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenPeriodicModal(c.id)}
                    className="w-full rounded-xl text-xs font-semibold gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      calendar_add_on
                    </span>
                    <span>+ Lên lịch định kỳ</span>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Master Timetable Grid (Real Encounters mapped to weekDates) */}
        <Card className="bg-white rounded-2xl border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <span>Thời Gian Biểu Tuần Thực Tế</span>
            </h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset((w) => w - 1)}
                className="rounded-xl text-xs"
              >
                Tuần trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
                className="rounded-xl text-xs"
              >
                Tuần này
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset((w) => w + 1)}
                className="rounded-xl text-xs"
              >
                Tuần sau
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Đang tải lịch khám...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 text-[#475569] hover:bg-slate-50">
                    <TableHead className="p-3.5 w-32 border-r border-slate-200 text-[#475569]">
                      Khung giờ
                    </TableHead>
                    {weekDates.slice(0, 6).map((wd, idx) => (
                      <TableHead
                        key={wd.dateIso}
                        className={`p-3.5 text-[#475569] ${idx < 5 ? 'border-r border-slate-200' : ''}`}
                      >
                        {wd.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-[#0f172a]">
                  {TIME_WINDOWS.map((win) => (
                    <TableRow key={win.label} className="hover:bg-slate-50/50">
                      <TableCell className="p-3.5 tabular-nums font-bold text-slate-500 border-r border-slate-200 bg-slate-50/30 whitespace-nowrap">
                        {win.label}
                      </TableCell>
                      {weekDates.slice(0, 6).map((wd, dayIdx) => {
                        const cellItems = encounters.filter((enc) => {
                          if (enc.encounterStatus === 'CANCELLED') return false;
                          const dateIso = extractEncounterDateIso(enc.scheduledDate);
                          if (dateIso !== wd.dateIso) return false;
                          const hm = extractEncounterTimeHm(enc.scheduledTime);
                          const dec = getHourDecimal(hm);
                          return dec >= win.minHour && dec < win.maxHour;
                        });

                        return (
                          <TableCell
                            key={wd.dateIso}
                            className={`p-2 align-top ${dayIdx < 5 ? 'border-r border-slate-200' : ''}`}
                          >
                            {cellItems.length === 0 ? (
                              <span className="text-[11px] text-slate-300 block text-center py-2">
                                Trống
                              </span>
                            ) : (
                              <div className="space-y-1.5">
                                {cellItems.map((enc) => {
                                  const statusMeta = getEncounterStatusLabel(enc);
                                  const isTele =
                                    enc.encounterType === 'TELEHEALTH' ||
                                    enc.encounterType === 'TELEMEDICINE';
                                  return (
                                    <div
                                      key={enc.id}
                                      className={`p-2 rounded-xl border text-[11px] space-y-0.5 ${
                                        enc.conflictAlert
                                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                                          : isTele
                                          ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                      }`}
                                    >
                                      <div className="font-bold flex items-center justify-between gap-1">
                                        <span className="tabular-nums">
                                          {extractEncounterTimeHm(enc.scheduledTime)}
                                        </span>
                                        <span className="truncate">{getEncounterTypeLabel(enc.encounterType)}</span>
                                      </div>
                                      <div className="font-semibold truncate">
                                        {enc.patient?.fullName || 'Bệnh nhân'}
                                      </div>
                                      <div className="text-[10px] opacity-80 truncate">
                                        {statusMeta.label} · {getEncounterCategoryLabel(enc.category)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* MODAL 1: LÊN LỊCH KHÁM ĐỊNH KỲ */}
      <Dialog open={showPeriodicModal} onOpenChange={setShowPeriodicModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border-slate-200 gap-0">
          <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
            <DialogTitle className="font-bold text-base text-white">
              Lên lịch khám định kỳ cho Gia đình
            </DialogTitle>
            <DialogDescription className="text-xs text-blue-100 mt-0.5">
              Hệ thống sẽ kiểm tra hạn mức gói, kiểm tra xung đột và gửi lịch tới Gia đình xác nhận.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePeriodic} className="p-6 space-y-4 text-xs">
            {periodicError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                {periodicError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="periodic-contract" className="font-semibold text-slate-700">
                Hợp đồng hộ gia đình
              </Label>
              <select
                id="periodic-contract"
                value={periodicForm.contractId}
                onChange={async (e) => {
                  const id = e.target.value;
                  setPeriodicForm((prev) => ({ ...prev, contractId: id, patientId: '' }));
                  await loadPatientsForContract(id);
                }}
                className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold"
              >
                {activeContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.contractNumber} — {c.familyRepresentativeName} ({c.packageName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="periodic-patient" className="font-semibold text-slate-700">
                Thành viên khám
              </Label>
              <select
                id="periodic-patient"
                disabled={loadingPatients}
                value={periodicForm.patientId}
                onChange={(e) => setPeriodicForm((prev) => ({ ...prev, patientId: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold"
              >
                {contractPatients.length === 0 ? (
                  <option value="">{loadingPatients ? 'Đang tải thành viên...' : 'Không có thành viên'}</option>
                ) : (
                  contractPatients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.fullName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="periodic-type" className="font-semibold text-slate-700">
                Hình thức khám
              </Label>
              <select
                id="periodic-type"
                value={periodicForm.encounterType}
                onChange={(e) =>
                  setPeriodicForm((prev) => ({ ...prev, encounterType: e.target.value as EncounterType }))
                }
                className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold"
              >
                <option value="HOME_VISIT">Khám tại nhà (HOME_VISIT)</option>
                <option value="TELEHEALTH">Tư vấn Video (TELEHEALTH)</option>
                <option value="FACILITY_VISIT">Tại CSYT (FACILITY_VISIT)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="periodic-date" className="font-semibold text-slate-700">
                  Ngày khám
                </Label>
                <Input
                  id="periodic-date"
                  type="date"
                  required
                  min={getTodayIsoDate()}
                  value={periodicForm.scheduledDate}
                  onChange={(e) => setPeriodicForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                  className="h-10 rounded-xl tabular-nums font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="periodic-time" className="font-semibold text-slate-700">
                  Giờ khám
                </Label>
                <select
                  id="periodic-time"
                  value={periodicForm.scheduledTime}
                  onChange={(e) => setPeriodicForm((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold tabular-nums"
                >
                  {STANDARD_TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="periodic-notes" className="font-semibold text-slate-700">
                Ghi chú kế hoạch khám
              </Label>
              <Textarea
                id="periodic-notes"
                rows={2}
                placeholder="Ví dụ: Kiểm tra huyết áp định kỳ tháng 11, mang máy đo đường huyết..."
                value={periodicForm.notes}
                onChange={(e) => setPeriodicForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="rounded-xl"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPeriodicModal(false)}
                className="flex-1 rounded-xl font-semibold"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-semibold">
                {submitting ? 'Đang gửi...' : 'Gửi lịch cho Gia đình'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: HOÀN TẤT / ĐIỀU CHỈNH LỊCH (AD-HOC HOẶC XUNG ĐỘT) */}
      <Dialog open={Boolean(finalizeTarget)} onOpenChange={(open) => !open && setFinalizeTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200 gap-0">
          {finalizeTarget && (
            <>
              <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
                <DialogTitle className="font-bold text-base text-white">
                  Xác định hình thức &amp; Hoàn tất lịch khám
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 mt-0.5">
                  Bệnh nhân: {finalizeTarget.patient?.fullName || 'Thành viên gia đình'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitFinalize} className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="finalize-type" className="font-semibold text-slate-700">
                    Hình thức khám
                  </Label>
                  <select
                    id="finalize-type"
                    value={finalizeForm.encounterType}
                    onChange={(e) =>
                      setFinalizeForm((prev) => ({ ...prev, encounterType: e.target.value as EncounterType }))
                    }
                    className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold"
                  >
                    <option value="HOME_VISIT">Khám tại nhà</option>
                    <option value="TELEHEALTH">Tư vấn Video (Telehealth)</option>
                    <option value="FACILITY_VISIT">Tại CSYT</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="finalize-date" className="font-semibold text-slate-700">
                      Ngày khám
                    </Label>
                    <Input
                      id="finalize-date"
                      type="date"
                      required
                      value={finalizeForm.scheduledDate}
                      onChange={(e) =>
                        setFinalizeForm((prev) => ({ ...prev, scheduledDate: e.target.value }))
                      }
                      className="h-10 rounded-xl tabular-nums font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="finalize-time" className="font-semibold text-slate-700">
                      Giờ khám
                    </Label>
                    <select
                      id="finalize-time"
                      value={finalizeForm.scheduledTime}
                      onChange={(e) =>
                        setFinalizeForm((prev) => ({ ...prev, scheduledTime: e.target.value }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold tabular-nums"
                    >
                      {STANDARD_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="finalize-notes" className="font-semibold text-slate-700">
                    Ghi chú của bác sĩ gửi gia đình
                  </Label>
                  <Textarea
                    id="finalize-notes"
                    rows={2}
                    placeholder="Ví dụ: Bác sĩ xác nhận đến khám tại nhà theo khung giờ này..."
                    value={finalizeForm.doctorNotes}
                    onChange={(e) => setFinalizeForm((prev) => ({ ...prev, doctorNotes: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFinalizeTarget(null)}
                    className="flex-1 rounded-xl font-semibold"
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-semibold">
                    {submitting ? 'Đang lưu...' : 'Gửi lịch cho Gia đình'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: ĐỀ XUẤT GIỜ KHÁC HOẶC BÁO KHÔNG CÓ SLOT */}
      <Dialog
        open={Boolean(rescheduleReviewTarget)}
        onOpenChange={(open) => !open && setRescheduleReviewTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200 gap-0">
          {rescheduleReviewTarget && (
            <>
              <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
                <DialogTitle className="font-bold text-base text-white">
                  {counterMode === 'COUNTER'
                    ? 'Đề xuất khung giờ khám thay thế'
                    : 'Thông báo không có khung giờ phù hợp'}
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 mt-0.5">
                  Bệnh nhân: {rescheduleReviewTarget.patient?.fullName || 'Thành viên gia đình'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitRescheduleReview} className="p-6 space-y-4 text-xs">
                {reviewError && (
                  <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    {reviewError}
                  </div>
                )}

                {counterMode === 'COUNTER' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="counter-date" className="font-semibold text-slate-700">
                        Ngày đề xuất
                      </Label>
                      <Input
                        id="counter-date"
                        type="date"
                        required
                        min={getTodayIsoDate()}
                        value={counterDate}
                        onChange={(e) => setCounterDate(e.target.value)}
                        className="h-10 rounded-xl tabular-nums font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="counter-time" className="font-semibold text-slate-700">
                        Giờ đề xuất
                      </Label>
                      <select
                        id="counter-time"
                        value={counterTime}
                        onChange={(e) => setCounterTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold tabular-nums"
                      >
                        {STANDARD_TIME_SLOTS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    Hệ thống sẽ xóa khung giờ đề xuất hiện tại và gửi thông báo mời Gia đình chọn một khung giờ khác phù hợp hơn.
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="review-notes" className="font-semibold text-slate-700">
                    Lời nhắn tới Gia đình
                  </Label>
                  <Textarea
                    id="review-notes"
                    rows={2}
                    placeholder="Nhập ghi chú lý do hoặc khung giờ bác sĩ có thể khám..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRescheduleReviewTarget(null)}
                    className="flex-1 rounded-xl font-semibold"
                  >
                    Đóng
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-semibold">
                    {submitting
                      ? 'Đang gửi...'
                      : counterMode === 'COUNTER'
                      ? 'Gửi giờ đề xuất mới'
                      : 'Xác nhận báo hết slot'}
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
