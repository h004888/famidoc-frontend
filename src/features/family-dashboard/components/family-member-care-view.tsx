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
    lastUpdated: '19:30 Hôm qua',
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. THANH ĐIỀU HƯỚNG QUAY LẠI & CHUYỂN NHANH THÀNH VIÊN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/family/members"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#2E37A4] bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Quản lý Thành viên</span>
            </Link>

            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#2E37A4] bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">family_restroom</span>
              <span>Bảng Sức khỏe Gia đình</span>
            </Link>
          </div>

          {/* Chuyển nhanh giữa các thành viên */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs overflow-x-auto">
            {Object.values(membersData).map((m) => {
              const isCurrent = m.id === activeId;
              return (
                <Link
                  key={m.id}
                  href={`/family/members/${m.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isCurrent
                      ? 'bg-[#2E37A4] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      m.status === 'warning'
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

        {/* Toast thông báo cập nhật chỉ số */}
        {vitalsToast && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2"
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
              className="text-emerald-700 hover:text-emerald-900 p-1"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. BANNER THÔNG TIN THÀNH VIÊN & LỐI TẮT HÀNH ĐỘNG */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#2E37A4] to-[#00D3C7] text-white font-extrabold text-lg sm:text-xl flex items-center justify-center shadow-md ring-4 ring-[#2E37A4]/10 shrink-0">
                {initials}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#2E37A4] border border-blue-200/80">
                    {currentMember.relation} • {currentMember.age} tuổi
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                    Nhóm máu {currentMember.bloodType}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                      currentMember.status === 'warning'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentMember.status === 'warning'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {currentMember.statusText}
                  </span>
                </div>

                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Chăm Sóc Hằng Ngày: {currentMember.name}
                </h1>

                <p className="text-xs text-slate-500">
                  Theo dõi <strong>Chỉ số sức khỏe</strong>, <strong>Lịch hẹn khám</strong> và{' '}
                  <strong>Lịch dùng thuốc hôm nay</strong> • Cập nhật: {currentMember.lastUpdated}
                </p>
              </div>
            </div>

            {/* Cụm nút hành động của thành viên */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowVitalsModal(true)}
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Ghi số đo mới</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-blue-50/80 hover:bg-blue-100 text-[#2E37A4] border border-blue-200/80 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>In hồ sơ bệnh án</span>
              </button>
            </div>
          </div>

          {/* Tóm tắt bệnh nền & dị ứng dưới chân Banner */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-[#2E37A4]">
                medical_information
              </span>
              <span className="text-slate-500">Bệnh lý theo dõi:</span>
              <strong className="text-slate-800 truncate">{currentMember.chronicCondition}</strong>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-amber-600">warning</span>
              <span className="text-slate-500">Dị ứng:</span>
              <strong className="text-slate-800 truncate">{currentMember.allergies}</strong>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-emerald-600">badge</span>
              <span className="text-slate-500">Mã BHYT:</span>
              <strong className="text-slate-800 font-mono">{currentMember.bhyt}</strong>
            </div>
          </div>
        </div>

        {/* 3. KHỐI CHỈ SỐ SỨC KHỎE HÔM NAY */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">monitor_heart</span>
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  1. Chỉ Số Sức Khỏe Hôm Nay
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số đo đồng bộ từ thiết bị y tế gia đình &amp; sổ theo dõi mạn tính
                </p>
              </div>
            </div>

            <Link
              href="/family/vitals"
              className="self-start sm:self-auto text-xs font-bold text-[#2E37A4] hover:underline inline-flex items-center gap-1"
            >
              <span>Xem biểu đồ xu hướng &amp; lịch sử đo</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>

          {/* 4 Cards Chỉ Số Sinh Hiệu Chuẩn Lâm Sàng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Huyết Áp */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">vital_signs</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Huyết áp</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">mmHg</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {currentMember.bp}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">SYS/DIA</span>
                </div>
                <div className="mt-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 border ${
                      currentMember.status === 'warning'
                        ? 'text-amber-700 bg-amber-50 border-amber-200/80'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentMember.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                    {currentMember.bpStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Oxy SpO2 */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3">
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
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {currentMember.spo2}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">SpO2</span>
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Bão hòa oxy tốt (≥ 95%)
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Nhịp Tim */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">favorite</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700">Nhịp tim</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">nhịp/phút</span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {currentMember.heartRate.split(' ')[0]}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">BPM</span>
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Nhịp xoang đều ổn định
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Đường Huyết */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between gap-3">
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
                  <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                    {currentMember.glucose.split(' ')[0]}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">mmol/L</span>
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {currentMember.glucoseStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LỊCH HẸN KHÁM SẮP TỚI & LỊCH DÙNG THUỐC HÔM NAY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Cột 1: Lịch Hẹn Khám Sắp Tới */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">event_available</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-sm sm:text-base text-slate-900">
                      2. Lịch Hẹn Khám Sắp Tới
                    </h2>
                    <p className="text-xs text-slate-500">
                      Lịch trình thăm khám của {currentMember.name}
                    </p>
                  </div>
                </div>
                <Link
                  href="/family/appointments"
                  className="text-xs font-bold text-[#2E37A4] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Quản lý lịch hẹn</span>
                  <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                </Link>
              </div>

              {currentMember.upcomingVisit ? (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">
                        {currentMember.upcomingVisit.mode === 'home' ? 'home_health' : 'videocam'}
                      </span>
                      <div>
                        <div className="text-[11px] font-bold text-[#2E37A4] uppercase tracking-wider">
                          {currentMember.upcomingVisit.mode === 'home'
                            ? 'Khám bác sĩ tại nhà'
                            : 'Tư vấn Telehealth Video'}
                        </div>
                        <div className="font-extrabold text-sm sm:text-base text-slate-900">
                          {currentMember.upcomingVisit.time} • {currentMember.upcomingVisit.date}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Đã xác nhận
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-[#2E37A4] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                    </div>
                    <div className="space-y-1 text-xs min-w-0">
                      <div className="font-bold text-slate-900 text-sm">
                        {currentMember.upcomingVisit.doctor}
                      </div>
                      <div className="text-slate-600 font-medium">
                        {currentMember.upcomingVisit.specialty} •{' '}
                        <span className="text-slate-800 font-semibold">
                          {currentMember.upcomingVisit.hospital}
                        </span>
                      </div>
                      <div className="text-slate-500 pt-1 border-t border-slate-200/60 leading-relaxed">
                        <span className="font-semibold text-slate-700">Nội dung khám: </span>
                        {currentMember.upcomingVisit.note}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Chưa có lịch hẹn nào sắp tới cho {currentMember.name}.
                  </p>
                  <Link
                    href="/family/appointments"
                    className="inline-block px-4 py-2 bg-[#2E37A4] text-white text-xs font-bold rounded-xl"
                  >
                    Đặt lịch khám mới
                  </Link>
                </div>
              )}
            </div>

            {currentMember.upcomingVisit && (
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
                <Link
                  href="/family/appointments"
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                  <span>Đổi ngày giờ</span>
                </Link>
                {currentMember.upcomingVisit.mode === 'home' ? (
                  <button
                    type="button"
                    onClick={() => setShowHomeVisitGuide(true)}
                    className="py-2.5 px-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">fact_check</span>
                    <span>Hướng dẫn đón BS</span>
                  </button>
                ) : (
                  <Link
                    href="/family/appointments"
                    className="py-2.5 px-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">videocam</span>
                    <span>Vào phòng Video</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Cột 2: Lịch Dùng Thuốc Hôm Nay */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">medication</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-sm sm:text-base text-slate-900">
                      3. Lịch Dùng Thuốc Hôm Nay
                    </h2>
                    <p className="text-xs text-slate-500">
                      Đơn thuốc đang áp dụng cho {currentMember.name}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 shrink-0">
                  Đã dùng {takenCount}/{currentMember.medicines.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {currentMember.medicines.map((med) => {
                  const isTaken = med.status === 'taken';
                  return (
                    <div
                      key={med.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isTaken
                          ? 'bg-emerald-50/40 border-emerald-200/90'
                          : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-white border border-slate-200 text-[#2E37A4]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isTaken ? 'check_circle' : 'pill'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {med.name}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{med.dosage}</div>
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
                        title={
                          isTaken
                            ? 'Bấm để đổi lại thành chưa dùng'
                            : 'Bấm để xác nhận đã dùng thuốc'
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                          isTaken
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white border border-[#2E37A4]/30 hover:border-[#2E37A4] shadow-2xs'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isTaken ? 'done_all' : 'radio_button_unchecked'}
                        </span>
                        <span>{isTaken ? 'Đã dùng' : 'Bấm đã dùng'}</span>
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
              <span className="font-bold text-slate-600">
                Toa thuốc hợp lệ theo đợt khám
              </span>
            </div>
          </div>
        </div>

        {/* 4. LỊCH SỬ KHÁM BỆNH & BỆNH ÁN ĐIỆN TỬ (THIẾT KẾ PHẲNG, THU GỌN THÔNG MINH, KHÔNG RỐI MẮT) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Header + Bộ lọc nằm gọn trên 1 thanh */}
          <div className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[21px]">history_edu</span>
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  4. Lịch Sử Khám Bệnh &amp; Xét Nghiệm ({filteredEhr.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm vào từng đợt khám để xem chi tiết lời dặn bác sĩ, kết quả xét nghiệm và đơn thuốc
                </p>
              </div>
            </div>

            {/* Bộ lọc loại hồ sơ */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'home_visit', label: 'Khám tại nhà' },
                { id: 'telehealth', label: 'Telehealth' },
                { id: 'lab_result', label: 'Xét nghiệm' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEhrFilter(tab.id as typeof ehrFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    ehrFilter === tab.id
                      ? 'bg-white text-[#2E37A4] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách phẳng, phân cách bằng đường kẻ ngang mảnh */}
          {filteredEhr.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <span className="material-symbols-outlined text-[32px] text-slate-300">
                clinical_notes
              </span>
              <p className="text-xs font-bold text-slate-700">Chưa có hồ sơ trong mục này</p>
              <p className="text-[11px] text-slate-400">
                Các đợt khám mới sẽ tự động cập nhật sau khi bác sĩ hoàn tất buổi khám.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEhr.map((entry, idx) => {
                const isExpanded =
                  expandedEhrId === entry.id || (expandedEhrId === null && idx === 0);
                const typeIcon =
                  entry.type === 'home_visit'
                    ? 'home_health'
                    : entry.type === 'lab_result'
                    ? 'biotech'
                    : 'videocam';
                const typeBadgeClass =
                  entry.type === 'home_visit'
                    ? 'bg-blue-50 text-[#2E37A4] border-blue-200/80'
                    : entry.type === 'lab_result'
                    ? 'bg-teal-50 text-teal-700 border-teal-200/80'
                    : 'bg-sky-50 text-sky-700 border-sky-200/80';

                return (
                  <div key={entry.id} className="transition-colors">
                    {/* Hàng tóm tắt đợt khám (Luôn hiển thị, bấm để đóng/mở) */}
                    <div
                      onClick={() =>
                        setExpandedEhrId(isExpanded ? '__none__' : entry.id)
                      }
                      className="p-4 sm:px-6 hover:bg-slate-50/60 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${typeBadgeClass}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">{typeIcon}</span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {entry.date}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadgeClass}`}
                            >
                              {entry.typeLabel}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              • {entry.doctorName} ({entry.hospital})
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {entry.diagnosis}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0">
                        {entry.attachmentName && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.print();
                            }}
                            title={`Tải ${entry.attachmentName}`}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#2E37A4] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[17px]">download</span>
                          </button>
                        )}

                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1">
                          <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                          <span className="material-symbols-outlined text-[16px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Nội dung chi tiết khi mở (Trình bày phẳng, thoáng, không lồng hộp) */}
                    {isExpanded && (
                      <div className="px-5 sm:px-6 pb-5 pt-2 bg-slate-50/40 border-t border-slate-100 space-y-4 text-xs">
                        {/* 1. Dải chỉ số sinh hiệu lúc khám */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2.5 border-b border-slate-200/70 text-slate-600">
                          <span>
                            Mã ICD-10: <strong className="font-mono text-[#2E37A4]">{entry.icd10}</strong>
                          </span>
                          <span>
                            Huyết áp:{' '}
                            <strong className="font-mono text-slate-900">
                              {entry.vitalSigns.bp}
                            </strong>
                          </span>
                          <span>
                            Nhịp tim:{' '}
                            <strong className="font-mono text-slate-900">
                              {entry.vitalSigns.heartRate}
                            </strong>
                          </span>
                          <span>
                            SpO2:{' '}
                            <strong className="font-mono text-slate-900">
                              {entry.vitalSigns.spo2}
                            </strong>
                          </span>
                          <span>
                            Cân nặng:{' '}
                            <strong className="font-mono text-slate-900">
                              {entry.vitalSigns.weight}
                            </strong>
                          </span>
                        </div>

                        {/* 2. Nhận định & Lời dặn của Bác sĩ */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Nhận định &amp; Lời dặn của bác sĩ
                          </span>
                          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                            {entry.doctorNotes}
                          </p>
                        </div>

                        {/* 3. Kết quả xét nghiệm (nếu có) — Bảng phẳng tối giản */}
                        {entry.labResults && entry.labResults.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/70">
                            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                              Kết quả xét nghiệm ({entry.labResults.length} chỉ số)
                            </span>
                            <div className="divide-y divide-slate-200/60">
                              {entry.labResults.map((lr, lIdx) => (
                                <div
                                  key={lIdx}
                                  className="py-2 flex flex-wrap items-center justify-between gap-2"
                                >
                                  <span className="font-medium text-slate-800">{lr.test}</span>
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-[#2E37A4]">
                                      {lr.result} {lr.unit}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                                      (Chuẩn: {lr.reference})
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                                      Bình thường
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Đơn thuốc kê trong đợt khám (nếu có) — Danh sách dòng phẳng */}
                        {entry.prescriptions && entry.prescriptions.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/70">
                            <span className="text-[11px] font-bold text-[#2E37A4] uppercase tracking-wider block">
                              Đơn thuốc được kê ({entry.prescriptions.length} thuốc)
                            </span>
                            <div className="divide-y divide-slate-200/60">
                              {entry.prescriptions.map((rx, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                                >
                                  <strong className="text-slate-900">{rx.name}</strong>
                                  <span className="text-slate-600">
                                    Liều: <strong>{rx.dosage}</strong> • {rx.frequency} ({rx.duration})
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
        </div>
      </main>

      {/* MODAL HƯỚNG DẪN ĐÓN BÁC SĨ TẠI NHÀ */}
      {showHomeVisitGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#2E37A4]">
                <span className="material-symbols-outlined text-[24px]">home_health</span>
                <h3 className="font-bold text-base text-slate-900">
                  Hướng Dẫn Đón Bác Sĩ Tại Nhà
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHomeVisitGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-slate-800">
                <strong>Bác sĩ phụ trách:</strong> PGS.TS Nguyễn Trọng Nghĩa
                <br />
                <strong>Thời gian dự kiến:</strong> {currentMember.upcomingVisit?.time} •{' '}
                {currentMember.upcomingVisit?.date}
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-800">Gia đình vui lòng chuẩn bị trước:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Căn cước công dân và thẻ BHYT của người bệnh ({currentMember.name}).</li>
                  <li>
                    Tất cả các toa thuốc, phim X-quang hoặc kết quả xét nghiệm trong 3 tháng gần
                    nhất.
                  </li>
                  <li>Không ăn sáng (nếu có lấy máu xét nghiệm đường huyết/mỡ máu).</li>
                  <li>Chuẩn bị khu vực khám thoáng mát, đủ ánh sáng và một ly nước ấm.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHomeVisitGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-bold text-xs cursor-pointer"
              >
                Đã hiểu &amp; Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GHI NHANH SỐ ĐO SỨC KHỎE */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Ghi Số Đo: {currentMember.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowVitalsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Huyết áp (mmHg)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      Tâm thu (Systolic)
                    </span>
                    <input
                      type="number"
                      required
                      min={60}
                      max={250}
                      placeholder="120"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      Tâm trương (Diastolic)
                    </span>
                    <input
                      type="number"
                      required
                      min={40}
                      max={150}
                      placeholder="80"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đường huyết (mmol/L)
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm bg-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#2E37A4] hover:bg-[#222982] text-white font-bold cursor-pointer"
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
