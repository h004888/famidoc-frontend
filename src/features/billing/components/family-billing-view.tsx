'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFamilySubscriptionGateState } from '@/components/layout/family-subscription-gate';
import { BookingPaymentStep } from '@/features/booking';
import { contractsApi, type MedicalContractListItem } from '@/lib/api/contracts.api';

export function FamilyBillingView() {
  const search = useSearchParams();
  const { gateStatus, gateError, isLoadingGate, refreshGateStatus } = useFamilySubscriptionGateState();
  const pending = gateStatus?.pendingContract;
  const contractId = search.get('contractId')?.trim() ||
    (pending?.contractStatus === 'PENDING_PAYMENT' ? pending.id : undefined);
  const addendumId = search.get('addendumId')?.trim() || undefined;
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);

  useEffect(() => {
    contractsApi
      .getMedicalContracts()
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        setReceipts(
          list.filter((c: any) => {
            const st = c.contractStatus ?? c.status;
            return st === 'ACTIVE' || st === 'COMPLETED';
          })
        );
      })
      .catch(() => setReceipts([]))
      .finally(() => setLoadingReceipts(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link href="/family" className="text-sm font-semibold text-primary">
        ← Bảng sức khỏe gia đình
      </Link>
      {contractId ? (
        <BookingPaymentStep
          key={`${contractId}:${addendumId ?? ''}`}
          contractId={contractId}
          addendumId={addendumId}
        />
      ) : (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-bold">Thanh toán VietQR</h1>
          {gateError ? (
            <>
              <p role="alert" className="text-sm text-destructive">{gateError}</p>
              <button className="text-sm font-semibold text-primary" onClick={() => void refreshGateStatus()}>
                Thử lại
              </button>
            </>
          ) : isLoadingGate || !gateStatus ? (
            <p role="status" className="text-sm text-slate-600">Đang kiểm tra hợp đồng chờ thanh toán…</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">Không có hợp đồng nào đang chờ thanh toán.</p>
              <Link href="/family/subscription" className="text-sm font-semibold text-primary">Xem gói và hợp đồng</Link>
            </>
          )}
        </section>
      )}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Lịch sử thanh toán &amp; Biên lai</h2>
        {loadingReceipts ? (
          <p role="status" className="text-sm text-slate-500">Đang tải lịch sử biên lai…</p>
        ) : receipts.length === 0 ? (
          <p className="text-sm text-slate-600">Chưa có biên lai thanh toán nào được ghi nhận.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {receipts.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.packageName || 'Gói chăm sóc gia đình'}</p>
                  <p className="text-xs text-slate-500">HĐ #{item.contractNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-slate-900">
                    {(item.totalAmountVnd ?? item.packagePrice ?? 0).toLocaleString('vi-VN')} đ
                  </p>
                  <span className="text-xs font-medium text-emerald-700">Đã thanh toán</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
