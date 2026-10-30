'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FamilyNav } from '@/components/layout';

export function FamilyDashboardView() {
  const [selectedMember, setSelectedMember] = useState('mem-01');

  const members = [
    { id: 'mem-01', name: 'Nguyễn Văn Phúc', role: 'Ông nội (78 tuổi)', badge: 'Bệnh mạn tính', status: 'warning', bp: '135/85', avatar: '👨‍🦳' },
    { id: 'mem-02', name: 'Trần Thị Mai', role: 'Mẹ (42 tuổi)', badge: 'Khỏe mạnh', status: 'normal', bp: '115/75', avatar: '👩' },
    { id: 'mem-03', name: 'Nguyễn Minh Quân', role: 'Con trai (12 tuổi)', badge: 'Theo dõi dinh dưỡng', status: 'normal', bp: '105/65', avatar: '👦' },
  ];

  const recentVisits = [
    {
      id: 'VIS-01',
      doctor: 'PGS.TS Nguyễn Trọng Nghĩa',
      specialty: 'Y học Gia đình & Tim mạch',
      date: 'Thứ Hai, 27/10/2026 - 09:30 AM',
      mode: 'Tại nhà',
      fee: '600.000 đ',
      status: 'Sắp diễn ra',
      statusBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'VIS-02',
      doctor: 'ThS.BS Lê Hoàng Yến',
      specialty: 'Tư vấn Dinh dưỡng Tiền sản',
      date: '15/10/2026 - 14:00 PM',
      mode: 'Telehealth HD',
      fee: '350.000 đ',
      status: 'Đã hoàn tất',
      statusBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'VIS-03',
      doctor: 'BS.CKII Trần Thanh Mai',
      specialty: 'Khám Nhi tổng quát',
      date: '28/09/2026 - 10:15 AM',
      mode: 'Tại nhà',
      fee: '500.000 đ',
      status: 'Đã hoàn tất',
      statusBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      {/* Sub-navigation Tabs */}
      <FamilyNav />

      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Welcome Bar phong cách Preclinic Patient */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Cổng Quản Lý Sức Khỏe Hộ Gia Đình
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2E37A4]/10 text-[#2E37A4] border border-[#2E37A4]/20 font-mono">
                Hộ ID: FAM-88219
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gói kích hoạt: <span className="font-bold text-[#2E37A4]">Gia Đình Toàn Diện VIP</span> • Bác sĩ quản nhiệm: <span className="font-semibold text-slate-800">PGS.TS Nguyễn Trọng Nghĩa (BV ĐH Y Dược)</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Link
              href="/family/appointments"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">calendar_month</span>
              <span>Đặt lịch khám mới</span>
            </Link>
            <a
              href="tel:19006868"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">emergency</span>
              <span>Cấp cứu 1900 6868</span>
            </a>
          </div>
        </div>

        {/* Quick Portal Shortcuts phong cách Preclinic */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <Link
            href="/family/members"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Hồ Sơ &amp; EHR
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">3 thành viên • 8 bệnh án</p>
            </div>
          </Link>

          <Link
            href="/family/appointments"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">event_available</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Lịch Khám Tại Nhà
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">1 lịch sắp tới (Thứ Hai)</p>
            </div>
          </Link>

          <Link
            href="/family/vitals"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Chỉ Số Sinh Tồn
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Đồng bộ IoT Omron</p>
            </div>
          </Link>

          <Link
            href="/family/subscription"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/40 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Hợp Đồng 4 Bên
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Hiệu lực đến 12/2026</p>
            </div>
          </Link>

          <Link
            href="/family/billing"
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2E37A4]/40 hover:shadow-md transition-all flex flex-col justify-between group col-span-2 sm:col-span-1"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                Thanh Toán VietQR
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Đã quyết toán kỳ 1</p>
            </div>
          </Link>
        </div>

        {/* Preclinic Patient Vitals Telemetry Tracker */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2E37A4] text-[20px]">vital_signs</span>
              <span>Chỉ Số Sinh Tồn Trực Tuyến (IoT Health Telemetry)</span>
            </h2>
            <Link href="/family/vitals" className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-1">
              <span>Xem biểu đồ xu hướng 30 ngày</span>
              <span className="material-symbols-outlined text-[15px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* BP */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-medium">Huyết áp tâm thu/trương</span>
                <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">ecg_heart</span>
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                120/80 <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
              <div className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ổn định mục tiêu
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-medium">Nồng độ oxy SpO2</span>
                <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">spo2</span>
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                98 <span className="text-xs font-normal text-slate-400">%</span>
              </div>
              <div className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Chỉ số lý tưởng
              </div>
            </div>

            {/* Heart Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-medium">Nhịp tim nghỉ ngơi</span>
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                76 <span className="text-xs font-normal text-slate-400">nhịp/phút</span>
              </div>
              <div className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Nhịp xoang đều
              </div>
            </div>

            {/* Glucose */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="font-medium">Đường huyết mao mạch</span>
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">water_drop</span>
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                5.6 <span className="text-xs font-normal text-slate-400">mmol/L</span>
              </div>
              <div className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Trước ăn sáng
              </div>
            </div>
          </div>
        </div>

        {/* Family Member Dossier Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2E37A4] text-[20px]">group</span>
              <span>Hồ Sơ Thành Viên Trong Hộ Gia Đình</span>
            </h2>
            <Link href="/family/members" className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-1">
              <span>Xem chi tiết bệnh án (EHR)</span>
              <span className="material-symbols-outlined text-[15px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMember(m.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedMember === m.id
                    ? 'border-[#2E37A4] bg-white shadow-md ring-2 ring-[#2E37A4]/20'
                    : 'border-slate-200/80 bg-white hover:border-[#2E37A4]/30 shadow-2xs'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{m.avatar}</span>
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{m.name}</span>
                      <span className="text-xs text-slate-500">{m.role}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      m.status === 'warning'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-rose-500">favorite</span>
                    Huyết áp gần nhất:
                  </span>
                  <span className="font-bold text-[#2E37A4] font-mono">{m.bp} mmHg</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Appointments Table & Assigned Doctor Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Appointments History Table Preclinic Style */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2E37A4]">event_note</span>
                  Lịch Khám Sắp Tới &amp; Gần Đây
                </h3>
                <p className="text-xs text-slate-400">Danh sách các cuộc hẹn tại nhà và Telehealth đã đăng ký</p>
              </div>
              <Link
                href="/family/appointments"
                className="text-xs font-bold text-[#2E37A4] hover:underline"
              >
                Quản lý tất cả &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3">Bác sĩ phụ trách</th>
                    <th className="py-3 px-3">Thời gian</th>
                    <th className="py-3 px-3">Hình thức</th>
                    <th className="py-3 px-3">Phí dịch vụ</th>
                    <th className="py-3 px-3 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{visit.doctor}</div>
                        <div className="text-[11px] text-slate-500">{visit.specialty}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {visit.date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {visit.mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#2E37A4] whitespace-nowrap">
                        {visit.fee}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${visit.statusBg}`}>
                          {visit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Quick Prescription Cabinet & Physician */}
          <div className="lg:col-span-4 space-y-6">
            {/* Assigned Physician Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Bác Sĩ Gia Đình Riêng</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  On-Duty
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  TN
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">PGS.TS Nguyễn Trọng Nghĩa</h4>
                  <p className="text-[11px] text-slate-500">BV Đại học Y Dược TP.HCM</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Thời gian phản hồi TB: 8 phút</p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Link
                  href="/doctor/telemedicine"
                  className="flex-1 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold text-center transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  <span>Gọi Telehealth</span>
                </Link>
                <Link
                  href="/family/appointments"
                  className="px-3.5 py-2 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Hẹn khám
                </Link>
              </div>
            </div>

            {/* Quick Prescription Cabinet */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#2E37A4] text-[18px]">medication</span>
                  Tủ Thuốc Gia Đình
                </h3>
                <Link href="/family/members" className="text-xs font-bold text-[#2E37A4] hover:underline">
                  Chi tiết
                </Link>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Amlodipine 5mg (Huyết áp)</p>
                    <p className="text-[11px] text-slate-500">08:00 mỗi sáng • Còn đủ 14 ngày</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    Đã uống
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Metformin 500mg (Tiểu đường)</p>
                    <p className="text-[11px] text-slate-500">Sau ăn tối • Còn đủ 10 ngày</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                    Chờ tối
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
