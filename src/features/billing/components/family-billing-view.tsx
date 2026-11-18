'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFamilySubscriptionGateState } from '@/components/layout/family-subscription-gate';
import { BookingPaymentStep } from '@/features/booking';

export function FamilyBillingView() {
  const search = useSearchParams();
  const { gateStatus, gateError, isLoadingGate, refreshGateStatus } = useFamilySubscriptionGateState();
  const pending = gateStatus?.pendingContract;
  const contractId = search.get('contractId')?.trim() ||
    (pending?.contractStatus === 'PENDING_PAYMENT' ? pending.id : undefined);
  const addendumId = search.get('addendumId')?.trim() || undefined;

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
    </div>
  );
}
