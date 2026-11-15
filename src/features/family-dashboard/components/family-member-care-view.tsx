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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MOCK_EHR } from '@/features/family-members';

export interface MemberHealthData {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar: string;
  bhyt: string;
  bloodType: string;
  allergies: string;
  chronicCondition: string;
  status: 'good' | 'warning';
  statusText: string;
  bp: string;
  bpStatus: string;
  spo2: string;
  heartRate: string;
  glucose: string;
  glucoseStatus: string;
  lastUpdated: string;
  medicines: {
    id: string;
    name: string;
    dosage: string;
    time: string;
    status: 'taken' | 'pending';
  }[];
  upcomingVisit?: {
    doctor: string;
    specialty: string;
    hospital: string;
    time: string;
    date: string;
    mode: 'home' | 'telehealth';
    note: string;
  };
}

export const INITIAL_FAMILY_MEMBERS_DATA: Record<string, MemberHealthData> = {
  'mem-01': {
    id: 'mem-01',
    name: 'Nguyễn Văn Phúc',
    relation: 'Ông nội (Chủ hộ)',
    age: 78,
    avatar: '👨‍🦳',
    bhyt: 'HT2790129381102',
    bloodType: 'O+',
    allergies: 'Dị ứng Penicillin, Hải sản vỏ cứng',
    chronicCondition: 'Tăng huyết áp • Đái tháo đường Typ 2',
    status: 'warning',
    statusText: 'Huyết áp cần chú ý nhẹ',
    bp: '135/85',
    bpStatus: 'Hơi cao • Cần uống thuốc đều',
    spo2: '98%',
    heartRate: '76 lần/phút',
    glucose: '6.8 mmol/L',
    glucoseStatus: 'Ổn định sau ăn',
    lastUpdated: '07:30 Sáng hôm nay',
    medicines: [
      {
        id: 'med-1',
        name: 'Amlodipine 5mg (Hạ huyết áp)',
        dosage: '1 viên nén • Uống sau ăn sáng',
        time: '08:00 Sáng mỗi ngày',
        status: 'taken',
      },
      {
        id: 'med-2',
        name: 'Metformin 500mg (Đường huyết)',
        dosage: '1 viên • Uống ngay sau bữa tối',
        time: '19:00 Tối mỗi ngày',
        status: 'pending',
      },
    ],
    upcomingVisit: {
      doctor: 'PGS.TS Nguyễn Trọng Nghĩa',
      specialty: 'Bác sĩ Gia đình & Tim mạch',
      hospital: 'BV Đại học Y Dược TP.HCM',
      date: 'Thứ Hai, 27/10/2026',
      time: '09:30 Sáng',
      mode: 'home',
      note: 'Khám định kỳ tại nhà: đo điện tim ECG và lấy máu xét nghiệm đường huyết.',
    },
  },
  'mem-02': {
    id: 'mem-02',
    name: 'Trần Thị Mai',
    relation: 'Vợ (Mẹ)',
    age: 42,
    avatar: '👩',
    bhyt: 'GD4790883719204',
    bloodType: 'A+',
    allergies: 'Không có tiền sử dị ứng',
    chronicCondition: 'Theo dõi sức khỏe định kỳ',
    status: 'good',
    statusText: 'Sức khỏe rất tốt',
    bp: '115/75',
    bpStatus: 'Huyết áp lý tưởng',
    spo2: '99%',
    heartRate: '72 lần/phút',
    glucose: '5.2 mmol/L',
    glucoseStatus: 'Bình thường',
    lastUpdated: '07:00 Sáng hôm nay',
    medicines: [
      {
        id: 'med-3',
        name: 'Canxi & Vitamin D3 hữu cơ',
        dosage: '1 viên nang mềm • Uống cùng nhiều nước',
        time: '08:30 Sau bữa sáng',
        status: 'taken',
      },
    ],
    upcomingVisit: {
      doctor: 'ThS.BS Võ Thị Phương Thảo',
      specialty: 'Tư vấn Sản Phụ Khoa',
      hospital: 'BV Từ Dũ',
      date: 'Thứ Bảy, 08/11/2026',
      time: '14:00 Chiều',
      mode: 'telehealth',
      note: 'Tư vấn trực tuyến qua video Telehealth định kỳ 6 tháng.',
    },
  },
  'mem-03': {
    id: 'mem-03',
    name: 'Nguyễn Minh Quân',
    relation: 'Con trai',
    age: 12,
    avatar: '👦',
    bhyt: 'TE1792014992811',
    bloodType: 'O+',
    allergies: 'Viêm mũi dị ứng khi thời tiết lạnh',
    chronicCondition: 'Theo dõi hô hấp & dinh dưỡng trẻ em',
    status: 'good',
    statusText: 'Khỏe mạnh, năng động',
    bp: '105/65',
    bpStatus: 'Chuẩn lứa tuổi',
    spo2: '100%',
    heartRate: '82 lần/phút',
    glucose: '4.8 mmol/L',
    glucoseStatus: 'Bình thường',
    lastUpdated: '06:45 Sáng hôm nay',
    medicines: [
      {
        id: 'med-4',
        name: 'Xịt mũi thảo dược FamiCare',
        dosage: 'Xịt mỗi bên mũi 1 nhát',
        time: 'Buổi sáng & tối khi trời lạnh',
        status: 'taken',
      },
    ],
    upcomingVisit: {
      doctor: 'BS.CKII Trần Mai Phương',
      specialty: 'Chuyên gia Nhi & Dinh dưỡng',
      hospital: 'BV Nhi Đồng 1',
      date: 'Thứ Tư, 29/10/2026',
      time: '19:30 Tối',
      mode: 'telehealth',
      note: 'Tư vấn phác đồ dinh dưỡng và dị ứng hô hấp trẻ nhỏ.',
    },
  },
};

export function getMemberInitials(name: string): string {
  return name
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function FamilyMemberCareView({ memberId }: { memberId: string }) {
  const [membersData, setMembersData] = useState<Record<string, MemberHealthData>>(
    INITIAL_FAMILY_MEMBERS_DATA
  );
  const currentMember = membersData[memberId] || membersData['mem-01'];
  const activeId = currentMember.id;

  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [newGlucose, setNewGlucose] = useState('5.6');
  const [showHomeVisitGuide, setShowHomeVisitGuide] = useState(false);
  const [showPrescriptionQrModal, setShowPrescriptionQrModal] = useState<string | null>(null);
  const [ehrFilter, setEhrFilter] = useState<'all' | 'home_visit' | 'telehealth' | 'lab_result'>('all');
  const [expandedEhrId, setExpandedEhrId] = useState<string | null>('ehr-01');

  const ehrList = MOCK_EHR[activeId] || [];
  const filteredEhr = ehrList.filter((item) => {
    if (ehrFilter === 'all') return true;
    return item.type === ehrFilter;
  });

  const toggleMedicineStatus = (medId: string) => {
    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[activeId] };
      member.medicines = member.medicines.map((m) =>
        m.id === medId
          ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' }
          : m
      );
      updated[activeId] = member;
      return updated;
    });
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = Number(bpSystolic) || 120;
    const dia = Number(bpDiastolic) || 80;
    const glu = Number(newGlucose) || 5.6;
    const formattedBp = `${sys}/${dia}`;
    const isBpHigh = sys >= 135 || dia >= 85;
    const isGluHigh = glu >= 7.0;

    setMembersData((prev) => {
      const updated = { ...prev };
      const member = { ...updated[activeId] };
      member.bp = formattedBp;
      member.bpStatus = isBpHigh ? 'Hơi cao • Cần uống thuốc đều' : 'Huyết áp ổn định';
      member.glucose = `${glu} mmol/L`;
      member.glucoseStatus = isGluHigh ? 'Cao nhẹ • Cần theo dõi' : 'Bình thường';
      member.status = isBpHigh || isGluHigh ? 'warning' : 'good';
      member.statusText =
        isBpHigh || isGluHigh
          ? 'Chỉ số sinh hiệu cần chú ý theo dõi'
          : 'Các chỉ số sinh hiệu ổn định';
      member.lastUpdated = 'Vừa cập nhật xong';
      updated[activeId] = member;
      return updated;
    });

    toast.success(
      `Đã ghi nhận số đo mới cho ${currentMember.name}: Huyết áp ${formattedBp} mmHg, Đường huyết ${newGlucose} mmol/L`
    );
    setShowVitalsModal(false);
  };

  const initials = getMemberInitials(currentMember.name);
  const takenCount = currentMember.medicines.filter((m) => m.status === 'taken').length;
  const isWarning = currentMember.status === 'warning';

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. THANH ĐIỀU HƯỚNG & CHUYỂN ĐỔI THÀNH VIÊN NHANH (THOÁNG ĐÃNG, KHÔNG KHUNG HỘP NẶNG NỀ) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <nav aria-label="Điều hướng trang" className="flex items-center gap-2 flex-wrap">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Bảng Sức khỏe Gia đình</span>
            </Link>

            <Link
              href="/family/members"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-primary px-3 py-2 rounded-xl hover:bg-slate-100/70 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Sổ Quản lý thành viên &amp; BHYT</span>
            </Link>
          </nav>

          {/* Quick Family Switcher */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            {Object.values(membersData).map((m) => {
              const isCurrent = m.id === activeId;
              const hasWarn = m.status === 'warning';
              return (
                <Link
                  key={m.id}
                  href={`/family/members/${m.id}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      hasWarn
                        ? 'bg-amber-400'
                        : isCurrent
                        ? 'bg-emerald-300'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{m.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 2. PROFILE BANNER THÀNH VIÊN — THIẾT KẾ THOÁNG MẮT, PHÂN TẦNG RÕ RÀNG */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/70 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0037c1] to-[#1d4ed8] text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-sm shrink-0">
                {currentMember.avatar || initials}
              </div>

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold text-primary bg-primary/10 border-primary/20">
                    {currentMember.relation} · <span className="tabular-nums font-bold">{currentMember.age}</span> tuổi
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 rounded-full text-xs font-bold tabular-nums bg-slate-100 text-slate-700 border border-slate-200/80">
                    Nhóm máu {currentMember.bloodType}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      isWarning
                        ? 'bg-amber-50 text-amber-800 border-amber-200/90'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/90'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isWarning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    <span>{currentMember.statusText}</span>
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Chăm Sóc Hằng Ngày: {currentMember.name}
                </h1>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Theo dõi sinh hiệu, nhắc lịch uống thuốc và lịch khám bác sĩ gia đình · Cập nhật: {currentMember.lastUpdated}
                </p>
              </div>
            </div>

            {/* Cụm nút hành động chính */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                type="button"
                onClick={() => setShowVitalsModal(true)}
                className="min-h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2"
              >
                <span className="material-symbols-outlined text-[19px]">edit_note</span>
                <span>Ghi số đo mới</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="min-h-11 rounded-xl text-xs sm:text-sm font-medium gap-2"
              >
                <span className="material-symbols-outlined text-[19px] text-primary">print</span>
                <span>In hồ sơ bệnh án</span>
              </Button>
            </div>
          </div>

          {/* Dải thông tin lâm sàng trọng tâm (Bệnh nền, Dị ứng, BHYT) */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
                medical_information
              </span>
              <div className="min-w-0">
                <span className="text-slate-500 block text-[11px]">Bệnh lý theo dõi</span>
                <strong className="text-slate-900 font-semibold truncate block mt-0.5">
                  {currentMember.chronicCondition}
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0">
                warning
              </span>
              <div className="min-w-0">
                <span className="text-amber-800 block text-[11px] font-medium">Tiền sử dị ứng</span>
                <strong className="text-amber-950 font-semibold truncate block mt-0.5">
                  {currentMember.allergies}
                </strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">
                badge
              </span>
              <div className="min-w-0">
                <span className="text-slate-500 block text-[11px]">Thẻ BHYT đăng ký</span>
                <strong className="text-slate-900 font-bold tabular-nums truncate block mt-0.5">
                  {currentMember.bhyt}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* 3. KHỐI 4 CHỈ SỐ SINH HIỆU HÔM NAY — BỐ CỤC THOÁNG ĐÃNG, RÕ RÀNG */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Chỉ Số Sinh Hiệu Hôm Nay
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Đo lường từ thiết bị gia đình &amp; sổ theo dõi lâm sàng của {currentMember.name}
              </p>
            </div>

            <Link
              href="/family/vitals"
              className="text-xs sm:text-sm font-semibold text-primary hover:opacity-80 inline-flex items-center gap-1 hover:underline outline-hidden"
            >
              <span>Xem biểu đồ xu hướng &amp; lịch sử đo</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Huyết Áp */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">vital_signs</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Huyết áp</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">mmHg</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
                      isWarning ? 'text-amber-800' : 'text-slate-900'
                    }`}
                  >
                    {currentMember.bp}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">SYS/DIA</span>
                </div>
                <div className="mt-2.5">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border ${
                      isWarning
                        ? 'text-amber-800 bg-amber-50 border-amber-200/90'
                        : 'text-emerald-800 bg-emerald-50 border-emerald-200/90'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span>{currentMember.bpStatus}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Oxy máu SpO2 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">air</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Oxy máu (SpO2)</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">%</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
                    {currentMember.spo2}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">SpO2</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Bão hòa oxy tốt (≥ 95%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Nhịp Tim */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">favorite</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Nhịp tim</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">BPM</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
                    {currentMember.heartRate.split(' ')[0]}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">nhịp/phút</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Nhịp xoang đều ổn định</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Đường Huyết */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[19px]">water_drop</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Đường huyết</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">mmol/L</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
                    {currentMember.glucose.split(' ')[0]}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">mmol/L</span>
                </div>
                <div className="mt-2.5">
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{currentMember.glucoseStatus}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LƯỚI 2 CỘT: LỊCH HẸN KHÁM SẮP TỚI & LỊCH DÙNG THUỐC HÔM NAY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Cột 1: Lịch Hẹn Khám Sắp Tới */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">event_available</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900">
                      Lịch Hẹn Khám Sắp Tới
                    </h2>
                    <p className="text-xs text-slate-500">
                      Lịch trình thăm khám của {currentMember.name}
                    </p>
                  </div>
                </div>

                <Link
                  href="/family/appointments"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Quản lý lịch hẹn</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>

              {currentMember.upcomingVisit ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[22px] text-primary">
                        {currentMember.upcomingVisit.mode === 'home' ? 'home_health' : 'videocam'}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold text-primary uppercase tracking-wider">
                          {currentMember.upcomingVisit.mode === 'home'
                            ? 'Khám bác sĩ tại nhà'
                            : 'Tư vấn Telehealth Video'}
                        </div>
                        <div className="font-bold tabular-nums text-sm sm:text-base text-slate-900 mt-0.5">
                          {currentMember.upcomingVisit.time} · {currentMember.upcomingVisit.date}
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>Đã xác nhận</span>
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <span className="material-symbols-outlined text-[19px]">stethoscope</span>
                    </div>
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="font-bold text-slate-900 text-sm">
                        {currentMember.upcomingVisit.doctor}
                      </div>
                      <div className="text-slate-600 font-medium">
                        {currentMember.upcomingVisit.specialty} ·{' '}
                        <span className="text-slate-900 font-semibold">
                          {currentMember.upcomingVisit.hospital}
                        </span>
                      </div>
                      <div className="text-slate-600 pt-2 border-t border-slate-200/60 leading-relaxed">
                        <strong className="text-slate-800">Nội dung khám: </strong>
                        <span>{currentMember.upcomingVisit.note}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-50/70 border border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Chưa có lịch hẹn nào sắp tới cho {currentMember.name}.
                  </p>
                  <Button asChild size="sm" className="rounded-xl text-xs font-semibold">
                    <Link href="/family/appointments">Đặt lịch khám mới</Link>
                  </Button>
                </div>
              )}
            </div>

            {currentMember.upcomingVisit && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <Button asChild variant="outline" className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                  <Link href="/family/appointments">
                    <span className="material-symbols-outlined text-[17px]">edit_calendar</span>
                    <span>Đổi ngày giờ</span>
                  </Link>
                </Button>
                {currentMember.upcomingVisit.mode === 'home' ? (
                  <Button
                    type="button"
                    onClick={() => setShowHomeVisitGuide(true)}
                    className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[17px]">fact_check</span>
                    <span>Hướng dẫn đón BS</span>
                  </Button>
                ) : (
                  <Button asChild className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5">
                    <Link href="/family/appointments">
                      <span className="material-symbols-outlined text-[17px]">videocam</span>
                      <span>Vào phòng Video</span>
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </section>

          {/* Cột 2: Lịch Dùng Thuốc Hôm Nay */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-xs flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">medication</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900">
                      Lịch Dùng Thuốc Hôm Nay
                    </h2>
                    <p className="text-xs text-slate-500">
                      Đơn thuốc điều trị đang áp dụng cho {currentMember.name}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums bg-slate-100 text-slate-700 shrink-0">
                  Đã dùng {takenCount}/{currentMember.medicines.length}
                </span>
              </div>

              <div className="space-y-3">
                {currentMember.medicines.map((med) => {
                  const isTaken = med.status === 'taken';
                  return (
                    <div
                      key={med.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        isTaken
                          ? 'bg-emerald-50/50 border-emerald-200/90'
                          : 'bg-slate-50/70 border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-white border border-slate-200 text-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isTaken ? 'check' : 'medication'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-slate-900 truncate">
                            {med.name}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">{med.dosage}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-slate-400">
                              schedule
                            </span>
                            <span>{med.time}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-pressed={isTaken}
                        onClick={() => toggleMedicineStatus(med.id)}
                        className={`min-h-9 px-4 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer whitespace-nowrap outline-hidden ${
                          isTaken
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90'
                            : 'bg-white hover:bg-slate-100 text-primary border border-slate-300 shadow-2xs'
                        }`}
                      >
                        {isTaken ? 'Đã uống' : 'Bấm đã uống'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">
                  verified
                </span>
                <span>Đơn thuốc điện tử ký số bởi Bác sĩ gia đình</span>
              </span>
              <span className="font-medium text-slate-600">
                Hiệu lực theo hồ sơ khám
              </span>
            </div>
          </section>
        </div>

        {/* 5. LỊCH SỬ KHÁM BỆNH & BỆNH ÁN ĐIỆN TỬ (EHR) — THIẾT KẾ PHẲNG, TINH TẾ */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          {/* Header + Bộ lọc trên 1 thanh thoáng đãng */}
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">history_edu</span>
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg text-slate-900">
                  Lịch Sử Khám Bệnh &amp; Xét Nghiệm ({filteredEhr.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dòng thời gian bệnh án điện tử EHR đồng bộ chuẩn Bộ Y Tế
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
              {([
                { id: 'all', label: 'Tất cả' },
                { id: 'home_visit', label: 'Khám tại nhà' },
                { id: 'telehealth', label: 'Telehealth' },
                { id: 'lab_result', label: 'Xét nghiệm' },
              ] as const).map((f) => {
                const isActive = ehrFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEhrFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh sách các lần khám */}
          {filteredEhr.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">folder_off</span>
              <p className="text-xs text-slate-500">Chưa có hồ sơ khám bệnh nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEhr.map((entry) => {
                const isExpanded = expandedEhrId === entry.id;
                return (
                  <div key={entry.id} className="p-5 sm:p-6 transition-colors hover:bg-slate-50/50">
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedEhrId(isExpanded ? null : entry.id)}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {entry.type === 'home_visit'
                              ? 'home_health'
                              : entry.type === 'telehealth'
                              ? 'videocam'
                              : 'biotech'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900 truncate">
                              {entry.diagnosis}
                            </span>
                            <span className="text-xs font-bold tabular-nums text-slate-500">
                              (ICD-10: {entry.icd10})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">{entry.doctorName}</span> · {entry.hospital} · <span className="tabular-nums">{entry.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                          {entry.typeLabel}
                        </Badge>
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Chi tiết đợt khám (Khi mở rộng) */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 text-xs leading-relaxed animate-fade-in">
                        {/* Ghi chú bác sĩ */}
                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                          <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                            Lời dặn &amp; Ghi chú lâm sàng của Bác sĩ:
                          </span>
                          <p className="text-slate-800 text-sm leading-relaxed">{entry.doctorNotes}</p>
                        </div>

                        {/* Chỉ số sinh hiệu lúc khám */}
                        {entry.vitalSigns && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/60">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Huyết áp lúc khám:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.bp} mmHg
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Nhịp tim:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.heartRate}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">SpO2:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.spo2}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Cân nặng:</span>
                              <strong className="font-bold tabular-nums text-sm text-slate-900">
                                {entry.vitalSigns.weight}
                              </strong>
                            </div>
                          </div>
                        )}

                        {/* Đơn thuốc điều trị */}
                        {entry.prescriptions && entry.prescriptions.length > 0 && (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                                Toa thuốc điều trị chỉ định (Mã đơn quốc gia: <span className="text-primary font-bold tabular-nums">RX-2026-0088219</span>):
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  <span className="material-symbols-outlined text-[13px]">verified</span>
                                  Đã ký số Viettel-CA
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  onClick={() => setShowPrescriptionQrModal(entry.id)}
                                  className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 border-primary/20 rounded-xl gap-1"
                                  title="Xem mã QR để mang ra quầy thuốc mua"
                                >
                                  <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                                  <span>Mã QR Đơn Thuốc</span>
                                </Button>
                              </div>
                            </div>
                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white p-3 space-y-2">
                              {entry.prescriptions.map((rx, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                                >
                                  <strong className="text-slate-900 font-semibold">{rx.name}</strong>
                                  <span className="text-slate-600">
                                    Liều: <strong className="text-slate-800">{rx.dosage}</strong> · {rx.frequency} ({rx.duration})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: HƯỚNG DẪN ĐÓN BÁC SĨ TẠI NHÀ */}
      <Dialog open={showHomeVisitGuide} onOpenChange={setShowHomeVisitGuide}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-7 space-y-4">
          <DialogHeader className="border-b border-slate-100 pb-3.5">
            <DialogTitle className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
              <span className="material-symbols-outlined text-[24px] text-primary">home_health</span>
              <span>Hướng Dẫn Đón Bác Sĩ Tại Nhà</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-slate-800 space-y-1">
              <div><strong>Bác sĩ phụ trách:</strong> PGS.TS Nguyễn Trọng Nghĩa</div>
              <div>
                <strong>Thời gian dự kiến:</strong> {currentMember.upcomingVisit?.time} ·{' '}
                {currentMember.upcomingVisit?.date}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 text-sm">Gia đình vui lòng chuẩn bị trước:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Căn cước công dân và thẻ BHYT của người bệnh ({currentMember.name}).</li>
                <li>Các toa thuốc đang uống hoặc kết quả khám trong 3 tháng gần nhất.</li>
                <li>Không ăn sáng nếu có chỉ định lấy máu xét nghiệm đường huyết/mỡ máu.</li>
                <li>Chuẩn bị khu vực khám thoáng mát, đủ ánh sáng và một ly nước ấm.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => setShowHomeVisitGuide(false)}
              className="w-full py-3 h-auto rounded-xl font-semibold text-xs sm:text-sm"
            >
              Đã hiểu &amp; Đóng hướng dẫn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: GHI NHANH SỐ ĐO SỨC KHỎE */}
      <Dialog open={showVitalsModal} onOpenChange={setShowVitalsModal}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-6 space-y-4">
          <DialogHeader className="border-b border-slate-100 pb-3.5">
            <DialogTitle className="font-bold text-base text-slate-900">
              Ghi Số Đo Mới
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {currentMember.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
            <div>
              <Label className="block font-semibold text-slate-700 mb-1.5">
                Huyết áp (mmHg)
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Tâm thu (SYS)
                  </span>
                  <Input
                    type="number"
                    required
                    min={60}
                    max={250}
                    placeholder="120"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="h-10 rounded-xl font-bold tabular-nums text-sm bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">
                    Tâm trương (DIA)
                  </span>
                  <Input
                    type="number"
                    required
                    min={40}
                    max={150}
                    placeholder="80"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    className="h-10 rounded-xl font-bold tabular-nums text-sm bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="block font-semibold text-slate-700 mb-1.5">
                Đường huyết mao mạch (mmol/L)
              </Label>
              <Input
                type="number"
                step="0.1"
                required
                min={1}
                max={30}
                placeholder="Ví dụ: 5.6"
                value={newGlucose}
                onChange={(e) => setNewGlucose(e.target.value)}
                className="h-10 rounded-xl font-bold tabular-nums text-sm bg-white"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVitalsModal(false)}
                className="flex-1 rounded-xl font-semibold"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl font-semibold"
              >
                Lưu số đo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: MÃ QR ĐƠN THUỐC QUỐC GIA (THÔNG TƯ 04/2022/TT-BYT) */}
      <Dialog
        open={Boolean(showPrescriptionQrModal)}
        onOpenChange={(open) => !open && setShowPrescriptionQrModal(null)}
      >
        <DialogContent className="sm:max-w-md rounded-3xl p-6 sm:p-7 space-y-4">
          <DialogHeader className="border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
              </div>
              <div>
                <DialogTitle className="font-bold text-base text-slate-900">
                  Đơn Thuốc Điện Tử Quốc Gia
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Mã liên thông: <span className="font-bold tabular-nums text-primary">RX-2026-0088219</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* QR Code Container */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center space-y-3">
            <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl border-2 border-primary/20 shadow-xs flex flex-col items-center justify-center">
              {/* Visual SVG QR Representation */}
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <rect width="100" height="100" fill="white" />
                <path
                  d="M10 10h28v28h-28z M16 16v16h16v-16z M62 10h28v28h-28z M68 16v16h16v-16z M10 62h28v28h-28z M16 68v16h16v-16z"
                  fill="#0037c1"
                />
                <rect x="22" y="22" width="4" height="4" fill="#0037c1" />
                <rect x="74" y="22" width="4" height="4" fill="#0037c1" />
                <rect x="22" y="74" width="4" height="4" fill="#0037c1" />
                <rect x="44" y="10" width="8" height="8" fill="#0037c1" />
                <rect x="44" y="24" width="8" height="8" fill="#0037c1" />
                <rect x="44" y="38" width="8" height="8" fill="#0037c1" />
                <rect x="10" y="44" width="8" height="8" fill="#0037c1" />
                <rect x="24" y="44" width="8" height="8" fill="#0037c1" />
                <rect x="62" y="44" width="12" height="6" fill="#0037c1" />
                <rect x="80" y="44" width="10" height="6" fill="#0037c1" />
                <rect x="44" y="62" width="8" height="8" fill="#0037c1" />
                <rect x="44" y="76" width="8" height="8" fill="#0037c1" />
                <rect x="62" y="62" width="8" height="8" fill="#0037c1" />
                <rect x="76" y="62" width="14" height="8" fill="#0037c1" />
                <rect x="62" y="76" width="14" height="8" fill="#0037c1" />
                <rect x="82" y="86" width="8" height="4" fill="#0037c1" />
              </svg>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cổng Đơn Thuốc Quốc Gia (Bộ Y Tế)
              </span>
              <p className="text-xs text-slate-600 leading-snug">
                Quét mã QR tại bất kỳ quầy thuốc GPP trên toàn quốc (Long Châu, An Khang, Pharmacity...) để mua đúng thuốc theo phác đồ bác sĩ.
              </p>
            </div>
          </div>

          {/* Verification Metadata */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Bác sĩ ký số:</span>
              <span className="font-semibold text-slate-800">PGS.TS Nguyễn Trọng Nghĩa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chứng thư số:</span>
              <span className="font-bold text-emerald-700">Viettel-CA (SHA-256)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thời hạn mua thuốc:</span>
              <span className="font-bold tabular-nums text-slate-800">30 ngày kể từ ngày ký</span>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="flex-col sm:flex-row gap-2.5 pt-2">
            <Button
              type="button"
              onClick={() => {
                toast.success('Đã gửi yêu cầu cấp phát & giao thuốc tận nhà (2h) tới nhà thuốc liên kết GPP!');
                setShowPrescriptionQrModal(null);
              }}
              className="flex-1 rounded-xl font-bold text-xs gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              <span>Yêu Cầu Giao Thuốc Tận Nhà</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPrescriptionQrModal(null)}
              className="rounded-xl font-semibold text-xs"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
