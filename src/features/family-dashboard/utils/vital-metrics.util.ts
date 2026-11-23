import type { VitalSignDto } from '@/lib/api';

export type VitalMetricKey =
  | 'bp'
  | 'heartRate'
  | 'spo2'
  | 'temperature'
  | 'bloodGlucose'
  | 'respiratoryRate';

export interface MetricAlertState {
  abnormal: boolean;
  message: string | null;
}

export interface MetricDeltaState {
  delta: number | null;
  direction: 'up' | 'down' | 'flat' | null;
  label: string | null;
}

export const VITAL_REFERENCE_LABELS: Record<VitalMetricKey, string> = {
  bp: 'An toàn: 90–139 mmHg',
  heartRate: 'An toàn: 50–110 bpm',
  spo2: 'An toàn: >= 95%',
  temperature: 'An toàn: 35.5–37.9 °C',
  bloodGlucose: 'An toàn: 3.9–11.0 mmol/L',
  respiratoryRate: 'An toàn: 12–24 lần/ph',
};

function isFiniteNum(v: number | null | undefined): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Evaluates per-metric clinical alert status matching backend `computeVitalAbnormalAlert`.
 */
export function getVitalMetricAlerts(
  vital: Partial<VitalSignDto> | null | undefined
): Record<VitalMetricKey, MetricAlertState> {
  const safe: Record<VitalMetricKey, MetricAlertState> = {
    bp: { abnormal: false, message: null },
    heartRate: { abnormal: false, message: null },
    spo2: { abnormal: false, message: null },
    temperature: { abnormal: false, message: null },
    bloodGlucose: { abnormal: false, message: null },
    respiratoryRate: { abnormal: false, message: null },
  };

  if (!vital) return safe;

  const sysHigh = isFiniteNum(vital.systolicBp) && vital.systolicBp >= 140;
  const sysLow = isFiniteNum(vital.systolicBp) && vital.systolicBp < 90;
  const diaHigh = isFiniteNum(vital.diastolicBp) && vital.diastolicBp >= 90;
  const diaLow = isFiniteNum(vital.diastolicBp) && vital.diastolicBp < 60;

  if (sysHigh || diaHigh) {
    safe.bp = { abnormal: true, message: 'Huyết áp cao (>= 140 mmHg)' };
  } else if (sysLow || diaLow) {
    safe.bp = { abnormal: true, message: 'Huyết áp thấp (< 90 mmHg)' };
  }

  if (isFiniteNum(vital.heartRate)) {
    if (vital.heartRate > 110) {
      safe.heartRate = { abnormal: true, message: 'Nhịp tim nhanh (> 110)' };
    } else if (vital.heartRate < 50) {
      safe.heartRate = { abnormal: true, message: 'Nhịp tim chậm (< 50)' };
    }
  }

  if (isFiniteNum(vital.spo2) && vital.spo2 < 95) {
    safe.spo2 = { abnormal: true, message: 'SpO2 thấp (< 95%)' };
  }

  if (isFiniteNum(vital.temperature)) {
    if (vital.temperature >= 38.0) {
      safe.temperature = { abnormal: true, message: 'Sốt (>= 38.0°C)' };
    } else if (vital.temperature < 35.5) {
      safe.temperature = { abnormal: true, message: 'Hạ thân nhiệt (< 35.5°C)' };
    }
  }

  if (isFiniteNum(vital.bloodGlucose)) {
    if (vital.bloodGlucose >= 11.1) {
      safe.bloodGlucose = { abnormal: true, message: 'Đường huyết cao (>= 11.1)' };
    } else if (vital.bloodGlucose < 3.9) {
      safe.bloodGlucose = { abnormal: true, message: 'Hạ đường huyết (< 3.9)' };
    }
  }

  if (isFiniteNum(vital.respiratoryRate)) {
    if (vital.respiratoryRate > 24) {
      safe.respiratoryRate = { abnormal: true, message: 'Thở nhanh (> 24)' };
    } else if (vital.respiratoryRate < 12) {
      safe.respiratoryRate = { abnormal: true, message: 'Thở chậm (< 12)' };
    }
  }

  return safe;
}

/**
 * Returns human-readable summaries of out-of-range metrics in a vital sign record.
 */
export function getAbnormalMetricSummaries(
  vital: Partial<VitalSignDto> | null | undefined
): string[] {
  if (!vital) return [];
  const alerts = getVitalMetricAlerts(vital);
  const items: string[] = [];

  if (alerts.bp.abnormal) {
    const bpText =
      isFiniteNum(vital.systolicBp) && isFiniteNum(vital.diastolicBp)
        ? `${vital.systolicBp}/${vital.diastolicBp}`
        : isFiniteNum(vital.systolicBp)
          ? `${vital.systolicBp}/--`
          : `--/${vital.diastolicBp}`;
    items.push(`Huyết áp ${bpText} mmHg`);
  }
  if (alerts.heartRate.abnormal && isFiniteNum(vital.heartRate)) {
    items.push(`Nhịp tim ${vital.heartRate} bpm`);
  }
  if (alerts.spo2.abnormal && isFiniteNum(vital.spo2)) {
    items.push(`SpO2 ${vital.spo2}%`);
  }
  if (alerts.temperature.abnormal && isFiniteNum(vital.temperature)) {
    items.push(`Nhiệt độ ${vital.temperature}°C`);
  }
  if (alerts.bloodGlucose.abnormal && isFiniteNum(vital.bloodGlucose)) {
    items.push(`Đường huyết ${vital.bloodGlucose} mmol/L`);
  }
  if (alerts.respiratoryRate.abnormal && isFiniteNum(vital.respiratoryRate)) {
    items.push(`Nhịp thở ${vital.respiratoryRate} lần/ph`);
  }

  return items;
}

function buildDelta(
  currentVal: number | null | undefined,
  prevVal: number | null | undefined,
  unit: string,
  decimals = 0
): MetricDeltaState {
  if (!isFiniteNum(currentVal) || !isFiniteNum(prevVal)) {
    return { delta: null, direction: null, label: null };
  }
  const factor = 10 ** decimals;
  const roundedDiff = Math.round((currentVal - prevVal) * factor) / factor;
  if (roundedDiff === 0) {
    return { delta: 0, direction: 'flat', label: `Không đổi (${unit})` };
  }
  const sign = roundedDiff > 0 ? '+' : '';
  const formatted = decimals > 0 ? roundedDiff.toFixed(decimals).replace(/\.?0+$/, '') : String(roundedDiff);
  return {
    delta: roundedDiff,
    direction: roundedDiff > 0 ? 'up' : 'down',
    label: `${sign}${formatted} ${unit} so với lần trước`,
  };
}

/**
 * Computes deltas between the latest reading and the immediate prior reading.
 */
export function computeVitalMetricDeltas(
  current: VitalSignDto | null | undefined,
  previous: VitalSignDto | null | undefined
): Record<VitalMetricKey, MetricDeltaState> {
  return {
    bp: buildDelta(current?.systolicBp, previous?.systolicBp, 'mmHg', 0),
    heartRate: buildDelta(current?.heartRate, previous?.heartRate, 'bpm', 0),
    spo2: buildDelta(current?.spo2, previous?.spo2, '%', 0),
    temperature: buildDelta(current?.temperature, previous?.temperature, '°C', 1),
    bloodGlucose: buildDelta(current?.bloodGlucose, previous?.bloodGlucose, 'mmol/L', 2),
    respiratoryRate: buildDelta(current?.respiratoryRate, previous?.respiratoryRate, 'lần/ph', 0),
  };
}

/**
 * Checks if an ISO timestamp falls on the same local calendar day as referenceDate.
 */
export function isSameLocalCalendarDay(iso: string, referenceDate = new Date()): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

export interface BloodPressureParseResult {
  systolicBp?: number;
  diastolicBp?: number;
  error?: string;
}

/**
 * Parses a combined blood pressure string like "120/80" (allowing optional whitespace around "/").
 */
export function parseBloodPressureInput(raw: string): BloodPressureParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {};
  }

  const match = /^(\d{1,3})\s*\/\s*(\d{1,3})$/.exec(trimmed);
  if (!match) {
    return {
      error: 'Vui lòng nhập huyết áp đúng định dạng Tâm thu/Tâm trương (ví dụ: 120/80).',
    };
  }

  const systolicBp = Number.parseInt(match[1], 10);
  const diastolicBp = Number.parseInt(match[2], 10);

  if (systolicBp < 40 || systolicBp > 300) {
    return { error: 'Huyết áp tâm thu phải trong khoảng 40–300 mmHg.' };
  }
  if (diastolicBp < 30 || diastolicBp > 200) {
    return { error: 'Huyết áp tâm trương phải trong khoảng 30–200 mmHg.' };
  }
  if (systolicBp <= diastolicBp) {
    return {
      error: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương (ví dụ: 120/80).',
    };
  }

  return { systolicBp, diastolicBp };
}

/**
 * Formats a vital sign blood pressure pair for pre-filling the combined "120/80" input.
 */
export function formatBloodPressureInput(
  vital: Pick<VitalSignDto, 'systolicBp' | 'diastolicBp'> | null | undefined
): string {
  if (isFiniteNum(vital?.systolicBp) && isFiniteNum(vital?.diastolicBp)) {
    return `${vital.systolicBp}/${vital.diastolicBp}`;
  }
  return '';
}

const NO_CHRONIC_MARKERS = new Set([
  'không',
  'khong',
  'không có',
  'khong co',
  'không bệnh nền',
  'khong benh nen',
  'bình thường',
  'binh thuong',
  'none',
  'n/a',
  '-',
  '--',
]);

/**
 * Determines whether a family member has a recorded chronic condition warranting daily vital prompts.
 */
export function hasTrackedChronicCondition(chronicDiseases: string | null | undefined): boolean {
  const normalized = (chronicDiseases ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return !NO_CHRONIC_MARKERS.has(normalized);
}
