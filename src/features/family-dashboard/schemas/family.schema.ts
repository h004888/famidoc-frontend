import { z } from 'zod';

export const vitalMetricSchema = z.object({
  type: z.enum(['BP', 'SPO2', 'HEART_RATE', 'GLUCOSE', 'TEMP']),
  value: z.string(),
  unit: z.string(),
  status: z.enum(['NORMAL', 'WARNING', 'CRITICAL']),
  recordedAt: z.string(),
});
export type VitalMetric = z.infer<typeof vitalMetricSchema>;

export const familyMemberSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  role: z.string(),
  birthYear: numberOrString(),
  gender: z.string(),
  chronicConditions: z.array(z.string()).default([]),
  vitalStatus: z.enum(['NORMAL', 'WARNING', 'CRITICAL']).default('NORMAL'),
});

function numberOrString() {
  return z.union([z.number(), z.string()]);
}

export type FamilyMember = z.infer<typeof familyMemberSchema>;
