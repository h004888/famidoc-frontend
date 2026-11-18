'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AdminDisputesView } from '@/features/admin-disputes/components/admin-disputes-view';

interface AppointmentCoordination {
  id: string;
  type: 'home_visit' | 'facility' | 'telehealth';
  patientName: string;
  familyId: string;
  assignedDoctor: string;
  slotTime: string;
  addressOrRoom: string;
  status: 'assigned' | 'in_progress' | 'reassign_needed';
}


const INITIAL_APPOINTMENTS: AppointmentCoordination[] = [
  {
    id: 'APT-9901',
    type: 'home_visit',
    patientName: 'Cụ Nguyễn Văn Phúc (78t)',
    familyId: 'Hộ FAM-88219 (Quận 5)',
    assignedDoctor: 'BS. Hoàng Gia Bảo',
    slotTime: '14:30 - 15:30 Hôm nay',
    addressOrRoom: 'Số 124 Nguyễn Tri Phương, P.7, Q.5',
    status: 'assigned',
  },
  {
    id: 'APT-9902',
    type: 'facility',
    patientName: 'Lê Thu Trang (34t)',
    familyId: 'Hộ FAM-44012 (Quận 10)',
    assignedDoctor: 'BS.CKI Lê Thị Kim Oanh',
    slotTime: '15:00 - 15:45 Hôm nay',
    addressOrRoom: 'Phòng khám 302, Khu B - BV Đại học Y Dược',
    status: 'assigned',
  },
  {
    id: 'APT-9903',
    type: 'home_visit',
    patientName: 'Đỗ Mạnh Cường (62t)',
    familyId: 'Hộ FAM-33109 (Quận 3)',
    assignedDoctor: 'Chưa phân công (Cần điều phối khẩn)',
    slotTime: '16:00 - 17:00 Hôm nay',
    addressOrRoom: 'Số 45 Lê Quý Đôn, P. Võ Thị Sáu, Q.3',
    status: 'reassign_needed',
  },
  {
    id: 'APT-9904',
    type: 'telehealth',
    patientName: 'Hoàng Minh Anh (29t)',
    familyId: 'Hộ FAM-11983 (Bình Thạnh)',
    assignedDoctor: 'BS.CKII Trần Thanh Mai',
    slotTime: '16:30 - 17:00 Hôm nay',
    addressOrRoom: 'Phòng Telemedicine số 4 (WebRTC)',
    status: 'assigned',
  },
];


export function FacilityCoordinationView() {
  const [activeTab, setActiveTab] = useState<'coordination' | 'complaints'>('complaints');
  const [appointments, setAppointments] = useState<AppointmentCoordination[]>(INITIAL_APPOINTMENTS);
  const [filterType, setFilterType] = useState<'all' | 'home_visit' | 'facility' | 'telehealth'>('all');

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    if (type === 'warning') {
      toast.warning(message);
    } else if (type === 'info') {
      toast.info(message);
    } else {
      toast.success(message);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => (filterType === 'all' ? true : apt.type === filterType));
  }, [appointments, filterType]);


  const handleAssignDoctor = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === aptId
          ? {
              ...apt,
              assignedDoctor: 'ThS.BS Nguyễn Hữu Đạt (Khoa Nội tổng quát)',
              status: 'assigned' as const,
            }
          : apt
      )
    );
    showNotification(`Đã điều phối ThS.BS Nguyễn Hữu Đạt tiếp nhận lịch hẹn ${aptId}`, 'success');
  };


  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Floating Page Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Badge variant="outline" className="gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary border-primary/20">
                <span className="material-symbols-outlined text-[15px]">domain</span>
                Cơ sở y tế
              </Badge>
              <span>/</span>
              <span className="text-slate-700">Điều Phối Vận Hành &amp; CSKH</span>
            </div>

          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Điều Phối Lịch Khám &amp; Trung Tâm Khiếu Nại SLA
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Giám sát luồng phục vụ đa kênh (Tại nhà, Tại viện, Telehealth) và cam kết giải quyết triệt để mọi phản ánh từ các hộ gia đình thành viên trong tối đa 2 giờ.
              </p>
            </div>

            {/* Segment Tab Switcher */}
            <div className="inline-flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-inner self-start lg:self-center shrink-0">
              <button
                onClick={() => setActiveTab('coordination')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'coordination'
                    ? 'bg-white text-primary shadow-xs ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span>Điều Phối Lịch Khám</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-slate-100 text-slate-700">
                  {appointments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('complaints')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'complaints'
                    ? 'bg-white text-primary shadow-xs ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                <span>Khiếu nại</span>
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* TAB 1: COORDINATION                                                       */}
        {/* ========================================================================= */}
        {activeTab === 'coordination' && (
          <div className="space-y-6">
            {/* Filter Pills Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Hình thức:</span>
                {(
                  [
                    { key: 'all', label: 'Tất cả ca khám', icon: 'apps' },
                    { key: 'home_visit', label: 'Khám tại nhà', icon: 'home_health' },
                    { key: 'facility', label: 'Khám tại viện', icon: 'local_hospital' },
                    { key: 'telehealth', label: 'Telehealth', icon: 'videocam' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterType(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      filterType === tab.key
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-200 shrink-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Cần điều phối khẩn: 1 ca chưa phân công bác sĩ</span>
              </div>
            </div>

            {/* Appointment Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAppointments.map((apt) => {
                const isUrgent = apt.status === 'reassign_needed';
                return (
                  <div
                    key={apt.id}
                    className={`bg-white rounded-2xl border p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                      isUrgent
                        ? 'border-rose-300 ring-2 ring-rose-100/70 bg-gradient-to-b from-rose-50/15 to-white'
                        : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="tabular-nums text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            {apt.id}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              apt.type === 'home_visit'
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : apt.type === 'facility'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                                : 'bg-purple-50 text-purple-800 border border-purple-200/70'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {apt.type === 'home_visit' ? 'home_health' : apt.type === 'facility' ? 'local_hospital' : 'videocam'}
                            </span>
                            {apt.type === 'home_visit'
                              ? 'Khám tại nhà'
                              : apt.type === 'facility'
                              ? 'Tại viện'
                              : 'Telehealth'}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg tabular-nums">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                          {apt.slotTime}
                        </span>
                      </div>

                      {/* Patient & Family Info */}
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">{apt.patientName}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{apt.familyId}</p>

                      {/* Location & Assigned Doctor Box */}
                      <div className="mt-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-start gap-2.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400 mt-0.5 shrink-0">pin_drop</span>
                          <span className="leading-snug">{apt.addressOrRoom}</span>
                        </div>
                        <div className="flex items-center gap-2.5 pt-1 border-t border-slate-200/60">
                          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">stethoscope</span>
                          <span
                            className={`font-semibold ${
                              isUrgent ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {apt.assignedDoctor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-slate-500">
                        {isUrgent ? '⚠️ Đang thiếu bác sĩ trực' : '✓ Đã chuẩn bị vật tư y tế'}
                      </span>
                      {isUrgent ? (
                        <button
                          onClick={() => handleAssignDoctor(apt.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_add</span>
                          Chỉ định Bác sĩ ngay
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            showNotification(
                              `Lộ trình khám ${apt.id}: Xuất phát từ Cơ sở BV Đại học Y Dược -> ${apt.addressOrRoom}`,
                              'info'
                            )
                          }
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/90 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px] text-slate-500">alt_route</span>
                          Xem lộ trình
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: COMPLAINTS & SLA CENTER (AIRY & CLINICAL PRESTIGE)                 */}
        {/* ========================================================================= */}
        {activeTab === 'complaints' && <AdminDisputesView facility />}
      </main>
    </div>
  );
}
