'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  encountersApi,
  extractErrorMessage,
  patientsApi,
  type EncounterItem,
  type PatientAllergyDto,
  type PatientDocumentDto,
  type PatientDto,
  type VitalSignDto,
} from '@/lib/api';
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

const UPCOMING_ENCOUNTER_STATUSES = new Set([
  'REQUESTED',
  'PROPOSED',
  'CONFIRMED',
  'IN_PROGRESS',
  'RESCHEDULE_REQUESTED',
]);

const ENCOUNTER_STATUS_META: Record<string, { label: string; className: string }> = {
  REQUESTED: {
    label: 'Chờ xác nhận',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  PROPOSED: {
    label: 'Bác sĩ đề xuất lịch',
    className: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  IN_PROGRESS: {
    label: 'Đang diễn ra',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  RESCHEDULE_REQUESTED: {
    label: 'Yêu cầu dời lịch',
    className: 'bg-orange-50 text-orange-800 border-orange-200',
  },
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

function formatEncounterTime(raw?: string | null): string {
  if (!raw) return 'Chưa rõ giờ';
  const isoTime = raw.match(/T(\d{2}:\d{2})/);
  if (isoTime) return isoTime[1];
  const plainTime = raw.match(/^(\d{2}:\d{2})/);
  if (plainTime) return plainTime[1];
  return raw;
}

function getEncounterDoctorName(encounter: EncounterItem): string {
  return (
    encounter.doctor?.doctorName?.trim() ||
    encounter.doctor?.user?.name?.trim() ||
    'Bác sĩ Gia đình phụ trách'
  );
}

function getEncounterFacilityName(encounter: EncounterItem): string {
  return (
    encounter.doctor?.facility?.facilityName?.trim() ||
    'Hệ thống Y tế FamiDoc'
  );
}

function getEncounterSortKey(encounter: EncounterItem): string {
  const datePart = encounter.scheduledDate ? encounter.scheduledDate.slice(0, 10) : '0000-00-00';
  const timePart = formatEncounterTime(encounter.scheduledTime);
  return `${datePart}T${timePart}`;
}

export function FamilyMemberCareView({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<PatientDto | null>(null);
  const [familyMembers, setFamilyMembers] = useState<PatientDto[]>([]);
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [allergies, setAllergies] = useState<PatientAllergyDto[]>([]);
  const [documents, setDocuments] = useState<PatientDocumentDto[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSignDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [historyFilter, setHistoryFilter] = useState<'all' | 'home_visit' | 'telehealth'>('all');
  const [guideEncounter, setGuideEncounter] = useState<EncounterItem | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadMemberEhr() {
      setIsLoading(true);
      setErrorMessage(null);

      const [memberRes, familyRes, timetableRes, vitalsRes] = await Promise.allSettled([
        patientsApi.getMemberById(memberId),
        patientsApi.getFamilyMembers(),
        encountersApi.getFamilyTimetable({ pageSize: 50 }),
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
        setEncounters([]);
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
      const loadedEncounters =
        timetableRes.status === 'fulfilled' && Array.isArray(timetableRes.value?.data)
          ? timetableRes.value.data
          : [];
      const loadedVitals =
        vitalsRes.status === 'fulfilled' && Array.isArray(vitalsRes.value)
          ? vitalsRes.value
          : [];

      setMember(loadedMember);
      setFamilyMembers(loadedFamily);
      setEncounters(loadedEncounters);
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

  const memberEncounters = useMemo(
    () => encounters.filter((item) => item.patientId === memberId),
    [encounters, memberId]
  );

  const upcomingEncounters = useMemo(
    () =>
      memberEncounters
        .filter((item) => UPCOMING_ENCOUNTER_STATUSES.has(item.encounterStatus))
        .sort((a, b) => getEncounterSortKey(a).localeCompare(getEncounterSortKey(b))),
    [memberEncounters]
  );

  const nextUpcomingEncounter = upcomingEncounters[0] ?? null;

  const completedEncounters = useMemo(
    () =>
      memberEncounters
        .filter((item) => item.encounterStatus === 'COMPLETED')
        .sort((a, b) => getEncounterSortKey(b).localeCompare(getEncounterSortKey(a))),
    [memberEncounters]
  );

  const filteredCompletedEncounters = useMemo(() => {
    if (historyFilter === 'all') return completedEncounters;
    if (historyFilter === 'home_visit') {
      return completedEncounters.filter((item) => item.encounterType === 'HOME_VISIT');
    }
    return completedEncounters.filter(
      (item) => item.encounterType === 'TELEMEDICINE' || item.encounterType === 'TELEHEALTH'
    );
  }, [completedEncounters, historyFilter]);

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
        vitalSigns={vitalSigns}
        onVitalAdded={(vital) => setVitalSigns((prev) => [vital, ...prev])}
        onVitalUpdated={(updated) =>
          setVitalSigns((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
        }
        onVitalDeleted={(vitalId) =>
          setVitalSigns((prev) => prev.filter((v) => v.id !== vitalId))
        }
      />

      {/* Upcoming Visit + Unimplemented Clinical Prescriptions Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Encounter Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">
                  event_upcoming
                </span>
                <span>Lịch khám sắp tới</span>
              </h2>
              {upcomingEncounters.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {upcomingEncounters.length} lịch hẹn
                </Badge>
              )}
            </div>

            {nextUpcomingEncounter ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#2E37A4]">
                    {nextUpcomingEncounter.encounterType === 'HOME_VISIT'
                      ? 'Khám Bác sĩ Tại Nhà'
                      : 'Tư vấn Video (Telehealth)'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                      (
                        ENCOUNTER_STATUS_META[nextUpcomingEncounter.encounterStatus] ||
                        ENCOUNTER_STATUS_META.CONFIRMED
                      ).className
                    }`}
                  >
                    {
                      (
                        ENCOUNTER_STATUS_META[nextUpcomingEncounter.encounterStatus] || {
                          label: nextUpcomingEncounter.encounterStatus,
                        }
                      ).label
                    }
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {getEncounterDoctorName(nextUpcomingEncounter)}
                  </p>
                  <p className="text-xs text-slate-600">
                    {getEncounterFacilityName(nextUpcomingEncounter)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-slate-500">
                      calendar_today
                    </span>
                    {formatDateDisplay(nextUpcomingEncounter.scheduledDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-slate-500">
                      schedule
                    </span>
                    {formatEncounterTime(nextUpcomingEncounter.scheduledTime)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center space-y-2">
                <span className="material-symbols-outlined text-[26px] text-slate-400">
                  event_busy
                </span>
                <p className="text-sm font-medium text-slate-700">
                  Hiện chưa có lịch khám sắp tới
                </p>
                <p className="text-xs text-slate-500">
                  Bạn có thể đặt hoặc xem lịch khám của cả hộ gia đình tại Bảng điều khiển.
                </p>
              </div>
            )}
          </div>

          <div className="pt-1 flex flex-wrap gap-2">
            {nextUpcomingEncounter ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setGuideEncounter(nextUpcomingEncounter)}
              >
                Hướng dẫn chuẩn bị buổi khám
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/family/appointments">Xem lịch gia đình</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Medications & Prescriptions Honest Empty State */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">
                medication
              </span>
              <span>Đơn thuốc &amp; Nhắc uống thuốc</span>
            </h2>
            <Badge variant="secondary" className="text-[11px]">
              Chưa có dữ liệu
            </Badge>
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              Chưa có đơn thuốc điện tử từ bác sĩ
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Phân hệ kê đơn điện tử và theo dõi lịch uống thuốc hàng ngày chưa được kích hoạt trên
              hệ thống. Mọi đơn thuốc giấy bên ngoài có thể lưu tại mục Tài liệu y tế bên dưới.
            </p>
          </div>
        </section>
      </div>

      {/* Completed Visit History Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-[#2E37A4]">
                clinical_notes
              </span>
              <span>Lịch sử buổi khám đã hoàn thành</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dữ liệu đồng bộ trực tiếp từ lịch trình khám của gia đình cho {member.fullName}.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(
              [
                { key: 'all', label: 'Tất cả' },
                { key: 'home_visit', label: 'Khám tại nhà' },
                { key: 'telehealth', label: 'Telehealth' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setHistoryFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  historyFilter === tab.key
                    ? 'bg-white text-[#2E37A4] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredCompletedEncounters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-2">
            <span className="material-symbols-outlined text-[28px] text-slate-400">
              history
            </span>
            <p className="text-sm font-medium text-slate-700">
              Chưa có lịch sử buổi khám đã hoàn thành
            </p>
            <p className="text-xs text-slate-500">
              Khi các buổi khám tại nhà hoặc tư vấn trực tuyến hoàn tất, lịch sử sẽ tự động hiển
              thị tại đây.
            </p>
            <div className="md:hidden pt-1 text-[11px] text-slate-400">
              Chế độ xem di động
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Encounter Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Ngày &amp; Giờ</th>
                    <th className="px-4 py-3">Hình thức</th>
                    <th className="px-4 py-3">Bác sĩ &amp; Cơ sở</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ghi chú bệnh án</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompletedEncounters.map((enc) => (
                    <tr key={enc.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        <div>{formatDateDisplay(enc.scheduledDate)}</div>
                        <div className="text-xs text-slate-500">
                          {formatEncounterTime(enc.scheduledTime)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">
                          {enc.encounterType === 'HOME_VISIT'
                            ? 'Khám tại nhà'
                            : 'Telehealth'}
                        </Badge>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {enc.category === 'PERIODIC_ROUTINE'
                            ? 'Khám định kỳ'
                            : 'Khám theo yêu cầu'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {getEncounterDoctorName(enc)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {getEncounterFacilityName(enc)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                          Đã hoàn thành
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        Bệnh án điện tử chi tiết (SOAP) đang chờ đồng bộ từ phân hệ lâm sàng.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Encounter Cards */}
            <div className="md:hidden space-y-3">
              {filteredCompletedEncounters.map((enc) => (
                <div
                  key={enc.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {formatDateDisplay(enc.scheduledDate)} •{' '}
                      {formatEncounterTime(enc.scheduledTime)}
                    </span>
                    <Badge variant="outline" className="text-[11px]">
                      {enc.encounterType === 'HOME_VISIT' ? 'Khám tại nhà' : 'Telehealth'}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {getEncounterDoctorName(enc)}
                  </p>
                  <p className="text-xs text-slate-600">{getEncounterFacilityName(enc)}</p>
                  <p className="text-[11px] text-slate-500">
                    Bệnh án điện tử chi tiết (SOAP) đang chờ đồng bộ từ phân hệ lâm sàng.
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Medical Documents & File/Image Upload UI */}
      <MemberDocumentUploadSection
        memberId={member.id}
        memberName={member.fullName}
        documents={documents}
        onDocumentAdded={(doc) => setDocuments((prev) => [doc, ...prev])}
      />

      {/* Visit Preparation Guide Dialog */}
      <Dialog
        open={Boolean(guideEncounter)}
        onOpenChange={(open) => {
          if (!open) setGuideEncounter(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hướng dẫn chuẩn bị buổi khám</DialogTitle>
            <DialogDescription>
              {guideEncounter
                ? `${getEncounterDoctorName(guideEncounter)} • ${formatDateDisplay(
                    guideEncounter.scheduledDate
                  )} lúc ${formatEncounterTime(guideEncounter.scheduledTime)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {guideEncounter && (
            <div className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-xs">
                <div>
                  <span className="text-slate-500">Bác sĩ phụ trách: </span>
                  <strong className="text-slate-900">
                    {getEncounterDoctorName(guideEncounter)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Đơn vị / Gói quản lý: </span>
                  <strong className="text-slate-900">
                    {getEncounterFacilityName(guideEncounter)}
                  </strong>
                </div>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
                <li>
                  Chuẩn bị sẵn các kết quả xét nghiệm và thông tin bệnh lý gần nhất của{' '}
                  {member.fullName}.
                </li>
                {guideEncounter.encounterType === 'HOME_VISIT' ? (
                  <>
                    <li>Sắp xếp không gian thông thoáng, đủ ánh sáng để bác sĩ thăm khám tại nhà.</li>
                    <li>Chuẩn bị danh sách các thuốc hoặc thực phẩm chức năng đang dùng hằng ngày.</li>
                  </>
                ) : (
                  <>
                    <li>Kiểm tra kết nối Internet, camera và micro trước giờ tư vấn 5–10 phút.</li>
                    <li>Ghi chú trước các triệu chứng bất thường để trao đổi trực tiếp với bác sĩ.</li>
                  </>
                )}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setGuideEncounter(null)}>
              Đã hiểu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
