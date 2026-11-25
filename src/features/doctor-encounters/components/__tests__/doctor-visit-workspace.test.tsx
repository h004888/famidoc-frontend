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

describe('DoctorVisitWorkspace (2-Column Minimalist)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValue(sampleEncounter as any);
    vi.mocked(medicalBooksApi.visit).mockImplementation(async (_id, _signal, patientId) => {
      const isFinalized = patientId === 'pat-2';
      return {
        id: 'enc-ws-1',
        encounterType: 'HOME_VISIT',
        scheduledDate: '2026-11-25',
        scheduledTime: '14:00',
        doctorName: 'BS. Trần Minh Tâm',
        isFinalized,
        exam: isFinalized
          ? {
              chiefComplaint: 'Khám định kỳ',
              clinicalFindings: 'Ổn định',
              icd10Code: 'Z00',
              icd10Diagnosis: 'Khám sức khỏe tổng quát',
              treatmentPlan: 'Tái khám sau 1 tháng',
            }
          : null,
        finalizedAt: isFinalized ? '2026-11-25T14:30:00+07:00' : null,
        recipient: { id: 'rep-1', name: 'Nguyễn Văn A' },
        prescription: null,
        patient: {
          id: patientId || 'pat-1',
          fullName: patientId === 'pat-2' ? 'Trần Thị B' : 'Nguyễn Văn A',
          familyId: 'fam-1',
          dateOfBirth: '1958-01-01',
          relationshipToHead: 'HEAD',
        },
      } as any;
    });
    vi.mocked(medicalBooksApi.confirm).mockResolvedValue({ ok: true } as any);
    vi.mocked(patientsApi.addMemberVitalSign).mockResolvedValue({} as any);
    vi.mocked(patientsApi.addMemberAllergy).mockResolvedValue({} as any);
    vi.mocked(patientsApi.updateFamilyMember).mockResolvedValue({} as any);
  });

  it('Fallback participants: vẫn hiển thị thành viên Chủ hộ và mở ngay 5 ô bắt buộc khi contract.members rỗng', async () => {
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValueOnce({
      ...sampleEncounter,
      clinicalEmrs: [],
      contract: {
        ...sampleEncounter.contract,
        members: [],
      },
      participants: [
        {
          id: 'part-1',
          patientId: 'pat-head-1',
          patient: {
            id: 'pat-head-1',
            fullName: 'Nguyễn Văn Chủ Hộ',
            dateOfBirth: '1960-01-01',
            gender: 'MALE',
            chronicDiseases: null,
            allergies: [],
          },
        },
      ],
    } as any);

    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByText('THÀNH VIÊN KHÁM')).toBeInTheDocument();
    });

    expect(screen.queryByText(/Chưa có thành viên trong hộ gia đình\./i)).not.toBeInTheDocument();
    expect(screen.getByText('Đã chọn: 1 người')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Chọn khám Nguyễn Văn Chủ Hộ/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Lý do khám/i)).toBeInTheDocument();
  });

  it('Bố cục 2 cột tối giản: bỏ stepper 4 bước, mở sẵn 5 ô bắt buộc và thu gọn 2 mục tùy chọn mặc định', async () => {
    const user = userEvent.setup();
    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByText('THÀNH VIÊN KHÁM')).toBeInTheDocument();
    });

    expect(screen.queryByText(/1\. Chọn thành viên/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Đã xác nhận có đến/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã chốt: 1\//i)).toBeInTheDocument();

    // 5 required fields visible by default
    expect(screen.getByLabelText(/Lý do khám/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Triệu chứng & Khám thực thể/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã ICD-10/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chẩn đoán/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dặn dò \/ Kế hoạch điều trị/i)).toBeInTheDocument();

    // 2 optional sections collapsed by default
    expect(screen.queryByLabelText(/Huyết áp tâm thu/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Tên thuốc/i)).not.toBeInTheDocument();

    // Expand optional vitals & prescription sections
    await user.click(screen.getByRole('button', { name: /Chỉ số sinh tồn & Bệnh nền \/ Dị ứng mới/i }));
    expect(screen.getByLabelText(/Huyết áp tâm thu/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Kê đơn thuốc điện tử cho lần khám này/i }));
    expect(screen.getByLabelText(/Tên thuốc/i)).toBeInTheDocument();
  });

  it('Lưu nháp, chốt hồ sơ không đơn thuốc (đồng bộ sinh hiệu + dị ứng), và chốt hồ sơ kèm đơn thuốc gửi đúng payload', async () => {
    const user = userEvent.setup();
    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Lý do khám/i)).toBeInTheDocument();
    });

    // Save draft
    await user.type(screen.getByLabelText(/Lý do khám/i), 'Đau đầu nhẹ buổi sáng');
    await user.click(screen.getByRole('button', { name: /Chỉ số sinh tồn & Bệnh nền \/ Dị ứng mới/i }));
    await user.type(screen.getByLabelText(/Huyết áp tâm thu/i), '145');
    await user.type(screen.getByLabelText(/Huyết áp tâm trương/i), '90');
    await user.click(screen.getByRole('button', { name: /Lưu Nháp/i }));

    expect(medicalBooksApi.confirm).not.toHaveBeenCalled();
    expect(patientsApi.addMemberVitalSign).not.toHaveBeenCalled();
    const rawDraft = localStorage.getItem('famidoc_visit_draft:enc-ws-1:pat-1');
    expect(rawDraft).toContain('Đau đầu nhẹ buổi sáng');
    expect(rawDraft).toContain('145');

    // Finalize without prescription
    await user.type(screen.getByLabelText(/Chẩn đoán/i), 'Tăng huyết áp vô căn');
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
        expect.objectContaining({ systolicBp: 145, diastolicBp: 90 }),
      );
      expect(patientsApi.addMemberAllergy).toHaveBeenCalledWith(
        'pat-1',
        expect.objectContaining({ allergenName: 'Penicillin' }),
      );
    });

    // Switch to pat-3 and finalize WITH prescription
    await user.click(screen.getByRole('button', { name: /Nguyễn Văn C/i }));
    await waitFor(() => {
      expect(screen.getByText(/Đang làm việc với: Nguyễn Văn C/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Kê đơn thuốc điện tử cho lần khám này/i }));
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
          patientId: 'pat-3',
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

  it('Hiển thị thẻ tóm tắt chỉ đọc gọn gàng kèm link Xem / Kê đơn thay thế khi chọn thành viên đã chốt', async () => {
    const user = userEvent.setup();
    render(<DoctorEncountersView encounterId="enc-ws-1" />);

    await waitFor(() => {
      expect(screen.getByText('THÀNH VIÊN KHÁM')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Trần Thị B/i }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Xem \/ Kê đơn thay thế/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Lưu Nháp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^✓ Chốt hồ sơ/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Khám sức khỏe tổng quát/i)).toBeInTheDocument();
  });
});
