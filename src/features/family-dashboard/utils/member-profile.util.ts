import type { PatientAllergyDto, PatientDocumentType } from '@/lib/api';

/* ──────────────── constants & label maps ──────────────── */

export const RELATIONSHIP_LABELS: Record<string, string> = {
  SELF: 'Chủ hộ', SPOUSE: 'Vợ / Chồng', CHILD: 'Con',
  PARENT: 'Cha / Mẹ', GRANDPARENT: 'Ông / Bà',
  SIBLING: 'Anh / Chị / Em', OTHER: 'Thành viên khác',
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác',
};

export function getRelationLabel(code?: string | null): string {
  if (!code) return 'Thành viên gia đình';
  return RELATIONSHIP_LABELS[code] || code;
}

export function getGenderLabel(gender?: string | null): string {
  if (!gender) return 'Chưa cập nhật';
  return GENDER_LABELS[gender] || gender;
}

/* ──────────────── avatar helpers ──────────────── */

export function getMemberInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export function memberIsHead(member: { relationshipToHead?: string | null }): boolean {
  return (member.relationshipToHead || '').toUpperCase() === 'SELF';
}

/* ──────────────── date / age helpers ──────────────── */

export function formatDateDisplay(raw?: string | null): string {
  if (!raw) return 'Chưa cập nhật';
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return `${String(parsed.getDate()).padStart(2, '0')}/${String(parsed.getMonth() + 1).padStart(2, '0')}/${parsed.getFullYear()}`;
}

export function calculateAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const isoMatch = dateOfBirth.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dob = isoMatch
    ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    : new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let age = new Date().getFullYear() - dob.getFullYear();
  const m = new Date().getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && new Date().getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}

/* ──────────────── vital-signs helpers ──────────────── */

export interface ParsedVitals {
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  spo2?: number;
  temperature?: number;
  bloodGlucose?: number;
}

export function parseLatestVitals(signs: { systolicBp?: number | null; diastolicBp?: number | null; heartRate?: number | null; temperature?: number | null; spo2?: number | null; bloodGlucose?: number | null; recordedAt: string }[]): ParsedVitals | null {
  if (!signs.length) return null;
  const latest = signs.reduce((a, b) =>
    new Date(a.recordedAt).getTime() > new Date(b.recordedAt).getTime() ? a : b
  );
  return {
    systolicBp: latest.systolicBp ?? undefined,
    diastolicBp: latest.diastolicBp ?? undefined,
    heartRate: latest.heartRate ?? undefined,
    spo2: latest.spo2 ?? undefined,
    temperature: latest.temperature ?? undefined,
    bloodGlucose: latest.bloodGlucose ?? undefined,
  };
}

export function bpText(pv: ParsedVitals | null): string {
  if (!pv) return '--/--';
  if (pv.systolicBp != null && pv.diastolicBp != null)
    return `${pv.systolicBp}/${pv.diastolicBp}`;
  if (pv.systolicBp != null) return `${pv.systolicBp}/--`;
  return `--/${pv.diastolicBp ?? '--'}`;
}

export function hasAbnormalVitals(parsed: ParsedVitals | null, allSigns: { isAbnormalAlert: boolean }[]): boolean {
  if (!parsed) return false;
  if (allSigns.some(s => s.isAbnormalAlert)) return true;
  return (
    (parsed.systolicBp ?? 0) > 140 ||
    (parsed.diastolicBp ?? 0) > 90 ||
    (parsed.spo2 ?? 100) < 95 ||
    (parsed.temperature ?? 36.5) > 37.8 ||
    (parsed.heartRate ?? 75) < 60 ||
    (parsed.heartRate ?? 75) > 100
  );
}

/* ──────────────── allergy helpers ──────────────── */

export function allergyCount(allergies: readonly PatientAllergyDto[]): number {
  return allergies?.length ?? 0;
}

export function hasSevereAllergy(allergies: readonly PatientAllergyDto[]): boolean {
  return allergies?.some(a => a.severity === 'LIFE_THREATENING_ANAPHYLAXIS') ?? false;
}

export function severeAllergenNames(allergies: readonly PatientAllergyDto[]): string[] {
  return allergies.filter(a => a.severity === 'LIFE_THREATENING_ANAPHYLAXIS').map(a => a.allergenName);
}

export function severityBadgeClass(sev: string): string {
  switch (sev) {
    case 'LIFE_THREATENING_ANAPHYLAXIS': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'MODERATE': return 'bg-orange-50 text-orange-700 border-orange-200';
    default: return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

/* ──────────────── document helpers ──────────────── */

export const DOCUMENT_TYPE_META: Record<string, { label: string; badgeClass: string; icon: string }> = {
  PRESCRIPTION: { label: 'Đơn thuốc', badgeClass: 'bg-emerald-50 text-emerald-700', icon: 'medication' },
  LAB_RESULT:     { label: 'Xét nghiệm', badgeClass: 'bg-blue-50 text-blue-700', icon: 'biotech' },
  IMAGING_XRAY_CT:{ label: 'Chẩn đoán hình ảnh', badgeClass: 'bg-purple-50 text-purple-700', icon: 'radiology' },
  DISCHARGE_SUMMARY: { label: 'Giấy ra viện', badgeClass: 'bg-amber-50 text-amber-700', icon: 'description' },
  OTHER:          { label: 'Khác', badgeClass: 'bg-slate-100 text-slate-600', icon: 'folder_open' },
};

export function documentTypeMeta(type: string) {
  return DOCUMENT_TYPE_META[type] ?? DOCUMENT_TYPE_META.OTHER;
}

export function formatFileSize(kb?: number): string {
  if (!kb || kb <= 0) return 'Tệp y tế';
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

/* ──────────────── time formatting ──────────────── */

const VN_TZ = 'Asia/Ho_Chi_Minh';

export function formatVnShortDateTime(rawIso: string): string {
  try {
    const d = new Date(rawIso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${mi}`;
  } catch { return rawIso; }
}
