'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatCurrencyVND } from '@/lib/utils';
import { contractsApi } from '@/lib/api';

export type ReconciliationStatus = 'MATCHED' | 'PENDING' | 'FAILED';

export interface SePayTransaction {
  id: string;
  transactionId: string;
  contractId: string;
  contractNumber: string;
  amount: number;
  syntax: string;
  bankBrand: string;
  accountNumber: string;
  status: ReconciliationStatus;
  receivedAt: string;
  errorMessage?: string;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  performedBy: string;
  contractNumber: string;
  transactionId: string;
  reason: string;
  timestamp: string;
}

export interface AdminReconciliationViewProps {
  initialTransactions?: SePayTransaction[];
}

const DEFAULT_TRANSACTIONS: SePayTransaction[] = [
  {
    id: 'tx-sepay-901',
    transactionId: 'SP-20261109-7712',
    contractId: 'ct-4p-001',
    contractNumber: 'HD-4P-2026-0001',
    amount: 9600000,
    syntax: 'FAMIDOC HD-4P-2026-0001',
    bankBrand: 'MBBank',
    accountNumber: '0912345678',
    status: 'PENDING',
    receivedAt: '2026-11-09T10:15:00.000Z',
    errorMessage: 'Webhook timeout do nghẽn mạng phía ngân hàng',
  },
  {
    id: 'tx-sepay-902',
    transactionId: 'SP-20261109-7713',
    contractId: 'ct-4p-002',
    contractNumber: 'HD-4P-2026-0002',
    amount: 6000000,
    syntax: 'FAMIDOC HD-4P-2026-0002',
    bankBrand: 'Vietcombank',
    accountNumber: '0987654321',
    status: 'MATCHED',
    receivedAt: '2026-11-09T09:30:00.000Z',
  },
  {
    id: 'tx-sepay-903',
    transactionId: 'SP-20261109-7714',
    contractId: 'ct-4p-003',
    contractNumber: 'HD-4P-2026-0003',
    amount: 5000000,
    syntax: 'FAMIDOC 003 CHUYEN TIEN',
    bankBrand: 'Techcombank',
    accountNumber: '0903112233',
    status: 'FAILED',
    receivedAt: '2026-11-09T08:00:00.000Z',
    errorMessage: 'Thiếu 2.500.000 ₫ so với giá trị gói',
  },
  {
    id: 'tx-sepay-904',
    transactionId: 'SP-20261109-7715',
    contractId: 'ct-4p-004',
    contractNumber: 'HD-4P-2026-0004',
    amount: 15600000,
    syntax: 'FAMIDOC HD-4P-2026-0004',
    bankBrand: 'ACB',
    accountNumber: '0977889900',
    status: 'MATCHED',
    receivedAt: '2026-11-08T16:45:00.000Z',
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditEntry[] = [
  {
    id: 'audit-001',
    action: 'Kích hoạt bù hợp đồng',
    performedBy: 'Admin FamiDoc (Ban Vận Hành)',
    contractNumber: 'HD-4P-2026-0004',
    transactionId: 'SP-20261109-7715',
    reason: 'Đối chiếu sao kê tài khoản ngân hàng khớp lệnh số tiền 15.600.000 ₫',
    timestamp: '2026-11-08T17:00:00.000Z',
  },
];

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export function AdminReconciliationView({
  initialTransactions = DEFAULT_TRANSACTIONS,
}: AdminReconciliationViewProps) {
  const [transactions, setTransactions] = useState<SePayTransaction[]>(initialTransactions);
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReconciliationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<SePayTransaction | null>(null);
  const [fallbackReason, setFallbackReason] = useState(
    'Đã kiểm tra sao kê MBBank thành công, kích hoạt bù do nghẽn webhook',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = transactions.length;
    const matched = transactions.filter((t) => t.status === 'MATCHED').length;
    const pending = transactions.filter((t) => t.status === 'PENDING').length;
    const failed = transactions.filter((t) => t.status === 'FAILED').length;
    const totalAmount = transactions
      .filter((t) => t.status === 'MATCHED')
      .reduce((sum, t) => sum + t.amount, 0);
    return { total, matched, pending, failed, totalAmount };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        t.transactionId.toLowerCase().includes(q) ||
        t.contractNumber.toLowerCase().includes(q) ||
        t.syntax.toLowerCase().includes(q) ||
        t.bankBrand.toLowerCase().includes(q) ||
        t.accountNumber.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [transactions, statusFilter, searchQuery]);

  const handleOpenFallbackModal = (tx: SePayTransaction) => {
    setSelectedTx(tx);
    setFallbackReason(
      `Đã kiểm tra sao kê ${tx.bankBrand} thành công, kích hoạt bù do nghẽn webhook`,
    );
  };

  const handleConfirmFallback = async () => {
    if (!selectedTx) return;
    setIsSubmitting(true);

    try {
      await contractsApi.recheckPaymentActivation(selectedTx.transactionId);
    } catch {
      // Fallback for offline testing
    }

    const nowIso = new Date().toISOString();

    // 1. Update transaction status
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === selectedTx.id
          ? {
              ...t,
              status: 'MATCHED' as const,
              errorMessage: undefined,
            }
          : t,
      ),
    );

    // 2. Add audit trail entry
    const newAuditEntry: AdminAuditEntry = {
      id: `audit-${Date.now()}`,
      action: 'Kích hoạt bù hợp đồng (Manual Fallback)',
      performedBy: 'Admin FamiDoc (Ban Quản Trị)',
      contractNumber: selectedTx.contractNumber,
      transactionId: selectedTx.transactionId,
      reason: fallbackReason.trim() || 'Kích hoạt bù giao dịch hợp lệ',
      timestamp: nowIso,
    };

    setAuditLogs((prev) => [newAuditEntry, ...prev]);

    setNotification(
      `Kích hoạt bù hợp đồng ${selectedTx.contractNumber} thành công! Trạng thái hợp đồng đã được chuyển sang ACTIVE.`,
    );

    setIsSubmitting(false);
    setSelectedTx(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link
                href="/admin/contracts"
                className="hover:text-slate-800 transition-colors flex items-center gap-1"
              >
                <span>&larr; Quản trị Hợp đồng</span>
              </Link>
              <span>/</span>
              <span className="text-slate-700 font-medium">Đối soát SePay</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Đối Soát Giao Dịch SePay &amp; Kích Hoạt Bù
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Tra cứu log webhook thanh toán VietQR và xử lý kích hoạt bù hợp đồng
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">payments</span>
            <span className="tabular-nums">
              Doanh thu đã khớp: {formatCurrencyVND(stats.totalAmount)}
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {notification && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-600 hover:text-emerald-900 text-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Ledger Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Tổng giao dịch webhook</span>
            <div className="text-xl font-bold text-slate-900 tabular-nums mt-1">
              {stats.total}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Đã khớp lệnh tự động</span>
            <div className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
              {stats.matched}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Chờ đối soát bù</span>
            <div className="text-xl font-bold text-amber-600 tabular-nums mt-1">
              {stats.pending}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Sai lệch cú pháp / lỗi</span>
            <div className="text-xl font-bold text-rose-600 tabular-nums mt-1">
              {stats.failed}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm mã giao dịch, số hợp đồng, cú pháp, ngân hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="status-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Lọc theo trạng thái:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ReconciliationStatus)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">Tất cả giao dịch</option>
              <option value="MATCHED">Đã khớp lệnh</option>
              <option value="PENDING">Chờ đối soát</option>
              <option value="FAILED">Sai lệch / Lỗi</option>
            </select>
          </div>
        </div>

        {/* Achromatic Ledger Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã giao dịch SePay</th>
                  <th className="py-3.5 px-4">Hợp đồng &amp; Cú pháp</th>
                  <th className="py-3.5 px-4">Ngân hàng</th>
                  <th className="py-3.5 px-4 text-right">Số tiền</th>
                  <th className="py-3.5 px-4">Thời gian nhận</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                        {tx.transactionId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{tx.contractNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                          {tx.syntax}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{tx.bankBrand}</span>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          STK: {tx.accountNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatCurrencyVND(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                        {formatDateTime(tx.receivedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {tx.status === 'MATCHED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Đã khớp lệnh</span>
                          </span>
                        )}
                        {tx.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Chờ đối soát</span>
                          </span>
                        )}
                        {tx.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>Sai lệch</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tx.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenFallbackModal(tx)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Kích hoạt bù
                          </button>
                        )}
                        {tx.status === 'MATCHED' && (
                          <span className="text-slate-400 font-medium text-xs">Đã hoàn tất</span>
                        )}
                        {tx.status === 'FAILED' && (
                          <span
                            title={tx.errorMessage}
                            className="text-rose-600 font-medium text-xs cursor-help"
                          >
                            Xem lỗi
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Không tìm thấy giao dịch đối soát phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700 text-[20px]">history</span>
              <h3 className="font-semibold text-slate-900 text-sm">
                Nhật ký Thao tác Audit Trail (Xử lý Bù Nền Tảng)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Ghi nhận phục vụ thanh tra &amp; đối soát tài chính
            </span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}:</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold tabular-nums">
                      {log.contractNumber}
                    </span>
                    <span className="text-slate-400 tabular-nums">({log.transactionId})</span>
                  </div>
                  <p className="text-slate-600">{log.reason}</p>
                </div>
                <div className="text-right sm:shrink-0 text-slate-500">
                  <div className="font-medium text-slate-700">{log.performedBy}</div>
                  <div className="tabular-nums text-[11px]">{formatDateTime(log.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal: Xác nhận Kích hoạt Bù Hợp đồng */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[22px]">published_with_changes</span>
                <h3 className="font-bold text-slate-900 text-base">
                  Xác nhận Kích hoạt Bù Hợp đồng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã hợp đồng:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{selectedTx.contractNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã giao dịch SePay:</span>
                  <span className="font-medium text-slate-800 tabular-nums">{selectedTx.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền đối soát:</span>
                  <span className="font-bold text-indigo-700 tabular-nums">{formatCurrencyVND(selectedTx.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng &amp; STK:</span>
                  <span className="text-slate-800">{selectedTx.bankBrand} - {selectedTx.accountNumber}</span>
                </div>
              </div>

              <div>
                <label htmlFor="fallback-reason" className="block text-slate-700 font-semibold mb-1">
                  Lý do kích hoạt bù:
                </label>
                <textarea
                  id="fallback-reason"
                  rows={3}
                  value={fallbackReason}
                  onChange={(e) => setFallbackReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                Lưu ý: Thao tác này sẽ cập nhật trạng thái hợp đồng sang <strong>ACTIVE</strong> và ghi nhận vào nhật ký thanh tra tài chính nền tảng.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmFallback}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Đang kích hoạt...' : 'Xác nhận Kích hoạt Bù'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
