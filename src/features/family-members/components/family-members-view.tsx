'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared';
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
  contractsApi,
  patientsApi,
  extractErrorMessage,
  type FamilyGateStatusDto,
  type PatientDto,
  type PatientRelationship,
} from '@/lib/api';

export interface MemberProfile {
  id: string;
  name: string;
  relationship: string;
  rawDateOfBirth: string;
  birthDate: string;
  gender: 'Nam' | 'Nữ';
  avatar: string;
  bloodType: string;
  bhytNumber: string;
  bhytHospital: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  isHouseholdHead?: boolean;
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

/** Giữ lại fixture lịch sử khám cho trang chi tiết /family/members/[id] ngoài phạm vi change này. */
export const MOCK_EHR: Record<string, EHREntry[]> = {
  'mem-01': [
    {
      id: 'ehr-01',
      date: '24/10/2026 (3 ngày trước)',
      type: 'home_visit',
      typeLabel: 'Khám Bác sĩ Tại Nhà',
      doctorName: 'Bác sĩ Gia đình phụ trách',
      hospital: 'Hệ thống FamiDoc',
      diagnosis: 'Tăng huyết áp vô căn (nguyên phát) • Đái tháo đường typ 2 có kiểm soát',
      icd10: 'I10 • E11.9',
      vitalSigns: { bp: '135/85 mmHg', heartRate: '78 bpm', weight: '65 kg', spo2: '98%' },
      doctorNotes:
        'Bệnh nhân tuân thủ dùng thuốc đều đặn. Huyết áp mục tiêu duy trì tốt dưới 140/90.',
    },
  ],
};

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const RELATION_LABEL_TO_CODE: Record<string, PatientRelationship> = {
  'Cha ruột': 'PARENT',
  'Mẹ ruột': 'PARENT',
  'Vợ': 'SPOUSE',
  'Chồng': 'SPOUSE',
  'Vợ / Chồng': 'SPOUSE',
  'Con trai': 'CHILD',
  'Con gái': 'CHILD',
  'Con': 'CHILD',
  'Chủ hộ (Đại diện)': 'SELF',
  'Bản thân': 'SELF',
  'Khác': 'OTHER',
};

const RELATION_CODE_TO_LABEL: Record<string, string> = {
  SELF: 'Chủ hộ (Đại diện)',
  SPOUSE: 'Vợ / Chồng',
  CHILD: 'Con',
  CON: 'Con',
  VO: 'Vợ',
  CHONG: 'Chồng',
  PARENT: 'Cha / Mẹ',
  BO: 'Cha ruột',
  ME: 'Mẹ ruột',
  OTHER: 'Người thân',
};

export function mapRelationLabelToCode(label: string): PatientRelationship {
  if (RELATION_LABEL_TO_CODE[label]) {
    return RELATION_LABEL_TO_CODE[label];
  }
  const normalized = label.trim().toUpperCase();
  if (['SELF', 'SPOUSE', 'CHILD', 'PARENT', 'OTHER'].includes(normalized)) {
    return normalized as PatientRelationship;
  }
  if (label.toLowerCase().includes('con')) return 'CHILD';
  if (label.toLowerCase().includes('vợ') || label.toLowerCase().includes('chồng')) return 'SPOUSE';
  if (label.toLowerCase().includes('cha') || label.toLowerCase().includes('mẹ')) return 'PARENT';
  return 'OTHER';
}

function formatBirthDisplay(rawIso?: string): { rawDate: string; display: string } {
  if (!rawIso) {
    return { rawDate: '', display: 'Chưa cập nhật' };
  }
  const dateObj = new Date(rawIso);
  if (Number.isNaN(dateObj.getTime())) {
    return { rawDate: '', display: 'Chưa cập nhật' };
  }
  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  const age = Math.max(0, new Date().getFullYear() - yyyy);
  return {
    rawDate: `${yyyy}-${mm}-${dd}`,
    display: `${dd}/${mm}/${yyyy} (${age} tuổi)`,
  };
}

export function mapPatientDtoToMemberProfile(
  p: PatientDto,
  emergencyFallback?: { name: string; phone: string },
  extraAllergies?: string[]
): MemberProfile {
  const { rawDate, display } = formatBirthDisplay(p.dateOfBirth);
  const relKey = (p.relationshipToHead || 'OTHER').trim().toUpperCase();
  const allergyList =
    extraAllergies && extraAllergies.length > 0
      ? extraAllergies
      : p.allergies && p.allergies.length > 0
        ? p.allergies.map((a) => a.allergenName)
        : ['Không có tiền sử dị ứng'];
  const chronicList =
    p.chronicDiseases && p.chronicDiseases.trim()
      ? p.chronicDiseases
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : ['Không có bệnh nền mạn tính'];

  return {
    id: p.id,
    name: p.fullName,
    relationship: RELATION_CODE_TO_LABEL[relKey] || p.relationshipToHead || 'Người thân',
    rawDateOfBirth: rawDate,
    birthDate: display,
    gender: p.gender === 'FEMALE' ? 'Nữ' : 'Nam',
    avatar: p.gender === 'FEMALE' ? '👩' : '👨',
    bloodType: p.bloodType?.trim() || 'Chưa rõ',
    bhytNumber: p.healthInsuranceNumber?.trim() || 'ĐANG CẬP NHẬT',
    bhytHospital: p.registeredHospital?.trim() || 'Chưa cập nhật',
    allergies: allergyList,
    chronicDiseases: chronicList,
    emergencyContact: {
      name: emergencyFallback?.name || 'Đại diện hộ gia đình',
      phone: emergencyFallback?.phone || 'Chưa cập nhật',
      relation: 'Đại diện hộ gia đình',
    },
    isHouseholdHead: relKey === 'SELF',
  };
}

export function FamilyMembersView() {
  const [membersList, setMembersList] = useState<MemberProfile[]>([]);
  const [gateStatus, setGateStatus] = useState<FamilyGateStatusDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<MemberProfile | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingMember, setDeletingMember] = useState<MemberProfile | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Form State Thêm Thành Viên
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newRelation, setNewRelation] = useState('Con gái');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ'>('Nữ');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newBhyt, setNewBhyt] = useState('');
  const [newBhytHospital, setNewBhytHospital] = useState('BV Đại học Y Dược TP.HCM');
  const [newAllergies, setNewAllergies] = useState('');
  const [newChronic, setNewChronic] = useState('');

  const showToast = (msg: string) => {
    toast.success(msg);
  };

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([patientsApi.getFamilyMembers(), contractsApi.getFamilyGateStatus()]).then(
      ([membersResult, gateResult]) => {
        if (!mounted) return;

        const gateData = gateResult.status === 'fulfilled' ? gateResult.value : null;
        if (gateData) {
          setGateStatus(gateData);
        }

        const emergencyFallback = gateData?.familyUnit
          ? {
              name: gateData.familyUnit.representativeName,
              phone: gateData.familyUnit.emergencyPhone,
            }
          : undefined;

        if (membersResult.status === 'fulfilled') {
          const rows = Array.isArray(membersResult.value) ? membersResult.value : [];
          setMembersList(
            rows.map((row) => mapPatientDtoToMemberProfile(row, emergencyFallback))
          );
        } else {
          setMembersList([]);
          const msg =
            membersResult.reason instanceof Error
              ? membersResult.reason.message
              : 'Không thể tải danh sách thành viên từ máy chủ.';
          setLoadError(msg);
        }

        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
    };
  }, []);

  const activeContract = gateStatus?.activeContract ?? null;
  const familyUnit = gateStatus?.familyUnit ?? null;
  const assignedDoctor = activeContract?.doctor ?? null;
  const memberLimit = activeContract?.memberCount ?? null;
  const isQuotaReached = memberLimit !== null && membersList.length >= memberLimit;

  const contractBadgeCode = activeContract?.contractNumber || 'Đang đồng bộ hợp đồng';
  const repName = familyUnit?.representativeName || 'Đại diện hộ gia đình';
  const repPhone = familyUnit?.emergencyPhone || 'Chưa cập nhật';
  const homeAddress = familyUnit?.homeAddress || 'Chưa cập nhật địa chỉ khám tại nhà';
  const packageName = activeContract?.packageName || 'Gói chăm sóc gia đình đang kích hoạt';
  const packageDesc =
    activeContract?.packageDescription ||
    'Quản lý hồ sơ sức khỏe tập trung cùng bác sĩ gia đình phụ trách.';

  const resetAddForm = () => {
    setNewName('');
    setNewBirthDate('');
    setNewBhyt('');
    setNewAllergies('');
    setNewChronic('');
    setAddError(null);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSubmittingAdd) return;

    if (newBirthDate) {
      const dob = new Date(newBirthDate);
      if (!isNaN(dob.getTime())) {
        if (dob > new Date()) {
          setAddError('Ngày sinh không thể là ngày trong tương lai.');
          return;
        }
        const ageYears = (Date.now() - dob.getTime()) / (1000 * 3600 * 24 * 365.25);
        if (ageYears > 120) {
          setAddError('Ngày sinh không hợp lệ (tuổi vượt quá 120 năm).');
          return;
        }
      }
    }

    setAddError(null);
    setIsSubmittingAdd(true);

    try {
      const created = await patientsApi.createFamilyMember({
        fullName: newName.trim(),
        dateOfBirth: newBirthDate || '2000-01-01',
        gender: newGender === 'Nữ' ? 'FEMALE' : 'MALE',
        relationshipToRepresentative: mapRelationLabelToCode(newRelation),
        healthInsuranceNumber: newBhyt.trim() ? newBhyt.trim().toUpperCase() : undefined,
        bloodType: newBloodType !== 'Chưa rõ' ? newBloodType : undefined,
        registeredHospital: newBhytHospital.trim() || undefined,
        chronicDiseases: newChronic.trim() || undefined,
      });

      const parsedAllergies = newAllergies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let allergyWarning = false;
      if (parsedAllergies.length > 0) {
        const allergyResults = await Promise.allSettled(
          parsedAllergies.map((allergenName) =>
            patientsApi.addMemberAllergy(created.id, {
              allergenType: 'DRUG',
              allergenName,
              severity: 'MILD',
            })
          )
        );
        allergyWarning = allergyResults.some((r) => r.status === 'rejected');
      }

      const createdProfile = mapPatientDtoToMemberProfile(
        created,
        { name: repName, phone: repPhone },
        parsedAllergies
      );

      setMembersList((prev) => [...prev, createdProfile]);
      setShowAddMemberModal(false);
      resetAddForm();
      showToast(
        allergyWarning
          ? `Đã thêm "${createdProfile.name}" nhưng chưa lưu được toàn bộ ghi chú dị ứng.`
          : `Đã thêm thành công người thân "${createdProfile.name}" vào sổ hộ tịch y tế!`
      );
    } catch (err) {
      const message = extractErrorMessage(
        err,
        'Không thể thêm thành viên. Vui lòng kiểm tra thông tin hoặc hạn mức gói.'
      );
      setAddError(message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleUpdateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || isSubmittingEdit) return;

    if (editingMember.rawDateOfBirth) {
      const dob = new Date(editingMember.rawDateOfBirth);
      if (!isNaN(dob.getTime())) {
        if (dob > new Date()) {
          setEditError('Ngày sinh không thể là ngày trong tương lai.');
          return;
        }
        const ageYears = (Date.now() - dob.getTime()) / (1000 * 3600 * 24 * 365.25);
        if (ageYears > 120) {
          setEditError('Ngày sinh không hợp lệ (tuổi vượt quá 120 năm).');
          return;
        }
      }
    }

    setEditError(null);
    setIsSubmittingEdit(true);

    try {
      const chronicValue = editingMember.chronicDiseases
        .filter((cd) => !cd.toLowerCase().includes('không có'))
        .join(', ');

      const updated = await patientsApi.updateFamilyMember(editingMember.id, {
        fullName: editingMember.name.trim(),
        dateOfBirth: editingMember.rawDateOfBirth || undefined,
        gender: editingMember.gender === 'Nữ' ? 'FEMALE' : 'MALE',
        relationshipToRepresentative: mapRelationLabelToCode(editingMember.relationship),
        bloodType: editingMember.bloodType !== 'Chưa rõ' ? editingMember.bloodType : '',
        healthInsuranceNumber:
          editingMember.bhytNumber && editingMember.bhytNumber !== 'ĐANG CẬP NHẬT'
            ? editingMember.bhytNumber.trim().toUpperCase()
            : '',
        registeredHospital: editingMember.bhytHospital.trim() || '',
        chronicDiseases: chronicValue,
      });

      const updatedProfile = mapPatientDtoToMemberProfile(
        updated,
        { name: repName, phone: repPhone },
        editingMember.allergies
      );

      setMembersList((prev) =>
        prev.map((m) => (m.id === editingMember.id ? updatedProfile : m))
      );
      setEditingMember(null);
      showToast(`Đã cập nhật thông tin thành viên "${updatedProfile.name}"!`);
    } catch (err) {
      const message = extractErrorMessage(err, 'Không thể cập nhật thông tin thành viên.');
      setEditError(message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember || isSubmittingDelete) return;
    if (deletingMember.isHouseholdHead) {
      setDeleteError('Không thể tách Chủ hộ khỏi sổ hộ tịch gia đình.');
      return;
    }

    setDeleteError(null);
    setIsSubmittingDelete(true);

    try {
      await patientsApi.detachFamilyMember(deletingMember.id);
      const removedName = deletingMember.name;
      setMembersList((prev) => prev.filter((m) => m.id !== deletingMember.id));
      setDeletingMember(null);
      showToast(`Đã tách thành viên "${removedName}" khỏi danh sách hoạt động của hộ.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tách thành viên khỏi hộ gia đình.';
      setDeleteError(message);
    } finally {
      setIsSubmittingDelete(false);
    }
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
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CHÍNH & ĐIỀU HƯỚNG */}
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
            <span className="text-slate-800 font-semibold">Quản Lý Thành Viên Hộ</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-primary bg-primary/10 border-primary/20">
                  HĐ {contractBadgeCode}
                </Badge>
                <span
                  data-testid="member-quota-badge"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tabular-nums border ${
                    isQuotaReached
                      ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isQuotaReached ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span>
                    {memberLimit !== null
                      ? `${membersList.length} / ${memberLimit} thành viên`
                      : `${membersList.length} thành viên y tế`}
                  </span>
                </span>
                <Badge variant="secondary" className="gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60 hidden sm:inline-flex">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">verified</span>
                  <span>Đồng bộ Hồ sơ FamiDoc</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Sổ Hộ Tịch Y Tế &amp; Danh Sách Thành Viên
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Quản lý tập trung hồ sơ sức khỏe người thân, mã thẻ BHYT và kết nối dài hạn với{' '}
                <strong className="text-slate-800 font-semibold">01 Bác sĩ Gia đình trực thuộc</strong>{' '}
                phụ trách toàn bộ hộ gia đình.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                asChild
                variant="outline"
                className="min-h-11 bg-primary/10 hover:bg-primary/15 text-primary border-primary/20 rounded-xl text-sm font-semibold gap-2"
              >
                <Link href="/family/subscription">
                  <span className="material-symbols-outlined text-[19px]">history_edu</span>
                  <span>Hợp Đồng &amp; Gói Dịch Vụ</span>
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  showToast('Đang chuẩn bị xuất file Sổ Hộ Tịch Y Tế PDF...');
                  window.print();
                }}
                className="min-h-11 rounded-xl text-sm font-medium gap-2"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
                <span>Xuất PDF</span>
              </Button>
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
                <span className="material-symbols-outlined text-[20px] text-primary">cottage</span>
                <span className="font-bold text-slate-900 text-sm">Hồ Sơ Hộ Gia Đình</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {activeContract ? 'Hợp đồng hiệu lực' : 'Đang đồng bộ'}
                </span>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">HĐ: {contractBadgeCode}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">account_circle</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium block">Đại diện chủ hộ</span>
                  <div className="font-bold text-sm text-slate-900 truncate">{repName}</div>
                  <div className="text-xs text-slate-500 tabular-nums">SĐT: {repPhone}</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <span className="material-symbols-outlined text-[20px]">home_pin</span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium block">Địa chỉ khám tại nhà</span>
                  <div className="font-bold text-sm text-slate-900 truncate">{homeAddress}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {memberLimit !== null
                      ? `Hạn mức sử dụng: ${membersList.length}/${memberLimit} thành viên`
                      : 'Theo dõi hồ sơ hộ gia đình'}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-primary">workspace_premium</span>
                <div>
                  <span className="font-bold text-primary">{packageName}</span>
                  <p className="text-slate-600 text-[11px] line-clamp-1">{packageDesc}</p>
                </div>
              </div>
              <Link
                href="/family/billing"
                className="text-[11px] font-semibold text-primary hover:underline whitespace-nowrap self-start sm:self-auto inline-flex items-center gap-1"
              >
                <span>Gói &amp; Thanh toán</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Cột Phải (5 cols): 01 BÁC SĨ GIA ĐÌNH TRỰC THUỘC HỘ */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0037c1] to-[#00237a] rounded-2xl p-6 text-white shadow-md flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/15">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-blue-100 text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
                  <span>Bác Sĩ Gia Đình Trực Thuộc Hộ</span>
                </div>
                <Link
                  href="/contact"
                  className="text-xs text-blue-200 hover:text-white underline"
                >
                  Yêu cầu đổi bác sĩ
                </Link>
              </div>

              {assignedDoctor ? (
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative shrink-0">
                    {assignedDoctor.avatarUrl ? (
                      <img
                        src={assignedDoctor.avatarUrl}
                        alt={assignedDoctor.fullName}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/60 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/20 text-white font-bold text-lg flex items-center justify-center ring-2 ring-white/60 shadow-md">
                        {getInitials(assignedDoctor.fullName)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#0037c1] flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-white leading-tight truncate">
                      {assignedDoctor.fullName}
                    </h3>
                    <p className="text-xs text-blue-100 mt-0.5 truncate">{assignedDoctor.title}</p>
                    <p className="text-[11px] text-blue-200/80 truncate mt-0.5">
                      {assignedDoctor.hospitalName} · {assignedDoctor.experienceYears} năm kinh nghiệm
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-blue-100">
                  {activeContract
                    ? 'Cơ sở y tế đang hoàn tất phân công bác sĩ phụ trách chính thức cho hợp đồng.'
                    : 'Đang tải thông tin bác sĩ phụ trách từ hợp đồng hiệu lực.'}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-blue-100 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-300 shrink-0">
                  verified_user
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-blue-200/70 block font-semibold">
                    Phạm vi phục vụ hợp đồng
                  </span>
                  <span className="font-medium text-white truncate block">
                    {activeContract
                      ? `Tối đa ${activeContract.memberCount} thành viên thuộc hộ gia đình`
                      : 'Theo dõi đồng bộ theo hợp đồng hiện hành'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href={assignedDoctor?.phone ? `tel:${assignedDoctor.phone.replace(/\s+/g, '')}` : 'tel:19008821'}
                  className="py-2.5 px-3 rounded-xl bg-white text-primary hover:bg-blue-50 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Hotline 24/7</span>
                </a>

                <Link
                  href="/family/appointments"
                  className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">event_available</span>
                  <span>Đặt lịch khám</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. DANH SÁCH THÀNH VIÊN TRONG HỘ */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">group</span>
                <span>
                  Thành Viên Trong Hộ ({filteredMembers.length}
                  {memberLimit !== null && !searchQuery.trim() ? `/${memberLimit}` : ''})
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh bạ y tế và mã số bảo hiểm y tế của các thành viên đang hoạt động trong gia đình
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                  search
                </span>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc BHYT..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-xl"
                />
              </div>

              <Button
                type="button"
                disabled={isQuotaReached}
                onClick={() => {
                  setAddError(null);
                  setShowAddMemberModal(true);
                }}
                title={
                  isQuotaReached
                    ? `Đã đạt giới hạn ${memberLimit}/${memberLimit} thành viên của gói hiện tại`
                    : 'Thêm thành viên mới'
                }
                className="rounded-xl text-xs sm:text-sm font-semibold shrink-0 gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden sm:inline">
                  {isQuotaReached ? 'Đã đủ suất gói' : 'Thêm thành viên'}
                </span>
              </Button>
            </div>
          </div>

          {loadError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3"
            >
              <span>{loadError}</span>
            </div>
          )}

          {isQuotaReached && (
            <div
              data-testid="member-quota-reached-banner"
              className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <span>
                Hộ gia đình đã sử dụng đủ <strong>{membersList.length}/{memberLimit}</strong> suất thành viên theo hợp đồng hiện tại.
              </span>
              <Link
                href="/family/billing"
                className="font-semibold text-primary hover:underline shrink-0"
              >
                Nâng cấp gói hoặc mua thêm suất →
              </Link>
            </div>
          )}

          {/* DANH SÁCH THÀNH VIÊN */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 space-y-2">
                <p className="text-sm font-semibold text-slate-700">Đang tải danh sách thành viên...</p>
              </div>
            ) : membersList.length === 0 ? (
              <div
                data-testid="family-members-empty-state"
                className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 space-y-3"
              >
                <span className="material-symbols-outlined text-4xl text-slate-300">group_add</span>
                <p className="text-base font-bold text-slate-800">
                  Chưa có hồ sơ thành viên nào trong hộ gia đình
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {memberLimit !== null
                    ? `Gói dịch vụ của bạn hỗ trợ tối đa ${memberLimit} thành viên. Hãy tạo hồ sơ thành viên đầu tiên để bác sĩ theo dõi sức khỏe.`
                    : 'Hãy thêm hồ sơ thành viên đầu tiên vào sổ hộ tịch y tế của gia đình.'}
                </p>
                <Button
                  type="button"
                  disabled={isQuotaReached}
                  onClick={() => {
                    setAddError(null);
                    setShowAddMemberModal(true);
                  }}
                  className="rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Thêm thành viên đầu tiên</span>
                </Button>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-300">person_search</span>
                <p className="text-sm font-semibold text-slate-700">Không tìm thấy thành viên</p>
                <p className="text-xs text-slate-400">Vui lòng thử lại với từ khóa tìm kiếm khác.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-primary underline cursor-pointer"
                >
                  Xóa tìm kiếm
                </button>
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
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0 border border-primary/20">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/family/members/${m.id}`}
                            className="font-bold text-slate-900 hover:text-primary transition-colors truncate text-sm sm:text-base"
                          >
                            {m.name}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              m.isHouseholdHead
                                ? 'bg-primary/10 text-primary border border-primary/20'
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

                    {/* Cột 2: BHYT & Sức khỏe tóm tắt */}
                    <div className="min-w-0 lg:w-4/12 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">BHYT:</span>
                        <span className="font-bold tabular-nums text-slate-800">{m.bhytNumber}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(m.bhytNumber);
                            showToast(`Đã sao chép mã BHYT: ${m.bhytNumber}`);
                          }}
                          className="text-slate-400 hover:text-primary p-0.5 cursor-pointer"
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
                        className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all inline-flex items-center gap-1"
                      >
                        <span>Xem y bạ</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setEditError(null);
                          setEditingMember(m);
                        }}
                        className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                        title="Sửa thông tin"
                        aria-label={`Sửa thông tin của ${m.name}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      {!m.isHouseholdHead && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingMember(m);
                          }}
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
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">person_add</span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-bold text-base text-white truncate">
                  Thêm Người Thân Vào Sổ Hộ Tịch Y Tế
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 truncate mt-0.5">
                  HĐ {contractBadgeCode} · {assignedDoctor?.fullName || 'Bác sĩ Gia đình FamiDoc'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} className="p-6 space-y-4 text-xs">
            {addError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
              >
                {addError}
              </div>
            )}

            <div>
              <Label className="block font-semibold text-slate-700 mb-1">
                Họ và tên người thân <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Thị Lan"
                className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="block font-semibold text-slate-700 mb-1">
                  Quan hệ với chủ hộ
                </Label>
                <select
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-primary outline-none"
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
                <Label className="block font-semibold text-slate-700 mb-1">
                  Ngày tháng năm sinh
                </Label>
                <Input
                  type="date"
                  value={newBirthDate}
                  onChange={(e) => setNewBirthDate(e.target.value)}
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="block font-semibold text-slate-700 mb-1">
                  Giới tính
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGender('Nam')}
                    className={`py-2 rounded-xl font-semibold border transition-all cursor-pointer ${
                      newGender === 'Nam'
                        ? 'bg-primary/10 border-primary text-primary'
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
                <Label className="block font-semibold text-slate-700 mb-1">
                  Nhóm máu
                </Label>
                <select
                  value={newBloodType}
                  onChange={(e) => setNewBloodType(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-primary outline-none"
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
                <Label className="block font-semibold text-slate-700 mb-1">
                  Mã số thẻ BHYT
                </Label>
                <Input
                  type="text"
                  value={newBhyt}
                  onChange={(e) => setNewBhyt(e.target.value)}
                  placeholder="VD: GD4790123891024"
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-bold tabular-nums uppercase text-xs"
                />
              </div>

              <div>
                <Label className="block font-semibold text-slate-700 mb-1">
                  Nơi ĐKKCB ban đầu
                </Label>
                <Input
                  type="text"
                  value={newBhytHospital}
                  onChange={(e) => setNewBhytHospital(e.target.value)}
                  placeholder="VD: BV Đại học Y Dược"
                  className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <Label className="block font-semibold text-slate-600 mb-1 text-[11px]">
                    Dị ứng thuốc / thức ăn
                  </Label>
                  <Input
                    type="text"
                    value={newAllergies}
                    onChange={(e) => setNewAllergies(e.target.value)}
                    placeholder="VD: Penicillin, Tôm cua..."
                    className="h-9 rounded-lg bg-white text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <Label className="block font-semibold text-slate-600 mb-1 text-[11px]">
                    Bệnh nền đang theo dõi
                  </Label>
                  <Input
                    type="text"
                    value={newChronic}
                    onChange={(e) => setNewChronic(e.target.value)}
                    placeholder="VD: Huyết áp, Dạ dày..."
                    className="h-9 rounded-lg bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmittingAdd}
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingAdd}
                className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{isSubmittingAdd ? 'Đang lưu...' : 'Lưu thành viên'}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CHỈNH SỬA THÔNG TIN THÀNH VIÊN */}
      <Dialog open={Boolean(editingMember)} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          {editingMember && (
            <>
              <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">edit</span>
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="font-bold text-base text-white truncate">
                      Chỉnh Sửa Hồ Sơ: {editingMember.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-blue-100 truncate mt-0.5">
                      HĐ {contractBadgeCode} · {editingMember.relationship}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleUpdateMemberSubmit} className="p-6 space-y-4 text-xs">
                {editError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
                  >
                    {editError}
                  </div>
                )}

                <div>
                  <Label className="block font-semibold text-slate-700 mb-1">Họ và tên</Label>
                  <Input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="block font-semibold text-slate-700 mb-1">Quan hệ với chủ hộ</Label>
                    <Input
                      type="text"
                      value={editingMember.relationship}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, relationship: e.target.value })
                      }
                      className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-slate-700 mb-1">Nhóm máu</Label>
                    <select
                      value={editingMember.bloodType}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, bloodType: e.target.value })
                      }
                      className="w-full h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-primary outline-none"
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
                    <Label className="block font-semibold text-slate-700 mb-1">Mã số thẻ BHYT</Label>
                    <Input
                      type="text"
                      value={editingMember.bhytNumber}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, bhytNumber: e.target.value.toUpperCase() })
                      }
                      className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-bold tabular-nums text-xs"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-slate-700 mb-1">Nơi ĐKKCB ban đầu</Label>
                    <Input
                      type="text"
                      value={editingMember.bhytHospital}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, bhytHospital: e.target.value })
                      }
                      className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block font-semibold text-slate-700 mb-1">
                    Bệnh nền đang theo dõi (ngăn cách bằng dấu phẩy)
                  </Label>
                  <Input
                    type="text"
                    value={editingMember.chronicDiseases.join(', ')}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        chronicDiseases: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmittingEdit}
                    onClick={() => setEditingMember(null)}
                    className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 h-10 rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    <span>{isSubmittingEdit ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}</span>
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: XÁC NHẬN TÁCH THÀNH VIÊN */}
      <ConfirmDialog
        open={Boolean(deletingMember)}
        onOpenChange={(open) => !open && setDeletingMember(null)}
        title="Xác nhận tách thành viên khỏi hộ"
        description={
          deletingMember ? (
            <>
              Bạn có chắc chắn muốn tách hồ sơ y tế của{' '}
              <strong className="font-semibold text-slate-900">{deletingMember.name}</strong> (
              {deletingMember.relationship}) khỏi danh sách thành viên hoạt động? Lịch sử y khoa trước đây vẫn được bảo toàn và
              suất thành viên sẽ được giải phóng. HĐ {contractBadgeCode}
            </>
          ) : undefined
        }
        headerIcon={<span className="material-symbols-outlined text-[22px] text-rose-600">warning</span>}
        confirmLabel="Xác nhận tách"
        cancelLabel="Hủy bỏ"
        variant="destructive"
        isLoading={isSubmittingDelete}
        onConfirm={handleDeleteMember}
      >
        {deleteError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
          >
            {deleteError}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
