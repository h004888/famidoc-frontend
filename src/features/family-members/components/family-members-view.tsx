'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FamilyNav } from '@/components/layout';

interface MemberProfile {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  gender: string;
  avatar: string;
  bloodType: string;
  bhytNumber: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  assignedDoctor: { name: string; title: string; hospital: string; avatar: string };
}

interface EHREntry {
  id: string;
  date: string;
  type: 'home_visit' | 'telehealth' | 'lab_result' | 'prescription';
  typeLabel: string;
  doctorName: string;
  hospital: string;
  diagnosis: string;
  icd10: string;
  vitalSigns: { bp: string; heartRate: string; weight: string; spo2: string };
  doctorNotes: string;
  prescriptions?: { name: string; dosage: string; frequency: string; duration: string }[];
  labResults?: { test: string; result: string; unit: string; reference: string; status: 'normal' | 'abnormal' }[];
  attachmentName?: string;
}

const MEMBERS: MemberProfile[] = [
  {
    id: 'mem-01',
    name: 'Nguyễn Văn Phúc',
    relationship: 'Ông nội (Chủ hộ)',
    birthDate: '15/08/1948 (78 tuổi)',
    gender: 'Nam',
    avatar: '👨‍🦳',
    bloodType: 'O+',
    bhytNumber: 'GD4790123891024',
    allergies: ['Penicillin', 'Hải sản vỏ cứng'],
    chronicDiseases: ['Tăng huyết áp độ 2', 'Đái tháo đường type 2 (10 năm)', 'Thoái hóa khớp gối'],
    emergencyContact: { name: 'Nguyễn Văn An (Con trai)', phone: '0912 345 678', relation: 'Con trai trưởng' },
    assignedDoctor: {
      name: 'PGS.TS Nguyễn Trọng Nghĩa',
      title: 'Trưởng khoa Nội tổng quát & Y học gia đình',
      hospital: 'BV Đại học Y Dược TP.HCM',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    },
  },
  {
    id: 'mem-02',
    name: 'Trần Thị Mai',
    relationship: 'Vợ (Mẹ)',
    birthDate: '22/11/1984 (42 tuổi)',
    gender: 'Nữ',
    avatar: '👩',
    bloodType: 'A+',
    bhytNumber: 'GD4790882194012',
    allergies: ['Không có tiền sử dị ứng'],
    chronicDiseases: ['Không có bệnh nền mạn tính'],
    emergencyContact: { name: 'Nguyễn Văn An (Chồng)', phone: '0912 345 678', relation: 'Chồng' },
    assignedDoctor: {
      name: 'ThS.BS Võ Thị Phương Thảo',
      title: 'Chuyên khoa Sản Phụ Khoa',
      hospital: 'BV Từ Dũ',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop',
    },
  },
  {
    id: 'mem-03',
    name: 'Nguyễn Minh Quân',
    relationship: 'Con trai',
    birthDate: '05/03/2014 (12 tuổi)',
    gender: 'Nam',
    avatar: '👦',
    bloodType: 'O+',
    bhytNumber: 'TE4790998124512',
    allergies: ['Bụi phấn hoa', 'Lông động vật'],
    chronicDiseases: ['Viêm mũi dị ứng thời tiết'],
    emergencyContact: { name: 'Trần Thị Mai (Mẹ)', phone: '0988 765 432', relation: 'Mẹ ruột' },
    assignedDoctor: {
      name: 'BSCKII Trần Mai Phương',
      title: 'Chuyên gia Nhi & Dinh dưỡng phát triển',
      hospital: 'BV Nhi Đồng 1',
      avatar: 'https://images.unsplash.com/photo-1594824813586-b4d291986422?q=80&w=200&auto=format&fit=crop',
    },
  },
];

const MOCK_EHR: Record<string, EHREntry[]> = {
  'mem-01': [
    {
      id: 'ehr-01',
      date: '24/10/2026 (3 ngày trước)',
      type: 'home_visit',
      typeLabel: 'Khám Bác sĩ Tại Nhà',
      doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
      hospital: 'BV Đại học Y Dược TP.HCM',
      diagnosis: 'Tăng huyết áp vô căn (nguyên phát) • Đái tháo đường typ 2 có kiểm soát',
      icd10: 'I10 • E11.9',
      vitalSigns: { bp: '135/85 mmHg', heartRate: '78 bpm', weight: '65 kg', spo2: '98%' },
      doctorNotes: 'Bệnh nhân tuân thủ dùng thuốc đều đặn. Huyết áp mục tiêu duy trì tốt dưới 140/90. Không ghi nhận triệu chứng chóng mặt hay đau ngực. Tiếp tục duy trì phác đồ hiện tại và giảm lượng muối trong khẩu phần ăn.',
      prescriptions: [
        { name: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Uống 1 viên vào 08:00 sáng', duration: '30 ngày' },
        { name: 'Metformin Hydrochloride', dosage: '500mg', frequency: 'Uống 1 viên sau ăn tối', duration: '30 ngày' },
        { name: 'Atorvastatin', dosage: '10mg', frequency: 'Uống 1 viên trước khi ngủ', duration: '30 ngày' },
      ],
      attachmentName: 'Phieu_Kham_Tai_Nha_24102026.pdf',
    },
    {
      id: 'ehr-02',
      date: '10/10/2026',
      type: 'lab_result',
      typeLabel: 'Xét Nghiệm Máu Định Kỳ Tại Nhà',
      doctorName: 'ThS.BS Nguyễn Văn Hoài',
      hospital: 'Trung tâm Xét nghiệm FamiDoc Lab',
      diagnosis: 'Theo dõi chỉ số chuyển hóa mỡ máu & đường huyết 3 tháng',
      icd10: 'Z01.7',
      vitalSigns: { bp: '130/80 mmHg', heartRate: '75 bpm', weight: '65.2 kg', spo2: '99%' },
      doctorNotes: 'Chỉ số HbA1c đạt 6.4% (mục tiêu an toàn < 7.0%). Chức năng gan và thận (Creatinine, eGFR) hoàn toàn bình thường.',
      labResults: [
        { test: 'HbA1c (Đường huyết trung bình 3 tháng)', result: '6.4', unit: '%', reference: '4.0 - 6.5', status: 'normal' },
        { test: 'Glucose mao mạch lúc đói', result: '5.8', unit: 'mmol/L', reference: '3.9 - 6.4', status: 'normal' },
        { test: 'Cholesterol toàn phần', result: '4.9', unit: 'mmol/L', reference: '< 5.2', status: 'normal' },
        { test: 'Creatinine huyết thanh', result: '88', unit: 'µmol/L', reference: '62 - 106', status: 'normal' },
      ],
      attachmentName: 'Ket_Qua_Xet_Nghiem_10102026_Signed.pdf',
    },
    {
      id: 'ehr-03',
      date: '15/09/2026',
      type: 'telehealth',
      typeLabel: 'Tư Vấn Video Telehealth 24/7',
      doctorName: 'BSCKII Lê Hoàng Nam',
      hospital: 'BV Bạch Mai',
      diagnosis: 'Đau mỏi khớp gối nhẹ khi chuyển mùa',
      icd10: 'M17.9',
      vitalSigns: { bp: '128/82 mmHg', heartRate: '74 bpm', weight: '65 kg', spo2: '98%' },
      doctorNotes: 'Tư vấn bài tập vật lý trị liệu phục hồi chức năng khớp gối tại nhà, chườm ấm buổi tối và hạn chế leo cầu thang quá nhiều.',
    },
  ],
  'mem-02': [
    {
      id: 'ehr-04',
      date: '02/10/2026',
      type: 'telehealth',
      typeLabel: 'Khám Tư Vấn Sức Khỏe Phụ Nữ',
      doctorName: 'ThS.BS Võ Thị Phương Thảo',
      hospital: 'BV Từ Dũ',
      diagnosis: 'Khám sức khỏe phụ khoa định kỳ & tư vấn tiền mãn kinh',
      icd10: 'Z01.4',
      vitalSigns: { bp: '115/75 mmHg', heartRate: '72 bpm', weight: '54 kg', spo2: '99%' },
      doctorNotes: 'Thể trạng tốt, không có dấu hiệu bất thường. Khuyên bổ sung Canxi Nano và Vitamin D3 hàng ngày.',
    },
  ],
  'mem-03': [
    {
      id: 'ehr-05',
      date: '18/10/2026',
      type: 'home_visit',
      typeLabel: 'Khám Nhi Khoa & Dinh Dưỡng Tại Nhà',
      doctorName: 'BSCKII Trần Mai Phương',
      hospital: 'BV Nhi Đồng 1',
      diagnosis: 'Viêm mũi họng cấp thể nhẹ do thời tiết • Phát triển thể chất tốt',
      icd10: 'J00',
      vitalSigns: { bp: '105/65 mmHg', heartRate: '86 bpm', weight: '38 kg', spo2: '99%' },
      doctorNotes: 'Bé sốt nhẹ đã cắt. Họng hơi đỏ, không có mủ amidan. Vệ sinh mũi bằng nước muối sinh lý 0.9%, uống nhiều nước cam và ăn mềm.',
      prescriptions: [
        { name: 'Xịt mũi thảo dược FamiNose', dosage: '1 nhát mỗi bên', frequency: '3 lần/ngày', duration: '5 ngày' },
        { name: 'Siro tăng đề kháng Kẽm + C', dosage: '10ml', frequency: 'Uống sáng sau ăn', duration: '15 ngày' },
      ],
    },
  ],
};

export function FamilyMembersView() {
  const [selectedMemberId, setSelectedMemberId] = useState('mem-01');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const currentMember = MEMBERS.find((m) => m.id === selectedMemberId) || MEMBERS[0];
  const ehrList = MOCK_EHR[selectedMemberId] || [];

  const filteredEHR = ehrList.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <FamilyNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Hồ Sơ Y Tế Thành Viên &amp; Dòng Thời Gian Bệnh Án (EHR)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563eb] border border-blue-200">
                Chuẩn HL7 / FHIR v4
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Quản lý trọn đời dữ liệu bệnh án, đơn thuốc số, kết quả xét nghiệm và phác đồ điều trị gia đình liên thế hệ.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddMemberModal(true)}
              className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Thêm thành viên</span>
            </button>
            <Link
              href="/family/appointments"
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-[#0f172a] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Đặt lịch khám</span>
            </Link>
          </div>
        </div>

        {/* Member Tabs Horizontal Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {MEMBERS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMemberId(m.id)}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all shrink-0 cursor-pointer text-left ${
                selectedMemberId === m.id
                  ? 'border-[#2563eb] bg-white ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-blue-200'
              }`}
            >
              <span className="text-2xl">{m.avatar}</span>
              <div>
                <div className="font-bold text-xs sm:text-sm text-[#0f172a] flex items-center gap-1.5">
                  <span>{m.name}</span>
                  {selectedMemberId === m.id && (
                    <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                  )}
                </div>
                <div className="text-[11px] text-slate-400">{m.relationship}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Grid: Member Demographic Dossier + EHR Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (4 cols): Patient Medical Passport */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl">
                  {currentMember.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0f172a]">{currentMember.name}</h3>
                  <p className="text-xs text-[#475569]">{currentMember.relationship}</p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mt-1">
                    Nhóm máu: {currentMember.bloodType}
                  </span>
                </div>
              </div>

              {/* Patient Basic Fields */}
              <div className="space-y-2.5 text-xs text-[#475569]">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Ngày sinh &amp; Tuổi:</span>
                  <span className="font-semibold text-[#0f172a]">{currentMember.birthDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Giới tính:</span>
                  <span className="font-semibold text-[#0f172a]">{currentMember.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Số thẻ BHYT:</span>
                  <span className="font-mono font-semibold text-[#2563eb]">{currentMember.bhytNumber}</span>
                </div>
              </div>

              {/* Critical Allergies Badge Box */}
              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Tiền sử dị ứng thuốc &amp; thức ăn:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentMember.allergies.map((a, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-700 text-[11px] font-semibold"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chronic Conditions Box */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <span className="material-symbols-outlined text-[16px]">medical_information</span>
                  Bệnh lý mạn tính theo dõi:
                </div>
                <ul className="text-xs text-amber-900 space-y-1">
                  {currentMember.chronicDiseases.map((d, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Assigned Family Doctor */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bác sĩ gia đình phụ trách
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <img
                    src={currentMember.assignedDoctor.avatar}
                    alt={currentMember.assignedDoctor.name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0f172a] truncate">{currentMember.assignedDoctor.name}</p>
                    <p className="text-[11px] text-[#475569] truncate">{currentMember.assignedDoctor.title}</p>
                    <p className="text-[10px] text-[#2563eb]">{currentMember.assignedDoctor.hospital}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (8 cols): Chronological EHR Timeline */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter Tabs */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {[
                  { id: 'all', label: 'Tất cả sự kiện', icon: 'list_alt' },
                  { id: 'home_visit', label: 'Khám tại nhà', icon: 'home_health' },
                  { id: 'telehealth', label: 'Telehealth', icon: 'videocam' },
                  { id: 'lab_result', label: 'Xét nghiệm', icon: 'biotech' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      activeFilter === f.id
                        ? 'bg-[#2563eb] text-white shadow-xs'
                        : 'text-[#475569] hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {filteredEHR.length} hồ sơ ghi nhận
              </span>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 before:content-['']">
              {filteredEHR.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2 ml-10">
                  <span className="material-symbols-outlined text-4xl text-slate-300">clinical_notes</span>
                  <p className="text-sm font-semibold text-[#0f172a]">Chưa có hồ sơ trong danh mục này</p>
                  <p className="text-xs text-slate-400">Các đợt khám hoặc xét nghiệm mới sẽ tự động đồng bộ vào đây.</p>
                </div>
              ) : (
                filteredEHR.map((entry) => (
                  <div key={entry.id} className="relative pl-12">
                    {/* Node Dot */}
                    <div className="absolute left-3.5 top-5 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-3 border-[#2563eb] shadow-xs" />

                    {/* Timeline Card */}
                    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 hover:border-blue-200 shadow-xs transition-all space-y-4">
                      {/* Header of event */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563eb] border border-blue-200">
                            {entry.typeLabel}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">• {entry.date}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#0f172a] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-blue-600">stethoscope</span>
                          <span>{entry.doctorName}</span>
                        </div>
                      </div>

                      {/* Clinical Diagnosis & ICD-10 */}
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 font-medium">Chẩn đoán xác định:</div>
                        <div className="text-sm sm:text-base font-bold text-[#0f172a]">
                          {entry.diagnosis}
                        </div>
                        <div className="text-xs font-mono text-[#2563eb]">Mã ICD-10: {entry.icd10}</div>
                      </div>

                      {/* Vital Signs Pill Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Huyết áp:</span>
                          <span className="font-bold text-[#0f172a]">{entry.vitalSigns.bp}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Nhịp tim:</span>
                          <span className="font-bold text-[#0f172a]">{entry.vitalSigns.heartRate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Cân nặng:</span>
                          <span className="font-bold text-[#0f172a]">{entry.vitalSigns.weight}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">SpO2:</span>
                          <span className="font-bold text-emerald-600">{entry.vitalSigns.spo2}</span>
                        </div>
                      </div>

                      {/* Doctor Notes */}
                      <div className="text-xs text-[#334155] leading-relaxed bg-blue-50/30 p-3 rounded-xl border border-blue-50">
                        <strong>Lời dặn của Bác sĩ:</strong> {entry.doctorNotes}
                      </div>

                      {/* Prescriptions Table if available */}
                      {entry.prescriptions && entry.prescriptions.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-[#2563eb]">medication</span>
                            Đơn thuốc điện tử cấp bởi Bác sĩ:
                          </h4>
                          <div className="space-y-1.5">
                            {entry.prescriptions.map((p, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs gap-1"
                              >
                                <div>
                                  <strong className="text-[#0f172a]">{p.name}</strong> ({p.dosage})
                                  <p className="text-[11px] text-slate-500">{p.frequency}</p>
                                </div>
                                <span className="text-xs font-semibold text-[#2563eb]">Liệu trình: {p.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Results Table if available */}
                      {entry.labResults && entry.labResults.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-[#2563eb]">biotech</span>
                            Chỉ số xét nghiệm máu cận lâm sàng:
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-50 border-b border-slate-200 text-[#475569]">
                                <tr>
                                  <th className="p-2.5">Tên xét nghiệm</th>
                                  <th className="p-2.5">Kết quả</th>
                                  <th className="p-2.5">Khoảng tham chiếu</th>
                                  <th className="p-2.5">Đánh giá</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                                {entry.labResults.map((lab, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2.5 font-medium">{lab.test}</td>
                                    <td className="p-2.5 font-bold text-[#2563eb]">{lab.result} {lab.unit}</td>
                                    <td className="p-2.5 text-slate-400">{lab.reference} {lab.unit}</td>
                                    <td className="p-2.5">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                                        Bình thường
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Attachment Download Action */}
                      {entry.attachmentName && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-red-500">picture_as_pdf</span>
                            {entry.attachmentName}
                          </span>
                          <button
                            type="button"
                            onClick={() => alert(`Đang tải chứng thư y tế số: ${entry.attachmentName}`)}
                            className="font-bold text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Tải bệnh án có ký số</span>
                            <span className="material-symbols-outlined text-[14px]">download</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Add Member */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0f172a]">Thêm Thành Viên Vào Hộ Gia Đình</h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#475569] mb-1">Họ và tên thành viên *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Minh Thư"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Ngày sinh *</label>
                  <input
                    type="date"
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#475569] mb-1">Quan hệ với chủ hộ *</label>
                  <select className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]">
                    <option>Con gái</option>
                    <option>Con trai</option>
                    <option>Bà nội / Bà ngoại</option>
                    <option>Ông nội / Ông ngoại</option>
                    <option>Vợ / Chồng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Số thẻ BHYT (nếu có)</label>
                <input
                  type="text"
                  placeholder="15 ký tự trên thẻ BHYT"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#475569] mb-1">Tiền sử dị ứng &amp; Bệnh mạn tính</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú dị ứng thuốc, kháng sinh, bệnh tiểu đường..."
                  className="w-full p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Đã thêm hồ sơ thành viên thành công! Bác sĩ gia đình sẽ liên kết dữ liệu trong 10 phút.');
                  setShowAddMemberModal(false);
                }}
                className="flex-1 py-2 text-xs font-semibold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg shadow-xs"
              >
                Lưu hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

