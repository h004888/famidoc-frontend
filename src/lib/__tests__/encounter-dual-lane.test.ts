import { describe, expect, it } from 'vitest';
import type { EncounterItem } from '@/lib/api/encounters.api';
import {
  canFamilyConfirmAttendance,
  deriveDualLaneState,
  formatEncounterTime,
  getFamilyVisitStepper,
  isEncounterActiveToday,
} from '@/lib/encounter-dual-lane';

function makeEncounter(overrides: Partial<EncounterItem> = {}): EncounterItem {
  return {
    id: 'enc-1',
    contractId: 'contract-1',
    doctorId: 'doc-1',
    scheduledDate: '2026-11-25',
    scheduledTime: '14:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'CONFIRMED',
    familyConfirmedArrivalAt: null,
    clinicalEmrs: [],
    ...overrides,
  };
}

describe('encounter-dual-lane', () => {
  describe('isEncounterActiveToday & canFamilyConfirmAttendance', () => {
    it('allows active today at 09:00 for 14:00 visit, but blocks family confirm until 14:00', () => {
      const encounter = makeEncounter({ scheduledDate: '2026-11-25', scheduledTime: '14:00' });
      const morning = new Date('2026-11-25T09:00:00+07:00');
      expect(isEncounterActiveToday(encounter, morning)).toBe(true);
      expect(canFamilyConfirmAttendance(encounter, morning)).toBe(false);
    });

    it('enables family confirm from scheduledTime onwards on the same day', () => {
      const encounter = makeEncounter({ scheduledDate: '2026-11-25', scheduledTime: '14:00' });
      const atStart = new Date('2026-11-25T14:00:00+07:00');
      const afternoon = new Date('2026-11-25T15:30:00+07:00');
      expect(isEncounterActiveToday(encounter, atStart)).toBe(true);
      expect(canFamilyConfirmAttendance(encounter, atStart)).toBe(true);
      expect(canFamilyConfirmAttendance(encounter, afternoon)).toBe(true);
    });

    it('blocks family confirm if already confirmed or NO_SHOW', () => {
      const afternoon = new Date('2026-11-25T15:30:00+07:00');
      expect(
        canFamilyConfirmAttendance(
          makeEncounter({ familyConfirmedArrivalAt: '2026-11-25T14:15:00+07:00' }),
          afternoon,
        ),
      ).toBe(false);
      expect(
        canFamilyConfirmAttendance(
          makeEncounter({ encounterStatus: 'NO_SHOW' }),
          afternoon,
        ),
      ).toBe(false);
    });

    it('returns false for tomorrow visits', () => {
      const encounter = makeEncounter({ scheduledDate: '2026-11-26', scheduledTime: '14:00' });
      const today = new Date('2026-11-25T14:00:00+07:00');
      expect(isEncounterActiveToday(encounter, today)).toBe(false);
      expect(canFamilyConfirmAttendance(encounter, today)).toBe(false);
    });

    it('returns false for TELEHEALTH visits even after scheduledTime', () => {
      const tele = makeEncounter({
        encounterType: 'TELEHEALTH',
        scheduledDate: '2026-11-25',
        scheduledTime: '1970-01-01T09:30:00.000Z',
      });
      const afternoon = new Date('2026-11-25T15:00:00+07:00');
      expect(canFamilyConfirmAttendance(tele, afternoon)).toBe(false);
    });

    it('formatEncounterTime extracts HH:mm from ISO 1970-01-01T... and plain HH:mm strings', () => {
      expect(formatEncounterTime('1970-01-01T09:37:00.000Z')).toBe('09:37');
      expect(formatEncounterTime('14:05:00')).toBe('14:05');
      expect(formatEncounterTime('8:30')).toBe('08:30');
      expect(formatEncounterTime(null)).toBe('');
    });
  });

  describe('deriveDualLaneState & getFamilyVisitStepper', () => {
    it('reconciles to COMPLETED when family confirmed and >= 1 finalized EMR exists', () => {
      const encounter = makeEncounter({
        familyConfirmedArrivalAt: '2026-11-25T14:30:00+07:00',
        clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
      });
      const state = deriveDualLaneState(encounter, new Date('2026-11-25T16:00:00+07:00'));
      expect(state.reconciledStatus).toBe('COMPLETED');
      expect(state.familyStatusLabel).toBe('Hoàn tất • Đã có kết quả');
      expect(state.autoClosedByTimeout).toBe(false);
    });

    it('reconciles to PENDING_RECORD when family confirmed but doctor has not finalized any EMR', () => {
      const encounter = makeEncounter({
        scheduledDate: '2026-11-25',
        scheduledTime: '14:00',
        familyConfirmedArrivalAt: '2026-11-25T14:30:00+07:00',
        clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: false }],
      });
      // Default 90m visit ends at 15:30 -> 24h deadline is 2026-11-26T15:30:00+07:00
      const now = new Date('2026-11-25T19:30:00+07:00');
      const state = deriveDualLaneState(encounter, now);
      expect(state.reconciledStatus).toBe('PENDING_RECORD');
      expect(state.remainingRecordHours).toBe(20);
      expect(state.familyStatusLabel).toBe('Chờ bác sĩ gửi hồ sơ');
    });

    it('auto-closes to COMPLETED after 48h if family forgot to confirm but doctor finalized EMR', () => {
      const encounter = makeEncounter({
        scheduledDate: '2026-11-22',
        scheduledTime: '09:00',
        familyConfirmedArrivalAt: null,
        clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
      });
      const now = new Date('2026-11-25T12:00:00+07:00');
      const state = deriveDualLaneState(encounter, now);
      expect(state.reconciledStatus).toBe('COMPLETED');
      expect(state.autoClosedByTimeout).toBe(true);
    });

    it('locks to DISPUTED when family reported NO_SHOW regardless of doctor EMR', () => {
      const encounter = makeEncounter({
        encounterStatus: 'NO_SHOW',
        clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
      });
      const state = deriveDualLaneState(encounter, new Date('2026-11-25T16:00:00+07:00'));
      expect(state.reconciledStatus).toBe('DISPUTED');
      expect(state.allowReview).toBe(false);
      expect(state.autoCloseLocked).toBe(true);
      expect(state.familyStatusLabel).toBe('Đang kiểm tra sự cố');
    });

    it('builds 3-step family stepper accurately', () => {
      const upcoming = getFamilyVisitStepper(
        makeEncounter({ scheduledDate: '2026-11-26' }),
        new Date('2026-11-25T09:00:00+07:00'),
      );
      expect(upcoming.map((s) => s.status)).toEqual(['done', 'upcoming', 'upcoming']);

      const active = getFamilyVisitStepper(
        makeEncounter({ scheduledDate: '2026-11-25', scheduledTime: '14:00' }),
        new Date('2026-11-25T14:30:00+07:00'),
      );
      expect(active.map((s) => s.status)).toEqual(['done', 'current', 'upcoming']);

      const completed = getFamilyVisitStepper(
        makeEncounter({
          familyConfirmedArrivalAt: '2026-11-25T14:30:00+07:00',
          clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
        }),
        new Date('2026-11-25T16:00:00+07:00'),
      );
      expect(completed.map((s) => s.status)).toEqual(['done', 'done', 'done']);
    });
  });
});
