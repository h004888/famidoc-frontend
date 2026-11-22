'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared';
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
  contractsApi,
  type FamilyGateStatusDto,
  type MedicalContractDetailDto,
} from '@/lib/api/contracts.api';
import {
  encountersApi,
  type EncounterItem,
  type EncounterType,
} from '@/lib/api/encounters.api';
import { patientsApi, type PatientDto } from '@/lib/api/patients.api';
import {
  extractEncounterDateIso,
  extractEncounterTimeHm,
  formatEncounterDateVi,
  getEncounterCategoryLabel,
  getEncounterStatusLabel,
  getEncounterTypeLabel,
  getHoursUntilEncounter,
  getTodayIsoDate,
} from '@/lib/utils/encounter-format';

type FamilyTab = 'awaiting_doctor' | 'upcoming' | 'history' | 'all';

const TIME_SLOTS = [
  { value: '08:00', label: '08:00 (Sáng sớm)' },
  { value: '09:00', label: '09:00 (Sáng)' },
  { value: '10:30', label: '10:30 (Cuối sáng)' },
  { value: '14:00', label: '14:00 (Đầu chiều)' },
  { value: '15:30', label: '15:30 (Chiều)' },
  { value: '17:00', label: '17:00 (Cuối chiều)' },
  { value: '19:30', label: '19:30 (Tối)' },
];

const SUPPORT_HOTLINE = '1900 6868';

function isFamilyActionNeeded(enc: EncounterItem): boolean {
  if (enc.encounterStatus === 'REQUESTED' || enc.encounterStatus === 'PROPOSED') {
    return enc.proposedBy !== 'FAMILY_REP';
  }
  if (enc.encounterStatus === 'RESCHEDULE_REQUESTED') {
    return enc.proposedBy === 'DOCTOR';
  }
  return false;
}

function isAwaitingDoctor(enc: EncounterItem): boolean {
  if (enc.encounterStatus === 'REQUESTED' || enc.encounterStatus === 'PROPOSED') {
    return enc.proposedBy === 'FAMILY_REP';
  }
  if (enc.encounterStatus === 'RESCHEDULE_REQUESTED') {
    return enc.proposedBy !== 'DOCTOR';
  }
  return false;
}

function getEffectiveDisplayDateAndTime(enc: EncounterItem): {
  dateRaw: string;
  timeRaw: string;
  isCounterOffer: boolean;
} {
  const hasCounter =
    enc.encounterStatus === 'RESCHEDULE_REQUESTED' && Boolean(enc.proposedDate && enc.proposedTime);
  return {
    dateRaw: hasCounter ? enc.proposedDate || enc.scheduledDate : enc.scheduledDate,
    timeRaw: hasCounter ? enc.proposedTime || enc.scheduledTime : enc.scheduledTime,
    isCounterOffer: hasCounter,
  };
}

export function FamilyAppointmentsView() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [gateStatus, setGateStatus] = useState<FamilyGateStatusDto | null>(null);
  const [contractDetail, setContractDetail] = useState<MedicalContractDetailDto | null>(null);
  const [members, setMembers] = useState<PatientDto[]>([]);
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);

  const [activeTab, setActiveTab] = useState<FamilyTab>('upcoming');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [rescheduleTarget, setRescheduleTarget] = useState<EncounterItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(getTodayIsoDate());
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  const [declineTarget, setDeclineTarget] = useState<EncounterItem | null>(null);
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);

  const [newBooking, setNewBooking] = useState({
    encounterType: 'HOME_VISIT' as EncounterType,
    patientId: '',
    desiredDate: getTodayIsoDate(),
    desiredTime: '09:00',
    reason: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [gateRes, membersRes, timetableRes] = await Promise.all([
        contractsApi.getFamilyGateStatus(),
        patientsApi.getFamilyMembers(),
        encountersApi.getFamilyTimetable({ pageSize: 100 }),
      ]);

      setGateStatus(gateRes);
      setMembers(membersRes);
      setEncounters(timetableRes.data || []);

      if (membersRes.length > 0) {
        setNewBooking((prev) => ({
          ...prev,
          patientId: prev.patientId || membersRes[0].id,
        }));
      }

      if (gateRes.activeContract?.id) {
        try {
          const detail = await contractsApi.getMedicalContractDetail(gateRes.activeContract.id);
          setContractDetail(detail);
        } catch {
          setContractDetail(null);
        }
      } else {
        setContractDetail(null);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể tải dữ liệu lịch hẹn gia đình.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeContract = gateStatus?.activeContract ?? null;

  const doctorDisplayName =
    contractDetail?.doctor?.user?.fullName ||
    contractDetail?.doctor?.doctorName ||
    activeContract?.doctor?.fullName ||
    'Chưa phân công bác sĩ';
  const facilityDisplayName =
    contractDetail?.facility?.facilityName ||
    activeContract?.doctor?.hospitalName ||
    'Cơ sở y tế liên kết';
  const familyAddress =
    contractDetail?.familyUnit?.homeAddress ||
    gateStatus?.familyUnit?.homeAddress ||
    'Địa chỉ hộ gia đình đã đăng ký';

  const remainingHomeVisits = contractDetail?.remainingHomeVisits ?? 0;
  const totalHomeVisits =
    contractDetail?.servicePackage?.periodicVisitsQuota ?? Math.max(remainingHomeVisits, 1);
  const remainingTelehealth = contractDetail?.remainingTelehealth ?? 0;
  const totalTelehealth =
    contractDetail?.servicePackage?.telehealthQuota ?? Math.max(remainingTelehealth, 1);

  const actionNeededList = useMemo(
    () => encounters.filter(isFamilyActionNeeded),
    [encounters]
  );

  const awaitingDoctorList = useMemo(
    () => encounters.filter(isAwaitingDoctor),
    [encounters]
  );

  const upcomingList = useMemo(
    () =>
      encounters.filter(
        (e) => e.encounterStatus === 'CONFIRMED' || e.encounterStatus === 'IN_PROGRESS'
      ),
    [encounters]
  );

  const historyList = useMemo(
    () =>
      encounters.filter(
        (e) => e.encounterStatus === 'COMPLETED' || e.encounterStatus === 'CANCELLED'
      ),
    [encounters]
  );

  const filteredEncounters = useMemo(() => {
    switch (activeTab) {
      case 'awaiting_doctor':
        return awaitingDoctorList;
      case 'upcoming':
        return upcomingList;
      case 'history':
        return historyList;
      case 'all':
      default:
        return encounters;
    }
  }, [activeTab, awaitingDoctorList, upcomingList, historyList, encounters]);

  const rescheduleHoursRemaining = useMemo(() => {
    if (!rescheduleTarget) return null;
    return getHoursUntilEncounter(rescheduleTarget.scheduledDate, rescheduleTarget.scheduledTime);
  }, [rescheduleTarget]);

  const handleOpenBookingModal = () => {
    setBookingError('');
    setNewBooking((prev) => ({
      ...prev,
      patientId: prev.patientId || members[0]?.id || '',
      desiredDate: prev.desiredDate || getTodayIsoDate(),
    }));
    setShowBookingModal(true);
  };

  const handleCreateAdHocBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract?.id) {
      setBookingError('Gia đình cần có hợp đồng dịch vụ đang hiệu lực để đặt lịch khám.');
      return;
    }
    if (!newBooking.patientId) {
      setBookingError('Vui lòng chọn thành viên gia đình cần khám.');
      return;
    }
    if (!newBooking.reason.trim()) {
      setBookingError('Vui lòng mô tả triệu chứng hoặc lý do khám.');
      return;
    }

    setSubmitting(true);
    setBookingError('');
    try {
      await encountersApi.createAdHocEncounter({
        contractId: activeContract.id,
        patientId: newBooking.patientId,
        encounterType: newBooking.encounterType,
        desiredDate: newBooking.desiredDate,
        desiredTime: newBooking.desiredTime,
        reason: newBooking.reason.trim(),
      });
      toast.success('Đã gửi yêu cầu đặt lịch khám đột xuất tới Bác sĩ phụ trách.');
      setShowBookingModal(false);
      setNewBooking((prev) => ({ ...prev, reason: '' }));
      setActiveTab('awaiting_doctor');
      await loadData();
    } catch (err: any) {
      setBookingError(err?.message || 'Không thể gửi yêu cầu đặt lịch khám.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSchedule = async (enc: EncounterItem) => {
    setActionBusyId(enc.id);
    setConflictNotice(null);
    try {
      const res = await encountersApi.confirmEncounter(enc.id, { confirmed: true });
      if (res?.status === 'CONFLICT_ALERT') {
        const msg =
          res.message ||
          'Khung giờ này hiện trùng với ca trực của bác sĩ tại CSYT. Hệ thống đã gửi cảnh báo xung đột tới Bác sĩ & CSYT.';
        setConflictNotice(msg);
        toast.warning('Phát hiện xung đột lịch với ca trực tại CSYT.');
      } else {
        toast.success('Đã xác nhận chốt lịch khám! Hệ thống sẽ nhắc lịch trước 24h và 2h.');
      }
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể xác nhận lịch khám.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleConfirmDeclineSchedule = async () => {
    if (!declineTarget) return;
    setActionBusyId(declineTarget.id);
    try {
      await encountersApi.confirmEncounter(declineTarget.id, { confirmed: false });
      toast.success('Đã từ chối đề xuất lịch khám này.');
      setDeclineTarget(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Không thể từ chối lịch khám.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleOpenReschedule = (enc: EncounterItem) => {
    const initialDate = extractEncounterDateIso(enc.scheduledDate) || getTodayIsoDate();
    const initialTime = extractEncounterTimeHm(enc.scheduledTime) || '14:00';
    setRescheduleTarget(enc);
    setRescheduleDate(initialDate);
    setRescheduleTime(initialTime);
    setRescheduleReason('');
    setRescheduleError('');
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    if (!rescheduleReason.trim()) {
      setRescheduleError('Vui lòng nhập lý do xin đổi lịch để bác sĩ nắm thông tin.');
      return;
    }

    setSubmitting(true);
    setRescheduleError('');
    try {
      const res = await encountersApi.requestReschedule(rescheduleTarget.id, {
        proposedDate: rescheduleDate,
        proposedTime: rescheduleTime,
        rescheduleReason: rescheduleReason.trim(),
      });

      if (res?.status === 'AUTO_REJECTED_TOO_LATE') {
        const msg =
          res.message ||
          `Yêu cầu đổi lịch bị từ chối tự động do không báo trước tối thiểu 4 giờ. Vui lòng liên hệ Hotline ${SUPPORT_HOTLINE}.`;
        setRescheduleError(`${msg} (Hotline hỗ trợ: ${SUPPORT_HOTLINE})`);
        toast.error('Không thể đổi lịch trong vòng 4 giờ trước giờ khám.');
        await loadData();
        return;
      }

      toast.success('Đã gửi yêu cầu đổi lịch mới tới Bác sĩ xem xét.');
      setRescheduleTarget(null);
      setActiveTab('awaiting_doctor');
      await loadData();
    } catch (err: any) {
      setRescheduleError(err?.message || 'Không thể gửi yêu cầu đổi lịch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER */}
        <header className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Bảng Sức Khỏe Gia Đình</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">Lịch Hẹn &amp; Điều Phối Khám</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge
                  variant="outline"
                  className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-primary bg-primary/10 border-primary/20"
                >
                  {activeContract ? `Hợp đồng #${activeContract.contractNumber}` : 'Chưa có hợp đồng hiệu lực'}
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Hotline hỗ trợ: {SUPPORT_HOTLINE}</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Lịch Khám Định Kỳ &amp; Đặt Lịch Đột Xuất
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Xem và xác nhận lịch khám định kỳ từ Bác sĩ gia đình, đề xuất đổi giờ trước tối thiểu 4 tiếng hoặc chủ động đặt lịch khám đột xuất khi thành viên có dấu hiệu bất thường.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                type="button"
                disabled={!activeContract || loading}
                onClick={handleOpenBookingModal}
                className="min-h-11 rounded-xl text-sm font-semibold gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>Đặt lịch khám đột xuất</span>
              </Button>
            </div>
          </div>
        </header>

        {loadError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-rose-600">error</span>
              <span>{loadError}</span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={loadData}>
              Thử lại
            </Button>
          </div>
        )}

        {conflictNotice && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
              <div>
                <p className="font-bold">Cảnh báo xung đột lịch với ca trực CSYT</p>
                <p className="text-xs text-amber-800 mt-0.5">{conflictNotice}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConflictNotice(null)}
              className="text-xs font-semibold text-amber-700 hover:underline shrink-0"
            >
              Đóng
            </button>
          </div>
        )}

        {!loading && !activeContract && (
          <Card className="bg-white p-6 rounded-2xl border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Gia đình chưa kích hoạt hợp đồng dịch vụ</h2>
              <p className="text-sm text-slate-600">
                Vui lòng hoàn tất ký kết và kích hoạt hợp đồng gói chăm sóc sức khỏe để bắt đầu lập lịch với Bác sĩ gia đình.
              </p>
            </div>
            <Button asChild className="rounded-xl shrink-0">
              <Link href="/family/contracts">Xem hợp đồng của gia đình</Link>
            </Button>
          </Card>
        )}

        {/* 2. THẺ HẠN MỨC GÓI KHÁM & BÁC SĨ PHỤ TRÁCH */}
        <section
          aria-label="Hạn mức và bác sĩ quản nhiệm"
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6"
        >
          <Card className="bg-white p-6 rounded-2xl border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Khám Bác sĩ Tại Nhà
              </span>
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">home_health</span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
                  {activeContract ? remainingHomeVisits : 0}
                </span>
                <span className="text-xs text-slate-400 font-medium tabular-nums">
                  / {activeContract ? totalHomeVisits : 0} lượt còn lại
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: `${activeContract && totalHomeVisits > 0 ? Math.min(100, Math.round((remainingHomeVisits / totalHomeVisits) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="bg-white p-6 rounded-2xl border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tư Vấn Video (Telehealth)
              </span>
              <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
                  {activeContract ? remainingTelehealth : 0}
                </span>
                <span className="text-xs text-slate-400 font-medium tabular-nums">
                  / {activeContract ? totalTelehealth : 0} lượt còn lại
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all"
                  style={{
                    width: `${activeContract && totalTelehealth > 0 ? Math.min(100, Math.round((remainingTelehealth / totalTelehealth) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="bg-white p-6 rounded-2xl border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bác Sĩ Quản Nhiệm Hộ
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeContract ? 'Đang phụ trách' : 'Chưa gán'}
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">stethoscope</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{doctorDisplayName}</div>
                <p className="text-xs text-primary font-medium truncate mt-0.5">{facilityDisplayName}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. KHỐI LỊCH CẦN BẠN XÁC NHẬN */}
        {actionNeededList.length > 0 && (
          <section aria-label="Lịch cần bạn xác nhận" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Lịch cần bạn xác nhận ({actionNeededList.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bác sĩ đã đề xuất lịch khám hoặc khung giờ thay thế. Vui lòng xác nhận hoặc đề xuất giờ phù hợp hơn.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {actionNeededList.map((enc) => {
                const { dateRaw, timeRaw, isCounterOffer } = getEffectiveDisplayDateAndTime(enc);
                const patientName = enc.patient?.fullName || 'Thành viên gia đình';
                const encDoctorName =
                  enc.doctor?.user?.name || enc.doctor?.doctorName || doctorDisplayName;
                const isBusy = actionBusyId === enc.id;

                return (
                  <Card
                    key={enc.id}
                    className="bg-white p-5 rounded-2xl border-2 border-amber-300/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    <div className="space-y-2.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100">
                          {isCounterOffer ? 'Bác sĩ đề xuất giờ mới' : 'Chờ gia đình xác nhận'}
                        </Badge>
                        <Badge variant="outline">{getEncounterTypeLabel(enc.encounterType)}</Badge>
                        <Badge variant="secondary">{getEncounterCategoryLabel(enc.category)}</Badge>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {patientName} — {encDoctorName}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          {enc.rescheduleReason || enc.subjectiveNote || 'Lịch khám do bác sĩ quản nhiệm đề xuất'}
                        </p>
                      </div>

                      {enc.conflictAlert && enc.conflictDetails && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          <strong>Cảnh báo xung đột:</strong> {enc.conflictDetails}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
                      <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-right">
                        <div className="text-sm font-bold tabular-nums text-amber-950">
                          {extractEncounterTimeHm(timeRaw)} · {formatEncounterDateVi(dateRaw)}
                        </div>
                        {isCounterOffer && (
                          <div className="text-[11px] text-amber-800 tabular-nums">
                            Giờ cũ: {extractEncounterTimeHm(enc.scheduledTime)} ·{' '}
                            {formatEncounterDateVi(enc.scheduledDate)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleConfirmSchedule(enc)}
                          className="rounded-xl font-semibold gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>{isCounterOffer ? 'Chấp nhận giờ mới' : 'Xác nhận lịch'}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleOpenReschedule(enc)}
                          className="rounded-xl font-semibold gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                          <span>Đề xuất giờ khác</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setDeclineTarget(enc)}
                          className="rounded-xl font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. BỘ LỌC TABS & DANH SÁCH LỊCH HẸN */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
              {[
                { id: 'upcoming', label: 'Sắp tới', count: upcomingList.length, icon: 'event_upcoming' },
                { id: 'awaiting_doctor', label: 'Chờ bác sĩ', count: awaitingDoctorList.length, icon: 'hourglass_top' },
                { id: 'history', label: 'Lịch sử', count: historyList.length, icon: 'task_alt' },
                { id: 'all', label: 'Tất cả', count: encounters.length, icon: 'list_alt' },
              ].map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as FamilyTab)}
                    className={`min-h-10 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                        isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <Card className="bg-white p-10 rounded-2xl border-slate-200/70 text-center text-sm text-slate-500">
              Đang tải dữ liệu lịch khám...
            </Card>
          ) : filteredEncounters.length === 0 ? (
            <Card className="bg-white p-10 rounded-2xl border-slate-200/70 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[24px]">event_busy</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Chưa có lịch hẹn nào trong mục này</h3>
                <p className="text-xs text-slate-500">
                  Khi Bác sĩ lên lịch định kỳ hoặc bạn đặt lịch khám đột xuất, thông tin sẽ hiển thị tại đây.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEncounters.map((enc) => {
                const statusBadge = getEncounterStatusLabel(enc);
                const patientName = enc.patient?.fullName || 'Thành viên gia đình';
                const encDoctorName =
                  enc.doctor?.user?.name || enc.doctor?.doctorName || doctorDisplayName;
                const encFacilityName = enc.doctor?.facility?.facilityName || facilityDisplayName;
                const displayDate = formatEncounterDateVi(enc.scheduledDate);
                const displayTime = extractEncounterTimeHm(enc.scheduledTime);
                const isConfirmed = enc.encounterStatus === 'CONFIRMED';
                const isTelehealth =
                  enc.encounterType === 'TELEHEALTH' || enc.encounterType === 'TELEMEDICINE';
                const isHome = enc.encounterType === 'HOME_VISIT';

                const toneClass =
                  statusBadge.tone === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : statusBadge.tone === 'warning'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : statusBadge.tone === 'danger'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : statusBadge.tone === 'info'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <Card
                    key={enc.id}
                    className="bg-white rounded-2xl border-slate-200/70 shadow-xs overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-white">
                          {getEncounterTypeLabel(enc.encounterType)}
                        </Badge>
                        <Badge variant="secondary">{getEncounterCategoryLabel(enc.category)}</Badge>
                        {typeof enc.rescheduleCount === 'number' && enc.rescheduleCount > 0 && (
                          <Badge variant="outline" className="text-[11px] tabular-nums">
                            Đã đổi {enc.rescheduleCount}/3 lần
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className={toneClass}>
                        {statusBadge.label}
                      </Badge>
                    </div>

                    <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      <div className="lg:col-span-8 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[22px]">
                              {isHome ? 'home_health' : isTelehealth ? 'videocam' : 'local_hospital'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">{patientName}</h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Bác sĩ: <strong className="text-slate-900">{encDoctorName}</strong> · {encFacilityName}
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5 text-xs text-slate-700">
                          <div>
                            <strong className="text-slate-900">Nội dung / Ghi chú: </strong>
                            <span>{enc.subjectiveNote || enc.rescheduleReason || 'Khám theo kế hoạch chăm sóc'}</span>
                          </div>
                          {isHome && (
                            <div className="text-slate-600">
                              <strong className="text-slate-800">Địa chỉ khám: </strong>
                              <span>{familyAddress}</span>
                            </div>
                          )}
                          {enc.proposedDate && enc.proposedTime && enc.encounterStatus === 'RESCHEDULE_REQUESTED' && (
                            <div className="text-sky-800 font-medium tabular-nums">
                              Giờ đề xuất mới: {extractEncounterTimeHm(enc.proposedTime)} ngày{' '}
                              {formatEncounterDateVi(enc.proposedDate)}
                            </div>
                          )}
                          {enc.conflictAlert && enc.conflictDetails && (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                              <strong>Cảnh báo xung đột:</strong> {enc.conflictDetails}
                            </div>
                          )}
                          {enc.cancelReason && enc.encounterStatus === 'CANCELLED' && (
                            <div className="text-rose-700">
                              <strong>Lý do hủy:</strong> {enc.cancelReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                        <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1">
                          <div className="font-bold tabular-nums text-base text-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                            <span>{displayTime || '—'}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-700 tabular-nums flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">
                              calendar_today
                            </span>
                            <span>{displayDate}</span>
                          </div>
                        </div>

                        {isConfirmed && (
                          <div className="space-y-2">
                            {isTelehealth && (
                              <Button asChild className="min-h-10 w-full rounded-xl text-xs font-semibold gap-1.5">
                                <Link href="/family/telemedicine">
                                  <span className="material-symbols-outlined text-[17px]">videocam</span>
                                  <span>Vào phòng khám Video</span>
                                </Link>
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReschedule(enc)}
                              className="min-h-9 w-full rounded-xl text-xs font-semibold gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[15px] text-primary">
                                edit_calendar
                              </span>
                              <span>Xin đổi giờ hẹn</span>
                            </Button>
                          </div>
                        )}

                        {enc.encounterStatus === 'COMPLETED' && (
                          <Button
                            asChild
                            variant="outline"
                            className="min-h-10 w-full rounded-xl text-primary border-primary/20 text-xs font-semibold gap-1.5"
                          >
                            <Link href="/family/members">
                              <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                              <span>Xem hồ sơ khám &amp; đơn thuốc</span>
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: ĐẶT LỊCH KHÁM ĐỘT XUẤT */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">event_available</span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-bold text-base text-white">
                  Đặt lịch khám đột xuất
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 mt-0.5">
                  Yêu cầu được gửi tới {doctorDisplayName} xem xét và chốt khung giờ khám.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateAdHocBooking} className="p-6 space-y-4 text-xs">
            {bookingError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium">
                {bookingError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="block font-semibold text-slate-700">Hình thức khám</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'HOME_VISIT' as EncounterType, label: 'Khám tại nhà' },
                  { id: 'TELEHEALTH' as EncounterType, label: 'Tư vấn Video' },
                  { id: 'FACILITY_VISIT' as EncounterType, label: 'Tại CSYT' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewBooking((prev) => ({ ...prev, encounterType: opt.id }))}
                    className={`min-h-10 px-3 py-2 rounded-xl border font-semibold transition-all cursor-pointer ${
                      newBooking.encounterType === opt.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adhoc-patient" className="block font-semibold text-slate-700">
                Thành viên cần khám
              </Label>
              <select
                id="adhoc-patient"
                value={newBooking.patientId}
                onChange={(e) => setNewBooking((prev) => ({ ...prev, patientId: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold text-slate-900"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="adhoc-date" className="block font-semibold text-slate-700">
                  Ngày mong muốn
                </Label>
                <Input
                  id="adhoc-date"
                  type="date"
                  min={getTodayIsoDate()}
                  required
                  value={newBooking.desiredDate}
                  onChange={(e) => setNewBooking((prev) => ({ ...prev, desiredDate: e.target.value }))}
                  className="h-10 rounded-xl bg-slate-50/50 font-semibold text-slate-900 tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adhoc-time" className="block font-semibold text-slate-700">
                  Khung giờ mong muốn
                </Label>
                <select
                  id="adhoc-time"
                  value={newBooking.desiredTime}
                  onChange={(e) => setNewBooking((prev) => ({ ...prev, desiredTime: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold text-slate-900 tabular-nums"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adhoc-reason" className="block font-semibold text-slate-700">
                Triệu chứng / Lý do đặt lịch
              </Label>
              <Textarea
                id="adhoc-reason"
                rows={3}
                required
                placeholder="Ví dụ: Sốt nhẹ từ hôm qua, ho khan, cần bác sĩ kiểm tra..."
                value={newBooking.reason}
                onChange={(e) => setNewBooking((prev) => ({ ...prev, reason: e.target.value }))}
                className="rounded-xl bg-slate-50/50"
              />
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBookingModal(false)}
                className="flex-1 rounded-xl font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-semibold">
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu đặt lịch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ĐỔI GIỜ HẸN KHÁM (SLA >= 4 GIỜ) */}
      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          {rescheduleTarget && (
            <>
              <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                  </div>
                  <div>
                    <DialogTitle className="font-bold text-base text-white">
                      Đề xuất đổi ngày giờ khám
                    </DialogTitle>
                    <DialogDescription className="text-xs text-blue-100">
                      Bệnh nhân: {rescheduleTarget.patient?.fullName || 'Thành viên'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="text-slate-600">
                    Lịch hiện tại:{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {extractEncounterTimeHm(rescheduleTarget.scheduledTime)} ·{' '}
                      {formatEncounterDateVi(rescheduleTarget.scheduledDate)}
                    </strong>
                  </div>
                  <div className="text-slate-600">
                    Quy định: Báo trước tối thiểu <strong className="text-slate-900">4 giờ</strong> trước giờ khám.
                  </div>
                </div>

                {rescheduleHoursRemaining !== null && rescheduleHoursRemaining < 4 && (
                  <div
                    role="status"
                    className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2"
                  >
                    <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">
                      schedule
                    </span>
                    <span>
                      Chỉ còn dưới 4 giờ trước giờ khám dự kiến. Yêu cầu đổi lịch có thể bị từ chối tự động; nếu khẩn cấp vui lòng liên hệ Hotline <strong>{SUPPORT_HOTLINE}</strong>.
                    </span>
                  </div>
                )}

                {rescheduleError && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
                  >
                    <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">
                      error
                    </span>
                    <span>{rescheduleError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitReschedule} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="reschedule-date" className="block font-semibold text-slate-700 mb-1.5">
                        Ngày khám mới
                      </Label>
                      <Input
                        id="reschedule-date"
                        type="date"
                        min={getTodayIsoDate()}
                        required
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="h-10 rounded-xl bg-slate-50/50 font-semibold text-slate-900 tabular-nums"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reschedule-time" className="block font-semibold text-slate-700 mb-1.5">
                        Khung giờ mới
                      </Label>
                      <select
                        id="reschedule-time"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-slate-50/50 font-semibold text-slate-900 tabular-nums"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reschedule-reason" className="block font-semibold text-slate-700 mb-1.5">
                      Lý do xin đổi giờ
                    </Label>
                    <Textarea
                      id="reschedule-reason"
                      rows={2}
                      required
                      placeholder="Ví dụ: Gia đình có việc bận đột xuất buổi sáng..."
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      className="rounded-xl bg-slate-50/50"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRescheduleTarget(null)}
                      className="flex-1 rounded-xl font-semibold"
                    >
                      Đóng
                    </Button>
                    <Button type="submit" disabled={submitting} className="flex-1 rounded-xl font-semibold">
                      {submitting ? 'Đang gửi...' : 'Gửi yêu cầu đổi lịch'}
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: XÁC NHẬN TỪ CHỐI ĐỀ XUẤT LỊCH */}
      <ConfirmDialog
        open={Boolean(declineTarget)}
        onOpenChange={(open) => !open && setDeclineTarget(null)}
        title="Từ chối đề xuất lịch khám?"
        description="Nếu từ chối, lịch khám này sẽ chuyển sang trạng thái đã hủy và bác sĩ sẽ được thông báo để sắp xếp lại nếu cần."
        confirmLabel="Xác nhận từ chối"
        cancelLabel="Quay lại"
        variant="destructive"
        onConfirm={handleConfirmDeclineSchedule}
      />
    </div>
  );
}
