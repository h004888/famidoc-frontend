'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrencyVND } from '@/lib/utils';

export type PaymentFailureReasonCode =
  | 'INVALID_SYNTAX'
  | 'INSUFFICIENT_AMOUNT'
  | 'EXPIRED_QR'
  | 'NETWORK_TIMEOUT'
  | 'BANK_DISCREPANCY';

export interface PaymentErrorDetails {
  reasonCode?: PaymentFailureReasonCode;
  message?: string;
  transactionCode?: string;
  contractId?: string;
  amountExpected?: number;
  amountReceived?: number;
  occurredAt?: string;
}

export interface PaymentFailureRetryViewProps {
  errorDetails?: PaymentErrorDetails;
  onRetryPayment?: () => void;
  onContactSupport?: () => void;
}

const DEFAULT_ERROR_DETAILS: PaymentErrorDetails = {
  reasonCode: 'INVALID_SYNTAX',
  message: 'Cú pháp chuyển khoản ngân hàng không trùng khớp với mã hợp đồng',
  transactionCode: 'TXN-882910',
  contractId: 'FMD-2026-REGR821',
  amountExpected: 9600000,
  amountReceived: 9600000,
  occurredAt: '01/11/2026 09:30',
};

const REASON_CONFIG: Record<
  PaymentFailureReasonCode,
  { title: string; hint: string }
> = {
  INVALID_SYNTAX: {
    title: 'Sai cú pháp chuyển khoản',
    hint: 'Nội dung giao dịch chuyển khoản thiếu hoặc sai mã định danh hợp đồng do ứng dụng ngân hàng tự động điền.',
  },
  INSUFFICIENT_AMOUNT: {
    title: 'Chuyển thiếu số tiền gói',
    hint: 'Số tiền nhận được qua Napas247 không đủ so với giá trị niêm yết của gói dịch vụ đã đăng ký.',
  },
  EXPIRED_QR: {
    title: 'Phiên giao dịch VietQR đã hết hạn',
    hint: 'Mỗi mã VietQR thanh toán chỉ có giá trị đối soát tự động trong 15 phút để đảm bảo an toàn giao dịch.',
  },
  NETWORK_TIMEOUT: {
    title: 'Nghẽn cổng đối soát ngân hàng',
    hint: 'Hệ thống Napas247 hoặc SePay phản hồi chậm. Giao dịch có thể đang nằm trong hàng đợi đối soát bù.',
  },
  BANK_DISCREPANCY: {
    title: 'Lệch thông tin đối soát',
    hint: 'Thông tin tài khoản nguồn và thông tin thụ hưởng chưa khớp nối trong bảng sao kê ngân hàng.',
  },
};

export function PaymentFailureRetryView({
  errorDetails = DEFAULT_ERROR_DETAILS,
  onRetryPayment,
  onContactSupport,
}: PaymentFailureRetryViewProps) {
  const router = useRouter();

  const code = errorDetails.reasonCode || 'INVALID_SYNTAX';
  const reasonMeta = REASON_CONFIG[code] || REASON_CONFIG.INVALID_SYNTAX;
  const transactionCode = errorDetails.transactionCode || 'TXN-882910';
  const contractId = errorDetails.contractId || 'FMD-2026-REGR821';
  const amountExpected = errorDetails.amountExpected ?? 9600000;
  const amountReceived = errorDetails.amountReceived;

  const handleRetry = () => {
    if (onRetryPayment) {
      onRetryPayment();
    } else {
      router.push('/family/billing');
    }
  };

  const handleContact = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      window.open('tel:1900888999', '_self');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-sans">
      {/* Breadcrumb / Top Bar */}
      <div className="mb-6 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Link href="/family/subscription" className="hover:text-slate-900 transition-colors">
            Gói Chăm sóc
          </Link>
          <span>/</span>
          <Link href="/family/subscription/tracking" className="hover:text-slate-900 transition-colors">
            Tiến trình ký kết
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">Báo lỗi thanh toán VietQR</span>
        </div>
        <Link
          href="/family/subscription/tracking"
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Xem tiến trình hợp đồng</span>
        </Link>
      </div>

      {/* Main Alert Card */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden">
        {/* Banner header: Subdued clinical warning (achromatic + amber accent, not garish red) */}
        <div className="border-b border-amber-200/80 bg-amber-50/60 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
            <span className="material-symbols-outlined text-[26px]">info</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                {reasonMeta.title}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                Mã lỗi: {code}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
              Giao dịch thanh toán chưa được ghi nhận
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {errorDetails.message || reasonMeta.hint}
            </p>
          </div>
        </div>

        {/* Ledger Details Table */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/40">
          <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-600 mb-3">
            Thông số đối chiếu giao dịch
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-0.5">Mã hợp đồng 4 bên</span>
              <span className="font-semibold text-slate-900 tabular-nums">{contractId}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-0.5">Mã tham chiếu ngân hàng</span>
              <span className="font-semibold text-slate-900 tabular-nums">{transactionCode}</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-0.5">Số tiền hợp đồng cần thu</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCurrencyVND(amountExpected)}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <span className="text-slate-500 block mb-0.5">Số tiền hệ thống nhận</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {amountReceived !== undefined ? formatCurrencyVND(amountReceived) : 'Chưa nhận được'}
              </span>
            </div>
          </div>
        </div>

        {/* Guided Resolution Steps (Anti-anxiety) */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-600">help_outline</span>
            <h3 className="text-sm font-semibold text-slate-900">
              Hướng dẫn xử lý an toàn & đối soát tự động
            </h3>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5 tabular-nums">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  Kiểm tra lịch sử biến động số dư ngân hàng
                </p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  Mở ứng dụng ngân hàng và kiểm tra xem tài khoản của bạn đã bị trừ tiền cho mã giao dịch{' '}
                  <span className="font-semibold text-slate-800 tabular-nums">{transactionCode}</span> chưa.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5 tabular-nums">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-900">Nếu tài khoản đã bị trừ tiền</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  Quý khách <span className="font-semibold text-slate-800">không cần chuyển khoản lại</span>. Hệ thống đối soát SePay tự động quét sao kê định kỳ mỗi 60 giây và kích hoạt bù ngay khi tìm thấy giao dịch. Vui lòng bấm vào nút hỗ trợ nếu sau 10 phút hợp đồng chưa chuyển sang trạng thái có hiệu lực.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5 tabular-nums">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-900">Nếu tài khoản chưa bị trừ tiền</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                  Bấm nút bên dưới để tạo lại mã VietQR mới với phiên giao dịch mới nhất, đảm bảo quét đúng mã và giữ nguyên nội dung chuyển khoản tự sinh.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-6 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleContact}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>Liên hệ hỗ trợ khẩn cấp</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#2E37A4] hover:bg-[#232B85] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">autorenew</span>
              <span>Tạo lại mã VietQR mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Support hotline footer */}
      <div className="mt-6 text-center text-xs text-slate-500 tabular-nums">
        Tổng đài đối soát FamiDoc: <span className="font-semibold text-slate-700">1900 888 999</span> (Hỗ trợ 24/7) • Email: <span className="font-semibold text-slate-700">support@famidoc.vn</span>
      </div>
    </div>
  );
}
