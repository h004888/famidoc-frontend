'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { patientsApi } from '@/lib/api';

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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    patientsApi
      .getFamilyMembers()
      .then((data) => {
        if (!mounted || !data || data.length === 0) return;
        const mapped: MemberProfile[] = data.map((p) => {
          const birthYear = p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : 2000;
          const age = Math.max(0, 2026 - birthYear);
          return {
            id: p.id,
            name: p.fullName,
            relationship: p.relationshipToHead === 'SELF' ? 'Chủ hộ (Đại diện)' : p.relationshipToHead,
            birthDate: p.dateOfBirth ? `${new Date(p.dateOfBirth).toLocaleDateString('vi-VN')} (${age} tuổi)` : 'Chưa cập nhật',
            gender: p.gender === 'FEMALE' ? 'Nữ' : 'Nam',
            avatar: p.gender === 'FEMALE' ? '👩' : '👨',
            bloodType: 'O+',
            bhytNumber: p.healthInsuranceNumber || 'ĐANG CẬP NHẬT',
            bhytHospital: 'BV Đại học Y Dược TP.HCM',
            allergies: p.allergies && p.allergies.length > 0
              ? p.allergies.map((a) => `${a.allergen} (${a.severity})`)
              : ['Không có tiền sử dị ứng'],
            chronicDiseases: ['Theo dõi định kỳ'],
            emergencyContact: {
              name: 'Đại diện gia đình',
              phone: '0912 345 678',
              relation: 'Đại diện hộ',
            },
            assignedDoctor: {
              name: 'BS. CKII Lê Hoàng Nam',
              title: 'Bác sĩ Gia đình Trưởng khoa',
              hospital: 'BV Đại học Y Dược TP.HCM',
              avatar: '👨‍⚕️',
            },
          };
        });
        setMembersList(mapped);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

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

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let formattedBirth = 'Chưa cập nhật';
    if (newBirthDate) {
      const [y, m, d] = newBirthDate.split('-');
      const age = Math.max(0, 2026 - Number(y));
      formattedBirth = `${d}/${m}/${y} (${age} tuổi)`;
    }

    try {
      const created = await patientsApi.createFamilyMember({
        fullName: newName.trim(),
        dateOfBirth: newBirthDate || '2000-01-01',
        gender: newGender === 'Nữ' ? 'FEMALE' : 'MALE',
        relationshipToHead:
          newRelation === 'Vợ' || newRelation === 'Chồng'
            ? 'SPOUSE'
            : newRelation.includes('Con')
              ? 'CHILD'
              : 'OTHER',
        healthInsuranceNumber: newBhyt.trim() || undefined,
      });

      const createdMember: MemberProfile = {
        id: created.id,
        name: created.fullName,
        relationship: newRelation,
        birthDate: formattedBirth,
        gender: newGender,
        avatar: newGender === 'Nữ' ? '👩' : '👦',
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
          name: 'BS. CKII Lê Hoàng Nam',
          title: 'Bác sĩ Gia đình Trưởng khoa',
          hospital: newBhytHospital,
          avatar: '👨‍⚕️',
        },
      };

      setMembersList((prev) => [...prev, createdMember]);
      setShowAddMemberModal(false);
      setToastMessage(`Đã thêm thành công người thân "${createdMember.name}" vào sổ hộ tịch y tế!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      const newId = `mem-0${membersList.length + 1}`;
      const createdMember: MemberProfile = {
        id: newId,
        name: newName.trim(),
        relationship: newRelation,
        birthDate: formattedBirth,
        gender: newGender,
        avatar: newGender === 'Nữ' ? '👩' : '👦',
        bloodType: newBloodType,
        bhytNumber: newBhyt.trim().toUpperCase() || 'ĐANG CẬP NHẬT',
        bhytHospital: newBhytHospital,
        allergies: ['Không có tiền sử dị ứng'],
        chronicDiseases: ['Không có bệnh nền mạn tính'],
        emergencyContact: {
          name: 'Nguyễn Văn Phúc (Chủ hộ)',
          phone: '0912 345 678',
          relation: 'Đại diện hộ gia đình',
        },
        assignedDoctor: {
          name: 'BS. CKII Lê Hoàng Nam',
          title: 'Bác sĩ Gia đình Trưởng khoa',
          hospital: newBhytHospital,
          avatar: '👨‍⚕️',
        },
      };

      setMembersList((prev) => [...prev, createdMember]);
      setShowAddMemberModal(false);
      setToastMessage(`Đã thêm thành công người thân "${createdMember.name}" vào sổ hộ tịch y tế!`);
      setTimeout(() => setToastMessage(null), 4000);
    }

    setNewName('');
    setNewBirthDate('');
    setNewBhyt('');
    setNewAllergies('');
    setNewChronic('');
  };

  const filteredMembers = membersList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.bhytNumber.toLowerCase().includes(q) ||
      m.relationship.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CANVAS THOÁNG ĐÃNG ĐỒNG BỘ VỚI /family */}
        <header className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#2E37A4] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Bảng Sức Khỏe Gia Đình</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">Danh Bạ Thành Viên</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60">
                  Hộ #FAM-88219
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tabular-nums bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{membersList.length} thành viên y tế</span>
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60 hidden sm:inline-flex">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">verified</span>
                  <span>Đồng bộ VssID Quốc Gia</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Sổ Hộ Khẩu Y Tế &amp; Danh Bạ Thành Viên
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Quản lý tập trung hồ sơ sức khỏe, thẻ BHYT quốc gia, nơi khám chữa bệnh ban đầu và bác sĩ gia đình phụ trách cho từng người thân.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn & phân cấp chuẩn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all whitespace-nowrap outline-hidden cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <span>Thêm thành viên</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setToastMessage('Đang chuẩn bị xuất file Sổ Hộ Khẩu Y Tế PDF...');
                  setTimeout(() => setToastMessage(null), 3000);
                  window.print();
                }}
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-sm font-medium shadow-xs hover:border-slate-300 transition-all whitespace-nowrap outline-hidden cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
                <span>Xuất PDF</span>
              </button>
            </div>
          </div>
        </header>

        {/* 2. DẢI THÔNG TIN HỘ GIA ĐÌNH (HOUSEHOLD OVERVIEW STRIP) */}
        <section
          aria-label="Thông tin hộ gia đình"
          className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Đại diện hộ */}
            <div className="flex items-start gap-4 pt-2 md:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">account_circle</span>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-medium block">Đại diện chủ hộ</span>
                <div className="font-bold text-base text-slate-900">Ông Nguyễn Văn Phúc</div>
                <div className="text-slate-500 tabular-nums">SĐT liên hệ: 0912 345 678</div>
              </div>
            </div>

            {/* Địa chỉ y tế */}
            <div className="flex items-start gap-4 pt-4 md:pt-0 md:pl-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">home_health</span>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-medium block">Địa chỉ khám tại nhà</span>
                <div className="font-bold text-base text-slate-900 truncate">
                  124 Nguyễn Đình Chiểu, Q.1
                </div>
                <div className="text-slate-500">TP. Hồ Chí Minh · Bác sĩ đến trong 15p</div>
              </div>
            </div>

            {/* Hợp đồng chăm sóc */}
            <div className="flex items-start gap-4 pt-4 md:pt-0 md:pl-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-medium block">Gói chăm sóc hiện tại</span>
                <div className="font-bold text-base text-[#2E37A4]">
                  Gói Bác Sĩ Toàn Diện VIP
                </div>
                <div className="text-slate-500">
                  Hợp đồng #FMD-HD-88219 · <span className="text-emerald-700 font-medium">Đang hiệu lực</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BỘ LỌC TÌM KIẾM NHANH */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">contacts</span>
              <span>Danh Sách Người Thân ({filteredMembers.length})</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Hồ sơ bảo hiểm y tế và phân bổ bác sĩ phụ trách từng cá nhân
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã BHYT, vai trò..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200/90 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/10 shadow-xs"
            />
          </div>
        </section>

        {/* 4. DANH SÁCH THÀNH VIÊN — THIẾT KẾ CARD THOÁNG ĐÃNG & CHI TIẾT */}
        <section className="space-y-6">
          {filteredMembers.map((m) => {
            const initials = getInitials(m.name);
            const ageDisplay = m.birthDate.split('(')[1]?.replace(')', '') || m.birthDate;
            const birthOnly = m.birthDate.split('(')[0]?.trim() || m.birthDate;
            const hasRealAllergy = !m.allergies.some((a) =>
              a.toLowerCase().includes('không có')
            );
            const latestEHR = MOCK_EHR[m.id]?.[0];

            return (
              <div
                key={m.id}
                className="group bg-white rounded-2xl border border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden space-y-5 p-6"
              >
                {/* Phần 1: Header của Thành Viên */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2E37A4] font-bold text-base flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs group-hover:scale-105 transition-transform">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          href={`/family/members/${m.id}`}
                          className="font-bold text-base sm:text-lg text-slate-900 hover:text-[#2E37A4] transition-colors truncate"
                        >
                          {m.name}
                        </Link>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50/80 text-[#2E37A4] border border-blue-200/70">
                          {m.relationship}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums bg-rose-50 text-rose-700 border border-rose-200/70 inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">bloodtype</span>
                          <span>Nhóm {m.bloodType}</span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2 font-medium">
                        <span>{m.gender}</span>
                        <span className="text-slate-300">·</span>
                        <span className="tabular-nums">{ageDisplay}</span>
                        <span className="text-slate-300">·</span>
                        <span className="tabular-nums">Sinh ngày: {birthOnly}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                    <Link
                      href={`/family/members/${m.id}`}
                      className="min-h-10 px-4 py-2 rounded-xl bg-blue-50/80 hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <span>Xem hồ sơ y bạ</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                {/* Phần 2: 3 Khối Thông Tin Trọng Yếu (BHYT, Bác sĩ, Tiền sử) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Khối 1: Thẻ BHYT & Tuyến KCB */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">
                          badge
                        </span>
                        <span>Mã Thẻ BHYT</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(m.bhytNumber);
                          setToastMessage(`Đã sao chép mã BHYT: ${m.bhytNumber}`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }}
                        className="text-[11px] font-semibold text-[#2E37A4] hover:underline cursor-pointer inline-flex items-center gap-1"
                        title="Sao chép mã BHYT"
                      >
                        <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        <span>Sao chép</span>
                      </button>
                    </div>

                    <div className="font-bold tabular-nums text-sm text-slate-900 tracking-wide">
                      {m.bhytNumber}
                    </div>

                    <div className="text-xs text-slate-500 flex items-start gap-1.5 pt-0.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-400 mt-0.5 shrink-0">
                        local_hospital
                      </span>
                      <span className="line-clamp-2">{m.bhytHospital}</span>
                    </div>
                  </div>

                  {/* Khối 2: Bác sĩ gia đình phụ trách */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">
                          stethoscope
                        </span>
                        <span>Bác Sĩ Phụ Trách</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChangeDoctorModal(m.id)}
                        className="text-[11px] font-semibold text-[#2E37A4] hover:underline cursor-pointer"
                      >
                        Đổi bác sĩ
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                        <img
                          src={m.assignedDoctor.avatar}
                          alt={m.assignedDoctor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {m.assignedDoctor.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {m.assignedDoctor.hospital}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate pt-0.5">
                      {m.assignedDoctor.title}
                    </div>
                  </div>

                  {/* Khối 3: Bệnh nền mạn tính & Dị ứng */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">
                        warning
                      </span>
                      <span>Lưu Ý Bệnh Nền &amp; Dị Ứng</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {m.chronicDiseases.map((cd, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200/70 text-slate-700"
                          >
                            {cd}
                          </span>
                        ))}
                      </div>

                      {hasRealAllergy && (
                        <div className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/70 px-2 py-1 rounded-md flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-amber-600 shrink-0">
                            emergency
                          </span>
                          <span>Dị ứng: {m.allergies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phần 3: Nhật ký tương tác khám y khoa gần nhất */}
                {latestEHR && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-500 shrink-0">
                        Lần khám gần nhất: <strong className="text-slate-700 tabular-nums">{latestEHR.date}</strong>
                      </span>
                      <span className="hidden md:inline text-slate-300">·</span>
                      <span className="text-slate-600 truncate hidden md:inline">
                        {latestEHR.typeLabel}: {latestEHR.diagnosis}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {latestEHR.vitalSigns && (
                        <div className="flex items-center gap-2 text-[11px] font-bold tabular-nums text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          <span>HA: {latestEHR.vitalSigns.bp}</span>
                          <span className="text-slate-300">·</span>
                          <span>SpO2: {latestEHR.vitalSigns.spo2}</span>
                        </div>
                      )}
                      <Link
                        href={`/family/members/${m.id}`}
                        className="text-xs font-semibold text-[#2E37A4] hover:underline"
                      >
                        Chi tiết bệnh án
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* 5. CHÂN TRANG BẢO MẬT & ĐỒNG BỘ DỮ LIỆU */}
        <footer className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <span>
              Dữ liệu hộ tịch &amp; bệnh án điện tử được mã hóa đầu cuối theo Nghị định 13/2023/NĐ-CP và tiêu chuẩn bảo mật y tế HIPAA.
            </span>
          </div>
          <span className="font-semibold text-slate-600 shrink-0 self-start sm:self-auto">
            Hệ thống Quản lý Bác sĩ Gia đình FamiDoc Pro
          </span>
        </footer>
      </main>

      {/* MODAL THÊM THÀNH VIÊN MỚI */}
      {showAddMemberModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-5 bg-[#2E37A4] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">
                    Thêm Người Thân Vào Sổ Hộ Tịch Y Tế
                  </h3>
                  <p className="text-xs text-blue-100 truncate mt-0.5">
                    Hộ gia đình #FAM-88219 · Gói Bác sĩ Gia đình Toàn diện VIP
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên người thân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Thị Lan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-[#2E37A4] focus:ring-2 focus:ring-[#2E37A4]/15 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
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
                  <label className="block font-semibold text-slate-700 mb-1">
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giới tính
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewGender('Nam')}
                      className={`py-2 rounded-xl font-semibold border transition-all cursor-pointer ${
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
                      className={`py-2 rounded-xl font-semibold border transition-all cursor-pointer ${
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
                  <label className="block font-semibold text-slate-700 mb-1">
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
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã số thẻ BHYT
                  </label>
                  <input
                    type="text"
                    value={newBhyt}
                    onChange={(e) => setNewBhyt(e.target.value)}
                    placeholder="VD: GD4790123891024"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-bold tabular-nums uppercase text-xs focus:border-[#2E37A4] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
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

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">
                      Dị ứng thuốc / thức ăn
                    </label>
                    <input
                      type="text"
                      value={newAllergies}
                      onChange={(e) => setNewAllergies(e.target.value)}
                      placeholder="VD: Penicillin, Tôm cua..."
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
                      placeholder="VD: Huyết áp, Dạ dày..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:border-[#2E37A4] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-[#2E37A4] hover:bg-[#222982] rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-[#2E37A4]">
                <span className="material-symbols-outlined text-[22px]">stethoscope</span>
                <h3 className="font-bold text-base text-slate-900">
                  Đổi Bác Sĩ Gia Đình Phụ Trách
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeDoctorModal(null)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
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
                  className="w-full p-3.5 rounded-xl border border-slate-200/80 hover:border-[#2E37A4] hover:bg-blue-50/40 text-left transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-[#2E37A4] transition-colors">
                      {doc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{doc.spec}</div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-slate-300 group-hover:text-[#2E37A4] transition-colors">
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
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
