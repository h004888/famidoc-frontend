import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FacilityStaffView } from '../facility-staff-view';
import { doctorsApi } from '@/lib/api/doctors.api';

const mockFacilityGateState = {
  facilityProfile: {
    id: 'FAC-1',
    verificationStatus: 'ACTIVE',
    hasActiveStaffingContract: true,
  } as any,
};

vi.mock('@/components/layout/facility-verification-gate', () => ({
  useFacilityVerificationGateState: () => mockFacilityGateState,
}));

vi.mock('@/lib/api/doctors.api', () => ({
  doctorsApi: {
    getFacilityDoctors: vi.fn(),
    createFacilityDoctor: vi.fn(),
    facilityApproveCredentials: vi.fn(),
    downloadDoctorImportTemplate: vi.fn(),
    previewDoctorsExcelImport: vi.fn(),
    confirmDoctorsBulkImport: vi.fn(),
  },
}));

describe('FacilityStaffView - Quản lý Đội ngũ Bác sĩ Trực thuộc (Flow 2.1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockFacilityGateState.facilityProfile = {
      id: 'FAC-1',
      verificationStatus: 'ACTIVE',
      hasActiveStaffingContract: true,
    };
    vi.mocked(doctorsApi.getFacilityDoctors).mockResolvedValue([
      {
        id: 'DOC-7901',
        doctorName: 'BS.CKII Trần Thanh Mai',
        specialty: 'Khoa Y học Gia đình',
        onboardingStatus: 'ACTIVE',
        cchnNumber: '004128/HCM-CCHN',
        issueDate: '2014-06-15',
      },
      {
        id: 'DOC-7905',
        doctorName: 'ThS.BS Vũ Đình Trọng',
        specialty: 'Khoa Nội tiết',
        onboardingStatus: 'PENDING_FACILITY_REVIEW',
        cchnNumber: '006733/HCM-CCHN',
        issueDate: '2022-08-02',
      },
    ]);
  });

  it('renders header, filter controls, and default doctor staff list', async () => {
    render(<FacilityStaffView />);

    expect(screen.getByText('Quản lý Đội ngũ Bác sĩ Trực thuộc')).toBeInTheDocument();
    expect(screen.getByText('Thêm Bác Sĩ Mới')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('BS.CKII Trần Thanh Mai').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ThS.BS Vũ Đình Trọng').length).toBeGreaterThan(0);
    });
  });

  it('opens modal, creates a new doctor, shows default password modal, and adds doctor to the list', async () => {
    vi.mocked(doctorsApi.createFacilityDoctor).mockImplementation(async (payload: any) => {
      const created = {
        id: 'DOC-8899',
        doctorName: payload.doctorName || 'BS. Phan Văn Minh',
        email: payload.email || 'minh.phan@ansinhhospital.vn',
        phone: payload.phone || '0988123456',
        specialty: payload.specialty || 'Khoa Y học Gia đình',
        onboardingStatus: 'PENDING_SUBMISSION',
      };
      vi.mocked(doctorsApi.getFacilityDoctors).mockResolvedValue([
        created,
        {
          id: 'DOC-7901',
          doctorName: 'BS.CKII Trần Thanh Mai',
          specialty: 'Khoa Y học Gia đình',
          onboardingStatus: 'ACTIVE',
        },
      ]);
      return { data: created };
    });

    render(<FacilityStaffView />);

    await waitFor(() => {
      expect(screen.getByText('Thêm Bác Sĩ Mới')).toBeInTheDocument();
    });

    // Click "Thêm Bác Sĩ Mới"
    fireEvent.click(screen.getByText('Thêm Bác Sĩ Mới'));

    expect(screen.getByText('Khởi tạo Tài khoản Bác sĩ Trực thuộc')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/ThS.BS Phan Văn Minh/i), {
      target: { value: 'BS. Phan Văn Minh' },
    });
    fireEvent.change(screen.getByPlaceholderText(/minh.phan@ansinhhospital.vn/i), {
      target: { value: 'minh.phan@ansinhhospital.vn' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0988123456/i), {
      target: { value: '0988123456' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Khởi tạo Bác sĩ' }));

    await waitFor(() => {
      expect(doctorsApi.createFacilityDoctor).toHaveBeenCalledWith(
        expect.objectContaining({
          doctorName: 'BS. Phan Văn Minh',
          email: 'minh.phan@ansinhhospital.vn',
          phone: '0988123456',
        })
      );
      // Success modal displayed without hardcoded password
      expect(screen.getByText('Khởi Tạo Bác Sĩ Thành Công!')).toBeInTheDocument();
      expect(screen.getByText(/Đã gửi qua email bác sĩ/i)).toBeInTheDocument();
      expect(screen.queryByText('FamiDoc@Doctor2026')).not.toBeInTheDocument();
    });

    // Close success modal
    fireEvent.click(screen.getByText('Đã hiểu & Đóng'));

    // Verify doctor is added to the table
    expect(screen.getAllByText('BS. Phan Văn Minh').length).toBeGreaterThan(0);
    expect(screen.getByText('minh.phan@ansinhhospital.vn')).toBeInTheDocument();

    // Verify localStorage does not store mock doctor
    expect(localStorage.getItem('famidoc_facility_doctors')).toBeNull();
  });

  it('requires confirmation dialog before executing Duyệt Cấp 1 for doctor pending facility review', async () => {
    vi.mocked(doctorsApi.facilityApproveCredentials).mockResolvedValue({ success: true });

    render(<FacilityStaffView />);

    await waitFor(() => {
      expect(screen.getAllByText('ThS.BS Vũ Đình Trọng').length).toBeGreaterThan(0);
    });

    // Doctor "ThS.BS Vũ Đình Trọng" has status PENDING_FACILITY_REVIEW
    const approveBtns = screen.getAllByRole('button', { name: 'Duyệt Cấp 1' });
    expect(approveBtns.length).toBeGreaterThan(0);

    fireEvent.click(approveBtns[0]);
    expect(doctorsApi.facilityApproveCredentials).not.toHaveBeenCalled();

    const confirmBtn = await screen.findByRole('button', { name: /Xác nhận duyệt Cấp 1/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(doctorsApi.facilityApproveCredentials).toHaveBeenCalledWith('DOC-7905', expect.any(Object));
      expect(screen.getByText(/Đã duyệt Cấp 1 \(Chờ Admin\)/i)).toBeInTheDocument();
    });
  });

  it('surfaces fetch error alert with retry button when getFacilityDoctors fails', async () => {
    vi.mocked(doctorsApi.getFacilityDoctors)
      .mockRejectedValueOnce(new Error('Không kết nối được danh sách bác sĩ'))
      .mockResolvedValueOnce([]);

    render(<FacilityStaffView />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Không kết nối được danh sách bác sĩ/i);

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));
    await waitFor(() => {
      expect(doctorsApi.getFacilityDoctors).toHaveBeenCalledTimes(2);
    });
  });

  it('displays B2B contract notice and disables "Thêm Bác Sĩ Mới" when hasActiveStaffingContract is false', async () => {
    mockFacilityGateState.facilityProfile = {
      id: 'FAC-1',
      verificationStatus: 'ACTIVE',
      hasActiveStaffingContract: false,
    };

    render(<FacilityStaffView />);

    expect(
      await screen.findByText(/Chưa có Hợp đồng Hợp tác B2B đang hiệu lực/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Bác Sĩ Mới/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Import Excel/i })).toBeDisabled();
  });

  it('renders rejectionReason and mobile Tier-1 "Duyệt Cấp 1" actions for affiliated doctors', async () => {
    vi.mocked(doctorsApi.getFacilityDoctors).mockResolvedValueOnce([
      {
        id: 'DOC-REJ',
        doctorName: 'BS. Lê Văn Bị Từ Chối',
        specialty: 'Khoa Nội Tổng quát',
        onboardingStatus: 'PENDING_SUBMISSION',
        rejectionReason: 'Ảnh CCHN bị mờ góc',
      },
      {
        id: 'DOC-REV',
        doctorName: 'BS. Nguyễn Thị Chờ Duyệt',
        specialty: 'Khoa Y học Gia đình',
        onboardingStatus: 'PENDING_FACILITY_REVIEW',
      },
    ]);

    render(<FacilityStaffView />);

    expect(await screen.findByText(/Ảnh CCHN bị mờ góc/i)).toBeInTheDocument();
    const approveButtons = screen.getAllByRole('button', { name: 'Duyệt Cấp 1' });
    expect(approveButtons.length).toBe(2);
  });

  it('validates single-doctor creation form, resets createError on reopen, shows warning when mailSent=false, and filters Y học gia đình', async () => {
    vi.mocked(doctorsApi.getFacilityDoctors).mockResolvedValue([
      {
        id: 'DOC-YHGĐ',
        doctorName: 'BS. Nguyễn Gia Đình',
        specialty: 'Y học gia đình',
        onboardingStatus: 'ACTIVE',
      },
      {
        id: 'DOC-NT',
        doctorName: 'BS. Trần Nội Tiết',
        specialty: 'Khoa Nội tiết',
        onboardingStatus: 'ACTIVE',
      },
    ]);

    render(<FacilityStaffView />);
    await screen.findAllByText('BS. Nguyễn Gia Đình');

    // Bộ lọc chuyên khoa 'Y học gia đình' khớp bác sĩ mặc định
    const specialtyFilter = screen.getByLabelText('Lọc theo chuyên khoa');
    fireEvent.change(specialtyFilter, { target: { value: 'Y học gia đình' } });
    expect(screen.getAllByText('BS. Nguyễn Gia Đình').length).toBeGreaterThan(0);
    expect(screen.queryByText('BS. Trần Nội Tiết')).not.toBeInTheDocument();

    // Mở modal tạo bác sĩ -> nhập SĐT sai -> báo lỗi client -> đóng và mở lại -> createError đã được reset
    fireEvent.click(screen.getByRole('button', { name: /Thêm Bác Sĩ Mới/i }));
    fireEvent.change(screen.getByPlaceholderText(/ThS.BS Phan Văn Minh/i), {
      target: { value: 'BS. Lê Văn Test' },
    });
    fireEvent.change(screen.getByPlaceholderText(/minh.phan@ansinhhospital.vn/i), {
      target: { value: 'test@hospital.vn' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0988123456/i), {
      target: { value: '0|12345678' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Khởi tạo Bác sĩ' }));

    expect(
      await screen.findByText(/Số điện thoại không đúng định dạng di động Việt Nam/i)
    ).toBeInTheDocument();
    expect(doctorsApi.createFacilityDoctor).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Hủy bỏ' }));
    fireEvent.click(screen.getByRole('button', { name: /Thêm Bác Sĩ Mới/i }));
    expect(
      screen.queryByText(/Số điện thoại không đúng định dạng di động Việt Nam/i)
    ).not.toBeInTheDocument();

    // Nhập hợp lệ với +84 -> server trả mailSent=false -> hiện cảnh báo email thất bại
    vi.mocked(doctorsApi.createFacilityDoctor).mockResolvedValueOnce({
      data: {
        id: 'DOC-MAIL-FAIL',
        doctorName: 'BS. Lê Văn Test',
        email: 'test@hospital.vn',
        phone: '0988123456',
        mailSent: false,
        mailWarning: 'Tài khoản đã được tạo nhưng gửi email thông tin đăng nhập thất bại',
      },
    });

    fireEvent.change(screen.getByPlaceholderText(/ThS.BS Phan Văn Minh/i), {
      target: { value: 'BS. Lê Văn Test' },
    });
    fireEvent.change(screen.getByPlaceholderText(/minh.phan@ansinhhospital.vn/i), {
      target: { value: 'test@hospital.vn' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0988123456/i), {
      target: { value: '+84988123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Khởi tạo Bác sĩ' }));

    await waitFor(() => {
      expect(doctorsApi.createFacilityDoctor).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '0988123456' })
      );
    });
    expect(
      await screen.findByText(/Tài khoản đã được tạo nhưng gửi email thông tin đăng nhập thất bại/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Gửi email thất bại')).toBeInTheDocument();
  });
});
