'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  type DigitalSignature,
  type FourPartyContract,
  DocumensoSigningEmbed,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface DoctorContractReviewViewProps {
  contract?: FourPartyContract;
  contractId?: string;
  onSignSuccess?: (updatedContract: FourPartyContract) => void;
  /** Chu kỳ tự cập nhật khi chờ đủ 4/4 chữ ký (ms). Mặc định 10000ms. */
  pollingIntervalMs?: number;
}

const TOTAL_PARTIES = 4;

function formatSignedDateTime(value?: string): string | null {
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

function countSignedParties(contract: FourPartyContract): number {
  const sigs = contract.signatures;
  if (!sigs) return 0;
  return [sigs.family, sigs.facility, sigs.doctor, sigs.platform].filter(Boolean)
    .length;
}

export function DoctorContractReviewView({
  contract,
  contractId,
  onSignSuccess,
  pollingIntervalMs = 10_000,
}: DoctorContractReviewViewProps) {
  const [currentContract, setCurrentContract] = useState<FourPartyContract | null>(
    contract ?? null
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    Boolean(contractId) && !contract
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfReloadTick, setPdfReloadTick] = useState(0);

  const loadContractDetail = useCallback(
    async (options?: { showSpinner?: boolean }) => {
      if (!contractId) return;
      if (options?.showSpinner) {
        setIsRefreshing(true);
      }
      try {
        const data = await contractsApi.getMedicalContractById(contractId);
        setCurrentContract(data);
        setLoadError(null);
      } catch (err) {
        if (!currentContract) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Không thể tải chi tiết hợp đồng y tế 4 bên.'
          );
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [contractId, currentContract]
  );

  useEffect(() => {
    if (!contractId || contract) return;
    let active = true;
    async function initLoad() {
      try {
        const data = await contractsApi.getMedicalContractById(contractId!);
        if (!active) return;
        setCurrentContract(data);
        setLoadError(null);
      } catch (err) {
        if (!active) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Không thể tải chi tiết hợp đồng y tế 4 bên.'
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void initLoad();
    return () => {
      active = false;
    };
  }, [contract, contractId]);

  const signedCount = currentContract ? countSignedParties(currentContract) : 0;
  const hasDoctorSigned = Boolean(
    currentContract?.signatures?.doctor ||
      currentContract?.status === 'DOCTOR_ACCEPTED' ||
      currentContract?.status === 'ACTIVE'
  );
  const isAllFourSigned = Boolean(
    currentContract &&
      (signedCount >= TOTAL_PARTIES || currentContract.status === 'ACTIVE')
  );
  const isWaitingOthersAfterDoctorSigned =
    Boolean(currentContract) && hasDoctorSigned && !isAllFourSigned;

  // Tự động kiểm tra tiến độ mỗi 10s khi bác sĩ đã ký và đang chờ các bên còn lại.
  useEffect(() => {
    if (
      !contractId ||
      !isWaitingOthersAfterDoctorSigned ||
      pollingIntervalMs <= 0
    ) {
      return;
    }
    const timer = setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }
      void loadContractDetail();
    }, pollingIntervalMs);
    return () => clearInterval(timer);
  }, [
    contractId,
    isWaitingOthersAfterDoctorSigned,
    loadContractDetail,
    pollingIntervalMs,
  ]);

  // Tải trực tiếp PDF đầy đủ chữ ký để preview ngay trên trang khi đủ 4/4 bên.
  const targetId = currentContract?.id;
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
    if (!currentContract) return [];
    const sigs = currentContract.signatures;
    return [
      {
        key: 'family',
        label: 'Gia đình',
        name: currentContract.familyRepresentativeName || 'Đại diện Hộ gia đình',
        signature: sigs?.family,
      },
      {
        key: 'doctor',
        label: 'Bác sĩ phụ trách (Bạn)',
        name: currentContract.doctorName || 'Bác sĩ Gia đình phụ trách',
        signature: sigs?.doctor,
      },
      {
        key: 'facility',
        label: 'Cơ sở y tế điều phối',
        name: currentContract.facilityName || 'Cơ sở y tế đối tác',
        signature: sigs?.facility,
      },
      {
        key: 'platform',
        label: 'Nền tảng FamiDoc',
        name: 'Hệ thống FamiDoc',
        signature: sigs?.platform,
      },
    ];
  }, [currentContract]);

  const handleDownloadPdfFile = () => {
    if (!pdfBlobUrl || !currentContract) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `hop-dong-${currentContract.contractNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-6 text-xs text-slate-500">
        Đang tải hợp đồng và phiên ký Documenso...
      </div>
    );
  }

  if (loadError || !currentContract) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] p-6">
        <Alert
          role="alert"
          variant="destructive"
          className="mx-auto max-w-3xl space-y-3 rounded-xl border-rose-200 bg-rose-50 p-6"
        >
          <AlertTitle className="text-sm font-bold text-rose-900">
            Không thể tải hợp đồng y tế
          </AlertTitle>
          <AlertDescription className="text-xs text-rose-800">
            {loadError || 'Không tìm thấy hợp đồng được yêu cầu.'}
          </AlertDescription>
          <div className="flex items-center gap-2 pt-1">
            {contractId && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void loadContractDetail({ showSpinner: true })}
                className="rounded-lg text-xs font-semibold"
              >
                Thử lại
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-lg text-xs font-semibold"
            >
              <Link href="/doctor/contracts">Quay lại danh sách hợp đồng</Link>
            </Button>
          </div>
        </Alert>
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
            href="/doctor/contracts"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại Danh sách Hợp đồng
          </Link>

          {isWaitingOthersAfterDoctorSigned && contractId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => void loadContractDetail({ showSpinner: true })}
              className="h-8 rounded-lg bg-white text-xs font-semibold"
            >
              <RefreshCw
                className={cn('mr-1.5 size-3.5', isRefreshing && 'animate-spin')}
              />
              {isRefreshing ? 'Đang cập nhật...' : 'Cập nhật tiến độ'}
            </Button>
          )}

          {isAllFourSigned && (
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
            >
              Đã đủ 4/4 chữ ký ·{' '}
              {currentContract.status === 'ACTIVE'
                ? 'Đang hiệu lực'
                : 'Chờ gia đình thanh toán'}
            </Badge>
          )}
        </div>

        {/* Trạng thái 1: Chưa ký -> Khung đọc & ký Documenso */}
        {!hasDoctorSigned && (
          <div data-testid="doctor-Documenso-signing-section">
            <DocumensoSigningEmbed
              contractId={currentContract.id}
              onSyncCompleted={(res) => {
                const updatedSignatures: FourPartyContract['signatures'] = {
                  ...currentContract.signatures,
                };
                const nowIso = new Date().toISOString();
                const makeSig = (
                  signerRole: DigitalSignature['signerRole'],
                  signedBy: string
                ): DigitalSignature => ({
                  signedBy,
                  signerRole,
                  signedAt: nowIso,
                  sha256Hash: 'Documenso-verified-signature',
                });

                if (res.signedRoles.includes('FAMILY_REP') && !updatedSignatures.family) {
                  updatedSignatures.family = makeSig(
                    'FAMILY',
                    currentContract.familyRepresentativeName || 'Đại diện Hộ gia đình'
                  );
                }
                if (
                  res.signedRoles.includes('HEALTHCARE_FACILITY') &&
                  !updatedSignatures.facility
                ) {
                  updatedSignatures.facility = makeSig(
                    'FACILITY',
                    currentContract.facilityName || 'Cơ sở y tế'
                  );
                }
                if (
                  res.signedRoles.includes('ASSIGNED_DOCTOR') &&
                  !updatedSignatures.doctor
                ) {
                  updatedSignatures.doctor = makeSig(
                    'DOCTOR',
                    currentContract.doctorName || 'Bác sĩ Gia đình phụ trách'
                  );
                }
                if (res.signedRoles.includes('ADMIN') && !updatedSignatures.platform) {
                  updatedSignatures.platform = makeSig('PLATFORM', 'Nền tảng FamiDoc');
                }

                const updated: FourPartyContract = {
                  ...currentContract,
                  status:
                    res.contractStatus === 'PENDING_PAYMENT'
                      ? 'PENDING_PAYMENT'
                      : res.contractStatus === 'ACTIVE'
                      ? 'ACTIVE'
                      : 'DOCTOR_ACCEPTED',
                  signatures: updatedSignatures,
                };
                setCurrentContract(updated);
                onSignSuccess?.(updated);
                if (contractId) {
                  void loadContractDetail();
                }
              }}
            />
          </div>
        )}

        {/* Trạng thái 2A: Bác sĩ đã ký xong, đang chờ các bên còn lại (2/4 hoặc 3/4) */}
        {isWaitingOthersAfterDoctorSigned && (
          <div
            data-testid="doctor-post-signing-tracking"
            className="space-y-4"
          >
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Bác sĩ phụ trách đã hoàn tất ký số
                </p>
                <p className="text-xs text-emerald-800">
                  Hợp đồng{' '}
                  <span className="font-semibold">{currentContract.contractNumber}</span>{' '}
                  đã ghi nhận chữ ký của bạn. Hệ thống sẽ tự động cập nhật khi các bên còn lại hoàn tất.
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
                    data-testid="doctor-signing-progress-count"
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
                  const isSigned = Boolean(party.signature);
                  const signedAt = formatSignedDateTime(party.signature?.signedAt);
                  return (
                    <li
                      key={party.key}
                      data-testid={`doctor-party-status-${party.key}`}
                      className={cn(
                        'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5',
                        isSigned
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        {isSigned ? (
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
                            isSigned
                              ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                          )}
                        >
                          {isSigned ? 'Đã ký' : 'Đang chờ ký'}
                        </Badge>
                        {isSigned && signedAt && (
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
            data-testid="doctor-signed-pdf-preview-section"
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
                    Bản hợp đồng đã ký đầy đủ 4 bên ({currentContract.contractNumber})
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
                  data-testid="doctor-signed-pdf-iframe"
                  src={pdfBlobUrl}
                  title={`Bản hợp đồng đã ký ${currentContract.contractNumber}`}
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
