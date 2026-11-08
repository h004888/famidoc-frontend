'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  orderCode: string;
  title: string;
  subtitle: string;
  amount: string;
  date: string;
  method: string;
  status: 'paid' | 'processing';
  receiptUrl: string;
}

interface PaymentOption {
  id: string;
  title: string;
  badge: string;
  description: string;
  amountNumber: number;
  amountFormatted: string;
  transferMemo: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'renew-vip-12m',
    title: 'Gia hạn sớm Gói Gia Đình Toàn Diện VIP (12 Tháng)',
    badge: 'Ưu đãi -5%',
    description: 'Nối tiếp hiệu lực từ 01/01/2027 – 31/12/2027 cho cả hộ gia đình',
    amountNumber: 9120000,
    amountFormatted: '9.120.000 đ',
    transferMemo: 'FMD FAM88219 VIP2027',
  },
  {
    id: 'addon-home-visit',
    title: 'Mua thêm 02 lượt Bác sĩ Thăm Khám Tại Nhà',
    badge: 'Bổ sung lượt',
    description: 'Cộng thêm ngay 02 lượt khám bác sĩ tại nhà vào hợp đồng hiện tại',
    amountNumber: 1200000,
    amountFormatted: '1.200.000 đ',
    transferMemo: 'FMD FAM88219 HOME02',
  },
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-002',
    orderCode: 'FMD-PAY-88219-LAB',
    title: 'Gói Xét Nghiệm Sinh Hóa Máu Chuyên Sâu Tại Nhà',
    subtitle: 'Lấy mẫu tận nơi cho Ông Nguyễn Văn Phúc & Bà Trần Thị Mai',
    amount: '850.000 đ',
    date: '10/10/2026 • 11:30',
    method: 'VietQR • Vietcombank 24/7',
    status: 'paid',
    receiptUrl: 'Bien_Lai_FMD_INV_002.pdf',
  },
  {
    id: 'INV-2026-001',
    orderCode: 'FMD-PAY-88219-VIP',
    title: 'Gói Chăm Sóc Gia Đình Toàn Diện VIP (Kỳ hạn 12 Tháng)',
    subtitle: 'Hợp đồng số #FMD-HD-88219 • Thời hạn 01/01/2026 – 31/12/2026',
    amount: '9.600.000 đ',
    date: '01/01/2026 • 09:12',
    method: 'VietQR • MB Bank NAPAS 24/7',
    status: 'paid',
    receiptUrl: 'Bien_Lai_FMD_INV_001.pdf',
  },
];

export function FamilyBillingView() {
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(PAYMENT_OPTIONS[0].id);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [billingToast, setBillingToast] = useState<string | null>(null);

  const selectedOption =
    PAYMENT_OPTIONS.find((item) => item.id === selectedOptionId) || PAYMENT_OPTIONS[0];

  const handleOpenQrModal = () => {
    setTimeLeft(15 * 60);
    setShowQrModal(true);
  };

  useEffect(() => {
    if (!showQrModal) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showQrModal]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(key);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleVerifyPayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1
      ).padStart(2, '0')}/${now.getFullYear()} • ${String(now.getHours()).padStart(
        2,
        '0'
      )}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newInvoice: Invoice = {
        id: `INV-${Date.now()}`,
        orderCode: `FMD-PAY-${Math.floor(10000 + Math.random() * 90000)}`,
        title: selectedOption.title,
        subtitle: selectedOption.description,
        amount: selectedOption.amountFormatted,
        date: dateStr,
        method: 'VietQR • NAPAS 24/7',
        status: 'paid',
        receiptUrl: `Bien_Lai_FMD_${Date.now()}.pdf`,
      };

      setInvoices((prev) => [newInvoice, ...prev]);
      setIsVerifying(false);
      setShowQrModal(false);
      setBillingToast(
        `Đã xác nhận thanh toán ${selectedOption.amountFormatted} thành công! Biên lai điện tử mới đã được thêm vào lịch sử.`
      );
      setTimeout(() => setBillingToast(null), 4500);
    }, 1000);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    `VIETQR|MBBANK|882190068688|${selectedOption.amountNumber}|${selectedOption.transferMemo}`
  )}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="max-w-6xl mx-auto py-5 sm:py-7 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. HEADER THANH TOÁN & BIÊN LAI ĐIỆN TỬ (2 TẦNG GỌN GÀNG) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#2E37A4] text-white flex items-center justify-center shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#2E37A4] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                    Hộ #FAM-88219
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>NAPAS 24/7 Tự động</span>
                  </span>
                </div>

                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                  Thanh Toán VietQR &amp; Biên Lai Điện Tử
                </h1>

                <p className="text-xs text-slate-500">
                  Quét mã QR ngân hàng để gia hạn gói chăm sóc hoặc tải hóa đơn VAT điện tử của gia
                  đình
                </p>
              </div>
            </div>

            {/* Cụm nút hành động */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenQrModal}
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">qr_code_scanner</span>
                <span>Mở mã VietQR</span>
              </button>

              <Link
                href="/family/subscription"
                className="col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-50/80 hover:bg-blue-100 text-[#2E37A4] border border-blue-200/80 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px]">verified_user</span>
                <span>Hợp đồng 4 bên</span>
              </Link>
            </div>
          </div>

          {/* Tầng 2: Tóm tắt nhanh trạng thái gói & công nợ */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="material-symbols-outlined text-[17px] text-[#2E37A4]">
                workspace_premium
              </span>
              <span>
                Gói hiện tại:{' '}
                <strong className="text-slate-900">Gói Gia Đình Toàn Diện VIP (12 Tháng)</strong> •
                Hết hạn: <strong className="text-slate-900">31/12/2026</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Công nợ hiện tại: 0 đ (Đã thanh toán đủ)</span>
            </div>
          </div>
        </div>

        {/* 2. 3 THẺ TÓM TẮT TÀI CHÍNH HỘ GIA ĐÌNH */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                Tổng đã thanh toán (2026)
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono">
                10.450.000 đ
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Đã phát hành {invoices.length} biên lai VAT
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#2E37A4] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">
                account_balance_wallet
              </span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Kỳ gia hạn tiếp theo</span>
              <div className="text-xl sm:text-2xl font-extrabold text-[#2E37A4] font-mono">
                31/12/2026
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <span className="material-symbols-outlined text-[14px] text-[#2E37A4]">
                  schedule
                </span>
                Còn 65 ngày hiệu lực
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-[#2E37A4] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">event_repeat</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Dư nợ phát sinh</span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono">
                0 đ
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Bảo lãnh 100% quyền lợi trong gói
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">shield</span>
            </div>
          </div>
        </div>

        {/* 3. KHU VỰC THANH TOÁN NHANH VIETQR & CHUYỂN KHOẢN NGÂN HÀNG */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-5">
          {/* Header khu vực VietQR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2E37A4]/10 text-[#2E37A4] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  Thanh Toán Gia Hạn Sớm Hoặc Mua Thêm Lượt Khám
                </h2>
                <p className="text-xs text-slate-500">
                  Chọn mục cần thanh toán bên dưới, mã VietQR và nội dung chuyển khoản sẽ tự động
                  cập nhật
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#2E37A4] border border-blue-200/80">
              Hỗ trợ 45+ Ngân hàng Việt Nam
            </span>
          </div>

          {/* Bước 1: Chọn dịch vụ muốn thanh toán */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = option.id === selectedOptionId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/40 border-[#2E37A4] ring-2 ring-[#2E37A4]/15'
                      : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        {option.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {option.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold font-mono text-sm sm:text-base text-[#2E37A4]">
                      {option.amountFormatted}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {isSelected ? 'Đang chọn ✓' : 'Bấm để chọn'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bước 2: Mã QR & Chi tiết tài khoản ngân hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-1">
            {/* Cột trái: Mã QR */}
            <div className="lg:col-span-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 flex flex-col items-center justify-between text-center gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                <img
                  src={qrImageUrl}
                  alt="Mã VietQR FamiDoc"
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  Quét mã bằng App Ngân hàng bất kỳ
                </div>
                <p className="text-[11px] text-slate-500">
                  Tự động điền sẵn số tài khoản, số tiền và nội dung chuyển khoản
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenQrModal}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-[#2E37A4] border border-slate-200/90 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                <span>Phóng to mã QR trên màn hình</span>
              </button>
            </div>

            {/* Cột phải: Thông tin chuyển khoản thủ công */}
            <div className="lg:col-span-8 bg-slate-50/60 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#2E37A4] uppercase tracking-wider block">
                      Tài khoản thụ hưởng chính thức
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                      CTCP Chăm Sóc Y Tế Gia Đình FamiDoc
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700">
                    MB Bank • CN TP.HCM
                  </span>
                </div>

                {/* 3 Hàng thông tin có nút Sao chép */}
                <div className="space-y-2.5 text-xs">
                  {/* Số tài khoản */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Số tài khoản MB Bank</span>
                      <strong className="font-mono text-sm sm:text-base text-[#2E37A4] font-extrabold">
                        8821 9006 8688
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('882190068688', 'acc')}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2E37A4] border border-slate-200/90 font-bold text-xs cursor-pointer transition-colors shrink-0"
                    >
                      {isCopied === 'acc' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Số tiền */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Số tiền thanh toán</span>
                      <strong className="font-mono text-sm sm:text-base text-slate-900 font-extrabold">
                        {selectedOption.amountFormatted}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(selectedOption.amountNumber), 'amt')}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2E37A4] border border-slate-200/90 font-bold text-xs cursor-pointer transition-colors shrink-0"
                    >
                      {isCopied === 'amt' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Nội dung chuyển khoản (Tự động đối soát)
                      </span>
                      <strong className="font-mono text-sm text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                        {selectedOption.transferMemo}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedOption.transferMemo, 'memo')}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2E37A4] border border-slate-200/90 font-bold text-xs cursor-pointer transition-colors shrink-0"
                    >
                      {isCopied === 'memo' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Nút xác nhận đã chuyển khoản */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-3 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang kiểm tra giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Xác nhận tôi đã chuyển khoản</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-slate-500">
                  Hệ thống tự động cấp biên lai điện tử trong 60 giây.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. LỊCH SỬ GIAO DỊCH & BIÊN LAI ĐIỆN TỬ (CARDS TRÊN MOBILE, BẢNG TRÊN DESKTOP) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-[#2E37A4]">
                history
              </span>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900">
                  Lịch Sử Giao Dịch &amp; Biên Lai Thu Tiền ({invoices.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Hóa đơn giá trị gia tăng điện tử có chữ ký số theo chuẩn Tổng Cục Thuế
                </p>
              </div>
            </div>
          </div>

          {/* Giao diện Mobile: Danh sách Thẻ Biên Lai (Không cần cuộn ngang) */}
          <div className="md:hidden divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#2E37A4] bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70">
                      {inv.orderCode}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1.5">{inv.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{inv.subtitle}</p>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Thành công
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-extrabold font-mono text-sm text-slate-900">
                      {inv.amount}
                    </div>
                    <div className="text-[11px] text-slate-400">{inv.date}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBillingToast(`Đang tải biên lai điện tử: ${inv.receiptUrl}`);
                      setTimeout(() => setBillingToast(null), 3000);
                    }}
                    className="px-3 py-2 rounded-xl bg-blue-50/80 text-[#2E37A4] font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Tải PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Giao diện Desktop: Bảng 6 cột chuẩn mực */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">Mã giao dịch</th>
                  <th className="p-4">Nội dung thanh toán</th>
                  <th className="p-4">Số tiền</th>
                  <th className="p-4">Phương thức &amp; Thời gian</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Biên lai PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#2E37A4] whitespace-nowrap">
                      {inv.orderCode}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{inv.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{inv.subtitle}</div>
                    </td>
                    <td className="p-4 font-mono font-extrabold text-sm text-slate-900 whitespace-nowrap">
                      {inv.amount}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">{inv.method}</div>
                      <div className="text-[11px] text-slate-400">{inv.date}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Thành công
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setBillingToast(`Đang tải biên lai điện tử: ${inv.receiptUrl}`);
                          setTimeout(() => setBillingToast(null), 3000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white border border-blue-200/80 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">download</span>
                        <span>Tải biên lai</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL PHÓNG TO MÃ VIETQR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#2E37A4] to-[#3d47c2] text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                  Cổng thanh toán NAPAS 24/7
                </span>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Quét Mã VietQR Ngân Hàng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Đồng hồ đếm ngược 15 phút */}
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  timeLeft > 120
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : timeLeft > 0
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">
                    {timeLeft > 0 ? 'schedule' : 'error'}
                  </span>
                  <span>
                    {timeLeft > 0 ? 'Thời gian hiệu lực mã QR:' : 'Mã QR đã hết hiệu lực:'}
                  </span>
                </div>
                <span className="font-mono font-extrabold text-sm">
                  {formatCountdown(timeLeft)}
                </span>
              </div>

              {timeLeft > 0 ? (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <img
                    src={qrImageUrl}
                    alt="QR Modal"
                    className="w-52 h-52 mx-auto object-contain bg-white p-2 rounded-xl"
                  />
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-rose-300 text-center space-y-2">
                  <span className="material-symbols-outlined text-rose-500 text-3xl">
                    timer_off
                  </span>
                  <p className="text-xs text-rose-600 font-semibold">
                    Phiên quét mã 15 phút đã kết thúc. Vui lòng làm mới mã QR.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTimeLeft(15 * 60)}
                    className="px-4 py-1.5 bg-[#2E37A4] text-white rounded-xl text-xs font-bold hover:bg-[#222982] cursor-pointer"
                  >
                    Tạo mã QR mới
                  </button>
                </div>
              )}

              <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 truncate">{selectedOption.title}</div>
                <div className="font-extrabold font-mono text-base text-[#2E37A4]">
                  {selectedOption.amountFormatted}
                </div>
                <div className="text-slate-500">
                  Nội dung: <strong className="font-mono text-slate-800">{selectedOption.transferMemo}</strong>
                </div>
              </div>

              <button
                type="button"
                disabled={timeLeft === 0 || isVerifying}
                onClick={handleVerifyPayment}
                className="w-full py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? 'Đang kiểm tra...' : 'Xác nhận đã chuyển khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {billingToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="material-symbols-outlined text-[18px] text-emerald-400">verified</span>
          <span className="font-medium">{billingToast}</span>
          <button
            type="button"
            onClick={() => setBillingToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
            aria-label="Đóng thông báo"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
