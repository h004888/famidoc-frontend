import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FamilyAppointmentsView } from '@/features/appointments/components/family-appointments-view';
import { FamilyPrescriptionDetailView } from '@/features/prescriptions/components/family-prescriptions-view';
import { encountersApi } from '@/lib/api/encounters.api';
import { contractsApi } from '@/lib/api/contracts.api';
import { patientsApi } from '@/lib/api/patients.api';
import { prescriptionsApi } from '@/lib/api/prescriptions.api';

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    getFamilyTimetable: vi.fn(),
    confirmArrival: vi.fn(),
    confirmEncounter: vi.fn(),
    requestReschedule: vi.fn(),
    decideRescheduleRequest: vi.fn(),
    cancelEncounter: vi.fn(),
    createAdHocEncounter: vi.fn(),
    getPendingRescheduleRequests: vi.fn().mockResolvedValue([]),
    getDoctorMonthlyAvailability: vi.fn(),
    getDoctorVideoAvailability: vi.fn(),
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
  },
}));

vi.mock('@/lib/api/prescriptions.api', () => ({
  prescriptionsApi: {
    familyDetail: vi.fn(),
    prescriptionErrorMessage: vi.fn(() => 'Không thể tải đơn thuốc'),
  },
}));

vi.mock('@/lib/api/reviews.api', () => ({
  reviewsApi: {
    submitDoctorReview: vi.fn(),
    submitComplaint: vi.fn(),
  },
}));

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

describe('FamilyAppointmentsView (F2) & FamilyPrescriptionDetailView (F4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contractsApi.getMedicalContracts).mockResolvedValue([] as any);
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({ hasActiveContract: true } as any);
    vi.mocked(patientsApi.getFamilyMembers).mockResolvedValue([] as any);
  });

  it('F2: renders 3 action-oriented tabs and 2-lane status in plain Vietnamese without check-in labels', async () => {
    const user = userEvent.setup();
    vi.mocked(encountersApi.getFamilyTimetable).mockResolvedValue({
      data: [
        {
          id: 'enc-today',
          contractId: 'c-1',
          doctorId: 'd-1',
          scheduledDate: todayIso(),
          scheduledTime: '1970-01-01T00:01:00.000Z',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'CONFIRMED',
          familyConfirmedArrivalAt: null,
          clinicalEmrs: [],
          doctor: { id: 'd-1', doctorName: 'BS. Trần Minh Tâm' },
        },
        {
          id: 'enc-telehealth-today',
          contractId: 'c-1',
          doctorId: 'd-1',
          scheduledDate: todayIso(),
          scheduledTime: '1970-01-01T00:02:00.000Z',
          encounterType: 'TELEHEALTH',
          category: 'AD_HOC_ON_DEMAND',
          encounterStatus: 'CONFIRMED',
          familyConfirmedArrivalAt: null,
          clinicalEmrs: [],
          doctor: { id: 'd-1', doctorName: 'BS. Trần Minh Tâm' },
        },
        {
          id: 'enc-done',
          contractId: 'c-1',
          doctorId: 'd-1',
          scheduledDate: '2026-11-20',
          scheduledTime: '09:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'COMPLETED',
          familyConfirmedArrivalAt: '2026-11-20T09:15:00+07:00',
          clinicalEmrs: [{ id: 'emr-1', patientId: 'p-1', isFinalized: true }],
          doctor: { id: 'd-1', doctorName: 'BS. Trần Minh Tâm' },
        },
        {
          id: 'enc-disputed',
          contractId: 'c-1',
          doctorId: 'd-1',
          scheduledDate: '2026-11-10',
          scheduledTime: '14:00',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'NO_SHOW',
          familyConfirmedArrivalAt: null,
          clinicalEmrs: [],
          doctor: { id: 'd-1', doctorName: 'BS. Trần Minh Tâm' },
        },
      ],
      pagination: { page: 1, pageSize: 20, totalItems: 3, totalPages: 1 },
    });

    render(<FamilyAppointmentsView />);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Hôm nay \/ Cần xác nhận/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Sắp tới/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Đã hoàn tất/i })).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Phía Gia đình:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Phía Bác sĩ:/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/1970-/)).not.toBeInTheDocument();
    expect(screen.getByText(/00:01 • Khám tại nhà/i)).toBeInTheDocument();
    expect(screen.getByText(/00:02 • Khám trực tuyến/i)).toBeInTheDocument();
    expect(screen.queryByText(/Đang di chuyển/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Đã đến nơi/i)).not.toBeInTheDocument();

    // Chỉ có đúng 1 cặp nút xác nhận (cho HOME_VISIT), không hiển thị trên TELEHEALTH
    const arrivedBtns = screen.getAllByRole('button', { name: /Bác sĩ ĐÃ ĐẾN/i });
    expect(arrivedBtns).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Bác sĩ KHÔNG ĐẾN/i })).toHaveLength(1);
    const arrivedBtn = arrivedBtns[0];

    await user.click(arrivedBtn);
    expect(screen.getByText(/Xác nhận & Đánh giá ca khám/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Close/i }));

    await user.click(screen.getByRole('tab', { name: /Đã hoàn tất/i }));
    expect(screen.getByRole('link', { name: /Xem kết quả & Đơn thuốc/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Đang kiểm tra sự cố/i).length).toBeGreaterThan(0);
  });

  it('F4: renders 3 clear sections and replacement warning when prescription is replaced', async () => {
    vi.mocked(prescriptionsApi.familyDetail).mockResolvedValue({
      id: 'rx-1',
      prescriptionCode: 'RX-2026-089',
      status: 'REPLACED',
      prescribedDate: '2026-11-25',
      validUntil: '2026-12-25',
      instructions: 'Uống đều mỗi sáng sau ăn',
      replacementReason: 'Điều chỉnh hàm lượng Amlodipine',
      replacedBy: { id: 'rx-2', prescriptionCode: 'RX-2026-090' },
      patient: { id: 'pat-1', fullName: 'Nguyễn Văn A' },
      doctor: { id: 'doc-1', doctorName: 'BS. Trần Minh Tâm' },
      encounter: {
        id: 'enc-1',
        scheduledDate: '2026-11-25',
        scheduledTime: '14:00',
        encounterType: 'HOME_VISIT',
      },
      exam: {
        chiefComplaint: 'Đau đầu nhẹ',
        clinicalFindings: 'Tim đều',
        icd10Code: 'I10',
        icd10Diagnosis: 'Tăng huyết áp vô căn',
        treatmentPlan: 'Ăn nhạt, đo huyết áp mỗi sáng',
      },
      details: [
        {
          id: 'd-1',
          medicationName: 'Amlodipine',
          strength: '5mg',
          dosage: '1 viên',
          frequency: 'Sáng sau ăn',
          durationDays: 30,
          quantity: 30,
          unit: 'viên',
          administrationRoute: 'Uống',
        },
      ],
    } as any);

    render(<FamilyPrescriptionDetailView id="rx-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Phần 1: Bác sĩ kết luận & dặn dò/i)).toBeInTheDocument();
      expect(screen.getByText(/Phần 2: Đơn thuốc điện tử/i)).toBeInTheDocument();
      expect(screen.getByText(/Đơn này đã được thay thế/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /RX-2026-090/i })).toHaveAttribute(
        'href',
        '/family/prescriptions/rx-2',
      );
      expect(
        screen.getByRole('link', { name: /Xem hồ sơ sức khỏe thành viên/i }),
      ).toHaveAttribute('href', '/family/members/pat-1');
    });
  });
});
