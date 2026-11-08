'use client';

import React, { useState } from 'react';
import Link from 'next/link';

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

interface MemberVitalProfile {
  id: string;
  name: string;
  relation: string;
  age: number;
  doctorName: string;
  alertType: 'warning' | 'good';
  alertTitle: string;
  alertMessage: string;
  bpTarget: string;
  glucoseTarget: string;
  chartSys: number[];
  chartDia: number[];
  records: VitalRecord[];
}

const INITIAL_MEMBER_VITALS: Record<string, MemberVitalProfile> = {
  'mem-01': {
    id: 'mem-01',
    name: 'Nguyễn Văn Phúc',
    relation: 'Ông nội (Chủ hộ)',
    age: 78,
    doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
    alertType: 'warning',
    alertTitle: 'Lưu ý biến động Huyết áp buổi tối (Cần theo dõi nhẹ)',
    alertMessage:
      'Tối 25/10 và 26/10 huyết áp tâm thu tăng nhẹ lên 132–138 mmHg. PGS.TS Nguyễn Trọng Nghĩa dặn: Uống thuốc huyết áp đúng giờ sáng, ngâm chân nước ấm trước khi ngủ và hạn chế ăn mặn vào bữa tối.',
    bpTarget: 'Mục tiêu: < 135/85 mmHg',
    glucoseTarget: 'Mục tiêu: 4.4 - 7.0 mmol/L',
    chartSys: [120, 122, 138, 126, 132, 122, 124],
    chartDia: [79, 78, 86, 81, 84, 78, 80],
    records: [
      {
        id: 'v-01',
        timestamp: '27/10/2026 • 07:30',
        bpSystolic: 124,
        bpDiastolic: 80,
        glucose: 5.6,
        heartRate: 74,
        spo2: 98,
        device: 'Máy đo Omron HEM-7600T',
        status: 'normal',
        notes: 'Đo trước ăn sáng',
      },
      {
        id: 'v-02',
        timestamp: '26/10/2026 • 19:45',
        bpSystolic: 132,
        bpDiastolic: 84,
        glucose: 6.8,
        heartRate: 78,
        spo2: 98,
        device: 'Máy đo Omron HEM-7600T',
        status: 'warning',
        notes: 'Sau ăn tối 2 tiếng',
      },
      {
        id: 'v-03',
        timestamp: '26/10/2026 • 07:15',
        bpSystolic: 122,
        bpDiastolic: 78,
        glucose: 5.4,
        heartRate: 72,
        spo2: 99,
        device: 'Máy đo Omron HEM-7600T',
        status: 'normal',
        notes: 'Đo trước ăn sáng',
      },
      {
        id: 'v-04',
        timestamp: '25/10/2026 • 20:00',
        bpSystolic: 138,
        bpDiastolic: 86,
        glucose: 7.2,
        heartRate: 82,
        spo2: 97,
        device: 'Nhập tay tại nhà',
        status: 'warning',
        notes: 'Hơi mỏi người sau khi đi bộ tối trời lạnh',
      },
      {
        id: 'v-05',
        timestamp: '24/10/2026 • 08:00',
        bpSystolic: 120,
        bpDiastolic: 79,
        glucose: 5.5,
        heartRate: 73,
        spo2: 99,
        device: 'Bác sĩ Nghĩa đo tại nhà',
        status: 'normal',
        notes: 'Khám định kỳ tại nhà',
      },
    ],
  },
  'mem-02': {
    id: 'mem-02',
    name: 'Trần Thị Mai',
    relation: 'Mẹ',
    age: 42,
    doctorName: 'ThS.BS Võ Thị Phương Thảo',
    alertType: 'good',
    alertTitle: 'Chỉ số sinh hiệu 7 ngày qua hoàn toàn ổn định',
    alertMessage:
      'Huyết áp và đường huyết của chị Mai duy trì ở ngưỡng lý tưởng (115/75 mmHg). Tiếp tục duy trì chế độ vận động nhẹ và bổ sung Canxi + Vitamin D3 mỗi sáng.',
    bpTarget: 'Mục tiêu: < 125/80 mmHg',
    glucoseTarget: 'Mục tiêu: 4.0 - 6.0 mmol/L',
    chartSys: [114, 116, 115, 118, 115, 114, 115],
    chartDia: [74, 75, 74, 76, 75, 73, 75],
    records: [
      {
        id: 'v-21',
        timestamp: '27/10/2026 • 07:00',
        bpSystolic: 115,
        bpDiastolic: 75,
        glucose: 5.2,
        heartRate: 72,
        spo2: 99,
        device: 'Máy đo Omron HEM-7600T',
        status: 'normal',
        notes: 'Đo buổi sáng trước khi đi làm',
      },
      {
        id: 'v-22',
        timestamp: '24/10/2026 • 20:00',
        bpSystolic: 118,
        bpDiastolic: 76,
        glucose: 5.4,
        heartRate: 74,
        spo2: 99,
        device: 'Nhập tay tại nhà',
        status: 'normal',
        notes: 'Đo kiểm tra định kỳ cuối tuần',
      },
    ],
  },
  'mem-03': {
    id: 'mem-03',
    name: 'Nguyễn Minh Quân',
    relation: 'Con trai',
    age: 12,
    doctorName: 'BSCKII Trần Mai Phương',
    alertType: 'good',
    alertTitle: 'Thể trạng & Hô hấp của bé phát triển tốt',
    alertMessage:
      'Nồng độ oxy máu SpO2 luôn đạt 99–100%, nhịp tim và huyết áp đúng chuẩn lứa tuổi 12. Nhớ xịt mũi nước muối sinh lý cho bé vào buổi sáng khi trời lạnh.',
    bpTarget: 'Chuẩn lứa tuổi: 100 - 115/75',
    glucoseTarget: 'Chuẩn: 4.0 - 5.8 mmol/L',
    chartSys: [104, 105, 106, 104, 105, 103, 105],
    chartDia: [64, 65, 66, 65, 64, 64, 65],
    records: [
      {
        id: 'v-31',
        timestamp: '26/10/2026 • 19:00',
        bpSystolic: 105,
        bpDiastolic: 65,
        glucose: 4.8,
        heartRate: 82,
        spo2: 100,
        device: 'Bác sĩ Phương kiểm tra',
        status: 'normal',
        notes: 'Sau khi tập thể thao buổi chiều',
      },
    ],
  },
};

const CHART_DATES = ['21/10', '22/10', '23/10', '24/10', '25/10', '26/10', '27/10'];

export function ChronicCareView() {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('mem-01');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [membersVitals, setMembersVitals] =
    useState<Record<string, MemberVitalProfile>>(INITIAL_MEMBER_VITALS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State cho Form Ghi nhận số đo mới
  const [newBpSys, setNewBpSys] = useState('120');
  const [newBpDia, setNewBpDia] = useState('80');
  const [newGlucose, setNewGlucose] = useState('5.6');
  const [newHeartRate, setNewHeartRate] = useState('75');
  const [newSpo2, setNewSpo2] = useState('98');
  const [newNotes, setNewNotes] = useState('Đo trước ăn sáng');

  const currentProfile = membersVitals[selectedMemberId] || membersVitals['mem-01'];
  const latestRecord = currentProfile.records[0];

  const getInitials = (fullName: string) =>
    fullName
      .split(' ')
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(newBpSys, 10) || 120;
    const dia = parseInt(newBpDia, 10) || 80;
    const glu = parseFloat(newGlucose) || 5.6;

    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (sys >= 135 || dia >= 85 || glu >= 7.0) status = 'warning';
    if (sys >= 160 || dia >= 100 || glu >= 11.0) status = 'critical';

    const newRec: VitalRecord = {
      id: `v-${Date.now()}`,
      timestamp: 'Hôm nay • Vừa xong',
      bpSystolic: sys,
      bpDiastolic: dia,
      glucose: glu,
      heartRate: parseInt(newHeartRate, 10) || 75,
      spo2: parseInt(newSpo2, 10) || 98,
      device: 'Gia đình tự đo & nhập',
      notes: newNotes.trim() || 'Đo kiểm tra tại nhà',
      status,
    };

    setMembersVitals((prev) => {
      const member = prev[selectedMemberId];
      return {
        ...prev,
        [selectedMemberId]: {
          ...member,
          chartSys: [...member.chartSys.slice(1), sys],
          chartDia: [...member.chartDia.slice(1), dia],
          records: [newRec, ...member.records],
        },
      };
    });

    setShowAddModal(false);
    setToastMessage(
      `Đã lưu số đo mới cho ${currentProfile.name} (${sys}/${dia} mmHg). Bác sĩ ${currentProfile.doctorName} đã nhận được cập nhật.`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Tính tọa độ SVG cho biểu đồ
  const sysCoords = currentProfile.chartSys.map((val, idx) => {
    const x = 65 + idx * 95;
    // Quy đổi giá trị 90..155 về tọa độ y 135..28
    const y = Math.round(165 - ((val - 70) / 85) * 135);
    return { x, y, val };
  });

  const diaCoords = currentProfile.chartDia.map((val, idx) => {
    const x = 65 + idx * 95;
    const y = Math.round(165 - ((val - 55) / 85) * 135);
    return { x, y, val };
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. HEADER TRANG THEO DÕI CHỈ SỐ SỨC KHỎE TẠI NHÀ */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white flex items-center justify-center shadow-sm ring-4 ring-[#2E37A4]/10 shrink-0">
                <span className="material-symbols-outlined text-[24px] sm:text-[28px]">
                  monitor_heart
                </span>
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#2E37A4] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                    Hộ #FAM-88219
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Bác sĩ theo dõi từ xa 24/7</span>
                  </span>
                </div>

                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  Sổ Theo Dõi Huyết Áp &amp; Chỉ Số Sức Khỏe
                </h1>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Ghi chép và theo dõi biến động Huyết áp, Đường huyết, Nhịp tim hàng ngày để Bác sĩ gia đình kịp thời tư vấn.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full lg:w-auto pt-3.5 lg:pt-0 border-t border-slate-100 lg:border-t-0 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_chart</span>
                <span>Ghi số đo mới</span>
              </button>
              <Link
                href="/family/appointments"
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 text-[#2E37A4] rounded-xl text-xs sm:text-sm font-bold transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                <span>Hỏi Bác sĩ</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2. CHỌN NGƯỜI THÂN ĐỂ XEM CHỈ SỐ (3 THẺ TRỰC QUAN — KHÔNG ẨN TRONG DROPDOWN) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">group</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Chọn người thân để xem biểu đồ &amp; nhật ký đo:
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Đồng bộ máy đo gia đình &amp; nhập tay
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {Object.values(membersVitals).map((m) => {
              const isSelected = m.id === selectedMemberId;
              const latest = m.records[0];

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#2E37A4] bg-white ring-2 ring-[#2E37A4]/15 shadow-[0_4px_14px_rgba(46,55,164,0.10)]'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/70 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl font-extrabold text-sm flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected
                          ? 'bg-[#2E37A4] text-white border-[#2E37A4]'
                          : 'bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      {getInitials(m.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{m.name}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {m.relation} • {m.age} tuổi
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {m.alertType === 'warning' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Cần chú ý
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ổn định
                      </span>
                    )}
                    <span className="text-[11px] font-mono font-bold text-[#2E37A4]">
                      HA: {latest.bpSystolic}/{latest.bpDiastolic}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. BANNER NHẬN ĐỊNH & DẶN DÒ TỪ BÁC SĨ GIA ĐÌNH */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            currentProfile.alertType === 'warning'
              ? 'bg-amber-50/80 border-amber-200/90'
              : 'bg-emerald-50/70 border-emerald-200/90'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                currentProfile.alertType === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {currentProfile.alertType === 'warning' ? 'notification_important' : 'verified'}
              </span>
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <strong
                className={`block font-extrabold ${
                  currentProfile.alertType === 'warning' ? 'text-amber-950' : 'text-emerald-950'
                }`}
              >
                {currentProfile.alertTitle}
              </strong>
              <p
                className={`text-xs leading-relaxed ${
                  currentProfile.alertType === 'warning' ? 'text-amber-900' : 'text-emerald-800'
                }`}
              >
                {currentProfile.alertMessage}
              </p>
            </div>
          </div>

          <Link
            href="/family/appointments"
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 text-center transition-colors shadow-2xs whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
              currentProfile.alertType === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>Nhắn {currentProfile.doctorName}</span>
          </Link>
        </div>

        {/* 4. BỐN THẺ CHỈ SỐ ĐO GẦN NHẤT & NGƯỠNG MỤC TIÊU AN TOÀN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Huyết áp */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">vital_signs</span>
                </span>
                <span className="text-xs font-bold text-slate-700">Huyết áp mới nhất</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">mmHg</span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {latestRecord.bpSystolic}/{latestRecord.bpDiastolic}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">SYS/DIA</span>
              </div>
              <div className="mt-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md inline-block">
                  {currentProfile.bpTarget}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Đường huyết */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#2E37A4] border border-indigo-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">water_drop</span>
                </span>
                <span className="text-xs font-bold text-slate-700">Đường huyết</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">mmol/L</span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {latestRecord.glucose}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">mmol/L</span>
              </div>
              <div className="mt-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md inline-block">
                  {currentProfile.glucoseTarget}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Nhịp tim */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </span>
                <span className="text-xs font-bold text-slate-700">Nhịp tim nghỉ ngơi</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">nhịp/phút</span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {latestRecord.heartRate}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">BPM</span>
              </div>
              <div className="mt-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md inline-block">
                  Bình thường: 60 - 90 nhịp/phút
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Nồng độ oxy SpO2 (Sửa lỗi icon spo2 -> air) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">air</span>
                </span>
                <span className="text-xs font-bold text-slate-700">Oxy máu (SpO2)</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">%</span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {latestRecord.spo2}%
                </span>
                <span className="text-[11px] text-slate-400 font-medium">SpO2</span>
              </div>
              <div className="mt-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md inline-block">
                  Rất tốt: &gt;= 96%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. BIỂU ĐỒ XU HƯỚNG HUYẾT ÁP TÍCH HỢP BỘ LỌC KỲ THEO DÕI */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">ssid_chart</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Biểu Đồ Xu Hướng Huyết Áp: {currentProfile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi độ ổn định giữa Huyết áp tâm thu (SYS) và tâm trương (DIA)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
              {/* Chú giải màu sắc chuẩn xác */}
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-[#2E37A4]" />
                  <span>Tâm thu (SYS)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Tâm trương (DIA)</span>
                </span>
              </div>

              {/* Bộ chọn kỳ xem biểu đồ */}
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: '7d', label: '7 ngày' },
                  { id: '30d', label: '30 ngày' },
                  { id: '90d', label: '3 tháng' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setTimeRange(r.id as '7d' | '30d' | '90d')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timeRange === r.id
                        ? 'bg-[#2E37A4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Khung vẽ SVG Biểu đồ */}
          <div className="w-full overflow-x-auto py-1">
            <svg viewBox="0 0 700 205" className="w-full min-w-[540px] h-48 sm:h-56">
              {/* Lưới ngang tham chiếu */}
              <line x1="40" y1="30" x2="670" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="34" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                150
              </text>

              <line x1="40" y1="75" x2="670" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="79" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                130
              </text>

              <line x1="40" y1="120" x2="670" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="124" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                90
              </text>

              <line x1="40" y1="165" x2="670" y2="165" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="169" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                70
              </text>

              {/* Đường ngưỡng cảnh báo 140 mmHg */}
              <line
                x1="40"
                y1="52"
                x2="670"
                y2="52"
                stroke="#fda4af"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <text x="665" y="45" fontSize="10" fill="#e11d48" fontWeight="bold" textAnchor="end">
                Ngưỡng chú ý: 140 mmHg
              </text>

              {/* Đường biểu diễn Tâm thu (SYS - Navy #2E37A4) */}
              <polyline
                fill="none"
                stroke="#2E37A4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sysCoords.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {sysCoords.map((p, idx) => {
                const isHigh = p.val >= 135;
                return (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHigh ? '6' : '5'}
                      fill={isHigh ? '#f59e0b' : '#2E37A4'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      fontSize="10"
                      fontWeight="bold"
                      fill={isHigh ? '#b45309' : '#2E37A4'}
                      textAnchor="middle"
                    >
                      {p.val}
                    </text>
                  </g>
                );
              })}

              {/* Đường biểu diễn Tâm trương (DIA - Emerald #10b981) */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={diaCoords.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {diaCoords.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={p.y + 16}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#059669"
                    textAnchor="middle"
                  >
                    {p.val}
                  </text>
                </g>
              ))}

              {/* Nhãn ngày trục X */}
              {CHART_DATES.map((d, idx) => (
                <text
                  key={idx}
                  x={65 + idx * 95}
                  y="195"
                  fontSize="10"
                  fontWeight="600"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {d}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* 6. NHẬT KÝ CÁC LẦN ĐO CHI TIẾT (THẺ TRÊN MOBILE • BẢNG GỌN TRÊN DESKTOP) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Nhật Ký Các Lần Đo Của {currentProfile.name} ({currentProfile.records.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Lưu trữ tự động từ máy đo huyết áp Bluetooth và các lần gia đình tự ghi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-[#2E37A4] border border-blue-200/80 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Thêm lần đo</span>
            </button>
          </div>

          {/* Giao diện Mobile (< md): Danh sách Thẻ Nhật Ký Đo không cần vuốt ngang */}
          <div className="md:hidden divide-y divide-slate-100">
            {currentProfile.records.map((rec) => (
              <div key={rec.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#2E37A4]">
                      schedule
                    </span>
                    <span>{rec.timestamp}</span>
                  </div>

                  {rec.status === 'normal' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                      Bình thường
                    </span>
                  )}
                  {rec.status === 'warning' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                      Hơi cao • Chú ý
                    </span>
                  )}
                  {rec.status === 'critical' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shrink-0">
                      Cần gọi Bác sĩ
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500">Huyết áp</span>
                    <span className="font-mono font-extrabold text-sm text-[#2E37A4]">
                      {rec.bpSystolic}/{rec.bpDiastolic}{' '}
                      <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500">Đường huyết</span>
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      {rec.glucose}{' '}
                      <span className="text-[10px] font-normal text-slate-400">mmol/L</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500">Nhịp tim</span>
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {rec.heartRate} nhịp/phút
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500">Oxy máu (SpO2)</span>
                    <span className="font-mono font-bold text-xs text-emerald-700">
                      {rec.spo2}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Ghi chú: <strong className="text-slate-700">{rec.notes || '—'}</strong></span>
                  <span className="text-slate-400">{rec.device}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Giao diện Desktop (>= md): Bảng 6 cột chuẩn lâm sàng */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">Thời điểm &amp; Ghi chú đo</th>
                  <th className="p-4">Huyết áp (SYS/DIA)</th>
                  <th className="p-4">Đường huyết</th>
                  <th className="p-4">Nhịp tim &amp; SpO2</th>
                  <th className="p-4">Thiết bị ghi nhận</th>
                  <th className="p-4 text-right">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {currentProfile.records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{rec.timestamp}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{rec.notes || '—'}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`font-mono font-extrabold text-sm ${
                          rec.status === 'warning' || rec.status === 'critical'
                            ? 'text-amber-700'
                            : 'text-[#2E37A4]'
                        }`}
                      >
                        {rec.bpSystolic}/{rec.bpDiastolic}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400">mmHg</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900">{rec.glucose}</span>{' '}
                      <span className="text-[11px] text-slate-400">mmol/L</span>
                    </td>
                    <td className="p-4 whitespace-nowrap font-mono">
                      <span className="font-bold text-slate-800">{rec.heartRate} bpm</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className="font-bold text-emerald-700">{rec.spo2}%</span>
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">{rec.device}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {rec.status === 'normal' && (
                        <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Bình thường
                        </span>
                      )}
                      {rec.status === 'warning' && (
                        <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Hơi cao • Chú ý
                        </span>
                      )}
                      {rec.status === 'critical' && (
                        <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Cần gọi Bác sĩ
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

      {/* MODAL GHI NHẬN SỐ ĐO MỚI */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">add_chart</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                    Ghi Nhận Số Đo Sức Khỏe Mới
                  </h3>
                  <p className="text-[11px] text-indigo-100 truncate mt-0.5">
                    Người thân: {currentProfile.name} ({currentProfile.age} tuổi)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Huyết áp SYS / DIA */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chỉ số Huyết áp (mmHg) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">
                      Số trên - Tâm thu (SYS)
                    </span>
                    <input
                      type="number"
                      required
                      min={60}
                      max={250}
                      value={newBpSys}
                      onChange={(e) => setNewBpSys(e.target.value)}
                      placeholder="120"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-sm text-slate-900 focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">
                      Số dưới - Tâm trương (DIA)
                    </span>
                    <input
                      type="number"
                      required
                      min={40}
                      max={160}
                      value={newBpDia}
                      onChange={(e) => setNewBpDia(e.target.value)}
                      placeholder="80"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-sm text-slate-900 focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Đường huyết, Nhịp tim, SpO2 */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Đường huyết
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newGlucose}
                    onChange={(e) => setNewGlucose(e.target.value)}
                    placeholder="5.6"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-xs sm:text-sm text-slate-900 focus:border-[#2E37A4] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">mmol/L</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nhịp tim
                  </label>
                  <input
                    type="number"
                    value={newHeartRate}
                    onChange={(e) => setNewHeartRate(e.target.value)}
                    placeholder="75"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-xs sm:text-sm text-slate-900 focus:border-[#2E37A4] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">nhịp/phút</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Oxy SpO2
                  </label>
                  <input
                    type="number"
                    value={newSpo2}
                    onChange={(e) => setNewSpo2(e.target.value)}
                    placeholder="98"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-xs sm:text-sm text-slate-900 focus:border-[#2E37A4] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">%</span>
                </div>
              </div>

              {/* Thời điểm / Ngữ cảnh đo (Có nút chọn nhanh 1 chạm) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Thời điểm / Ghi chú lúc đo
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Đo trước ăn sáng',
                    'Sau ăn tối 2 tiếng',
                    'Trước khi đi ngủ',
                    'Khi thấy hơi mệt',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewNotes(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                        newNotes === preset
                          ? 'bg-[#2E37A4] text-white border-[#2E37A4]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Hoặc tự nhập ghi chú..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-[#2E37A4] hover:bg-[#222982] rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Lưu số đo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accessible Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span className="font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}


