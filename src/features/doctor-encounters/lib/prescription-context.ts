import type { PrescriptionContext } from '@/lib/api/prescriptions.api';

export function buildClinicalContext(
  context: Record<string, string>,
  hasLongTermDrug: boolean,
): PrescriptionContext {
  return Object.fromEntries(
    Object.entries(context)
      .filter(
        ([key, value]) =>
          value.trim() !== '' && (key !== 'longTermReason' || hasLongTermDrug),
      )
      .map(([key, value]) => [
        key,
        key === 'weightKg' || key === 'followUpDays'
          ? Number(value)
          : value.trim(),
      ]),
  ) as PrescriptionContext;
}
