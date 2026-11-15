'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared';
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
  chiefComplaint: string;
  address?: string;
  meetLink?: string;
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-88219-01',
    type: 'home',
    patientName: 'Nguyễn Văn Phúc (78 tuổi)',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorTitle: 'Bác sĩ Gia đình Trưởng khoa',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    date: 'Thứ Hai, 27/10/2026',
    time: '09:00 - 10:30',
    status: 'confirmed',
    chiefComplaint: 'Khám định kỳ bệnh tăng huyết áp, kiểm tra khớp gối và xét nghiệm đường huyết tại nhà',
    address: 'Số 45 Đường số 8, Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  },
  {
    id: 'APT-88219-02',
    type: 'telehealth',
    patientName: 'Nguyễn Minh Quân (12 tuổi)',
    doctorName: 'BSCKII Trần Mai Phương',
    doctorTitle: 'Chuyên gia Nhi & Dinh dưỡng',
    doctorAvatar: 'https://images.unsplash.com/photo-1594824813586-b4d291986422?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Nhi Đồng 1',
    date: 'Thứ Tư, 29/10/2026',
    time: '19:30 - 20:00',
    status: 'confirmed',
    chiefComplaint: 'Tái khám tư vấn phác đồ dinh dưỡng và dị ứng mũi họng sau đợt cảm lạnh',
    meetLink: 'https://meet.famidoc.vn/room/apt-88219-02',
  },
  {
    id: 'APT-88219-00',
    type: 'home',
    patientName: 'Trần Thị Mai (42 tuổi)',
    doctorName: 'ThS.BS Võ Thị Phương Thảo',
    doctorTitle: 'Chuyên khoa Sản Phụ Khoa',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Từ Dũ',
    date: '10/10/2026',
    time: '14:00 - 15:30',
    status: 'completed',
    chiefComplaint: 'Thăm khám phụ khoa định kỳ và tư vấn tiền mãn kinh tại nhà',
    address: 'Số 45 Đường số 8, Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  },
];

export function FamilyAppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('2026-11-02');
  const [rescheduleTime, setRescheduleTime] = useState('14:00 - 15:30');
  const [isUnder4Hours, setIsUnder4Hours] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    type: 'home' as 'home' | 'telehealth',
    patientName: 'Nguyễn Văn Phúc (78 tuổi)',
    doctorId: 'doc-01',
    date: '2026-10-30',
    time: '09:00 - 10:30',
    chiefComplaint: '',
    address: 'Số 45 Đường số 8, Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  });

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'upcoming') return apt.status === 'confirmed' || apt.status === 'in_transit';
    if (activeTab === 'completed') return apt.status === 'completed';
    return true;
  });

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.chiefComplaint.trim()) {
      setBookingError('Vui lòng mô tả triệu chứng hoặc nhu cầu khám của người bệnh.');
      return;
    }
    setBookingError('');

    const created: Appointment = {
      id: `APT-88219-0${appointments.length + 1}`,
      type: newBooking.type,
      patientName: newBooking.patientName,
      doctorName: newBooking.type === 'home' ? 'PGS.TS Nguyễn Trọng Nghĩa' : 'BSCKII Lê Hoàng Nam',
      doctorTitle: 'Bác sĩ Quản nhiệm Gia đình',
      doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
      hospital: 'BV Đại học Y Dược TP.HCM',
      date: newBooking.date,
      time: newBooking.time,
      status: 'confirmed',
      chiefComplaint: newBooking.chiefComplaint,
      address: newBooking.type === 'home' ? newBooking.address : undefined,
      meetLink: newBooking.type === 'telehealth' ? `https://meet.famidoc.vn/room/${Date.now()}` : undefined,
    };

    setAppointments([created, ...appointments]);
    setShowBookingModal(false);
    toast.success('Đặt lịch hẹn thành công! Bác sĩ quản nhiệm và trung tâm điều phối đã tiếp nhận.');
  };

  const handleConfirmCancelAppointment = () => {
    if (!cancelTarget) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
    );
    toast.success(`Đã hủy ca khám ${cancelTarget.id}. Lượt khám đã được hoàn lại vào hạn mức gói của gia đình.`);
    setCancelTarget(null);
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleTarget(apt);
    setRescheduleError('');
    setIsUnder4Hours(false);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;

    // Kiểm tra quy tắc 4 tiếng (CFG-07 / BF-03)
    if (isUnder4Hours) {
      setRescheduleError(
        'Yêu cầu đổi lịch bị từ chối do không đảm bảo thời gian báo trước tối thiểu 4 giờ (CFG-07). Vui lòng liên hệ Hotline hỗ trợ 1900 6868 để được điều phối khẩn cấp.'
      );
      return;
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rescheduleTarget.id
          ? { ...a, date: rescheduleDate, time: rescheduleTime }
          : a
      )
    );
    toast.success(
      `Đổi lịch hẹn thành công! Lịch mới: ${rescheduleTime} ngày ${rescheduleDate}. Đã gửi thông báo xác nhận tới Bác sĩ & CSYT.`
    );
    setRescheduleTarget(null);
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
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">3</span>
                <span className="text-xs text-slate-400 font-medium tabular-nums">/ 5 lượt còn lại trong kỳ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: '60%' }} />
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
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">18</span>
                <span className="text-xs text-slate-400 font-medium tabular-nums">/ 20 lượt còn lại trong kỳ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: '90%' }} />
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
                alt="PGS.TS Nguyễn Trọng Nghĩa"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  PGS.TS Nguyễn Trọng Nghĩa
                </div>
                <p className="text-xs text-primary font-medium truncate mt-0.5">
                  BV Đại học Y Dược TP.HCM
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
                    className={`min-h-10 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-primary shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] hidden sm:inline">
                      {t.icon}
                    </span>
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

            <div className="text-xs sm:text-sm text-slate-500 font-medium">
              Hiển thị <span className="font-bold tabular-nums text-slate-800">{filteredAppointments.length}</span> lịch hẹn
            </div>
          </div>

          {/* Danh sách Thẻ Lịch Hẹn */}
          {filteredAppointments.length === 0 ? (
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
                          className={`gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                            isHome
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
                        {apt.status === 'confirmed' && (
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
                            {apt.type === 'telehealth' && (
                              <Button asChild className="min-h-10 w-full rounded-xl text-xs font-semibold gap-1.5">
                                <Link href="/family/telemedicine">
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
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    newBooking.type === 'home'
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      newBooking.type === 'home'
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
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    newBooking.type === 'telehealth'
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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      newBooking.type === 'telehealth'
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
                2. Người thân cần khám <span className="text-rose-500">*</span>
              </Label>
              <select
                value={newBooking.patientName}
                onChange={(e) => setNewBooking({ ...newBooking, patientName: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none"
              >
                <option value="Nguyễn Văn Phúc (78 tuổi)">Nguyễn Văn Phúc (Ông nội - 78 tuổi)</option>
                <option value="Trần Thị Mai (42 tuổi)">Trần Thị Mai (Mẹ - 42 tuổi)</option>
                <option value="Nguyễn Minh Quân (12 tuổi)">Nguyễn Minh Quân (Con trai - 12 tuổi)</option>
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
                  <option value="08:30 - 10:00">08:30 - 10:00 (Buổi sáng)</option>
                  <option value="10:00 - 11:30">10:00 - 11:30 (Buổi sáng)</option>
                  <option value="14:00 - 15:30">14:00 - 15:30 (Buổi chiều)</option>
                  <option value="16:00 - 17:30">16:00 - 17:30 (Buổi chiều)</option>
                  <option value="19:30 - 20:30">19:30 - 20:30 (Buổi tối)</option>
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
                        <option value="09:00 - 10:30">09:00 - 10:30 (Sáng)</option>
                        <option value="10:30 - 12:00">10:30 - 12:00 (Sáng)</option>
                        <option value="14:00 - 15:30">14:00 - 15:30 (Chiều)</option>
                        <option value="16:00 - 17:30">16:00 - 17:30 (Chiều)</option>
                        <option value="19:30 - 20:30">19:30 - 20:30 (Tối)</option>
                      </select>
                    </div>
                  </div>

                  {/* Tuỳ chọn kiểm thử quy định báo trước 4 giờ */}
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <Checkbox
                        checked={isUnder4Hours}
                        onCheckedChange={(checked) => {
                          setIsUnder4Hours(checked === true);
                          setRescheduleError('');
                        }}
                      />
                      <span>Giả lập đổi lịch sát giờ (&lt; 4 tiếng trước giờ hẹn)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 pl-6">
                      Lưu ý: Cần báo trước tối thiểu 4 giờ để Bác sĩ kịp sắp xếp di chuyển.
                    </p>
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
                      className="flex-1 rounded-xl font-semibold gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Lưu giờ hẹn mới</span>
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
