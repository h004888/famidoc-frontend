import React from 'react';
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

  it('hiển thị trạng thái lỗi kèm nút thử lại khi kết nối thất bại', async () => {
    vi.spyOn(contractsApi, 'getSigningSession').mockRejectedValueOnce(
      new Error('Mất kết nối máy chủ')
    );

    render(<DocumensoSigningEmbed contractId="ctr-1" />);

    expect(await screen.findByTestId('documenso-embed-error')).toBeInTheDocument();
    expect(screen.getByText(/Mất kết nối máy chủ/i)).toBeInTheDocument();
  });
});
