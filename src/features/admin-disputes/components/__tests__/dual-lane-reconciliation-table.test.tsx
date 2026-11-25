import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterItem } from '@/lib/api/encounters.api';
import { encountersApi } from '@/lib/api/encounters.api';
import { adminApi } from '@/lib/api/admin.api';
import { DualLaneReconciliationTable } from '@/features/admin-disputes/components/dual-lane-reconciliation-table';
import { AdminDisputesView } from '@/features/admin-disputes/components/admin-disputes-view';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    remindWrapUp: vi.fn(),
    getFacilityScheduleBoard: vi.fn(),
  },
}));

vi.mock('@/lib/api/admin.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/admin.api')>();
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      complaints: vi.fn(),
    },
  };
});

vi.mock('@/components/shared/admin-page-navigation', () => ({
  AdminPageNavigation: () => <nav aria-label="Admin nav" />,
}));

const sampleEncounters: EncounterItem[] = [
  {
    id: 'ec-104',
    contractId: 'c-104',
    doctorId: 'd-1',
    scheduledDate: '2026-11-25',
    scheduledTime: '14:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'NO_SHOW',
    familyConfirmedArrivalAt: null,
    clinicalEmrs: [{ id: 'emr-104', patientId: 'p-1', isFinalized: false }],
    patient: { id: 'p-1', fullName: 'Hộ Phạm D' },
  },
  {
    id: 'ec-102',
    contractId: 'c-102',
    doctorId: 'd-1',
    scheduledDate: '2026-11-24',
    scheduledTime: '09:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'CONFIRMED',
    familyConfirmedArrivalAt: '2026-11-24T09:15:00+07:00',
    clinicalEmrs: [{ id: 'emr-102', patientId: 'p-2', isFinalized: false }],
    patient: { id: 'p-2', fullName: 'Hộ Lê Thị B' },
  },
  {
    id: 'ec-101',
    contractId: 'c-101',
    doctorId: 'd-1',
    scheduledDate: '2026-11-25',
    scheduledTime: '09:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'COMPLETED',
    familyConfirmedArrivalAt: '2026-11-25T09:10:00+07:00',
    clinicalEmrs: [{ id: 'emr-101', patientId: 'p-3', isFinalized: true }],
    patient: { id: 'p-3', fullName: 'Hộ Nguyễn Văn A' },
  },
];

describe('DualLaneReconciliationTable (O1) & AdminDisputesView integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(encountersApi.remindWrapUp).mockResolvedValue({ ok: true });
    vi.mocked(encountersApi.getFacilityScheduleBoard).mockResolvedValue({
      facilityId: 'fac-1',
      encounters: sampleEncounters,
      pendingRescheduleRequests: [],
    });
    vi.mocked(adminApi.complaints).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    } as any);
  });

  it('O1: renders 3 filters, parallel 2-lane columns, remind action for PENDING_RECORD, and dispute action for NO_SHOW', async () => {
    const user = userEvent.setup();
    const onInspectDispute = vi.fn();

    render(
      <DualLaneReconciliationTable
        encounters={sampleEncounters}
        now={new Date('2026-11-25T10:00:00+07:00')}
        onInspectDispute={onInspectDispute}
      />,
    );

    expect(screen.getByRole('button', { name: /Tất cả \(3\)/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Cần xử lý: NO_SHOW\/DISPUTED \(1\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chờ hồ sơ 24h \(1\)/i })).toBeInTheDocument();

    expect(screen.getByText('Làn Gia đình')).toBeInTheDocument();
    expect(screen.getByText('Làn Bác sĩ')).toBeInTheDocument();
    expect(screen.getByText(/Bị khóa tự đóng/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Gửi nhắc bác sĩ/i }));
    await waitFor(() => {
      expect(encountersApi.remindWrapUp).toHaveBeenCalledWith('ec-102');
    });

    await user.click(screen.getByRole('button', { name: /Xử lý đối soát/i }));
    expect(onInspectDispute).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ec-104' }),
    );
  });

  it('integrates Đối soát ca khám 2 làn tab into AdminDisputesView without breaking complaint tabs', async () => {
    const user = userEvent.setup();
    render(<AdminDisputesView />);

    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: /Đối soát ca khám 2 làn/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /Đối soát ca khám 2 làn/i }));
    await waitFor(() => {
      expect(screen.getByText(/Hộ Phạm D/i)).toBeInTheDocument();
    });
  });
});
