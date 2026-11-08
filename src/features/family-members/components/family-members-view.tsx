'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export interface MemberProfile {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  gender: string;
  avatar: string;
  bloodType: string;
  bhytNumber: string;
  bhytHospital: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  assignedDoctor: { name: string; title: string; hospital: string; avatar: string };
}

export interface EHREntry {
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

export const MEMBERS: MemberProfile[] = [
  {
    id: 'mem-01',
    name: 'Nguyễn Văn Phúc',
    relationship: 'Chủ hộ (Ông nội)',
    birthDate: '15/08/1948 (78 tuổi)',
    gender: 'Nam',
    avatar: '👨‍🦳',
    bloodType: 'O+',
    bhytNumber: 'GD4790123891024',
    bhytHospital: 'BV Đại học Y Dược TP.HCM (Tuyến TW)',
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
    bhytHospital: 'BV Từ Dũ (Tuyến Tỉnh)',
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
    bhytHospital: 'BV Nhi Đồng 1 (Tuyến Tỉnh)',
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

export const MOCK_EHR: Record<string, EHREntry[]> = {
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
      doctorNotes:
        'Bệnh nhân tuân thủ dùng thuốc đều đặn. Huyết áp mục tiêu duy trì tốt dưới 140/90. Không ghi nhận triệu chứng chóng mặt hay đau ngực. Tiếp tục duy trì phác đồ hiện tại và giảm lượng muối trong khẩu phần ăn.',
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
      doctorNotes:
        'Chỉ số HbA1c đạt 6.4% (mục tiêu an toàn < 7.0%). Chức năng gan và thận (Creatinine, eGFR) hoàn toàn bình thường.',
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
      doctorNotes:
        'Tư vấn bài tập vật lý trị liệu phục hồi chức năng khớp gối tại nhà, chườm ấm buổi tối và hạn chế leo cầu thang quá nhiều.',
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
      doctorNotes:
        'Thể trạng tốt, không có dấu hiệu bất thường. Khuyên bổ sung Canxi Nano và Vitamin D3 hàng ngày.',
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
      doctorNotes:
        'Bé sốt nhẹ đã cắt. Họng hơi đỏ, không có mủ amidan. Vệ sinh mũi bằng nước muối sinh lý 0.9%, uống nhiều nước cam và ăn mềm.',
      prescriptions: [
        { name: 'Xịt mũi thảo dược FamiNose', dosage: '1 nhát mỗi bên', frequency: '3 lần/ngày', duration: '5 ngày' },
        { name: 'Siro tăng đề kháng Kẽm + C', dosage: '10ml', frequency: 'Uống sáng sau ăn', duration: '15 ngày' },
      ],
    },
  ],
};

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function FamilyMembersView() {
  const [membersList, setMembersList] = useState<MemberProfile[]>(MEMBERS);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showChangeDoctorModal, setShowChangeDoctorModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Thêm Người Thân Mới
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newRelation, setNewRelation] = useState('Con gái');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ'>('Nữ');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newBhyt, setNewBhyt] = useState('');
  const [newBhytHospital, setNewBhytHospital] = useState('BV Đại học Y Dược TP.HCM');
  const [newAllergies, setNewAllergies] = useState('');
  const [newChronic, setNewChronic] = useState('');

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let formattedBirth = 'Chưa cập nhật';
    if (newBirthDate) {
      const [y, m, d] = newBirthDate.split('-');
      const age = Math.max(0, 2026 - Number(y));
      formattedBirth = `${d}/${m}/${y} (${age} tuổi)`;
    }

    const newId = `mem-0${membersList.length + 1}`;
    const createdMember: MemberProfile = {
      id: newId,
      name: newName.trim(),
      relationship: newRelation,
      birthDate: formattedBirth,
      gender: newGender,
      avatar: '👤',
      bloodType: newBloodType,
      bhytNumber: newBhyt.trim().toUpperCase() || 'ĐANG CẬP NHẬT',
      bhytHospital: newBhytHospital,
      allergies: newAllergies.trim()
        ? newAllergies.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Không có tiền sử dị ứng'],
      chronicDiseases: newChronic.trim()
        ? newChronic.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Không có bệnh nền mạn tính'],
      emergencyContact: {
        name: 'Nguyễn Văn Phúc (Chủ hộ)',
        phone: '0912 345 678',
        relation: 'Đại diện hộ gia đình',
      },
      assignedDoctor: {
        name: 'PGS.TS Nguyễn Trọng Nghĩa',
        title: 'Bác sĩ Gia đình Phụ trách Hộ #FAM-88219',
        hospital: 'BV Đại học Y Dược TP.HCM',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
      },
    };

    setMembersList((prev) => [...prev, createdMember]);
    setShowAddMemberModal(false);
    setNewName('');
    setNewBirthDate('');
    setNewBhyt('');
    setNewAllergies('');
    setNewChronic('');
    setToastMessage(`Đã thêm thành công người thân "${createdMember.name}" vào sổ hộ tịch y tế!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. HEADER QUẢN LÝ THÀNH VIÊN & SỔ HỘ KHẨU Y TẾ (GỌN PHẲNG, KHÔNG HỘP LỒNG NHAU) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#2E37A4] text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[24px]">badge</span>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#2E37A4] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                    Hộ #FAM-88219
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{membersList.length} thành viên</span>
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Sổ Hộ Khẩu Y Tế &amp; Danh Bạ Thành Viên
                </h1>

                <p className="text-xs text-slate-500">
                  Quản lý thông tin thẻ BHYT, nơi khám chữa bệnh ban đầu và bác sĩ phụ trách của từng
                  người thân
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Thêm thành viên</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setToastMessage('Đang chuẩn bị xuất file Sổ Hộ Khẩu Y Tế PDF...');
                  setTimeout(() => setToastMessage(null), 3000);
                  window.print();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">download</span>
                <span>Xuất PDF</span>
              </button>
            </div>
          </div>

          {/* Dòng thông tin chung của hộ — Phẳng, thoáng, không đóng khung */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <span>
                Chủ hộ: <strong className="text-slate-800">Ông Nguyễn Văn Phúc</strong> (0912 345 678)
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span>
                Địa chỉ khám tại nhà:{' '}
                <strong className="text-slate-800">124 Nguyễn Đình Chiểu, Q.1, TP.HCM</strong>
              </span>
            </div>

            <span className="text-[#2E37A4] font-bold">
              Gói Bác Sĩ Gia Đình Toàn Diện VIP
            </span>
          </div>
        </div>

        {/* 2. DANH SÁCH THÀNH VIÊN (THIẾT KẾ PHẲNG, PHÂN TÁCH BẰNG ĐƯỜNG KẺ MẢNH, KHÔNG HỘP LỒNG NHAU) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          {/* Tiêu đề cột trên Desktop */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Thành viên &amp; Nhóm máu</div>
            <div className="col-span-3">Mã thẻ BHYT &amp; Nơi KCB</div>
            <div className="col-span-3">Bác sĩ &amp; Lưu ý y khoa</div>
            <div className="col-span-2 text-right">Thao tác</div>
          </div>

          {/* Các dòng thành viên phân cách bằng đường kẻ ngang nhẹ */}
          <div className="divide-y divide-slate-100">
            {membersList.map((m) => {
              const initials = getInitials(m.name);
              const ageDisplay = m.birthDate.split('(')[1]?.replace(')', '') || m.birthDate;
              const birthOnly = m.birthDate.split('(')[0]?.trim() || m.birthDate;
              const hasRealAllergy = !m.allergies.some((a) =>
                a.toLowerCase().includes('không có')
              );

              return (
                <div
                  key={m.id}
                  className="p-5 sm:px-6 hover:bg-slate-50/50 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-center"
                >
                  {/* Cột 1: Định danh thành viên */}
                  <div className="lg:col-span-4 flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-blue-50 text-[#2E37A4] font-extrabold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/family/members/${m.id}`}
                          className="font-bold text-sm sm:text-base text-slate-900 hover:text-[#2E37A4] transition-colors truncate"
                        >
                          {m.name}
                        </Link>
                        <span className="text-[11px] font-mono font-bold text-rose-600 shrink-0">
                          • Nhóm {m.bloodType}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {m.relationship} • {ageDisplay} ({birthOnly}) • {m.gender}
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Thẻ BHYT & Nơi đăng ký KCB */}
                  <div className="lg:col-span-3 text-xs space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 lg:hidden">BHYT:</span>
                      <span className="font-mono font-bold text-slate-900">{m.bhytNumber}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(m.bhytNumber);
                          setToastMessage(`Đã sao chép mã BHYT: ${m.bhytNumber}`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="text-slate-400 hover:text-[#2E37A4] cursor-pointer inline-flex items-center"
                        title="Sao chép mã BHYT"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                    <div className="text-slate-500 truncate">{m.bhytHospital}</div>
                  </div>

                  {/* Cột 3: Bác sĩ phụ trách & Lưu ý bệnh nền */}
                  <div className="lg:col-span-3 text-xs space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 truncate">
                        {m.assignedDoctor.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChangeDoctorModal(m.id)}
                        className="text-[11px] font-bold text-[#2E37A4] hover:underline shrink-0 cursor-pointer"
                      >
                        Đổi
                      </button>
                    </div>

                    <div className="text-slate-500 truncate">
                      {m.chronicDiseases[0]}
                      {hasRealAllergy && (
                        <span className="text-amber-700 font-medium">
                          {' '}
                          • Dị ứng: {m.allergies[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cột 4: Nút xem hồ sơ */}
                  <div className="lg:col-span-2 flex items-center justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <Link
                      href={`/family/members/${m.id}`}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-50/80 hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <span>Xem hồ sơ</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dòng chân trang bảo mật gọn nhẹ */}
          <div className="px-5 sm:px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">
                verified_user
              </span>
              <span>
                Dữ liệu hộ tịch &amp; bệnh án gia đình được bảo mật theo Nghị định 13/2023/NĐ-CP và
                tiêu chuẩn HIPAA.
              </span>
            </span>
            <span className="text-slate-400">Đã đồng bộ VssID Quốc gia</span>
          </div>
        </div>
      </main>

      {/* MODAL THÊM THÀNH VIÊN MỚI */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#2E37A4]">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
                <h3 className="font-bold text-base text-slate-900">
                  Thêm Người Thân Vào Sổ Hộ Tịch Y Tế
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ và tên người thân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Thị Lan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quan hệ với chủ hộ
                  </label>
                  <select
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                  >
                    <option value="Cha ruột">Cha ruột</option>
                    <option value="Mẹ ruột">Mẹ ruột</option>
                    <option value="Vợ">Vợ</option>
                    <option value="Chồng">Chồng</option>
                    <option value="Con trai">Con trai</option>
                    <option value="Con gái">Con gái</option>
                    <option value="Khác">Người thân khác</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày tháng năm sinh
                  </label>
                  <input
                    type="date"
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewGender('Nam')}
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        newGender === 'Nam'
                          ? 'bg-blue-50 border-[#2E37A4] text-[#2E37A4]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGender('Nữ')}
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                        newGender === 'Nữ'
                          ? 'bg-rose-50 border-rose-500 text-rose-600'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Nữ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nhóm máu
                  </label>
                  <select
                    value={newBloodType}
                    onChange={(e) => setNewBloodType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                  >
                    <option value="O+">Nhóm máu O+</option>
                    <option value="A+">Nhóm máu A+</option>
                    <option value="B+">Nhóm máu B+</option>
                    <option value="AB+">Nhóm máu AB+</option>
                    <option value="Chưa rõ">Chưa rõ nhóm máu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã số thẻ BHYT
                  </label>
                  <input
                    type="text"
                    value={newBhyt}
                    onChange={(e) => setNewBhyt(e.target.value)}
                    placeholder="VD: GD4790123891024"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-mono font-bold uppercase text-xs focus:border-[#2E37A4] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nơi ĐKKCB ban đầu
                  </label>
                  <input
                    type="text"
                    value={newBhytHospital}
                    onChange={(e) => setNewBhytHospital(e.target.value)}
                    placeholder="VD: BV Đại học Y Dược"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs focus:border-[#2E37A4] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">
                      Dị ứng thuốc / thức ăn
                    </label>
                    <input
                      type="text"
                      value={newAllergies}
                      onChange={(e) => setNewAllergies(e.target.value)}
                      placeholder="VD: Penicillin..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:border-[#2E37A4] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">
                      Bệnh nền đang theo dõi
                    </label>
                    <input
                      type="text"
                      value={newChronic}
                      onChange={(e) => setNewChronic(e.target.value)}
                      placeholder="VD: Huyết áp..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:border-[#2E37A4] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#2E37A4] hover:bg-[#222982] rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Lưu vào sổ hộ tịch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI BÁC SĨ PHỤ TRÁCH */}
      {showChangeDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Đổi Bác Sĩ Gia Đình Phụ Trách
              </h3>
              <button
                type="button"
                onClick={() => setShowChangeDoctorModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có thể chỉ định bác sĩ gia đình phù hợp với nhu cầu chuyên khoa của từng thành viên (Nội khoa, Sản phụ khoa, Nhi khoa hoặc Lão khoa).
            </p>

            <div className="space-y-2 text-xs">
              {[
                { name: 'PGS.TS Nguyễn Trọng Nghĩa', spec: 'Nội tổng quát & Tim mạch (BV ĐHYD)' },
                { name: 'ThS.BS Võ Thị Phương Thảo', spec: 'Sản Phụ Khoa & Tiền mãn kinh (BV Từ Dũ)' },
                { name: 'BSCKII Trần Mai Phương', spec: 'Nhi Khoa & Dinh dưỡng (BV Nhi Đồng 1)' },
                { name: 'BSCKII Lê Hoàng Nam', spec: 'Lão Khoa & Cơ Xương Khớp (BV Bạch Mai)' },
              ].map((doc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setToastMessage(`Đã gửi yêu cầu đổi bác sĩ phụ trách sang ${doc.name}!`);
                    setShowChangeDoctorModal(null);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#2E37A4] hover:bg-blue-50/50 text-left transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-slate-900">{doc.name}</div>
                    <div className="text-[11px] text-slate-500">{doc.spec}</div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">
                    check_circle
                  </span>
                </button>
              ))}
            </div>
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
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
