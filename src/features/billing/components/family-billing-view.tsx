'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useContractWorkflow, updateContractStep } from '@/lib/contract-workflow-storage';
import {
  contractsApi,
  type FamilyGateStatusDto,
  type VietQRPaymentRequestDto,
} from '@/lib/api/contracts.api';

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
  const router = useRouter();
  const workflow = useContractWorkflow();
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [selectedOptionId, setSelectedOptionId] = useState<string>(PAYMENT_OPTIONS[0].id);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [livePayment, setLivePayment] = useState<VietQRPaymentRequestDto | null>(null);
  const [gateStatus, setGateStatus] = useState<FamilyGateStatusDto | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadLiveBilling() {
      try {
        const gate = await contractsApi.getFamilyGateStatus();
        if (!active) return;
        setGateStatus(gate);
        const urlContractId =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('contractId')
            : null;
        const targetContractId =
          urlContractId ||
          (gate.pendingContract?.contractStatus === 'PENDING_PAYMENT'
            ? gate.pendingContract.id
            : null);
        if (targetContractId && !gate.hasActiveContract) {
          const payment = await contractsApi.createVietQRPayment(targetContractId);
          if (!active) return;
          setLivePayment(payment);
          setSelectedOptionId('contract-4p-live');
          setLiveError(null);
        }
      } catch (err) {
        if (active && err instanceof Error) {
          setLiveError(err.message);
        }
      }
    }
    void loadLiveBilling();
    return () => {
      active = false;
    };
  }, []);

  const activeOptions: PaymentOption[] = livePayment
    ? [
        {
          id: 'contract-4p-live',
          title: `Thanh toán kích hoạt Hợp đồng 4 bên (${gateStatus?.pendingContract?.contractNumber || livePayment.paymentCode})`,
          badge: livePayment.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán VietQR',
          description: `Mã thanh toán ${livePayment.paymentCode} • Đủ 4/4 chữ ký Documenso`,
          amountNumber: livePayment.amountVnd,
          amountFormatted: `${livePayment.amountVnd.toLocaleString('vi-VN')} đ`,
          transferMemo: livePayment.transferContent || livePayment.paymentCode,
        },
        ...PAYMENT_OPTIONS,
      ]
    : workflow?.step === 'PENDING_PAYMENT'
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
          ...PAYMENT_OPTIONS,
        ]
      : PAYMENT_OPTIONS;

  const selectedOption =
    activeOptions.find((item) => item.id === selectedOptionId) || activeOptions[0];

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

  const handleVerifyPayment = async () => {
    setIsVerifying(true);
    setLiveError(null);
    if (livePayment && selectedOption.id === 'contract-4p-live') {
      try {
        const latest = await contractsApi.getPaymentStatus(livePayment.id);
        setLivePayment(latest);
        const latestGate = await contractsApi.getFamilyGateStatus();
        setGateStatus(latestGate);
        if (latest.status === 'PAID' || latestGate.hasActiveContract) {
          setShowQrModal(false);
          toast.success(
            `Đã xác nhận thanh toán ${selectedOption.amountFormatted} thành công! Hợp đồng đã kích hoạt ACTIVE.`
          );
          router.refresh();
        } else {
          toast.info(
            `Chưa ghi nhận giao dịch cho mã ${latest.paymentCode}. Vui lòng chuyển khoản đúng nội dung "${latest.transferContent || latest.paymentCode}" rồi kiểm tra lại.`
          );
        }
      } catch (err) {
        setLiveError(
          err instanceof Error ? err.message : 'Không thể kiểm tra trạng thái thanh toán.'
        );
      } finally {
        setIsVerifying(false);
      }
      return;
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
      toast.success(
        `Đã xác nhận thanh toán ${selectedOption.amountFormatted} thành công! Hợp đồng đã kích hoạt ACTIVE.`
      );
    }, 1000);
  };

  const bankNameDisplay =
    livePayment && selectedOption.id === 'contract-4p-live'
      ? livePayment.expectedGateway
      : 'MB Bank · CN TP.HCM';
  const accountNumberDisplay =
    livePayment && selectedOption.id === 'contract-4p-live'
      ? livePayment.expectedAccountNumber
      : '882190068688';

  const qrImageUrl =
    livePayment && selectedOption.id === 'contract-4p-live' && livePayment.qrUrl
      ? livePayment.qrUrl
      : `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
          `VIETQR|MBBANK|882190068688|${selectedOption.amountNumber}|${selectedOption.transferMemo}`
        )}`;

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900 font-sans antialiased">
      <main className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* 1. HEADER CANVAS THOÁNG ĐÃNG ĐỒNG BỘ VỚI /family */}
        <header className="space-y-4">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-primary transition-colors"
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
                <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-semibold tabular-nums text-primary bg-primary/10 border-primary/20">
                  Hộ #FAM-88219
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>NAPAS 24/7 Tự động</span>
                </Badge>
                <Badge variant="secondary" className="gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60 hidden sm:inline-flex">
                  <span className="material-symbols-outlined text-[14px] text-slate-500">receipt</span>
                  <span>Hóa đơn điện tử VAT có chữ ký số</span>
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                Thanh Toán VietQR &amp; Biên Lai Điện Tử
              </h1>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                Quét mã VietQR chuẩn liên ngân hàng để gia hạn hợp đồng chăm sóc, bổ sung lượt khám tại nhà hoặc tra cứu và tải hóa đơn VAT điện tử của gia đình.
              </p>
            </div>

            {/* Cụm nút hành động tinh gọn & phân cấp chuẩn */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                type="button"
                onClick={handleOpenQrModal}
                className="min-h-11 rounded-xl text-sm font-semibold gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>Mở mã VietQR</span>
              </Button>

              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-xl text-sm font-medium gap-2"
              >
                <Link href="/family/subscription">
                  <span className="material-symbols-outlined text-[19px] text-primary">verified_user</span>
                  <span>Hợp đồng 4 bên</span>
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* 2. DẢI TÓM TẮT TRẠNG THÁI GÓI & CÔNG NỢ */}
        <section
          aria-label="Tóm tắt hợp đồng và công nợ"
          className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm"
        >
          <div className="flex items-center gap-3 text-slate-700">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            </span>
            <span>
              Gói hiện tại:{' '}
              <strong className="text-slate-900 font-semibold">Gói Gia Đình Toàn Diện VIP (12 Tháng)</strong> ·
              Hiệu lực đến: <strong className="text-slate-900 font-semibold tabular-nums">31/12/2026</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 text-xs px-3.5 py-1.5 rounded-full border border-emerald-200/80 self-start sm:self-auto">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Công nợ hiện tại: 0 đ (Đã thanh toán đủ)</span>
          </div>
        </section>

        {/* 3. 3 THẺ TÓM TẮT TÀI CHÍNH HỘ GIA ĐÌNH */}
        <section
          aria-label="Tổng quan tài chính"
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6"
        >
          {/* Thẻ 1: Tổng đã thanh toán */}
          <Card className="bg-white p-6 rounded-2xl border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-row items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng đã thanh toán (2026)
              </span>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
                10.450.000 đ
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                <span>Đã phát hành {invoices.length} biên lai VAT</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
          </Card>

          {/* Thẻ 2: Kỳ gia hạn tiếp theo */}
          <Card className="bg-white p-6 rounded-2xl border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-row items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Kỳ gia hạn tiếp theo
              </span>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-primary">
                31/12/2026
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                <span className="material-symbols-outlined text-[15px] text-primary">
                  schedule
                </span>
                <span>Còn 65 ngày hiệu lực</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <span className="material-symbols-outlined text-[24px]">event_repeat</span>
            </div>
          </Card>

          {/* Thẻ 3: Dư nợ phát sinh */}
          <Card className="bg-white p-6 rounded-2xl border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-row items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Dư nợ phát sinh
              </span>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-800">
                0 đ
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>Bảo lãnh 100% quyền lợi gói</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <span className="material-symbols-outlined text-[24px]">shield</span>
            </div>
          </Card>
        </section>

        {/* 4. KHU VỰC THANH TOÁN NHANH VIETQR & CHUYỂN KHOẢN NGÂN HÀNG */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs p-6 sm:p-7 space-y-6">
          {/* Header khu vực VietQR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  Thanh Toán Gia Hạn Sớm Hoặc Mua Thêm Lượt Khám
                </h2>
                <p className="text-xs text-slate-500">
                  Chọn mục cần thanh toán bên dưới; mã VietQR và nội dung đối soát sẽ tự động cập nhật
                </p>
              </div>
            </div>

            <Badge variant="outline" className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border-primary/20">
              Hỗ trợ 45+ Ngân hàng Việt Nam
            </Badge>
          </div>

          {/* Bước 1: Chọn dịch vụ muốn thanh toán */}
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
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/15 shadow-xs'
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
                    <div className="font-bold tabular-nums text-base sm:text-lg text-primary">
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

              <Button
                type="button"
                variant="outline"
                onClick={handleOpenQrModal}
                className="w-full rounded-xl text-primary text-xs font-semibold gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                <span>Phóng to mã QR</span>
              </Button>
            </div>

            {/* Cột phải: Thông tin chuyển khoản thụ hưởng */}
            <div className="lg:col-span-8 bg-slate-50/50 rounded-2xl border border-slate-200/70 p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                      Tài khoản thụ hưởng chính thức
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      CTCP Chăm Sóc Y Tế Gia Đình FamiDoc
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 self-start sm:self-auto shadow-2xs">
                    {bankNameDisplay}
                  </span>
                </div>

                {liveError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {liveError}
                  </div>
                )}

                {gateStatus?.hasActiveContract && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
                    <span className="font-semibold">Hợp đồng đã kích hoạt ACTIVE! Quyền Quản lý thành viên đã mở khóa.</span>
                    <Link
                      href="/family/members"
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 whitespace-nowrap"
                    >
                      Vào Quản lý thành viên →
                    </Link>
                  </div>
                )}

                {/* 3 Hàng thông tin chuyển khoản có nút sao chép */}
                <div className="space-y-2.5 text-xs">
                  {/* Số tài khoản */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Số tài khoản ({bankNameDisplay})</span>
                      <strong className="font-bold tabular-nums text-base text-primary">
                        {accountNumberDisplay}
                      </strong>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(accountNumberDisplay, 'acc')}
                      className="rounded-lg text-xs font-semibold shrink-0"
                    >
                      {isCopied === 'acc' ? 'Đã chép ✓' : 'Sao chép'}
                    </Button>
                  </div>

                  {/* Số tiền */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Số tiền thanh toán</span>
                      <strong className="font-bold tabular-nums text-base text-slate-900">
                        {selectedOption.amountFormatted}
                      </strong>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(String(selectedOption.amountNumber), 'amt')}
                      className="rounded-lg text-xs font-semibold shrink-0"
                    >
                      {isCopied === 'amt' ? 'Đã chép ✓' : 'Sao chép'}
                    </Button>
                  </div>

                  {/* Nội dung chuyển khoản */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between gap-2 shadow-2xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Nội dung chuyển khoản (Tự động đối soát)
                      </span>
                      <strong className="font-bold tabular-nums text-sm text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80 inline-block mt-0.5">
                        {selectedOption.transferMemo}
                      </strong>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedOption.transferMemo, 'memo')}
                      className="rounded-lg text-xs font-semibold shrink-0"
                    >
                      {isCopied === 'memo' ? 'Đã chép ✓' : 'Sao chép'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Nút xác nhận đã chuyển khoản */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={isVerifying}
                  className="min-h-11 w-full sm:w-auto px-6 rounded-xl text-xs sm:text-sm font-semibold gap-2"
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
                </Button>

                <span className="text-xs text-slate-500">
                  Hệ thống tự động cấp biên lai điện tử trong 60 giây.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. LỊCH SỬ GIAO DỊCH & BIÊN LAI ĐIỆN TỬ */}
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden">
          <div className="p-5 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">history</span>
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  Lịch Sử Giao Dịch &amp; Biên Lai Thu Tiền ({invoices.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Hóa đơn giá trị gia tăng điện tử có chữ ký số theo chuẩn Tổng Cục Thuế
                </p>
              </div>
            </div>
          </div>

          {/* Giao diện Mobile: Danh sách Thẻ Biên Lai */}
          <div className="md:hidden divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[11px] font-bold tabular-nums text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border-primary/20">
                      {inv.orderCode}
                    </Badge>
                    <h3 className="font-bold text-sm text-slate-900 mt-1.5">{inv.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{inv.subtitle}</p>
                  </div>

                  <Badge variant="outline" className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200/80 shrink-0">
                    Thành công
                  </Badge>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold tabular-nums text-sm text-slate-900">
                      {inv.amount}
                    </div>
                    <div className="text-[11px] tabular-nums text-slate-400">{inv.date}</div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info(`Đang tải biên lai điện tử: ${inv.receiptUrl}`)}
                    className="min-h-9 rounded-xl bg-primary/10 text-primary border-primary/20 font-semibold text-xs gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Tải PDF</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Giao diện Desktop: Bảng chuẩn lâm sàng thoáng & đẹp */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px] hover:bg-slate-50/80">
                  <TableHead className="py-3.5 px-6 text-slate-500">Mã giao dịch</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Nội dung thanh toán</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Số tiền</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Phương thức &amp; Thời gian</TableHead>
                  <TableHead className="py-3.5 px-6 text-slate-500">Trạng thái</TableHead>
                  <TableHead className="py-3.5 px-6 text-right text-slate-500">Biên lai PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-slate-800">
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="py-4 px-6 tabular-nums font-bold text-primary whitespace-nowrap">
                      {inv.orderCode}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{inv.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{inv.subtitle}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6 tabular-nums font-bold text-sm text-slate-900 whitespace-nowrap">
                      {inv.amount}
                    </TableCell>
                    <TableCell className="py-4 px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">{inv.method}</div>
                      <div className="text-[11px] tabular-nums text-slate-400">{inv.date}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Thành công
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`Đang tải biên lai điện tử: ${inv.receiptUrl}`)}
                        className="min-h-9 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-primary/20 font-semibold text-xs gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px]">download</span>
                        <span>Tải biên lai</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>

      {/* MODAL PHÓNG TO MÃ VIETQR */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden border-slate-200/80 text-center gap-0">
          <DialogHeader className="bg-primary text-primary-foreground p-5 text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-100 block">
              Cổng thanh toán NAPAS 24/7
            </span>
            <DialogTitle className="font-bold text-base text-white">
              Quét Mã VietQR Ngân Hàng
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
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
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setTimeLeft(15 * 60)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Tạo mã QR mới
                </Button>
              </div>
            )}

            <div className="text-xs space-y-1 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
              <div className="text-slate-500 truncate">{selectedOption.title}</div>
              <div className="font-bold tabular-nums text-base text-primary">
                {selectedOption.amountFormatted}
              </div>
              <div className="text-slate-500">
                Nội dung: <strong className="font-bold tabular-nums text-slate-800">{selectedOption.transferMemo}</strong>
              </div>
            </div>

            <Button
              type="button"
              disabled={timeLeft === 0 || isVerifying}
              onClick={handleVerifyPayment}
              className="min-h-11 w-full rounded-xl text-xs font-semibold"
            >
              {isVerifying ? 'Đang kiểm tra...' : 'Xác nhận đã chuyển khoản'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
