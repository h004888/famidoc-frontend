'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmbedSignDocument } from '@documenso/embed-react';
import {
  contractsApi,
  type BackendSignerRole,
  type ContractSigningSessionDto,
  type DocumensoSyncResultDto,
} from '@/lib/api';
import { ApiError } from '@/lib/http/errors';
import { cn } from '@/lib/utils';
import { openSignedPdf } from '../lib/open-signed-pdf';

export interface DocumensoSigningEmbedProps {
  contractId: string;
  onSyncCompleted?: (result: DocumensoSyncResultDto) => void;
  onSessionLoaded?: (session: ContractSigningSessionDto) => void;
  className?: string;
  /**
   * Ẩn nút đồng bộ ở thanh tiêu đề khung ký khi nơi đặt đã có nút làm mới chung
   * (ví dụ `/booking/tracking`), tránh hai nút đồng bộ trùng chức năng.
   */
  hideHeaderSyncButton?: boolean;
}

const ROLE_LABELS: Record<BackendSignerRole, string> = {
  FAMILY_REP: 'Bên A (Đại diện Hộ gia đình)',
  HEALTHCARE_FACILITY: 'Bên B (Cơ sở Y tế)',
  ASSIGNED_DOCTOR: 'Bên C (Bác sĩ Gia đình)',
  ADMIN: 'Bên D (Nền tảng FamiDoc)',
};

function resolveDocumensoHost(signingUrl: string | null): string {
  if (signingUrl) {
    try {
      return new URL(signingUrl).origin;
    } catch {
      // Bỏ qua nếu URL mock hoặc đường dẫn tương đối
    }
  }
  return (
    process.env.NEXT_PUBLIC_DOCUMENSO_URL || 'https://sign.famidoc.online'
  ).replace(/\/+$/, '');
}

type SessionFetchResult =
  | { ok: true; data: ContractSigningSessionDto }
  | { ok: false; waitingForFamily: string }
  | { ok: false; error: string };

async function fetchSigningSessionResult(
  contractId: string
): Promise<SessionFetchResult> {
  try {
    const data = await contractsApi.getSigningSession(contractId);
    return { ok: true, data };
  } catch (err) {
    const status =
      err instanceof ApiError
        ? err.status
        : (err as { status?: number })?.status;
    const message =
      err instanceof Error
        ? err.message
        : 'Không thể tải phiên ký điện tử Documenso.';

    if (status === 409) {
      return { ok: false, waitingForFamily: message };
    }
    return { ok: false, error: message };
  }
}

export function DocumensoSigningEmbed({
  contractId,
  onSyncCompleted,
  onSessionLoaded,
  className,
  hideHeaderSyncButton = false,
}: DocumensoSigningEmbedProps) {
  const [session, setSession] = useState<ContractSigningSessionDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [waitingForFamily, setWaitingForFamily] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWaitingForFamily(null);
    const result = await fetchSigningSessionResult(contractId);
    if (result.ok) {
      setSession(result.data);
      onSessionLoaded?.(result.data);
    } else if ('waitingForFamily' in result) {
      setWaitingForFamily(result.waitingForFamily);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [contractId, onSessionLoaded]);

  useEffect(() => {
    let active = true;
    async function loadInitialSession() {
      const result = await fetchSigningSessionResult(contractId);
      if (!active) return;
      if (result.ok) {
        setSession(result.data);
        setWaitingForFamily(null);
        setError(null);
        onSessionLoaded?.(result.data);
      } else if ('waitingForFamily' in result) {
        setWaitingForFamily(result.waitingForFamily);
        setError(null);
      } else {
        setWaitingForFamily(null);
        setError(result.error);
      }
      setLoading(false);
    }
    void loadInitialSession();
    return () => {
      active = false;
    };
  }, [contractId, onSessionLoaded]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const syncResult = await contractsApi.syncDocumenso(contractId);
      onSyncCompleted?.(syncResult);
      await loadSession();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đồng bộ trạng thái ký từ Documenso.'
      );
    } finally {
      setSyncing(false);
    }
  }, [contractId, loadSession, onSyncCompleted]);

  const handleDownloadSignedPdf = useCallback(async () => {
    setDownloadingPdf(true);
    setPdfError(null);
    try {
      await openSignedPdf(contractId);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : 'Không thể tải tệp PDF đã ký từ máy chủ.'
      );
    } finally {
      setDownloadingPdf(false);
    }
  }, [contractId]);

  const documensoHost = useMemo(
    () => resolveDocumensoHost(session?.signingUrl ?? null),
    [session?.signingUrl]
  );

  if (loading) {
    return (
      <div
        data-testid="documenso-embed-loading"
        className={cn(
          'rounded-xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-center gap-3 text-slate-600',
          className
        )}
      >
        <span className="material-symbols-outlined text-[24px] animate-spin text-primary">
          progress_activity
        </span>
        <p className="text-sm font-medium">
          Đang tải phiên ký hợp đồng điện tử Documenso...
        </p>
      </div>
    );
  }

  if (waitingForFamily) {
    return (
      <div
        data-testid="documenso-waiting-family"
        className={cn(
          'rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-3',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0 mt-0.5">
            schedule
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-amber-950">
              Chờ Đại diện Hộ gia đình (Bên A) ký trước
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              {waitingForFamily}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadSession()}
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] mr-1.5">
            refresh
          </span>
          Kiểm tra lại trạng thái Bên A
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-testid="documenso-embed-error"
        className={cn(
          'rounded-xl border border-red-200 bg-red-50 p-6 space-y-3',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-red-700 shrink-0 mt-0.5">
            error
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-red-950">
              Không thể mở phiên ký Documenso
            </h3>
            <p className="text-xs text-red-800">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadSession()}
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-red-300 text-red-900 hover:bg-red-100 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px] mr-1.5">
            refresh
          </span>
          Thử lại
        </button>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  /**
   * Backend chỉ trả `signedPdfUrl` khi hợp đồng đã đủ 4/4 chữ ký, nên đây là
   * nguồn sự thật duy nhất để bật/tắt nút xem PDF.
   */
  const hasSignedPdf = Boolean(session.signedPdfUrl);

  if (session.alreadySigned) {
    return (
      <div
        data-testid="documenso-already-signed"
        className={cn(
          'rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-3',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[20px] text-emerald-700 shrink-0 mt-0.5">
            check_circle
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-emerald-950">
              {ROLE_LABELS[session.signerRole]} đã hoàn tất ký số trên Documenso
            </h3>
            <p className="text-xs text-emerald-900">
              Hợp đồng {session.contractNumber} đã ghi nhận chữ ký điện tử của bạn (
              {session.signedRoles.length}/4 bên đã ký).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void handleSync()}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
          >
            <span
              className={cn(
                'material-symbols-outlined text-[14px] mr-1.5',
                syncing && 'animate-spin'
              )}
            >
              refresh
            </span>
            Đồng bộ tiến độ 4 bên
          </button>
          <button
            type="button"
            data-testid="documenso-view-signed-pdf"
            disabled={!hasSignedPdf || downloadingPdf}
            aria-disabled={!hasSignedPdf || downloadingPdf}
            title={
              hasSignedPdf
                ? undefined
                : 'Bản PDF đầy đủ chữ ký sẽ mở khóa sau khi cả 4 bên ký xong.'
            }
            onClick={() => {
              if (!hasSignedPdf) return;
              void handleDownloadSignedPdf();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {hasSignedPdf ? 'Xem PDF đã ký' : 'Xem PDF đã ký (chờ đủ 4/4)'}
            <span className="material-symbols-outlined text-[14px]">
              {hasSignedPdf ? 'open_in_new' : 'lock'}
            </span>
          </button>
        </div>
        {!hasSignedPdf && (
          <p
            data-testid="documenso-signed-pdf-locked-note"
            className="flex items-start gap-1.5 text-xs leading-relaxed text-emerald-900"
          >
            <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">
              info
            </span>
            <span>
              Bản PDF đã ký đầy đủ sẽ mở khóa sau khi cả 4/4 bên (Gia đình, Cơ sở y
              tế, Bác sĩ, FamiDoc) hoàn tất ký trên Documenso.
            </span>
          </p>
        )}
        {pdfError && (
          <div
            role="alert"
            data-testid="documenso-signed-pdf-error"
            className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
          >
            <span className="material-symbols-outlined text-[14px]">error</span>
            <span className="min-w-0 flex-1">{pdfError}</span>
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={() => void handleDownloadSignedPdf()}
              className="inline-flex items-center rounded-md border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!session.canSign || !session.signingToken) {
    return (
      <div
        data-testid="documenso-unavailable"
        className={cn(
          'rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-2',
          className
        )}
      >
        <p className="text-sm font-medium text-slate-900">
          Phiên ký Documenso hiện chưa khả dụng cho trạng thái {session.contractStatus}.
        </p>
        <button
          type="button"
          disabled={syncing}
          onClick={() => void handleSync()}
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
        >
          Đồng bộ trạng thái từ Documenso
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="documenso-embed-container"
      className={cn(
        'rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm',
        className
      )}
    >
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-900">
            Ký kết trực tiếp trên Documenso — {ROLE_LABELS[session.signerRole]}
          </p>
          <p className="text-xs text-slate-600">
            Hợp đồng {session.contractNumber} • Đã có {session.signedRoles.length}/4 chữ ký
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {session.signingUrl && (
            <a
              href={session.signingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="documenso-open-tab-link"
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[14px] mr-1.5">
                open_in_new
              </span>
              Mở trang ký Documenso
            </a>
          )}
          {!hideHeaderSyncButton && (
            <button
              type="button"
              disabled={syncing}
              onClick={() => void handleSync()}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            >
              <span
                className={cn(
                  'material-symbols-outlined text-[14px] mr-1.5',
                  syncing && 'animate-spin'
                )}
              >
                refresh
              </span>
              Đồng bộ sau khi ký
            </button>
          )}
        </div>
      </div>

      <div className="p-2 sm:p-4 bg-white min-h-[500px]">
        <EmbedSignDocument
          className="w-full min-h-[680px] border-0"
          host={documensoHost}
          token={session.signingToken}
          onDocumentCompleted={() => {
            void handleSync();
          }}
          onDocumentError={(msg) => {
            setError(
              msg || 'Lỗi khi hiển thị giao diện ký Documenso.'
            );
          }}
        />
      </div>
    </div>
  );
}
