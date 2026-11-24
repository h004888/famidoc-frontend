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

  it('nạp danh sách thành viên thật, pre-select tối đa memberCount, suy ra facility và khởi tạo hợp đồng 4 bên', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    const patientsSpy = vi
      .spyOn(patientsApi, 'getFamilyMembers')
      .mockResolvedValueOnce([
        {
          id: 'pat-1',
          familyId: 'fam-1',
          fullName: 'Nguyễn Văn A',
          dateOfBirth: '1985-01-01',
          gender: 'MALE',
          relationshipToHead: 'SELF',
          status: 'ACTIVE',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'pat-2',
          familyId: 'fam-1',
          fullName: 'Trần Thị B',
          dateOfBirth: '1988-01-01',
          gender: 'FEMALE',
          relationshipToHead: 'SPOUSE',
          status: 'ACTIVE',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'pat-3',
          familyId: 'fam-1',
          fullName: 'Nguyễn Bé C',
          dateOfBirth: '2020-01-01',
          gender: 'MALE',
          relationshipToHead: 'CHILD',
          status: 'ACTIVE',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ]);
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

    expect(patientsSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('contract-legal-preview')).toBeInTheDocument();

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
        patientIds: ['pat-1', 'pat-2', 'pat-3'],
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

  it('kẹp requestedMembers=99 về trần maxMembers=6 và hiển thị thông báo điều chỉnh', async () => {
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
      expect(screen.getByRole('status')).toHaveTextContent(
        /vượt quá trần tối đa 6 người/i
      );
    });

    expect(screen.getByText(/6\s*thành viên/i)).toBeInTheDocument();
  });

  it('kẹp requestedMembers=0 về tối thiểu includedMembers (3 người) và hiển thị banner cảnh báo', async () => {
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
      expect(screen.getByRole('status')).toHaveTextContent(
        /không hợp lệ \(< 1\)/i
      );
    });

    expect(screen.getByText(/3\s*thành viên/i)).toBeInTheDocument();
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
});
