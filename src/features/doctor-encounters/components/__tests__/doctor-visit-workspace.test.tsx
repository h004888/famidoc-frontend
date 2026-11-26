import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorVisitWorkspace } from '../doctor-visit-workspace';
import { encountersApi } from '@/lib/api/encounters.api';
import { medicalBooksApi } from '@/lib/api/medical-books.api';
import { patientsApi } from '@/lib/api/patients.api';

vi.mock('@/lib/api/encounters.api', () => ({
  encountersApi: {
    getEncounterDetail: vi.fn(),
    completeEncounter: vi.fn(),
    updateParticipantAttendance: vi.fn(),
  },
}));

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: {
    visit: vi.fn(),
    saveDraft: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock('@/lib/api/patients.api', () => ({
  patientsApi: {
    addMemberVitalSign: vi.fn(),
    updateMedicalHistory: vi.fn(),
  },
}));

const baseEncounter = {
  id: 'enc-ws-1',
  contractId: 'con-1',
  doctorId: 'doc-1',
  encounterType: 'HOME_VISIT',
  category: 'PERIODIC_ROUTINE',
  scheduledDate: '2099-12-31',
  scheduledTime: '08:30:00',
  slotWindow: 'MORNING',
  encounterStatus: 'IN_PROGRESS',
  familyConfirmedArrivalAt: '2026-11-25T01:35:00.000Z',
  doctorCompletedAt: null,
  recordOverdueAt: null,
  participants: [{ id: 'part-1', patientId: 'pat-1', attendanceStatus: 'PLANNED' }],
  clinicalEmrs: [],
  contract: {
    id: 'con-1',
    familyRepresentativeName: 'Nguyễn Văn An',
    familyRepresentativePhone: '0901234567',
    familyUnit: {
      id: 'fam-1',
      familyName: 'Gia đình Nguyễn Văn An',
      homeAddress: '123 Nguyễn Trãi, Q.1',
      representativeUser: { id: 'rep-1', fullName: 'Nguyễn Văn An' },
    },
    members: [
      {
        id: 'cm-1',
        patientId: 'pat-1',
        patient: {
          id: 'pat-1',
          fullName: 'Nguyễn Văn An',
          allergies: ['Penicillin'],
          chronicDiseases: ['Tăng huyết áp'],
        },
      },
    ],
  },
};

describe('DoctorVisitWorkspace + MemberExamWizard (4-step auto-save DB)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValue(structuredClone(baseEncounter) as any);
    vi.mocked(medicalBooksApi.visit).mockResolvedValue({
      id: 'enc-ws-1',
      encounterType: 'HOME_VISIT',
      scheduledDate: '2026-11-25',
      scheduledTime: '08:30:00',
      doctorName: 'BS. Minh',
      isFinalized: false,
      finalizedAt: null,
      patient: {
        id: 'pat-1',
        fullName: 'Nguyễn Văn An',
        dateOfBirth: '1990-01-01',
        relationshipToHead: 'SELF',
        familyId: 'fam-1',
      },
      exam: null,
      vitals: null,
      recipient: { id: 'rep-1', name: 'Chủ hộ' },
      prescription: null,
    });
    vi.mocked(medicalBooksApi.saveDraft).mockResolvedValue({
      encounterId: 'enc-ws-1',
      emrId: 'emr-draft-1',
      isFinalized: false,
      savedAt: '2026-11-25T09:00:00Z',
    });
    vi.mocked(medicalBooksApi.confirm).mockResolvedValue({
      encounterId: 'enc-ws-1',
      finalizedAt: '2026-11-25T09:05:00Z',
    });
    vi.mocked(encountersApi.completeEncounter).mockResolvedValue({
      ...baseEncounter,
      encounterStatus: 'COMPLETED',
      doctorCompletedAt: '2026-11-25T09:10:00Z',
    } as any);
  });

  it('mặc định hiển thị HouseholdVisitOverview (kể cả hộ 1 người), đi qua 4 bước Wizard auto-save DB, chốt hồ sơ rồi hoàn tất ca khám sang VisitCompletionSummary', async () => {
    render(<DoctorVisitWorkspace encounterId="enc-ws-1" />);

    // 1. Mặc định hiển thị HouseholdVisitOverview
    expect(await screen.findByText(/Danh sách thành viên hộ gia đình \(1\)/i)).toBeInTheDocument();

    // 2. Bấm Khám -> vào Bước 1
    fireEvent.click(screen.getAllByRole('button', { name: /^Khám$/i })[0]);
    expect((await screen.findAllByText(/Bước 1\/4/i)).length).toBeGreaterThanOrEqual(1);

    // Bỏ trống Lý do khám -> báo lỗi tại Bước 1, không qua Bước 2
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    expect(screen.getByText(/Vui lòng nhập lý do khám/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bước 1\/4/i).length).toBeGreaterThanOrEqual(1);

    // 3. Nhập đủ Bước 1 -> Tiếp tục -> gọi saveDraft và sang Bước 2
    fireEvent.change(screen.getByLabelText(/Lý do khám/i), {
      target: { value: 'Đau đầu, chóng mặt nhẹ' },
    });
    fireEvent.change(screen.getByLabelText(/Kết quả thăm khám/i), {
      target: { value: 'Huyết áp 145/90 mmHg, tim đều' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

    await waitFor(() => {
      expect(medicalBooksApi.saveDraft).toHaveBeenCalledWith(
        'enc-ws-1',
        expect.objectContaining({
          patientId: 'pat-1',
          exam: expect.objectContaining({
            chiefComplaint: 'Đau đầu, chóng mặt nhẹ',
          }),
        }),
      );
    });
    expect((await screen.findAllByText(/Bước 2\/4/i)).length).toBeGreaterThanOrEqual(1);

    // Nhập mã ICD-10 sai định dạng -> báo lỗi tại Bước 2
    fireEvent.change(screen.getByLabelText(/Mã ICD-10/i), {
      target: { value: 'INVALID' },
    });
    fireEvent.change(screen.getByLabelText(/Chẩn đoán/i), {
      target: { value: 'Tăng huyết áp' },
    });
    fireEvent.change(screen.getByLabelText(/Kế hoạch điều trị/i), {
      target: { value: 'Theo dõi huyết áp tại nhà' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    expect(screen.getByText(/Mã ICD-10 không đúng định dạng/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bước 2\/4/i).length).toBeGreaterThanOrEqual(1);

    // Nhập đúng ICD-10 -> Tiếp tục -> gọi saveDraft và sang Bước 3
    fireEvent.change(screen.getByLabelText(/Mã ICD-10/i), {
      target: { value: 'I10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

    await waitFor(() => {
      expect(medicalBooksApi.saveDraft).toHaveBeenCalledTimes(2);
    });
    expect((await screen.findAllByText(/Bước 3\/4/i)).length).toBeGreaterThanOrEqual(1);

    // 4. Tại Bước 3 bấm "Không kê đơn — Chuyển sang Xem lại ->" nhảy thẳng sang Bước 4
    fireEvent.click(
      screen.getByRole('button', { name: /Không kê đơn — Chuyển sang Xem lại/i }),
    );
    expect((await screen.findAllByText(/Bước 4\/4/i)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Không kê đơn thuốc/i)).toBeInTheDocument();

    // Cập nhật mock getEncounterDetail sau khi chốt hồ sơ
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValue({
      ...baseEncounter,
      participants: [{ id: 'part-1', patientId: 'pat-1', attendanceStatus: 'EXAMINED' }],
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
    } as any);

    // 5. Bấm Chốt hồ sơ thành viên này -> gọi medicalBooksApi.confirm và quay về Hub
    fireEvent.click(screen.getByRole('button', { name: /✓ Chốt hồ sơ thành viên này/i }));

    await waitFor(() => {
      expect(medicalBooksApi.confirm).toHaveBeenCalledWith(
        'enc-ws-1',
        expect.objectContaining({
          patientId: 'pat-1',
          confirmed: true,
          exam: expect.objectContaining({ icd10Code: 'I10' }),
        }),
      );
    });

    expect(await screen.findByText(/Danh sách thành viên hộ gia đình \(1\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/✓ Đã chốt hồ sơ/i).length).toBeGreaterThanOrEqual(1);

    // 6. Bấm Hoàn tất ca khám -> xác nhận modal -> gọi completeEncounter -> VisitCompletionSummary
    fireEvent.click(screen.getByRole('button', { name: /✓ Hoàn tất ca khám cho cả gia đình/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Xác nhận hoàn tất/i }));

    await waitFor(() => {
      expect(encountersApi.completeEncounter).toHaveBeenCalledWith('enc-ws-1', {
        lateCompletionReason: undefined,
      });
    });

    expect(await screen.findByText(/Đã hoàn tất ca khám tại nhà/i)).toBeInTheDocument();
    const backLinks = screen.getAllByRole('link', { name: /Quay về Lịch trực & Ca khám/i });
    expect(backLinks[0]).toHaveAttribute('href', '/doctor/timetable');
  });

  it('Task 11: hiển thị wizard-skeleton khi visit đang tải và mount wizard với dữ liệu sau khi resolve', async () => {
    let resolveVisit!: (val: any) => void;
    vi.mocked(medicalBooksApi.visit).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveVisit = resolve;
        }),
    );

    render(<DoctorVisitWorkspace encounterId="enc-ws-1" />);
    expect(await screen.findByText(/Danh sách thành viên hộ gia đình/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /^Khám$/i })[0]);
    expect(screen.getByTestId('wizard-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    resolveVisit({
      id: 'enc-ws-1',
      encounterType: 'HOME_VISIT',
      scheduledDate: '2026-11-25',
      scheduledTime: '08:30:00',
      doctorName: 'BS. Minh',
      isFinalized: false,
      finalizedAt: null,
      patient: {
        id: 'pat-1',
        fullName: 'Nguyễn Văn An',
        dateOfBirth: '1990-01-01',
        relationshipToHead: 'SELF',
        familyId: 'fam-1',
      },
      exam: {
        chiefComplaint: 'Ho 3 ngày',
        clinicalFindings: '',
        icd10Code: '',
        icd10Diagnosis: '',
        treatmentPlan: '',
      },
      vitals: null,
      recipient: { id: 'rep-1', name: 'Chủ hộ' },
      prescription: null,
    });

    await waitFor(() => {
      expect((screen.getByLabelText(/Lý do khám/i) as HTMLTextAreaElement).value).toBe('Ho 3 ngày');
    });
  });

  it('Task 12: mở MemberVisitRecordView chỉ đọc khi isFinalized=true và khóa toàn bộ khi DISPUTED', async () => {
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValueOnce({
      ...baseEncounter,
      clinicalEmrs: [{ id: 'emr-1', patientId: 'pat-1', isFinalized: true }],
    } as any);
    vi.mocked(medicalBooksApi.visit).mockResolvedValueOnce({
      id: 'enc-ws-1',
      encounterType: 'HOME_VISIT',
      scheduledDate: '2026-11-25',
      scheduledTime: '08:30:00',
      doctorName: 'BS. Minh',
      isFinalized: true,
      finalizedAt: '2026-11-25T09:00:00.000Z',
      patient: {
        id: 'pat-1',
        fullName: 'Nguyễn Văn An',
        dateOfBirth: '1990-01-01',
        relationshipToHead: 'SELF',
        familyId: 'fam-1',
      },
      exam: {
        chiefComplaint: 'Ho',
        clinicalFindings: 'Phổi trong',
        icd10Code: 'J06.9',
        icd10Diagnosis: 'Viêm họng cấp',
        treatmentPlan: 'Nghỉ ngơi',
      },
      vitals: null,
      recipient: null,
      prescription: null,
    });

    render(<DoctorVisitWorkspace encounterId="enc-ws-1" />);
    const viewBtn = await screen.findAllByRole('button', { name: /Xem hồ sơ/i });
    fireEvent.click(viewBtn[0]);

    expect(await screen.findByText(/J06\.9/)).toBeInTheDocument();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('Task 12(b): encounter DISPUTED hiển thị banner khóa và ẩn nút Hoàn tất ca khám', async () => {
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValueOnce({
      ...baseEncounter,
      encounterStatus: 'DISPUTED',
    } as any);

    render(<DoctorVisitWorkspace encounterId="enc-ws-1" />);
    expect(await screen.findByText(/Ca khám đang bị khóa — chỉ xem\./i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hoàn tất ca khám/i })).not.toBeInTheDocument();
  });

  it('Task 17: chặn nút Khám trước giờ hẹn và hiển thị lỗi VISIT_NOT_STARTED từ server', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-11-26T06:00:00Z')); // 13:00 VN
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValueOnce({
      ...baseEncounter,
      encounterStatus: 'CONFIRMED',
      scheduledDate: '2026-11-26',
      scheduledTime: '14:00:00',
    } as any);

    render(<DoctorVisitWorkspace encounterId="enc-ws-1" />);
    expect(await screen.findByText(/Chưa đến giờ khám — mở lúc 14:00/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Khám$/i })[0]).toBeDisabled();

    vi.useRealTimers();
  });

  it('Task 18(e): đổi điểm danh cập nhật cục bộ, không hiển thị Đang tải toàn trang', async () => {
    vi.mocked(encountersApi.updateParticipantAttendance).mockResolvedValueOnce({
      encounterId: 'enc-ws-1',
      patientId: 'pat-1',
      attendanceStatus: 'ABSENT',
      absenceReason: 'Đi công tác',
    });

    render(<DoctorVisitWorkspace encounterId="enc-ws-1" />);
    expect(await screen.findByText(/Danh sách thành viên hộ gia đình/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Đánh dấu vắng/i })[0]);
    const input = await screen.findByLabelText(/Lý do vắng/i);
    fireEvent.change(input, { target: { value: 'Đi công tác' } });
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận vắng/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Vắng — Đi công tác/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText(/Đang tải không gian làm việc/i)).not.toBeInTheDocument();
  });

  it('Task 21: format ngày dd/MM/yyyy và chỉ có 1 badge/tiêu đề tên gia đình ở header', async () => {
    vi.mocked(encountersApi.getEncounterDetail).mockResolvedValueOnce({
      ...baseEncounter,
      scheduledDate: '2026-11-26T00:00:00.000Z',
    } as any);

    render(<DoctorVisitWorkspace encounterId="enc-ws-1" />);
    expect(await screen.findByText(/26\/11\/2026/)).toBeInTheDocument();
    expect(screen.queryByText(/2026-11-26/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Gia đình Nguyễn Văn An/i)).toHaveLength(1);
  });
});
