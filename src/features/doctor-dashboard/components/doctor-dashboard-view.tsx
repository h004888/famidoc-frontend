'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  contractsApi,
  doctorsApi,
  encountersApi,
  type DoctorProfileDto,
  type EncounterItem,
  type FourPartyContract,
  type MedicalContractListItem,
} from '@/lib/api';
import { useDoctorVerificationGate } from '@/components/layout/doctor-verification-gate';
import {
  deriveDualLaneState,
  formatRemainingRecordDeadline,
  isEncounterActiveToday,
} from '@/lib/encounter-dual-lane';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type QueueTab = 'pending' | 'in_progress' | 'completed';
type VisitModeFilter = 'ALL' | 'HOME_VISIT' | 'TELEHEALTH';

const PENDING_ENCOUNTER_STATUSES = new Set([
  'REQUESTED',
  'PROPOSED',
  'CONFIRMED',
  'ON_THE_WAY',
  'ARRIVED',
  'RESCHEDULE_REQUESTED',
]);

const PENDING_CONTRACT_STATUSES = new Set([
  'PENDING_APPROVAL',
  'PENDING_DOCTOR_SIGN',
  'DRAFT',
]);

const QUEUE_PAGE_SIZE = 6;

function normalizeContract(raw: FourPartyContract | MedicalContractListItem): {
  id: string;
  contractNumber: string;
  status: string;
  familyName: string;
} {
  const item = raw as MedicalContractListItem & Partial<FourPartyContract>;
  return {
    id: item.id,
    contractNumber: item.contractNumber || item.id,
    status: String(item.contractStatus ?? item.status ?? 'DRAFT'),
    familyName:
      item.familyHeadName ??
      item.familyRepresentativeName ??
      `Hợp đồng #${item.contractNumber || item.id.slice(0, 6)}`,
  };
}

function isTelehealthEncounter(encounter: EncounterItem): boolean {
  const type = String(encounter.encounterType || '').toUpperCase();
  return type === 'TELEHEALTH' || type === 'TELEMEDICINE';
}

function getEncounterTab(encounter: EncounterItem): QueueTab | null {
  const status = String(encounter.encounterStatus || '').toUpperCase();
  if (status === 'IN_PROGRESS') return 'in_progress';
  if (status === 'COMPLETED') return 'completed';
  if (PENDING_ENCOUNTER_STATUSES.has(status)) return 'pending';
  return null;
}

function formatEncounterTime(scheduledTime?: string): string {
  if (!scheduledTime) return '--:--';
  if (scheduledTime.includes('T')) return scheduledTime.slice(11, 16);
  return scheduledTime.slice(0, 5);
}

function formatEncounterDate(scheduledDate?: string): string {
  if (!scheduledDate) return '';
  const datePart = scheduledDate.slice(0, 10);
  const parts = datePart.split('-');
  if (parts.length !== 3) return datePart;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatEncounterStatusLabel(status?: string): string {
  switch (String(status || '').toUpperCase()) {
    case 'REQUESTED':
    case 'PROPOSED':
      return 'Chờ xác nhận';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'ON_THE_WAY':
      return 'Đang di chuyển';
    case 'ARRIVED':
      return 'Đã đến nơi';
    case 'IN_PROGRESS':
      return 'Đang khám';
    case 'COMPLETED':
      return 'Hoàn tất';
    case 'RESCHEDULE_REQUESTED':
      return 'Yêu cầu đổi giờ';
    default:
      return 'Chờ khám';
  }
}

function getPrimaryPatientName(encounter: EncounterItem): string {
  if (encounter.patient?.fullName) return encounter.patient.fullName;
  const firstParticipant = encounter.participants?.find((p) => p.patient?.fullName);
  if (firstParticipant?.patient?.fullName) {
    const extraCount = (encounter.participants?.length ?? 1) - 1;
    return extraCount > 0
      ? `${firstParticipant.patient.fullName} (+${extraCount} người thân)`
      : firstParticipant.patient.fullName;
  }
  const repName =
    encounter.contract?.familyRepresentativeName ||
    encounter.contract?.familyUnit?.representativeUser?.fullName ||
    encounter.contract?.familyUnit?.representativeUser?.name ||
    encounter.contract?.familyUnit?.familyName;
  return repName ? `Hộ ${repName}` : 'Bệnh nhân hộ gia đình';
}

function calculateAge(dob?: string): number | null {
  if (!dob) return null;
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return null;
  const age = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return age >= 0 && age < 120 ? age : null;
}

function extractAllergies(encounter: EncounterItem): string[] {
  const patients = [
    encounter.patient,
    ...(encounter.participants?.map((p) => p.patient) ?? []),
  ].filter(Boolean);

  const items = new Set<string>();
  for (const pt of patients) {
    if (!pt?.allergies || !Array.isArray(pt.allergies)) continue;
    for (const entry of pt.allergies) {
      const label = typeof entry === 'string' ? entry.trim() : String(entry?.allergen || '').trim();
      if (label) items.add(label);
    }
  }
  return Array.from(items);
}

function extractChronicConditions(encounter: EncounterItem): string[] {
  const patients = [
    encounter.patient,
    ...(encounter.participants?.map((p) => p.patient) ?? []),
  ].filter(Boolean);

  const items = new Set<string>();
  for (const pt of patients) {
    const raw = pt?.chronicDiseases;
    if (!raw) continue;
    if (Array.isArray(raw)) {
      raw.forEach((v) => {
        const trimmed = String(v).trim();
        if (trimmed) items.add(trimmed);
      });
    } else {
      const trimmed = String(raw).trim();
      if (trimmed && !['không', 'khong', 'không có', 'none', '-', '--'].includes(trimmed.toLowerCase())) {
        items.add(trimmed);
      }
    }
  }
  return Array.from(items);
}

export function DoctorDashboardView() {
  const router = useRouter();
  const {
    hasProvider: hasDoctorGateProvider,
    doctorProfile: gateDoctorProfile,
    isLoadingDoctorGate,
  } = useDoctorVerificationGate();

  const [standaloneDoctorProfile, setStandaloneDoctorProfile] = useState<DoctorProfileDto | null>(
    null
  );
  const doctorProfile = hasDoctorGateProvider ? gateDoctorProfile : standaloneDoctorProfile;

  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [contracts, setContracts] = useState<
    Array<{ id: string; contractNumber: string; status: string; familyName: string }>
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [partialErrors, setPartialErrors] = useState<string[]>([]);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [activeTab, setActiveTab] = useState<QueueTab>('pending');
  const [visitModeFilter, setVisitModeFilter] = useState<VisitModeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [queuePage, setQueuePage] = useState(1);
  const hasAutoSelectedTabRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    hasAutoSelectedTabRef.current = false;
    setIsLoadingData(true);
    setPartialErrors([]);

    const addPartialError = (label: string) => {
      if (!isMounted) return;
      setPartialErrors((prev) => (prev.includes(label) ? prev : [...prev, label]));
    };

    const requests: Promise<void>[] = [];

    if (!hasDoctorGateProvider) {
      requests.push(
        doctorsApi
          .getDoctorMe()
          .then((data) => {
            if (!isMounted) return;
            if (data && data.id) setStandaloneDoctorProfile(data);
          })
          .catch(() => {
            addPartialError('Hồ sơ bác sĩ');
          })
      );
    }

    requests.push(
      contractsApi
        .getMedicalContracts({ role: 'DOCTOR' })
        .then((items) => {
          if (!isMounted) return;
          if (Array.isArray(items)) {
            setContracts(items.map(normalizeContract));
          }
        })
        .catch(() => {
          addPartialError('Hợp đồng 4 bên');
        })
    );

    requests.push(
      encountersApi
        .getDoctorTimetable({ pageSize: 50 })
        .then((res) => {
          if (!isMounted) return;
          const list = Array.isArray(res?.data) ? res.data : [];
          setEncounters(list);
        })
        .catch(() => {
          addPartialError('Lịch khám hôm nay');
        })
    );

    Promise.allSettled(requests).finally(() => {
      if (isMounted) setIsLoadingData(false);
    });

    return () => {
      isMounted = false;
    };
  }, [hasDoctorGateProvider, reloadNonce]);

  const activeEncounters = useMemo(
    () => encounters.filter((e) => getEncounterTab(e) !== null),
    [encounters]
  );

  const tabCounts = useMemo(() => {
    const counts = { pending: 0, in_progress: 0, completed: 0 };
    for (const enc of activeEncounters) {
      const tab = getEncounterTab(enc);
      if (tab) counts[tab] += 1;
    }
    return counts;
  }, [activeEncounters]);

  // Tự động chọn tab đầu tiên có dữ liệu khi tải xong (ưu tiên: Đang khám -> Chờ khám -> Hoàn tất)
  useEffect(() => {
    if (isLoadingData || hasAutoSelectedTabRef.current) return;
    hasAutoSelectedTabRef.current = true;
    if (tabCounts.in_progress > 0) {
      setActiveTab('in_progress');
    } else if (tabCounts.pending > 0) {
      setActiveTab('pending');
    } else if (tabCounts.completed > 0) {
      setActiveTab('completed');
    }
  }, [isLoadingData, tabCounts]);

  const homeVisitCount = useMemo(
    () => activeEncounters.filter((e) => !isTelehealthEncounter(e)).length,
    [activeEncounters]
  );
  const videoVisitCount = useMemo(
    () => activeEncounters.filter((e) => isTelehealthEncounter(e)).length,
    [activeEncounters]
  );

  const pendingContracts = useMemo(
    () => contracts.filter((c) => PENDING_CONTRACT_STATUSES.has(c.status)),
    [contracts]
  );

  const activeContractsCount = useMemo(
    () => contracts.filter((c) => c.status === 'ACTIVE').length,
    [contracts]
  );

  const conflictEncounters = useMemo(
    () =>
      activeEncounters.filter(
        (e) =>
          Boolean(e.conflictAlert) ||
          String(e.encounterStatus).toUpperCase() === 'RESCHEDULE_REQUESTED'
      ),
    [activeEncounters]
  );

  const filteredEncounters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeEncounters.filter((enc) => {
      if (getEncounterTab(enc) !== activeTab) return false;
      if (visitModeFilter === 'TELEHEALTH' && !isTelehealthEncounter(enc)) return false;
      if (visitModeFilter === 'HOME_VISIT' && isTelehealthEncounter(enc)) return false;
      if (!q) return true;
      const haystack = [
        getPrimaryPatientName(enc),
        enc.contract?.contractNumber,
        enc.displayNotes,
        enc.subjectiveNote,
        enc.contract?.familyUnit?.homeAddress,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeEncounters, activeTab, visitModeFilter, searchQuery]);

  const totalQueuePages = Math.max(Math.ceil(filteredEncounters.length / QUEUE_PAGE_SIZE), 1);
  const safeQueuePage = Math.min(queuePage, totalQueuePages);
  const paginatedEncounters = filteredEncounters.slice(
    (safeQueuePage - 1) * QUEUE_PAGE_SIZE,
    safeQueuePage * QUEUE_PAGE_SIZE
  );

  const selectedEncounter =
    filteredEncounters.find((e) => e.id === selectedEncounterId) ??
    filteredEncounters[0] ??
    null;

  const handleTabChange = (value: string) => {
    setActiveTab(value as QueueTab);
    setQueuePage(1);
    setSelectedEncounterId(null);
  };

  const todayLabel = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date());

  const displayDoctorName = doctorProfile?.doctorName || 'Bác sĩ Gia đình';
  const displayFacilityName =
    doctorProfile?.facility?.facilityName ||
    doctorProfile?.facilityName ||
    'Cơ sở Y tế trực thuộc';
  const activePanelCount = doctorProfile?.activePanelCount ?? activeContractsCount;
  const maxPanelCapacity = doctorProfile?.maxPanelCapacity ?? null;

  if (hasDoctorGateProvider && (isLoadingDoctorGate || !doctorProfile)) {
    return (
      <div
        role="status"
        aria-label="Đang tải bảng lâm sàng"
        className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased"
      >
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      </div>
    );
  }

  if (doctorProfile && doctorProfile.onboardingStatus !== 'ACTIVE') {
    return (
      <div className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Card className="rounded-2xl border-amber-200 bg-white p-6 shadow-xs sm:p-8">
            <CardContent className="space-y-4 p-0 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                  verified_user
                </span>
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-slate-900">
                  Hồ sơ Bác sĩ đang trong quy trình thẩm định 2 cấp
                </h1>
                <p className="text-sm text-slate-600">
                  Xin chào <strong>{doctorProfile.doctorName}</strong> ({displayFacilityName}). Bảng
                  điều khiển lâm sàng và tiếp nhận hộ gia đình sẽ tự động mở khóa sau khi Cơ sở Y tế
                  (Cấp 1) và Quản trị viên FamiDoc (Cấp 2) phê duyệt đủ 3 chứng chỉ của bạn.
                </p>
              </div>
              {doctorProfile.rejectionReason && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/40 p-3.5 text-left text-xs text-[#ba1a1a]"
                >
                  <strong className="block font-bold">Yêu cầu bổ sung gần nhất:</strong>
                  <p className="mt-1">{doctorProfile.rejectionReason}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button asChild className="min-h-11 rounded-xl px-5 text-sm font-semibold">
                  <Link href="/doctor/verification">Đi tới trang Nộp / Theo dõi CCHN</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11 rounded-xl px-4 text-sm font-semibold"
                >
                  <Link href="/doctor/profile">Xem hồ sơ cá nhân</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedIsTelehealth = selectedEncounter
    ? isTelehealthEncounter(selectedEncounter)
    : false;
  const selectedAllergies = selectedEncounter ? extractAllergies(selectedEncounter) : [];
  const selectedChronics = selectedEncounter ? extractChronicConditions(selectedEncounter) : [];
  const selectedPrimaryPatient =
    selectedEncounter?.patient ?? selectedEncounter?.participants?.[0]?.patient ?? null;
  const selectedAge = calculateAge(selectedPrimaryPatient?.dateOfBirth);
  const selectedAddress =
    selectedEncounter?.contract?.familyUnit?.homeAddress ||
    selectedEncounter?.contract?.familyUnit?.address ||
    selectedPrimaryPatient?.address ||
    null;

  return (
    <div className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* GIÂY 0-1: NGỮ CẢNH CA TRỰC GỌN 1 HÀNG (KHÔNG PROFILE CARD THỪA) */}
        <header className="space-y-2 border-b border-slate-200/80 pb-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Ca trực hôm nay · <span suppressHydrationWarning>{todayLabel}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="font-semibold text-slate-900">{displayDoctorName}</span>
              <span aria-hidden="true">·</span>
              <span>{displayFacilityName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 sm:text-sm">
            <span>
              <strong className="font-bold tabular-nums text-slate-900">
                {activeEncounters.length} ca khám
              </strong>{' '}
              (<span className="tabular-nums">{homeVisitCount}</span> tại nhà ·{' '}
              <span className="tabular-nums">{videoVisitCount}</span> Video)
            </span>
            <span className="text-slate-300" aria-hidden="true">
              |
            </span>
            <span>
              Hộ phụ trách:{' '}
              <strong className="font-bold tabular-nums text-slate-900">
                {maxPanelCapacity !== null
                  ? `${activePanelCount}/${maxPanelCapacity}`
                  : `${activePanelCount} hộ`}
              </strong>
            </span>
          </div>
        </header>

        {/* CẢNH BÁO TẢI DỮ LIỆU TỪNG PHẦN */}
        {partialErrors.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between sm:text-sm"
          >
            <div className="flex items-start gap-2.5">
              <span
                className="material-symbols-outlined mt-0.5 text-[18px] leading-none text-amber-800"
                aria-hidden="true"
              >
                info
              </span>
              <span>
                Một số dữ liệu tạm thời chưa tải được ({partialErrors.join(', ')}). Thông tin hiển
                thị có thể chưa đầy đủ.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReloadNonce((n) => n + 1)}
              className="min-h-11 shrink-0 rounded-xl border-amber-300 bg-white px-4 text-xs font-semibold text-amber-950 hover:bg-amber-100/60"
            >
              Thử tải lại
            </Button>
          </div>
        )}

        {/* KHỐI 2 (CỐ ĐỊNH 2 Ô): CẦN XỬ LÝ NGAY — LUÔN HIỆN, CHỈ ĐỔI TRẠNG THÁI = 0 VS > 0 */}
        <section aria-label="Việc cần xử lý ngay" className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Cần xử lý ngay
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Ô 1: Hợp đồng 4 bên */}
            <div
              role="status"
              className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-xs sm:flex-row sm:items-center ${
                pendingContracts.length > 0
                  ? 'border-[#0037c1]/30 bg-[#f2f3ff]/70'
                  : 'border-slate-200/90 bg-white'
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    pendingContracts.length > 0
                      ? 'bg-[#dde1ff] text-[#00258b]'
                      : 'bg-emerald-50 text-[#03864b]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px] leading-none"
                    aria-hidden="true"
                  >
                    {pendingContracts.length > 0 ? 'assignment_turned_in' : 'check_circle'}
                  </span>
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">
                    {pendingContracts.length > 0
                      ? `${pendingContracts.length} hợp đồng 4 bên chờ bạn ký duyệt`
                      : '0 hợp đồng chờ ký duyệt'}
                  </p>
                  <p className="truncate text-xs text-slate-600">
                    {pendingContracts.length > 0
                      ? pendingContracts
                          .slice(0, 3)
                          .map((c) => c.familyName)
                          .join(' · ')
                      : 'Tất cả hợp đồng hộ gia đình hiện đã được xử lý'}
                  </p>
                </div>
              </div>
              <Link
                href="/doctor/contracts"
                className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-semibold transition-colors ${
                  pendingContracts.length > 0
                    ? 'border-[#0037c1]/30 bg-white text-[#00258b] hover:bg-[#dde1ff]/60'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#0037c1] hover:text-[#0037c1]'
                }`}
              >
                <span>
                  {pendingContracts.length > 0
                    ? `Ký duyệt HĐ (${pendingContracts.length})`
                    : 'Xem hợp đồng'}
                </span>
                <span
                  className="material-symbols-outlined text-[16px] leading-none"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* Ô 2: Lịch trực & Đổi giờ / Xung đột */}
            <div
              role={conflictEncounters.length > 0 ? 'alert' : 'status'}
              className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 shadow-xs sm:flex-row sm:items-center ${
                conflictEncounters.length > 0
                  ? 'border-[#ba1a1a]/30 bg-[#ffdad6]/25'
                  : 'border-slate-200/90 bg-white'
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    conflictEncounters.length > 0
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : 'bg-emerald-50 text-[#03864b]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[20px] leading-none"
                    aria-hidden="true"
                  >
                    {conflictEncounters.length > 0 ? 'warning' : 'event_available'}
                  </span>
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">
                    {conflictEncounters.length > 0
                      ? `Khẩn · ${conflictEncounters.length} lịch khám cần xử lý đổi giờ`
                      : '0 xung đột lịch trực'}
                  </p>
                  <p
                    className={`truncate text-xs ${
                      conflictEncounters.length > 0 ? 'text-[#ba1a1a]' : 'text-slate-600'
                    }`}
                  >
                    {conflictEncounters.length > 0
                      ? conflictEncounters
                          .slice(0, 3)
                          .map((e) => getPrimaryPatientName(e))
                          .join(' · ')
                      : 'Ca trực và lịch hẹn hôm nay đang ổn định'}
                  </p>
                </div>
              </div>
              <Link
                href="/doctor/timetable"
                className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-semibold transition-colors ${
                  conflictEncounters.length > 0
                    ? 'border-[#ba1a1a]/30 bg-white text-[#ba1a1a] hover:bg-[#ffdad6]/40'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-[#0037c1] hover:text-[#0037c1]'
                }`}
              >
                <span>
                  {conflictEncounters.length > 0 ? 'Xử lý lịch trực' : 'Quản lý lịch trực'}
                </span>
                <span
                  className="material-symbols-outlined text-[16px] leading-none"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* KHỐI 2B: CA KHÁM HÔM NAY (ACTIVE) & CA CHỜ HOÀN TẤT HỒ SƠ 24H (D1) */}
        {(() => {
          const now = new Date();
          const activeTodayList = encounters.filter((e) => isEncounterActiveToday(e, now));
          const pendingRecordList = encounters.filter(
            (e) =>
              !isEncounterActiveToday(e, now) &&
              deriveDualLaneState(e, now).reconciledStatus === 'PENDING_RECORD',
          );
          if (activeTodayList.length === 0 && pendingRecordList.length === 0) return null;
          return (
            <section aria-label="Ca khám cần xử lý theo 2 làn" className="space-y-3">
              {activeTodayList.map((enc) => {
                const lane = deriveDualLaneState(enc, now);
                return (
                  <Card
                    key={`active-${enc.id}`}
                    className="rounded-2xl border-2 border-teal-200 bg-teal-50/40 p-4 sm:p-5 shadow-xs"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-teal-700 text-white">ĐANG DIỄN RA (ACTIVE)</Badge>
                          <span className="text-xs font-semibold text-slate-700">
                            {String(enc.scheduledTime || '').slice(0, 5)} •{' '}
                            {enc.encounterType === 'HOME_VISIT' ? 'Khám tại nhà' : 'Video'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {getPrimaryPatientName(enc)}
                        </p>
                        <p className="text-xs text-slate-600">
                          Gia đình: {lane.familyConfirmed ? '✓ Đã xác nhận có đến' : 'Chưa xác nhận'}{' '}
                          • Hồ sơ: {lane.doctorStatusLabel}
                        </p>
                      </div>
                      <Link
                        href={`/doctor/encounters?encounterId=${enc.id}`}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white hover:bg-teal-800"
                      >
                        Mở Workspace Ca khám
                      </Link>
                    </div>
                  </Card>
                );
              })}

              {pendingRecordList.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-amber-900">
                    Ca cần bổ sung &amp; chốt hồ sơ (Hạn 24h)
                  </h2>
                  {pendingRecordList.map((enc) => {
                    const lane = deriveDualLaneState(enc, now);
                    return (
                      <Card
                        key={`pending-${enc.id}`}
                        className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-2xs"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900">
                              {getPrimaryPatientName(enc)} • {String(enc.scheduledDate).slice(0, 10)}
                            </p>
                            <p className="text-xs text-amber-900">
                              {lane.familyConfirmed
                                ? 'Gia đình: ✓ Đã xác nhận có đến'
                                : 'Chờ xác nhận'}{' '}
                              • {formatRemainingRecordDeadline(lane.remainingRecordHours)}
                            </p>
                          </div>
                          <Link
                            href={`/doctor/encounters?encounterId=${enc.id}`}
                            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-amber-400 bg-white px-3.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                          >
                            Tiếp tục hoàn tất hồ sơ
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })()}

        {/* KHỐI 3 (CỐ ĐỊNH 2 CỘT 5/12 + 7/12): LỊCH KHÁM & HỒ SƠ TRƯỚC KHÁM */}
        <section aria-label="Lịch khám hôm nay" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Lịch khám &amp; Hàng đợi
            </h2>
            <Link
              href="/doctor/timetable"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-semibold text-[#0037c1] transition-colors hover:bg-[#f2f3ff]"
            >
              <span>Xem lịch cả tuần</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>

          {isLoadingData ? (
            <div
              role="status"
              aria-label="Đang tải danh sách lịch khám"
              className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200/80 bg-white p-6 lg:grid-cols-12"
            >
              <div className="space-y-3 lg:col-span-5">
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div className="h-64 animate-pulse rounded-xl bg-slate-100 lg:col-span-7" />
            </div>
          ) : (
            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs lg:grid-cols-12">
              {/* Cột trái (5/12): Hàng đợi phẳng + 3 tab trạng thái + 1 thanh tìm & lọc */}
              <div className="flex flex-col border-b border-slate-200/80 lg:col-span-5 lg:border-r lg:border-b-0">
                <div className="space-y-3 border-b border-slate-200/80 p-4">
                  <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1">
                      <TabsTrigger
                        value="pending"
                        className="min-h-9 rounded-lg text-xs font-semibold"
                      >
                        Chờ khám ({tabCounts.pending})
                      </TabsTrigger>
                      <TabsTrigger
                        value="in_progress"
                        className="min-h-9 rounded-lg text-xs font-semibold"
                      >
                        Đang khám ({tabCounts.in_progress})
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        className="min-h-9 rounded-lg text-xs font-semibold"
                      >
                        Hoàn tất ({tabCounts.completed})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span
                        className="material-symbols-outlined pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-slate-400"
                        aria-hidden="true"
                      >
                        search
                      </span>
                      <Input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setQueuePage(1);
                        }}
                        placeholder="Tìm tên bệnh nhân, mã hộ..."
                        aria-label="Tìm tên bệnh nhân hoặc mã hộ"
                        className="min-h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 text-xs focus-visible:bg-white"
                      />
                    </div>
                    <select
                      aria-label="Lọc hình thức khám"
                      value={visitModeFilter}
                      onChange={(e) => {
                        setVisitModeFilter(e.target.value as VisitModeFilter);
                        setQueuePage(1);
                      }}
                      className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none focus-visible:border-[#0037c1] focus-visible:bg-white"
                    >
                      <option value="ALL">Tất cả loại</option>
                      <option value="HOME_VISIT">Tại nhà</option>
                      <option value="TELEHEALTH">Video</option>
                    </select>
                  </div>
                </div>

                {paginatedEncounters.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                        event_note
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {activeEncounters.length === 0
                          ? 'Hôm nay bạn chưa có lịch khám nào'
                          : searchQuery.trim() || visitModeFilter !== 'ALL'
                            ? 'Không có ca khám nào khớp với bộ lọc'
                            : activeTab === 'pending'
                              ? 'Hiện không có ca nào đang chờ khám'
                              : activeTab === 'in_progress'
                                ? 'Hiện không có ca nào đang khám'
                                : 'Chưa có ca khám nào hoàn tất'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeEncounters.length === 0
                          ? 'Lịch khám tại nhà và tư vấn video mới sẽ tự động hiển thị tại đây.'
                          : 'Bạn có thể chuyển sang tab khác hoặc mở lịch trực cả tuần.'}
                      </p>
                    </div>
                    <Link
                      href="/doctor/timetable"
                      className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-[#0037c1] transition-colors hover:bg-[#f2f3ff]"
                    >
                      Xem lịch trực tuần này
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-200/80">
                    {paginatedEncounters.map((enc) => {
                      const isSelected = selectedEncounter?.id === enc.id;
                      const isVideo = isTelehealthEncounter(enc);
                      const patientName = getPrimaryPatientName(enc);

                      return (
                        <li key={enc.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedEncounterId(enc.id)}
                            aria-current={isSelected ? 'true' : undefined}
                            className={`flex w-full cursor-pointer flex-col gap-1.5 px-4 py-3.5 text-left transition-colors ${
                              isSelected
                                ? 'bg-[#f2f3ff] text-slate-900'
                                : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-xs font-bold tabular-nums text-[#00258b]">
                                  {formatEncounterTime(enc.scheduledTime)}
                                </span>
                                <span className="truncate text-sm font-bold text-slate-900">
                                  {patientName}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  isVideo
                                    ? 'border-[#0037c1]/25 bg-[#dde1ff]/50 text-[#00258b]'
                                    : 'border-slate-200 bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isVideo ? 'Video' : 'Tại nhà'}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                              <span className="truncate">
                                {enc.displayNotes ||
                                  enc.subjectiveNote ||
                                  formatEncounterStatusLabel(enc.encounterStatus)}
                              </span>
                              {enc.contract?.contractNumber && (
                                <span className="shrink-0 font-medium tabular-nums text-slate-500">
                                  #{enc.contract.contractNumber}
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {totalQueuePages > 1 && (
                  <div className="border-t border-slate-200/80 p-3">
                    <Pagination
                      currentPage={safeQueuePage}
                      totalPages={totalQueuePages}
                      onPageChange={setQueuePage}
                    />
                  </div>
                )}
              </div>

              {/* Cột phải (7/12): Hồ sơ tóm tắt trước khám — luôn giữ cấu trúc ổn định */}
              <div className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-7">
                {selectedEncounter ? (
                  <>
                    <div className="space-y-5">
                      {/* 1. Thông tin hành chính & lịch hẹn */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-slate-900">
                            {getPrimaryPatientName(selectedEncounter)}
                            {selectedAge !== null && (
                              <span className="ml-2 text-sm font-medium text-slate-500 tabular-nums">
                                ({selectedAge} tuổi)
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-600">
                            <span className="font-semibold tabular-nums text-slate-800">
                              {formatEncounterTime(selectedEncounter.scheduledTime)} ·{' '}
                              {formatEncounterDate(selectedEncounter.scheduledDate)}
                            </span>
                            {' · '}
                            {selectedIsTelehealth ? 'Khám Video trực tuyến' : 'Khám tại nhà'}
                            {selectedEncounter.contract?.contractNumber && (
                              <>
                                {' · '}
                                <span className="tabular-nums">
                                  HĐ #{selectedEncounter.contract.contractNumber}
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {formatEncounterStatusLabel(selectedEncounter.encounterStatus)}
                        </Badge>
                      </div>

                      {/* 2. An toàn lâm sàng — luôn giữ đủ 2 dòng Dị ứng & Bệnh nền */}
                      <div className="space-y-2">
                        <div
                          role={selectedAllergies.length > 0 ? 'alert' : undefined}
                          className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                            selectedAllergies.length > 0
                              ? 'border-[#ba1a1a]/30 bg-[#ffdad6]/35 text-[#ba1a1a]'
                              : 'border-slate-200/70 bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined mt-0.5 text-[16px] leading-none"
                            aria-hidden="true"
                          >
                            {selectedAllergies.length > 0 ? 'warning' : 'verified'}
                          </span>
                          <span>
                            <strong
                              className={
                                selectedAllergies.length > 0 ? 'text-[#ba1a1a]' : 'text-slate-800'
                              }
                            >
                              Dị ứng thuốc/thức ăn:
                            </strong>{' '}
                            {selectedAllergies.length > 0
                              ? selectedAllergies.join(', ')
                              : 'Chưa ghi nhận dị ứng'}
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
                          <strong className="text-slate-800">Bệnh nền:</strong>{' '}
                          {selectedChronics.length > 0
                            ? selectedChronics.join(', ')
                            : 'Chưa ghi nhận bệnh nền'}
                        </div>
                      </div>

                      {/* 3. Lý do khám & Địa chỉ */}
                      <div className="space-y-3 text-sm">
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Lý do khám &amp; Ghi chú hộ gia đình
                          </div>
                          <p className="leading-relaxed text-slate-700">
                            {selectedEncounter.displayNotes ||
                              selectedEncounter.subjectiveNote ||
                              'Lịch khám định kỳ theo hợp đồng chăm sóc gia đình.'}
                          </p>
                        </div>

                        {!selectedIsTelehealth && (
                          <div className="space-y-1">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Địa chỉ khám tại nhà
                            </div>
                            <p className="text-sm text-slate-700">
                              {selectedAddress || 'Xem chi tiết địa chỉ trong hồ sơ hộ gia đình.'}
                            </p>
                          </div>
                        )}

                        {selectedEncounter.assessment && (
                          <div className="space-y-1 rounded-xl bg-slate-50 p-3.5">
                            <div className="text-xs font-bold text-slate-700">
                              Chẩn đoán gần nhất{' '}
                              {selectedEncounter.icd10Code && (
                                <span className="tabular-nums text-[#00258b]">
                                  ({selectedEncounter.icd10Code})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">{selectedEncounter.assessment}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thanh hành động đáy: Duy nhất 1 Primary CTA (#0037c1) */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <Link
                        href="/doctor/encounters"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      >
                        <span>Sổ khám &amp; lịch sử</span>
                      </Link>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {selectedIsTelehealth ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/doctor/encounters?encounterId=${selectedEncounter.id}`)
                              }
                              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0037c1] hover:text-[#0037c1]"
                            >
                              <span>Mở Phiếu khám</span>
                            </button>
                            <Button
                              asChild
                              className="min-h-11 rounded-xl bg-[#0037c1] px-5 py-2 text-xs font-bold text-white hover:bg-[#00258b] sm:text-sm"
                            >
                              <Link href={`/doctor/telemedicine?encounterId=${selectedEncounter.id}`}>
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  aria-hidden="true"
                                >
                                  videocam
                                </span>
                                <span>Vào phòng khám Video</span>
                              </Link>
                            </Button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/doctor/encounters?encounterId=${selectedEncounter.id}`)
                            }
                            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0037c1] px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#00258b] sm:text-sm"
                          >
                            <span
                              className="material-symbols-outlined text-[18px]"
                              aria-hidden="true"
                            >
                              clinical_notes
                            </span>
                            <span>Mở Phiếu khám &amp; ghi SOAP</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-bold text-slate-800">
                          Hồ sơ tóm tắt trước khám
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Chọn một ca khám ở cột bên trái để xem nhanh dị ứng, bệnh nền, lý do khám
                          và mở phiếu khám.
                        </p>
                      </div>
                      <div className="space-y-2 text-xs text-slate-500">
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                          Dị ứng &amp; Bệnh nền của bệnh nhân sẽ hiển thị tại đây.
                        </div>
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3.5 py-2.5">
                          Lý do khám, ghi chú hộ gia đình và địa chỉ khám tại nhà sẽ hiển thị tại
                          đây.
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <Link
                        href="/doctor/contracts"
                        className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:border-[#0037c1] hover:text-[#0037c1]"
                      >
                        Quản lý hộ phụ trách
                      </Link>
                      <Link
                        href="/doctor/encounters"
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#0037c1] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#00258b]"
                      >
                        <span>Mở sổ khám &amp; kê đơn</span>
                        <span
                          className="material-symbols-outlined text-[16px]"
                          aria-hidden="true"
                        >
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
