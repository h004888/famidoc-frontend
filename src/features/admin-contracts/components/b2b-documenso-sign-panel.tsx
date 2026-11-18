'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { EmbedSignDocument } from '@documenso/embed-react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, FileText, Lock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { contractsApi, extractErrorMessage, type StaffingSigningSessionDto } from '@/lib/api';
import { Button } from '@/components/ui/button';

export interface B2bDocumensoSignPanelProps {
  contractId: string;
  onSyncCompleted?: () => void;
}

function resolveDocumensoHost(signingUrl: string | null): string {
  if (signingUrl) {
    try {
      return new URL(signingUrl).origin;
    } catch {
      // Fallback if URL is relative
    }
  }
  return (process.env.NEXT_PUBLIC_DOCUMENSO_URL || 'https://sign.famidoc.online').replace(
    /\/+$/,
    '',
  );
}

export function B2bDocumensoSignPanel({
  contractId,
  onSyncCompleted,
}: B2bDocumensoSignPanelProps) {
  const [session, setSession] = useState<StaffingSigningSessionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fallbackSigning, setFallbackSigning] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractsApi.getStaffingSigningSession(contractId);
      setSession(res);
    } catch (err) {
      setSession(null);
      setError(extractErrorMessage(err, 'Không thể tải phiên ký Documenso B2B.'));
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const syncRes = await contractsApi.syncStaffingDocumenso(contractId);
      toast.success(
        syncRes.status === 'ACTIVE'
          ? 'Đã đồng bộ chữ ký Documenso: Hợp đồng B2B đã có hiệu lực!'
          : 'Đã đồng bộ trạng thái ký Documenso B2B.',
      );
      await loadSession();
      onSyncCompleted?.();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể đồng bộ chữ ký Documenso.'));
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenSignedPdf = async () => {
    setDownloadingPdf(true);
    setPdfError(null);
    try {
      const blobUrl = await contractsApi.fetchStaffingSignedPdfBlobUrl(contractId);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      setPdfError(extractErrorMessage(err, 'Không thể tải bản PDF đã ký từ Documenso.'));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleFallbackSign = async () => {
    if (!session) return;
    setFallbackSigning(true);
    try {
      await contractsApi.signStaffingContract(contractId, {});
      toast.success(
        session.signerRole === 'ADMIN'
          ? 'Đã ký xác nhận Bước 2 và kích hoạt hợp đồng B2B!'
          : 'Đã ký xác nhận Bước 1 — chuyển sang chờ Admin ký kích hoạt!'
      );
      await loadSession();
      onSyncCompleted?.();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể ký xác nhận hợp đồng B2B.'));
    } finally {
      setFallbackSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        Đang kiểm tra phiên ký số Documenso B2B...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{error || 'Chưa có phiên ký Documenso cho hợp đồng này.'}</span>
          </div>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => void loadSession()}
            className="bg-white"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const hasDocumensoPdf = Boolean(session.hasDocumensoPdf || session.documensoItemId);
  const hasSignedPdf = Boolean(session.status === 'ACTIVE' && hasDocumensoPdf);

  if (!session.canSign) {
    const isAlreadySigned = session.alreadySigned;
    return (
      <div
        data-testid={isAlreadySigned ? 'b2b-documenso-signed' : 'b2b-documenso-waiting'}
        className={`space-y-3 rounded-xl border p-4 text-xs ${
          isAlreadySigned
            ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
            : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            {isAlreadySigned ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-amber-600" />
            )}
            <span>
              {isAlreadySigned
                ? 'Bạn đã hoàn tất ký xác nhận hợp đồng B2B.'
                : session.waitingReason || 'Chưa đến lượt ký tuần tự.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasDocumensoPdf && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={syncing}
                onClick={() => void handleSync()}
                className="gap-1.5 bg-white"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                <span>Đồng bộ Documenso</span>
              </Button>
            )}

            {isAlreadySigned && (hasSignedPdf || session.status !== 'ACTIVE') && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={!hasSignedPdf || downloadingPdf}
                onClick={() => void handleOpenSignedPdf()}
                className="gap-1.5 bg-white"
              >
                {hasSignedPdf ? (
                  <FileText className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                <span>{hasSignedPdf ? 'Xem PDF đã ký' : 'Chờ đủ 2/2 chữ ký'}</span>
              </Button>
            )}
          </div>
        </div>

        {isAlreadySigned && !hasSignedPdf && (
          <p className="text-[11px] text-emerald-900">
            Bản PDF đã ký đầy đủ sẽ mở khóa sau khi cả 2 bên (Cơ sở Y tế và Quản trị viên FamiDoc) hoàn tất ký trên Documenso.
          </p>
        )}

        {pdfError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
          >
            {pdfError}
          </div>
        )}
      </div>
    );
  }

  if (!session.signingToken) {
    return (
      <div
        data-testid="b2b-documenso-unavailable"
        className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950"
      >
        <p className="font-medium">
          Phiên ký Documenso hiện chưa khả dụng cho hợp đồng này (chưa có envelope trên Documenso).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="xs"
            disabled={fallbackSigning}
            onClick={() => void handleFallbackSign()}
            className="gap-1.5"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>
              {fallbackSigning
                ? 'Đang ký xác nhận...'
                : session.signerRole === 'HEALTHCARE_FACILITY'
                  ? 'Ký xác nhận Bước 1 (Nội bộ)'
                  : 'Ký kích hoạt Bước 2 (Nội bộ)'}
            </span>
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={syncing}
            onClick={() => void handleSync()}
            className="gap-1.5 bg-white"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            <span>Đồng bộ trạng thái từ Documenso</span>
          </Button>
          {hasSignedPdf && (
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={downloadingPdf}
              onClick={() => void handleOpenSignedPdf()}
              className="gap-1.5 bg-white"
            >
              <FileText className="h-3 w-3" />
              <span>Xem PDF đã ký</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="b2b-documenso-embed-panel">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-900">
        <div>
          <p className="font-semibold">
            Ký kết trực tiếp trên Documenso —{' '}
            {session.signerRole === 'HEALTHCARE_FACILITY'
              ? 'Bước 1: Cơ sở Y tế'
              : 'Bước 2: Quản trị viên FamiDoc'}
          </p>
          <p className="text-[11px] text-slate-600 tabular-nums">
            Hợp đồng {session.contractCode} •{' '}
            {(session.facilitySigned ? 1 : 0) + (session.adminSigned ? 1 : 0)}/2 chữ ký
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {session.signingUrl && (
            <a
              href={session.signingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="b2b-documenso-open-tab-link"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở trang ký Documenso</span>
            </a>
          )}
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={syncing}
            onClick={() => void handleSync()}
            className="gap-1.5 bg-white text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Đang đồng bộ...' : 'Đồng bộ sau khi ký'}</span>
          </Button>
        </div>
      </div>

      <div className="min-h-[500px] overflow-hidden rounded-xl border border-slate-200 bg-white p-2 sm:p-4">
        <EmbedSignDocument
          token={session.signingToken}
          host={resolveDocumensoHost(session.signingUrl)}
          className="min-h-[680px] w-full border-0"
          onDocumentCompleted={() => {
            void handleSync();
          }}
          onDocumentError={(msg) => {
            setError(msg || 'Lỗi khi hiển thị giao diện ký Documenso.');
          }}
        />
      </div>
    </div>
  );
}
