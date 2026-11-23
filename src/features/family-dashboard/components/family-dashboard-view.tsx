'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  contractsApi,
  encountersApi,
  patientsApi,
  publicApi,
  type EncounterItem,
  type FourPartyContract,
  type MedicalContractListItem,
  type PatientDto,
  type VitalSignDto,
} from '@/lib/api';
import {
  prescriptionsApi,
  type FamilyPrescription,
} from '@/lib/api/prescriptions.api';
import { getStoredAuthSession } from '@/lib/auth-storage';
import { type MemberHealthData } from './family-member-care-view';
import {
  getAbnormalMetricSummaries,
  isSameLocalCalendarDay,
} from '../utils/vital-metrics.util';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FamilyMemberAvatar } from '@/components/shared/family-member-avatar';
import { MedicalDomainIcon } from '@/components/shared/medical-domain-icon';

type FamilyMemberOverviewData = MemberHealthData & {
  measuredToday: boolean;
  gender?: string;
  relationshipCode?: string;
};

function calculateAge(dob?: string): number {
  if (!dob) return 45;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 45;
  const diff = Date.now() - birthDate.getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age > 0 && age < 120 ? age : 45;
}

function formatRelation(rel?: string, gender?: string): string {
  switch (rel) {
    case 'SELF':
      return 'Chủ hộ';
    case 'SPOUSE':
      return gender === 'FEMALE' ? 'Vợ' : 'Chồng';
    case 'CHILD':
      return 'Con';
    case 'PARENT':
      return gender === 'FEMALE' ? 'Mẹ' : 'Bố';
    case 'OTHER':
    default:
      return 'Thành viên';
  }
}

function formatAllergies(allergies?: any[]): string {
  if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
    return 'Không có tiền sử dị ứng thuốc';
  }
  return allergies
    .map((a) => (typeof a === 'string' ? a : a.allergen || 'Dị ứng thuốc'))
    .join(', ');
}

function formatVitalUpdatedLabel(rawIso: string): string {
  const parsed = new Date(rawIso);
  if (Number.isNaN(parsed.getTime())) return 'Đã ghi nhận';
  const timeStr = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
  if (isSameLocalCalendarDay(rawIso)) {
    return `${timeStr} Hôm nay`;
  }
  const dateStr = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
  }).format(parsed);
  return `${timeStr} (${dateStr})`;
}

function getLatestMemberVital(list: VitalSignDto[] | undefined): VitalSignDto | null {
  if (!list || list.length === 0) return null;
  return [...list].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )[0];
}

function convertPatientsToMembersData(
  patients: PatientDto[],
  contract: MedicalContractListItem | null,
  vitalsByPatientId: Record<string, VitalSignDto[]> = {},
  nextEncounter: EncounterItem | null = null
): Record<string, FamilyMemberOverviewData> {
  if (!patients || patients.length === 0) return {};

  const result: Record<string, FamilyMemberOverviewData> = {};

  patients.forEach((p, idx) => {
    const age = calculateAge(p.dateOfBirth);
    const relation = p.relationshipToHead
      ? formatRelation(p.relationshipToHead, p.gender)
      : idx === 0
      ? 'Chủ hộ'
      : 'Thành viên';
    const allergiesStr = formatAllergies(p.allergies);
    const memberId = p.id || `mem-${idx + 1}`;
    const latestVital = getLatestMemberVital(vitalsByPatientId[memberId]);
    const isAbnormalToday = Boolean(
      latestVital && isSameLocalCalendarDay(latestVital.recordedAt) && latestVital.isAbnormalAlert
    );
    const abnormalSummaries = isAbnormalToday ? getAbnormalMetricSummaries(latestVital) : [];
    const bpDisplay =
      latestVital && (latestVital.systolicBp != null || latestVital.diastolicBp != null)
        ? `${latestVital.systolicBp ?? '--'}/${latestVital.diastolicBp ?? '--'}`
        : '--';

    const participantIds = (nextEncounter?.participants ?? []).map((pt) => pt.patientId);
    const isCoveredByNextEncounter =
      Boolean(nextEncounter) &&
      (nextEncounter?.visitScope === 'FAMILY' ||
        participantIds.length === 0 ||
        participantIds.includes(memberId));

    const upcomingVisit =
      nextEncounter && isCoveredByNextEncounter
        ? {
            doctor:
              nextEncounter.doctor?.doctorName ||
              `${contract?.doctorTitle ? contract.doctorTitle + ' ' : 'BSCKI. '}${contract?.doctorName || 'Bác sĩ phụ trách'}`,
            specialty: contract?.doctorSpecialty || 'Y học Gia đình & Nội khoa',
            hospital:
              nextEncounter.doctor?.facility?.facilityName ||
              contract?.facilityName ||
              'Cơ sở y tế đối tác',
            time: nextEncounter.scheduledTime?.includes('T')
              ? nextEncounter.scheduledTime.slice(11, 16)
              : nextEncounter.scheduledTime?.slice(0, 5) || '--:--',
            date: nextEncounter.scheduledDate
              ? nextEncounter.scheduledDate.slice(5, 10).split('-').reverse().join('/')
              : '',
            mode: (nextEncounter.encounterType === 'TELEHEALTH' ? 'telehealth' : 'home') as
              | 'home'
              | 'telehealth',
            note:
              nextEncounter.encounterStatus === 'REQUESTED'
                ? 'Lịch dự kiến sau thanh toán — chờ xác nhận'
                : 'Lịch khám gia đình đã xác nhận',
          }
        : undefined;

    result[memberId] = {
      id: memberId,
      name: p.fullName || `Thành viên ${idx + 1}`,
      relation: relation,
      age: age,
      avatar: '',
      gender: p.gender,
      relationshipCode: p.relationshipToHead,
      bhyt: 'Đã kích hoạt gói FamiDoc',
      bloodType: p.bloodType || '--',
      allergies: allergiesStr,
      chronicCondition: p.chronicDiseases?.trim() || 'Chưa ghi nhận bệnh lý mạn tính',
      status: isAbnormalToday ? 'warning' : 'good',
      statusText: isAbnormalToday
        ? abnormalSummaries.join(' • ') || 'Chỉ số vượt ngưỡng an toàn'
        : latestVital
          ? 'Chỉ số sức khỏe ổn định'
          : 'Chưa ghi nhận chỉ số đo',
      bp: bpDisplay,
      bpStatus: isAbnormalToday ? 'Cần theo dõi' : latestVital ? 'Bình thường' : 'Chưa đo',
      spo2: latestVital?.spo2 != null ? `${latestVital.spo2}%` : '--',
      heartRate: latestVital?.heartRate != null ? `${latestVital.heartRate} lần/phút` : '--',
      glucose: latestVital?.bloodGlucose != null ? `${latestVital.bloodGlucose} mmol/L` : '--',
      glucoseStatus: latestVital?.bloodGlucose != null ? 'Đã ghi nhận' : 'Chưa đo',
      lastUpdated: latestVital
        ? formatVitalUpdatedLabel(latestVital.recordedAt)
        : 'Chưa có dữ liệu đo',
      measuredToday: Boolean(latestVital && isSameLocalCalendarDay(latestVital.recordedAt)),
      upcomingVisit: upcomingVisit,
    };
  });

  return result;
}

function normalizeToContractListItem(
  raw: FourPartyContract | MedicalContractListItem
): MedicalContractListItem {
  const item = raw as MedicalContractListItem & Partial<FourPartyContract>;
  const amount = Number(item.totalAmountVnd ?? item.packagePrice ?? 0);
  const sigCount =
    typeof item.signaturesCount === 'number'
      ? item.signaturesCount
      : item.signatures
        ? Object.keys(item.signatures).length
        : 0;

  return {
    id: item.id,
    contractNumber: item.contractNumber,
    contractStatus: item.contractStatus ?? item.status ?? 'DRAFT',
    packageId: item.packageId || 'pkg-default',
    packageName: item.packageName || 'Gói Chăm Sóc Sức Khỏe Gia Đình',
    facilityId: item.facilityId || '',
    facilityName: item.facilityName || '',
    doctorId: item.doctorId ?? item.assignedDoctorId,
    doctorName: item.doctorName ?? item.assignedDoctorName,
    doctorAvatarUrl: item.doctorAvatarUrl ?? (item as any).doctor?.user?.avatarUrl ?? null,
    familyId: item.familyId || '',
    familyHeadName: item.familyHeadName ?? item.familyRepresentativeName,
    memberCount: item.memberCount ?? item.membersCount ?? 1,
    totalAmountVnd: Number.isFinite(amount) ? amount : 0,
    signaturesCount: sigCount,
    createdAt: item.createdAt,
    startDate: item.startDate,
    endDate: item.endDate,
    doctorTitle: item.doctorTitle,
    doctorSpecialty: item.doctorSpecialty,
    doctorPhone: item.doctorPhone,
    remainingHomeVisits: item.remainingHomeVisits,
    totalHomeVisits: item.totalHomeVisits,
    remainingTelehealth: item.remainingTelehealth,
    totalTelehealth: item.totalTelehealth,
  };
}

export function FamilyDashboardView() {
  const [, setSession] = useState<{ user: any; role: string | null; token: string | null }>({
    user: null,
    role: 'FAMILY',
    token: null,
  });

  const [, setContracts] = useState<MedicalContractListItem[]>([]);
  const [activeContract, setActiveContract] = useState<MedicalContractListItem | null>(null);
  const [realPatients, setRealPatients] = useState<PatientDto[]>([]);
  const [nextEncounter, setNextEncounter] = useState<EncounterItem | null>(null);
  const [upcomingEncountersCount, setUpcomingEncountersCount] = useState(0);
  const [issuedPrescriptions, setIssuedPrescriptions] = useState<FamilyPrescription[]>([]);
  const nextEncounterRef = useRef<EncounterItem | null>(null);
  const vitalsByMemberRef = useRef<Record<string, VitalSignDto[]>>({});
  const [membersData, setMembersData] = useState<Record<string, FamilyMemberOverviewData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [doctorImgError, setDoctorImgError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);
    setSession(getStoredAuthSession());
    prescriptionsApi
      .listForFamily(1)
      .then((res) => {
        if (!isMounted || !Array.isArray(res?.items)) return;
        setIssuedPrescriptions(res.items.filter((item) => item.status === 'ISSUED'));
      })
      .catch(() => {});
    encountersApi
      .getFamilyTimetable({ pageSize: 10 })
      .then((res) => {
        if (!isMounted || !Array.isArray(res.data)) return;
        const upcomingList = res.data.filter((e) =>
          ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'].includes(String(e.encounterStatus))
        );
        const upcoming = upcomingList[0] ?? null;
        setUpcomingEncountersCount(upcomingList.length);
        setNextEncounter(upcoming);
        nextEncounterRef.current = upcoming;
        setRealPatients((currentPatients) => {
          if (currentPatients.length > 0) {
            setActiveContract((currentContract) => {
              setMembersData(
                convertPatientsToMembersData(
                  currentPatients,
                  currentContract,
                  vitalsByMemberRef.current,
                  upcoming
                )
              );
              return currentContract;
            });
          }
          return currentPatients;
        });
      })
      .catch(() => {});
    Promise.allSettled([
      contractsApi.getMedicalContracts(),
      contractsApi.getFamilyGateStatus(),
    ]).then(([contractsRes, gateRes]) => {
      if (!isMounted) return;

      const rawList =
        contractsRes.status === 'fulfilled'
          ? Array.isArray(contractsRes.value)
            ? contractsRes.value
            : (contractsRes.value as any)?.data && Array.isArray((contractsRes.value as any).data)
              ? (contractsRes.value as any).data
              : (contractsRes.value as any)?.data?.items &&
                  Array.isArray((contractsRes.value as any).data.items)
                ? (contractsRes.value as any).data.items
                : []
          : [];

      const list: MedicalContractListItem[] = rawList.map(normalizeToContractListItem);
      const gateActive =
        gateRes.status === 'fulfilled' ? gateRes.value.activeContract : null;

      setContracts(list);

      let found =
        list.find((c) => c.contractStatus === 'ACTIVE') || list[0] || null;
      if (gateActive) {
        found = {
          ...(found ?? {
            id: gateActive.id,
            contractNumber: gateActive.contractNumber,
            contractStatus: 'ACTIVE',
            packageId: 'pkg-active',
            packageName: gateActive.packageName || 'Gói Chăm Sóc Sức Khỏe Gia Đình',
            facilityId: '',
            facilityName: gateActive.doctor?.hospitalName || '',
            familyId: '',
            memberCount: gateActive.memberCount,
            totalAmountVnd: 0,
            signaturesCount: 4,
            createdAt: new Date().toISOString(),
          }),
          contractStatus: 'ACTIVE',
          memberCount: gateActive.memberCount ?? found?.memberCount ?? 1,
          endDate: gateActive.endDate ?? found?.endDate,
          packageName: gateActive.packageName ?? found?.packageName ?? 'Gói Chăm Sóc Sức Khỏe Gia Đình',
          doctorId: gateActive.doctor?.id ?? found?.doctorId,
          doctorName: gateActive.doctor?.fullName ?? found?.doctorName,
          doctorAvatarUrl: gateActive.doctor?.avatarUrl ?? found?.doctorAvatarUrl ?? null,
          doctorTitle: gateActive.doctor?.title ?? found?.doctorTitle,
          doctorPhone: gateActive.doctor?.phone ?? found?.doctorPhone,
          facilityName: gateActive.doctor?.hospitalName ?? found?.facilityName ?? '',
        };
      }

      if (found) {
        setDoctorImgError(false);
        setActiveContract(found);
        if (!found.doctorAvatarUrl && found.doctorId) {
          publicApi
            .getDoctorDetail(found.doctorId)
            .then((detail) => {
              if (!isMounted || !detail?.avatarUrl) return;
              setDoctorImgError(false);
              setActiveContract((prev) =>
                prev ? { ...prev, doctorAvatarUrl: detail.avatarUrl } : prev
              );
            })
            .catch(() => {});
        }
        setRealPatients((currentPatients) => {
          if (currentPatients.length > 0) {
            setMembersData(
              convertPatientsToMembersData(
                currentPatients,
                found,
                vitalsByMemberRef.current,
                nextEncounterRef.current
              )
            );
          }
          return currentPatients;
        });
      }
    });

    patientsApi
      .getFamilyMembers()
      .then(async (res) => {
        if (!isMounted) return;
        const list = Array.isArray(res)
          ? res
          : (res as any)?.data && Array.isArray((res as any).data)
          ? (res as any).data
          : [];
        if (list.length > 0) {
          const activeList = list.filter((p: PatientDto) => !p.status || p.status === 'ACTIVE');
          const effectiveList = activeList.length > 0 ? activeList : list;

          const vitalResults = await Promise.allSettled(
            effectiveList.map((p: PatientDto) => patientsApi.getMemberVitalSigns(p.id, 30))
          );
          if (!isMounted) return;

          const nextVitalsMap: Record<string, VitalSignDto[]> = {};
          effectiveList.forEach((p: PatientDto, idx: number) => {
            const vRes = vitalResults[idx];
            nextVitalsMap[p.id] =
              vRes && vRes.status === 'fulfilled' && Array.isArray(vRes.value)
                ? vRes.value
                : [];
          });

          vitalsByMemberRef.current = nextVitalsMap;
          setRealPatients(effectiveList);
          setActiveContract((currentContract) => {
            setMembersData(
              convertPatientsToMembersData(
                effectiveList,
                currentContract,
                nextVitalsMap,
                nextEncounterRef.current
              )
            );
            return currentContract;
          });
        } else {
          setRealPatients([]);
          setMembersData({});
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Patients API fetch error:', err);
        setErrorMessage('Không thể tải dữ liệu sức khỏe hộ gia đình.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reloadNonce]);

  const membersList = Object.values(membersData);
  const totalMembers = realPatients.length > 0 ? realPatients.length : membersList.length;
  const warningMembers = membersList.filter((m) => m.status === 'warning');
  const warningMember = warningMembers.length > 0 ? warningMembers[0] : null;
  const unmeasuredMembers = membersList.filter((m) => !m.measuredToday);
  const unmeasuredMember = unmeasuredMembers.length > 0 ? unmeasuredMembers[0] : null;
  const measuredTodayCount = membersList.filter((m) => m.measuredToday).length;

  const sortedMembers = [...membersList].sort((a, b) => {
    const rank = (m: FamilyMemberOverviewData) =>
      m.status === 'warning' ? 0 : !m.measuredToday ? 1 : 2;
    return rank(a) - rank(b);
  });

  const todayLabel = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date());

  const [currentTimestamp] = useState(() => Date.now());
  const daysUntilExpiry = activeContract?.endDate
    ? Math.ceil((new Date(activeContract.endDate).getTime() - currentTimestamp) / (1000 * 60 * 60 * 24))
    : null;

  const latestPrescription = issuedPrescriptions[0] ?? null;

  const nextEncounterLabel = nextEncounter
    ? `${nextEncounter.scheduledTime?.includes('T') ? nextEncounter.scheduledTime.slice(11, 16) : nextEncounter.scheduledTime?.slice(0, 5) || '--:--'} · ${nextEncounter.scheduledDate ? nextEncounter.scheduledDate.slice(5, 10).split('-').reverse().join('/') : ''}`
    : null;

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải bảng sức khỏe gia đình"
        className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased"
      >
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="h-20 rounded-2xl bg-slate-200/70 animate-pulse" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="h-32 rounded-2xl bg-slate-200/70 animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-200/70 animate-pulse" />
            <div className="h-32 rounded-2xl bg-slate-200/70 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-48 rounded-2xl bg-slate-200/70 animate-pulse" />
            <div className="h-48 rounded-2xl bg-slate-200/70 animate-pulse" />
            <div className="h-48 rounded-2xl bg-slate-200/70 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <Card className="rounded-3xl border-rose-200 bg-white p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-[26px]">error</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Không thể tải bảng sức khỏe gia đình</h1>
            <p className="text-sm text-slate-600">{errorMessage}</p>
            <div>
              <Button type="button" variant="outline" onClick={() => setReloadNonce((n) => n + 1)}>
                Thử tải lại
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (totalMembers === 0) {
    return (
      <div className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <Card className="rounded-3xl border-slate-200 bg-white p-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[26px]">family_restroom</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Chưa có hồ sơ thành viên gia đình</h1>
            <p className="text-sm text-slate-600">
              Thêm thành viên đầu tiên để bắt đầu theo dõi chỉ số sức khỏe, đơn thuốc và lịch khám bác sĩ.
            </p>
            <div>
              <Button asChild>
                <Link href="/family/members">Thêm thành viên đầu tiên</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* 1. NGỮ CẢNH HÔM NAY + 3 CHIP TÓM TẮT NHANH */}
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              Tổng quan về sức khỏe gia đình
            </h1>
            <p className="text-sm text-slate-600" suppressHydrationWarning>
              {todayLabel} · Theo dõi sức khỏe hằng ngày của cả nhà
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/family/members"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px] leading-none text-primary">
                ecg_heart
              </span>
              <span>Đã đo:</span>
              <span className="font-bold tabular-nums text-slate-900">
                {measuredTodayCount}/{totalMembers}
              </span>
            </Link>

            <Link
              href="/family/appointments"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px] leading-none text-primary">
                event_available
              </span>
              <span>Lịch hẹn:</span>
              <span className="font-bold tabular-nums text-slate-900">
                {upcomingEncountersCount}
              </span>
            </Link>

            <Link
              href="/family/prescriptions"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px] leading-none text-teal-700">
                medication
              </span>
              <span>Đơn thuốc:</span>
              <span className="font-bold tabular-nums text-slate-900">
                {issuedPrescriptions.length}
              </span>
            </Link>
          </div>
        </header>

        {/* BANNER NHẮC THANH TOÁN VIETQR HỢP ĐỒNG (NẾU ĐANG CHỜ KÍCH HOẠT) */}
        {activeContract && activeContract.contractStatus !== 'ACTIVE' && (
          <aside
            aria-label="Thanh toán kích hoạt hợp đồng"
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg shadow-emerald-950/15"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 text-emerald-100 border border-white/20 inline-block">
                  Hợp đồng #{activeContract.contractNumber}
                </span>
                <span className="text-xs text-emerald-200">· Chờ thanh toán kích hoạt</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Thanh Toán VietQR Để Kích Hoạt Quyền Lợi Chăm Sóc Sức Khỏe
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Hợp đồng y tế 4 bên đã được xác nhận. Vui lòng hoàn tất thanh toán {(activeContract.totalAmountVnd ?? 0).toLocaleString('vi-VN')} đ để bắt đầu lịch khám và kết nối với bác sĩ gia đình.
              </p>
            </div>

            <Link
              href={`/family/billing?contractId=${activeContract.id}`}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-center shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">qr_code_2</span>
              <span>Thanh Toán VietQR Ngay</span>
            </Link>
          </aside>
        )}

        {/* 2. BENTO GRID TRÊN: CẦN LÀM HÔM NAY (7/12) & BÁC SĨ PHỤ TRÁCH + ĐƠN THUỐC (5/12) */}
        <section
          aria-label="Cần làm hôm nay và Bác sĩ phụ trách"
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          {/* Cột trái: Cần làm hôm nay & sắp tới */}
          <Card className="flex flex-col justify-between rounded-2xl border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs lg:col-span-7">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Cần làm hôm nay &amp; sắp tới
                </h2>
                <span className="text-xs font-medium text-slate-500">
                  Ưu tiên theo ngày
                </span>
              </div>

              {!warningMember && unmeasuredMembers.length === 0 && !nextEncounter ? (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-900">
                    <span className="material-symbols-outlined text-[20px] leading-none text-emerald-700">
                      check_circle
                    </span>
                    <span>Hôm nay cả nhà đã cập nhật chỉ số ổn định</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <Link
                      href="/family/appointments"
                      className="inline-flex h-8 items-center rounded-lg border border-emerald-200 bg-white px-3 text-emerald-800 transition-colors hover:bg-emerald-50"
                    >
                      Đặt lịch →
                    </Link>
                    <Link
                      href="/family/prescriptions"
                      className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-slate-700 transition-colors hover:border-primary hover:text-primary"
                    >
                      Đơn thuốc →
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {warningMember && (
                    <li className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                          <span className="material-symbols-outlined text-[18px] leading-none">
                            warning
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">
                            Cần chú ý: {warningMember.name}
                          </div>
                          <div className="text-xs text-amber-900">{warningMember.statusText}</div>
                        </div>
                      </div>
                      <Link
                        href={`/family/members/${warningMember.id}`}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-amber-300 bg-white px-3 text-xs font-semibold text-slate-900 transition-colors hover:bg-amber-100/50"
                      >
                        <span>Xem hồ sơ</span>
                        <span className="material-symbols-outlined text-[15px] leading-none">
                          arrow_forward
                        </span>
                      </Link>
                    </li>
                  )}

                  {unmeasuredMember && (
                    <li className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                          <span className="material-symbols-outlined text-[18px] leading-none">
                            ecg_heart
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">
                            Chưa đo chỉ số hôm nay ({unmeasuredMembers.length} thành viên)
                          </div>
                          <div className="truncate text-xs text-slate-600">
                            {unmeasuredMembers.map((m) => m.name).join(', ')}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/family/members"
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-primary/25 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        <span>+ Nhập đo</span>
                      </Link>
                    </li>
                  )}

                  {nextEncounter && (
                    <li className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <span className="material-symbols-outlined text-[18px] leading-none">
                            event_available
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">
                            Lịch khám gần nhất:{' '}
                            <span className="tabular-nums">{nextEncounterLabel}</span>
                          </div>
                          <div className="text-xs text-slate-600">
                            {nextEncounter.encounterType === 'TELEHEALTH'
                              ? 'Tư vấn video trực tuyến'
                              : 'Khám tại nhà'}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/family/appointments"
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary"
                      >
                        <span>Xem lịch</span>
                        <span className="material-symbols-outlined text-[15px] leading-none">
                          arrow_forward
                        </span>
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </Card>

          {/* Cột phải: Bác sĩ gia đình phụ trách & Đơn thuốc gần nhất */}
          <Card className="flex flex-col justify-between gap-4 rounded-2xl border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs lg:col-span-5">
            <div className="space-y-4">
              {activeContract?.doctorId || activeContract?.doctorName ? (
                <div className="flex items-center gap-3.5">
                  <img
                    src={
                      !doctorImgError && activeContract.doctorAvatarUrl
                        ? activeContract.doctorAvatarUrl
                        : '/images/medsev/home-one/doctor/1.jpg'
                    }
                    alt={activeContract.doctorName || 'Bác sĩ gia đình'}
                    onError={() => setDoctorImgError(true)}
                    className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover object-top"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Bác sĩ gia đình phụ trách
                    </div>
                    <h2 className="truncate text-base font-bold text-slate-900">
                      {activeContract.doctorTitle ? `${activeContract.doctorTitle} ` : ''}
                      {activeContract.doctorName}
                    </h2>
                    <div className="truncate text-xs font-medium text-slate-500">
                      {[activeContract.doctorSpecialty, activeContract.facilityName]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Bác sĩ gia đình phụ trách
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <span className="material-symbols-outlined text-[18px] leading-none">
                      schedule
                    </span>
                    <span>Đang chờ cơ sở y tế chỉ định bác sĩ</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Button asChild className="min-h-11 rounded-xl px-4 text-sm font-semibold">
                  <Link href="/family/appointments">
                    <span className="material-symbols-outlined text-[18px] leading-none">
                      calendar_month
                    </span>
                    <span>Đặt lịch khám</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11 rounded-xl px-4 text-sm font-medium"
                >
                  <Link href="/family/telemedicine">
                    <span className="material-symbols-outlined text-[18px] leading-none text-primary">
                      videocam
                    </span>
                    <span>Gọi video bác sĩ</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    <MedicalDomainIcon name="prescription" size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800">
                      {latestPrescription
                        ? `Đơn thuốc gần nhất · ${latestPrescription.patient.fullName}`
                        : 'Đơn thuốc & lời dặn bác sĩ'}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {latestPrescription
                        ? latestPrescription.diagnosis || latestPrescription.prescriptionCode
                        : 'Xem các đơn thuốc bác sĩ đã chia sẻ'}
                    </div>
                  </div>
                </div>
                <Link
                  href="/family/prescriptions"
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-primary hover:text-primary"
                >
                  <span>Xem đơn</span>
                  <span className="material-symbols-outlined text-[14px] leading-none">
                    arrow_forward
                  </span>
                </Link>
              </div>

              {daysUntilExpiry !== null && daysUntilExpiry <= 15 && daysUntilExpiry >= 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-medium text-amber-900">
                  <span>Hợp đồng còn {daysUntilExpiry} ngày hết hạn.</span>
                  <Link
                    href="/family/subscription"
                    className="font-semibold text-primary hover:text-primary/80"
                  >
                    Gia hạn →
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* 3. TÓM TẮT SỨC KHỎE TỪNG THÀNH VIÊN (SẮP XẾP ƯU TIÊN) */}
        <section aria-label="Sức khỏe các thành viên hôm nay" className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Sức khỏe các thành viên hôm nay ({totalMembers})
            </h2>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/family/members"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-3.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 sm:text-sm"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">
                  monitoring
                </span>
                <span>+ Nhập chỉ số</span>
              </Link>
              <Link
                href="/family/members"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-primary/40 hover:text-primary sm:text-sm"
              >
                <span>Quản lý thành viên</span>
                <span className="material-symbols-outlined text-[16px] leading-none">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {sortedMembers.map((m) => {
              const isWarning = m.status === 'warning';
              const isUnmeasured = !isWarning && !m.measuredToday;

              return (
                <Card
                  key={m.id}
                  className="flex h-full flex-col justify-between gap-4 rounded-2xl border-slate-200/70 bg-white p-6 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <FamilyMemberAvatar
                            relationship={m.relationshipCode}
                            gender={m.gender}
                            age={m.age}
                            size={26}
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/family/members/${m.id}`}
                            className="block truncate text-base font-bold text-slate-900 transition-colors hover:text-primary"
                          >
                            {m.name}
                          </Link>
                          <div className="mt-0.5 truncate text-xs font-medium text-slate-500">
                            {m.relation} · <span className="tabular-nums">{m.age}</span> tuổi
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          isWarning
                            ? 'border-amber-200/80 bg-amber-50 text-amber-800'
                            : isUnmeasured
                              ? 'border-slate-200 bg-slate-100 text-slate-700'
                              : 'border-emerald-200/80 bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px] leading-none">
                          {isWarning ? 'warning' : isUnmeasured ? 'schedule' : 'check_circle'}
                        </span>
                        <span>{isWarning ? 'Cần chú ý' : isUnmeasured ? 'Chưa đo' : 'Ổn định'}</span>
                      </Badge>
                    </div>

                    <div className="truncate rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-500">Lưu ý: </span>
                      <span className="font-medium text-slate-800">{m.chronicCondition}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-100/90 bg-slate-50/70 p-3 sm:grid-cols-4">
                    <div className="text-center">
                      <span className="block truncate text-[11px] font-medium text-slate-500">
                        Huyết áp
                      </span>
                      <span
                        className={`mt-1 block truncate text-sm font-bold tabular-nums sm:text-base ${
                          isWarning ? 'text-amber-800' : 'text-slate-900'
                        }`}
                      >
                        {m.bp}
                      </span>
                      <span className="block text-[10px] text-slate-500">mmHg</span>
                    </div>

                    <div className="text-center">
                      <span className="block truncate text-[11px] font-medium text-slate-500">
                        SpO2
                      </span>
                      <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                        {m.spo2}
                      </span>
                      <span className="block text-[10px] text-slate-500">%</span>
                    </div>

                    <div className="text-center">
                      <span className="block truncate text-[11px] font-medium text-slate-500">
                        Nhịp tim
                      </span>
                      <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                        {m.heartRate.split(' ')[0]}
                      </span>
                      <span className="block text-[10px] text-slate-500">bpm</span>
                    </div>

                    <div className="text-center">
                      <span className="block truncate text-[11px] font-medium text-slate-500">
                        Glucose
                      </span>
                      <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                        {m.glucose.split(' ')[0]}
                      </span>
                      <span className="block text-[10px] text-slate-500">mmol/L</span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="truncate text-xs text-slate-500">{m.lastUpdated}</div>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <Link
                        href={`/family/members/${m.id}#vitals-section`}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-slate-700 transition-colors hover:border-primary hover:text-primary"
                      >
                        + Nhập đo
                      </Link>
                      <Link
                        href={`/family/members/${m.id}`}
                        className="inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-primary transition-colors hover:bg-primary/5"
                      >
                        <span>Xem hồ sơ</span>
                        <span className="material-symbols-outlined text-[14px] leading-none">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
