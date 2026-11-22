'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  extractErrorMessage,
  patientsApi,
  type PatientAllergyDto,
  type PatientDocumentDto,
  type PatientDto,
  type VitalSignDto,
} from '@/lib/api';
import { hasTrackedChronicCondition } from '../utils/vital-metrics.util';
import { MemberDocumentUploadSection } from './member-document-upload-section';
import { MemberPathologySection } from './member-pathology-section';
import { MemberVitalSignsSection } from './member-vital-signs-section';

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
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  HEAD_OF_HOUSEHOLD: 'Chủ hộ',
  SPOUSE: 'Vợ / Chồng',
  CHILD: 'Con',
  PARENT: 'Cha / Mẹ',
  GRANDPARENT: 'Ông / Bà',
  SIBLING: 'Anh / Chị / Em',
  OTHER: 'Thành viên khác',
};

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
};

function getRelationLabel(code?: string | null): string {
  if (!code) return 'Thành viên gia đình';
  return RELATIONSHIP_LABELS[code] || code;
}

function getGenderLabel(gender?: string | null): string {
  if (!gender) return 'Chưa cập nhật';
  return GENDER_LABELS[gender] || gender;
}

function formatDateDisplay(raw?: string | null): string {
  if (!raw) return 'Chưa cập nhật';
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function calculateAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const isoMatch = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let year: number;
  let month: number;
  let day: number;
  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]);
    day = Number(isoMatch[3]);
  } else {
    const parsed = new Date(dateOfBirth);
    if (Number.isNaN(parsed.getTime())) return null;
    year = parsed.getFullYear();
    month = parsed.getMonth() + 1;
    day = parsed.getDate();
  }
  const now = new Date();
  let age = now.getFullYear() - year;
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function FamilyMemberCareView({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<PatientDto | null>(null);
  const [familyMembers, setFamilyMembers] = useState<PatientDto[]>([]);
  const [allergies, setAllergies] = useState<PatientAllergyDto[]>([]);
  const [documents, setDocuments] = useState<PatientDocumentDto[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSignDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadMemberEhr() {
      setIsLoading(true);
      setErrorMessage(null);

      const [memberRes, familyRes, vitalsRes] = await Promise.allSettled([
        patientsApi.getMemberById(memberId),
        patientsApi.getFamilyMembers(),
        patientsApi.getMemberVitalSigns(memberId, 30),
      ]);

      if (isCancelled) return;

      if (memberRes.status === 'rejected' || !memberRes.value) {
        const message =
          memberRes.status === 'rejected'
            ? extractErrorMessage(
                memberRes.reason,
                'Không thể tải hồ sơ y bạ thành viên này.'
              )
            : 'Không tìm thấy hồ sơ thành viên gia đình.';
        setMember(null);
        setFamilyMembers(
          familyRes.status === 'fulfilled' && Array.isArray(familyRes.value)
            ? familyRes.value
            : []
        );
        setAllergies([]);
        setDocuments([]);
        setVitalSigns([]);
        setErrorMessage(message);
        setIsLoading(false);
        return;
      }

      const loadedMember = memberRes.value;
      const activeFamily =
        familyRes.status === 'fulfilled' && Array.isArray(familyRes.value)
          ? familyRes.value.filter((fm) => !fm.status || fm.status === 'ACTIVE')
          : [];
      const loadedFamily = activeFamily.length > 0 ? activeFamily : [loadedMember];
      const loadedVitals =
        vitalsRes.status === 'fulfilled' && Array.isArray(vitalsRes.value)
          ? vitalsRes.value
          : [];

      setMember(loadedMember);
      setFamilyMembers(loadedFamily);
      setAllergies(loadedMember.allergies ?? []);
      setDocuments(loadedMember.documents ?? []);
      setVitalSigns(loadedVitals);
      setIsLoading(false);
    }

    void loadMemberEhr();

    return () => {
      isCancelled = true;
    };
  }, [memberId, reloadNonce]);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải hồ sơ sức khỏe thành viên"
        className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-44 rounded-3xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-52 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-52 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="md:hidden space-y-3">
          <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorMessage || !member) {
    return (
      <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto size-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[30px]">person_off</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">
              Không thể hiển thị hồ sơ y bạ thành viên
            </h1>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              {errorMessage || 'Hồ sơ thành viên không tồn tại hoặc bạn không có quyền truy cập.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReloadNonce((n) => n + 1)}
            >
              Thử tải lại
            </Button>
            <Button asChild className="bg-[#2E37A4] hover:bg-[#222982] text-white">
              <Link href="/family/members">Quay lại danh sách thành viên</Link>
            </Button>
          </div>
        </div>
        <div className="md:hidden text-center text-xs text-slate-500">
          Vui lòng chọn một thành viên hợp lệ trong danh sách gia đình.
        </div>
      </div>
    );
  }

  const age = calculateAge(member.dateOfBirth);
  const initials = getMemberInitials(member.fullName);

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar & Quick Family Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/family/members"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Danh sách thành viên</span>
          </Link>
          <span className="text-xs text-slate-400">/</span>
          <span className="text-sm font-semibold text-slate-800 truncate">
            Hồ sơ y bạ: {member.fullName}
          </span>
        </div>

        <nav
          aria-label="Chuyển nhanh thành viên gia đình"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          {familyMembers.map((fm) => {
            const isActive = fm.id === member.id;
            return (
              <Link
                key={fm.id}
                href={`/family/members/${fm.id}`}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#2E37A4] border-[#2E37A4] text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#2E37A4]/40 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-[#2E37A4]'
                  }`}
                >
                  {getMemberInitials(fm.fullName)}
                </span>
                <span>{fm.fullName}</span>
                <span className={isActive ? 'text-indigo-100' : 'text-slate-400'}>
                  • {getRelationLabel(fm.relationshipToHead)}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Member Profile Banner */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-[#2E37A4] to-[#4A55D2] text-white flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {member.fullName}
                </h1>
                <Badge className="bg-indigo-50 text-[#2E37A4] border border-indigo-200 hover:bg-indigo-50">
                  {getRelationLabel(member.relationshipToHead)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-slate-400">
                    cake
                  </span>
                  <span>
                    {age !== null ? `${age} tuổi` : 'Chưa rõ tuổi'} ({formatDateDisplay(member.dateOfBirth)})
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-slate-400">
                    wc
                  </span>
                  <span>Giới tính: {getGenderLabel(member.gender)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-rose-500">
                    bloodtype
                  </span>
                  <span>
                    Nhóm máu:{' '}
                    <strong className="text-slate-900">
                      {member.bloodType || 'Chưa cập nhật'}
                    </strong>
                  </span>
                </span>
              </div>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/family/medical-book?patientId=${encodeURIComponent(member.id)}`}>
              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">clinical_notes</span>
              Mở sổ khám
            </Link>
          </Button>
        </div>

        {/* Level-1 Pathology Self-Management */}
        <MemberPathologySection
          memberId={member.id}
          memberName={member.fullName}
          chronicDiseases={member.chronicDiseases}
          allergies={allergies}
          onChronicUpdated={(chronicDiseases) =>
            setMember((prev) => (prev ? { ...prev, chronicDiseases } : prev))
          }
          onAllergyAdded={(allergy) => setAllergies((prev) => [allergy, ...prev])}
          onAllergyDeleted={(allergyId) =>
            setAllergies((prev) => prev.filter((a) => a.id !== allergyId))
          }
        />
      </section>

      {/* Daily & Multi-Day Vital Signs Section */}
      <MemberVitalSignsSection
        memberId={member.id}
        memberName={member.fullName}
        hasChronicCondition={hasTrackedChronicCondition(member.chronicDiseases)}
        vitalSigns={vitalSigns}
        onVitalAdded={(vital) => setVitalSigns((prev) => [vital, ...prev])}
        onVitalUpdated={(updated) =>
          setVitalSigns((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
        }
        onVitalDeleted={(vitalId) =>
          setVitalSigns((prev) => prev.filter((v) => v.id !== vitalId))
        }
      />

      {/* Medical Documents & File/Image Upload UI */}
      <MemberDocumentUploadSection
        memberId={member.id}
        memberName={member.fullName}
        documents={documents}
        onDocumentAdded={(doc) => setDocuments((prev) => [doc, ...prev])}
        onDocumentDeleted={(documentId) =>
          setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        }
      />
    </div>
  );
}
