import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRestrictedFamilyPath } from '@/components/layout/family-subscription-gate';
import { DoctorEncountersView } from '@/features/doctor-encounters/components/doctor-encounters-view';
import { FamilyNotificationsView } from '@/features/notifications/components/family-notifications-view';
import { httpClient } from '@/lib/api/http-client';
import { medicalBooksApi, type BookVisitDetail } from '@/lib/api/medical-books.api';
import { prescriptionsApi } from '@/lib/api/prescriptions.api';
import { FamilyPrescriptionDetailView } from '../family-prescriptions-view';
import { MedicalBookView } from '../medical-book-view';

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: { families: vi.fn(), visits: vi.fn(), visit: vi.fn(), documents: vi.fn(), uploadDocument: vi.fn(), confirm: vi.fn() },
}));

vi.mock('@/lib/api/prescriptions.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/prescriptions.api')>()),
  prescriptionsApi: {
    listVisits: vi.fn(),
    share: vi.fn(),
    familyDetail: vi.fn(),
  },
}));

vi.mock('@/lib/api/http-client', () => ({
  httpClient: { get: vi.fn(), patch: vi.fn() },
}));

describe('Chia sẻ đơn thuốc với gia đình', () => {
  beforeEach(() => vi.resetAllMocks());

  const fiveFamilies = Array.from({ length: 5 }, (_, index) => ({
    id: `family-${index + 1}`,
    representativeName: `Đại diện ${index + 1}`,
    members: [
      { id: `patient-${index + 1}`, fullName: `Thành viên ${index + 1}`, dateOfBirth: '1990-01-01', relationshipToHead: 'SELF' },
      { id: `child-${index + 1}`, fullName: `Con ${index + 1}`, dateOfBirth: '2016-01-01', relationshipToHead: 'CHILD' },
    ],
  }));
  const visit: BookVisitDetail = {
    id: 'visit-1', scheduledDate: '2026-11-10T00:00:00.000Z', scheduledTime: '1970-01-01T08:00:00.000Z', encounterType: 'HOME_VISIT',
    patient: { ...fiveFamilies[4].members[1], familyId: fiveFamilies[4].id },
    recipient: { id: 'recipient-5', name: 'Đại diện 5' },
    doctorName: 'Bác sĩ mẫu', isFinalized: false, finalizedAt: null, prescription: null,
    exam: { chiefComplaint: 'Lý do mẫu', clinicalFindings: 'Kết quả mẫu', icd10Code: 'Z00.0', icd10Diagnosis: 'Khám tổng quát', treatmentPlan: 'Kế hoạch mẫu' },
  };

  function mockBook() {
    const page = { items: [{ ...visit, diagnosis: null }], hasNextPage: false };
    vi.mocked(medicalBooksApi.families).mockResolvedValue({ items: fiveFamilies, hasNextPage: false });
    vi.mocked(medicalBooksApi.visits).mockResolvedValue(page);
    vi.mocked(medicalBooksApi.visit).mockResolvedValue(visit);
    vi.mocked(medicalBooksApi.confirm).mockResolvedValue({ encounterId: visit.id, finalizedAt: '2026-11-18T08:00:00Z' });
  }

  it('yêu cầu bác sĩ xác nhận người nhận và gửi dữ liệu dòng thuốc qua API', async () => {
    mockBook();
    vi.mocked(medicalBooksApi.visit).mockResolvedValueOnce(visit).mockResolvedValue({ ...visit, isFinalized: true });
    render(<DoctorEncountersView />);
    expect(await screen.findAllByRole('button', { name: /Đại diện [1-5]/ })).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: /Đại diện 1/ }));
    expect(screen.getByRole('button', { name: /Thành viên 1/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Đại diện 5/ }));
    expect(screen.queryByRole('button', { name: /Thành viên 1/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Con 5/ }));
    expect(medicalBooksApi.visits).toHaveBeenCalledWith('family-5', 'child-5', 1, expect.any(AbortSignal));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Kê đơn cho lần khám này' }));
    const submit = await screen.findByRole('button', {
      name: 'Xác nhận và gửi đơn',
    });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/Người nhận đơn/)).toHaveTextContent('Đại diện 5');
    for (const [label, value] of [
      ['Tên thuốc', 'Thuốc mẫu'],
      ['Hàm lượng / nồng độ', 'Hàm lượng mẫu'],
      ['Đường dùng', 'Đường dùng mẫu'],
      ['Liều mỗi lần', 'Liều mẫu'],
      ['Tần suất và thời điểm dùng', 'Tần suất mẫu'],
      ['Số ngày dùng', '3'],
      ['Tổng số lượng', '6'],
      ['Đơn vị', 'Đơn vị mẫu'],
      ['Lời dặn', 'Lời dặn mẫu'],
    ]) {
      fireEvent.change(screen.getByLabelText(label, { exact: true }), {
        target: { value },
      });
    }
    fireEvent.click(screen.getByRole('checkbox', { name: /Tôi xác nhận nội dung/ }));
    fireEvent.click(submit);

    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
    expect(medicalBooksApi.confirm).toHaveBeenCalledWith('visit-1', {
      patientId: 'child-5', confirmed: true,
      prescription: {
        recipientUserId: 'recipient-5', recipientAuthorized: true, instructions: 'Lời dặn mẫu',
        details: [{
          medicationName: 'Thuốc mẫu', strength: 'Hàm lượng mẫu', administrationRoute: 'Đường dùng mẫu', dosage: 'Liều mẫu',
          frequency: 'Tần suất mẫu', durationDays: 3, quantity: 6, unit: 'Đơn vị mẫu',
        }],
      },
    });
  });

  it('xác nhận lần khám không có đơn thuốc', async () => {
    mockBook();
    render(<DoctorEncountersView />);
    fireEvent.click(await screen.findByRole('button', { name: /Đại diện 5/ }));
    fireEvent.click(screen.getByRole('button', { name: /Con 5/ }));
    fireEvent.click(await screen.findByRole('checkbox', { name: /Tôi xác nhận nội dung/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trang khám' }));
    await waitFor(() => expect(medicalBooksApi.confirm).toHaveBeenCalledWith('visit-1', { patientId: 'child-5', confirmed: true }));
  });

  it('mở đúng lần khám từ phòng video và tải lại sau khi xác nhận', async () => {
    mockBook();
    vi.mocked(medicalBooksApi.visit)
      .mockResolvedValueOnce(visit)
      .mockResolvedValue({ ...visit, isFinalized: true });

    render(<DoctorEncountersView encounterId="visit-1" patientId="child-5" />);

    expect(await screen.findByText('Con 5 · Bác sĩ mẫu')).toBeInTheDocument();
    expect(medicalBooksApi.visit).toHaveBeenCalledWith('visit-1', expect.any(AbortSignal));
    expect(medicalBooksApi.families).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Tôi xác nhận nội dung/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận trang khám' }));

    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
    expect(medicalBooksApi.confirm).toHaveBeenCalledWith('visit-1', { patientId: 'child-5', confirmed: true });
  });

  it('gia đình lật lại trang cũ và xem tài liệu của đúng người', async () => {
    mockBook();
    const older = { ...visit, id: 'older-visit', scheduledDate: '2026-11-09T00:00:00Z', isFinalized: true };
    vi.mocked(medicalBooksApi.families).mockResolvedValue({ items: [fiveFamilies[4]], hasNextPage: false });
    vi.mocked(medicalBooksApi.visits).mockResolvedValue({ items: [{ ...visit, diagnosis: null, isFinalized: true }, { ...older, diagnosis: null }], hasNextPage: false });
    vi.mocked(medicalBooksApi.visit).mockImplementation(async (id) => ({ ...(id === older.id ? older : visit), isFinalized: true }));
    vi.mocked(medicalBooksApi.documents).mockResolvedValue([{ id: 'doc-5', documentName: 'Tài liệu mẫu', documentType: 'LAB_RESULT', fileUrl: 'https://example.invalid/result.pdf', recordedDate: '2026-11-10', downloadAvailable: false }]);
    render(<MedicalBookView doctor={false} initialPatientId="child-5" />);
    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Xác nhận trang khám' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /09\/11\/2026/ }));
    await waitFor(() => expect(medicalBooksApi.visit).toHaveBeenLastCalledWith('older-visit', expect.any(AbortSignal)));
    fireEvent.click(screen.getByRole('button', { name: 'Tài liệu' }));
    expect(await screen.findByRole('link', { name: /Mở tài liệu Tài liệu mẫu/ })).toHaveAttribute('href', 'https://example.invalid/result.pdf');
    expect(screen.getByText('Tải tài liệu cho thành viên này')).toBeInTheDocument();
    expect(medicalBooksApi.documents).toHaveBeenCalledWith('family-5', 'child-5', expect.any(AbortSignal));
  });

  it('mở đúng đơn thuốc từ thông báo API và lưu trạng thái đã đọc', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      success: true,
      data: {
        total: 1,
        unreadCount: 1,
        items: [
          {
            id: 'notify-1',
            type: 'PRESCRIPTION_SHARED',
            referenceId: 'rx-1',
            isRead: false,
            title: 'Bác sĩ đã gửi đơn thuốc',
            content: 'Mở hồ sơ để xem đơn và lời dặn.',
            createdAt: '2026-11-18T08:00:00.000Z',
          },
        ],
      },
    });
    vi.mocked(httpClient.patch).mockResolvedValue({});

    render(<FamilyNotificationsView userId="family-1" />);
    const action = await screen.findByRole('link', { name: 'Xem đơn thuốc' });
    expect(action).toHaveAttribute('href', '/family/prescriptions/rx-1');
    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' }));
    await waitFor(() =>
      expect(httpClient.patch).toHaveBeenCalledWith(
        '/api/v1/notifications/notify-1/read',
      ),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Đơn thuốc' }),
    );
    await waitFor(() =>
      expect(httpClient.get).toHaveBeenLastCalledWith(
        '/api/v1/notifications',
        expect.objectContaining({ type: 'PRESCRIPTION_SHARED' }),
        expect.any(Object),
      ),
    );
  });

  it('hiển thị chỉ dẫn và trạng thái chưa ký số từ bản lưu được chia sẻ', async () => {
    vi.mocked(prescriptionsApi.familyDetail).mockResolvedValue({
      id: 'rx-1',
      prescriptionCode: 'FMD-1',
      prescribedDate: '2026-11-18T00:00:00.000Z',
      createdAt: '2026-11-18T08:00:00.000Z',
      status: 'ISSUED',
      hasSignature: false,
      patient: { id: 'patient-1', fullName: 'Người bệnh mẫu' },
      doctorName: 'Bác sĩ mẫu',
      facilityName: 'Cơ sở mẫu',
      diagnosis: 'Khám tổng quát',
      instructions: 'Lời dặn mẫu',
      details: [
        {
          id: 'drug-1',
          medicationName: 'Thuốc mẫu',
          strength: 'Hàm lượng mẫu',
          dosage: 'Liều mẫu',
          administrationRoute: 'Đường dùng mẫu',
          frequency: 'Tần suất mẫu',
          quantity: 6,
          unit: 'Đơn vị mẫu',
          durationDays: 3,
        },
      ],
    });

    render(<FamilyPrescriptionDetailView id="rx-1" />);
    expect(await screen.findByText('Bản lưu chưa ký số')).toBeInTheDocument();
    expect(screen.getByText('Thuốc mẫu · Hàm lượng mẫu')).toBeInTheDocument();
    expect(screen.getByText('Lời dặn mẫu')).toBeInTheDocument();
    expect(isRestrictedFamilyPath('/family/prescriptions/rx-1')).toBe(false);
    expect(isRestrictedFamilyPath('/family/appointments')).toBe(true);
  });
});
