'use client';

import React, { useState } from 'react';
import { FacilityNav } from '@/components/layout';

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
    assignedDoctor: 'Chưa phân công (Cần điều phối)',
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
    phone: '0918 *** 332',
    category: 'late_arrival',
    title: 'Bác sĩ đến trễ 25 phút trong lịch khám tại nhà sáng nay do ngập nước',
    severity: 'medium',
    createdAt: '11:15 Hôm nay',
    status: 'investigating',
    slaHoursLeft: 1.2,
  },
  {
    id: 'TK-1081',
    familyHead: 'Trần Thị Thu Thảo',
    phone: '0903 *** 819',
    category: 'prescription',
    title: 'Đơn thuốc điện tử mã 1NF chưa đồng bộ mã tra cứu thanh toán BHYT',
    severity: 'high',
    createdAt: '09:00 Hôm nay',
    status: 'open',
    slaHoursLeft: 0.5,
  },
  {
    id: 'TK-1078',
    familyHead: 'Võ Minh Quân',
    phone: '0982 *** 554',
    category: 'ehr_sync',
    title: 'Hình ảnh xét nghiệm máu HbA1c tải lên bị mờ cần cập nhật bản PDF gốc',
    severity: 'low',
    createdAt: 'Hôm qua',
    status: 'resolved',
    slaHoursLeft: 0,
  },
];

export function FacilityCoordinationView() {
  const [activeTab, setActiveTab] = useState<'coordination' | 'complaints'>('coordination');
  const [appointments, setAppointments] = useState<AppointmentCoordination[]>(INITIAL_APPOINTMENTS);
  const [complaints, setComplaints] = useState<ComplaintTicket[]>(INITIAL_COMPLAINTS);
  const [filterType, setFilterType] = useState<'all' | 'home_visit' | 'facility' | 'telehealth'>('all');
  const [notification, setNotification] = useState('');

  const filteredAppointments = appointments.filter((apt) =>
    filterType === 'all' ? true : apt.type === filterType
  );

  const handleAssignDoctor = (aptId: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === aptId
          ? {
              ...apt,
              assignedDoctor: 'ThS.BS Nguyễn Hữu Đạt',
              status: 'assigned' as const,
            }
          : apt
      )
    );
    setNotification(`Đã điều phối ThS.BS Nguyễn Hữu Đạt tiếp nhận lịch hẹn ${aptId}`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleResolveComplaint = (ticketId: string) => {
    setComplaints((prev) =>
      prev.map((tk) =>
        tk.id === ticketId ? { ...tk, status: 'resolved' as const, slaHoursLeft: 0 } : tk
      )
    );
    setNotification(`Đã ghi nhận biên bản xử lý và hoàn tất ticket khiếu nại ${ticketId}`);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <FacilityNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Điều phối Lịch khám &amp; Xử lý Khiếu nại SLA
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cân đối luồng ca khám tại nhà, khám tại viện và kiểm soát thời gian giải quyết sự cố dưới 2 giờ
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('coordination')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'coordination'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Điều phối Lịch hẹn ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'complaints'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ticket Khiếu nại ({complaints.filter((c) => c.status !== 'resolved').length} đang mở)
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-blue-600">info</span>
            <span>{notification}</span>
          </div>
        )}

        {/* TAB 1: COORDINATION */}
        {activeTab === 'coordination' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                {(['all', 'home_visit', 'facility', 'telehealth'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      filterType === type
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type === 'all' && 'Tất cả hình thức'}
                    {type === 'home_visit' && 'Khám tại nhà (Home Visit)'}
                    {type === 'facility' && 'Khám tại cơ sở'}
                    {type === 'telehealth' && 'Tư vấn Telehealth'}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Cần điều phối khẩn: <span className="font-bold text-rose-600">1 ca chưa có bác sĩ</span>
              </div>
            </div>

            {/* Appointment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`bg-white p-5 rounded-2xl border shadow-xs transition-all ${
                    apt.status === 'reassign_needed'
                      ? 'border-rose-300 ring-2 ring-rose-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{apt.id}</span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          apt.type === 'home_visit'
                            ? 'bg-blue-100 text-blue-800'
                            : apt.type === 'facility'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {apt.type === 'home_visit'
                          ? 'Khám tại nhà'
                          : apt.type === 'facility'
                          ? 'Tại cơ sở'
                          : 'Telehealth'}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-slate-500">{apt.slotTime}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{apt.patientName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{apt.familyId}</p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">pin_drop</span>
                      <span className="truncate">{apt.addressOrRoom}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">stethoscope</span>
                      <span className={apt.status === 'reassign_needed' ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                        {apt.assignedDoctor}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      {apt.status === 'reassign_needed' ? 'Đang thiếu bác sĩ trực' : 'Đã chuẩn bị vật tư y tế'}
                    </span>
                    {apt.status === 'reassign_needed' ? (
                      <button
                        onClick={() => handleAssignDoctor(apt.id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Chỉ định Bác sĩ ngay
                      </button>
                    ) : (
                      <button
                        onClick={() => alert(`Chi tiết ca khám ${apt.id}`)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Xem lộ trình
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: COMPLAINTS */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Trung tâm Giải quyết Khiếu nại Hộ gia đình</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Thời hạn cam kết xử lý sự cố (SLA) tối đa 2 giờ từ lúc nhận báo cáo</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-slate-700">Đường dây nóng CSKH 24/7 trực tuyến</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {complaints.map((ticket) => (
                  <div key={ticket.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">{ticket.id}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            ticket.severity === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : ticket.severity === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ticket.severity === 'high' ? 'Khẩn (P1)' : ticket.severity === 'medium' ? 'Vừa (P2)' : 'Tiêu chuẩn'}
                        </span>
                        <span className="font-bold text-sm text-slate-900">{ticket.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{ticket.createdAt}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-slate-500">
                        <span className="font-medium text-slate-700">Người báo: {ticket.familyHead} ({ticket.phone})</span>
                        {ticket.status !== 'resolved' && (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px]">timer</span>
                            SLA còn: {ticket.slaHoursLeft}h
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {ticket.status === 'resolved' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã xử lý &amp; Lưu biên bản
                          </span>
                        ) : (
                          <button
                            onClick={() => handleResolveComplaint(ticket.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                          >
                            Xử lý &amp; Phản hồi gia đình
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

