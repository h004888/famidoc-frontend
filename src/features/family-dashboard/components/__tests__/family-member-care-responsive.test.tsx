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
const mockGetMemberVitalSigns = vi.fn();
const mockAddMemberVitalSign = vi.fn();
const mockUpdateMemberVitalSign = vi.fn();
const mockDeleteMemberVitalSign = vi.fn();
const mockGetFamilyTimetable = vi.fn();
const mockUploadFileWithMeta = vi.fn();

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
      getMemberVitalSigns: (...args: unknown[]) => mockGetMemberVitalSigns(...args),
      addMemberVitalSign: (...args: unknown[]) => mockAddMemberVitalSign(...args),
      updateMemberVitalSign: (...args: unknown[]) => mockUpdateMemberVitalSign(...args),
      deleteMemberVitalSign: (...args: unknown[]) => mockDeleteMemberVitalSign(...args),
    },
    encountersApi: {
      ...actual.encountersApi,
      getFamilyTimetable: (...args: unknown[]) => mockGetFamilyTimetable(...args),
    },
    filesApi: {
      ...actual.filesApi,
      uploadFileWithMeta: (...args: unknown[]) => mockUploadFileWithMeta(...args),
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
  const earlierToday = new Date(now.getTime() - 2 * 3_600_000);
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
      recordedAt: now.toISOString(),
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
      recordedAt: new Date().toISOString(),
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
    mockUploadFileWithMeta.mockResolvedValue({
      url: 'blob:http://localhost:3000/mock-preview-1',
      isLocalFallback: true,
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
    expect(screen.getByText('Nhật ký đo trong ngày (2)')).toBeInTheDocument();
    expect(screen.getByText('Từ bệnh án bác sĩ')).toBeInTheDocument();

    // Multi-day filter toggles (7 vs 14 days)
    expect(screen.queryAllByText('118/76')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: '14 ngày' }));
    expect(screen.getAllByText('118/76').length).toBeGreaterThan(0);

    // Add new vital sign
    fireEvent.click(screen.getByRole('button', { name: /Nhập chỉ số hôm nay/i }));
    fireEvent.change(screen.getByLabelText(/Huyết áp tâm thu/i), {
      target: { value: '132' },
    });
    fireEvent.change(screen.getByLabelText(/Huyết áp tâm trương/i), {
      target: { value: '84' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu chỉ số' }));

    await waitFor(() => {
      expect(mockAddMemberVitalSign).toHaveBeenCalledWith(
        'mem-real-1',
        expect.objectContaining({ systolicBp: 132, diastolicBp: 84 })
      );
      expect(screen.getAllByText('132/84').length).toBeGreaterThan(0);
    });

    // Edit family-recorded vital sign
    fireEvent.click(screen.getAllByRole('button', { name: 'Sửa' })[0]);
    fireEvent.change(screen.getByLabelText(/Huyết áp tâm thu/i), {
      target: { value: '125' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật chỉ số' }));

    await waitFor(() => {
      expect(mockUpdateMemberVitalSign).toHaveBeenCalledWith(
        'mem-real-1',
        'vit-created-99',
        expect.objectContaining({ systolicBp: 125 })
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

  it('supports local image/PDF preview without saving blob URLs and persists external URL via addMemberDocument', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<FamilyMemberCareView memberId="mem-real-1" />);

    await waitFor(() => {
      expect(screen.getByText('Xét nghiệm mỡ máu Q3')).toBeInTheDocument();
    });

    const existingDocCard = screen.getByText('Xét nghiệm mỡ máu Q3').closest('article');
    expect(existingDocCard).not.toBeNull();
    expect(within(existingDocCard!).queryByRole('button', { name: /Xóa/i })).not.toBeInTheDocument();

    fireEvent.click(within(existingDocCard!).getByRole('button', { name: /Xem tài liệu/i }));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://files.famidoc.vn/docs/mo-mau-q3.pdf',
      '_blank',
      'noopener,noreferrer'
    );

    // 1) Local file/image mode (Option A: keeps local preview badge and does NOT call addMemberDocument with blob:)
    fireEvent.click(screen.getByRole('button', { name: /Tải lên file \/ ảnh/i }));
    const fileInput = screen.getByLabelText(/Chọn tệp PDF hoặc ảnh/i);
    const sampleImage = new File(['png-bytes'], 'don-thuoc-chup.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [sampleImage] } });

    expect(screen.getByDisplayValue('don-thuoc-chup')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tải lên & Lưu' }));

    await waitFor(() => {
      expect(mockUploadFileWithMeta).toHaveBeenCalledWith(sampleImage, 'patient-documents');
      expect(
        screen.getByText('Chỉ xem trước cục bộ (chưa đồng bộ máy chủ)')
      ).toBeInTheDocument();
    });
    expect(mockAddMemberDocument).not.toHaveBeenCalled();

    // 2) External URL mode persists via addMemberDocument
    fireEvent.click(screen.getByRole('button', { name: /Tải lên file \/ ảnh/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Nhập đường dẫn URL' }));
    fireEvent.change(screen.getByLabelText(/Tên tài liệu/i), {
      target: { value: 'Phim X-Quang phổi thẳng' },
    });
    fireEvent.change(screen.getByLabelText(/Loại tài liệu/i), {
      target: { value: 'IMAGING_XRAY_CT' },
    });
    fireEvent.change(screen.getByLabelText(/Ngày ghi nhận/i), {
      target: { value: '2026-11-18' },
    });
    fireEvent.change(screen.getByLabelText(/Đường dẫn tài liệu/i), {
      target: { value: 'https://files.famidoc.vn/docs/xquang-phoi.pdf' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Lưu tài liệu' }));

    await waitFor(() => {
      expect(mockAddMemberDocument).toHaveBeenCalledWith('mem-real-1', {
        documentName: 'Phim X-Quang phổi thẳng',
        documentType: 'IMAGING_XRAY_CT',
        recordedDate: '2026-11-18',
        fileUrl: 'https://files.famidoc.vn/docs/xquang-phoi.pdf',
        fileSizeKb: 0,
      });
      expect(screen.getByText('Phim X-Quang phổi thẳng')).toBeInTheDocument();
    });

    windowOpenSpy.mockRestore();
  });
});
