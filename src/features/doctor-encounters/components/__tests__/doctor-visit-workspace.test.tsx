import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorEncountersView } from '@/features/doctor-encounters/components/doctor-encounters-view';
import { encountersApi } from '@/lib/api/encounters.api';
import { medicalBooksApi } from '@/lib/api/medical-books.api';
import { patientsApi } from '@/lib/api/patients.api';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    getEncounterDetail: vi.fn(),
  },
}));

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: {
    visit: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock('@/lib/api/patients.api', () => ({
  patientsApi: {
    addMemberVitalSign: vi.fn(),
    addMemberAllergy: vi.fn(),
    updateFamilyMember: vi.fn(),
  },
}));

const sampleEncounter = {
  id: 'enc-ws-1',
  contractId: 'ctr-1',
  doctorId: 'doc-1',
  scheduledDate: '2026-11-25',
  scheduledTime: '14:00',
  encounterType: 'HOME_VISIT',
  category: 'PERIODIC_ROUTINE',
  encounterStatus: 'CONFIRMED',
  familyConfirmedArrivalAt: '2026-11-25T14:15:00+07:00',
  clinicalEmrs: [{ id: 'emr-2', patientId: 'pat-2', isFinalized: true }],
  contract: {
    id: 'ctr-1',
    familyUnit: {
      id: 'fam-1',
      familyName: 'Hộ Nguyễn Văn A',
      representativeUser: { id: 'rep-1', fullName: 'Nguyễn Văn A' },
    },
    members: [
      {
        patientId: 'pat-1',
        relationship: 'HEAD',
        patient: {
          id: 'pat-1',
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1958-01-01',
          gender: 'MALE',
          chronicDiseases: 'Tăng huyết áp',
          allergies: [],
        },
      },
      {
        patientId: 'pat-2',
        relationship: 'SPOUSE',
        patient: {
          id: 'pat-2',
          fullName: 'Trần Thị B',
          dateOfBirth: '1962-05-10',
          gender: 'FEMALE',
          chronicDiseases: null,
          allergies: [],
        },
      },
      {
        patientId: 'pat-3',
        relationship: 'CHILD',
        patient: {
          id: 'pat-3',
          fullName: 'Nguyễn Văn C',
          dateOfBirth: '1990-03-12',
          gender: 'MALE',
          chronicDiseases: null,
          allergies: [],
        },
      },
    ],
  },
};

describe('DoctorVisitWorkspace (D3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValue(sampleEncounter as any);
    vi.mocked(medicalBooksApi.visit).mockResolvedValue({
      id: 'enc-ws-1',
      encounterType: 'HOME_VISIT',
      scheduledDate: '2026-11-25',
      scheduledTime: '14:00',
      doctorName: 'BS. Trần Minh Tâm',
      isFinalized: false,
      exam: null,
      finalizedAt: null,
      recipient: { id: 'rep-1', name: 'Nguyễn Văn A' },
      prescription: null,
      patient: { id: 'pat-1', fullName: 'Nguyễn Văn A', familyId: 'fam-1', dateOfBirth: '1958-01-01', relationshipToHead: 'HEAD' },
    } as any);
    vi.mocked(medicalBooksApi.confirm).mockResolvedValue({ ok: true } as any);
    vi.mocked(patientsApi.addMemberVitalSign).mockResolvedValue({} as any);
    vi.mocked(patientsApi.addMemberAllergy).mockResolvedValue({} as any);
    vi.mocked(patientsApi.updateFamilyMember).mockResolvedValue({} as any);
  });

  it('Step 1 & Header: renders 4-step workflow, family status, 24h deadline, and multi-member checklist', async () => {
    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByText(/1\. Chọn thành viên/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Ghi khám & EHR/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Đơn thuốc/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Chốt/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Đã xác nhận có đến/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Chọn khám Nguyễn Văn A/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Chọn khám Trần Thị B/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Chọn khám Nguyễn Văn C/i })).toBeInTheDocument();
    expect(screen.getByText(/Đã chốt: 1\//i)).toBeInTheDocument();
  });

  it('Step 4 Draft: saves draft to localStorage without calling confirm or vital-signs APIs', async () => {
    const user = userEvent.setup();
    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Lý do khám/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Lý do khám/i), 'Đau đầu nhẹ buổi sáng');
    await user.type(screen.getByLabelText(/Huyết áp tâm thu/i), '145');
    await user.type(screen.getByLabelText(/Huyết áp tâm trương/i), '90');
    await user.click(screen.getByRole('button', { name: /Lưu Nháp/i }));

    expect(medicalBooksApi.confirm).not.toHaveBeenCalled();
    expect(patientsApi.addMemberVitalSign).not.toHaveBeenCalled();
    const rawDraft = localStorage.getItem('famidoc_visit_draft:enc-ws-1:pat-1');
    expect(rawDraft).toContain('Đau đầu nhẹ buổi sáng');
    expect(rawDraft).toContain('145');
  });

  it('Step 2+4 Finalize without prescription: syncs vitals & allergy to EHR and confirms encounter', async () => {
    const user = userEvent.setup();
    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Lý do khám/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/Lý do khám/i), 'Khám định kỳ');
    await user.type(screen.getByLabelText(/Chẩn đoán/i), 'Tăng huyết áp vô căn');
    await user.type(screen.getByLabelText(/Huyết áp tâm thu/i), '145');
    await user.type(screen.getByLabelText(/Huyết áp tâm trương/i), '90');
    await user.type(screen.getByLabelText(/Dị ứng mới/i), 'Penicillin');

    await user.click(screen.getByRole('button', { name: /^✓ Chốt hồ sơ$/i }));

    await waitFor(() => {
      expect(medicalBooksApi.confirm).toHaveBeenCalledWith(
        'enc-ws-1',
        expect.objectContaining({
          patientId: 'pat-1',
          confirmed: true,
          prescription: undefined,
        }),
      );
      expect(patientsApi.addMemberVitalSign).toHaveBeenCalledWith(
        'pat-1',
        expect.objectContaining({
          systolicBp: 145,
          diastolicBp: 90,
        }),
      );
      expect(patientsApi.addMemberAllergy).toHaveBeenCalledWith(
        'pat-1',
        expect.objectContaining({ allergenName: 'Penicillin' }),
      );
    });
  });

  it('Step 3+4 Finalize with prescription: sends prescription details when optional checkbox is enabled', async () => {
    const user = userEvent.setup();
    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Có phát sinh đơn thuốc/i)).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText(/Có phát sinh đơn thuốc/i));
    await user.type(screen.getByLabelText(/Tên thuốc/i), 'Amlodipine');
    await user.type(screen.getByLabelText(/Hàm lượng/i), '5mg');
    await user.type(screen.getByLabelText(/Liều mỗi lần/i), '1 viên');
    await user.type(screen.getByLabelText(/Tần suất/i), 'Sáng sau ăn');
    await user.type(screen.getByLabelText(/Số ngày dùng/i), '30');
    await user.type(screen.getByLabelText(/Tổng số lượng/i), '30');
    await user.type(screen.getByLabelText(/Đơn vị/i), 'viên');
    await user.type(screen.getByLabelText(/Lời dặn đơn thuốc/i), 'Uống đều mỗi sáng');

    await user.click(screen.getByRole('button', { name: /Chốt hồ sơ & Phát hành đơn/i }));

    await waitFor(() => {
      expect(medicalBooksApi.confirm).toHaveBeenCalledWith(
        'enc-ws-1',
        expect.objectContaining({
          patientId: 'pat-1',
          confirmed: true,
          prescription: expect.objectContaining({
            instructions: 'Uống đều mỗi sáng',
            details: [
              expect.objectContaining({
                medicationName: 'Amlodipine',
                strength: '5mg',
                quantity: 30,
              }),
            ],
          }),
        }),
      );
    });
  });
});
