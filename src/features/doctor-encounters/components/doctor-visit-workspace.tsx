'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getApiErrorCode } from '@/lib/api/api-error-code';
import { encountersApi, type EncounterItem, type EncounterPatient } from '@/lib/api/encounters.api';
import { medicalBooksApi, type BookVisitDetail } from '@/lib/api/medical-books.api';
import {
  deriveDualLaneState,
  formatEncounterTime,
  formatRemainingRecordDeadline,
} from '@/lib/encounter-dual-lane';
import { HouseholdVisitOverview } from './household-visit-overview';
import { MemberExamWizard } from './member-exam-wizard';
import { MemberVisitRecordView } from './member-visit-record-view';
import {
  VisitCompletionSummary,
  type MemberCompletionSummary,
} from './visit-completion-summary';

export function resolveWorkspaceMembers(encounter: EncounterItem | null): EncounterPatient[] {
  if (!encounter) return [];
  const fromContract =
    encounter.contract?.members
      ?.map((m) => m.patient)
      .filter((p): p is EncounterPatient => Boolean(p)) ?? [];
  const source =
    fromContract.length > 0
      ? fromContract
      : encounter.participants
          ?.map((p) => p.patient)
          .filter((p): p is EncounterPatient => Boolean(p)) ?? [];

  const resolved = source.length > 0 ? source : encounter.patient ? [encounter.patient] : [];
  const seen = new Set<string>();
  return resolved.filter((patient) => {
    if (!patient.id || seen.has(patient.id)) return false;
    seen.add(patient.id);
    return true;
  });
}

function formatScheduledDateVn(rawDate?: string): string {
  if (!rawDate) return '';
  const datePart = String(rawDate).slice(0, 10);
  const [yyyy, mm, dd] = datePart.split('-');
  if (yyyy && mm && dd) return `${dd}/${mm}/${yyyy}`;
  return datePart;
}

function getVisitStartsAt(scheduledDate?: string, scheduledTime?: string): Date | null {
  if (!scheduledDate) return null;
  const datePart = String(scheduledDate).slice(0, 10);
  const timePart = formatEncounterTime(scheduledTime) || '00:00';
  const [hh, mm] = timePart.split(':');
  if (!hh || !mm) return null;
  const iso = `${datePart}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00+07:00`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type WorkspaceViewMode = 'overview' | 'member-exam' | 'summary';
type VisitDetailStatus = 'idle' | 'loading' | 'ready' | 'error';

const LOCKED_STATUSES = new Set(['DISPUTED', 'NO_SHOW', 'CANCELLED', 'COMPLETED']);

export function DoctorVisitWorkspace({
  encounterId,
  initialPatientId,
}: {
  encounterId: string;
  initialPatientId?: string;
}) {
  const [encounter, setEncounter] = useState<EncounterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('overview');
  const [activePatientId, setActivePatientId] = useState<string>(initialPatientId ?? '');
  const [visitDetailsByPatient, setVisitDetailsByPatient] = useState<
    Record<string, BookVisitDetail>
  >({});
  const [visitDetailStatus, setVisitDetailStatus] = useState<VisitDetailStatus>('idle');
  const [visitDetailError, setVisitDetailError] = useState<string | null>(null);
  const [visitFetchNonce, setVisitFetchNonce] = useState(0);
  const [memberSummaries, setMemberSummaries] = useState<
    Record<string, MemberCompletionSummary>
  >({});
  const [completing, setCompleting] = useState(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detail = await encountersApi.getEncounterDetail(encounterId);
      if (!detail) {
        throw new Error('Không tìm thấy ca khám.');
      }
      setEncounter(detail);
      if (detail.doctorCompletedAt || detail.encounterStatus === 'COMPLETED') {
        setViewMode('summary');
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Không thể tải thông tin ca khám.',
      );
    } finally {
      setLoading(false);
    }
  }, [encounterId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const members = useMemo<EncounterPatient[]>(() => {
    return resolveWorkspaceMembers(encounter);
  }, [encounter]);

  const familyId = encounter?.contract?.familyUnit?.id ?? '';

  useEffect(() => {
    if (viewMode !== 'member-exam' || !familyId || !activePatientId) return;
    if (visitDetailsByPatient[activePatientId]) {
      setVisitDetailStatus('ready');
      setVisitDetailError(null);
      return;
    }

    const controller = new AbortController();
    setVisitDetailStatus('loading');
    setVisitDetailError(null);

    medicalBooksApi
      .visit(encounterId, controller.signal, activePatientId)
      .then((detail) => {
        if (controller.signal.aborted) return;
        setVisitDetailsByPatient((prev) => ({ ...prev, [activePatientId]: detail }));
        setVisitDetailStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        const code = getApiErrorCode(err);
        if (code === 'VISIT_LOCKED') {
          setEncounter((prev) =>
            prev ? { ...prev, encounterStatus: 'DISPUTED' } : prev,
          );
          setViewMode('overview');
          return;
        }
        setVisitDetailError(
          err instanceof Error && err.message
            ? err.message
            : 'Không thể tải trang khám của thành viên.',
        );
        setVisitDetailStatus('error');
      });

    return () => controller.abort();
  }, [
    viewMode,
    familyId,
    activePatientId,
    encounterId,
    visitDetailsByPatient,
    visitFetchNonce,
  ]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6 text-sm text-slate-600">
        Đang tải không gian làm việc ca khám...
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div className="mx-auto max-w-3xl p-6 space-y-3">
        <Card className="p-5 border border-rose-200 bg-rose-50 text-sm text-rose-800">
          {error || 'Không tìm thấy ca khám.'}
        </Card>
        <Link href="/doctor/timetable" className="inline-flex items-center text-sm font-semibold text-teal-800 hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Quay về Lịch trực &amp; Ca khám
        </Link>
      </div>
    );
  }

  const lane = deriveDualLaneState(encounter);
  const activeMember = members.find((m) => m.id === activePatientId) ?? members[0];
  const isLocked = LOCKED_STATUSES.has(String(encounter.encounterStatus));
  const visitStartsAt = getVisitStartsAt(
    encounter.scheduledDate,
    encounter.scheduledTime,
  );
  const beforeStartMessage =
    !isLocked &&
    encounter.encounterStatus === 'CONFIRMED' &&
    visitStartsAt &&
    Date.now() < visitStartsAt.getTime()
      ? `Chưa đến giờ khám — mở lúc ${formatEncounterTime(encounter.scheduledTime)}`
      : null;

  const handleStartExam = (patientId: string) => {
    setActivePatientId(patientId);
    setViewMode('member-exam');
  };

  const handleChangeAttendance = async (
    patientId: string,
    nextStatus: 'PLANNED' | 'ABSENT',
    absenceReason?: string,
  ) => {
    const res = await encountersApi.updateParticipantAttendance(
      encounterId,
      patientId,
      nextStatus,
      absenceReason,
    );
    setEncounter((prev) => {
      if (!prev) return prev;
      const participants = (prev.participants ?? []).map((p) =>
        p.patientId === patientId
          ? {
              ...p,
              attendanceStatus: nextStatus,
              absenceReason: res.absenceReason ?? (nextStatus === 'ABSENT' ? absenceReason ?? null : null),
            }
          : p,
      );
      return { ...prev, participants };
    });
  };

  const handleCompleteVisit = async (lateCompletionReason?: string) => {
    setCompleting(true);
    try {
      const updated = await encountersApi.completeEncounter(encounterId, {
        lateCompletionReason,
      });
      setEncounter((prev) => (prev ? { ...prev, ...updated } : updated));
      setViewMode('summary');
    } finally {
      setCompleting(false);
    }
  };

  const activeVisitDetail = activeMember
    ? visitDetailsByPatient[activeMember.id]
    : undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/doctor/timetable"
          className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay về Lịch trực &amp; Ca khám
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">
            Làn Gia đình:{' '}
            {lane.familyConfirmed ? '✓ Đã xác nhận có đến' : 'Chờ gia đình xác nhận'}
          </Badge>
          {lane.remainingRecordHours !== null && !encounter.doctorCompletedAt && (
            <Badge
              variant="outline"
              className={
                lane.isOverdue
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-amber-300 bg-amber-50 text-amber-900'
              }
            >
              {lane.isOverdue
                ? 'Đã quá hạn 23:59 ngày khám'
                : `Hạn chốt hồ sơ: ${formatRemainingRecordDeadline(lane.remainingRecordHours)}`}
            </Badge>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-900">
            CA KHÁM • {formatScheduledDateVn(encounter.scheduledDate)} (
            {formatEncounterTime(encounter.scheduledTime)})
          </h1>
        </div>
      </Card>

      {isLocked && (
        <div
          role="alert"
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900"
        >
          Ca khám đang bị khóa — chỉ xem.
        </div>
      )}

      {beforeStartMessage && (
        <div
          role="alert"
          className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2.5 text-xs font-semibold text-sky-900"
        >
          {beforeStartMessage}
        </div>
      )}

      {viewMode === 'overview' && (
        <HouseholdVisitOverview
          encounter={encounter}
          members={members}
          isOverdue={lane.isOverdue}
          isLocked={isLocked}
          beforeStartMessage={beforeStartMessage}
          completing={completing}
          onStartExam={handleStartExam}
          onChangeAttendance={handleChangeAttendance}
          onCompleteVisit={handleCompleteVisit}
        />
      )}

      {viewMode === 'member-exam' && activeMember && (
        <>
          {visitDetailStatus === 'loading' && (
            <Card
              data-testid="wizard-skeleton"
              className="p-6 border border-slate-200 bg-white space-y-3 animate-pulse"
            >
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-24 w-full bg-slate-100 rounded" />
              <div className="h-10 w-32 bg-slate-200 rounded ml-auto" />
            </Card>
          )}

          {visitDetailStatus === 'error' && (
            <Card className="p-5 border border-rose-200 bg-rose-50 space-y-3 text-xs text-rose-800">
              <div role="alert" className="font-semibold">
                {visitDetailError}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setViewMode('overview')}
                >
                  Quay lại
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setVisitFetchNonce((n) => n + 1)}
                >
                  Tải lại
                </Button>
              </div>
            </Card>
          )}

          {visitDetailStatus === 'ready' &&
            activeVisitDetail &&
            (activeVisitDetail.isFinalized || isLocked ? (
              <MemberVisitRecordView
                detail={activeVisitDetail}
                onBackToOverview={() => setViewMode('overview')}
              />
            ) : (
              <MemberExamWizard
                key={activeMember.id}
                encounterId={encounterId}
                encounter={encounter}
                member={activeMember}
                initialVisitDetail={activeVisitDetail}
                onBackToOverview={() => setViewMode('overview')}
                onFinalized={async (summary) => {
                  setMemberSummaries((prev) => ({
                    ...prev,
                    [summary.patientId]: summary,
                  }));
                  setVisitDetailsByPatient((prev) => {
                    const copy = { ...prev };
                    delete copy[summary.patientId];
                    return copy;
                  });
                  await loadWorkspace();
                  setViewMode('overview');
                }}
              />
            ))}
        </>
      )}

      {viewMode === 'summary' && (
        <VisitCompletionSummary
          encounter={encounter}
          members={members}
          memberSummaries={Object.values(memberSummaries)}
        />
      )}
    </div>
  );
}
