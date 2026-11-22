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
  type AllergenType,
  type AllergySeverity,
  type FamilyGateStatusDto,
  type PatientDto,
  type PatientGender,
  type PatientRelationship,
} from '@/lib/api';
import { FAMILY_GATE_REFRESH_EVENT } from '@/components/layout/family-subscription-gate';

export interface MemberProfile {
  id: string;
  name: string;
  relationship: string;
  rawDateOfBirth: string;
  birthDate: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  avatar: string;
  bloodType: string;
  allergies: string[];
  chronicDiseases: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  isHouseholdHead?: boolean;
}

interface DraftAllergyItem {
  id: string;
  allergenName: string;
  allergenType: AllergenType;
  severity: AllergySeverity;
  clinicalManifestation: string;
}

const BLOOD_TYPE_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

const ALLERGEN_TYPE_OPTIONS: { value: AllergenType; label: string }[] = [
  { value: 'DRUG', label: 'Thuốc' },
  { value: 'FOOD', label: 'Thực phẩm' },
  { value: 'ENVIRONMENTAL', label: 'Môi trường' },
];

const ALLERGY_SEVERITY_OPTIONS: { value: AllergySeverity; label: string }[] = [
  { value: 'MILD', label: 'Nhẹ' },
  { value: 'MODERATE', label: 'Trung bình' },
  { value: 'LIFE_THREATENING_ANAPHYLAXIS', label: 'Nguy hiểm (Sốc phản vệ)' },
];

function getTodayIsoInVietnam(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());
}

function validateBirthDateInput(rawDate: string, required: boolean): string | null {
  const trimmed = rawDate.trim();
  if (!trimmed) {
    return required ? 'Vui lòng nhập ngày tháng năm sinh của thành viên.' : null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return 'Ngày tháng năm sinh không hợp lệ.';
  }

  const dobIso = parsed.toISOString().slice(0, 10);
  const todayVn = getTodayIsoInVietnam();
  if (dobIso > todayVn) {
    return 'Ngày sinh không thể là ngày trong tương lai.';
  }

  const minYear = Number(todayVn.slice(0, 4)) - 120;
  const minDobIso = `${String(minYear).padStart(4, '0')}${todayVn.slice(4)}`;
  if (dobIso < minDobIso) {
    return 'Ngày sinh không hợp lệ (tuổi vượt quá 120 năm).';
  }

  return null;
}

function mapGenderLabelToCode(gender: MemberProfile['gender']): PatientGender {
  if (gender === 'Nữ') return 'FEMALE';
  if (gender === 'Khác') return 'OTHER';
  return 'MALE';
}

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
    gender: p.gender === 'FEMALE' ? 'Nữ' : p.gender === 'OTHER' ? 'Khác' : 'Nam',
    avatar: p.gender === 'FEMALE' ? '👩' : p.gender === 'OTHER' ? '🧑' : '👨',
    bloodType: p.bloodType?.trim() || 'Chưa rõ',
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
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nữ');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newAllergyRows, setNewAllergyRows] = useState<DraftAllergyItem[]>([]);
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
  const remainingSlots = memberLimit !== null ? Math.max(0, memberLimit - membersList.length) : null;
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
    setNewRelation('Con gái');
    setNewGender('Nữ');
    setNewBloodType('O+');
    setNewAllergyRows([]);
    setNewChronic('');
    setAddError(null);
  };

  const addDraftAllergyRow = () => {
    setNewAllergyRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        allergenName: '',
        allergenType: 'DRUG',
        severity: 'MILD',
        clinicalManifestation: '',
      },
    ]);
  };

  const updateDraftAllergyRow = (
    id: string,
    patch: Partial<Omit<DraftAllergyItem, 'id'>>
  ) => {
    setNewAllergyRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeDraftAllergyRow = (id: string) => {
    setNewAllergyRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;
    if (!newName.trim()) {
      setAddError('Vui lòng nhập họ và tên người thân.');
      return;
    }

    const dobValidationError = validateBirthDateInput(newBirthDate, true);
    if (dobValidationError) {
      setAddError(dobValidationError);
      return;
    }

    setAddError(null);
    setIsSubmittingAdd(true);

    try {
      const created = await patientsApi.createFamilyMember({
        fullName: newName.trim(),
        dateOfBirth: newBirthDate.trim(),
        gender: mapGenderLabelToCode(newGender),
        relationshipToRepresentative: mapRelationLabelToCode(newRelation),
        bloodType: newBloodType !== 'Chưa rõ' ? newBloodType : undefined,
        chronicDiseases: newChronic.trim() || undefined,
      });

      const validAllergies = newAllergyRows
        .map((row) => ({
          ...row,
          allergenName: row.allergenName.trim(),
          clinicalManifestation: row.clinicalManifestation.trim(),
        }))
        .filter((row) => Boolean(row.allergenName));

      let allergyWarning = false;
      let savedAllergyNames: string[] = [];
      if (validAllergies.length > 0) {
        const allergyResults = await Promise.allSettled(
          validAllergies.map((row) =>
            patientsApi.addMemberAllergy(created.id, {
              allergenType: row.allergenType,
              allergenName: row.allergenName,
              severity: row.severity,
              clinicalManifestation: row.clinicalManifestation || undefined,
            })
          )
        );
        allergyWarning = allergyResults.some((r) => r.status === 'rejected');
        savedAllergyNames = validAllergies
          .filter((_, idx) => allergyResults[idx].status === 'fulfilled')
          .map((row) => row.allergenName);
      }

      const createdProfile = mapPatientDtoToMemberProfile(
        created,
        { name: repName, phone: repPhone },
        savedAllergyNames
      );

      setMembersList((prev) => [...prev, createdProfile]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(FAMILY_GATE_REFRESH_EVENT));
      }
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

    const dobValidationError = validateBirthDateInput(editingMember.rawDateOfBirth, false);
    if (dobValidationError) {
      setEditError(dobValidationError);
      return;
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
        gender: mapGenderLabelToCode(editingMember.gender),
        relationshipToRepresentative: mapRelationLabelToCode(editingMember.relationship),
        bloodType: editingMember.bloodType !== 'Chưa rõ' ? editingMember.bloodType : '',
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

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-7 px-3 py-0 rounded-full text-xs font-semibold leading-none tabular-nums text-primary bg-primary/10 border-primary/20"
                >
                  HĐ {contractBadgeCode}
                </Badge>
                <span
                  data-testid="member-quota-badge"
                  className={`inline-flex h-7 items-center gap-1.5 px-3 rounded-full text-xs font-semibold leading-none tabular-nums border whitespace-nowrap ${
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
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex h-7 items-center gap-1.5 px-3 py-0 rounded-full text-xs font-medium leading-none bg-white text-slate-600 border border-slate-200/80 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[15px] leading-none text-slate-500">
                    verified
                  </span>
                  <span>Đồng bộ Hồ sơ FamiDoc</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Danh Sách Thành Viên
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Quản lý hồ sơ y tế, nhóm máu, tiền sử dị ứng và phân bổ suất thành viên theo hợp đồng bác sĩ gia đình.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 md:pb-0.5">
              <Button
                asChild
                variant="outline"
                className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-xs rounded-xl text-sm font-semibold gap-2"
              >
                <Link href="/family/subscription">
                  <span className="material-symbols-outlined text-[18px] leading-none text-primary">
                    history_edu
                  </span>
                  <span>Hợp Đồng &amp; Gói Dịch Vụ</span>
                </Link>
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
          <div className="lg:col-span-5 bg-gradient-to-br from-blue-300/80 via-sky-200/90 to-indigo-200/80 border border-blue-400/50 rounded-2xl p-6 text-slate-900 shadow-xs flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/45 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-blue-300/80">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-blue-200 text-primary text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                  <span>Bác Sĩ Gia Đình Trực Thuộc Hộ</span>
                </div>
                <Link
                  href="/contact"
                  className="text-xs font-semibold text-blue-900 hover:text-blue-950 underline"
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
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white text-primary font-bold text-lg flex items-center justify-center border border-blue-200 ring-2 ring-white shadow-xs">
                        {getInitials(assignedDoctor.fullName)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight truncate">
                      {assignedDoctor.fullName}
                    </h3>
                    <p className="text-xs font-medium text-slate-800 mt-0.5 truncate">{assignedDoctor.title}</p>
                    <p className="text-[11px] font-medium text-slate-700 truncate mt-0.5">
                      {assignedDoctor.hospitalName} · {assignedDoctor.experienceYears} năm kinh nghiệm
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl bg-white/90 border border-blue-200/80 text-xs text-slate-600">
                  {activeContract
                    ? 'Cơ sở y tế đang hoàn tất phân công bác sĩ phụ trách chính thức cho hợp đồng.'
                    : 'Đang tải thông tin bác sĩ phụ trách từ hợp đồng hiệu lực.'}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/90 border border-blue-200/80 text-xs text-slate-700 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">
                  verified_user
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-semibold">
                    Phạm vi phục vụ hợp đồng
                  </span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {activeContract
                      ? `Tối đa ${activeContract.memberCount} thành viên thuộc hộ gia đình`
                      : 'Theo dõi đồng bộ theo hợp đồng hiện hành'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href={assignedDoctor?.phone ? `tel:${assignedDoctor.phone.replace(/\s+/g, '')}` : 'tel:19008821'}
                  className="py-2.5 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Hotline 24/7</span>
                </a>

                <Link
                  href="/family/appointments"
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-primary text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
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
                  placeholder="Tìm theo tên, quan hệ hoặc bệnh nền..."
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
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-4 sm:px-5 sm:py-4 transition-all shadow-2xs hover:shadow-xs grid grid-cols-1 lg:grid-cols-[minmax(260px,1.25fr)_minmax(220px,1fr)_auto] lg:items-center gap-3.5 lg:gap-5"
                  >
                    {/* Cột 1: Thông tin nhân khẩu & Nhóm máu */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-11 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/20">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/family/members/${m.id}`}
                            className="font-bold text-slate-900 hover:text-primary transition-colors truncate text-sm sm:text-[15px]"
                          >
                            {m.name}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${m.isHouseholdHead
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {m.relationship}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 tabular-nums shrink-0">
                            {m.bloodType}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-1.5 tabular-nums">
                          <span>{m.gender}</span>
                          <span aria-hidden="true">•</span>
                          <span>{ageDisplay}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cột 2: Sức khỏe tóm tắt (2 dòng cân đối với cột 1) */}
                    <div className="min-w-0 flex flex-col justify-center gap-1 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-400">Sức khỏe:</span>
                        {hasChronic ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            Đang theo dõi
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Bình thường
                          </span>
                        )}
                        {hasAllergy && (
                          <span className="inline-flex items-center rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                            Dị ứng
                          </span>
                        )}
                      </div>
                      <p
                        title={hasChronic ? m.chronicDiseases.join(', ') : 'Chưa ghi nhận bệnh lý nền'}
                        className="text-xs text-slate-600 truncate"
                      >
                        {hasChronic ? m.chronicDiseases.join(', ') : 'Chưa ghi nhận bệnh lý nền'}
                      </p>
                    </div>

                    {/* Cột 3: Nút xem hồ sơ và thao tác (thẳng hàng dọc giữa mọi thành viên) */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0 shrink-0">
                      <Link
                        href={`/family/medical-book?patientId=${encodeURIComponent(m.id)}`}
                        className="inline-flex items-center justify-center gap-1 h-8 rounded-lg border border-teal-200/80 bg-teal-50/60 hover:bg-teal-100/70 px-3 text-xs font-semibold text-teal-800 transition-colors whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">clinical_notes</span>
                        <span>Sổ khám</span>
                      </Link>
                      <Link
                        href={`/family/members/${m.id}`}
                        className="inline-flex items-center justify-center gap-1 h-8 px-3.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all whitespace-nowrap"
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
                        className="size-8 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Sửa thông tin"
                        aria-label={`Sửa thông tin của ${m.name}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      {!m.isHouseholdHead ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingMember(m);
                          }}
                          className="size-8 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Tách khỏi hộ"
                          aria-label={`Tách ${m.name} khỏi hộ`}
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      ) : (
                        <span className="hidden lg:inline-block size-8 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* MODAL 1: THÊM THÀNH VIÊN MỚI */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0">
          <DialogHeader className="px-6 py-5 bg-primary text-primary-foreground text-left shrink-0">
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
                  {remainingSlots !== null && memberLimit !== null
                    ? ` · Còn ${remainingSlots}/${memberLimit} suất`
                    : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} noValidate className="p-6 space-y-4 text-xs overflow-y-auto">
            {addError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
              >
                {addError}
              </div>
            )}

            <div>
              <Label htmlFor="add-member-name" className="block font-semibold text-slate-700 mb-1">
                Họ và tên người thân <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="add-member-name"
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
                <Label htmlFor="add-member-relation" className="block font-semibold text-slate-700 mb-1">
                  Quan hệ với chủ hộ
                </Label>
                <select
                  id="add-member-relation"
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
                <Label htmlFor="add-member-dob" className="block font-semibold text-slate-700 mb-1">
                  Ngày tháng năm sinh <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="add-member-dob"
                  type="date"
                  required
                  max={getTodayIsoInVietnam()}
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
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGender('Nam')}
                    className={`py-2 rounded-xl font-semibold border transition-all cursor-pointer ${newGender === 'Nam'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGender('Nữ')}
                    className={`py-2 rounded-xl font-semibold border transition-all cursor-pointer ${newGender === 'Nữ'
                      ? 'bg-rose-50 border-rose-500 text-rose-600'
                      : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    Nữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGender('Khác')}
                    className={`py-2 rounded-xl font-semibold border transition-all cursor-pointer ${newGender === 'Khác'
                      ? 'bg-slate-100 border-slate-500 text-slate-800'
                      : 'border-slate-200 text-slate-600'
                      }`}
                  >
                    Khác
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="add-member-blood-type" className="block font-semibold text-slate-700 mb-1">
                  Nhóm máu
                </Label>
                <select
                  id="add-member-blood-type"
                  value={newBloodType}
                  onChange={(e) => setNewBloodType(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:border-primary outline-none"
                >
                  {BLOOD_TYPE_OPTIONS.map((bt) => (
                    <option key={bt} value={bt}>
                      Nhóm máu {bt}
                    </option>
                  ))}
                  <option value="Chưa rõ">Chưa rõ nhóm máu</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div>
                <Label htmlFor="add-member-chronic" className="block font-semibold text-slate-600 mb-1 text-[11px]">
                  Bệnh nền đang theo dõi
                </Label>
                <Input
                  id="add-member-chronic"
                  type="text"
                  value={newChronic}
                  onChange={(e) => setNewChronic(e.target.value)}
                  placeholder="VD: Huyết áp, Dạ dày..."
                  className="h-9 rounded-lg bg-white text-slate-900 text-xs"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200/70">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700 text-[11px]">
                    Tiền sử dị ứng (tùy chọn)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDraftAllergyRow}
                    className="h-7 rounded-lg px-2.5 text-[11px] font-semibold"
                  >
                    + Thêm dị ứng
                  </Button>
                </div>

                {newAllergyRows.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    Chưa khai báo dị ứng. Nhấn &quot;+ Thêm dị ứng&quot; nếu thành viên có tiền sử dị ứng thuốc, thực phẩm hoặc môi trường.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {newAllergyRows.map((row, idx) => (
                      <div
                        key={row.id}
                        className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            aria-label={`Tên dị nguyên ${idx + 1}`}
                            value={row.allergenName}
                            onChange={(e) =>
                              updateDraftAllergyRow(row.id, { allergenName: e.target.value })
                            }
                            placeholder="Tên dị nguyên (VD: Penicillin, Tôm cua)"
                            className="h-8 rounded-lg bg-slate-50/50 text-slate-900 text-xs flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeDraftAllergyRow(row.id)}
                            aria-label={`Xóa dị ứng ${idx + 1}`}
                            className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            aria-label={`Nhóm dị ứng ${idx + 1}`}
                            value={row.allergenType}
                            onChange={(e) =>
                              updateDraftAllergyRow(row.id, {
                                allergenType: e.target.value as AllergenType,
                              })
                            }
                            className="h-8 px-2.5 rounded-lg border border-input bg-slate-50/50 text-slate-900 text-xs outline-none focus:border-primary"
                          >
                            {ALLERGEN_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <select
                            aria-label={`Mức độ dị ứng ${idx + 1}`}
                            value={row.severity}
                            onChange={(e) =>
                              updateDraftAllergyRow(row.id, {
                                severity: e.target.value as AllergySeverity,
                              })
                            }
                            className="h-8 px-2.5 rounded-lg border border-input bg-slate-50/50 text-slate-900 text-xs outline-none focus:border-primary"
                          >
                            {ALLERGY_SEVERITY_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <Input
                          type="text"
                          aria-label={`Biểu hiện lâm sàng ${idx + 1}`}
                          value={row.clinicalManifestation}
                          onChange={(e) =>
                            updateDraftAllergyRow(row.id, {
                              clinicalManifestation: e.target.value,
                            })
                          }
                          placeholder="Biểu hiện lâm sàng (VD: Nổi mề đay, khó thở...)"
                          className="h-8 rounded-lg bg-slate-50/50 text-slate-900 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
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
                      {BLOOD_TYPE_OPTIONS.map((bt) => (
                        <option key={bt} value={bt}>
                          Nhóm máu {bt}
                        </option>
                      ))}
                      <option value="Chưa rõ">Chưa rõ nhóm máu</option>
                    </select>
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
