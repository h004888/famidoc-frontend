'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FamilyNav } from '@/components/layout';

interface VitalRecord {
  id: string;
  timestamp: string;
  bpSystolic: number;
  bpDiastolic: number;
  glucose: number; // mmol/L
  heartRate: number; // bpm
  spo2: number; // %
  device: string;
  notes?: string;
  status: 'normal' | 'warning' | 'critical';
}

const MOCK_RECORDS: VitalRecord[] = [
  { id: 'v-01', timestamp: '27/10/2026 07:30', bpSystolic: 124, bpDiastolic: 80, glucose: 5.6, heartRate: 74, spo2: 98, device: 'Máy đo Omron HEM-7600T (IoT)', status: 'normal', notes: 'Trước ăn sáng' },
  { id: 'v-02', timestamp: '26/10/2026 19:45', bpSystolic: 132, bpDiastolic: 84, glucose: 6.8, heartRate: 78, spo2: 98, device: 'Máy đo Omron HEM-7600T (IoT)', status: 'warning', notes: 'Sau ăn tối 2 tiếng' },
  { id: 'v-03', timestamp: '26/10/2026 07:15', bpSystolic: 122, bpDiastolic: 78, glucose: 5.4, heartRate: 72, spo2: 99, device: 'Máy đo Omron HEM-7600T (IoT)', status: 'normal', notes: 'Trước ăn sáng' },
  { id: 'v-04', timestamp: '25/10/2026 20:00', bpSystolic: 138, bpDiastolic: 86, glucose: 7.2, heartRate: 82, spo2: 97, device: 'Nhập tay thủ công', status: 'warning', notes: 'Hơi mệt sau khi đi bộ ngoài trời lạnh' },
  { id: 'v-05', timestamp: '25/10/2026 07:30', bpSystolic: 126, bpDiastolic: 81, glucose: 5.7, heartRate: 75, spo2: 98, device: 'Máy đo Omron HEM-7600T (IoT)', status: 'normal', notes: 'Trước ăn sáng' },
  { id: 'v-06', timestamp: '24/10/2026 08:00', bpSystolic: 120, bpDiastolic: 79, glucose: 5.5, heartRate: 73, spo2: 99, device: 'Bác sĩ Nghĩa đo tại nhà', status: 'normal', notes: 'Buổi thăm khám định kỳ' },
];

export function ChronicCareView() {
  const [selectedMember, setSelectedMember] = useState('Ông nội - Nguyễn Văn Phúc (78 tuổi)');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [records, setRecords] = useState<VitalRecord[]>(MOCK_RECORDS);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Record Form
  const [newBpSys, setNewBpSys] = useState('120');
  const [newBpDia, setNewBpDia] = useState('80');
  const [newGlucose, setNewGlucose] = useState('5.6');
  const [newHeartRate, setNewHeartRate] = useState('75');
  const [newSpo2, setNewSpo2] = useState('98');
  const [newNotes, setNewNotes] = useState('Đo buổi sáng');

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(newBpSys, 10);
    const dia = parseInt(newBpDia, 10);

    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (sys >= 140 || dia >= 90) status = 'warning';
    if (sys >= 160 || dia >= 100) status = 'critical';

    const newRec: VitalRecord = {
      id: `v-${Date.now()}`,
      timestamp: 'Vừa xong',
      bpSystolic: sys,
      bpDiastolic: dia,
      glucose: parseFloat(newGlucose) || 5.6,
      heartRate: parseInt(newHeartRate, 10) || 75,
      spo2: parseInt(newSpo2, 10) || 98,
      device: 'Ghi nhận thủ công',
      notes: newNotes,
      status,
    };

    setRecords([newRec, ...records]);
    setShowAddModal(false);
    alert('Đã lưu chỉ số sinh tồn thành công! Dữ liệu đã đồng bộ đến Bác sĩ gia đình.');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <FamilyNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Theo Dõi Chỉ Số Sức Khỏe Mạn Tính &amp; Cảnh Báo Sớm
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563eb] border border-blue-200">
                AI Phân tích 24/7
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Hệ thống tự động phát hiện biến động bất thường của Huyết áp, Đường huyết và thông báo tức thì đến Bác sĩ phụ trách.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_chart</span>
              <span>Ghi nhận chỉ số mới</span>
            </button>
            <Link
              href="/family/appointments"
              className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-[#0f172a] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>Bác sĩ hội chẩn</span>
            </Link>
          </div>
        </div>

        {/* Member & Range Selector Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#475569]">Theo dõi cho:</span>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-[#0f172a] focus:ring-2 focus:ring-[#2563eb]"
            >
              <option>Ông nội - Nguyễn Văn Phúc (78 tuổi)</option>
              <option>Mẹ - Trần Thị Mai (42 tuổi)</option>
              <option>Con trai - Nguyễn Minh Quân (12 tuổi)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { id: '7d', label: '7 ngày qua' },
              { id: '30d', label: '30 ngày' },
              { id: '90d', label: '3 tháng (Quý)' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setTimeRange(r.id as '7d' | '30d' | '90d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeRange === r.id
                    ? 'bg-white text-[#2563eb] shadow-xs font-bold'
                    : 'text-[#475569] hover:text-[#0f172a]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Status Alert Banner */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">info</span>
            <div>
              <strong className="text-amber-900 block font-bold">
                Cảnh báo biến động Huyết áp nhẹ (Cấp độ 1 - Chú ý):
              </strong>
              <p className="text-amber-800 leading-relaxed mt-0.5">
                Ngày 25/10 ghi nhận huyết áp tâm thu 138 mmHg vào buổi tối. Bác sĩ Nghĩa khuyến nghị: Uống 1 ly nước ấm, giữ ấm chân, nghỉ ngơi 20 phút và đo lại. Nếu tiếp tục &gt; 140 mmHg, ấn nút bên cạnh để kết nối bác sĩ.
              </p>
            </div>
          </div>
          <Link
            href="/family/appointments"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shrink-0 text-center transition-colors shadow-xs"
          >
            Hỏi Bác sĩ ngay
          </Link>
        </div>

        {/* 4 Cards Overview of Target Thresholds */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs text-[#475569]">
              <span>Huyết áp mục tiêu</span>
              <span className="material-symbols-outlined text-[#2563eb] text-[18px]">ecg_heart</span>
            </div>
            <div className="text-2xl font-bold text-[#0f172a]">
              124/80 <span className="text-xs font-normal text-slate-400">mmHg</span>
            </div>
            <div className="text-[11px] text-[#03864b] font-semibold bg-[#f6ffed] px-2 py-0.5 rounded-md inline-block">
              Mục tiêu an toàn: &lt; 130/80
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs text-[#475569]">
              <span>Đường huyết lúc đói</span>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">water_drop</span>
            </div>
            <div className="text-2xl font-bold text-[#0f172a]">
              5.6 <span className="text-xs font-normal text-slate-400">mmol/L</span>
            </div>
            <div className="text-[11px] text-[#03864b] font-semibold bg-[#f6ffed] px-2 py-0.5 rounded-md inline-block">
              Chuẩn ADA: 4.4 - 7.2 mmol/L
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs text-[#475569]">
              <span>Nhịp tim nghỉ ngơi</span>
              <span className="material-symbols-outlined text-red-500 text-[18px]">favorite</span>
            </div>
            <div className="text-2xl font-bold text-[#0f172a]">
              74 <span className="text-xs font-normal text-slate-400">bpm</span>
            </div>
            <div className="text-[11px] text-[#03864b] font-semibold bg-[#f6ffed] px-2 py-0.5 rounded-md inline-block">
              Bình thường: 60 - 90 bpm
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex justify-between items-center text-xs text-[#475569]">
              <span>Nồng độ oxy SpO2</span>
              <span className="material-symbols-outlined text-blue-500 text-[18px]">spo2</span>
            </div>
            <div className="text-2xl font-bold text-[#0f172a]">
              98 <span className="text-xs font-normal text-slate-400">%</span>
            </div>
            <div className="text-[11px] text-[#03864b] font-semibold bg-[#f6ffed] px-2 py-0.5 rounded-md inline-block">
              Rất tốt: &gt;= 96%
            </div>
          </div>
        </div>

        {/* Visual Trend Chart (SVG) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2563eb]">show_chart</span>
                Biểu Đồ Xu Hướng Huyết Áp 7 Ngày Gần Nhất
              </h3>
              <p className="text-xs text-slate-400">Đường đỏ: Huyết áp tâm thu (SYS) • Đường xanh: Huyết áp tâm trương (DIA)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#2563eb]" />
                Tâm thu (SYS)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                Tâm trương (DIA)
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-x-auto py-2">
            <svg viewBox="0 0 700 200" className="w-full h-48 sm:h-56">
              {/* Background grid lines */}
              <line x1="40" y1="30" x2="680" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <text x="10" y="34" fontSize="10" fill="#94a3b8">150</text>

              <line x1="40" y1="75" x2="680" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <text x="10" y="79" fontSize="10" fill="#94a3b8">130</text>

              <line x1="40" y1="120" x2="680" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <text x="10" y="124" fontSize="10" fill="#94a3b8">90</text>

              <line x1="40" y1="165" x2="680" y2="165" stroke="#f1f5f9" strokeWidth="1" />
              <text x="10" y="169" fontSize="10" fill="#94a3b8">70</text>

              {/* Threshold Danger Line (140 mmHg) */}
              <line x1="40" y1="52" x2="680" y2="52" stroke="#fca5a5" strokeWidth="1" strokeDasharray="4 4" />
              <text x="600" y="48" fontSize="9" fill="#ef4444" fontWeight="bold">Ngưỡng cảnh báo: 140 mmHg</text>

              {/* Systolic Line (Red/Cobalt) */}
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                points="70,85 170,82 270,55 370,78 470,68 570,84 650,80"
              />
              {/* Systolic Points */}
              {[[70, 85, 120], [170, 82, 122], [270, 55, 138], [370, 78, 126], [470, 68, 132], [570, 84, 122], [650, 80, 124]].map(([x, y, val], idx) => (
                <g key={idx}>
                  <circle cx={x} cy={y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                  <text x={x} y={y - 8} fontSize="10" fontWeight="bold" fill="#2563eb" textAnchor="middle">{val}</text>
                </g>
              ))}

              {/* Diastolic Line (Emerald) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points="70,140 170,145 270,132 370,138 470,135 570,144 650,140"
              />
              {/* Diastolic Points */}
              {[[70, 140, 79], [170, 145, 78], [270, 132, 86], [370, 138, 81], [470, 135, 84], [570, 144, 78], [650, 140, 80]].map(([x, y, val], idx) => (
                <g key={idx}>
                  <circle cx={x} cy={y} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                  <text x={x} y={y + 16} fontSize="9" fontWeight="bold" fill="#10b981" textAnchor="middle">{val}</text>
                </g>
              ))}

              {/* X Axis Date labels */}
              {['21/10', '22/10', '23/10', '24/10', '25/10', '26/10', '27/10'].map((d, idx) => (
                <text key={idx} x={70 + idx * 96} y="195" fontSize="10" fill="#64748b" textAnchor="middle">{d}</text>
              ))}
            </svg>
          </div>
        </div>

        {/* Detailed Measurement Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2563eb]">table_rows</span>
              Nhật Ký Đo Sinh Hiệu Chi Tiết
            </h3>
            <span className="text-xs text-slate-400 font-medium">Đồng bộ tự động từ thiết bị IoT</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#475569]">
                <tr>
                  <th className="p-3.5">Thời gian đo</th>
                  <th className="p-3.5">Huyết áp (SYS/DIA)</th>
                  <th className="p-3.5">Đường huyết</th>
                  <th className="p-3.5">Nhịp tim</th>
                  <th className="p-3.5">SpO2</th>
                  <th className="p-3.5">Thiết bị thu nhận</th>
                  <th className="p-3.5">Ghi chú</th>
                  <th className="p-3.5">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-medium whitespace-nowrap">{rec.timestamp}</td>
                    <td className="p-3.5 font-bold text-[#2563eb] whitespace-nowrap">
                      {rec.bpSystolic}/{rec.bpDiastolic} mmHg
                    </td>
                    <td className="p-3.5 font-semibold text-amber-700 whitespace-nowrap">{rec.glucose} mmol/L</td>
                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{rec.heartRate} bpm</td>
                    <td className="p-3.5 font-semibold text-emerald-600 whitespace-nowrap">{rec.spo2}%</td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{rec.device}</td>
                    <td className="p-3.5 text-slate-400 max-w-[200px] truncate">{rec.notes || '—'}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      {rec.status === 'normal' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                          Bình thường
                        </span>
                      )}
                      {rec.status === 'warning' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff7e6] text-[#ae5c04] border border-[#ffd591]">
                          Hơi cao
                        </span>
                      )}
                      {rec.status === 'critical' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Nguy cấp
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Manual Add Vitals Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0f172a]">Ghi Nhận Chỉ Số Sinh Hiệu Mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Tâm thu (SYS) *</label>
                  <input
                    type="number"
                    value={newBpSys}
                    onChange={(e) => setNewBpSys(e.target.value)}
                    placeholder="120"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Tâm trương (DIA) *</label>
                  <input
                    type="number"
                    value={newBpDia}
                    onChange={(e) => setNewBpDia(e.target.value)}
                    placeholder="80"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Đường huyết</label>
                  <input
                    type="text"
                    value={newGlucose}
                    onChange={(e) => setNewGlucose(e.target.value)}
                    placeholder="5.6"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Nhịp tim (bpm)</label>
                  <input
                    type="number"
                    value={newHeartRate}
                    onChange={(e) => setNewHeartRate(e.target.value)}
                    placeholder="75"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={newSpo2}
                    onChange={(e) => setNewSpo2(e.target.value)}
                    placeholder="98"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Ghi chú ngữ cảnh đo</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ví dụ: Đo sau khi uống thuốc 1 tiếng, sau bữa ăn..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-xs"
                >
                  Lưu chỉ số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


