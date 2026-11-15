'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CONTRACT_STATUS_LABELS,
  DocumensoSigningEmbed,
  type FourPartyContract,
} from '@/features/four-party-contract';
import { contractsApi } from '@/lib/api';

type AdminStatusFilter = 'ALL' | 'READY_FOR_ADMIN' | 'WAITING_FAMILY' | 'PENDING_PAYMENT' | 'ACTIVE';

function countSignatures(contract: FourPartyContract): number {
  const sigs = contract.signatures ?? {};
  return [sigs.family, sigs.facility, sigs.doctor, sigs.platform].filter(Boolean).length;
}

export function AdminContractsView() {
  const [contracts, setContracts] = useState<FourPartyContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<AdminStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<FourPartyContract | null>(null);
  const [notification, setNotification] = useState('');

  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const items = await contractsApi.getMedicalContracts({ limit: 50 });
      setContracts(items);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách hợp đồng từ máy chủ.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const filteredContracts = contracts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.contractNumber.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.familyRepresentativeName.toLowerCase().includes(q) ||
      (c.facilityName || '').toLowerCase().includes(q) ||
      (c.doctorName || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const familySigned = Boolean(c.signatures?.family);
    const adminSigned = Boolean(c.signatures?.platform);

    if (filterStatus === 'WAITING_FAMILY') {
      return c.status === 'DRAFT' && !familySigned;
    }
    if (filterStatus === 'READY_FOR_ADMIN') {
      return familySigned && !adminSigned && c.status !== 'ACTIVE' && c.status !== 'CANCELLED';
    }
    if (filterStatus === 'PENDING_PAYMENT') {
      return c.status === 'PENDING_PAYMENT';
    }
    if (filterStatus === 'ACTIVE') {
      return c.status === 'ACTIVE';
    }
    return true;
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0052cc] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[17px]">gavel</span>
              <span>Ban Quản Trị Hệ Thống • Phê Duyệt Pháp Lý &amp; Documenso 4 Bên</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Quản lý Hợp đồng &amp; Ký Duyệt Nền tảng (Bên D)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi hợp đồng 4 bên thật từ hệ thống: Bên A ký trước trên Documenso, sau đó Admin (Bên D), CSYT (Bên B) và Bác sĩ (Bên C) ký song song.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadContracts()}
              disabled={isLoading}
              className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] text-slate-500 ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold tabular-nums">
              <span className="material-symbols-outlined text-[16px] text-amber-400">verified</span>
              <span>Tổng cộng: {contracts.length} hợp đồng</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
            <span>{notification}</span>
          </div>
        )}

        {loadError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-3"
          >
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void loadContracts()}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo mã hợp đồng, đại diện hộ gia đình, cơ sở y tế, bác sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0052cc]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['ALL', 'Tất cả'],
                ['READY_FOR_ADMIN', 'Chờ Admin ký (Bên D)'],
                ['WAITING_FAMILY', 'Chờ Bên A ký'],
                ['PENDING_PAYMENT', 'Chờ thanh toán'],
                ['ACTIVE', 'Đang hiệu lực'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterStatus === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã Hợp đồng &amp; Gói</th>
                  <th className="py-3.5 px-4">Hộ gia đình (Bên A)</th>
                  <th className="py-3.5 px-4">CSYT (Bên B) &amp; Bác sĩ (Bên C)</th>
                  <th className="py-3.5 px-4 text-right">Giá trị</th>
                  <th className="py-3.5 px-4 text-center">Tiến độ Documenso</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                      Đang tải danh sách hợp đồng từ hệ thống...
                    </td>
                  </tr>
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                      Không có hợp đồng nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c) => {
                    const sigCount = countSignatures(c);
                    const familySigned = Boolean(c.signatures?.family);
                    const adminSigned = Boolean(c.signatures?.platform);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{c.packageName}</div>
                          <div className="tabular-nums text-[11px] text-slate-500 mt-0.5">
                            {c.contractNumber} • {c.membersCount ?? 1} thành viên
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">
                            {c.familyRepresentativeName}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {c.familyRepresentativePhone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          <div className="font-medium">{c.facilityName || '—'}</div>
                          <div className="text-[11px] text-slate-500">
                            {c.doctorName || 'Chưa phân công BS'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#0052cc] tabular-nums">
                          {formatPrice(c.packagePrice)}
                        </td>
                        <td className="py-3.5 px-4 text-center space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : familySigned
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {c.status === 'ACTIVE'
                              ? 'Đang hiệu lực'
                              : c.status === 'PENDING_PAYMENT'
                              ? 'Chờ thanh toán VietQR'
                              : !familySigned
                              ? 'Chờ Bên A ký trước'
                              : adminSigned
                              ? 'Admin đã ký — chờ bên khác'
                              : CONTRACT_STATUS_LABELS[c.status] || 'Bên A đã ký'}
                          </span>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {sigCount}/4 chữ ký Documenso
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/contracts/${c.id}/review`}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors"
                            >
                              Thẩm định 4 Bên
                            </Link>
                            <button
                              type="button"
                              onClick={() => setSelectedContract(c)}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                                familySigned && !adminSigned
                                  ? 'bg-[#0052cc] hover:bg-[#003da6] text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {familySigned && !adminSigned
                                ? 'Ký trên Documenso'
                                : 'Chi tiết & Documenso'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Ký trực tiếp trên Documenso & Chi tiết 4 bên */}
        {selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0052cc] text-[22px]">
                    description
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Ký Hợp Đồng 4 Bên Trên Documenso — Bên D (Nền tảng)
                    </h3>
                    <p className="text-xs text-slate-500 tabular-nums">
                      Mã HĐ: {selectedContract.contractNumber} • Chủ hộ: {selectedContract.familyRepresentativeName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className={`p-2 rounded-lg border ${selectedContract.signatures?.family ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  <strong>Bên A (Gia đình)</strong>
                  <div>{selectedContract.signatures?.family ? 'Đã ký ✓' : 'Chưa ký'}</div>
                </div>
                <div className={`p-2 rounded-lg border ${selectedContract.signatures?.facility ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <strong>Bên B (CSYT)</strong>
                  <div>{selectedContract.signatures?.facility ? 'Đã ký ✓' : 'Chờ ký'}</div>
                </div>
                <div className={`p-2 rounded-lg border ${selectedContract.signatures?.doctor ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <strong>Bên C (Bác sĩ)</strong>
                  <div>{selectedContract.signatures?.doctor ? 'Đã ký ✓' : 'Chờ ký'}</div>
                </div>
                <div className={`p-2 rounded-lg border ${selectedContract.signatures?.platform ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
                  <strong>Bên D (Admin)</strong>
                  <div>{selectedContract.signatures?.platform ? 'Đã ký ✓' : 'Chờ ký'}</div>
                </div>
              </div>

              <DocumensoSigningEmbed
                contractId={selectedContract.id}
                onSyncCompleted={(res) => {
                  setNotification(
                    `Đã đồng bộ chữ ký Documenso cho ${selectedContract.contractNumber} (${res.signedRoles.length}/4 bên).`
                  );
                  void loadContracts();
                }}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
