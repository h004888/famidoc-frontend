'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface Appointment {
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

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-88219-01',
    type: 'home',
    patientName: 'Nguyễn Văn Phúc (Ông nội - 78 tuổi)',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorTitle: 'Bác sĩ Gia đình Phụ trách',
    doctorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    date: 'Thứ Hai, 27/10/2026',
    time: '09:00 - 10:30',
    status: 'confirmed',
    chiefComplaint:
      'Khám định kỳ tăng huyết áp, kiểm tra khớp gối và xét nghiệm đường huyết tại nhà',
    address: 'Số 45 Đường số 8, Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  },
  {
    id: 'APT-88219-02',
    type: 'telehealth',
    patientName: 'Nguyễn Minh Quân (Con trai - 12 tuổi)',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorTitle: 'Bác sĩ Gia đình Phụ trách',
    doctorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    date: 'Thứ Tư, 29/10/2026',
    time: '19:30 - 20:00',
    status: 'confirmed',
    chiefComplaint:
      'Tái khám tư vấn dị ứng mũi họng và điều chỉnh chế độ dinh dưỡng sau cảm lạnh',
    meetLink: 'https://meet.famidoc.vn/room/apt-88219-02',
  },
  {
    id: 'APT-88219-00',
    type: 'home',
    patientName: 'Trần Thị Mai (Mẹ - 42 tuổi)',
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    doctorTitle: 'Bác sĩ Gia đình Phụ trách',
    doctorAvatar:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    hospital: 'BV Đại học Y Dược TP.HCM',
    date: 'Thứ Bảy, 10/10/2026',
    time: '14:00 - 15:30',
    status: 'completed',
    chiefComplaint:
      'Thăm khám sức khỏe tổng quát và theo dõi chỉ số huyết áp định kỳ tại nhà',
    address: 'Số 45 Đường số 8, Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  },
];

export function FamilyAppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [appointmentToast, setAppointmentToast] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('2026-11-02');
  const [rescheduleTime, setRescheduleTime] = useState('14:00 - 15:30');

  // Booking form state
  const [newBooking, setNewBooking] = useState({
    type: 'home' as 'home' | 'telehealth',
    patientName: 'Nguyễn Văn Phúc (Ông nội - 78 tuổi)',
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
      setBookingError('Vui lòng nhập lý do khám hoặc triệu chứng của người thân.');
      return;
    }
    setBookingError('');

    const created: Appointment = {
      id: `APT-88219-0${appointments.length + 1}`,
      type: newBooking.type,
      patientName: newBooking.patientName,
      doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
      doctorTitle: 'Bác sĩ Gia đình Phụ trách',
      doctorAvatar:
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
      hospital: 'BV Đại học Y Dược TP.HCM',
      date: newBooking.date,
      time: newBooking.time,
      status: 'confirmed',
      chiefComplaint: newBooking.chiefComplaint,
      address: newBooking.type === 'home' ? newBooking.address : undefined,
      meetLink:
        newBooking.type === 'telehealth'
          ? `https://meet.famidoc.vn/room/${Date.now()}`
          : undefined,
    };

    setAppointments([created, ...appointments]);
    setShowBookingModal(false);
    setNewBooking({
      type: 'home',
      patientName: 'Nguyễn Văn Phúc (Ông nội - 78 tuổi)',
      date: '2026-10-30',
      time: '09:00 - 10:30',
      chiefComplaint: '',
      address: 'Số 45 Đường số 8, Phường An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
    });
    setAppointmentToast('Đặt lịch hẹn thành công! Bác sĩ gia đình đã tiếp nhận lịch.');
    setTimeout(() => setAppointmentToast(null), 5000);
  };

  const handleConfirmCancelAppointment = () => {
    if (!cancelTarget) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
    );
    setAppointmentToast(`Đã hủy lịch hẹn #${cancelTarget.id}. Lượt khám đã được hoàn lại vào gói gia đình.`);
    setCancelTarget(null);
    setTimeout(() => setAppointmentToast(null), 5000);
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleTarget(apt);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === rescheduleTarget.id
          ? { ...a, date: rescheduleDate, time: rescheduleTime }
          : a
      )
    );
    setAppointmentToast(
      `Đổi lịch hẹn thành công! Giờ hẹn mới: ${rescheduleTime} ngày ${rescheduleDate}.`
    );
    setRescheduleTarget(null);
    setTimeout(() => setAppointmentToast(null), 5000);
  };

  const upcomingCount = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'in_transit'
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Thông báo kết quả thao tác */}
        {appointmentToast && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">
                check_circle
              </span>
              <span>{appointmentToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setAppointmentToast(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 shrink-0 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* 1. HEADER TINH GỌN */}
        <header className="space-y-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#2E37A4] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Bảng Sức Khỏe Gia Đình</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">Lịch Hẹn Khám</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Lịch Hẹn Khám Của Gia Đình
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Quản lý lịch bác sĩ đến khám tại nhà và tư vấn qua Video trực tuyến cho các thành viên trong gia đình
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowBookingModal(true)}
              className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span>Đặt lịch khám mới</span>
            </button>
          </div>
        </header>

        {/* 2. 3 THẺ TỔNG QUAN: HẠN MỨC & BÁC SĨ GIA ĐÌNH */}
        <section
          aria-label="Hạn mức và bác sĩ phụ trách"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
        >
          {/* Cột 1: Khám tại nhà */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Khám Bác Sĩ Tại Nhà
              </span>
              <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2E37A4] border border-blue-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">home_health</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">3</span>
              <span className="text-xs text-slate-500 font-medium tabular-nums">/ 5 lượt còn lại trong kỳ</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#2E37A4] h-full rounded-full transition-all" style={{ width: '60%' }} />
            </div>
          </div>

          {/* Cột 2: Tư vấn Video */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tư Vấn Video Trực Tuyến
              </span>
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-slate-900">18</span>
              <span className="text-xs text-slate-500 font-medium tabular-nums">/ 20 lượt còn lại trong kỳ</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: '90%' }} />
            </div>
          </div>

          {/* Cột 3: Bác sĩ gia đình phụ trách */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bác Sĩ Gia Đình
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Trực tuyến</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop"
                alt="PGS.TS Nguyễn Trọng Nghĩa"
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  PGS.TS Nguyễn Trọng Nghĩa
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  Trưởng khoa Nội Tổng quát · BV ĐH Y Dược
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BỘ LỌC TABS & DANH SÁCH LỊCH HẸN */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
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
                        ? 'bg-white text-[#2E37A4] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[11px] tabular-nums font-semibold leading-none ${
                        isActive ? 'bg-blue-50 text-[#2E37A4]' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Tổng số: <span className="font-bold tabular-nums text-slate-800">{filteredAppointments.length}</span> lịch hẹn
            </div>
          </div>

          {/* Danh sách thẻ lịch hẹn */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 sm:p-14 text-center space-y-3 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
              <h3 className="font-bold text-sm text-slate-900">Không có lịch hẹn nào trong danh mục này</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quý gia đình có thể đặt lịch khám tại nhà hoặc gọi tư vấn Video với bác sĩ bất cứ lúc nào.
              </p>
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="min-h-10 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2E37A4] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#222982] cursor-pointer shadow-xs transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Đặt lịch khám ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => {
                const isHome = apt.type === 'home';
                const isCancelled = apt.status === 'cancelled';
                const isCompleted = apt.status === 'completed';

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all p-5 sm:p-6 space-y-4"
                  >
                    {/* Hàng 1: Loại hình khám, mã số & trạng thái */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isHome
                              ? 'bg-blue-50 text-[#2E37A4] border border-blue-200/70'
                              : 'bg-sky-50 text-sky-700 border border-sky-200/70'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isHome ? 'home_health' : 'videocam'}
                          </span>
                          <span>{isHome ? 'Khám bác sĩ tại nhà' : 'Tư vấn Video trực tuyến'}</span>
                        </span>

                        <span className="text-xs font-semibold tabular-nums text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          #{apt.id}
                        </span>
                      </div>

                      <div>
                        {apt.status === 'confirmed' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Sắp diễn ra</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                            <span>Đã hoàn thành</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px]">cancel</span>
                            <span>Đã hủy lịch</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hàng 2: Grid 3 cột rõ ràng (Thời gian & Địa điểm / Người khám & Triệu chứng / Bác sĩ & Thao tác) */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      {/* Khối 1 (4 cols): Thời gian & Địa điểm */}
                      <div className="md:col-span-4 space-y-2">
                        <div className="flex items-center gap-2 text-[#2E37A4]">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          <span className="font-bold text-sm text-slate-900">{apt.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                          <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
                          <span className="font-semibold tabular-nums text-slate-800">{apt.time}</span>
                        </div>
                        {isHome && apt.address ? (
                          <div className="flex items-start gap-1.5 text-xs text-slate-500 pt-1">
                            <span className="material-symbols-outlined text-[16px] text-slate-400 shrink-0 mt-0.5">location_on</span>
                            <span className="line-clamp-2">{apt.address}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-sky-700 pt-1">
                            <span className="material-symbols-outlined text-[16px] shrink-0">videocam</span>
                            <span>Phòng khám Telehealth trực tuyến</span>
                          </div>
                        )}
                      </div>

                      {/* Khối 2 (5 cols): Người thân & Lý do khám */}
                      <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Người khám:</span>
                          <span className="font-bold text-sm text-slate-900">{apt.patientName}</span>
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-2">
                          <span className="font-medium text-slate-500">Lý do: </span>
                          <span>{apt.chiefComplaint}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                          <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">person_heart</span>
                          <span>Bác sĩ phụ trách: <strong className="text-slate-800">{apt.doctorName}</strong></span>
                        </div>
                      </div>

                      {/* Khối 3 (3 cols): Nút hành động */}
                      <div className="md:col-span-3 flex flex-col gap-2 justify-center items-stretch sm:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                        {apt.status === 'confirmed' && (
                          <>
                            {apt.type === 'telehealth' ? (
                              <Link
                                href="/family/telemedicine"
                                className="min-h-10 w-full py-2 px-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">videocam</span>
                                <span>Vào phòng khám Video</span>
                              </Link>
                            ) : (
                              <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 w-full text-center">
                                Khám bác sĩ tại nhà
                              </div>
                            )}

                            <div className="flex items-center gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => handleOpenReschedule(apt)}
                                className="min-h-9 flex-1 py-1.5 px-2.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded-xl font-semibold border border-slate-200 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit_calendar</span>
                                <span>Đổi lịch</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelTarget(apt)}
                                className="min-h-9 flex-1 py-1.5 px-2.5 text-xs text-rose-600 bg-white hover:bg-rose-50 rounded-xl font-semibold border border-rose-200 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">close</span>
                                <span>Hủy</span>
                              </button>
                            </div>
                          </>
                        )}

                        {isCompleted && (
                          <Link
                            href="/family/members"
                            className="min-h-10 w-full py-2 px-3 bg-white hover:bg-slate-50 text-[#2E37A4] border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">description</span>
                            <span>Xem hồ sơ &amp; toa thuốc</span>
                          </Link>
                        )}

                        {isCancelled && (
                          <button
                            type="button"
                            onClick={() => setShowBookingModal(true)}
                            className="min-h-10 w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">replay</span>
                            <span>Đặt lại lịch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: ĐẶT LỊCH HẸN MỚI */}
      {showBookingModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-5 bg-[#2E37A4] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">
                    Đặt Lịch Hẹn Khám Mới
                  </h3>
                  <p className="text-xs text-blue-100 truncate mt-0.5">
                    Bác sĩ gia đình: PGS.TS Nguyễn Trọng Nghĩa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 text-xs">
              {/* Chọn hình thức */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  1. Hình thức khám <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      newBooking.type === 'home'
                        ? 'border-[#2E37A4] bg-blue-50/60 text-[#2E37A4] ring-2 ring-[#2E37A4]/15 font-semibold'
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
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        newBooking.type === 'home' ? 'bg-[#2E37A4] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">home_health</span>
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold">Khám tại nhà</div>
                      <div className="text-[11px] text-slate-500 font-normal">Còn 3 lượt</div>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      newBooking.type === 'telehealth'
                        ? 'border-[#2E37A4] bg-blue-50/60 text-[#2E37A4] ring-2 ring-[#2E37A4]/15 font-semibold'
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
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        newBooking.type === 'telehealth' ? 'bg-[#2E37A4] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">videocam</span>
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold">Tư vấn Video</div>
                      <div className="text-[11px] text-slate-500 font-normal">Còn 18 lượt</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Chọn người thân */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  2. Người thân cần khám <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newBooking.patientName}
                  onChange={(e) => setNewBooking({ ...newBooking, patientName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                >
                  <option value="Nguyễn Văn Phúc (Ông nội - 78 tuổi)">Nguyễn Văn Phúc (Ông nội - 78 tuổi)</option>
                  <option value="Trần Thị Mai (Mẹ - 42 tuổi)">Trần Thị Mai (Mẹ - 42 tuổi)</option>
                  <option value="Nguyễn Minh Quân (Con trai - 12 tuổi)">Nguyễn Minh Quân (Con trai - 12 tuổi)</option>
                </select>
              </div>

              {/* Ngày & Giờ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    3. Ngày hẹn mong muốn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    4. Khung giờ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                  >
                    <option value="09:00 - 10:30">09:00 - 10:30 (Sáng)</option>
                    <option value="10:30 - 12:00">10:30 - 12:00 (Sáng)</option>
                    <option value="14:00 - 15:30">14:00 - 15:30 (Chiều)</option>
                    <option value="16:00 - 17:30">16:00 - 17:30 (Chiều)</option>
                    <option value="19:30 - 20:30">19:30 - 20:30 (Tối)</option>
                  </select>
                </div>
              </div>

              {/* Địa chỉ khám tại nhà */}
              {newBooking.type === 'home' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Địa chỉ tiếp đón bác sĩ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBooking.address}
                    onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                  />
                </div>
              )}

              {/* Lý do khám */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Lý do khám hoặc triệu chứng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newBooking.chiefComplaint}
                  onChange={(e) => {
                    setNewBooking({ ...newBooking, chiefComplaint: e.target.value });
                    if (bookingError) setBookingError('');
                  }}
                  placeholder="Ví dụ: Đo huyết áp định kỳ, đau nhức gối, tư vấn dinh dưỡng..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                />
                {bookingError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{bookingError}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Xác nhận đặt lịch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỔI LỊCH HẸN */}
      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-5 bg-[#2E37A4] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Đổi Giờ Hẹn Khám
                  </h3>
                  <p className="text-xs text-blue-100">Mã lịch hẹn: #{rescheduleTarget.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">
                  Lịch hiện tại: <strong className="text-slate-900 tabular-nums">{rescheduleTarget.time}</strong> ·{' '}
                  <strong className="text-slate-900 tabular-nums">{rescheduleTarget.date}</strong>
                </div>
                <div className="text-slate-500">
                  Người khám: <strong className="text-slate-900">{rescheduleTarget.patientName}</strong>
                </div>
              </div>

              <form onSubmit={handleConfirmReschedule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Ngày khám mới</label>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 focus:border-[#2E37A4] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Khung giờ mới</label>
                    <select
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 focus:border-[#2E37A4] outline-none"
                    >
                      <option value="09:00 - 10:30">09:00 - 10:30 (Sáng)</option>
                      <option value="10:30 - 12:00">10:30 - 12:00 (Sáng)</option>
                      <option value="14:00 - 15:30">14:00 - 15:30 (Chiều)</option>
                      <option value="16:00 - 17:30">16:00 - 17:30 (Chiều)</option>
                      <option value="19:30 - 20:30">19:30 - 20:30 (Tối)</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Lưu ý: Quý gia đình vui lòng đổi lịch trước ít nhất 4 giờ để Bác sĩ kịp sắp xếp thời gian di chuyển.
                </p>

                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRescheduleTarget(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Lưu lịch mới</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN HỦY LỊCH */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-5 bg-rose-600 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">event_busy</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Xác Nhận Hủy Lịch Khám
                  </h3>
                  <p className="text-xs text-rose-100">Mã lịch hẹn: #{cancelTarget.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5 leading-relaxed">
                <div>
                  Người khám: <strong>{cancelTarget.patientName}</strong>
                </div>
                <div>
                  Thời gian: <strong className="tabular-nums">{cancelTarget.time} · {cancelTarget.date}</strong>
                </div>
                <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  <span>Lượt khám sẽ được tự động hoàn lại vào gói của gia đình.</span>
                </p>
              </div>

              <p className="text-slate-500 leading-relaxed">
                Hệ thống sẽ thông báo cho <strong>{cancelTarget.doctorName}</strong> để điều chỉnh lịch trình.
              </p>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Giữ lại lịch hẹn
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelAppointment}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận hủy lịch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
