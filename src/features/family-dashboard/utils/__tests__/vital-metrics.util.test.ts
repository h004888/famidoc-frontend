import { describe, expect, it } from 'vitest';
import type { VitalSignDto } from '@/lib/api';
import {
  computeVitalMetricDeltas,
  formatBloodPressureInput,
  getAbnormalMetricSummaries,
  getVitalMetricAlerts,
  hasTrackedChronicCondition,
  isSameLocalCalendarDay,
  parseBloodPressureInput,
} from '../vital-metrics.util';

function makeVital(overrides: Partial<VitalSignDto> = {}): VitalSignDto {
  return {
    id: 'vs-1',
    emrId: null,
    patientId: 'p-1',
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 72,
    temperature: 36.7,
    spo2: 98,
    respiratoryRate: 16,
    bloodGlucose: 5.5,
    isAbnormalAlert: false,
    recordedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('vital-metrics.util', () => {
  it('treats safe clinical values and null records as non-abnormal', () => {
    expect(getVitalMetricAlerts(null).bp.abnormal).toBe(false);
    expect(getVitalMetricAlerts(undefined).spo2.abnormal).toBe(false);

    const safe = makeVital({
      systolicBp: 139,
      diastolicBp: 89,
      heartRate: 110,
      spo2: 95,
      temperature: 37.9,
      bloodGlucose: 11.0,
      respiratoryRate: 24,
    });
    const alerts = getVitalMetricAlerts(safe);
    expect(Object.values(alerts).every((a) => !a.abnormal)).toBe(true);
    expect(getAbnormalMetricSummaries(safe)).toEqual([]);
  });

  it('flags exact backend boundary thresholds for each metric', () => {
    const highAlerts = getVitalMetricAlerts(
      makeVital({
        systolicBp: 140,
        diastolicBp: 90,
        heartRate: 111,
        spo2: 94,
        temperature: 38.0,
        bloodGlucose: 11.1,
        respiratoryRate: 25,
      })
    );
    expect(highAlerts.bp.abnormal).toBe(true);
    expect(highAlerts.heartRate.abnormal).toBe(true);
    expect(highAlerts.spo2.abnormal).toBe(true);
    expect(highAlerts.temperature.abnormal).toBe(true);
    expect(highAlerts.bloodGlucose.abnormal).toBe(true);
    expect(highAlerts.respiratoryRate.abnormal).toBe(true);

    const lowAlerts = getVitalMetricAlerts(
      makeVital({
        systolicBp: 89,
        diastolicBp: 59,
        heartRate: 49,
        temperature: 35.4,
        bloodGlucose: 3.8,
        respiratoryRate: 11,
      })
    );
    expect(lowAlerts.bp.abnormal).toBe(true);
    expect(lowAlerts.heartRate.abnormal).toBe(true);
    expect(lowAlerts.temperature.abnormal).toBe(true);
    expect(lowAlerts.bloodGlucose.abnormal).toBe(true);
    expect(lowAlerts.respiratoryRate.abnormal).toBe(true);
  });

  it('builds readable summaries only for abnormal metrics', () => {
    const summaries = getAbnormalMetricSummaries(
      makeVital({
        systolicBp: 150,
        diastolicBp: 95,
        spo2: 92,
      })
    );
    expect(summaries).toEqual(['Huyết áp 150/95 mmHg', 'SpO2 92%']);
  });

  it('computes deltas cleanly across integers and decimals', () => {
    const current = makeVital({
      systolicBp: 135,
      heartRate: 72,
      spo2: 99,
      temperature: 37.2,
      bloodGlucose: 6.4,
      respiratoryRate: 18,
    });
    const previous = makeVital({
      id: 'vs-prev',
      systolicBp: 125,
      heartRate: 78,
      spo2: 99,
      temperature: 36.7,
      bloodGlucose: null,
      respiratoryRate: 16,
    });

    const deltas = computeVitalMetricDeltas(current, previous);
    expect(deltas.bp).toEqual({
      delta: 10,
      direction: 'up',
      label: '+10 mmHg so với lần trước',
    });
    expect(deltas.heartRate).toEqual({
      delta: -6,
      direction: 'down',
      label: '-6 bpm so với lần trước',
    });
    expect(deltas.spo2.direction).toBe('flat');
    expect(deltas.temperature.delta).toBe(0.5);
    expect(deltas.bloodGlucose).toEqual({ delta: null, direction: null, label: null });
  });

  it('checks same local calendar day accurately', () => {
    const ref = new Date(2026, 10, 18, 12, 0, 0);
    const sameDay = new Date(2026, 10, 18, 22, 15, 0).toISOString();
    const prevDay = new Date(2026, 10, 17, 23, 59, 0).toISOString();
    expect(isSameLocalCalendarDay(sameDay, ref)).toBe(true);
    expect(isSameLocalCalendarDay(prevDay, ref)).toBe(false);
    expect(isSameLocalCalendarDay('invalid-date', ref)).toBe(false);
  });

  it('parses valid combined blood pressure values and rejects invalid or inverted inputs', () => {
    expect(parseBloodPressureInput('')).toEqual({});
    expect(parseBloodPressureInput('   ')).toEqual({});
    expect(parseBloodPressureInput('120/80')).toEqual({ systolicBp: 120, diastolicBp: 80 });
    expect(parseBloodPressureInput(' 135 / 85 ')).toEqual({ systolicBp: 135, diastolicBp: 85 });

    expect(parseBloodPressureInput('120').error).toMatch(/120\/80/);
    expect(parseBloodPressureInput('120/').error).toMatch(/120\/80/);
    expect(parseBloodPressureInput('abc/80').error).toMatch(/120\/80/);
    expect(parseBloodPressureInput('35/25').error).toMatch(/40–300/);
    expect(parseBloodPressureInput('310/90').error).toMatch(/40–300/);
    expect(parseBloodPressureInput('120/25').error).toMatch(/30–200/);
    expect(parseBloodPressureInput('220/210').error).toMatch(/30–200/);
    expect(parseBloodPressureInput('80/120').error).toMatch(/lớn hơn/);
    expect(parseBloodPressureInput('100/100').error).toMatch(/lớn hơn/);
  });

  it('formats combined blood pressure input cleanly', () => {
    expect(formatBloodPressureInput(makeVital({ systolicBp: 128, diastolicBp: 82 }))).toBe(
      '128/82'
    );
    expect(formatBloodPressureInput(makeVital({ systolicBp: null, diastolicBp: 80 }))).toBe('');
    expect(formatBloodPressureInput(null)).toBe('');
  });

  it('detects tracked chronic conditions vs healthy/empty markers', () => {
    expect(hasTrackedChronicCondition(null)).toBe(false);
    expect(hasTrackedChronicCondition(undefined)).toBe(false);
    expect(hasTrackedChronicCondition('')).toBe(false);
    expect(hasTrackedChronicCondition('   ')).toBe(false);
    expect(hasTrackedChronicCondition('Không')).toBe(false);
    expect(hasTrackedChronicCondition('Không có')).toBe(false);
    expect(hasTrackedChronicCondition('None')).toBe(false);
    expect(hasTrackedChronicCondition('N/A')).toBe(false);
    expect(hasTrackedChronicCondition('--')).toBe(false);

    expect(hasTrackedChronicCondition('Tăng huyết áp')).toBe(true);
    expect(hasTrackedChronicCondition('Đái tháo đường type 2')).toBe(true);
  });
});
