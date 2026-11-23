'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared';
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
  type PatientAllergyDto,
  type PatientChronicConditionDto,
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
  heightCm?: number | null;
  weightKg?: number | null;
  allergies: PatientAllergyDto[];
  allergyNames: string[];
  allergyIds: string[];
  chronicConditions: PatientChronicConditionDto[];
  chronicDiseases: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  isHouseholdHead?: boolean;
}

interface DraftAllergyItem {
  id: string;
  persistedId?: string;
  allergenName: string;
  allergenType: AllergenType;
  severity: AllergySeverity;
  clinicalManifestation: string;
}

const BLOOD_TYPE_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

const STANDARD_RELATION_OPTIONS = [
  { value: 'Cha ruột', label: 'Cha ruột' },
  { value: 'Mẹ ruột', label: 'Mẹ ruột' },
  { value: 'Vợ', label: 'Vợ' },
  { value: 'Chồng', label: 'Chồng' },
  { value: 'Con trai', label: 'Con trai' },
  { value: 'Con gái', label: 'Con gái' },
  { value: 'Khác', label: 'Người thân khác' },
] as const;

const COMMON_CHRONIC_CONDITIONS = [
  'Tăng huyết áp',
  'Tiểu đường',
  'Tim mạch',
  'Mỡ máu',
  'Dạ dày',
  'Hen suyễn',
] as const;

function parseChronicInput(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isChronicChipSelected(raw: string, condition: string): boolean {
  const target = condition.toLowerCase();
  return parseChronicInput(raw).some((item) => item.toLowerCase() === target);
}

function toggleChronicInputCondition(raw: string, condition: string): string {
  const current = parseChronicInput(raw);
  const target = condition.toLowerCase();
  const exists = current.some((item) => item.toLowerCase() === target);
  const next = exists
    ? current.filter((item) => item.toLowerCase() !== target)
    : [...current, condition];
  return next.join(', ');
}

function ChronicQuickChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2" role="group" aria-label="Chọn nhanh bệnh nền phổ biến">
      <span className="text-[11px] font-medium text-slate-500 mr-0.5">Chọn nhanh:</span>
      {COMMON_CHRONIC_CONDITIONS.map((condition) => {
        const selected = isChronicChipSelected(value, condition);
        return (
          <button
            key={condition}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(toggleChronicInputCondition(value, condition))}
            className={`inline-flex items-center gap-1 min-h-8 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${selected
              ? 'bg-primary/10 border-primary text-primary font-semibold'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
          >
            {selected && (
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                check
              </span>
            )}
            <span>{condition}</span>
          </button>
        );
      })}
    </div>
  );
}

function AllergyEditorBlock({
  rows,
  onAdd,
  onUpdate,
  onRemove,
}: {
  rows: DraftAllergyItem[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Omit<DraftAllergyItem, 'id' | 'persistedId'>>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-800 text-xs">
          Tiền sử dị ứng <span className="font-normal text-slate-500">(tùy chọn)</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="min-h-9 rounded-lg px-3 text-xs font-semibold bg-white"
        >
          + Thêm dị ứng
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-600">
          Để trống nếu chưa ghi nhận dị ứng thuốc, thực phẩm hoặc môi trường.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  maxLength={120}
                  aria-label={`Chất hoặc thuốc gây dị ứng ${idx + 1}`}
                  value={row.allergenName}
                  onChange={(e) => onUpdate(row.id, { allergenName: e.target.value })}
                  placeholder="Chất hoặc thuốc gây dị ứng (VD: Penicillin, Tôm cua)"
                  className="min-h-11 sm:h-9 rounded-lg bg-slate-50/50 text-slate-900 text-base sm:text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => onRemove(row.id)}
                  aria-label={`Xóa dị ứng ${idx + 1}`}
                  className="h-11 w-11 sm:h-9 sm:w-9 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  aria-label={`Nhóm dị ứng ${idx + 1}`}
                  value={row.allergenType}
                  onChange={(e) =>
                    onUpdate(row.id, { allergenType: e.target.value as AllergenType })
                  }
                  className="min-h-11 sm:h-9 px-2.5 rounded-lg border border-input bg-slate-50/50 text-slate-900 text-base sm:text-xs outline-none focus:border-primary"
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
                    onUpdate(row.id, { severity: e.target.value as AllergySeverity })
                  }
                  className="min-h-11 sm:h-9 px-2.5 rounded-lg border border-input bg-slate-50/50 text-slate-900 text-base sm:text-xs outline-none focus:border-primary"
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
                maxLength={250}
                aria-label={`Triệu chứng gặp phải ${idx + 1}`}
                value={row.clinicalManifestation}
                onChange={(e) =>
                  onUpdate(row.id, { clinicalManifestation: e.target.value })
                }
                placeholder="Triệu chứng gặp phải (VD: Nổi mề đay, khó thở...)"
                className="min-h-11 sm:h-9 rounded-lg bg-slate-50/50 text-slate-900 text-base sm:text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return 'Ngày tháng năm sinh không hợp lệ.';
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) {
    return 'Ngày tháng năm sinh không hợp lệ.';
  }

  const dobIso = trimmed;
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
  const initials = Array.from(fullName.trim())
    .join('')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => Array.from(part)[0] ?? '')
    .join('')
    .toUpperCase();
  return initials || '?';
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
  extraAllergiesOrDtos?: string[] | PatientAllergyDto[]
): MemberProfile {
  const { rawDate, display } = formatBirthDisplay(p.dateOfBirth);
  const relKey = (p.relationshipToHead || 'OTHER').trim().toUpperCase();

  let allergyDtos: PatientAllergyDto[] = [];
  let allergyList: string[] = [];
  let allergyIdList: string[] = [];

  if (Array.isArray(extraAllergiesOrDtos)) {
    const dtos: PatientAllergyDto[] = [];
    for (const item of extraAllergiesOrDtos) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && !trimmed.toLowerCase().includes('không có')) {
          dtos.push({
            allergenType: 'DRUG',
            allergenName: trimmed,
            severity: 'MILD',
          });
        }
      } else if (item && item.allergenName?.trim()) {
        dtos.push(item);
      }
    }
    allergyDtos = dtos;
    allergyList = dtos.length > 0 ? dtos.map((a) => a.allergenName) : ['Không có tiền sử dị ứng'];
    allergyIdList = dtos.map((a) => a.id).filter(Boolean) as string[];
  } else if (p.allergies && p.allergies.length > 0) {
    allergyDtos = p.allergies;
    allergyList = p.allergies.map((a) => a.allergenName);
    allergyIdList = p.allergies.map((a) => a.id).filter(Boolean) as string[];
  } else {
    allergyDtos = [];
    allergyList = ['Không có tiền sử dị ứng'];
  }

  const structuredConditions = Array.isArray(p.chronicConditions) ? p.chronicConditions : [];
  const chronicList =
    structuredConditions.length > 0
      ? structuredConditions.map((c) => c.conditionName).filter(Boolean)
      : p.chronicDiseases && p.chronicDiseases.trim()
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
    avatar: '',
    bloodType: p.bloodType?.trim() || 'Chưa rõ',
    heightCm: p.heightCm ?? null,
    weightKg: p.weightKg ?? null,
    allergies: allergyDtos,
    allergyNames: allergyList,
    allergyIds: allergyIdList,
    chronicConditions: structuredConditions,
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
  const [editChronicInput, setEditChronicInput] = useState('');
  const [editAllergyRows, setEditAllergyRows] = useState<DraftAllergyItem[]>([]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingMember, setDeletingMember] = useState<MemberProfile | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const loadRequestIdRef = useRef(0);
  const addErrorRef = useRef<HTMLDivElement | null>(null);
  const editErrorRef = useRef<HTMLDivElement | null>(null);

  // Form State Thêm Thành Viên
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newRelation, setNewRelation] = useState('Con gái');
  const [newGender, setNewGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nữ');
  const [newBloodType, setNewBloodType] = useState('O+');
  const [newHeightCm, setNewHeightCm] = useState('');
  const [newWeightKg, setNewWeightKg] = useState('');
  const [newAllergyRows, setNewAllergyRows] = useState<DraftAllergyItem[]>([]);
  const [newChronic, setNewChronic] = useState('');

  const showToast = (msg: string) => {
    toast.success(msg);
  };

  const loadFamilyMembersData = useCallback(async (isMountedCheck?: () => boolean) => {
    const requestId = ++loadRequestIdRef.current;
    setIsLoading(true);
    setLoadError(null);

    const [membersResult, gateResult] = await Promise.allSettled([
      patientsApi.getFamilyMembers(),
      contractsApi.getFamilyGateStatus(),
    ]);

    if (isMountedCheck && !isMountedCheck()) return;
    if (requestId !== loadRequestIdRef.current) return;

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
      setLoadError(
        extractErrorMessage(
          membersResult.reason,
          'Không thể tải danh sách thành viên từ máy chủ.'
        )
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (addError && addErrorRef.current && typeof addErrorRef.current.scrollIntoView === 'function') {
      addErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [addError]);

  useEffect(() => {
    if (editError && editErrorRef.current && typeof editErrorRef.current.scrollIntoView === 'function') {
      editErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editError]);

  useEffect(() => {
    let mounted = true;
    loadFamilyMembersData(() => mounted);

    return () => {
      mounted = false;
    };
  }, [loadFamilyMembersData]);

  const activeContract = gateStatus?.activeContract ?? null;
  const familyUnit = gateStatus?.familyUnit ?? null;
  const assignedDoctor = activeContract?.doctor ?? null;
  const memberLimit = activeContract?.memberCount ?? null;
  const remainingSlots = memberLimit !== null ? Math.max(0, memberLimit - membersList.length) : null;
  const isQuotaReached = memberLimit !== null && membersList.length >= memberLimit;

  const repName = familyUnit?.representativeName || 'Đại diện hộ gia đình';
  const repPhone = familyUnit?.emergencyPhone || 'Chưa cập nhật';
  const packageName = activeContract?.packageName || 'Gói chăm sóc gia đình đang kích hoạt';

  const hasRealChronic = (m: MemberProfile) =>
    !m.chronicDiseases.some((cd) => cd.toLowerCase().includes('không có'));
  const hasRealAllergy = (m: MemberProfile) =>
    !m.allergyNames.some((a) => a.toLowerCase().includes('không có'));

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

  const openAddModal = () => {
    setAddError(null);
    setShowAddMemberModal(true);
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

    const incompleteAllergyRow = newAllergyRows.find(
      (row) => !row.allergenName.trim() && row.clinicalManifestation.trim()
    );
    if (incompleteAllergyRow) {
      setAddError('Vui lòng nhập tên chất hoặc thuốc gây dị ứng cho dòng đã ghi triệu chứng.');
      return;
    }

    setAddError(null);
    setIsSubmittingAdd(true);

    try {
      const parsedHeight = newHeightCm.trim() ? Number(newHeightCm.trim()) : undefined;
      const parsedWeight = newWeightKg.trim() ? Number(newWeightKg.trim()) : undefined;
      const created = await patientsApi.createFamilyMember({
        fullName: newName.trim(),
        dateOfBirth: newBirthDate.trim(),
        gender: mapGenderLabelToCode(newGender),
        relationshipToRepresentative: mapRelationLabelToCode(newRelation),
        bloodType: newBloodType !== 'Chưa rõ' ? newBloodType : undefined,
        heightCm: parsedHeight !== undefined && Number.isFinite(parsedHeight) ? parsedHeight : undefined,
        weightKg: parsedWeight !== undefined && Number.isFinite(parsedWeight) ? parsedWeight : undefined,
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
      let savedAllergies: PatientAllergyDto[] = [];
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
        savedAllergies = validAllergies
          .map((row, idx) => {
            const res = allergyResults[idx];
            if (res.status !== 'fulfilled') return null;
            return res.value?.allergenName
              ? res.value
              : {
                  id: res.value?.id,
                  allergenType: row.allergenType,
                  allergenName: row.allergenName,
                  severity: row.severity,
                  clinicalManifestation: row.clinicalManifestation || undefined,
                };
          })
          .filter(Boolean) as PatientAllergyDto[];
      }

      const createdProfile = mapPatientDtoToMemberProfile(
        created,
        { name: repName, phone: repPhone },
        savedAllergies
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
          : `Đã thêm thành công "${createdProfile.name}" vào hồ sơ gia đình!`
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

  const openEditModal = (member: MemberProfile) => {
    setEditError(null);
    setEditChronicInput(
      member.chronicDiseases
        .filter((cd) => !cd.toLowerCase().includes('không có'))
        .join(', ')
    );
    setEditAllergyRows(
      member.allergies
        .filter((a) => a.allergenName && !a.allergenName.toLowerCase().includes('không có'))
        .map((a, idx) => ({
          id: a.id || `edit-draft-${idx}`,
          persistedId: a.id,
          allergenName: a.allergenName,
          allergenType: a.allergenType || 'DRUG',
          severity: a.severity || 'MILD',
          clinicalManifestation: a.clinicalManifestation ?? '',
        }))
    );
    setEditingMember(member);
  };

  const addEditDraftAllergyRow = () => {
    setEditAllergyRows((prev) => [
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

  const updateEditDraftAllergyRow = (
    id: string,
    patch: Partial<Omit<DraftAllergyItem, 'id' | 'persistedId'>>
  ) => {
    setEditAllergyRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeEditDraftAllergyRow = (id: string) => {
    setEditAllergyRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleUpdateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || isSubmittingEdit) return;

    if (!editingMember.name.trim()) {
      setEditError('Vui lòng nhập họ và tên thành viên.');
      return;
    }

    const dobValidationError = validateBirthDateInput(editingMember.rawDateOfBirth, false);
    if (dobValidationError) {
      setEditError(dobValidationError);
      return;
    }

    // Validate incomplete allergy rows in edit dialog
    const incompleteAllergyRow = editAllergyRows.find(
      (row) => !row.allergenName.trim() && row.clinicalManifestation.trim()
    );
    if (incompleteAllergyRow) {
      setEditError('Vui lòng nhập tên chất hoặc thuốc gây dị ứng cho dòng đã ghi triệu chứng.');
      return;
    }

    setEditError(null);
    setIsSubmittingEdit(true);

    try {
      const chronicValue = editChronicInput
        .split(',')
        .map((cd) => cd.trim())
        .filter((cd) => Boolean(cd) && !cd.toLowerCase().includes('không có'))
        .join(', ');

      const updated = await patientsApi.updateFamilyMember(editingMember.id, {
        fullName: editingMember.name.trim(),
        dateOfBirth: editingMember.rawDateOfBirth || undefined,
        gender: mapGenderLabelToCode(editingMember.gender),
        relationshipToRepresentative: mapRelationLabelToCode(editingMember.relationship),
        bloodType: editingMember.bloodType !== 'Chưa rõ' ? editingMember.bloodType : '',
        chronicDiseases: chronicValue,
      });

      const normalizedRows = editAllergyRows
        .map((row) => ({
          ...row,
          allergenName: row.allergenName.trim(),
          clinicalManifestation: row.clinicalManifestation.trim(),
        }))
        .filter((row) => Boolean(row.allergenName));

      const existingById = new Map(
        editingMember.allergies
          .filter((a): a is PatientAllergyDto & { id: string } => Boolean(a.id))
          .map((a) => [a.id, a])
      );

      const unchangedDtos: PatientAllergyDto[] = [];
      const rowsToCreate: typeof normalizedRows = [];
      const keptUnchangedIds = new Set<string>();

      for (const row of normalizedRows) {
        const existing = row.persistedId ? existingById.get(row.persistedId) : undefined;
        const isUnchanged =
          existing &&
          existing.allergenName.trim() === row.allergenName &&
          existing.allergenType === row.allergenType &&
          existing.severity === row.severity &&
          (existing.clinicalManifestation ?? '').trim() === row.clinicalManifestation;

        if (existing && isUnchanged) {
          keptUnchangedIds.add(existing.id!);
          unchangedDtos.push(existing);
        } else {
          rowsToCreate.push(row);
        }
      }

      const idsToDelete = editingMember.allergyIds.filter((id) => !keptUnchangedIds.has(id));
      let allergySyncWarning = false;

      if (idsToDelete.length > 0) {
        const deleteResults = await Promise.allSettled(
          idsToDelete.map((id) => patientsApi.deleteMemberAllergy(editingMember.id, id))
        );
        if (deleteResults.some((r) => r.status === 'rejected')) {
          allergySyncWarning = true;
        }
      }

      const createdDtos: PatientAllergyDto[] = [];
      if (rowsToCreate.length > 0) {
        const addResults = await Promise.allSettled(
          rowsToCreate.map((row) =>
            patientsApi.addMemberAllergy(editingMember.id, {
              allergenType: row.allergenType,
              allergenName: row.allergenName,
              severity: row.severity,
              clinicalManifestation: row.clinicalManifestation || undefined,
            })
          )
        );
        rowsToCreate.forEach((row, idx) => {
          const res = addResults[idx];
          if (res.status === 'fulfilled') {
            createdDtos.push(
              res.value?.allergenName
                ? res.value
                : {
                    id: res.value?.id,
                    allergenType: row.allergenType,
                    allergenName: row.allergenName,
                    severity: row.severity,
                    clinicalManifestation: row.clinicalManifestation || undefined,
                  }
            );
          } else {
            allergySyncWarning = true;
          }
        });
      }

      const finalAllergies = [...unchangedDtos, ...createdDtos];
      const updatedProfile = mapPatientDtoToMemberProfile(
        updated,
        { name: repName, phone: repPhone },
        finalAllergies
      );

      setMembersList((prev) =>
        prev.map((m) => (m.id === editingMember.id ? updatedProfile : m))
      );
      setEditingMember(null);
      setEditAllergyRows([]);
      showToast(
        allergySyncWarning
          ? `Đã cập nhật "${updatedProfile.name}" nhưng chưa đồng bộ được toàn bộ ghi chú dị ứng.`
          : `Đã cập nhật thông tin thành viên "${updatedProfile.name}"!`
      );
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
      setDeleteError('Không thể gỡ Chủ hộ khỏi danh sách thành viên.');
      return;
    }

    setDeleteError(null);
    setIsSubmittingDelete(true);

    try {
      await patientsApi.detachFamilyMember(deletingMember.id);
      const removedName = deletingMember.name;
      setMembersList((prev) => prev.filter((m) => m.id !== deletingMember.id));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(FAMILY_GATE_REFRESH_EVENT));
      }
      setDeletingMember(null);
      showToast(`Đã gỡ "${removedName}" khỏi danh sách thành viên.`);
    } catch (err) {
      const message = extractErrorMessage(err, 'Không thể gỡ thành viên khỏi danh sách.');
      setDeleteError(message);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const filteredMembers = membersList.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.relationship.toLowerCase().includes(q) ||
      m.bloodType.toLowerCase().includes(q) ||
      m.chronicDiseases.some((cd) => cd.toLowerCase().includes(q)) ||
      m.allergyNames.some((al) => al.toLowerCase().includes(q))
    );
  });

  const showSearchInput = membersList.length >= 4 || searchQuery.trim().length > 0;
  const sortedMembers = [...filteredMembers].sort((a, b) =>
    a.isHouseholdHead === b.isHouseholdHead ? 0 : a.isHouseholdHead ? -1 : 1
  );

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8 space-y-6">
        {/* 1. HEADER GỌN & HẠN MỨC GÓI */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Quản lý Thành viên
              </h1>
              <span
                data-testid="member-quota-badge"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tabular-nums border ${isQuotaReached
                  ? 'bg-amber-50 text-amber-800 border-amber-200/70'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                  }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${isQuotaReached ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                />
                <span>
                  {memberLimit !== null
                    ? `${membersList.length} / ${memberLimit} thành viên`
                    : `${membersList.length} thành viên y tế`}
                </span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Quản lý thông tin sức khỏe, bệnh nền và dị ứng của từng người thân trong gói {packageName}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            {showSearchInput && (
              <div className="relative w-full sm:w-64">
                <label htmlFor="family-member-search" className="sr-only">
                  Tìm kiếm thành viên theo tên, quan hệ hoặc bệnh nền
                </label>
                <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-[18px]" aria-hidden="true">
                  search
                </span>
                <Input
                  id="family-member-search"
                  type="text"
                  maxLength={100}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm người thân, bệnh nền..."
                  className="w-full pl-9 pr-10 py-1.5 min-h-11 text-base sm:text-sm bg-white rounded-xl"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
                  </button>
                )}
              </div>
            )}

            <Button
              type="button"
              variant={isQuotaReached ? 'outline' : 'default'}
              disabled={isLoading || isQuotaReached}
              onClick={openAddModal}
              title={
                isQuotaReached
                  ? `Đã đạt giới hạn ${memberLimit}/${memberLimit} thành viên của gói hiện tại`
                  : 'Thêm thành viên mới'
              }
              className={`w-full sm:w-auto min-h-11 rounded-xl text-xs sm:text-sm font-semibold shrink-0 gap-1.5 ${isQuotaReached
                ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-100'
                : ''
                }`}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {isQuotaReached ? 'lock' : 'add'}
              </span>
              <span>{isQuotaReached ? 'Đã đủ suất gói' : 'Thêm thành viên'}</span>
            </Button>
          </div>
        </header>

        {isQuotaReached && (
          <div
            data-testid="member-quota-reached-banner"
            className="px-4 py-3 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0" aria-hidden="true">
                info
              </span>
              <span>
                Gia đình bạn đã sử dụng hết <strong>{membersList.length}/{memberLimit}</strong> suất của gói {packageName}.
              </span>
            </div>
            <Link
              href="/family/billing"
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-lg bg-white border border-amber-300/80 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0"
            >
              <span>Nâng cấp gói hoặc mua thêm suất</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* 2. DANH SÁCH THÀNH VIÊN */}
        <section aria-label="Danh sách thành viên gia đình" className="space-y-4">
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              className="bg-white rounded-2xl border border-slate-200/70 p-5 space-y-4"
            >
              <p className="sr-only">Đang tải danh sách thành viên...</p>
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-200/80" />
                    <div className="space-y-2">
                      <div className="h-4 w-36 rounded bg-slate-200/80" />
                      <div className="h-3 w-24 rounded bg-slate-100" />
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="h-8 w-20 rounded-xl bg-slate-100" />
                    <div className="h-8 w-24 rounded-xl bg-slate-200/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="p-6 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0 mt-0.5" aria-hidden="true">
                  error
                </span>
                <div className="space-y-1">
                  <p className="font-semibold">Không thể tải danh sách thành viên</p>
                  <p className="text-xs text-rose-800">{loadError}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => loadFamilyMembersData()}
                className="min-h-11 rounded-xl bg-white border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-semibold shrink-0 gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">refresh</span>
                <span>Tải lại danh sách</span>
              </Button>
            </div>
          ) : membersList.length === 0 ? (
            <div
              data-testid="family-members-empty-state"
              className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 space-y-3"
            >
              <span className="material-symbols-outlined text-4xl text-slate-300" aria-hidden="true">group_add</span>
              <p className="text-base font-bold text-slate-800">
                Gia đình bạn chưa có hồ sơ thành viên nào
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {memberLimit !== null
                  ? `Gói ${packageName} hỗ trợ tối đa ${memberLimit} thành viên. Hãy thêm người thân đầu tiên để bác sĩ bắt đầu theo dõi.`
                  : 'Hãy thêm hồ sơ thành viên đầu tiên vào hồ sơ gia đình.'}
              </p>
              <Button
                type="button"
                disabled={isQuotaReached}
                onClick={openAddModal}
                className="min-h-11 rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
                <span>Thêm thành viên đầu tiên</span>
              </Button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 space-y-3">
              <span className="material-symbols-outlined text-3xl text-slate-300" aria-hidden="true">person_search</span>
              <p className="text-sm font-semibold text-slate-800 break-words">
                Không tìm thấy ai phù hợp với &ldquo;{searchQuery.trim()}&rdquo;
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setSearchQuery('')} className="min-h-10 rounded-xl">
                Xóa từ khóa
              </Button>
            </div>
          ) : (
            <>
              {searchQuery.trim() && (
                <p className="sr-only" role="status" aria-live="polite">
                  Tìm thấy {filteredMembers.length} thành viên phù hợp
                </p>
              )}
              {/* DESKTOP: CLINICAL DIRECTORY TABLE */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-[#f2f3ff]/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-5">Thành viên</th>
                      <th className="py-3.5 px-4">Nhóm máu</th>
                      <th className="py-3.5 px-4">Bệnh nền</th>
                      <th className="py-3.5 px-4">Dị ứng</th>
                      <th className="py-3.5 px-5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-sm">
                    {sortedMembers.map((m) => {
                      const initials = getInitials(m.name);
                      const ageDisplay = m.birthDate.split('(')[1]?.replace(')', '') || m.birthDate;
                      const hasChronic = hasRealChronic(m);
                      const hasAllergy = hasRealAllergy(m);
                      const chronicText = hasChronic ? m.chronicDiseases.join(', ') : 'Không có bệnh nền';
                      const allergySummary = hasAllergy
                        ? m.allergyNames.length > 2
                          ? `${m.allergyNames.slice(0, 2).join(', ')} (+${m.allergyNames.length - 2})`
                          : m.allergyNames.join(', ')
                        : 'Không dị ứng';
                      const hasKnownBloodType = m.bloodType !== 'Chưa rõ';

                      return (
                        <tr
                          key={m.id}
                          className={`transition-colors hover:bg-[#f2f3ff]/40 ${m.isHouseholdHead ? 'bg-[#f2f3ff]/35' : ''}`}
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${m.isHouseholdHead
                                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/15'
                                  : 'bg-primary/10 text-primary'
                                  }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link
                                    href={`/family/members/${m.id}`}
                                    title={m.name}
                                    className="font-bold text-slate-900 hover:text-primary transition-colors truncate max-w-[220px] lg:max-w-[280px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                                  >
                                    {m.name}
                                  </Link>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.isHouseholdHead
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-slate-100 text-slate-700'
                                      }`}
                                  >
                                    {m.relationship}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {m.gender} • {ageDisplay}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${hasKnownBloodType
                                ? 'font-bold text-slate-800 bg-slate-100'
                                : 'text-slate-500 bg-slate-100'
                                }`}
                            >
                              {m.bloodType}
                            </span>
                          </td>

                          <td className="py-4 px-4 max-w-[220px]">
                            <span
                              title={chronicText}
                              className={`text-xs font-medium line-clamp-2 first-letter:uppercase ${hasChronic ? 'text-amber-800' : 'text-emerald-700'}`}
                            >
                              {chronicText}
                            </span>
                          </td>

                          <td className="py-4 px-4 max-w-[220px]">
                            <span
                              title={m.allergyNames.join(', ')}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium max-w-full truncate ${hasAllergy
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                                : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                              {allergySummary}
                            </span>
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/family/medical-book?patientId=${encodeURIComponent(m.id)}`}
                                className="h-9 inline-flex items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-primary bg-white border border-slate-200/90 hover:bg-[#f2f3ff] hover:border-primary/30 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                              >
                                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">clinical_notes</span>
                                <span>Sổ khám</span>
                              </Link>
                              <Link
                                href={`/family/members/${m.id}`}
                                className="h-9 px-3.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs transition-all inline-flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                              >
                                <span>Xem hồ sơ</span>
                                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditModal(m)}
                                className="h-9 w-9 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-primary border border-slate-200/90 flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                                title="Sửa thông tin"
                                aria-label={`Sửa thông tin của ${m.name}`}
                              >
                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                              </button>
                              {!m.isHouseholdHead ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeletingMember(m);
                                  }}
                                  className="h-9 w-9 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/90 hover:border-rose-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-400/50"
                                  title="Gỡ khỏi danh sách"
                                  aria-label={`Gỡ ${m.name} khỏi danh sách`}
                                >
                                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                                </button>
                              ) : (
                                <span className="h-9 w-9 shrink-0" aria-hidden="true" />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {remainingSlots !== null && remainingSlots > 0 && !searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="w-full py-3.5 px-5 border-t border-dashed border-slate-200 hover:bg-primary/5 flex items-center justify-center gap-2 text-xs font-semibold text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
                    <span>Thêm thành viên mới (Còn {remainingSlots}/{memberLimit} suất trống)</span>
                  </button>
                )}
              </div>

              {/* MOBILE: COMPACT STACKED CARDS */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {sortedMembers.map((m) => {
                  const initials = getInitials(m.name);
                  const ageDisplay = m.birthDate.split('(')[1]?.replace(')', '') || m.birthDate;
                  const hasChronic = hasRealChronic(m);
                  const hasAllergy = hasRealAllergy(m);
                  const chronicText = hasChronic ? m.chronicDiseases.join(', ') : 'Không có bệnh nền';
                  const allergySummary = hasAllergy
                    ? m.allergyNames.length > 2
                      ? `${m.allergyNames.slice(0, 2).join(', ')} (+${m.allergyNames.length - 2})`
                      : m.allergyNames.join(', ')
                    : 'Không dị ứng';

                  return (
                    <div
                      key={m.id}
                      className={`rounded-2xl border p-4 shadow-xs space-y-3.5 ${m.isHouseholdHead
                        ? 'border-primary/25 bg-[#f2f3ff]/50'
                        : 'border-slate-200/80 bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-11 h-11 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${m.isHouseholdHead
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                              }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/family/members/${m.id}`}
                              title={m.name}
                              className="font-bold text-slate-900 hover:text-primary truncate block text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                            >
                              {m.name}
                            </Link>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1 text-xs">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${m.isHouseholdHead
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-slate-100 text-slate-700'
                                  }`}
                              >
                                {m.relationship}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${m.bloodType !== 'Chưa rõ'
                                  ? 'font-bold text-slate-800 bg-slate-100'
                                  : 'text-slate-500 bg-slate-100'
                                  }`}
                              >
                                {m.bloodType}
                              </span>
                              <span className="text-slate-500">
                                {m.gender} • {ageDisplay}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="h-11 w-11 rounded-xl bg-white text-slate-500 hover:text-primary border border-slate-200 flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                            title="Sửa thông tin"
                            aria-label={`Sửa thông tin của ${m.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                          </button>
                          {!m.isHouseholdHead && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeletingMember(m);
                              }}
                              className="h-11 w-11 rounded-xl bg-white text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-400/50"
                              title="Gỡ khỏi danh sách"
                              aria-label={`Gỡ ${m.name} khỏi danh sách`}
                            >
                              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 divide-x divide-slate-200/70 rounded-xl bg-slate-50/90 py-2 text-xs">
                        <div className="px-2.5 space-y-0.5 min-w-0">
                          <div className="text-[11px] font-semibold text-slate-500">Bệnh nền</div>
                          <div className={`font-medium break-words first-letter:uppercase ${hasChronic ? 'text-amber-800' : 'text-emerald-700'}`}>
                            {chronicText}
                          </div>
                        </div>
                        <div className="px-2.5 space-y-0.5 min-w-0">
                          <div className="text-[11px] font-semibold text-slate-500">Dị ứng</div>
                          <div className={`font-medium break-words ${hasAllergy ? 'text-rose-700' : 'text-slate-600'}`}>
                            {allergySummary}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
                        <Link
                          href={`/family/medical-book?patientId=${encodeURIComponent(m.id)}`}
                          className="min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-primary bg-white border border-slate-200/90 hover:bg-[#f2f3ff] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">clinical_notes</span>
                          <span>Sổ khám</span>
                        </Link>
                        <Link
                          href={`/family/members/${m.id}`}
                          className="min-h-11 px-3.5 py-2 rounded-xl bg-primary/10 text-primary font-semibold text-xs inline-flex items-center justify-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          <span>Xem hồ sơ</span>
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {remainingSlots !== null && remainingSlots > 0 && !searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="min-h-14 rounded-2xl border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 p-4 flex items-center justify-center gap-2 text-xs font-semibold text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
                    <span>Thêm thành viên mới (Còn {remainingSlots}/{memberLimit} suất)</span>
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* MODAL 1: THÊM THÀNH VIÊN MỚI */}
      <Dialog
        open={showAddMemberModal}
        onOpenChange={(open) => {
          if (!open && isSubmittingAdd) return;
          if (!open) setAddError(null);
          setShowAddMemberModal(open);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0 [&_[data-slot=dialog-close]]:text-white/85 [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:hover:bg-white/15 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:p-1">
          <DialogHeader className="px-6 pr-12 py-5 bg-primary text-primary-foreground text-left shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">person_add</span>
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-bold text-base text-white truncate">
                  Thêm thành viên gia đình
                </DialogTitle>
                <DialogDescription className="text-xs text-blue-100 truncate mt-0.5">
                  {packageName} · {assignedDoctor?.fullName || 'Bác sĩ Gia đình FamiDoc'}
                  {remainingSlots !== null && memberLimit !== null
                    ? ` · Còn ${remainingSlots}/${memberLimit} suất trống`
                    : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleAddMemberSubmit} noValidate className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {addError && (
                <div
                  ref={addErrorRef}
                  role="alert"
                  aria-live="assertive"
                  className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium break-words"
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
                  maxLength={120}
                  aria-invalid={Boolean(addError && !newName.trim())}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Thị Lan"
                  className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm"
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
                    className="w-full min-h-11 sm:h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm focus:border-primary outline-none"
                  >
                    {STANDARD_RELATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
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
                    aria-invalid={Boolean(addError && Boolean(validateBirthDateInput(newBirthDate, true)))}
                    max={getTodayIsoInVietnam()}
                    value={newBirthDate}
                    onChange={(e) => setNewBirthDate(e.target.value)}
                    className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="block font-semibold text-slate-700 mb-1">
                  Giới tính
                </Label>
                <div role="radiogroup" aria-label="Giới tính" className="grid grid-cols-3 gap-2">
                  {(['Nam', 'Nữ', 'Khác'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={newGender === g}
                      onClick={() => setNewGender(g)}
                      className={`min-h-11 sm:min-h-10 py-2 rounded-xl font-semibold border transition-all cursor-pointer ${newGender === g
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                    medical_information
                  </span>
                  <span>Thông tin y tế</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="add-member-blood-type" className="block font-semibold text-slate-700 mb-1.5">
                      Nhóm máu
                    </Label>
                    <select
                      id="add-member-blood-type"
                      value={newBloodType}
                      onChange={(e) => setNewBloodType(e.target.value)}
                      className="w-full min-h-11 sm:h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm focus:border-primary outline-none"
                    >
                      {BLOOD_TYPE_OPTIONS.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                      <option value="Chưa rõ">Chưa rõ</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="add-member-height" className="block font-semibold text-slate-700 mb-1.5">
                        Chiều cao (cm) <span className="font-normal text-slate-500">(tùy chọn)</span>
                      </Label>
                      <Input
                        id="add-member-height"
                        type="number"
                        min={30}
                        max={250}
                        step="0.1"
                        value={newHeightCm}
                        onChange={(e) => setNewHeightCm(e.target.value)}
                        placeholder="VD: 168"
                        className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-member-weight" className="block font-semibold text-slate-700 mb-1.5">
                        Cân nặng (kg) <span className="font-normal text-slate-500">(tùy chọn)</span>
                      </Label>
                      <Input
                        id="add-member-weight"
                        type="number"
                        min={1}
                        max={300}
                        step="0.1"
                        value={newWeightKg}
                        onChange={(e) => setNewWeightKg(e.target.value)}
                        placeholder="VD: 62"
                        className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-base sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="add-member-chronic" className="block font-semibold text-slate-700 mb-1.5">
                      Bệnh nền đang theo dõi <span className="font-normal text-slate-500">(tùy chọn)</span>
                    </Label>
                    <Input
                      id="add-member-chronic"
                      type="text"
                      maxLength={250}
                      value={newChronic}
                      onChange={(e) => setNewChronic(e.target.value)}
                      placeholder="Để trống nếu không có (VD: Tăng huyết áp, Dạ dày)"
                      className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-base sm:text-sm"
                    />
                    <ChronicQuickChips value={newChronic} onChange={setNewChronic} />
                  </div>
                </div>

                <AllergyEditorBlock
                  rows={newAllergyRows}
                  onAdd={addDraftAllergyRow}
                  onUpdate={updateDraftAllergyRow}
                  onRemove={removeDraftAllergyRow}
                />
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmittingAdd}
                onClick={() => {
                  setAddError(null);
                  setShowAddMemberModal(false);
                }}
                className="flex-1 min-h-11 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold bg-white"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingAdd}
                className="flex-1 min-h-11 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>
                <span>{isSubmittingAdd ? 'Đang lưu...' : 'Lưu thành viên'}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CHỈNH SỬA THÔNG TIN THÀNH VIÊN */}
      <Dialog
        open={Boolean(editingMember)}
        onOpenChange={(open) => {
          if (!open && isSubmittingEdit) return;
          if (!open) {
            setEditError(null);
            setEditingMember(null);
            setEditAllergyRows([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col rounded-2xl p-0 overflow-hidden border-slate-200/80 gap-0 [&_[data-slot=dialog-close]]:text-white/85 [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:hover:bg-white/15 [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:p-1">
          {editingMember && (
            <>
              <DialogHeader className="px-6 pr-12 py-5 bg-primary text-primary-foreground text-left shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="font-bold text-base text-white truncate">
                      Cập nhật thông tin thành viên
                    </DialogTitle>
                    <DialogDescription className="text-xs text-blue-100 truncate mt-0.5">
                      {editingMember.name} · {editingMember.relationship}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleUpdateMemberSubmit} noValidate className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                  {editError && (
                    <div
                      ref={editErrorRef}
                      role="alert"
                      aria-live="assertive"
                      className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium break-words"
                    >
                      {editError}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="edit-member-name" className="block font-semibold text-slate-700 mb-1">
                      Họ và tên <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="edit-member-name"
                      type="text"
                      required
                      maxLength={120}
                      aria-invalid={Boolean(editError && !editingMember.name.trim())}
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-member-dob" className="block font-semibold text-slate-700 mb-1">
                        Ngày tháng năm sinh
                      </Label>
                      <Input
                        id="edit-member-dob"
                        type="date"
                        max={getTodayIsoInVietnam()}
                        aria-invalid={Boolean(editError && Boolean(validateBirthDateInput(editingMember.rawDateOfBirth, false)))}
                        value={editingMember.rawDateOfBirth}
                        onChange={(e) =>
                          setEditingMember({ ...editingMember, rawDateOfBirth: e.target.value })
                        }
                        className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm"
                      />
                    </div>

                    <div>
                      {editingMember.isHouseholdHead ? (
                        <div className="space-y-1">
                          <span className="block font-semibold text-slate-700">
                            Vai trò trong gia đình
                          </span>
                          <div className="min-h-11 sm:h-10 px-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
                              Chủ hộ (Đại diện)
                            </span>
                            <span className="text-[11px] text-slate-600 truncate">
                              Cố định theo tài khoản
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Label htmlFor="edit-member-relation" className="block font-semibold text-slate-700 mb-1">
                            Quan hệ với chủ hộ
                          </Label>
                          <select
                            id="edit-member-relation"
                            value={editingMember.relationship}
                            onChange={(e) =>
                              setEditingMember({ ...editingMember, relationship: e.target.value })
                            }
                            className="w-full min-h-11 sm:h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm focus:border-primary outline-none"
                          >
                            {!STANDARD_RELATION_OPTIONS.some(
                              (opt) => opt.value === editingMember.relationship
                            ) && (
                              <option value={editingMember.relationship}>
                                {editingMember.relationship}
                              </option>
                            )}
                            {STANDARD_RELATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="block font-semibold text-slate-700 mb-1">Giới tính</Label>
                    <div role="radiogroup" aria-label="Giới tính" className="grid grid-cols-3 gap-2">
                      {(['Nam', 'Nữ', 'Khác'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={editingMember.gender === g}
                          onClick={() => setEditingMember({ ...editingMember, gender: g })}
                          className={`min-h-11 sm:min-h-10 py-2 rounded-xl font-semibold border transition-all cursor-pointer ${editingMember.gender === g
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                        medical_information
                      </span>
                      <span>Thông tin y tế</span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-member-blood-type" className="block font-semibold text-slate-700 mb-1.5">
                          Nhóm máu
                        </Label>
                        <select
                          id="edit-member-blood-type"
                          value={editingMember.bloodType}
                          onChange={(e) =>
                            setEditingMember({ ...editingMember, bloodType: e.target.value })
                          }
                          className="w-full min-h-11 sm:h-10 px-3.5 rounded-xl border border-input bg-slate-50/50 focus:bg-white text-slate-900 font-semibold text-base sm:text-sm focus:border-primary outline-none"
                        >
                          {BLOOD_TYPE_OPTIONS.map((bt) => (
                            <option key={bt} value={bt}>
                              {bt}
                            </option>
                          ))}
                          <option value="Chưa rõ">Chưa rõ</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="edit-member-chronic" className="block font-semibold text-slate-700 mb-1.5">
                          Bệnh nền đang theo dõi <span className="font-normal text-slate-500">(tùy chọn)</span>
                        </Label>
                        <Input
                          id="edit-member-chronic"
                          type="text"
                          maxLength={250}
                          value={editChronicInput}
                          onChange={(e) => setEditChronicInput(e.target.value)}
                          placeholder="Để trống nếu không có (VD: Tăng huyết áp, Dạ dày)"
                          className="min-h-11 sm:h-10 rounded-xl bg-slate-50/50 focus:bg-white text-slate-900 text-base sm:text-sm"
                        />
                        <ChronicQuickChips value={editChronicInput} onChange={setEditChronicInput} />
                      </div>
                    </div>

                    <AllergyEditorBlock
                      rows={editAllergyRows}
                      onAdd={addEditDraftAllergyRow}
                      onUpdate={updateEditDraftAllergyRow}
                      onRemove={removeEditDraftAllergyRow}
                    />
                  </div>
                </div>

                <div className="shrink-0 px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmittingEdit}
                    onClick={() => {
                      setEditError(null);
                      setEditingMember(null);
                    }}
                    className="flex-1 min-h-11 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold bg-white"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="flex-1 min-h-11 sm:h-10 rounded-xl text-xs sm:text-sm font-semibold gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>
                    <span>{isSubmittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: XÁC NHẬN GỠ THÀNH VIÊN */}
      <ConfirmDialog
        open={Boolean(deletingMember)}
        onOpenChange={(open) => {
          if (!open && isSubmittingDelete) return;
          if (!open) {
            setDeleteError(null);
            setDeletingMember(null);
          }
        }}
        title="Gỡ thành viên khỏi danh sách?"
        description={
          deletingMember ? (
            <>
              <strong className="font-semibold text-slate-900">{deletingMember.name}</strong> (
              {deletingMember.relationship}) sẽ được gỡ khỏi danh sách thành viên của gói{' '}
              <strong className="font-semibold text-slate-900">{packageName}</strong>.
            </>
          ) : undefined
        }
        headerIcon={<span className="material-symbols-outlined text-[20px] text-rose-600" aria-hidden="true">person_remove</span>}
        confirmLabel="Gỡ thành viên"
        cancelLabel="Hủy bỏ"
        variant="destructive"
        isLoading={isSubmittingDelete}
        onConfirm={handleDeleteMember}
      >
        <div className="space-y-3">
          <ul className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs text-slate-600 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5" aria-hidden="true">
                check_circle
              </span>
              <span>Hồ sơ sức khỏe và lịch sử khám trước đây vẫn được giữ nguyên.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5" aria-hidden="true">
                group_add
              </span>
              <span>Gia đình sẽ có lại 1 suất trống để thêm người thân khác khi cần.</span>
            </li>
          </ul>
          {deleteError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
            >
              {deleteError}
            </div>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}
