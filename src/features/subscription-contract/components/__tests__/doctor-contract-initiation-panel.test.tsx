import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DoctorContractInitiationPanel } from '../doctor-contract-initiation-panel';
import { contractsApi, patientsApi, publicApi } from '@/lib/api';

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
  });

  it('không tải danh sách thành viên trước khi ký, khởi tạo hợp đồng với memberCount và chuyển tới trang ký Documenso', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    const patientsSpy = vi.spyOn(patientsApi, 'getFamilyMembers');
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
        facilityId="fac-1"
        requestedMembers={3}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ThS\. BS Trương Hán Siêu/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(patientsSpy).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByTestId('contract-legal-preview')).toBeInTheDocument();
    expect(screen.getByTestId('selected-member-count')).toHaveTextContent('3 người');

    fireEvent.change(
      screen.getByLabelText(/Điều khoản \/ Ghi chú thỏa thuận bổ sung/i),
      { target: { value: 'Ưu tiên thăm khám buổi sáng' } }
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Xác nhận khởi tạo hợp đồng 4 bên/i })
    );

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith({
        packageId: 'pkg-3m',
        facilityId: 'fac-1',
        doctorId: 'doc-1',
        memberCount: 3,
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
      screen.getByRole('button', { name: /Xác nhận khởi tạo hợp đồng 4 bên/i })
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

    expect(screen.getByTestId('selected-member-count')).toHaveTextContent('6 người');
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

    expect(screen.getByTestId('selected-member-count')).toHaveTextContent('3 người');
  });

  it('cho phép tăng giảm memberCount trong phạm vi [includedMembers .. maxMembers] và gửi đúng số suất', async () => {
    vi.spyOn(publicApi, 'getDoctorDetail').mockResolvedValueOnce(mockDoctor);
    const initiateSpy = vi
      .spyOn(contractsApi, 'initiateFourPartyContract')
      .mockResolvedValueOnce({ id: 'ctr-4' } as never);

    render(
      <DoctorContractInitiationPanel
        packageId="pkg-3m"
        doctorId="doc-1"
        facilityId="fac-1"
        requestedMembers={3}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected-member-count')).toHaveTextContent('3 người');
    });

    expect(screen.getByRole('button', { name: /Giảm số thành viên/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Tăng số thành viên/i }));
    expect(screen.getByTestId('selected-member-count')).toHaveTextContent('4 người');

    fireEvent.click(
      screen.getByRole('button', { name: /Xác nhận khởi tạo hợp đồng 4 bên/i })
    );

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith({
        packageId: 'pkg-3m',
        facilityId: 'fac-1',
        doctorId: 'doc-1',
        memberCount: 4,
      });
    });
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
    fireEvent.click(screen.getByRole('button', { name: /Tiếp tục hợp đồng hiện có/i }));
    expect(initiateSpy).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/booking/tracking?contractId=ctr-draft-1');

    // Sửa số thành viên -> truyền replaceContractId để hủy nguyên tử bản cũ
    fireEvent.click(screen.getByRole('button', { name: /Tăng số thành viên/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /Xác nhận khởi tạo hợp đồng 4 bên/i })
    );

    await waitFor(() => {
      expect(initiateSpy).toHaveBeenCalledWith({
        packageId: 'pkg-3m',
        facilityId: 'fac-1',
        doctorId: 'doc-1',
        memberCount: 4,
        replaceContractId: 'ctr-draft-1',
      });
      expect(pushMock).toHaveBeenCalledWith('/booking/tracking?contractId=ctr-new-2');
    });
  });

  it('yêu cầu xác nhận khi thay thế hoặc hủy hợp đồng đã ký / PENDING_PAYMENT', async () => {
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
    const cancelSpy = vi
      .spyOn(contractsApi, 'cancelDraftContract')
      .mockResolvedValue({ id: 'ctr-signed-1', contractStatus: 'TERMINATED' });

    render(<DoctorContractInitiationPanel contractId="ctr-signed-1" requestedMembers={1} />);

    expect(await screen.findByTestId('booking-existing-contract-banner')).toBeInTheDocument();

    // Sửa thành viên và bấm xác nhận -> mở alertdialog thay vì gọi API ngay
    fireEvent.click(screen.getByRole('button', { name: /Tăng số thành viên/i }));
    fireEvent.click(
      screen.getByRole('button', { name: /Xác nhận khởi tạo hợp đồng 4 bên/i })
    );
    expect(screen.getByTestId('booking-replace-confirm')).toBeInTheDocument();
    expect(initiateSpy).not.toHaveBeenCalled();

    // Đóng dialog bằng "Giữ hợp đồng hiện tại"
    fireEvent.click(screen.getByRole('button', { name: /Giữ hợp đồng hiện tại/i }));
    expect(screen.queryByTestId('booking-replace-confirm')).toBeNull();

    // Bấm "Hủy hợp đồng nháp & chọn lại gói" -> cũng phải qua dialog xác nhận
    const cancelButtons = screen.getAllByRole('button', {
      name: /Hủy hợp đồng nháp & chọn lại gói/i,
    });
    fireEvent.click(cancelButtons[0]);
    expect(screen.getByTestId('booking-replace-confirm')).toBeInTheDocument();
    expect(cancelSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy & chọn lại gói/i }));
    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(
        'ctr-signed-1',
        'Hủy bản nháp để chọn lại gói chăm sóc'
      );
      expect(pushMock).toHaveBeenCalledWith('/doctors/doc-1');
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
