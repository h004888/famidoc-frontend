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

  it('links "Chi tiết & Thẩm định" directly to the facility detail page without opening a modal', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    const detailLinks = screen.getAllByRole('link', { name: /Chi tiết & Thẩm định/i });
    expect(detailLinks.length).toBeGreaterThan(0);
    detailLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', `/admin/facilities/${mockFacility.id}`);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

  it('displays contact details in the table and links directly to facility detail page', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);

    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    expect(screen.getByText(/Đại diện & Liên hệ/i)).toBeInTheDocument();
    expect(screen.getAllByText('TS. Nguyễn Văn A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/0912345678/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/test@hospital.vn/i).length).toBeGreaterThanOrEqual(1);

    const detailLinks = screen.getAllByRole('link', { name: /Chi tiết & Thẩm định/i });
    expect(detailLinks[0]).toHaveAttribute('href', `/admin/facilities/${mockFacility.id}`);
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

    expect(
      await screen.findByText(/Không thể tải danh sách cơ sở y tế từ máy chủ/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    const facilityNames = await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');
    expect(facilityNames.length).toBeGreaterThan(0);
  });

  it('switches to Doctor CCHN tab, shows PENDING_FACILITY_REVIEW, and confirms before Tier-2 approval', async () => {
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
            credentialType: 'DEGREE',
            certificateNumber: 'DEG-111',
            issueDate: '2018-01-10',
            issuingAuthority: 'ĐH Y',
            fileUrl: 'https://cdn.famidoc.vn/deg.pdf',
          },
          {
            credentialType: 'PRACTICE_LICENSE_CCHN',
            certificateNumber: 'CCHN-889900/BYT',
            issueDate: '2023-01-10',
            issuingAuthority: 'Bộ Y Tế',
            fileUrl: 'https://cdn.famidoc.vn/cchn.pdf',
          },
        ],
      },
      {
        id: 'DOC-002',
        doctorName: 'BS. Trần Minh Tâm',
        facility: { id: 'FAC-1', facilityName: 'BV Đa khoa FamiDoc' },
        specialty: 'Y học Gia đình',
        onboardingStatus: 'PENDING_FACILITY_REVIEW',
        credentials: [
          {
            credentialType: 'PRACTICE_LICENSE_CCHN',
            certificateNumber: 'CCHN-223344/BYT',
            issueDate: '2024-01-10',
            issuingAuthority: 'Bộ Y Tế',
            fileUrl: 'https://cdn.famidoc.vn/cchn2.pdf',
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
    expect(screen.getAllByText('BS. Trần Minh Tâm').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CCHN-889900/BYT').length).toBeGreaterThan(0);
    expect(screen.queryByText(/`FACILITY_VERIFIED`/)).not.toBeInTheDocument();

    const approveDocBtn = screen.getByRole('button', { name: /Duyệt Cấp 2 \(Kích hoạt ACTIVE\)/i });
    fireEvent.click(approveDocBtn);

    expect(doctorsApi.platformApproveCredentials).not.toHaveBeenCalled();

    const confirmBtn = await screen.findByRole('button', { name: /Xác nhận kích hoạt ACTIVE/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(doctorsApi.platformApproveCredentials).toHaveBeenCalledWith('DOC-001', {
        approved: true,
      });
    });
  });

  it('validates Admin Create Facility form client-side and normalizes +84 phone', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });
    vi.mocked(facilitiesApi.createFacilityByAdmin).mockResolvedValue({
      ...mockFacility,
      id: 'FAC-NEW-02',
      facilityName: 'Phòng khám Chuẩn SĐT',
      email: 'chuan@clinic.vn',
    });

    render(<AdminFacilitiesView />);
    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    fireEvent.click(screen.getByRole('button', { name: /Tạo Cơ sở Y tế mới/i }));

    fireEvent.change(screen.getByLabelText(/Tên Cơ sở Y tế/i), {
      target: { value: 'AB' },
    });
    fireEvent.change(screen.getByLabelText(/Người đại diện/i), {
      target: { value: 'A' },
    });
    fireEvent.change(screen.getByLabelText(/Email liên hệ/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0|12345678' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Khởi tạo & Gửi Email/i }));

    expect(await screen.findByText(/Tên cơ sở y tế phải từ 3 đến 255 ký tự/i)).toBeInTheDocument();
    expect(screen.getByText(/Tên người đại diện phải từ 2 đến 100 ký tự/i)).toBeInTheDocument();
    expect(screen.getByText(/Định dạng email không hợp lệ/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Số điện thoại không đúng định dạng di động Việt Nam/i)
    ).toBeInTheDocument();
    expect(facilitiesApi.createFacilityByAdmin).not.toHaveBeenCalled();

    // Fix inputs with +84 phone -> normalized to 0912345679
    fireEvent.change(screen.getByLabelText(/Tên Cơ sở Y tế/i), {
      target: { value: 'Phòng khám Chuẩn SĐT' },
    });
    fireEvent.change(screen.getByLabelText(/Người đại diện/i), {
      target: { value: 'BS. Nguyễn Văn B' },
    });
    fireEvent.change(screen.getByLabelText(/Email liên hệ/i), {
      target: { value: 'chuan@clinic.vn' },
    });
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '+84 912 345 679' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Khởi tạo & Gửi Email/i }));

    await waitFor(() => {
      expect(facilitiesApi.createFacilityByAdmin).toHaveBeenCalledWith({
        facilityName: 'Phòng khám Chuẩn SĐT',
        representativeName: 'BS. Nguyễn Văn B',
        email: 'chuan@clinic.vn',
        phone: '0912345679',
      });
    });
  });

  it('renders 5 facility status filter tabs in a single non-wrapping row separated from search input', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [mockFacility],
      total: 1,
    });

    render(<AdminFacilitiesView />);
    await screen.findAllByText('Bệnh viện Kiểm Thử FamiDoc');

    const allTab = screen.getByRole('button', { name: /Tất cả/i });
    const filterContainer = allTab.parentElement!;
    expect(filterContainer.className).toContain('flex-nowrap');
    expect(filterContainer.className).toContain('overflow-x-auto');
    expect(filterContainer.className).not.toContain('flex-wrap');
    expect(filterContainer.parentElement?.className).not.toContain('lg:flex-row');
  });
});
