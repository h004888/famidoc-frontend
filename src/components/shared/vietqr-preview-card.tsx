'use client';

import React, { useState } from 'react';
import { ExternalLink, QrCode } from 'lucide-react';

export interface VietQrPreviewCardProps {
  qrUrl: string | null;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  bankLabel?: string;
  bankBin?: string | null;
  bankCode?: string | null;
  accountNumber?: string;
  accountHolder?: string;
  openLinkLabel?: string;
}

export function VietQrPreviewCard({
  qrUrl,
  title = 'Mã VietQR thụ hưởng',
  subtitle = 'Quét thử bằng ứng dụng ngân hàng để xác nhận đúng tài khoản trước khi lưu.',
  emptyMessage = 'Chọn ngân hàng và nhập số tài khoản hợp lệ (tối đa 19 ký tự chữ/số) để xem trước mã VietQR.',
  bankLabel,
  bankBin,
  bankCode,
  accountNumber,
  accountHolder,
  openLinkLabel = 'Mở ảnh VietQR SVG ở tab mới',
}: VietQrPreviewCardProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImageError = Boolean(qrUrl && failedUrl === qrUrl);

  return (
    <div
      data-testid="vietqr-preview-card"
      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex flex-col items-center justify-center shrink-0 rounded-xl border border-slate-200 bg-white p-3 w-full sm:w-52 min-h-48">
          {qrUrl && !hasImageError ? (
            <img
              key={qrUrl}
              src={qrUrl}
              alt={`Mã VietQR ${bankCode || bankLabel || ''}`.trim()}
              onError={() => setFailedUrl(qrUrl)}
              className="h-44 w-44 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-400 px-2">
              <QrCode className="h-9 w-9 text-slate-300" />
              <p className="text-[11px] leading-relaxed text-slate-500">
                {hasImageError
                  ? 'Không tải được ảnh QR từ img.vietqr.io. Vui lòng kiểm tra lại kết nối hoặc thông tin tài khoản.'
                  : emptyMessage}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2.5 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-white p-3">
            <div>
              <dt className="text-[11px] text-slate-500">Ngân hàng</dt>
              <dd className="font-semibold text-slate-900 mt-0.5">
                {bankLabel || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">Mã BIN / Code VietQR</dt>
              <dd className="font-semibold text-slate-800 tabular-nums mt-0.5">
                {bankBin || bankCode
                  ? [bankCode, bankBin].filter(Boolean).join(' · ')
                  : 'Chưa xác định'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">Số tài khoản</dt>
              <dd className="font-bold text-blue-700 tabular-nums mt-0.5">
                {accountNumber?.trim() || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">Chủ tài khoản</dt>
              <dd className="font-semibold text-slate-900 uppercase mt-0.5">
                {accountHolder?.trim() || '—'}
              </dd>
            </div>
          </dl>

          {qrUrl && (
            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{openLinkLabel}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
