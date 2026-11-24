import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorContractInitiationPanel } from '../doctor-contract-initiation-panel';
import { contractsApi, matchingApi, patientsApi, publicApi } from '@/lib/api';
import { ApiError } from '@/lib/http/errors';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const mockDoctor = {
  id: 'doc-1',
  doctorName: 'Trương Hán Siêu',
  academicTitle: 'ThS. BS',
  specialty: 'Cơ Xương Khớp',
  specialtyKey: 'general',
  isVerified: true,
  isAvailable: true,
  panel: { activeCount: 10, maxCapacity: 30 },
  stats: {
    experienceYears: 21,
    ratingAvg: 4.99,
    totalReviews: 128,
    completedEncounters: 0,
  },
  facility: {
    id: 'fac-1',
    facilityName: 'Bệnh viện Nhi Đồng 1',
    address: '341 Sư Vạn Hạnh',
    verificationStatus: 'ACTIVE',
  },
  credentials: [],
  treatedCases: [],
  careModel: { serviceModes: [], commitments: [] },
  carePackages: [
    {
      id: 'pkg-3m',
      packageCode: 'DONG_HANH_V2',
      packageName: 'Đồng hành',
      durationMonths: 3,
      basePrice: 2850000,
      formattedPrice: '2.850.000đ',
      periodicVisitsQuota: 3,
      telehealthQuota: 4,
      includedMembers: 3,
      maxMembers: 6,
      additionalMemberMonthlyPrice: 75000,
    },
  ],
  reviews: { ratingAvg: 4.99, totalReviews: 128, items: [] },
};

describe('DoctorContractInitiationPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValue([]);
    vi.spyOn(matchingApi, 'getMatchingOptions').mockResolvedValue({
      areas: [
        {
          city: 'Thành phố Hà Nội',
          districts: ['Phường Láng Thượng', 'Phường Thượng Đình'],
        },
        {
          city: 'Thành phố Hồ Chí Minh',
          districts: ['Phường Bến Nghé'],
        },
      ],
      ageGroups: [],
      careCategories: [],
      academicTitles: [],
    } as never);
    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      familyUnit: {
        id: 'fam-1',
        homeAddress: 'Số 10 Nguyễn Trãi, Phường Thượng Đình, Thành phố Hà Nội',
        emergencyPhone: '0900000000',
        representativeName: 'Nguyễn Văn A',
      },
      patientCount: 1,
    });
    vi.spyOn(contractsApi, 'previewFourPartyDraftPdf').mockResolvedValue(
      new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    );
    if (!URL.createObjectURL) {
      Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => 'blob:mock-pdf'),
      });
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-pdf');
    }
    if (!URL.revokeObjectURL) {
      Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
      });
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    }
  });

  it('không chọn patientIds trước thanh toán, suy ra facility, ghép địa chỉ 2 phần và khởi tạo hợp đồng 4 bên', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    const initiateSpy = vi
      .spyOn(contractsApi, 'initiateFourPartyContract')
      .mockResolvedValueOnce({
        id: 'ctr-real-99',
        documensoEnvelopeId: 'env-101',
        signingToken: 'tok-ben-a',
        signingUrl: 'https://sign.famidoc.online/sign/tok-ben-a',
      } as never);

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        requestedMembers={3}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ThS\. BS Trương Hán Siêu/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByTestId('contract-legal-preview')).toBeInTheDocument();
    expect(
      screen.getByText(/Danh sách thành viên \(tối đa 3 người\) sẽ được thêm sau khi hợp đồng kích hoạt/i)
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(/Điều khoản \/ Ghi chú thỏa thuận bổ sung/i),
      { target: { value: 'Ưu tiên thăm khám buổi sáng' } }
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i })
    );

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith({
        packageId: 'pkg-3m',
        facilityId: 'fac-1',
        doctorId: 'doc-1',
        memberCount: 3,
        homeVisitAddress: 'Số 10 Nguyễn Trãi, Phường Thượng Đình, Thành phố Hà Nội',
        additionalTerms: 'Ưu tiên thăm khám buổi sáng',
      });
      expect(pushMock).toHaveBeenCalledWith(
        '/booking/tracking?contractId=ctr-real-99'
      );
    });
  });

  it('hiển thị lỗi từ máy chủ nếu khởi tạo hợp đồng thất bại và không điều hướng', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    vi.spyOn(contractsApi, 'initiateFourPartyContract').mockRejectedValueOnce(
      new Error('Bác sĩ đã đạt giới hạn tiếp nhận.')
    );

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        facilityId="fac-1"
        requestedMembers={3}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ThS\. BS Trương Hán Siêu/i).length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i })
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Bác sĩ đã đạt giới hạn tiếp nhận.'
      );
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('kẹp requestedMembers=99 về trần maxMembers=6 và không hiển thị banner thông báo điều chỉnh', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        facilityId="fac-1"
        requestedMembers={99}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/6\s*thành viên/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('kẹp requestedMembers=0 về tối thiểu includedMembers (3 người) và không hiển thị banner cảnh báo', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        facilityId="fac-1"
        requestedMembers={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/3\s*thành viên/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('hiển thị tên gói và nút Chọn lại gói trỏ về hồ sơ bác sĩ trên mobile', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        facilityId="fac-1"
        requestedMembers={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-package-name')).toHaveTextContent('Đồng hành');
    });
    expect(screen.getByTestId('mobile-reselect-package')).toHaveAttribute(
      'href',
      '/doctors/doc-1'
    );
  });

  it('tái dựng ngữ cảnh từ contractId chưa ký: đi tiếp không tạo trùng và gửi replaceContractId khi sửa', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValue({
      id: 'ctr-draft-1',
      contractNumber: 'MC-DRAFT-01',
      contractStatus: 'PENDING_APPROVAL',
      memberCount: 3,
      additionalTerms: '',
      homeVisitAddress: 'Số 10 Nguyễn Trãi, Phường Thượng Đình, Thành phố Hà Nội',
      servicePackage: { id: 'pkg-3m' },
      doctor: { id: 'doc-1' },
      facility: { id: 'fac-1' },
      signatures: [],
    } as never);
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValue(mockDoctor);
    const initiateSpy = vi
      .spyOn(contractsApi, 'initiateFourPartyContract')
      .mockResolvedValue({ id: 'ctr-new-2' } as never);

    render(<DoctorContractInitiationPanel contractId="ctr-draft-1" requestedMembers={1} />);

    expect(await screen.findByTestId('booking-existing-contract-banner')).toHaveTextContent(
      'MC-DRAFT-01'
    );

    // Không thay đổi gì -> đi tiếp hợp đồng cũ, không gọi API tạo mới
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục tới bước ký/i }));
    expect(initiateSpy).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/booking/tracking?contractId=ctr-draft-1');

    // Sửa ghi chú -> truyền replaceContractId để hủy nguyên tử bản cũ
    fireEvent.change(
      screen.getByLabelText(/Điều khoản \/ Ghi chú thỏa thuận bổ sung/i),
      { target: { value: 'Cập nhật ghi chú mới' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i })
    );

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith({
        packageId: 'pkg-3m',
        facilityId: 'fac-1',
        doctorId: 'doc-1',
        memberCount: 3,
        homeVisitAddress: 'Số 10 Nguyễn Trãi, Phường Thượng Đình, Thành phố Hà Nội',
        additionalTerms: 'Cập nhật ghi chú mới',
        replaceContractId: 'ctr-draft-1',
      });
      expect(pushMock).toHaveBeenCalledWith('/booking/tracking?contractId=ctr-new-2');
    });
  });

  it('yêu cầu xác nhận khi thay thế hợp đồng đã ký / PENDING_PAYMENT', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValue({
      id: 'ctr-signed-1',
      contractNumber: 'MC-SIGNED-01',
      contractStatus: 'PENDING_PAYMENT',
      memberCount: 3,
      additionalTerms: '',
      homeVisitAddress: 'Số 10 Nguyễn Trãi, Phường Thượng Đình, Thành phố Hà Nội',
      servicePackage: { id: 'pkg-3m' },
      doctor: { id: 'doc-1' },
      facility: { id: 'fac-1' },
      signatures: [{ signerRole: 'FAMILY_REP', signerUserId: 'u-1', signedAt: '2026-11-16' }],
    } as never);
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValue(mockDoctor);
    const initiateSpy = vi
      .spyOn(contractsApi, 'initiateFourPartyContract')
      .mockResolvedValue({ id: 'ctr-new-3' } as never);

    render(<DoctorContractInitiationPanel contractId="ctr-signed-1" requestedMembers={1} />);

    expect(await screen.findByTestId('booking-existing-contract-banner')).toBeInTheDocument();

    // Sửa ghi chú và bấm xác nhận -> mở alertdialog thay vì gọi API ngay
    fireEvent.change(
      screen.getByLabelText(/Điều khoản \/ Ghi chú thỏa thuận bổ sung/i),
      { target: { value: 'Thay đổi điều khoản' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i })
    );
    expect(screen.getByTestId('booking-replace-confirm')).toBeInTheDocument();
    expect(initiateSpy).not.toHaveBeenCalled();

    // Đóng dialog bằng "Giữ hợp đồng hiện tại"
    fireEvent.click(screen.getByRole('button', { name: /Giữ hợp đồng hiện tại/i }));
    expect(screen.queryByTestId('booking-replace-confirm')).toBeNull();
  });

  it('hiển thị cảnh báo 409 Conflict kèm link Track A / Track B khi slot bác sĩ vừa hết', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([]);
    vi.spyOn(contractsApi, 'initiateFourPartyContract').mockRejectedValueOnce(
      new ApiError('Bác sĩ đã đạt giới hạn tối đa số hộ gia đình phụ trách (30/30).', 409)
    );

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        requestedMembers={3}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ThS\. BS Trương Hán Siêu/i).length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i })
    );

    await waitFor(() => {
      const alert = screen.getByTestId('slot-conflict-alert');
      expect(alert).toHaveTextContent(/30\/30/);
      expect(
        screen.getByRole('link', { name: /Chọn bác sĩ trẻ còn slot/i })
      ).toHaveAttribute('href', '/doctors?packageId=pkg-3m&members=3');
      expect(
        screen.getByRole('link', { name: /Ghép bác sĩ tự động/i })
      ).toHaveAttribute('href', '/doctors/matching?packageId=pkg-3m&members=3');
    });
  });

  it('tải ngữ cảnh Track B (matchSessionId) và truyền matchingSessionId khi xác nhận tạo hợp đồng', async () => {
    vi.spyOn(matchingApi, 'getMatchingSession').mockResolvedValueOnce({
      id: 'sess-track-b-1',
      status: 'MATCHED',
      memberCount: 4,
      rationale: 'Chuyên sâu tim mạch người cao tuổi',
      jevModelVersion: 'jev-1.14.0',
      jevFitScore: 0.88,
      vacancyScore: 0.9,
      compositeScore: 0.886,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      contractId: null,
      package: {
        id: 'pkg-3m',
        packageCode: 'DONG_HANH_V2',
        packageName: 'Đồng hành',
        durationMonths: 3,
        basePrice: 2850000,
        includedMembers: 3,
        maxMembers: 6,
        additionalMemberMonthlyPrice: 75000,
        periodicVisitsQuota: 3,
        telehealthQuota: 4,
      },
      doctor: {
        id: 'doc-1',
        doctorName: 'Trương Hán Siêu',
        specialty: 'Cơ Xương Khớp',
        academicTitle: 'ThS. BS',
        experienceYears: 21,
        clinicalTier: 'SENIOR',
        ratingAvg: 4.99,
        totalReviews: 128,
        remainingSlots: 20,
        maxPanelCapacity: 30,
        avatarUrl: null,
      },
      facility: {
        id: 'fac-1',
        facilityName: 'Bệnh viện Nhi Đồng 1',
        address: '341 Sư Vạn Hạnh',
        hotline: '1900 1234',
      },
    });
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    vi.spyOn(patientsApi, 'getFamilyMembers').mockResolvedValueOnce([]);
    const initiateSpy = vi
      .spyOn(contractsApi, 'initiateFourPartyContract')
      .mockResolvedValueOnce({ id: 'ctr-track-b-1' } as never);

    render(
      <DoctorContractInitiationPanel
        matchSessionId="sess-track-b-1"
        requestedMembers={1}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ThS\. BS Trương Hán Siêu/i).length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i })
    );

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          packageId: 'pkg-3m',
          doctorId: 'doc-1',
          facilityId: 'fac-1',
          memberCount: 4,
          matchingSessionId: 'sess-track-b-1',
        })
      );
      expect(pushMock).toHaveBeenCalledWith('/booking/tracking?contractId=ctr-track-b-1');
    });
  });

  it('khóa chỉnh sửa và hiển thị trạng thái đã kích hoạt khi hợp đồng ACTIVE', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValue({
      id: 'ctr-active-1',
      contractNumber: 'MC-ACTIVE-01',
      contractStatus: 'ACTIVE',
      memberCount: 3,
      servicePackage: { id: 'pkg-3m' },
      doctor: { id: 'doc-1' },
      facility: { id: 'fac-1' },
    } as never);
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValue(mockDoctor);

    render(<DoctorContractInitiationPanel contractId="ctr-active-1" requestedMembers={1} />);

    expect(await screen.findByTestId('booking-contract-active')).toHaveTextContent(
      'MC-ACTIVE-01'
    );
    expect(
      screen.getByRole('link', { name: /Vào Bảng điều khiển Gia đình/i })
    ).toHaveAttribute('href', '/family');
  });

  it('cho phép chọn Tỉnh/Thành phố, Phường/Xã từ API v2 + nhập địa chỉ chi tiết và truyền vào PDF preview + khởi tạo hợp đồng', async () => {
    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockResolvedValueOnce({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      familyUnit: {
        id: 'fam-1',
        homeAddress: 'Chưa cập nhật địa chỉ',
        emergencyPhone: '0900000000',
        representativeName: 'Nguyễn Văn A',
      },
      patientCount: 1,
    });
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    const previewSpy = vi.spyOn(contractsApi, 'previewFourPartyDraftPdf');
    const initiateSpy = vi
      .spyOn(contractsApi, 'initiateFourPartyContract')
      .mockResolvedValueOnce({ id: 'ctr-addr-1' } as never);

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        requestedMembers={3}
      />
    );

    const citySelect = await screen.findByLabelText(/1\. Tỉnh \/ Thành phố/i);
    fireEvent.change(citySelect, { target: { value: 'Thành phố Hồ Chí Minh' } });

    const wardSelect = screen.getByLabelText(/Phường \/ Xã/i);
    fireEvent.change(wardSelect, { target: { value: 'Phường Bến Nghé' } });

    const detailInput = screen.getByLabelText(/2\. Địa chỉ chi tiết/i);
    fireEvent.change(detailInput, { target: { value: 'Số 88 Đồng Khởi' } });

    await waitFor(() => {
      expect(previewSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          homeVisitAddress: 'Số 88 Đồng Khởi, Phường Bến Nghé, Thành phố Hồ Chí Minh',
        })
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i }));

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          homeVisitAddress: 'Số 88 Đồng Khởi, Phường Bến Nghé, Thành phố Hồ Chí Minh',
        })
      );
    });
  });

  it('chặn submit khi thiếu 1 trong 2 phần địa chỉ (thiếu Tỉnh/Phường hoặc thiếu Địa chỉ chi tiết)', async () => {
    vi.spyOn(contractsApi, 'getFamilyGateStatus').mockResolvedValueOnce({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      familyUnit: {
        id: 'fam-1',
        homeAddress: 'Chưa cập nhật địa chỉ',
        emergencyPhone: '0900000000',
        representativeName: 'Nguyễn Văn A',
      },
      patientCount: 1,
    });
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    const initiateSpy = vi.spyOn(contractsApi, 'initiateFourPartyContract');

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        requestedMembers={3}
      />
    );

    const citySelect = await screen.findByLabelText(/1\. Tỉnh \/ Thành phố/i);
    // Chưa chọn Tỉnh/Thành phố
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i }));
    expect(await screen.findByTestId('submit-error-alert')).toHaveTextContent(
      /Vui lòng chọn Tỉnh\/Thành phố/i
    );
    expect(initiateSpy).not.toHaveBeenCalled();

    // Đã chọn Tỉnh & Phường nhưng để trống địa chỉ chi tiết
    fireEvent.change(citySelect, { target: { value: 'Thành phố Hà Nội' } });
    fireEvent.change(screen.getByLabelText(/Phường \/ Xã/i), {
      target: { value: 'Phường Láng Thượng' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i }));

    expect(await screen.findByTestId('submit-error-alert')).toHaveTextContent(
      /Vui lòng nhập đầy đủ địa chỉ chi tiết/i
    );
    expect(initiateSpy).not.toHaveBeenCalled();
  });

  it('pre-fill địa chỉ 2 phần từ existingContract.homeVisitAddress', async () => {
    vi.spyOn(contractsApi, 'getMedicalContractDetail').mockResolvedValueOnce({
      id: 'ctr-prefill-1',
      contractNumber: 'MC-PREFILL-01',
      contractStatus: 'PENDING_APPROVAL',
      memberCount: 3,
      additionalTerms: '',
      homeVisitAddress: 'Số 99 Chùa Láng, Phường Láng Thượng, Thành phố Hà Nội',
      servicePackage: { id: 'pkg-3m' },
      doctor: { id: 'doc-1' },
      facility: { id: 'fac-1' },
      signatures: [],
    } as never);
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);

    render(<DoctorContractInitiationPanel contractId="ctr-prefill-1" requestedMembers={1} />);

    const citySelect = (await screen.findByLabelText(/1\. Tỉnh \/ Thành phố/i)) as HTMLSelectElement;
    const wardSelect = screen.getByLabelText(/Phường \/ Xã/i) as HTMLSelectElement;
    const detailInput = screen.getByLabelText(/2\. Địa chỉ chi tiết/i) as HTMLInputElement;

    expect(citySelect.value).toBe('Thành phố Hà Nội');
    expect(wardSelect.value).toBe('Phường Láng Thượng');
    expect(detailInput.value).toBe('Số 99 Chùa Láng');
  });

  it('không hiển thị banner clampNotice khi requestedMembers thấp hơn mức tối thiểu nhưng vẫn tự clamp về includedMembers', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    const initiateSpy = vi
      .spyOn(contractsApi, 'initiateFourPartyContract')
      .mockResolvedValueOnce({
        id: 'ctr-clamp-1',
      } as never);

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        requestedMembers={1}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ThS\. BS Trương Hán Siêu/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.queryByText(/thấp hơn mức tối thiểu/i)).toBeNull();
    expect(screen.queryByText(/vượt quá trần tối đa/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục ký hợp đồng/i }));

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberCount: 3,
        })
      );
    });
  });
});
