'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function FamilyDashboardView() {
  const [selectedMember, setSelectedMember] = useState('mem-01');

  const members = [
    { id: 'mem-01', name: 'Nguyễn Văn Phúc', role: 'Ông nội (78 tuổi)', badge: 'Mạn tính', status: 'warning', bp: '135/85' },
    { id: 'mem-02', name: 'Trần Thị Mai', role: 'Mẹ (42 tuổi)', badge: 'Khỏe mạnh', status: 'normal', bp: '115/75' },
    { id: 'mem-03', name: 'Nguyễn Minh Quân', role: 'Con trai (12 tuổi)', badge: 'Theo dõi dinh dưỡng', status: 'normal', bp: '105/65' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-on-surface">Bảng điều khiển Sức khỏe Gia đình</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] border border-[#b7eb8f] text-[#03864b]">
              Hộ ID: FAM-88219
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Gói dịch vụ kích hoạt: <span className="font-semibold text-primary">Gia Đình Toàn Diện</span> • Bác sĩ quản nhiệm: <span className="font-semibold text-on-surface">PGS.TS Nguyễn Trọng Nghĩa</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/packages"
            className="px-4 py-2 border border-primary text-primary hover:bg-surface-container rounded-lg text-xs font-semibold transition-colors"
          >
            Quản lý gói khám
          </Link>
          <button className="px-4 py-2 bg-[#d92d20] hover:bg-[#b42318] text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors">
            <span className="material-symbols-outlined text-[16px]">e911_emergency</span>
            <span>Gọi Bác sĩ Khẩn cấp</span>
          </button>
        </div>
      </div>

      {/* Family Member Dossier Switcher */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface">Thành viên trong Hộ gia đình</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMember(m.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedMember === m.id
                  ? 'border-primary-container bg-surface-container shadow-md ring-2 ring-primary-container/20'
                  : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-on-surface">{m.name}</span>
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
              <p className="text-xs text-on-surface-variant mt-1">{m.role}</p>
              <div className="mt-3 text-xs text-outline font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                Huyết áp gần nhất: <span className="font-bold text-primary">{m.bp}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Vitals Telemetry Grid (C-03: #03864b on #f6ffed) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-on-surface">Chỉ số Sinh tồn Trực quan (IoT Telemetry)</h2>
          <span className="text-[11px] text-outline flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#03864b] animate-pulse"></span>
            Đồng bộ từ máy đo Omron 15 phút trước
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* BP */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-outline">
              <span>Huyết áp tâm thu/trương</span>
              <span className="material-symbols-outlined text-primary text-[18px]">ecg_heart</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">120/80 <span className="text-xs font-normal text-outline">mmHg</span></div>
            <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
              Ổn định mục tiêu
            </div>
          </div>

          {/* SpO2 */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-outline">
              <span>Nồng độ oxy SpO2</span>
              <span className="material-symbols-outlined text-primary text-[18px]">spo2</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">98 <span className="text-xs font-normal text-outline">%</span></div>
            <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
              Bình thường
            </div>
          </div>

          {/* Heart Rate */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-outline">
              <span>Nhịp tim nghỉ ngơi</span>
              <span className="material-symbols-outlined text-[#ae5c04] text-[18px]">monitor_heart</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">76 <span className="text-xs font-normal text-outline">nhịp/phút</span></div>
            <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
              Đều đặn
            </div>
          </div>

          {/* Glucose */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs text-outline">
              <span>Đường huyết mao mạch</span>
              <span className="material-symbols-outlined text-primary text-[18px]">water_drop</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">5.6 <span className="text-xs font-normal text-outline">mmol/L</span></div>
            <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f6ffed] text-[#03864b]">
              Trước ăn sáng
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Visits & EHR Timeline Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Visit Card */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              Lịch thăm khám Tại nhà Tiếp theo
            </h3>
            <span className="text-xs font-bold text-primary bg-surface-container px-2.5 py-1 rounded-lg">
              Còn 3 ngày
            </span>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low">
            <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center font-bold">
              BS
            </div>
            <div>
              <h4 className="font-bold text-sm text-on-surface">Khám Bệnh mạn tính Định kỳ Tháng 10</h4>
              <p className="text-xs text-on-surface-variant">Bác sĩ: PGS.TS Nguyễn Trọng Nghĩa</p>
              <p className="text-xs text-outline mt-0.5">Thời gian: Thứ Hai, 27/10/2026 • 09:00 - 10:30</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 py-2 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors">
              Xác nhận lịch hẹn
            </button>
            <button className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors">
              Đổi giờ khám
            </button>
          </div>
        </div>

        {/* Quick Prescription Cabinet */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3">
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">medication</span>
              Tủ thuốc Gia đình &amp; Đơn thuốc Quốc gia
            </h3>
            <Link href="/packages" className="text-xs font-semibold text-primary hover:underline">
              Chi tiết đơn thuốc
            </Link>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-surface-container-low flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-on-surface">Amlodipine 5mg (Huyết áp)</p>
                <p className="text-[11px] text-on-surface-variant">Uống 1 viên vào 08:00 mỗi sáng • Còn đủ 14 ngày</p>
              </div>
              <span className="text-xs font-bold text-[#03864b] bg-[#f6ffed] px-2 py-0.5 rounded">Đã uống hôm nay</span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-on-surface">Metformin 500mg (Tiểu đường)</p>
                <p className="text-[11px] text-on-surface-variant">Uống 1 viên sau ăn tối • Còn đủ 10 ngày</p>
              </div>
              <span className="text-xs font-bold text-[#ae5c04] bg-[#fff7e6] px-2 py-0.5 rounded">Chờ uống tối</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
