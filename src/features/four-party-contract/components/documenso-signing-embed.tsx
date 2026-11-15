'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EmbedSignDocument } from '@documenso/embed-react';
import {
  contractsApi,
  type BackendSignerRole,
  type ContractSigningSessionDto,
  type DocumensoSyncResultDto,
} from '@/lib/api';
import { ApiError } from '@/lib/http/errors';
import { cn } from '@/lib/utils';

export interface DocumensoSigningEmbedProps {
  contractId: string;
  onSyncCompleted?: (result: DocumensoSyncResultDto) => void;
  onSessionLoaded?: (session: ContractSigningSessionDto) => void;
  className?: string;
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

export function DocumensoSigningEmbed({
  contractId,
  onSyncCompleted,
  onSessionLoaded,
  className,
}: DocumensoSigningEmbedProps) {
  const [session, setSession] = useState<ContractSigningSessionDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [waitingForFamily, setWaitingForFamily] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWaitingForFamily(null);
    try {
      const data = await contractsApi.getSigningSession(contractId);
      setSession(data);
      onSessionLoaded?.(data);
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
        setWaitingForFamily(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [contractId, onSessionLoaded]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

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
    setError(null);
    try {
      const blob = await contractsApi.downloadSignedPdf(contractId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      setError(
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
        <span className="material-symbols-outlined text-[24px] animate-spin text-teal-600">
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
          {session.signedPdfUrl && (
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={() => void handleDownloadSignedPdf()}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
            >
              Xem PDF đã ký
              <span className="material-symbols-outlined text-[14px]">
                open_in_new
              </span>
            </button>
          )}
        </div>
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
          <p className="text-[11px] text-slate-600">
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
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700"
            >
              <span className="material-symbols-outlined text-[14px] mr-1.5">
                open_in_new
              </span>
              Mở trang ký Documenso
            </a>
          )}
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
