'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useContractWorkflow } from '@/lib/contract-workflow-storage';
import {
  contractsApi,
  encountersApi,
  patientsApi,
  type EncounterItem,
  type FourPartyContract,
  type MedicalContractListItem,
  type PatientDto,
  type VitalSignDto,
} from '@/lib/api';
import { getStoredAuthSession } from '@/lib/auth-storage';
import {
  INITIAL_FAMILY_MEMBERS_DATA,
  MemberHealthData,
} from './family-member-care-view';
import {
  getAbnormalMetricSummaries,
  isSameLocalCalendarDay,
} from '../utils/vital-metrics.util';
import { KpiStatCard } from '@/components/dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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

function getAvatar(rel?: string, gender?: string, age?: number): string {
  if (age && age >= 60) {
    return gender === 'FEMALE' ? '👵' : '👨‍🦳';
  }
  if (age && age < 18) {
    return gender === 'FEMALE' ? '👧' : '👦';
  }
  return gender === 'FEMALE' ? '👩' : '👨';
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
): Record<string, MemberHealthData> {
  if (!patients || patients.length === 0) return INITIAL_FAMILY_MEMBERS_DATA;

  const result: Record<string, MemberHealthData> = {};

  patients.forEach((p, idx) => {
    const age = calculateAge(p.dateOfBirth);
    const relation = p.relationshipToHead
      ? formatRelation(p.relationshipToHead, p.gender)
      : idx === 0
      ? 'Chủ hộ'
      : 'Thành viên';
    const avatar = getAvatar(p.relationshipToHead, p.gender, age);
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
      avatar: avatar,
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
  const workflow = useContractWorkflow();
  const [session, setSession] = useState<{ user: any; role: string | null; token: string | null }>({
    user: null,
    role: 'FAMILY',
    token: null,
  });

  const loggedInName =
    session.user?.name && !session.user.name.includes('(Chủ Hộ)')
      ? session.user.name
      : null;

  const [contracts, setContracts] = useState<MedicalContractListItem[]>([]);
  const [activeContract, setActiveContract] = useState<MedicalContractListItem | null>(null);
  const [realPatients, setRealPatients] = useState<PatientDto[]>([]);
  const nextEncounterRef = useRef<EncounterItem | null>(null);
  const vitalsByMemberRef = useRef<Record<string, VitalSignDto[]>>({});
  const [membersData, setMembersData] = useState<Record<string, MemberHealthData>>(INITIAL_FAMILY_MEMBERS_DATA);

  useEffect(() => {
    let isMounted = true;
    setSession(getStoredAuthSession());
    encountersApi
      .getFamilyTimetable({ pageSize: 10 })
      .then((res) => {
        if (!isMounted || !Array.isArray(res.data)) return;
        const upcoming =
          res.data.find((e) =>
            ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'].includes(String(e.encounterStatus))
          ) ?? null;
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
          doctorTitle: gateActive.doctor?.title ?? found?.doctorTitle,
          doctorPhone: gateActive.doctor?.phone ?? found?.doctorPhone,
          facilityName: gateActive.doctor?.hospitalName ?? found?.facilityName ?? '',
        };
      }

      if (found) {
        setActiveContract(found);
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
        }
      })
      .catch((err) => {
        console.warn('Patients API fetch fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const membersList = Object.values(membersData);
  const totalMembers = realPatients.length > 0 ? realPatients.length : membersList.length;
  const warningMembers = membersList.filter((m) => m.status === 'warning');
  const warningMembersCount = warningMembers.length;
  const warningMember = warningMembers.length > 0 ? warningMembers[0] : null;
  const upcomingVisitsCount = membersList.filter((m) => Boolean(m.upcomingVisit)).length;

  const headMember = realPatients.find((p) => p.relationshipToHead === 'SELF') || realPatients[0];
  const familyHeadName = headMember ? headMember.fullName : (loggedInName || session.user?.name || 'Gia Đình');

  const [currentTimestamp] = useState(() => Date.now());
  const daysUntilExpiry = activeContract?.endDate
    ? Math.ceil((new Date(activeContract.endDate).getTime() - currentTimestamp) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-full bg-[#f5f6f8] font-sans text-slate-900 antialiased">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* 1. HEADER THOÁNG ĐÃNG TRỰC TIẾP TRÊN NỀN CANVAS */}
        <header className="space-y-4">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  suppressHydrationWarning
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60"
                >
                  Hộ #{activeContract?.contractNumber || (session.user?.id ? `FAM-${session.user.id.slice(0, 6).toUpperCase()}` : 'FAM-NEW')}
                </span>
                <Link
                  href="/family/subscription"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    activeContract
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/60'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200/60'
                  }`}
                  title="Xem hợp đồng hoặc đổi Bác sĩ / Gói dịch vụ"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeContract ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{activeContract?.packageName || 'Chưa Đăng Ký Gói Y Tế'}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              <h1
                suppressHydrationWarning
                className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance"
              >
                Bảng Sức Khỏe Gia Đình: Hộ {familyHeadName}
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
                Trung tâm điều hành sức khỏe hằng ngày · Theo dõi chỉ số sức khỏe, đơn thuốc và lịch khám bác sĩ tại nhà
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button asChild className="min-h-11 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xs">
                <Link href="/family/appointments">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  <span>Đặt lịch khám</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-xl border-slate-200/90 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Link href="/family/telemedicine">
                  <span className="material-symbols-outlined text-[20px] text-primary">videocam</span>
                  <span>Gọi video bác sĩ</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-xl border-rose-200/80 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 tabular-nums hover:bg-rose-100/80 hover:text-rose-800"
              >
                <a href="tel:19006868" title="Tổng đài y tế cấp cứu khẩn cấp 24/7">
                  <span className="material-symbols-outlined text-[19px] text-rose-600">emergency</span>
                  <span>SOS 1900 6868</span>
                </a>
              </Button>
            </div>
          </div>
        </header>

        {/* 1.5. BANNER NHẮC THANH TOÁN VIETQR HỢP ĐỒNG (NẾU ĐANG CHỜ KÍCH HOẠT) */}
        {activeContract && activeContract.contractStatus !== 'ACTIVE' ? (
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
              className="px-6 py-3 bg-white hover:bg-slate-100 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-center shrink-0 flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              <span>Thanh Toán VietQR Ngay</span>
            </Link>
          </aside>
        ) : workflow?.step !== 'ACTIVE' && (
          <aside
            aria-label="Đăng ký Bác sĩ gia đình"
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#2E37A4] via-[#242c88] to-[#1a206b] text-white flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-lg shadow-blue-950/15"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/15 text-blue-100 border border-white/20 inline-block">
                  Quy Trình Chuẩn Bộ Y Tế 2026
                </span>
                <span className="text-xs text-blue-200">· Hợp đồng y tế điện tử 4 bên</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Bảo Vệ Sức Khỏe Gia Đình Toàn Diện Cùng Bác Sĩ Riêng Quản Nhiệm
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Khám phá danh sách Bác sĩ gia đình chuyên môn cao (BV ĐHYD, Bạch Mai, Chợ Rẫy, Vinmec), chọn gói dịch vụ phù hợp và ký kết Hợp đồng điện tử 4 bên bảo chứng pháp lý.
              </p>
            </div>

            <Link
              href="/doctors"
              className="px-6 py-3 bg-white hover:bg-slate-100 text-[#0037c1] rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start md:self-center shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_search</span>
              <span>Chọn Bác Sĩ &amp; Đăng Ký Gói Ngay</span>
            </Link>
          </aside>
        )}

        {/* 1.8 THẺ HỢP ĐỒNG Y TẾ HIỆN TẠI & BÁC SĨ GIA ĐÌNH PHỤ TRÁCH CHÍNH (BACKEND SYNC) */}
        <section aria-label="Hợp đồng y tế & Bác sĩ gia đình" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Thông tin Hợp đồng Y tế Hiện tại */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2E37A4] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Hợp Đồng Y Tế Hiện Tại
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    activeContract?.contractStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {activeContract?.contractStatus === 'ACTIVE' ? 'Đang hiệu lực' : 'Chờ hoàn tất'}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {activeContract?.packageName || 'Gói Chăm Sóc Sức Khỏe Gia Đình Toàn Diện'}
                </h3>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>Mã HĐ: <strong className="text-slate-700">#{activeContract?.contractNumber || 'FMD-2026-HN-001'}</strong></span>
                  <span>·</span>
                  <span>Thời hạn: {activeContract?.startDate ? new Date(activeContract.startDate).toLocaleDateString('vi-VN') : '01/01/2026'} – {activeContract?.endDate ? new Date(activeContract.endDate).toLocaleDateString('vi-VN') : '31/12/2026'}</span>
                </div>
              </div>

              {daysUntilExpiry !== null && daysUntilExpiry <= 15 && daysUntilExpiry >= 0 && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">notification_important</span>
                  <span>Hợp đồng sắp hết hạn trong {daysUntilExpiry} ngày! Vui lòng gia hạn để duy trì quyền lợi bác sĩ riêng.</span>
                </div>
              )}

              {/* Hạn ngạch quyền lợi */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">home</span>
                    Khám tại nhà còn lại
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {activeContract?.remainingHomeVisits ?? 3} / {activeContract?.totalHomeVisits ?? 4} <span className="text-xs font-normal text-slate-500">lượt</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-blue-600">videocam</span>
                    Tư vấn Telehealth
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {activeContract?.remainingTelehealth ?? 10} / {activeContract?.totalTelehealth ?? 12} <span className="text-xs font-normal text-slate-500">lượt</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <Link
                href="/family/subscription"
                className="text-[#2E37A4] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Xem chi tiết hợp đồng &amp; phụ lục</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
              <Link
                href="/family/billing"
                className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
              >
                <span>Hóa đơn VietQR</span>
                <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Bác Sĩ Gia Đình Phụ Trách Chính */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Bác Sĩ Gia Đình Phụ Trách
                  </span>
                </div>
                {activeContract?.doctorId || activeContract?.doctorName ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#2E37A4] border border-blue-200">
                    Bác sĩ quản nhiệm
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                    Đang chờ CSYT chỉ định
                  </span>
                )}
              </div>

              {activeContract?.doctorId || activeContract?.doctorName ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#2E37A4] flex items-center justify-center text-xl font-bold">
                      {activeContract.doctorName ? activeContract.doctorName.charAt(0) : 'B'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {activeContract.doctorTitle ? `${activeContract.doctorTitle} ` : 'BSCKI. '}
                        {activeContract.doctorName || 'Nguyễn Minh Tuấn'}
                      </h4>
                      <div className="text-xs text-slate-500 font-medium">
                        {activeContract.doctorSpecialty || 'Chuyên khoa Y học Gia đình & Nội khoa'} · {activeContract.facilityName || 'Bệnh viện ĐHYD'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="material-symbols-outlined text-[18px] text-rose-600">phone_in_talk</span>
                      <span>Hotline khẩn cấp:</span>
                      <strong className="text-slate-900 tabular-nums">{activeContract.doctorPhone || '0988 123 456'}</strong>
                    </div>
                    <a
                      href={`tel:${activeContract.doctorPhone || '0988123456'}`}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
                    >
                      Gọi ngay
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span className="material-symbols-outlined text-[18px] text-amber-700">schedule</span>
                    <span>Đang chờ cơ sở y tế chỉ định bác sĩ</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hợp đồng của gia đình đã được ghi nhận. Cơ sở y tế <strong>{activeContract?.facilityName || 'Bệnh viện Đa khoa Quốc tế'}</strong> đang tiến hành phân bổ bác sĩ gia đình phù hợp trong vòng 24 giờ làm việc.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
              <Link
                href="/family/feedback"
                className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-500">star</span>
                <span>Đánh giá &amp; Góp ý bác sĩ</span>
              </Link>
              <Link
                href="/family/telemedicine"
                className="text-[#2E37A4] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>Tư vấn qua video</span>
                <span className="material-symbols-outlined text-[14px]">videocam</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. CẢNH BÁO SỨC KHỎE NHẸ NHÀNG (KHI CÓ CHỈ SỐ CẦN CHÚ Ý) */}
        {warningMember ? (
          <Alert
            role="alert"
            className="flex flex-col justify-between gap-4 rounded-2xl border-amber-200/80 bg-amber-50/70 p-4 transition-all sm:flex-row sm:items-center sm:p-5"
          >
            <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div className="min-w-0">
                <AlertTitle className="text-sm font-semibold text-amber-900">
                  {realPatients.length > 0
                    ? `Lưu ý sức khỏe hôm nay: ${warningMember.name} (${warningMember.statusText})`
                    : 'Lưu ý sức khỏe hôm nay: Bác Nguyễn Văn Phúc (Huyết áp 135/85 mmHg)'}
                </AlertTitle>
                <AlertDescription className="mt-0.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                  Chỉ số cần theo dõi. Vui lòng kiểm tra lại vào buổi chiều và nhắc thành viên dùng thuốc đúng giờ theo chỉ định của bác sĩ phụ trách.
                </AlertDescription>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-9 self-start rounded-xl border-amber-300 bg-white text-xs font-semibold text-slate-900 shadow-xs hover:bg-amber-100/50 sm:self-auto sm:text-sm"
            >
              <Link href={`/family/members/${warningMember.id}`}>
                Xem chi tiết {warningMember.name.split(' ').slice(-1)[0]}
              </Link>
            </Button>
          </Alert>
        ) : (
          <Alert className="flex flex-col justify-between gap-4 rounded-2xl border-emerald-200/80 bg-emerald-50/60 p-4 transition-all sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div className="min-w-0">
                <AlertTitle className="text-sm font-semibold text-emerald-900">
                  Sức khỏe gia đình hôm nay: Chưa ghi nhận cảnh báo chỉ số bất thường
                </AlertTitle>
                <AlertDescription className="mt-0.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
                  Ghi nhận chỉ số cho thành viên có bệnh nền hoặc khi có dấu hiệu bất thường giúp bạn và bác sĩ gia đình phát hiện sớm các thay đổi.
                </AlertDescription>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-9 self-start rounded-xl border-emerald-300 bg-white text-xs font-semibold text-slate-900 shadow-xs hover:bg-emerald-100/50 sm:self-auto sm:text-sm"
            >
              <Link href="/family/vitals">Theo dõi &amp; nhập chỉ số</Link>
            </Button>
          </Alert>
        )}

        {/* 3. DẢI 3 CHỈ SỐ NHỊP NGÀY (KPI) */}
        <section aria-label="Tổng quan chỉ số hộ gia đình" className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
          <KpiStatCard
            title="Trạng thái cả gia đình"
            value={`${totalMembers} thành viên`}
            icon="group"
            iconClassName="bg-primary/10 text-primary"
            footer={
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  warningMembersCount > 0 ? 'text-amber-800' : 'text-emerald-800'
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    warningMembersCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {warningMembersCount > 0
                    ? `${warningMembersCount} thành viên cần chú ý chỉ số`
                    : 'Các thành viên hiện ổn định'}
                </span>
              </div>
            }
          />

          <Link href="/family/prescriptions" className="space-y-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs transition-colors hover:border-teal-400 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">Đơn thuốc</span>
              <span className="material-symbols-outlined text-[20px] text-teal-700" aria-hidden="true">medication</span>
            </div>
            <p className="text-sm text-slate-600">Xem các đơn và lời dặn bác sĩ đã chia sẻ.</p>
          </Link>

          {/* KPI 3 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lịch khám sắp tới
              </span>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">event_available</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {upcomingVisitsCount} lịch hẹn
            </div>
            <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-[16px] text-[#2E37A4]">home</span>
              <span>
                {activeContract?.doctorName
                  ? `BS. ${activeContract.doctorName} (Khám tại nhà)`
                  : 'Gần nhất: 09:30 · 27/10 (Khám tại nhà)'}
              </span>
            </div>
          </div>
        </section>

        {/* 4. CHỈ SỐ SỨC KHỎE HÔM NAY CỦA CÁC THÀNH VIÊN */}
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Chỉ Số Sức Khỏe Hôm Nay Của Các Thành Viên ({totalMembers})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Tổng hợp chỉ số đo gần nhất và trạng thái sức khỏe của từng thành viên trong hộ gia đình
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/family/vitals"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline sm:text-sm"
              >
                <span>Nhập &amp; xem xu hướng chỉ số</span>
                <span className="material-symbols-outlined text-[16px]">monitoring</span>
              </Link>
              <Link
                href="/family/members"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-primary hover:underline sm:text-sm"
              >
                <span>Quản lý thành viên</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {membersList.map((m) => {
              const isWarning = m.status === 'warning';

              return (
                <Link key={m.id} href={`/family/members/${m.id}`} className="group block outline-hidden">
                  <Card className="h-full gap-5 rounded-2xl border-slate-200/70 bg-white p-6 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl transition-transform group-hover:scale-105">
                          {m.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-primary">
                            {m.name}
                          </div>
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
                            : 'border-emerald-200/80 bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{isWarning ? 'Cần chú ý' : 'Ổn định'}</span>
                      </Badge>
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
                      </div>

                      <div className="text-center">
                        <span className="block truncate text-[11px] font-medium text-slate-500">
                          SpO2
                        </span>
                        <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                          {m.spo2}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="block truncate text-[11px] font-medium text-slate-500">
                          Nhịp tim
                        </span>
                        <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                          {m.heartRate.split(' ')[0]}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="block truncate text-[11px] font-medium text-slate-500">
                          Glucose
                        </span>
                        <span className="mt-1 block truncate text-sm font-bold text-slate-900 tabular-nums sm:text-base">
                          {m.glucose.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="truncate">
                        {m.lastUpdated}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                        <span>Chi tiết</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="max-w-3xl">
          <aside className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/70 shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-base text-slate-900">
                Bác Sĩ Gia Đình
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Trực tuyến</span>
              </span>
            </div>

            {activeContract?.doctorName ? (
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#2E37A4] text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                  {activeContract.doctorName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {activeContract.doctorTitle ? `${activeContract.doctorTitle} ` : 'BSCKI. '}
                    {activeContract.doctorName}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {activeContract.doctorSpecialty || 'Chuyên khoa Y học Gia đình & Nội khoa'} · {activeContract.facilityName || 'Bệnh viện liên kết'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-1">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">schedule</span>
                  <span>Đang chờ chỉ định bác sĩ</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {activeContract ? 'Cơ sở y tế đang phân bổ bác sĩ gia đình chuyên trách cho hộ.' : 'Chưa có hợp đồng. Đăng ký gói để kết nối bác sĩ.'}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Khám bác sĩ tại nhà</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    Còn {activeContract?.remainingHomeVisits ?? 3}/{activeContract?.totalHomeVisits ?? 4} lượt
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E37A4] rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        ((activeContract?.remainingHomeVisits ?? 3) / (activeContract?.totalHomeVisits || 4)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Tư vấn Video 24/7</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    Còn {activeContract?.remainingTelehealth ?? 10}/{activeContract?.totalTelehealth ?? 12} lượt
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        ((activeContract?.remainingTelehealth ?? 10) / (activeContract?.totalTelehealth || 12)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-slate-600">Lịch khám kế tiếp</span>
                <span className="font-semibold tabular-nums text-[#2E37A4]">
                  {upcomingVisitsCount > 0 ? '09:30 · 27/10' : 'Chưa có lịch hẹn'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                Hợp đồng #{activeContract?.contractNumber || 'FMD-2026-HN-001'}
              </span>
              <Link
                href="/family/subscription"
                className="font-semibold text-[#2E37A4] hover:text-[#222982] hover:underline outline-hidden"
              >
                Xem quyền lợi {activeContract?.packageName || 'gói VIP'}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
