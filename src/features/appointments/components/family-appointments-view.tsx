'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeContractId, setActiveContractId] = useState<string | null>(null);
  const [doctorDisplay, setDoctorDisplay] = useState({
    name: 'Bác sĩ Gia đình phụ trách',
    hospital: 'Cơ sở y tế đối tác',
  });
  const [quotas, setQuotas] = useState({ home: 0, telehealth: 0 });
  const [familyMembers, setFamilyMembers] = useState<PatientDto[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  const loadTimetable = useCallback(async () => {
    try {
      const res = await encountersApi.getFamilyTimetable({ pageSize: 50 });
      if (Array.isArray(res.data)) {
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
      .catch(() => { });
    patientsApi
      .getFamilyMembers()
      .then((res) => {
        const list = Array.isArray(res) ? res : ((res as any)?.data ?? []);
        if (Array.isArray(list)) {
          setFamilyMembers(list.filter((p: PatientDto) => !p.status || p.status === 'ACTIVE'));
        }
      })
      .catch(() => { });
  }, [loadTimetable]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('2026-11-25');
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleError, setRescheduleError] = useState('');

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    type: 'home' as 'home' | 'telehealth',
    targetMemberId: '__ALL__',
    date: '2026-11-25',
    time: '08:30',
    chiefComplaint: '',
    address: '',
  });

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'upcoming') return apt.status === 'confirmed' || apt.status === 'in_transit';
    if (activeTab === 'completed') return apt.status === 'completed';
    return true;
  });

  const handleConfirmEncounter = async (encounterId: string) => {
    setConfirmingId(encounterId);
    try {
      const res = await encountersApi.confirmEncounter(encounterId, true);
      if (res?.status === 'CONFLICT_ALERT') {
        toast.warning(
          res.conflictDetails ||
          'Khung giờ này trùng ca trực của bác sĩ tại cơ sở y tế. Vui lòng đổi sang giờ khác.'
        );
      } else {
        toast.success('Đã xác nhận lịch khám! Lịch đã được đồng bộ với bác sĩ và cơ sở y tế.');
      }
      await loadTimetable();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xác nhận lịch khám.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.chiefComplaint.trim()) {
      setBookingError('Vui lòng mô tả triệu chứng hoặc nhu cầu khám của gia đình.');
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
        visitScope: isWholeFamily ? 'FAMILY' : 'INDIVIDUAL',
        ...(isWholeFamily ? {} : { patientIds: [newBooking.targetMemberId] }),
        encounterType: newBooking.type === 'telehealth' ? 'TELEHEALTH' : 'HOME_VISIT',
        desiredDate: newBooking.date,
        desiredTime: newBooking.time,
        reason: newBooking.chiefComplaint.trim(),
      });
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
        rescheduleReason: rescheduleReason.trim() || 'Gia đình đề xuất đổi sang khung giờ thuận tiện hơn',
      });
      await loadTimetable();
      toast.success(
        `Đã gửi yêu cầu đổi lịch sang ${rescheduleTime} ngày ${rescheduleDate} tới Bác sĩ phụ trách.`
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

  const upcomingCount = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'in_transit'
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CANVAS THOÁNG ĐÃNG ĐỒNG BỘ VỚI /family */}
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

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
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

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Chủ động đặt lịch Bác sĩ gia đình đến khám tận nhà hoặc tư vấn qua Video trực tuyến. Toàn bộ hồ sơ chẩn đoán và đơn thuốc được lưu trữ tự động vào bệnh án của từng thành viên.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn & phân cấp chuẩn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="min-h-11 rounded-xl text-sm font-semibold gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span>Đặt lịch khám mới</span>
              </Button>
            </div>
          </div>
        </header>

        {/* 2. THẺ HẠN MỨC GÓI KHÁM & BÁC SĨ PHỤ TRÁCH (3 CỘT CÂN ĐỐI & KHOẢNG THỞ LỚN) */}
        <section
          aria-label="Hạn mức và bác sĩ quản nhiệm"
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6"
        >
          {/* Cột 1: Khám tại nhà */}
          <Card className="bg-white p-6 rounded-2xl border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4">
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
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">{quotas.home}</span>
                <span className="text-xs text-slate-400 font-medium tabular-nums">lượt còn lại trong kỳ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: quotas.home > 0 ? '100%' : '0%' }} />
              </div>
            </div>
          </Card>

          {/* Cột 2: Tư vấn Telehealth */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4">
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
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">{quotas.telehealth}</span>
                <span className="text-xs text-slate-400 font-medium tabular-nums">lượt còn lại trong kỳ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: quotas.telehealth > 0 ? '100%' : '0%' }} />
              </div>
            </div>
          </div>

          {/* Cột 3: Bác sĩ gia đình phụ trách */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bác Sĩ Quản Nhiệm Hộ
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Trực tuyến
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop"
                alt={doctorDisplay.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {doctorDisplay.name}
                </div>
                <p className="text-xs text-primary font-medium truncate mt-0.5">
                  {doctorDisplay.hospital}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BỘ LỌC TABS & DANH SÁCH LỊCH HẸN */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tabs phân loại */}
            <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
              {[
                { id: 'upcoming', label: 'Sắp tới', count: upcomingCount, icon: 'event_upcoming' },
                { id: 'completed', label: 'Đã khám', count: completedCount, icon: 'task_alt' },
                { id: 'all', label: 'Tất cả', count: appointments.length, icon: 'list_alt' },
              ].map((t) => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as 'upcoming' | 'completed' | 'all')}
                    className={`min-h-10 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${isActive
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px] hidden sm:inline">
                      {t.icon}
                    </span>
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[11px] tabular-nums font-semibold leading-none ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'
                        }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs sm:text-sm text-slate-500 font-medium">
              Hiển thị <span className="font-bold tabular-nums text-slate-800">{filteredAppointments.length}</span> lịch hẹn
            </div>
          </div>

          {/* Danh sách Thẻ Lịch Hẹn */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-10 text-center space-y-3 shadow-xs">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-xs font-medium text-slate-500">Đang tải lịch hẹn khám gia đình...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-10 sm:p-14 text-center space-y-3 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
              <h3 className="font-bold text-sm text-slate-900">Chưa có lịch hẹn nào trong mục này</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Gia đình có thể đặt lịch Bác sĩ đến nhà hoặc kết nối tư vấn qua Video bất cứ lúc nào cần.
              </p>
              <Button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="min-h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Đặt lịch khám ngay</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAppointments.map((apt) => {
                const isHome = apt.type === 'home';
                const isCancelled = apt.status === 'cancelled';
                const isCompleted = apt.status === 'completed';

                return (
                  <Card
                    key={apt.id}
                    className="group bg-white rounded-2xl border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden space-y-5 p-6"
                  >
                    {/* Thanh tiêu đề nhẹ nhàng phân biệt loại lịch hẹn */}
                    <div className="pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge
                          variant="outline"
                          className={`gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${isHome
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-sky-50 text-sky-700 border-sky-200/70'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isHome ? 'home_health' : 'videocam'}
                          </span>
                          <span>
                            {isHome ? 'Khám Bác sĩ Tại Nhà' : 'Tư Vấn Video (Telehealth)'}
                          </span>
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
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">
                              check_circle
                            </span>
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

                    {/* Nội dung chi tiết ca hẹn */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Cột trái (8 cols): Bác sĩ, Người bệnh & Lý do khám */}
                      <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                        {/* Thông tin Bác sĩ & Người thân được khám */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={apt.doctorAvatar}
                              alt={apt.doctorName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
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
                              <span className="material-symbols-outlined text-[15px] text-primary">
                                person
                              </span>
                              <span>{apt.patientName}</span>
                            </strong>
                          </div>
                        </div>

                        {/* Lý do khám & Địa điểm */}
                        <div className="space-y-2.5">
                          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 border-l-4 border-l-primary text-xs space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                              Triệu chứng &amp; Nhu cầu thăm khám
                            </span>
                            <p className="text-slate-800 font-medium leading-relaxed text-xs sm:text-sm">
                              {apt.chiefComplaint}
                            </p>
                          </div>

                          {apt.address && (
                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50/50 px-3.5 py-2.5 rounded-xl border border-slate-200/60">
                              <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                                location_on
                              </span>
                              <div>
                                <strong className="text-slate-800">Địa chỉ khám tại nhà: </strong>
                                <span>{apt.address}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cột phải (4 cols): Khung giờ hẹn & Các nút thao tác */}
                      <div className="lg:col-span-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Thời gian hẹn khám
                          </span>
                          <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 space-y-1 shadow-2xs">
                            <div className="font-bold tabular-nums text-base text-primary flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[18px]">schedule</span>
                              <span>{apt.time}</span>
                            </div>
                            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-slate-400">
                                calendar_today
                              </span>
                              <span>{apt.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Nút hành động theo trạng thái */}
                        {apt.status === 'confirmed' && (
                          <div className="space-y-2.5">
                            {apt.rawStatus === 'REQUESTED' && (
                              <Button
                                type="button"
                                disabled={confirmingId === apt.id}
                                onClick={() => void handleConfirmEncounter(apt.id)}
                                className="min-h-10 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold gap-1.5 text-white"
                              >
                                <span className="material-symbols-outlined text-[17px]">check_circle</span>
                                <span>{confirmingId === apt.id ? 'Đang xác nhận...' : 'Xác nhận lịch khám'}</span>
                              </Button>
                            )}
                            {apt.type === 'telehealth' && apt.rawStatus !== 'REQUESTED' && (
                              <Button asChild className="min-h-10 w-full rounded-xl text-xs font-semibold gap-1.5">
                                <Link href={`/family/telemedicine?encounterId=${apt.id}`}>
                                  <span className="material-symbols-outlined text-[17px]">videocam</span>
                                  <span>Vào phòng khám Video</span>
                                </Link>
                              </Button>
                            )}

                            {isHome && (
                              <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium flex items-start gap-2">
                                <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                                  medical_services
                                </span>
                                <span>Bác sĩ mang theo máy đo điện tim ECG &amp; bộ lấy mẫu tại nhà.</span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenReschedule(apt)}
                                className="min-h-9 rounded-xl text-xs font-semibold gap-1"
                              >
                                <span className="material-symbols-outlined text-[15px] text-primary">
                                  edit_calendar
                                </span>
                                <span>Đổi giờ</span>
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
                            className="min-h-10 w-full rounded-xl text-primary hover:bg-primary hover:text-primary-foreground border-primary/20 text-xs font-semibold gap-1.5"
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
                            className="min-h-10 w-full rounded-xl text-xs font-semibold gap-1.5"
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
        </section>
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
            {/* Chọn hình thức khám */}
            <div>
              <Label className="block font-semibold text-slate-700 mb-2">
                1. Chọn hình thức thăm khám <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${newBooking.type === 'home'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/15 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  <input
                    type="radio"
                    name="bookingType"
                    checked={newBooking.type === 'home'}
                    onChange={() => setNewBooking({ ...newBooking, type: 'home' })}
                    className="sr-only"
                  />
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${newBooking.type === 'home'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">home_health</span>
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Khám Tại Nhà</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Bác sĩ đến tận nơi (Còn 3 lượt)
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${newBooking.type === 'telehealth'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/15 font-semibold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  <input
                    type="radio"
                    name="bookingType"
                    checked={newBooking.type === 'telehealth'}
                    onChange={() => setNewBooking({ ...newBooking, type: 'telehealth' })}
                    className="sr-only"
                  />
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${newBooking.type === 'telehealth'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                  </span>
                  <div>
                    <div className="text-xs sm:text-sm font-bold">Tư Vấn Video 24/7</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Gọi trực tuyến (Còn 18 lượt)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Chọn thành viên */}
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

            {/* Ngày & Khung giờ */}
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

            {/* Địa chỉ khám tại nhà */}
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

            {/* Lý do khám */}
            <div>
              <Label className="block font-semibold text-slate-700 mb-1.5">
                Mô tả triệu chứng hoặc nhu cầu khám <span className="text-rose-500">*</span>
              </Label>
              <Textarea
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
                <span>Xác nhận đặt lịch</span>
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
                    <Label className="block font-semibold text-slate-700 mb-1.5">
                      Lý do đổi lịch (Báo trước tối thiểu 4 giờ)
                    </Label>
                    <Textarea
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
                      <span>{submittingReschedule ? 'Đang gửi...' : 'Lưu giờ hẹn mới'}</span>
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