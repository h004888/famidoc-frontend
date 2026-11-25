import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FacilityLegalView } from '../facility-legal-view';
import { AdminFacilitiesView } from '@/features/admin-facilities/components/admin-facilities-view';
import { facilitiesApi } from '@/lib/api/facilities.api';
import { doctorsApi } from '@/lib/api/doctors.api';
import { FACILITY_GATE_REFRESH_EVENT } from '@/components/layout/facility-verification-gate';

const mockRouterReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: vi.fn() }),
}));

vi.mock('@/lib/api/public.api', () => ({
  publicApi: {
    getBanks: vi.fn().mockResolvedValue([
      {
        id: 43,
        name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
        code: 'VCB',
        bin: '970436',
        shortName: 'Vietcombank',
        logo: 'https://api.vietqr.io/img/VCB.png',
        transferSupported: 1,
        lookupSupported: 1,
      },
      {
        id: 4,
        name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
        code: 'BIDV',
        bin: '970418',
        shortName: 'BIDV',
        logo: 'https://api.vietqr.io/img/BIDV.png',
        transferSupported: 1,
        lookupSupported: 1,
      },
      {
        id: 99,
        name: 'Ngân hàng Hạn chế VietQR',
        code: 'LIM',
        bin: '970499',
        shortName: 'LimitBank',
        logo: '',
        transferSupported: 0,
        lookupSupported: 0,
      },
    ]),
  },
}));

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
    createFacilityByAdmin: vi.fn(),
    verifyLegal: vi.fn(),
    fetchLegalDocumentBlobUrl: vi.fn().mockResolvedValue('blob:legal-doc'),
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
    const issuerInput = screen.getByPlaceholderText(/Cục Quản lý Khám chữa bệnh/i);
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const addressInput = screen.getByPlaceholderText(/Số nhà, tên đường/i);
    const taxInput = screen.getByPlaceholderText(/0315892019/i);
    const bankAccountInput = screen.getByPlaceholderText(/0071000889922/i);
    const bankHolderInput = screen.getByPlaceholderText(/CTCP BENH VIEN QUOC TE FAMICARE/i);

    fireEvent.change(licenseInput, { target: { value: '09988/BYT-GPHĐ' } });
    fireEvent.change(issuerInput, { target: { value: 'Bộ Y tế' } });
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: '2024-05-15' } });
    }
    fireEvent.change(addressInput, { target: { value: '10 Trần Huy Liệu, Quận Phú Nhuận, TP.HCM' } });
    fireEvent.change(taxInput, { target: { value: '0315999888' } });

    // Chọn ngân hàng từ danh sách VietQR Combobox
    const bankTrigger = screen.getByTestId('bank-selector-trigger');
    fireEvent.click(bankTrigger);
    const bankSearchInput = await screen.findByLabelText(/Tìm kiếm ngân hàng/i);
    fireEvent.change(bankSearchInput, { target: { value: 'Vietcombank' } });
    const vcbOption = await screen.findByRole('option', { name: /Vietcombank/i });
    fireEvent.click(vcbOption.querySelector('button')!);

    fireEvent.change(bankAccountInput, { target: { value: '9988776655' } });
    fireEvent.change(bankHolderInput, { target: { value: 'CONG TY CP Y TE AN SINH' } });

    // Chờ debounce 500ms để render ảnh VietQR preview chuẩn Quick Link SVG
    const qrImg = await screen.findByAltText(/Mã VietQR VCB/i, {}, { timeout: 2000 });
    expect(qrImg.getAttribute('src')).toBe(
      'https://img.vietqr.io/image/970436-9988776655-compact2.svg?accountName=CONG+TY+CP+Y+TE+AN+SINH'
    );

    // Attach both separate files
    const operatingFile = new File(['dummy-gphd'], 'gphd.pdf', { type: 'application/pdf' });
    const businessFile = new File(['dummy-dkkd'], 'dkkd.pdf', { type: 'application/pdf' });
    const operatingInput = screen.getByTestId('operating-license-input') as HTMLInputElement;
    const businessInput = screen.getByTestId('business-license-input') as HTMLInputElement;
    fireEvent.change(operatingInput, { target: { files: [operatingFile] } });
    fireEvent.change(businessInput, { target: { files: [businessFile] } });

    const submitBtn = screen.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(facilitiesApi.updateLegalProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          licenseNumber: '09988/BYT-GPHĐ',
          licenseIssuer: 'Bộ Y tế',
          licenseDate: '2024-05-15',
          address: '10 Trần Huy Liệu, Quận Phú Nhuận, TP.HCM',
          taxCode: '0315999888',
          bankName: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam',
          bankBin: '970436',
          bankCode: 'VCB',
          bankAccountNumber: '9988776655',
          bankAccountHolder: 'CONG TY CP Y TE AN SINH',
          operatingLicenseFile: operatingFile,
          businessLicenseFile: businessFile,
        })
      );
    });
  });

  it('Hiển thị lý do từ chối pháp lý (legalRejectionReason) khi Admin yêu cầu CSYT bổ sung', async () => {
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue({
      id: 'fac-123',
      facilityName: 'Bệnh viện Đa khoa An Sinh',
      representativeName: 'TS. Nguyễn Văn A',
      email: 'ansinh@famidoc.vn',
      phone: '0903456789',
      address: '10 Trần Huy Liệu, TP.HCM',
      onboardingStatus: 'REJECTED',
      status: 'PENDING',
      legalRejectionReason: 'Ảnh chụp GPHĐ bị mờ góc phải, vui lòng upload lại bản rõ nét.',
      createdAt: '2026-11-13T10:00:00.000Z',
    });

    render(<FacilityLegalView />);
    expect(
      await screen.findByText(/Ảnh chụp GPHĐ bị mờ góc phải, vui lòng upload lại bản rõ nét./i)
    ).toBeInTheDocument();
  });

  it('Khi Admin mở màn hình quản trị, hồ sơ CSYT nộp xuất hiện ở Tab "Chờ Pháp Lý Cấp 2" kèm liên kết vào trang chi tiết & thẩm định', async () => {
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
          hasOperatingLicense: true,
          hasBusinessLicense: true,
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

    // Nút "Chi tiết & Thẩm định" dẫn thẳng sang trang hồ sơ chi tiết để duyệt
    const detailLinks = screen.getAllByRole('link', { name: /Chi tiết & Thẩm định/i });
    expect(detailLinks.length).toBeGreaterThan(0);
    expect(detailLinks[0]).toHaveAttribute('href', '/admin/facilities/FAC-2026-004');
  });

  it('Hiển thị lỗi validation và không render ảnh VietQR preview khi số tài khoản chỉ gồm số 0', async () => {
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

    render(<FacilityLegalView />);
    await screen.findByText(/Hồ Sơ Pháp Lý & Giấy Phép Hoạt Động/i);

    fireEvent.click(screen.getByTestId('bank-selector-trigger'));
    const vcbOption = await screen.findByRole('option', { name: /Vietcombank/i });
    fireEvent.click(vcbOption.querySelector('button')!);

    const bankAccountInput = screen.getByPlaceholderText(/0071000889922/i);
    fireEvent.change(bankAccountInput, { target: { value: '000000' } });

    await new Promise((resolve) => setTimeout(resolve, 550));
    expect(screen.queryByAltText(/Mã VietQR/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i }));

    expect(
      await screen.findByText(/Số tài khoản ngân hàng chỉ gồm chữ hoặc số \(tối đa 19 ký tự\) và không chỉ gồm số 0/i)
    ).toBeInTheDocument();
    expect(facilitiesApi.updateLegalProfile).not.toHaveBeenCalled();
  });

  it('Không cắt cụt STK khi dán chuỗi > 19 ký tự có khoảng trắng, cảnh báo ngân hàng hạn chế VietQR, chuẩn hóa tên chủ TK và validate độ dài DTO', async () => {
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

    render(<FacilityLegalView />);
    await screen.findByText(/Hồ Sơ Pháp Lý & Giấy Phép Hoạt Động/i);

    const bankAccountInput = screen.getByPlaceholderText(/0071000889922/i) as HTMLInputElement;
    expect(bankAccountInput).not.toHaveAttribute('maxLength');
    fireEvent.change(bankAccountInput, { target: { value: '0011 0022 3344 5566 77' } });
    expect(bankAccountInput.value).toBe('001100223344556677');

    // Chọn ngân hàng hạn chế VietQR
    fireEvent.click(screen.getByTestId('bank-selector-trigger'));
    const limitOption = await screen.findByRole('option', { name: /LimitBank/i });
    fireEvent.click(limitOption.querySelector('button')!);
    expect(
      await screen.findByText(/hiện hạn chế tính năng chuyển khoản nhanh hoặc tra cứu qua VietQR/i)
    ).toBeInTheDocument();

    // Kiểm tra validate độ dài khớp DTO
    fireEvent.change(screen.getByPlaceholderText(/08921\/BYT-GPHĐ/i), {
      target: { value: 'AB' },
    });
    fireEvent.change(screen.getByPlaceholderText(/0315892019/i), {
      target: { value: '1'.repeat(21) },
    });
    fireEvent.change(screen.getByPlaceholderText(/1900 8821/i), {
      target: { value: '0'.repeat(16) },
    });
    fireEvent.change(screen.getByPlaceholderText(/CTCP BENH VIEN QUOC TE FAMICARE/i), {
      target: { value: 'A'.repeat(101) },
    });

    fireEvent.click(screen.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i }));

    expect(await screen.findByText(/Số giấy phép hoạt động phải từ 3 đến 50 ký tự/i)).toBeInTheDocument();
    expect(screen.getByText(/Mã số thuế phải từ 10 đến 20 ký tự/i)).toBeInTheDocument();
    expect(screen.getByText(/Hotline tối đa 15 ký tự/i)).toBeInTheDocument();
    expect(screen.getByText(/Tên chủ tài khoản tối đa 100 ký tự/i)).toBeInTheDocument();
  });

  it('Chấp nhận ngày cấp là hôm nay theo múi giờ Việt Nam (00:00–06:59 UTC+7) và revoke Blob URL khi xem lại tài liệu', async () => {
    vi.useFakeTimers();
    const revokeSpy = vi.fn();
    const originalRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = revokeSpy;
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    try {
      // 2026-11-17T18:30:00.000Z === 2026-11-18 01:30:00 UTC+7
      vi.setSystemTime(new Date('2026-11-17T18:30:00.000Z'));

      vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue({
        id: 'fac-123',
        facilityName: 'Bệnh viện Đa khoa An Sinh',
        representativeName: 'TS. Nguyễn Văn A',
        email: 'ansinh@famidoc.vn',
        phone: '0903456789',
        address: '10 Trần Huy Liệu, TP.HCM',
        onboardingStatus: 'REJECTED',
        legalRejectionReason: 'Cần cập nhật lại ngày cấp',
        status: 'PENDING',
        hasOperatingLicense: true,
        hasBusinessLicense: true,
        operatingLicense: '09988/BYT-GPHĐ',
        licenseIssuer: 'Bộ Y tế',
        licenseDate: '2026-11-18',
        taxCode: '0315999888',
        bankName: 'Vietcombank',
        bankAccount: '9988776655',
        bankAccountHolder: 'CONG TY AN SINH',
        createdAt: '2026-11-13T10:00:00.000Z',
      });
      vi.mocked(facilitiesApi.updateLegalProfile).mockResolvedValueOnce({
        id: 'fac-123',
        facilityName: 'Bệnh viện Đa khoa An Sinh',
        representativeName: 'TS. Nguyễn Văn A',
        email: 'ansinh@famidoc.vn',
        phone: '0903456789',
        address: '10 Trần Huy Liệu, TP.HCM',
        onboardingStatus: 'REJECTED',
        legalRejectionReason: 'Cần cập nhật lại ngày cấp',
        status: 'PENDING',
        hasOperatingLicense: true,
        hasBusinessLicense: true,
        createdAt: '2026-11-13T10:00:00.000Z',
      });

      render(<FacilityLegalView />);
      await vi.waitFor(() => {
        expect(screen.getByText(/Hồ Sơ Pháp Lý & Giấy Phép Hoạt Động/i)).toBeInTheDocument();
      });

      // Preview tài liệu -> mở tab và lên lịch revokeObjectURL
      const viewButtons = screen.getAllByRole('button', { name: /Xem lại/i });
      fireEvent.click(viewButtons[0]);
      await vi.waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith('blob:legal-doc', '_blank', 'noopener,noreferrer');
      });
      vi.advanceTimersByTime(60_000);
      expect(revokeSpy).toHaveBeenCalledWith('blob:legal-doc');

      // Submit với ngày cấp là hôm nay theo giờ VN (2026-11-18)
      fireEvent.click(screen.getByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i }));
      await vi.waitFor(() => {
        expect(facilitiesApi.updateLegalProfile).toHaveBeenCalledWith(
          expect.objectContaining({ licenseDate: '2026-11-18' })
        );
      });
    } finally {
      vi.useRealTimers();
      URL.revokeObjectURL = originalRevoke;
      openSpy.mockRestore();
    }
  });

  it('omits redundant ACTIVE banner and uses "Giấy phép kinh doanh" wording everywhere', async () => {
    vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValue({
      id: 'fac-123',
      facilityName: 'Bệnh viện Đa khoa An Sinh',
      representativeName: 'TS. Nguyễn Văn A',
      email: 'ansinh@famidoc.vn',
      phone: '0903456789',
      address: '10 Trần Huy Liệu, TP.HCM',
      onboardingStatus: 'ACTIVE',
      status: 'ACTIVE',
      hasOperatingLicense: true,
      hasBusinessLicense: true,
      createdAt: '2026-11-13T10:00:00.000Z',
    });

    const { container } = render(<FacilityLegalView />);
    await screen.findByText(/Hồ Sơ Pháp Lý & Giấy Phép Hoạt Động/i);

    expect(
      screen.queryByText(/Cơ sở y tế đã hoàn tất hậu kiểm pháp lý và được kích hoạt đối tác ACTIVE!/i),
    ).not.toBeInTheDocument();

    expect(screen.getByText(/2\. Giấy phép kinh doanh/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Bản scan Giấy phép kinh doanh \(hoặc Quyết định thành lập nếu là cơ sở công lập\) có Mã số thuế/i,
      ),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/ĐKKD|Đăng ký doanh nghiệp|đăng ký kinh doanh/i);
  });

  it('dispatches FACILITY_GATE_REFRESH_EVENT and redirects to /facility after successful submit, and locks form when LEGAL_SUBMITTED', async () => {
    mockRouterReplace.mockClear();
    const refreshListener = vi.fn();
    window.addEventListener(FACILITY_GATE_REFRESH_EVENT, refreshListener);

    try {
      vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValueOnce({
        id: 'fac-123',
        facilityName: 'Bệnh viện Đa khoa An Sinh',
        representativeName: 'TS. Nguyễn Văn A',
        email: 'ansinh@famidoc.vn',
        phone: '0903456789',
        address: '10 Trần Huy Liệu, TP.HCM',
        onboardingStatus: 'PENDING_LEGAL',
        status: 'PENDING',
        hasOperatingLicense: true,
        hasBusinessLicense: true,
        operatingLicense: '09988/BYT-GPHĐ',
        licenseIssuer: 'Bộ Y tế',
        licenseDate: '2024-01-15',
        taxCode: '0315999888',
        bankName: 'Vietcombank',
        bankAccount: '9988776655',
        bankAccountHolder: 'CONG TY AN SINH',
        createdAt: '2026-11-13T10:00:00.000Z',
      });
      vi.mocked(facilitiesApi.updateLegalProfile).mockResolvedValueOnce({
        id: 'fac-123',
        facilityName: 'Bệnh viện Đa khoa An Sinh',
        representativeName: 'TS. Nguyễn Văn A',
        email: 'ansinh@famidoc.vn',
        phone: '0903456789',
        address: '10 Trần Huy Liệu, TP.HCM',
        onboardingStatus: 'LEGAL_SUBMITTED',
        status: 'PENDING',
        hasOperatingLicense: true,
        hasBusinessLicense: true,
        createdAt: '2026-11-13T10:00:00.000Z',
      });

      const firstRender = render(<FacilityLegalView />);
      const submitBtn = await screen.findByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(facilitiesApi.updateLegalProfile).toHaveBeenCalled();
        expect(refreshListener).toHaveBeenCalled();
        expect(mockRouterReplace).toHaveBeenCalledWith('/facility');
      });
      firstRender.unmount();

      vi.mocked(facilitiesApi.getMyFacilityProfile).mockResolvedValueOnce({
        id: 'fac-123',
        facilityName: 'Bệnh viện Đa khoa An Sinh',
        representativeName: 'TS. Nguyễn Văn A',
        email: 'ansinh@famidoc.vn',
        phone: '0903456789',
        address: '10 Trần Huy Liệu, TP.HCM',
        onboardingStatus: 'LEGAL_SUBMITTED',
        status: 'PENDING',
        hasOperatingLicense: true,
        hasBusinessLicense: true,
        operatingLicense: '09988/BYT-GPHĐ',
        createdAt: '2026-11-13T10:00:00.000Z',
      });

      render(<FacilityLegalView />);
      const gphdInput = await screen.findByPlaceholderText(/08921\/BYT-GPHĐ/i);
      expect(gphdInput).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: /Gửi Hồ Sơ Pháp Lý Thẩm Định/i }),
      ).not.toBeInTheDocument();
    } finally {
      window.removeEventListener(FACILITY_GATE_REFRESH_EVENT, refreshListener);
    }
  });
});
