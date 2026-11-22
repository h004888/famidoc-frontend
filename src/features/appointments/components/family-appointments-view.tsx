'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { contractsApi } from '@/lib/api/contracts.api';
import { encountersApi, type EncounterItem } from '@/lib/api/encounters.api';
import { patientsApi, type PatientDto } from '@/lib/api/patients.api';
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

interface Appointment {
  id: string;
  type: 'home' | 'telehealth';
  patientName: string;
  doctorName: string;
  doctorTitle: string;
  doctorAvatar: string;
  hospital: string;
  date: string;
  time: string;
  status: 'confirmed' | 'in_transit' | 'completed' | 'cancelled';
  rawStatus: 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  chiefComplaint: string;
  address?: string;
  meetLink?: string;
}

function mapEncounterToAppointment(item: EncounterItem): Appointment {
  const participantNames =
    item.participants?.map((p) => p.patient?.fullName).filter(Boolean).join(', ') ||
    item.patient?.fullName ||
    (item.visitScope === 'FAMILY' ? 'Toàn bộ gia đình' : 'Thành viên gia đình');
  const dateStr = item.scheduledDate ? item.scheduledDate.slice(0, 10) : '';
  const timeStr = item.scheduledTime?.includes('T')
    ? item.scheduledTime.slice(11, 16)
    : item.scheduledTime?.slice(0, 5) || '';
  const rawStatus = (item.encounterStatus as Appointment['rawStatus']) || 'REQUESTED';
  const statusMap: Record<string, Appointment['status']> = {
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_transit',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REQUESTED: 'confirmed',
  };
  return {
    id: item.id,
    type: item.encounterType === 'TELEHEALTH' ? 'telehealth' : 'home',
    patientName: participantNames,
    doctorName: item.doctor?.doctorName || 'Bác sĩ phụ trách',
    doctorTitle: 'Bác sĩ Gia đình',
    doctorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: item.doctor?.facility?.facilityName || 'Cơ sở y tế đối tác',
    date: dateStr,
    time: timeStr,
    status: statusMap[rawStatus] ?? 'confirmed',
    rawStatus,
    chiefComplaint:
      item.category === 'PERIODIC_ROUTINE'
        ? 'Khám định kỳ gia đình theo gói chăm sóc'
        : 'Khám theo nhu cầu gia đình',
  };
}

export function FamilyAppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rawEncounters, setRawEncounters] = useState<EncounterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [doctorDisplay, setDoctorDisplay] = useState({
    name: 'Bác sĩ Gia đình phụ trách',
    hospital: 'Cơ sở y tế đối tác',
  });
  const [quotas, setQuotas] = useState({ home: 0, telehealth: 0 });
  const [familyMembers, setFamilyMembers] = useState<PatientDto[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [conflictAlertMessage, setConflictAlertMessage] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [hotlineAlertMessage, setHotlineAlertMessage] = useState('');

  // Calendar states
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'home' | 'telehealth'>('ALL');

  const loadTimetable = useCallback(async () => {
    try {
      const res = await encountersApi.getFamilyTimetable({ pageSize: 50 });
      if (Array.isArray(res.data)) {
        setRawEncounters(res.data);
        setAppointments(res.data.map(mapEncounterToAppointment));
      }
    } catch {
      // Keep current list on transient failure
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
          setDoctorDisplay({
            name: gate.activeContract.doctor?.fullName || 'Bác sĩ Gia đình phụ trách',
            hospital: gate.activeContract.doctor?.hospitalName || 'Cơ sở y tế đối tác',
          });
          try {
            const detail = (await contractsApi.getMedicalContractDetail(
              gate.activeContract.id
            )) as unknown as Record<string, any>;
            setQuotas({
              home: detail?.remainingHomeVisits ?? 0,
              telehealth: detail?.remainingTelehealth ?? 0,
            });
          } catch {
            // Keep default 0 quotas if detail fetch fails
          }
        }
      })
      .catch(() => {});
    patientsApi
      .getFamilyMembers()
      .then((res) => {
        const list = Array.isArray(res) ? res : ((res as any)?.data ?? []);
        if (Array.isArray(list)) {
          setFamilyMembers(list.filter((p: PatientDto) => !p.status || p.status === 'ACTIVE'));
        }
      })
      .catch(() => {});
  }, [loadTimetable]);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('2026-11-25');
  const [rescheduleTime, setRescheduleTime] = useState('09:30');
  const [rescheduleError, setRescheduleError] = useState('');

  const [newBooking, setNewBooking] = useState({
    type: 'home' as 'home' | 'telehealth',
    targetMemberId: '__ALL__',
    date: '2026-11-25',
    time: '09:30',
    address: '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM',
    chiefComplaint: '',
  });

  const handleConfirmEncounter = async (encId: string) => {
    setConfirmingId(encId);
    setConflictAlertMessage('');
    try {
      const res = await encountersApi.confirmEncounter(encId, { confirmed: true });
      if (res?.status === 'CONFLICT_ALERT') {
        setConflictAlertMessage(res.message || 'Lịch khám có xung đột với ca trực của Bác sĩ.');
      } else {
        toast.success('Đã xác nhận lịch hẹn mới thành công!');
        await loadTimetable();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xác nhận lịch khám.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.chiefComplaint.trim()) {
      setBookingError('Vui lòng nhập lý do hoặc triệu chứng cần khám.');
      return;
    }
    if (!activeContractId) {
      setBookingError('Chưa tìm thấy hợp đồng đang hiệu lực để đặt lịch.');
      return;
    }
    setBookingError('');
    setSubmittingBooking(true);
    try {
      const isWholeFamily = newBooking.targetMemberId === '__ALL__';
      await encountersApi.createAdHocEncounter({
        contractId: activeContractId,
        patientId: isWholeFamily ? familyMembers[0]?.id || '' : newBooking.targetMemberId,
        visitScope: isWholeFamily ? 'FAMILY' : 'INDIVIDUAL',
        ...(isWholeFamily ? {} : { patientIds: [newBooking.targetMemberId] }),
        encounterType: newBooking.type === 'telehealth' ? 'TELEHEALTH' : 'HOME_VISIT',
        desiredDate: newBooking.date,
        desiredTime: newBooking.time,
        reason: newBooking.chiefComplaint.trim(),
      } as any);
      await loadTimetable();
      setShowBookingModal(false);
      setNewBooking((prev) => ({ ...prev, chiefComplaint: '' }));
      toast.success('Đặt lịch hẹn thành công! Bác sĩ quản nhiệm đã nhận được yêu cầu.');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Không thể tạo lịch hẹn khám.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleConfirmCancelAppointment = () => {
    if (!cancelTarget) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled', rawStatus: 'CANCELLED' } : a))
    );
    toast.success(`Đã ghi nhận yêu cầu hủy ca khám ${cancelTarget.id}.`);
    setCancelTarget(null);
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleTarget(apt);
    setRescheduleError('');
    setRescheduleReason('');
    setHotlineAlertMessage('');
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduleError('');
    setSubmittingReschedule(true);
    try {
      const res = await encountersApi.requestReschedule(rescheduleTarget.id, {
        proposedDate: rescheduleDate,
        proposedTime: rescheduleTime,
        rescheduleReason: rescheduleReason.trim() || 'Gia đình đề xuất đổi sang khung giờ thuận tiện hơn',
      });
      if (res?.status === 'AUTO_REJECTED_TOO_LATE') {
        const base = res.message || 'Yêu cầu đổi lịch bị từ chối do báo trước dưới 4 giờ.';
        const fullMsg = base.includes('1900 6868')
          ? base
          : `${base} Vui lòng liên hệ Hotline CSYT: 1900 6868 để được hỗ trợ khẩn cấp.`;
        setHotlineAlertMessage(fullMsg);
      } else {
        toast.success(
          `Đã gửi yêu cầu đổi lịch sang ${rescheduleTime} ngày ${rescheduleDate} tới Bác sĩ phụ trách.`
        );
        setRescheduleTarget(null);
      }
      await loadTimetable();
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

  // Month navigation
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

  const handleTodayMonth = () => {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentCalendarMonth(d);
    setSelectedCalendarDate(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`
    );
  };

  // Compute 7-column Calendar grid for current month
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let firstDayOfWeek = firstDay.getDay() - 1; // 0 = Monday, 6 = Sunday
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;

    const days = [];
    // Padding before month
    for (let i = firstDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        isoDate: iso,
        dayNum: d.getDate(),
        isCurrentMonth: false,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }

    // Days in current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      days.push({
        date: d,
        isoDate: iso,
        dayNum: d.getDate(),
        isCurrentMonth: true,
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }

    // Padding after month
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
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

  // Filtered appointments by type
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (typeFilter !== 'ALL' && apt.type !== typeFilter) return false;
      return true;
    });
  }, [appointments, typeFilter]);

  // Appointments to display: if a date is selected, show that date; otherwise show all
  const displayAppointments = useMemo(() => {
    if (selectedCalendarDate) {
      const onDate = filteredAppointments.filter((a) => a.date === selectedCalendarDate);
      if (onDate.length > 0) return onDate;
    }
    return filteredAppointments;
  }, [filteredAppointments, selectedCalendarDate]);

  const currentMonthTitle = currentCalendarMonth.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. HEADER CANVAS THOÁNG ĐÃNG */}
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
            <span className="text-slate-800 font-semibold">Lịch Hẹn Khám</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-primary bg-primary/10 border-primary/20">
                  Hộ #FAM-88219
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Sẵn sàng điều phối 24/7</span>
                </Badge>
                <Badge variant="secondary" className="gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60 hidden sm:inline-flex">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">home_health</span>
                  <span>Khám tại nhà &amp; Telehealth</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Đặt Lịch &amp; Quản Lý Lịch Hẹn Khám Gia Đình
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Chủ động đặt lịch Bác sĩ gia đình đến khám tận nhà hoặc tư vấn qua Video trực tuyến. Toàn bộ hồ sơ chẩn đoán và đơn thuốc được lưu trữ tự động vào bệnh án của từng thành viên.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="min-h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2 shadow-xs bg-primary hover:bg-primary/90 text-white"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>Đặt lịch khám đột xuất</span>
              </Button>
            </div>
          </div>
        </header>

        {/* 2. CỤM HẠN MỨC GÓI & BÁC SĨ PHỤ TRÁCH */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Khám Bác Sĩ Tại Nhà
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-slate-900">{quotas.home}</span>
                <span className="text-xs text-slate-400">lượt còn lại</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">home_health</span>
            </div>
          </Card>

          <Card className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Tư Vấn Video Telehealth
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-slate-900">{quotas.telehealth}</span>
                <span className="text-xs text-slate-400">lượt còn lại</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">videocam</span>
            </div>
          </Card>

          <Card className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop"
              alt={doctorDisplay.name}
              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 inline-block mb-0.5">
                Bác sĩ gia đình quản nhiệm
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {doctorDisplay.name}
              </div>
              <p className="text-[11px] text-slate-500 truncate">{doctorDisplay.hospital}</p>
            </div>
          </Card>
        </div>

        {/* 3. BANNER LỊCH CẦN BẠN XÁC NHẬN */}
        {rawEncounters.filter((e) => e.proposedBy === 'DOCTOR' || (e.encounterStatus === 'REQUESTED' && e.proposedBy === 'ASSIGNED_DOCTOR')).length > 0 && (
          <Card className="bg-amber-50/90 border-amber-200 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-2xl">pending_actions</span>
              <div>
                <h3 className="font-bold text-base text-amber-950">
                  Lịch cần bạn xác nhận ({rawEncounters.filter((e) => e.proposedBy === 'DOCTOR' || (e.encounterStatus === 'REQUESTED' && e.proposedBy === 'ASSIGNED_DOCTOR')).length})
                </h3>
                <p className="text-xs text-amber-800">
                  Bác sĩ đã gửi đề xuất thời gian mới cho buổi khám của gia đình. Vui lòng kiểm tra và bấm xác nhận để đồng bộ lịch.
                </p>
              </div>
            </div>

            {conflictAlertMessage && (
              <div role="alert" className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
                <span>{conflictAlertMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rawEncounters
                .filter((e) => e.proposedBy === 'DOCTOR' || (e.encounterStatus === 'REQUESTED' && e.proposedBy === 'ASSIGNED_DOCTOR'))
                .map((enc) => (
                  <div key={enc.id} className="bg-white rounded-xl border border-amber-200 p-4 space-y-3 text-xs shadow-2xs">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {enc.patient?.fullName || 'Thành viên gia đình'}
                      </div>
                      <div className="text-amber-800 font-semibold mt-0.5">
                        Bác sĩ đề xuất giờ mới: {enc.proposedDate?.slice(0, 10) || enc.scheduledDate?.slice(0, 10)} lúc {enc.proposedTime?.slice(11, 16) || enc.scheduledTime?.slice(11, 16)}
                      </div>
                      {enc.rescheduleReason && <p className="text-slate-500 mt-1">{enc.rescheduleReason}</p>}
                    </div>
                    <div className="pt-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={confirmingId === enc.id}
                        onClick={() => void handleConfirmEncounter(enc.id)}
                        className="rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>{confirmingId === enc.id ? 'Đang xác nhận...' : 'Chấp nhận giờ mới'}</span>
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* 4. LỘ TRÌNH KHÁM ĐỊNH KỲ THEO GÓI TRONG NĂM */}
        {rawEncounters.filter((e) => e.category === 'PERIODIC_ROUTINE').length > 0 && (
          <Card className="bg-white border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">event_repeat</span>
                  Lộ Trình Khám Định Kỳ Trong Năm (Annual Care Plan)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các mốc thăm khám định kỳ được hệ thống và bác sĩ phân bổ đều đặn theo hạn mức gói chăm sóc.
                </p>
              </div>
              <Badge variant="outline" className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20 shrink-0 self-start sm:self-auto">
                {rawEncounters.filter((e) => e.category === 'PERIODIC_ROUTINE').length} mốc khám / năm
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {rawEncounters
                .filter((e) => e.category === 'PERIODIC_ROUTINE')
                .map((enc, idx, arr) => {
                  const isDone = enc.encounterStatus === 'COMPLETED';
                  const isConfirmed = enc.encounterStatus === 'CONFIRMED';
                  const isDraft = enc.proposedBy === 'SYSTEM_CADENCE';

                  return (
                    <div
                      key={enc.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 transition-all text-xs ${
                        isDone
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : isConfirmed
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-purple-50/40 border-purple-200 text-purple-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-primary">
                          Lần {idx + 1}/{arr.length}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 font-semibold ${
                            isDone
                              ? 'bg-slate-100 text-slate-600'
                              : isConfirmed
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-purple-100 text-purple-800 border-purple-300'
                          }`}
                        >
                          {isDone ? 'Đã hoàn thành' : isConfirmed ? 'Đã chốt lịch' : isDraft ? 'Khung dự kiến' : 'Chờ xác nhận'}
                        </Badge>
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {enc.scheduledDate?.slice(0, 10)} lúc {enc.scheduledTime?.slice(11, 16) || '09:00'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {enc.encounterType === 'HOME_VISIT' ? 'Khám tại nhà' : 'Tư vấn Telehealth'} · {enc.patient?.fullName || 'Hộ gia đình'}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}

        {/* 5. KHUNG LỊCH KHÁM & CHI TIẾT CA HẸN HỢP NHẤT (UNIFIED CALENDAR & SCHEDULE) */}
        <Card className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Toolbar của Lịch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTodayMonth}
                className="rounded-xl text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Hôm nay
              </Button>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 rounded-lg text-slate-600 hover:bg-white"
                  title="Tháng trước"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </Button>
                <div className="px-3 text-xs font-bold text-slate-800 capitalize whitespace-nowrap">
                  {currentMonthTitle}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleNextMonth}
                  className="h-8 w-8 rounded-lg text-slate-600 hover:bg-white"
                  title="Tháng sau"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </Button>
              </div>
            </div>

            {/* Bộ lọc loại hình */}
            <div className="flex items-center rounded-xl border border-slate-200 p-0.5 bg-slate-50/60 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Tất cả ({appointments.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('home')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  typeFilter === 'home' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Khám tại nhà
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('telehealth')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  typeFilter === 'telehealth' ? 'bg-sky-600 text-white shadow-2xs' : 'text-sky-700 hover:text-sky-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                Telehealth
              </button>
            </div>
          </div>

          {/* Bảng Lịch Tháng Trực Quan (Month Calendar Grid) */}
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
                const dayAppointments = appointments.filter((a) => a.date === day.isoDate);
                const isSelected = selectedCalendarDate === day.isoDate;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCalendarDate(selectedCalendarDate === day.isoDate ? '' : day.isoDate)}
                    className={`min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
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
                            ? 'bg-primary text-white'
                            : isSelected
                              ? 'text-primary font-extrabold'
                              : 'text-slate-700'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      {dayAppointments.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-1 mt-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={`p-1 rounded-md text-[9px] sm:text-[10px] font-semibold truncate flex items-center gap-1 ${
                            apt.type === 'home'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-sky-100 text-sky-900 border border-sky-200'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[11px] shrink-0">
                            {apt.type === 'home' ? 'home_health' : 'videocam'}
                          </span>
                          <span className="truncate">{apt.time} · {apt.type === 'home' ? 'Khám nhà' : 'Video'}</span>
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-500 pl-1">
                          +{dayAppointments.length - 2} ca nữa
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HỢP NHẤT: CHI TIẾT CÁC CA KHÁM TRÊN LỊCH */}
          <div className="pt-5 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">event_note</span>
                  <span>
                    {selectedCalendarDate
                      ? `Lịch hẹn khám ngày ${selectedCalendarDate}`
                      : `Danh sách lịch hẹn trong ${currentMonthTitle}`}
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
                  className="text-xs text-slate-500 hover:text-slate-900 self-start sm:self-auto"
                >
                  Xem tất cả ca trong tháng ▾
                </Button>
              )}
            </div>

            {/* Danh sách thẻ ca hẹn hợp nhất */}
            {isLoading ? (
              <div className="bg-slate-50/50 rounded-2xl border border-slate-200/70 p-10 text-center space-y-3">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-xs font-medium text-slate-500">Đang tải lịch hẹn khám gia đình...</p>
              </div>
            ) : displayAppointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-300">event_busy</span>
                <p>Không có ca khám nào {selectedCalendarDate ? 'vào ngày này' : 'trong mục này'}.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBookingModal(true)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Đặt lịch khám đột xuất
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayAppointments.map((apt) => {
                  const isHome = apt.type === 'home';
                  const isCancelled = apt.status === 'cancelled';
                  const isCompleted = apt.status === 'completed';

                  return (
                    <Card
                      key={apt.id}
                      className="group bg-white rounded-2xl border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden space-y-4 p-5 sm:p-6"
                    >
                      <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Badge
                            variant="outline"
                            className={`gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                              isHome ? 'bg-primary/10 text-primary border-primary/20' : 'bg-sky-50 text-sky-700 border-sky-200/70'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isHome ? 'home_health' : 'videocam'}
                            </span>
                            <span>{isHome ? 'Khám Bác sĩ Tại Nhà' : 'Tư Vấn Video (Telehealth)'}</span>
                          </Badge>
                          <span className="text-xs font-bold tabular-nums text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            #{apt.id}
                          </span>
                        </div>

                        <div>
                          {apt.rawStatus === 'REQUESTED' && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Chờ gia đình xác nhận</span>
                            </span>
                          )}
                          {apt.status === 'confirmed' && apt.rawStatus !== 'REQUESTED' && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Đã xác nhận · Sắp diễn ra</span>
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/70 inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                              <span>Đã hoàn thành</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 inline-flex items-center gap-1.5 whitespace-nowrap">
                              <span className="material-symbols-outlined text-[15px]">cancel</span>
                              <span>Đã hủy lịch</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                        <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img
                                src={apt.doctorAvatar}
                                alt={apt.doctorName}
                                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] text-primary font-semibold uppercase tracking-wider">
                                  {apt.doctorTitle}
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">
                                  {apt.doctorName}
                                </h3>
                                <p className="text-xs text-slate-500 truncate">{apt.hospital}</p>
                              </div>
                            </div>

                            <div className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs shrink-0">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                                Người thân được khám
                              </span>
                              <strong className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                                <span>{apt.patientName}</span>
                              </strong>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 border-l-4 border-l-primary text-xs space-y-0.5">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                                Triệu chứng &amp; Nhu cầu thăm khám
                              </span>
                              <p className="text-slate-800 font-medium leading-relaxed text-xs sm:text-sm">
                                {apt.chiefComplaint}
                              </p>
                            </div>

                            {apt.address && (
                              <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-200/60">
                                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">location_on</span>
                                <div>
                                  <strong className="text-slate-800">Địa chỉ khám: </strong>
                                  <span>{apt.address}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="lg:col-span-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between gap-3">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Thời gian hẹn khám
                            </span>
                            <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1 shadow-2xs">
                              <div className="font-bold tabular-nums text-base text-primary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px]">schedule</span>
                                <span>{apt.time}</span>
                              </div>
                              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px] text-slate-400">calendar_today</span>
                                <span>{apt.date}</span>
                              </div>
                            </div>
                          </div>

                          {apt.status === 'confirmed' && (
                            <div className="space-y-2">
                              {apt.rawStatus === 'REQUESTED' && (
                                <Button
                                  type="button"
                                  disabled={confirmingId === apt.id}
                                  onClick={() => void handleConfirmEncounter(apt.id)}
                                  className="min-h-9 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold gap-1.5 text-white"
                                >
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  <span>{confirmingId === apt.id ? 'Đang xác nhận...' : 'Xác nhận lịch khám'}</span>
                                </Button>
                              )}
                              {apt.type === 'telehealth' && apt.rawStatus !== 'REQUESTED' && (
                                <Button asChild className="min-h-9 w-full rounded-xl text-xs font-semibold gap-1.5">
                                  <Link href={`/family/telemedicine?encounterId=${apt.id}`}>
                                    <span className="material-symbols-outlined text-[16px]">videocam</span>
                                    <span>Vào phòng khám Video</span>
                                  </Link>
                                </Button>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenReschedule(apt)}
                                  className="min-h-9 rounded-xl text-xs font-semibold gap-1"
                                >
                                  <span className="material-symbols-outlined text-[15px] text-primary">edit_calendar</span>
                                  <span>Xin đổi giờ hẹn</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCancelTarget(apt)}
                                  className="min-h-9 rounded-xl text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 font-semibold gap-1"
                                >
                                  <span className="material-symbols-outlined text-[15px]">close</span>
                                  <span>Hủy lịch</span>
                                </Button>
                              </div>
                            </div>
                          )}

                          {isCompleted && (
                            <Button
                              asChild
                              variant="outline"
                              className="min-h-9 w-full rounded-xl text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 text-xs font-semibold gap-1.5"
                            >
                              <Link href="/family/members">
                                <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                                <span>Xem kết quả khám &amp; toa thuốc</span>
                              </Link>
                            </Button>
                          )}

                          {isCancelled && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowBookingModal(true)}
                              className="min-h-9 w-full rounded-xl text-xs font-semibold gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">replay</span>
                              <span>Đặt lại lịch khám này</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* MODAL 1: ĐẶT LỊCH HẸN KHÁM MỚI */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-bold text-base text-white truncate">
                  Đặt Lịch Hẹn Bác Sĩ Gia Đình
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 truncate mt-0.5">
                  Chọn hình thức khám tại nhà hoặc tư vấn qua Video trực tuyến
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs">
            <div>
              <Label className="block font-semibold text-slate-700 mb-2">
                1. Chọn hình thức thăm khám <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={newBooking.type === 'home' ? 'default' : 'outline'}
                  onClick={() => setNewBooking({ ...newBooking, type: 'home' })}
                  className="h-auto p-3.5 flex items-center justify-start gap-3 rounded-xl text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">home_health</span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Khám Tại Nhà</div>
                    <div className="text-[11px] opacity-75 font-normal">Bác sĩ đến tận nơi</div>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant={newBooking.type === 'telehealth' ? 'default' : 'outline'}
                  onClick={() => setNewBooking({ ...newBooking, type: 'telehealth' })}
                  className="h-auto p-3.5 flex items-center justify-start gap-3 rounded-xl text-left"
                >
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Tư vấn Video</div>
                    <div className="text-[11px] opacity-75 font-normal">Gọi trực tuyến</div>
                  </div>
                </Button>
              </div>
            </div>

            <div>
              <Label className="block font-semibold text-slate-700 mb-1.5">
                2. Đối tượng thăm khám <span className="text-rose-500">*</span>
              </Label>
              <select
                value={newBooking.targetMemberId}
                onChange={(e) => setNewBooking({ ...newBooking, targetMemberId: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              >
                <option value="__ALL__">
                  Cả gia đình ({familyMembers.length > 0 ? `${familyMembers.length} thành viên` : 'theo hợp đồng'})
                </option>
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="block font-semibold text-slate-700 mb-1.5">
                  3. Ngày khám mong muốn <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white font-semibold text-slate-900 text-xs sm:text-sm"
                />
              </div>
              <div>
                <Label className="block font-semibold text-slate-700 mb-1.5">
                  4. Khung giờ hẹn <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={newBooking.time}
                  onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
                >
                  <option value="08:30">08:30 (Buổi sáng)</option>
                  <option value="09:30">09:30 (Buổi sáng)</option>
                  <option value="10:30">10:30 (Buổi sáng)</option>
                  <option value="14:00">14:00 (Buổi chiều)</option>
                  <option value="15:00">15:00 (Buổi chiều)</option>
                  <option value="16:00">16:00 (Buổi chiều)</option>
                </select>
              </div>
            </div>

            {newBooking.type === 'home' && (
              <div>
                <Label className="block font-semibold text-slate-700 mb-1.5">
                  Địa chỉ đón Bác sĩ tại nhà <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={newBooking.address}
                  onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white font-medium text-slate-900 text-xs sm:text-sm"
                />
              </div>
            )}

            <div>
              <Label htmlFor="chief-complaint" className="block font-semibold text-slate-700 mb-1.5">
                Triệu chứng / Lý do đặt lịch <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="chief-complaint"
                rows={3}
                required
                value={newBooking.chiefComplaint}
                onChange={(e) => {
                  setNewBooking({ ...newBooking, chiefComplaint: e.target.value });
                  if (bookingError) setBookingError('');
                }}
                placeholder="Ví dụ: Đo lại huyết áp và kiểm tra đường huyết định kỳ, đau mỏi khớp gối..."
                className="p-3 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-xs sm:text-sm"
              />
              {bookingError && (
                <p role="alert" className="text-xs text-rose-600 font-semibold mt-1">{bookingError}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBookingModal(false)}
                className="flex-1 h-10 rounded-xl font-semibold text-xs sm:text-sm"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 rounded-xl font-semibold text-xs sm:text-sm gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Gửi yêu cầu đặt lịch</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: ĐỔI GIỜ HẸN KHÁM */}
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
                      Đổi Ngày Giờ Hẹn Khám
                    </DialogTitle>
                    <DialogDescription className="text-xs text-blue-100">
                      Mã lịch hẹn: #{rescheduleTarget.id}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="text-slate-500">
                    Lịch hiện tại: <strong className="text-slate-900 tabular-nums">{rescheduleTarget.time}</strong> ·{' '}
                    <strong className="text-slate-900 tabular-nums">{rescheduleTarget.date}</strong>
                  </div>
                  <div className="text-slate-500">
                    Bác sĩ: <strong className="text-primary">{rescheduleTarget.doctorName}</strong>
                  </div>
                  <div className="text-slate-500">
                    Người khám: <strong className="text-slate-900">{rescheduleTarget.patientName}</strong>
                  </div>
                </div>

                {(() => {
                  const targetTime = rescheduleTarget.time || '00:00';
                  const targetDate = rescheduleTarget.date || '';
                  const aptTimestamp = new Date(`${targetDate}T${targetTime.length === 5 ? targetTime + ':00' : targetTime}`).getTime();
                  const hoursLeft = (aptTimestamp - Date.now()) / (3600 * 1000);
                  if (!isNaN(hoursLeft) && hoursLeft > 0 && hoursLeft < 4) {
                    return (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                        Chỉ còn dưới 4 giờ trước giờ khám dự kiến. Quy định chỉ cho phép đổi lịch trước tối thiểu 4 giờ.
                      </div>
                    );
                  }
                  return null;
                })()}

                {hotlineAlertMessage && (
                  <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">error</span>
                    <span>{hotlineAlertMessage}</span>
                  </div>
                )}

                {rescheduleError && (
                  <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">
                      error
                    </span>
                    <span>{rescheduleError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="block font-semibold text-slate-700 mb-1.5">Ngày khám mới</Label>
                      <Input
                        type="date"
                        required
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="h-10 rounded-xl bg-slate-50/50 font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <Label className="block font-semibold text-slate-700 mb-1.5">Khung giờ mới</Label>
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
                    <Label htmlFor="reschedule-reason" className="block font-semibold text-slate-700 mb-1.5">
                      Lý do xin đổi giờ
                    </Label>
                    <Textarea
                      id="reschedule-reason"
                      rows={2}
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      placeholder="Ví dụ: Gia đình có việc bận đột xuất, mong muốn dời sang buổi chiều."
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
                      className="flex-1 rounded-xl font-semibold gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{submittingReschedule ? 'Đang gửi...' : 'Gửi yêu cầu đổi lịch'}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: XÁC NHẬN HỦY LỊCH HẸN */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Xác Nhận Hủy Lịch Khám"
        description={cancelTarget ? `Mã ca hẹn: #${cancelTarget.id}` : undefined}
        headerIcon={<span className="material-symbols-outlined text-[20px] text-rose-600">event_busy</span>}
        confirmLabel="Xác nhận hủy lịch"
        cancelLabel="Giữ lại lịch hẹn"
        variant="destructive"
        onConfirm={handleConfirmCancelAppointment}
      >
        {cancelTarget && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-950 space-y-1.5 leading-relaxed">
              <div>
                Người khám: <strong>{cancelTarget.patientName}</strong>
              </div>
              <div>
                Thời gian: <strong className="tabular-nums">{cancelTarget.time} · {cancelTarget.date}</strong>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Lượt khám sẽ được hoàn lại nguyên vẹn vào gói của gia đình.</span>
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Hệ thống sẽ tự động gửi thông báo cho <strong>{cancelTarget.doctorName}</strong> để điều chỉnh lịch trình.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
