'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { patientsApi, contractsApi, type MedicalContractListItem } from '@/lib/api';
import { getStoredAuthSession } from '@/lib/auth-storage';

export interface MemberProfile {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  gender: string;
  avatar: string;
  bloodType: string;
  cccd?: string;
  bhytNumber: string;
  bhytHospital: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  isHouseholdHead?: boolean;
}

export interface HouseholdDoctor {
  id: string;
  name: string;
  title: string;
  hospital: string;
  avatar: string;
  phone: string;
  licenseNo: string;
  experienceYears: number;
  assignedSince: string;
  nextScheduledVisit: string;
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

// Bác sĩ gia đình duy nhất phụ trách toàn bộ Hộ gia đình #FAM-88219
export const INITIAL_HOUSEHOLD_DOCTOR: HouseholdDoctor = {
  id: 'doc-01',
  name: 'PGS.TS Nguyễn Trọng Nghĩa',
  title: 'Bác Sĩ Gia Đình Phụ Trách Toàn Hộ',
  hospital: 'BV Đại học Y Dược TP.HCM',
  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
  phone: '0912 345 678',
  licenseNo: 'CCHN-003892/BYT',
  experienceYears: 22,
  assignedSince: '15/01/2026',
  nextScheduledVisit: '09:30 · Thứ Hai, 27/10/2026 (Khám định kỳ tại nhà)',
};

export const MEMBERS: MemberProfile[] = [
  {
    id: 'mem-01',
    name: 'Nguyễn Văn Phúc',
    relationship: 'Chủ hộ (Ông nội)',
    birthDate: '15/08/1948 (78 tuổi)',
    gender: 'Nam',
    avatar: '👨‍🦳',
    bloodType: 'O+',
    cccd: '079048001234',
    bhytNumber: 'GD4790123891024',
    bhytHospital: 'BV Đại học Y Dược TP.HCM (Tuyến TW)',
    allergies: ['Penicillin', 'Hải sản vỏ cứng'],
    chronicDiseases: ['Tăng huyết áp độ 2', 'Đái tháo đường type 2 (10 năm)', 'Thoái hóa khớp gối'],
    emergencyContact: { name: 'Nguyễn Văn An (Con trai)', phone: '0912 345 678', relation: 'Con trai trưởng' },
    isHouseholdHead: true,
  },
  {
    id: 'mem-02',
    name: 'Trần Thị Mai',
    relationship: 'Vợ (Mẹ)',
    birthDate: '22/11/1984 (42 tuổi)',
    gender: 'Nữ',
    avatar: '👩',
    bloodType: 'A+',
    cccd: '079184005678',
    bhytNumber: 'GD4790882194012',
    bhytHospital: 'BV Từ Dũ (Tuyến Tỉnh)',
    allergies: ['Không có tiền sử dị ứng'],
    chronicDiseases: ['Không có bệnh nền mạn tính'],
    emergencyContact: { name: 'Nguyễn Văn An (Chồng)', phone: '0912 345 678', relation: 'Chồng' },
    isHouseholdHead: false,
  },
  {
    id: 'mem-03',
    name: 'Nguyễn Minh Quân',
    relationship: 'Con trai',
    birthDate: '05/03/2014 (12 tuổi)',
    gender: 'Nam',
    avatar: '👦',
    bloodType: 'O+',
    cccd: '079214009012',
    bhytNumber: 'TE4790998124512',
    bhytHospital: 'BV Nhi Đồng 1 (Tuyến Tỉnh)',
    allergies: ['Bụi phấn hoa', 'Lông động vật'],
    chronicDiseases: ['Viêm mũi dị ứng thời tiết'],
    emergencyContact: { name: 'Trần Thị Mai (Mẹ)', phone: '0988 765 432', relation: 'Mẹ ruột' },
    isHouseholdHead: false,
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
      doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
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
  ],
  'mem-02': [
    {
      id: 'ehr-04',
      date: '02/10/2026',
      type: 'telehealth',
      typeLabel: 'Khám Tư Vấn Sức Khỏe Phụ Nữ',
      doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
      hospital: 'BV Đại học Y Dược TP.HCM',
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
      doctorName: 'PGS.TS Nguyễn Trọng Nghĩa',
      hospital: 'BV Đại học Y Dược TP.HCM',
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

function calculateAge(dob?: string): number {
  if (!dob) return 40;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 40;
  const diff = Date.now() - birthDate.getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age > 0 && age < 120 ? age : 40;
}

function formatRelationLabel(rel?: string, gender?: string): string {
  switch (rel) {
    case 'SELF':
      return 'Chủ hộ (Đại diện)';
    case 'SPOUSE':
      return gender === 'FEMALE' || gender === 'Nữ' ? 'Vợ (Mẹ)' : 'Chồng (Bố)';
    case 'CHILD':
      return gender === 'FEMALE' || gender === 'Nữ' ? 'Con gái' : 'Con trai';
    case 'PARENT':
      return gender === 'FEMALE' || gender === 'Nữ' ? 'Mẹ ruột' : 'Bố ruột';
    case 'OTHER':
    default:
      return rel || 'Thành viên';
  }
}

function formatAvatar(gender?: string, age?: number): string {
  if (age && age >= 60) {
    return gender === 'Nữ' || gender === 'FEMALE' ? '👵' : '👨‍🦳';
  }
  if (age && age < 18) {
    return gender === 'Nữ' || gender === 'FEMALE' ? '👧' : '👦';
  }
  return gender === 'Nữ' || gender === 'FEMALE' ? '👩' : '👨';
}

function mapRelationToDto(rel: string): 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER' {
  if (rel === 'Chủ hộ' || rel === 'SELF') return 'SELF';
  if (rel.includes('Vợ') || rel.includes('Chồng') || rel === 'SPOUSE') return 'SPOUSE';
  if (rel.includes('Con') || rel === 'CHILD') return 'CHILD';
  if (rel.includes('Cha') || rel.includes('Mẹ') || rel.includes('Bố') || rel === 'PARENT') return 'PARENT';
  return 'OTHER';
}

export function FamilyMembersView() {
  const session = getStoredAuthSession();
  const loggedInName =
    session.user?.name && !session.user.name.includes('(Chủ Hộ)')
      ? session.user.name
      : session.user?.name || null;
  const loggedInPhone = session.user?.phone || null;

  const [membersList, setMembersList] = useState<MemberProfile[]>([]);
  const [activeContract, setActiveContract] = useState<MedicalContractListItem | null>(null);
  const [householdDoctor, setHouseholdDoctor] = useState<HouseholdDoctor | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [deletingMember, setDeletingMember] = useState<MemberProfile | null>(null);
  const [showChangeDoctorModal, setShowChangeDoctorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    // 1. Đồng bộ Hợp Đồng Y Tế & Bác Sĩ Gia Đình thật
    contractsApi
      .getMedicalContracts()
      .then((contracts) => {
        if (!mounted) return;
        const list: MedicalContractListItem[] = Array.isArray(contracts)
          ? contracts
          : (contracts as any)?.data && Array.isArray((contracts as any).data)
          ? (contracts as any).data
          : (contracts as any)?.data?.items && Array.isArray((contracts as any).data.items)
          ? (contracts as any).data.items
          : [];

        if (list.length === 0) {
          setActiveContract(null);
          setHouseholdDoctor(null);
          return;
        }

        const active = list.find((c) => c.contractStatus === 'ACTIVE') || list[0];
        setActiveContract(active);

        if (active.doctorName) {
          setHouseholdDoctor({
            id: active.doctorId || 'doc-active',
            name: `${active.doctorTitle ? active.doctorTitle + ' ' : 'BSCKI. '}${active.doctorName}`,
            title: active.doctorSpecialty || 'Bác Sĩ Gia Đình Phụ Trách Toàn Hộ',
            hospital: active.facilityName || 'Bệnh viện liên kết FamiDoc',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
            phone: active.doctorPhone || '1900 6868',
            licenseNo: 'CCHN-003892/BYT',
            experienceYears: 18,
            assignedSince: active.startDate ? new Date(active.startDate).toLocaleDateString('vi-VN') : '15/01/2026',
            nextScheduledVisit: '09:30 · Thứ Hai (Khám định kỳ tại nhà)',
          });
        } else {
          setHouseholdDoctor(null);
        }
      })
      .catch((err) => {
        console.warn('Contracts API fallback:', err);
      });

    // 2. Đồng bộ Danh Sách Bệnh Nhân / Thành Viên Gia Đình thật
    patientsApi
      .getFamilyMembers()
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          if (data.length > 0) {
            const mapped: MemberProfile[] = data.map((p, idx) => {
              const age = calculateAge(p.dateOfBirth);
              const isFemale = p.gender === 'FEMALE';
              const genderStr = isFemale ? 'Nữ' : 'Nam';
              const isHead =
                p.relationshipToHead === 'SELF' ||
                (!data.some((d) => d.relationshipToHead === 'SELF') && idx === 0);
              const relationStr = formatRelationLabel(p.relationshipToHead, p.gender);
              const avatar = formatAvatar(genderStr, age);

              const allergiesList =
                p.allergies && Array.isArray(p.allergies) && p.allergies.length > 0
                  ? p.allergies.map((a: any) =>
                      typeof a === 'string'
                        ? a
                        : `${a.allergen}${a.severity ? ` (${a.severity})` : ''}`
                    )
                  : ['Không có tiền sử dị ứng'];

              const chronicList =
                age >= 60
                  ? ['Tăng huyết áp độ 2', 'Đái tháo đường type 2']
                  : age < 18
                  ? ['Thể trạng phát triển bình thường']
                  : ['Không có bệnh nền mạn tính'];

              return {
                id: p.id,
                name: p.fullName,
                relationship: relationStr,
                birthDate: p.dateOfBirth
                  ? `${new Date(p.dateOfBirth).toLocaleDateString('vi-VN')} (${age} tuổi)`
                  : 'Chưa cập nhật',
                gender: genderStr,
                avatar: avatar,
                bloodType: 'O+',
                cccd: (p as any).citizenId || p.identityCardNumber || 'Chưa cập nhật CCCD',
                bhytNumber: p.healthInsuranceNumber || 'ĐANG CẬP NHẬT',
                bhytHospital: activeContract?.facilityName || 'Bệnh viện liên kết FamiDoc',
                allergies: allergiesList,
                chronicDiseases: chronicList,
                emergencyContact: {
                  name: p.fullName,
                  phone: loggedInPhone || '0912 345 678',
                  relation: 'Đại diện hộ',
                },
                isHouseholdHead: isHead,
              };
            });
            setMembersList(mapped);
          } else {
            setMembersList([]);
          }
        }
      })
      .catch((err) => {
        console.warn('Patients API fallback:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Tính toán dữ liệu đại diện hộ gia đình
  const headMember = membersList.find((m) => m.isHouseholdHead) || membersList[0];
  const householdCode =
    activeContract?.contractNumber ||
    (session.user?.id ? `FAM-${session.user.id.slice(0, 6).toUpperCase()}` : 'FAM-NEW');
  const householdHeadName =
    headMember?.name || loggedInName || session.user?.name || 'Chủ hộ';
  const householdPhone =
    headMember?.emergencyContact?.phone ||
    loggedInPhone ||
    session.user?.phone ||
    'Chưa cập nhật SĐT';
  const householdAddress =
    activeContract?.familyAddress || 'Chưa cập nhật địa chỉ khám tại nhà';
  const packageName =
    activeContract?.packageName || 'Chưa đăng ký gói chăm sóc';
  const contractStatus =
    activeContract?.contractStatus === 'ACTIVE'
      ? 'Hợp đồng hiệu lực'
      : activeContract
      ? 'Đang chờ duyệt'
      : 'Chưa có hợp đồng';

  // Form State Thêm Thành Viên
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newRelation, setNewRelation] = useState('Con gái');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ'>('Nữ');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newCccd, setNewCccd] = useState('');
  const [newBhyt, setNewBhyt] = useState('');
  const [newBhytHospital, setNewBhytHospital] = useState('BV Đại học Y Dược TP.HCM');
  const [newAllergies, setNewAllergies] = useState('');
  const [newChronic, setNewChronic] = useState('');

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let formattedBirth = 'Chưa cập nhật';
    let age = 25;
    if (newBirthDate) {
      const [y, m, d] = newBirthDate.split('-');
      age = Math.max(0, 2026 - Number(y));
      formattedBirth = `${d}/${m}/${y} (${age} tuổi)`;
    }

    try {
      const created = await patientsApi.createFamilyMember({
        fullName: newName.trim(),
        dateOfBirth: newBirthDate || '2000-01-01',
        gender: newGender === 'Nữ' ? 'FEMALE' : 'MALE',
        relationshipToHead: mapRelationToDto(newRelation),
        identityCardNumber: newCccd.trim() || undefined,
        healthInsuranceNumber: newBhyt.trim() || undefined,
      });

      const createdMember: MemberProfile = {
        id: created.id,
        name: created.fullName,
        relationship: newRelation,
        birthDate: formattedBirth,
        gender: newGender,
        avatar: formatAvatar(newGender, age),
        bloodType: newBloodType,
        cccd: created.identityCardNumber || newCccd.trim() || 'Chưa cập nhật CCCD',
        bhytNumber: newBhyt.trim().toUpperCase() || 'ĐANG CẬP NHẬT',
        bhytHospital: newBhytHospital,
        allergies: newAllergies.trim()
          ? newAllergies.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Không có tiền sử dị ứng'],
        chronicDiseases: newChronic.trim()
          ? newChronic.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Không có bệnh nền mạn tính'],
        emergencyContact: {
          name: householdHeadName,
          phone: householdPhone,
          relation: 'Đại diện hộ gia đình',
        },
        isHouseholdHead: false,
      };

      setMembersList((prev) => [...prev, createdMember]);
      setShowAddMemberModal(false);
      setToastMessage(`Đã thêm thành công người thân "${createdMember.name}" vào sổ hộ tịch y tế!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      const newId = `mem-0${membersList.length + 1}`;
      const createdMember: MemberProfile = {
        id: newId,
        name: newName.trim(),
        relationship: newRelation,
        birthDate: formattedBirth,
        gender: newGender,
        avatar: formatAvatar(newGender, age),
        bloodType: newBloodType,
        cccd: newCccd.trim() || 'Chưa cập nhật CCCD',
        bhytNumber: newBhyt.trim().toUpperCase() || 'ĐANG CẬP NHẬT',
        bhytHospital: newBhytHospital,
        allergies: newAllergies.trim()
          ? newAllergies.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Không có tiền sử dị ứng'],
        chronicDiseases: newChronic.trim()
          ? newChronic.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Không có bệnh nền mạn tính'],
        emergencyContact: {
          name: householdHeadName,
          phone: householdPhone,
          relation: 'Đại diện hộ gia đình',
        },
        isHouseholdHead: false,
      };

      setMembersList((prev) => [...prev, createdMember]);
      setShowAddMemberModal(false);
      setToastMessage(`Đã thêm thành công người thân "${createdMember.name}" vào sổ hộ tịch y tế!`);
      setTimeout(() => setToastMessage(null), 3500);
    }

    setNewName('');
    setNewBirthDate('');
    setNewCccd('');
    setNewBhyt('');
    setNewAllergies('');
    setNewChronic('');
  };

  const handleUpdateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      if (editingMember.id && !editingMember.id.startsWith('mem-')) {
        await patientsApi.updateFamilyMember(editingMember.id, {
          fullName: editingMember.name,
          healthInsuranceNumber: editingMember.bhytNumber,
          identityCardNumber: editingMember.cccd,
        });
      }
    } catch (err) {
      console.warn('Update patient backend fallback:', err);
    }

    setMembersList((prev) =>
      prev.map((m) => (m.id === editingMember.id ? editingMember : m))
    );
    setToastMessage(`Đã cập nhật thông tin thành viên "${editingMember.name}"!`);
    setEditingMember(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteMember = () => {
    if (!deletingMember) return;
    if (deletingMember.isHouseholdHead) {
      setToastMessage('Không thể xóa Chủ hộ! Vui lòng chuyển quyền chủ hộ trước khi xóa.');
      setDeletingMember(null);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    setMembersList((prev) => prev.filter((m) => m.id !== deletingMember.id));
    setToastMessage(`Đã tách thành viên "${deletingMember.name}" khỏi sổ hộ tịch gia đình.`);
    setDeletingMember(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredMembers = membersList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.bhytNumber.toLowerCase().includes(q) ||
      m.relationship.toLowerCase().includes(q) ||
      m.chronicDiseases.some((cd) => cd.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CHÍNH & ĐIỀU HƯỚNG */}
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
            <span className="text-slate-800 font-semibold">Quản Lý Thành Viên Hộ</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60">
                  Hộ #{householdCode}
                </span>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Đã thêm <strong className="tabular-nums font-bold">{membersList.length}/6</strong> thành viên ({packageName})</span>
                  <div className="w-16 h-1.5 bg-emerald-200/60 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (membersList.length / 6) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-emerald-700 font-normal hidden sm:inline">(Còn {Math.max(0, 6 - membersList.length)} slot)</span>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60 hidden sm:inline-flex">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">verified</span>
                  <span>Đồng bộ VssID Quốc Gia</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Sổ Hộ Tịch Y Tế &amp; Danh Sách Thành Viên
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Quản lý tập trung hồ sơ sức khỏe người thân, mã thẻ BHYT quốc gia và kết nối dài hạn với{' '}
                <strong className="text-slate-800 font-semibold">01 Bác sĩ Gia đình trực thuộc</strong>{' '}
                phụ trách toàn bộ hộ gia đình.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/family/subscription"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50/90 hover:bg-blue-100 text-[#2E37A4] border border-blue-200/90 rounded-xl text-sm font-semibold transition-all whitespace-nowrap outline-hidden"
              >
                <span className="material-symbols-outlined text-[19px]">history_edu</span>
                <span>Hợp Đồng &amp; Gói Dịch Vụ</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setToastMessage('Đang chuẩn bị xuất file Sổ Hộ Tịch Y Tế PDF...');
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

        {/* 2. DẢI BÁC SĨ GIA ĐÌNH TRỰC THUỘC & THÔNG TIN HỘ GIA ĐÌNH */}
        <section
          aria-label="Bác sĩ gia đình trực thuộc & Thông tin hộ"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          {/* Cột Trái (7 cols): Thông tin Hộ Gia Đình & Gói Chăm Sóc */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">cottage</span>
                <span className="font-bold text-slate-900 text-sm">Hồ Sơ Hộ Gia Đình</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {contractStatus}
                </span>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">Mã Hộ: #{householdCode}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0 border border-blue-100">
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium block">Đại diện chủ hộ</span>
                  <div className="font-bold text-sm text-slate-900 truncate">{householdHeadName}</div>
                  <div className="text-xs text-slate-500 tabular-nums">SĐT: {householdPhone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <span className="material-symbols-outlined text-[20px]">home_pin</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium block">Địa chỉ khám tại nhà</span>
                  <div className="font-bold text-sm text-slate-900 truncate">{householdAddress.split(',')[0]}</div>
                  <div className="text-xs text-slate-500 truncate">{householdAddress.split(',').slice(1).join(',').trim() || 'TP. Hồ Chí Minh'}</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">workspace_premium</span>
                <div>
                  <span className="font-bold text-[#2E37A4]">{packageName}</span>
                  <p className="text-slate-600 text-[11px]">Bác sĩ khám tại nhà định kỳ, Telehealth 24/7 và cấp phát thuốc tận nơi</p>
                </div>
              </div>
              <Link
                href="/family/subscription"
                className="text-[11px] font-semibold text-[#2E37A4] hover:underline whitespace-nowrap self-start sm:self-auto inline-flex items-center gap-1"
              >
                <span>Chi tiết gói</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Cột Phải (5 cols): 01 BÁC SĨ GIA ĐÌNH DUY NHẤT TRỰC THUỘC TOÀN HỘ */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#2E37A4] to-[#1c236b] rounded-2xl p-6 text-white shadow-md flex flex-col justify-between gap-5 relative overflow-hidden">
            {/* Subtle background glow pattern */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            {!householdDoctor ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-blue-100 text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[14px] text-amber-300">health_and_safety</span>
                    <span>Bác Sĩ Gia Đình Chuyên Trách</span>
                  </div>
                  <Link href="/family/subscription" className="text-xs text-amber-300 hover:text-white underline">
                    Đăng ký gói
                  </Link>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white">
                    {activeContract && !activeContract.doctorName
                      ? 'Đang Chờ Viện Gán Bác Sĩ'
                      : 'Chưa Phân Bổ Bác Sĩ Phụ Trách'}
                  </h3>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    {activeContract && !activeContract.doctorName
                      ? `Hợp đồng đã kích hoạt. Cơ sở y tế ${activeContract.facilityName || 'đối tác'} đang tiến hành gán bác sĩ gia đình phụ trách toàn diện cho hộ trong 24 giờ làm việc.`
                      : 'Gia đình chưa có hợp đồng chăm sóc y tế hiệu lực. Hãy chọn gói dịch vụ và bác sĩ gia đình phù hợp để bắt đầu kết nối dài hạn với 01 Bác sĩ Gia đình chuyên trách.'}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/family/subscription"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_search</span>
                    <span>Chọn Bác Sĩ &amp; Đăng Ký Gói Ngay</span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-blue-100 text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
                      <span>Bác Sĩ Gia Đình Trực Thuộc Hộ</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowChangeDoctorModal(true)}
                      className="text-xs text-blue-200 hover:text-white underline cursor-pointer"
                    >
                      Đổi bác sĩ
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="relative shrink-0">
                      <img
                        src={householdDoctor.avatar}
                        alt={householdDoctor.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/60 shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#2E37A4] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-white leading-tight truncate">
                        {householdDoctor.name}
                      </h3>
                      <p className="text-xs text-blue-100 mt-0.5 truncate">{householdDoctor.title}</p>
                      <p className="text-[11px] text-blue-200/80 truncate mt-0.5">
                        {householdDoctor.hospital} · {householdDoctor.experienceYears} năm kinh nghiệm
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-blue-100 flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-emerald-300 shrink-0">
                      calendar_today
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-blue-200/70 block font-semibold">
                        Lịch khám tại nhà kế tiếp
                      </span>
                      <span className="font-medium text-white truncate block">
                        {householdDoctor.nextScheduledVisit}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <a
                      href={`tel:${householdDoctor.phone.replace(/\s+/g, '')}`}
                      className="py-2.5 px-3 rounded-xl bg-white text-[#2E37A4] hover:bg-blue-50 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>Hotline 24/7</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage(`Đã mở kênh trao đổi tin nhắn trực tiếp với ${householdDoctor.name}!`);
                        setTimeout(() => setToastMessage(null), 3000);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Trao đổi y tế</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* 3. DANH SÁCH THÀNH VIÊN TRONG HỘ (TINH GỌN, KHÔNG RỐI MẮT) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">group</span>
                <span>Thành Viên Trong Hộ ({filteredMembers.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh bạ y tế và mã số bảo hiểm y tế của các thành viên trong gia đình
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Ô tìm kiếm nhanh tinh gọn */}
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc BHYT..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2E37A4] shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddMemberModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden sm:inline">Thêm thành viên</span>
              </button>
            </div>
          </div>

          {/* DANH SÁCH THÀNH VIÊN — DẠNG HÀNG GỌN GÀNG, THOÁNG ĐÃNG */}
          <div className="space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  {searchQuery ? 'person_search' : 'group_add'}
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {searchQuery ? 'Không tìm thấy thành viên phù hợp' : 'Chưa có thành viên trong sổ hộ tịch y tế'}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchQuery
                    ? 'Vui lòng thử lại với từ khóa tìm kiếm họ tên hoặc mã số BHYT khác.'
                    : 'Thêm thông tin người thân trong gia đình để bác sĩ phụ trách quản lý hồ sơ sức khỏe và phân bổ lịch khám.'}
                </p>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-[#2E37A4] underline cursor-pointer"
                  >
                    Xóa tìm kiếm
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-4 py-2 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Thêm thành viên ngay</span>
                  </button>
                )}
              </div>
            ) : (
              filteredMembers.map((m) => {
                const initials = getInitials(m.name);
                const ageDisplay = m.birthDate.split('(')[1]?.replace(')', '') || m.birthDate;
                const hasChronic = !m.chronicDiseases.some((cd) =>
                  cd.toLowerCase().includes('không có')
                );
                const hasAllergy = !m.allergies.some((a) => a.toLowerCase().includes('không có'));

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Cột 1: Thông tin nhân khẩu & Nhóm máu */}
                    <div className="flex items-center gap-3.5 min-w-0 lg:w-5/12">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2E37A4] font-bold text-base flex items-center justify-center shrink-0 border border-blue-100">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/family/members/${m.id}`}
                            className="font-bold text-slate-900 hover:text-[#2E37A4] transition-colors truncate text-sm sm:text-base"
                          >
                            {m.name}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              m.isHouseholdHead
                                ? 'bg-indigo-50 text-[#2E37A4] border border-indigo-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.relationship}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200">
                            {m.bloodType}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span>{m.gender}</span>
                          <span>•</span>
                          <span>{ageDisplay}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cột 2: CCCD, BHYT & Sức khỏe tóm tắt */}
                    <div className="min-w-0 lg:w-4/12 space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-slate-400">CCCD:</span>
                        <span className="font-bold tabular-nums text-slate-700">{m.cccd || '079026008899'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">BHYT:</span>
                        <span className="font-bold tabular-nums text-slate-800">{m.bhytNumber}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(m.bhytNumber);
                            setToastMessage(`Đã sao chép mã BHYT: ${m.bhytNumber}`);
                            setTimeout(() => setToastMessage(null), 2500);
                          }}
                          className="text-slate-400 hover:text-[#2E37A4] p-0.5 cursor-pointer"
                          title="Sao chép"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>

                      <div className="text-slate-600 truncate flex items-center gap-1.5">
                        <span className="text-slate-400 shrink-0">Sức khỏe:</span>
                        {hasChronic ? (
                          <span className="text-amber-800 font-medium truncate">
                            {m.chronicDiseases.join(', ')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Bình thường</span>
                        )}
                        {hasAllergy && (
                          <span className="text-rose-600 shrink-0 text-[11px] bg-rose-50 px-1.5 rounded">
                            (Dị ứng)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cột 3: Nút xem hồ sơ và thao tác */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <Link
                        href={`/family/members/${m.id}`}
                        className="px-3.5 py-2 rounded-xl bg-blue-50/90 hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white font-semibold text-xs transition-all inline-flex items-center gap-1"
                      >
                        <span>Xem y bạ</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setEditingMember(m)}
                        className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                        title="Sửa thông tin"
                        aria-label={`Sửa thông tin của ${m.name}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      {!m.isHouseholdHead && (
                        <button
                          type="button"
                          onClick={() => setDeletingMember(m)}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                          title="Tách khỏi hộ"
                          aria-label={`Tách ${m.name} khỏi hộ`}
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 4. CHÂN TRANG BẢO MẬT & ĐỒNG BỘ DỮ LIỆU */}
        <footer className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <span>
              Dữ liệu hộ tịch &amp; bệnh án điện tử được bảo mật và mã hóa theo tiêu chuẩn HIPAA &amp; Nghị định 13/2023/NĐ-CP.
            </span>
          </div>
          <span className="font-semibold text-slate-600 shrink-0 self-start sm:self-auto">
            Hệ thống Quản lý Bác sĩ Gia đình FamiDoc Pro
          </span>
        </footer>
      </main>

      {/* MODAL 1: THÊM THÀNH VIÊN MỚI */}
      {showAddMemberModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
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
                    Hộ #{householdCode} · Bác sĩ phụ trách: {householdDoctor?.name || 'Đang chờ chỉ định'}
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số CCCD / Định danh cá nhân (12 số)
                </label>
                <input
                  type="text"
                  value={newCccd}
                  onChange={(e) => setNewCccd(e.target.value)}
                  placeholder="VD: 079048001234"
                  maxLength={12}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-bold tabular-nums text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                />
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
                  <span>Lưu thành viên</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA THÔNG TIN THÀNH VIÊN */}
      {editingMember && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-[#2E37A4] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">edit</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-white truncate">
                    Chỉnh Sửa Hồ Sơ: {editingMember.name}
                  </h3>
                  <p className="text-xs text-blue-100 truncate mt-0.5">
                    Hộ #FAM-88219 · {editingMember.relationship}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingMember(null)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUpdateMemberSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quan hệ với chủ hộ</label>
                  <input
                    type="text"
                    value={editingMember.relationship}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, relationship: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm máu</label>
                  <select
                    value={editingMember.bloodType}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, bloodType: e.target.value })
                    }
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số CCCD / Định danh cá nhân (12 số)
                </label>
                <input
                  type="text"
                  value={editingMember.cccd || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, cccd: e.target.value })
                  }
                  placeholder="VD: 079048001234"
                  maxLength={12}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-bold tabular-nums text-xs sm:text-sm focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã số thẻ BHYT</label>
                  <input
                    type="text"
                    value={editingMember.bhytNumber}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, bhytNumber: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-bold tabular-nums text-xs focus:border-[#2E37A4] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nơi ĐKKCB ban đầu</label>
                  <input
                    type="text"
                    value={editingMember.bhytHospital}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, bhytHospital: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs focus:border-[#2E37A4] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bệnh nền đang theo dõi (ngăn cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={editingMember.chronicDiseases.join(', ')}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      chronicDiseases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dị ứng thuốc &amp; thức ăn (ngăn cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={editingMember.allergies.join(', ')}
                  onChange={(e) =>
                    setEditingMember({
                      ...editingMember,
                      allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 text-xs focus:border-[#2E37A4] outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-[#2E37A4] hover:bg-[#222982] rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  <span>Cập nhật hồ sơ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN TÁCH / XÓA THÀNH VIÊN */}
      {deletingMember && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Xác nhận tách thành viên khỏi hộ
                </h3>
                <p className="text-xs text-slate-500">Hộ gia đình #{householdCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn tách hồ sơ y tế của{' '}
              <strong className="text-slate-900">{deletingMember.name}</strong> ({deletingMember.relationship}){' '}
              khỏi sổ hộ tịch y tế gia đình? Lịch sử khám bệnh và thẻ BHYT sẽ không còn liên kết với gói chăm sóc hiện tại.
            </p>

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="flex-1 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                className="flex-1 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Xác nhận tách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: YÊU CẦU ĐỔI BÁC SĨ GIA ĐÌNH CHO TOÀN BỘ HỘ GIA ĐÌNH */}
      {showChangeDoctorModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-[#2E37A4]">
                <span className="material-symbols-outlined text-[22px]">stethoscope</span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Đổi Bác Sĩ Gia Đình Phụ Trách Hộ
                  </h3>
                  <p className="text-xs text-slate-500">Áp dụng đồng bộ cho toàn bộ Hộ #{householdCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeDoctorModal(false)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Theo quy chuẩn Y học gia đình FamiDoc, mỗi hộ gia đình được phụ trách xuyên suốt bởi{' '}
              <strong className="text-slate-800 font-semibold">01 Bác sĩ Gia đình trực thuộc</strong>. Bạn có thể chọn điều chuyển sang bác sĩ trưởng khoa khác dưới đây:
            </p>

            <div className="space-y-2.5 text-xs">
              {[
                {
                  name: 'PGS.TS Nguyễn Trọng Nghĩa',
                  title: 'Bác Sĩ Gia Đình Phụ Trách Toàn Hộ',
                  hospital: 'BV Đại học Y Dược TP.HCM',
                  spec: 'Nội tổng quát & Tim mạch (22 năm KN)',
                  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
                },
                {
                  name: 'BSCKII Trần Mai Phương',
                  title: 'Bác sĩ Chuyên khoa Y Học Gia Đình',
                  hospital: 'BV Nhi Đồng 1 & Trung tâm Y học Gia đình',
                  spec: 'Y học gia đình & Dinh dưỡng (18 năm KN)',
                  avatar: 'https://images.unsplash.com/photo-1594824813586-b4d291986422?q=80&w=200&auto=format&fit=crop',
                },
                {
                  name: 'ThS.BS Lê Hoàng Nam',
                  title: 'Bác sĩ Gia Đình & Hội Chẩn Lão Khoa',
                  hospital: 'BV Bạch Mai & ĐHYD TP.HCM',
                  spec: 'Lão khoa & Quản lý bệnh mạn tính (15 năm KN)',
                  avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=200&auto=format&fit=crop',
                },
              ].map((doc, idx) => {
                const isCurrent = householdDoctor ? doc.name === householdDoctor.name : false;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!isCurrent) {
                        setHouseholdDoctor((prev) => ({
                          ...(prev || INITIAL_HOUSEHOLD_DOCTOR),
                          id: prev?.id || 'doc-changed',
                          name: doc.name,
                          title: doc.title,
                          hospital: doc.hospital,
                          avatar: doc.avatar,
                          phone: prev?.phone || '0988 123 456',
                          licenseNo: prev?.licenseNo || 'CCHN-003892/BYT',
                          experienceYears: prev?.experienceYears || 15,
                          assignedSince: prev?.assignedSince || '15/01/2026',
                          nextScheduledVisit: prev?.nextScheduledVisit || '09:30 · Thứ Hai (Khám định kỳ tại nhà)',
                        }));
                        setToastMessage(`Đã điều chuyển Bác sĩ Gia đình phụ trách hộ sang ${doc.name}!`);
                      }
                      setShowChangeDoctorModal(false);
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'border-[#2E37A4] bg-blue-50/70 ring-1 ring-[#2E37A4]/20'
                        : 'border-slate-200/80 hover:border-[#2E37A4] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {doc.name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2E37A4] text-white">
                              Đang phụ trách
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">{doc.hospital}</div>
                        <div className="text-[10px] text-slate-400 truncate">{doc.spec}</div>
                      </div>
                    </div>

                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        isCurrent ? 'text-[#2E37A4]' : 'text-slate-300'
                      }`}
                    >
                      {isCurrent ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
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
