'use client';

import React, { useState } from 'react';
import { FamilyNav } from '@/components/layout';

interface Invoice {
  id: string;
  orderCode: string;
  title: string;
  amount: string;
  date: string;
  method: string;
  status: 'paid' | 'pending';
  receiptUrl: string;
}

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    orderCode: 'FMD-PAY-88219-Q1',
    title: 'Gói Chăm Sóc Gia Đình Toàn Diện (Kỳ hạn 3 Tháng)',
    amount: '4.245.000đ',
    date: '01/01/2026 09:12',
    method: 'VietQR (MB Bank NAPAS 24/7)',
    status: 'paid',
    receiptUrl: 'Bien_Lai_FMD_INV_001.pdf',
  },
  {
    id: 'INV-2026-002',
    orderCode: 'FMD-PAY-88219-LAB',
    title: 'Gói Xét Nghiệm Sinh Hóa Máu Chuyên Sâu Tận Nhà (2 người)',
    amount: '850.000đ',
    date: '10/10/2026 11:30',
    method: 'VietQR (Vietcombank 24/7)',
    status: 'paid',
    receiptUrl: 'Bien_Lai_FMD_INV_002.pdf',
  },
];

export function FamilyBillingView() {
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(key);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleVerifyPayment = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      alert('Hệ thống đã nhận diện thanh toán thành công! Biên lai điện tử đã được phát hành vào hòm thư gia đình.');
      setShowQrModal(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* Sub-navigation */}
      <FamilyNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a]">
                Thanh Toán VietQR &amp; Lịch Sử Giao Dịch
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                NAPAS 24/7 Tự Động
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Thực hiện thanh toán phí gia hạn gói dịch vụ qua mã QR động ngân hàng và tải biên lai hóa đơn điện tử VAT.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Mở mã VietQR thanh toán</span>
          </button>
        </div>

        {/* Finance Snapshot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-xs text-[#475569] block">Tổng chi phí y tế đã quyết toán</span>
            <div className="text-2xl font-bold text-[#0f172a]">5.095.000đ</div>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Đã xuất đầy đủ 2 hóa đơn điện tử
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-xs text-[#475569] block">Gói chăm sóc tiếp theo</span>
            <div className="text-2xl font-bold text-[#2563eb]">31/12/2026</div>
            <p className="text-[11px] text-slate-400">Hạn gia hạn kỳ tiếp theo (Còn 65 ngày)</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
            <span className="text-xs text-[#475569] block">Trạng thái công nợ hiện tại</span>
            <div className="text-xl font-bold text-[#03864b] flex items-center gap-1">
              <span className="material-symbols-outlined text-[22px]">verified</span>
              0đ (Không có dư nợ)
            </div>
            <p className="text-[11px] text-slate-400">Mọi lượt khám được bảo lãnh hoàn toàn</p>
          </div>
        </div>

        {/* VietQR Showcase Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left QR Image */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 inline-block">
                {/* Simulated High-Res VietQR Code */}
                <div className="w-56 h-56 bg-slate-100 rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=00020101021238580010A000000727012600069704220112FMD882195303704540742450005802VN62190815FMD%20FAM882196304E1F2"
                    alt="VietQR FamiDoc Payment"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-[#2563eb]/30 pointer-events-none rounded-xl" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-[#0f172a] block">
                  Quét mã bằng ứng dụng Ngân hàng bất kỳ
                </span>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Hỗ trợ hơn 45 ngân hàng Việt Nam (Vietcombank, MB, Techcombank, BIDV, VPBank...) qua chuẩn Napas 24/7.
                </p>
              </div>
            </div>

            {/* Right Payment Details */}
            <div className="lg:col-span-7 space-y-5 text-xs sm:text-sm">
              <div>
                <span className="text-xs font-bold text-[#2563eb] uppercase tracking-wider block mb-1">
                  Thông tin thanh toán ngân hàng chính thức
                </span>
                <h3 className="text-lg font-bold text-[#0f172a]">
                  Công Ty Cổ Phần Chăm Sóc Y Tế Gia Đình FamiDoc Pro
                </h3>
              </div>

              {/* Bank Transfer Details Box */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                {/* Bank Name */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-[#475569]">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-[#0f172a]">Ngân hàng Quân Đội (MB Bank) - CN TP.HCM</span>
                </div>

                {/* Account Number */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-[#475569]">Số tài khoản thụ hưởng:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-[#2563eb]">8821 9006 8688</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('882190068688', 'acc')}
                      className="text-xs px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      {isCopied === 'acc' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-[#475569]">Số tiền thanh toán:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#0f172a]">4.245.000đ</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('4245000', 'amt')}
                      className="text-xs px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      {isCopied === 'amt' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                {/* Transfer Content */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#475569]">Nội dung chuyển khoản (Bắt buộc):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      FMD FAM88219
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('FMD FAM88219', 'memo')}
                      className="text-xs px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      {isCopied === 'memo' ? 'Đã chép ✓' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Verification Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang kiểm tra giao dịch qua Ngân hàng...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Tôi đã chuyển khoản thành công</span>
                    </>
                  )}
                </button>

                <span className="text-xs text-slate-400">
                  Hệ thống tự động kích hoạt gói trong vòng 60 giây sau khi nhận tiền.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History & Electronic Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2563eb]">receipt_long</span>
              Lịch Sử Giao Dịch &amp; Biên Lai Thu Tiền Điện Tử
            </h3>
            <span className="text-xs text-slate-400 font-medium">Hóa đơn điện tử theo chuẩn Tổng Cục Thuế</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#475569]">
                <tr>
                  <th className="p-3.5">Mã đơn hàng</th>
                  <th className="p-3.5">Nội dung thanh toán</th>
                  <th className="p-3.5">Số tiền</th>
                  <th className="p-3.5">Phương thức</th>
                  <th className="p-3.5">Thời gian</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Biên lai điện tử</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#0f172a]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#2563eb] whitespace-nowrap">
                      {inv.orderCode}
                    </td>
                    <td className="p-3.5 font-medium max-w-xs">{inv.title}</td>
                    <td className="p-3.5 font-bold whitespace-nowrap">{inv.amount}</td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{inv.method}</td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{inv.date}</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6ffed] text-[#03864b] border border-[#b7eb8f]">
                        Thành công
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => alert(`Đang tải biên lai VAT: ${inv.receiptUrl}`)}
                        className="inline-flex items-center gap-1 font-bold text-[#2563eb] hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
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

      {/* Floating QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-[#0f172a]">Mã VietQR Gia Hạn Gói Dịch Vụ</h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=00020101021238580010A000000727012600069704220112FMD882195303704540742450005802VN62190815FMD%20FAM882196304E1F2"
                alt="QR Modal"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <div className="text-xs space-y-1">
              <div className="font-bold text-base text-[#0f172a]">4.245.000đ</div>
              <div className="text-slate-400">Nội dung: <strong>FMD FAM88219</strong></div>
            </div>

            <button
              type="button"
              onClick={handleVerifyPayment}
              className="w-full py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Xác nhận đã chuyển khoản
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

