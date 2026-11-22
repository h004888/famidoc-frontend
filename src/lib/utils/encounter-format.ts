import type { EncounterItem } from '@/lib/api/encounters.api';

/**
 * Extract YYYY-MM-DD from an ISO date string or Date-like value (stored in UTC date-only format by backend).
 */
export function extractEncounterDateIso(raw?: string | null): string {
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Extract HH:mm from a backend time string (e.g. "1970-01-01T09:00:00.000Z" or "09:00:00" or "09:00").
 * Backend stores wall-clock time inside UTC hours/minutes, so we read slices 11..16 of ISO strings.
 */
export function extractEncounterTimeHm(raw?: string | null): string {
  if (!raw) return '';
  const hhmmMatch = /^(\d{2}:\d{2})/.exec(raw.trim());
  if (hhmmMatch) return hhmmMatch[1];
  const isoTimeMatch = /T(\d{2}:\d{2})/.exec(raw);
  if (isoTimeMatch) return isoTimeMatch[1];
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(11, 16);
}

/**
 * Format YYYY-MM-DD (or ISO string) into Vietnamese DD/MM/YYYY for UI display.
 */
export function formatEncounterDateVi(raw?: string | null): string {
  const iso = extractEncounterDateIso(raw);
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Compute hours remaining from now until the given YYYY-MM-DD + HH:mm in local wall-clock time.
 */
export function getHoursUntilEncounter(
  dateRaw?: string | null,
  timeRaw?: string | null,
  nowMs: number = Date.now()
): number | null {
  const isoDate = extractEncounterDateIso(dateRaw);
  const hm = extractEncounterTimeHm(timeRaw);
  if (!isoDate || !hm) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const [hh, mm] = hm.split(':').map(Number);
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;
  const target = new Date(y, m - 1, d, hh, mm, 0, 0);
  return (target.getTime() - nowMs) / (1000 * 60 * 60);
}

export function getEncounterTypeLabel(type?: string | null): string {
  switch (type) {
    case 'HOME_VISIT':
      return 'Khám tại nhà';
    case 'TELEHEALTH':
    case 'TELEMEDICINE':
      return 'Tư vấn Video (Telehealth)';
    case 'FACILITY_VISIT':
      return 'Khám tại CSYT';
    default:
      return type || 'Khám bệnh';
  }
}

export function getEncounterCategoryLabel(category?: string | null): string {
  return category === 'AD_HOC_ON_DEMAND' ? 'Đột xuất' : 'Định kỳ theo gói';
}

export function getEncounterStatusLabel(enc: Pick<EncounterItem, 'encounterStatus' | 'proposedBy' | 'conflictAlert'>): {
  label: string;
  tone: 'warning' | 'info' | 'success' | 'danger' | 'neutral';
} {
  if (enc.conflictAlert) {
    return { label: 'Xung đột lịch / Ca trực', tone: 'danger' };
  }
  switch (enc.encounterStatus) {
    case 'REQUESTED':
    case 'PROPOSED':
      return enc.proposedBy === 'FAMILY_REP'
        ? { label: 'Chờ bác sĩ duyệt', tone: 'info' }
        : { label: 'Chờ gia đình xác nhận', tone: 'warning' };
    case 'RESCHEDULE_REQUESTED':
      return enc.proposedBy === 'DOCTOR'
        ? { label: 'Bác sĩ đề xuất giờ mới', tone: 'warning' }
        : { label: 'Gia đình xin đổi lịch', tone: 'info' };
    case 'CONFIRMED':
      return { label: 'Đã chốt lịch', tone: 'success' };
    case 'IN_PROGRESS':
      return { label: 'Đang khám', tone: 'info' };
    case 'COMPLETED':
      return { label: 'Đã hoàn thành', tone: 'neutral' };
    case 'CANCELLED':
      return { label: 'Đã hủy', tone: 'danger' };
    default:
      return { label: enc.encounterStatus || 'Chưa rõ', tone: 'neutral' };
  }
}

export function getTodayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
