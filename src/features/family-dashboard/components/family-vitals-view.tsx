'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  extractErrorMessage,
  patientsApi,
  type PatientDto,
  type VitalSignDto,
} from '@/lib/api';
import {
  getAbnormalMetricSummaries,
  hasTrackedChronicCondition,
  isSameLocalCalendarDay,
} from '../utils/vital-metrics.util';
import { MemberVitalSignsSection } from './member-vital-signs-section';

const RELATIONSHIP_LABELS: Record<string, string> = {
  HEAD_OF_HOUSEHOLD: 'Chủ hộ',
  SELF: 'Chủ hộ',
  SPOUSE: 'Vợ / Chồng',
  CHILD: 'Con',
  PARENT: 'Cha / Mẹ',
  GRANDPARENT: 'Ông / Bà',
  SIBLING: 'Anh / Chị / Em',
  OTHER: 'Thành viên khác',
};

function getInitials(name?: string | null): string {
  if (!name?.trim()) return 'TV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getLatestVital(list: VitalSignDto[]): VitalSignDto | null {
  if (list.length === 0) return null;
  return [...list].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )[0];
}

function formatBpCell(vital: VitalSignDto | null): string {
  if (!vital) return '--';
  if (vital.systolicBp != null && vital.diastolicBp != null) {
    return `${vital.systolicBp}/${vital.diastolicBp}`;
  }
  if (vital.systolicBp != null) return `${vital.systolicBp}/--`;
  if (vital.diastolicBp != null) return `--/${vital.diastolicBp}`;
  return '--';
}

export interface FamilyVitalsViewProps {
  initialMemberId?: string;
}

/**
 * Household vitals monitoring & manual daily tracking center at `/family/vitals`.
 */
export function FamilyVitalsView({ initialMemberId }: FamilyVitalsViewProps = {}) {
  const [members, setMembers] = useState<PatientDto[]>([]);
  const [vitalSignsByMember, setVitalSignsByMember] = useState<Record<string, VitalSignDto[]>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [referenceNow] = useState(() => new Date());

  useEffect(() => {
    let isCancelled = false;

    async function loadHouseholdVitals() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const allMembers = await patientsApi.getFamilyMembers();
        if (isCancelled) return;

        const list = Array.isArray(allMembers) ? allMembers : [];
        const activeMembers = list.filter((m) => !m.status || m.status === 'ACTIVE');
        const effectiveMembers = activeMembers.length > 0 ? activeMembers : list;

        const vitalResults = await Promise.allSettled(
          effectiveMembers.map((member) => patientsApi.getMemberVitalSigns(member.id, 30))
        );
        if (isCancelled) return;

        const nextMap: Record<string, VitalSignDto[]> = {};
        effectiveMembers.forEach((member, idx) => {
          const res = vitalResults[idx];
          nextMap[member.id] =
            res && res.status === 'fulfilled' && Array.isArray(res.value) ? res.value : [];
        });

        setMembers(effectiveMembers);
        setVitalSignsByMember(nextMap);

        const defaultByProp =
          initialMemberId && effectiveMembers.some((m) => m.id === initialMemberId)
            ? initialMemberId
            : null;
        const firstAlertMember = effectiveMembers.find((m) => {
          const latest = getLatestVital(nextMap[m.id] ?? []);
          return (
            latest &&
            isSameLocalCalendarDay(latest.recordedAt, referenceNow) &&
            latest.isAbnormalAlert
          );
        });

        setSelectedMemberId(
          defaultByProp || firstAlertMember?.id || effectiveMembers[0]?.id || ''
        );
      } catch (err) {
        if (!isCancelled) {
          setMembers([]);
          setVitalSignsByMember({});
          setErrorMessage(
            extractErrorMessage(err, 'Không thể tải dữ liệu chỉ số sức khỏe gia đình.')
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHouseholdVitals();

    return () => {
      isCancelled = true;
    };
  }, [initialMemberId, referenceNow, reloadNonce]);

  const memberSummaries = useMemo(() => {
    return members.map((member) => {
      const vitals = vitalSignsByMember[member.id] ?? [];
      const latest = getLatestVital(vitals);
      const isToday = latest ? isSameLocalCalendarDay(latest.recordedAt, referenceNow) : false;
      const isAlertToday = Boolean(latest && isToday && latest.isAbnormalAlert);
      const abnormalDetails = isAlertToday ? getAbnormalMetricSummaries(latest) : [];
      const hasChronicCondition = hasTrackedChronicCondition(member.chronicDiseases);
      return {
        member,
        vitals,
        latest,
        isToday,
        isAlertToday,
        abnormalDetails,
        hasChronicCondition,
      };
    });
  }, [members, vitalSignsByMember, referenceNow]);

  const todayAlerts = useMemo(
    () =>
      memberSummaries
        .filter((s) => s.isAlertToday && s.latest)
        .sort(
          (a, b) =>
            new Date(b.latest!.recordedAt).getTime() - new Date(a.latest!.recordedAt).getTime()
        ),
    [memberSummaries]
  );

  const anyMeasuredToday = useMemo(
    () => memberSummaries.some((s) => s.isToday),
    [memberSummaries]
  );

  const selectedMember =
    members.find((m) => m.id === selectedMemberId) || members[0] || null;

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Đang tải trung tâm chỉ số sức khỏe gia đình"
        className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        <div className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto size-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">error</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900">
              Không thể tải chỉ số sức khỏe gia đình
            </h1>
            <p className="text-sm text-slate-600">{errorMessage}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setReloadNonce((n) => n + 1)}>
            Thử tải lại
          </Button>
        </div>
      </div>
    );
  }

  if (members.length === 0 || !selectedMember) {
    return (
      <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="mx-auto size-12 rounded-2xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center">
            <span className="material-symbols-outlined text-[26px]">ecg_heart</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900">
              Chưa có hồ sơ thành viên gia đình
            </h1>
            <p className="text-sm text-slate-600">
              Vui lòng thêm thành viên gia đình trước khi ghi nhận và theo dõi chỉ số sức khỏe hằng ngày.
            </p>
          </div>
          <Button asChild className="bg-[#2E37A4] hover:bg-[#222982] text-white">
            <Link href="/family/members">Đi tới Quản lý thành viên</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-rose-600">
              ecg_heart
            </span>
            <span>Chỉ số &amp; Cảnh báo sức khỏe gia đình</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ưu tiên theo dõi định kỳ cho thành viên có bệnh nền, ghi nhận khi cần cho thành viên khỏe
            mạnh và cảnh báo sớm khi có chỉ số vượt ngưỡng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/family">Bảng sức khỏe</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/family/members/${selectedMember.id}`}>
              Mở y bạ {selectedMember.fullName}
            </Link>
          </Button>
        </div>
      </div>

      {/* Household Abnormal Alerts Banner */}
      {todayAlerts.length > 0 ? (
        <Alert
          role="alert"
          className={`flex flex-col gap-3.5 rounded-2xl border-rose-200 bg-rose-50/85 p-4 sm:px-5 sm:py-4 ${todayAlerts.length === 1 ? 'lg:flex-row lg:items-center lg:justify-between' : 'items-stretch'
            }`}
        >
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <AlertTitle className="col-start-auto line-clamp-none text-sm sm:text-base font-bold leading-snug text-rose-900">
                Cảnh báo hôm nay: {todayAlerts.length} thành viên có chỉ số vượt ngưỡng an toàn
              </AlertTitle>
              <AlertDescription className="col-start-auto block text-xs sm:text-sm leading-relaxed text-rose-800">
                Đo lại sau khi nghỉ ngơi; liên hệ bác sĩ phụ trách nếu chỉ số vẫn vượt ngưỡng.
              </AlertDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:pl-[54px]">
            {todayAlerts.map(({ member, abnormalDetails }) => (
              <div
                key={member.id}
                className="inline-flex w-full sm:w-auto max-w-full flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl border border-rose-200/90 bg-white px-3.5 py-2 shadow-2xs"
              >
                <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {member.fullName}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 whitespace-nowrap">
                    {abnormalDetails.length > 0
                      ? abnormalDetails.join(' • ')
                      : 'Ngoài ngưỡng an toàn'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Alert>
      ) : (
        <Alert className="flex flex-col items-stretch rounded-2xl border-emerald-200 bg-emerald-50/75 p-4 sm:p-5">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <AlertTitle className="col-start-auto line-clamp-none text-sm font-bold leading-snug text-emerald-900">
                {anyMeasuredToday
                  ? 'Các chỉ số đo hôm nay của gia đình đều trong ngưỡng ổn định'
                  : 'Chưa ghi nhận cảnh báo chỉ số bất thường hôm nay'}
              </AlertTitle>
              <AlertDescription className="col-start-auto block text-xs leading-relaxed text-emerald-800">
                {anyMeasuredToday
                  ? 'Chọn thành viên bên dưới để xem chi tiết nhật ký trong ngày và xu hướng nhiều ngày.'
                  : 'Chọn thành viên bên dưới nếu cần ghi nhận chỉ số mới (đặc biệt với người đang theo dõi bệnh nền).'}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Member Quick Switcher & Summary Strip */}
      <section aria-label="Chọn thành viên theo dõi chỉ số" className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800">
          Thành viên trong hộ ({members.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {memberSummaries.map(({ member, latest, isToday, isAlertToday, hasChronicCondition }) => {
            const isSelected = member.id === selectedMember.id;
            const relLabel = member.relationshipToHead
              ? RELATIONSHIP_LABELS[member.relationshipToHead] || member.relationshipToHead
              : 'Thành viên';

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                aria-pressed={isSelected}
                className={`text-left rounded-2xl border p-4 transition-all cursor-pointer space-y-3 ${isSelected
                  ? 'border-[#2E37A4] bg-indigo-50/40 ring-1 ring-[#2E37A4]/30 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${isSelected
                        ? 'bg-[#2E37A4] text-white'
                        : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {getInitials(member.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {member.fullName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{relLabel}</p>
                    </div>
                  </div>

                  {isAlertToday ? (
                    <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] hover:bg-rose-50">
                      Cần chú ý
                    </Badge>
                  ) : isToday ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] hover:bg-emerald-50">
                      Ổn định
                    </Badge>
                  ) : hasChronicCondition ? (
                    <Badge variant="secondary" className="text-[11px]">
                      Chưa đo hôm nay
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-slate-600 text-[11px]"
                    >
                      Theo dõi khi cần
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 rounded-xl bg-white/90 border border-slate-100 p-2.5 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-500">Huyết áp</span>
                    <span
                      className={`text-xs font-bold tabular-nums ${isAlertToday ? 'text-rose-700' : 'text-slate-900'
                        }`}
                    >
                      {formatBpCell(latest)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Nhiệt độ</span>
                    <span className="text-xs font-bold tabular-nums text-slate-900">
                      {latest?.temperature != null ? `${latest.temperature}°C` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">SpO2</span>
                    <span className="text-xs font-bold tabular-nums text-slate-900">
                      {latest?.spo2 != null ? `${latest.spo2}%` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Đường huyết</span>
                    <span className="text-xs font-bold tabular-nums text-slate-900">
                      {latest?.bloodGlucose ?? '--'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Member Detailed Vitals & Multi-day Trend */}
      <MemberVitalSignsSection
        key={selectedMember.id}
        memberId={selectedMember.id}
        memberName={selectedMember.fullName}
        hasChronicCondition={hasTrackedChronicCondition(selectedMember.chronicDiseases)}
        vitalSigns={vitalSignsByMember[selectedMember.id] ?? []}
        onVitalAdded={(vital) =>
          setVitalSignsByMember((prev) => ({
            ...prev,
            [selectedMember.id]: [vital, ...(prev[selectedMember.id] ?? [])],
          }))
        }
        onVitalUpdated={(updated) =>
          setVitalSignsByMember((prev) => ({
            ...prev,
            [selectedMember.id]: (prev[selectedMember.id] ?? []).map((v) =>
              v.id === updated.id ? updated : v
            ),
          }))
        }
        onVitalDeleted={(vitalId) =>
          setVitalSignsByMember((prev) => ({
            ...prev,
            [selectedMember.id]: (prev[selectedMember.id] ?? []).filter(
              (v) => v.id !== vitalId
            ),
          }))
        }
      />
    </div>
  );
}
