'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
        timestamp: '27/10/2026 · 07:30',
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
        timestamp: '26/10/2026 · 19:45',
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
        timestamp: '26/10/2026 · 07:15',
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
        timestamp: '25/10/2026 · 20:00',
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
        timestamp: '24/10/2026 · 08:00',
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
        timestamp: '27/10/2026 · 07:00',
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
        timestamp: '24/10/2026 · 20:00',
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
        timestamp: '26/10/2026 · 19:00',
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
      timestamp: 'Hôm nay · Vừa xong',
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
    toast.success(
      `Đã lưu số đo mới cho ${currentProfile.name} (${sys}/${dia} mmHg). Bác sĩ ${currentProfile.doctorName} đã nhận được cập nhật.`
    );
  };

  // Tính tọa độ SVG cho biểu đồ
  const sysCoords = currentProfile.chartSys.map((val, idx) => {
    const x = 65 + idx * 95;
    const y = Math.round(165 - ((val - 70) / 85) * 135);
    return { x, y, val };
  });

  const diaCoords = currentProfile.chartDia.map((val, idx) => {
    const x = 65 + idx * 95;
    const y = Math.round(165 - ((val - 55) / 85) * 135);
    return { x, y, val };
  });

  return (
    <div className="min-h-full bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CANVAS THOÁNG ĐÃNG ĐỒNG BỘ VỚI /family */}
        <header className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Bảng Sức Khỏe Gia Đình</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">Theo Dõi Sinh Hiệu</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-primary bg-primary/10 border-primary/20">
                  Hộ #FAM-88219
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span>Bác sĩ gia đình theo dõi 24/7</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Sổ Theo Dõi Huyết Áp &amp; Chỉ Số Sức Khỏe
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Theo dõi biến thiên Huyết áp, Đường huyết, Nhịp tim và Oxy máu (SpO2) từng thành viên. Bác sĩ chuyên khoa gia đình trực tiếp đánh giá và phản hồi ngay khi có bất thường.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn & phân cấp chuẩn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="min-h-11 rounded-xl text-sm font-semibold gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add_chart</span>
                <span>Ghi số đo mới</span>
              </Button>

              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-xl text-sm font-medium gap-2"
              >
                <Link href="/family/appointments">
                  <span className="material-symbols-outlined text-[19px] text-primary">stethoscope</span>
                  <span>Hỏi Bác sĩ</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* 2. CHỌN NGƯỜI THÂN ĐỂ XEM CHỈ SỐ (CARD SWITCHER THOÁNG MẮT) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">family_restroom</span>
                <span>Chọn Người Thân Để Xem Biểu Đồ &amp; Nhật Ký Đo</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Bấm vào thành viên để cập nhật biểu đồ phân tích và lịch sử đo
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Đồng bộ máy đo Omron Bluetooth &amp; nhập tay
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {Object.values(membersVitals).map((m) => {
              const isSelected = m.id === selectedMemberId;
              const latest = m.records[0];

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className={`p-5 sm:p-6 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 outline-hidden ${
                    isSelected
                      ? 'border-primary bg-white ring-2 ring-primary/15 shadow-sm'
                      : 'border-slate-200/70 bg-white hover:bg-slate-50/70 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl font-bold text-sm flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-slate-100 text-slate-700 border-slate-200/80'
                      }`}
                    >
                      {getInitials(m.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base text-slate-900 truncate">{m.name}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                        {m.relation} · <span className="tabular-nums">{m.age}</span> tuổi
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {m.alertType === 'warning' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Cần chú ý
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Ổn định
                      </span>
                    )}
                    <span className="text-xs font-bold tabular-nums text-primary">
                      HA: {latest.bpSystolic}/{latest.bpDiastolic}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. BANNER NHẬN ĐỊNH & DẶN DÒ TỪ BÁC SĨ GIA ĐÌNH */}
        <section
          aria-label="Lời dặn bác sĩ gia đình"
          className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all shadow-xs ${
            currentProfile.alertType === 'warning'
              ? 'bg-amber-50/70 border-amber-200/80'
              : 'bg-emerald-50/60 border-emerald-200/80'
          }`}
        >
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                currentProfile.alertType === 'warning'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {currentProfile.alertType === 'warning' ? 'notification_important' : 'verified'}
              </span>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Dặn dò chuyên môn: {currentProfile.doctorName}
              </div>
              <h3
                className={`text-base font-bold text-balance ${
                  currentProfile.alertType === 'warning' ? 'text-amber-950' : 'text-emerald-950'
                }`}
              >
                {currentProfile.alertTitle}
              </h3>
              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  currentProfile.alertType === 'warning' ? 'text-amber-900/90' : 'text-emerald-900/90'
                }`}
              >
                {currentProfile.alertMessage}
              </p>
            </div>
          </div>

          <Link
            href="/family/appointments"
            className={`min-h-10 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shrink-0 text-center transition-all shadow-xs whitespace-nowrap inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              currentProfile.alertType === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200/80'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Tư vấn cùng Bác sĩ</span>
          </Link>
        </section>

        {/* 4. BỐN THẺ CHỈ SỐ SINH HIỆU CHÍNH (AIRY METRIC CARDS) */}
        <section
          aria-label="Chỉ số sinh hiệu đo gần nhất"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          {/* Card 1: Huyết áp */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">vital_signs</span>
                </div>
                <span className="text-xs font-semibold text-slate-600">Huyết áp gần nhất</span>
              </div>
              <span className="text-xs font-medium tabular-nums text-slate-400">mmHg</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
                  {latestRecord.bpSystolic}/{latestRecord.bpDiastolic}
                </span>
                <span className="text-xs text-slate-400 font-medium">SYS/DIA</span>
              </div>
              <div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg inline-block">
                  {currentProfile.bpTarget}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Đường huyết */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">water_drop</span>
                </div>
                <span className="text-xs font-semibold text-slate-600">Đường huyết</span>
              </div>
              <span className="text-xs font-medium tabular-nums text-slate-400">mmol/L</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
                  {latestRecord.glucose}
                </span>
                <span className="text-xs text-slate-400 font-medium">mmol/L</span>
              </div>
              <div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg inline-block">
                  {currentProfile.glucoseTarget}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Nhịp tim */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">favorite</span>
                </div>
                <span className="text-xs font-semibold text-slate-600">Nhịp tim lúc nghỉ</span>
              </div>
              <span className="text-xs font-medium tabular-nums text-slate-400">nhịp/phút</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
                  {latestRecord.heartRate}
                </span>
                <span className="text-xs text-slate-400 font-medium">BPM</span>
              </div>
              <div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg inline-block">
                  Bình thường: 60 - 90 nhịp/phút
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Nồng độ oxy SpO2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">air</span>
                </div>
                <span className="text-xs font-semibold text-slate-600">Oxy máu (SpO2)</span>
              </div>
              <span className="text-xs font-medium tabular-nums text-slate-400">%</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
                  {latestRecord.spo2}%
                </span>
                <span className="text-xs text-slate-400 font-medium">SpO2</span>
              </div>
              <div>
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg inline-block">
                  Rất tốt: &gt;= 96%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. BIỂU ĐỒ XU HƯỚNG HUYẾT ÁP */}
        <section className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/70 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">ssid_chart</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Biểu Đồ Xu Hướng Huyết Áp: {currentProfile.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi tương quan Huyết áp tâm thu (SYS) và tâm trương (DIA) theo ngày
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
              {/* Chú giải màu sắc */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span>Tâm thu (SYS)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Tâm trương (DIA)</span>
                </span>
              </div>

              {/* Bộ chọn kỳ xem biểu đồ */}
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl">
                {[
                  { id: '7d', label: '7 ngày' },
                  { id: '30d', label: '30 ngày' },
                  { id: '90d', label: '3 tháng' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setTimeRange(r.id as '7d' | '30d' | '90d')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      timeRange === r.id
                        ? 'bg-white text-primary shadow-xs'
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
          <div className="w-full overflow-x-auto py-2">
            <svg viewBox="0 0 700 205" className="h-48 w-full sm:h-56">
              {/* Lưới ngang tham chiếu */}
              <line x1="40" y1="30" x2="670" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="34" fontSize="10" fill="#94a3b8" fontWeight="500">
                150
              </text>

              <line x1="40" y1="75" x2="670" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="79" fontSize="10" fill="#94a3b8" fontWeight="500">
                130
              </text>

              <line x1="40" y1="120" x2="670" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="124" fontSize="10" fill="#94a3b8" fontWeight="500">
                90
              </text>

              <line x1="40" y1="165" x2="670" y2="165" stroke="#f1f5f9" strokeWidth="1" />
              <text x="8" y="169" fontSize="10" fill="#94a3b8" fontWeight="500">
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
                strokeDasharray="4 4"
              />
              <text x="665" y="45" fontSize="10" fill="#e11d48" fontWeight="600" textAnchor="end">
                Ngưỡng chú ý: 140 mmHg
              </text>

              {/* Đường biểu diễn Tâm thu (SYS - Primary #0037c1) */}
              <polyline
                fill="none"
                stroke="#0037c1"
                strokeWidth="2.5"
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
                      r={isHigh ? '5.5' : '4.5'}
                      fill={isHigh ? '#fa8c16' : '#0037c1'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      fontSize="10"
                      fontWeight="600"
                      fill={isHigh ? '#d46b08' : '#0037c1'}
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
                    fontWeight="600"
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
                  fontWeight="500"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {d}
                </text>
              ))}
            </svg>
          </div>
        </section>

        {/* 6. NHẬT KÝ CÁC LẦN ĐO CHI TIẾT */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Nhật Ký Các Lần Đo: {currentProfile.name} ({currentProfile.records.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Lưu trữ tự động từ thiết bị Bluetooth và các lần gia đình tự ghi
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="self-start sm:self-auto rounded-xl bg-primary/10 hover:bg-primary/15 text-primary border-primary/20 text-xs font-semibold gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Thêm lần đo</span>
            </Button>
          </div>

          {/* Giao diện Mobile (< md): Danh sách Thẻ Nhật Ký Đo */}
          <div className="md:hidden divide-y divide-slate-100">
            {currentProfile.records.map((rec) => (
              <div key={rec.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold tabular-nums text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">
                      schedule
                    </span>
                    <span>{rec.timestamp}</span>
                  </div>

                  {rec.status === 'normal' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 whitespace-nowrap shrink-0">
                      Bình thường
                    </span>
                  )}
                  {rec.status === 'warning' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap shrink-0">
                      Hơi cao · Chú ý
                    </span>
                  )}
                  {rec.status === 'critical' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap shrink-0">
                      Cần gọi Bác sĩ
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Huyết áp</span>
                    <span className="font-bold tabular-nums text-sm text-primary">
                      {rec.bpSystolic}/{rec.bpDiastolic}{' '}
                      <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Đường huyết</span>
                    <span className="font-bold tabular-nums text-sm text-slate-900">
                      {rec.glucose}{' '}
                      <span className="text-[10px] font-normal text-slate-400">mmol/L</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Nhịp tim</span>
                    <span className="font-semibold tabular-nums text-xs text-slate-800">
                      {rec.heartRate} nhịp/phút
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">Oxy máu (SpO2)</span>
                    <span className="font-semibold tabular-nums text-xs text-emerald-700">
                      {rec.spo2}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    Ghi chú: <strong className="text-slate-700">{rec.notes || '—'}</strong>
                  </span>
                  <span className="text-slate-400">{rec.device}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Giao diện Desktop (>= md): Bảng chuẩn lâm sàng thoáng & đẹp */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px] hover:bg-slate-50/80">
                  <TableHead className="py-3.5 px-6 text-slate-500">Thời điểm &amp; Ghi chú</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Huyết áp (SYS/DIA)</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Đường huyết</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Nhịp tim &amp; SpO2</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Thiết bị ghi nhận</TableHead>
                  <TableHead className="py-3.5 px-6 text-right text-slate-500">Đánh giá</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-slate-800">
                {currentProfile.records.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="py-4 px-6">
                      <div className="font-semibold tabular-nums text-slate-900">{rec.timestamp}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{rec.notes || '—'}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`font-bold tabular-nums text-sm ${
                          rec.status === 'warning' || rec.status === 'critical'
                            ? 'text-amber-800'
                            : 'text-primary'
                        }`}
                      >
                        {rec.bpSystolic}/{rec.bpDiastolic}
                      </span>{' '}
                      <span className="text-[11px] tabular-nums text-slate-400">mmHg</span>
                    </TableCell>
                    <TableCell className="py-4 px-6 whitespace-nowrap">
                      <span className="font-bold tabular-nums text-sm text-slate-900">
                        {rec.glucose}
                      </span>{' '}
                      <span className="text-[11px] tabular-nums text-slate-400">mmol/L</span>
                    </TableCell>
                    <TableCell className="py-4 px-6 whitespace-nowrap">
                      <span className="font-semibold tabular-nums text-slate-800">
                        {rec.heartRate} bpm
                      </span>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="font-semibold tabular-nums text-emerald-700">
                        {rec.spo2}%
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-slate-500 whitespace-nowrap">{rec.device}</TableCell>
                    <TableCell className="py-4 px-6 text-right whitespace-nowrap">
                      {rec.status === 'normal' && (
                        <Badge variant="outline" className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200/80">
                          Bình thường
                        </Badge>
                      )}
                      {rec.status === 'warning' && (
                        <Badge variant="outline" className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border-amber-200/80">
                          Hơi cao · Chú ý
                        </Badge>
                      )}
                      {rec.status === 'critical' && (
                        <Badge variant="outline" className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border-rose-200/80">
                          Cần gọi Bác sĩ
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      {/* MODAL GHI NHẬN SỐ ĐO MỚI */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">add_chart</span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-bold text-base text-white truncate">
                  Ghi Nhận Số Đo Sức Khỏe Mới
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 truncate mt-0.5">
                  Người thân: {currentProfile.name} ({currentProfile.age} tuổi)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddRecord} className="p-6 space-y-4 text-xs">
            {/* Huyết áp SYS / DIA */}
            <div>
              <Label className="block font-semibold text-slate-700 mb-1.5">
                Chỉ số Huyết áp (mmHg) <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    Tâm thu (SYS)
                  </span>
                  <Input
                    type="number"
                    required
                    min={60}
                    max={250}
                    value={newBpSys}
                    onChange={(e) => setNewBpSys(e.target.value)}
                    placeholder="120"
                    className="h-10 rounded-xl bg-slate-50/50 focus:bg-white font-bold tabular-nums text-sm text-slate-900"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">
                    Tâm trương (DIA)
                  </span>
                  <Input
                    type="number"
                    required
                    min={40}
                    max={160}
                    value={newBpDia}
                    onChange={(e) => setNewBpDia(e.target.value)}
                    placeholder="80"
                    className="h-10 rounded-xl bg-slate-50/50 focus:bg-white font-bold tabular-nums text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Đường huyết, Nhịp tim, SpO2 */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <Label className="block font-semibold text-slate-700 mb-1">
                  Đường huyết
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newGlucose}
                  onChange={(e) => setNewGlucose(e.target.value)}
                  placeholder="5.6"
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white font-bold tabular-nums text-xs sm:text-sm text-slate-900"
                />
                <span className="text-[10px] tabular-nums text-slate-400 mt-0.5 block">mmol/L</span>
              </div>
              <div>
                <Label className="block font-semibold text-slate-700 mb-1">
                  Nhịp tim
                </Label>
                <Input
                  type="number"
                  value={newHeartRate}
                  onChange={(e) => setNewHeartRate(e.target.value)}
                  placeholder="75"
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white font-bold tabular-nums text-xs sm:text-sm text-slate-900"
                />
                <span className="text-[10px] tabular-nums text-slate-400 mt-0.5 block">nhịp/phút</span>
              </div>
              <div>
                <Label className="block font-semibold text-slate-700 mb-1">
                  Oxy SpO2
                </Label>
                <Input
                  type="number"
                  value={newSpo2}
                  onChange={(e) => setNewSpo2(e.target.value)}
                  placeholder="98"
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white font-bold tabular-nums text-xs sm:text-sm text-slate-900"
                />
                <span className="text-[10px] tabular-nums text-slate-400 mt-0.5 block">%</span>
              </div>
            </div>

            {/* Thời điểm / Ngữ cảnh đo */}
            <div>
              <Label className="block font-semibold text-slate-700 mb-1.5">
                Thời điểm / Ghi chú lúc đo
              </Label>
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
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <Input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Hoặc tự nhập ghi chú..."
                className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-xs sm:text-sm"
              />
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Lưu số đo</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
