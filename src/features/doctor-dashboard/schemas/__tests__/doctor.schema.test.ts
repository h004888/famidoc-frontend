import { describe, it, expect } from 'vitest';
import { soapNoteSchema } from '../doctor.schema';

describe('UT-SCH-09: Clinical SOAP Note Schema Validation', () => {
  it('validates clinical SOAP note with ICD-10 diagnostics', () => {
    const valid = soapNoteSchema.safeParse({
      patientId: 'pat-9912',
      subjective: 'Bệnh nhân đau tức ngực nhẹ khi gắng sức, không khó thở về đêm',
      objective: 'HA 145/90 mmHg, nhịp tim 84 bpm, phổi trong, không ran',
      assessment: 'Tăng huyết áp nguyên phát độ 1 (ICD-10: I10)',
      plan: 'Duy trì Amlodipine 5mg sáng 1 viên, theo dõi HA tại nhà 2 lần/ngày',
      icd10Codes: ['I10', 'E11.9'],
    });
    expect(valid.success).toBe(true);
  });
});
