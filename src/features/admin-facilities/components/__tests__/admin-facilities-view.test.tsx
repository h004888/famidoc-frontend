import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminFacilitiesView } from '../admin-facilities-view';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { doctorsApi } from '@/lib/api/doctors.api';

vi.mock('@/lib/api/doctors.api', () => ({
  doctorsApi: {
    getAdminDoctors: vi.fn().mockResolvedValue([]),
    platformApproveCredentials: vi.fn(),
  },
}));

vi.mock('@/lib/api/facilities.api', () => ({
  facilitiesApi: {
    createFacilityByAdmin: vi.fn(),
    getAdminFacilities: vi.fn(),
    verifyLegal: vi.fn(),
    fetchLegalDocumentBlobUrl: vi.fn().mockResolvedValue('blob:mock-doc'),
  },
}));

describe('AdminFacilitiesView - Quản trị & Thẩm định Cơ sở Y tế (Admin-Led Onboarding)', () => {
  const mockFacility = {
    id: 'FAC-TEST-001',
    facilityName: 'Bệnh viện Kiểm Thử FamiDoc',
    representativeName: 'TS. Nguyễn Văn A',
    email: 'test@hospital.vn',
    phone: '0912345678',
    address: '123 Đường Y Tế, Q.1, TP.HCM',
    onboardingStatus: 'PENDING_LEGAL' as const,
    status: 'PENDING' as const,
    createdAt: '2026-11-14T08:00:00.000Z',
  };

  const mockLegalSubmittedFacility = {
    id: 'FAC-TEST-004',
    facilityName: 'Bệnh viện Chờ Thẩm Định',
    representativeName: 'BS. Lê Minh D',
    email: 'legal@hospital.vn',
    phone: '0912345999',
    address: '88 Nguyễn Du, Hà Nội',
    onboardingStatus: 'LEGAL_SUBMITTED' as const,
    status: 'PENDING' as const,
    operatingLicense: 'GPHD-888/BYT',
    taxCode: '0108887776',
    bankName: 'Vietcombank',
    bankAccount: '001100887766',
    bankAccountHolder: 'BV CHO THAM DINH',
    hasLegalDocument: true,
    createdAt: '2026-11-14T09:00:00.000Z',
  };

  const mockActiveFacility = {
    id: 'FAC-TEST-002',
    facilityName: 'Phòng khám Đa khoa Bình An',
    representativeName: 'BS. Trần Minh B',
    email: 'binhan@clinic.vn',
    phone: '0987654321',
    address: '456 Nguyễn Huệ, Hà Nội',
    onboardingStatus: 'ACTIVE' as const,
    status: 'ACTIVE' as const,
    createdAt: '2026-11-12T08:00:00.000Z',
    taxCode: '0109998887',
    operatingLicense: 'GPHD-999/BYT',
    bankName: 'Vietcombank',
    bankAccount: '001100998877',
    bankAccountHolder: 'PK BINH AN',
    licenseFiles: ['https://cdn.famidoc.vn/legal/gphd-999.pdf'],
  };

  const mockRejectedFacility = {
    id: 'FAC-TEST-003',
    facilityName: 'Phòng khám Chờ Bổ Sung',
    representativeName: 'Lê Văn C',
    email: 'bosung@clinic.vn',
    phone: '0900111222',
    address: '789 Lê Lợi, Đà Nẵng',
    onboardingStatus: 'REJECTED' as const,
    status: 'PENDING' as const,
    createdAt: '2026-11-10T08:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(doctorsApi.getAdminDoctors).mockResolvedValue([]);
  });

  it('renders header, stat counters and initial facilities list', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Quản trị & Thẩm định Cơ sở Y tế/i);
    expect(screen.getAllByText(/Chờ Nộp Pháp Lý/i).length).toBeGreaterThan(0);

    const facilityNames = await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');
    expect(facilityNames.length).toBeGreaterThan(0);
  });

  it('opens detail modal when clicking "Chi tiết & Thẩm định" without raw sentinel text', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    const detailButtons = screen.getAllByRole('button', { name: /Chi tiết & Thẩm định|Thẩm định/i });
    fireEvent.click(detailButtons[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Hồ Sơ Chi Tiết Cơ Sở Y Tế/i)).toBeInTheDocument();
    expect(screen.getByText(/Thông Tin Tài Khoản & Đại Diện Cơ Sở Y Tế/i)).toBeInTheDocument();
    expect(screen.queryByText('CHƯA_CẬP_NHẬT')).not.toBeInTheDocument();
  });

  it('allows ADMIN to create a new facility account via "Tạo Cơ sở Y tế mới" dialog', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });
    vi.mocked(facilitiesApi.createFacilityByAdmin).mockResolvedValue({
      ...mockFacility,
      id: 'FAC-NEW-01',
      facilityName: 'Phòng khám Mới Tạo',
      email: 'moi@clinic.vn',
    });

    render(<AdminFacilitiesView />);
    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    fireEvent.click(screen.getByRole('button', { name: /Tạo Cơ sở Y tế mới/i }));

    fireEvent.change(screen.getByLabelText(/Tên Cơ sở Y tế/i), {
      target: { value: 'Phòng khám Mới Tạo' },
    });
    fireEvent.change(screen.getByLabelText(/Người đại diện/i), {
      target: { value: 'BS. Nguyễn B' },
    });
    fireEvent.change(screen.getByLabelText(/Email liên hệ/i), {
      target: { value: 'moi@clinic.vn' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0912345679' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Khởi tạo & Gửi Email/i }));

    await waitFor(() => {
      expect(facilitiesApi.createFacilityByAdmin).toHaveBeenCalledWith({
        facilityName: 'Phòng khám Mới Tạo',
        representativeName: 'BS. Nguyễn B',
        email: 'moi@clinic.vn',
        phone: '0912345679',
      });
    });
  });

  it('opens legal document via authenticated blob fetch when Admin previews uploaded scan', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockLegalSubmittedFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);
    await screen.findAllByText('Bệnh viện Chờ Thẩm Định');

    fireEvent.click(screen.getAllByRole('button', { name: /Chi tiết & Thẩm định|Thẩm định/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Xem \/ Tải GPHĐ KBCB/i }));

    await waitFor(() => {
      expect(facilitiesApi.fetchLegalDocumentBlobUrl).toHaveBeenCalledWith('FAC-TEST-004', 'operating');
      expect(openSpy).toHaveBeenCalledWith('blob:mock-doc', '_blank', 'noopener,noreferrer');
    });
    openSpy.mockRestore();
  });

  it('renders standard header, breadcrumbs, and responsive container layout', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);

    await waitFor(() => {
      expect(screen.getByText('Quản trị hệ thống')).toBeInTheDocument();
      expect(screen.getAllByText(/Quản trị & Thẩm định Cơ sở Y tế/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Quy trình hợp tác nền tảng B2B/i)).toBeInTheDocument();
    });
  });

  it('displays contact details in the table and in the detail modal', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    expect(screen.getByText(/Đại diện & Liên hệ/i)).toBeInTheDocument();

    const detailButtons = screen.getAllByRole('button', { name: /Chi tiết & Thẩm định|Thẩm định/i });
    fireEvent.click(detailButtons[0]);

    expect(screen.getByText(/Đại diện pháp luật:/i)).toBeInTheDocument();
    expect(screen.getAllByText('TS. Nguyễn Văn A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/0912345678/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/test@hospital.vn/i).length).toBeGreaterThanOrEqual(1);
  });

  it('filters facilities via status filter pills and clears empty search state', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility, mockActiveFacility, mockRejectedFacility],
      total: 3,
    });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    // Filter to REJECTED tab
    const rejectedTabBtn = screen.getByRole('button', { name: /Từ chối \/ Bổ sung/i });
    fireEvent.click(rejectedTabBtn);

    expect(screen.getAllByText('Phòng khám Chờ Bổ Sung').length).toBeGreaterThan(0);
    expect(screen.queryByText('Phòng khám Đa khoa Bình An')).not.toBeInTheDocument();

    // Search with no match and reset via "Xóa bộ lọc"
    const searchInput = screen.getByLabelText(/Tìm kiếm cơ sở y tế/i);
    fireEvent.change(searchInput, { target: { value: 'khong-ton-tai-xyz' } });

    expect(screen.getByText(/Không tìm thấy cơ sở y tế phù hợp/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Xóa bộ lọc/i }));

    expect(screen.getAllByText('Phòng khám Đa khoa Bình An').length).toBeGreaterThan(0);
  });

  it('shows error alert with retry when loading facilities fails', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities)
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce({ data: [mockFacility], total: 1 });

    render(<AdminFacilitiesView />);

    expect(await screen.findByText(/Network down/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    const facilityNames = await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');
    expect(facilityNames.length).toBeGreaterThan(0);
  });

  it('executes facility rejection via verifyLegal with approved=false and rejectionReason', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockLegalSubmittedFacility],
      total: 1,
    });
    vi.mocked(facilitiesApi.verifyLegal).mockResolvedValue({ statusCode: 200 });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Chờ Thẩm Định');
    fireEvent.click(screen.getAllByRole('button', { name: /Chi tiết & Thẩm định|Thẩm định/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Yêu cầu bổ sung \/ Từ chối/i }));

    const submitRejectBtn = screen.getByRole('button', { name: /Gửi yêu cầu/i });
    expect(submitRejectBtn).toBeDisabled();

    const reasonInput = screen.getByLabelText(/Lý do yêu cầu sửa đổi hoặc từ chối/i);
    fireEvent.change(reasonInput, { target: { value: 'Thiếu dấu giáp lai trên GPHĐ' } });
    expect(submitRejectBtn).toBeEnabled();

    fireEvent.click(submitRejectBtn);

    await waitFor(() => {
      expect(facilitiesApi.verifyLegal).toHaveBeenCalledWith('FAC-TEST-004', {
        approved: false,
        rejectionReason: 'Thiếu dấu giáp lai trên GPHĐ',
      });
    });
  });

  it('switches to Doctor CCHN tab and approves a FACILITY_VERIFIED doctor', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });
    vi.mocked(doctorsApi.getAdminDoctors).mockResolvedValue([
      {
        id: 'DOC-001',
        doctorName: 'BS. Phạm Thị Hoa',
        facility: { id: 'FAC-1', facilityName: 'BV Đa khoa FamiDoc' },
        specialty: 'Y học Gia đình',
        onboardingStatus: 'FACILITY_VERIFIED',
        credentials: [
          {
            credentialType: 'PRACTICE_LICENSE_CCHN',
            certificateNumber: 'CCHN-889900/BYT',
            issueDate: '2023-01-10',
            issuingAuthority: 'Bộ Y Tế',
            fileUrl: 'https://cdn.famidoc.vn/cchn.pdf',
          },
        ],
      },
    ] as any);
    vi.mocked(doctorsApi.platformApproveCredentials).mockResolvedValue({
      id: 'DOC-001', doctorName: 'BS. Phạm Thị Hoa', onboardingStatus: 'ACTIVE',
    } as Awaited<ReturnType<typeof doctorsApi.platformApproveCredentials>>);

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    const doctorTab = screen.getByRole('tab', { name: /Duyệt CCHN Bác Sĩ/i });
    fireEvent.mouseDown(doctorTab);
    fireEvent.click(doctorTab);

    expect(await screen.findAllByText('BS. Phạm Thị Hoa')).toBeTruthy();
    expect(screen.queryByText(/`FACILITY_VERIFIED`/)).not.toBeInTheDocument();

    const approveDocBtn = screen.getByRole('button', { name: /Duyệt Cấp 2 \(Kích hoạt ACTIVE\)/i });
    fireEvent.click(approveDocBtn);

    await waitFor(() => {
      expect(doctorsApi.platformApproveCredentials).toHaveBeenCalledWith('DOC-001', {
        approved: true,
      });
    });
  });
});
