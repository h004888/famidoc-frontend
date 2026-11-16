import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FacilityLegalView } from '../facility-legal-view';
import { AdminFacilitiesView } from '@/features/admin-facilities/components/admin-facilities-view';
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
    getMyFacilityProfile: vi.fn(),
    updateLegalProfile: vi.fn(),
    getAdminFacilities: vi.fn(),
    approveAccount: vi.fn(),
    verifyLegal: vi.fn(),
    rejectFacility: vi.fn(),
  },
}));

describe('Flow 2.1 - Nộp hồ sơ pháp lý CSYT (Cấp 2) và Admin Portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Cho phép CSYT nhập GPHĐ, MST, Ngân hàng và nộp hồ sơ thành công lên Backend API', async () => {
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue({
      id: 'fac-123',
      facilityName: 'Bệnh viện Đa khoa An Sinh',
      representativeName: 'TS. Nguyễn Văn A',
      email: 'ansinh@famidoc.vn',
      phone: '0903456789',
      address: '10 Trần Huy Liệu, TP.HCM',
      onboardingStatus: 'PENDING_LEGAL',
      status: 'PENDING',
      createdAt: '2026-11-13T10:00:00.000Z',
    });
    vi.mocked(facilitiesApi.updateLegalProfile).mockResolvedValue({ statusCode: 200 });

    render(<FacilityLegalView />);

    await screen.findByText(/Hồ Sơ Pháp Lý & Giấy Phép Hoạt Động/i);

    // Điền form với đúng placeholder
    const licenseInput = screen.getByPlaceholderText(/08921\/BYT-GPHĐ/i);
    const taxInput = screen.getByPlaceholderText(/0315892019/i);
    const bankNameInput = screen.getByPlaceholderText(/Vietcombank/i);
    const bankAccountInput = screen.getByPlaceholderText(/0071000889922/i);
    const bankHolderInput = screen.getByPlaceholderText(/CTCP BENH VIEN QUOC TE FAMICARE/i);

    fireEvent.change(licenseInput, { target: { value: '09988/BYT-GPHĐ' } });
    fireEvent.change(taxInput, { target: { value: '0315999888' } });
    fireEvent.change(bankNameInput, { target: { value: 'Vietcombank' } });
    fireEvent.change(bankAccountInput, { target: { value: '9988776655' } });
    fireEvent.change(bankHolderInput, { target: { value: 'CONG TY CP Y TE AN SINH' } });

    // Attach file
    const file = new File(['dummy'], 'gphd.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    const submitBtn = screen.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định Cấp 2/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(facilitiesApi.updateLegalProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          licenseNumber: '09988/BYT-GPHĐ',
          taxCode: '0315999888',
          bankAccountNumber: '9988776655',
          bankAccountHolder: 'CONG TY CP Y TE AN SINH',
        })
      );
    });
  });

  it('Khi Admin mở màn hình quản trị, hồ sơ CSYT nộp xuất hiện ở Tab "Chờ Pháp Lý Cấp 2" kèm nút duyệt ACTIVE', async () => {
    vi.mocked(facilitiesApi.getAdminFacilities).mockResolvedValue({
      data: [
        {
          id: 'FAC-2026-004',
          facilityName: 'Trung tâm Y tế Kỹ thuật cao An Sinh Hub',
          representativeName: 'Vũ Mạnh Cường',
          email: 'ansinh.hub@ansinh.vn',
          phone: '0903456789',
          address: '10 Trần Huy Liệu, Phường 11, Quận Phú Nhuận, TP.HCM',
          onboardingStatus: 'LEGAL_SUBMITTED',
          status: 'PENDING',
          operatingLicense: '09988/BYT-GPHĐ',
          taxCode: '0315999888',
          bankName: 'Vietcombank',
          bankAccount: '9988776655',
          bankAccountHolder: 'CONG TY CP Y TE AN SINH',
          licenseFiles: ['Giay_Phep_Hoat_Dong_KCB_2026.pdf'],
          createdAt: '2026-11-13T10:00:00.000Z',
        },
      ],
      total: 1,
    });

    render(<AdminFacilitiesView />);

    // Kiểm tra badge "Đã nộp GPHĐ • Chờ Duyệt Cấp 2" hiển thị cho CSYT
    const submittedBadges = await screen.findAllByText(/Đã nộp GPHĐ • Chờ Duyệt Cấp 2/i);
    expect(submittedBadges.length).toBeGreaterThan(0);

    // Chuyển sang Tab "Chờ Pháp Lý Cấp 2"
    const tabPendingLegal = screen.getByRole('button', { name: /Chờ Pháp Lý Cấp 2/i });
    fireEvent.click(tabPendingLegal);

    // Mở modal Chi tiết & Thẩm định của An Sinh Hub
    const detailButtons = screen.getAllByRole('button', { name: /Chi tiết & Thẩm định/i });
    fireEvent.click(detailButtons[detailButtons.length - 1]);

    // Kiểm tra thông tin đã nộp hiển thị đầy đủ trong modal
    expect(screen.getByText('09988/BYT-GPHĐ')).toBeInTheDocument();
    expect(screen.getByText('0315999888')).toBeInTheDocument();
    expect(screen.getByText(/Hồ sơ sẵn sàng thẩm định/i)).toBeInTheDocument();

    // Nút Duyệt Cấp 2: Kích Hoạt ACTIVE phải được kích hoạt (không bị disabled)
    const approveL2Btn = screen.getByRole('button', { name: /Duyệt Cấp 2: Kích Hoạt ACTIVE/i });
    expect(approveL2Btn).not.toBeDisabled();
  });
});
