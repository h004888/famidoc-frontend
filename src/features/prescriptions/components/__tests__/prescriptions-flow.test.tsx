import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRestrictedFamilyPath } from '@/components/layout/family-subscription-gate';
import { DoctorEncountersView } from '@/features/doctor-encounters/components/doctor-encounters-view';
import { FamilyNotificationsView } from '@/features/notifications/components/family-notifications-view';
import { httpClient } from '@/lib/api/http-client';
import {
  medicalBooksApi,
  type BookVisitDetail,
} from '@/lib/api/medical-books.api';
import { prescriptionsApi } from '@/lib/api/prescriptions.api';
import { FamilyPrescriptionDetailView } from '../family-prescriptions-view';
import { DoctorBookVisitView, MedicalBookView } from '../medical-book-view';

vi.mock('@/lib/api/medical-books.api', () => ({
  medicalBooksApi: {
    families: vi.fn(),
    visits: vi.fn(),
    visit: vi.fn(),
    documents: vi.fn(),
    uploadDocument: vi.fn(),
    confirm: vi.fn(),
  },
}));

vi.mock('@/lib/api/prescriptions.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/prescriptions.api')>()),
  prescriptionsApi: {
    listVisits: vi.fn(),
    share: vi.fn(),
    replace: vi.fn(),
    downloadRecord: vi.fn(),
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
      {
        id: `patient-${index + 1}`,
        fullName: `Thành viên ${index + 1}`,
        dateOfBirth: '1990-01-01',
        relationshipToHead: 'SELF',
      },
      {
        id: `child-${index + 1}`,
        fullName: `Con ${index + 1}`,
        dateOfBirth: '2016-01-01',
        relationshipToHead: 'CHILD',
      },
    ],
  }));
  const visit: BookVisitDetail = {
    id: 'visit-1',
    scheduledDate: '2026-11-10T00:00:00.000Z',
    scheduledTime: '1970-01-01T08:00:00.000Z',
    encounterType: 'HOME_VISIT',
    patient: { ...fiveFamilies[4].members[1], familyId: fiveFamilies[4].id },
    recipient: { id: 'recipient-5', name: 'Đại diện 5' },
    doctorName: 'Bác sĩ mẫu',
    isFinalized: false,
    finalizedAt: null,
    prescription: null,
    exam: {
      chiefComplaint: 'Lý do mẫu',
      clinicalFindings: 'Kết quả mẫu',
      icd10Code: 'Z00.0',
      icd10Diagnosis: 'Khám tổng quát',
      treatmentPlan: 'Kế hoạch mẫu',
    },
  };

  function mockBook() {
    const page = { items: [{ ...visit, diagnosis: null }], hasNextPage: false };
    vi.mocked(medicalBooksApi.families).mockResolvedValue({
      items: fiveFamilies,
      hasNextPage: false,
    });
    vi.mocked(medicalBooksApi.visits).mockResolvedValue(page);
    vi.mocked(medicalBooksApi.visit).mockResolvedValue(visit);
    vi.mocked(medicalBooksApi.confirm).mockResolvedValue({
      encounterId: visit.id,
      finalizedAt: '2026-11-18T08:00:00Z',
    });
  }

  it('yêu cầu bác sĩ xác nhận người nhận và gửi dữ liệu dòng thuốc qua API', async () => {
    mockBook();
    vi.mocked(medicalBooksApi.visit)
      .mockResolvedValueOnce(visit)
      .mockResolvedValue({ ...visit, isFinalized: true });
    render(<DoctorEncountersView />);
    expect(
      await screen.findAllByRole('button', { name: /Đại diện [1-5]/ }),
    ).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: /Đại diện 1/ }));
    expect(
      screen.getByRole('button', { name: /Thành viên 1/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Đại diện 5/ }));
    expect(
      screen.queryByRole('button', { name: /Thành viên 1/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Con 5/ }));
    expect(medicalBooksApi.visits).toHaveBeenCalledWith(
      'family-5',
      'child-5',
      1,
      expect.any(AbortSignal),
    );
    fireEvent.click(
      await screen.findByRole('checkbox', { name: 'Kê đơn cho lần khám này' }),
    );
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
      ['Mã thuốc', 'THUOC-01'],
      ['Hoạt chất', 'Hoạt chất mẫu'],
      ['Cân nặng (kg)', '25.5'],
      ['Hẹn tái khám sau (ngày)', '7'],
      ['Nơi cư trú *', 'Địa chỉ người bệnh'],
      ['Số điện thoại *', '0901234567'],
    ]) {
      fireEvent.change(screen.getByLabelText(label, { exact: true }), {
        target: { value },
      });
    }
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Tôi xác nhận nội dung/ }),
    );
    fireEvent.click(submit);

    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
    expect(medicalBooksApi.confirm).toHaveBeenCalledWith('visit-1', {
      patientId: 'child-5',
      confirmed: true,
      prescription: {
        clinicalContext: {
          weightKg: 25.5,
          followUpDays: 7,
          address: 'Địa chỉ người bệnh',
          phone: '0901234567',
          treatmentMode: 'OUTPATIENT',
        },
        recipientUserId: 'recipient-5',
        recipientAuthorized: true,
        instructions: 'Lời dặn mẫu',
        details: [
          {
            medicationName: 'Thuốc mẫu',
            strength: 'Hàm lượng mẫu',
            administrationRoute: 'Đường dùng mẫu',
            dosage: 'Liều mẫu',
            medicationCode: 'THUOC-01',
            activeIngredient: 'Hoạt chất mẫu',
            medicationType: 'SINGLE_INGREDIENT',
            frequency: 'Tần suất mẫu',
            durationDays: 3,
            quantity: 6,
            unit: 'Đơn vị mẫu',
          },
        ],
      },
    });
  });

  it('xác nhận lần khám không có đơn thuốc', async () => {
    mockBook();
    render(<DoctorEncountersView />);
    fireEvent.click(await screen.findByRole('button', { name: /Đại diện 5/ }));
    fireEvent.click(screen.getByRole('button', { name: /Con 5/ }));
    fireEvent.click(
      await screen.findByRole('checkbox', { name: /Tôi xác nhận nội dung/ }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Xác nhận trang khám' }),
    );
    await waitFor(() =>
      expect(medicalBooksApi.confirm).toHaveBeenCalledWith('visit-1', {
        patientId: 'child-5',
        confirmed: true,
      }),
    );
  });

  it('mở đúng lần khám từ phòng video và tải lại sau khi xác nhận', async () => {
    mockBook();
    vi.mocked(medicalBooksApi.visit)
      .mockResolvedValueOnce(visit)
      .mockResolvedValue({ ...visit, isFinalized: true });

    render(<DoctorBookVisitView id="visit-1" patientId="child-5" />);

    expect(await screen.findByText('Con 5 · Bác sĩ mẫu')).toBeInTheDocument();
    expect(medicalBooksApi.visit).toHaveBeenCalledWith(
      'visit-1',
      expect.any(AbortSignal),
      'child-5',
    );
    expect(medicalBooksApi.families).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Tôi xác nhận nội dung/ }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Xác nhận trang khám' }),
    );

    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
    expect(medicalBooksApi.confirm).toHaveBeenCalledWith('visit-1', {
      patientId: 'child-5',
      confirmed: true,
    });
  });

  it('gia đình lật lại trang cũ và xem tài liệu của đúng người', async () => {
    mockBook();
    const older = {
      ...visit,
      id: 'older-visit',
      scheduledDate: '2026-11-09T00:00:00Z',
      isFinalized: true,
    };
    vi.mocked(medicalBooksApi.families).mockResolvedValue({
      items: [fiveFamilies[4]],
      hasNextPage: false,
    });
    vi.mocked(medicalBooksApi.visits).mockResolvedValue({
      items: [
        { ...visit, diagnosis: null, isFinalized: true },
        { ...older, diagnosis: null },
      ],
      hasNextPage: false,
    });
    vi.mocked(medicalBooksApi.visit).mockImplementation(async (id) => ({
      ...(id === older.id ? older : visit),
      isFinalized: true,
    }));
    vi.mocked(medicalBooksApi.documents).mockResolvedValue([
      {
        id: 'doc-5',
        documentName: 'Tài liệu mẫu',
        documentType: 'LAB_RESULT',
        fileUrl: 'https://example.invalid/result.pdf',
        recordedDate: '2026-11-10',
        downloadAvailable: false,
      },
    ]);
    render(<MedicalBookView doctor={false} initialPatientId="child-5" />);
    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Xác nhận trang khám' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /09\/11\/2026/ }));
    await waitFor(() =>
      expect(medicalBooksApi.visit).toHaveBeenLastCalledWith(
        'older-visit',
        expect.any(AbortSignal),
        'child-5',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tài liệu' }));
    expect(
      await screen.findByRole('link', { name: /Mở tài liệu Tài liệu mẫu/ }),
    ).toHaveAttribute('href', 'https://example.invalid/result.pdf');
    expect(
      screen.getByText('Tải tài liệu cho thành viên này'),
    ).toBeInTheDocument();
    expect(medicalBooksApi.documents).toHaveBeenCalledWith(
      'family-5',
      'child-5',
      expect.any(AbortSignal),
    );
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
    fireEvent.click(screen.getByRole('button', { name: 'Đơn thuốc' }));
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

  it('shows the saved prescription date, frozen header and replacement entry point', async () => {
    mockBook();
    vi.mocked(medicalBooksApi.visit).mockResolvedValue({
      ...visit,
      isFinalized: true,
      finalizedAt: '2026-11-01T00:00:00Z',
      prescription: {
        id: 'rx-existing',
        prescriptionCode: 'FMD-existing',
        status: 'ISSUED',
        prescribedDate: '2026-11-20',
        validUntil: '2026-11-25',
        instructions: 'Lời dặn đã lưu',
        clinicalContext: { address: 'Địa chỉ đã lưu', phone: '0901234567' },
        recordSnapshot: {
          version: 1,
          patient: {
            id: visit.patient.id,
            fullName: 'Tên tại thời điểm kê',
            dateOfBirth: '2016-01-01',
            gender: 'MALE',
            ageMonths: 130,
          },
          doctorName: 'Bác sĩ tại thời điểm kê',
          facility: {
            facilityName: 'CSYT lúc kê',
            address: 'Địa chỉ CSYT lúc kê',
            phone: '0900000001',
          },
          exam: visit.exam!,
        },
        details: [
          {
            id: 'line-1',
            medicationName: 'Hoạt chất (Tên thương mại)',
            activeIngredient: 'Hoạt chất',
            strength: '500mg',
            administrationRoute: 'Uống',
            dosage: '1 viên',
            frequency: 'Sau ăn',
            quantity: 6,
            unit: 'Viên',
            durationDays: 3,
          },
        ],
      },
    });
    render(<DoctorEncountersView />);
    fireEvent.click(await screen.findByRole('button', { name: /Đại diện 5/ }));
    fireEvent.click(screen.getByRole('button', { name: /Con 5/ }));
    expect(await screen.findByText(/Ngày kê đơn ·/)).toHaveTextContent(
      '20/11/2026',
    );
    expect(screen.getByText('Tên tại thời điểm kê')).toBeInTheDocument();
    expect(screen.getByText('06 Viên')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kê đơn thay thế' }));
    expect(screen.getByLabelText('Lý do thay thế đơn *')).toBeInTheDocument();
    expect(screen.getByLabelText('Nơi cư trú *')).toHaveValue('Địa chỉ đã lưu');
  });

  it.each([
    [
      'CANCELLED',
      'Đơn cũ đã được thu hồi / thay thế — không còn hiệu lực mua, lĩnh thuốc.',
    ],
    [
      'EXPIRED',
      'Đơn thuốc đã hết hạn lĩnh thuốc (quá 05 ngày kể từ ngày kê đơn).',
    ],
    [
      'ISSUED',
      'Đơn thuốc có giá trị mua, lĩnh thuốc trong thời hạn tối đa 05 ngày (đến 25/11/2026).',
    ],
  ] as const)(
    'keeps %s consistent in the header, footer and mock dialog',
    async (status, notice) => {
      mockBook();
      vi.mocked(medicalBooksApi.visit).mockResolvedValue({
        ...visit,
        isFinalized: true,
        prescription: {
          id: 'rx-status',
          prescriptionCode: 'FMD-status',
          status,
          prescribedDate: '2026-11-20',
          validUntil: '2026-11-25',
          instructions: null,
          details: [],
        },
      });
      render(<DoctorEncountersView />);
      fireEvent.click(
        await screen.findByRole('button', { name: /Đại diện 5/ }),
      );
      fireEvent.click(screen.getByRole('button', { name: /Con 5/ }));
      expect(await screen.findAllByText(notice)).toHaveLength(2);
      if (status !== 'ISSUED')
        expect(
          screen.queryByText(/Đơn thuốc có giá trị mua, lĩnh thuốc/),
        ).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: 'Xem mẫu QĐ 808 & JSON' }),
      );
      const dialog = within(await screen.findByRole('dialog'));
      expect(dialog.getByText(notice)).toBeInTheDocument();
      const jsonTab = dialog.getByRole('tab', { name: /JSON Payload/ });
      fireEvent.mouseDown(jsonTab, { button: 0, ctrlKey: false });
      fireEvent.click(jsonTab);
      expect(jsonTab).toHaveAttribute('aria-selected', 'true');
      expect(dialog.getByText(notice)).toBeInTheDocument();
      const jsonBlock = dialog.getByText(
        new RegExp(`"trang_thai_don_thuoc":\\s*"${status}"`),
      );
      expect(jsonBlock).toBeInTheDocument();
      if (status === 'CANCELLED') {
        expect(jsonBlock.textContent).toContain('"thoi_han_don_thuoc": null');
      } else {
        expect(jsonBlock.textContent).toContain(
          '"thoi_han_don_thuoc": "2026-11-25"',
        );
      }
      if (status !== 'ISSUED')
        expect(
          dialog.queryByText(/Đơn thuốc có giá trị mua, lĩnh thuốc/),
        ).not.toBeInTheDocument();
    },
  );

  it('shows the prescription fields without sample medicines or simulated national confirmation', async () => {
    mockBook();
    render(<DoctorEncountersView />);
    fireEvent.click(await screen.findByRole('button', { name: /Đại diện 5/ }));
    fireEvent.click(screen.getByRole('button', { name: /Con 5/ }));
    expect(
      await screen.findByRole('heading', { name: 'ĐƠN THUỐC' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Họ tên')).toHaveValue('Con 5');
    expect(screen.getByLabelText('Cân nặng (kg)')).toHaveValue(null);
    expect(screen.getByLabelText('Mã số BHYT (nếu có)')).toHaveValue('');
    expect(
      screen.getByLabelText('CMT/CCCD hoặc hộ chiếu (nếu có)'),
    ).toHaveValue('');
    expect(screen.getByLabelText('Dân tộc')).toHaveValue('');
    expect(screen.getByLabelText('Mã định danh công dân')).toHaveValue('');
    expect(screen.getByLabelText('Số điện thoại *')).toHaveValue('');
    expect(screen.getByLabelText('Kết luận')).toHaveValue('');
    expect(screen.getByLabelText('Lưu ý')).toHaveValue('');
    expect(screen.getByText('Cấp sau khi lưu đơn')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Kê đơn cho lần khám này' }),
    );
    expect(screen.getByLabelText('Mã thuốc')).toHaveValue('');
    expect(screen.getByLabelText('Hoạt chất')).toHaveValue('');
    expect(screen.getByLabelText('Tên thuốc')).toHaveValue('');
    expect(screen.getByText('Đã bán')).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có dữ liệu từ nhà thuốc'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Bệnh viện Đa khoa Quốc tế FamiDoc/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Cổng Quốc gia/ }),
    ).not.toBeInTheDocument();
  });
});
