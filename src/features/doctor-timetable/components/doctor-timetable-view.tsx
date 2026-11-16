'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    <div className="min-h-screen bg-[#f5f6f8] text-[#0f172a] font-sans antialiased">

      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Controls */}
        <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Thời Gian Biểu Lâm Sàng &amp; Quản Lý Hạn Mức (Panel Cap)
              </h1>
              <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                Tuần 44 / 2026
              </Badge>
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
              <Checkbox
                checked={isEmergencyReady}
                onCheckedChange={(checked) => setIsEmergencyReady(checked === true)}
              />
            </label>

            <Button asChild size="sm" className="rounded-xl text-xs font-bold">
              <Link href="/doctor/encounters">Xem ca khám hôm nay</Link>
            </Button>
          </div>
        </Card>

        {/* Panel Cap & Capacity Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel Cap Indicator */}
          <Card className="bg-white p-6 rounded-2xl border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                Hạn mức Gia đình (Panel Cap)
              </span>
              <span className="text-xs font-bold text-primary tabular-nums">{capPercentage}% Tải</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#0f172a] tabular-nums">{panelCap.current}</span>
              <span className="text-xs text-slate-400 font-medium">/ tối đa {panelCap.max} hộ gia đình</span>
            </div>

            <Progress value={capPercentage} className="h-2.5" />
            <p className="text-[11px] text-slate-400">
              Quy chuẩn Y tế Gia đình khuyến nghị &lt;= 150 hộ/bác sĩ để đảm bảo chất lượng phản hồi 15 phút.
            </p>
          </Card>

          {/* Home Visit Radius Settings */}
          <Card className="bg-white p-6 rounded-2xl border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">near_me</span>
              Bán Kính Khám Tại Nhà
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600 tabular-nums">{maxRadius}</span>
              <span className="text-xs text-slate-400 font-medium">km quanh BV Đại học Y Dược</span>
            </div>

            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={maxRadius}
              onChange={(e) => setMaxRadius(parseInt(e.target.value, 10))}
              className="w-full accent-[#0037c1]"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>5 km (Nội thành)</span>
              <span>10 km</span>
              <span>20 km (Vùng ven)</span>
            </div>
          </Card>

          {/* Weekly Workload Distribution */}
          <Card className="bg-white p-6 rounded-2xl border-slate-200 shadow-xs space-y-2">
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
                <strong className="text-primary">18 buổi / tuần (50%)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nghiên cứu &amp; Giao ban viện:</span>
                <strong className="text-slate-400">5 buổi / tuần (15%)</strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Master Timetable Grid */}
        <Card className="bg-white rounded-2xl border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
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

          <div className="hidden md:block overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200 text-[#475569] hover:bg-slate-50">
                  <TableHead className="p-3.5 w-32 border-r border-slate-200 text-[#475569]">Khung giờ</TableHead>
                  <TableHead className="p-3.5 border-r border-slate-200 text-[#475569]">Thứ 2 (27/10)</TableHead>
                  <TableHead className="p-3.5 border-r border-slate-200 text-[#475569]">Thứ 3 (28/10)</TableHead>
                  <TableHead className="p-3.5 border-r border-slate-200 text-[#475569]">Thứ 4 (29/10)</TableHead>
                  <TableHead className="p-3.5 border-r border-slate-200 text-[#475569]">Thứ 5 (30/10)</TableHead>
                  <TableHead className="p-3.5 border-r border-slate-200 text-[#475569]">Thứ 6 (31/10)</TableHead>
                  <TableHead className="p-3.5 text-[#475569]">Thứ 7 (01/11)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-[#0f172a]">
                {TIMETABLE_DATA.map((slot, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/50">
                    <TableCell className="p-3.5 tabular-nums font-bold text-slate-500 border-r border-slate-200 bg-slate-50/30 whitespace-nowrap">
                      {slot.time}
                    </TableCell>

                    {[slot.monday, slot.tuesday, slot.wednesday, slot.thursday, slot.friday, slot.saturday].map(
                      (item, dayIdx) => (
                        <TableCell
                          key={dayIdx}
                          className={`p-2 ${dayIdx < 5 ? 'border-r border-slate-200' : ''}`}
                        >
                          {item ? (
                            <div
                              className={`p-2.5 rounded-xl border ${
                                item.type === 'home'
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
                              }`}
                            >
                              <div className="font-bold text-[11px] flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">
                                  {item.type === 'home' ? 'home_health' : 'videocam'}
                                </span>
                                {item.title}
                              </div>
                              <div className="text-[10px] text-slate-600 truncate">{item.patient}</div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-300 block text-center py-2">Trống</span>
                          )}
                        </TableCell>
                      )
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {TIMETABLE_DATA.map((slot, idx) => (
              <div key={idx} className="space-y-2 p-4 text-xs">
                <div className="font-bold text-slate-900 tabular-nums">{slot.time}</div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[slot.monday, slot.tuesday, slot.wednesday, slot.thursday, slot.friday, slot.saturday].map(
                    (item, dIdx) => (
                      <div key={dIdx} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                        <span className="font-medium text-slate-500">Thứ {dIdx + 2}</span>
                        <span className="font-semibold text-slate-800 truncate">{item?.title || 'Trống'}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

