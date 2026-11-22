import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FamilyMemberCareView } from '../family-member-care-view';

const mockGetMemberById = vi.fn();
const mockGetFamilyMembers = vi.fn();
const mockUpdateFamilyMember = vi.fn();
const mockAddMemberAllergy = vi.fn();
const mockDeleteMemberAllergy = vi.fn();
const mockAddMemberDocument = vi.fn();
const mockUploadMemberDocument = vi.fn();
const mockDeleteMemberDocument = vi.fn();
const mockFetchMemberDocumentBlob = vi.fn();
const mockGetMemberVitalSigns = vi.fn();
const mockAddMemberVitalSign = vi.fn();
const mockUpdateMemberVitalSign = vi.fn();
const mockDeleteMemberVitalSign = vi.fn();
const mockGetFamilyTimetable = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/family/members/mem-real-1',
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 240 }}>{children}</div>
    ),
  };
});

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    patientsApi: {
      ...actual.patientsApi,
      getMemberById: (...args: unknown[]) => mockGetMemberById(...args),
      getFamilyMembers: (...args: unknown[]) => mockGetFamilyMembers(...args),
      updateFamilyMember: (...args: unknown[]) => mockUpdateFamilyMember(...args),
      addMemberAllergy: (...args: unknown[]) => mockAddMemberAllergy(...args),
      deleteMemberAllergy: (...args: unknown[]) => mockDeleteMemberAllergy(...args),
      addMemberDocument: (...args: unknown[]) => mockAddMemberDocument(...args),
      uploadMemberDocument: (...args: unknown[]) => mockUploadMemberDocument(...args),
      deleteMemberDocument: (...args: unknown[]) => mockDeleteMemberDocument(...args),
      fetchMemberDocumentBlob: (...args: unknown[]) => mockFetchMemberDocumentBlob(...args),
      getMemberVitalSigns: (...args: unknown[]) => mockGetMemberVitalSigns(...args),
      addMemberVitalSign: (...args: unknown[]) => mockAddMemberVitalSign(...args),
      updateMemberVitalSign: (...args: unknown[]) => mockUpdateMemberVitalSign(...args),
      deleteMemberVitalSign: (...args: unknown[]) => mockDeleteMemberVitalSign(...args),
    },
    encountersApi: {
      ...actual.encountersApi,
      getFamilyTimetable: (...args: unknown[]) => mockGetFamilyTimetable(...args),
    },
  };
});

const SAMPLE_MEMBER = {
  id: 'mem-real-1',
  familyId: 'fam-1',
  fullName: 'Lê Hoàng Minh',
  dateOfBirth: '1975-06-15',
  gender: 'MALE' as const,
  relationshipToHead: 'HEAD_OF_HOUSEHOLD',
  bloodType: 'AB+',
  chronicDiseases: 'Rối loạn lipid máu',
  status: 'ACTIVE' as const,
  allergies: [
    {
      id: 'all-1',
      allergenType: 'DRUG' as const,
      allergenName: 'Aspirin',
      severity: 'MODERATE' as const,
      clinicalManifestation: 'Nổi mề đay nhẹ',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      documentName: 'Xét nghiệm mỡ máu Q3',
      documentType: 'LAB_RESULT' as const,
      fileUrl: 'https://files.famidoc.vn/docs/mo-mau-q3.pdf',
      fileSizeKb: 420,
      recordedDate: '2026-10-12',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-10-12T00:00:00.000Z',
};

const OTHER_MEMBER = {
  id: 'mem-real-2',
  familyId: 'fam-1',
  fullName: 'Phạm Thu Hà',
  dateOfBirth: '1980-09-20',
  gender: 'FEMALE' as const,
  relationshipToHead: 'SPOUSE',
  status: 'ACTIVE' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const INACTIVE_MEMBER = {
  id: 'mem-inactive-9',
  familyId: 'fam-1',
  fullName: 'Thành viên Đã Tách',
  dateOfBirth: '1995-03-10',
  gender: 'MALE' as const,
  relationshipToHead: 'CHILD',
  status: 'INACTIVE' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const SAMPLE_ENCOUNTERS = [
  {
    id: 'enc-upcoming-1',
    contractId: 'ctr-1',
    patientId: 'mem-real-1',
    doctorId: 'doc-real-1',
    scheduledDate: '2026-12-20T00:00:00.000Z',
    scheduledTime: '1970-01-01T08:30:00.000Z',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'CONFIRMED',
    doctor: {
      id: 'doc-real-1',
      doctorName: 'BS.CKI Trần Văn Hùng',
      facility: { id: 'fac-1', facilityName: 'Phòng khám Đa khoa Tâm An' },
    },
  },
  {
    id: 'enc-completed-home',
    contractId: 'ctr-1',
    patientId: 'mem-real-1',
    doctorId: 'doc-real-1',
    scheduledDate: '2026-10-05T00:00:00.000Z',
    scheduledTime: '09:00:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'COMPLETED',
    doctor: {
      id: 'doc-real-1',
      doctorName: 'BS.CKI Trần Văn Hùng',
      facility: { id: 'fac-1', facilityName: 'Phòng khám Đa khoa Tâm An' },
    },
  },
  {
    id: 'enc-completed-tele',
    contractId: 'ctr-1',
    patientId: 'mem-real-1',
    doctorId: 'doc-real-2',
    scheduledDate: '2026-09-18T00:00:00.000Z',
    scheduledTime: '15:30:00',
    encounterType: 'TELEMEDICINE',
    category: 'AD_HOC_ON_DEMAND',
    encounterStatus: 'COMPLETED',
    doctor: {
      id: 'doc-real-2',
      user: { name: 'ThS.BS Đặng Lan Anh' },
      facility: { id: 'fac-2', facilityName: 'Bệnh viện Gia Định' },
    },
  },
  {
    id: 'enc-other-member',
    contractId: 'ctr-1',
    patientId: 'mem-real-2',
    doctorId: 'doc-real-3',
    scheduledDate: '2026-10-01T00:00:00.000Z',
    scheduledTime: '10:00:00',
    encounterType: 'HOME_VISIT',
    category: 'PERIODIC_ROUTINE',
    encounterStatus: 'COMPLETED',
    doctor: {
      id: 'doc-real-3',
      doctorName: 'BS. Lê Thị Bích',
      facility: { id: 'fac-3', facilityName: 'PK Khác' },
    },
  },
];

function buildSampleVitals() {
  const now = new Date();
  const vnTodayDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(now);
  const startOfVnToday = new Date(`${vnTodayDateStr}T00:00:00+07:00`);
  const latestToday = new Date(Math.max(now.getTime(), startOfVnToday.getTime() + 60_000));
  const earlierToday = new Date(
    Math.max(startOfVnToday.getTime() + 1_000, latestToday.getTime() - 2 * 3_600_000)
  );
  const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 86_400_000);

  return [
    {
      id: 'vit-today-latest',
      emrId: null,
      patientId: 'mem-real-1',
      systolicBp: 146,
      diastolicBp: 92,
      heartRate: 82,
      temperature: 36.8,
      spo2: 97,
      respiratoryRate: 18,
      bloodGlucose: 6.1,
      isAbnormalAlert: true,
      recordedAt: latestToday.toISOString(),
    },
    {
      id: 'vit-today-earlier',
      emrId: 'emr-doctor-9',
      patientId: 'mem-real-1',
      systolicBp: 128,
      diastolicBp: 80,
      heartRate: 74,
      temperature: 36.5,
      spo2: 99,
      respiratoryRate: 16,
      bloodGlucose: 5.4,
      isAbnormalAlert: false,
      recordedAt: earlierToday.toISOString(),
    },
    {
      id: 'vit-3d',
      emrId: null,
      patientId: 'mem-real-1',
      systolicBp: 124,
      diastolicBp: 79,
      heartRate: 72,
      temperature: 36.6,
      spo2: 98,
      respiratoryRate: 16,
      bloodGlucose: 5.2,
      isAbnormalAlert: false,
      recordedAt: threeDaysAgo.toISOString(),
    },
    {
      id: 'vit-10d',
      emrId: null,
      patientId: 'mem-real-1',
      systolicBp: 118,
      diastolicBp: 76,
      heartRate: 70,
      temperature: 36.4,
      spo2: 99,
      respiratoryRate: 16,
      bloodGlucose: 5.0,
      isAbnormalAlert: false,
      recordedAt: tenDaysAgo.toISOString(),
    },
  ];
}

describe('FamilyMemberCareView Integration & Responsive Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => 'blob:http://localhost:3000/mock-preview-1'),
      });
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost:3000/mock-preview-1');
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    mockGetMemberById.mockResolvedValue(SAMPLE_MEMBER);
    mockGetFamilyMembers.mockResolvedValue([SAMPLE_MEMBER, OTHER_MEMBER, INACTIVE_MEMBER]);
    mockGetFamilyTimetable.mockResolvedValue({
      data: SAMPLE_ENCOUNTERS,
      pagination: { total: 4, page: 1, pageSize: 50, totalPages: 1 },
    });
    mockGetMemberVitalSigns.mockResolvedValue(buildSampleVitals());
    mockUpdateFamilyMember.mockImplementation(async (_id, dto) => ({
      ...SAMPLE_MEMBER,
      ...dto,
    }));
    mockAddMemberAllergy.mockResolvedValue({
      id: 'all-new-2',
      allergenType: 'FOOD',
      allergenName: 'Đậu phộng',
      severity: 'LIFE_THREATENING_ANAPHYLAXIS',
      clinicalManifestation: 'Phù môi',
    });
    mockDeleteMemberAllergy.mockResolvedValue({ id: 'all-1' });
    mockAddMemberVitalSign.mockResolvedValue({
      id: 'vit-created-99',
      emrId: null,
      patientId: 'mem-real-1',
      systolicBp: 132,
      diastolicBp: 84,
      heartRate: 76,
      temperature: 36.7,
      spo2: 98,
      respiratoryRate: 17,
      bloodGlucose: 5.6,
      isAbnormalAlert: false,
      recordedAt: new Date(Date.now() + 15_000).toISOString(),
    });
    mockUpdateMemberVitalSign.mockImplementation(async (_pid, _vid, dto) => ({
      ...buildSampleVitals()[0],
      ...dto,
      isAbnormalAlert: false,
    }));
    mockDeleteMemberVitalSign.mockResolvedValue({ id: 'vit-today-latest' });
    mockAddMemberDocument.mockResolvedValue({
      id: 'doc-new-99',
      documentName: 'Phim X-Quang phổi thẳng',
      documentType: 'IMAGING_XRAY_CT',
      fileUrl: 'https://files.famidoc.vn/docs/xquang-phoi.pdf',
      fileSizeKb: 0,
      recordedDate: '2026-11-18',
    });
  });

  it('renders cleanly without nested <main> and preserves .md:hidden mobile layout', async () => {
    const { container } = render(<FamilyMemberCareView memberId="mem-real-1" />);

    expect(container.querySelector('main')).toBeNull();
    expect(container.querySelector('.md\\:hidden')).not.toBeNull();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Lê Hoàng Minh' })).toBeInTheDocument();
    });

    expect(container.querySelector('main')).toBeNull();
    expect(container.querySelector('.md\\:hidden')).not.toBeNull();
  });

  it('renders real profile details and switcher links without legacy mocks or removed sections', async () => {
    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Lê Hoàng Minh' })).toBeInTheDocument();
    });

    expect(mockGetMemberById).toHaveBeenCalledWith('mem-real-1');
    expect(screen.getByText(/15\/06\/1975/)).toBeInTheDocument();
    expect(screen.getByText(/Giới tính: Nam/)).toBeInTheDocument();
    expect(screen.getByText(/AB\+/)).toBeInTheDocument();
    expect(screen.getByText(/Rối loạn lipid máu/)).toBeInTheDocument();
    expect(screen.getByText('Aspirin')).toBeInTheDocument();
    expect(screen.getByText('Mức độ trung bình')).toBeInTheDocument();

    const otherMemberLink = screen.getByRole('link', { name: /Phạm Thu Hà/i });
    expect(otherMemberLink).toHaveAttribute('href', '/family/members/mem-real-2');
    expect(screen.queryByRole('link', { name: /Thành viên Đã Tách/i })).not.toBeInTheDocument();

    expect(screen.queryByText('Lịch khám sắp tới')).not.toBeInTheDocument();
    expect(screen.queryByText('Đơn thuốc & Nhắc uống thuốc')).not.toBeInTheDocument();
    expect(screen.queryByText('Lịch sử buổi khám đã hoàn thành')).not.toBeInTheDocument();

    expect(screen.queryByText(/Nguyễn Văn Phúc/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PGS\.TS Nguyễn Trọng Nghĩa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Amlodipine/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Metformin/i)).not.toBeInTheDocument();
  });

  it('supports inline chronic diseases update and allergy add/delete', async () => {
    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getByText('Rối loạn lipid máu')).toBeInTheDocument();
    });

    // Inline chronic edit
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa bệnh nền' }));
    fireEvent.change(screen.getByLabelText(/Bệnh lý nền và theo dõi mạn tính/i), {
      target: { value: 'Tăng huyết áp độ 1, Rối loạn lipid máu' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu bệnh lý' }));

    await waitFor(() => {
      expect(mockUpdateFamilyMember).toHaveBeenCalledWith('mem-real-1', {
        chronicDiseases: 'Tăng huyết áp độ 1, Rối loạn lipid máu',
      });
      expect(screen.getByText('Tăng huyết áp độ 1, Rối loạn lipid máu')).toBeInTheDocument();
    });

    // Add structured allergy
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm dị ứng' }));
    fireEvent.change(screen.getByLabelText(/Tên dị nguyên/i), {
      target: { value: 'Đậu phộng' },
    });
    fireEvent.change(screen.getByLabelText(/Nhóm dị nguyên/i), {
      target: { value: 'FOOD' },
    });
    fireEvent.change(screen.getByLabelText(/Mức độ nghiêm trọng/i), {
      target: { value: 'LIFE_THREATENING_ANAPHYLAXIS' },
    });
    fireEvent.change(screen.getByLabelText(/Biểu hiện lâm sàng/i), {
      target: { value: 'Phù môi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu dị ứng' }));

    await waitFor(() => {
      expect(mockAddMemberAllergy).toHaveBeenCalledWith('mem-real-1', {
        allergenType: 'FOOD',
        allergenName: 'Đậu phộng',
        severity: 'LIFE_THREATENING_ANAPHYLAXIS',
        clinicalManifestation: 'Phù môi',
      });
      expect(screen.getByText('Đậu phộng')).toBeInTheDocument();
    });

    // Delete allergy with confirmation
    fireEvent.click(screen.getByRole('button', { name: 'Xóa dị ứng Aspirin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa dị ứng' }));

    await waitFor(() => {
      expect(mockDeleteMemberAllergy).toHaveBeenCalledWith('mem-real-1', 'all-1');
      expect(screen.queryByText('Aspirin')).not.toBeInTheDocument();
    });
  });

  it('displays today latest vitals, alert badge, multi-day range filters, and vital CRUD', async () => {
    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getByText('Cảnh báo chỉ số bất thường')).toBeInTheDocument();
    });

    expect(screen.getAllByText('146/92').length).toBeGreaterThan(0);
    expect(screen.getByTestId('vital-card-bp')).toHaveAttribute('data-abnormal', 'true');
    expect(screen.getByTestId('vital-card-heartRate')).toHaveAttribute('data-abnormal', 'false');
    expect(screen.getByText('Huyết áp cao (>= 140/90)')).toBeInTheDocument();
    expect(screen.getAllByText(/so với lần trước/).length).toBeGreaterThan(0);
    expect(screen.getByText('Nhật ký đo trong ngày (2)')).toBeInTheDocument();
    expect(screen.getByText('Từ bệnh án bác sĩ')).toBeInTheDocument();

    // Multi-day filter toggles (7 vs 14 days)
    expect(screen.queryAllByText('118/76')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: '14 ngày' }));
    expect(screen.getAllByText('118/76').length).toBeGreaterThan(0);

    // Add new vital sign with combined BP input & without respiratory rate, heart rate, or manual timestamp fields
    expect(screen.queryByRole('columnheader', { name: 'Nhịp tim' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Nhập chỉ số hôm nay/i }));
    expect(screen.queryByLabelText(/Nhịp thở/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Nhịp tim/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Thời điểm đo/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Huyết áp \(mmHg\)/i), {
      target: { value: '132/84' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chỉ số' }));

    await waitFor(() => {
      expect(mockAddMemberVitalSign).toHaveBeenCalledWith(
        'mem-real-1',
        expect.objectContaining({
          systolicBp: 132,
          diastolicBp: 84,
          recordedAt: expect.any(String),
        })
      );
      expect(screen.getAllByText('132/84').length).toBeGreaterThan(0);
    });

    // Edit family-recorded vital sign (pre-filled as 132/84)
    fireEvent.click(screen.getAllByRole('button', { name: 'Sửa' })[0]);
    const editBpInput = screen.getByLabelText(/Huyết áp \(mmHg\)/i) as HTMLInputElement;
    expect(editBpInput.value).toBe('132/84');
    fireEvent.change(editBpInput, {
      target: { value: '125/84' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật chỉ số' }));

    await waitFor(() => {
      expect(mockUpdateMemberVitalSign).toHaveBeenCalledWith(
        'mem-real-1',
        'vit-created-99',
        expect.objectContaining({ systolicBp: 125, diastolicBp: 84 })
      );
    });

    // Delete family-recorded vital sign
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Xóa lần đo' }));

    await waitFor(() => {
      expect(mockDeleteMemberVitalSign).toHaveBeenCalledWith('mem-real-1', 'vit-created-99');
    });
  });

  it('shows explicit not-found/error state when member lookup fails and never falls back to mem-01', async () => {
    mockGetMemberById.mockRejectedValueOnce(new Error('Không tìm thấy thành viên'));

    render(<FamilyMemberCareView memberId="mem-missing" />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Không thể hiển thị hồ sơ y bạ thành viên' })
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Không tìm thấy thành viên')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại danh sách thành viên' })).toHaveAttribute(
      'href',
      '/family/members'
    );
    expect(screen.queryByText(/Nguyễn Văn Phúc/i)).not.toBeInTheDocument();
  });

  it('supports real multipart upload, category filtering, search, image lightbox, and document deletion', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    mockUploadMemberDocument.mockResolvedValue({
      id: 'doc-uploaded-99',
      patientId: 'mem-real-1',
      documentName: 'Đơn thuốc tim mạch T11',
      documentType: 'PRESCRIPTION',
      fileUrl: 'patient-documents/mem-real-1/don-thuoc.png',
      mimeType: 'image/png',
      notes: 'BV ĐHYD - BS. Hùng',
      previewUrl: 'https://media.famidoc.online/signed/don-thuoc.webp',
      downloadPath: '/api/v1/patients/mem-real-1/documents/doc-uploaded-99/file',
      fileSizeKb: 420,
      recordedDate: '2026-11-18',
    });
    mockDeleteMemberDocument.mockResolvedValue({
      id: 'doc-uploaded-99',
      documentName: 'Đơn thuốc tim mạch T11',
      documentType: 'PRESCRIPTION',
      fileUrl: 'patient-documents/mem-real-1/don-thuoc.png',
      recordedDate: '2026-11-18',
    });

    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getByText('Xét nghiệm mỡ máu Q3')).toBeInTheDocument();
    });

    const existingDocCard = screen.getByText('Xét nghiệm mỡ máu Q3').closest('article');
    expect(existingDocCard).not.toBeNull();

    // Open existing external PDF
    fireEvent.click(within(existingDocCard!).getByRole('button', { name: /Xem tệp/i }));
    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://files.famidoc.vn/docs/mo-mau-q3.pdf',
        '_blank',
        'noopener,noreferrer'
      );
    });

    // Open real upload modal and upload PRESCRIPTION PNG
    fireEvent.click(screen.getByRole('button', { name: /Tải tài liệu lên/i }));
    const fileInput = document.getElementById('member-doc-file-input') as HTMLInputElement;
    const sampleImage = new File(['png-bytes'], 'don-thuoc-chup.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [sampleImage] } });

    expect(screen.getByDisplayValue('don-thuoc-chup')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Tên tài liệu/i), {
      target: { value: 'Đơn thuốc tim mạch T11' },
    });
    fireEvent.change(screen.getByLabelText(/Ghi chú/i), {
      target: { value: 'BV ĐHYD - BS. Hùng' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào y bạ' }));

    await waitFor(() => {
      expect(mockUploadMemberDocument).toHaveBeenCalledWith(
        'mem-real-1',
        expect.objectContaining({
          documentName: 'Đơn thuốc tim mạch T11',
          documentType: 'PRESCRIPTION',
          notes: 'BV ĐHYD - BS. Hùng',
          file: sampleImage,
        })
      );
      expect(screen.getByText('Đơn thuốc tim mạch T11')).toBeInTheDocument();
    });

    // Category filter tab works (Đơn thuốc hides Xét nghiệm)
    fireEvent.click(screen.getByRole('tab', { name: /Đơn thuốc \(1\)/i }));
    expect(screen.getByText('Đơn thuốc tim mạch T11')).toBeInTheDocument();
    expect(screen.queryByText('Xét nghiệm mỡ máu Q3')).not.toBeInTheDocument();

    // Search filters accurately and Note-style toggle collapses/expands notes
    fireEvent.change(screen.getByLabelText('Tìm kiếm tài liệu y tế'), {
      target: { value: 'BS. Hùng' },
    });
    expect(screen.getByText('Đơn thuốc tim mạch T11')).toBeInTheDocument();
    expect(screen.getByText('BV ĐHYD - BS. Hùng')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn nội dung Đơn thuốc tim mạch T11' }));
    expect(screen.queryByText('BV ĐHYD - BS. Hùng')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng nội dung Đơn thuốc tim mạch T11' }));
    expect(screen.getByText('BV ĐHYD - BS. Hùng')).toBeInTheDocument();

    // Open image lightbox
    const uploadedCard = screen.getByText('Đơn thuốc tim mạch T11').closest('article');
    expect(uploadedCard).not.toBeNull();
    fireEvent.click(within(uploadedCard!).getByRole('button', { name: /Xem ảnh/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tải ảnh gốc/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));

    // Delete uploaded document
    fireEvent.click(
      within(uploadedCard!).getByRole('button', { name: 'Xóa tài liệu Đơn thuốc tim mạch T11' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tài liệu' }));

    await waitFor(() => {
      expect(mockDeleteMemberDocument).toHaveBeenCalledWith('mem-real-1', 'doc-uploaded-99');
      expect(screen.queryByText('Đơn thuốc tim mạch T11')).not.toBeInTheDocument();
    });

    windowOpenSpy.mockRestore();
  });

  it('previews internal S3 PDF inside dialog via authenticated blob and preserves .pdf extension on download', async () => {
    mockGetMemberById.mockResolvedValueOnce({
      ...SAMPLE_MEMBER,
      documents: [
        {
          id: 'doc-internal-pdf-1',
          patientId: 'mem-real-1',
          documentName: 'SMB Installation Overview_Rev. 1.14',
          documentType: 'LAB_RESULT',
          fileUrl: 'patient-documents/mem-real-1/179500-1.pdf',
          mimeType: 'application/pdf',
          fileSizeKb: 512,
          recordedDate: '2026-11-19',
        },
      ],
    });
    mockFetchMemberDocumentBlob.mockResolvedValueOnce(
      new Blob(['%PDF-1.4\n'], { type: 'application/octet-stream' })
    );

    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getAllByText('SMB Installation Overview_Rev. 1.14').length).toBeGreaterThan(0);
    });

    const pdfCard = screen.getAllByText('SMB Installation Overview_Rev. 1.14')[0].closest('article');
    expect(pdfCard).not.toBeNull();

    // Opening internal S3 PDF fetches authenticated blob and renders iframe modal + open-in-new-tab link
    fireEvent.click(within(pdfCard!).getByRole('button', { name: /Xem tệp/i }));

    await waitFor(() => {
      expect(mockFetchMemberDocumentBlob).toHaveBeenCalledWith('mem-real-1', 'doc-internal-pdf-1');
      const iframe = screen.getByTitle('SMB Installation Overview_Rev. 1.14');
      expect(iframe).toHaveAttribute('src', 'blob:http://localhost:3000/mock-preview-1');
    });

    expect(screen.getByRole('link', { name: /Mở tab mới/i })).toHaveAttribute(
      'href',
      'blob:http://localhost:3000/mock-preview-1'
    );

    // Downloading attaches .pdf extension even when documentName ends with ". 1.14"
    const downloadSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    const createElSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        const origClick = el.click.bind(el);
        el.click = () => {
          downloadSpy((el as HTMLAnchorElement).download, (el as HTMLAnchorElement).href);
          origClick();
        };
      }
      return el;
    });

    fireEvent.click(screen.getByRole('button', { name: /Tải PDF về/i }));

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith(
        'SMB Installation Overview_Rev. 1.14.pdf',
        'blob:http://localhost:3000/mock-preview-1'
      );
    });

    createElSpy.mockRestore();
    anchorClickSpy.mockRestore();
  });

  it('caches blob URL across reopen/download, shows loading/error retry, and revokes blob URL on delete', async () => {
    mockGetMemberById.mockResolvedValueOnce({
      ...SAMPLE_MEMBER,
      documents: [
        {
          id: 'doc-cache-pdf',
          patientId: 'mem-real-1',
          documentName: 'Phiếu siêu âm tổng quát',
          documentType: 'IMAGING_XRAY_CT',
          fileUrl: 'patient-documents/mem-real-1/sieu-am.pdf',
          mimeType: 'application/pdf',
          fileSizeKb: 310,
          recordedDate: '2026-11-19',
        },
      ],
    });
    mockFetchMemberDocumentBlob
      .mockRejectedValueOnce(new Error('Không thể tải tệp từ kho lưu trữ.'))
      .mockResolvedValueOnce(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    mockDeleteMemberDocument.mockResolvedValueOnce({
      id: 'doc-cache-pdf',
      documentName: 'Phiếu siêu âm tổng quát',
      documentType: 'IMAGING_XRAY_CT',
      fileUrl: 'patient-documents/mem-real-1/sieu-am.pdf',
      recordedDate: '2026-11-19',
    });

    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getAllByText('Phiếu siêu âm tổng quát').length).toBeGreaterThan(0);
    });

    const card = screen.getAllByText('Phiếu siêu âm tổng quát')[0].closest('article');
    expect(card).not.toBeNull();

    // First open fails -> inline error with "Thử lại"
    fireEvent.click(within(card!).getByRole('button', { name: /Xem tệp/i }));
    await waitFor(() => {
      expect(screen.getByText('Không thể tải tệp từ kho lưu trữ.')).toBeInTheDocument();
    });

    // Click "Thử lại" -> loads PDF into iframe
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => {
      expect(screen.getByTitle('Phiếu siêu âm tổng quát')).toHaveAttribute(
        'src',
        'blob:http://localhost:3000/mock-preview-1'
      );
    });
    expect(mockFetchMemberDocumentBlob).toHaveBeenCalledTimes(2);

    // Close and reopen -> reuses cached blob URL without hitting API again
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    fireEvent.click(within(card!).getByRole('button', { name: /Xem tệp/i }));
    await waitFor(() => {
      expect(screen.getByTitle('Phiếu siêu âm tổng quát')).toHaveAttribute(
        'src',
        'blob:http://localhost:3000/mock-preview-1'
      );
    });
    expect(mockFetchMemberDocumentBlob).toHaveBeenCalledTimes(2);

    // Close and delete -> revokes cached blob URL
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    fireEvent.click(
      within(card!).getByRole('button', { name: 'Xóa tài liệu Phiếu siêu âm tổng quát' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tài liệu' }));

    await waitFor(() => {
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost:3000/mock-preview-1');
    });
  });

  it('falls back from broken imgproxy previewUrl to authenticated blob fetch in Lightbox', async () => {
    mockGetMemberById.mockResolvedValueOnce({
      ...SAMPLE_MEMBER,
      documents: [
        {
          id: 'doc-broken-preview-1',
          patientId: 'mem-real-1',
          documentName: 'Đơn thuốc ảnh lạnh cache',
          documentType: 'PRESCRIPTION',
          fileUrl: 'patient-documents/mem-real-1/cold.jpg',
          previewUrl: 'https://media.famidoc.online/broken-cold.webp',
          mimeType: 'image/jpeg',
          fileSizeKb: 220,
          recordedDate: '2026-11-19',
        },
      ],
    });
    mockFetchMemberDocumentBlob.mockResolvedValueOnce(
      new Blob(['jpeg-bytes'], { type: 'image/jpeg' })
    );

    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getAllByText('Đơn thuốc ảnh lạnh cache').length).toBeGreaterThan(0);
    });

    const card = screen.getAllByText('Đơn thuốc ảnh lạnh cache')[0].closest('article');
    expect(card).not.toBeNull();

    // Open Lightbox using previewUrl initially
    fireEvent.click(within(card!).getByRole('button', { name: /Xem ảnh/i }));

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      const img = within(dialog).getByAltText('Đơn thuốc ảnh lạnh cache');
      expect(img).toHaveAttribute('src', 'https://media.famidoc.online/broken-cold.webp');
      fireEvent.error(img);
    });

    // After previewUrl fails, automatically falls back to authenticated blob URL
    await waitFor(() => {
      expect(mockFetchMemberDocumentBlob).toHaveBeenCalledWith(
        'mem-real-1',
        'doc-broken-preview-1'
      );
      const dialog = screen.getByRole('dialog');
      const img = within(dialog).getByAltText('Đơn thuốc ảnh lạnh cache');
      expect(img).toHaveAttribute('src', 'blob:http://localhost:3000/mock-preview-1');
    });
  });
});
