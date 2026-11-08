'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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
  const [appointmentToast, setAppointmentToast] = useState<string | null>(null);
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
    setAppointmentToast('Đặt lịch hẹn thành công! Bác sĩ quản nhiệm và trung tâm điều phối đã tiếp nhận.');
    setTimeout(() => setAppointmentToast(null), 5000);
  };

  const handleConfirmCancelAppointment = () => {
    if (!cancelTarget) return;
    setAppointments((prev) =>
      prev.map((a) => (a.id === cancelTarget.id ? { ...a, status: 'cancelled' } : a))
    );
    setAppointmentToast(`Đã hủy ca khám ${cancelTarget.id}. Lượt khám đã được hoàn lại vào hạn mức gói của gia đình.`);
    setCancelTarget(null);
    setTimeout(() => setAppointmentToast(null), 5000);
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
    setAppointmentToast(
      `Đổi lịch hẹn thành công! Lịch mới: ${rescheduleTime} ngày ${rescheduleDate}. Đã gửi thông báo xác nhận tới Bác sĩ & CSYT.`
    );
    setRescheduleTarget(null);
    setTimeout(() => setAppointmentToast(null), 5000);
  };

  const upcomingCount = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'in_transit'
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  const getAppointmentHeaderStyle = (apt: Appointment) => {
    if (apt.status === 'cancelled') {
      return {
        headerBg: 'bg-slate-700 text-white',
        badgeBg: 'bg-white/15 text-white border-white/25',
      };
    }
    if (apt.type === 'home') {
      return {
        headerBg: 'bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white',
        badgeBg: 'bg-white/15 text-white border-white/25',
      };
    }
    return {
      headerBg: 'bg-gradient-to-r from-[#0369a1] to-[#0284c7] text-white',
      badgeBg: 'bg-white/15 text-white border-white/25',
    };
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Thông báo phản hồi thao tác */}
        {appointmentToast && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2"
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
              ✕
            </button>
          </div>
        )}

        {/* 1. HEADER TRANG ĐẶT LỊCH & QUẢN LÝ LỊCH HẸN */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center shadow-sm ring-4 ring-[#2E37A4]/10 shrink-0">
                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">
                  calendar_month
                </span>
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#2E37A4] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                    Hộ #FAM-88219
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Sẵn sàng điều phối 24/7</span>
                  </span>
                </div>

                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  Đặt Lịch &amp; Quản Lý Lịch Hẹn Khám Gia Đình
                </h1>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Đặt lịch Bác sĩ gia đình đến khám tận nhà hoặc tư vấn qua Video trực tuyến cho các thành viên.
                </p>
              </div>
            </div>

            <div className="pt-3.5 lg:pt-0 border-t border-slate-100 lg:border-t-0 shrink-0">
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="w-full sm:w-auto px-5 py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Đặt lịch khám mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. THẺ HẠN MỨC GÓI KHÁM & BÁC SĨ PHỤ TRÁCH (3 CỘT CÂN ĐỐI) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Cột 1: Khám tại nhà */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Khám Bác sĩ Tại Nhà</span>
              <span className="w-9 h-9 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[19px]">home_health</span>
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">3</span>
                <span className="text-xs font-medium text-slate-500">/ 5 lượt còn lại trong kỳ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-[#2E37A4] h-full rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>

          {/* Cột 2: Tư vấn Telehealth */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Tư Vấn Video (Telehealth)</span>
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[19px]">videocam</span>
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">18</span>
                <span className="text-xs font-medium text-slate-500">/ 20 lượt còn lại trong kỳ</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: '90%' }} />
              </div>
            </div>
          </div>

          {/* Cột 3: Bác sĩ gia đình phụ trách */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Bác Sĩ Gia Đình Phụ Trách</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Trực tuyến
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop"
                alt="PGS.TS Nguyễn Trọng Nghĩa"
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                  PGS.TS Nguyễn Trọng Nghĩa
                </div>
                <p className="text-[11px] text-[#2E37A4] font-medium truncate">
                  BV Đại học Y Dược TP.HCM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. BỘ LỌC & DANH SÁCH LỊCH HẸN */}
        <div className="space-y-4">
          {/* Thanh Tabs lọc lịch hẹn — Căn chỉnh chuẩn xác trên cả Mobile & Desktop */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto bg-slate-100/80 sm:bg-transparent p-1 sm:p-0 rounded-xl">
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
                    className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#2E37A4] text-white shadow-xs'
                        : 'text-slate-600 sm:bg-slate-50 hover:bg-white sm:hover:bg-slate-100 sm:border sm:border-slate-200/70'
                    }`}
                  >
                    <span className="hidden sm:inline-flex items-center">
                      <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                    </span>
                    <span>{t.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between sm:justify-end text-xs text-slate-500 font-medium px-1 sm:px-0">
              <span className="sm:hidden">Tổng số trong mục này:</span>
              <span className="font-bold text-slate-700 sm:font-medium sm:text-slate-500">
                Hiển thị {filteredAppointments.length} lịch hẹn
              </span>
            </div>
          </div>

          {/* Danh sách Thẻ Lịch Hẹn */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 sm:p-12 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
              <h3 className="font-bold text-sm text-slate-900">Chưa có lịch hẹn nào trong mục này</h3>
              <p className="text-xs text-slate-500">
                Bạn có thể đặt lịch Bác sĩ đến nhà hoặc tư vấn qua Video bất cứ lúc nào gia đình cần.
              </p>
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#2E37A4] text-white rounded-xl text-xs font-bold hover:bg-[#222982] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Đặt lịch khám ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => {
                const headerStyle = getAppointmentHeaderStyle(apt);

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-all"
                  >
                    {/* Tầng 1: Header Lịch Hẹn (Nền màu phân biệt rõ ràng theo loại hình khám) */}
                    <div
                      className={`px-4 py-3.5 sm:px-6 sm:py-4 ${headerStyle.headerBg} flex flex-wrap items-center justify-between gap-2.5`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border backdrop-blur-xs ${headerStyle.badgeBg}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {apt.type === 'home' ? 'home_health' : 'videocam'}
                          </span>
                          <span>
                            {apt.type === 'home' ? 'Khám Bác sĩ Tại Nhà' : 'Tư vấn Video (Telehealth)'}
                          </span>
                        </span>
                        <span className="text-xs font-mono font-bold text-white/80 bg-black/15 px-2.5 py-1 rounded-lg">
                          #{apt.id}
                        </span>
                      </div>

                      <div>
                        {apt.status === 'confirmed' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 shadow-2xs inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Đã xác nhận • Sắp diễn ra</span>
                          </span>
                        )}
                        {apt.status === 'completed' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-700 inline-flex items-center gap-1 whitespace-nowrap">
                            <span className="material-symbols-outlined text-[14px] text-emerald-600">
                              check_circle
                            </span>
                            <span>Đã hoàn thành</span>
                          </span>
                        )}
                        {apt.status === 'cancelled' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 whitespace-nowrap">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            <span>Đã hủy lịch</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tầng 2: Nội dung chi tiết ca hẹn */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                      {/* Cột trái (8 cols): Bác sĩ, Người bệnh & Lý do khám */}
                      <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                        {/* Thông tin Bác sĩ & Người thân được khám */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={apt.doctorAvatar}
                              alt={apt.doctorName}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-[11px] text-[#2E37A4] font-bold uppercase tracking-wider">
                                {apt.doctorTitle}
                              </div>
                              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate mt-0.5">
                                {apt.doctorName}
                              </h3>
                              <p className="text-xs text-slate-500 truncate">{apt.hospital}</p>
                            </div>
                          </div>

                          <div className="self-start sm:self-center px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Người thân được khám
                            </span>
                            <strong className="font-bold text-[#2E37A4] flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[15px]">person</span>
                              <span>{apt.patientName}</span>
                            </strong>
                          </div>
                        </div>

                        {/* Lý do khám & Địa điểm */}
                        <div className="space-y-2.5">
                          <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 border-l-4 border-l-[#2E37A4] text-xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Triệu chứng &amp; Nhu cầu thăm khám
                            </span>
                            <p className="text-slate-800 font-medium leading-relaxed text-xs sm:text-sm">
                              {apt.chiefComplaint}
                            </p>
                          </div>

                          {apt.address && (
                            <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50/60 px-3.5 py-2.5 rounded-xl border border-slate-200/60">
                              <span className="material-symbols-outlined text-[16px] text-[#2E37A4] shrink-0 mt-0.5">
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
                      <div className="lg:col-span-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Thời gian hẹn khám
                          </span>
                          <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                            <div className="font-extrabold font-mono text-base text-[#2E37A4] flex items-center gap-1.5">
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
                            {apt.type === 'telehealth' && apt.meetLink && (
                              <a
                                href={apt.meetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-4 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                              >
                                <span className="material-symbols-outlined text-[17px]">videocam</span>
                                <span>Vào phòng khám Video</span>
                              </a>
                            )}

                            {apt.type === 'home' && (
                              <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-[11px] text-emerald-800 font-medium flex items-start gap-2">
                                <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                                  medical_services
                                </span>
                                <span>Bác sĩ mang theo máy đo điện tim ECG &amp; bộ lấy mẫu xét nghiệm tận nhà.</span>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenReschedule(apt)}
                                className="py-2 px-3 text-xs text-slate-700 bg-white hover:bg-slate-100 rounded-xl font-bold transition-colors border border-slate-200/90 inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px] text-[#2E37A4]">
                                  edit_calendar
                                </span>
                                <span>Đổi giờ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelTarget(apt)}
                                className="py-2 px-3 text-xs text-rose-600 bg-white hover:bg-rose-50 rounded-xl font-bold transition-colors border border-rose-200 inline-flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">close</span>
                                <span>Hủy lịch</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {apt.status === 'completed' && (
                          <Link
                            href="/family/members"
                            className="w-full py-2.5 px-3 bg-white hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white border border-blue-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                            <span>Xem kết quả khám &amp; toa thuốc</span>
                          </Link>
                        )}

                        {apt.status === 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => setShowBookingModal(true)}
                            className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">replay</span>
                            <span>Đặt lại lịch khám này</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: ĐẶT LỊCH HẸN KHÁM MỚI */}
      {showBookingModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">calendar_add_on</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                    Đặt Lịch Hẹn Bác Sĩ Gia Đình
                  </h3>
                  <p className="text-[11px] text-indigo-100 truncate mt-0.5">
                    Chọn hình thức khám tại nhà hoặc tư vấn qua Video trực tuyến
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

            <form onSubmit={handleCreateBooking} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Chọn hình thức khám */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  1. Chọn hình thức thăm khám <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      newBooking.type === 'home'
                        ? 'border-[#2E37A4] bg-blue-50/60 text-[#2E37A4] ring-2 ring-[#2E37A4]/15 font-bold'
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
                          ? 'bg-[#2E37A4] text-white'
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
                        ? 'border-[#2E37A4] bg-blue-50/60 text-[#2E37A4] ring-2 ring-[#2E37A4]/15 font-bold'
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
                          ? 'bg-[#2E37A4] text-white'
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
                <label className="block font-bold text-slate-700 mb-1.5">
                  2. Người thân cần khám <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newBooking.patientName}
                  onChange={(e) => setNewBooking({ ...newBooking, patientName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
                >
                  <option value="Nguyễn Văn Phúc (78 tuổi)">Nguyễn Văn Phúc (Ông nội - 78 tuổi)</option>
                  <option value="Trần Thị Mai (42 tuổi)">Trần Thị Mai (Mẹ - 42 tuổi)</option>
                  <option value="Nguyễn Minh Quân (12 tuổi)">Nguyễn Minh Quân (Con trai - 12 tuổi)</option>
                </select>
              </div>

              {/* Ngày & Khung giờ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    3. Ngày khám mong muốn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    4. Khung giờ hẹn <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
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
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Địa chỉ đón Bác sĩ tại nhà <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newBooking.address}
                    onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-medium text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
                  />
                </div>
              )}

              {/* Lý do khám */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Mô tả triệu chứng hoặc nhu cầu khám <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newBooking.chiefComplaint}
                  onChange={(e) => {
                    setNewBooking({ ...newBooking, chiefComplaint: e.target.value });
                    if (bookingError) setBookingError('');
                  }}
                  placeholder="Ví dụ: Đo lại huyết áp và kiểm tra đường huyết định kỳ, đau mỏi khớp gối..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
                />
                {bookingError && (
                  <p className="text-xs text-rose-600 font-bold mt-1">{bookingError}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 sm:py-3 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-bold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Xác nhận đặt lịch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỔI GIỜ HẸN KHÁM */}
      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Đổi Ngày Giờ Hẹn Khám
                  </h3>
                  <p className="text-[11px] text-indigo-100">Mã lịch hẹn: #{rescheduleTarget.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                <div className="text-slate-500">
                  Lịch hiện tại: <strong className="text-slate-900">{rescheduleTarget.time}</strong> •{' '}
                  <strong className="text-slate-900">{rescheduleTarget.date}</strong>
                </div>
                <div className="text-slate-500">
                  Bác sĩ: <strong className="text-[#2E37A4]">{rescheduleTarget.doctorName}</strong>
                </div>
                <div className="text-slate-500">
                  Người khám: <strong className="text-slate-900">{rescheduleTarget.patientName}</strong>
                </div>
              </div>

              {rescheduleError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">
                    error
                  </span>
                  <span>{rescheduleError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Ngày khám mới</label>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 focus:border-[#2E37A4] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Khung giờ mới</label>
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

                {/* Tuỳ chọn kiểm thử quy định báo trước 4 giờ */}
                <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                    <input
                      type="checkbox"
                      checked={isUnder4Hours}
                      onChange={(e) => {
                        setIsUnder4Hours(e.target.checked);
                        setRescheduleError('');
                      }}
                      className="rounded text-[#2E37A4]"
                    />
                    <span>Giả lập đổi lịch sát giờ (&lt; 4 tiếng trước giờ hẹn)</span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-5">
                    Lưu ý: Cần báo trước tối thiểu 4 giờ để Bác sĩ kịp sắp xếp lịch di chuyển.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRescheduleTarget(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Lưu giờ hẹn mới</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN HỦY LỊCH HẸN */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">event_busy</span>
                </span>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Xác Nhận Hủy Lịch Khám
                  </h3>
                  <p className="text-[11px] text-rose-100">Mã ca hẹn: #{cancelTarget.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-950 space-y-1.5 leading-relaxed">
                <div>
                  Người khám: <strong>{cancelTarget.patientName}</strong>
                </div>
                <div>
                  Thời gian: <strong>{cancelTarget.time} • {cancelTarget.date}</strong>
                </div>
                <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  <span>Lượt khám sẽ được hoàn lại nguyên vẹn vào gói của gia đình.</span>
                </p>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Hệ thống sẽ tự động báo cho <strong>{cancelTarget.doctorName}</strong> để ngừng lịch di chuyển đến nhà.
              </p>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
                >
                  Giữ lại lịch hẹn
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelAppointment}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
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


