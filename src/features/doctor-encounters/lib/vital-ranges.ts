import type { VisitVitals } from '@/lib/api/medical-books.api';

export const VITAL_RANGES = {
  systolicBp: { label: 'Huyết áp tâm thu', min: 50, max: 260, step: '1' },
  diastolicBp: { label: 'Huyết áp tâm trương', min: 30, max: 160, step: '1' },
  heartRate: { label: 'Nhịp tim', min: 30, max: 220, step: '1' },
  temperature: { label: 'Nhiệt độ', min: 34, max: 43, step: '0.1' },
  spo2: { label: 'SpO2', min: 50, max: 100, step: '1' },
  respiratoryRate: { label: 'Nhịp thở', min: 5, max: 60, step: '1' },
  weightKg: { label: 'Cân nặng', min: 0.5, max: 300, step: '0.1' },
} as const;

export type VitalFieldKey = keyof typeof VITAL_RANGES;

export function validateVitals(vitals: VisitVitals): Record<string, string> {
  const errors: Record<string, string> = {};
  (Object.keys(VITAL_RANGES) as VitalFieldKey[]).forEach((key) => {
    const val = vitals[key];
    if (val === undefined) return;
    const { label, min, max } = VITAL_RANGES[key];
    if (!Number.isFinite(val) || val < min || val > max) {
      errors[key] = `${label} phải từ ${min} đến ${max}.`;
    }
  });
  return errors;
}
