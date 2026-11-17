import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DocumensoSigningEmbed } from '../components/documenso-signing-embed';
import { contractsApi } from '@/lib/api/contracts.api';
import { ApiError } from '@/lib/http/errors';

const mockEmbedSpy = vi.fn();

vi.mock('@documenso/embed-react', () => ({
  EmbedSignDocument: (props: {
    token: string;
    host?: string;
    onDocumentCompleted?: (data: unknown) => void;
    onDocumentError?: (error: string | null) => void;
  }) => {
    mockEmbedSpy(props);
    return (
      <div
        data-testid="mock-documenso-embed"
        data-token={props.token}
        data-host={props.host}
      >
        <button
          type="button"
          data-testid="mock-documenso-complete-btn"
          onClick={() =>
            props.onDocumentCompleted?.({
              token: props.token,
              documentId: 1,
              recipientId: 1,
            })
          }
        >
          Hoàn tất ký trên Documenso
        </button>
      </div>
    );
  },
}));

const signingSessionFixture = {
  contractId: 'ctr-1',
  contractNumber: 'CTR-2026-001',
  contractStatus: 'PENDING_APPROVAL' as const,
  signerRole: 'FAMILY_REP' as const,
  alreadySigned: false,
  canSign: true,
  signingToken: 'tok-family-1',
  signingUrl: 'https://sign.famidoc.online/sign/tok-family-1',
  signedRoles: [],
  signedPdfUrl: null,
};

/** Giả lập phiên ký khả dụng để kiểm tra giao diện thanh tiêu đề khung ký. */
function mockSigningSession() {
  return vi
    .spyOn(contractsApi, 'getSigningSession')
    .mockResolvedValue(signingSessionFixture);
}

describe('DocumensoSigningEmbed Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockEmbedSpy.mockClear();
  });

  it('tải phiên ký, nhúng EmbedSignDocument với host/token và gọi syncDocumenso khi onDocumentCompleted kích hoạt', async () => {
    vi.spyOn(contractsApi, 'getSigningSession')
      .mockResolvedValueOnce({
        contractId: 'ctr-1',
        contractNumber: 'CTR-2026-001',
        contractStatus: 'PENDING_APPROVAL',
        signerRole: 'FAMILY_REP',
        alreadySigned: false,
        canSign: true,
        signingToken: 'tok-family-1',
        signingUrl: 'https://sign.famidoc.online/sign/tok-family-1',
        signedRoles: [],
        signedPdfUrl: null,
      })
      .mockResolvedValueOnce({
        contractId: 'ctr-1',
        contractNumber: 'CTR-2026-001',
        contractStatus: 'PENDING_APPROVAL',
        signerRole: 'FAMILY_REP',
        alreadySigned: true,
        canSign: false,
        signingToken: null,
        signingUrl: null,
        signedRoles: ['FAMILY_REP'],
        signedPdfUrl: '/api/v1/contracts/medical/ctr-1/signed-pdf',
      });

    const syncSpy = vi.spyOn(contractsApi, 'syncDocumenso').mockResolvedValueOnce({
      synced: true,
      contractId: 'ctr-1',
      contractStatus: 'PENDING_APPROVAL',
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: '/api/v1/contracts/medical/ctr-1/signed-pdf',
    });
    const onSyncCompleted = vi.fn();

    render(
      <DocumensoSigningEmbed
        contractId="ctr-1"
        onSyncCompleted={onSyncCompleted}
      />
    );

    const embed = await screen.findByTestId('mock-documenso-embed');
    expect(embed).toHaveAttribute('data-token', 'tok-family-1');
    expect(embed).toHaveAttribute('data-host', 'https://sign.famidoc.online');

    fireEvent.click(screen.getByTestId('mock-documenso-complete-btn'));

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledWith('ctr-1');
      expect(onSyncCompleted).toHaveBeenCalled();
    });

    expect(
      await screen.findByTestId('documenso-already-signed')
    ).toBeInTheDocument();
  });

  it('hiển thị trạng thái chờ Bên A khi backend trả HTTP 409', async () => {
    vi.spyOn(contractsApi, 'getSigningSession').mockRejectedValueOnce(
      new ApiError(
        'Hợp đồng đang chờ Đại diện hộ gia đình (Bên A) ký xác nhận trên Documenso trước khi các bên còn lại ký.',
        409
      )
    );

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    expect(
      await screen.findByTestId('documenso-waiting-family')
    ).toBeInTheDocument();
  });

  it('dùng token primary và cỡ chữ tối thiểu 12px ở thanh tiêu đề khung ký', async () => {
    mockSigningSession();

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    const container = await screen.findByTestId('documenso-embed-container');
    expect(container.innerHTML).not.toMatch(/teal-600|teal-700/);
    expect(container.innerHTML).not.toContain('text-[11px]');

    const openTabLink = screen.getByTestId('documenso-open-tab-link');
    expect(openTabLink.className).toContain('bg-primary');
    expect(openTabLink.className).not.toContain('teal');
  });

  it('giữ nút đồng bộ ở thanh tiêu đề mặc định và ẩn khi hideHeaderSyncButton bật', async () => {
    mockSigningSession();

    const { unmount } = render(<DocumensoSigningEmbed contractId="ctr-1" />);
    expect(await screen.findByTestId('documenso-embed-container')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đồng bộ sau khi ký/i })).toBeInTheDocument();
    unmount();

    mockSigningSession();
    render(<DocumensoSigningEmbed contractId="ctr-1" hideHeaderSyncButton />);

    expect(await screen.findByTestId('documenso-embed-container')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Đồng bộ sau khi ký/i })
    ).toBeNull();
    // Vẫn giữ liên kết mở trang ký và khung nhúng ký
    expect(screen.getByTestId('documenso-open-tab-link')).toBeInTheDocument();
    expect(screen.getByTestId('mock-documenso-embed')).toBeInTheDocument();
  });

  it('hiển thị trạng thái lỗi kèm nút thử lại khi kết nối thất bại', async () => {
    vi.spyOn(contractsApi, 'getSigningSession').mockRejectedValueOnce(
      new Error('Mất kết nối máy chủ')
    );

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    expect(await screen.findByTestId('documenso-embed-error')).toBeInTheDocument();
    expect(screen.getByText(/Mất kết nối máy chủ/i)).toBeInTheDocument();
  });

  it('vô hiệu hóa nút xem PDF và giải thích chờ đủ 4/4 khi đã ký nhưng signedPdfUrl = null', async () => {
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValue({
      ...signingSessionFixture,
      alreadySigned: true,
      canSign: false,
      signingToken: null,
      signingUrl: null,
      signedRoles: ['FAMILY_REP'],
      signedPdfUrl: null,
    });
    const downloadSpy = vi.spyOn(contractsApi, 'downloadSignedPdf');

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    const button = await screen.findByTestId('documenso-view-signed-pdf');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveTextContent('Xem PDF đã ký (chờ đủ 4/4)');

    expect(
      screen.getByTestId('documenso-signed-pdf-locked-note')
    ).toHaveTextContent(/mở khóa sau khi cả 4\/4 bên/i);

    fireEvent.click(button);
    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('kích hoạt nút xem PDF và tải blob qua contractsApi.downloadSignedPdf khi đủ 4/4', async () => {
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValue({
      ...signingSessionFixture,
      alreadySigned: true,
      canSign: false,
      signingToken: null,
      signingUrl: null,
      signedRoles: [
        'FAMILY_REP',
        'HEALTHCARE_FACILITY',
        'ASSIGNED_DOCTOR',
        'ADMIN',
      ],
      signedPdfUrl: '/api/v1/contracts/medical/ctr-1/signed-pdf',
    });
    const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    const downloadSpy = vi
      .spyOn(contractsApi, 'downloadSignedPdf')
      .mockResolvedValue(blob);
    const createObjectUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:famidoc-signed-pdf');
    const revokeObjectUrlSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null);

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    const button = await screen.findByTestId('documenso-view-signed-pdf');
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('Xem PDF đã ký');
    expect(
      screen.queryByTestId('documenso-signed-pdf-locked-note')
    ).toBeNull();

    fireEvent.click(button);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('ctr-1');
      expect(createObjectUrlSpy).toHaveBeenCalledWith(blob);
      expect(openSpy).toHaveBeenCalledWith(
        'blob:famidoc-signed-pdf',
        '_blank',
        'noopener,noreferrer'
      );
    });
    expect(revokeObjectUrlSpy).not.toHaveBeenCalled();
  });

  it('hiển thị lỗi tải PDF kèm nút thử lại ngay trong khối đã ký', async () => {
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValue({
      ...signingSessionFixture,
      alreadySigned: true,
      canSign: false,
      signingToken: null,
      signingUrl: null,
      signedRoles: [
        'FAMILY_REP',
        'HEALTHCARE_FACILITY',
        'ASSIGNED_DOCTOR',
        'ADMIN',
      ],
      signedPdfUrl: '/api/v1/contracts/medical/ctr-1/signed-pdf',
    });
    const downloadSpy = vi
      .spyOn(contractsApi, 'downloadSignedPdf')
      .mockRejectedValue(new ApiError('API error (409)', 409));

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    fireEvent.click(await screen.findByTestId('documenso-view-signed-pdf'));

    const alert = await screen.findByTestId('documenso-signed-pdf-error');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(alert).toHaveTextContent(/chưa hoàn tất đủ 4\/4 chữ ký/i);
    // Vẫn giữ khối trạng thái đã ký để người dùng thử lại mà không mất ngữ cảnh
    expect(screen.getByTestId('documenso-already-signed')).toBeInTheDocument();

    downloadSpy.mockResolvedValueOnce(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    );
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:retry');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(window, 'open').mockImplementation(() => null);

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('hiển thị trạng thái thiếu phiên ký kèm hướng dẫn (role="alert"), xử lý message rỗng và cho phép "Kiểm tra lại"', async () => {
    const getSessionSpy = vi
      .spyOn(contractsApi, 'getSigningSession')
      .mockRejectedValueOnce(new ApiError('', 404))
      .mockResolvedValueOnce(signingSessionFixture);

    render(<DocumensoSigningEmbed contractId="ctr-missing" />);

    const missingBox = await screen.findByTestId('documenso-missing-session');
    expect(missingBox).toHaveAttribute('role', 'alert');
    expect(missingBox).toHaveTextContent(/Chưa tìm thấy phiên ký Documenso/i);
    expect(missingBox).toHaveTextContent(
      /Hợp đồng này chưa có phiên ký Documenso cho vai trò hiện tại/i
    );
    expect(missingBox).toHaveTextContent(/quản trị viên FamiDoc/i);
    expect(
      screen.queryByTestId('documenso-embed-error')
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Kiểm tra lại/i }));

    expect(
      await screen.findByTestId('documenso-embed-container')
    ).toBeInTheDocument();
    expect(getSessionSpy).toHaveBeenCalledTimes(2);
  });

  it('hiển thị nút "Xem PDF đã ký" ở trạng thái không thể ký (documenso-unavailable) khi signedPdfUrl tồn tại', async () => {
    vi.spyOn(contractsApi, 'getSigningSession').mockResolvedValueOnce({
      ...signingSessionFixture,
      contractStatus: 'ACTIVE',
      alreadySigned: false,
      canSign: false,
      signingToken: null,
      signingUrl: null,
      signedRoles: [
        'FAMILY_REP',
        'HEALTHCARE_FACILITY',
        'ASSIGNED_DOCTOR',
        'ADMIN',
      ],
      signedPdfUrl: '/api/v1/contracts/medical/ctr-1/signed-pdf',
    });
    const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    const downloadSpy = vi
      .spyOn(contractsApi, 'downloadSignedPdf')
      .mockResolvedValueOnce(blob);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:unavailable-pdf');
    vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    const unavailableBox = await screen.findByTestId('documenso-unavailable');
    expect(unavailableBox).toBeInTheDocument();

    const pdfBtn = screen.getByTestId('documenso-view-signed-pdf');
    expect(pdfBtn).toHaveTextContent('Xem PDF đã ký');
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('ctr-1');
    });
  });
});
