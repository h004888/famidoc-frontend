'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FamilyNav } from '@/components/layout';

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
      alert('Vui lòng mô tả triệu chứng hoặc nhu cầu khám.');
      return;
    }

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
    alert('Đặt lịch hẹn thành công! Bác sĩ quản nhiệm và trung tâm điều phối đã tiếp nhận.');
  };

  const handleCancelAppointment = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy lịch hẹn khám này? Hạn mức khám sẽ được hoàn lại cho gói của gia đình.')) {
      setAppointments(
        appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <FamilyNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Quota Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Đặt Lịch &amp; Quản Lý Lịch Hẹn Thăm Khám
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sẵn sàng điều phối
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Bác sĩ chuyên khoa đến tận nhà mang theo trang thiết bị y tế hoặc tư vấn Telehealth trực tuyến 24/7.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBookingModal(true)}
            className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Đặt lịch khám mới</span>
          </button>
        </div>

        {/* Quota Usage Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs text-[#475569]">
              <span>Khám Bác sĩ Tại Nhà</span>
              <span className="material-symbols-outlined text-[#2563eb] text-[20px]">home_health</span>
            </div>
            <div className="text-2xl font-bold text-[#0f172a]">
              3 <span className="text-xs font-normal text-slate-400">/ 5 lượt còn lại kỳ này</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#2563eb] h-full rounded-full" style={{ width: '60%' }} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs text-[#475569]">
              <span>Tư Vấn Telehealth 24/7</span>
              <span className="material-symbols-outlined text-blue-500 text-[20px]">videocam</span>
            </div>
            <div className="text-2xl font-bold text-[#0f172a]">
              18 <span className="text-xs font-normal text-slate-400">/ 20 lượt còn lại kỳ này</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '90%' }} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs text-[#475569]">
              <span>Bác Sĩ Quản Nhiệm</span>
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
            </div>
            <div className="text-sm font-bold text-[#0f172a] truncate">PGS.TS Nguyễn Trọng Nghĩa</div>
            <p className="text-[11px] text-slate-400">Ưu tiên điều phối trong vòng 15 phút</p>
          </div>
        </div>

        {/* Appointments List Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'upcoming', label: 'Lịch hẹn sắp tới', icon: 'upcoming' },
              { id: 'completed', label: 'Lịch sử đã hoàn thành', icon: 'history' },
              { id: 'all', label: 'Tất cả lịch hẹn', icon: 'list_alt' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Appointment Cards */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
              <h3 className="font-bold text-sm text-[#0f172a]">Không có lịch hẹn nào trong mục này</h3>
              <p className="text-xs text-slate-400">Bạn có thể tạo lịch hẹn mới bất cứ lúc nào gia đình cần thăm khám.</p>
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-xs font-semibold hover:bg-[#1d4ed8]"
              >
                Đặt lịch khám ngay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs p-5 sm:p-6 transition-all space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          apt.type === 'home'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {apt.type === 'home' ? 'home_health' : 'videocam'}
                        </span>
                        {apt.type === 'home' ? 'Khám Bác sĩ Tại Nhà' : 'Tư vấn Telehealth'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-400">{apt.id}</span>
                    </div>

                    <div>
                      {apt.status === 'confirmed' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#03864b] animate-pulse" />
                          Đã xác nhận &amp; Sắp diễn ra
                        </span>
                      )}
                      {apt.status === 'completed' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          Đã hoàn thành
                        </span>
                      )}
                      {apt.status === 'cancelled' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                          Đã hủy
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Doctor and Patient Details */}
                    <div className="md:col-span-8 flex items-start gap-4">
                      <img
                        src={apt.doctorAvatar}
                        alt={apt.doctorName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="text-xs text-[#2563eb] font-semibold">{apt.doctorTitle}</div>
                        <h3 className="text-base font-bold text-[#0f172a]">{apt.doctorName}</h3>
                        <p className="text-xs text-slate-400">{apt.hospital}</p>

                        <div className="pt-2 text-xs text-[#334155] space-y-1">
                          <div>
                            <strong>Bệnh nhân thăm khám:</strong> {apt.patientName}
                          </div>
                          <div>
                            <strong>Lý do khám:</strong> {apt.chiefComplaint}
                          </div>
                          {apt.address && (
                            <div className="flex items-start gap-1 text-slate-500">
                              <span className="material-symbols-outlined text-[14px] text-slate-400 mt-0.5 shrink-0">location_on</span>
                              <span>{apt.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time & Quick Actions */}
                    <div className="md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Thời gian hẹn
                        </span>
                        <div className="font-bold text-sm text-[#0f172a] flex items-center gap-1.5 mt-0.5">
                          <span className="material-symbols-outlined text-[16px] text-[#2563eb]">schedule</span>
                          <span>{apt.time}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{apt.date}</div>
                      </div>

                      {/* Action buttons */}
                      {apt.status === 'confirmed' && (
                        <div className="space-y-2">
                          {apt.type === 'telehealth' && apt.meetLink && (
                            <a
                              href={apt.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">videocam</span>
                              <span>Vào phòng khám Video</span>
                            </a>
                          )}
                          {apt.type === 'home' && (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-emerald-600">medical_services</span>
                              <span>Bác sĩ sẽ mang máy đo ECG &amp; kit xét nghiệm tới</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCancelAppointment(apt.id)}
                              className="flex-1 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors border border-red-200"
                            >
                              Hủy lịch
                            </button>
                            <button
                              type="button"
                              onClick={() => alert('Vui lòng liên hệ Hotline 1900 6868 hoặc bác sĩ để chọn khung giờ mới')}
                              className="flex-1 py-1.5 text-xs text-[#475569] hover:bg-slate-200 rounded-lg font-semibold transition-colors border border-slate-200"
                            >
                              Đổi giờ
                            </button>
                          </div>
                        </div>
                      )}

                      {apt.status === 'completed' && (
                        <Link
                          href="/family/members"
                          className="w-full py-2 bg-white hover:bg-slate-100 text-[#0f172a] border border-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">clinical_notes</span>
                          <span>Xem kết quả bệnh án &amp; đơn thuốc</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Form Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#0f172a]">Đặt Lịch Hẹn Thăm Khám Y Tế</h3>
                <p className="text-xs text-[#475569]">Chọn hình thức và thông tin bệnh nhân gia đình</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block font-bold text-[#0f172a] mb-2">Hình thức thăm khám *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      newBooking.type === 'home'
                        ? 'border-[#2563eb] bg-blue-50/50 text-[#2563eb] font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookingType"
                      checked={newBooking.type === 'home'}
                      onChange={() => setNewBooking({ ...newBooking, type: 'home' })}
                      className="text-[#2563eb]"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">home_health</span>
                        <span>Khám Tại Nhà</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Bác sĩ đến tư gia</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      newBooking.type === 'telehealth'
                        ? 'border-[#2563eb] bg-blue-50/50 text-[#2563eb] font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bookingType"
                      checked={newBooking.type === 'telehealth'}
                      onChange={() => setNewBooking({ ...newBooking, type: 'telehealth' })}
                      className="text-[#2563eb]"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">videocam</span>
                        <span>Telehealth 24/7</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Tư vấn video trực tuyến</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Patient select */}
              <div>
                <label className="block font-semibold text-[#475569] mb-1">Thành viên cần khám *</label>
                <select
                  value={newBooking.patientName}
                  onChange={(e) => setNewBooking({ ...newBooking, patientName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb] bg-white"
                >
                  <option value="Nguyễn Văn Phúc (78 tuổi)">Nguyễn Văn Phúc (Ông nội - 78 tuổi)</option>
                  <option value="Trần Thị Mai (42 tuổi)">Trần Thị Mai (Mẹ - 42 tuổi)</option>
                  <option value="Nguyễn Minh Quân (12 tuổi)">Nguyễn Minh Quân (Con trai - 12 tuổi)</option>
                </select>
              </div>

              {/* Date & Time slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Ngày mong muốn *</label>
                  <input
                    type="date"
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Khung giờ tiếp nhận *</label>
                  <select
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb] bg-white"
                  >
                    <option value="08:30 - 10:00">08:30 - 10:00 (Buổi sáng)</option>
                    <option value="10:00 - 11:30">10:00 - 11:30 (Buổi sáng)</option>
                    <option value="14:00 - 15:30">14:00 - 15:30 (Buổi chiều)</option>
                    <option value="16:00 - 17:30">16:00 - 17:30 (Buổi chiều)</option>
                    <option value="19:30 - 20:30">19:30 - 20:30 (Buổi tối)</option>
                  </select>
                </div>
              </div>

              {/* Address (if home visit) */}
              {newBooking.type === 'home' && (
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Địa chỉ tư gia tiếp đón *</label>
                  <input
                    type="text"
                    value={newBooking.address}
                    onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb] bg-white"
                  />
                </div>
              )}

              {/* Chief complaint */}
              <div>
                <label className="block font-semibold text-[#475569] mb-1">
                  Mô tả triệu chứng hoặc nhu cầu chuyên khoa *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newBooking.chiefComplaint}
                  onChange={(e) => setNewBooking({ ...newBooking, chiefComplaint: e.target.value })}
                  placeholder="Ví dụ: Đo lại huyết áp và tái khám đường huyết, đau tức nhẹ khớp gối khi thời tiết đổi lạnh..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb] bg-white"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[#475569] font-semibold hover:bg-slate-50 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Xác nhận lịch khám</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

