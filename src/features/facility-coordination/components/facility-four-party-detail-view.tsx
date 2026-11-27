'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { DocumensoSigningEmbed } from '@/features/four-party-contract';
import {
  contractsApi,
  extractErrorMessage,
  type BackendSignerRole,
  type MedicalContractDetailDto,
} from '@/lib/api';
import { encountersApi } from '@/lib/api/encounters.api';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FacilityFourPartyDetailViewProps {
  contractId: string;
  /** Chu kỳ tự cập nhật khi chờ đủ 4/4 chữ ký (ms). Mặc định 10000ms. */
  pollingIntervalMs?: number;
}

const TOTAL_PARTIES = 4;

function formatSignedDateTime(value?: string | null): string | null {
  if (!value) return null;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return null;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}

export function FacilityFourPartyDetailView({
  contractId,
  pollingIntervalMs = 10_000,
}: FacilityFourPartyDetailViewProps) {
  const [detail, setDetail] = useState<MedicalContractDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfReloadTick, setPdfReloadTick] = useState(0);
  const requestSeqRef = useRef(0);
  const hasDetailRef = useRef(false);
  const [isRetryingSchedule, setIsRetryingSchedule] = useState(false);

  // Xếp lại lịch khám tại nhà khi xếp tự động sau thanh toán bị lỗi/thiếu dữ liệu.
  const handleRetryAutoSchedule = async () => {
    setIsRetryingSchedule(true);
    try {
      const res = await encountersApi.retryContractAutoSchedule(contractId);
      toast.success(
        res.scheduledCount > 0
          ? `Đã xếp ${res.scheduledCount} buổi khám tại nhà cho hợp đồng.`
          : 'Hợp đồng đã đủ lịch khám tại nhà, không cần xếp thêm.',
      );
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsRetryingSchedule(false);
    }
  };

  const loadData = useCallback(
    async (options?: { showSpinner?: boolean; forceSync?: boolean }) => {
      const seq = ++requestSeqRef.current;
      if (options?.showSpinner) {
        setIsRefreshing(true);
      } else if (!hasDetailRef.current) {
        setIsLoading(true);
      }
      setLoadError(null);
      try {
        const data = options?.forceSync
          ? await contractsApi.getMedicalContractDetail(contractId, {
              forceSync: true,
            })
          : await contractsApi.getMedicalContractDetail(contractId);
        if (seq !== requestSeqRef.current) return;
        hasDetailRef.current = true;
        setDetail(data);
        setLoadError(null);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        if (!hasDetailRef.current) {
          setLoadError(
            extractErrorMessage(
              err,
              'Không thể tải chi tiết hợp đồng y tế 4 bên. Vui lòng thử lại.'
            )
          );
          setDetail(null);
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [contractId]
  );

  useEffect(() => {
    hasDetailRef.current = false;
    void loadData();
    return () => {
      requestSeqRef.current += 1;
    };
  }, [loadData]);

  const signaturesByRole = useMemo(() => {
    const map = new Map<BackendSignerRole, string | null>();
    for (const sig of detail?.signatures ?? []) {
      map.set(sig.signerRole, sig.signedAt ?? null);
    }
    return map;
  }, [detail?.signatures]);

  const signedCount = signaturesByRole.size;
  const hasFacilitySigned = Boolean(
    signaturesByRole.has('HEALTHCARE_FACILITY') ||
      detail?.contractStatus === 'ACTIVE'
  );
  const isAllFourSigned = Boolean(
    detail &&
      (signedCount >= TOTAL_PARTIES || detail.contractStatus === 'ACTIVE')
  );
  const isWaitingOthersAfterFacilitySigned =
    Boolean(detail) && hasFacilitySigned && !isAllFourSigned;

  // Tự động kiểm tra tiến độ mỗi 10s khi CSYT đã ký và đang chờ các bên còn lại.
  useEffect(() => {
    if (!isWaitingOthersAfterFacilitySigned || pollingIntervalMs <= 0) {
      return;
    }
    const timer = setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }
      void loadData();
    }, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [isWaitingOthersAfterFacilitySigned, loadData, pollingIntervalMs]);

  // Tải trực tiếp PDF đầy đủ chữ ký để preview ngay trên trang khi đủ 4/4 bên.
  const targetId = detail?.id;
  useEffect(() => {
    if (!targetId || !isAllFourSigned) {
      setPdfBlobUrl(null);
      setPdfError(null);
      return;
    }
    let active = true;
    let createdUrl: string | null = null;
    setIsLoadingPdf(true);
    setPdfError(null);

    contractsApi
      .downloadSignedPdf(targetId)
      .then((blob) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(createdUrl);
      })
      .catch((err) => {
        if (!active) return;
        setPdfError(
          err instanceof Error
            ? err.message
            : 'Không thể tải bản PDF hợp đồng đã ký.'
        );
      })
      .finally(() => {
        if (active) setIsLoadingPdf(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isAllFourSigned, pdfReloadTick, targetId]);

  const parties = useMemo(() => {
    if (!detail) return [];
    const familyName =
      detail.familyUnit?.representativeUser?.fullName?.trim() ||
      'Đại diện Hộ gia đình';
    const facilityName =
      detail.facility?.facilityName?.trim() || 'Cơ sở Y tế điều phối';
    const doctorName =
      detail.doctor?.doctorName?.trim() ||
      detail.doctor?.user?.fullName?.trim() ||
      'Bác sĩ Gia đình phụ trách';

    return [
      {
        role: 'FAMILY_REP' as const,
        label: 'Gia đình',
        name: familyName,
        signed: signaturesByRole.has('FAMILY_REP') || detail.contractStatus === 'ACTIVE',
        signedAt: signaturesByRole.get('FAMILY_REP') ?? null,
      },
      {
        role: 'HEALTHCARE_FACILITY' as const,
        label: 'Cơ sở y tế điều phối (Bạn)',
        name: facilityName,
        signed:
          signaturesByRole.has('HEALTHCARE_FACILITY') ||
          detail.contractStatus === 'ACTIVE',
        signedAt: signaturesByRole.get('HEALTHCARE_FACILITY') ?? null,
      },
      {
        role: 'ASSIGNED_DOCTOR' as const,
        label: 'Bác sĩ phụ trách',
        name: doctorName,
        signed:
          signaturesByRole.has('ASSIGNED_DOCTOR') ||
          detail.contractStatus === 'ACTIVE',
        signedAt: signaturesByRole.get('ASSIGNED_DOCTOR') ?? null,
      },
      {
        role: 'ADMIN' as const,
        label: 'Nền tảng FamiDoc',
        name: 'Hệ thống FamiDoc',
        signed: signaturesByRole.has('ADMIN') || detail.contractStatus === 'ACTIVE',
        signedAt: signaturesByRole.get('ADMIN') ?? null,
      },
    ];
  }, [detail, signaturesByRole]);

  const handleDownloadPdfFile = () => {
    if (!pdfBlobUrl || !detail) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `hop-dong-${detail.contractNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[420px] flex-col items-center justify-center gap-3 bg-[#f6f7f9] p-6 text-[#4a4f63]"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#eaeffa] border-t-[#0037c1]" />
        <p className="text-sm font-medium">
          Đang tải hợp đồng và phiên ký Documenso...
        </p>
      </div>
    );
  }

  if (loadError || !detail) {
    return (
      <div className="min-h-screen bg-[#f6f7f9] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Alert
            variant="destructive"
            className="rounded-xl border-[#ffa39e] bg-[#fff1f0] text-[#93000a]"
          >
            <AlertTitle className="text-sm font-semibold">
              Không thể tải hợp đồng y tế 4 bên
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm text-[#93000a]">
              {loadError || 'Không tìm thấy hợp đồng được yêu cầu.'}
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => void loadData({ showSpinner: true })}
              className="min-h-[44px] cursor-pointer rounded-lg bg-[#0046c0] text-sm font-semibold text-white hover:bg-[#003899]"
            >
              Thử lại
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-[44px] rounded-lg border-[#acc0f3] bg-[#f0fbff] text-sm font-semibold text-[#0037c1]"
            >
              <Link href="/facility/contracts">Quay lại Quản lý Hợp đồng</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round((signedCount / TOTAL_PARTIES) * 100)
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 font-sans text-slate-800 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/facility/contracts"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại Quản lý Hợp đồng
          </Link>

          {isWaitingOthersAfterFacilitySigned && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() =>
                void loadData({ showSpinner: true, forceSync: true })
              }
              className="h-8 rounded-lg bg-white text-xs font-semibold"
            >
              <RefreshCw
                className={cn('mr-1.5 size-3.5', isRefreshing && 'animate-spin')}
              />
              {isRefreshing ? 'Đang cập nhật...' : 'Cập nhật tiến độ'}
            </Button>
          )}

          {detail.contractStatus === 'ACTIVE' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRetryingSchedule}
              onClick={() => void handleRetryAutoSchedule()}
              data-testid="facility-retry-auto-schedule"
              className="h-8 rounded-lg bg-white text-xs font-semibold"
            >
              <RefreshCw
                className={cn('mr-1.5 size-3.5', isRetryingSchedule && 'animate-spin')}
              />
              {isRetryingSchedule ? 'Đang xếp lịch...' : 'Xếp lịch lại'}
            </Button>
          )}

          {isAllFourSigned && (
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
            >
              Đã đủ 4/4 chữ ký ·{' '}
              {detail.contractStatus === 'ACTIVE'
                ? 'Đang hiệu lực'
                : 'Chờ gia đình thanh toán'}
            </Badge>
          )}
        </div>

        {/* Trạng thái 1: CSYT (Bên B) chưa ký -> Chỉ hiển thị khung Documenso */}
        {!hasFacilitySigned && (
          <div data-testid="facility-documenso-signing-section">
            <DocumensoSigningEmbed
              contractId={detail.id}
              onSyncCompleted={() => {
                void loadData({ forceSync: true });
              }}
            />
          </div>
        )}

        {/* Trạng thái 2A: CSYT đã ký, chờ các bên còn lại (2/4 hoặc 3/4) */}
        {isWaitingOthersAfterFacilitySigned && (
          <div
            data-testid="facility-post-signing-tracking"
            className="space-y-4"
          >
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Cơ sở y tế điều phối đã hoàn tất ký số
                </p>
                <p className="text-xs text-emerald-800">
                  Hợp đồng{' '}
                  <span className="font-semibold">{detail.contractNumber}</span>{' '}
                  đã ghi nhận chữ ký của cơ sở y tế. Hệ thống sẽ tự động cập nhật khi các bên còn lại hoàn tất.
                </p>
              </div>
            </div>

            <Card className="gap-0 space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Tiến độ ký hợp đồng 4 bên
                  </h2>
                  <span
                    data-testid="facility-signing-progress-count"
                    className="text-xs font-semibold tabular-nums text-slate-700"
                  >
                    {signedCount} / {TOTAL_PARTIES} bên ({progressPercent}%)
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={TOTAL_PARTIES}
                  aria-valuenow={signedCount}
                  className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <ul className="space-y-2.5">
                {parties.map((party) => {
                  const signedAt = formatSignedDateTime(party.signedAt);
                  return (
                    <li
                      key={party.role}
                      data-testid={`facility-party-status-${party.role}`}
                      className={cn(
                        'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5',
                        party.signed
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {party.signed ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Clock className="size-4 shrink-0 text-amber-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                            {party.label}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {party.name}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            party.signed
                              ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                          )}
                        >
                          {party.signed ? 'Đã ký' : 'Đang chờ ký'}
                        </Badge>
                        {party.signed && signedAt && (
                          <p className="mt-1 text-[11px] tabular-nums text-emerald-800">
                            {signedAt}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                <Lock className="size-4 shrink-0 text-slate-500" />
                <span>
                  Bản PDF hợp đồng đầy đủ 4 chữ ký sẽ tự động hiển thị trực tiếp tại đây ngay khi cả 4/4 bên hoàn tất ký số.
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Trạng thái 2B: Đủ 4/4 chữ ký -> Preview trực tiếp PDF đầy đủ chữ ký */}
        {isAllFourSigned && (
          <div
            data-testid="facility-signed-pdf-preview-section"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">
                    Hợp đồng đã hoàn tất đủ 4/4 chữ ký
                  </p>
                  <p className="text-xs text-emerald-800">
                    Gia đình ✓ · Cơ sở y tế ✓ · Bác sĩ ✓ · Nền tảng FamiDoc ✓
                  </p>
                </div>
              </div>
            </div>

            <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span className="text-xs font-bold text-slate-900 sm:text-sm">
                    Bản hợp đồng đã ký đầy đủ 4 bên ({detail.contractNumber})
                  </span>
                </div>

                {pdfBlobUrl && (
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-xs font-semibold"
                    >
                      <a
                        href={pdfBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1.5 size-3.5" />
                        Mở tab mới
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleDownloadPdfFile}
                      className="h-8 rounded-lg text-xs font-semibold"
                    >
                      <Download className="mr-1.5 size-3.5" />
                      Tải PDF
                    </Button>
                  </div>
                )}
              </div>

              {isLoadingPdf ? (
                <div className="flex h-[520px] items-center justify-center bg-slate-50 text-xs text-slate-500">
                  Đang tải bản xem trước PDF hợp đồng đầy đủ chữ ký...
                </div>
              ) : pdfError ? (
                <div className="space-y-3 p-6 text-center">
                  <p className="text-xs font-medium text-rose-700">{pdfError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPdfReloadTick((t) => t + 1)}
                    className="rounded-lg text-xs font-semibold"
                  >
                    <RefreshCw className="mr-1.5 size-3.5" />
                    Thử tải lại PDF
                  </Button>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  data-testid="facility-signed-pdf-iframe"
                  src={pdfBlobUrl}
                  title={`Bản hợp đồng đã ký ${detail.contractNumber}`}
                  className="h-[740px] w-full border-0 bg-slate-100"
                />
              ) : null}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
