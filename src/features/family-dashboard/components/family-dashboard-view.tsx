'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FamilyNav } from '@/components/layout';

export function FamilyDashboardView() {
  const [selectedMember, setSelectedMember] = useState('mem-01');

  const members = [
    { id: 'mem-01', name: 'Nguyễn Văn Phúc', role: 'Ông nội (78 tuổi)', badge: 'Mạn tính', status: 'warning', bp: '135/85', avatar: '👨‍🦳' },
    { id: 'mem-02', name: 'Trần Thị Mai', role: 'Mẹ (42 tuổi)', badge: 'Khỏe mạnh', status: 'normal', bp: '115/75', avatar: '👩' },
    { id: 'mem-03', name: 'Nguyễn Minh Quân', role: 'Con trai (12 tuổi)', badge: 'Theo dõi dinh dưỡng', status: 'normal', bp: '105/65', avatar: '👦' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation Tabs */}
      <FamilyNav />

      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Welcome Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Bảng Điều Khiển Sức Khỏe Gia Đình</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b]">
                Hộ ID: FAM-88219
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Gói dịch vụ kích hoạt: <span className="font-semibold text-[#2563eb]">Gia Đình Toàn Diện</span> • Bác sĩ quản nhiệm: <span className="font-semibold text-[#0f172a]">PGS.TS Nguyễn Trọng Nghĩa (BV ĐH Y Dược)</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/family/appointments"
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Đặt lịch khám mới</span>
            </Link>
            <a
              href="tel:19006868"
              className="px-3.5 py-2 bg-[#d92d20] hover:bg-[#b42318] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">e911_emergency</span>
              <span>Cấp cứu 1900 6868</span>
            </a>
          </div>
        </div>

        {/* Quick Portal Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <Link
            href="/family/members"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">folder_shared</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Hồ Sơ &amp; EHR</h3>
              <p className="text-[11px] text-slate-400">3 thành viên • 8 bệnh án</p>
            </div>
          </Link>

          <Link
            href="/family/appointments"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">event_available</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Lịch Khám Tại Nhà</h3>
              <p className="text-[11px] text-slate-400">1 lịch sắp tới (Thứ Hai)</p>
            </div>
          </Link>

          <Link
            href="/family/vitals"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Chỉ Số Sinh Tồn</h3>
              <p className="text-[11px] text-slate-400">Đồng bộ IoT Omron</p>
            </div>
          </Link>

          <Link
            href="/family/subscription"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Hợp Đồng 4 Bên</h3>
              <p className="text-[11px] text-slate-400">Hiệu lực đến 12/2026</p>
            </div>
          </Link>

          <Link
            href="/family/billing"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            </div>
            <div className="mt-3">
              <h3 className="text-xs font-bold text-[#0f172a] group-hover:text-[#2563eb]">Thanh Toán VietQR</h3>
              <p className="text-[11px] text-slate-400">Đã quyết toán kỳ 1</p>
            </div>
          </Link>
        </div>

        {/* Family Member Dossier Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2563eb] text-[18px]">group</span>
              Hồ Sơ Thành Viên Trong Hộ Gia Đình
            </h2>
            <Link href="/family/members" className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center gap-1">
              <span>Xem chi tiết hồ sơ bệnh án (EHR)</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMember(m.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMember === m.id
                    ? 'border-[#2563eb] bg-blue-50/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.avatar}</span>
                    <span className="font-bold text-sm text-[#0f172a]">{m.name}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      m.status === 'warning'
                        ? 'bg-[#fff7e6] text-[#ae5c04] border border-[#ffd591]'
                        : 'bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]'
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
                <p className="text-xs text-[#475569] mt-1">{m.role}</p>
                <div className="mt-3 text-xs text-slate-500 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-red-500">favorite</span>
                  Huyết áp gần nhất: <span className="font-bold text-[#2563eb]">{m.bp} mmHg</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Vitals Telemetry Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#2563eb] text-[18px]">ecg</span>
              Chỉ Số Sinh Tồn Trực Quan (IoT Telemetry)
            </h2>
            <Link href="/family/vitals" className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center gap-1">
              <span>Xem biểu đồ xu hướng 30 ngày</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* BP */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs text-[#475569]">
                <span>Huyết áp tâm thu/trương</span>
                <span className="material-symbols-outlined text-[#2563eb] text-[18px]">ecg_heart</span>
              </div>
              <div className="text-2xl font-bold text-[#0f172a]">120/80 <span className="text-xs font-normal text-slate-400">mmHg</span></div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
                Ổn định mục tiêu
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs text-[#475569]">
                <span>Nồng độ oxy SpO2</span>
                <span className="material-symbols-outlined text-[#2563eb] text-[18px]">spo2</span>
              </div>
              <div className="text-2xl font-bold text-[#0f172a]">98 <span className="text-xs font-normal text-slate-400">%</span></div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
                Bình thường
              </div>
            </div>

            {/* Heart Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs text-[#475569]">
                <span>Nhịp tim nghỉ ngơi</span>
                <span className="material-symbols-outlined text-[#ae5c04] text-[18px]">monitor_heart</span>
              </div>
              <div className="text-2xl font-bold text-[#0f172a]">76 <span className="text-xs font-normal text-slate-400">nhịp/phút</span></div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
                Đều đặn
              </div>
            </div>

            {/* Glucose */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs text-[#475569]">
                <span>Đường huyết mao mạch</span>
                <span className="material-symbols-outlined text-[#2563eb] text-[18px]">water_drop</span>
              </div>
              <div className="text-2xl font-bold text-[#0f172a]">5.6 <span className="text-xs font-normal text-slate-400">mmol/L</span></div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
                Trước ăn sáng
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Visits & EHR Timeline Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Next Visit Card */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb]">calendar_month</span>
                Lịch thăm khám Tại nhà Tiếp theo
              </h3>
              <span className="text-xs font-bold text-[#2563eb] bg-blue-50 px-2.5 py-1 rounded-lg">
                Còn 3 ngày
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-[#2563eb] text-white flex items-center justify-center font-bold text-base">
                BS
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0f172a]">Khám Bệnh mạn tính Định kỳ Tháng 10</h4>
                <p className="text-xs text-[#475569]">Bác sĩ: PGS.TS Nguyễn Trọng Nghĩa</p>
                <p className="text-xs text-slate-400 mt-0.5">Thời gian: Thứ Hai, 27/10/2026 • 09:00 - 10:30</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/family/appointments"
                className="flex-1 py-2 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold text-center transition-colors shadow-xs"
              >
                Quản lý lịch hẹn
              </Link>
              <Link
                href="/family/appointments"
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors"
              >
                Đổi giờ khám
              </Link>
            </div>
          </div>

          {/* Quick Prescription Cabinet */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb]">medication</span>
                Tủ thuốc Gia đình &amp; Đơn thuốc Quốc gia
              </h3>
              <Link href="/family/members" className="text-xs font-semibold text-[#2563eb] hover:underline">
                Chi tiết đơn thuốc
              </Link>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#0f172a]">Amlodipine 5mg (Huyết áp)</p>
                  <p className="text-[11px] text-[#475569]">Uống 1 viên vào 08:00 mỗi sáng • Còn đủ 14 ngày</p>
                </div>
                <span className="text-xs font-bold text-[#03864b] bg-[#f6ffed] border border-[#b7eb8f] px-2 py-0.5 rounded">Đã uống hôm nay</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#0f172a]">Metformin 500mg (Tiểu đường)</p>
                  <p className="text-[11px] text-[#475569]">Uống 1 viên sau ăn tối • Còn đủ 10 ngày</p>
                </div>
                <span className="text-xs font-bold text-[#ae5c04] bg-[#fff7e6] border border-[#ffd591] px-2 py-0.5 rounded">Chờ uống tối</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
