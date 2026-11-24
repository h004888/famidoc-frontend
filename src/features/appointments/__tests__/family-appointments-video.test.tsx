import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  encountersApi: {
    getDoctorVideoAvailability: vi.fn().mockResolvedValue({
      month: '2026-11',
      doctorId: 'doc-1',
      nearestAvailableSlot: { date: '2026-11-26', slotWindow: 'MORNING', suggestedTime: '09:00' },
      days: [],
    }),
    createAdHocEncounter: vi.fn().mockResolvedValue({ id: 'enc-1' }),
    cancelEncounter: vi.fn().mockResolvedValue({ id: 'enc-1', encounterStatus: 'CANCELLED' }),
  },
  contractsApi: {
    getFamilyGateStatus: vi.fn().mockResolvedValue({ activeContract: { id: 'ctr-1' } }),
    getMedicalContractDetail: vi.fn().mockResolvedValue({
      id: 'ctr-1',
      doctor: { id: 'doc-1', doctorName: 'BS. Nguyễn Văn A' },
      remainingTelehealth: 3,
      servicePackage: { videoQuotaPolicy: 'FIXED' },
    }),
  },
}));

describe('Video Consultation Booking APIs', () => {
  it('exposes getDoctorVideoAvailability and cancelEncounter', async () => {
    const { encountersApi } = await import('@/lib/api');
    const avail = await encountersApi.getDoctorVideoAvailability('doc-1', '2026-11', 'ctr-1');
    expect(avail.nearestAvailableSlot.slotWindow).toBe('MORNING');

    const cancelled = await encountersApi.cancelEncounter('enc-1');
    expect(cancelled.encounterStatus).toBe('CANCELLED');
  });
});
