'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  const [vitalsToast, setVitalsToast] = useState<string | null>(null);
  const [showHomeVisitGuide, setShowHomeVisitGuide] = useState(false);
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

    setVitalsToast(
      `Đã ghi nhận số đo mới cho ${currentMember.name}: Huyết áp ${formattedBp} mmHg, Đường huyết ${newGlucose} mmol/L`
    );
    setTimeout(() => setVitalsToast(null), 5000);
    setShowVitalsModal(false);
  };

  const initials = getMemberInitials(currentMember.name);
  const takenCount = currentMember.medicines.filter((m) => m.status === 'taken').length;
  const isWarning = currentMember.status === 'warning';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. THANH ĐIỀU HƯỚNG & CHUYỂN ĐỔI THÀNH VIÊN NHANH (THOÁNG ĐÃNG, KHÔNG KHUNG HỘP NẶNG NỀ) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <nav aria-label="Điều hướng trang" className="flex items-center gap-2 flex-wrap">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#2E37A4] bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Bảng Sức khỏe Gia đình</span>
            </Link>

            <Link
              href="/family/members"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-[#2E37A4] px-3 py-2 rounded-xl hover:bg-slate-100/70 transition-all"
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
                      ? 'bg-[#2E37A4] text-white shadow-xs'
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

        {/* Toast thông báo cập nhật số đo */}
        {vitalsToast && (
          <aside
            role="status"
            aria-live="polite"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between shadow-xs animate-fade-in"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                check_circle
              </span>
              <span>{vitalsToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setVitalsToast(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </aside>
        )}

        {/* 2. PROFILE BANNER THÀNH VIÊN — THIẾT KẾ THOÁNG MẮT, PHÂN TẦNG RÕ RÀNG */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/70 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#2563eb] text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-sm shrink-0">
                {currentMember.avatar || initials}
              </div>

              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-[#2E37A4] bg-blue-50/80 border border-blue-200/70">
                    {currentMember.relation} · <span className="tabular-nums font-bold">{currentMember.age}</span> tuổi
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tabular-nums bg-slate-100 text-slate-700 border border-slate-200/80">
                    Nhóm máu {currentMember.bloodType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
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
                  </span>
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
              <button
                type="button"
                onClick={() => setShowVitalsModal(true)}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[19px]">edit_note</span>
                <span>Ghi số đo mới</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium shadow-xs hover:border-slate-300 transition-all cursor-pointer whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[19px] text-[#2E37A4]">print</span>
                <span>In hồ sơ bệnh án</span>
              </button>
            </div>
          </div>

          {/* Dải thông tin lâm sàng trọng tâm (Bệnh nền, Dị ứng, BHYT) */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#2E37A4] shrink-0">
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
              className="text-xs sm:text-sm font-semibold text-[#2E37A4] hover:text-[#222982] inline-flex items-center gap-1 hover:underline outline-hidden"
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
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 text-[#2E37A4] border border-indigo-100 flex items-center justify-center">
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
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
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
                  className="text-xs font-semibold text-[#2E37A4] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Quản lý lịch hẹn</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>

              {currentMember.upcomingVisit ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[22px] text-[#2E37A4]">
                        {currentMember.upcomingVisit.mode === 'home' ? 'home_health' : 'videocam'}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold text-[#2E37A4] uppercase tracking-wider">
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
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#2E37A4] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
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
                  <Link
                    href="/family/appointments"
                    className="inline-block px-4 py-2 bg-[#2E37A4] text-white text-xs font-semibold rounded-xl"
                  >
                    Đặt lịch khám mới
                  </Link>
                </div>
              )}
            </div>

            {currentMember.upcomingVisit && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <Link
                  href="/family/appointments"
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-center text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[17px]">edit_calendar</span>
                  <span>Đổi ngày giờ</span>
                </Link>
                {currentMember.upcomingVisit.mode === 'home' ? (
                  <button
                    type="button"
                    onClick={() => setShowHomeVisitGuide(true)}
                    className="py-2.5 px-4 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">fact_check</span>
                    <span>Hướng dẫn đón BS</span>
                  </button>
                ) : (
                  <Link
                    href="/family/appointments"
                    className="py-2.5 px-4 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[17px]">videocam</span>
                    <span>Vào phòng Video</span>
                  </Link>
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
                              : 'bg-white border border-slate-200 text-[#2E37A4]'
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
                            : 'bg-white hover:bg-slate-100 text-[#2E37A4] border border-slate-300 shadow-2xs'
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
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
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
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'home_visit', label: 'Khám tại nhà' },
                { id: 'telehealth', label: 'Telehealth' },
                { id: 'lab_result', label: 'Xét nghiệm' },
              ].map((f) => {
                const isActive = ehrFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setEhrFilter(f.id as any)}
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
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#2E37A4] flex items-center justify-center shrink-0">
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
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2E37A4] border border-blue-200/70">
                          {entry.typeLabel}
                        </span>
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
                          <div className="space-y-2">
                            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                              Toa thuốc điều trị chỉ định:
                            </span>
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
      {showHomeVisitGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5 text-[#2E37A4]">
                <span className="material-symbols-outlined text-[24px]">home_health</span>
                <h3 className="font-bold text-base text-slate-900">
                  Hướng Dẫn Đón Bác Sĩ Tại Nhà
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHomeVisitGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-slate-800 space-y-1">
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

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHomeVisitGuide(false)}
                className="w-full py-3 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
              >
                Đã hiểu &amp; Đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GHI NHANH SỐ ĐO SỨC KHỎE */}
      {showVitalsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Ghi Số Đo Mới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentMember.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Huyết áp (mmHg)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Tâm thu (SYS)
                    </span>
                    <input
                      type="number"
                      required
                      min={60}
                      max={250}
                      placeholder="120"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Tâm trương (DIA)
                    </span>
                    <input
                      type="number"
                      required
                      min={40}
                      max={150}
                      placeholder="80"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Đường huyết mao mạch (mmol/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={1}
                  max={30}
                  placeholder="Ví dụ: 5.6"
                  value={newGlucose}
                  onChange={(e) => setNewGlucose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold tabular-nums text-sm bg-white focus:border-[#2E37A4] outline-hidden"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Lưu số đo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
