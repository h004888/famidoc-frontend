'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DoctorNav } from '@/components/layout';

interface TimeSlot {
  time: string;
  monday?: { title: string; patient: string; type: 'home' | 'telehealth' };
  tuesday?: { title: string; patient: string; type: 'home' | 'telehealth' };
  wednesday?: { title: string; patient: string; type: 'home' | 'telehealth' };
  thursday?: { title: string; patient: string; type: 'home' | 'telehealth' };
  friday?: { title: string; patient: string; type: 'home' | 'telehealth' };
  saturday?: { title: string; patient: string; type: 'home' | 'telehealth' };
}

const TIMETABLE_DATA: TimeSlot[] = [
  {
    time: '08:00 - 09:30',
    monday: { title: 'Tư vấn Video', patient: 'Nguyễn Văn Phúc (78t)', type: 'telehealth' },
    wednesday: { title: 'Tư vấn Video', patient: 'Lê Thu Trang (34t)', type: 'telehealth' },
    friday: { title: 'Tư vấn Video', patient: 'Phạm Đức Bình (61t)', type: 'telehealth' },
  },
  {
    time: '09:30 - 11:00',
    tuesday: { title: 'Tư vấn Video', patient: 'Trần Thị Mai (42t)', type: 'telehealth' },
    thursday: { title: 'Tư vấn Video', patient: 'Võ Minh Khang (5t)', type: 'telehealth' },
    saturday: { title: 'Tư vấn Video', patient: 'Nguyễn Thị Bích (69t)', type: 'telehealth' },
  },
  {
    time: '14:00 - 15:30',
    monday: { title: 'Khám Tại Nhà (Q.1)', patient: 'Nguyễn Văn Phúc (78t)', type: 'home' },
    wednesday: { title: 'Khám Tại Nhà (Q.3)', patient: 'Hoàng Anh Dũng (52t)', type: 'home' },
    friday: { title: 'Khám Tại Nhà (Bình Thạnh)', patient: 'Đặng Ngọc Nga (75t)', type: 'home' },
  },
  {
    time: '15:30 - 17:00',
    tuesday: { title: 'Khám Tại Nhà (Q.5)', patient: 'Lý Kim Hoa (82t)', type: 'home' },
    thursday: { title: 'Khám Tại Nhà (Q.10)', patient: 'Trương Vĩnh Kỳ (64t)', type: 'home' },
  },
  {
    time: '19:30 - 21:00',
    monday: { title: 'Telehealth Buổi Tối', patient: 'Nguyễn Minh Quân (12t)', type: 'telehealth' },
    wednesday: { title: 'Telehealth Buổi Tối', patient: 'Bùi Thị Hà (38t)', type: 'telehealth' },
    thursday: { title: 'Telehealth Buổi Tối', patient: 'Đỗ Hữu Tài (45t)', type: 'telehealth' },
  },
];

export function DoctorTimetableView() {
  const [panelCap] = useState({ current: 112, max: 150 });
  const [isEmergencyReady, setIsEmergencyReady] = useState(true);
  const [maxRadius, setMaxRadius] = useState(10); // km

  const capPercentage = Math.round((panelCap.current / panelCap.max) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <DoctorNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Thời Gian Biểu Lâm Sàng &amp; Quản Lý Hạn Mức (Panel Cap)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563eb] border border-blue-200">
                Tuần 44 / 2026
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Điều phối thời gian biểu khám tại nhà và tư vấn từ xa, kiểm soát trần số lượng bệnh nhân phụ trách (Panel Cap) tránh quá tải.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Emergency Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sẵn sàng tiếp nhận Cấp cứu:</span>
              <input
                type="checkbox"
                checked={isEmergencyReady}
                onChange={(e) => setIsEmergencyReady(e.target.checked)}
                className="rounded text-[#2563eb]"
              />
            </label>

            <Link
              href="/doctor/encounters"
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Xem ca khám hôm nay
            </Link>
          </div>
        </div>

        {/* Panel Cap & Capacity Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel Cap Indicator */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2563eb] text-[18px]">group</span>
                Hạn mức Gia đình (Panel Cap)
              </span>
              <span className="text-xs font-bold text-[#2563eb]">{capPercentage}% Tải</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#0f172a]">{panelCap.current}</span>
              <span className="text-xs text-slate-400 font-medium">/ tối đa {panelCap.max} hộ gia đình</span>
            </div>

            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2563eb] h-full rounded-full transition-all"
                style={{ width: `${capPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Quy chuẩn Y tế Gia đình khuyến nghị &lt;= 150 hộ/bác sĩ để đảm bảo chất lượng phản hồi 15 phút.
            </p>
          </div>

          {/* Home Visit Radius Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">near_me</span>
              Bán Kính Khám Tại Nhà
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">{maxRadius}</span>
              <span className="text-xs text-slate-400 font-medium">km quanh BV Đại học Y Dược</span>
            </div>

            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={maxRadius}
              onChange={(e) => setMaxRadius(parseInt(e.target.value, 10))}
              className="w-full accent-[#2563eb]"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>5 km (Nội thành)</span>
              <span>10 km</span>
              <span>20 km (Vùng ven)</span>
            </div>
          </div>

          {/* Weekly Workload Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">pie_chart</span>
              Phân Bổ Lịch Trong Tuần
            </span>
            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Khám tại nhà riêng:</span>
                <strong className="text-[#0f172a]">12 buổi / tuần (35%)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tư vấn Telehealth 24/7:</span>
                <strong className="text-[#2563eb]">18 buổi / tuần (50%)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nghiên cứu &amp; Giao ban viện:</span>
                <strong className="text-slate-400">5 buổi / tuần (15%)</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Master Timetable Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2563eb]">calendar_month</span>
              Thời Gian Biểu Lâm Sàng (Thứ Hai - Thứ Bảy)
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300" />
                Khám Tại Nhà
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-300" />
                Tư vấn Telehealth
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#475569]">
                  <th className="p-3.5 w-32 border-r border-slate-200">Khung giờ</th>
                  <th className="p-3.5 border-r border-slate-200">Thứ 2 (27/10)</th>
                  <th className="p-3.5 border-r border-slate-200">Thứ 3 (28/10)</th>
                  <th className="p-3.5 border-r border-slate-200">Thứ 4 (29/10)</th>
                  <th className="p-3.5 border-r border-slate-200">Thứ 5 (30/10)</th>
                  <th className="p-3.5 border-r border-slate-200">Thứ 6 (31/10)</th>
                  <th className="p-3.5">Thứ 7 (01/11)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                {TIMETABLE_DATA.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-mono font-bold text-slate-500 border-r border-slate-200 bg-slate-50/30 whitespace-nowrap">
                      {slot.time}
                    </td>

                    {/* Monday */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.monday ? (
                        <div
                          className={`p-2.5 rounded-xl border ${
                            slot.monday.type === 'home'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-blue-50/80 border-blue-200 text-blue-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              {slot.monday.type === 'home' ? 'home_health' : 'videocam'}
                            </span>
                            {slot.monday.title}
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">{slot.monday.patient}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 block text-center py-2">Trống</span>
                      )}
                    </td>

                    {/* Tuesday */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.tuesday ? (
                        <div
                          className={`p-2.5 rounded-xl border ${
                            slot.tuesday.type === 'home'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-blue-50/80 border-blue-200 text-blue-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              {slot.tuesday.type === 'home' ? 'home_health' : 'videocam'}
                            </span>
                            {slot.tuesday.title}
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">{slot.tuesday.patient}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 block text-center py-2">Trống</span>
                      )}
                    </td>

                    {/* Wednesday */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.wednesday ? (
                        <div
                          className={`p-2.5 rounded-xl border ${
                            slot.wednesday.type === 'home'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-blue-50/80 border-blue-200 text-blue-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              {slot.wednesday.type === 'home' ? 'home_health' : 'videocam'}
                            </span>
                            {slot.wednesday.title}
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">{slot.wednesday.patient}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 block text-center py-2">Trống</span>
                      )}
                    </td>

                    {/* Thursday */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.thursday ? (
                        <div
                          className={`p-2.5 rounded-xl border ${
                            slot.thursday.type === 'home'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-blue-50/80 border-blue-200 text-blue-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              {slot.thursday.type === 'home' ? 'home_health' : 'videocam'}
                            </span>
                            {slot.thursday.title}
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">{slot.thursday.patient}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 block text-center py-2">Trống</span>
                      )}
                    </td>

                    {/* Friday */}
                    <td className="p-2 border-r border-slate-200">
                      {slot.friday ? (
                        <div
                          className={`p-2.5 rounded-xl border ${
                            slot.friday.type === 'home'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-blue-50/80 border-blue-200 text-blue-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              {slot.friday.type === 'home' ? 'home_health' : 'videocam'}
                            </span>
                            {slot.friday.title}
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">{slot.friday.patient}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 block text-center py-2">Trống</span>
                      )}
                    </td>

                    {/* Saturday */}
                    <td className="p-2">
                      {slot.saturday ? (
                        <div
                          className={`p-2.5 rounded-xl border ${
                            slot.saturday.type === 'home'
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                              : 'bg-blue-50/80 border-blue-200 text-blue-900'
                          }`}
                        >
                          <div className="font-bold text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              {slot.saturday.type === 'home' ? 'home_health' : 'videocam'}
                            </span>
                            {slot.saturday.title}
                          </div>
                          <div className="text-[10px] text-slate-600 truncate">{slot.saturday.patient}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 block text-center py-2">Trống</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

