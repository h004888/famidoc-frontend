'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { contractsApi, type MedicalContractDetailDto } from '@/lib/api';
import {
  describeSignedPdfError,
  openSignedPdf,
} from '@/features/four-party-contract/lib/open-signed-pdf';
import { ContractRenewalDialog } from './contract-renewal-dialog';

interface SubscriptionContractDetailViewProps {
  contractId: string;
}

const shortDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function formatContractDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? shortDateFormatter.format(parsed)
    : value;
}

const STATUS_LABEL_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Đang hiệu lực (ACTIVE)',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  },
  EXPIRED: {
    label: 'Đã hết hạn',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  TERMINATED: {
    label: 'Đã chấm dứt',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  PENDING_PAYMENT: {
    label: 'Chờ thanh toán',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  PENDING_ACTIVATION: {
    label: 'Đã thanh toán – chờ hiệu lực',
    className: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  PENDING_APPROVAL: {
    label: 'Chờ ký 4 bên',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
};

export function SubscriptionContractDetailView({
  contractId,
}: SubscriptionContractDetailViewProps) {
  const [detail, setDetail] = useState<MedicalContractDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRenewOpen, setIsRenewOpen] = useState(false);

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfNonce, setPdfNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    contractsApi
      .getMedicalContractDetail(contractId)
      .then((res) => {
        if (active) setDetail(res);
      })
      .catch(() => {
        if (active) {
          setError('Không thể tải chi tiết gói dịch vụ và hợp đồng.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contractId]);

  const canHaveSignedPdf = Boolean(
    detail &&
      (detail.signedPdfUrl ||
        detail.contractStatus === 'ACTIVE' ||
        detail.contractStatus === 'EXPIRED' ||
        detail.contractStatus === 'TERMINATED'),
  );

  useEffect(() => {
    if (!detail || !canHaveSignedPdf) {
      setPdfBlobUrl(null);
      setPdfError('');
      setPdfLoading(false);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;
    setPdfLoading(true);
    setPdfError('');

    contractsApi
      .downloadSignedPdf(detail.id)
      .then((blob) => {
        if (!active) return;
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          createdUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(createdUrl);
        } else {
          setPdfError('Trình duyệt hiện tại không hỗ trợ xem trực tiếp tệp PDF.');
        }
      })
      .catch((err) => {
        if (active) {
          setPdfBlobUrl(null);
          setPdfError(describeSignedPdfError(err));
        }
      })
      .finally(() => {
        if (active) setPdfLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [detail, canHaveSignedPdf, pdfNonce]);

  if (loading) {
    return (
      <div
        role="status"
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500"
      >
        <RefreshCw className="size-4 animate-spin text-primary" aria-hidden="true" />
        <span>Đang tải chi tiết gói dịch vụ &amp; hợp đồng…</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <Link
          href="/family/subscription"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Quay lại danh sách Gói &amp; Hợp đồng</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {error || 'Không tìm thấy hợp đồng này.'}
        </div>
      </div>
    );
  }

  const packageName =
    detail.servicePackage?.packageName ||
    detail.billingSnapshot?.package?.name ||
    'Gói Chăm Sóc Sức Khỏe Gia Đình';
  const totalAmount = Number(
    detail.totalAmount ?? detail.billingSnapshot?.pricing?.totalPriceVnd ?? 0,
  );
  const statusInfo = STATUS_LABEL_MAP[detail.contractStatus] ?? {
    label: detail.contractStatus,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const homeTotal = detail.servicePackage?.periodicVisitsQuota ?? 0;
  const homeRemaining = Math.max(0, detail.remainingHomeVisits ?? homeTotal);
  const homeUsed = Math.max(0, homeTotal - homeRemaining);

  const teleTotal = detail.servicePackage?.telehealthQuota ?? 0;
  const teleRemaining = Math.max(0, detail.remainingTelehealth ?? teleTotal);
  const teleUsed = Math.max(0, teleTotal - teleRemaining);
  const isUnlimitedTele = detail.servicePackage?.videoQuotaPolicy === 'UNLIMITED';

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/family/subscription"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Quay lại danh sách Gói &amp; Hợp đồng</span>
          </Link>
        </div>

        {/* Header thông tin gói */}
        <header className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant="outline"
                className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums"
              >
                #{detail.contractNumber}
              </Badge>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${statusInfo.className}`}
              >
                <span>{statusInfo.label}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {packageName}
            </h1>

            <p className="text-sm text-slate-600">
              Hiệu lực từ{' '}
              <strong className="text-slate-800 tabular-nums">
                {formatContractDate(detail.startDate)} –{' '}
                {formatContractDate(detail.endDate)}
              </strong>{' '}
              · Tổng giá trị gói:{' '}
              <strong className="font-bold text-primary tabular-nums">
                {totalAmount.toLocaleString('vi-VN')} đ
              </strong>
              {detail.doctor?.doctorName ? ` · BS. ${detail.doctor.doctorName}` : ''}
              {detail.facility?.facilityName
                ? ` · ${detail.facility.facilityName}`
                : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {(detail.contractStatus === 'ACTIVE' ||
              detail.contractStatus === 'EXPIRED') && (
              <Button
                type="button"
                onClick={() => setIsRenewOpen(true)}
                className="rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Gia hạn hợp đồng
              </Button>
            )}
            {detail.contractStatus === 'TERMINATED' && (
              <Button
                asChild
                className="rounded-xl text-xs sm:text-sm font-semibold"
              >
                <Link href="/doctors">Mua gói mới</Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="rounded-xl text-xs sm:text-sm font-semibold"
            >
              <Link href="/family/billing">Xem biên lai</Link>
            </Button>
          </div>
        </header>

        {/* Hạn mức quyền lợi */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Hạn Mức Quyền Lợi Gia Đình Đang Có
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Bác Sĩ Thăm Khám Tại Nhà
                </h3>
                <Badge variant="outline" className="text-xs font-bold tabular-nums">
                  Còn {homeRemaining} / {homeTotal} lượt
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Đã dùng: <strong className="text-slate-800">{homeUsed}</strong> /{' '}
                {homeTotal} lượt theo gói
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Tư Vấn Video Telehealth 24/7
                </h3>
                <Badge variant="outline" className="text-xs font-bold tabular-nums">
                  {isUnlimitedTele
                    ? 'Không giới hạn lượt'
                    : `Còn ${teleRemaining} / ${teleTotal} lượt`}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {isUnlimitedTele
                  ? 'Kết nối trực tiếp bác sĩ gia đình không giới hạn trong kỳ'
                  : `Đã dùng: ${teleUsed} / ${teleTotal} lượt theo gói`}
              </p>
            </div>
          </div>
        </section>

        {/* Trình xem trực tiếp Hợp đồng PDF */}
        <section
          aria-label="Xem trực tiếp hợp đồng điện tử PDF"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="size-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Hợp Đồng Điện Tử (Bản PDF)
                </h2>
                <p className="text-xs text-slate-500">
                  Xem trực tiếp văn bản hợp đồng 4 bên có chữ ký số điện tử
                </p>
              </div>
            </div>

            {canHaveSignedPdf && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (pdfBlobUrl) {
                      window.open(pdfBlobUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      void openSignedPdf(detail.id).catch((err) =>
                        setPdfError(err instanceof Error ? err.message : 'Không thể mở tệp PDF.'),
                      );
                    }
                  }}
                  className="rounded-xl text-xs cursor-pointer"
                >
                  <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                  Mở ở tab mới
                </Button>
                {pdfBlobUrl && (
                  <Button asChild size="sm" className="rounded-xl text-xs font-semibold">
                    <a href={pdfBlobUrl} download={`hop-dong-${detail.contractNumber}.pdf`}>
                      <Download className="mr-1.5 size-3.5" aria-hidden="true" />
                      Tải bản PDF
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5">
            {detail.upgradedFromId && !detail.documensoItemId && !detail.signedPdfUrl ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-5 text-sm text-sky-900 space-y-2">
                <p className="font-bold">Bản ghi xác nhận gia hạn trực tuyến</p>
                <p>
                  Kỳ hợp đồng gia hạn được đại diện gia đình xác nhận trực tuyến theo quy trình rút gọn (không ký lại 4 bên).
                </p>
                {detail.billingSnapshot?.renewalConfirmation?.confirmedAt && (
                  <p className="text-xs text-sky-800">
                    Thời điểm xác nhận: {formatContractDate(detail.billingSnapshot.renewalConfirmation.confirmedAt)}
                    {detail.billingSnapshot.renewalConfirmation.termsHash
                      ? ` · Mã điều khoản: ${detail.billingSnapshot.renewalConfirmation.termsHash.slice(0, 12)}…`
                      : ''}
                  </p>
                )}
              </div>
            ) : !canHaveSignedPdf ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                File PDF hợp đồng sẽ hiển thị trực tiếp tại đây sau khi cả 4 bên
                hoàn tất ký số điện tử.
              </div>
            ) : pdfLoading ? (
              <div
                role="status"
                className="flex h-64 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500"
              >
                <RefreshCw className="size-4 animate-spin text-primary" aria-hidden="true" />
                <span>Đang tải bản PDF hợp đồng…</span>
              </div>
            ) : pdfError ? (
              <div
                role="alert"
                className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800"
              >
                <p>{pdfError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPdfNonce((n) => n + 1)}
                  className="rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Thử tải lại PDF
                </Button>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                title={`Bản PDF hợp đồng ${detail.contractNumber}`}
                src={pdfBlobUrl}
                className="h-[720px] w-full rounded-xl border border-slate-200 bg-slate-50"
              />
            ) : null}
          </div>
        </section>
      </main>

      {isRenewOpen && (
        <ContractRenewalDialog
          contractId={detail.id}
          onClose={() => setIsRenewOpen(false)}
          onSuccess={() => setPdfNonce((n) => n + 1)}
        />
      )}
    </div>
  );
}
