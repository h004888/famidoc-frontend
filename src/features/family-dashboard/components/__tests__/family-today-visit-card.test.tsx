import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterItem } from '@/lib/api/encounters.api';
import { FamilyTodayVisitCard } from '@/features/family-dashboard/components/family-today-visit-card';
import { FamilyDashboardView } from '@/features/family-dashboard/components/family-dashboard-view';
import { encountersApi } from '@/lib/api/encounters.api';
import { contractsApi } from '@/lib/api/contracts.api';
import { patientsApi } from '@/lib/api/patients.api';
import { prescriptionsApi } from '@/lib/api/prescriptions.api';

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    getFamilyTimetable: vi.fn(),
    confirmArrival: vi.fn(),
  },
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    getMedicalContracts: vi.fn(),
    getFamilyGateStatus: vi.fn(),
  },
}));

vi.mock('@/lib/api/patients.api', () => ({
  patientsApi: {
    getFamilyMembers: vi.fn(),
    getMemberVitalSigns: vi.fn(),
  },
}));

vi.mock('@/lib/api/prescriptions.api', () => ({
  prescriptionsApi: {
    listForFamily: vi.fn(),
  },
}));

vi.mock('@/lib/api/reviews.api', () => ({
  reviewsApi: {
    submitDoctorReview: vi.fn(),
    submitComplaint: vi.fn(),
  },
}));

function makeEncounter(overrides: Partial<EncounterItem> = {}): EncounterItem {
  return {
    id: 'enc-today-1',
    contractId: 'contract-1',
    doctorId: 'doc-1',
    scheduledDate: '2026-11-25',
    scheduledTime: '14:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'CONFIRMED',
    familyConfirmedArrivalAt: null,
    clinicalEmrs: [],
    doctor: {
      id: 'doc-1',
      doctorName: 'BS. Trần Minh Tâm',
      user: { name: 'BS. Trần Minh Tâm', phone: '0901234567' },
    },
    ...overrides,
  };
}

describe('FamilyTodayVisitCard (F1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('State 1 (before scheduled time): shows 3-step progress and hides confirm buttons', () => {
    render(
      <FamilyTodayVisitCard
        encounter={makeEncounter({ scheduledDate: '2026-11-25', scheduledTime: '14:00' })}
        now={new Date('2026-11-25T09:00:00+07:00')}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText('Đã chốt lịch')).toBeInTheDocument();
    expect(screen.getByText('Khám hôm nay')).toBeInTheDocument();
    expect(screen.getByText('Kết quả khám')).toBeInTheDocument();
    expect(screen.getByText(/Gia đình chưa cần thao tác gì lúc này/i)).toBeInTheDocument();
    expect(screen.getByText(/tự động hiện ra từ lúc 14:00/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bác sĩ ĐÃ ĐẾN khám/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bác sĩ KHÔNG ĐẾN/i })).not.toBeInTheDocument();
  });

  it('State 2 (from 14:00 onwards): renders 2 big action buttons and opens confirm modal', async () => {
    const user = userEvent.setup();
    render(
      <FamilyTodayVisitCard
        encounter={makeEncounter({ scheduledDate: '2026-11-25', scheduledTime: '14:00' })}
        now={new Date('2026-11-25T14:15:00+07:00')}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText(/Bác sĩ có đến khám hôm nay không\?/i)).toBeInTheDocument();
    const arrivedBtn = screen.getByRole('button', { name: /Bác sĩ ĐÃ ĐẾN khám/i });
    const noShowBtn = screen.getByRole('button', { name: /Bác sĩ KHÔNG ĐẾN/i });
    expect(arrivedBtn).toBeInTheDocument();
    expect(noShowBtn).toBeInTheDocument();

    await user.click(arrivedBtn);
    expect(screen.getByText(/Bước 1\/2: Xác nhận/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Close/i }));
    await user.click(noShowBtn);
    expect(screen.getByText(/Báo sự cố: Bác sĩ không đến khám/i)).toBeInTheDocument();
  });

  it('State 3a (confirmed, waiting doctor): uses plain Vietnamese without PENDING_RECORD', () => {
    render(
      <FamilyTodayVisitCard
        encounter={makeEncounter({
          familyConfirmedArrivalAt: '2026-11-25T14:20:00+07:00',
          clinicalEmrs: [],
        })}
        now={new Date('2026-11-25T15:00:00+07:00')}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText(/Gia đình đã xác nhận\. Đang chờ bác sĩ gửi kết quả/i)).toBeInTheDocument();
    expect(screen.queryByText(/PENDING_RECORD/)).not.toBeInTheDocument();
  });

  it('State 3b (confirmed & finalized): shows link to /family/prescriptions', () => {
    render(
      <FamilyTodayVisitCard
        encounter={makeEncounter({
          familyConfirmedArrivalAt: '2026-11-25T14:20:00+07:00',
          doctorCompletedAt: '2026-11-25T15:00:00+07:00',
          clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
        })}
        now={new Date('2026-11-25T15:30:00+07:00')}
        onUpdated={vi.fn()}
      />,
    );

    const link = screen.getByRole('link', { name: /Xem kết quả khám & Đơn thuốc/i });
    expect(link).toHaveAttribute('href', '/family/prescriptions');
  });

  it('FamilyDashboardView places Thăm khám hôm nay banner when an active today visit exists', async () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayIso = `${yyyy}-${mm}-${dd}`;

    vi.mocked(encountersApi.getFamilyTimetable).mockResolvedValue({
      data: [makeEncounter({ scheduledDate: todayIso, scheduledTime: '00:01' })],
      pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([] as any);
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({ hasActiveContract: true } as any);
    vi.mocked(patientsApi.getFamilyMembers).mockResolvedValue([
      {
        id: 'pat-1',
        fullName: 'Nguyễn Văn A',
        dateOfBirth: '1958-01-01',
        gender: 'MALE',
        relationship: 'SELF',
      },
    ] as any);
    vi.mocked(patientsApi.getMemberVitalSigns).mockResolvedValue([] as any);
    vi.mocked(prescriptionsApi.listForFamily).mockResolvedValue({ items: [] } as any);

    render(<FamilyDashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/Thăm khám hôm nay/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Bác sĩ ĐÃ ĐẾN khám/i })).toBeInTheDocument();
    });
  });
});
