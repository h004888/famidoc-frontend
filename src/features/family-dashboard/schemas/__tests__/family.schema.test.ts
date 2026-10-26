import { describe, it, expect } from 'vitest';
import { vitalMetricSchema, familyMemberSchema } from '../family.schema';

describe('UT-SCH-08: Family Health Dashboard Schemas', () => {
  it('validates physiological telemetry metrics', () => {
    const valid = vitalMetricSchema.safeParse({
      type: 'BP',
      value: '120/80',
      unit: 'mmHg',
      status: 'NORMAL',
      recordedAt: '2026-10-23T08:00:00Z',
    });
    expect(valid.success).toBe(true);
  });

  it('validates multi-generational family member profile', () => {
    const member = familyMemberSchema.safeParse({
      id: 'mem-001',
      fullName: 'Nguyễn Văn Phúc (Ông nội)',
      role: 'Thành viên cao tuổi',
      birthYear: 1948,
      gender: 'Nam',
      chronicConditions: ['Tăng huyết áp', 'Tiểu đường type 2'],
      vitalStatus: 'WARNING',
    });
    expect(member.success).toBe(true);
  });
});
