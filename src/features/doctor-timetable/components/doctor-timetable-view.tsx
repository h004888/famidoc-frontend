'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  contractsApi,
  doctorsApi,
  encountersApi,
  type DoctorProfileDto,
  type EncounterItem,
  type EncounterRescheduleRequestItem,
} from '@/lib/api';

// Các khung giờ lâm sàng tiêu chuẩn
const CLINICAL_TIME_SLOTS = [
  { label: '08:00 - 09:30', startMin: 8 * 60, endMin: 9 * 60 + 30, period: 'Sáng' },
  { label: '09:30 - 11:00', startMin: 9 * 60 + 30, endMin: 11 * 60, period: 'Sáng' },
  { label: '11:00 - 12:30', startMin: 11 * 60, endMin: 12 * 60 + 30, period: 'Trưa' },
  { label: '14:00 - 15:30', startMin: 14 * 60, endMin: 15 * 60 + 30, period: 'Chiều' },
  { label: '15:30 - 17:00', startMin: 15 * 60 + 30, endMin: 17 * 60, period: 'Chiều' },
  { label: '18:00 - 19:30', startMin: 18 * 60, endMin: 19 * 60 + 30, period: 'Tối' },
  { label: '19:30 - 21:00', startMin: 19 * 60 + 30, endMin: 21 * 60, period: 'Tối' },
];

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Thứ 2 là ngày bắt đầu
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 9 * 60; // 09:00 default
  // Can be ISO or HH:mm
  if (timeStr.includes('T')) {
    const timePart = timeStr.split('T')[1]?.slice(0, 5) || '09:00';
    const [h, m] = timePart.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getEncounterStatusBadge(status?: string) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 h-4 font-semibold">
          Đã chốt
        </Badge>
      );
    case 'REQUESTED':
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0 h-4 font-semibold">
          Chờ duyệt
        </Badge>
      );
    case 'RESCHEDULE_REQUESTED':
      return (
        <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] px-1.5 py-0 h-4 font-semibold">
          Đổi giờ
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] px-1.5 py-0 h-4 font-semibold">
          Đang khám
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[9px] px-1.5 py-0 h-4 font-semibold">
          Đã khám
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-slate-50">
          {status || 'Đang chờ'}
        </Badge>
      );
  }
}

function getEncounterFamilyName(enc?: EncounterItem | null): string {
  if (!enc) return '';
  if (enc.contract?.familyUnit?.familyName) {
    return enc.contract.familyUnit.familyName;
  }
  const repName =
    enc.contract?.familyUnit?.representativeUser?.name ||
    enc.contract?.familyRepresentativeName;
  if (repName) return `Hộ gia đình ${repName}`;

  const pName =
    enc.patient?.fullName ||
    enc.participants?.[0]?.patient?.fullName ||
    enc.contract?.members?.[0]?.patient?.fullName;
  if (pName) return `Hộ gia đình ${pName}`;

  return `Hộ hợp đồng #${(enc.contract?.contractNumber || enc.contractId || enc.id).slice(0, 8)}`;
}

function getEncounterRepresentative(enc?: EncounterItem | null): { name: string; phone: string; emergencyPhone?: string } {
  if (!enc) return { name: 'Chưa cập nhật', phone: 'Chưa có SĐT' };
  const name =
    enc.contract?.familyUnit?.representativeUser?.name ||
    enc.contract?.familyRepresentativeName ||
    enc.patient?.fullName ||
    'Người đại diện hộ';
  const phone =
    enc.contract?.familyUnit?.representativeUser?.phone ||
    enc.contract?.familyRepresentativePhone ||
    enc.patient?.phone ||
    'Chưa có SĐT';
  const emergencyPhone = enc.contract?.familyUnit?.emergencyPhone;
  return { name, phone, emergencyPhone };
}

function getEncounterAddress(enc?: EncounterItem | null): string {
  if (!enc) return '';
  return (
    enc.contract?.familyUnit?.homeAddress ||
    enc.contract?.familyUnit?.address ||
    enc.patient?.address ||
    'Địa chỉ gia đình theo hợp đồng'
  );
}

function getEncounterPatientName(enc?: EncounterItem | null): string {
  if (!enc) return '';
  if (enc.participants && enc.participants.length > 0) {
    const names = enc.participants.map((p) => p.patient?.fullName).filter(Boolean);
    if (names.length > 0) return names.join(', ');
  }
  if (enc.patient?.fullName) return enc.patient.fullName;
  const memberPatient = enc.contract?.members?.find((m) => m.patientId === enc.patientId)?.patient?.fullName;
  if (memberPatient) return memberPatient;

  const firstMember = enc.contract?.members?.[0]?.patient?.fullName;
  if (firstMember) return firstMember;

  if (enc.visitScope === 'FAMILY') return 'Toàn bộ thành viên hộ gia đình';
  return 'Bệnh nhân gia đình';
}

export function DoctorTimetableView() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [filterType, setFilterType] = useState<'ALL' | 'HOME_VISIT' | 'TELEHEALTH'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileDto | null>(null);
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [pendingReschedules, setPendingReschedules] = useState<EncounterRescheduleRequestItem[]>([]);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [selectedEncounter, setSelectedEncounter] = useState<EncounterItem | null>(null);

  // Settings & Availability
  const [panelCap, setPanelCap] = useState({ current: 0, max: 5 });
  const [isEmergencyReady, setIsEmergencyReady] = useState(true);
  const [maxRadius, setMaxRadius] = useState(10); // km
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Modals state
  const [rescheduleTarget, setRescheduleTarget] = useState<EncounterItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:30');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Periodic Modal
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [periodicModalOpen, setPeriodicModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [contractMembers, setContractMembers] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [periodicNotes, setPeriodicNotes] = useState('');
  const [submittingPeriodic, setSubmittingPeriodic] = useState(false);

  // Ad-hoc finalize state
  const [finalizeTarget, setFinalizeTarget] = useState<EncounterItem | null>(null);
  const [finalizeNotes, setFinalizeNotes] = useState('');
  const [submittingFinalize, setSubmittingFinalize] = useState(false);

  // Counter propose state
  const [counterTarget, setCounterTarget] = useState<EncounterItem | null>(null);
  const [counterDate, setCounterDate] = useState('2026-12-07');
  const [counterTime, setCounterTime] = useState('14:00');
  const [counterNotes, setCounterNotes] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  // Cadence adjust state
  const [cadenceAdjustTarget, setCadenceAdjustTarget] = useState<EncounterItem | null>(null);
  const [cadenceAdjustDate, setCadenceAdjustDate] = useState('');
  const [cadenceAdjustTime, setCadenceAdjustTime] = useState('09:00');
  const [cadenceAdjustType, setCadenceAdjustType] = useState('HOME_VISIT');
  const [submittingCadenceAdjust, setSubmittingCadenceAdjust] = useState(false);

  // Collapsible Action Center state
  const [actionCenterExpanded, setActionCenterExpanded] = useState(true);

  // Calculate Week Information
  const mondayOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  const currentWeekNum = useMemo(() => getWeekNumber(mondayOfWeek), [mondayOfWeek]);
  const currentYearNum = mondayOfWeek.getFullYear();

  const weekDays = useMemo(() => {
    const daysName = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return daysName.map((dayName, idx) => {
      const d = new Date(mondayOfWeek);
      d.setDate(mondayOfWeek.getDate() + idx);
      const isToday =
        new Date().toDateString() === d.toDateString();
      const dateStr = `${dayName} (${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')})`;
      return {
        dayName,
        date: d,
        isoDate: formatIsoDate(d),
        isToday,
        dateStr,
      };
    });
  }, [mondayOfWeek]);

  const loadTimetableAndRequests = useCallback(() => {
    encountersApi
      .getPendingRescheduleRequests()
      .then((list) => {
        setPendingReschedules(
          (Array.isArray(list) ? list : []).filter((r) => r.doctorDecision === 'PENDING')
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadTimetableAndRequests();

    doctorsApi
      .getDoctorMe()
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setDoctorProfile(data);
          setPanelCap({
            current: data.activePanelCount ?? (data as any).currentFamilies ?? 0,
            max: data.maxPanelCapacity || (data as any).maxFamilies || 5,
          });
        }
      })
      .catch(() => {});

    encountersApi
      .getDoctorTimetable()
      .then((res) => {
        if (!isMounted) return;
        if (res && Array.isArray(res.data)) {
          setEncounters(res.data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [loadTimetableAndRequests]);

  // Handlers for Navigation
  const handlePrevMonth = () => {
    setCurrentCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handlePrevWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentCalendarMonth(d);
    setSelectedCalendarDate(formatIsoDate(today));
  };

  const handlePrevNavigation = () => {
    if (viewMode === 'month') {
      handlePrevMonth();
    } else if (viewMode === 'week') {
      handlePrevWeek();
    } else if (viewMode === 'day') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() - 1);
      setCurrentDate(next);
    } else {
      handlePrevMonth();
    }
  };

  const handleNextNavigation = () => {
    if (viewMode === 'month') {
      handleNextMonth();
    } else if (viewMode === 'week') {
      handleNextWeek();
    } else if (viewMode === 'day') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      setCurrentDate(next);
    } else {
      handleNextMonth();
    }
  };

  // Actions on Encounters
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
          ? 'Bác sĩ đã đồng ý đổi lịch khám.'
          : 'Bác sĩ đã từ chối yêu cầu đổi lịch. Lịch cũ được giữ nguyên.'
      );
      loadTimetableAndRequests();
      const res = await encountersApi.getDoctorTimetable();
      if (Array.isArray(res?.data)) setEncounters(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu đổi lịch.');
    } finally {
      setDecidingId(null);
    }
  };

  const handleOpenRescheduleModal = (enc: EncounterItem) => {
    setRescheduleTarget(enc);
    setRescheduleDate(enc.scheduledDate?.slice(0, 10) || '');
    setRescheduleTime(enc.scheduledTime?.slice(11, 16) || '09:30');
    setRescheduleReason('');
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    if (!rescheduleDate || !rescheduleTime || !rescheduleReason.trim()) {
      toast.error('Vui lòng nhập đầy đủ ngày, giờ và lý do đổi lịch.');
      return;
    }
    setSubmittingReschedule(true);
    try {
      await encountersApi.requestReschedule(rescheduleTarget.id, {
        proposedDate: rescheduleDate,
        proposedTime: rescheduleTime,
        rescheduleReason: rescheduleReason.trim(),
      });
      toast.success('Đã gửi yêu cầu đổi lịch tới Gia đình và Cơ sở Y tế phê duyệt.');
      setRescheduleTarget(null);
      loadTimetableAndRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi yêu cầu đổi lịch.');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleOpenPeriodicModal = async () => {
    setPeriodicModalOpen(true);
    try {
      const list = await contractsApi.getMedicalContracts();
      const actives = Array.isArray(list)
        ? list.filter((c: any) => c.status === 'ACTIVE' || c.contractStatus === 'ACTIVE')
        : [];
      setActiveContracts(actives);
      if (actives.length > 0) {
        const first = actives[0];
        setSelectedContractId(first.id);
        const detail = await contractsApi.getMedicalContractDetail(first.id);
        if (detail && Array.isArray((detail as any).members)) {
          setContractMembers((detail as any).members);
          if ((detail as any).members.length > 0) {
            setSelectedPatientId((detail as any).members[0].patientId);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const handleContractChange = async (ctrId: string) => {
    setSelectedContractId(ctrId);
    try {
      const detail = await contractsApi.getMedicalContractDetail(ctrId);
      if (detail && Array.isArray((detail as any).members)) {
        setContractMembers((detail as any).members);
        if ((detail as any).members.length > 0) {
          setSelectedPatientId((detail as any).members[0].patientId);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleCreatePeriodic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !selectedPatientId) {
      toast.error('Vui lòng chọn hợp đồng và thành viên khám.');
      return;
    }
    try {
      setSubmittingPeriodic(true);
      await encountersApi.createPeriodicEncounter({
        contractId: selectedContractId,
        patientId: selectedPatientId,
        encounterType: 'HOME_VISIT',
        notes: periodicNotes,
      } as any);
      toast.success('Đã lên lịch định kỳ thành công.');
      setPeriodicModalOpen(false);
      loadTimetableAndRequests();
      const res = await encountersApi.getDoctorTimetable();
      if (Array.isArray(res?.data)) setEncounters(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lên lịch định kỳ');
    } finally {
      setSubmittingPeriodic(false);
    }
  };

  const handleSubmitFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalizeTarget) return;
    try {
      setSubmittingFinalize(true);
      await encountersApi.finalizeEncounter(finalizeTarget.id, {
        encounterType: finalizeTarget.encounterType as any,
        doctorNotes: finalizeNotes,
      } as any);
      toast.success('Đã chốt lịch khám gửi gia đình.');
      setFinalizeTarget(null);
      loadTimetableAndRequests();
      const res = await encountersApi.getDoctorTimetable();
      if (Array.isArray(res?.data)) setEncounters(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chốt lịch.');
    } finally {
      setSubmittingFinalize(false);
    }
  };

  const handleAcceptReschedule = async (encId: string) => {
    try {
      await encountersApi.reviewReschedule(encId, { accept: true });
      toast.success('Đã chấp nhận giờ hẹn mới.');
      loadTimetableAndRequests();
      const res = await encountersApi.getDoctorTimetable();
      if (Array.isArray(res?.data)) setEncounters(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chấp nhận giờ hẹn.');
    }
  };

  const handleSubmitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTarget) return;
    try {
      setSubmittingCounter(true);
      await encountersApi.reviewReschedule(counterTarget.id, {
        accept: false,
        counterDate,
        counterTime,
        notes: counterNotes,
      });
      toast.success('Đã gửi đề xuất giờ mới tới Gia đình.');
      setCounterTarget(null);
      loadTimetableAndRequests();
      const res = await encountersApi.getDoctorTimetable();
      if (Array.isArray(res?.data)) setEncounters(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi đề xuất.');
    } finally {
      setSubmittingCounter(false);
    }
  };

  const handleBulkFinalizeCadence = async (contractId: string) => {
    try {
      await encountersApi.finalizeCadenceSchedule(contractId);
      toast.success('Đã chốt toàn bộ khung lịch định kỳ theo gói.');
      loadTimetableAndRequests();
      const res = await encountersApi.getDoctorTimetable();
      if (Array.isArray(res?.data)) setEncounters(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể chốt khung lịch.');
    }
  };

  const handleOpenCadenceAdjust = (enc: EncounterItem) => {
    setCadenceAdjustTarget(enc);
    setCadenceAdjustDate(enc.scheduledDate?.slice(0, 10) || '');
    setCadenceAdjustTime(enc.scheduledTime?.slice(11, 16) || '09:00');
    setCadenceAdjustType((enc.encounterType as string) || 'HOME_VISIT');
  };

  const handleSubmitCadenceAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadenceAdjustTarget) return;
    try {
      setSubmittingCadenceAdjust(true);
      await encountersApi.adjustCadenceMilestone(cadenceAdjustTarget.id, {
        scheduledDate: cadenceAdjustDate,
        scheduledTime: cadenceAdjustTime,
        encounterType: cadenceAdjustType as any,
      });
      toast.success('Đã cập nhật mốc khám định kỳ.');
      setCadenceAdjustTarget(null);
      loadTimetableAndRequests();
      const res = await encountersApi.getDoctorTimetable();
      if (Array.isArray(res?.data)) setEncounters(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể điều chỉnh mốc khám.');
    } finally {
      setSubmittingCadenceAdjust(false);
    }
  };

  // Pending items computation for Action Center
  const adHocPending = useMemo(
    () => encounters.filter((e) => e.category === 'AD_HOC_ON_DEMAND' && e.encounterStatus === 'REQUESTED'),
    [encounters]
  );

  const reschedulePending = useMemo(
    () =>
      encounters.filter(
        (e) =>
          e.encounterStatus === 'RESCHEDULE_REQUESTED' ||
          (e.category !== 'AD_HOC_ON_DEMAND' && e.proposedBy === 'FAMILY_REP')
      ),
    [encounters]
  );

  const cadenceDrafts = useMemo(
    () =>
      encounters.filter(
        (e) =>
          e.category === 'PERIODIC_ROUTINE' &&
          (e.proposedBy === 'SYSTEM_CADENCE' ||
            (e.rescheduleReason && e.rescheduleReason.includes('"isCadenceDraft":true')))
      ),
    [encounters]
  );

  const totalPendingCount =
    pendingReschedules.length + adHocPending.length + reschedulePending.length + cadenceDrafts.length;

  // Filtered encounters
  const filteredEncounters = useMemo(() => {
    return encounters.filter((e) => {
      if (filterType === 'HOME_VISIT' && e.encounterType !== 'HOME_VISIT') return false;
      if (filterType === 'TELEHEALTH' && e.encounterType !== 'TELEHEALTH') return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pName = e.patient?.fullName?.toLowerCase() || '';
        const cNum = e.contract?.contractNumber?.toLowerCase() || '';
        if (!pName.includes(query) && !cNum.includes(query)) return false;
      }
      return true;
    });
  }, [encounters, filterType, searchQuery]);

  const currentMonthTitle = useMemo(() => {
    return currentCalendarMonth.toLocaleDateString('vi-VN', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentCalendarMonth]);

  // Compute 7-column Calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let firstDayOfWeek = firstDay.getDay() - 1; // 0 = Thứ 2, 6 = Chủ Nhật
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;

    const days = [];
    // Ngày tháng trước bù vào tuần đầu
    for (let i = firstDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      const iso = formatIsoDate(d);
      days.push({
        date: d,
        isoDate: iso,
        dayNum: d.getDate(),
        isCurrentMonth: false,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }

    // Các ngày trong tháng hiện tại
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const iso = formatIsoDate(d);
      days.push({
        date: d,
        isoDate: iso,
        dayNum: d.getDate(),
        isCurrentMonth: true,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }

    // Ngày tháng sau bù vào tuần cuối
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const iso = formatIsoDate(d);
        days.push({
          date: d,
          isoDate: iso,
          dayNum: d.getDate(),
          isCurrentMonth: false,
          isToday: d.toDateString() === new Date().toDateString(),
        });
      }
    }

    return days;
  }, [currentCalendarMonth]);

  const displayMonthEncounters = useMemo(() => {
    if (selectedCalendarDate) {
      const onDate = filteredEncounters.filter(
        (e) => (e.scheduledDate ? e.scheduledDate.slice(0, 10) : '') === selectedCalendarDate
      );
      if (onDate.length > 0) return onDate;
    }
    const targetYear = currentCalendarMonth.getFullYear();
    const targetMonth = currentCalendarMonth.getMonth();
    const inMonth = filteredEncounters.filter((e) => {
      if (!e.scheduledDate) return false;
      const d = new Date(e.scheduledDate);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
    if (inMonth.length > 0) return inMonth;
    return filteredEncounters;
  }, [filteredEncounters, selectedCalendarDate, currentCalendarMonth]);

  const navTitle = useMemo(() => {
    if (viewMode === 'month') {
      return currentMonthTitle;
    }
    if (viewMode === 'week') {
      return `${String(weekDays[0].date.getDate()).padStart(2, '0')}/${String(
        weekDays[0].date.getMonth() + 1
      ).padStart(2, '0')} – ${String(weekDays[5].date.getDate()).padStart(2, '0')}/${String(
        weekDays[5].date.getMonth() + 1
      ).padStart(2, '0')}/${currentYearNum}`;
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return currentMonthTitle;
  }, [viewMode, currentMonthTitle, weekDays, currentYearNum, currentDate]);

  const todayIso = useMemo(() => formatIsoDate(new Date()), []);
  const todayEncounters = useMemo(() => {
    return encounters
      .filter((e) => (e.scheduledDate ? e.scheduledDate.slice(0, 10) : '') === todayIso)
      .sort((a, b) => parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime));
  }, [encounters, todayIso]);

  const nextEncounter = useMemo(() => {
    if (todayEncounters.length === 0) return null;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    return todayEncounters.find((e) => parseTimeToMinutes(e.scheduledTime) >= nowMin - 30) || todayEncounters[0];
  }, [todayEncounters]);

  const todayHomeCount = todayEncounters.filter((e) => e.encounterType === 'HOME_VISIT').length;
  const todayTeleCount = todayEncounters.filter((e) => e.encounterType === 'TELEHEALTH').length;

  const monthlyHomeCount = displayMonthEncounters.filter((e) => e.encounterType === 'HOME_VISIT').length;
  const monthlyTeleCount = displayMonthEncounters.filter((e) => e.encounterType === 'TELEHEALTH').length;
  const monthlyCompletedCount = displayMonthEncounters.filter((e) => e.encounterStatus === 'COMPLETED').length;

  const facilityName =
    doctorProfile?.facility?.facilityName || (doctorProfile as any)?.facilityName || 'BV Đại học Y Dược';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* TẦNG 1: HEADER & PRIMARY CONTROL BAR */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Thời Gian Biểu Lâm Sàng &amp; Quản Lý Hạn Mức
              </h1>
              <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20 tabular-nums shrink-0">
                Tuần {currentWeekNum} / {currentYearNum}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
              Điều phối thời gian biểu khám tại nhà và tư vấn từ xa, kiểm soát trần số lượng bệnh nhân phụ trách (Panel Cap) tránh quá tải.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleOpenPeriodicModal()}
              className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 shadow-xs bg-primary hover:bg-primary/90 text-white"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Lên lịch định kỳ</span>
            </Button>

            <Button asChild size="sm" variant="outline" className="h-10 px-4 rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5">
              <Link href="/doctor/encounters">
                <span className="material-symbols-outlined text-[18px] text-slate-500">today</span>
                <span>Xem ca khám hôm nay</span>
              </Link>
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setSettingsModalOpen(true)}
              className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Cài đặt khả dụng & cấu hình"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </Button>
          </div>
        </header>

        {/* TẦNG 2: KPI & CLINICAL SCHEDULE SUMMARY (OPTION A) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Lịch Trình Hôm Nay & Ca Kế Tiếp */}
          <Card className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">today</span>
                  Lịch Trình Hôm Nay
                </span>
                <Badge variant="outline" className="text-xs font-bold text-primary bg-primary/10 border-primary/20">
                  {todayEncounters.length} ca hẹn
                </Badge>
              </div>

              {nextEncounter ? (
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                      Ca khám sắp tới
                    </Badge>
                    <span className="text-xs font-bold text-slate-900 tabular-nums flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-[15px]">schedule</span>
                      {nextEncounter.scheduledTime?.includes('T')
                        ? nextEncounter.scheduledTime.slice(11, 16)
                        : nextEncounter.scheduledTime?.slice(0, 5) || '09:00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[17px] shrink-0">family_restroom</span>
                        <span className="truncate">{getEncounterFamilyName(nextEncounter)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        BN: <strong className="text-slate-800">{getEncounterPatientName(nextEncounter)}</strong> · {nextEncounter.encounterType === 'HOME_VISIT' ? 'Khám Bác sĩ tại nhà' : 'Tư vấn Telehealth'}
                      </p>
                    </div>
                    {nextEncounter.encounterType === 'TELEHEALTH' ? (
                      <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 shrink-0 h-8 px-3 shadow-2xs">
                        <Link href={`/doctor/telehealth/${nextEncounter.id}`}>
                          <span className="material-symbols-outlined text-[15px]">videocam</span>
                          <span>Vào phòng</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0 h-8 px-3 shadow-2xs">
                        <Link href="/doctor/encounters">
                          <span className="material-symbols-outlined text-[15px]">clinical_notes</span>
                          <span>Mở SOAP</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 text-slate-400 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-400">event_available</span>
                  <span>Hôm nay bạn không có ca khám nào cần thực hiện.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Khám tại nhà: <strong className="text-slate-800 tabular-nums">{todayHomeCount} ca</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Telehealth: <strong className="text-primary tabular-nums">{todayTeleCount} ca</strong>
              </span>
            </div>
          </Card>

          {/* Card 2: Khối Lượng Khám Trong Tháng */}
          <Card className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">calendar_month</span>
                  Khối Lượng Khám {currentMonthTitle}
                </span>
                <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-slate-50 border-slate-200">
                  Tổng {displayMonthEncounters.length} ca
                </Badge>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                  {displayMonthEncounters.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">ca khám đã lên lịch trong tháng</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-800 tabular-nums">{monthlyHomeCount} ca</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Khám tại nhà</div>
                </div>
                <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                  <div className="text-xs font-bold text-blue-800 tabular-nums">{monthlyTeleCount} ca</div>
                  <div className="text-[10px] text-blue-600 font-medium">Telehealth</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-800 tabular-nums">{monthlyCompletedCount} ca</div>
                  <div className="text-[10px] text-slate-500 font-medium">Đã hoàn tất</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              Nhấp vào từng ngày trên bảng lịch tháng bên dưới để xem chi tiết lịch trình di chuyển và tư vấn.
            </p>
          </Card>
        </div>

        {/* TẦNG 3: TRUNG TÂM XỬ LÝ YÊU CẦU LỊCH KHÁM (UNIFIED ACTION INBOX) */}
        {totalPendingCount > 0 && (
          <Card className="bg-amber-50/50 border-amber-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-amber-500/10 border-b border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-700 text-2xl">pending_actions</span>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-amber-950 flex items-center gap-2">
                    Trung Tâm Phê Duyệt Lịch Khám
                    <Badge className="bg-amber-600 text-white border-none text-[11px] font-bold px-2 py-0.5">
                      {totalPendingCount} yêu cầu cần bạn xử lý
                    </Badge>
                  </h2>
                  <p className="text-xs text-amber-800">
                    Bao gồm yêu cầu khám đột xuất từ gia đình, đề xuất dời giờ khám và khung lịch định kỳ theo gói cả năm.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setActionCenterExpanded(!actionCenterExpanded)}
                className="rounded-xl text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100/60 self-start sm:self-auto shrink-0"
              >
                {actionCenterExpanded ? 'Thu gọn danh sách ▲' : 'Mở rộng xử lý ▼'}
              </Button>
            </div>

            {actionCenterExpanded && (
              <div className="p-4 sm:p-6 space-y-6 bg-white/70">
                {/* 1. CSYT Pending Reschedules */}
                {pendingReschedules.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-700">emergency</span>
                      Yêu cầu đổi lịch chờ Bác sĩ duyệt ({pendingReschedules.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pendingReschedules.map((req) => (
                        <div
                          key={req.id}
                          className="bg-white rounded-xl border border-amber-200/90 p-4 flex flex-col justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1 text-xs">
                            <div className="font-bold text-slate-900">
                              Gia đình xin đổi sang {req.proposedDate?.slice(0, 10)} lúc {req.proposedTime?.slice(11, 16)}
                            </div>
                            <p className="text-slate-600">{req.reason}</p>
                            <p className="text-[11px] text-slate-500">
                              CSYT: {req.facilityDecision === 'APPROVED' ? 'Đã đồng ý' : 'Đang chờ duyệt'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              disabled={decidingId === req.id}
                              onClick={() => void handleDecideReschedule(req.encounterId, req.id, 'APPROVE')}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition-colors shadow-2xs"
                            >
                              Đồng ý
                            </button>
                            <button
                              type="button"
                              disabled={decidingId === req.id}
                              onClick={() => void handleDecideReschedule(req.encounterId, req.id, 'REJECT')}
                              className="px-3.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                              Từ chối
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Ad-hoc Requests */}
                {adHocPending.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-orange-600">notification_important</span>
                      Yêu cầu khám đột xuất (Ad-hoc) ({adHocPending.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {adHocPending.map((enc) => (
                        <div key={enc.id} className="bg-white rounded-xl border border-orange-200/90 p-4 space-y-2 text-xs shadow-2xs">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{enc.patient?.fullName || 'Bệnh nhân'}</div>
                              <div className="text-slate-500 font-medium">Hợp đồng: {enc.contract?.contractNumber || enc.contractId.slice(0, 8)}</div>
                              <div className="text-slate-700 mt-1 font-normal bg-orange-50/60 p-2 rounded-lg border border-orange-100">
                                {enc.subjectiveNote || 'Yêu cầu khám đột xuất theo triệu chứng'}
                              </div>
                            </div>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 shrink-0">Khám đột xuất</Badge>
                          </div>
                          <div className="pt-2 flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setFinalizeTarget(enc);
                                setFinalizeNotes('');
                              }}
                              className="rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">done_all</span>
                              <span>Duyệt &amp; Hoàn tất lịch</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Reschedule Requests from Family */}
                {reschedulePending.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">update</span>
                      Yêu cầu đổi lịch từ Gia đình ({reschedulePending.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reschedulePending.map((enc) => (
                        <div key={enc.id} className="bg-white rounded-xl border border-amber-200/90 p-4 space-y-2 text-xs shadow-2xs">
                          <div className="font-bold text-slate-900">
                            {enc.patient?.fullName || 'Bệnh nhân'} xin đổi sang {enc.proposedDate?.slice(0, 10) || enc.scheduledDate?.slice(0, 10)} lúc {enc.proposedTime?.slice(11, 16) || '15:30'}
                          </div>
                          {enc.rescheduleReason && <p className="text-slate-600 bg-amber-50/50 p-2 rounded-lg">{enc.rescheduleReason}</p>}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => void handleAcceptReschedule(enc.id)}
                              className="rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                            >
                              Chấp nhận giờ mới
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCounterTarget(enc);
                                setCounterNotes('');
                              }}
                              className="rounded-lg text-xs font-semibold border-amber-300 text-amber-800 hover:bg-amber-100"
                            >
                              Đề xuất giờ khác
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Cadence Drafts Section */}
                {cadenceDrafts.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-purple-200/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-purple-700">auto_schedule</span>
                          Khung Lịch Định Kỳ Theo Gói Cần Duyệt ({cadenceDrafts.length})
                        </h3>
                        <p className="text-xs text-purple-800 mt-0.5">
                          Hệ thống đã tự động tính toán khung lịch khám cả năm dựa trên gói dịch vụ. Bác sĩ có thể giữ nguyên toàn bộ hoặc tùy chỉnh từng mốc.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const firstDraft = cadenceDrafts[0];
                          if (firstDraft?.contractId) void handleBulkFinalizeCadence(firstDraft.contractId);
                        }}
                        className="rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shrink-0 shadow-2xs gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">task_alt</span>
                        <span>Giữ nguyên khung lịch</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cadenceDrafts.map((enc) => (
                        <div key={enc.id} className="bg-white rounded-xl border border-purple-200/90 p-4 flex flex-col justify-between gap-3 text-xs shadow-2xs">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {enc.scheduledDate?.slice(0, 10)} lúc {enc.scheduledTime?.slice(11, 16)} · {enc.encounterType === 'HOME_VISIT' ? 'Khám tại nhà' : 'Telehealth'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                Khung lịch dự kiến theo gói
                              </span>
                            </div>
                            <p className="text-slate-600">
                              {enc.patient?.fullName || 'Thành viên gia đình'} (Hợp đồng: {enc.contract?.contractNumber || enc.contractId.slice(0, 8)})
                            </p>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCadenceAdjust(enc)}
                              className="rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              Tùy chỉnh lịch
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* TẦNG 4: TOOLBAR ĐIỀU HƯỚNG LỊCH & BỘ LỌC CHUYÊN SÂU */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Cụm điều hướng Tháng / Tuần / Ngày */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="rounded-xl text-xs font-semibold h-9 px-3.5 shadow-2xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Hôm nay
            </Button>

            <div className="flex items-center rounded-xl border border-slate-200/90 bg-slate-50/70 p-0.5 shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevNavigation}
                className="h-8 w-8 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                title="Lùi lại"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </Button>
              <div className="px-3 text-xs font-bold text-slate-800 whitespace-nowrap flex items-center gap-1.5 tabular-nums capitalize">
                <span className="material-symbols-outlined text-[15px] text-primary">calendar_month</span>
                <span>{navTitle}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextNavigation}
                className="h-8 w-8 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                title="Tiến lên"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </Button>
            </div>
          </div>

          {/* Cụm Chuyển đổi View */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View mode buttons */}
            <div className="flex items-center rounded-xl border border-slate-200/90 p-1 bg-slate-50/80 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-primary shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                <span>Tháng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white text-primary shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">calendar_view_week</span>
                <span>Tuần</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'day'
                    ? 'bg-white text-primary shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">calendar_view_day</span>
                <span>Ngày</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">format_list_bulleted</span>
                <span>Danh sách</span>
              </button>
            </div>
          </div>
        </div>

        {/* TẦNG 5: BẢNG LỊCH THỜI GIAN THỰC (INTERACTIVE TIMETABLE GRID) */}
        {/* VIEW MODE: MONTH (BẢNG LỊCH THÁNG TRỰC QUAN NHƯ BÊN GIA ĐÌNH) */}
        {viewMode === 'month' && (
          <Card className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
            {/* Header */}
            <div className="pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                <span>Bảng Lịch Phân Bổ Lâm Sàng &amp; Thăm Khám Hộ Gia Đình</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Toàn cảnh lịch làm việc trong tháng: Nhấp vào từng ngày để lọc nhanh danh sách ca hẹn hoặc xem toàn bộ bên dưới.
              </p>
            </div>

            {/* 7-column Month Calendar Grid */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span>Thứ 2</span>
                <span>Thứ 3</span>
                <span>Thứ 4</span>
                <span>Thứ 5</span>
                <span>Thứ 6</span>
                <span>Thứ 7</span>
                <span className="text-rose-500">Chủ Nhật</span>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((day, idx) => {
                  const dayEncounters = filteredEncounters.filter(
                    (e) => (e.scheduledDate ? e.scheduledDate.slice(0, 10) : '') === day.isoDate
                  );
                  const isSelected = selectedCalendarDate === day.isoDate;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCalendarDate(selectedCalendarDate === day.isoDate ? '' : day.isoDate)}
                      className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.03]'
                          : day.isCurrentMonth
                          ? 'border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                          : 'border-slate-100 bg-slate-50/40 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold rounded-md px-1.5 py-0.5 leading-none ${
                            day.isToday
                              ? 'bg-primary text-white shadow-2xs'
                              : isSelected
                              ? 'text-primary font-extrabold'
                              : 'text-slate-700'
                          }`}
                        >
                          {day.dayNum}
                        </span>
                        {dayEncounters.length > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                              {dayEncounters.length}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 mt-1">
                        {dayEncounters.slice(0, 2).map((enc) => {
                          const isHome = enc.encounterType === 'HOME_VISIT';
                          const isCadence =
                            enc.proposedBy === 'SYSTEM_CADENCE' ||
                            (enc.rescheduleReason && enc.rescheduleReason.includes('"isCadenceDraft":true'));
                          const time = enc.scheduledTime?.includes('T')
                            ? enc.scheduledTime.slice(11, 16)
                            : enc.scheduledTime?.slice(0, 5) || '09:00';
                          const pName =
                            enc.patient?.fullName ||
                            (enc.visitScope === 'FAMILY' ? 'Cả nhà' : `BN #${enc.id.slice(0, 4)}`);

                          return (
                            <div
                              key={enc.id}
                              className={`p-1 rounded-md text-[9px] sm:text-[10px] font-semibold truncate flex items-center gap-1 ${
                                isCadence
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : isHome
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-900 border border-blue-200'
                              }`}
                              title={`${time} - ${pName} (${isHome ? 'Khám tại nhà' : 'Telehealth'})`}
                            >
                              <span className="material-symbols-outlined text-[11px] shrink-0">
                                {isCadence ? 'event_upcoming' : isHome ? 'home_health' : 'videocam'}
                              </span>
                              <span className="truncate">
                                {time} · {pName}
                              </span>
                            </div>
                          );
                        })}
                        {dayEncounters.length > 2 && (
                          <div className="text-[9px] font-bold text-slate-500 pl-1">
                            +{dayEncounters.length - 2} ca nữa
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section: Hợp nhất chi tiết các ca khám bên dưới lịch */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">event_note</span>
                    <span>
                      {selectedCalendarDate
                        ? `Lịch hẹn khám ngày ${selectedCalendarDate}`
                        : `Danh sách toàn bộ lịch khám trong ${currentMonthTitle}`}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedCalendarDate
                      ? `Hiển thị các ca hẹn của ngày bạn vừa chọn trên bảng lịch.`
                      : 'Bấm vào một ngày trên lịch để lọc nhanh, hoặc xem tất cả các ca khám bên dưới.'}
                  </p>
                </div>

                {selectedCalendarDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCalendarDate('')}
                    className="text-xs text-slate-600 hover:text-slate-900 self-start sm:self-auto gap-1"
                  >
                    <span>Xem tất cả ca trong tháng</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </Button>
                )}
              </div>

              {displayMonthEncounters.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
                  <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
                  <p>Không có ca khám nào {selectedCalendarDate ? 'vào ngày này' : 'trong tháng này'}.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleOpenPeriodicModal()}
                    className="rounded-xl text-xs font-semibold"
                  >
                    + Lên lịch khám mới
                  </Button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {displayMonthEncounters.map((enc) => {
                    const isHome = enc.encounterType === 'HOME_VISIT';
                    const isCadence =
                      enc.proposedBy === 'SYSTEM_CADENCE' ||
                      (enc.rescheduleReason && enc.rescheduleReason.includes('"isCadenceDraft":true'));
                    const patientName =
                      enc.participants && enc.participants.length > 0
                        ? enc.participants.map((p) => p.patient?.fullName).filter(Boolean).join(', ')
                        : enc.patient?.fullName ||
                          (enc.visitScope === 'FAMILY' ? 'Toàn bộ hộ gia đình' : `Bệnh nhân #${enc.id.slice(0, 6)}`);
                    const timeStr = enc.scheduledTime?.includes('T')
                      ? enc.scheduledTime.slice(11, 16)
                      : enc.scheduledTime?.slice(0, 5) || '09:00';
                    const dateStr = enc.scheduledDate?.slice(0, 10) || '';

                    return (
                      <Card
                        key={enc.id}
                        className="group bg-white rounded-2xl border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden space-y-4 p-5 sm:p-6"
                      >
                        <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Badge
                              variant="outline"
                              className={`gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                                isCadence
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : isHome
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isCadence ? 'event_upcoming' : isHome ? 'home_health' : 'videocam'}
                              </span>
                              <span>
                                {isCadence ? 'Lịch Định Kỳ Dự Kiến' : isHome ? 'Khám Bác Sĩ Tại Nhà' : 'Tư Vấn Telehealth'}
                              </span>
                            </Badge>
                            <span className="text-xs font-bold tabular-nums text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                              #{enc.id.slice(0, 8)}
                            </span>
                            <Badge variant="outline" className="text-xs px-2.5 py-0.5 bg-slate-50 text-slate-600 border-slate-200">
                              {enc.visitScope === 'FAMILY' ? 'Toàn diện hộ gia đình' : 'Cá nhân thành viên'}
                            </Badge>
                          </div>
                          <div>{getEncounterStatusBadge(enc.encounterStatus)}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-slate-400">Hộ gia đình & Bệnh nhân</div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-primary text-[18px]">
                                family_restroom
                              </span>
                              <span>{getEncounterFamilyName(enc)}</span>
                            </div>
                            <div className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                              <span className="material-symbols-outlined text-slate-400 text-[14px]">person</span>
                              <span>BN: {getEncounterPatientName(enc)}</span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Đại diện: {getEncounterRepresentative(enc).name} · {getEncounterRepresentative(enc).phone}
                            </div>
                            {isHome && (
                              <div className="text-xs text-emerald-800 flex items-start gap-1 mt-1 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-100">
                                <span className="material-symbols-outlined text-emerald-600 text-[15px] shrink-0">pin_drop</span>
                                <span className="line-clamp-1">{getEncounterAddress(enc)}</span>
                              </div>
                            )}
                            <div className="text-xs text-slate-400">
                              HĐ: {enc.contract?.contractNumber || enc.contractId.slice(0, 8)}
                              {enc.contract?.servicePackage?.packageName && ` · ${enc.contract.servicePackage.packageName}`}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-400">Thời gian khám</div>
                            <div className="font-bold text-sm text-slate-900 tabular-nums flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                              <span>{timeStr} · Ngày {dateStr}</span>
                            </div>
                            <div className="text-xs text-slate-500">Thời lượng tiêu chuẩn: 45 phút</div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs font-medium text-slate-400">Ghi chú lâm sàng / Triệu chứng</div>
                            <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {enc.subjectiveNote || enc.rescheduleReason || 'Thăm khám định kỳ theo tiến trình hợp đồng y tế.'}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs text-slate-500">
                            Phân loại: <strong className="text-slate-800">{enc.category === 'AD_HOC_ON_DEMAND' ? 'Khám đột xuất' : 'Lịch định kỳ theo gói'}</strong>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {enc.encounterType === 'TELEHEALTH' ? (
                              <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs">
                                <Link href={`/doctor/telehealth/${enc.id}`}>
                                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                                  <span>Vào phòng tư vấn Telehealth</span>
                                </Link>
                              </Button>
                            ) : (
                              <Button asChild size="sm" className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-2xs">
                                <Link href="/doctor/encounters">
                                  <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                                  <span>Mở Bệnh Án SOAP / Bắt đầu khám</span>
                                </Link>
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRescheduleModal(enc)}
                              className="rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">schedule</span>
                              <span>Đổi giờ hẹn</span>
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEncounter(enc)}
                              className="rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Chi tiết
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* TẦNG 5: BẢNG LỊCH THỜI GIAN THỰC (INTERACTIVE TIMETABLE GRID) */}
        {viewMode === 'week' && (
          <Card className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                <span>Thời Gian Biểu Lâm Sàng (Thứ Hai - Thứ Bảy)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Khung giờ phục vụ chuẩn: 08:00 – 21:00 · Nhấp vào từng ca khám để xem chi tiết bệnh án và điều phối
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table className="text-xs min-w-[920px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200 text-slate-600 hover:bg-slate-50/80">
                    <TableHead className="p-3.5 w-36 border-r border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">
                      Khung giờ
                    </TableHead>
                    {weekDays.map((d, idx) => (
                      <TableHead
                        key={idx}
                        className={`p-3 text-center transition-colors ${
                          idx < 5 ? 'border-r border-slate-200/80' : ''
                        } ${
                          d.isToday
                            ? 'bg-primary/[0.08] border-b-2 border-b-primary'
                            : 'border-b border-slate-200/80'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${d.isToday ? 'text-primary' : 'text-slate-500'}`}>
                            {d.dayName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-extrabold tabular-nums ${d.isToday ? 'text-primary' : 'text-slate-800'}`}>
                              {String(d.date.getDate()).padStart(2, '0')}/{String(d.date.getMonth() + 1).padStart(2, '0')}
                            </span>
                            {d.isToday && (
                              <Badge className="bg-primary text-white text-[9px] px-1.5 py-0 h-4 font-bold shadow-2xs">
                                Hôm nay
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-slate-900">
                  {CLINICAL_TIME_SLOTS.map((slot, slotIdx) => (
                    <TableRow key={slotIdx} className="hover:bg-slate-50/30">
                      <TableCell className="p-3 tabular-nums border-r border-slate-200/80 bg-slate-50/50 whitespace-nowrap align-top">
                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                            <span>{slot.label}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 h-4 font-semibold border-none ${
                              slot.period === 'Sáng'
                                ? 'bg-amber-50 text-amber-700'
                                : slot.period === 'Trưa'
                                ? 'bg-yellow-50 text-yellow-800'
                                : slot.period === 'Chiều'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {slot.period}
                          </Badge>
                        </div>
                      </TableCell>

                      {weekDays.map((d, dayIdx) => {
                        // Find encounters matching this day and slot
                        const matchingEncounters = filteredEncounters.filter((enc) => {
                          const eDate = enc.scheduledDate ? enc.scheduledDate.slice(0, 10) : '';
                          if (eDate !== d.isoDate) return false;
                          const minutes = parseTimeToMinutes(enc.scheduledTime);
                          return minutes >= slot.startMin - 15 && minutes < slot.endMin + 15;
                        });

                        return (
                          <TableCell
                            key={dayIdx}
                            className={`p-2.5 align-top min-w-[170px] ${
                              dayIdx < 5 ? 'border-r border-slate-200/70' : ''
                            } ${d.isToday ? 'bg-primary/[0.02]' : ''}`}
                          >
                            {matchingEncounters.length > 0 ? (
                              <div className="space-y-2">
                                {matchingEncounters.map((item) => {
                                  const isHome = item.encounterType === 'HOME_VISIT';
                                  const isCadence =
                                    item.proposedBy === 'SYSTEM_CADENCE' ||
                                    (item.rescheduleReason && item.rescheduleReason.includes('"isCadenceDraft":true'));

                                  const patientName =
                                    item.participants && item.participants.length > 0
                                      ? item.participants.map((p) => p.patient?.fullName).filter(Boolean).join(', ')
                                      : item.patient?.fullName ||
                                        (item.visitScope === 'FAMILY'
                                          ? 'Toàn bộ gia đình'
                                          : `BN #${(item.patientId ?? item.id).slice(0, 5)}`);

                                  const timeStr = item.scheduledTime?.includes('T')
                                    ? item.scheduledTime.slice(11, 16)
                                    : item.scheduledTime?.slice(0, 5) || '09:00';

                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => setSelectedEncounter(item)}
                                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group ${
                                        isCadence
                                          ? 'bg-purple-50/70 border-purple-200 border-l-4 border-l-purple-500 hover:border-purple-400'
                                          : isHome
                                          ? 'bg-emerald-50/70 border-emerald-200 border-l-4 border-l-emerald-500 hover:border-emerald-400'
                                          : 'bg-blue-50/70 border-blue-200 border-l-4 border-l-blue-500 hover:border-blue-400'
                                      }`}
                                    >
                                      {/* Top row: Type + Time */}
                                      <div className="flex items-center justify-between gap-1 mb-1.5">
                                        <span
                                          className={`flex items-center gap-1 font-bold text-[11px] truncate ${
                                            isCadence
                                              ? 'text-purple-700'
                                              : isHome
                                              ? 'text-emerald-700'
                                              : 'text-blue-700'
                                          }`}
                                        >
                                          <span className="material-symbols-outlined text-[15px]">
                                            {isCadence ? 'event_upcoming' : isHome ? 'home_health' : 'videocam'}
                                          </span>
                                          <span>{isCadence ? 'Lịch dự kiến' : isHome ? 'Khám Tại Nhà' : 'Telehealth'}</span>
                                        </span>
                                        <span className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-slate-700 shrink-0">
                                          {timeStr}
                                        </span>
                                      </div>

                                      {/* Middle: Household & Patient */}
                                      <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px] text-primary shrink-0">
                                          family_restroom
                                        </span>
                                        <span className="truncate">{getEncounterFamilyName(item)}</span>
                                      </div>
                                      <div className="text-[11px] text-slate-600 truncate mt-0.5">
                                        BN: {getEncounterPatientName(item)}
                                      </div>
                                      {isHome && (
                                        <div className="text-[10px] text-emerald-800 truncate flex items-center gap-0.5 mt-0.5">
                                          <span className="material-symbols-outlined text-[12px] text-emerald-600 shrink-0">pin_drop</span>
                                          <span className="truncate">{getEncounterAddress(item)}</span>
                                        </div>
                                      )}

                                      {/* Bottom: Contract ID & Status */}
                                      <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-slate-200/50 text-[10px]">
                                        <span className="text-slate-500 truncate font-medium">
                                          {item.contract?.contractNumber || 'HĐ Gói'}
                                        </span>
                                        {getEncounterStatusBadge(item.encounterStatus)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenPeriodicModal()}
                                className="w-full h-full min-h-[72px] rounded-xl border border-dashed border-slate-200/80 bg-slate-50/20 hover:bg-primary/[0.04] hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-primary cursor-pointer group p-2"
                                title="Bấm để lên lịch khám cho khung giờ này"
                              >
                                <span className="material-symbols-outlined text-[18px] opacity-40 group-hover:opacity-100 transition-opacity">
                                  add_circle
                                </span>
                                <span className="text-[10px] font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                                  Thêm lịch
                                </span>
                              </button>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* VIEW MODE: DAY (CHẾ ĐỘ XEM NGÀY CHI TIẾT) */}
        {viewMode === 'day' && (
          <Card className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lịch trình ngày {currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xem chi tiết các mốc khám và lộ trình di chuyển phục vụ khám tại nhà.
                </p>
              </div>
              <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-primary bg-primary/5">
                {filteredEncounters.filter((e) => e.scheduledDate?.slice(0, 10) === formatIsoDate(currentDate)).length} ca hẹn
              </Badge>
            </div>

            <div className="space-y-3">
              {filteredEncounters.filter((e) => e.scheduledDate?.slice(0, 10) === formatIsoDate(currentDate)).length > 0 ? (
                filteredEncounters
                  .filter((e) => e.scheduledDate?.slice(0, 10) === formatIsoDate(currentDate))
                  .sort((a, b) => parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime))
                  .map((enc) => {
                    const isHome = enc.encounterType === 'HOME_VISIT';
                    return (
                      <div
                        key={enc.id}
                        onClick={() => setSelectedEncounter(enc)}
                        className="p-4 rounded-xl border border-slate-200/80 hover:border-primary/50 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer bg-slate-50/30"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-3 rounded-xl shrink-0 ${
                              isHome ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-2xl">
                              {isHome ? 'home_health' : 'videocam'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 flex items-center gap-1">
                                <span className="material-symbols-outlined text-primary text-[17px]">family_restroom</span>
                                {getEncounterFamilyName(enc)}
                              </span>
                              <Badge className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 border-slate-200">
                                {isHome ? 'Khám tại nhà' : 'Tư vấn Telehealth'}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-700 font-semibold">
                              BN: {getEncounterPatientName(enc)} · Đại diện: {getEncounterRepresentative(enc).name} ({getEncounterRepresentative(enc).phone})
                            </div>
                            {isHome && (
                              <div className="text-xs text-emerald-800 flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[14px] text-emerald-600">pin_drop</span>
                                <span>{getEncounterAddress(enc)}</span>
                              </div>
                            )}
                            <p className="text-xs text-slate-500">
                              Hợp đồng: {enc.contract?.contractNumber || enc.contractId} · Trạng thái: {enc.encounterStatus}
                            </p>
                            {enc.subjectiveNote && (
                              <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                                {enc.subjectiveNote}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          <div className="text-right">
                            <div className="text-base font-bold text-slate-900 tabular-nums">
                              {enc.scheduledTime?.slice(11, 16) || '09:00'}
                            </div>
                            <span className="text-[11px] text-slate-400">45 phút</span>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                  <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                  <p>Không có ca khám nào được xếp vào ngày này.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* VIEW MODE: LIST (CHẾ ĐỘ XEM DANH SÁCH TỔNG QUÁT) */}
        {viewMode === 'list' && (
          <Card className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tất cả lịch khám sắp tới</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách đầy đủ các ca khám đã chốt và ca khám dự kiến.
                </p>
              </div>
              <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-primary bg-primary/5">
                Tổng cộng {filteredEncounters.length} ca
              </Badge>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {filteredEncounters.map((enc) => (
                <div
                  key={enc.id}
                  onClick={() => setSelectedEncounter(enc)}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        enc.encounterType === 'HOME_VISIT' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">family_restroom</span>
                        <span>{getEncounterFamilyName(enc)}</span>
                        <span className="text-xs font-normal text-slate-500">
                          (BN: {getEncounterPatientName(enc)})
                        </span>
                        <span className="text-xs font-normal text-slate-400">
                          · {enc.scheduledDate?.slice(0, 10)} ({enc.scheduledTime?.includes('T') ? enc.scheduledTime.slice(11, 16) : enc.scheduledTime?.slice(0, 5) || '09:00'})
                        </span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-2">
                        <span>{enc.encounterType === 'HOME_VISIT' ? 'Khám tại nhà' : 'Tư vấn Telehealth'}</span>
                        <span>·</span>
                        <span>HĐ: {enc.contract?.contractNumber || enc.contractId.slice(0, 8)}</span>
                        {enc.encounterType === 'HOME_VISIT' && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 truncate max-w-xs">{getEncounterAddress(enc)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      {enc.encounterStatus}
                    </Badge>
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* DRAWER CHI TIẾT CA KHÁM (DETAIL SHEET RADIX) */}
      <Sheet open={Boolean(selectedEncounter)} onOpenChange={(open) => !open && setSelectedEncounter(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 space-y-5 overflow-y-auto">
          {selectedEncounter && (() => {
            const isHome = selectedEncounter.encounterType === 'HOME_VISIT';
            const repInfo = getEncounterRepresentative(selectedEncounter);
            const familyName = getEncounterFamilyName(selectedEncounter);
            const patientName = getEncounterPatientName(selectedEncounter);
            const address = getEncounterAddress(selectedEncounter);
            const packageName = selectedEncounter.contract?.servicePackage?.packageName;

            return (
              <>
                <SheetHeader className="space-y-2 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`text-xs font-semibold px-2.5 py-0.5 ${
                        isHome
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px] mr-1">
                        {isHome ? 'home_health' : 'videocam'}
                      </span>
                      {isHome ? 'Khám Tại Nhà' : 'Tư Vấn Telehealth'}
                    </Badge>
                    <div>{getEncounterStatusBadge(selectedEncounter.encounterStatus)}</div>
                    <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50 border-slate-200">
                      {selectedEncounter.category === 'AD_HOC_ON_DEMAND' ? 'Khám đột xuất' : 'Định kỳ theo gói'}
                    </Badge>
                  </div>
                  <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2 pt-1">
                    <span className="material-symbols-outlined text-primary text-2xl shrink-0">family_restroom</span>
                    <span>{familyName}</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>Mã ca: #{selectedEncounter.id.slice(0, 8)}</span>
                    <span>·</span>
                    <span>HĐ: {selectedEncounter.contract?.contractNumber || selectedEncounter.contractId.slice(0, 8)}</span>
                    {packageName && (
                      <>
                        <span>·</span>
                        <span className="text-slate-700 font-medium">Gói: {packageName}</span>
                      </>
                    )}
                  </SheetDescription>
                </SheetHeader>

                {/* THÔNG TIN HỘ GIA ĐÌNH & ĐẠI DIỆN */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[17px]">groups</span>
                      Hộ Gia Đình & Người Đại Diện
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-white border-slate-200 font-semibold text-slate-600">
                      {selectedEncounter.visitScope === 'FAMILY' ? 'Toàn diện hộ' : 'Cá nhân thành viên'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 font-medium shrink-0">Tên hộ gia đình:</span>
                      <span className="font-bold text-slate-900 text-right">{familyName}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 font-medium shrink-0">Chủ hộ / Đại diện:</span>
                      <span className="font-semibold text-slate-800 text-right">{repInfo.name}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 font-medium shrink-0">SĐT liên hệ:</span>
                      {repInfo.phone && repInfo.phone !== 'Chưa có SĐT' ? (
                        <a
                          href={`tel:${repInfo.phone}`}
                          className="font-bold text-primary hover:underline flex items-center gap-1 text-right"
                        >
                          <span className="material-symbols-outlined text-[15px]">call</span>
                          {repInfo.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">Chưa có SĐT</span>
                      )}
                    </div>

                    {repInfo.emergencyPhone && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 font-medium shrink-0">SĐT khẩn cấp:</span>
                        <a
                          href={`tel:${repInfo.emergencyPhone}`}
                          className="font-bold text-rose-600 hover:underline flex items-center gap-1 text-right"
                        >
                          <span className="material-symbols-outlined text-[15px]">emergency</span>
                          {repInfo.emergencyPhone}
                        </a>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 pt-2 border-t border-slate-200/50">
                      <span className="text-slate-500 font-medium shrink-0">Bệnh nhân cần khám:</span>
                      <span className="font-bold text-primary text-right flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        {patientName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ĐỊA CHỈ THĂM KHÁM TẠI NHÀ (NẾU LÀ HOME VISIT) */}
                {isHome && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-emerald-700 text-[18px]">location_on</span>
                        Địa chỉ thăm khám tại nhà
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0">Khám tại nhà</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                      {address}
                    </p>
                    {address && (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-[11px] font-semibold bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 gap-1.5 rounded-xl shadow-2xs mt-1"
                      >
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="material-symbols-outlined text-[15px] text-emerald-600">directions</span>
                          Mở Google Maps chỉ đường
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                {/* THỜI GIAN HẸN */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Ngày hẹn:</span>
                    <strong className="text-slate-900">{selectedEncounter.scheduledDate?.slice(0, 10)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Khung giờ:</span>
                    <strong className="text-slate-900 tabular-nums">
                      {selectedEncounter.scheduledTime?.includes('T')
                        ? selectedEncounter.scheduledTime.slice(11, 16)
                        : selectedEncounter.scheduledTime?.slice(0, 5) || '09:00'} (45 phút)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Phạm vi ca khám:</span>
                    <strong className="text-slate-900">
                      {selectedEncounter.visitScope === 'FAMILY' ? 'Toàn diện hộ gia đình' : 'Cá nhân thành viên'}
                    </strong>
                  </div>
                </div>

                {/* LÝ DO KHÁM / TRIỆU CHỨNG */}
                <div className="space-y-2 text-xs">
                  <Label className="font-bold text-slate-800">Lý do khám / Triệu chứng:</Label>
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 leading-relaxed text-xs">
                    {selectedEncounter.subjectiveNote || selectedEncounter.rescheduleReason || 'Thăm khám định kỳ theo tiến trình hợp đồng y tế gia đình.'}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {selectedEncounter.encounterType === 'TELEHEALTH' ? (
                    <Button asChild className="w-full h-11 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
                      <Link href={`/doctor/telehealth/${selectedEncounter.id}`}>
                        <span className="material-symbols-outlined text-[18px]">videocam</span>
                        <span>Vào phòng tư vấn Telehealth</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full h-11 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
                      <Link href="/doctor/encounters">
                        <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                        <span>Mở Bệnh Án SOAP / Bắt đầu khám</span>
                      </Link>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleOpenRescheduleModal(selectedEncounter);
                      setSelectedEncounter(null);
                    }}
                    className="w-full h-10 rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>Xin đổi khung giờ khác</span>
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* MODAL 1: BÁC SĨ ĐỔI LỊCH KHÁM (RESCHEDULE MODAL) */}
      <Dialog open={Boolean(rescheduleTarget)} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Bác sĩ xin đổi lịch khám</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Yêu cầu cần Gia đình và Cơ sở Y tế cùng đồng ý (báo trước tối thiểu 4 giờ).
            </DialogDescription>
          </DialogHeader>

          {rescheduleTarget && (
            <form onSubmit={(e) => void handleSubmitReschedule(e)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Ngày mới</Label>
                  <Input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Giờ mới</Label>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Lý do bận</Label>
                <Textarea
                  rows={3}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Nhập lý do bác sĩ cần đổi lịch..."
                  className="rounded-xl text-xs"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRescheduleTarget(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReschedule}
                  className="rounded-xl text-xs font-bold bg-primary text-white"
                >
                  {submittingReschedule ? 'Đang gửi...' : 'Gửi yêu cầu đổi lịch'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: TẠO LỊCH KHÁM ĐỊNH KỲ (+ LÊN LỊCH ĐỊNH KỲ) */}
      <Dialog open={periodicModalOpen} onOpenChange={(open) => !open && setPeriodicModalOpen(false)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Lên lịch khám định kỳ</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chọn hợp đồng gia đình và thành viên cần thăm khám.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleCreatePeriodic(e)} className="space-y-4 text-xs">
            <div className="space-y-1">
              <Label htmlFor="contract-select" className="text-xs font-semibold text-slate-700">
                Hợp đồng gia đình
              </Label>
              <select
                id="contract-select"
                value={selectedContractId}
                onChange={(e) => void handleContractChange(e.target.value)}
                className="w-full h-10 rounded-xl border border-input px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-primary"
                required
              >
                {activeContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber || c.id} - {c.familyRepresentativeName || 'Hộ gia đình'}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-select" className="text-xs font-semibold text-slate-700">
                Thành viên khám
              </Label>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full h-10 rounded-xl border border-input px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-primary"
                required
              >
                {contractMembers.map((m) => (
                  <option key={m.patientId || m.id} value={m.patientId || m.id}>
                    {m.patient?.fullName || m.patientId}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="periodic-notes" className="text-xs font-semibold text-slate-700">
                Ghi chú kế hoạch khám
              </Label>
              <Textarea
                id="periodic-notes"
                rows={3}
                value={periodicNotes}
                onChange={(e) => setPeriodicNotes(e.target.value)}
                placeholder="Ví dụ: Đo huyết áp định kỳ hàng tháng..."
                className="rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPeriodicModalOpen(false)}
                className="rounded-xl text-xs font-semibold"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submittingPeriodic}
                className="rounded-xl text-xs font-bold bg-primary text-white"
              >
                {submittingPeriodic ? 'Đang gửi...' : 'Gửi lịch cho Gia đình'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: DUYỆT AD-HOC (FINALIZE AD-HOC MODAL) */}
      <Dialog open={Boolean(finalizeTarget)} onOpenChange={(open) => !open && setFinalizeTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Duyệt lịch khám đột xuất</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Xác nhận buổi khám và gửi phản hồi đến gia đình.
            </DialogDescription>
          </DialogHeader>

          {finalizeTarget && (
            <form onSubmit={(e) => void handleSubmitFinalize(e)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="finalize-notes" className="text-xs font-semibold text-slate-700">
                  Ghi chú của bác sĩ gửi gia đình
                </Label>
                <Textarea
                  id="finalize-notes"
                  rows={3}
                  value={finalizeNotes}
                  onChange={(e) => setFinalizeNotes(e.target.value)}
                  placeholder="Nhập ghi chú hoặc dặn dò trước khi khám..."
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFinalizeTarget(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingFinalize}
                  className="rounded-xl text-xs font-bold bg-primary text-white"
                >
                  {submittingFinalize ? 'Đang gửi...' : 'Gửi lịch cho Gia đình'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 4: ĐỀ XUẤT GIỜ HẸN THAY THẾ (COUNTER PROPOSE MODAL) */}
      <Dialog open={Boolean(counterTarget)} onOpenChange={(open) => !open && setCounterTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Đề xuất giờ hẹn thay thế</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Gửi khung giờ bác sĩ có thể nhận ca khám cho gia đình.
            </DialogDescription>
          </DialogHeader>

          {counterTarget && (
            <form onSubmit={(e) => void handleSubmitCounter(e)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Ngày đề xuất</Label>
                  <Input
                    type="date"
                    value={counterDate}
                    onChange={(e) => setCounterDate(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Giờ đề xuất</Label>
                  <Input
                    type="time"
                    value={counterTime}
                    onChange={(e) => setCounterTime(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="counter-notes" className="text-xs font-semibold text-slate-700">
                  Lời nhắn tới Gia đình
                </Label>
                <Textarea
                  id="counter-notes"
                  rows={3}
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="Nhập lý do hoặc lời nhắn..."
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCounterTarget(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCounter}
                  className="rounded-xl text-xs font-bold bg-primary text-white"
                >
                  {submittingCounter ? 'Đang gửi...' : 'Gửi giờ đề xuất mới'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 5: TÙY CHỈNH MỐC KHÁM ĐỊNH KỲ (CADENCE ADJUST MODAL) */}
      <Dialog open={Boolean(cadenceAdjustTarget)} onOpenChange={(open) => !open && setCadenceAdjustTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Tùy chỉnh mốc khám định kỳ</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Điều chỉnh ngày, giờ hoặc hình thức cho mốc khám này.
            </DialogDescription>
          </DialogHeader>

          {cadenceAdjustTarget && (
            <form onSubmit={(e) => void handleSubmitCadenceAdjust(e)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Ngày khám</Label>
                  <Input
                    type="date"
                    value={cadenceAdjustDate}
                    onChange={(e) => setCadenceAdjustDate(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Giờ khám</Label>
                  <Input
                    type="time"
                    value={cadenceAdjustTime}
                    onChange={(e) => setCadenceAdjustTime(e.target.value)}
                    className="h-9 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Hình thức khám</Label>
                <select
                  value={cadenceAdjustType}
                  onChange={(e) => setCadenceAdjustType(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input px-3 py-2 text-xs bg-slate-50/50 outline-none focus:border-primary"
                >
                  <option value="HOME_VISIT">Khám tại nhà (Home Visit)</option>
                  <option value="TELEHEALTH">Tư vấn từ xa (Telehealth)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCadenceAdjustTarget(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCadenceAdjust}
                  className="rounded-xl text-xs font-bold bg-primary text-white"
                >
                  {submittingCadenceAdjust ? 'Đang lưu...' : 'Lưu điều chỉnh'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 6: CÀI ĐẶT KHẢ DỤNG & VÙNG PHỤC VỤ (SETTINGS DIALOG) */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Cài đặt Khả Dụng &amp; Vùng Phục Vụ</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Điều chỉnh bán kính di chuyển và trạng thái nhận ca cấp cứu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-slate-800">Sẵn sàng tiếp nhận Cấp cứu 24/7</Label>
                <Checkbox
                  checked={isEmergencyReady}
                  onCheckedChange={(checked) => setIsEmergencyReady(checked === true)}
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Khi kích hoạt, hệ thống điều phối của Bệnh viện có thể gán các cuộc gọi khẩn cấp từ các hộ gia đình trong bán kính.
              </p>
            </div>

            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-slate-800">Bán kính di chuyển tối đa</Label>
                <span className="font-bold text-primary tabular-nums">{maxRadius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={maxRadius}
                onChange={(e) => setMaxRadius(parseInt(e.target.value, 10))}
                className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>5 km</span>
                <span>10 km</span>
                <span>20 km</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => {
                  setSettingsModalOpen(false);
                  toast.success('Đã lưu cấu hình khả dụng của bác sĩ.');
                }}
                className="rounded-xl text-xs font-bold bg-primary text-white"
              >
                Xác nhận lưu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
