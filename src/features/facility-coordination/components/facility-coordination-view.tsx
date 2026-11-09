'use client';

import React, { useState, useMemo } from 'react';

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

interface ComplaintTicket {
  id: string;
  familyHead: string;
  phone: string;
  category: 'late_arrival' | 'ehr_sync' | 'attitude' | 'prescription';
  title: string;
  severity: 'high' | 'medium' | 'low';
  createdAt: string;
  status: 'open' | 'investigating' | 'resolved';
  slaHoursLeft: number;
  relatedDoctor?: string;
  description?: string;
  resolutionNote?: string;
  resolvedAt?: string;
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

const INITIAL_COMPLAINTS: ComplaintTicket[] = [
  {
    id: 'TK-1082',
    familyHead: 'Nguyễn Văn Hùng',
    phone: '0918 345 332',
    category: 'late_arrival',
    title: 'Bác sĩ đến trễ 25 phút trong lịch khám tại nhà sáng nay do ngập nước',
    severity: 'medium',
    createdAt: '11:15 Hôm nay (45 phút trước)',
    status: 'investigating',
    slaHoursLeft: 1.2,
    relatedDoctor: 'BS. Hoàng Gia Bảo (Lịch khám APT-9901)',
    description:
      'Gia đình phản ánh bác sĩ đến trễ 25 phút so với khung giờ hẹn 10:30. Bác sĩ báo do mưa lớn ngập đường Nguyễn Tri Phương. Gia đình yêu cầu CSKH kiểm tra và có hình thức thông báo chủ động hơn để người cao tuổi không phải chờ lâu.',
    resolutionNote: '',
  },
  {
    id: 'TK-1081',
    familyHead: 'Trần Thị Thu Thảo',
    phone: '0903 881 819',
    category: 'prescription',
    title: 'Đơn thuốc điện tử mã 1NF chưa đồng bộ mã tra cứu thanh toán BHYT',
    severity: 'high',
    createdAt: '09:00 Hôm nay (3 giờ trước)',
    status: 'open',
    slaHoursLeft: 0.5,
    relatedDoctor: 'BS.CKI Lê Thị Kim Oanh (Phòng khám 302)',
    description:
      'Hệ thống quầy thuốc ngoại trú chưa tra cứu được mã đơn thuốc 1NF liên thông BHXH. Bệnh nhân đang chờ lấy thuốc tại tầng 1, cần bộ phận IT y tế và điều phối dược kích hoạt ngay.',
    resolutionNote: '',
  },
  {
    id: 'TK-1078',
    familyHead: 'Võ Minh Quân',
    phone: '0982 712 554',
    category: 'ehr_sync',
    title: 'Hình ảnh xét nghiệm máu HbA1c tải lên bị mờ cần cập nhật bản PDF gốc',
    severity: 'low',
    createdAt: '16:30 Hôm qua',
    status: 'resolved',
    slaHoursLeft: 0,
    relatedDoctor: 'Phòng Xét nghiệm Huyết học & Sinh hóa',
    description:
      'Bản chụp kết quả xét nghiệm định kỳ của mẹ trên ứng dụng bị nhòe dòng định lượng HbA1c. Gia đình đề nghị gửi bản PDF có chữ ký số điện tử của bác sĩ trưởng khoa.',
    resolutionNote:
      'Đã xuất file PDF kết quả ký số chuẩn HL7/FHIR từ máy Cobas 6000 và đồng bộ trực tiếp vào hồ sơ điện tử gia đình lúc 17:05 Hôm qua. Gia đình đã xác nhận hiển thị sắc nét.',
    resolvedAt: '17:05 Hôm qua',
  },
];

export function FacilityCoordinationView() {
  const [activeTab, setActiveTab] = useState<'coordination' | 'complaints'>('complaints');
  const [appointments, setAppointments] = useState<AppointmentCoordination[]>(INITIAL_APPOINTMENTS);
  const [complaints, setComplaints] = useState<ComplaintTicket[]>(INITIAL_COMPLAINTS);
  const [filterType, setFilterType] = useState<'all' | 'home_visit' | 'facility' | 'telehealth'>('all');
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'pending' | 'high' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // Resolution Modal State
  const [resolvingTicket, setResolvingTicket] = useState<ComplaintTicket | null>(null);
  const [resolutionAction, setResolutionAction] = useState<string>('apologize_voucher');
  const [customNote, setCustomNote] = useState<string>('');

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => (filterType === 'all' ? true : apt.type === filterType));
  }, [appointments, filterType]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((ticket) => {
      // Status filter
      if (complaintFilter === 'pending' && ticket.status === 'resolved') return false;
      if (complaintFilter === 'high' && ticket.severity !== 'high') return false;
      if (complaintFilter === 'resolved' && ticket.status !== 'resolved') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = ticket.id.toLowerCase().includes(q);
        const matchesTitle = ticket.title.toLowerCase().includes(q);
        const matchesHead = ticket.familyHead.toLowerCase().includes(q);
        const matchesPhone = ticket.phone.includes(q);
        return matchesId || matchesTitle || matchesHead || matchesPhone;
      }
      return true;
    });
  }, [complaints, complaintFilter, searchQuery]);

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

  const handleOpenResolveModal = (ticket: ComplaintTicket) => {
    setResolvingTicket(ticket);
    setResolutionAction('apologize_voucher');
    setCustomNote('');
  };

  const handleConfirmResolution = () => {
    if (!resolvingTicket) return;

    let note = customNote.trim();
    if (!note) {
      if (resolutionAction === 'apologize_voucher') {
        note = 'Đã gọi điện giải thích nguyên nhân, gửi lời xin lỗi và tặng voucher miễn phí vận chuyển cho ca khám kế tiếp. Gia đình hài lòng.';
      } else if (resolutionAction === 'fix_prescription') {
        note = 'Đã phối hợp IT Y tế liên thông mã đơn thuốc 1NF với cổng BHXH thành công, bệnh nhân đã lấy thuốc tại quầy.';
      } else {
        note = 'Đã hoàn tất xử lý sự cố theo quy trình chuẩn SLA của cơ sở y tế.';
      }
    }

    setComplaints((prev) =>
      prev.map((tk) =>
        tk.id === resolvingTicket.id
          ? {
              ...tk,
              status: 'resolved' as const,
              slaHoursLeft: 0,
              resolutionNote: note,
              resolvedAt: 'Vừa xong',
            }
          : tk
      )
    );

    showNotification(`Đã lập biên bản xử lý và hoàn tất cam kết SLA cho ticket ${resolvingTicket.id}`, 'success');
    setResolvingTicket(null);
  };

  const openTicketsCount = complaints.filter((c) => c.status !== 'resolved').length;
  const highSeverityCount = complaints.filter((c) => c.severity === 'high' && c.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Floating Page Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-[#2E37A4] border border-indigo-100">
                <span className="material-symbols-outlined text-[15px]">domain</span>
                Bệnh viện Đại học Y Dược TP.HCM
              </span>
              <span>/</span>
              <span className="text-slate-700">Điều Phối Vận Hành &amp; CSKH</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đường dây nóng CSKH 24/7 trực tuyến
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-[#2E37A4] border border-indigo-200 shadow-2xs">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Cam kết SLA &lt; 2 Giờ
              </span>
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
                    ? 'bg-white text-[#2E37A4] shadow-xs ring-1 ring-slate-200/50'
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
                    ? 'bg-white text-[#2E37A4] shadow-xs ring-1 ring-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                <span>Trung Tâm Khiếu Nại SLA</span>
                {openTicketsCount > 0 ? (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                    {openTicketsCount} đang mở
                  </span>
                ) : (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums bg-emerald-50 text-emerald-700">
                    0
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Global Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : notification.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-indigo-50 border-indigo-200 text-[#2E37A4]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">
                {notification.type === 'success' ? 'check_circle' : notification.type === 'warning' ? 'warning' : 'info'}
              </span>
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

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
                        ? 'bg-[#2E37A4] text-white shadow-xs'
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
                                ? 'bg-indigo-50 text-[#2E37A4] border border-indigo-200/70'
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
                          <span className="material-symbols-outlined text-[16px] text-[#2E37A4] shrink-0">stethoscope</span>
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
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            {/* 4 SLA KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuân thủ SLA &lt; 2h</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">98.4%</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Đạt chuẩn BYT
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">24/25 sự cố xử lý đúng hạn tháng này</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sự cố đang mở</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">report_problem</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{openTicketsCount}</span>
                  {highSeverityCount > 0 && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                      {highSeverityCount} Khẩn cấp (P1)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Cần xử lý dứt điểm trước 13:30 hôm nay</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian xử lý TB</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">speed</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">38 phút</span>
                  <span className="text-[11px] font-semibold text-[#2E37A4] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    -82p so với SLA
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Quy chuẩn cho phép: tối đa 120 phút</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đường dây nóng CSKH</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">headset_mic</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">1900 6868</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Nhánh 1: Tiếp nhận khiếu nại y tế 24/7</p>
              </div>
            </div>

            {/* Main Center Box */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Header Box */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/30">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] flex items-center justify-center text-white shadow-md ring-4 ring-[#2E37A4]/10 shrink-0">
                    <span className="material-symbols-outlined text-[24px]">support_agent</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Trung Tâm Giải Quyết Khiếu Nại &amp; Sự Cố Hộ Gia Đình
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Cam kết SLA xử lý sự cố trong vòng 2 giờ • Bảo vệ quyền lợi y tế người bệnh và chất lượng chăm sóc
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <button
                    onClick={() =>
                      showNotification('Đang kết nối tổng đài CSKH 1900 6868 (Nhánh 1 - Bác sĩ điều phối)...', 'info')
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-amber-500">call</span>
                    <span>Tổng đài CSKH</span>
                  </button>
                  <button
                    onClick={() =>
                      showNotification('Đã xuất báo cáo SLA tuần định dạng PDF gửi Ban Giám đốc CSYT', 'success')
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#2E37A4] rounded-xl text-xs font-semibold border border-indigo-200/70 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">file_download</span>
                    <span>Xuất báo cáo SLA</span>
                  </button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {(
                    [
                      { key: 'all', label: `Tất cả (${complaints.length})` },
                      { key: 'pending', label: `Cần xử lý (${openTicketsCount})` },
                      { key: 'high', label: `Khẩn cấp P1 (${highSeverityCount})` },
                      {
                        key: 'resolved',
                        label: `Đã giải quyết (${complaints.filter((c) => c.status === 'resolved').length})`,
                      },
                    ] as const
                  ).map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setComplaintFilter(filter.key)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        complaintFilter === filter.key
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm mã ticket, tên, SĐT..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tickets List */}
              <div className="p-6 space-y-4 bg-slate-50/40">
                {filteredComplaints.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/70 p-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-[24px]">inbox</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Không tìm thấy ticket khiếu nại phù hợp</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Thử đổi từ khóa tìm kiếm hoặc lọc theo trạng thái khác để xem danh sách.
                    </p>
                  </div>
                ) : (
                  filteredComplaints.map((ticket) => {
                    const isResolved = ticket.status === 'resolved';
                    const isHigh = ticket.severity === 'high';
                    const isMedium = ticket.severity === 'medium';

                    return (
                      <div
                        key={ticket.id}
                        className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all ${
                          isResolved
                            ? 'border-slate-200/80 opacity-90'
                            : isHigh
                            ? 'border-rose-300 ring-2 ring-rose-100/70 bg-gradient-to-b from-rose-50/15 via-white to-white'
                            : isMedium
                            ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/10 via-white to-white'
                            : 'border-slate-200/80'
                        }`}
                      >
                        {/* Top Bar: Ticket ID, Severity, Status, SLA Timer */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="tabular-nums text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                              {ticket.id}
                            </span>

                            {/* Category Badge */}
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              <span className="material-symbols-outlined text-[13px] text-slate-500">
                                {ticket.category === 'late_arrival'
                                  ? 'schedule'
                                  : ticket.category === 'prescription'
                                  ? 'prescriptions'
                                  : ticket.category === 'ehr_sync'
                                  ? 'sync'
                                  : 'sentiment_neutral'}
                              </span>
                              {ticket.category === 'late_arrival'
                                ? 'Đến trễ hẹn'
                                : ticket.category === 'prescription'
                                ? 'Đơn thuốc & BHYT'
                                : ticket.category === 'ehr_sync'
                                ? 'Đồng bộ Hồ sơ EHR'
                                : 'Thái độ phục vụ'}
                            </span>

                            {/* Severity Badge */}
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                isHigh
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isMedium
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isHigh && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                              {isHigh ? 'Khẩn cấp (P1)' : isMedium ? 'Vừa (P2)' : 'Tiêu chuẩn (P3)'}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                isResolved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : ticket.status === 'investigating'
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isResolved ? '✓ Đã hoàn tất' : ticket.status === 'investigating' ? 'Đang điều tra' : 'Chờ xử lý'}
                            </span>
                          </div>

                          {/* SLA Timer or Completion Badge */}
                          <div className="flex items-center gap-2">
                            {isResolved ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                <span className="material-symbols-outlined text-[15px]">verified</span>
                                Đạt chuẩn cam kết SLA (&lt; 2h)
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-bold tabular-nums px-3 py-1 rounded-full border ${
                                  ticket.slaHoursLeft <= 0.6
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[15px]">timer</span>
                                SLA còn lại: {ticket.slaHoursLeft} giờ
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Detailed Description */}
                        <div className="mt-3.5 space-y-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                            {ticket.title}
                          </h3>

                          {ticket.description && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                              {ticket.description}
                            </p>
                          )}
                        </div>

                        {/* Resolution Note If Resolved */}
                        {isResolved && ticket.resolutionNote && (
                          <div className="mt-3.5 p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs sm:text-sm text-emerald-900 flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                              task_alt
                            </span>
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-800">Biên bản giải quyết &amp; Lưu hồ sơ:</span>
                              <p className="text-emerald-700">{ticket.resolutionNote}</p>
                              {ticket.resolvedAt && (
                                <span className="text-[11px] text-emerald-600/80 font-medium block">
                                  Thời gian xử lý: {ticket.resolvedAt}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Metadata row: Family Head, Phone, Related Doctor, Time */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-4 text-slate-600">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                              <span>Hộ: <strong className="text-slate-800">{ticket.familyHead}</strong></span>
                            </div>

                            <div className="flex items-center gap-1.5 font-medium tabular-nums">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">call</span>
                              <span>{ticket.phone}</span>
                            </div>

                            {ticket.relatedDoctor && (
                              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">stethoscope</span>
                                <span>{ticket.relatedDoctor}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-slate-400">
                              <span className="material-symbols-outlined text-[15px]">schedule</span>
                              <span>{ticket.createdAt}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                showNotification(`Đang kết nối cuộc gọi CSKH trực tiếp tới số ${ticket.phone}...`, 'info')
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px] text-slate-500">phone_forwarded</span>
                              Gọi gia đình
                            </button>

                            {!isResolved && (
                              <button
                                onClick={() => handleOpenResolveModal(ticket)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#2E37A4] hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Xử lý &amp; Hoàn tất SLA
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RESOLUTION MODAL DIALOG                                                   */}
        {/* ========================================================================= */}
        {resolvingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Biên Bản Xử Lý Sự Cố {resolvingTicket.id}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gia đình: {resolvingTicket.familyHead} ({resolvingTicket.phone})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setResolvingTicket(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Ticket Title Recall */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
                {resolvingTicket.title}
              </div>

              {/* Action Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Phương án giải quyết SLA:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="action"
                      checked={resolutionAction === 'apologize_voucher'}
                      onChange={() => setResolutionAction('apologize_voucher')}
                      className="text-[#2E37A4] focus:ring-[#2E37A4]"
                    />
                    <span>Gọi điện xin lỗi, giải thích nguyên nhân và tặng mã miễn phí vận chuyển ca kế tiếp</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="action"
                      checked={resolutionAction === 'fix_prescription'}
                      onChange={() => setResolutionAction('fix_prescription')}
                      className="text-[#2E37A4] focus:ring-[#2E37A4]"
                    />
                    <span>Đã can thiệp kỹ thuật IT/BHYT, kích hoạt thành công đơn thuốc và giao thuốc cho bệnh nhân</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="action"
                      checked={resolutionAction === 'custom'}
                      onChange={() => setResolutionAction('custom')}
                      className="text-[#2E37A4] focus:ring-[#2E37A4]"
                    />
                    <span>Phương án khác (Nhập chi tiết biên bản phía dưới)</span>
                  </label>
                </div>
              </div>

              {/* Custom Note input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Ghi chú biên bản bổ sung (Lưu hồ sơ kiểm toán y tế):
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Nhập nội dung thỏa thuận với hộ gia đình, nhân sự chịu trách nhiệm..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E37A4]/20 focus:border-[#2E37A4] transition-all"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2E37A4] hover:bg-indigo-800 text-white shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Xác nhận &amp; Đóng Ticket SLA
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
