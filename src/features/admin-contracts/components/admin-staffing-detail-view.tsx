'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  contractsApi,
  extractErrorMessage,
  type StaffingContractItem,
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { B2bDocumensoSignPanel } from './b2b-documenso-sign-panel';

export interface AdminStaffingDetailViewProps {
  contractId: string;
}

function formatDateTime(value?: string | null): string | null {
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

export function AdminStaffingDetailView({
  contractId,
}: AdminStaffingDetailViewProps) {
  const [item, setItem] = useState<StaffingContractItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfReloadTick, setPdfReloadTick] = useState(0);

  const loadItem = useCallback(
    async (options?: { showSpinner?: boolean }) => {
      if (options?.showSpinner) setIsRefreshing(true);
      try {
        const data = await contractsApi.getStaffingContractById(contractId, {
          throwOnError: true,
        });
        setItem(data);
        setLoadError(null);
      } catch (err) {
        if (!item) {
          setLoadError(
            extractErrorMessage(err, 'Không thể tải hợp đồng B2B.')
          );
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [contractId, item]
  );

  useEffect(() => {
    void loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const isAllSigned = Boolean(
    item &&
      (item.status === 'ACTIVE' || (item.adminSigned && item.facilitySigned))
  );
  const isWaitingOther = Boolean(
    item && item.adminSigned && !item.facilitySigned && item.status !== 'TERMINATED'
  );

  useEffect(() => {
    if (!item || !isAllSigned) {
      setPdfBlobUrl(null);
      setPdfError(null);
      return;
    }
    let active = true;
    let createdUrl: string | null = null;
    setIsLoadingPdf(true);
    setPdfError(null);

    contractsApi
      .fetchStaffingSignedPdfBlobUrl(item.id)
      .then((url) => {
        if (!active) return;
        createdUrl = url;
        setPdfBlobUrl(url);
      })
      .catch((err) => {
        if (!active) return;
        setPdfError(
          extractErrorMessage(err, 'Không thể tải bản PDF hợp đồng B2B đã ký.')
        );
      })
      .finally(() => {
        if (active) setIsLoadingPdf(false);
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [isAllSigned, item, pdfReloadTick]);

  const handleDownloadPdfFile = () => {
    if (!pdfBlobUrl || !item) return;
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `hop-dong-b2b-${item.contractNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-6 text-xs text-slate-500">
        Đang tải hợp đồng B2B và phiên ký Documenso...
      </div>
    );
  }

  if (loadError || !item) {
    return (
      <div className="min-h-full bg-[#f5f6f8] p-6">
        <Alert
          variant="destructive"
          className="mx-auto max-w-3xl rounded-xl border-rose-200 bg-rose-50"
        >
          <AlertTitle className="text-sm font-bold text-rose-900">
            Không thể tải hợp đồng B2B
          </AlertTitle>
          <AlertDescription className="mt-1 space-y-3 text-xs text-rose-800 sm:text-sm">
            <p>{loadError || 'Không tìm thấy hợp đồng B2B được yêu cầu.'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={() => void loadItem({ showSpinner: true })}
                className="cursor-pointer rounded-lg text-xs font-semibold"
              >
                Thử lại
              </Button>
              <Button
                asChild
                size="xs"
                variant="outline"
                className="rounded-lg border-rose-200 bg-white text-xs font-semibold text-rose-800"
              >
                <Link href="/admin/contracts">Quay lại Quản lý Hợp đồng</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const signedCount = (item.facilitySigned ? 1 : 0) + (item.adminSigned ? 1 : 0);
  const progressPercent = Math.round((signedCount / 2) * 100);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 font-sans text-slate-800 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/contracts"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại Quản lý Hợp đồng
          </Link>

          {isWaitingOther && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={() => void loadItem({ showSpinner: true })}
              className="h-8 rounded-lg bg-white text-xs font-semibold"
            >
              <RefreshCw
                className={cn('mr-1.5 size-3.5', isRefreshing && 'animate-spin')}
              />
              {isRefreshing ? 'Đang cập nhật...' : 'Cập nhật tiến độ'}
            </Button>
          )}

          {isAllSigned && (
            <Badge
              variant="outline"
              className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
            >
              Đã đủ 2/2 chữ ký · Đang hiệu lực
            </Badge>
          )}
        </div>

        {/* Trạng thái 1: Admin chưa ký -> Khung ký Documenso toàn trang */}
        {!item.adminSigned && !isAllSigned && (
          <B2bDocumensoSignPanel
            contractId={item.id}
            onSyncCompleted={() => {
              void loadItem();
            }}
          />
        )}

        {/* Trạng thái 2A: Admin đã ký, chờ CSYT */}
        {isWaitingOther && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Quản trị viên FamiDoc đã hoàn tất ký số B2B
                </p>
                <p className="text-xs text-emerald-800">
                  Hợp đồng{' '}
                  <span className="font-semibold">{item.contractNumber}</span>{' '}
                  đang chờ Cơ sở Y tế đối tác hoàn tất ký số.
                </p>
              </div>
            </div>

            <Card className="gap-0 space-y-4 rounded-2xl border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">
                    Tiến độ ký hợp đồng B2B
                  </h2>
                  <span className="text-xs font-semibold tabular-nums text-slate-700">
                    {signedCount} / 2 bên ({progressPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <ul className="space-y-2.5">
                {[
                  {
                    key: 'facility',
                    label: 'Cơ sở y tế đối tác',
                    name: item.facilityName,
                    signed: item.facilitySigned,
                    signedAt: formatDateTime(item.facilitySignedAt),
                  },
                  {
                    key: 'admin',
                    label: 'Nền tảng FamiDoc (Bạn · Admin)',
                    name: 'Hệ thống FamiDoc',
                    signed: item.adminSigned,
                    signedAt: formatDateTime(item.adminSignedAt),
                  },
                ].map((party) => (
                  <li
                    key={party.key}
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
                      {party.signed && party.signedAt && (
                        <p className="mt-1 text-[11px] tabular-nums text-emerald-800">
                          {party.signedAt}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                <Lock className="size-4 shrink-0 text-slate-500" />
                <span>
                  Bản PDF hợp đồng B2B đầy đủ chữ ký sẽ tự động hiển thị trực tiếp tại đây khi đủ 2/2 bên ký.
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Trạng thái 2B: Đủ 2/2 -> Preview PDF trực tiếp */}
        {isAllSigned && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">
                    Hợp đồng B2B đã hoàn tất đủ 2/2 chữ ký
                  </p>
                  <p className="text-xs text-emerald-800">
                    {item.facilityName} ✓ · Nền tảng FamiDoc ✓
                  </p>
                </div>
              </div>
            </div>

            <Card className="gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white py-0 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span className="text-xs font-bold text-slate-900 sm:text-sm">
                    Bản hợp đồng B2B đã ký đầy đủ ({item.contractNumber})
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
                  Đang tải bản xem trước PDF hợp đồng B2B đã ký...
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
                  src={pdfBlobUrl}
                  title={`Bản hợp đồng B2B đã ký ${item.contractNumber}`}
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
