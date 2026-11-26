import type { EncounterItem } from '@/lib/api/encounters.api';

export const RECORD_DEADLINE_HOURS = 24;
export const AUTO_CLOSE_HOURS = 48;
export const DEFAULT_VISIT_DURATION_MINUTES = 90;

export type ReconciledEncounterStatus =
  | 'UPCOMING'
  | 'ACTIVE'
  | 'PENDING_RECORD'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface DualLaneState {
  reconciledStatus: ReconciledEncounterStatus;
  familyConfirmed: boolean;
  familyReportedNoShow: boolean;
  doctorFinalizedCount: number;
  doctorDraftCount: number;
  hasFinalizedRecord: boolean;
  isOverdue: boolean;
  remainingRecordHours: number | null;
  autoClosedByTimeout: boolean;
  allowReview: boolean;
  autoCloseLocked: boolean;
  familyStatusLabel: string;
  doctorStatusLabel: string;
}

export interface FamilyStepperStep {
  key: 'scheduled' | 'visit' | 'result';
  label: string;
  status: 'done' | 'current' | 'upcoming';
}

function normalizeDateKey(dateStr?: string | null): string {
  if (!dateStr) return '';
  const match = String(dateStr).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function getVnDateKey(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function formatEncounterTime(scheduledTime?: string | null): string {
  if (!scheduledTime) return '';
  const raw = String(scheduledTime).trim();
  if (raw.includes('T')) {
    const isoMatch = raw.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}:${isoMatch[2]}`;
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
  return raw.slice(0, 5);
}

export function parseVnEncounterStart(
  scheduledDate?: string | null,
  scheduledTime?: string | null,
): Date | null {
  const dateKey = normalizeDateKey(scheduledDate);
  if (!dateKey) return null;
  const timeMatch = String(scheduledTime ?? '08:00').match(/(\d{1,2}):(\d{2})/);
  const hh = timeMatch ? timeMatch[1].padStart(2, '0') : '08';
  const mm = timeMatch ? timeMatch[2].padStart(2, '0') : '00';
  const parsed = new Date(`${dateKey}T${hh}:${mm}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isEncounterActiveToday(
  encounter: Pick<EncounterItem, 'scheduledDate' | 'encounterStatus'>,
  now: Date = new Date(),
): boolean {
  const status = String(encounter.encounterStatus || '').toUpperCase();
  if (
    status === 'CANCELLED' ||
    status === 'NO_SHOW' ||
    status === 'DISPUTED' ||
    status === 'COMPLETED'
  ) {
    return false;
  }
  const encounterDateKey = normalizeDateKey(encounter.scheduledDate);
  if (!encounterDateKey) return false;
  return encounterDateKey === getVnDateKey(now);
}

export function canFamilyConfirmAttendance(
  encounter: Pick<
    EncounterItem,
    'scheduledDate' | 'scheduledTime' | 'encounterStatus' | 'familyConfirmedArrivalAt'
  > & { encounterType?: string | null },
  now: Date = new Date(),
): boolean {
  if (encounter.encounterType && String(encounter.encounterType).toUpperCase() !== 'HOME_VISIT') {
    return false;
  }
  if (encounter.familyConfirmedArrivalAt) return false;
  const status = String(encounter.encounterStatus || '').toUpperCase();
  if (
    status === 'CANCELLED' ||
    status === 'NO_SHOW' ||
    status === 'DISPUTED' ||
    status === 'COMPLETED'
  ) {
    return false;
  }
  const start = parseVnEncounterStart(encounter.scheduledDate, encounter.scheduledTime);
  if (!start) return false;
  return now.getTime() >= start.getTime();
}

export function deriveDualLaneState(
  encounter: EncounterItem & { hasNoShowDispute?: boolean },
  now: Date = new Date(),
): DualLaneState {
  const status = String(encounter.encounterStatus || '').toUpperCase();
  const isHomeVisit =
    !encounter.encounterType ||
    String(encounter.encounterType).toUpperCase() === 'HOME_VISIT';
  const clinicalEmrs = Array.isArray(encounter.clinicalEmrs) ? encounter.clinicalEmrs : [];
  const doctorFinalizedCount = clinicalEmrs.filter((e) => e.isFinalized).length;
  const doctorDraftCount = clinicalEmrs.filter((e) => !e.isFinalized).length;
  const hasFinalizedRecord = isHomeVisit
    ? Boolean(encounter.doctorCompletedAt) || status === 'COMPLETED'
    : doctorFinalizedCount > 0 || status === 'COMPLETED';
  const familyConfirmed = Boolean(encounter.familyConfirmedArrivalAt);
  const familyReportedNoShow =
    status === 'NO_SHOW' || status === 'DISPUTED' || Boolean(encounter.hasNoShowDispute);

  const dateKey = normalizeDateKey(encounter.scheduledDate);
  const timeMatch = String(encounter.scheduledTime ?? '08:00').match(/(\d{1,2}):(\d{2})/);
  const startHour = timeMatch ? Number(timeMatch[1]) : 8;
  const normalizedSlot = encounter.slotWindow?.trim().toUpperCase();
  const sessionWindow =
    normalizedSlot === 'AFTERNOON'
      ? 'AFTERNOON'
      : normalizedSlot === 'MORNING'
        ? 'MORNING'
        : startHour >= 12
          ? 'AFTERNOON'
          : 'MORNING';

  const sessionEndMs = encounter.sessionDeadlines?.sessionEndAt
    ? new Date(encounter.sessionDeadlines.sessionEndAt).getTime()
    : dateKey
      ? new Date(`${dateKey}T${sessionWindow === 'MORNING' ? '11:30:00' : '17:30:00'}+07:00`).getTime()
      : null;

  const recordDeadlineMs = encounter.sessionDeadlines?.recordDeadlineAt
    ? new Date(encounter.sessionDeadlines.recordDeadlineAt).getTime()
    : dateKey
      ? new Date(`${dateKey}T23:59:59+07:00`).getTime()
      : null;

  const autoCloseDeadlineMs = encounter.sessionDeadlines?.autoCloseAt
    ? new Date(encounter.sessionDeadlines.autoCloseAt).getTime()
    : sessionEndMs !== null
      ? sessionEndMs + AUTO_CLOSE_HOURS * 3600 * 1000
      : null;

  const isOverdue =
    !hasFinalizedRecord &&
    status !== 'CANCELLED' &&
    !familyReportedNoShow &&
    (Boolean(encounter.recordOverdueAt) ||
      (recordDeadlineMs !== null && now.getTime() > recordDeadlineMs));

  const remainingRecordHours =
    recordDeadlineMs !== null
      ? Math.max(0, Math.ceil((recordDeadlineMs - now.getTime()) / (3600 * 1000)))
      : null;

  if (status === 'CANCELLED') {
    return {
      reconciledStatus: 'CANCELLED',
      familyConfirmed,
      familyReportedNoShow: false,
      doctorFinalizedCount,
      doctorDraftCount,
      hasFinalizedRecord,
      isOverdue: false,
      remainingRecordHours: null,
      autoClosedByTimeout: false,
      allowReview: false,
      autoCloseLocked: true,
      familyStatusLabel: 'Đã hủy lịch',
      doctorStatusLabel: 'Đã hủy',
    };
  }

  if (familyReportedNoShow) {
    return {
      reconciledStatus: 'DISPUTED',
      familyConfirmed: false,
      familyReportedNoShow: true,
      doctorFinalizedCount,
      doctorDraftCount,
      hasFinalizedRecord,
      isOverdue: false,
      remainingRecordHours: null,
      autoClosedByTimeout: false,
      allowReview: false,
      autoCloseLocked: true,
      familyStatusLabel: 'Đang kiểm tra sự cố',
      doctorStatusLabel: doctorDraftCount > 0 || doctorFinalizedCount > 0 ? 'Bị khóa tự đóng' : 'Chưa ghi nhận',
    };
  }

  if (familyConfirmed && hasFinalizedRecord) {
    return {
      reconciledStatus: 'COMPLETED',
      familyConfirmed: true,
      familyReportedNoShow: false,
      doctorFinalizedCount,
      doctorDraftCount,
      hasFinalizedRecord: true,
      isOverdue: false,
      remainingRecordHours: 0,
      autoClosedByTimeout: false,
      allowReview: true,
      autoCloseLocked: false,
      familyStatusLabel: 'Hoàn tất • Đã có kết quả',
      doctorStatusLabel: `Đã chốt (${Math.max(1, doctorFinalizedCount)} phiếu)`,
    };
  }

  if (
    !familyConfirmed &&
    hasFinalizedRecord &&
    autoCloseDeadlineMs !== null &&
    now.getTime() >= autoCloseDeadlineMs
  ) {
    return {
      reconciledStatus: 'COMPLETED',
      familyConfirmed: false,
      familyReportedNoShow: false,
      doctorFinalizedCount,
      doctorDraftCount,
      hasFinalizedRecord: true,
      isOverdue: false,
      remainingRecordHours: 0,
      autoClosedByTimeout: true,
      allowReview: true,
      autoCloseLocked: false,
      familyStatusLabel: 'Hoàn tất • Đã có kết quả',
      doctorStatusLabel: `Đã chốt (${Math.max(1, doctorFinalizedCount)} phiếu)`,
    };
  }

  if (familyConfirmed && !hasFinalizedRecord) {
    return {
      reconciledStatus: 'PENDING_RECORD',
      familyConfirmed: true,
      familyReportedNoShow: false,
      doctorFinalizedCount,
      doctorDraftCount,
      hasFinalizedRecord: false,
      isOverdue,
      remainingRecordHours,
      autoClosedByTimeout: false,
      allowReview: true,
      autoCloseLocked: false,
      familyStatusLabel: 'Chờ bác sĩ gửi hồ sơ',
      doctorStatusLabel: doctorDraftCount > 0 ? 'Đang Nháp' : 'Chưa ghi nhận',
    };
  }

  const isPastSession = sessionEndMs !== null && now.getTime() > sessionEndMs;
  if (isEncounterActiveToday(encounter, now) && !isPastSession) {
    return {
      reconciledStatus: 'ACTIVE',
      familyConfirmed,
      familyReportedNoShow: false,
      doctorFinalizedCount,
      doctorDraftCount,
      hasFinalizedRecord,
      isOverdue,
      remainingRecordHours,
      autoClosedByTimeout: false,
      allowReview: false,
      autoCloseLocked: false,
      familyStatusLabel: 'Đang diễn ra hôm nay',
      doctorStatusLabel: hasFinalizedRecord
        ? `Đã chốt (${doctorFinalizedCount} phiếu)`
        : doctorDraftCount > 0
          ? 'Đang Nháp'
          : 'Chưa ghi nhận',
    };
  }

  if (isPastSession && !hasFinalizedRecord) {
    return {
      reconciledStatus: 'PENDING_RECORD',
      familyConfirmed,
      familyReportedNoShow: false,
      doctorFinalizedCount,
      doctorDraftCount,
      hasFinalizedRecord: false,
      isOverdue,
      remainingRecordHours,
      autoClosedByTimeout: false,
      allowReview: false,
      autoCloseLocked: false,
      familyStatusLabel: 'Chờ xác nhận & hồ sơ',
      doctorStatusLabel: doctorDraftCount > 0 ? 'Đang Nháp' : 'Chưa ghi nhận',
    };
  }

  return {
    reconciledStatus: 'UPCOMING',
    familyConfirmed,
    familyReportedNoShow: false,
    doctorFinalizedCount,
    doctorDraftCount,
    hasFinalizedRecord,
    isOverdue: false,
    remainingRecordHours: null,
    autoClosedByTimeout: false,
    allowReview: false,
    autoCloseLocked: false,
    familyStatusLabel: 'Đã chốt lịch',
    doctorStatusLabel: 'Chưa đến giờ khám',
  };
}

export function getFamilyVisitStepper(
  encounter: EncounterItem & { hasNoShowDispute?: boolean },
  now: Date = new Date(),
): FamilyStepperStep[] {
  const state = deriveDualLaneState(encounter, now);
  if (state.reconciledStatus === 'COMPLETED') {
    return [
      { key: 'scheduled', label: 'Đã chốt lịch', status: 'done' },
      { key: 'visit', label: 'Khám hôm nay', status: 'done' },
      { key: 'result', label: 'Kết quả khám', status: 'done' },
    ];
  }
  if (state.reconciledStatus === 'PENDING_RECORD') {
    return [
      { key: 'scheduled', label: 'Đã chốt lịch', status: 'done' },
      { key: 'visit', label: 'Khám hôm nay', status: 'done' },
      { key: 'result', label: 'Kết quả khám', status: 'current' },
    ];
  }
  if (state.reconciledStatus === 'ACTIVE' || state.reconciledStatus === 'DISPUTED') {
    return [
      { key: 'scheduled', label: 'Đã chốt lịch', status: 'done' },
      { key: 'visit', label: 'Khám hôm nay', status: 'current' },
      { key: 'result', label: 'Kết quả khám', status: 'upcoming' },
    ];
  }
  return [
    { key: 'scheduled', label: 'Đã chốt lịch', status: 'done' },
    { key: 'visit', label: 'Khám hôm nay', status: 'upcoming' },
    { key: 'result', label: 'Kết quả khám', status: 'upcoming' },
  ];
}

export function formatRemainingRecordDeadline(hours: number | null): string {
  if (hours === null) return '';
  if (hours <= 0) return 'Đã quá hạn 24 giờ';
  return `Còn ${hours} giờ (trong hạn 24h)`;
}
