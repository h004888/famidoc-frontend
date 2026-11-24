import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BookingSummaryStep } from '../booking-summary-step';
import { BookingTrackingStep } from '../booking-tracking-step';
import { BookingPaymentStep } from '../booking-payment-step';
import { contractsApi } from '@/lib/api/contracts.api';
import { encountersApi } from '@/lib/api/encounters.api';
import { supportCasesApi } from '@/lib/api/support-cases.api';
import { ApiError } from '@/lib/http/errors';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/subscription-contract/components/doctor-contract-initiation-panel', () => ({
  DoctorContractInitiationPanel: ({
    packageId,
    doctorId,
    facilityId,
    matchSessionId,
    queueId,
    contractId,
    requestedMembers,
    trackingPath,
  }: {
    packageId?: string;
    doctorId?: string;
    facilityId?: string;
    matchSessionId?: string;
    queueId?: string;
    contractId?: string;
    requestedMembers: number;
    trackingPath?: string;
  }) => (
    <div
      data-testid="initiation-panel"
      data-package-id={packageId ?? ''}
      data-doctor-id={doctorId ?? ''}
      data-facility-id={facilityId ?? ''}
      data-match-session-id={matchSessionId ?? ''}
      data-queue-id={queueId ?? ''}
      data-contract-id={contractId ?? ''}
      data-members={requestedMembers}
      data-tracking-path={trackingPath ?? ''}
    />
  ),
}));

vi.mock('@/features/four-party-contract/components/documenso-signing-embed', () => ({
  DocumensoSigningEmbed: ({
    contractId,
    hideHeaderSyncButton,
  }: {
    contractId: string;
    hideHeaderSyncButton?: boolean;
  }) => (
    <div
      data-testid="documenso-embed-stub"
      data-contract-id={contractId}
      data-hide-header-sync={String(Boolean(hideHeaderSyncButton))}
    />
  ),
}));

vi.mock('@/lib/api/contracts.api', () => ({
  contractsApi: {
    createVietQRPayment: vi.fn(),
    getPaymentStatus: vi.fn(),
    getFamilyGateStatus: vi.fn(),
    getMedicalContractDetail: vi.fn(),
    downloadSignedPdf: vi.fn(),
    recheckPaymentActivation: vi.fn(),
  },
}));

vi.mock('@/lib/api/support-cases.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/support-cases.api')>();
  return {
    ...actual,
    supportCasesApi: {
      ...actual.supportCasesApi,
      list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 5 }),
      detail: vi.fn(),
      createPaymentIssueCase: vi.fn(),
      uploadAttachment: vi.fn(),
    },
  };
});

const pendingPayment = {
  id: 'pay-1',
  contractId: 'ctr-1',
  familyId: 'fam-1',
  environment: 'TEST' as const,
  attempt: 1,
  paymentCode: 'FMD-PAY-0001',
  transferContent: 'FMD PAY 0001',
  amountVnd: 9600000,
  currency: 'VND' as const,
  qrUrl: null,
  expectedAccountNumber: '882190068688',
  expectedGateway: 'MBBANK',
  status: 'PENDING' as const,
  createdAt: '2026-11-15T00:00:00.000Z',
  expiresAt: '2026-11-15T00:15:00.000Z',
  paidAt: null,
  acceptedTransactionId: null,
};

describe('BookingSummaryStep', () => {
  it('render panel khởi tạo hợp đồng với đúng ngữ cảnh và trackingPath /booking/tracking', () => {
    render(
      <BookingSummaryStep
        packageId="pkg-1"
        doctorId="doc-1"
        facilityId="fac-1"
        requestedMembers={3}
      />
    );

    const panel = screen.getByTestId('initiation-panel');
    expect(panel).toHaveAttribute('data-package-id', 'pkg-1');
    expect(panel).toHaveAttribute('data-doctor-id', 'doc-1');
    expect(panel).toHaveAttribute('data-facility-id', 'fac-1');
    expect(panel).toHaveAttribute('data-members', '3');
    expect(panel).toHaveAttribute('data-tracking-path', '/booking/tracking');
  });

  it('hướng dẫn về /doctors khi thiếu tham số bắt buộc', () => {
    render(<BookingSummaryStep packageId="pkg-1" />);

    expect(screen.queryByTestId('initiation-panel')).toBeNull();
    expect(screen.getByTestId('booking-missing-context')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chọn bác sĩ/i })).toHaveAttribute('href', '/doctors');
  });

  it('hỗ trợ ngữ cảnh Track A không cần facilityId, Track B matchSessionId và Hàng chờ queueId', () => {
    const first = render(<BookingSummaryStep packageId="pkg-1" doctorId="doc-1" requestedMembers={4} />);
    expect(screen.getByTestId('initiation-panel')).toHaveAttribute('data-doctor-id', 'doc-1');
    first.unmount();

    const second = render(<BookingSummaryStep matchSessionId="sess-1" />);
    expect(screen.getByTestId('initiation-panel')).toHaveAttribute('data-match-session-id', 'sess-1');
    second.unmount();

    render(<BookingSummaryStep queueId="queue-1" />);
    expect(screen.getByTestId('initiation-panel')).toHaveAttribute('data-queue-id', 'queue-1');
  });

  it('nhận và truyền contractId xuống panel khi quay lại Bước 1 từ Bước 2/3', () => {
    render(<BookingSummaryStep contractId="ctr-77" />);

    const panel = screen.getByTestId('initiation-panel');
    expect(panel).toHaveAttribute('data-contract-id', 'ctr-77');
    expect(panel).toHaveAttribute('data-tracking-path', '/booking/tracking');
    expect(screen.queryByTestId('booking-missing-context')).toBeNull();
  });
});

const contractDetailFixture = {
  id: 'ctr-1',
  contractNumber: 'FMD-HD-2026-000123456789012345678',
  contractStatus: 'PENDING_APPROVAL' as const,
  totalAmount: 9600000,
  startDate: '2026-11-16T00:00:00.000Z',
  endDate: '2027-11-16T00:00:00.000Z',
  createdAt: '2026-11-15T09:30:00.000Z',
  memberCount: 4,
  signedPdfUrl: null,
  signatures: [],
  familyUnit: {
    representativeUser: { fullName: 'Nguyễn Thị Lan' },
  },
  facility: { id: 'fac-1', facilityName: 'Phòng khám Đa khoa An Khang' },
  doctor: {
    id: 'doc-1',
    doctorName: 'Bác sĩ Trần Văn Minh',
    user: { fullName: 'Trần Văn Minh' },
  },
  servicePackage: { id: 'pkg-1', packageName: 'Gói Chăm Sóc Gia Đình' },
};

describe('BookingTrackingStep', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.clearAllMocks();
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue(
      contractDetailFixture as never
    );
  });

  it('nạp hợp đồng một lần và hiển thị khung ký kèm bố cục 2 cột của Bước 2', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-tracking-panel')).toBeInTheDocument();
    expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledTimes(1);
    expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledWith('ctr-1');

    const embed = screen.getByTestId('documenso-embed-stub');
    expect(embed).toHaveAttribute('data-contract-id', 'ctr-1');
    // Nút làm mới chung ở đầu trang thay cho nút đồng bộ trong khung ký
    expect(embed).toHaveAttribute('data-hide-header-sync', 'true');
    expect(screen.getByTestId('booking-tracking-refresh')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-back-to-step-1')).toBeNull();
    expect(screen.queryByText(/Gói dịch vụ & Hợp đồng/i)).toBeNull();
    expect(screen.queryByText(/Hotline/i)).toBeNull();
  });

  it('hiển thị mã hợp đồng kèm nút sao chép và thời điểm khởi tạo dạng ngày giờ Việt Nam', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-tracking-contract-code')).toHaveTextContent(
      contractDetailFixture.contractNumber
    );

    const createdAt = screen.getByTestId('booking-tracking-created-at');
    expect(createdAt.textContent).not.toBe(contractDetailFixture.createdAt);
    expect(createdAt.textContent).toMatch(/\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}/);
    expect(createdAt.textContent).toMatch(/\d{1,2}:\d{2}/);

    fireEvent.click(screen.getByTestId('booking-tracking-copy-contract-code'));
    expect(screen.getByTestId('booking-tracking-copy-contract-code')).toHaveTextContent(
      'Đã chép ✓'
    );
  });

  it('gắn tên cơ sở y tế và bác sĩ thật vào tiến trình 4 bên, không lộ thuật ngữ nội bộ', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-tracking-panel');

    expect(screen.getByTestId('booking-party-HEALTHCARE_FACILITY')).toHaveTextContent(
      'Phòng khám Đa khoa An Khang'
    );
    expect(screen.getByTestId('booking-party-ASSIGNED_DOCTOR')).toHaveTextContent(
      'Bác sĩ Trần Văn Minh'
    );
    expect(screen.getByTestId('booking-party-FAMILY_REP')).toHaveTextContent(
      'Nguyễn Thị Lan'
    );
    expect(screen.getByText('Ký hợp đồng điện tử 4 bên')).toBeInTheDocument();

    const panel = screen.getByTestId('booking-tracking-panel');
    expect(panel.textContent).not.toMatch(/định biên/i);
    expect(panel.textContent).not.toMatch(/\bACTIVE\b/);
  });

  it('hiển thị thông báo khi thiếu contractId và không gọi API', () => {
    render(<BookingTrackingStep />);

    expect(screen.getByTestId('booking-tracking-missing-contract')).toBeInTheDocument();
    expect(contractsApi.getMedicalContractDetail).not.toHaveBeenCalled();
  });

  it('báo lỗi 404 khi hợp đồng không tồn tại', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockRejectedValue(
      Object.assign(new Error('Not found'), { status: 404 })
    );

    render(<BookingTrackingStep contractId="ctr-404" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-tracking-error')).toBeInTheDocument();
    expect(screen.getByText(/Không tìm thấy hợp đồng này/i)).toBeInTheDocument();
  });

  it('báo lỗi 403 khi không có quyền xem hợp đồng', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockRejectedValue(
      Object.assign(new Error('Forbidden'), { status: 403 })
    );

    render(<BookingTrackingStep contractId="ctr-403" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-tracking-error')).toBeInTheDocument();
    expect(screen.getByText(/không có quyền xem hợp đồng này/i)).toBeInTheDocument();
  });

  it('báo lỗi kết nối khi mất mạng và cho phép thử lại', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockRejectedValueOnce(
      new Error('Network down')
    );

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-tracking-error')).toBeInTheDocument();
    expect(
      screen.getByText(/Không thể tải hợp đồng\. Vui lòng kiểm tra kết nối/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();
  });

  it('chuyển sang /booking/payment khi hợp đồng đã đủ 4/4 chữ ký', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'PENDING_PAYMENT',
      signatures: [
        { signerRole: 'FAMILY_REP', signerUserId: 'u1', signedAt: '2026-11-15T10:00:00.000Z' },
        { signerRole: 'HEALTHCARE_FACILITY', signerUserId: 'u2', signedAt: '2026-11-15T10:20:00.000Z' },
        { signerRole: 'ASSIGNED_DOCTOR', signerUserId: 'u3', signedAt: '2026-11-15T10:30:00.000Z' },
        { signerRole: 'ADMIN', signerUserId: 'u4', signedAt: '2026-11-15T10:40:00.000Z' },
      ],
    } as never);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-tracking-payment-ready')).toBeInTheDocument();
    expect(screen.getByTestId('booking-tracking-signed-count')).toHaveTextContent('Đã ký 4/4');
    expect(screen.queryByTestId('documenso-embed-stub')).toBeNull();

    fireEvent.click(screen.getByTestId('booking-proceed-payment'));
    expect(pushMock).toHaveBeenCalledWith('/booking/payment?contractId=ctr-1');
  });

  it('hiển thị nút "Xem PDF đã ký 4 bên" ở PENDING_PAYMENT khi có bản Documenso và tải qua contractsApi', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'PENDING_PAYMENT',
      documensoItemId: 'item-42',
      signatures: [
        { signerRole: 'FAMILY_REP', signerUserId: 'u1', signedAt: '2026-11-15T10:00:00.000Z' },
        { signerRole: 'HEALTHCARE_FACILITY', signerUserId: 'u2', signedAt: '2026-11-15T10:20:00.000Z' },
        { signerRole: 'ASSIGNED_DOCTOR', signerUserId: 'u3', signedAt: '2026-11-15T10:30:00.000Z' },
        { signerRole: 'ADMIN', signerUserId: 'u4', signedAt: '2026-11-15T10:40:00.000Z' },
      ],
    } as never);
    const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    const downloadSpy = vi
      .mocked(contractsApi.downloadSignedPdf)
      .mockResolvedValue(blob);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:booking-signed-pdf');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(
      await screen.findByTestId('booking-tracking-payment-ready')
    ).toBeInTheDocument();
    const button = screen.getByTestId('booking-view-signed-pdf');
    expect(button).toHaveTextContent('Xem PDF đã ký 4 bên');

    fireEvent.click(button);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('ctr-1');
      expect(openSpy).toHaveBeenCalledWith(
        'blob:booking-signed-pdf',
        '_blank',
        'noopener,noreferrer'
      );
    });
    // Dữ liệu hợp đồng vẫn còn nguyên sau khi mở PDF
    expect(screen.getByTestId('booking-tracking-payment-ready')).toBeInTheDocument();
  });

  it('hiển thị và tải được PDF đã ký ở trạng thái ACTIVE', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'ACTIVE',
      documensoItemId: 'item-42',
      signedPdfUrl: '/api/v1/contracts/medical/ctr-1/signed-pdf',
    } as never);
    const downloadSpy = vi
      .mocked(contractsApi.downloadSignedPdf)
      .mockResolvedValue(new Blob(['%PDF-1.7'], { type: 'application/pdf' }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:booking-active-pdf');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-tracking-active');
    fireEvent.click(screen.getByTestId('booking-view-signed-pdf'));

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('ctr-1');
    });
  });

  it('không hiển thị nút xem PDF đã ký khi hợp đồng chưa gắn bản Documenso (PENDING_APPROVAL)', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-tracking-panel');
    expect(screen.queryByTestId('booking-view-signed-pdf')).toBeNull();
  });

  it('hiển thị lỗi inline kèm nút thử lại khi tải PDF đã ký thất bại', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'PENDING_PAYMENT',
      documensoItemId: 'item-42',
      signatures: [
        { signerRole: 'FAMILY_REP', signerUserId: 'u1', signedAt: '2026-11-15T10:00:00.000Z' },
        { signerRole: 'HEALTHCARE_FACILITY', signerUserId: 'u2', signedAt: '2026-11-15T10:20:00.000Z' },
        { signerRole: 'ASSIGNED_DOCTOR', signerUserId: 'u3', signedAt: '2026-11-15T10:30:00.000Z' },
        { signerRole: 'ADMIN', signerUserId: 'u4', signedAt: '2026-11-15T10:40:00.000Z' },
      ],
    } as never);
    const downloadSpy = vi
      .mocked(contractsApi.downloadSignedPdf)
      .mockRejectedValueOnce(new Error('Mất kết nối máy chủ'));

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-tracking-payment-ready');
    fireEvent.click(screen.getByTestId('booking-view-signed-pdf'));

    const alert = await screen.findByTestId('booking-view-signed-pdf-error');
    expect(alert).toHaveAttribute('role', 'alert');
    // Vẫn giữ dữ liệu trang theo dõi
    expect(screen.getByTestId('booking-tracking-payment-ready')).toBeInTheDocument();
    expect(screen.getByTestId('booking-tracking-panel')).toBeInTheDocument();

    downloadSpy.mockResolvedValueOnce(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:retry-booking');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(window, 'open').mockImplementation(() => null);

    fireEvent.click(screen.getByTestId('booking-view-signed-pdf-retry'));

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('booking-view-signed-pdf-error')).toBeNull();
    });
  });

  it('khóa lùi và hiển thị trạng thái đã kích hoạt khi hợp đồng ACTIVE', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'ACTIVE',
    } as never);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-tracking-active')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-back-to-step-1')).toBeNull();
    expect(screen.queryByTestId('documenso-embed-stub')).toBeNull();
    expect(
      screen.getByRole('link', { name: /Quản lý thành viên/i })
    ).toHaveAttribute('href', '/family/members');
  });

  it('tự động cập nhật tiến độ định kỳ và dừng khi đủ chữ ký', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={40} />);

    await screen.findByTestId('booking-tracking-panel');
    await waitFor(
      () => {
        expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledTimes(2);
      },
      { timeout: 2000 }
    );

    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'ACTIVE',
    } as never);

    expect(await screen.findByTestId('booking-tracking-active', {}, { timeout: 2000 })).toBeInTheDocument();

    const callsAfterActive = vi.mocked(contractsApi.getMedicalContractDetail).mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(vi.mocked(contractsApi.getMedicalContractDetail).mock.calls.length).toBe(
      callsAfterActive
    );
  });

  it('giữ nguyên giao diện hiện tại khi nhịp cập nhật nền gặp lỗi', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={40} />);

    await screen.findByTestId('booking-tracking-panel');
    const failingPoll = vi.fn().mockRejectedValue(new Error('Mất mạng tạm thời'));
    vi.mocked(contractsApi.getMedicalContractDetail).mockImplementation(failingPoll);
    await waitFor(() => expect(failingPoll).toHaveBeenCalled());

    expect(screen.queryByTestId('booking-tracking-error')).toBeNull();
    expect(screen.getByTestId('booking-tracking-panel')).toBeInTheDocument();
  });

  it('ép backend kiểm tra Documenso khi bấm "Cập nhật tiến độ" nhưng polling nền thì không', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={40} />);

    await screen.findByTestId('booking-tracking-panel');
    expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledWith('ctr-1');

    await waitFor(
      () => {
        expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledTimes(2);
      },
      { timeout: 2000 }
    );
    // Nhịp polling nền không kèm forceSync để backend tự áp dụng cooldown.
    expect(vi.mocked(contractsApi.getMedicalContractDetail).mock.calls[1]).toEqual([
      'ctr-1',
    ]);

    fireEvent.click(screen.getByTestId('booking-tracking-refresh'));

    await waitFor(() => {
      expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledWith('ctr-1', {
        forceSync: true,
      });
    });
  });

  it('không hiển thị khung ký nhúng khi Bên A đã ký và còn 1/4 tiến độ', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      signatures: [
        {
          signerRole: 'FAMILY_REP',
          signerUserId: 'u1',
          signedAt: '2026-11-15T10:00:00.000Z',
        },
      ],
    } as never);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    const card = await screen.findByTestId('booking-post-family-signing-card');
    expect(screen.queryByTestId('documenso-embed-stub')).toBeNull();
    expect(screen.queryByText(/Đồng bộ tiến độ 4 bên/i)).toBeNull();
    expect(screen.getByTestId('booking-post-signing-progress')).toHaveTextContent(
      'Đã ký 1/4 bên'
    );
    expect(
      screen.getByTestId('booking-post-signing-party-FAMILY_REP')
    ).toHaveAttribute('data-signed', 'true');
    expect(
      screen.getByTestId('booking-post-signing-party-FAMILY_REP')
    ).toHaveTextContent('Đã ký');
    expect(
      screen.getByTestId('booking-post-signing-party-FAMILY_REP')
    ).toHaveTextContent(/\d{1,2}:\d{2}/);
    expect(
      screen.getByTestId('booking-post-signing-party-HEALTHCARE_FACILITY')
    ).toHaveTextContent('Đang chờ ký');
    expect(card).not.toHaveTextContent(/Tự động kiểm tra tiến độ mỗi 10 giây/i);
    // Chỉ giữ duy nhất nút làm mới ở header
    expect(screen.getAllByTestId('booking-tracking-refresh')).toHaveLength(1);
    // Cột phải không lặp lại danh sách 4 bên, thay bằng thẻ bước tiếp theo + nút khóa PDF
    expect(screen.queryByTestId('booking-party-HEALTHCARE_FACILITY')).toBeNull();
    expect(screen.getByTestId('booking-view-signed-pdf-locked')).toBeDisabled();
    expect(screen.getByText(/Theo dõi tiến độ ký hợp đồng 4 bên/i)).toBeInTheDocument();
  });

  it('hiển thị đúng 2/4 bên đã ký khi Bên A và cơ sở y tế đã ký', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      signatures: [
        {
          signerRole: 'FAMILY_REP',
          signerUserId: 'u1',
          signedAt: '2026-11-15T10:00:00.000Z',
        },
        {
          signerRole: 'HEALTHCARE_FACILITY',
          signerUserId: 'u2',
          signedAt: '2026-11-15T10:20:00.000Z',
        },
      ],
    } as never);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-post-family-signing-card');
    expect(screen.getByTestId('booking-post-signing-progress')).toHaveTextContent(
      'Đã ký 2/4 bên'
    );
    expect(
      screen.getByTestId('booking-post-signing-party-HEALTHCARE_FACILITY')
    ).toHaveTextContent('Đã ký');
    expect(
      screen.getByTestId('booking-post-signing-party-ASSIGNED_DOCTOR')
    ).toHaveTextContent('Đang chờ ký');
    expect(
      screen.getByTestId('booking-post-signing-party-ADMIN')
    ).toHaveTextContent('Đang chờ ký');
    expect(screen.getByTestId('booking-view-signed-pdf-locked')).toBeDisabled();
  });

  it('giữ nguyên khung ký nhúng khi chưa có chữ ký nào (0/4)', async () => {
    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-tracking-panel');
    expect(screen.getByTestId('documenso-embed-stub')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-post-family-signing-card')).toBeNull();
    expect(screen.getByTestId('booking-tracking-signed-count')).toHaveTextContent(
      'Đã ký 0/4'
    );
  });

  it('chuyển sang trạng thái 4/4 PENDING_PAYMENT khi polling phát hiện đủ chữ ký', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      signatures: [
        {
          signerRole: 'FAMILY_REP',
          signerUserId: 'u1',
          signedAt: '2026-11-15T10:00:00.000Z',
        },
      ],
    } as never);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={40} />);

    await screen.findByTestId('booking-post-family-signing-card');

    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'PENDING_PAYMENT',
      signatures: [
        { signerRole: 'FAMILY_REP', signerUserId: 'u1', signedAt: '2026-11-15T10:00:00.000Z' },
        { signerRole: 'HEALTHCARE_FACILITY', signerUserId: 'u2', signedAt: '2026-11-15T10:20:00.000Z' },
        { signerRole: 'ASSIGNED_DOCTOR', signerUserId: 'u3', signedAt: '2026-11-15T10:30:00.000Z' },
        { signerRole: 'ADMIN', signerUserId: 'u4', signedAt: '2026-11-15T10:40:00.000Z' },
      ],
    } as never);

    expect(
      await screen.findByTestId('booking-tracking-payment-ready', {}, { timeout: 2000 })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('booking-post-family-signing-card')).toBeNull();
    expect(screen.getByTestId('booking-tracking-signed-count')).toHaveTextContent(
      'Đã ký 4/4'
    );
    expect(screen.getByTestId('booking-proceed-payment')).toBeInTheDocument();
  });

  it('không báo sai "Đã đủ 4/4 chữ ký" khi contractStatus là PENDING_PAYMENT nhưng mới có 1/4 chữ ký', async () => {
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'PENDING_PAYMENT',
      documensoItemId: 'item-42',
      signatures: [
        {
          signerRole: 'FAMILY_REP',
          signerUserId: 'u1',
          signedAt: '2026-11-15T10:00:00.000Z',
        },
      ],
    } as never);

    render(<BookingTrackingStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(
      await screen.findByTestId('booking-post-family-signing-card')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('booking-tracking-payment-ready')).toBeNull();
    expect(screen.queryByTestId('booking-view-signed-pdf')).toBeNull();
    expect(screen.getByTestId('booking-tracking-status')).toHaveTextContent(
      'Đang chờ 3 bên còn lại (1/4)'
    );
    expect(screen.getByTestId('booking-post-signing-stage-1')).toBeInTheDocument();
    expect(screen.getByTestId('booking-post-signing-stage-2')).toHaveTextContent(
      '0/3 hoàn tất'
    );
    expect(screen.getByTestId('booking-view-signed-pdf-locked')).toBeDisabled();
  });
});

describe('BookingPaymentStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(contractsApi.getMedicalContractDetail).mockReset().mockResolvedValue({
      ...contractDetailFixture,
      contractStatus: 'PENDING_PAYMENT',
    } as never);
    vi.mocked(contractsApi.getPaymentStatus).mockReset().mockResolvedValue(pendingPayment);
    vi.mocked(supportCasesApi.list).mockReset().mockResolvedValue({
      items: [], total: 0, page: 1, limit: 50,
    });
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue(pendingPayment as never);
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    } as never);
  });

  it('hiển thị trạng thái chờ thanh toán VietQR theo contractId', async () => {
    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-pending')).toBeInTheDocument();
    expect(contractsApi.createVietQRPayment).toHaveBeenCalledWith('ctr-1');
    expect(screen.getByText('FMD PAY 0001')).toBeInTheDocument();
    expect(screen.getByText('9.600.000 đ')).toBeInTheDocument();
  });

  it('không lặp nút quay lại Bước 2 bên trong nội dung Bước 3', async () => {
    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-payment-pending');
    expect(screen.queryByTestId('booking-back-to-step-2')).toBeNull();
    expect(
      screen.queryByRole('link', { name: /Quay lại theo dõi ký hợp đồng/i })
    ).toBeNull();
  });

  it('hiển thị màn hình chúc mừng kèm CTA Dashboard khi hợp đồng ACTIVE', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      status: 'PAID',
      activation: { activated: true, blockingReasons: [] },
    } as never);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-success')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Thêm hồ sơ thành viên/i })).toHaveAttribute(
      'href',
      '/family/members'
    );
    expect(screen.getByRole('link', { name: /Vào Bảng điều khiển Gia đình/i })).toHaveAttribute(
      'href',
      '/family'
    );
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'famidoc:family-gate-refresh' }));
  });

  it('không gọi API khi thiếu contractId', async () => {
    render(<BookingPaymentStep />);

    await waitFor(() => {
      expect(screen.getByTestId('booking-payment-missing-contract')).toBeInTheDocument();
    });
    expect(contractsApi.createVietQRPayment).not.toHaveBeenCalled();
  });

  it('hiển thị đã nhận tiền khi hóa đơn PAID và hợp đồng còn PENDING_PAYMENT', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValueOnce({
      ...pendingPayment,
      status: 'PAID',
    } as never);
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValueOnce({
      id: 'ctr-1',
      contractStatus: 'PENDING_PAYMENT',
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('payment-paid-pending-activation')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-payment-success')).not.toBeInTheDocument();
  });

  it('đọc lại hóa đơn đã thanh toán sau khi tải lại trang thay vì yêu cầu chuyển tiền lần nữa', async () => {
    sessionStorage.setItem('famidoc:payment-request:ctr-1:', pendingPayment.id);
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValueOnce(new Error('Contract payment has already been recorded'));
    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValueOnce({ ...pendingPayment, status: 'PAID' });
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValueOnce({
      id: 'ctr-1',
      contractStatus: 'PENDING_PAYMENT',
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('payment-paid-pending-activation')).toBeInTheDocument();
    expect(contractsApi.getPaymentStatus).toHaveBeenCalledWith(pendingPayment.id);
  });

  it('giữ trạng thái chờ kích hoạt khi hộ gia đình có một hợp đồng ACTIVE khác', async () => {
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValueOnce({
      hasActiveContract: true,
      activeContract: { id: 'ctr-other' },
    } as never);
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      status: 'PAID',
    });
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'PENDING_PAYMENT',
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('payment-paid-pending-activation')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-payment-success')).not.toBeInTheDocument();
  });

  it('xác nhận đã thanh toán phụ lục từ hóa đơn khôi phục và ẩn mã QR', async () => {
    const addendumId = 'addendum-1';
    sessionStorage.setItem(`famidoc:payment-request:ctr-1:${addendumId}`, pendingPayment.id);
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValueOnce(
      new Error('Addendum payment has already been recorded'),
    );
    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValueOnce({
      ...pendingPayment,
      addendumId,
      status: 'PAID',
      qrUrl: 'https://vietqr.app/img?template=qr_only',
      activation: { activated: true, blockingReasons: [] },
    });

    render(<BookingPaymentStep contractId="ctr-1" addendumId={addendumId} pollingIntervalMs={0} />);

    expect(await screen.findByRole('heading', { name: 'Đã ghi nhận thanh toán phụ lục' })).toBeInTheDocument();
    expect(contractsApi.createVietQRPayment).toHaveBeenCalledWith('ctr-1', addendumId);
    expect(contractsApi.getPaymentStatus).toHaveBeenCalledWith(pendingPayment.id);
    expect(screen.queryByTestId('booking-payment-success')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-recheck-activation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-qr-zoom')).not.toBeInTheDocument();
  });

  it('chuyển sang màn hình chúc mừng khi createVietQRPayment lỗi nhưng hợp đồng đã ACTIVE', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new Error('Contract is not pending')
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'ACTIVE',
    } as never);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-success')).toBeInTheDocument();
    expect(contractsApi.getMedicalContractDetail).toHaveBeenCalledWith('ctr-1');
    expect(screen.getByRole('link', { name: /Vào Bảng điều khiển Gia đình/i })).toHaveAttribute(
      'href',
      '/family'
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'famidoc:family-gate-refresh' })
    );
  });

  it('hiển thị thông báo tiếng Việt theo blockingReasons khi thiếu điều kiện kích hoạt', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new ApiError('Contract is not ready for payment', 409, {
        success: false,
        code: 409,
        message: 'Contract is not ready for payment',
        error: {
          type: 'https://api.famidoc.vn/errors/conflict-error',
          title: 'Conflict',
          detail: 'Contract is not ready for payment',
          errorCode: 'CONFLICT_ERROR',
          blockingReasons: ['DOCTOR_VERIFICATION_REQUIRED'],
        },
      })
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'PENDING_PAYMENT',
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-error')).toBeInTheDocument();
    const blocking = screen.getByTestId('booking-payment-blocking-reasons');
    expect(blocking).toHaveTextContent(/điều kiện kích hoạt/i);
    expect(blocking).toHaveTextContent(/hợp đồng cung ứng nhân lực B2B còn hiệu lực/i);
    // Không còn hiển thị thông điệp tiếng Anh chung chung từ API.
    expect(screen.queryByText('Contract is not ready for payment')).toBeNull();
    expect(
      screen.getByRole('link', { name: /Quay lại theo dõi ký 4 bên/i })
    ).toHaveAttribute('href', '/booking/tracking?contractId=ctr-1');
  });

  it('hiển thị thông báo vượt số suất thành viên khi ADDITIONAL_FAMILY_MEMBERS_PAYMENT_REQUIRED', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new ApiError('Contract is not ready for payment', 409, {
        error: {
          message: 'Contract is not ready for payment',
          blockingReasons: ['ADDITIONAL_FAMILY_MEMBERS_PAYMENT_REQUIRED'],
        },
      })
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockRejectedValue(
      new Error('Không tìm thấy hợp đồng')
    );

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    const blocking = await screen.findByTestId('booking-payment-blocking-reasons');
    expect(blocking).toHaveTextContent(/vượt quá số suất trên hợp đồng/i);
    expect(blocking).toHaveTextContent(/thanh toán bổ sung/i);
  });

  it('giữ nguyên thông điệp lỗi gốc khi lỗi không kèm blockingReasons', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new Error('Mất kết nối máy chủ')
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockRejectedValue(
      new Error('Không tìm thấy hợp đồng')
    );

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-error')).toHaveTextContent(
      'Mất kết nối máy chủ'
    );
    expect(screen.queryByTestId('booking-payment-blocking-reasons')).toBeNull();
  });

  it('hiển thị nút quay lại /booking/tracking khi hợp đồng chưa đủ 4 chữ ký', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new Error('Contract is not ready for payment')
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'PENDING_APPROVAL',
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-error')).toBeInTheDocument();
    expect(
      screen.getByText(/chưa hoàn tất đủ 4 chữ ký số trên Documenso/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Quay lại theo dõi ký 4 bên/i })
    ).toHaveAttribute('href', '/booking/tracking?contractId=ctr-1');
  });

  it('hiển thị thẻ lịch khám gia đình đầu tiên khi có buổi khám mặc định sau kích hoạt', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new Error('Contract is not pending')
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'ACTIVE',
    } as never);
    const timetableSpy = vi.spyOn(encountersApi, 'getFamilyTimetable').mockResolvedValueOnce({
      data: [
        {
          id: 'enc-auto-1',
          contractId: 'ctr-1',
          doctorId: 'doc-1',
          scheduledDate: '2026-11-22T00:00:00.000Z',
          scheduledTime: '1970-01-01T08:30:00.000Z',
          encounterType: 'HOME_VISIT',
          category: 'PERIODIC_ROUTINE',
          encounterStatus: 'REQUESTED',
          doctor: { id: 'doc-1', doctorName: 'BS. Trần Thanh Mai' },
        },
      ],
      pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
    });

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-first-encounter')).toBeInTheDocument();
    expect(screen.getByTestId('booking-payment-first-encounter')).toHaveTextContent('2026-11-22');
    expect(screen.getByTestId('booking-payment-first-encounter')).toHaveTextContent('08:30');
    expect(screen.getByRole('link', { name: /Xem lịch khám/i })).toHaveAttribute(
      'href',
      '/family/appointments'
    );
    timetableSpy.mockRestore();
  });

  it('không hiển thị thẻ lịch khám dự kiến nếu chưa có buổi khám mặc định', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockRejectedValue(
      new Error('Contract is not pending')
    );
    vi.mocked(contractsApi.getMedicalContractDetail).mockResolvedValue({
      id: 'ctr-1',
      contractStatus: 'ACTIVE',
    } as never);
    const timetableSpy = vi.spyOn(encountersApi, 'getFamilyTimetable').mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, pageSize: 1, totalItems: 0, totalPages: 0 },
    });

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-success')).toBeInTheDocument();
    expect(screen.queryByTestId('booking-payment-first-encounter')).not.toBeInTheDocument();
    timetableSpy.mockRestore();
  });

  it('hiển thị QR kích thước responsive, mở modal phóng to và cung cấp nút tải ảnh QR', async () => {
    const qrUrl = 'https://vietqr.app/img?acc=882190068688&bank=MBBANK&template=qr_only';
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      qrUrl,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('booking-payment-pending')).toBeInTheDocument();
    const inlineImg = screen.getByAltText('Mã VietQR thanh toán kích hoạt gói');
    expect(inlineImg).toHaveAttribute('src', qrUrl);
    expect(inlineImg.className).toContain('h-56');
    expect(inlineImg.className).toContain('w-56');
    expect(inlineImg.className).toContain('sm:h-72');
    expect(inlineImg.className).toContain('sm:w-72');
    expect(inlineImg.className).toContain('max-w-full');
    expect(inlineImg.className).toContain('object-contain');

    const downloadLink = screen.getByTestId('payment-qr-download');
    expect(downloadLink).toHaveAttribute('href', qrUrl);
    expect(downloadLink.getAttribute('download')).toContain(pendingPayment.paymentCode);

    fireEvent.click(screen.getByTestId('payment-qr-zoom'));

    const modal = await screen.findByTestId('payment-qr-modal');
    expect(modal).toBeInTheDocument();
    const modalImg = screen.getByAltText(`Mã VietQR phóng to ${pendingPayment.paymentCode}`);
    expect(modalImg).toHaveAttribute('src', qrUrl);
    expect(modalImg.className).toContain('min-h-[320px]');
    expect(modalImg.className).toContain('min-w-[320px]');
    expect(modal).toHaveTextContent(pendingPayment.expectedAccountNumber);
    expect(modal).toHaveTextContent('9.600.000 đ');
    expect(modal).toHaveTextContent('FMD PAY 0001');
  });

  it('không hiện màn hình chúc mừng khi chỉ PAID mà hợp đồng chưa ACTIVE (loại bỏ false-success)', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      qrUrl: 'https://vietqr.app/img?template=qr_only',
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    } as never);
    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValue({
      ...pendingPayment,
      status: 'PAID',
      activation: {
        activated: false,
        blockingReasons: ['DOCTOR_VERIFICATION_REQUIRED'],
      },
    } as never);
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-payment-pending');
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tôi đã chuyển khoản/i }));

    const banner = await screen.findByTestId('payment-paid-pending-activation');
    expect(banner).toHaveTextContent('Đã ghi nhận thanh toán, đang xử lý kích hoạt');
    expect(screen.getByTestId('payment-activation-blocking-reasons')).toHaveTextContent(
      /hồ sơ bác sĩ phải được xác minh/i
    );
    expect(screen.queryByTestId('booking-payment-success')).toBeNull();
    expect(screen.queryByTestId('payment-qr-zoom')).not.toBeInTheDocument();
  });

  it('hiển thị banner soát xét thủ công kèm mã tham chiếu khi latestTransaction là REVIEW_REQUIRED', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    } as never);
    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValue({
      ...pendingPayment,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      latestTransaction: {
        id: 'tx-1',
        outcome: 'REVIEW_REQUIRED',
        reason: 'AMOUNT_MISMATCH',
        referenceCode: 'FT26322000999',
        receivedAt: '2026-11-18T06:00:00.000Z',
      },
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('booking-payment-pending');
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận tôi đã chuyển khoản/i }));

    const banner = await screen.findByTestId('payment-review-required');
    expect(banner).toHaveTextContent('Đã nhận giao dịch, đang được soát xét thủ công');
    expect(banner).toHaveTextContent('FT26322000999');
    expect(banner).toHaveTextContent(/Số tiền chuyển khoản không khớp/i);
    expect(screen.queryByTestId('booking-payment-success')).toBeNull();
  });

  it('gọi recheckPaymentActivation khi bấm Kiểm tra lại và chuyển màn hình chúc mừng khi activated=true', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      status: 'PAID',
      activation: {
        activated: false,
        blockingReasons: ['DOCTOR_VERIFICATION_REQUIRED'],
      },
    } as never);
    vi.mocked(contractsApi.getFamilyGateStatus).mockResolvedValue({
      hasActiveContract: false,
      activeContract: null,
      pendingContract: null,
      patientCount: 0,
    } as never);
    vi.mocked(contractsApi.recheckPaymentActivation)
      .mockResolvedValueOnce({
        activated: false,
        blockingReasons: ['PANEL_CAPACITY_UNAVAILABLE'],
      })
      .mockResolvedValueOnce({
        activated: true,
        blockingReasons: [],
      });

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    await screen.findByTestId('payment-paid-pending-activation');
    const recheckBtn = screen.getByTestId('payment-recheck-activation');
    expect(recheckBtn).toHaveTextContent('Kiểm tra lại tình trạng kích hoạt');

    fireEvent.click(recheckBtn);
    await waitFor(() => {
      expect(contractsApi.recheckPaymentActivation).toHaveBeenCalledWith('pay-1');
    });
    expect(screen.getByTestId('payment-activation-blocking-reasons')).toHaveTextContent(
      /giới hạn số hộ gia đình/i
    );
    expect(screen.queryByTestId('booking-payment-success')).toBeNull();

    fireEvent.click(screen.getByTestId('payment-recheck-activation'));
    expect(await screen.findByTestId('booking-payment-success')).toBeInTheDocument();
    expect(contractsApi.recheckPaymentActivation).toHaveBeenCalledTimes(2);
  });

  it('polling nền mở màn hình chúc mừng sau khi backend xác nhận kích hoạt', async () => {
    vi.mocked(contractsApi.createVietQRPayment).mockResolvedValue({
      ...pendingPayment,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    } as never);
    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValueOnce({
      ...pendingPayment,
      status: 'PAID',
      activation: {
        activated: false,
        blockingReasons: ['DOCTOR_VERIFICATION_REQUIRED'],
      },
    } as never);

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={30} />);

    await screen.findByTestId('payment-paid-pending-activation', {}, { timeout: 2000 });
    expect(screen.queryByTestId('booking-payment-success')).toBeNull();

    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValueOnce({
      ...pendingPayment,
      status: 'PAID',
      activation: {
        activated: true,
        blockingReasons: [],
      },
    } as never);

    expect(
      await screen.findByTestId('booking-payment-success', {}, { timeout: 2000 })
    ).toBeInTheDocument();
  });

  it('tải lại hóa đơn hết hạn đang đối soát mà không tạo mã mới', async () => {
    vi.mocked(contractsApi.getPaymentStatus).mockResolvedValue({
      ...pendingPayment,
      status: 'EXPIRED',
    } as never);
    vi.mocked(supportCasesApi.list).mockResolvedValueOnce({
      items: [
        {
          id: 'case-pay-open-1',
          caseCode: 'CK-OPEN1234',
          caseType: 'PAYMENT_ISSUE',
          status: 'IN_REVIEW',
          familyUserId: 'fam-1',
          contractId: 'ctr-1',
          complaintId: null,
          invoiceId: 'pay-1',
          transactionId: null,
          contextSnapshot: {},
          resolutionSummary: null,
          resolvedAt: null,
          createdAt: '2026-11-22T08:00:00Z',
          updatedAt: '2026-11-22T08:10:00Z',
          messageCount: 1,
          lastMessage: null,
          familyUser: { id: 'fam-1', fullName: 'Nguyễn Văn A', phone: '0901234567' },
          contract: {
            id: 'ctr-1',
            contractNumber: 'HD-2026-001',
            contractStatus: 'PENDING_PAYMENT',
            facilityName: 'PK FamiCare',
            packageName: 'Gói Chăm Sóc',
          },
          complaint: null,
          invoice: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 5,
    });

    render(<BookingPaymentStep contractId="ctr-1" pollingIntervalMs={0} />);

    expect(await screen.findByTestId('payment-report-issue')).toBeInTheDocument();
    const openBanner = await screen.findByTestId('payment-open-support-case');
    expect(openBanner).toHaveTextContent('CK-OPEN1234');
    expect(openBanner).toHaveTextContent(/không chuyển khoản lại/);
    expect(contractsApi.getPaymentStatus).toHaveBeenCalledWith('pay-1');
    expect(contractsApi.createVietQRPayment).not.toHaveBeenCalled();
    expect(screen.queryByTestId('payment-reissue')).not.toBeInTheDocument();
  });
});
