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
        requestedMembers={2}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText(/ThS\. BS Trương Hán Siêu/i).length).toBeGreaterThanOrEqual(1);
    });

    expect(patientsSpy).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.getByTestId('contract-legal-preview')).toBeInTheDocument();
    expect(screen.getByTestId('selected-member-count')).toHaveTextContent('2 người');

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
        memberCount: 2,
        additionalTerms: 'Ưu tiên thăm khám buổi sáng',
      });
      expect(pushMock).toHaveBeenCalledWith(
        '/family/subscription/tracking?contractId=ctr-real-99'
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

  it('kẹp requestedMembers=0 về tối thiểu 1 thành viên và hiển thị banner cảnh báo', async () => {
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

    expect(screen.getByTestId('selected-member-count')).toHaveTextContent('1 người');
  });

  it('cho phép tăng giảm memberCount trong phạm vi [1 .. maxMembers] và gửi đúng số suất', async () => {
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
});
