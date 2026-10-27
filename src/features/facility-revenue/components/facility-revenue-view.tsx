'use client';

import React, { useState } from 'react';
import { FacilityNav } from '@/components/layout';

interface RevenueCycle {
  id: string;
  monthYear: string;
  totalEncounters: number;
  grossAmount: number;
  facilityShareRate: number; // e.g. 70%
  facilityShareAmount: number;
  escrowStatus: 'paid' | 'pending_signature' | 'processing';
  reconcileDate: string;
}

const REVENUE_CYCLES: RevenueCycle[] = [
  {
    id: 'REV-2026-10-YDUOC',
    monthYear: 'Tháng 10/2026 (Kỳ 1 & 2)',
    totalEncounters: 1420,
    grossAmount: 489714000,
    facilityShareRate: 70,
    facilityShareAmount: 342800000,
    escrowStatus: 'pending_signature',
    reconcileDate: '25/10/2026',
  },
  {
    id: 'REV-2026-09-YDUOC',
    monthYear: 'Tháng 09/2026 (Trọn kỳ)',
    totalEncounters: 1280,
    grossAmount: 441000000,
    facilityShareRate: 70,
    facilityShareAmount: 308700000,
    escrowStatus: 'paid',
    reconcileDate: '30/09/2026',
  },
  {
    id: 'REV-2026-08-YDUOC',
    monthYear: 'Tháng 08/2026 (Trọn kỳ)',
    totalEncounters: 1150,
    grossAmount: 395000000,
    facilityShareRate: 70,
    facilityShareAmount: 276500000,
    escrowStatus: 'paid',
    reconcileDate: '31/08/2026',
  },
];

export function FacilityRevenueView() {
  const [cycles, setCycles] = useState<RevenueCycle[]>(REVENUE_CYCLES);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signingCycle, setSigningCycle] = useState<RevenueCycle | null>(null);
  const [digitalCertificatePin, setDigitalCertificatePin] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleOpenSignModal = (cycle: RevenueCycle) => {
    setSigningCycle(cycle);
    setIsSignModalOpen(true);
    setIsSuccess(false);
    setDigitalCertificatePin('');
  };

  const handleExecuteSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingCycle || !digitalCertificatePin) return;

    setCycles((prev) =>
      prev.map((c) =>
        c.id === signingCycle.id ? { ...c, escrowStatus: 'paid' as const } : c
      )
    );
    setIsSuccess(true);
    setTimeout(() => {
      setIsSignModalOpen(false);
      setIsSuccess(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <FacilityNav />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Đối soát Doanh thu B2B &amp; Giải ngân Escrow
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Phân bổ doanh thu theo tỷ lệ cam kết 70% Cơ sở y tế - 30% Nền tảng với biên bản ký số bảo mật
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Hợp đồng đối tác B2B-2026: 70% / 30%</span>
          </div>
        </div>

        {/* Revenue KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tổng doanh số dịch vụ</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">489.714.000 đ</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">1.420 ca khám ghi nhận</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs bg-linear-to-br from-white to-blue-50/30">
            <span className="text-xs font-bold text-blue-600 uppercase">Doanh thu B2B thực nhận (70%)</span>
            <div className="text-2xl font-bold text-blue-700 mt-2">342.800.000 đ</div>
            <div className="text-xs text-blue-600/80 mt-1 font-semibold">Chuyển trực tiếp vào tài khoản BV</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Đã giải ngân từ Escrow</span>
            <div className="text-2xl font-bold text-emerald-600 mt-2">280.000.000 đ</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Kỳ 1 ngày 15/10/2026</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase">Chờ đối soát ký số</span>
            <div className="text-2xl font-bold text-amber-600 mt-2">62.800.000 đ</div>
            <div className="text-xs text-amber-700 mt-1 font-semibold">Cần ký biên bản trước 30/10</div>
          </div>
        </div>

        {/* B2B Contract Details & Escrow Explanation */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cơ chế Phân bổ &amp; Quỹ Ký quỹ Đảm bảo (Escrow)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Bảo vệ quyền lợi tài chính minh bạch giữa Bệnh viện và Hộ gia đình</p>
            </div>
            <div className="text-xs font-mono font-medium bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700">
              Tài khoản nhận: BIDV - 119000288819 (BV ĐH Y DƯỢC TP.HCM)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-bold text-slate-900 block mb-1">1. Thu tiền tạm giữ</span>
              Khi gia đình thanh toán gói qua VietQR, tiền được giữ trong Quỹ Escrow độc lập để đảm bảo SLA khám bệnh.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-bold text-slate-900 block mb-1">2. Tự động đối soát</span>
              Mỗi ca khám hoàn tất và phiếu SOAP được ký mã hóa, hệ thống tự động ghi nhận tỷ lệ 70% vào doanh thu cơ sở.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="font-bold text-slate-900 block mb-1">3. Giải ngân định kỳ</span>
              Giải ngân vào ngày 15 và 30 hàng tháng sau khi người đại diện tài chính bệnh viện ký số biên bản đối soát.
            </div>
          </div>
        </div>

        {/* Cycles Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Lịch sử Kỳ Đối soát Doanh thu B2B</h2>
            <button
              onClick={() => alert('Xuất bảng tổng hợp Excel B2B')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Xuất Excel (.xlsx)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Kỳ đối soát &amp; Mã</th>
                  <th className="py-3.5 px-4 text-center">Ca khám</th>
                  <th className="py-3.5 px-4 text-right">Tổng doanh số</th>
                  <th className="py-3.5 px-4 text-right">Tỷ lệ cơ sở</th>
                  <th className="py-3.5 px-4 text-right">Thực nhận (70%)</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái Escrow</th>
                  <th className="py-3.5 px-4 text-right">Biên bản đối soát</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.monthYear}</div>
                      <div className="font-mono text-[11px] text-slate-400">{c.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {c.totalEncounters}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {formatVND(c.grossAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                      {c.facilityShareRate}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-blue-600">
                      {formatVND(c.facilityShareAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {c.escrowStatus === 'paid' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã giải ngân
                        </span>
                      )}
                      {c.escrowStatus === 'pending_signature' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ ký số biên bản
                        </span>
                      )}
                      {c.escrowStatus === 'processing' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Đang xử lý ngân hàng
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {c.escrowStatus === 'pending_signature' ? (
                        <button
                          onClick={() => handleOpenSignModal(c)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 ml-auto"
                        >
                          <span className="material-symbols-outlined text-[15px]">draw</span>
                          <span>Ký số B2B</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Tải biên bản đã ký số cho kỳ ${c.id}`)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
                          <span>Tải PDF</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Ký số biên bản đối soát B2B */}
        {isSignModalOpen && signingCycle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">verified_user</span>
                  <h3 className="font-bold text-slate-900 text-base">Ký số Biên bản Đối soát B2B</h3>
                </div>
                <button
                  onClick={() => setIsSignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {isSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <span className="material-symbols-outlined text-[48px] text-emerald-500">check_circle</span>
                  <h4 className="font-bold text-slate-900 text-base">Ký số Thành công!</h4>
                  <p className="text-xs text-slate-500">
                    Lệnh giải ngân số tiền {formatVND(signingCycle.facilityShareAmount)} đã được chuyển đến Quỹ Escrow BIDV.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleExecuteSign} className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600">
                    <div>
                      Kỳ đối soát: <span className="font-bold text-slate-800">{signingCycle.monthYear}</span>
                    </div>
                    <div>
                      Số tiền thực nhận (70%):{' '}
                      <span className="font-bold text-blue-600">
                        {formatVND(signingCycle.facilityShareAmount)}
                      </span>
                    </div>
                    <div>
                      Chứng thư số: <span className="font-mono text-slate-700">CA-BV-YDUOC-TOKEN-01</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nhập mã PIN Chữ ký số USB Token / SmartCA <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Nhập mã PIN bảo mật..."
                      value={digitalCertificatePin}
                      onChange={(e) => setDigitalCertificatePin(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Chữ ký số hợp lệ theo Luật Giao dịch điện tử số 20/2023/QH15.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsSignModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs"
                    >
                      Xác nhận Ký số
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

