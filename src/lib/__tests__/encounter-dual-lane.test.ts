import { describe, expect, it } from 'vitest';
import { deriveDualLaneState } from '@/lib/encounter-dual-lane';
import type { EncounterItem } from '@/lib/api/encounters.api';

function makeEncounter(overrides: Partial<EncounterItem> = {}): EncounterItem {
  return {
    id: 'enc-1',
    contractId: 'con-1',
    doctorId: 'doc-1',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    scheduledDate: '2026-11-25',
    scheduledTime: '09:00:00',
    slotWindow: 'MORNING',
    encounterStatus: 'CONFIRMED',
    familyConfirmedArrivalAt: null,
    doctorCompletedAt: null,
    recordOverdueAt: null,
    clinicalEmrs: [],
    ...overrides,
  } as EncounterItem;
}

describe('encounter-dual-lane (2-tier Home Visit & 2-session SLA)', () => {
  it('không trả COMPLETED khi chỉ có 1 clinicalEmr finalized lẻ mà doctorCompletedAt == null', () => {
    const enc = makeEncounter({
      familyConfirmedArrivalAt: '2026-11-25T02:05:00.000Z',
      doctorCompletedAt: null,
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
    });

    const state = deriveDualLaneState(enc, new Date('2026-11-25T11:35:00+07:00'));

    expect(state.reconciledStatus).toBe('PENDING_RECORD');
    expect(state.reconciledStatus).not.toBe('COMPLETED');
  });

  it('trả COMPLETED khi doctorCompletedAt != null và familyConfirmedArrivalAt != null', () => {
    const enc = makeEncounter({
      encounterStatus: 'COMPLETED',
      familyConfirmedArrivalAt: '2026-11-25T02:05:00.000Z',
      doctorCompletedAt: '2026-11-25T04:15:00.000Z',
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
    });

    const state = deriveDualLaneState(enc, new Date('2026-11-25T11:35:00+07:00'));

    expect(state.reconciledStatus).toBe('COMPLETED');
    expect(state.allowReview).toBe(true);
  });

  it('đánh dấu isOverdue = true khi recordOverdueAt != null hoặc quá 23:59 ngày khám mà doctorCompletedAt == null', () => {
    const encPastMidnight = makeEncounter({
      doctorCompletedAt: null,
      recordOverdueAt: null,
    });
    const statePastMidnight = deriveDualLaneState(
      encPastMidnight,
      new Date('2026-11-26T00:05:00+07:00'),
    );
    expect((statePastMidnight as any).isOverdue).toBe(true);

    const encWithFlag = makeEncounter({
      doctorCompletedAt: null,
      recordOverdueAt: '2026-11-26T00:01:00+07:00',
    });
    const stateWithFlag = deriveDualLaneState(
      encWithFlag,
      new Date('2026-11-25T22:00:00+07:00'),
    );
    expect((stateWithFlag as any).isOverdue).toBe(true);
  });

  it('tính remainingRecordHours tới 23:59 cùng ngày (~13h lúc 11:35 cho ca Sáng), không dùng +90p + 24h', () => {
    const enc = makeEncounter({
      scheduledDate: '2026-11-25',
      scheduledTime: '09:00:00',
      slotWindow: 'MORNING',
      familyConfirmedArrivalAt: '2026-11-25T02:05:00.000Z',
      doctorCompletedAt: null,
    });

    const state = deriveDualLaneState(enc, new Date('2026-11-25T11:35:00+07:00'));

    expect(state.remainingRecordHours).toBe(13);
  });
});
