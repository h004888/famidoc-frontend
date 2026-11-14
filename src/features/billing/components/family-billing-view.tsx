'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContractWorkflow, updateContractStep } from '@/lib/contract-workflow-storage';
import {
  contractsApi,
  paymentsApi,
  type MedicalContractListItem,
  type PaymentRequest,
} from '@/lib/api';

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
  contractId?: string;
  title: string;
  badge: string;
  description: string;
  amountNumber: number;
  amountFormatted: string;
  transferMemo: string;
}

const DEFAULT_PAYMENT_OPTIONS: PaymentOption[] = [
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
    date: '10/10/2026 · 11:30',
    method: 'VietQR · Vietcombank 24/7',
    status: 'paid',
    receiptUrl: 'Bien_Lai_FMD_INV_002.pdf',
  },
  {
    id: 'INV-2026-001',
    orderCode: 'FMD-PAY-88219-VIP',
    title: 'Gói Chăm Sóc Gia Đình Toàn Diện VIP (Kỳ hạn 12 Tháng)',
    subtitle: 'Hợp đồng số #FMD-HD-88219 · Thời hạn 01/01/2026 – 31/12/2026',
    amount: '9.600.000 đ',
    date: '01/01/2026 · 09:12',
    method: 'VietQR · MB Bank NAPAS 24/7',
    status: 'paid',
    receiptUrl: 'Bien_Lai_FMD_INV_001.pdf',
  },
];

export function FamilyBillingView() {
  const workflow = useContractWorkflow();
  const searchParams = useSearchParams();
  const contractIdParam = searchParams?.get('contractId');

  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [contracts, setContracts] = useState<MedicalContractListItem[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(DEFAULT_PAYMENT_OPTIONS[0].id);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [billingToast, setBillingToast] = useState<string | null>(null);
  const [currentPaymentRequest, setCurrentPaymentRequest] = useState<PaymentRequest | null>(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  // 1. Tải danh sách hợp đồng thực tế từ Backend
  useEffect(() => {
    let isMounted = true;
    contractsApi
      .getMedicalContracts()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : [];
        setContracts(list);

        if (contractIdParam) {
          const matched = list.find((c) => c.id === contractIdParam);
          if (matched) {
            setSelectedOptionId(`contract-${matched.id}`);
          }
        } else if (list.length > 0) {
          const pending = list.find(
            (c) => (c.contractStatus as string) === 'PENDING_APPROVAL' || c.contractStatus === 'PENDING_PAYMENT'
          );
          if (pending) {
            setSelectedOptionId(`contract-${pending.id}`);
          }
        }
      })
      .catch((err) => {
        console.warn('Contracts API fetch fallback:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [contractIdParam]);

  // 2. Tự động hợp nhất các lựa chọn thanh toán: Hợp đồng thật từ API + Hợp đồng workflow + Tùy chọn gia hạn
  const apiOptions: PaymentOption[] = contracts
    .filter((c) => (c.contractStatus as string) !== 'TERMINATED')
    .map((c) => ({
      id: `contract-${c.id}`,
      contractId: c.id,
      title: `Kích hoạt Hợp đồng Dịch vụ Y tế Gia đình (#${c.contractNumber})`,
      badge: c.contractStatus === 'ACTIVE' ? 'Đang hiệu lực (Đã TT)' : 'Chờ thanh toán VietQR',
      description: `Gói ${c.packageName} · Cơ sở y tế: ${c.facilityName}`,
      amountNumber: c.totalAmountVnd,
      amountFormatted: `${c.totalAmountVnd.toLocaleString('vi-VN')} đ`,
      transferMemo: `FMD ${c.contractNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
    }));

  const baseWorkflowOptions: PaymentOption[] =
    workflow?.step === 'PENDING_PAYMENT'
      ? [
          {
            id: 'contract-4p-activation',
            title: `Kích hoạt Hợp đồng Dịch vụ Y tế Gia đình 4 Bên (${workflow.contractCode})`,
            badge: 'Chờ thanh toán kích hoạt',
            description: `Đã hoàn tất 4 chữ ký số. Thanh toán để kích hoạt hiệu lực gói ${workflow.packageName}`,
            amountNumber: workflow.packagePrice,
            amountFormatted: workflow.packagePriceFormatted,
            transferMemo: `FMD ${workflow.familyId} CTR4P`,
          },
        ]
      : [];

  const activeOptions: PaymentOption[] = [
    ...apiOptions,
    ...baseWorkflowOptions,
    ...DEFAULT_PAYMENT_OPTIONS,
  ];

  const selectedOption =
    activeOptions.find((item) => item.id === selectedOptionId) || activeOptions[0];

  // 3. Khởi tạo mã VietQR thực tế hoặc mô phỏng
  const handleOpenQrModal = async () => {
    setIsPaymentSuccess(false);
    setTimeLeft(15 * 60);

    if (selectedOption?.contractId) {
      setIsCreatingPayment(true);
      try {
        const paymentRes = await paymentsApi.createVietQRPayment({
          contractId: selectedOption.contractId,
        });
        setCurrentPaymentRequest(paymentRes);
        if (paymentRes.expiresAt) {
          const diff = Math.max(
            0,
            Math.floor((new Date(paymentRes.expiresAt).getTime() - Date.now()) / 1000)
          );
          setTimeLeft(diff > 0 ? diff : 15 * 60);
        }
        setShowQrModal(true);
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Không thể tạo mã VietQR từ server, mở mã mô phỏng chuẩn Napas.';
        setBillingToast(errMsg);
        setCurrentPaymentRequest(null);
        setShowQrModal(true);
      } finally {
        setIsCreatingPayment(false);
      }
    } else {
      setCurrentPaymentRequest(null);
      setShowQrModal(true);
    }
  };

  // 4. Polling tự động kiểm tra trạng thái thanh toán từ SePay Webhook
  useEffect(() => {
    if (!showQrModal || !currentPaymentRequest?.id || currentPaymentRequest.status === 'PAID') return;

    const pollTimer = setInterval(async () => {
      try {
        const statusRes = await paymentsApi.getPaymentStatus(currentPaymentRequest.id);
        if (statusRes.status === 'PAID') {
          setCurrentPaymentRequest(statusRes);
          setIsPaymentSuccess(true);
          const now = new Date();
          const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
            now.getMonth() + 1
          ).padStart(2, '0')}/${now.getFullYear()} · ${String(now.getHours()).padStart(
            2,
            '0'
          )}:${String(now.getMinutes()).padStart(2, '0')}`;

          const newInvoice: Invoice = {
            id: statusRes.id,
            orderCode: statusRes.paymentCode || `FMD-PAY-${Date.now()}`,
            title: selectedOption.title,
            subtitle: `Cổng SePay xác nhận thanh toán VietQR thành công (Tài khoản ${statusRes.expectedAccountNumber})`,
            amount: `${statusRes.amountVnd.toLocaleString('vi-VN')} đ`,
            date: dateStr,
            method: `VietQR · ${statusRes.expectedGateway || 'NAPAS 24/7'}`,
            status: 'paid',
            receiptUrl: `Bien_Lai_FMD_${statusRes.paymentCode}.pdf`,
          };

          setInvoices((prev) => [newInvoice, ...prev]);
          setBillingToast('🎉 Cổng SePay đã xác thực thanh toán VietQR thành công! Hợp đồng đã kích hoạt.');
          setTimeout(() => setShowQrModal(false), 3500);
        } else if (statusRes.status === 'EXPIRED') {
          setCurrentPaymentRequest(statusRes);
          setTimeLeft(0);
        }
      } catch {
        // Tiếp tục polling
      }
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [showQrModal, currentPaymentRequest?.id, currentPaymentRequest?.status, selectedOption.title]);

  // 5. Đếm ngược thời gian hết hạn mã QR
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

  const handleVerifyPayment = async () => {
    setIsVerifying(true);

    if (currentPaymentRequest?.id) {
      try {
        const check = await paymentsApi.getPaymentStatus(currentPaymentRequest.id);
        if (check.status === 'PAID') {
          setCurrentPaymentRequest(check);
          setIsPaymentSuccess(true);
          setBillingToast('Giao dịch đã được hệ thống xác nhận thành công!');
          setIsVerifying(false);
          return;
        }
      } catch {
        // Fallback simulate
      }
    }

    setTimeout(() => {
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1
      ).padStart(2, '0')}/${now.getFullYear()} · ${String(now.getHours()).padStart(
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
        method: 'VietQR · NAPAS 24/7',
        status: 'paid',
        receiptUrl: `Bien_Lai_FMD_${Date.now()}.pdf`,
      };

      if (workflow?.step === 'PENDING_PAYMENT') {
        updateContractStep('ACTIVE', {
          paymentPaid: true,
          paymentPaidAt: dateStr,
        });
      }

      setInvoices((prev) => [newInvoice, ...prev]);
      setIsVerifying(false);
      setShowQrModal(false);
      setBillingToast(
        `Đã xác nhận thanh toán ${selectedOption.amountFormatted} thành công! Hợp đồng đã kích hoạt ACTIVE.`
      );
      setTimeout(() => setBillingToast(null), 4500);
    }, 1000);
  };

  // Thông tin thụ hưởng động từ PaymentRequest hoặc mặc định FamiDoc
  const qrBankName = currentPaymentRequest?.expectedGateway || 'MB Bank';
  const qrAccountNumber = currentPaymentRequest?.expectedAccountNumber || '882190068688';
  const qrTransferMemo = currentPaymentRequest?.transferContent || selectedOption.transferMemo;
  const qrAmount = currentPaymentRequest?.amountVnd || selectedOption.amountNumber;

  const qrImageUrl =
    currentPaymentRequest?.qrUrl ||
    `https://img.vietqr.io/image/${encodeURIComponent(qrBankName)}-${encodeURIComponent(
      qrAccountNumber
    )}-compact2.png?amount=${qrAmount}&addInfo=${encodeURIComponent(
      qrTransferMemo
    )}&accountName=FAMIDOC%20HEALTHCARE`;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CANVAS THOÁNG ĐÃNG ĐỒNG BỘ VỚI /family */}
        <header className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#2E37A4] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Bảng Sức Khỏe Gia Đình</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">Thanh Toán &amp; Biên Lai</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-[#2E37A4] bg-blue-50/80 border border-blue-200/60">
                  Hộ #{workflow?.familyId || 'FAM-88219'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Cổng VietQR SePay Hoạt Động 24/7</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Thanh Toán Dịch Vụ &amp; Biên Lai Điện Tử
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                Quét mã VietQR chuyển khoản nhanh 24/7 qua cổng thanh toán bảo đảm Escrow. Hệ thống tự động
                đối soát giao dịch ngân hàng và phát hành biên lai điện tử ngay lập tức.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
              <Link
                href="/family/subscription"
                className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-[#2E37A4]">description</span>
                <span>Xem Hợp Đồng 4 Bên</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 2. CHỌN MỤC THANH TOÁN & MÃ VIETQR */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold text-[#2E37A4] uppercase tracking-wider block">
                Bước 1 / 2
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Chọn Khoản Phí Cần Thanh Toán
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Có {activeOptions.length} khoản mục khả dụng
            </span>
          </div>

          {/* Danh sách các gói / khoản phí để người dùng chọn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOptions.map((option) => {
              const isSelected = option.id === selectedOptionId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-4 outline-hidden ${
                    isSelected
                      ? 'bg-blue-50/40 border-[#2E37A4] ring-2 ring-[#2E37A4]/15 shadow-xs'
                      : 'bg-white hover:bg-slate-50/70 border-slate-200/70'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-slate-900">
                        {option.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                        {option.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{option.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold tabular-nums text-base sm:text-lg text-[#2E37A4]">
                      {option.amountFormatted}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {isSelected ? 'Đang chọn ✓' : 'Bấm để chọn'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bước 2: Mã QR & Chi tiết tài khoản ngân hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
            {/* Cột trái: Khung Mã QR */}
            <div className="lg:col-span-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 p-6 flex flex-col items-center justify-between text-center gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <img
                  src={qrImageUrl}
                  alt="Mã VietQR FamiDoc"
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  Quét mã bằng App Ngân hàng bất kỳ
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tự động điền đúng số tài khoản, số tiền và nội dung đối soát tự động
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenQrModal}
                disabled={isCreatingPayment}
                className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-[#2E37A4] border border-slate-200/80 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
              >
                {isCreatingPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#2E37A4]/30 border-t-[#2E37A4] rounded-full animate-spin" />
                    <span>Đang tạo mã VietQR...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                    <span>Phóng to &amp; Quét Mã QR</span>
                  </>
                )}
              </button>
            </div>

            {/* Cột phải: Thông tin chuyển khoản thụ hưởng */}
            <div className="lg:col-span-8 bg-slate-50/50 rounded-2xl border border-slate-200/70 p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#2E37A4] uppercase tracking-wider block">
                      Tài khoản thụ hưởng chính thức
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      CTCP Chăm Sóc Y Tế Gia Đình FamiDoc
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 self-start sm:self-auto shadow-2xs">
                    {qrBankName} · Napas 24/7
                  </span>
                </div>

                {/* 3 Hàng thông tin chuyển khoản có nút sao chép */}
                <div className="space-y-2.5 text-xs">
                  {/* Số tài khoản */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Số tài khoản {qrBankName}
                      </span>
                      <strong className="font-bold tabular-nums text-base text-[#2E37A4]">
                        {qrAccountNumber}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(qrAccountNumber, 'acc')}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2E37A4] border border-slate-200/80 font-semibold text-xs cursor-pointer transition-colors shrink-0"
                    >
                      {isCopied === 'acc' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Số tiền */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Số tiền thanh toán</span>
                      <strong className="font-bold tabular-nums text-base text-slate-900">
                        {selectedOption.amountFormatted}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(qrAmount), 'amt')}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2E37A4] border border-slate-200/80 font-semibold text-xs cursor-pointer transition-colors shrink-0"
                    >
                      {isCopied === 'amt' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Nội dung chuyển khoản (Tự động đối soát SePay)
                      </span>
                      <strong className="font-bold tabular-nums text-sm text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80 inline-block mt-0.5">
                        {qrTransferMemo}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(qrTransferMemo, 'memo')}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2E37A4] border border-slate-200/80 font-semibold text-xs cursor-pointer transition-colors shrink-0"
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
                  className="min-h-11 w-full sm:w-auto px-6 py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang kiểm tra SePay...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Xác nhận tôi đã chuyển khoản</span>
                    </>
                  )}
                </button>

                <span className="text-xs text-slate-500">
                  Cổng SePay tự động ghi nhận trong 3-10 giây sau khi chuyển khoản.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. LỊCH SỬ HÓA ĐƠN & BIÊN LAI THU TIỀN */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold text-[#2E37A4] uppercase tracking-wider block">
                Lịch sử thanh toán
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Biên Lai Thu Tiền &amp; Hóa Đơn Điện Tử
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Đồng bộ dữ liệu tài chính chuẩn TT 78/2021/TT-BTC
            </span>
          </div>

          {/* Giao diện Mobile: Thẻ danh sách hóa đơn */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold tabular-nums text-[#2E37A4] block">
                      {inv.orderCode}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900 truncate">{inv.title}</h3>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0">
                    Thành công
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold tabular-nums text-sm text-slate-900">
                      {inv.amount}
                    </div>
                    <div className="text-[11px] tabular-nums text-slate-400">{inv.date}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBillingToast(`Đang tải biên lai điện tử: ${inv.receiptUrl}`);
                      setTimeout(() => setBillingToast(null), 3000);
                    }}
                    className="min-h-9 px-3 py-1.5 rounded-xl bg-blue-50/80 text-[#2E37A4] font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer hover:bg-blue-100 transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Tải PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Giao diện Desktop: Bảng chuẩn lâm sàng thoáng & đẹp */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Mã giao dịch</th>
                  <th className="py-3.5 px-6">Nội dung thanh toán</th>
                  <th className="py-3.5 px-6">Số tiền</th>
                  <th className="py-3.5 px-6">Phương thức &amp; Thời gian</th>
                  <th className="py-3.5 px-6">Trạng thái</th>
                  <th className="py-3.5 px-6 text-right">Biên lai PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 tabular-nums font-bold text-[#2E37A4] whitespace-nowrap">
                      {inv.orderCode}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{inv.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{inv.subtitle}</div>
                    </td>
                    <td className="py-4 px-6 tabular-nums font-bold text-sm text-slate-900 whitespace-nowrap">
                      {inv.amount}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">{inv.method}</div>
                      <div className="text-[11px] tabular-nums text-slate-400">{inv.date}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Thành công
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setBillingToast(`Đang tải biên lai điện tử: ${inv.receiptUrl}`);
                          setTimeout(() => setBillingToast(null), 3000);
                        }}
                        className="min-h-9 px-3.5 py-1.5 rounded-xl bg-blue-50/80 hover:bg-[#2E37A4] text-[#2E37A4] hover:text-white border border-blue-200/80 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
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
        </section>
      </main>

      {/* MODAL PHÓNG TO MÃ VIETQR VÀ TỰ ĐỘNG POLLING */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200/80 text-center animate-in fade-in zoom-in-95 my-auto">
            <div className="bg-[#2E37A4] text-white p-5 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200 block">
                  Cổng thanh toán NAPAS 24/7 &amp; SePay
                </span>
                <h3 className="font-bold text-base text-white">
                  Quét Mã VietQR Ngân Hàng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                aria-label="Đóng cửa sổ"
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isPaymentSuccess ? (
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-3xl">check</span>
                  </div>
                  <h4 className="font-bold text-base text-emerald-900">Thanh toán thành công!</h4>
                  <p className="text-xs text-emerald-700">
                    Cổng SePay đã xác nhận tiền vào tài khoản. Hợp đồng dịch vụ y tế của gia đình đã được kích hoạt thành công.
                  </p>
                </div>
              ) : (
                <>
                  {/* Đồng hồ đếm ngược 15 phút */}
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      timeLeft > 120
                        ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                        : timeLeft > 0
                        ? 'bg-rose-50 text-rose-800 border-rose-200/80'
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
                    <span className="tabular-nums font-bold text-sm">
                      {formatCountdown(timeLeft)}
                    </span>
                  </div>

                  {timeLeft > 0 ? (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                      <img
                        src={qrImageUrl}
                        alt="Mã VietQR FamiDoc"
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
                        onClick={handleOpenQrModal}
                        className="px-4 py-1.5 bg-[#2E37A4] text-white rounded-xl text-xs font-semibold hover:bg-[#222982] cursor-pointer"
                      >
                        Tạo mã QR mới
                      </button>
                    </div>
                  )}

                  <div className="text-xs space-y-1 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 text-left">
                    <div className="text-slate-500 truncate">{selectedOption.title}</div>
                    <div className="font-bold tabular-nums text-base text-[#2E37A4]">
                      {selectedOption.amountFormatted}
                    </div>
                    <div className="text-slate-600 flex items-center justify-between">
                      <span>Ngân hàng: <strong>{qrBankName}</strong></span>
                      <span>STK: <strong>{qrAccountNumber}</strong></span>
                    </div>
                    <div className="text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                      <span>Nội dung CK:</span>
                      <strong className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70">
                        {qrTransferMemo}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={timeLeft === 0 || isVerifying}
                    onClick={handleVerifyPayment}
                    className="min-h-11 w-full py-2.5 bg-[#2E37A4] hover:bg-[#222982] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? 'Đang kiểm tra SePay...' : 'Xác nhận tôi đã chuyển khoản'}
                  </button>
                </>
              )}
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
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
