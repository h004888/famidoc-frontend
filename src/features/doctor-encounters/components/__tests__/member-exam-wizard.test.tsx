import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberExamWizard } from '../member-exam-wizard';
import { medicalBooksApi, type BookVisitDetail } from '@/lib/api/medical-books.api';
import { patientsApi } from '@/lib/api/patients.api';
import type { EncounterItem, EncounterPatient } from '@/lib/api/encounters.api';

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: {
    saveDraft: vi.fn(),
    confirm: vi.fn(),
    visit: vi.fn(),
  },
}));

vi.mock('@/lib/api/patients.api', () => ({
  patientsApi: {
    addMemberVitalSign: vi.fn(),
  },
}));

const baseEncounter: EncounterItem = {
  id: 'enc-1',
  contractId: 'con-1',
  doctorId: 'doc-1',
  scheduledDate: '2026-11-26T00:00:00.000Z',
  scheduledTime: '1970-01-01T08:30:00.000Z',
  encounterType: 'HOME_VISIT',
  category: 'PERIODIC_ROUTINE',
  encounterStatus: 'IN_PROGRESS',
  contract: {
    id: 'con-1',
    familyUnit: {
      id: 'fam-1',
      familyName: 'Gia đình A',
      representativeUser: { id: 'rep-1', name: 'Chủ hộ' },
    },
  },
};

const baseMember: EncounterPatient = {
  id: 'pat-1',
  fullName: 'Nguyễn Văn An',
  dateOfBirth: '1990-01-01',
  gender: 'MALE',
  allergies: [],
};

function makeVisitDetail(overrides: Partial<BookVisitDetail> = {}): BookVisitDetail {
  return {
    id: 'enc-1',
    encounterType: 'HOME_VISIT',
    scheduledDate: '2026-11-26T00:00:00.000Z',
    scheduledTime: '1970-01-01T08:30:00.000Z',
    doctorName: 'BS. Minh',
    isFinalized: false,
    finalizedAt: null,
    patient: {
      id: 'pat-1',
      fullName: 'Nguyễn Văn An',
      dateOfBirth: '1990-01-01',
      relationshipToHead: 'SELF',
      familyId: 'fam-1',
      gender: 'MALE',
    },
    exam: null,
    vitals: null,
    recipient: { id: 'rep-1', name: 'Chủ hộ' },
    prescription: null,
    ...overrides,
  };
}

async function fillStep1AndGoToStep2() {
  fireEvent.change(screen.getByLabelText(/Lý do khám/i), {
    target: { value: 'Ho 3 ngày' },
  });
  fireEvent.change(screen.getByLabelText(/Kết quả thăm khám/i), {
    target: { value: 'Phổi trong' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
  await waitFor(() => {
    expect(screen.getByLabelText(/Mã ICD-10/i)).toBeTruthy();
  });
}

async function fillStep2AndGoToStep3(icd = 'J06.9') {
  fireEvent.change(screen.getByLabelText(/Mã ICD-10/i), {
    target: { value: icd },
  });
  fireEvent.change(screen.getByLabelText(/Chẩn đoán/i), {
    target: { value: 'Viêm họng cấp' },
  });
  fireEvent.change(screen.getByLabelText(/Kế hoạch điều trị/i), {
    target: { value: 'Theo dõi tại nhà' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Thêm thuốc/i })).toBeTruthy();
  });
}

describe('MemberExamWizard (Tasks 10, 13, 14, 14A, 15, 16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(medicalBooksApi.saveDraft).mockResolvedValue({
      encounterId: 'enc-1',
      emrId: 'emr-1',
      isFinalized: false,
      savedAt: '2026-11-26T09:00:00.000Z',
    });
    vi.mocked(medicalBooksApi.confirm).mockResolvedValue({
      encounterId: 'enc-1',
      finalizedAt: '2026-11-26T09:05:00.000Z',
    });
  });

  it('Task 10: lỗi lưu nháp không bị nuốt, giữ bước 1, hiện alert và nút Thử lại', async () => {
    vi.mocked(medicalBooksApi.saveDraft)
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce({
        encounterId: 'enc-1',
        emrId: 'emr-1',
        isFinalized: false,
        savedAt: '2026-11-26T09:00:00.000Z',
      });

    render(
      <MemberExamWizard
        encounterId="enc-1"
        encounter={baseEncounter}
        member={baseMember}
        initialVisitDetail={makeVisitDetail()}
        onBackToOverview={vi.fn()}
        onFinalized={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Lý do khám/i), {
      target: { value: 'Ho' },
    });
    fireEvent.change(screen.getByLabelText(/Kết quả thăm khám/i), {
      target: { value: 'Ổn' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Mất kết nối');
    expect(screen.getByLabelText(/Lý do khám/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Tiếp tục/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Mã ICD-10/i)).toBeTruthy();
    });
  });

  it('Task 13: prefill sinh hiệu DRAFT, gửi weightKg trong saveDraft, validate SpO2, confirm gửi vitals và không gọi addMemberVitalSign', async () => {
    render(
      <MemberExamWizard
        encounterId="enc-1"
        encounter={baseEncounter}
        member={baseMember}
        initialVisitDetail={makeVisitDetail({
          vitals: {
            systolicBp: 118,
            weightKg: 61,
            recordedAt: '2026-11-26T08:00:00.000Z',
            source: 'DRAFT',
          },
        })}
        onBackToOverview={vi.fn()}
        onFinalized={vi.fn()}
      />,
    );

    expect((screen.getByLabelText(/Huyết áp tâm thu/i) as HTMLInputElement).value).toBe('118');
    expect((screen.getByLabelText(/Cân nặng/i) as HTMLInputElement).value).toBe('61');

    fireEvent.change(screen.getByLabelText(/Lý do khám/i), { target: { value: 'Ho' } });
    fireEvent.change(screen.getByLabelText(/Kết quả thăm khám/i), { target: { value: 'Ổn' } });
    fireEvent.change(screen.getByLabelText(/SpO2/i), { target: { value: '150' } });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

    expect((await screen.findByRole('alert')).textContent).toContain('SpO2 phải từ 50 đến 100');
    expect(medicalBooksApi.saveDraft).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/SpO2/i), { target: { value: '98' } });
    fireEvent.change(screen.getByLabelText(/Cân nặng/i), { target: { value: '62.5' } });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

    await waitFor(() => {
      expect(medicalBooksApi.saveDraft).toHaveBeenCalledWith(
        'enc-1',
        expect.objectContaining({
          vitals: expect.objectContaining({ weightKg: 62.5, spo2: 98, systolicBp: 118 }),
        }),
      );
    });

    await fillStep2AndGoToStep3();
    fireEvent.click(screen.getByRole('button', { name: /Không kê đơn/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i }));

    await waitFor(() => {
      expect(medicalBooksApi.confirm).toHaveBeenCalledWith(
        'enc-1',
        expect.objectContaining({
          vitals: expect.objectContaining({ weightKg: 62.5, spo2: 98, systolicBp: 118 }),
        }),
      );
    });
    expect(patientsApi.addMemberVitalSign).not.toHaveBeenCalled();
  });

  it('Task 15: cho phép mã ICD-10 nhóm U (U07.1) và báo lỗi với mã sai (123)', async () => {
    render(
      <MemberExamWizard
        encounterId="enc-1"
        encounter={baseEncounter}
        member={baseMember}
        initialVisitDetail={makeVisitDetail()}
        onBackToOverview={vi.fn()}
        onFinalized={vi.fn()}
      />,
    );

    await fillStep1AndGoToStep2();
    fireEvent.change(screen.getByLabelText(/Mã ICD-10/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Chẩn đoán/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Kế hoạch điều trị/i), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    expect((await screen.findByRole('alert')).textContent).toContain('Mã ICD-10 không đúng định dạng');

    await fillStep2AndGoToStep3('U07.1');
    expect(medicalBooksApi.saveDraft).toHaveBeenLastCalledWith(
      'enc-1',
      expect.objectContaining({
        exam: expect.objectContaining({ icd10Code: 'U07.1' }),
      }),
    );
  });

  it('Task 14 & 14A: đơn thuốc đủ trường, không default ẩn, chặn thiếu người nhận, gửi đủ clinicalContext + activeIngredient', async () => {
    render(
      <MemberExamWizard
        encounterId="enc-1"
        encounter={baseEncounter}
        member={baseMember}
        initialVisitDetail={makeVisitDetail()}
        onBackToOverview={vi.fn()}
        onFinalized={vi.fn()}
      />,
    );

    await fillStep1AndGoToStep2();
    await fillStep2AndGoToStep3();

    fireEvent.change(screen.getByPlaceholderText(/Tên thuốc/i), {
      target: { value: 'Paracetamol' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Liều dùng/i), {
      target: { value: '1 viên' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

    const alertMissing = await screen.findByRole('alert');
    expect(alertMissing.textContent).toContain('Dòng 1: thiếu');
    expect(medicalBooksApi.confirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(/Hoạt chất/i), {
      target: { value: 'Paracetamol' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Hàm lượng/i), {
      target: { value: '500mg' },
    });
    fireEvent.change(screen.getByLabelText(/Đường dùng/i), {
      target: { value: 'Uống' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tần suất/i), {
      target: { value: '3 lần/ngày' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Số ngày/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Tổng số lượng/i), {
      target: { value: '9' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Đơn vị/i), {
      target: { value: 'viên' },
    });

    // Thiếu nơi cư trú -> chặn (Task 14A b)
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Vui lòng nhập nơi cư trú của người bệnh.',
    );

    fireEvent.change(screen.getByLabelText(/Nơi cư trú/i), {
      target: { value: '12 Lê Lợi' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0901234567' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i }));

    await waitFor(() => {
      expect(medicalBooksApi.confirm).toHaveBeenCalledWith(
        'enc-1',
        expect.objectContaining({
          prescription: expect.objectContaining({
            clinicalContext: {
              address: '12 Lê Lợi',
              phone: '0901234567',
              treatmentMode: 'OUTPATIENT',
            },
            details: [
              expect.objectContaining({
                medicationName: 'Paracetamol',
                medicationType: 'SINGLE_INGREDIENT',
                activeIngredient: 'Paracetamol',
                strength: '500mg',
                administrationRoute: 'Uống',
                dosage: '1 viên',
                frequency: '3 lần/ngày',
                durationDays: 3,
                quantity: 9,
                unit: 'viên',
              }),
            ],
          }),
        }),
      );
    });
  });

  it('Task 14(c): encounter thiếu representativeUser + có thuốc -> chặn confirm với thông báo người đại diện', async () => {
    const noRepEncounter: EncounterItem = {
      ...baseEncounter,
      contract: {
        id: 'con-1',
        familyUnit: { id: 'fam-1', familyName: 'Gia đình A' },
      },
    };
    render(
      <MemberExamWizard
        encounterId="enc-1"
        encounter={noRepEncounter}
        member={baseMember}
        initialVisitDetail={makeVisitDetail({ recipient: null })}
        onBackToOverview={vi.fn()}
        onFinalized={vi.fn()}
      />,
    );

    await fillStep1AndGoToStep2();
    await fillStep2AndGoToStep3();

    fireEvent.change(screen.getByPlaceholderText(/Tên thuốc/i), { target: { value: 'Paracetamol' } });
    fireEvent.change(screen.getByPlaceholderText(/Hoạt chất/i), { target: { value: 'Paracetamol' } });
    fireEvent.change(screen.getByPlaceholderText(/Hàm lượng/i), { target: { value: '500mg' } });
    fireEvent.change(screen.getByLabelText(/Đường dùng/i), { target: { value: 'Uống' } });
    fireEvent.change(screen.getByPlaceholderText(/Liều dùng/i), { target: { value: '1 viên' } });
    fireEvent.change(screen.getByPlaceholderText(/Tần suất/i), { target: { value: '2 lần/ngày' } });
    fireEvent.change(screen.getByPlaceholderText(/Số ngày/i), { target: { value: '3' } });
    fireEvent.change(screen.getByPlaceholderText(/Tổng số lượng/i), { target: { value: '6' } });
    fireEvent.change(screen.getByPlaceholderText(/Đơn vị/i), { target: { value: 'viên' } });
    fireEvent.change(screen.getByLabelText(/Nơi cư trú/i), { target: { value: '12 Lê Lợi' } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0901234567' } });

    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Hộ gia đình chưa có người đại diện nhận đơn',
    );
    expect(medicalBooksApi.confirm).not.toHaveBeenCalled();
  });

  it('Task 14A(c)(d)(e)(f): trẻ < 72 tháng prefill cân nặng từ sinh hiệu, chặn thiếu người đưa trẻ/hoạt chất, không có thuốc thì bỏ prescription', async () => {
    const childMember: EncounterPatient = {
      ...baseMember,
      id: 'pat-child',
      fullName: 'Bé B',
      dateOfBirth: '2024-06-01',
    };
    const childVisit = makeVisitDetail({
      patient: {
        id: 'pat-child',
        fullName: 'Bé B',
        dateOfBirth: '2024-06-01',
        relationshipToHead: 'CHILD',
        familyId: 'fam-1',
        gender: 'FEMALE',
      },
      vitals: {
        weightKg: 14,
        recordedAt: '2026-11-26T08:00:00.000Z',
        source: 'DRAFT',
      },
    });

    render(
      <MemberExamWizard
        encounterId="enc-1"
        encounter={baseEncounter}
        member={childMember}
        initialVisitDetail={childVisit}
        onBackToOverview={vi.fn()}
        onFinalized={vi.fn()}
      />,
    );

    await fillStep1AndGoToStep2();
    await fillStep2AndGoToStep3();

    expect(screen.queryByLabelText(/Thông tin đơn thuốc/i)).toBeNull();

    fireEvent.change(screen.getByPlaceholderText(/Tên thuốc/i), { target: { value: 'Amoxicillin' } });
    fireEvent.change(screen.getByPlaceholderText(/Hàm lượng/i), { target: { value: '250mg' } });
    fireEvent.change(screen.getByLabelText(/Đường dùng/i), { target: { value: 'Uống' } });
    fireEvent.change(screen.getByPlaceholderText(/Liều dùng/i), { target: { value: '1 gói' } });
    fireEvent.change(screen.getByPlaceholderText(/Tần suất/i), { target: { value: '2 lần/ngày' } });
    fireEvent.change(screen.getByPlaceholderText(/Số ngày/i), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText(/Tổng số lượng/i), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText(/Đơn vị/i), { target: { value: 'gói' } });
    fireEvent.change(screen.getByLabelText(/Nơi cư trú/i), { target: { value: '12 Lê Lợi' } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0901234567' } });

    expect((screen.getByLabelText(/Cân nặng \(kg\)/i) as HTMLInputElement).value).toBe('14');

    // Thiếu hoạt chất
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Thuốc 1: vui lòng nhập tên hoạt chất (INN).',
    );

    fireEvent.change(screen.getByPlaceholderText(/Hoạt chất/i), { target: { value: 'Amoxicillin' } });
    // Xóa cân nặng -> chặn trẻ < 72 tháng
    fireEvent.change(screen.getByLabelText(/Cân nặng \(kg\)/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Trẻ dưới 72 tháng tuổi cần có cân nặng và họ tên người đưa trẻ đến khám.',
    );
  });

  it('Task 16: cảnh báo dị ứng thuốc và disable nút chốt tới khi tick xác nhận', async () => {
    const allergicMember: EncounterPatient = {
      ...baseMember,
      allergies: [{ allergen: 'Amoxicilin', severity: 'SEVERE', allergenType: 'DRUG' } as any],
    };

    render(
      <MemberExamWizard
        encounterId="enc-1"
        encounter={baseEncounter}
        member={allergicMember}
        initialVisitDetail={makeVisitDetail()}
        onBackToOverview={vi.fn()}
        onFinalized={vi.fn()}
      />,
    );

    await fillStep1AndGoToStep2();
    await fillStep2AndGoToStep3();

    fireEvent.change(screen.getByPlaceholderText(/Tên thuốc/i), { target: { value: 'Amoxicillin 500mg' } });
    fireEvent.change(screen.getByPlaceholderText(/Hoạt chất/i), { target: { value: 'amoxicilin' } });
    fireEvent.change(screen.getByPlaceholderText(/Hàm lượng/i), { target: { value: '500mg' } });
    fireEvent.change(screen.getByLabelText(/Đường dùng/i), { target: { value: 'Uống' } });
    fireEvent.change(screen.getByPlaceholderText(/Liều dùng/i), { target: { value: '1 viên' } });
    fireEvent.change(screen.getByPlaceholderText(/Tần suất/i), { target: { value: '2 lần/ngày' } });
    fireEvent.change(screen.getByPlaceholderText(/Số ngày/i), { target: { value: '5' } });
    fireEvent.change(screen.getByPlaceholderText(/Tổng số lượng/i), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText(/Đơn vị/i), { target: { value: 'viên' } });
    fireEvent.change(screen.getByLabelText(/Nơi cư trú/i), { target: { value: '12 Lê Lợi' } });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0901234567' } });

    expect(screen.getByText(/Cảnh báo xung đột dị ứng/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i })).toBeTruthy();
    });

    const confirmBtn = screen.getByRole('button', { name: /Chốt hồ sơ thành viên này/i });
    expect(confirmBtn).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/Tôi đã kiểm tra dị ứng và vẫn kê thuốc này/i));
    expect(confirmBtn).not.toBeDisabled();
  });
});
